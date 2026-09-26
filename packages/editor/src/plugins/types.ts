import type { Component } from 'vue';
import type { AttributeTypeDefinition, DataTypeSchema, ObjectViewConfigMap } from 'feng3d';

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

/**
 * 清单里持有的 Logic 类引用。
 *
 * **刻意不声明构造签名**：编辑器里每个 Logic 都是 `protected constructor`
 * （只有 `logic()` 能创建，见 AGENTS.md §3），而 TS 不允许把 protected 构造的类赋给
 * 任何构造签名——实测 `new (data: never) => unknown` 与
 * `abstract new (data: never) => unknown` 都报 TS2322「Cannot assign a 'protected'
 * constructor type to a 'public' constructor type」。若强行声明构造签名，
 * 清单里 23 处都得写 `as unknown as`，数据就不再是数据了。
 *
 * 所以类型只描述"这是一个类引用"，把构造签名的断言收到 `install.ts`
 * **唯一一处注册边界**；而后者本来就要把清单交给 `registerLogic`（它接的正是构造签名）。
 *
 * `prototype` 不是给注册用的，它是**结构判据**：类与普通函数都有、箭头函数没有，
 * 于是"误把任意对象写进清单"会被类型检查挡住（写成 `ArbitraryTypeValue` 也可以，
 * 但凡声明了 `name` 的对象都能满足，太松）。
 */
export interface LogicClassRef
{
    /** 类名（诊断用；清单里的 `name` 应与它对得上，有测试盯着） */
    readonly name: string;

    /** 类原型（结构判据，注册时不读） */
    readonly prototype: object;
}

/**
 * Logic 贡献点：声明"某个 `__type__` 由哪个 Logic 实现"。
 *
 * 为什么 Logic 也要走清单：`registerLogic` 写在模块顶层时，
 * "编辑器有哪些 Logic"取决于 **import 图的执行顺序**——只有真跑起来才知道，
 * 漏 import 一个文件就等于该类型静默失去行为（`logic()` 返回 null）。
 * 搬进清单后这份清单是可 dump、可检查的数据（issue #170）。
 *
 * 与面板/浮层的区别：这里放的是**类本身**而不是动态导入的 loader——
 * 清单被安装时就要注册，注册需要拿到类；而 Logic 类本就在编辑器的
 * import 图里（编辑器自己的功能），没有按需加载的需要。
 */
export interface LogicContribution
{
    /** `__type__` 字面量（全局唯一；重复会被注册表拒绝） */
    readonly name: string;

    /** 实现该类型的 Logic 类 */
    readonly logic: LogicClassRef;
}

/** 一个插件贡献什么 */
export interface PluginContributions
{
    /** 主界面面板 */
    readonly panels?: readonly PanelContribution[];

    /** 场景视图上的浮层 */
    readonly sceneOverlays?: readonly SceneOverlayContribution[];

    /** Logic（`__type__` → Logic 类） */
    readonly logics?: readonly LogicContribution[];

    /** 属性面板（objectview）的类型配置 */
    readonly objectView?: ObjectViewContribution;

    /** 桥接方法（AI 通道） */
    readonly bridgeMethods?: readonly BridgeMethodContribution[];
}

/**
 * 桥接方法贡献点：往 AI 桥接的方法表里加一个方法。
 *
 * 为什么桥接方法也要归插件：方法的**可用性应当跟着功能走**——关掉变换工具插件后
 * `editor.setTool` 就该从方法表里消失，而不是留着一个必然报错的方法。
 * 方法表是**每次请求现算**的（见 `bridge/EditorBridge.ts`），所以关掉立刻生效。
 *
 * 处理器就地放在清单里（而不是再套一层 loader）：这些方法体量很小、且必须与插件同生共死。
 */
export interface BridgeMethodContribution
{
    /** 方法名（如 `editor.setTool`；重复会被注册表拒绝） */
    readonly name: string;

    /**
     * 是否是写通道方法（受「AI 写能力」开关约束、并把本次新出现的报错带回去）。
     *
     * 像 `editor.setTool` 这种只改编辑器 UI 状态、不碰场景数据的，按只读方法处理
     * ——与核心的 `selection.set` 同一口径。
     */
    readonly write?: boolean;

    /** 处理器（与核心方法同签名） */
    readonly handler: (params: Record<string, unknown>) => unknown | Promise<unknown>;
}

/**
 * 属性面板的默认视图类名。
 *
 * 对应 `objectview.defaultBaseObjectViewClass` 等四个字段；
 * 用对象而不是四个平铺的可选字段，是为了在贡献表里能整体报告"谁定了默认视图"。
 */
export interface ObjectViewDefaults
{
    /** 基础类型（字符串/数字等）对象视图的默认控件 */
    readonly baseObjectView?: string;

    /** 对象视图的默认控件 */
    readonly objectView?: string;

    /** 属性视图的默认控件 */
    readonly objectAttributeView?: string;

    /** 属性块视图的默认控件 */
    readonly objectAttributeBlockView?: string;
}

/** 类型 → 控件的一条映射（`objectview.setDefaultTypeAttributeView`） */
export interface TypeAttributeViewContribution
{
    /**
     * 类型名。
     *
     * 两个来源共用这一张表：字段描述表里的 `control`（`number` / `Vector3` / `Enum` …）
     * 与人工配置里覆盖的 `type`。
     */
    readonly type: string;

    /** 控件 */
    readonly view: AttributeTypeDefinition;
}

/**
 * 属性面板（objectview）的配置贡献。
 *
 * 改造前这些东西写在 `src/configs/ObjectViewConfig.ts` 的**模块顶层**（20 多条
 * `setDefaultTypeAttributeView` 调用），import 该模块即产生副作用——issue #170 把它变成声明。
 *
 * 顺带解决了一个具体麻烦：配置文件因为"import 它要拉整个 feng3d"而**无法被单元测试直接 import**，
 * 于是有个用例只能对着源码文本做正则匹配（核对每个用到的控件种类都注册了）。
 * 变成纯数据后，那个用例可以直接 import 这份数据来核对。
 */
export interface ObjectViewContribution
{
    /** 默认视图类名 */
    readonly defaults?: ObjectViewDefaults;

    /** 类型 → 控件 */
    readonly typeAttributeViews?: readonly TypeAttributeViewContribution[];

    /** 字段描述表（由 `scripts/gen-objectview-schema.mjs` 从 TS 类型生成） */
    readonly dataTypeSchema?: DataTypeSchema;

    /** 人工配置（分组 / 显示名 / 取值范围 / 对象级视图） */
    readonly objectViewConfig?: ObjectViewConfigMap;
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

    /**
     * 装上但默认不启用（issue #169）。
     *
     * 省略即默认启用。用户显式开关过以后以用户为准——三种状态（清单默认 / 用户开关 / 已安装）
     * 的推导规则见 `plugins/state.ts` 的 `resolvePluginEnabled`。
     */
    readonly defaultEnabled?: boolean;

    /**
     * 必需插件：不允许被关掉。
     *
     * 用在"关掉就等于编辑器坏了"的插件上（如属性面板配置——关了检查器就没控件可用）。
     * 它对用户开关是**硬约束**（`setPluginEnabled` 会拒绝），不是建议。
     */
    readonly required?: boolean;

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

    /** 已注册插件及其贡献数量（**含被禁用的**——好把它们开回来） */
    readonly plugins: readonly {
        readonly id: string;
        readonly name: string;
        readonly description?: string;
        readonly apiVersion?: string;
        /** 当前是否启用（已按 required / 用户开关 / 清单默认解析） */
        readonly enabled: boolean;
        /** 是否必需插件（不可关） */
        readonly required: boolean;
        /** 清单声明的默认状态 */
        readonly defaultEnabled: boolean;
        /** 用户是否显式设过开关（没设过即"跟着清单走"） */
        readonly userSwitch: boolean;
        readonly panels: number;
        readonly sceneOverlays: number;
        readonly logics: number;
        readonly typeAttributeViews: number;
        readonly bridgeMethods: number;
    }[];

    /** 面板贡献点（含来源插件与落位） */
    readonly panels: readonly (PanelContribution & ContributionSource)[];

    /** 场景浮层贡献点（含来源插件） */
    readonly sceneOverlays: readonly (SceneOverlayContribution & ContributionSource)[];

    /**
     * Logic 贡献点（含来源插件）。
     *
     * 只报**类型名与来源**，不报类本身：dump 出来要能直接读，
     * 而一个类序列化出来是一串压缩后的函数源码（见 `test/pluginTable.spec.ts` 的守门用例）。
     */
    readonly logics: readonly (ContributionSource & { readonly name: string })[];

    /**
     * 属性面板「类型 → 控件」的映射（含来源插件）。
     *
     * 这是"面板上那个下拉/颜色选择器是哪来的"的答案：控件的**注册**在
     * `registerObjectViewComponents()`（入口显式调用），而**类型到控件的指派**在这儿。
     */
    readonly typeAttributeViews: readonly (ContributionSource & {
        readonly type: string;
        readonly component: string;
    })[];

    /**
     * 桥接方法贡献点（含来源插件）。
     *
     * 只报名字与是否写通道，不报处理器（函数，dump 出来没意义）。
     * 关掉插件后它的方法**不在**这个列表里，也不在桥接的方法表里。
     */
    readonly bridgeMethods: readonly (ContributionSource & {
        readonly name: string;
        readonly write: boolean;
    })[];
}

