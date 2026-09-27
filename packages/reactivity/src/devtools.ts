import { type Computed, ComputedReactivity } from './computed';

export { enableComputedProfiling, isComputedProfilingEnabled } from './computed';

/**
 * 计算图节点快照（devtools，issue #95）。
 */
export interface ComputedNodeSnapshot
{
    /** 节点标签（`[i]`，与传入列表的索引一致） */
    readonly label: string;
    /** 求值次数（缓存命中不计入） */
    readonly evals: number;
    /** 因**上游变化**导致的重算次数（区别于主动标脏） */
    readonly invalidates: number;
    /** 下游消费者数 */
    readonly consumers: number;
    /** 上次求值耗时（毫秒；profiling 关闭时为 0） */
    readonly lastDurationMs: number;
}

/** 计算图快照：节点 + 依赖边（索引对应 `nodes`） */
export interface ComputedGraphSnapshot
{
    readonly nodes: readonly ComputedNodeSnapshot[];
    readonly edges: readonly { readonly from: number; readonly to: number }[];
}

/**
 * 导出计算图结构化快照（devtools，issue #95）。
 *
 * 与 {@link computedGraphStats} 的区别：这里给的是**数据**，可以直接喂给可视化 UI。
 *
 * 依赖边来自失效传播期的采样（见 `ComputedReactivity.sampleDeps`）：静止态
 * computed 的 `_children` 是空的，所以边只在"曾经发生过失效检查"的节点之间可见——
 * 想采全图，先让场景跑一帧（或触发一次数据变更）再 dump。
 *
 * @param nodes 关心的 computed 节点（可视化时通常传同一批）
 * @returns 节点数组与依赖边
 */
export function dumpComputedGraph(nodes: readonly Computed[]): ComputedGraphSnapshot
{
    const index = new Map<ComputedReactivity, number>();

    nodes.forEach((node, i) => index.set(node as unknown as ComputedReactivity, i));

    const snapshotNodes = nodes.map((node, i) =>
    {
        const n = node as unknown as ComputedReactivity;

        return {
            label: `[${i}]`,
            evals: n._version + 1,
            invalidates: n._invalidateCount,
            consumers: n._parents.size,
            lastDurationMs: Math.round(n._lastDurationMs * 1000) / 1000,
        };
    });

    const edges: { from: number; to: number }[] = [];

    nodes.forEach((node, i) =>
    {
        const n = node as unknown as ComputedReactivity;

        n._deps?.forEach((dep) =>
        {
            const to = index.get(dep);

            if (to !== undefined) edges.push({ from: i, to });
        });
    });

    return { nodes: snapshotNodes, edges };
}

/**
 * 计算图文本快照（devtools 基础，框架设计文档第 9 章）。
 *
 * 每行一个节点：求值次数（`evals`）、下游消费者数（`consumers`）、
 * 上游失效导致的重算次数（`invalidates`）、上次求值耗时（`lastMs`）；
 * 之后是依赖边（`edge [i] -> [j]`，`i` 依赖 `j`）。
 *
 * 用于定位"谁在每帧重算"：静态场景下各节点 `evals` / `invalidates` 应停止增长。
 *
 * @param nodes 关心的 computed 节点
 * @returns 文本行
 */
export function computedGraphStats(nodes: readonly Computed[]): string
{
    const snapshot = dumpComputedGraph(nodes);
    const lines: string[] = ['computed graph:'];

    snapshot.nodes.forEach((n) =>
    {
        lines.push(`${n.label} evals=${n.evals} consumers=${n.consumers}`
            + ` invalidates=${n.invalidates} lastMs=${n.lastDurationMs}`);
    });

    snapshot.edges.forEach((e) =>
    {
        lines.push(`edge ${snapshot.nodes[e.from].label} -> ${snapshot.nodes[e.to].label}`);
    });

    return lines.join('\n');
}

/**
 * 重置这些节点的 devtools 统计（失效计数 / 耗时 / 采样到的依赖边）。
 *
 * 用于"跑一段之后重新计数"：例如先 `resetComputedGraphStats(nodes)` 再跑一帧，
 * 只剩这一帧真实发生的重算。
 *
 * @param nodes 要重置的 computed 节点
 */
export function resetComputedGraphStats(nodes: readonly Computed[]): void
{
    nodes.forEach((node) =>
    {
        const n = node as unknown as ComputedReactivity;

        n._invalidateCount = 0;
        n._lastDurationMs = 0;
        n._deps = null;
    });
}
