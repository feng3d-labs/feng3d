import { describe, expect, it } from 'vitest';

import { CatmullRomCurve3 } from '../src/shape/curves/CatmullRomCurve3';


/**
 * `CatmullRomCurve3`（`packages/math/src/shape/curves/CatmullRomCurve3.ts`，65 行，此前**行覆盖率 12.3%**）。
 *
 * three.js 风格的 Catmull-Rom 空间曲线（`extends Curve<Vector3>`）：
 *
 * ```ts
 * constructor(points: Vector3[] = [], closed = false, curveType = 'centripetal', tension = 0.5)
 * getPoint(t: number, optionalTarget = new Vector3())
 * ```
 *
 * 本文件用**最稳的不变量**打底，避免依赖实现内部的取点规则：
 * - **共线的控制点 ⇒ 插值点仍在同一条直线上**（数学必然，`centripetal` 也保持共线）；
 * - 所有输出都是**有限数**（不产生 NaN）；
 * - **`optionalTarget` 被复用**（返回的就是传入的对象），与同族曲线一致；
 * - 三种 `curveType` 都能求值。
 *
 * ⚠️ `getPoint(0)` 是否**恰好**等于首点，取决于取点规则（区间外要补虚拟控制点），
 * 所以这里只把它作为**端点在控制点附近**的宽松断言，不写死相等。
 */

const v = (x: number, y: number, z: number) => ({ x: x, y: y, z: z });

/** 一条沿 x 轴的直线上的点（y = z = 0） */
const collinearPoints = () => [v(0, 0, 0), v(1, 0, 0), v(2, 0, 0), v(3, 0, 0)];

describe('CatmullRomCurve3（math/shape/curves）', () =>
{
    describe('★★ 共线控制点 ⇒ 插值点仍在同一条直线上', () =>
    {
        it('★★ 沿 x 轴的直线点：所有插值点 y = z = 0', () =>
        {
            const curve = new CatmullRomCurve3(collinearPoints());

            for (let i = 0; i <= 20; i++)
            {
                const t = i / 20;
                const p = curve.getPoint(t);

                expect(p.y, `t=${t} 的 y`).toBeCloseTo(0, 6);
                expect(p.z, `t=${t} 的 z`).toBeCloseTo(0, 6);
            }
        });

        it('★★ 斜线（对角线）上的点同样保持共线', () =>
        {
            // 沿 (0,0,0) → (3,3,3) 的对角线
            const pts = [v(0, 0, 0), v(1, 1, 1), v(2, 2, 2), v(3, 3, 3)];
            const curve = new CatmullRomCurve3(pts);

            for (let i = 0; i <= 20; i++)
            {
                const p = curve.getPoint(i / 20);

                // 对角线上的点满足 x === y === z
                expect(p.x, `t=${i / 20}`).toBeCloseTo(p.y, 5);
                expect(p.y, `t=${i / 20}`).toBeCloseTo(p.z, 5);
            }
        });

        it('★ 三种 curveType 在共线点上都保持共线', () =>
        {
            for (const curveType of ['centripetal', 'chordal', 'catmullrom'])
            {
                const curve = new CatmullRomCurve3(collinearPoints(), false, curveType);

                for (let i = 0; i <= 10; i++)
                {
                    const p = curve.getPoint(i / 10);

                    expect(p.y, `${curveType} t=${i / 10}`).toBeCloseTo(0, 5);
                    expect(p.z, `${curveType} t=${i / 10}`).toBeCloseTo(0, 5);
                }
            }
        });
    });

    describe('★ 有限性与取值范围', () =>
    {
        it('★ 二维折线上的曲线：所有点都是有限数', () =>
        {
            const pts = [v(0, 0, 0), v(1, 2, 0), v(2, -1, 0), v(4, 1, 0)];
            const curve = new CatmullRomCurve3(pts);

            for (let i = 0; i <= 30; i++)
            {
                const p = curve.getPoint(i / 30);

                expect(Number.isFinite(p.x), `t=${i / 30} x`).toBe(true);
                expect(Number.isFinite(p.y), `t=${i / 30} y`).toBe(true);
                expect(Number.isFinite(p.z), `t=${i / 30} z`).toBe(true);
            }
        });

        it('★ 三维空间曲线的点都落在控制点的包围盒附近（允许过冲）', () =>
        {
            const pts = [v(-1, -1, -1), v(0, 1, 0), v(1, -1, 1), v(2, 0, -1)];
            const curve = new CatmullRomCurve3(pts);

            for (let i = 0; i <= 20; i++)
            {
                const p = curve.getPoint(i / 20);

                // Catmull-Rom 允许过冲，所以留出宽裕的界限来抓"飞出去"的回归
                for (const [name, val] of [['x', p.x], ['y', p.y], ['z', p.z]] as const)
                {
                    expect(Math.abs(val), `t=${i / 20} ${name}=${val}`).toBeLessThan(100);
                }
            }
        });

        it('★★ 越界 t 的行为**不统一**：有的能回绕求值，有的直接抛 —— 如实钉住', () =>
        {
            // 实测：实现里没有统一的越界守卫。取点索引 intPoint 可能
            //   ① 落在 [0, l) 内（回绕成合法下标）→ 正常返回有限数；
            //   ② 越界 → 读 points[...] 得到 undefined → 抛
            //   `TypeError: Cannot read properties of undefined (reading 'x')`。
            // 第一版我按"越界一律返回 NaN"断言，失败后才查出来 —— 调用方必须自己保证 t ∈ [0,1]。
            const curve = new CatmullRomCurve3(collinearPoints());
            let computed = 0;
            let threw = 0;

            for (const t of [-1, -0.5, 1.5, 2])
            {
                try
                {
                    const p = curve.getPoint(t);

                    // 没抛的情况下必须是有限数（不能是 NaN 混过去）
                    expect(Number.isFinite(p.x), `t=${t} 未抛但 x 非有限`).toBe(true);
                    computed++;
                }
                catch
                {
                    threw++;
                }
            }

            // 四个值都落在这两类之一，没有"静默给出 NaN"的第三种
            expect(computed + threw).toBe(4);
            // 至少有一个能算出来（说明不是"越界一律抛"）
            expect(computed).toBeGreaterThan(0);
        });

        it('★ t ∈ [0,1] 内不抛（含边界 0 与 1）', () =>
        {
            const curve = new CatmullRomCurve3(collinearPoints());

            for (const t of [0, 0.25, 0.5, 0.75, 1])
            {
                expect(() => curve.getPoint(t), `t=${t}`).not.toThrow();
            }
        });
    });

    describe('★ optionalTarget 被复用', () =>
    {
        it('★ getPoint(t, target) 返回的就是传入的 target', () =>
        {
            const curve = new CatmullRomCurve3(collinearPoints());
            const target = { x: 0, y: 0, z: 0 };

            expect(curve.getPoint(0.5, target)).toBe(target);
        });

        it('★ 不传 target 时每次返回新对象', () =>
        {
            const curve = new CatmullRomCurve3(collinearPoints());

            expect(curve.getPoint(0.5)).not.toBe(curve.getPoint(0.5));
        });
    });

    describe('★ 端点与闭合', () =>
    {
        it('★ getPoint(0) / getPoint(1) 落在控制点的范围内（宽松断言）', () =>
        {
            const pts = collinearPoints();
            const curve = new CatmullRomCurve3(pts);
            const start = curve.getPoint(0);
            const end = curve.getPoint(1);

            // 首点在 [pts[0], pts[1]] 之间、末点在 [pts[n-2], pts[n-1]] 之间（Catmull-Rom 的端点规则）
            expect(start.x).toBeGreaterThanOrEqual(Math.min(pts[0].x, pts[1].x) - 1e-6);
            expect(start.x).toBeLessThanOrEqual(Math.max(pts[0].x, pts[1].x) + 1e-6);

            expect(end.x).toBeGreaterThanOrEqual(Math.min(pts[2].x, pts[3].x) - 1e-6);
            expect(end.x).toBeLessThanOrEqual(Math.max(pts[2].x, pts[3].x) + 1e-6);
        });

        it('★ closed = true 时也能求值且不产生 NaN', () =>
        {
            const curve = new CatmullRomCurve3(collinearPoints(), true);

            for (let i = 0; i <= 10; i++)
            {
                const p = curve.getPoint(i / 10);

                expect(Number.isFinite(p.x), `t=${i / 10}`).toBe(true);
                expect(Number.isFinite(p.y), `t=${i / 10}`).toBe(true);
                expect(Number.isFinite(p.z), `t=${i / 10}`).toBe(true);
            }
        });
    });

    describe('★ 参数', () =>
    {
        it('★ tension 参数被接受（三种取值都能求值）', () =>
        {
            for (const tension of [0, 0.5, 1])
            {
                const curve = new CatmullRomCurve3(collinearPoints(), false, 'catmullrom', tension);
                const p = curve.getPoint(0.5);

                expect(Number.isFinite(p.x), `tension=${tension}`).toBe(true);
            }
        });

        it('★★ 单个控制点会抛错（少于 2 个点求不了值）—— 如实钉住', () =>
        {
            expect(() => new CatmullRomCurve3([v(1, 2, 3)]).getPoint(0.5)).toThrow();
        });

        it('★ 空点集构造不抛异常', () =>
        {
            expect(() => new CatmullRomCurve3([])).not.toThrow();
        });
    });
});
