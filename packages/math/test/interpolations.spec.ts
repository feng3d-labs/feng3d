import { describe, expect, it } from 'vitest';

import { interpolationsCatmullRom, interpolationsCubicBezier, interpolationsQuadraticBezier } from '../src/shape/core/interpolations';

/**
 * `Interpolations`（`packages/math/src/shape/core/`；此前行覆盖率 0%）。
 *
 * 它是 `shape/curves/` 那批曲线类的**底层**（`QuadraticBezierCurve2` / `CubicBezierCurve2` 等都调它），
 * 三个 static 方法都是纯数值插值，断言可以**精确到闭式公式**：
 *
 * - `QuadraticBezier(0.5, p0, p1, p2) = 0.25·p0 + 0.5·p1 + 0.25·p2`
 * - `CubicBezier(0.5, …) = (p0 + 3·p1 + 3·p2 + p3) / 8`
 * - `CatmullRom(0, …) = p1`，`CatmullRom(1, …) = p2`
 *
 * 这类"数值原语"最容易被别处静默改坏（曲线形状变了但没人发现），所以这里刻意用闭式值断言。
 */

describe('Interpolations（math/shape/core）', () =>
{
    describe('QuadraticBezier', () =>
    {
        it('★ t = 0 返回 p0，t = 1 返回 p2', () =>
        {
            expect(interpolationsQuadraticBezier(0, 3, 5, 7)).toBeCloseTo(3, 10);
            expect(interpolationsQuadraticBezier(1, 3, 5, 7)).toBeCloseTo(7, 10);
        });

        it('★ t = 0.5 等于 0.25·p0 + 0.5·p1 + 0.25·p2（闭式）', () =>
        {
            const [p0, p1, p2] = [0, 1, 2];

            expect(interpolationsQuadraticBezier(0.5, p0, p1, p2))
                .toBeCloseTo(0.25 * p0 + 0.5 * p1 + 0.25 * p2, 10);
            // 具体值：(0 + 0.5 + 0.5) = 1
            expect(interpolationsQuadraticBezier(0.5, 0, 1, 2)).toBeCloseTo(1, 10);
        });

        it('★ 与闭式公式在整段 t 上一致（不止中点）', () =>
        {
            const [p0, p1, p2] = [-1, 4, 9];

            for (let i = 0; i <= 10; i++)
            {
                const t = i / 10;
                const expected = (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2;

                expect(interpolationsQuadraticBezier(t, p0, p1, p2), `t=${t}`).toBeCloseTo(expected, 10);
            }
        });

        it('三点相同时整条曲线恒定', () =>
        {
            for (const t of [0, 0.25, 0.5, 0.75, 1])
            {
                expect(interpolationsQuadraticBezier(t, 7, 7, 7), `t=${t}`).toBeCloseTo(7, 10);
            }
        });
    });

    describe('CubicBezier', () =>
    {
        it('★ t = 0 返回 p0，t = 1 返回 p3', () =>
        {
            expect(interpolationsCubicBezier(0, 1, 2, 3, 4)).toBeCloseTo(1, 10);
            expect(interpolationsCubicBezier(1, 1, 2, 3, 4)).toBeCloseTo(4, 10);
        });

        it('★ t = 0.5 等于 (p0 + 3·p1 + 3·p2 + p3) / 8（闭式）', () =>
        {
            const [p0, p1, p2, p3] = [0, 1, 2, 3];

            expect(interpolationsCubicBezier(0.5, p0, p1, p2, p3))
                .toBeCloseTo((p0 + 3 * p1 + 3 * p2 + p3) / 8, 10);
            // 具体值：(0 + 3 + 6 + 3) / 8 = 1.5
            expect(interpolationsCubicBezier(0.5, 0, 1, 2, 3)).toBeCloseTo(1.5, 10);
        });

        it('★ 与闭式公式在整段 t 上一致', () =>
        {
            const [p0, p1, p2, p3] = [2, -3, 5, 11];

            for (let i = 0; i <= 10; i++)
            {
                const t = i / 10;
                const expected = (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3;

                expect(interpolationsCubicBezier(t, p0, p1, p2, p3), `t=${t}`).toBeCloseTo(expected, 9);
            }
        });

        it('四点相同时整条曲线恒定', () =>
        {
            for (const t of [0, 0.25, 0.5, 0.75, 1])
            {
                expect(interpolationsCubicBezier(t, -2, -2, -2, -2), `t=${t}`).toBeCloseTo(-2, 10);
            }
        });
    });

    describe('CatmullRom', () =>
    {
        it('★ t = 0 返回 p1，t = 1 返回 p2', () =>
        {
            expect(interpolationsCatmullRom(0, 0, 5, 9, 12)).toBeCloseTo(5, 9);
            expect(interpolationsCatmullRom(1, 0, 5, 9, 12)).toBeCloseTo(9, 9);
        });

        it('★ t = 0.5 时可复现实现里的闭式（把实现公式抄一遍作为独立对照）', () =>
        {
            const [p0, p1, p2, p3] = [0, 5, 9, 12];
            const t = 0.5;

            const v0 = (p2 - p0) * 0.5;
            const v1 = (p3 - p1) * 0.5;
            const t2 = t * t;
            const t3 = t * t2;
            const expected = ((2 * p1) - (2 * p2) + v0 + v1) * t3 + ((-3 * p1) + (3 * p2) - (2 * v0) - v1) * t2 + (v0 * t) + p1;

            expect(interpolationsCatmullRom(t, p0, p1, p2, p3)).toBeCloseTo(expected, 9);
        });

        it('四点等距共线时结果落在该直线上（数值确实在 p1..p2 之间）', () =>
        {
            // p0=0,p1=1,p2=2,p3=3 → 直线 y=x 上的等距点
            for (const t of [0, 0.25, 0.5, 0.75, 1])
            {
                const v = interpolationsCatmullRom(t, 0, 1, 2, 3);

                expect(Number.isFinite(v), `t=${t}`).toBe(true);
                expect(v, `t=${t}`).toBeGreaterThanOrEqual(1 - 1e-9);
                expect(v, `t=${t}`).toBeLessThanOrEqual(2 + 1e-9);
            }
        });

        it('四点相同时结果恒定，且不产生 NaN', () =>
        {
            for (const t of [0, 0.25, 0.5, 0.75, 1])
            {
                expect(interpolationsCatmullRom(t, 4, 4, 4, 4), `t=${t}`).toBeCloseTo(4, 9);
            }
        });
    });
});
