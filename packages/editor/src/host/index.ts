/**
 * 宿主侧（Node 端）公开面 —— 包根入口 `"."`（#276 阶段 3）。
 *
 * ## 谁 import 它
 *
 * - **宿主进程**（#272 落地后）：装载插件包、核对版本、把宿主半挂进 cordis 树；
 * - **插件包的宿主半**（`package.json` 的 `"."`）：声明自己的元数据与宿主侧服务。
 *
 * ## 这一层刻意**不含**什么
 *
 * 不含 Vue、不含插槽渲染、不含 DOM：那些是 `./client`（界面端）的事。
 * 宿主跑在 Node 里，把界面层拖进来会让"宿主半能在无浏览器环境装载"这条失去意义。
 * 边界由包 `exports` 与 `check-editor-module-effects` / `check-runtime-half-deps` 三类门禁守着。
 */

export * from './package';
export {
    EDITOR_PLUGIN_API_VERSION,
    assertPluginApiVersions,
    checkApiVersion,
    parseVersion,
} from '../plugins/apiVersion';
export type { ApiVersionCheck, ParsedVersion } from '../plugins/apiVersion';
export type {
    BridgeMethodContribution,
    EditorPluginManifest,
    LogicContribution,
    ObjectViewContribution,
    PanelContribution,
    PluginContributions,
    PluginLayer,
    SceneOverlayContribution,
} from '../plugins/types';
