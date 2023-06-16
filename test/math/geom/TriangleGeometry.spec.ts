import { mathUtil } from '@feng3d/polyfill';
import { Box3 } from '../../../src/math/geom/Box3';
import { Segment3 } from '../../../src/math/geom/Segment3';
import { TriangleGeometry } from '../../../src/math/geom/TriangleGeometry';
import { Vector3 } from '../../../src/math/geom/Vector3';

import { assert, describe, it } from 'vitest';
const { ok, equal, deepEqual } = assert;

describe('TriangleGeometry', () =>
{
    it('fromBox,getBox', () =>
    {
        const box = new Box3().random();
        const triangleGeometry = new TriangleGeometry().fromBox(box);

        ok(
            triangleGeometry.getBox().equals(box)
        );
    });

    it('getPoints', () =>
    {
        const box = new Box3().random();
        const triangleGeometry = new TriangleGeometry().fromBox(box);

        ok(triangleGeometry.getPoints().length === 8);
    });

    it('isClosed', () =>
    {
        // var box = Box.random();
        const box = new Box3(new Vector3(), new Vector3(1, 1, 1));
        const triangleGeometry = new TriangleGeometry().fromBox(box);

        ok(
            triangleGeometry.isClosed()
        );

        triangleGeometry.triangles.pop();

        ok(
            !triangleGeometry.isClosed()
        );
    });

    it('containsPoint', () =>
    {
        const box = new Box3().random();
        const triangleGeometry = new TriangleGeometry().fromBox(box);

        ok(
            triangleGeometry.containsPoint(box.randomPoint())
        );

        ok(
            box.toPoints().every((v) =>
                triangleGeometry.containsPoint(v))
        );

        ok(!triangleGeometry.containsPoint(box.max.addTo(new Vector3(1, 0, 0))));
    });

    it('intersectionWithSegment', () =>
    {
        const box = new Box3().random();
        const triangleGeometry = new TriangleGeometry().fromBox(box);

        const r = triangleGeometry.intersectionWithSegment(new Segment3().fromPoints(box.min, box.max));
        ok(r);
        if (r)
        {
            ok(r.segments.length === 0);
            ok(r.points.length === 2);
            ok(new Segment3().fromPoints(r.points[0], r.points[1]).equals(new Segment3().fromPoints(box.min, box.max)));
        }

        const p0 = new Vector3(box.min.x, box.min.y, mathUtil.lerp(box.min.z, box.max.z, Math.random()));
        const p1 = new Vector3(box.min.x, box.min.y, box.max.z + 1);
        const s = new Segment3().fromPoints(p0, p1);

        const r1 = triangleGeometry.intersectionWithSegment(s);
        ok(r1);
        if (r1)
        {
            ok(r1.segments.length === 1);
            ok(r1.points.length === 0);
            ok(new Segment3().fromPoints(p0, new Vector3(box.min.x, box.min.y, box.max.z)).equals(r1.segments[0]));
        }
    });
});
