import { ok } from 'assert';
import { Line3, Vector3 } from '../../src';
import { describe, it } from 'vitest';

describe('Line3', () =>
{
    it('getPlane', () =>
    {
        const line = Line3.random();
        const plane = line.getPlane();
        ok(
            plane.onWithPoint(line.origin)
        );
        ok(
            plane.onWithPoint(line.origin.addTo(line.direction))
        );
    });

    it('distanceWithPoint', () =>
    {
        const l = Line3.random();
        ok(l.distanceWithPoint(l.origin) === 0);

        const n = Vector3.random().cross(l.direction).scaleNumber(100);
        ok(Math.abs(l.distanceWithPoint(n.addTo(l.origin)) - n.length) < n.length / 1000);
    });

    it('intersectWithLine3D', () =>
    {
        const l0 = Line3.random();
        const l1 = Line3.fromPoints(l0.origin.clone(), Vector3.random());
        ok(
            l0.origin.equals(<Vector3>l0.intersectWithLine3D(l1))
        );

        l1.fromPoints(l0.getPoint(Math.random()), l0.getPoint(Math.random()));

        ok(
            l0.equals(<Line3>l0.intersectWithLine3D(l1))
        );
    });
});
