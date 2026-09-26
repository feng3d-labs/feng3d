import { PLUGIN_LAYER_ORDER } from './types';
import type { ContributionSource, EditorPluginManifest, PluginLayer } from './types';

/**
 * 层叠加（issue #171）。
 *
 * 层序：**内置 < 插件 < 用户**（与 DSH 的「bundles/profile patch < home patch < --patch」同构）。
 * 同一个贡献点 id 出现在多层时**上层赢**，而且**必须留下痕迹**——`overriddenBy` 里列出
 * 被它盖住的下层来源。没有这个痕迹，"看到的是哪一层的值"就又变成靠猜了
 * （那正是 issue #168 里 `overridePolicy` 字段要解决的问题）。
 *
 * 同级重复 id 不是覆盖，是错误：两个平级的插件在抢同一个位置，谁赢都说不清——
 * 这种事在登记时就被拒绝（见 `registry.ts` 的 `assertNoSameLayerConflicts`）。
 */

/** 一条已登记的插件 */
export interface RegisteredPlugin
{
    /** 插件清单 */
    readonly manifest: EditorPluginManifest;

    /** 所在层 */
    readonly layer: PluginLayer;
}

/** 一条已登记的贡献点（记住它是哪个插件、哪一层给的） */
export interface RegisteredContribution<T>
{
    /** 贡献点本身 */
    readonly contribution: T;

    /** 来源插件 id */
    readonly source: string;

    /** 来源层 */
    readonly layer: PluginLayer;
}

/**
 * 按 id 归并贡献点：上层赢，并记录被覆盖的下层来源。
 *
 * 输出顺序**按传入顺序**（即先出现的 id 先输出），这样排序口径仍然只由
 * `sortPanels` / `sortOverlays` 这类显式排序决定，不会被层序悄悄改写。
 *
 * @param entries 已登记的贡献点（顺序即登记顺序）
 * @param idOf 取 id 的函数（面板取 `id`、Logic 取 `name`、类型→控件取 `type`）
 * @returns 每个 id 只留一条，带 `source` / `layer` / `overriddenBy`
 */
export function pickByLayer<T>(
    entries: readonly RegisteredContribution<T>[],
    idOf: (contribution: T) => string,
): readonly (T & ContributionSource)[]
{
    /** id → 该 id 的全部候选（按层序降序，同层保持登记顺序） */
    const groups = new Map<string, RegisteredContribution<T>[]>();

    for (const entry of entries)
    {
        const id = idOf(entry.contribution);
        const group = groups.get(id);
        if (group) group.push(entry);
        else groups.set(id, [entry]);
    }

    const picked = new Map<string, T & ContributionSource>();
    for (const [id, group] of groups)
    {
        // 稳定排序：层序降序；同层原本只会有一条（同级重复在登记时就被拒了），
        // 所以这里的"同层顺序"只是兜底，不承担语义
        const sorted = [...group].sort((a, b) => PLUGIN_LAYER_ORDER[b.layer] - PLUGIN_LAYER_ORDER[a.layer]);
        const winner = sorted[0];

        picked.set(id, {
            ...winner.contribution,
            source: winner.source,
            layer: winner.layer,
            overriddenBy: sorted.slice(1).map((entry) => entry.source),
        });
    }

    // 按传入顺序输出（每个 id 只输出一次：在它第一次出现的位置）
    const emitted = new Set<string>();
    const result: (T & ContributionSource)[] = [];
    for (const entry of entries)
    {
        const id = idOf(entry.contribution);
        if (emitted.has(id)) continue;
        emitted.add(id);
        result.push(picked.get(id)!);
    }

    return result;
}

/**
 * 同一层内是否有重复的贡献点 id。
 *
 * @param entries 全部已登记 + 待登记的贡献点
 * @param idOf 取 id 的函数
 * @param kind 贡献点类别（报错里带上，便于一眼看出是面板还是 Logic 冲突）
 * @returns 冲突描述（空数组表示没有）
 */
export function findSameLayerConflicts<T>(
    entries: readonly RegisteredContribution<T>[],
    idOf: (contribution: T) => string,
    kind: string,
): readonly string[]
{
    const seen = new Map<string, { source: string; layer: PluginLayer }>();
    const conflicts: string[] = [];

    for (const entry of entries)
    {
        const key = `${entry.layer}:${idOf(entry.contribution)}`;
        const owner = seen.get(key);
        if (owner && owner.source !== entry.source)
        {
            conflicts.push(`${kind}:${idOf(entry.contribution)}（${entry.layer} 层的 ${owner.source} 与 ${entry.source}）`);

            continue;
        }
        seen.set(key, { source: entry.source, layer: entry.layer });
    }

    return conflicts;
}
