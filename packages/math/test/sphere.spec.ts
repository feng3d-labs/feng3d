import { describe, expect, it } from 'vitest';

import {
    sphereClampPoint,
    sphereContainsPoint,
    sphereCopy,
    sphereDistanceToPoint,
    sphereFromPoints,
    sphereFromPositions,
    sphereIntersectsBox,
    sphereIntersectsPlane,
    sphereIntersectsSphere,
    sphereIsEmpty,
} from '../src/geom/sphereOps';
import { vec3Length } from '../src/geom/vector3Ops';

/**
 * `Sphere` 的几何性质（issue #134 阶段 C-c）。
 *
 * **本文件在 C-c 之前是 class 行为用例**（`new Sphere(c, r)` / `s.containsPoint(p)`）；
 * `Sphere` 的 class 删除后整文件改写为纯函数用例，断言逐条保留。
 *
 * 标准的三维包围球（three.js 风格），方法都是**几何性质**，断言可以用**数学不变量**表达，
 * 不需要读实现：
 *
 * - `sphereContainsPoint(s, p)` ⇔ `|p − c| ≤ r`；
 * - `sphereDistanceToPoint(s, p)`：**球内为负、球面上为 0、球外为正**（到球面的最近距离）；
 * - `sphereClampPoint(s, p, out)`：把点移到球面上（球内不动）；
 * - `sphereFromPoints` / `sphereFromPositions`：产出的球**必须包含所有输入点**（这是包围球的定义）；
 * - `sphereCopy`（= 原 `copy` / `clone`）/ `sphereIsEmpty`。
 */

const v = (x: number, y: number, z: number) => ({ x, y, z });
/** 球的缺省 `out`（形状与作用见 `sphereOps.ts` 的 `defaultOut`）。 */
const emptySphereOut = () => ({ center: { x: 0, y: 0, z: 0 }, radius: 0 });

describe('Sphere（math/geom）', () =>
{
    describe('containsPoint', () =>
    {
        it('★ 球心在球内；球外点不在；球面上（边界）也在', () =>
        {
            const s = { center: v(0, 0, 0), radius: 5 };

            expect(sphereContainsPoint(s, v(0, 0, 0))).toBe(true);
            expect(sphereContainsPoint(s, v(3, 4, 0))).toBe(true);      // 距离恰好 5 —— 边界
            expect(sphereContainsPoint(s, v(0, 0, 4.999))).toBe(true);
            expect(sphereContainsPoint(s, v(0, 0, 5.001))).toBe(false);
            expect(sphereContainsPoint(s, v(100, 0, 0))).toBe(false);
        });

        it('中心不在原点时按相对位置判定', () =>
        {
            const s = { center: v(10, 10, 10), radius: 2 };

            expect(sphereContainsPoint(s, v(11, 10, 10))).toBe(true);
            expect(sphereContainsPoint(s, v(13, 10, 10))).toBe(false);
        });

        it('半径 0 的球只包含球心那一点', () =>
        {
            const s = { center: v(1, 2, 3), radius: 0 };

            expect(sphereContainsPoint(s, v(1, 2, 3))).toBe(true);
            expect(sphereContainsPoint(s, v(1, 2, 3.001))).toBe(false);
        });
    });

    describe('★ distanceToPoint（球内为负、球面为 0、球外为正）', () =>
    {
        it('★ 球心到球面的距离是 −r', () =>
        {
            const s = { center: v(0, 0, 0), radius: 5 };

            expect(sphereDistanceToPoint(s, v(0, 0, 0))).toBeCloseTo(-5, 6);
        });

        it('★ 球面上的点是 0', () =>
        {
            const s = { center: v(0, 0, 0), radius: 5 };

            expect(sphereDistanceToPoint(s, v(3, 4, 0))).toBeCloseTo(0, 6);
        });

        it('★ 球外的点等于"到球心的距离 − r"', () =>
        {
            const s = { center: v(0, 0, 0), radius: 5 };

            expect(sphereDistanceToPoint(s, v(10, 0, 0))).toBeCloseTo(5, 6);
            expect(sphereDistanceToPoint(s, v(0, 0, 9))).toBeCloseTo(4, 6);
        });

        it('★ 球内的点距离为负，且越靠中心越负', () =>
        {
            const s = { center: v(0, 0, 0), radius: 5 };
            const near = sphereDistanceToPoint(s, v(4, 0, 0));
            const center = sphereDistanceToPoint(s, v(0, 0, 0));

            expect(near).toBeLessThan(0);
            expect(center).toBeLessThan(near);
        });
    });

    describe('★ clampPoint', () =>
    {
        it('★ 球外的点被移到球面上（到球心的距离恰好是 r）', () =>
        {
            const s = { center: v(0, 0, 0), radius: 5 };
            const out = sphereClampPoint(s, v(10, 0, 0));

            expect(vec3Length(out)).toBeCloseTo(5, 5);
            expect(out.x).toBeCloseTo(5, 5);
        });

        it('★ 球内的点保持不动', () =>
        {
            const s = { center: v(0, 0, 0), radius: 5 };
            const p = v(1, 1, 1);
            const out = sphereClampPoint(s, p);

            expect(out.x).toBeCloseTo(p.x, 6);
            expect(out.y).toBeCloseTo(p.y, 6);
            expect(out.z).toBeCloseTo(p.z, 6);
        });

        it('★ 传了 out 时复用该对象（不是新建）', () =>
        {
            const s = { center: v(0, 0, 0), radius: 2 };
            const pout = v(0, 0, 0);

            expect(sphereClampPoint(s, v(9, 0, 0), pout)).toBe(pout);
        });
    });

    describe('★ fromPoints / fromPositions（包围不变量）', () =>
    {
        const points = [v(-1, -1, -1), v(1, 1, 1), v(2, 0, 0), v(0, -3, 0)];

        it('★★ 产出的球必须包含所有输入点', () =>
        {
            const s = sphereFromPoints(points);

            for (const p of points)
            {
                expect(sphereContainsPoint(s, p), `点 (${p.x},${p.y},${p.z}) 应在球内`).toBe(true);
            }
        });

        it('★★ 带 out 的写法与缺省写法结果一致（中心与半径）', () =>
        {
            const a = sphereFromPoints(points);
            const b = sphereFromPoints(points, emptySphereOut());

            expect(b.center.x).toBeCloseTo(a.center.x, 6);
            expect(b.center.y).toBeCloseTo(a.center.y, 6);
            expect(b.center.z).toBeCloseTo(a.center.z, 6);
            expect(b.radius).toBeCloseTo(a.radius, 6);
        });

        it('★★ fromPositions 与 fromPoints 结果一致（同一个点集、扁平数组输入）', () =>
        {
            const a = sphereFromPoints(points);
            const positions = points.flatMap((p) => [p.x, p.y, p.z]);
            const b = sphereFromPositions(positions);

            expect(b.center.x).toBeCloseTo(a.center.x, 6);
            expect(b.center.y).toBeCloseTo(a.center.y, 6);
            expect(b.center.z).toBeCloseTo(a.center.z, 6);
            expect(b.radius).toBeCloseTo(a.radius, 6);
        });

        it('单个点时半径为 0、中心就是该点', () =>
        {
            const s = sphereFromPoints([v(3, 4, 5)]);

            expect(s.center.x).toBeCloseTo(3, 6);
            expect(s.center.y).toBeCloseTo(4, 6);
            expect(s.center.z).toBeCloseTo(5, 6);
            expect(s.radius).toBeCloseTo(0, 6);
        });
    });

    describe('isEmpty / copy / intersects*', () =>
    {
        it('★ 负半径是"空"，正半径不是（只测 −1 与 1，避开 0 的边界语义）', () =>
        {
            expect(sphereIsEmpty({ center: v(0, 0, 0), radius: -1 })).toBe(true);
            expect(sphereIsEmpty({ center: v(0, 0, 0), radius: 1 })).toBe(false);
        });

        it('★ copy 复制中心与半径', () =>
        {
            const src = { center: v(1, 2, 3), radius: 4 };
            const dst = sphereCopy(src, emptySphereOut());

            expect(dst.center.x).toBeCloseTo(1, 6);
            expect(dst.center.y).toBeCloseTo(2, 6);
            expect(dst.center.z).toBeCloseTo(3, 6);
            expect(dst.radius).toBeCloseTo(4, 6);
            // 中心应当是**独立**的对象，不是共享引用
            expect(dst.center).not.toBe(src.center);
        });

        it('★ 缺省 out 的 copy 产生独立对象（= 原 clone）', () =>
        {
            const src = { center: v(1, 2, 3), radius: 4 };
            const c = sphereCopy(src);

            expect(c).not.toBe(src);
            expect(c.center).not.toBe(src.center);
            expect(c.radius).toBeCloseTo(4, 6);
            expect(c.center.x).toBeCloseTo(1, 6);
        });

        it('★ intersectsSphere：相交 / 相离 / 内含', () =>
        {
            const a = { center: v(0, 0, 0), radius: 5 };

            expect(sphereIntersectsSphere(a, { center: v(3, 0, 0), radius: 5 })).toBe(true);    // 大量重叠
            expect(sphereIntersectsSphere(a, { center: v(0, 0, 0), radius: 1 })).toBe(true);    // 完全内含
            expect(sphereIntersectsSphere(a, { center: v(100, 0, 0), radius: 1 })).toBe(false); // 相距很远
        });

        it('★ intersectsBox：中心在盒内 / 盒子完全在球内 / 远离', () =>
        {
            const s = { center: v(0, 0, 0), radius: 10 };

            expect(sphereIntersectsBox(s, { min: v(-1, -1, -1), max: v(1, 1, 1) })).toBe(true);
            expect(sphereIntersectsBox(s, { min: v(50, 50, 50), max: v(51, 51, 51) })).toBe(false);
        });

        it('★ intersectsPlane：穿过球 / 远离球', () =>
        {
            const s = { center: v(0, 0, 0), radius: 5 };

            // 过原点的平面一定与球相交
            const through = { a: 0, b: 1, c: 0, d: 0 };   // ax+by+cz+d=0 → y=0

            expect(sphereIntersectsPlane(s, through)).toBe(true);

            // 离球很远的平面
            const far = { a: 0, b: 1, c: 0, d: -100 };    // y = 100，离球心 100

            expect(sphereIntersectsPlane(s, far)).toBe(false);
        });
    });
});
