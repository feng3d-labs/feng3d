import { type Computed } from './computed';
import { ComputedReactivity } from './computed';

/**
 * 计算图文本快照（devtools 基础，框架设计文档第 9 章）。
 *
 * 输出各节点的求值次数（_version + 1）与下游消费者数（_parents.size）。
 * 用于定位"谁在每帧重算"：静态场景下各节点 evals 应停止增长。
 *
 * 注：依赖边（_children）仅在失效传播期填充、静止态为空，因此基础版
 * 不做图遍历，由调用方传入关心的节点列表（如各 renderer 的 draw
 * computed、submit 链节点）。后续演进：失效期采样依赖边、可视化 UI、
 * 求值耗时统计。
 *
 * @param nodes 关心的 computed 节点
 * @returns 文本行（每行一个节点）
 */
export function computedGraphStats(nodes: readonly Computed[]): string
{
    const lines: string[] = ['computed graph:'];

    nodes.forEach((node, i) =>
    {
        const n = node as unknown as ComputedReactivity;

        lines.push(`[${i}] evals=${n._version + 1} consumers=${n._parents.size}`);
    });

    return lines.join('\n');
}
