/**
 * `security.mjs` 的类型声明。
 *
 * `bridge/` 下是纯 `.mjs`（宿主与 vite 插件都用它，不经打包）；
 * 单测（`test/bridgeSecurity.spec.ts`）要用它，所以配对一份 `.d.mts`——
 * TS 会用它给 `import … from './security.mjs'` 提供类型（否则 strict 下报"找不到声明"）。
 */

/** 判断一个主机名是否指向本机 */
export function isLoopbackHostname(name: unknown): boolean;

/** 从 `Host` 头（或 `Origin` 的主机段）取出主机名与端口 */
export function hostnameOfHost(host: unknown): { name: string; port: number | null };

/** 校验一个请求（HTTP 或 WebSocket 握手）的来源 */
export function checkBridgeRequest(input: {
    headers: Record<string, unknown>;
    localPort?: number;
}): { ok: boolean; reason?: string };
