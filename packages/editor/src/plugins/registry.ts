import type {
    BridgeMethodContribution,
    EditorPluginManifest,
    LogicContribution,
    PanelContribution,
    PanelPlacement,
    PluginContributionTable,
    PluginLayer,
    SceneOverlayContribution,
    TypeAttributeViewContribution,
} from './types';
import { assertPluginApiVersions } from './apiVersion';
import { getOverriddenPluginIds, getPatchEnabled, getPluginOverride, resolvePluginName } from './overrides';
import { findSameLayerConflicts, pickByLayer } from './layers';
import type { RegisteredContribution, RegisteredPlugin } from './layers';
import { getPatchState } from './patchState';
import { hasUserSwitch, resolvePluginEnabled } from './state';

/**
 * 编辑器插件的注册表。
 *
 * 核心只认这张表，不认具体功能：「主界面有哪些面板」「场景上有哪些浮层」都从这里查。
 * 因此**新增一个面板不需要改 `MainLayout.vue` / `SceneView.vue`**，只需要一份清单 + 注册它。
 *
 * ## 与 R2 的关系
 *
 * 注册表是**显式**的：本模块 import 进来什么也不做，必须由核心调用 {@link registerPlugins}。
 * 对比旧写法（`registerLogic` 等散在模块顶层），这里的好处是"有哪些功能"变成可 dump 的
 * 数据，而不是 import 顺序的副产物。
 *
 * ## 层叠加（issue #171）
 *
 * 清单带**层**（内置 < 插件 < 用户）。同一个贡献点 id 出现在多层时上层赢，并记下被覆盖的
 * 下层来源；同一层内重复 id 仍是错误（那是两个平级插件在抢同一个位置）。
 */

/** 已登记的插件（按登记顺序：内置先、用户 patch 最后） */
const plugins: RegisteredPlugin[] = [];

/**
 * 登记插件清单。
 *
 * 幂等：同 id 的插件重复登记会被跳过（开发期模块热替换、多次 install 都不会重复贡献）。
 *
 * **事务性**：三项校验（API 版本契约、同级冲突、赢家完整性）都在提交之前做，失败时注册表保持原样。
 * 这条不是洁癖——先 push 再校验的写法实测会留下半套注册：一次失败的登记把冲突插件留在表里，
 * 之后**每一次**登记（哪怕与冲突无关）都会报同一个"幽灵冲突"，现场极难判断。
 *
 * 登记顺序还有一层意义：`registerLogic` 是"后写覆盖先写"，而层序要求上层赢——
 * 只要**层越高的越晚登记**（内置 → 插件 → 用户 patch 就是这个顺序），两者天然一致。
 *
 * @param manifests 插件清单
 * @param layer 所在层（默认 `plugin`；内置走 `installBuiltinPlugins`，用户 patch 走 `patch.ts`）
 * @throws API 版本不兼容、或同一层内出现重复贡献点 id 时抛出，报错**点名双方**
 */
export function registerPlugins(manifests: readonly EditorPluginManifest[], layer: PluginLayer = 'plugin'): void
{
    const added: RegisteredPlugin[] = [];
    for (const manifest of manifests)
    {
        if (plugins.some((plugin) => plugin.manifest.id === manifest.id)) continue;
        if (added.some((plugin) => plugin.manifest.id === manifest.id)) continue;
        added.push({ manifest, layer });
    }

    if (added.length === 0) return;

    // 契约先查：版本对不上的插件根本不该进入注册表
    assertPluginApiVersions(added.map((entry) => entry.manifest));

    const candidates = [...plugins, ...added];
    const conflicts = [
        ...findSameLayerConflicts(contributionEntries(candidates, (manifest) => manifest.contributes.panels, (panel) => panel.id), (panel) => panel.id, 'panel'),
        ...findSameLayerConflicts(contributionEntries(candidates, (manifest) => manifest.contributes.sceneOverlays, (overlay) => overlay.id), (overlay) => overlay.id, 'sceneOverlay'),
        ...findSameLayerConflicts(contributionEntries(candidates, (manifest) => manifest.contributes.logics, (entry) => entry.name), (entry) => entry.name, 'logic'),
        ...findSameLayerConflicts(contributionEntries(candidates, (manifest) => manifest.contributes.objectView?.typeAttributeViews, (entry) => entry.type), (entry) => entry.type, 'typeAttributeView'),
        ...findSameLayerConflicts(contributionEntries(candidates, (manifest) => manifest.contributes.bridgeMethods, (entry) => entry.name), (entry) => entry.name, 'bridgeMethod'),
    ];

    if (conflicts.length > 0)
    {
        throw new Error(`插件贡献点 id 同层冲突：${conflicts.join('、')}——`
            + '同一层里每个贡献点只能由一个插件提供（想覆盖它请用更高层：内置 < 插件 < 用户）');
    }

    plugins.push(...added);
}

/**
 * 把插件清单摊成带来源的贡献点（登记表内部用）。
 *
 * @param entries 已登记的插件
 * @param pick 从清单里取某一类贡献点
 * @param _idOf 取 id 的函数（本函数只负责摊平，排序/归并在 `pickByLayer` 里）
 * @returns 带 `source` 与 `layer` 的贡献点
 */
function contributionEntries<T>(
    entries: readonly RegisteredPlugin[],
    pick: (manifest: EditorPluginManifest) => readonly T[] | undefined,
    _idOf: (contribution: T) => string,
): readonly RegisteredContribution<T>[]
{
    const result: RegisteredContribution<T>[] = [];
    for (const entry of entries)
    {
        for (const contribution of pick(entry.manifest) ?? [])
        {
            result.push({ contribution, source: entry.manifest.id, layer: entry.layer });
        }
    }

    return result;
}

/**
 * 取**启用插件**的某一类贡献点，并按层归并（上层赢 + 记录被覆盖者）。
 *
 * @param pick 从清单里取某一类贡献点
 * @param idOf 取 id 的函数
 * @returns 每个 id 只留一条，带 `source` / `layer` / `overriddenBy`
 */
function enabledContributions<T>(
    pick: (manifest: EditorPluginManifest) => readonly T[] | undefined,
    idOf: (contribution: T) => string,
): readonly (T & { readonly source: string; readonly layer: PluginLayer; readonly overriddenBy: readonly string[] })[]
{
    return pickByLayer(contributionEntries(getEnabledEntries(), pick, idOf), idOf);
}

/** 已登记的插件条目（只读，**含被禁用的**——设置面板要能列出它们才好开回来） */
export function getPluginEntries(): readonly RegisteredPlugin[]
{
    return plugins;
}

/** 已登记的插件清单（只读视图） */
export function getPlugins(): readonly EditorPluginManifest[]
{
    return plugins.map((entry) => entry.manifest);
}

/** 启用的插件条目 */
export function getEnabledEntries(): readonly RegisteredPlugin[]
{
    return plugins.filter((entry) => resolvePluginEnabled(entry.manifest));
}

/**
 * **启用的**插件清单（按登记顺序）。
 *
 * 核心的每一次贡献点查询都经过它：关掉一个插件，它的面板、浮层、Logic、属性控件、
 * 桥接方法一起从各处消失（issue #169 的"关干净"）。
 */
export function getEnabledPlugins(): readonly EditorPluginManifest[]
{
    return getEnabledEntries().map((entry) => entry.manifest);
}

/** 插件状态（"存在吗 / 在哪层 / 启用吗 / 这个状态从哪来 / 名字被谁改过"） */
export interface PluginStatus
{
    /** 插件清单 */
    readonly manifest: EditorPluginManifest;

    /** 所在层 */
    readonly layer: PluginLayer;

    /** 生效的显示名（用户 patch 改过就是改后的） */
    readonly name: string;

    /** 清单里写的显示名 */
    readonly manifestName: string;

    /** 当前是否启用（已解析） */
    readonly enabled: boolean;

    /** 是否是必需插件（不可关） */
    readonly required: boolean;

    /** 清单声明的默认状态 */
    readonly defaultEnabled: boolean;

    /** 设置面板里是否显式设过开关 */
    readonly userSwitch: boolean;

    /** 用户 patch 设的启用状态（没设时为 `undefined`） */
    readonly patchEnabled: boolean | undefined;

    /** 用户 patch 改的显示名（没改时为 `undefined`） */
    readonly patchName: string | undefined;
}

/**
 * 某个已登记插件的状态。
 *
 * 为什么把这些字段分开报：看到 `enabled: false` 时，调用方分不清是"设置面板关的"、
 * "patch 关的"还是"清单默认关的"——三者的处理方式完全不同。名字同理。
 *
 * @param pluginId 插件 id
 * @returns 状态；未登记时返回 `null`
 */
export function getPluginStatus(pluginId: string): PluginStatus | null
{
    const entry = plugins.find((plugin) => plugin.manifest.id === pluginId);
    if (!entry) return null;

    const override = getPluginOverride(pluginId);

    return {
        manifest: entry.manifest,
        layer: entry.layer,
        name: resolvePluginName(entry.manifest),
        manifestName: entry.manifest.name,
        enabled: resolvePluginEnabled(entry.manifest),
        required: entry.manifest.required === true,
        defaultEnabled: entry.manifest.defaultEnabled ?? true,
        userSwitch: hasUserSwitch(pluginId),
        patchEnabled: getPatchEnabled(pluginId),
        patchName: override?.name,
    };
}

/** 落位的固定顺序（扁平列表按它分组，保证与插件登记顺序无关） */
const PLACEMENT_ORDER: readonly PanelPlacement[] = ['hierarchy', 'main', 'project', 'bottom'];

/**
 * 面板排序：**先按落位**（固定顺序，见 {@link PLACEMENT_ORDER}）**再按 `order`**，最后按登记顺序。
 *
 * 抽成函数是必须的：`getPanelContributions()` 与 `getContributionTable()` 都在回答
 * 「面板列表是什么」，两处各写一遍排序迟早给出不同顺序——实测就踩过：贡献表按登记顺序给，
 * 而面板列表按落位给，同一个问题两个 API 两种答案。
 *
 * @param panels 待排序的面板（数组顺序即登记顺序）
 * @returns 排好序的新数组
 */
function sortPanels<T extends PanelContribution>(panels: readonly T[]): T[]
{
    return panels
        .map((panel, index) => ({ panel, index }))
        .sort((a, b) =>
            (PLACEMENT_ORDER.indexOf(a.panel.placement) - PLACEMENT_ORDER.indexOf(b.panel.placement))
            || ((a.panel.order ?? 0) - (b.panel.order ?? 0))
            || (a.index - b.index))
        .map((entry) => entry.panel);
}

/**
 * 浮层排序：按 `order` 再按登记顺序（浮层没有落位）。
 *
 * @param overlays 待排序的浮层（数组顺序即登记顺序）
 * @returns 排好序的新数组
 */
function sortOverlays<T extends SceneOverlayContribution>(overlays: readonly T[]): T[]
{
    return overlays
        .map((overlay, index) => ({ overlay, index }))
        .sort((a, b) => ((a.overlay.order ?? 0) - (b.overlay.order ?? 0)) || (a.index - b.index))
        .map((entry) => entry.overlay);
}

/**
 * 全部面板贡献点（**只含启用插件**的，且已按层归并）。
 *
 * 排序规则见 {@link sortPanels}。这样得到的扁平列表是稳定的——它就是 TabPanel 的 + 菜单顺序，
 * 不该因为某个插件先登记谁而变。单个落位内的顺序则由 `order` 决定。
 */
export function getPanelContributions(): readonly (PanelContribution & { readonly source: string; readonly layer: PluginLayer; readonly overriddenBy: readonly string[] })[]
{
    return sortPanels(enabledContributions((manifest) => manifest.contributes.panels, (panel) => panel.id));
}

/**
 * 某个落位上的面板贡献点。
 *
 * @param placement 落位
 * @returns 该落位上的面板（按 `order`）
 */
export function getPanelContributionsAt(placement: PanelPlacement): readonly PanelContribution[]
{
    return getPanelContributions().filter((panel) => panel.placement === placement);
}

/** 全部场景浮层贡献点（只含启用插件、已按层归并；排序规则见 {@link sortOverlays}） */
export function getSceneOverlays(): readonly (SceneOverlayContribution & { readonly source: string; readonly layer: PluginLayer; readonly overriddenBy: readonly string[] })[]
{
    return sortOverlays(enabledContributions((manifest) => manifest.contributes.sceneOverlays, (overlay) => overlay.id));
}

/**
 * 全部 Logic 贡献点（只含启用插件、已按层归并）。
 *
 * 顺序即**登记顺序**并刻意不排序：`registerLogic` 是后写覆盖先写的语义，
 * 排序会让 dump 出来的顺序与真实生效顺序不一致（而这里报的就是"谁最终生效"的前提）。
 */
export function getLogicContributions(): readonly LogicContribution[]
{
    return enabledContributions((manifest) => manifest.contributes.logics, (entry) => entry.name);
}

/**
 * 全部桥接方法贡献点（只含启用插件、已按层归并）。
 *
 * 桥接的方法表**每次请求现算**（见 `bridge/EditorBridge.ts`），所以关掉插件后
 * 它的方法立刻从表里消失——这正是"关干净"在桥接侧的体现。
 */
export function getBridgeMethodContributions(): readonly BridgeMethodContribution[]
{
    return enabledContributions((manifest) => manifest.contributes.bridgeMethods, (entry) => entry.name);
}

/**
 * 全部「类型 → 控件」映射（只含启用插件、已按层归并）。
 *
 * @returns 每条带 `source` / `layer` / `overriddenBy`
 */
export function getTypeAttributeViews(): readonly TypeAttributeViewContribution[]
{
    return enabledContributions((manifest) => manifest.contributes.objectView?.typeAttributeViews, (entry) => entry.type);
}

/**
 * 清空注册表。
 *
 * 只给单元测试用：注册表是模块级状态，用例之间必须能互相隔离。
 */
export function resetPlugins(): void
{
    plugins.length = 0;
}

/**
 * 贡献表：已登记插件 + 每个贡献点**带来源插件与层**。
 *
 * 这是"可检视"的落点（issue #168）：面板上某个东西是哪来的、被谁覆盖了、这个编辑器上装了什么，
 * 都能在这里查到，而不必去读 `MainLayout.vue` 或翻注册代码。
 *
 * `overridePolicy` 如实报告当前语义：现在是 `layered`（内置 < 插件 < 用户，上层赢且覆盖关系可查），
 * 而**同层**重复仍然是硬错误。
 */
export function getContributionTable(): PluginContributionTable
{
    // 贡献点只列**启用插件**的（关掉的插件不该在表里留下痕迹——issue #169 的验收标准），
    // 且已经过层归并（上层赢）
    const typeAttributeViews = getTypeAttributeViews().map((entry) => ({
        type: entry.type,
        component: entry.view.component,
        source: entry.source,
        layer: entry.layer,
        overriddenBy: entry.overriddenBy,
    }));
    const bridgeMethods = getBridgeMethodContributions().map((entry) => ({
        name: entry.name,
        write: entry.write === true,
        source: entry.source,
        layer: entry.layer,
        overriddenBy: entry.overriddenBy,
    }));

    return {
        overridePolicy: 'layered',
        userPatch: getPatchState(),
        // 插件列表列出**全部**（含被禁用的）：设置面板要靠它把插件开回来
        plugins: plugins.map((entry) => {
            const manifest = entry.manifest;
            const override = getPluginOverride(manifest.id);

            return {
                id: manifest.id,
                name: resolvePluginName(manifest),
                manifestName: manifest.name,
                ...(manifest.description === undefined ? {} : { description: manifest.description }),
                ...(manifest.apiVersion === undefined ? {} : { apiVersion: manifest.apiVersion }),
                layer: entry.layer,
                enabled: resolvePluginEnabled(manifest),
                required: manifest.required === true,
                defaultEnabled: manifest.defaultEnabled ?? true,
                userSwitch: hasUserSwitch(manifest.id),
                ...(override?.enabled === undefined ? {} : { patchEnabled: override.enabled }),
                ...(override?.name === undefined ? {} : { patchName: override.name }),
                panels: manifest.contributes.panels?.length ?? 0,
                sceneOverlays: manifest.contributes.sceneOverlays?.length ?? 0,
                logics: manifest.contributes.logics?.length ?? 0,
                typeAttributeViews: manifest.contributes.objectView?.typeAttributeViews?.length ?? 0,
                bridgeMethods: manifest.contributes.bridgeMethods?.length ?? 0,
            };
        }),
        panels: getPanelContributions(),
        sceneOverlays: getSceneOverlays(),
        logics: getLogicContributions().map((entry) => ({
            name: entry.name,
            source: entry.source,
            layer: entry.layer,
            overriddenBy: entry.overriddenBy,
        })),
        typeAttributeViews,
        bridgeMethods,
    };
}

/**
 * 当前被覆盖过的贡献点（形如 `panel:hierarchy`）与插件 id。
 *
 * 用户 patch 的加载结果要报这个：不然"我写的 patch 到底生效了没"只能靠肉眼比对界面。
 *
 * @returns `{ contributions, plugins }`
 */
export function getOverrideReport(): { readonly contributions: readonly string[]; readonly plugins: readonly string[] }
{
    const table = getContributionTable();
    const kinds: readonly [string, readonly { readonly source: string; readonly overriddenBy: readonly string[]; readonly id?: string; readonly name?: string; readonly type?: string }[]][] = [
        ['panel', table.panels],
        ['sceneOverlay', table.sceneOverlays],
        ['logic', table.logics],
        ['typeAttributeView', table.typeAttributeViews],
        ['bridgeMethod', table.bridgeMethods],
    ];
    const contributions: string[] = [];
    for (const [kind, list] of kinds)
    {
        for (const entry of list)
        {
            if (entry.overriddenBy.length === 0) continue;
            contributions.push(`${kind}:${entry.id ?? entry.name ?? entry.type}`);
        }
    }

    return { contributions, plugins: getOverriddenPluginIds() };
}
