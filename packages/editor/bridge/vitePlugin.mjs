/**
 * 编辑器桥接的 **Vite 插件** —— dev server 侧的接线。
 *
 * ## 它现在只剩接线
 *
 * 命令层抽在 [`relay.mjs`](relay.mjs)（队列 / 长轮询 / 在线页面跟踪 / 五种 HTTP 路由），
 * WebSocket 通道抽在 [`bridgeSocket.mjs`](bridgeSocket.mjs)——**两处都是纯实现（不依赖 cordis）**，
 * 于是宿主（`bin/serve.mjs`）与 dev server 用的是**同一份**。
 * 这正是 `NODE_HOST.md` §5.4"通道由服务端提供，dev 与生产一致"要的东西，
 * 15 个 `scripts/editor-*.mjs` 因此零改动。
 *
 * 这里只做两件接线：
 *
 * 1. dev server 的 middleware → HTTP 中继；
 * 2. dev server 的 http server → WebSocket 通道（`upgrade` 挂在**同一端口**上）。
 *
 * 第 2 条是 #273 第三阶段补上的：此前 dev 只有 HTTP，于是"页面被**推送**"只在生产成立——
 * 而开发者天天用的是 dev。现在两边都有推送。
 *
 * ## 与 HTTP 的关系
 *
 * **同时**提供 WS 与 HTTP、共享命令层；老工具链继续走 HTTP。浏览器侧优先连 WS，
 * 连不上就退回轮询（见 `src/bridge/bridgeSocket.ts` 与 `src/bridge/EditorBridge.ts`）。
 */
import { createBridgeSocket } from './bridgeSocket.mjs';
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

            // WebSocket 通道：挂 dev server 的 http server（同一端口，不额外开端口）
            if (server.httpServer)
            {
                const socket = createBridgeSocket({ relay });

                socket.attach(server.httpServer);
                server.httpServer.on('close', () => socket.stop());
            }
        },
    };
}
