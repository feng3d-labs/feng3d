import { describe, expect, it } from 'vitest';

import { Mathf } from '../src/MathF';

/**
 * `Mathf`（`packages/math/src/MathF.ts`，158 行，此前**行覆盖率 4.43%**）。
 *
 * Unity 风格的数学工具类（40+ 个 `static`）。全是纯函数，所以断言可以用**数学关系**表达。
 *
 * 实测到的几处**反直觉语义**（都如实钉在下面）：
 * - 三角函数按**弧度**（源码注释写着 "angle `f` in radians"），**不是度**；
 * - **`Lerp` 会把 `t` 钳到 `[0,1]`**，`LerpUnclamped` 不会 —— 这是两者唯一的差别；
 * - **`Sign(0) === 1`**（实现是 `f >= 0 ? 1 : -1`），不是 0；
 * - **`Min([])` / `Max([])` 返回 `0`**（空数组直接短路）。
 */

describe('Mathf（math）', () =>
{
    describe('★ 三角函数按弧度（不是度）', () =>
    {
        it('★ Sin(PI/2) = 1、Cos(0) = 1、Sin(0) = 0', () =>
        {
            expect(Mathf.Sin(Mathf.PI / 2)).toBeCloseTo(1, 10);
            expect(Mathf.Cos(0)).toBeCloseTo(1, 10);
            expect(Mathf.Sin(0)).toBeCloseTo(0, 10);
        });

        it('★ 半圈处 Sin(PI) ≈ 0、Cos(PI) = −1', () =>
        {
            expect(Mathf.Sin(Mathf.PI)).toBeCloseTo(0, 10);
            expect(Mathf.Cos(Mathf.PI)).toBeCloseTo(-1, 10);
        });

        it('Atan2 / Asin / Acos / Sqrt / Abs 与 Math.* 一致', () =>
        {
            expect(Mathf.Atan2(1, 1)).toBeCloseTo(Math.atan2(1, 1), 12);
            expect(Mathf.Asin(1)).toBeCloseTo(Math.PI / 2, 12);
            expect(Mathf.Acos(1)).toBeCloseTo(0, 12);
            expect(Mathf.Sqrt(9)).toBeCloseTo(3, 12);
            expect(Mathf.Abs(-4.5)).toBeCloseTo(4.5, 12);
        });
    });

    describe('★ Clamp / Clamp01', () =>
    {
        it('★ 区间内的值原样返回，越界被钳到端点', () =>
        {
            expect(Mathf.Clamp(5, 0, 10)).toBe(5);
            expect(Mathf.Clamp(-1, 0, 10)).toBe(0);
            expect(Mathf.Clamp(11, 0, 10)).toBe(10);
            expect(Mathf.Clamp(0, 0, 10)).toBe(0);
            expect(Mathf.Clamp(10, 0, 10)).toBe(10);
        });

        it('★ Clamp01 把值限定在 [0,1]', () =>
        {
            expect(Mathf.Clamp01(-0.5)).toBe(0);
            expect(Mathf.Clamp01(0.25)).toBeCloseTo(0.25, 12);
            expect(Mathf.Clamp01(1.5)).toBe(1);
        });
    });

    describe('★ Lerp / LerpUnclamped（唯一的差别是 t 是否被钳）', () =>
    {
        it('★ 端点：t=0 得 a，t=1 得 b；t=0.5 得中点', () =>
        {
            expect(Mathf.Lerp(10, 20, 0)).toBeCloseTo(10, 12);
            expect(Mathf.Lerp(10, 20, 1)).toBeCloseTo(20, 12);
            expect(Mathf.Lerp(10, 20, 0.5)).toBeCloseTo(15, 12);
        });

        it('★★ Lerp 会把越界的 t 钳住，LerpUnclamped 会外推', () =>
        {
            // t = 2 → Lerp 当成 1 → 得 b；LerpUnclamped 得 a + (b-a)*2
            expect(Mathf.Lerp(10, 20, 2)).toBeCloseTo(20, 12);
            expect(Mathf.Lerp(10, 20, -1)).toBeCloseTo(10, 12);

            expect(Mathf.LerpUnclamped(10, 20, 2)).toBeCloseTo(30, 12);
            expect(Mathf.LerpUnclamped(10, 20, -1)).toBeCloseTo(0, 12);
        });

        it('LerpUnclamped 在 [0,1] 内与 Lerp 完全一致', () =>
        {
            for (const t of [0, 0.1, 0.5, 0.9, 1])
            {
                expect(Mathf.LerpUnclamped(3, 7, t), `t=${t}`).toBeCloseTo(Mathf.Lerp(3, 7, t), 12);
            }
        });
    });

    describe('★ MoveTowards', () =>
    {
        it('★ 差距不超过 maxDelta 时直接到 target（不会越过）', () =>
        {
            expect(Mathf.MoveTowards(0, 10, 100)).toBe(10);
            expect(Mathf.MoveTowards(0, 10, 10)).toBe(10);
        });

        it('★ 否则朝 target 方向走 maxDelta', () =>
        {
            expect(Mathf.MoveTowards(0, 10, 3)).toBeCloseTo(3, 12);
            expect(Mathf.MoveTowards(10, 0, 3)).toBeCloseTo(7, 12);
        });

        it('★ current 已经在 target 上时返回 target', () =>
        {
            expect(Mathf.MoveTowards(5, 5, 1)).toBe(5);
        });
    });

    describe('★ SmoothStep', () =>
    {
        it('★ 端点：t=0 → from，t=1 → to', () =>
        {
            expect(Mathf.SmoothStep(10, 20, 0)).toBeCloseTo(10, 12);
            expect(Mathf.SmoothStep(10, 20, 1)).toBeCloseTo(20, 12);
        });

        it('★ t=0.5 → 中点（因为 3t²−2t³ 在 0.5 处正好是 0.5）', () =>
        {
            expect(Mathf.SmoothStep(10, 20, 0.5)).toBeCloseTo(15, 12);
        });

        it('★ 在 [0,1] 上单调不减', () =>
        {
            let prev = -Infinity;

            for (let i = 0; i <= 20; i++)
            {
                const v = Mathf.SmoothStep(0, 100, i / 20);

                expect(v, `t=${i / 20}`).toBeGreaterThanOrEqual(prev - 1e-9);
                prev = v;
            }
        });

        it('★ t 越界会被钳（SmoothStep 内部先 Clamp01）', () =>
        {
            expect(Mathf.SmoothStep(10, 20, 5)).toBeCloseTo(20, 12);
            expect(Mathf.SmoothStep(10, 20, -5)).toBeCloseTo(10, 12);
        });
    });

    describe('★ Approximately', () =>
    {
        it('★ 与自身相等；极接近的数为真；明显不同为假', () =>
        {
            expect(Mathf.Approximately(1, 1)).toBe(true);
            expect(Mathf.Approximately(1, 1 + 1e-9)).toBe(true);
            expect(Mathf.Approximately(1, 2)).toBe(false);
            expect(Mathf.Approximately(0, 0)).toBe(true);
        });
    });

    describe('★ Sign（反直觉点：Sign(0) 是 1 而不是 0）', () =>
    {
        it('★★ Sign(0) === 1 —— 实现是 f >= 0 ? 1 : -1，如实钉住', () =>
        {
            expect(Mathf.Sign(0)).toBe(1);
        });

        it('★ 正数为 1、负数为 −1', () =>
        {
            expect(Mathf.Sign(3.5)).toBe(1);
            expect(Mathf.Sign(-3.5)).toBe(-1);
        });
    });

    describe('★ 常量关系', () =>
    {
        it('★ Deg2Rad × 180 === PI；Rad2Deg 是它的倒数', () =>
        {
            expect(Mathf.Deg2Rad * 180).toBeCloseTo(Mathf.PI, 12);
            expect(Mathf.Rad2Deg).toBeCloseTo(1 / Mathf.Deg2Rad, 12);
        });

        it('★ Deg2Rad / Rad2Deg 互为逆运算（往返 45 度）', () =>
        {
            expect(45 * Mathf.Deg2Rad * Mathf.Rad2Deg).toBeCloseTo(45, 12);
        });

        it('PI / Infinity / NegativeInfinity 就是 Math 的同名值', () =>
        {
            expect(Mathf.PI).toBe(Math.PI);
            expect(Mathf.Infinity).toBe(Infinity);
            expect(Mathf.NegativeInfinity).toBe(-Infinity);
        });
    });

    describe('★ Min / Max 的多态', () =>
    {
        it('★ 变参形式（两个数）', () =>
        {
            expect(Mathf.Min(3, 5)).toBe(3);
            expect(Mathf.Max(3, 5)).toBe(5);
        });

        it('★ 数组形式', () =>
        {
            expect(Mathf.Min([4, 2, 9, 1])).toBe(1);
            expect(Mathf.Max([4, 2, 9, 1])).toBe(9);
        });

        it('★ 数组长度为 1 时返回该元素', () =>
        {
            expect(Mathf.Min([7])).toBe(7);
            expect(Mathf.Max([7])).toBe(7);
        });

        it('★ 空数组返回 0（实现里直接短路），如实钉住', () =>
        {
            expect(Mathf.Min([])).toBe(0);
            expect(Mathf.Max([])).toBe(0);
        });
    });

    describe('与 Math.* 一致的取整族', () =>
    {
        it('Ceil / Floor / Round / CeilToInt / FloorToInt / RoundToInt', () =>
        {
            expect(Mathf.Ceil(1.2)).toBe(2);
            expect(Mathf.Floor(1.8)).toBe(1);
            expect(Mathf.Round(1.5)).toBe(2);
            expect(Mathf.CeilToInt(1.2)).toBe(2);
            expect(Mathf.FloorToInt(1.8)).toBe(1);
            expect(Mathf.RoundToInt(1.4)).toBe(1);
        });

        it('Pow / Exp / Log / Log10 与 Math.* 一致', () =>
        {
            expect(Mathf.Pow(2, 10)).toBeCloseTo(1024, 10);
            expect(Mathf.Exp(0)).toBeCloseTo(1, 12);
            expect(Mathf.Log(Math.E)).toBeCloseTo(1, 12);
            expect(Mathf.Log10(1000)).toBeCloseTo(3, 12);
        });
    });
});
