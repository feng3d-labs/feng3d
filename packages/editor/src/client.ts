/**
 * 编辑器界面端（Web 半）公开面 —— 子路径入口 `"./client"`（#276 阶段 3）。
 *
 * ## 谁 import 它
 *
 * **插件包的 client 半**（`package.json` 的 `"./client"`）。它需要的是：
 *
 * | 需要什么 | 从哪来 |
 * |---|---|
 * | 插槽契约（座位名、`SlotMap` 模块增强） | `./plugins/slots` |
 * | 落位 ↔ 座位映射 | `./plugins/panelSlot` |
 * | 清单形状（写自己贡献什么） | `./plugins/types` |
 * | API 版本契约（声明依赖哪个版本） | `./plugins/apiVersion` |
 *
 * ## 刻意**不**导出什么
 *
 * 不导出 `./plugins`（那是编辑器**自己**的装载器：`installBuiltinPlugins()` 等）——
 * 插件不该去装别的插件。宿主侧的东西（版本核对、包声明校验）在包根 `"."`。
 *
 * 界面端允许依赖 Vue / Element Plus（它就是画界面的），这与 runtime 端的禁令不同
 * （见 `scripts/check-runtime-half-deps.mjs`）。
 */

export * from './plugins/slots';
export {
    PANEL_PLACEMENTS,
    PANEL_SLOTS,
    PANEL_SLOT_BY_PLACEMENT,
    isPanelSlot,
    normalizePanelSlot,
    resolvePanelSlot,
} from './plugins/panelSlot';
export type { PanelSlot } from './plugins/panelSlot';
export { EDITOR_PLUGIN_API_VERSION, checkApiVersion } from './plugins/apiVersion';
export { toViewComponent } from './plugins/types';
export type {
    BridgeMethodContribution,
    ContributionSource,
    EditorPluginManifest,
    LogicContribution,
    ObjectViewContribution,
    PanelContribution,
    PanelContributionFields,
    PanelPlacement,
    PanelViewLoader,
    PluginContributions,
    PluginLayer,
    SceneOverlayContribution,
    TypeAttributeViewContribution,
} from './plugins/types';
