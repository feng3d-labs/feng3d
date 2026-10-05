/**
 * 桥接通道的**来源校验**（#273 P2 / D9 通信安全）。
 *
 * ## 为什么必须有这一层
 *
 * 桥接监听在 `127.0.0.1`，但**同源策略保护不了它**：
 *
 * - 任意网页都能向 `http://127.0.0.1:3000/__editor-bridge/call` 发请求——
 *   CORS 只挡"**读响应**"，**挡不住"发请求"**（简单请求照样送达、副作用照样发生）；
 * - WebSocket 更彻底：**握手完全不受同源策略约束**，任意网页都能连 `ws://127.0.0.1:<port>`。
 *
 * 于是不校验的话，"你打开一个恶意网页 → 它就能驱动你本机的编辑器"是**默认**成立的事。
 *
 * ## 三条判据，各挡一类攻击
 *
 * | 校验 | 挡什么 | 备注 |
 * |---|---|---|
 * | `Host` 白名单（本机） | **DNS rebinding**：攻击者用自己的域名解析到 `127.0.0.1`，于是"同源"成立 | 顺带校验端口 |
 * | `Origin` 白名单（本机） | 跨源网页发起的**任何**请求（浏览器一定会带 `Origin`） | 见下方"为什么缺 Origin 要放行" |
 * | 一次性 token（**下一步**，见 #279） | 绕过前两条的通道：非浏览器客户端、或被诱导的本地程序 | 本轮未做 |
 *
 * ## 为什么"缺 `Origin`"要放行
 *
 * 浏览器对**同源 GET** 不发 `Origin`——而页面自己就是用 `GET /pending` 拉任务的。
 * 一概拒绝会把编辑器自己的通道也挡掉。所以规则是：**有 `Origin` 就必须是本机，没有则放行**。
 * 这不是漏洞：跨源请求（无论简单请求还是预检）**一定**带 `Origin`，所以"恶意网页"这一路必然被拦。
 * 强威胁（本地程序伪造头）由 token 那一层负责——它才是给非浏览器客户端准备的。
 *
 * ## 只认本机
 *
 * `localhost` / `127.0.0.0/8` / `::1` / `[::1]`。**刻意不认 `0.0.0.0`**：
 * 那是"监听全部网卡"的写法，不是访问用的主机名。将来 P8（远程接入）要放开时，
 * 应当由调用方显式传入允许的主机名——而不是把这里放宽成"什么都收"。
 */

import { isIP } from 'node:net';

/**
 * 判断一个主机名是否指向本机。
 *
 * @param {unknown} name 主机名（可带 `[ ]`，如 `[::1]`）
 * @returns {boolean} 是否本机
 */
export function isLoopbackHostname(name)
{
    const value = String(name ?? '').toLowerCase().replace(/^\[|\]$/g, '');

    if (value === 'localhost') return true;
    if (value === '::1') return true;
    // `127.0.0.0/8` 整段都是回环（不只是 127.0.0.1）
    if (isIP(value) === 4 && value.startsWith('127.')) return true;

    return false;
}

/**
 * 从 `Host` 头（或 `Origin` 里的主机段）取出主机名与端口。
 *
 * 兼容三种写法：`127.0.0.1:3000` / `localhost:3000` / `[::1]:3000`。
 *
 * @param {unknown} host `Host` 头原值
 * @returns {{ name: string, port: number | null }} 主机名与端口（没有端口时为 `null`）
 */
export function hostnameOfHost(host)
{
    const value = String(host ?? '').trim();
    const bracketed = /^\[([^\]]+)\](?::(\d+))?$/.exec(value);

    if (bracketed) return { name: bracketed[1], port: bracketed[2] ? Number(bracketed[2]) : null };

    const index = value.lastIndexOf(':');

    if (index > 0 && /^\d+$/.test(value.slice(index + 1)))
    {
        return { name: value.slice(0, index), port: Number(value.slice(index + 1)) };
    }

    return { name: value, port: null };
}

/**
 * 校验一个请求（HTTP 或 WebSocket 握手）的来源。
 *
 * @param {{ headers: Record<string, unknown>, localPort?: number }} input 请求头与实际监听端口
 *   （`localPort` 取 `req.socket.localPort`：**它才是真正在服务的端口**，
 *   比配置里的期望端口可靠——端口为 0 时由系统分配，配置里写的是 0）
 * @returns {{ ok: boolean, reason?: string }} 结论（不通过时 `reason` 说明是哪一条）
 */
export function checkBridgeRequest({ headers, localPort })
{
    const head = headers ?? {};
    const { name, port } = hostnameOfHost(head.host);

    // ---- 1) Host 头：只认本机（挡 DNS rebinding）----
    if (!name) return { ok: false, reason: '缺少 Host 头' };
    if (!isLoopbackHostname(name)) return { ok: false, reason: `Host 不是本机（${name}）——防 DNS rebinding` };
    if (localPort && port && port !== localPort) return { ok: false, reason: `Host 端口不符（${port} ≠ ${localPort}）` };

    // ---- 2) Origin：有就必须是本机；没有则放行（浏览器对同源 GET 不发 Origin）----
    const origin = head.origin;

    if (origin !== undefined && origin !== null)
    {
        const text = String(origin);
        const matched = /^https?:\/\/([^/]+)\/?$/i.exec(text);

        // `Origin: null`（sandbox iframe / file://）与任何非法值都走这里 → 拒
        if (!matched) return { ok: false, reason: `Origin 无法识别（${text}）` };

        const parsed = hostnameOfHost(matched[1]);

        if (!isLoopbackHostname(parsed.name)) return { ok: false, reason: `Origin 非本机（${text}）` };
        if (localPort && parsed.port && parsed.port !== localPort)
        {
            return { ok: false, reason: `Origin 端口不符（${parsed.port} ≠ ${localPort}）` };
        }
    }

    return { ok: true };
}
