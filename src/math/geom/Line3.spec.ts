import { Line3 } from './Line3';
import { Vector3 } from './Vector3';

import { Plane } from './Plane';
Plane;

import { assert, describe, it } from 'vitest';

describe('Line3', () =>
{
    it('getPlane', () =>
    {
        const line = new Line3().random();
        const plane = line.getPlane();
        assert.ok(
            plane.onWithPoint(line.origin)
        );
        assert.ok(
            plane.onWithPoint(line.origin.addTo(line.direction))
        );
    });

    it('distanceWithPoint', () =>
    {
        const l = new Line3().random();
        assert.ok(l.distanceWithPoint(l.origin) === 0);

        const n = new Vector3().random().cross(l.direction).scaleNumber(100);
        assert.ok(Math.abs(l.distanceWithPoint(n.addTo(l.origin)) - n.length) < n.length / 1000);
    });

    it('intersectWithLine3D', () =>
    {
        const l0 = new Line3().random();
        const l1 = new Line3().fromPoints(l0.origin.clone(), new Vector3().random());
        assert.ok(
            l0.origin.equals(<Vector3>l0.intersectWithLine3D(l1))
        );

        l1.fromPoints(l0.getPoint(Math.random()), l0.getPoint(Math.random()));

        assert.ok(
            l0.equals(<Line3>l0.intersectWithLine3D(l1))
        );
    });
});
