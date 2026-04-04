import { mathUtil } from '../../polyfill/MathUtil';
import { Line3 } from './Line3';
import { Plane } from './Plane';
import { Vector3 } from './Vector3';

import { assert, describe, it } from 'vitest';

describe('Plane', () =>
{
    it('getOrigin', () =>
    {
        const p = new Plane().random();
        assert.ok(
            p.onWithPoint(p.getOrigin())
        );
        assert.ok(
            mathUtil.equals(p.getOrigin().distance(Vector3.ZERO), p.distanceWithPoint(Vector3.ZERO))
        );
    });

    it('randomPoint', () =>
    {
        const p = new Plane().random();
        assert.ok(
            p.onWithPoint(p.randomPoint())
        );
    });

    it('distance', () =>
    {
        const plane = new Plane();
        assert.ok(plane.distanceWithPoint(new Vector3()) === plane.d);
        //
        const p = new Vector3().random().scaleNumber(100);
        const n = new Vector3().random().normalize();
        const length = (0.5 - Math.random()) * 100;
        plane.fromNormalAndPoint(n, p);
        //
        const p0 = n.scaleNumberTo(length).add(p);
        assert.ok(plane.distanceWithPoint(p0).toPrecision(6) === length.toPrecision(6));
    });

    it('intersectWithLine3D', () =>
    {
        const line = new Line3().fromPoints(new Vector3().random(), new Vector3().random());
        const plane = new Plane().random();
        const p = <Vector3>plane.intersectWithLine3(line);
        if (p)
        {
            assert.ok(line.onWithPoint(p));
            assert.ok(plane.onWithPoint(p));
        }
    });

    it('intersectWithPlane3D', () =>
    {
        const p0 = new Vector3().random().scaleNumber(100);
        const p1 = new Vector3().random().scaleNumber(100);
        const p2 = new Vector3().random().scaleNumber(100);
        const p3 = new Vector3().random().scaleNumber(100);

        const line = new Line3().fromPoints(p0, p1);

        const plane0 = new Plane().fromPoints(p0, p1, p2);
        const plane1 = new Plane().fromPoints(p0, p1, p3);

        const crossLine = plane0.intersectWithPlane3D(plane1);

        assert.ok(!!crossLine);
        if (crossLine)
        {
            assert.ok(line.equals(crossLine));
        }
    });

    it('intersectWithTwoPlane3D', () =>
    {
        const p1 = new Plane().random();
        const p2 = new Plane().random();
        const p3 = new Plane().random();

        const cp = p1.intersectWithTwoPlane3D(p2, p3) as Vector3;

        assert.ok(p1.onWithPoint(cp));
        assert.ok(p2.onWithPoint(cp));
        assert.ok(p3.onWithPoint(cp));
    });
});
