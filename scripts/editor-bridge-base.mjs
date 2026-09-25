/**
 * 解析编辑器桥接的 dev server 地址（`editor-bridge-cli.mjs` 与 `editor-mcp-server.mjs` 共用）。
 *
 * 为什么需要它：Vite 的端口是「第一个空闲端口」——默认 3000，被占用时会自动漂到 3001、3002……
 * 实测就撞过这个问题：桥接挂在 3000，而调用方写死 3001，于是所有调用全部失败。
 * 因此地址改为**自动探测**，显式指定（CLI `--url` / 环境变量 `EDITOR_BRIDGE_URL`）仍可覆盖。
 *
 * 探测用的是只读端点 `GET /__editor-bridge/ping`。
 * 注意**不能**拿 `/pending` 探测：它「派发即从队列删除」，会把真正的任务取走并丢掉。
 */
const PREFIX = '/__editor-bridge';

/** 探测超时：本地回环，超过这个时间说明端口上没有可用的桥接 */
const PROBE_TIMEOUT_MS = 800;

/** 候选端口：第一个与 packages/editor/vite.config.js 的默认端口一致，其余覆盖 Vite 自动 +1 的情况 */
const CANDIDATE_PORTS = [3000, 3001, 3002, 3003];

/** 探测成功的地址缓存（lazy 赋值，模块加载时不做任何探测） */
let cachedBase = null;

/** 去掉尾部斜杠，容忍 `http://localhost:3000/` 这种写法 */
function normalize(base)
{
    return base.replace(/\/+$/, '');
}

/**
 * 探测某个地址上是否挂着编辑器桥接。
 * @param base 形如 `http://localhost:3000`
 * @returns 是桥接则 true
 */
async function probe(base)
{
    try
    {
        const response = await fetch(`${base}${PREFIX}/ping`, { signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
        if (response.ok)
        {
            const payload = await response.json().catch(() => null);
            if (payload?.ok === true) return true;
        }
        // 兼容尚未重启的 dev server：插件还没有 /ping 路由时，桥接对未知路由返回可识别的 404
        if (response.status === 404)
        {
            const text = await response.text().catch(() => '');

            return text.includes('未知桥接路由');
        }

        return false;
    }
    catch
    {
        // 端口未监听 / 超时 / 非桥接服务，一律视为未命中
        return false;
    }
}

/**
 * 解析桥接地址：显式指定 > 环境变量 > 逐个探测候选端口。
 *
 * 每次调用都会重新校验缓存地址，因此 dev server 换端口或重启后能自愈。
 * @param explicit 显式地址（CLI `--url`），省略时读 `EDITOR_BRIDGE_URL`
 * @returns 形如 `http://localhost:3000` 的地址
 * @throws 所有候选端口都探测失败时抛出，并说明如何显式指定
 */
export async function resolveBridgeBase(explicit)
{
    const fixed = explicit ?? process.env.EDITOR_BRIDGE_URL;
    if (fixed) return normalize(fixed);

    if (cachedBase !== null && await probe(cachedBase)) return cachedBase;
    cachedBase = null;

    for (const port of CANDIDATE_PORTS)
    {
        const base = `http://localhost:${port}`;
        if (await probe(base))
        {
            cachedBase = base;

            return base;
        }
    }

    throw new Error(
        `找不到编辑器桥接：已探测 ${CANDIDATE_PORTS.map((p) => `http://localhost:${p}`).join('、')}。`
        + '请确认编辑器 dev server 正在运行（编辑器前端必须已在浏览器中打开）；'
        + '也可用 EDITOR_BRIDGE_URL 或 --url 显式指定地址。',
    );
}
