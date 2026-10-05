import { describe, expect, it } from 'vitest';

import * as mathfModule from '../src/mathf';
import { MATHF_DEG2RAD, MATHF_INFINITY, MATHF_NEGATIVE_INFINITY, MATHF_PI, MATHF_RAD2DEG, mathfApproximately, mathfClamp, mathfClamp01, mathfLerp, mathfLerpUnclamped, mathfMax, mathfMin, mathfMoveTowards, mathfSign, mathfSmoothStep } from '../src/mathf';

/**
 * `Mathf`（`packages/math/src/MathF.ts`，158 行，此前**行覆盖率 4.43%**）。
 *
 * Unity 风格的数学工具类（40+ 个 `static`）。全是纯函数，所以断言可以用**数学关系**表达。
 *
 * 实测到的几处**反直觉语义**（都如实钉在下面）：
 * - **`Lerp` 会把 `t` 钳到 `[0,1]`**，`LerpUnclamped` 不会 —— 这是两者唯一的差别；
 * - **`Sign(0) === 1`**（实现是 `f >= 0 ? 1 : -1`），不是 0；
 * - **`Min([])` / `Max([])` 返回 `0`**（空数组直接短路）。
 *
 * ⚠️ 原文件里「三角函数按弧度」「Ceil / Floor / Round / Pow / Exp / Log 与 `Math.*` 一致」
 * 两组用例已随 19 个**纯转发函数**一并删除（它们只在测 `Math.*` 本身，不覆盖本包任何实现）；
 * 同一批改动留下了文件末尾的**不回退守卫**。依据见
 * `docs/MATH_PURE_FUNCTIONS_MIGRATION.md` §11.18.9。
 */

describe('Mathf（math）', () =>
{
    describe('★ Clamp / Clamp01', () =>
    {
        it('★ 区间内的值原样返回，越界被钳到端点', () =>
        {
            expect(mathfClamp(5, 0, 10)).toBe(5);
            expect(mathfClamp(-1, 0, 10)).toBe(0);
            expect(mathfClamp(11, 0, 10)).toBe(10);
            expect(mathfClamp(0, 0, 10)).toBe(0);
            expect(mathfClamp(10, 0, 10)).toBe(10);
        });

        it('★ Clamp01 把值限定在 [0,1]', () =>
        {
            expect(mathfClamp01(-0.5)).toBe(0);
            expect(mathfClamp01(0.25)).toBeCloseTo(0.25, 12);
            expect(mathfClamp01(1.5)).toBe(1);
        });
    });

    describe('★ Lerp / LerpUnclamped（唯一的差别是 t 是否被钳）', () =>
    {
        it('★ 端点：t=0 得 a，t=1 得 b；t=0.5 得中点', () =>
        {
            expect(mathfLerp(10, 20, 0)).toBeCloseTo(10, 12);
            expect(mathfLerp(10, 20, 1)).toBeCloseTo(20, 12);
            expect(mathfLerp(10, 20, 0.5)).toBeCloseTo(15, 12);
        });

        it('★★ Lerp 会把越界的 t 钳住，LerpUnclamped 会外推', () =>
        {
            // t = 2 → Lerp 当成 1 → 得 b；LerpUnclamped 得 a + (b-a)*2
            expect(mathfLerp(10, 20, 2)).toBeCloseTo(20, 12);
            expect(mathfLerp(10, 20, -1)).toBeCloseTo(10, 12);

            expect(mathfLerpUnclamped(10, 20, 2)).toBeCloseTo(30, 12);
            expect(mathfLerpUnclamped(10, 20, -1)).toBeCloseTo(0, 12);
        });

        it('LerpUnclamped 在 [0,1] 内与 Lerp 完全一致', () =>
        {
            for (const t of [0, 0.1, 0.5, 0.9, 1])
            {
                expect(mathfLerpUnclamped(3, 7, t), `t=${t}`).toBeCloseTo(mathfLerp(3, 7, t), 12);
            }
        });
    });

    describe('★ MoveTowards', () =>
    {
        it('★ 差距不超过 maxDelta 时直接到 target（不会越过）', () =>
        {
            expect(mathfMoveTowards(0, 10, 100)).toBe(10);
            expect(mathfMoveTowards(0, 10, 10)).toBe(10);
        });

        it('★ 否则朝 target 方向走 maxDelta', () =>
        {
            expect(mathfMoveTowards(0, 10, 3)).toBeCloseTo(3, 12);
            expect(mathfMoveTowards(10, 0, 3)).toBeCloseTo(7, 12);
        });

        it('★ current 已经在 target 上时返回 target', () =>
        {
            expect(mathfMoveTowards(5, 5, 1)).toBe(5);
        });
    });

    describe('★ SmoothStep', () =>
    {
        it('★ 端点：t=0 → from，t=1 → to', () =>
        {
            expect(mathfSmoothStep(10, 20, 0)).toBeCloseTo(10, 12);
            expect(mathfSmoothStep(10, 20, 1)).toBeCloseTo(20, 12);
        });

        it('★ t=0.5 → 中点（因为 3t²−2t³ 在 0.5 处正好是 0.5）', () =>
        {
            expect(mathfSmoothStep(10, 20, 0.5)).toBeCloseTo(15, 12);
        });

        it('★ 在 [0,1] 上单调不减', () =>
        {
            let prev = -Infinity;

            for (let i = 0; i <= 20; i++)
            {
                const v = mathfSmoothStep(0, 100, i / 20);

                expect(v, `t=${i / 20}`).toBeGreaterThanOrEqual(prev - 1e-9);
                prev = v;
            }
        });

        it('★ t 越界会被钳（SmoothStep 内部先 Clamp01）', () =>
        {
            expect(mathfSmoothStep(10, 20, 5)).toBeCloseTo(20, 12);
            expect(mathfSmoothStep(10, 20, -5)).toBeCloseTo(10, 12);
        });
    });

    describe('★ Approximately', () =>
    {
        it('★ 与自身相等；极接近的数为真；明显不同为假', () =>
        {
            expect(mathfApproximately(1, 1)).toBe(true);
            expect(mathfApproximately(1, 1 + 1e-9)).toBe(true);
            expect(mathfApproximately(1, 2)).toBe(false);
            expect(mathfApproximately(0, 0)).toBe(true);
        });
    });

    describe('★ Sign（反直觉点：Sign(0) 是 1 而不是 0）', () =>
    {
        it('★★ Sign(0) === 1 —— 实现是 f >= 0 ? 1 : -1，如实钉住', () =>
        {
            expect(mathfSign(0)).toBe(1);
        });

        it('★ 正数为 1、负数为 −1', () =>
        {
            expect(mathfSign(3.5)).toBe(1);
            expect(mathfSign(-3.5)).toBe(-1);
        });
    });

    describe('★ 常量关系', () =>
    {
        it('★ Deg2Rad × 180 === PI；Rad2Deg 是它的倒数', () =>
        {
            expect(MATHF_DEG2RAD * 180).toBeCloseTo(MATHF_PI, 12);
            expect(MATHF_RAD2DEG).toBeCloseTo(1 / MATHF_DEG2RAD, 12);
        });

        it('★ Deg2Rad / Rad2Deg 互为逆运算（往返 45 度）', () =>
        {
            expect(45 * MATHF_DEG2RAD * MATHF_RAD2DEG).toBeCloseTo(45, 12);
        });

        it('PI / Infinity / NegativeInfinity 就是 Math 的同名值', () =>
        {
            expect(MATHF_PI).toBe(Math.PI);
            expect(MATHF_INFINITY).toBe(Infinity);
            expect(MATHF_NEGATIVE_INFINITY).toBe(-Infinity);
        });
    });

    describe('★ Min / Max 的多态', () =>
    {
        it('★ 变参形式（两个数）', () =>
        {
            expect(mathfMin(3, 5)).toBe(3);
            expect(mathfMax(3, 5)).toBe(5);
        });

        it('★ 数组形式', () =>
        {
            expect(mathfMin([4, 2, 9, 1])).toBe(1);
            expect(mathfMax([4, 2, 9, 1])).toBe(9);
        });

        it('★ 数组长度为 1 时返回该元素', () =>
        {
            expect(mathfMin([7])).toBe(7);
            expect(mathfMax([7])).toBe(7);
        });

        it('★ 空数组返回 0（实现里直接短路），如实钉住', () =>
        {
            expect(mathfMin([])).toBe(0);
            expect(mathfMax([])).toBe(0);
        });
    });

    describe('★★ 19 个「对 Math.* 的纯转发」已删除（不回退守卫）', () =>
    {
        /**
         * 这 19 个名字原先的实现就是对 `Math.*` 的逐字转发，实测（源码层抽表达式 +
         * 21 个边界值的一元 21 组 / 二元 441 组样本 + `Object.is` 比较）与 `Math.*` 全等，
         * 因此删除、消费点改调 `Math.*`。**这个名字清单是删除决策的可执行记录**：
         * 谁把它们加回来，这个用例就会红。
         */
        const REMOVED = [
            'mathfSin', 'mathfCos', 'mathfTan', 'mathfAsin', 'mathfAcos', 'mathfAtan', 'mathfAtan2',
            'mathfSqrt', 'mathfAbs', 'mathfPow', 'mathfExp', 'mathfLog', 'mathfLog10',
            'mathfCeil', 'mathfFloor', 'mathfRound',
            'mathfCeilToInt', 'mathfFloorToInt', 'mathfRoundToInt',
        ];

        it('模块不再导出这 19 个名字', () =>
        {
            const exports = mathfModule as unknown as Record<string, unknown>;

            for (const name of REMOVED)
            {
                expect(exports[name], `${name} 已被删除，不应再导出`).toBeUndefined();
            }
        });

        it('保留下的成员仍在（防止连坐误删）', () =>
        {
            const exports = mathfModule as unknown as Record<string, unknown>;

            for (const name of ['mathfMin', 'mathfMax', 'mathfSign', 'mathfClamp', 'mathfClamp01', 'mathfLerp', 'mathfLerpUnclamped'])
            {
                expect(typeof exports[name], name).toBe('function');
            }
        });
    });
});
