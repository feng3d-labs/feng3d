import type { Component } from 'vue';

/**
 * 编辑器插件的清单类型（纯数据）。
 *
 * ## 为什么是"清单"而不是"注册调用"
 *
 * DSH 判断一个包是不是插件，靠的是 `package.json` 里的**声明**（`dsh.bundle.patch`），
 * 而不是 "import 它就会产生副作用"。这条与本仓 **R2（零模块级副作用）** 天然一致，
 * 而编辑器此前恰好走反面：`registerLogic` 等注册散在模块顶层，"有哪些功能"取决于
 * import 图的执行顺序。
 *
 * 所以这里把两件事分开：
 *
 * 1. **清单**（本文件的类型 + `builtin.ts` 的字面量）——纯数据，import 它不产生任何注册；
 * 2. **注册**（`registry.ts` 的 `registerPlugins`）——由核心在启动时**显式**调用。
 *
 * 这样"有哪些功能"是可 dump 的清单，而不是执行顺序的副产物（见 issue #170）。
 *
 * ## 怎么加一个插件
 *
 * 写一份清单，把视图用 `view: () => import('...')` 挂上，然后让核心注册它即可——
 * **不需要改 `MainLayout.vue` / `SceneView.vue`**（面板与浮层都按贡献点渲染）。
 */

/**
 * 面板的默认落位（主界面四块 TabPanel）。
 *
 * 它只决定**默认**放在哪里；用户可以把它加到任意位置（TabPanel 的 + 菜单列出全部面板）。
 */
export type PanelPlacement = 'hierarchy' | 'main' | 'project' | 'bottom';

/**
 * 视图来源：一个**动态导入**。
 *
 * 刻意只收 loader（而不是组件本身），有三个好处：
 * - 清单保持纯数据，单元测试不需要 Vue 单文件组件编译（不必为测试打开 SFC 插件）；
 * - 视图按需加载——编辑器启动时不必把所有面板的视图都拉起来（默认最小）；
 * - 与"插件可以后装"一致：清单描述"去哪里取视图"，而不是"现在就持有视图"。
 *
 * @returns 视图模块的 Promise（`{ default: Component }`）
 */
export type PanelViewLoader = () => Promise<unknown>;

/** 面板贡献点：往主界面加一个标签页 */
export interface PanelContribution
{
    /** 面板 id（全局唯一；重复会被注册表拒绝） */
    readonly id: string;

    /** 标签文字的 i18n 键（如 `panels.hierarchy`） */
    readonly labelKey: string;

    /** 视图来源 */
    readonly view: PanelViewLoader;

    /** 默认落位 */
    readonly placement: PanelPlacement;

    /** 同落位内的顺序（数字小的在前；省略按注册顺序） */
    readonly order?: number;

    /** 标签图标（Iconify 名，如 `mdi:file`） */
    readonly icon?: string;
}

/** 场景浮层贡献点：往场景视图上叠一层 UI */
export interface SceneOverlayContribution
{
    /** 浮层 id（全局唯一） */
    readonly id: string;

    /** 视图来源 */
    readonly view: PanelViewLoader;

    /** 叠放顺序（数字小的在下层；省略按注册顺序） */
    readonly order?: number;
}

/** 一个插件贡献什么 */
export interface PluginContributions
{
    /** 主界面面板 */
    readonly panels?: readonly PanelContribution[];

    /** 场景视图上的浮层 */
    readonly sceneOverlays?: readonly SceneOverlayContribution[];
}

/**
 * 插件清单。
 *
 * 内置插件与外部插件**形态完全一致**——区别只是"跟着编辑器一起发"还是"单独安装"
 * （见 issue #169 的启用/禁用与 #171 的版本契约）。
 */
export interface EditorPluginManifest
{
    /** 插件 id（建议与包名一致，如 `@feng3d/editor-plugin-particle`） */
    readonly id: string;

    /** 显示名 */
    readonly name: string;

    /** 说明（一句话讲清这个插件提供什么） */
    readonly description?: string;

    /** 声明所依赖的编辑器 API 版本（issue #171） */
    readonly apiVersion?: string;

    /** 贡献点 */
    readonly contributes: PluginContributions;
}

/**
 * 把清单里的 loader 解析成组件。
 *
 * 视图来源是 loader，真正渲染要交给 `defineAsyncComponent`；这里只做类型收窄，
 * 让调用方不必到处写断言。
 *
 * @param loader 清单里声明的 loader
 * @returns 可直接交给 `defineAsyncComponent` 的 loader
 */
export function toViewComponent(loader: PanelViewLoader): () => Promise<{ default: Component }>
{
    return loader as () => Promise<{ default: Component }>;
}

/**
 * 同名贡献点的处理策略。
 *
 * - `reject`：**当前**的语义——两个插件贡献同名贡献点时注册表直接抛错（宁可启动就报，
 *   也不要两个面板互相覆盖、面板上只少一个而没人知道为什么）；
 * - `layered`：分层覆盖（内置 < 插件 < 用户 patch 层），由 issue #171 引入。
 *
 * 把它放进贡献表而不是只在文档里写一句，是为了让 dump 出来的结果**自描述当前语义**：
 * 调用方不必猜"这里看到的顺序是不是覆盖后的结果"。
 */
export type ContributionOverridePolicy = 'reject' | 'layered';

/** 某个贡献点的来源（"这东西是哪来的"） */
export interface ContributionSource
{
    /** 来源插件的 id */
    readonly source: string;
}

/**
 * 贡献表：把"这个编辑器上装了哪些插件、各自贡献了什么"摊平成可 dump 的数据。
 *
 * 为什么要它：插件一多，"界面上这个东西是哪来的、被谁覆盖了"必须能查，
 * 否则插件化只是把不可控从代码挪到了配置里（issue #168）。
 */
export interface PluginContributionTable
{
    /** 同名贡献点的处理策略（见 {@link ContributionOverridePolicy}） */
    readonly overridePolicy: ContributionOverridePolicy;

    /** 已注册插件及其贡献数量 */
    readonly plugins: readonly {
        readonly id: string;
        readonly name: string;
        readonly description?: string;
        readonly apiVersion?: string;
        readonly panels: number;
        readonly sceneOverlays: number;
    }[];

    /** 面板贡献点（含来源插件与落位） */
    readonly panels: readonly (PanelContribution & ContributionSource)[];

    /** 场景浮层贡献点（含来源插件） */
    readonly sceneOverlays: readonly (SceneOverlayContribution & ContributionSource)[];
}

