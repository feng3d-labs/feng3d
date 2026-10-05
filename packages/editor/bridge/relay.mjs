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
import { checkBridgeRequest, checkBridgeToken, isPageSideRoute } from './security.mjs';

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
 * @param {{ prefix?: string, token?: string }} [options] 选项
 *   `token` 是**一次性 token**（#273 P2 / D9 第二步）：只管**页面侧端点**，
 *   调用方端点（`/call`、`GET /result`、`/ping`）不要求——理由见 `handle` 里的注释
 * @returns {{ prefix: string, handle: (req: any, res: any) => boolean }} 中继
 */
export function createBridgeRelay(options = {})
{
    const prefix = options.prefix ?? BRIDGE_PREFIX;
    const token = String(options.token ?? '');

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
     * **推送订阅者**（#273 第二阶段）：有新任务入队时被叫醒。
     *
     * 这是 WebSocket 通道相对 HTTP 轮询的核心增量：页面不再每秒问一次"有没有活儿"，
     * 而是**有活儿时被推**。HTTP 路径不订阅（它本来就得轮询），所以这里空着也不影响它。
     */
    const listeners = new Set();

    /**
     * **宿主方法调用器**（#272 P2/P3 之间的地基）：由宿主注入（`setHostInvoker`）。
     *
     * 为什么要有它：桥接方法表跑在**页面里**，而"读写项目目录 / 构建 / 开关项目"这类事
     * 页面碰不到、也不该碰。它们由宿主实现，调用方**直接调**、不经页面——
     * 于是"编辑器关着也能构建项目"（D12 的形态）才有可能。
     *
     * 路由只认前缀：`method` 以 `host.` 开头就走这里，否则照旧投给页面。
     */
    let hostInvoker = null;

    /**
     * **外部在线页面提供者**（#273 第二阶段）：WebSocket 页面的"在线"由连接本身决定
     * （它们不轮询），所以由 WS 通道把它们的列表并进来。
     *
     * 为什么必须并：`/ping` 是"现在有没有页面能干活"的**权威答案**——调用方（CLI / MCP /
     * e2e）拿它决定要不要投递。漏掉 WS 页面会让工具误判"没人接"，于是明明有页面却报无页面。
     */
    const clientProviders = new Set();

    /**
     * 通知订阅者（订阅者抛错只记录，不影响投递本身）。
     *
     * @param {object} task 新任务
     */
    function notifyTask(task)
    {
        for (const listener of listeners)
        {
            try
            {
                listener(task);
            }
            catch (error)
            {
                console.error(`[bridge] 推送订阅者抛错（已忽略）：${error.message}`);
            }
        }
    }

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

        // 并进外部提供者（WebSocket 页面）：它们的"在线"是连接还开着
        const external = [...clientProviders].flatMap((provider) => provider());

        return [...clients.values()]
            .filter((info) => now - info.lastSeen <= IDLE_LIMIT_MS)
            .map((info) => ({ clientId: info.clientId, idleMs: now - info.lastSeen, polls: info.polls }))
            .concat(external)
            .sort((a, b) => a.idleMs - b.idleMs);
    }

    /**
     * 投递一次调用（调用方 → 待前端执行）。
     *
     * HTTP `/call` 与 WebSocket 的 `call` **共用这一份**：两条通道的语义必须一致，
     * 否则"dev 与生产共用同一命令层"就是空话。
     *
     * @param {string} method 方法名
     * @param {object} [params] 参数
     * @param {string} [target] 定向投递的页面名
     * @returns {string} 请求 id
     */
    function enqueueCall(method, params, target)
    {
        const id = randomUUID();
        const task = { method, params: params ?? {}, target, createdAt: Date.now() };

        pending.set(id, task);
        // 推送：在线的 WebSocket 页面会被立刻叫醒（HTTP 页面照旧轮询 /pending 取）
        notifyTask({ id, ...task });

        return id;
    }

    /**
     * 页面取走待执行的任务（**派发即移除**，保持一次性语义）。
     *
     * 在线页面的记账（`clients`）留给调用方：HTTP 用"来源端口 + 轮询计数"，
     * WebSocket 用连接本身——两者对"在线"的定义不同，不该塞进同一段。
     *
     * @param {string} [clientId] 页面自报的名字（缺省 `default`）
     * @returns {Array<object>} 任务列表
     */
    function takePending(clientId)
    {
        const requests = [...pending.entries()]
            .filter(([, v]) => !v.target || v.target === clientId)
            .map(([id, v]) => ({ id, method: v.method, params: v.params, createdAt: v.createdAt }));

        for (const r of requests) pending.delete(r.id);

        return requests;
    }

    /**
     * 等一个请求的结果（HTTP 长轮询与 WebSocket 调用方共用）。
     *
     * @param {string} id 请求 id
     * @returns {Promise<object>} 结果载荷
     */
    async function waitForResult(id)
    {
        if (results.has(id))
        {
            const payload = results.get(id);

            results.delete(id);

            return payload;
        }

        // 长轮询：等前端回传，最多 20s（调用方超时自行重试）
        return await new Promise((resolve) =>
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
     * 跑一个**宿主方法**：结果走同一个 `results`，于是调用方照旧用 `GET /result?id=` 取
     * ——对 CLI / MCP / 15 个 `editor-*.mjs` **零改动**。
     *
     * @param {import('node:http').ServerResponse} res 响应
     * @param {{ method: string, params?: object }} body 请求体
     * @returns {Promise<void>} 处理完成
     */
    async function routeHostCall(res, body)
    {
        if (!hostInvoker) return send(res, 400, { error: '宿主方法未接入（宿主没注册调用器）' });

        if (!hostInvoker.has(body.method))
        {
            return send(res, 400, {
                error: `未知宿主方法 ${body.method}；当前可用：${hostInvoker.names?.join(', ') || '（无）'}`,
            });
        }

        const id = randomUUID();

        // 异步执行：立刻把 id 交给调用方，结果放进 results（它可能马上来取，也可能长轮询等）
        void (async () =>
        {
            try
            {
                resolveResult(id, { ok: true, result: await hostInvoker.invoke(body.method, body.params) });
            }
            catch (error)
            {
                resolveResult(id, {
                    ok: false,
                    error: String(error?.message ?? error),
                    stack: error instanceof Error ? error.stack : undefined,
                });
            }
        })();

        return send(res, 200, { id, host: true });
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

                // **宿主方法**（`host.` 前缀，#272）：宿主直接执行，**不经页面**——
                // 页面碰不到磁盘，"读写项目目录 / 构建 / 开关项目"只能宿主做
                if (body.method.startsWith('host.')) return await routeHostCall(res, body);

                // target 用于定向投递：多个编辑器页面同时打开时，只有通过 ?bridgeClient=xxx
                // 自报该名字的页面会取到这条请求（缺省名为 default）。
                // 不指定 target 则任何页面都可取（原行为，向后兼容）。
                const id = enqueueCall(body.method, body.params, body.target);

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

                // 派发即移除的一次性语义在 takePending 里（WS 通道共用同一份）
                return send(res, 200, { requests: takePending(clientId ?? undefined) });
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

                // 取已就绪的结果，或长轮询等前端回传（WS 通道的调用方共用同一份等待逻辑）
                return send(res, 200, await waitForResult(id));
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
         * **命令层**（#273 第二阶段）：HTTP 路由与 WebSocket 通道**共用这一份实现**。
         *
         * 为什么要抽出来：通道换了（轮询 → 推送）、"怎么运输"变了，但"待执行 / 结果 / 等待者"
         * 这套语义**必须只有一份**——两份实现意味着两条通道迟早会在边界上不一致，
         * 而"dev 与生产一致"正是这条通道存在的理由。
         */
        bridge: {
            /**
             * 注入**宿主方法调用器**（#272）：`{ has(name), names, invoke(name, params) }`。
             *
             * @param {object} invoker 调用器（宿主把 `HostMethods` 服务直接传进来即可）
             */
            setHostInvoker(invoker)
            {
                hostInvoker = invoker;
            },

            call: enqueueCall,
            takePending,
            submitResult: resolveResult,
            waitForResult,
            activeClients,

            /**
             * 登记一个"外部在线页面提供者"（WebSocket 通道用）。
             *
             * @param {() => Array<object>} provider 返回在线页面列表
             * @returns {() => void} 退订
             */
            addClientProvider(provider)
            {
                clientProviders.add(provider);

                return () => clientProviders.delete(provider);
            },

            /**
             * 取走一个任务（按 id）。
             *
             * **推送即派发**：WebSocket 把任务推给页面时就得把它从待执行里取走——否则页面
             * 通过 HTTP 轮询会**再拿到同一个任务**，同一个方法被跑两遍（写操作尤其致命）。
             *
             * @param {string} id 任务 id
             * @returns {boolean} 是否取走
             */
            claim(id)
            {
                return pending.delete(id);
            },

            /**
             * 订阅"有新任务"（WebSocket 推送用）。
             *
             * @param {(task: object) => void} listener 订阅者
             * @returns {() => void} 退订
             */
            subscribe(listener)
            {
                listeners.add(listener);

                return () => listeners.delete(listener);
            },

            /** 待执行任务数（诊断用） */
            get pendingCount()
            {
                return pending.size;
            },
        },

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

            // **来源校验**（#273 P2 / D9）：同源策略保护不了 `127.0.0.1` 上的服务——
            // 任意网页都能往这里发请求（CORS 只挡读响应，挡不住发请求）。
            // 校验放在**中继层**：dev（vite 中间件）与生产（宿主静态服务）共用同一份实现，
            // 不会出现"一边补了、另一边忘了"。
            const verdict = checkBridgeRequest({ headers: req.headers, localPort: req.socket?.localPort });

            if (!verdict.ok)
            {
                res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: false, error: `桥接拒绝该请求：${verdict.reason}` }));

                return true;    // 已接管（拒绝也是接管）：不要让它继续走静态资源
            }

            // **一次性 token**（#273 P2 / D9 第二步）：只保护**页面侧端点**——
            // 那是唯一"能执行任务"的一端（拿到它就能读场景、改工程）。
            //
            // 调用方端点（`POST /call`、`GET /result`、`GET /ping`）**刻意不要求** token：
            // CLI / MCP / 15 个 e2e 脚本都是本地可信进程、走的正是这些端点，于是**零改动**；
            // 而浏览器里的攻击者**到不了**它们（跨源被 `Origin` 挡、响应被 CORS 挡住读不到）。
            if (isPageSideRoute(req.method, url.pathname, prefix))
            {
                const tokenVerdict = checkBridgeToken({ headers: req.headers, search: url.search, token });

                if (!tokenVerdict.ok)
                {
                    res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ ok: false, error: `桥接拒绝该请求：${tokenVerdict.reason}` }));

                    return true;
                }
            }

            void route(req, res, url);

            return true;
        },
    };
}
