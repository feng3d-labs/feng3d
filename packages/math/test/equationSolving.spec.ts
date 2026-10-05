import { describe, expect, it } from 'vitest';

import { equationSolvingBinary, equationSolvingGetDerivative, equationSolvingHasSolution, equationSolvingLine, equationSolvingSecant, equationSolvingTangent } from '../src/bezier/equationSolving';

/**
 * `EquationSolving`（`packages/math/src/bezier/`；此前行覆盖率 0.68%）。
 *
 * 数值求根工具，含四种方法：`binary`（二分）、`line`（连线法）、`secant`（割线法）、
 * `tangent`（切线/牛顿法），以及 `getDerivative`（数值导数）、`hasSolution`（区间有解判断）。
 *
 * 断言以**数学事实**为准（根是精确已知的），并用**四种方法交叉一致**做相互验证：
 * - `f(x) = x² − 4` 在 `[0, 5]` 上的根是 **2**；
 * - `f(x) = cos(x)` 在 `[0, 3]` 上的根是 **π/2**；
 * - `f(x) = x² + 1` **无实根** → `hasSolution` 为假、`binary` 返回 `undefined` 并触发 `errorcallback`。
 *
 * 注意 `binary` 的返回值类型是 `number | undefined`（无解时 `undefined`）。
 */

describe('EquationSolving（math/bezier）', () =>
{
    describe('binary（二分法）', () =>
    {
        it('★ x² − 4 在 [0, 5] 上的根是 2', () =>
        {
            const root = equationSolvingBinary((x) => x * x - 4, 0, 5);

            expect(root).toBeDefined();
            expect(root!).toBeCloseTo(2, 5);
        });

        it('★ 线性函数的根可以精确求得', () =>
        {
            const root = equationSolvingBinary((x) => x - 3, 0, 10);

            expect(root!).toBeCloseTo(3, 5);
        });

        it('★ cos(x) 在 [0, 3] 上的根是 π/2', () =>
        {
            const root = equationSolvingBinary((x) => Math.cos(x), 0, 3);

            expect(root!).toBeCloseTo(Math.PI / 2, 5);
        });

        it('★ 端点是根时直接返回该端点（实现里的提前返回）', () =>
        {
            // f(0) = 0 → 直接返回 a
            expect(equationSolvingBinary((x) => x, 0, 5)).toBeCloseTo(0, 10);
            // f(5) = 0 → 直接返回 b
            expect(equationSolvingBinary((x) => x - 5, 0, 5)).toBeCloseTo(5, 10);
        });

        it('★ 无实根时返回 undefined', () =>
        {
            // x² + 1 恒正 → 区间两端同号 → 无解
            expect(equationSolvingBinary((x) => x * x + 1, 0, 5)).toBeUndefined();
        });

        it('★ 无解时会调用 errorcallback', () =>
        {
            let called = 0;
            let message = '';

            const root = equationSolvingBinary((x) => x * x + 1, 0, 5, 1e-7, (err) =>
            {
                called++;
                message = err.message;
            });

            expect(root).toBeUndefined();
            expect(called).toBeGreaterThan(0);
            expect(typeof message).toBe('string');
        });
    });

    describe('★ 四种方法交叉一致（同一函数、同一区间）', () =>
    {
        const f = (x: number) => x * x - 4;
        const f1 = (x: number) => 2 * x;
        const f2 = () => 2;

        it('binary / line / secant / tangent 给出的根一致（都在 2 附近）', () =>
        {
            // ⚠️ tangent（牛顿法）的起点必须避开 f'(x) = 0 的点：
            // f(x) = x² - 4 在 x = 0 处 f'(0) = 0，从 0 起步会除以 0 而发散，
            // 实现此时**返回 undefined（静默失败）**——这是本轮实测到的行为，已记进 issue。
            const roots: [string, number | undefined][] = [
                ['binary', equationSolvingBinary(f, 0, 5)],
                ['line', equationSolvingLine(f, 0, 5)],
                ['secant', equationSolvingSecant(f, 0, 5)],
                ['tangent', equationSolvingTangent(f, f1, f2, 1, 5)],
            ];

            for (const [name, root] of roots)
            {
                expect(root, `${name} 应当求出根`).toBeDefined();
                expect(root!, `${name} 的根`).toBeCloseTo(2, 4);
            }
        });

        it('★ tangent 在导数为 0 的起点上返回 undefined（静默失败，实测行为）', () =>
        {
            // f'(0) = 0 → 牛顿法除以 0 → 实现返回 undefined，而不是抛错或报告原因。
            // 这里如实钉住当前行为（是否应改为报错，留给后续讨论，不在本 PR 改 src）。
            expect(equationSolvingTangent(f, f1, f2, 0, 5)).toBeUndefined();
        });
    });

    describe('hasSolution（区间有解判断）', () =>
    {
        it('★ 两端异号 → 有解', () =>
        {
            expect(equationSolvingHasSolution((x) => x * x - 4, 0, 5)).toBe(true);
        });

        it('★ 两端同号且无根 → 无解', () =>
        {
            expect(equationSolvingHasSolution((x) => x * x + 1, 0, 5)).toBe(false);
        });
    });

    describe('getDerivative（数值导数）', () =>
    {
        it('★ 与解析导数一致（多项式）', () =>
        {
            const f = (x: number) => 3 * x * x - 2 * x + 1;
            const df = (x: number) => 6 * x - 2;

            for (const x of [-2, -0.5, 0, 1, 3])
            {
                expect(equationSolvingGetDerivative(f, 1e-6)(x), `x=${x}`).toBeCloseTo(df(x), 4);
            }
        });

        it('★ 与解析导数一致（三角函数）', () =>
        {
            const f = (x: number) => Math.sin(x);
            const df = (x: number) => Math.cos(x);

            for (const x of [0, 1, 2])
            {
                expect(equationSolvingGetDerivative(f, 1e-6)(x), `x=${x}`).toBeCloseTo(df(x), 4);
            }
        });

        it('返回的是一个函数（可以反复调用）', () =>
        {
            const d = equationSolvingGetDerivative((x) => x * x, 1e-6);

            expect(typeof d).toBe('function');
            expect(d(2)).toBeCloseTo(4, 4);
            expect(d(3)).toBeCloseTo(6, 4);
        });
    });

    describe('纯函数无状态', () =>
    {
        it('同一输入重复调用结果一致（原「实例与单例一致」的等价形式）', () =>
        {
            expect(equationSolvingBinary((x) => x - 7, 0, 10)!).toBeCloseTo(7, 5);
            expect(equationSolvingBinary((x) => x - 7, 0, 10)!).toBeCloseTo(7, 5);
        });
    });
});
