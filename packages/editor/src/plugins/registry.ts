import type {
    EditorPluginManifest,
    LogicContribution,
    PanelContribution,
    PanelPlacement,
    PluginContributionTable,
    SceneOverlayContribution,
} from './types';

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
 */

/** 已注册的插件清单（按注册顺序） */
const plugins: EditorPluginManifest[] = [];

/**
 * 注册插件清单。
 *
 * 幂等：同 id 的插件重复注册会被跳过（开发期模块热替换、多次 install 都不会重复贡献）。
 *
 * **事务性**：冲突检查在提交之前做，失败时注册表保持原样。
 * 这条不是洁癖——先 push 再校验的写法实测会留下半套注册：一次失败的注册把冲突插件留在表里，
 * 之后**每一次**注册（哪怕与冲突无关）都会报同一个"幽灵冲突"，现场极难判断。
 *
 * @param manifests 插件清单
 * @throws 两个插件贡献了同名贡献点（面板 / 浮层 / Logic / 类型→控件）时抛出，
 *   报错**点名双方**——宁可启动就报错，也不要两个插件互相覆盖
 */
export function registerPlugins(manifests: readonly EditorPluginManifest[]): void
{
    const added: EditorPluginManifest[] = [];
    for (const manifest of manifests)
    {
        if (plugins.some((plugin) => plugin.id === manifest.id)) continue;
        if (added.some((plugin) => plugin.id === manifest.id)) continue;
        added.push(manifest);
    }

    if (added.length === 0) return;

    assertUniqueContributions([...plugins, ...added]);
    plugins.push(...added);
}

/**
 * 检查贡献点 id 是否冲突。
 *
 * 冲突在插件体系里是**静默失效**的典型来源：两个插件都想放一个叫 `scene` 的面板，
 * 后注册的把先注册的顶掉，面板上只少一个、没人知道为什么。所以直接拒绝。
 *
 * @param candidates 待检查的全部插件（含已注册的与本次要注册的）
 */
function assertUniqueContributions(candidates: readonly EditorPluginManifest[]): void
{
    const seen = new Map<string, string>();
    const conflicts: string[] = [];

    const check = (kind: string, id: string, pluginId: string) =>
    {
        const key = `${kind}:${id}`;
        const owner = seen.get(key);
        if (owner !== undefined && owner !== pluginId)
        {
            conflicts.push(`${key}（${owner} 与 ${pluginId}）`);

            return;
        }
        seen.set(key, pluginId);
    };

    for (const plugin of candidates)
    {
        for (const panel of plugin.contributes.panels ?? []) check('panel', panel.id, plugin.id);
        for (const overlay of plugin.contributes.sceneOverlays ?? []) check('sceneOverlay', overlay.id, plugin.id);
        // Logic 用 `__type__` 当 id：两个插件注册同一个类型名时，后注册的会**静默顶掉**先注册的，
        // 表现是"某个类型的行为突然变成另一套"——比面板少一个更难查，所以同样直接拒绝
        for (const entry of plugin.contributes.logics ?? []) check('logic', entry.name, plugin.id);
        // 类型→控件的映射同理：同一个类型被两个插件指派不同控件，面板上是哪套就说不清了
        for (const entry of plugin.contributes.objectView?.typeAttributeViews ?? []) check('typeAttributeView', entry.type, plugin.id);
    }

    if (conflicts.length > 0)
    {
        throw new Error(`插件贡献点 id 冲突：${conflicts.join('、')}——每个贡献点只能由一个插件提供`);
    }
}

/** 已注册的插件清单（只读视图） */
export function getPlugins(): readonly EditorPluginManifest[]
{
    return plugins;
}

/** 落位的固定顺序（扁平列表按它分组，保证与插件注册顺序无关） */
const PLACEMENT_ORDER: readonly PanelPlacement[] = ['hierarchy', 'main', 'project', 'bottom'];

/**
 * 面板排序：**先按落位**（固定顺序，见 {@link PLACEMENT_ORDER}）**再按 `order`**，最后按注册顺序。
 *
 * 抽成函数是必须的：`getPanelContributions()` 与 `getContributionTable()` 都在回答
 * 「面板列表是什么」，两处各写一遍排序迟早给出不同顺序——实测就踩过：贡献表按注册顺序给，
 * 而面板列表按落位给，同一个问题两个 API 两种答案。
 *
 * @param panels 待排序的面板（数组顺序即注册顺序）
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
 * 浮层排序：按 `order` 再按注册顺序（浮层没有落位）。
 *
 * @param overlays 待排序的浮层（数组顺序即注册顺序）
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
 * 全部面板贡献点。
 *
 * 排序规则见 {@link sortPanels}。这样得到的扁平列表是稳定的——它就是 TabPanel 的 + 菜单顺序，
 * 不该因为某个插件先注册谁而变。单个落位内的顺序则由 `order` 决定。
 */
export function getPanelContributions(): readonly PanelContribution[]
{
    return sortPanels(plugins.flatMap((plugin) => plugin.contributes.panels ?? []));
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

/** 全部场景浮层贡献点（排序规则见 {@link sortOverlays}） */
export function getSceneOverlays(): readonly SceneOverlayContribution[]
{
    return sortOverlays(plugins.flatMap((plugin) => plugin.contributes.sceneOverlays ?? []));
}

/**
 * 全部 Logic 贡献点。
 *
 * 顺序即**注册顺序**并刻意不排序：`registerLogic` 是后写覆盖先写的语义，
 * 排序会让 dump 出来的顺序与真实生效顺序不一致（而这里报的就是"谁最终生效"的前提）。
 * 重复的类型名在注册时已被 {@link registerPlugins} 拒绝，所以顺序不会掩盖冲突。
 */
export function getLogicContributions(): readonly LogicContribution[]
{
    return plugins.flatMap((plugin) => plugin.contributes.logics ?? []);
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
 * 贡献表：已注册插件 + 每个贡献点**带来源插件**。
 *
 * 这是"可检视"的落点（issue #168）：面板上某个东西是哪来的、这个编辑器上装了什么，
 * 都能在这里查到，而不必去读 `MainLayout.vue` 或翻注册代码。
 *
 * `overridePolicy` 如实报告当前语义（现在是 `reject`——同名贡献点直接拒绝注册），
 * 而不是回一个永远为空的"覆盖列表"：调用方需要知道"看到的顺序是不是覆盖后的结果"。
 */
export function getContributionTable(): PluginContributionTable
{
    // 与 getPanelContributions() / getSceneOverlays() 共用同一套排序：
    // 两处都在回答「有哪些面板」，顺序不一致会让调用方无法互相印证
    const panels = sortPanels(plugins.flatMap((plugin) =>
        (plugin.contributes.panels ?? []).map((panel) => ({ ...panel, source: plugin.id }))));
    const sceneOverlays = sortOverlays(plugins.flatMap((plugin) =>
        (plugin.contributes.sceneOverlays ?? []).map((overlay) => ({ ...overlay, source: plugin.id }))));
    // Logic 按注册顺序（见 getLogicContributions 的说明），且**不带类本身**：
    // 表是给人看/给 AI 读的，序列化一个类出来是一串压缩源码
    const logics = plugins.flatMap((plugin) =>
        (plugin.contributes.logics ?? []).map((entry) => ({ name: entry.name, source: plugin.id })));
    // 属性面板：类型 → 控件（只报控件**类名**，与面板报视图 id 同理）
    const typeAttributeViews = plugins.flatMap((plugin) =>
        (plugin.contributes.objectView?.typeAttributeViews ?? []).map((entry) => ({
            type: entry.type,
            component: entry.view.component,
            source: plugin.id,
        })));

    return {
        overridePolicy: 'reject',
        plugins: plugins.map((plugin) => ({
            id: plugin.id,
            name: plugin.name,
            ...(plugin.description === undefined ? {} : { description: plugin.description }),
            ...(plugin.apiVersion === undefined ? {} : { apiVersion: plugin.apiVersion }),
            panels: plugin.contributes.panels?.length ?? 0,
            sceneOverlays: plugin.contributes.sceneOverlays?.length ?? 0,
            logics: plugin.contributes.logics?.length ?? 0,
            typeAttributeViews: plugin.contributes.objectView?.typeAttributeViews?.length ?? 0,
        })),
        panels,
        sceneOverlays,
        logics,
        typeAttributeViews,
    };
}
