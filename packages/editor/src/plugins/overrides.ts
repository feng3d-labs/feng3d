/**
 * 插件级覆盖（issue #171 的用户 patch 层）。
 *
 * ## 为什么单独一层
 *
 * 贡献点级的覆盖（面板挪个位置、改个标签）由 `layers.ts` 的层叠加处理；
 * 而"这个插件叫什么名字、默认开不开"是**插件级**的属性，不在贡献点里。
 * 用户 patch 需要能改这两样，所以单独存一份：
 *
 * ```
 * enabled = required → 设置面板里的开关（localStorage） → 本文件的 patch → 清单默认
 * ```
 *
 * 顺序说明：**设置面板的开关压过 patch**。理由是"用户最近一次显式操作"应当赢
 * ——patch 是用户早就写下的配置，而面板上的开关是他刚刚点的。
 *
 * ## 为什么不做成模块级副作用
 *
 * 数据放在 lazy-init 的 Map 里，写入口只有 {@link setPluginOverrides}（由 patch 加载器调用），
 * 并且**改动会通知订阅者**（界面靠它刷新，见 `plugins/state.ts` 的 `onPluginStateChanged`）。
 */
import type { EditorPluginManifest } from './types';

/** 插件级覆盖项 */
export interface PluginOverride
{
    /** 用户改的显示名 */
    readonly name?: string;

    /** 用户设的启用状态（默认值层，压不过设置面板里的显式开关） */
    readonly enabled?: boolean;
}

/**
 * 插件 id → 覆盖项。
 *
 * lazy-init：模块顶层建 Map 就是 R2 禁止的模块级副作用（门禁会报），所以 `null` 起步。
 */
let overrides: Map<string, PluginOverride> | null = null;

/**
 * 取覆盖表（lazy-init）。
 *
 * @returns 覆盖表
 */
function table(): Map<string, PluginOverride>
{
    overrides ??= new Map();

    return overrides;
}

/**
 * 取某个插件的覆盖项。
 *
 * @param pluginId 插件 id
 * @returns 覆盖项；没有时返回 `undefined`
 */
export function getPluginOverride(pluginId: string): PluginOverride | undefined
{
    return table().get(pluginId);
}

/**
 * 覆盖某个插件的显示名与启用状态。
 *
 * @param pluginId 插件 id
 * @param override 覆盖项（只给要改的字段）
 */
export function setPluginOverride(pluginId: string, override: PluginOverride): void
{
    const current = table().get(pluginId) ?? {};
    table().set(pluginId, { ...current, ...override });
}

/**
 * 当前被 patch 覆盖过的插件 id。
 *
 * @returns 插件 id 列表（按首次覆盖顺序）
 */
export function getOverriddenPluginIds(): readonly string[]
{
    return [...table().keys()];
}

/**
 * 生效的显示名。
 *
 * @param manifest 插件清单
 * @returns patch 改过就是改后的名字，否则是清单里写的
 */
export function resolvePluginName(manifest: EditorPluginManifest): string
{
    return getPluginOverride(manifest.id)?.name ?? manifest.name;
}

/**
 * patch 层是否设了启用状态（贡献表要能分辨"patch 设的"与"设置面板设的"）。
 *
 * @param pluginId 插件 id
 * @returns patch 设的状态；没设时返回 `undefined`
 */
export function getPatchEnabled(pluginId: string): boolean | undefined
{
    return getPluginOverride(pluginId)?.enabled;
}

/**
 * 清空覆盖表（只给测试与 patch 重新加载用）。
 */
export function clearPluginOverrides(): void
{
    table().clear();
}
