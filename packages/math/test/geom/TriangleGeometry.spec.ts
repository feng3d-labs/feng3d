import { mathUtil } from '@feng3d/polyfill';
import { box3Equals, box3Random, box3RandomPoint, box3ToPoints } from '../../src/geom/box3';
import { vec3Random } from '../../src/geom/vector3';
import { seg3Equals, seg3FromPoints } from '../../src/geom/segment3';
import type { TriangleGeometry, WritableTriangleGeometryLike } from '../../src/geom/triangleGeometry';
import {
    triGeomClassifyPoint,
    triGeomClassifySegment,
    triGeomClassifyTriangle,
    triGeomContainsPoint,
    triGeomCopy,
    triGeomDecomposeTriangle,
    triGeomFromBox,
    triGeomGetBox,
    triGeomGetPoints,
    triGeomIntersectionWithSegment,
    triGeomIsClosed,
} from '../../src/geom/triangleGeometry';

import { vec3Add } from '../../src/geom/vector3';

import { assert, describe, expect, it } from 'vitest';

/**
 * `TriangleGeometry` 纯数据形态 + `triGeom*` 纯函数层（`packages/math/src/geom/triangleGeometry.ts`）。
 *
 * **阶段 C-a 起 `TriangleGeometry` class 已删除**，本文件由「class 行为用例」改写为「纯函数用例」，
 * 断言逐条保留（`new TriangleGeometry().fromBox(box)` → `triGeomFromBox(box)`；
 * `tg.getBox()` → `triGeomGetBox(tg)`；`tg.intersectionWithSegment(s)` → `triGeomIntersectionWithSegment(tg, s)`）。
 */
describe('TriangleGeometry', () =>
{
    it('fromBox,getBox', () =>
    {
        const box = box3Random();
        const triangleGeometry = triGeomFromBox(box);

        assert.ok(
            box3Equals(triGeomGetBox(triangleGeometry), box)
        );
    });

    it('getPoints', () =>
    {
        const box = box3Random();
        const triangleGeometry = triGeomFromBox(box);

        assert.ok(triGeomGetPoints(triangleGeometry).length === 8);
    });

    it('isClosed', () =>
    {
        // var box = Box.random();
        const box = { __type__: 'Box3', min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } };
        const triangleGeometry = triGeomFromBox(box);

        assert.ok(
            triGeomIsClosed(triangleGeometry)
        );

        triangleGeometry.triangles.pop();

        assert.ok(
            !triGeomIsClosed(triangleGeometry)
        );
    });

    it('containsPoint', () =>
    {
        const box = box3Random();
        const triangleGeometry = triGeomFromBox(box);

        assert.ok(
            triGeomContainsPoint(triangleGeometry, box3RandomPoint(box, vec3Random()))
        );

        assert.ok(
            box3ToPoints(box).every((v) =>
                triGeomContainsPoint(triangleGeometry, v))
        );

        assert.ok(!triGeomContainsPoint(triangleGeometry, vec3Add(box.max, { x: 1, y: 0, z: 0 })));
    });

    it('classifyPoint', () =>
    {
        const box = { __type__: 'Box3', min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } };
        const triangleGeometry = triGeomFromBox(box);
        const center = { x: 0.5, y: 0.5, z: 0.5 };

        // 内部为 -1、表面为 0、外部为 1（与原 class 的 `classifyPoint` 同一约定）
        assert.equal(triGeomClassifyPoint(triangleGeometry, center), -1);
        assert.equal(triGeomClassifyPoint(triangleGeometry, { x: 1, y: 1, z: 1 }), 0);
        assert.equal(triGeomClassifyPoint(triangleGeometry, { x: 2, y: 0.5, z: 0.5 }), 1);
    });

    it('intersectionWithSegment', () =>
    {
        const box = box3Random();
        const triangleGeometry = triGeomFromBox(box);

        const r = triGeomIntersectionWithSegment(triangleGeometry, seg3FromPoints(box.min, box.max));
        assert.ok(r);
        if (r)
        {
            assert.ok(r.segments.length === 0);
            assert.ok(r.points.length === 2);
            assert.ok(seg3Equals(seg3FromPoints(r.points[0], r.points[1]), seg3FromPoints(box.min, box.max)));
        }

        const p0 = { x: box.min.x, y: box.min.y, z: mathUtil.lerp(box.min.z, box.max.z, Math.random()) };
        const p1 = { x: box.min.x, y: box.min.y, z: box.max.z + 1 };
        const s = seg3FromPoints(p0, p1);

        const r1 = triGeomIntersectionWithSegment(triangleGeometry, s);
        assert.ok(r1);
        if (r1)
        {
            assert.ok(r1.segments.length === 1);
            assert.ok(r1.points.length === 0);
            assert.ok(seg3Equals(seg3FromPoints(p0, { x: box.min.x, y: box.min.y, z: box.max.z }), r1.segments[0]));
        }
    });

    it('classifySegment（既有行为：不相交时给 ±1，相交时抛「未实现」——原样保留）', () =>
    {
        const box = { __type__: 'Box3', min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } };
        const triangleGeometry = triGeomFromBox(box);

        // 完全在盒子内、不碰任何面：不相交且端点在几何体内 → -1
        const inside = triGeomClassifySegment(triangleGeometry, seg3FromPoints({ x: 0.2, y: 0.5, z: 0.5 }, { x: 0.8, y: 0.5, z: 0.5 }));

        assert.equal(inside, -1);

        // 完全在盒子外的线段：不相交且端点在外 → 1
        const outside = triGeomClassifySegment(triangleGeometry, seg3FromPoints({ x: 5, y: 5, z: 5 }, { x: 6, y: 6, z: 6 }));

        assert.equal(outside, 1);

        // 既有行为：只要线段真的与几何体相交，`intersectionWithSegment` 给的就是「交点」形态，
        // 而 `classifySegment` 的交点分支在原实现里是 `throw \`未实现\``（抛字符串）——逐字保留。
        expect(() => triGeomClassifySegment(triangleGeometry, seg3FromPoints({ x: 0.5, y: 0.5, z: 0.5 }, { x: 2, y: 0.5, z: 0.5 })))
            .toThrow('未实现');
    });

    it('copy 深拷贝三角形列表（out 缺省新建）', () =>
    {
        const box = box3Random();
        const triangleGeometry = triGeomFromBox(box);
        const copy = triGeomCopy(triangleGeometry);

        assert.notEqual(copy, triangleGeometry);
        assert.notEqual(copy.triangles, triangleGeometry.triangles, '三角形数组也应是新数组');
        assert.equal(copy.triangles.length, triangleGeometry.triangles.length);

        // 三角形是逐个拷贝的（改副本不影响原件）
        copy.triangles[0].p0.x += 100;
        assert.notEqual(copy.triangles[0].p0.x, triangleGeometry.triangles[0].p0.x);
    });

    it('未实现的两个方法原样抛字符串（类删除后仍是同一行为）', () =>
    {
        const box = { __type__: 'Box3', min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } };
        const triangleGeometry: WritableTriangleGeometryLike = triGeomFromBox(box);
        const triangle = triangleGeometry.triangles[0];

        expect(() => triGeomClassifyTriangle(triangleGeometry, triangle)).toThrow('未实现');
        expect(() => triGeomDecomposeTriangle(triangleGeometry, triangle)).toThrow('未实现');
    });

    it('数据声明形态：带 `readonly __type__: \'TriangleGeometry\'` 判别字段', () =>
    {
        const box = { __type__: 'Box3', min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } };
        const triangleGeometry: TriangleGeometry = { __type__: 'TriangleGeometry', triangles: triGeomFromBox(box).triangles };

        assert.equal(triangleGeometry.__type__, 'TriangleGeometry');
        assert.ok(triGeomIsClosed(triangleGeometry));
    });
});
