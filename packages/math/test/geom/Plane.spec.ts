import { mathUtil } from '@feng3d/polyfill';
import { describe, it, assert } from 'vitest';
import { Line3, Plane, Vector3 } from '../../src';

describe('Plane', () =>
{
    it('getOrigin', () =>
    {
        const p = Plane.random();
        assert.ok(
            p.onWithPoint(p.getOrigin())
        );
        assert.ok(
            mathUtil.equals(p.getOrigin().distance(Vector3.ZERO), p.distanceWithPoint(Vector3.ZERO))
        );
    });

    it('randomPoint', () =>
    {
        const p = Plane.random();
        assert.ok(
            p.onWithPoint(p.randomPoint())
        );
    });

    it('distance', () =>
    {
        const plane = new Plane();
        assert.ok(plane.distanceWithPoint(new Vector3()) === plane.d);
        //
        const p = Vector3.random().scaleNumber(100);
        const n = Vector3.random().normalize();
        const length = (0.5 - Math.random()) * 100;
        plane.fromNormalAndPoint(n, p);
        //
        const p0 = n.scaleNumberTo(length).add(p);
        assert.ok(plane.distanceWithPoint(p0).toPrecision(6) === length.toPrecision(6));
    });

    it('intersectWithLine3D', () =>
    {
        const line = new Line3().fromPoints(Vector3.random(), Vector3.random());
        const plane = Plane.random();
        const p = <Vector3>plane.intersectWithLine3(line);
        if (p)
        {
            assert.ok(line.onWithPoint(p));
            assert.ok(plane.onWithPoint(p));
        }
    });

    it('intersectWithPlane3D', () =>
    {
        const p0 = Vector3.random().scaleNumber(100);
        const p1 = Vector3.random().scaleNumber(100);
        const p2 = Vector3.random().scaleNumber(100);
        const p3 = Vector3.random().scaleNumber(100);

        const line = new Line3().fromPoints(p0, p1);

        const plane0 = Plane.fromPoints(p0, p1, p2);
        const plane1 = Plane.fromPoints(p0, p1, p3);

        const crossLine = plane0.intersectWithPlane3D(plane1);

        assert.ok(!!crossLine);
        if (crossLine)
        { assert.ok(line.equals(crossLine)); }
    });

    it('intersectWithTwoPlane3D', () =>
    {
        const p1 = Plane.random();
        const p2 = Plane.random();
        const p3 = Plane.random();

        const cp = p1.intersectWithTwoPlane3D(p2, p3) as Vector3;

        assert.ok(p1.onWithPoint(cp));
        assert.ok(p2.onWithPoint(cp));
        assert.ok(p3.onWithPoint(cp));
    });
});
