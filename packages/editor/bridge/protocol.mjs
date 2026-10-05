/**
 * 桥接协议的**版本契约**（#273 P2 / D9 的最后一条）。
 *
 * ## 为什么需要它
 *
 * 页面与宿主/服务端是**分开演进**的两端：页面可能来自**旧构建产物**、服务端可能已经升级
 * （`NODE_HOST.md` 定的"通道由服务端提供、dev 与生产一致"恰恰意味着两者不一定同时更新）。
 * 版本不对时**必须当场拒**，而不是让它们在"半懂不懂"的协议上继续互相发消息——
 * 那种故障的表现是"某些方法时好时坏"，是最难查的一类。
 *
 * ## 与 `src/plugins/apiVersion.ts` 的分工
 *
 * | 契约 | 管什么 | 什么时候报错 |
 * |---|---|---|
 * | `apiVersion.ts` | **插件**与编辑器 API 的兼容 | 安装插件时 |
 * | 本文件 | **页面与桥接**的协议兼容 | **握手时**（`hello`） |
 *
 * 两者用**同一套语义**：说清"要什么、现在是什么"，而不是只回一个"失败"。
 *
 * ## 单一来源
 *
 * 页面与服务端都 import 这一个常量，所以"人手改漏一边"不可能发生；
 * 真正会出现的场景是"页面是旧产物"——那正是握手校验要拦的。
 * （`bridgeSocket.mjs` 在服务端侧同目录 import 它；页面侧走 `../../bridge/protocol.mjs`。）
 */

/** 当前桥接协议版本（页面与服务端**共用**这一个来源） */
export const BRIDGE_PROTOCOL_VERSION = '1.0.0';

/**
 * 校验页面在 `hello` 里声明的协议版本。
 *
 * @param {unknown} declared `hello` 里带的值
 * @param {string} [expected] 期望版本（缺省＝当前版本；测试用它模拟"服务端是别的版本"）
 * @returns {{ ok: boolean, reason?: string }} 结论（不通过时 `reason` 说清两边各是什么）
 */
export function checkBridgeProtocolVersion(declared, expected = BRIDGE_PROTOCOL_VERSION)
{
    if (typeof declared !== 'string' || declared.length === 0)
    {
        return { ok: false, reason: `没声明桥接协议版本（服务端要 ${expected}）` };
    }

    if (declared !== expected)
    {
        return { ok: false, reason: `桥接协议版本不符：页面声明 ${declared}，服务端要 ${expected}` };
    }

    return { ok: true };
}
