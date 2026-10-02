/**
 * 编辑器桥接的 **Vite 插件** —— dev server 侧的接线。
 *
 * ## 它现在只剩接线
 *
 * 命令层（队列 / 长轮询 / 在线页面跟踪 / 五种路由）已抽到 [`relay.mjs`](relay.mjs)，
 * 因为宿主要能用**同一套协议**给生产产物提供通道（`NODE_HOST.md` §5.4：
 * "通道由服务端提供，dev 与生产一致"；15 个 `scripts/editor-*.mjs` 因此零改动）。
 *
 * 这里只做一件事：把 dev server 的 middleware 接到那个中继上。
 *
 * ## 为什么不是 WebSocket（现状）
 *
 * 本仓库 `node_modules` 里没有 `ws` 依赖，手写 RFC 6455 握手与帧解析的收益不抵风险；
 * HTTP 方案零依赖、可 curl 调试，只读场景下延迟完全够用（长轮询下空转时延 ≈ 一次网络往返）。
 * WebSocket 是 `#273` 后续阶段的事——届时**同时**提供 WS 与 HTTP、共享命令层，
 * 老工具链继续走 HTTP。
 */
import { createBridgeRelay } from './relay.mjs';

/**
 * 造 vite 插件（桥接的服务端半，dev 用）。
 *
 * @param {{ prefix?: string }} [options] 选项（`prefix` 覆盖默认路由前缀）
 * @returns {import('vite').Plugin} vite 插件
 */
export function editorBridgePlugin(options = {})
{
    const relay = createBridgeRelay(options);

    return {
        name: 'feng3d-editor-bridge',
        apply: 'serve',
        configureServer(server)
        {
            server.middlewares.use((req, res, next) =>
            {
                // 中继同步告诉我们"是不是它的路由"；匹配到之后它自己异步处理（长轮询会挂起）
                if (!relay.handle(req, res)) next();
            });
        },
    };
}
