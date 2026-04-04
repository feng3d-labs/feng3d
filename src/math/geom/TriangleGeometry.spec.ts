import { mathUtil } from '../../polyfill/MathUtil';
import { Box3 } from './Box3';
import { Segment3 } from './Segment3';
import { TriangleGeometry } from './TriangleGeometry';
import { Vector3 } from './Vector3';

import { assert, describe, it } from 'vitest';

describe('TriangleGeometry', () =>
{
    it('fromBox,getBox', () =>
    {
        const box = new Box3().random();
        const triangleGeometry = new TriangleGeometry().fromBox(box);

        assert.ok(
            triangleGeometry.getBox().equals(box)
        );
    });

    it('getPoints', () =>
    {
        const box = new Box3().random();
        const triangleGeometry = new TriangleGeometry().fromBox(box);

        assert.ok(triangleGeometry.getPoints().length === 8);
    });

    it('isClosed', () =>
    {
        // var box = Box.random();
        const box = new Box3(new Vector3(), new Vector3(1, 1, 1));
        const triangleGeometry = new TriangleGeometry().fromBox(box);

        assert.ok(
            triangleGeometry.isClosed()
        );

        triangleGeometry.triangles.pop();

        assert.ok(
            !triangleGeometry.isClosed()
        );
    });

    it('containsPoint', () =>
    {
        const box = new Box3().random();
        const triangleGeometry = new TriangleGeometry().fromBox(box);

        assert.ok(
            triangleGeometry.containsPoint(box.randomPoint())
        );

        assert.ok(
            box.toPoints().every((v) =>
                triangleGeometry.containsPoint(v))
        );

        assert.ok(!triangleGeometry.containsPoint(box.max.addTo(new Vector3(1, 0, 0))));
    });

    it('intersectionWithSegment', () =>
    {
        const box = new Box3().random();
        const triangleGeometry = new TriangleGeometry().fromBox(box);

        const r = triangleGeometry.intersectionWithSegment(new Segment3().fromPoints(box.min, box.max));
        assert.ok(r);
        if (r)
        {
            assert.ok(r.segments.length === 0);
            assert.ok(r.points.length === 2);
            assert.ok(new Segment3().fromPoints(r.points[0], r.points[1]).equals(new Segment3().fromPoints(box.min, box.max)));
        }

        const p0 = new Vector3(box.min.x, box.min.y, mathUtil.lerp(box.min.z, box.max.z, Math.random()));
        const p1 = new Vector3(box.min.x, box.min.y, box.max.z + 1);
        const s = new Segment3().fromPoints(p0, p1);

        const r1 = triangleGeometry.intersectionWithSegment(s);
        assert.ok(r1);
        if (r1)
        {
            assert.ok(r1.segments.length === 1);
            assert.ok(r1.points.length === 0);
            assert.ok(new Segment3().fromPoints(p0, new Vector3(box.min.x, box.min.y, box.max.z)).equals(r1.segments[0]));
        }
    });
});
