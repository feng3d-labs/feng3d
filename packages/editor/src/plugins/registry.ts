import type { EditorPluginManifest, PanelContribution, PanelPlacement, SceneOverlayContribution } from './types';

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
 * @param manifests 插件清单
 * @throws 两个插件贡献了同名面板/浮层时抛出——**宁可启动就报错，也不要两个面板互相覆盖**
 */
export function registerPlugins(manifests: readonly EditorPluginManifest[]): void
{
    for (const manifest of manifests)
    {
        if (plugins.some((plugin) => plugin.id === manifest.id)) continue;
        plugins.push(manifest);
    }

    assertUniqueContributions();
}

/**
 * 检查贡献点 id 是否冲突。
 *
 * 冲突在插件体系里是**静默失效**的典型来源：两个插件都想放一个叫 `scene` 的面板，
 * 后注册的把先注册的顶掉，面板上只少一个、没人知道为什么。所以直接拒绝。
 */
function assertUniqueContributions(): void
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

    for (const plugin of plugins)
    {
        for (const panel of plugin.contributes.panels ?? []) check('panel', panel.id, plugin.id);
        for (const overlay of plugin.contributes.sceneOverlays ?? []) check('sceneOverlay', overlay.id, plugin.id);
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
 * 全部面板贡献点。
 *
 * 排序规则：**先按落位**（固定顺序，见 {@link PLACEMENT_ORDER}）**再按 `order`**
 * 最后按注册顺序。这样得到的扁平列表是稳定的——它就是 TabPanel 的 + 菜单顺序，
 * 不该因为某个插件先注册谁而变。单个落位内的顺序则由 `order` 决定。
 */
export function getPanelContributions(): readonly PanelContribution[]
{
    const panels = plugins.flatMap((plugin) => plugin.contributes.panels ?? []);
    const indexed = panels.map((panel, index) => ({ panel, index }));

    return indexed
        .sort((a, b) =>
            (PLACEMENT_ORDER.indexOf(a.panel.placement) - PLACEMENT_ORDER.indexOf(b.panel.placement))
            || ((a.panel.order ?? 0) - (b.panel.order ?? 0))
            || (a.index - b.index))
        .map((item) => item.panel);
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

/** 全部场景浮层贡献点（按 `order` 再按注册顺序） */
export function getSceneOverlays(): readonly SceneOverlayContribution[]
{
    const overlays = plugins.flatMap((plugin) => plugin.contributes.sceneOverlays ?? []);
    const indexed = overlays.map((overlay, index) => ({ overlay, index }));

    return indexed
        .sort((a, b) => ((a.overlay.order ?? 0) - (b.overlay.order ?? 0)) || (a.index - b.index))
        .map((item) => item.overlay);
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
