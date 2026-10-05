/**
 * `protocol.mjs` 的类型声明。
 *
 * 页面侧（TS）要 import `../../bridge/protocol.mjs` 取版本常量，所以配对一份 `.d.mts`——
 * 与 `security.d.mts` 同一个理由（`bridge/` 下是纯 `.mjs`，不经打包给宿主/插件共用）。
 */

/** 当前桥接协议版本 */
export const BRIDGE_PROTOCOL_VERSION: string;

/** 校验页面在 `hello` 里声明的协议版本 */
export function checkBridgeProtocolVersion(declared: unknown, expected?: string): { ok: boolean; reason?: string };
