/**
 * 页面侧调**宿主方法**（#272 的"宿主面板"地基）。
 *
 * 页面与宿主**同源**，所以它自己就能走桥接协议（`POST /call` → `GET /result`）——
 * 不必让调用方（CLI / MCP）替它转一手。宿主方法用 `host.` 前缀（见 `bin/host/hostMethods.mjs`）。
 *
 * ## 为什么不复用 `EditorBridge` 那套
 *
 * 那是**调用方 → 页面**的方向（任务投递）；这里是**页面 → 宿主**（直接调用）。
 * 两条方向的失败语义也不同：任务失败要回传给调用方，而这里只要把错误抛给调用它的界面代码。
 */

/** 桥接前缀（与 `EditorBridge` / 服务端一致） */
const BRIDGE_PREFIX = '/__editor-bridge';

/** 能力探测的超时（毫秒）：本地回环，超过这个时间说明端口上没有可用的桥接 */
const PROBE_TIMEOUT = 1500;

/**
 * 探测**服务端有没有接入宿主调用器**（宿主的 `setHostInvoker`，见 `bridge/relay.mjs`）。
 *
 * ## 为什么不直接调一个 `host.*` 试试
 *
 * 没有宿主时 `POST /call` 回的是 **400**。那在浏览器控制台是一条
 * `Failed to load resource: the server responded with a status of 400` ——
 * 而"没有宿主"是**正常态**（`npm run dev` 只有 vite 中继、静态部署连中继都没有），
 * 不该让正常态看起来像页面坏了。
 *
 * `/ping` 是只读能力探针、**固定 200**（见 `bridge/relay.mjs` 的 `/ping` 路由），
 * 拿它问没有任何 4xx 噪音。
 *
 * @returns 服务端接了宿主返回 `true`；超时 / 不可达 / 没这个字段一律 `false`
 */
export async function probeHost(): Promise<boolean>
{
    try
    {
        const response = await fetch(`${BRIDGE_PREFIX}/ping`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(PROBE_TIMEOUT),
        });

        if (!response.ok) return false;

        const payload = await response.json() as { host?: boolean };

        return payload.host === true;
    }
    catch
    {
        // 端口上没有桥接（静态部署 / dev server 没起）：静默当作"没有宿主"
        return false;
    }
}

/**
 * 调一个宿主方法。
 *
 * @param method 方法名（`host.` 前缀）
 * @param params 参数
 * @returns 结果
 * @throws 宿主方法不存在、或它自己抛错时，抛出带原因的 `Error`
 */
export async function callHost<T = unknown>(method: string, params: object = {}): Promise<T>
{
    const response = await fetch(`${BRIDGE_PREFIX}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, params }),
    });

    if (!response.ok)
    {
        const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` })) as { error?: string };

        throw new Error(body.error ?? `调用宿主方法失败（HTTP ${response.status}）`);
    }

    const { id } = await response.json() as { id: string };
    const payload = await (await fetch(`${BRIDGE_PREFIX}/result?id=${id}`)).json() as {
        ok?: boolean;
        result?: T;
        error?: string;
    };

    if (payload.ok === false) throw new Error(payload.error ?? '宿主方法执行失败');

    return payload.result as T;
}
