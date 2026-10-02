import { Service } from '@deepseek-ai/cordis';
import { WebSocketServer } from 'ws';

/**
 * 桥接的 **WebSocket 通道**（#273 第二/三阶段，#272 的 P1）。
 *
 * ## 文件里有两层
 *
 * | 层 | 用途 | 谁用 |
 * |---|---|---|
 * | `createBridgeSocket()` | **纯实现**：不依赖 cordis，返回 `{ attach, stop }` | dev 的 vite 插件（那里没有 cordis context） |
 * | `BridgeSocket`（`Service`） | cordis 包装：把生命周期交给 fiber | 宿主（`bin/serve.mjs`） |
 *
 * 这样拆是为了**让 dev 与生产走同一份实现**——`bridge/vitePlugin.mjs` 的 HTTP 中继当年正是
 * 这么抽出来的（`relay.mjs`），WS 通道没有理由例外：两条通道的语义一旦各写一份，
 * "dev 与生产一致"很快就成了空话。
 *
 * ## 它解决什么
 *
 * HTTP 通道靠**长轮询**：页面每 100ms 问一次"有没有活儿"，调用方挂一个最多 20s 的 GET 等结果。
 * WebSocket 把这两条一次解决：有活儿**推**给页面，结果**推**给调用方（不再有轮询与长轮询）。
 *
 * ## 与 HTTP 的关系：**共用同一份命令层**
 *
 * 两条通道都走 `relay.bridge`（`call` / `takePending` / `claim` / `submitResult` / `waitForResult`）。
 * 两条通道**并存**：15 个 `scripts/editor-*.mjs` 用 HTTP，零改动照跑。
 *
 * ## 消息协议（JSON 文本帧）
 *
 * | 方向 | 消息 | 含义 |
 * |---|---|---|
 * | 页面 → 服务端 | `{type:'hello', clientId}` | 页面自报身份（收推送的前提；回带积压任务） |
 * | 调用方 → 服务端 | `{type:'call', reqId, method, params, target?}` | 发起一次调用 |
 * | 页面 → 服务端 | `{type:'pending'}` | 主动拉一次待办（补推送可能丢的情况） |
 * | 页面 → 服务端 | `{type:'result', id, ok, result?, error?, stack?}` | 回传结果 |
 * | 任意 → 服务端 | `{type:'ping'}` | 探活 |
 * | 服务端 → 页面 | `{type:'task', task}` | **推送**待执行任务 |
 * | 服务端 → 调用方 | `{type:'result', reqId, ok, result?, error?}` | 调用结果 |
 * | 服务端 → 任意 | `{type:'pong', clients, pending}` | 探活应答 |
 * | 服务端 → 任意 | `{type:'error', message}` | 协议错误（**不断连接**） |
 *
 * @param {{ relay: { prefix: string, bridge: object }, path?: string }} options 配置
 * @returns {object} 通道实现
 */
export function createBridgeSocket(options)
{
    const bridge = options.relay.bridge;
    const path = options.path ?? `${options.relay.prefix}/ws`;

    /** WebSocket 服务端（`noServer`：不自己占端口，挂在现有 http server 上） */
    let server = null;
    let url = null;
    /** 已连接的 socket：`ws` → `{ clientId, isPage }` */
    const sockets = new Map();
    let unsubscribe = null;
    let unsubscribeClientProvider = null;

    /**
     * 发一条消息（连接已关就静默跳过；发送失败只记录）。
     *
     * @param {import('ws').WebSocket} ws 连接
     * @param {object} message 消息
     */
    function send(ws, message)
    {
        if (ws.readyState !== ws.OPEN) return;

        try
        {
            ws.send(JSON.stringify(message));
        }
        catch (error)
        {
            console.error(`[bridge] WebSocket 发送失败：${error.message}`);
        }
    }

    /**
     * 在线页面列表（供 `/ping` 用：WS 页面的"在线"= 连接还开着，`idleMs` 恒为 0）。
     *
     * @returns {Array<{ clientId: string, idleMs: number, polls: number, transport: string }>} 在线页面
     */
    function activePages()
    {
        const pages = [];

        for (const info of sockets.values())
        {
            if (info.isPage) pages.push({ clientId: info.clientId, idleMs: 0, polls: 0, transport: 'websocket' });
        }

        return pages;
    }

    /**
     * 把新任务推给在线的页面（按 `target` 定向过滤）。
     *
     * **推送即派发**：推给某一个页面之后就把它从待执行里**取走**（`claim`）——否则页面
     * 通过 HTTP 轮询会再拿到同一个任务，同一个方法被跑两遍（写操作尤其致命）。
     * 没有在线页面时任务留在待执行队列，等页面连上时由 `hello` 分支推给它。
     *
     * @param {{ id: string, method: string, target?: string }} task 任务
     */
    function pushTask(task)
    {
        for (const [ws, info] of sockets)
        {
            if (!info.isPage) continue;
            if (task.target && task.target !== info.clientId) continue;

            if (bridge.claim(task.id)) send(ws, { type: 'task', task });

            return;
        }
    }

    /**
     * 处理一次调用：投递 → 等结果 → **推**回调用方（不再有长轮询）。
     *
     * @param {import('ws').WebSocket} ws 调用方连接
     * @param {{ reqId?: string, method: string, params?: object, target?: string }} message 调用消息
     * @returns {Promise<void>} 处理完成
     */
    async function handleCall(ws, message)
    {
        if (!message.method)
        {
            send(ws, { type: 'error', message: '缺少 method', reqId: message.reqId });

            return;
        }

        const id = bridge.call(message.method, message.params, message.target);
        const payload = await bridge.waitForResult(id);

        send(ws, { type: 'result', reqId: message.reqId, id, ...payload });
    }

    /**
     * 处理一条消息（坏消息只回错误，**不断连接**——一条坏帧不该让页面掉线）。
     *
     * @param {import('ws').WebSocket} ws 连接
     * @param {Buffer|string} raw 原始帧
     */
    function onMessage(ws, raw)
    {
        let message;

        try
        {
            message = JSON.parse(raw.toString());
        }
        catch
        {
            send(ws, { type: 'error', message: '不是合法 JSON' });

            return;
        }

        const info = sockets.get(ws);

        if (!info) return;

        switch (message?.type)
        {
            case 'hello':
                info.clientId = typeof message.clientId === 'string' && message.clientId ? message.clientId : 'default';
                info.isPage = message.isPage !== false;
                send(ws, { type: 'hello-ack', path, clientId: info.clientId });

                // 连上之前积压的任务一并交给它——"先有调用、后有页面"在 HTTP 上由 `/pending`
                // 兜着，换成 WS 通道也不能丢
                if (info.isPage)
                {
                    const tasks = bridge.takePending(info.clientId);

                    if (tasks.length > 0) send(ws, { type: 'tasks', tasks });
                }
                break;

            case 'call':
                void handleCall(ws, message);
                break;

            case 'pending':
                send(ws, { type: 'tasks', tasks: bridge.takePending(info.clientId) });
                break;

            case 'result':
                if (!message.id) send(ws, { type: 'error', message: '缺少 id' });
                else
                {
                    bridge.submitResult(message.id, {
                        ok: message.ok !== false,
                        result: message.result,
                        error: message.error,
                        stack: message.stack,
                    });
                }
                break;

            case 'ping':
                send(ws, { type: 'pong', clients: bridge.activeClients(), pending: bridge.pendingCount });
                break;

            default:
                send(ws, { type: 'error', message: `未知消息类型 ${String(message?.type)}` });
        }
    }

    /**
     * 接受一条连接。
     *
     * @param {import('ws').WebSocket} ws 连接
     */
    function accept(ws)
    {
        sockets.set(ws, { clientId: 'default', isPage: false });

        ws.on('message', (raw) => onMessage(ws, raw));
        ws.on('close', () => sockets.delete(ws));
        ws.on('error', () => sockets.delete(ws));

        send(ws, { type: 'hello-ack', path });
    }

    return {
        path,

        /**
         * 挂到 http server 上（**同一端口**：不额外开端口，也就没有跨端口配置与 CORS 问题）。
         *
         * @param {import('node:http').Server} httpServer 宿主的 http server
         * @returns {string} 实际的挂载路径
         */
        attach(httpServer)
        {
            if (server) return path;

            const address = httpServer.address();
            const host = typeof address === 'object' && address ? address.address : '127.0.0.1';
            const port = typeof address === 'object' && address ? address.port : 0;

            url = `ws://${host}:${port}${path}`;

            const wsServer = new WebSocketServer({ noServer: true });

            httpServer.on('upgrade', (req, socket, head) =>
            {
                const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');

                if (requestUrl.pathname !== path)
                {
                    // 不是本通道的 upgrade：**放着不管**，交给别的监听器。
                    // 这里绝不能 `socket.destroy()` —— dev 下 vite 的 HMR 走的是**同一个**
                    // http server 的 `upgrade` 事件，摧毁它会让页面加载直接卡死（实测踩过：
                    // Playwright 连页面都 `load` 不出来）。
                    return;
                }

                wsServer.handleUpgrade(req, socket, head, (ws) => wsServer.emit('connection', ws, req));
            });

            wsServer.on('connection', (ws) => accept(ws));

            server = wsServer;
            // 有活儿就推给页面；有在线页面也要让 `/ping` 看得到（调用方靠它判断"有没有人接"）
            unsubscribe = bridge.subscribe((task) => pushTask(task));
            unsubscribeClientProvider = bridge.addClientProvider(() => activePages());

            return path;
        },

        /** 在线页面列表 */
        activePages,

        /** 实际监听地址（`attach` 之后可用） */
        get url()
        {
            return url;
        },

        /**
         * 停掉通道：退订、关连接、关服务端。
         */
        stop()
        {
            if (unsubscribe)
            {
                unsubscribe();
                unsubscribe = null;
            }

            if (unsubscribeClientProvider)
            {
                unsubscribeClientProvider();
                unsubscribeClientProvider = null;
            }

            for (const ws of sockets.keys()) ws.close();

            sockets.clear();
            server?.close();
            server = null;
        },
    };
}

/**
 * 通道的 **cordis 包装**（宿主用）：把生命周期交给 fiber——卸载时自动退订、关连接。
 */
export class BridgeSocket extends Service
{
    /** 纯实现（`createBridgeSocket` 的返回值） */
    impl;

    /** 挂载路径 */
    path;

    /**
     * @param {import('@deepseek-ai/cordis').Context} ctx 所属 context
     * @param {{ relay: object, path?: string }} config 配置
     */
    constructor(ctx, config)
    {
        super(ctx, 'bridgeSocket');

        this.impl = createBridgeSocket(config);
        this.path = this.impl.path;
    }

    /**
     * 挂到 http server（卸载时自动收走）。
     *
     * @param {import('node:http').Server} httpServer 宿主的 http server
     * @returns {string} 实际挂载路径
     */
    attach(httpServer)
    {
        const result = this.impl.attach(httpServer);

        this.ctx.effect(() => () => this.impl.stop());

        return result;
    }

    /**
     * 在线页面列表（供 `/ping` 用）。
     *
     * @returns {Array<object>} 在线页面
     */
    activePages()
    {
        return this.impl.activePages();
    }
}
