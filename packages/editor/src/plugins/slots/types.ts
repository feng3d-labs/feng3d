import type { PanelPlacement } from '../types';

/**
 * 编辑器插槽（slots）契约的**类型面**（#276 S1）。
 *
 * ## 它解决什么
 *
 * 改造前"一个面板放在界面哪一格"是贡献点清单里的 `placement` 字段，而四个落位写死在
 * `MainLayout.vue` 里——**新增一类界面位置（工具栏 / 状态栏 / 右键菜单）要改核心类型**。
 * 插槽把它变成"座位名 + 模块增强"：座位由**拥有那块布局的一方**声明（declaring is claiming），
 * 插件往座位上注册，核心不必认识"界面一共能有哪几类位置"。
 *
 * ## 与贡献点清单的分工（决策稿 §3.3，别混为一谈）
 *
 * - **贡献点的种类**（`panels` / `logics` / `bridgeMethods` …）留在清单里：它是**数据契约**，
 *   要可 dump、可层叠加、可 patch、可做 API 版本契约；
 * - **界面位置**（哪个座位）交给插槽：它是**渲染契约**。
 *
 * 所以五类里只有 `panels` / `sceneOverlays` 会被投影到插槽；`logics` / `objectView` /
 * `bridgeMethods` 留在清单（它们写的是引擎全局注册表与协议方法表，跟"界面哪一格"无关）。
 * 详见 [PLUGIN_TRIPLE_HALF.md](../../../docs/PLUGIN_TRIPLE_HALF.md) §3。
 *
 * ## 怎么加一个座位
 *
 * 声明即认领——座位名进 `SlotMap`，同时进运行期的座位表 `SLOT_KINDS`
 * （两处由编译器双向锁住，见 `registry.ts` 的 `SLOT_KINDS`）：
 *
 * ```ts
 * declare module '../plugins/slots' {
 *     interface SlotMap {
 *         'toolbar.right': { kind: 'list'; scope: 'root'; owner: ToolbarOwnerProps };
 *     }
 * }
 * ```
 *
 * 本阶段（S1）只落**类型与运行骨架**，核心座位的 `declare` 调用由 S2 接入
 * `MainLayout.vue` / `SceneView.vue`。
 */

/** 座位的容纳方式 */
export type SlotKind = 'single' | 'list';

/**
 * 座位的作用域。
 *
 * 现在只有 `root`（全局一个）。这一维是**有意留着的**：DSH 用它支持"同一个座位在多个实例上各有一份"
 * （其 store 实例轴按 `handle × scope` 建缓存）。编辑器目前没有这种需求，先不做，但类型不封死。
 */
export type SlotScope = 'root';

/**
 * 座位规格。
 *
 * `owner` 是**宿主（声明方）提供给占用者的 props 接口**——"这个座位会交给你什么"。
 * 它是纯类型设施：运行期不读它（占用者由渲染方按类型渲染）。
 */
export interface SlotSpec
{
    /** 容纳方式 */
    readonly kind: SlotKind;

    /** 作用域 */
    readonly scope: SlotScope;

    /** 宿主提供给占用者的 props（类型占位） */
    readonly owner?: unknown;
}

/** 面板座位交给占用者的 props */
export interface PanelSlotOwnerProps
{
    /** 该座位对应的主界面落位（四个座位与四块一一对应） */
    readonly placement: PanelPlacement;
}

/** 场景浮层座位交给占用者的 props */
export interface SceneOverlaySlotOwnerProps
{
    /** 该占用自己的叠放顺序（数字小的在下层） */
    readonly order: number;
}

/** 应用根座位交给占用者的 props（根座位不给什么——整屏布局由占用者自己组织） */
export interface AppRootSlotOwnerProps
{
    /** 标记字段：占用者拥有一整屏，不从宿主接收内容 */
    readonly children?: never;
}

/**
 * 插槽声明表：**核心与插件通过模块增强往这里加座位**。
 *
 * 键就是座位名（如 `panel.hierarchy`）。它同时约束 `SlotName` 与运行期座位表 `SLOT_KINDS`
 * ——少写一个或多写一个都过不了类型检查。
 */
export interface SlotMap
{
    /**
     * 应用根座位（**`single`**）：整屏布局由占用者渲染。
     *
     * 与 DSH 的 `root` 同一位次，也**照搬它的那条警告**：**不要往单座位里注册第二个**——
     * 第二个不会并排，而是让整个框架的座位一起消失。要自己的浮层请用 `scene.overlay`（`list`）。
     * 本仓把"第二个"从"遮蔽"改成"**直接报错**"（见 `registry.ts` 的类注释）。
     */
    'app.root': { kind: 'single'; scope: 'root'; owner: AppRootSlotOwnerProps };

    /** 层级面板座位（主界面左上的标签区） */
    'panel.hierarchy': { kind: 'list'; scope: 'root'; owner: PanelSlotOwnerProps };

    /** 场景 / 主视图面板座位 */
    'panel.main': { kind: 'list'; scope: 'root'; owner: PanelSlotOwnerProps };

    /** 项目面板座位 */
    'panel.project': { kind: 'list'; scope: 'root'; owner: PanelSlotOwnerProps };

    /** 检查器等底部面板座位 */
    'panel.bottom': { kind: 'list'; scope: 'root'; owner: PanelSlotOwnerProps };

    /**
     * 场景视图上的浮层座位。
     *
     * `list`：可叠加、可多个；**点击穿透由占用者自己决定**（DSH 的 `shell.overlay` 同一口径：
     * 默认穿透，占用者要交互时自己声明）。
     */
    'scene.overlay': { kind: 'list'; scope: 'root'; owner: SceneOverlaySlotOwnerProps };
}

/** 座位名（`SlotMap` 的键） */
export type SlotName = keyof SlotMap & string;

/**
 * 一条插槽占用。
 *
 * `value` 是**占用载荷**：插槽层不解释它（面板座位里是视图 loader、浮层里是组件或任意数据）。
 * 这与 `PanelContribution.view` 一样是刻意的——插槽层保持纯数据/纯结构，渲染由渲染方决定。
 */
export interface SlotEntry<T = unknown>
{
    /** 座位名 */
    readonly slot: SlotName;

    /** 座位内唯一的占用者 id（通常是贡献点 id） */
    readonly id: string;

    /** 排序：同座位内数字小的在前；相同则按注册顺序 */
    readonly order: number;

    /** 占用载荷 */
    readonly value: T;

    /** 来源插件 id（诊断用："这东西是哪来的"） */
    readonly source: string;
}

/** 注册一条占用时要给的字段（`slot` 由调用参数给，不进这里） */
export interface SlotEntryDraft<T = unknown>
{
    /** 座位内唯一的占用者 id */
    readonly id: string;

    /** 排序（省略为 0） */
    readonly order?: number;

    /** 占用载荷 */
    readonly value?: T;

    /** 来源插件 id */
    readonly source: string;
}

/**
 * 插槽现状的**JSON 安全快照**。
 *
 * 只报结构性字段，**不报 `value`**——它可能是视图 loader 或组件（dump 出来是一串压缩过的函数源码，
 * 没有意义，还会把快照变成不可序列化的东西）。这与贡献表"只报类型名与来源"同一条纪律。
 */
export interface SlotSnapshot
{
    /** 已声明的座位（按声明顺序） */
    readonly declared: readonly SlotName[];

    /** 各座位上的占用（按座位、再按生效顺序） */
    readonly entries: readonly {
        readonly slot: SlotName;
        readonly id: string;
        readonly order: number;
        readonly source: string;
    }[];
}
