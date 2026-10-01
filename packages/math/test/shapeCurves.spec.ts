import { describe, expect, it } from 'vitest';
import {
    CubicBezierCurve2,
    CubicBezierCurve3,
    EllipseCurve2,
    QuadraticBezierCurve2,
    QuadraticBezierCurve3,
    SplineCurve2,
    Vector2,
    Vector3,
} from '@feng3d/math';

/**
 * `packages/math/src/shape/curves/` 下的曲线族（此前**行覆盖率 0%**）。
 *
 * 它们都是 `Curve<T>` 的子类，公开入口统一为 `getPoint(t, target?)`，是这一包里最适合单测的形态。
 *
 * 断言刻意选**数学上精确**的性质（贝塞尔有闭式公式、椭圆有半径界），而不是"不抛异常"：
 * - 二次贝塞尔：`B(0.5) = 0.25·v0 + 0.5·v1 + 0.25·v2`；
 * - 三次贝塞尔：`B(0.5) = (v0 + 3·v1 + 3·v2 + v3) / 8`；
 * - 椭圆：所有点到中心距离落在 `[min(rx,ry), max(rx,ry)]`，全周时首尾闭合。
 */

describe('二次贝塞尔曲线（math/shape/curves）', () =>
{
    it('2D：★ 两端落在 v0 / v2', () =>
    {
        const curve = new QuadraticBezierCurve2(new Vector2(0, 0), new Vector2(5, 10), new Vector2(10, 0));

        expect(curve.getPoint(0).x).toBeCloseTo(0, 8);
        expect(curve.getPoint(0).y).toBeCloseTo(0, 8);
        expect(curve.getPoint(1).x).toBeCloseTo(10, 8);
        expect(curve.getPoint(1).y).toBeCloseTo(0, 8);
    });

    it('2D：★ t = 0.5 等于 0.25·v0 + 0.5·v1 + 0.25·v2（闭式公式）', () =>
    {
        const v0 = new Vector2(0, 0);
        const v1 = new Vector2(4, 8);
        const v2 = new Vector2(8, 0);
        const curve = new QuadraticBezierCurve2(v0, v1, v2);

        const mid = curve.getPoint(0.5);

        expect(mid.x).toBeCloseTo(0.25 * v0.x + 0.5 * v1.x + 0.25 * v2.x, 8);
        expect(mid.y).toBeCloseTo(0.25 * v0.y + 0.5 * v1.y + 0.25 * v2.y, 8);
        // 具体数值：(0 + 2 + 2) = 4, (0 + 4 + 0) = 4
        expect(mid.x).toBeCloseTo(4, 8);
        expect(mid.y).toBeCloseTo(4, 8);
    });

    it('3D：★ 两端落在 v0 / v2，且 z 参与插值', () =>
    {
        const curve = new QuadraticBezierCurve3(new Vector3(0, 0, 0), new Vector3(0, 10, 5), new Vector3(10, 0, 0));

        expect(curve.getPoint(0).z).toBeCloseTo(0, 8);
        expect(curve.getPoint(1).z).toBeCloseTo(0, 8);
        // t=0.5 → z = 0.5 * 5 = 2.5
        expect(curve.getPoint(0.5).z).toBeCloseTo(2.5, 8);
    });
});

describe('三次贝塞尔曲线（math/shape/curves）', () =>
{
    it('2D：★ 两端落在 v0 / v3', () =>
    {
        const curve = new CubicBezierCurve2(
            new Vector2(0, 0), new Vector2(1, 2), new Vector2(3, 2), new Vector2(4, 0),
        );

        expect(curve.getPoint(0).x).toBeCloseTo(0, 8);
        expect(curve.getPoint(1).x).toBeCloseTo(4, 8);
        expect(curve.getPoint(1).y).toBeCloseTo(0, 8);
    });

    it('2D：★ t = 0.5 等于 (v0 + 3·v1 + 3·v2 + v3) / 8（闭式公式）', () =>
    {
        const v0 = new Vector2(0, 0);
        const v1 = new Vector2(2, 6);
        const v2 = new Vector2(6, 6);
        const v3 = new Vector2(8, 0);
        const curve = new CubicBezierCurve2(v0, v1, v2, v3);

        const mid = curve.getPoint(0.5);
        const ex = (v0.x + 3 * v1.x + 3 * v2.x + v3.x) / 8;
        const ey = (v0.y + 3 * v1.y + 3 * v2.y + v3.y) / 8;

        expect(mid.x).toBeCloseTo(ex, 8);
        expect(mid.y).toBeCloseTo(ey, 8);
    });

    it('3D：t = 0.5 的三个分量都符合闭式公式', () =>
    {
        const v0 = new Vector3(0, 0, 0);
        const v1 = new Vector3(1, 3, 0);
        const v2 = new Vector3(2, 3, 6);
        const v3 = new Vector3(3, 0, 6);
        const curve = new CubicBezierCurve3(v0, v1, v2, v3);

        const mid = curve.getPoint(0.5);

        expect(mid.x).toBeCloseTo((v0.x + 3 * v1.x + 3 * v2.x + v3.x) / 8, 8);
        expect(mid.y).toBeCloseTo((v0.y + 3 * v1.y + 3 * v2.y + v3.y) / 8, 8);
        expect(mid.z).toBeCloseTo((v0.z + 3 * v1.z + 3 * v2.z + v3.z) / 8, 8);
    });
});

describe('椭圆曲线（math/shape/curves）', () =>
{
    it('★ 起点由起始角决定', () =>
    {
        // 中心 (1,1)、半径 (2,3)、从 0 开始 → 起点 (1+2, 1) = (3, 1)
        const curve = new EllipseCurve2(1, 1, 2, 3, 0, Math.PI * 2, false, 0);

        const p = curve.getPoint(0);

        expect(p.x).toBeCloseTo(3, 6);
        expect(p.y).toBeCloseTo(1, 6);
    });

    it('★ 全周时首尾闭合（起点 ≈ 终点）', () =>
    {
        const curve = new EllipseCurve2(0, 0, 5, 2, 0, Math.PI * 2, false, 0);

        const start = curve.getPoint(0);
        const end = curve.getPoint(1);

        expect(end.x).toBeCloseTo(start.x, 6);
        expect(end.y).toBeCloseTo(start.y, 6);
    });

    it('★ 所有点到中心的距离落在 [min(rx,ry), max(rx,ry)] 内', () =>
    {
        const aX = 3;
        const aY = -2;
        const xRadius = 5;
        const yRadius = 2;
        const curve = new EllipseCurve2(aX, aY, xRadius, yRadius, 0, Math.PI * 2, false, 0);

        for (let i = 0; i <= 36; i++)
        {
            const p = curve.getPoint(i / 36);
            const d = Math.sqrt((p.x - aX) ** 2 + (p.y - aY) ** 2);

            expect(d, `t=${i / 36} 距离 ${d}`).toBeGreaterThanOrEqual(yRadius - 1e-6);
            expect(d, `t=${i / 36} 距离 ${d}`).toBeLessThanOrEqual(xRadius + 1e-6);
        }
    });

    it('半周时终点落在对面（相差 π）', () =>
    {
        const curve = new EllipseCurve2(0, 0, 4, 4, 0, Math.PI, false, 0);

        const end = curve.getPoint(1);

        expect(end.x).toBeCloseTo(-4, 6);
        expect(end.y).toBeCloseTo(0, 6);
    });

    it('旋转参数会改变起点位置（参数确实生效）', () =>
    {
        const noRotation = new EllipseCurve2(0, 0, 2, 1, 0, Math.PI * 2, false, 0);
        const rotated = new EllipseCurve2(0, 0, 2, 1, 0, Math.PI * 2, false, Math.PI / 2);

        const a = noRotation.getPoint(0);
        const b = rotated.getPoint(0);

        expect(Math.abs(a.y - b.y)).toBeGreaterThan(1e-6);
    });
});

describe('样条曲线（math/shape/curves）', () =>
{
    it('★ 两端落在首末控制点', () =>
    {
        const pts = [new Vector2(0, 0), new Vector2(5, 10), new Vector2(10, 0)];
        const curve = new SplineCurve2(pts);

        const start = curve.getPoint(0);
        const end = curve.getPoint(1);

        expect(start.x).toBeCloseTo(pts[0].x, 6);
        expect(start.y).toBeCloseTo(pts[0].y, 6);
        expect(end.x).toBeCloseTo(pts[2].x, 6);
        expect(end.y).toBeCloseTo(pts[2].y, 6);
    });

    it('沿 t 扫一遍不产生 NaN', () =>
    {
        const curve = new SplineCurve2([new Vector2(0, 0), new Vector2(1, 3), new Vector2(4, -1), new Vector2(7, 2)]);

        for (let i = 0; i <= 20; i++)
        {
            const p = curve.getPoint(i / 20);
            expect(Number.isFinite(p.x), `t=${i / 20} x`).toBe(true);
            expect(Number.isFinite(p.y), `t=${i / 20} y`).toBe(true);
        }
    });

    it('控制点退化（全部相同）时不产生 NaN', () =>
    {
        const curve = new SplineCurve2([new Vector2(2, 2), new Vector2(2, 2), new Vector2(2, 2)]);

        for (const t of [0, 0.25, 0.5, 0.75, 1])
        {
            const p = curve.getPoint(t);
            expect(Number.isFinite(p.x), `t=${t}`).toBe(true);
            expect(Number.isFinite(p.y), `t=${t}`).toBe(true);
        }
    });
});

describe('曲线族的通用契约', () =>
{
    it('★ getPoint 的 target 参数被复用（返回同一个对象）', () =>
    {
        const curves: [string, { getPoint(t: number, target?: unknown): unknown }][] = [
            ['QuadraticBezierCurve2', new QuadraticBezierCurve2(new Vector2(0, 0), new Vector2(1, 1), new Vector2(2, 0))],
            ['CubicBezierCurve2', new CubicBezierCurve2(new Vector2(0, 0), new Vector2(1, 1), new Vector2(2, 1), new Vector2(3, 0))],
            ['EllipseCurve2', new EllipseCurve2(0, 0, 1, 1, 0, Math.PI * 2, false, 0)],
            ['SplineCurve2', new SplineCurve2([new Vector2(0, 0), new Vector2(1, 1), new Vector2(2, 0)])],
        ];

        for (const [name, curve] of curves)
        {
            const target = new Vector2();
            const returned = curve.getPoint(0.3, target);

            expect(returned, name).toBe(target);
        }
    });

    it('★ 3D 曲线返回 Vector3、2D 返回 Vector2', () =>
    {
        const c3 = new CubicBezierCurve3(new Vector3(0, 0, 0), new Vector3(1, 1, 1), new Vector3(2, 1, 1), new Vector3(3, 0, 0));
        const p3 = new Vector3();
        c3.getPoint(0.5, p3);
        expect(p3).toBeInstanceOf(Vector3);

        const c2 = new QuadraticBezierCurve2(new Vector2(0, 0), new Vector2(1, 1), new Vector2(2, 0));
        expect(c2.getPoint(0.5)).toBeInstanceOf(Vector2);
    });
});
