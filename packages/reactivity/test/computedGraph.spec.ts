import { beforeEach, describe, expect, it } from 'vitest';

import {
    computed, computedGraphStats, dumpComputedGraph, enableComputedProfiling,
    isComputedProfilingEnabled, reactive, resetComputedGraphStats,
} from '../src';

/**
 * 计算图 devtools（issue #95）。
 *
 * 三件事必须成立，否则"定位谁在每帧重算"就只是口号：
 * 1. 依赖边要能采到（静止态 `_children` 为空，边只能在失效传播期采样）；
 * 2. 失效计数要区分"上游变化导致的重算"与"首次求值"；
 * 3. 耗时要**只在 profiling 开启时**记录——否则生产路径白付计时开销。
 */
describe('计算图 devtools（issue #95）', () =>
{
    beforeEach(() =>
    {
        enableComputedProfiling(false);
    });

    /** base → mid → top 的三层链条 */
    function buildChain()
    {
        const base = reactive({ foo: 1 });
        const mid = computed(() => base.foo * 2);
        const top = computed(() => mid.value + 1);

        return { base, mid, top };
    }

    it('默认关闭 profiling：不采依赖边、不记耗时', () =>
    {
        const { base, mid, top } = buildChain();

        expect(isComputedProfilingEnabled()).toBe(false);
        expect(top.value).toBe(3);

        base.foo = 2;
        expect(top.value).toBe(5);

        const snapshot = dumpComputedGraph([top, mid]);

        expect(snapshot.edges).toHaveLength(0);
        expect(snapshot.nodes.every((n) => n.lastDurationMs === 0)).toBe(true);
        // 求值次数与消费者数不依赖 profiling，始终可用
        expect(snapshot.nodes[0].evals).toBe(2);
    });

    it('开启 profiling：采到 top → mid 的依赖边', () =>
    {
        const { base, mid, top } = buildChain();

        enableComputedProfiling(true);
        expect(isComputedProfilingEnabled()).toBe(true);

        expect(top.value).toBe(3);
        base.foo = 2;
        expect(top.value).toBe(5);   // 触发失效传播 → 采样依赖边

        const snapshot = dumpComputedGraph([top, mid]);

        expect(snapshot.edges).toContainEqual({ from: 0, to: 1 });
    });

    it('失效计数：区分首次求值与上游变化导致的重算', () =>
    {
        const { base, mid, top } = buildChain();

        enableComputedProfiling(true);
        expect(top.value).toBe(3);

        let snapshot = dumpComputedGraph([top, mid]);

        // 首次求值不算"失效"
        expect(snapshot.nodes[0].invalidates).toBe(0);
        expect(snapshot.nodes[1].invalidates).toBe(0);

        base.foo = 2;
        expect(top.value).toBe(5);

        snapshot = dumpComputedGraph([top, mid]);

        expect(snapshot.nodes[0].invalidates).toBeGreaterThan(0);
        expect(snapshot.nodes[1].invalidates).toBeGreaterThan(0);
    });

    it('记录上次求值耗时（profiling 开启时 > 0）', () =>
    {
        const { top } = buildChain();

        enableComputedProfiling(true);
        expect(top.value).toBe(3);

        const [node] = dumpComputedGraph([top]).nodes;

        expect(node.lastDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('文本快照包含 invalidates / lastMs 与依赖边', () =>
    {
        const { base, mid, top } = buildChain();

        enableComputedProfiling(true);
        expect(top.value).toBe(3);
        base.foo = 2;
        expect(top.value).toBe(5);

        const text = computedGraphStats([top, mid]);

        expect(text).toContain('computed graph:');
        expect(text).toContain('evals=2');
        expect(text).toContain('consumers=1');
        expect(text).toContain('invalidates=');
        expect(text).toContain('lastMs=');
        expect(text).toContain('edge [0] -> [1]');
    });

    it('resetComputedGraphStats 清空失效计数与采样边', () =>
    {
        const { base, mid, top } = buildChain();

        enableComputedProfiling(true);
        expect(top.value).toBe(3);
        base.foo = 2;
        expect(top.value).toBe(5);

        resetComputedGraphStats([top, mid]);

        const snapshot = dumpComputedGraph([top, mid]);

        expect(snapshot.edges).toHaveLength(0);
        expect(snapshot.nodes.every((n) => n.invalidates === 0 && n.lastDurationMs === 0)).toBe(true);
    });
});
