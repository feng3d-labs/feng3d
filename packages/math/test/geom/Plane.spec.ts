import { mathUtilEquals } from '../../src/mathutil';
import { line3Equals, line3FromPoints, line3OnWithPoint } from '../../src/geom/line3';
import {
    planeDistanceWithPoint,
    planeFromNormalAndPoint,
    planeFromPoints,
    planeGetOrigin,
    planeIntersectWithLine3,
    planeIntersectWithPlane3D,
    planeIntersectWithTwoPlane3D,
    planeOnWithPoint,
    planeRandom,
    planeRandomPoint,
} from '../../src/geom/plane';
import { VEC3_ZERO, vec3Add, vec3Distance, vec3Normalized, vec3Random, vec3ScaleNumber } from '../../src/geom/vector3';

import { assert, describe, it } from 'vitest';

/**
 * issue #134 阶段 C-e：`Plane` 的 class 已删除，本文件由 class 行为用例改写为**同义纯函数用例**，
 * 断言逐条保留：
 *
 * - `new Plane()` → {@link newPlane}（纯数据字面量 `{ __type__: 'Plane', a: 0, b: 1, c: 0, d: 0 }`）；
 * - `new Plane().random()` → `planeRandom()`、`p.fromNormalAndPoint(n, q)` → `planeFromNormalAndPoint(n, q, p)`；
 * - `p.onWithPoint(x)` → `planeOnWithPoint(p, x)`、`p.distanceWithPoint(x)` → `planeDistanceWithPoint(p, x)`、
 *   `p.intersectWithLine3(l)` → `planeIntersectWithLine3(p, l)`、`p.intersectWithPlane3D(o)` →
 *   `planeIntersectWithPlane3D(p, o)`、`p.intersectWithTwoPlane3D(a, b)` → `planeIntersectWithTwoPlane3D(p, a, b)`；
 * - 需要结果带 `Vector3` 语义的地方用纯数据字面量当 `out`，断言走 `vec3*` 纯函数
 *   （阶段 C-f 起 `Vector3` 的 class 已删除，`new Vector3()` 不再可用）。
 */

/** 缺省平面（与 `new Plane()` 一致：`a=0, b=1, c=0, d=0`），带判别字段 */
function newPlane()
{
    return { __type__: 'Plane' as const, a: 0, b: 1, c: 0, d: 0 };
}

describe('Plane', () =>
{
    it('getOrigin', () =>
    {
        const p = planeRandom();
        const origin = { x: 0, y: 0, z: 0 };

        planeGetOrigin(p, origin);
        assert.ok(
            planeOnWithPoint(p, origin)
        );
        assert.ok(
            mathUtilEquals(vec3Distance(origin, VEC3_ZERO), planeDistanceWithPoint(p, VEC3_ZERO))
        );
    });

    it('randomPoint', () =>
    {
        const p = planeRandom();

        assert.ok(
            planeOnWithPoint(p, planeRandomPoint(p))
        );
    });

    it('distance', () =>
    {
        const plane = newPlane();

        assert.ok(planeDistanceWithPoint(plane, { x: 0, y: 0, z: 0 }) === plane.d);
        //
        const p = vec3ScaleNumber(vec3Random(), 100);
        const n = vec3Normalized(vec3Random());
        const length = (0.5 - Math.random()) * 100;

        planeFromNormalAndPoint(n, p, plane);
        //
        const p0 = vec3Add(vec3ScaleNumber(n, length), p);

        assert.ok(planeDistanceWithPoint(plane, p0).toPrecision(6) === length.toPrecision(6));
    });

    it('intersectWithLine3D', () =>
    {
        const line = line3FromPoints(vec3Random(), vec3Random());
        const plane = planeRandom();
        // 与 class 形态一致地按「唯一交点」使用（线落在平面内时返回的是直线，本用例不覆盖那条分支）
        const p = planeIntersectWithLine3(plane, line) as unknown as Vector3;

        if (p)
        {
            assert.ok(line3OnWithPoint(line, p));
            assert.ok(planeOnWithPoint(plane, p));
        }
    });

    it('intersectWithPlane3D', () =>
    {
        // 用**确定性**输入：两个平面都过直线 p0p1，因此必然交于该直线（XY 平面 ∩ XZ 平面 = X 轴）。
        // 原先用 `vec3Random()` 取四点——随机输入一旦让两平面法线落进 `planeParallelWithPlane3D`
        // 的 precision（近似平行），`planeIntersectWithPlane3D` 会**如实返回 null**，
        // 这条没有保护的断言就偶发失败（CI 上实测过一次；本地连跑多次才能复现）。
        const p0 = { x: 0, y: 0, z: 0 };
        const p1 = { x: 1, y: 0, z: 0 };
        const p2 = { x: 0, y: 1, z: 0 };
        const p3 = { x: 0, y: 0, z: 1 };

        const line = line3FromPoints(p0, p1);

        const plane0 = planeFromPoints(p0, p1, p2);
        const plane1 = planeFromPoints(p0, p1, p3);

        const crossLine = planeIntersectWithPlane3D(plane0, plane1);

        assert.ok(!!crossLine);
        if (crossLine)
        {
            assert.ok(line3Equals(line, crossLine));
        }
    });

    it('intersectWithPlane3D：平行平面如实返回 null', () =>
    {
        // 把边界行为钉住：两平面平行时没有交线。原先这条分支只由随机输入"偶然"覆盖，
        // 而覆盖到它的表现是**断言失败**而不是通过——既 flaky，也说明边界没有被正面验证。
        const plane0 = planeFromPoints({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
        const plane1 = planeFromPoints({ x: 0, y: 0, z: 5 }, { x: 1, y: 0, z: 5 }, { x: 0, y: 1, z: 5 });

        assert.ok(planeIntersectWithPlane3D(plane0, plane1) === null);
    });

    it('intersectWithTwoPlane3D', () =>
    {
        const p1 = planeRandom();
        const p2 = planeRandom();
        const p3 = planeRandom();

        const cp = planeIntersectWithTwoPlane3D(p1, p2, p3) as Vector3;

        assert.ok(planeOnWithPoint(p1, cp));
        assert.ok(planeOnWithPoint(p2, cp));
        assert.ok(planeOnWithPoint(p3, cp));
    });
});
