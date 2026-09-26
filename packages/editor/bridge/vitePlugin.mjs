/**
 * 编辑器只读桥接（P1）的 Vite 插件 —— 服务端半。
 *
 * 背景与取舍见 `packages/editor/src/bridge/EditorBridge.ts` 与 `docs/EDITOR_AI_BRIDGE.md`。
 * 要点：编辑器前端跑在**浏览器**里，无法监听端口；而浏览器与 dev server 之间已有通道，
 * 因此把 RPC 端点挂在 dev server 的 middleware 上，前端**轮询**取任务、回传结果。
 *
 * 之所以不用 WebSocket：本仓库 `node_modules` 中不存在 `ws` 依赖，手写 RFC 6455
 * 握手与帧解析的收益不抵风险；HTTP 方案零依赖、可 curl 调试，P1 只读场景下延迟完全够用
 * （长轮询下空转时延 ≈ 一次网络往返）。
 *
 * 路由（前缀 `/__editor-bridge`）：
 * - `GET  /ping`    → `{ ok: true }`（只读探针，供调用方自动探测 dev server 端口）
 * - `POST /call`    body `{ method, params }` → `{ id }`（调用方随后长轮询取结果）
 * - `GET  /pending` → `{ requests: [{ id, method, params }] }`（派发即从队列移除）
 * - `POST /result`  body `{ id, ok, result, error }` → `{ received: true }`
 * - `GET  /result?id=` → 结果（未就绪时挂起至多 20s）
 */
import { randomUUID } from 'node:crypto';

const PREFIX = '/__editor-bridge';

/** 读取并解析 JSON 请求体 */
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

function send(res, status, body)
{
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(body));
}

export function editorBridgePlugin(options = {})
{
    const prefix = options.prefix ?? PREFIX;

    /** 待前端执行：id → { method, params, createdAt } */
    const pending = new Map();
    /** 前端已回传、等待调用方取走：id → { ok, result, error } */
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

    /** 在线页面列表（顺带清掉超时的） */
    const activeClients = () =>
    {
        const now = Date.now();
        for (const [key, info] of clients)
        {
            if (now - info.lastSeen > CLIENT_TTL_MS) clients.delete(key);
        }
        const list = [...clients.values()]
            .filter((info) => now - info.lastSeen <= IDLE_LIMIT_MS)
            .map((info) => ({
                clientId: info.clientId,
                idleMs: now - info.lastSeen,
                polls: info.polls,
            }));

        return list.sort((a, b) => a.idleMs - b.idleMs);
    };

    /** 写入结果并唤醒等待者 */
    const resolveResult = (id, payload) =>
    {
        const list = waiters.get(id);
        if (list)
        {
            waiters.delete(id);
            for (const wake of list) wake(payload);
            return;
        }
        results.set(id, payload);
    };

    return {
        name: 'feng3d-editor-bridge',
        apply: 'serve',
        configureServer(server)
        {
            server.middlewares.use(async (req, res, next) =>
            {
                const url = new URL(req.url ?? '/', 'http://127.0.0.1');
                if (!url.pathname.startsWith(prefix)) return next();

                const route = url.pathname.slice(prefix.length);
                try
                {
                    // 只读探针：调用方（CLI / MCP server）用它探测 dev server 实际端口。
                    // 绝不能用 /pending 探测 —— 它派发即删除，会把真正的任务取走并丢掉。
                    if (req.method === 'GET' && route === '/ping')
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

                    if (req.method === 'POST' && route === '/call')
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

                    if (req.method === 'GET' && route === '/pending')
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

                    if (req.method === 'POST' && route === '/result')
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

                    if (req.method === 'GET' && route === '/result')
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
                            }, 20000);
                        });

                        return send(res, 200, payload);
                    }

                    return send(res, 404, { error: `未知桥接路由 ${route}` });
                }
                catch (e)
                {
                    return send(res, 500, { error: String(e?.message ?? e) });
                }
            });

            server.config.logger.info(`[editor-bridge] P1 只读桥接已挂载：${prefix}`);
        },
    };
}
