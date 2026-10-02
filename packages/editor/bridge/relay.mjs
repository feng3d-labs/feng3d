/**
 * 编辑器桥接的**命令层**（平台无关）：把"调用方 ↔ 编辑器页面"之间的 RPC 中继抽成一处。
 *
 * ## 为什么要有这一层（#273 第一阶段）
 *
 * 原来这套逻辑整个长在 `vitePlugin.mjs` 里，于是桥接是 **dev-only** 的：
 * `apply: 'serve'` + 挂在 dev server 的 middleware 上，**生产产物没有通道**。
 * `NODE_HOST.md` §5.4 定的是"通道由**服务端**提供，dev 与生产一致"，
 * 而 15 个 `scripts/editor-*.mjs`（CLI / MCP / e2e）都建立在**这套协议**之上——
 * 所以第一步是：**把命令层抽出来，让 dev server 与宿主共用同一份实现**，
 * 协议一字不改（那些脚本因此零改动）。
 *
 * ```
 * 调用方（CLI / MCP / e2e 脚本）          编辑器页面（浏览器）
 *        │  POST /call  GET /result              │  GET /pending  POST /result
 *        └──────────────┬───────────────────────┘
 *                本模块（中继：队列 + 长轮询 + 在线页面跟踪）
 *                       │
 *         ┌─────────────┴─────────────┐
 *   vitePlugin.mjs（dev）      host/staticServer.mjs（生产产物）
 * ```
 *
 * 下一步（#273 后续阶段）会在这条通道之上加 WebSocket：**同时**提供 WS 与 HTTP，
 * 共享同一命令层，老工具链继续用 HTTP。
 *
 * ## 路由（前缀默认 `/__editor-bridge`）
 *
 * - `GET  /ping`    → `{ ok, name, clients, duplicated }`（只读探针，**绝不能用 /pending 探测**）
 * - `POST /call`    → `{ id, target }`（入队，调用方随后取结果）
 * - `GET  /pending` → `{ requests: [...] }`（派发即移除，一次性语义）
 * - `POST /result`  → `{ received: true }`
 * - `GET  /result?id=` → 结果（未就绪时挂起至多 20s）
 */

import { randomUUID } from 'node:crypto';

/** 默认路由前缀 */
export const BRIDGE_PREFIX = '/__editor-bridge';

/** 长轮询挂起上限（毫秒）——调用方超时自行重试 */
const WAIT_TIMEOUT_MS = 20000;

/**
 * 读取并解析 JSON 请求体。
 *
 * @param {import('node:http').IncomingMessage} req 请求
 * @returns {Promise<object>} 解析后的对象（空体给 `{}`）
 */
function readJson(req)
{
    return new Promise((resolve, reject) =>
    {
        const chunks = [];

        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () =>
        {
            const text = Buffer.concat(chunks).toString('utf8');

            if (!text) return resolve({});

            try { resolve(JSON.parse(text)); }
            catch (e) { reject(new Error(`请求体不是合法 JSON: ${e.message}`)); }
        });
        req.on('error', reject);
    });
}

/**
 * 回一个 JSON 响应。
 *
 * @param {import('node:http').ServerResponse} res 响应
 * @param {number} status 状态码
 * @param {object} body 响应体
 */
function send(res, status, body)
{
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(body));
}

/**
 * 造一个桥接中继。
 *
 * @param {{ prefix?: string }} [options] 选项
 * @returns {{ prefix: string, handle: (req: any, res: any) => boolean }} 中继
 */
export function createBridgeRelay(options = {})
{
    const prefix = options.prefix ?? BRIDGE_PREFIX;

    /** 待前端执行：id → { method, params, target, createdAt } */
    const pending = new Map();
    /** 前端已回传、等待调用方取走：id → payload */
    const results = new Map();
    /** 正在长轮询等待结果的调用方：id → resolve 列表 */
    const waiters = new Map();
    /**
     * 在线前端页面：`clientId@来源端口` → { clientId, lastSeen, polls }。
     *
     * 用来源端口区分页面：同一个 `?bridgeClient=xxx` 被两个标签页打开时，两边都会取到请求
     * （派发是先到先得），于是**同一个方法调用可能落在任意一个页面上**——场景状态在两者之间
     * 跳，测试结果毫无意义且极难看出原因。按端口记录之后 `/ping` 能把"同名多开"直接报出来。
     */
    const clients = new Map();
    /**
     * 前端每 100ms 轮询一次。空闲超过 `IDLE_LIMIT_MS` 就不再算"在线页面"——dev server 重启、
     * 页面重载都会让同一个页面换一条连接，旧连接会停在最后一刻不动，不区分就会误报"同名多开"。
     */
    const IDLE_LIMIT_MS = 3000;
    /** 彻底清掉记录的时限 */
    const CLIENT_TTL_MS = 20000;

    /**
     * 在线页面列表（顺带清掉超时的）。
     *
     * @returns {Array<{ clientId: string, idleMs: number, polls: number }>} 在线页面
     */
    function activeClients()
    {
        const now = Date.now();

        for (const [key, info] of clients)
        {
            if (now - info.lastSeen > CLIENT_TTL_MS) clients.delete(key);
        }

        return [...clients.values()]
            .filter((info) => now - info.lastSeen <= IDLE_LIMIT_MS)
            .map((info) => ({ clientId: info.clientId, idleMs: now - info.lastSeen, polls: info.polls }))
            .sort((a, b) => a.idleMs - b.idleMs);
    }

    /**
     * 写入结果并唤醒等待者。
     *
     * @param {string} id 请求 id
     * @param {object} payload 结果
     */
    function resolveResult(id, payload)
    {
        const list = waiters.get(id);

        if (list)
        {
            waiters.delete(id);
            for (const wake of list) wake(payload);

            return;
        }

        results.set(id, payload);
    }

    /**
     * 处理一个已匹配前缀的请求（异步，异常自己兜住）。
     *
     * @param {import('node:http').IncomingMessage} req 请求
     * @param {import('node:http').ServerResponse} res 响应
     * @param {URL} url 解析后的 URL
     * @returns {Promise<void>} 处理完成
     */
    async function route(req, res, url)
    {
        const routePath = url.pathname.slice(prefix.length);

        try
        {
            // 只读探针：调用方（CLI / MCP server）用它探测服务端实际端口。
            // 绝不能用 /pending 探测 —— 它派发即删除，会把真正的任务取走并丢掉。
            if (req.method === 'GET' && routePath === '/ping')
            {
                const list = activeClients();
                const counts = new Map();

                for (const item of list) counts.set(item.clientId, (counts.get(item.clientId) ?? 0) + 1);

                return send(res, 200, {
                    ok: true,
                    name: 'feng3d-editor-bridge',
                    clients: list,
                    // 同名多开：即使调用方指定了 target，也救不了——两个页面都符合条件
                    duplicated: [...counts]
                        .filter(([, pages]) => pages > 1)
                        .map(([clientId, pages]) => ({ clientId, pages })),
                });
            }

            if (req.method === 'POST' && routePath === '/call')
            {
                const body = await readJson(req);

                if (!body.method) return send(res, 400, { error: '缺少 method' });

                const id = randomUUID();

                // target 用于定向投递：多个编辑器页面同时打开时，只有通过 ?bridgeClient=xxx
                // 自报该名字的页面会取到这条请求（缺省名为 default）。
                // 不指定 target 则任何页面都可取（原行为，向后兼容）。
                pending.set(id, {
                    method: body.method,
                    params: body.params ?? {},
                    target: body.target,
                    createdAt: Date.now(),
                });

                return send(res, 200, { id, target: body.target ?? null });
            }

            if (req.method === 'GET' && routePath === '/pending')
            {
                const clientId = url.searchParams.get('clientId');
                const name = clientId ?? 'default';
                // 按来源端口区分页面，让 /ping 能报出"同名多开"（见 clients 的注释）
                const key = `${name}@${req.socket?.remotePort ?? 0}`;
                const seen = clients.get(key);

                clients.set(key, { clientId: name, lastSeen: Date.now(), polls: (seen?.polls ?? 0) + 1 });

                const requests = [...pending.entries()]
                    .filter(([, v]) => !v.target || v.target === clientId)
                    .map(([id, v]) => ({ id, method: v.method, params: v.params, createdAt: v.createdAt }));

                // 派发即移除：保持一次性语义
                for (const r of requests) pending.delete(r.id);

                return send(res, 200, { requests });
            }

            if (req.method === 'POST' && routePath === '/result')
            {
                const body = await readJson(req);

                if (!body.id) return send(res, 400, { error: '缺少 id' });

                resolveResult(body.id, {
                    ok: body.ok !== false,
                    result: body.result,
                    error: body.error,
                    // 堆栈是可选的诊断信息（引擎内部抛错时只靠一句话无法定位源头），
                    // 原样透传——裁剪由前端做，中间层不再加工
                    stack: body.stack,
                });

                return send(res, 200, { received: true });
            }

            if (req.method === 'GET' && routePath === '/result')
            {
                const id = url.searchParams.get('id');

                if (!id) return send(res, 400, { error: '缺少 id' });

                if (results.has(id))
                {
                    const payload = results.get(id);

                    results.delete(id);

                    return send(res, 200, payload);
                }

                // 长轮询：等前端回传，最多 20s（调用方超时自行重试）
                const payload = await new Promise((resolve) =>
                {
                    const list = waiters.get(id) ?? [];

                    list.push(resolve);
                    waiters.set(id, list);

                    setTimeout(() =>
                    {
                        const arr = waiters.get(id) ?? [];
                        const index = arr.indexOf(resolve);

                        if (index >= 0)
                        {
                            arr.splice(index, 1);
                            resolve({ ok: false, error: 'TIMEOUT: 编辑器前端未在 20s 内回传结果（前端是否已打开？）' });
                        }
                    }, WAIT_TIMEOUT_MS);
                });

                return send(res, 200, payload);
            }

            return send(res, 404, { error: `未知桥接路由 ${routePath}` });
        }
        catch (e)
        {
            send(res, 500, { error: `桥接处理失败: ${e.message}` });
        }
    }

    return {
        prefix,

        /**
         * 尝试接管一个请求。
         *
         * **同步**返回"是否是本中继的路由"（调用方据此决定要不要继续往下走），
         * 匹配到之后内部异步处理——长轮询会挂起，但**不阻塞调用方的中间件链**。
         *
         * @param {import('node:http').IncomingMessage} req 请求
         * @param {import('node:http').ServerResponse} res 响应
         * @returns {boolean} 是否已接管
         */
        handle(req, res)
        {
            const url = new URL(req.url ?? '/', 'http://127.0.0.1');

            if (!url.pathname.startsWith(prefix)) return false;

            void route(req, res, url);

            return true;
        },
    };
}
