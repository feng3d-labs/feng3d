import { describe, expect, it } from 'vitest';

import { BezierCurve } from '../src/curve/BezierCurve';

/**
 * `BezierCurve`（`packages/math/src/curve/`；此前行覆盖率 0.67%）。
 *
 * 标量版贝塞尔曲线族，包含 `linear` / `quadratic` / `cubic` 各自的一阶与二阶导数，以及通用的 n 次形式 `bn`。
 *
 * 断言刻意用**独立对照**（而不是"抄实现"）：
 * - 值：对照标准闭式 `Σ C(n,i)·(1-t)^(n-i)·t^i·p_i`；
 * - **一阶导：对照中心差分的数值导数**；
 * - 二阶导：`quadraticSecondDerivative` 应当是**常数** `2(p0 - 2p1 + p2)`；
 * - **`bn` 与 `linear`/`quadratic`/`cubic` 在相同数据上必须一致**（同一族的一致性）。
 */

const curve = new BezierCurve();

/** 标准伯恩斯坦形式：n 次贝塞尔在 t 处的值 */
function bezier(n: number, t: number, ps: number[]): number
{
    let sum = 0;
    for (let i = 0; i <= n; i++)
    {
        const binom = factorial(n) / (factorial(i) * factorial(n - i));

        sum += binom * (1 - t) ** (n - i) * t ** i * ps[i];
    }

    return sum;
}

function factorial(n: number): number
{
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;

    return r;
}

/** 中心差分近似一阶导 */
function diff1(f: (t: number) => number, t: number, h = 1e-6): number
{
    return (f(t + h) - f(t - h)) / (2 * h);
}

/** 中心差分近似二阶导 */
function diff2(f: (t: number) => number, t: number, h = 1e-4): number
{
    return (f(t + h) - 2 * f(t) + f(t - h)) / (h * h);
}

describe('BezierCurve（math/curve）', () =>
{
    describe('linear', () =>
    {
        it('★ 端点与中点符合直线插值', () =>
        {
            expect(curve.linear(0, 3, 9)).toBeCloseTo(3, 10);
            expect(curve.linear(1, 3, 9)).toBeCloseTo(9, 10);
            expect(curve.linear(0.5, 3, 9)).toBeCloseTo(6, 10);
        });

        it('★ 与 p0 + (p1 - p0)·t 在整段 t 上一致', () =>
        {
            const [p0, p1] = [-2, 5];

            for (let i = 0; i <= 10; i++)
            {
                const t = i / 10;

                expect(curve.linear(t, p0, p1), `t=${t}`).toBeCloseTo(p0 + (p1 - p0) * t, 10);
            }
        });

        it('两端取相同值时整条曲线恒定', () =>
        {
            for (const t of [0, 0.25, 0.5, 0.75, 1])
            {
                expect(curve.linear(t, 4, 4), `t=${t}`).toBeCloseTo(4, 10);
            }
        });
    });

    describe('quadratic / cubic（对照标准伯恩斯坦形式）', () =>
    {
        it('★ quadratic 在整段 t 上与标准闭式一致', () =>
        {
            const ps = [1, -3, 7];

            for (let i = 0; i <= 10; i++)
            {
                const t = i / 10;

                expect(curve.quadratic(t, ps[0], ps[1], ps[2]), `t=${t}`).toBeCloseTo(bezier(2, t, ps), 9);
            }
        });

        it('quadratic 的端点落在 p0 / p2', () =>
        {
            expect(curve.quadratic(0, 1, -3, 7)).toBeCloseTo(1, 10);
            expect(curve.quadratic(1, 1, -3, 7)).toBeCloseTo(7, 10);
        });

        it('★ cubic 在整段 t 上与标准闭式一致', () =>
        {
            const ps = [2, -1, 5, 11];

            for (let i = 0; i <= 10; i++)
            {
                const t = i / 10;

                expect(curve.cubic(t, ps[0], ps[1], ps[2], ps[3]), `t=${t}`).toBeCloseTo(bezier(3, t, ps), 9);
            }
        });

        it('cubic 的端点落在 p0 / p3', () =>
        {
            expect(curve.cubic(0, 2, -1, 5, 11)).toBeCloseTo(2, 10);
            expect(curve.cubic(1, 2, -1, 5, 11)).toBeCloseTo(11, 10);
        });
    });

    describe('一阶导数（对照数值中心差分）', () =>
    {
        it('★ linearDerivative 等于 p1 - p0（常数）', () =>
        {
            const [p0, p1] = [3, 9];

            for (const t of [0, 0.25, 0.5, 0.75, 1])
            {
                expect(curve.linearDerivative(t, p0, p1), `t=${t}`).toBeCloseTo(p1 - p0, 8);
            }
        });

        it('★ quadraticDerivative 与数值一阶导一致', () =>
        {
            const ps = [1, -3, 7];
            const f = (t: number) => curve.quadratic(t, ps[0], ps[1], ps[2]);

            for (const t of [0.1, 0.25, 0.5, 0.75, 0.9])
            {
                expect(curve.quadraticDerivative(t, ps[0], ps[1], ps[2]), `t=${t}`).toBeCloseTo(diff1(f, t), 5);
            }
        });

        it('★ cubicDerivative 与数值一阶导一致', () =>
        {
            const ps = [2, -1, 5, 11];
            const f = (t: number) => curve.cubic(t, ps[0], ps[1], ps[2], ps[3]);

            for (const t of [0.1, 0.25, 0.5, 0.75, 0.9])
            {
                expect(curve.cubicDerivative(t, ps[0], ps[1], ps[2], ps[3]), `t=${t}`).toBeCloseTo(diff1(f, t), 5);
            }
        });
    });

    describe('二阶导数', () =>
    {
        it('★ quadraticSecondDerivative 是常数 2·(p0 − 2·p1 + p2)', () =>
        {
            const [p0, p1, p2] = [1, -3, 7];
            const expected = 2 * (p0 - 2 * p1 + p2);

            for (const t of [0, 0.25, 0.5, 0.75, 1])
            {
                expect(curve.quadraticSecondDerivative(t, p0, p1, p2), `t=${t}`).toBeCloseTo(expected, 8);
            }
        });

        it('linearSecondDerivative 恒为 0（直线没有曲率）', () =>
        {
            for (const t of [0, 0.5, 1])
            {
                expect(curve.linearSecondDerivative(t, 3, 9), `t=${t}`).toBeCloseTo(0, 10);
            }
        });

        it('★ cubicSecondDerivative 与数值二阶导一致', () =>
        {
            const ps = [2, -1, 5, 11];
            const f = (t: number) => curve.cubic(t, ps[0], ps[1], ps[2], ps[3]);

            for (const t of [0.25, 0.5, 0.75])
            {
                expect(curve.cubicSecondDerivative(t, ps[0], ps[1], ps[2], ps[3]), `t=${t}`).toBeCloseTo(diff2(f, t), 2);
            }
        });
    });

    describe('bn（n 次通用形式）', () =>
    {
        it('★ bn 在 1 / 2 / 3 次时与 linear / quadratic / cubic 完全一致', () =>
        {
            const ps = [2, -1, 5, 11];

            for (let i = 0; i <= 10; i++)
            {
                const t = i / 10;

                expect(curve.bn(t, [ps[0], ps[1]]), `1 次 t=${t}`).toBeCloseTo(curve.linear(t, ps[0], ps[1]), 9);
                expect(curve.bn(t, [ps[0], ps[1], ps[2]]), `2 次 t=${t}`).toBeCloseTo(curve.quadratic(t, ps[0], ps[1], ps[2]), 9);
                expect(curve.bn(t, ps), `3 次 t=${t}`).toBeCloseTo(curve.cubic(t, ps[0], ps[1], ps[2], ps[3]), 9);
            }
        });

        it('★ bn 的端点落在首末控制点', () =>
        {
            const ps = [2, -1, 5, 11, -4];

            expect(curve.bn(0, ps)).toBeCloseTo(ps[0], 9);
            expect(curve.bn(1, ps)).toBeCloseTo(ps[ps.length - 1], 9);
        });

        it('★ bn 在 4 次时与标准伯恩斯坦形式一致', () =>
        {
            const ps = [1, 2, 3, 4, 5];

            for (let i = 0; i <= 10; i++)
            {
                const t = i / 10;

                expect(curve.bn(t, ps), `t=${t}`).toBeCloseTo(bezier(4, t, ps), 9);
            }
        });

        it('★ bnDerivative 与数值一阶导一致', () =>
        {
            const ps = [1, 2, 3, 4, 5];
            const f = (t: number) => curve.bn(t, ps);

            for (const t of [0.2, 0.5, 0.8])
            {
                expect(curve.bnDerivative(t, ps), `t=${t}`).toBeCloseTo(diff1(f, t), 4);
            }
        });

        it('★ bnSecondDerivative 在 2 次时等于 quadraticSecondDerivative（闭式对照）', () =>
        {
            const ps = [1, -3, 7];
            const expected = 2 * (ps[0] - 2 * ps[1] + ps[2]);

            for (const t of [0, 0.3, 0.5, 0.7, 1])
            {
                expect(curve.bnSecondDerivative(t, ps), `t=${t}`).toBeCloseTo(expected, 8);
            }
        });

        it('★ 等距共线的控制点 → 曲线退化为直线 → 二阶导恒为 0', () =>
        {
            // ⚠️ 这条最初被写成"与数值二阶导同号"，结果失败：`ps = [1,2,3,4,5]` 是**等距共线**的
            // 控制点，贝塞尔曲线会退化成那条直线，因此 B''(t) ≡ 0 是**正确**的；
            // 而中心差分 h=1e-4 除以 h²=1e-8 会把浮点误差放大，数值结果反而不是 0。
            // 这里改为如实钉住这个数学事实。
            for (const t of [0.3, 0.5, 0.7])
            {
                expect(curve.bnSecondDerivative(t, [1, 2, 3, 4, 5]), `t=${t}`).toBeCloseTo(0, 8);
            }
        });

        it('bnSecondDerivative 在控制点少于 3 个时返回 0（实现里的早退）', () =>
        {
            expect(curve.bnSecondDerivative(0.5, [1, 2])).toBe(0);
            expect(curve.bnSecondDerivative(0.5, [1])).toBe(0);
            expect(curve.bnSecondDerivative(0.5, [])).toBe(0);
        });
    });
});
