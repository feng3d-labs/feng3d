import { Line3 } from '../../../src/math/geom/Line3';
import { Plane } from '../../../src/math/geom/Plane';
import { Vector3 } from '../../../src/math/geom/Vector3';
import { mathUtil } from '../../../src/polyfill/MathUtil';

import { assert, describe, expect, it } from 'vitest'
const { ok, equal, deepEqual } = assert;

describe('Plane', () =>
{
    it('getOrigin', () =>
    {
        const p = new Plane().random();
        ok(
            p.onWithPoint(p.getOrigin())
        );
        ok(
            mathUtil.equals(p.getOrigin().distance(Vector3.ZERO), p.distanceWithPoint(Vector3.ZERO))
        );
    });

    it('randomPoint', () =>
    {
        const p = new Plane().random();
        ok(
            p.onWithPoint(p.randomPoint())
        );
    });

    it('distance', () =>
    {
        const plane = new Plane();
        ok(plane.distanceWithPoint(new Vector3()) === plane.d);
        //
        const p = new Vector3().random().scaleNumber(100);
        const n = new Vector3().random().normalize();
        const length = (0.5 - Math.random()) * 100;
        plane.fromNormalAndPoint(n, p);
        //
        const p0 = n.scaleNumberTo(length).add(p);
        ok(plane.distanceWithPoint(p0).toPrecision(6) === length.toPrecision(6));
    });

    it('intersectWithLine3D', () =>
    {
        const line = new Line3().fromPoints(new Vector3().random(), new Vector3().random());
        const plane = new Plane().random();
        const p = <Vector3>plane.intersectWithLine3(line);
        if (p)
        {
            ok(line.onWithPoint(p));
            ok(plane.onWithPoint(p));
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

        ok(!!crossLine);
        if (crossLine)
        { ok(line.equals(crossLine)); }
    });

    it('intersectWithTwoPlane3D', () =>
    {
        const p1 = new Plane().random();
        const p2 = new Plane().random();
        const p3 = new Plane().random();

        const cp = p1.intersectWithTwoPlane3D(p2, p3) as Vector3;

        ok(p1.onWithPoint(cp));
        ok(p2.onWithPoint(cp));
        ok(p3.onWithPoint(cp));
    });
});
