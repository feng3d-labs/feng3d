import { Service } from '@deepseek-ai/cordis';
import { WebSocketServer } from 'ws';

/**
 * 桥接的 **WebSocket 通道**（#273 第二阶段，#272 的 P1）。
 *
 * ## 它解决什么
 *
 * HTTP 通道（`bridge/relay.mjs`）靠**长轮询**：页面每 100ms 问一次"有没有活儿"，
 * 调用方挂一个最多 20s 的 GET 等结果。能用，但有两个代价：
 *
 * - 页面的**空转请求**（每秒 10 次，与"有没有事"无关）；
 * - 服务端**无法主动说话**——后续宿主服务（文件变化、项目状态、插件装载、长任务进度）
 *   都需要"服务端推"，轮询做不到。
 *
 * WebSocket 把这两条一次解决：有活儿**推**给页面，结果**推**给调用方。
 *
 * ## 与 HTTP 的关系：**共用同一份命令层**
 *
 * 两条通道都走 `relay.bridge`（`call` / `takePending` / `submitResult` / `waitForResult`）——
 * 通道换了、"怎么运输"变了，但"待执行 / 结果 / 等待者"这套语义**只有一份**。
 * 两条通道**并存**：现有 15 个 `scripts/editor-*.mjs` 用 HTTP，零改动照跑。
 *
 * ## 消息协议（JSON 文本帧）
 *
 * | 方向 | 消息 | 含义 |
 * |---|---|---|
 * | 页面 → 服务端 | `{type:'hello', clientId}` | 页面自报身份（收推送的前提） |
 * | 调用方 → 服务端 | `{type:'call', reqId, method, params, target?}` | 发起一次调用 |
 * | 页面 → 服务端 | `{type:'pending'}` | 主动拉一次待办（兼容"推送丢了"的情况） |
 * | 页面 → 服务端 | `{type:'result', id, ok, result?, error?, stack?}` | 回传结果 |
 * | 任意 → 服务端 | `{type:'ping'}` | 探活 |
 * | 服务端 → 页面 | `{type:'task', task}` | **推送**待执行任务 |
 * | 服务端 → 调用方 | `{type:'result', reqId, ok, result?, error?}` | 调用结果 |
 * | 服务端 → 任意 | `{type:'pong', clients, pending}` | 探活应答 |
 * | 服务端 → 任意 | `{type:'error', message}` | 协议错误（不断连接） |
 */
export class BridgeSocket extends Service
{
    /** 命令层（来自 `createBridgeRelay` 的 `bridge`） */
    bridge;

    /** 挂载路径（缺省 `<前缀>/ws`） */
    path;

    /** WebSocket 服务端（`noServer`：不自己占端口，挂在宿主的 http server 上） */
    server;

    /**
     * 已连接的 socket：`ws` → `{ clientId, isPage }`。
     *
     * 用 map 而不是 Set：推送要按 `clientId` 过滤（定向投递要能落到指定页面）。
     */
    sockets;

    /** 订阅退订函数（`ctx.effect` 收走时调用） */
    unsubscribe;

    /**
     * @param {import('@deepseek-ai/cordis').Context} ctx 所属 context
     * @param {{ relay: { prefix: string, bridge: object }, path?: string }} config 配置
     */
    constructor(ctx, config)
    {
        super(ctx, 'bridgeSocket');

        this.relay = config.relay;
        this.bridge = config.relay.bridge;
        this.path = config.path ?? `${config.relay.prefix}/ws`;
        this.server = null;
        this.sockets = new Map();
        this.unsubscribe = null;
        this.unsubscribeClientProvider = null;
    }

    /**
     * 挂到 HTTP 服务器上（**同一端口**：不额外开端口，也就没有跨端口配置与 CORS 问题）。
     *
     * @param {import('node:http').Server} httpServer 宿主的 http server
     * @returns {string} 实际的挂载路径
     */
    attach(httpServer)
    {
        if (this.server) return this.path;

        const server = new WebSocketServer({ noServer: true });

        httpServer.on('upgrade', (req, socket, head) =>
        {
            const url = new URL(req.url ?? '/', 'http://127.0.0.1');

            if (url.pathname !== this.path)
            {
                // 不是本通道的 upgrade：断开，别把这个 socket 挂着不放
                socket.destroy();

                return;
            }

            server.handleUpgrade(req, socket, head, (ws) => server.emit('connection', ws, req));
        });

        server.on('connection', (ws) => this.accept(ws));

        this.server = server;
        // 有活儿就推给页面；fiber 卸载时连同退订一起收走
        this.unsubscribe = this.bridge.subscribe((task) => this.pushTask(task));
        // 让 `/ping` 也能看到 WS 页面：调用方（CLI / MCP / e2e）靠它判断"有没有页面能干活"，
        // 漏掉 WS 页面会让它们误判"没人接"
        this.unsubscribeClientProvider = this.bridge.addClientProvider(() => this.activePages());
        this.ctx.effect(() => () => this.stop());

        return this.path;
    }

    /**
     * 接受一条连接。
     *
     * @param {import('ws').WebSocket} ws 连接
     */
    accept(ws)
    {
        this.sockets.set(ws, { clientId: 'default', isPage: false });

        ws.on('message', (raw) => this.onMessage(ws, raw));
        ws.on('close', () => this.sockets.delete(ws));
        ws.on('error', () => this.sockets.delete(ws));

        this.send(ws, { type: 'hello-ack', path: this.path });
    }

    /**
     * 处理一条消息（坏消息只回错误，**不断连接**——一条坏帧不该让页面掉线）。
     *
     * @param {import('ws').WebSocket} ws 连接
     * @param {Buffer|string} raw 原始帧
     */
    onMessage(ws, raw)
    {
        let message;

        try
        {
            message = JSON.parse(raw.toString());
        }
        catch
        {
            this.send(ws, { type: 'error', message: '不是合法 JSON' });

            return;
        }

        const info = this.sockets.get(ws);

        if (!info) return;

        switch (message?.type)
        {
            case 'hello':
                // 页面自报身份：之后新任务会**推送**给它（调用方不必自报）
                info.clientId = typeof message.clientId === 'string' && message.clientId ? message.clientId : 'default';
                info.isPage = message.isPage !== false;
                this.send(ws, { type: 'hello-ack', path: this.path, clientId: info.clientId });

                // 连上之前积压的任务一并交给它——"先有调用、后有页面"这条在 HTTP 上由
                // `/pending` 兜着，换成 WS 通道也不能丢
                if (info.isPage)
                {
                    const tasks = this.bridge.takePending(info.clientId);

                    if (tasks.length > 0) this.send(ws, { type: 'tasks', tasks });
                }
                break;

            case 'call':
                void this.handleCall(ws, message);
                break;

            case 'pending':
                this.send(ws, { type: 'tasks', tasks: this.bridge.takePending(info.clientId) });
                break;

            case 'result':
                if (!message.id) this.send(ws, { type: 'error', message: '缺少 id' });
                else
                {
                    this.bridge.submitResult(message.id, {
                        ok: message.ok !== false,
                        result: message.result,
                        error: message.error,
                        stack: message.stack,
                    });
                }
                break;

            case 'ping':
                this.send(ws, { type: 'pong', clients: this.bridge.activeClients(), pending: this.bridge.pendingCount });
                break;

            default:
                this.send(ws, { type: 'error', message: `未知消息类型 ${String(message?.type)}` });
        }
    }

    /**
     * 处理一次调用：投递 → 等结果 → **推**回调用方（不再有长轮询）。
     *
     * @param {import('ws').WebSocket} ws 调用方连接
     * @param {{ reqId?: string, method: string, params?: object, target?: string }} message 调用消息
     * @returns {Promise<void>} 处理完成
     */
    async handleCall(ws, message)
    {
        if (!message.method)
        {
            this.send(ws, { type: 'error', message: '缺少 method', reqId: message.reqId });

            return;
        }

        const id = this.bridge.call(message.method, message.params, message.target);

        // 立刻把任务推给在线的页面（若还没有页面，它会在连上时收到 hello 之后的推送）
        const payload = await this.bridge.waitForResult(id);

        this.send(ws, { type: 'result', reqId: message.reqId, id, ...payload });
    }

    /**
     * 把新任务推给在线的页面（按 `target` 定向过滤）。
     *
     * **推送即派发**：推给某一个页面之后就把它从待执行里**取走**（`claim`）——否则页面
     * 通过 HTTP 轮询会再拿到同一个任务，同一个方法被跑两遍（写操作尤其致命）。
     * 没有在线页面时任务留在待执行队列里，等页面连上时由 `hello` 分支推给它。
     *
     * @param {{ id: string, method: string, target?: string }} task 任务
     */
    pushTask(task)
    {
        for (const [ws, info] of this.sockets)
        {
            if (!info.isPage) continue;
            if (task.target && task.target !== info.clientId) continue;

            if (this.bridge.claim(task.id)) this.send(ws, { type: 'task', task });

            return;
        }
    }

    /**
     * 发一条消息（连接已关就静默跳过；发送失败只记录）。
     *
     * @param {import('ws').WebSocket} ws 连接
     * @param {object} message 消息
     */
    send(ws, message)
    {
        if (ws.readyState !== ws.OPEN) return;

        try
        {
            ws.send(JSON.stringify(message));
        }
        catch (error)
        {
            console.error(`[feng3d-editor] WebSocket 发送失败：${error.message}`);
        }
    }

    /**
     * 在线页面列表（供 `/ping` 用：WS 页面的"在线"= 连接还开着，`idleMs` 恒为 0）。
     *
     * @returns {Array<{ clientId: string, idleMs: number, polls: number, transport: string }>} 在线页面
     */
    activePages()
    {
        const pages = [];

        for (const info of this.sockets.values())
        {
            if (info.isPage) pages.push({ clientId: info.clientId, idleMs: 0, polls: 0, transport: 'websocket' });
        }

        return pages;
    }

    /**
     * 停掉通道（fiber 卸载时调用）。
     */
    stop()
    {
        if (this.unsubscribe)
        {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        if (this.unsubscribeClientProvider)
        {
            this.unsubscribeClientProvider();
            this.unsubscribeClientProvider = null;
        }

        for (const ws of this.sockets.keys()) ws.close();

        this.sockets.clear();
        this.server?.close();
        this.server = null;
    }
}
