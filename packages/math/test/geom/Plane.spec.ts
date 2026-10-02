import { mathUtil } from '@feng3d/polyfill';
import { line3Equals, line3FromPoints, line3OnWithPoint } from '../../src/geom/line3Ops';
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
} from '../../src/geom/planeOps';
import { Vector3 } from '../../src/geom/Vector3';

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
 * - 需要结果带 `Vector3` 方法（`.distance()`）的地方显式传 `new Vector3()` 当 `out`。
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
        const origin = new Vector3();

        planeGetOrigin(p, origin);
        assert.ok(
            planeOnWithPoint(p, origin)
        );
        assert.ok(
            mathUtil.equals(origin.distance(Vector3.ZERO), planeDistanceWithPoint(p, Vector3.ZERO))
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

        assert.ok(planeDistanceWithPoint(plane, new Vector3()) === plane.d);
        //
        const p = new Vector3().random().scaleNumber(100);
        const n = new Vector3().random().normalize();
        const length = (0.5 - Math.random()) * 100;

        planeFromNormalAndPoint(n, p, plane);
        //
        const p0 = n.scaleNumberTo(length).add(p);

        assert.ok(planeDistanceWithPoint(plane, p0).toPrecision(6) === length.toPrecision(6));
    });

    it('intersectWithLine3D', () =>
    {
        const line = line3FromPoints(new Vector3().random(), new Vector3().random());
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
        const p0 = new Vector3().random().scaleNumber(100);
        const p1 = new Vector3().random().scaleNumber(100);
        const p2 = new Vector3().random().scaleNumber(100);
        const p3 = new Vector3().random().scaleNumber(100);

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
