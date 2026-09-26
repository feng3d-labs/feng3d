import type { EditorPluginManifest, PanelContribution, PanelPlacement, SceneOverlayContribution } from './types';
import { checkApiVersion } from './apiVersion';
import { syncPluginContributions } from './enable';
import { clearPluginOverrides, setPluginOverride } from './overrides';
import { DEFAULT_PATCH_URL, USER_PATCH_PLUGIN_ID, resetPatchState, setPatchState } from './patchState';
import type { PatchState } from './patchState';
import { getPanelContributions, getPluginEntries, getSceneOverlays, registerPlugins } from './registry';
import { notifyPluginStateChanged } from './state';

export type { PatchState } from './patchState';
export { DEFAULT_PATCH_URL, USER_PATCH_PLUGIN_ID, getPatchState } from './patchState';

/**
 * 用户覆盖层（issue #171）：**本地、不入库**的 `editor.patch.json`。
 *
 * ## 为什么要它
 *
 * DSH 的配置层里，用户自己的 patch **永远叠在最上面**，所以定制不用 fork 内核。
 * 编辑器此前没有"用户覆盖"的位置——想改默认行为只能改源码（改完就和上游分叉了）。
 *
 * ## 层序与语义
 *
 * 层序是 **内置 < 插件 < 用户**（见 `layers.ts`）。这个文件提供最上面那一层：
 *
 * - **贡献点**：按 id 覆盖已有贡献点（只写要改的字段，其余**继承下层**）——
 *   例如把「层级」面板挪到 `project`、换个标签键、改顺序；
 * - **插件级**：改显示名、设启用状态。
 *
 * **patch 只能覆盖，不能新建**：JSON 里给不出视图 loader / Logic 类，一个"新面板"没有任何
 * 东西可以渲染。所以引用不存在的 id 会被当作错误指出，而不是静默忽略
 * （静默忽略会让人以为 patch 生效了）。
 *
 * ## 坏 patch 不该让编辑器起不来
 *
 * 校验不通过时**什么都不应用**，把错误放进 `getPatchState()`（`editor.plugins` 能 dump 出来），
 * 并在控制台打一条 error。用户手写的本地文件写错一个字符就白屏，是没法接受的。
 */

/** patch 文件里能出现的面板覆盖项（只写要改的字段） */
type PartialPanel = Partial<Omit<PanelContribution, 'id'>> & { readonly id: string };

/** patch 文件里能出现的浮层覆盖项 */
type PartialOverlay = Partial<Omit<SceneOverlayContribution, 'id'>> & { readonly id: string };

/** patch 文件（磁盘上的 JSON） */
export interface UserPatchFile
{
    /** 所依赖的编辑器插件 API 版本（**必填**，与插件同一套契约） */
    readonly apiVersion: string;

    /** 这一层的显示名（可选，仅用于展示） */
    readonly name?: string;

    /** 插件级覆盖：`插件 id → { name?, enabled? }` */
    readonly plugins?: Readonly<Record<string, { readonly name?: string; readonly enabled?: boolean }>>;

    /** 贡献点覆盖 */
    readonly contributes?: {
        readonly panels?: readonly PartialPanel[];
        readonly sceneOverlays?: readonly PartialOverlay[];
    };
}

/** 合法落位（校验 patch 里的 placement） */
const PLACEMENTS: readonly PanelPlacement[] = ['hierarchy', 'main', 'project', 'bottom'];

/**
 * 解析 patch 地址：显式传入 > URL 的 `?patch=` > 默认文件。
 *
 * @param explicit 显式指定的地址
 * @returns `{ url, source }`（`source` 为 `url` 表示是显式指定的）
 */
export function resolvePatchUrl(explicit?: string): { readonly url: string; readonly source: 'file' | 'url' }
{
    if (explicit) return { url: explicit, source: 'url' };

    try
    {
        const fromQuery = new URLSearchParams(globalThis.location?.search ?? '').get('patch');
        if (fromQuery) return { url: fromQuery, source: 'url' };
    }
    catch
    {
        // 拿不到 location（非浏览器环境）：退回默认文件
    }

    return { url: DEFAULT_PATCH_URL, source: 'file' };
}

/**
 * 校验 patch 文件的结构。
 *
 * 逐条给出**能直接照着改**的错误（哪一项、哪个字段、期望什么），而不是一句"格式不对"。
 *
 * @param data 解析出来的 JSON
 * @returns 错误列表（空数组表示通过）
 */
export function validatePatch(data: unknown): readonly string[]
{
    if (!data || typeof data !== 'object') return ['patch 的顶层必须是一个 JSON 对象'];

    const patch = data as Record<string, unknown>;
    const problems: string[] = [];

    const version = checkApiVersion(typeof patch.apiVersion === 'string' ? patch.apiVersion : undefined);
    if (!version.compatible) problems.push(`apiVersion：${version.reason ?? '不兼容'}`);

    if (patch.plugins !== undefined)
    {
        if (!patch.plugins || typeof patch.plugins !== 'object')
        {
            problems.push('plugins 必须是一个对象（插件 id → { name?, enabled? }）');
        }
        else
        {
            for (const [id, override] of Object.entries(patch.plugins as Record<string, unknown>))
            {
                if (!override || typeof override !== 'object') { problems.push(`plugins.${id} 必须是对象`); continue; }

                const item = override as Record<string, unknown>;
                if (item.name !== undefined && typeof item.name !== 'string') problems.push(`plugins.${id}.name 必须是字符串`);
                if (item.enabled !== undefined && typeof item.enabled !== 'boolean') problems.push(`plugins.${id}.enabled 必须是 true / false`);
            }
        }
    }

    if (patch.contributes !== undefined)
    {
        if (!patch.contributes || typeof patch.contributes !== 'object')
        {
            problems.push('contributes 必须是一个对象（可以含 panels / sceneOverlays）');
        }
        else
        {
            const shape = patch.contributes as Record<string, unknown>;
            problems.push(...validatePanels(shape.panels));
            problems.push(...validateOverlays(shape.sceneOverlays));
        }
    }

    return problems;
}

/**
 * 校验面板覆盖列表。
 *
 * @param list 待校验的列表
 * @returns 错误列表
 */
function validatePanels(list: unknown): readonly string[]
{
    if (list === undefined) return [];
    if (!Array.isArray(list)) return ['contributes.panels 必须是数组'];

    const problems: string[] = [];
    list.forEach((item, index) =>
    {
        const path = `contributes.panels[${index}]`;
        if (!item || typeof item !== 'object') { problems.push(`${path} 必须是对象`); return; }

        const entry = item as Record<string, unknown>;
        if (typeof entry.id !== 'string' || entry.id.length === 0) problems.push(`${path}.id 必须是非空字符串`);
        if (entry.labelKey !== undefined && typeof entry.labelKey !== 'string') problems.push(`${path}.labelKey 必须是字符串`);
        if (entry.icon !== undefined && typeof entry.icon !== 'string') problems.push(`${path}.icon 必须是字符串`);
        if (entry.order !== undefined && typeof entry.order !== 'number') problems.push(`${path}.order 必须是数字`);
        if (entry.placement !== undefined && !PLACEMENTS.includes(entry.placement as PanelPlacement))
        {
            problems.push(`${path}.placement 只能是 ${PLACEMENTS.join(' / ')}`);
        }
        // 视图 loader 是函数，JSON 表达不了——写进来一定是误会，明确拦住
        if (entry.view !== undefined) problems.push(`${path}.view 不能出现在 patch 里（JSON 给不出视图 loader，patch 只覆盖表现字段）`);
    });

    return problems;
}

/**
 * 校验浮层覆盖列表。
 *
 * @param list 待校验的列表
 * @returns 错误列表
 */
function validateOverlays(list: unknown): readonly string[]
{
    if (list === undefined) return [];
    if (!Array.isArray(list)) return ['contributes.sceneOverlays 必须是数组'];

    const problems: string[] = [];
    list.forEach((item, index) =>
    {
        const path = `contributes.sceneOverlays[${index}]`;
        if (!item || typeof item !== 'object') { problems.push(`${path} 必须是对象`); return; }

        const entry = item as Record<string, unknown>;
        if (typeof entry.id !== 'string' || entry.id.length === 0) problems.push(`${path}.id 必须是非空字符串`);
        if (entry.order !== undefined && typeof entry.order !== 'number') problems.push(`${path}.order 必须是数字`);
        if (entry.view !== undefined) problems.push(`${path}.view 不能出现在 patch 里（同 panels）`);
    });

    return problems;
}

/**
 * 把 patch 里的覆盖项与下层的原定义合并（只改写的字段，其余继承下层）。
 *
 * @param entries patch 里的覆盖项
 * @param base 下层已有的贡献点
 * @param kind 报错里用的名字
 * @returns `{ merged, problems }`
 */
function mergeContributions<T extends { readonly id: string }>(
    entries: readonly (Partial<T> & { readonly id: string })[] | undefined,
    base: readonly T[],
    kind: string,
): { readonly merged: readonly T[]; readonly problems: readonly string[] }
{
    const merged: T[] = [];
    const problems: string[] = [];

    for (const entry of entries ?? [])
    {
        const original = base.find((candidate) => candidate.id === entry.id);
        if (!original)
        {
            problems.push(`${kind} ${entry.id} 在下层不存在——patch 只能覆盖已有贡献点（JSON 给不出视图，新建没有东西可渲染）`);

            continue;
        }
        merged.push({ ...original, ...entry });
    }

    return { merged, problems };
}

/**
 * 加载并应用用户 patch。
 *
 * 读不到文件（404）是**正常状态**（大多数人没有 patch），不算错误；
 * 文件存在但内容不合法才是错误——此时**什么都不应用**，把原因放进状态里。
 *
 * @param options.explicitUrl 显式指定 patch 地址（测试与 `?patch=` 用）
 * @returns 加载后的状态
 */
export async function loadUserPatch(options: { readonly explicitUrl?: string } = {}): Promise<PatchState>
{
    const { url, source } = resolvePatchUrl(options.explicitUrl);

    /**
     * 记一条失败状态（并打一条 error 日志）。
     *
     * @param error 失败原因
     * @returns 状态
     */
    const fail = (error: string): PatchState =>
    {
        console.error(`[plugins] 用户 patch 未生效：${error}（${url}）`);
        const next: PatchState = { source, url, applied: false, error, overriddenPlugins: [], overriddenContributions: [] };
        setPatchState(next);

        return next;
    };

    if (typeof fetch !== 'function') return fail('当前环境没有 fetch，无法读取 patch');

    let text: string;
    try
    {
        const response = await fetch(url, { cache: 'no-cache' });
        // 没有 patch 是正常状态，两种"没有"都要认：
        //   · 静态服务器回 404；
        //   · **dev server 的 SPA 回退**：请求不存在的路径会拿到 index.html（HTTP 200 + text/html）。
        //     实测踩过：不认这种情况就会报一句"不是合法 JSON：Unexpected token '<'"，
        //     而用户其实只是没有这个文件——把"没有"误报成"写坏了"，比不报还糟。
        const contentType = response.headers?.get?.('content-type') ?? '';
        if (response.status === 404 || contentType.includes('text/html'))
        {
            const next: PatchState = { source: 'none', url, applied: false, overriddenPlugins: [], overriddenContributions: [] };
            setPatchState(next);

            return next;
        }
        if (!response.ok) return fail(`读取失败：HTTP ${response.status}`);
        text = await response.text();
    }
    catch (error)
    {
        return fail(`读取失败：${(error as { message?: string })?.message ?? String(error)}`);
    }

    let data: unknown;
    try
    {
        data = JSON.parse(text);
    }
    catch (error)
    {
        return fail(`不是合法 JSON：${(error as { message?: string })?.message ?? String(error)}`);
    }

    const problems = validatePatch(data);
    if (problems.length > 0) return fail(problems.join('；'));

    const patch = data as UserPatchFile;

    // ---- 插件级覆盖：先校验 id 存在，再落笔（有错就一个都不改）----
    const known = new Set(getPluginEntries().map((entry) => entry.manifest.id));
    const unknownPlugins = Object.keys(patch.plugins ?? {}).filter((id) => !known.has(id));
    if (unknownPlugins.length > 0)
    {
        return fail(`引用了不存在的插件：${unknownPlugins.join(', ')}（可用：${[...known].join(', ')}）`);
    }

    const panels = mergeContributions<PanelContribution>(
        patch.contributes?.panels as readonly (Partial<PanelContribution> & { readonly id: string })[] | undefined,
        getPanelContributions(),
        '面板',
    );
    const overlays = mergeContributions<SceneOverlayContribution>(
        patch.contributes?.sceneOverlays as readonly (Partial<SceneOverlayContribution> & { readonly id: string })[] | undefined,
        getSceneOverlays(),
        '场景浮层',
    );
    if (panels.problems.length > 0 || overlays.problems.length > 0)
    {
        return fail([...panels.problems, ...overlays.problems].join('；'));
    }

    clearPluginOverrides();
    for (const [id, override] of Object.entries(patch.plugins ?? {}))
    {
        setPluginOverride(id, {
            ...(override.name === undefined ? {} : { name: override.name }),
            ...(override.enabled === undefined ? {} : { enabled: override.enabled }),
        });
    }

    const hasContributions = panels.merged.length > 0 || overlays.merged.length > 0;
    if (hasContributions)
    {
        const manifest: EditorPluginManifest = {
            id: USER_PATCH_PLUGIN_ID,
            name: patch.name ?? '用户覆盖',
            description: `本地覆盖层（${url}）——不入库；只改显示名、位置、顺序这类表现，改不了实现`,
            apiVersion: patch.apiVersion,
            // 必需：这一层就是用户自己的配置，关掉它没有意义
            // （而且会让"我明明写了 patch"变成悬案）
            required: true,
            contributes: {
                ...(panels.merged.length === 0 ? {} : { panels: panels.merged }),
                ...(overlays.merged.length === 0 ? {} : { sceneOverlays: overlays.merged }),
            },
        };
        registerPlugins([manifest], 'user');
    }

    const overriddenContributions = [
        ...panels.merged.map((panel) => `panel:${panel.id}`),
        ...overlays.merged.map((overlay) => `sceneOverlay:${overlay.id}`),
    ];
    const next: PatchState = {
        source,
        url,
        applied: true,
        overriddenPlugins: Object.keys(patch.plugins ?? {}),
        overriddenContributions,
    };
    setPatchState(next);
    console.log(`[plugins] 用户 patch 已生效：${url}（覆盖 ${overriddenContributions.length} 个贡献点 / ${next.overriddenPlugins.length} 个插件设置）`);

    // patch 可能改了启用状态：把引擎侧的贡献点同步一遍（多装少卸都是幂等的）
    syncPluginContributions();
    // 界面要跟着刷新，否则表现为"文件放进去了、界面没反应"
    notifyPluginStateChanged();

    return next;
}

/**
 * 重置 patch 状态与插件级覆盖（只给测试用；不动磁盘上的文件）。
 */
export function resetUserPatch(): void
{
    resetPatchState();
    clearPluginOverrides();
}
