import { describe, expect, it } from 'vitest';

import { highFunctionGetValue } from '../src/bezier/highFunction';

/**
 * `HighFunction`（`packages/math/src/bezier/`；此前行覆盖率 0%）。
 *
 * 一个"n 次多项式求值器"：构造时给**系数数组** `as`（从**高次到常数**），
 * `getValue(x)` 用**霍纳法**（Horner's method）求值：
 *
 * ```ts
 * let v = 0;
 * for (let i = 0, n = as.length; i < n; i++) v = v * x + as[i];
 * ```
 *
 * 也就是 `f(x) = as[0]·x^(n-1) + as[1]·x^(n-2) + … + as[n-1]`。
 *
 * 断言以**展开式**为准（不抄霍纳法本身），并覆盖边界：0 次（单个系数）、空数组。
 *
 * 注：该文件的文档注释写着"处理N次函数定义，**求值，方程求解**问题"，
 * 但**实际只实现了求值**（没有方程求解入口）——这一点记在本 issue 里，不在本 PR 改代码。
 */

/** 朴素展开式：Σ as[i] · x^(n-1-i)，与霍纳法互为独立对照 */
function naive(as: number[], x: number): number
{
    const n = as.length;
    let sum = 0;

    for (let i = 0; i < n; i++) sum += as[i] * x ** (n - 1 - i);

    return sum;
}

describe('HighFunction（math/bezier）', () =>
{
    it('★ [2, 3] 表示 f(x) = 2x + 3', () =>
    {
        const f = { as: [2, 3] };

        expect(highFunctionGetValue(f, 0)).toBeCloseTo(3, 10);
        expect(highFunctionGetValue(f, 1)).toBeCloseTo(5, 10);
        expect(highFunctionGetValue(f, -1.5)).toBeCloseTo(0, 10);
        expect(highFunctionGetValue(f, 10)).toBeCloseTo(23, 10);
    });

    it('★ [1, 0, 0] 表示 f(x) = x²', () =>
    {
        const f = { as: [1, 0, 0] };

        for (const x of [-3, -1, 0, 1, 2, 5])
        {
            expect(highFunctionGetValue(f, x), `x=${x}`).toBeCloseTo(x * x, 10);
        }
    });

    it('★ [1] 是 0 次常数函数（与 x 无关）', () =>
    {
        const f = { as: [7] };

        for (const x of [-100, 0, 0.5, 100])
        {
            expect(highFunctionGetValue(f, x), `x=${x}`).toBeCloseTo(7, 10);
        }
    });

    it('空系数数组返回 0（循环不执行）', () =>
    {
        const f = { as: [] };

        for (const x of [-1, 0, 1]) expect(highFunctionGetValue(f, x), `x=${x}`).toBe(0);
    });

    it('★ 三次多项式展开对照：[2, -3, 0, 5] = 2x³ − 3x² + 5', () =>
    {
        const f = { as: [2, -3, 0, 5] };

        for (const x of [-2, -0.5, 0, 0.5, 1, 3])
        {
            expect(highFunctionGetValue(f, x), `x=${x}`).toBeCloseTo(2 * x ** 3 - 3 * x ** 2 + 5, 9);
        }
    });

    it('★ 与朴素多项式求和逐点一致（多组系数 × 多组 x）', () =>
    {
        const coefficientSets: number[][] = [
            [1],
            [0, 0],
            [1, 1],
            [-2, 0, 3],
            [0.5, -1.25, 2, -0.75],
            [1, 2, 3, 4, 5],
            [-1, 0, 0, 0, 0, 1],
        ];
        const xs = [-3, -1.1, -0.5, 0, 0.5, 1.1, 3];

        for (const as of coefficientSets)
        {
            const f = { as: as };

            for (const x of xs)
            {
                expect(highFunctionGetValue(f, x), `as=[${as}] x=${x}`).toBeCloseTo(naive(as, x), 8);
            }
        }
    });

    it('系数数组被按引用持有（装配后修改原数组会影响结果 —— 如实钉住该行为）', () =>
    {
        const as = [1, 0];
        const f = { as: as };

        expect(highFunctionGetValue(f, 2)).toBeCloseTo(2, 10);

        // 纯数据装配是 `{ as }`（不做拷贝），因此外部改动会生效
        as[0] = 3;

        expect(highFunctionGetValue(f, 2)).toBeCloseTo(6, 10);
    });

    it('不产生 NaN / Infinity（有限系数与有限 x）', () =>
    {
        const f = { as: [1, -2, 3, -4, 5] };

        for (const x of [-10, -1, 0, 1, 10])
        {
            expect(Number.isFinite(highFunctionGetValue(f, x)), `x=${x}`).toBe(true);
        }
    });
});
