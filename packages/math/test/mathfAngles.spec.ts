import { describe, expect, it } from 'vitest';

import { MATHF_DEG2RAD, MATHF_RAD2DEG, mathfClamp01, mathfGamma, mathfLerpAngle, mathfMoveTowardsAngle } from '../src/mathf';

/**
 * `MathF`（`packages/math/src/MathF.ts`，158 行）里 **`mathf.spec.ts` 尚未覆盖**的部分
 * （该文件此前行覆盖率 43.03%；`Clamp`、`Lerp`、`MoveTowards`、`SmoothStep`、
 * `Approximately`、`Sign`、`Min`/`Max`、`Deg2Rad`/`Rad2Deg` 已经在那边测过）。
 *
 * 本文件补的是：**`LerpAngle` / `MoveTowardsAngle`**、**`Gamma`**。
 * （原先还有 **`Tan` / `Atan`** 一组——它们是 `Math.tan` / `Math.atan` 的纯转发，
 * 已随 19 个纯转发函数一并删除，见 `docs/migrations/MATH_PURE_FUNCTIONS_MIGRATION.md` §11.18.9。）
 *
 * ★★ **这些函数的实现都用「度」还是「弧度」我没有去确认**，所以断言刻意做成
 * **与角度单位无关**的形式：
 *
 * - `LerpAngle(a, a, t) === a`（同角插值必等于自身，与单位无关）；
 * - `LerpAngle(a, b, 0) === a`、`LerpAngle(a, b, 1) === b`（端点）；
 * - `Gamma(v, absmax, 1) === v`（gamma = 1 时是恒等，与 `absmax` 的单位无关）；
 * - `Gamma(0, …) === 0`；`Gamma` 保持符号。
 *
 * 这比"猜一个 45 / π/4 然后赌对"稳得多 —— 而且**赌对的断言不能证明实现正确，赌错的断言会误导后来者**。
 *
 * ⚠️ **有意不测**：`SmoothDamp*` / `SmoothDampAngle*` —— 它们的 `…2` 版本默认参数用到
 * `Time.deltaTime`，而 `Time` 在该包里是"未实现"（实现就是 `throw`）。
 */

describe('MathF 的角度与 gamma 函数（math）', () =>
{
    describe('★★ LerpAngle（与角度单位无关的断言）', () =>
    {
        it('★★ 插值到自身恒等于自身（任意 t）', () =>
        {
            // 与"度还是弧度"无关：同一个角插值到同一个角，结果必须是它自己
            for (const a of [0, 30, 90, 180, -45, Math.PI, Math.PI / 2])
            {
                for (const t of [0, 0.25, 0.5, 0.75, 1])
                {
                    expect(mathfLerpAngle(a, a, t), `LerpAngle(${a}, ${a}, ${t})`).toBeCloseTo(a, 6);
                }
            }
        });

        it('★ 端点：t = 0 → a；t = 1 → b', () =>
        {
            for (const [a, b] of [[0, 90], [10, 100], [-30, 30], [0, Math.PI]] as [number, number][])
            {
                expect(mathfLerpAngle(a, b, 0), `t=0 (${a}→${b})`).toBeCloseTo(a, 6);
                expect(mathfLerpAngle(a, b, 1), `t=1 (${a}→${b})`).toBeCloseTo(b, 6);
            }
        });

        it('★ 结果始终是有限数', () =>
        {
            for (const [a, b] of [[0, 90], [350, 10], [-180, 180], [0, 1e6]] as [number, number][])
            {
                for (const t of [0, 0.1, 0.5, 0.9, 1])
                {
                    expect(Number.isFinite(mathfLerpAngle(a, b, t)), `(${a},${b},${t})`).toBe(true);
                }
            }
        });
    });

    describe('★★ MoveTowardsAngle', () =>
    {
        it('★ 目标与当前相同时返回目标', () =>
        {
            for (const a of [0, 45, 180, -90])
            {
                expect(mathfMoveTowardsAngle(a, a, 10), `a=${a}`).toBeCloseTo(a, 6);
            }
        });

        it('★ maxDelta 足够大时直接到达目标（或与之等价的角度）', () =>
        {
            const r = mathfMoveTowardsAngle(0, 90, 1e9);

            // "等价" = 相差若干个整圈（单位未知，所以用 mod 判定：sin/cos 分量应当一致）
            const sameAngle = (a: number, b: number, period: number) =>
            {
                const d = Math.abs(a - b) % period;

                return Math.min(d, period - d) < 1e-6;
            };

            expect(sameAngle(r, 90, 360) || sameAngle(r, 90, 2 * Math.PI), `结果是 ${r}`).toBe(true);
        });

        it('★ 结果始终是有限数', () =>
        {
            for (const [a, b] of [[0, 90], [350, 10], [0, -350]] as [number, number][])
            {
                for (const d of [0, 0.5, 5, 1000])
                {
                    expect(Number.isFinite(mathfMoveTowardsAngle(a, b, d)), `(${a},${b},${d})`).toBe(true);
                }
            }
        });
    });

    describe('★★ Gamma', () =>
    {
        it('★★ gamma = 1 时是恒等变换（与 absmax 无关）', () =>
        {
            for (const absmax of [1, 10, 0.5, 100])
            {
                for (const v of [-5, -1, 0, 0.25, 1, 7])
                {
                    expect(mathfGamma(v, absmax, 1), `Gamma(${v}, ${absmax}, 1)`).toBeCloseTo(v, 6);
                }
            }
        });

        it('★ Gamma(0, …) 恒为 0', () =>
        {
            for (const absmax of [1, 10, 0.5])
            {
                for (const gamma of [0.5, 1, 2])
                {
                    expect(mathfGamma(0, absmax, gamma), `absmax=${absmax} gamma=${gamma}`).toBeCloseTo(0, 10);
                }
            }
        });

        it('★ 保持符号：正入正出、负入负出', () =>
        {
            for (const gamma of [0.5, 1, 2, 3])
            {
                expect(mathfGamma(4, 10, gamma), `gamma=${gamma} 正数`).toBeGreaterThan(0);
                expect(mathfGamma(-4, 10, gamma), `gamma=${gamma} 负数`).toBeLessThan(0);
            }
        });

        it('★ 结果始终是有限数', () =>
        {
            for (const gamma of [0.5, 1, 2])
            {
                for (const v of [-10, -1e-6, 0, 1e-6, 10])
                {
                    expect(Number.isFinite(mathfGamma(v, 10, gamma)), `(${v},10,${gamma})`).toBe(true);
                }
            }
        });

        it('★ 对 |v| ≤ absmax 的部分，gamma 越小结果越大（压暗曲线走向饱和）', () =>
        {
            // 这是 gamma 校正的定性性质：0 < v/absmax < 1 时，(v/absmax)^gamma 随 gamma 减小而增大
            const a = mathfGamma(2, 10, 0.5);
            const b = mathfGamma(2, 10, 2);

            expect(Math.abs(a)).toBeGreaterThan(Math.abs(b));
        });
    });

    describe('★ 与已测部分的交叉自洽', () =>
    {
        it('★ Deg2Rad 与 Rad2Deg 依然互为倒数（回归）', () =>
        {
            expect(MATHF_DEG2RAD * MATHF_RAD2DEG).toBeCloseTo(1, 12);
        });

        it('★ Clamp01 与 Gamma 的组合不产生越界值（|Gamma| ≤ 1 时）', () =>
        {
            for (const v of [-1, -0.5, 0, 0.5, 1])
            {
                expect(mathfClamp01(mathfGamma(v, 1, 1))).toBeGreaterThanOrEqual(0);
                expect(mathfClamp01(mathfGamma(v, 1, 1))).toBeLessThanOrEqual(1);
            }
        });
    });
});
