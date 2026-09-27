import { describe, expect, it } from 'vitest';
import { findOverlappingPairs, OVERLAP_EPSILON } from '../src/bridge/read/overlap';
import type { ObjectCenter } from '../src/bridge/read/overlap';

/**
 * 「中心完全重合」的配对检测（issue #139 项 8）。
 *
 * 实现从"两两比较"（O(n²)）改成了"按 x 排序 + 滑动窗口"。改写最怕**悄悄漏配对**，
 * 所以这里用**朴素实现当参照物做随机对拍**：同一批随机数据两种算法结果必须一字不差。
 */
describe('findOverlappingPairs', () =>
{
    /** 改写前的朴素实现（两两比较，结果按字符串排序以消除顺序差异） */
    function naive(entries: readonly ObjectCenter[]): string[]
    {
        const overlaps: string[] = [];
        for (let i = 0; i < entries.length; i++)
        {
            for (let j = i + 1; j < entries.length; j++)
            {
                const a = entries[i].center;
                const b = entries[j].center;
                if (Math.abs(a.x - b.x) < OVERLAP_EPSILON
                    && Math.abs(a.y - b.y) < OVERLAP_EPSILON
                    && Math.abs(a.z - b.z) < OVERLAP_EPSILON)
                {
                    const pair = [entries[i].objectId, entries[j].objectId].sort();
                    overlaps.push(`${pair[0]} / ${pair[1]}`);
                }
            }
        }

        return overlaps.sort();
    }

    /** 造一批随机中心；`clusterEvery` 控制"每隔几个就复制一份"来制造重合 */
    function randomEntries(count: number, seed: number, clusterEvery: number): ObjectCenter[]
    {
        let state = seed;
        const random = () => ((state = (state * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
        const entries: ObjectCenter[] = [];
        for (let i = 0; i < count; i++)
        {
            // 大部分对象稀疏分布，少数**精确复制**前一个的中心（制造真重合）
            const base = entries[Math.max(0, i - (i % clusterEvery === 0 ? 1 : 0))];
            const center = i > 0 && i % clusterEvery === 0 && base
                ? { ...base.center }
                : { x: Math.round(random() * 8) / 4, y: Math.round(random() * 8) / 4, z: Math.round(random() * 8) / 4 };

            entries.push({ objectId: `/Untitled/N${i}`, center });
        }

        return entries;
    }

    it('随机对拍：与两两比较的结果完全一致（100 组）', () =>
    {
        for (let round = 0; round < 100; round++)
        {
            const entries = randomEntries(30 + (round % 20), 1000 + round, 3 + (round % 4));

            expect(findOverlappingPairs(entries), `第 ${round} 组`).toEqual(naive(entries));
        }
    });

    it('边界：x 差恰好等于阈值不算重合（判据是 <，不是 <=）', () =>
    {
        const entries: ObjectCenter[] = [
            { objectId: '/A', center: { x: 0, y: 0, z: 0 } },
            { objectId: '/B', center: { x: OVERLAP_EPSILON, y: 0, z: 0 } },
        ];

        expect(findOverlappingPairs(entries)).toEqual([]);
    });

    it('边界：y / z 任一不接近就不算重合', () =>
    {
        const entries: ObjectCenter[] = [
            { objectId: '/A', center: { x: 0, y: 0, z: 0 } },
            { objectId: '/B', center: { x: 0, y: OVERLAP_EPSILON, z: 0 } },
            { objectId: '/C', center: { x: 0, y: 0, z: OVERLAP_EPSILON } },
        ];

        expect(findOverlappingPairs(entries)).toEqual([]);
    });

    it('同一位置三个对象 → 两两都算一对（与朴素实现一致）', () =>
    {
        const entries: ObjectCenter[] = ['A', 'B', 'C'].map((name) => ({ objectId: `/${name}`, center: { x: 1, y: 2, z: 3 } }));

        expect(findOverlappingPairs(entries)).toEqual(['/A / /B', '/A / /C', '/B / /C']);
    });

    it('结果与输入顺序无关（输出已排序）', () =>
    {
        const entries: ObjectCenter[] = [
            { objectId: '/A', center: { x: 0, y: 0, z: 0 } },
            { objectId: '/B', center: { x: 0, y: 0, z: 0 } },
        ];

        expect(findOverlappingPairs(entries)).toEqual(findOverlappingPairs([...entries].reverse()));
    });
});
