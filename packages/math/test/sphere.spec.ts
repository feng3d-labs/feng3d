import { describe, expect, it } from 'vitest';

import { Box3 } from '../src/geom/Box3';
import { Plane } from '../src/geom/Plane';
import { Sphere } from '../src/geom/Sphere';
import { Vector3 } from '../src/geom/Vector3';

/**
 * `Sphere`（`packages/math/src/geom/Sphere.ts`，69 行，此前**行覆盖率 2.89%**）。
 *
 * 标准的三维包围球（three.js 风格），方法都是**几何性质**，断言可以用**数学不变量**表达，
 * 不需要读实现：
 *
 * - `containsPoint(p)` ⇔ `|p − c| ≤ r`；
 * - `distanceToPoint(p)`：**球内为负、球面上为 0、球外为正**（到球面的最近距离）；
 * - `clampPoint(p, out)`：把点移到球面上（球内不动）；
 * - `fromPoints` / `fromPositions`：产出的球**必须包含所有输入点**（这是包围球的定义）；
 * - `copy` / `clone` / `isEmpty`。
 */

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

describe('Sphere（math/geom）', () =>
{
    describe('containsPoint', () =>
    {
        it('★ 球心在球内；球外点不在；球面上（边界）也在', () =>
        {
            const s = new Sphere(v(0, 0, 0), 5);

            expect(s.containsPoint(v(0, 0, 0))).toBe(true);
            expect(s.containsPoint(v(3, 4, 0))).toBe(true);      // 距离恰好 5 —— 边界
            expect(s.containsPoint(v(0, 0, 4.999))).toBe(true);
            expect(s.containsPoint(v(0, 0, 5.001))).toBe(false);
            expect(s.containsPoint(v(100, 0, 0))).toBe(false);
        });

        it('中心不在原点时按相对位置判定', () =>
        {
            const s = new Sphere(v(10, 10, 10), 2);

            expect(s.containsPoint(v(11, 10, 10))).toBe(true);
            expect(s.containsPoint(v(13, 10, 10))).toBe(false);
        });

        it('半径 0 的球只包含球心那一点', () =>
        {
            const s = new Sphere(v(1, 2, 3), 0);

            expect(s.containsPoint(v(1, 2, 3))).toBe(true);
            expect(s.containsPoint(v(1, 2, 3.001))).toBe(false);
        });
    });

    describe('★ distanceToPoint（球内为负、球面为 0、球外为正）', () =>
    {
        it('★ 球心到球面的距离是 −r', () =>
        {
            const s = new Sphere(v(0, 0, 0), 5);

            expect(s.distanceToPoint(v(0, 0, 0))).toBeCloseTo(-5, 6);
        });

        it('★ 球面上的点是 0', () =>
        {
            const s = new Sphere(v(0, 0, 0), 5);

            expect(s.distanceToPoint(v(3, 4, 0))).toBeCloseTo(0, 6);
        });

        it('★ 球外的点等于"到球心的距离 − r"', () =>
        {
            const s = new Sphere(v(0, 0, 0), 5);

            expect(s.distanceToPoint(v(10, 0, 0))).toBeCloseTo(5, 6);
            expect(s.distanceToPoint(v(0, 0, 9))).toBeCloseTo(4, 6);
        });

        it('★ 球内的点距离为负，且越靠中心越负', () =>
        {
            const s = new Sphere(v(0, 0, 0), 5);
            const near = s.distanceToPoint(v(4, 0, 0));
            const center = s.distanceToPoint(v(0, 0, 0));

            expect(near).toBeLessThan(0);
            expect(center).toBeLessThan(near);
        });
    });

    describe('★ clampPoint', () =>
    {
        it('★ 球外的点被移到球面上（到球心的距离恰好是 r）', () =>
        {
            const s = new Sphere(v(0, 0, 0), 5);
            const out = s.clampPoint(v(10, 0, 0), new Vector3());

            expect(out.length).toBeCloseTo(5, 5);   // 实测：Vector3.length 是 getter 属性，没有 distanceTo 方法
            expect(out.x).toBeCloseTo(5, 5);
        });

        it('★ 球内的点保持不动', () =>
        {
            const s = new Sphere(v(0, 0, 0), 5);
            const p = v(1, 1, 1);
            const out = s.clampPoint(p, new Vector3());

            expect(out.x).toBeCloseTo(p.x, 6);
            expect(out.y).toBeCloseTo(p.y, 6);
            expect(out.z).toBeCloseTo(p.z, 6);
        });

        it('★ 传了 pout 时复用该对象（不是新建）', () =>
        {
            const s = new Sphere(v(0, 0, 0), 2);
            const pout = new Vector3();

            expect(s.clampPoint(v(9, 0, 0), pout)).toBe(pout);
        });
    });

    describe('★ fromPoints / fromPositions（包围不变量）', () =>
    {
        const points = [v(-1, -1, -1), v(1, 1, 1), v(2, 0, 0), v(0, -3, 0)];

        it('★★ 产出的球必须包含所有输入点', () =>
        {
            const s = Sphere.fromPoints(points);

            for (const p of points)
            {
                expect(s.containsPoint(p), `点 (${p.x},${p.y},${p.z}) 应在球内`).toBe(true);
            }
        });

        it('★★ 实例方法 fromPoints 的结果与静态版一致（中心与半径）', () =>
        {
            const a = Sphere.fromPoints(points);
            const b = new Sphere().fromPoints(points);

            expect(b.center.x).toBeCloseTo(a.center.x, 6);
            expect(b.center.y).toBeCloseTo(a.center.y, 6);
            expect(b.center.z).toBeCloseTo(a.center.z, 6);
            expect(b.radius).toBeCloseTo(a.radius, 6);
        });

        it('★★ fromPositions 与 fromPoints 结果一致（同一个点集、扁平数组输入）', () =>
        {
            const a = Sphere.fromPoints(points);
            const positions = points.flatMap((p) => [p.x, p.y, p.z]);
            const b = Sphere.fromPositions(positions);

            expect(b.center.x).toBeCloseTo(a.center.x, 6);
            expect(b.center.y).toBeCloseTo(a.center.y, 6);
            expect(b.center.z).toBeCloseTo(a.center.z, 6);
            expect(b.radius).toBeCloseTo(a.radius, 6);
        });

        it('单个点时半径为 0、中心就是该点', () =>
        {
            const s = Sphere.fromPoints([v(3, 4, 5)]);

            expect(s.center.x).toBeCloseTo(3, 6);
            expect(s.center.y).toBeCloseTo(4, 6);
            expect(s.center.z).toBeCloseTo(5, 6);
            expect(s.radius).toBeCloseTo(0, 6);
        });
    });

    describe('isEmpty / copy / clone / intersects*', () =>
    {
        it('★ 负半径是"空"，正半径不是（只测 −1 与 1，避开 0 的边界语义）', () =>
        {
            expect(new Sphere(v(0, 0, 0), -1).isEmpty()).toBe(true);
            expect(new Sphere(v(0, 0, 0), 1).isEmpty()).toBe(false);
        });

        it('★ copy 复制中心与半径', () =>
        {
            const src = new Sphere(v(1, 2, 3), 4);
            const dst = new Sphere().copy(src);

            expect(dst.center.x).toBeCloseTo(1, 6);
            expect(dst.center.y).toBeCloseTo(2, 6);
            expect(dst.center.z).toBeCloseTo(3, 6);
            expect(dst.radius).toBeCloseTo(4, 6);
            // 中心应当是**独立**的对象，不是共享引用
            dst.center.x = 99;
            expect(src.center.x, 'copy 后不应共享 center 引用').toBeCloseTo(1, 6);
        });

        it('★ clone 产生独立对象', () =>
        {
            const src = new Sphere(v(1, 2, 3), 4);
            const c = src.clone();

            expect(c).not.toBe(src);
            expect(c.radius).toBeCloseTo(4, 6);
            expect(c.center.x).toBeCloseTo(1, 6);
        });

        it('★ intersectsSphere：相交 / 相离 / 内含', () =>
        {
            const a = new Sphere(v(0, 0, 0), 5);

            expect(a.intersectsSphere(new Sphere(v(3, 0, 0), 5))).toBe(true);    // 大量重叠
            expect(a.intersectsSphere(new Sphere(v(0, 0, 0), 1))).toBe(true);    // 完全内含
            expect(a.intersectsSphere(new Sphere(v(100, 0, 0), 1))).toBe(false); // 相距很远
        });

        it('★ intersectsBox：中心在盒内 / 盒子完全在球内 / 远离', () =>
        {
            const s = new Sphere(v(0, 0, 0), 10);

            expect(s.intersectsBox(new Box3(v(-1, -1, -1), v(1, 1, 1)))).toBe(true);
            expect(s.intersectsBox(new Box3(v(50, 50, 50), v(51, 51, 51)))).toBe(false);
        });

        it('★ intersectsPlane：穿过球 / 远离球', () =>
        {
            const s = new Sphere(v(0, 0, 0), 5);

            // 过原点的平面一定与球相交
            const through = new Plane(0, 1, 0, 0);   // 实测：Plane 构造是 (a, b, c, d)，即 ax+by+cz+d=0 → y=0

            expect(s.intersectsPlane(through)).toBe(true);

            // 离球很远的平面
            const far = new Plane(0, 1, 0, -100);    // y = 100，离球心 100

            expect(s.intersectsPlane(far)).toBe(false);
        });
    });
});
