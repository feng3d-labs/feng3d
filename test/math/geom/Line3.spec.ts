import { ok } from 'assert';
import { Line3 } from '../../../src/math/geom/Line3';
import { Vector3 } from '../../../src/math/geom/Vector3';

describe('Line3', () =>
{
    it('getPlane', () =>
    {
        const line = new Line3().random();
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
        const l = new Line3().random();
        ok(l.distanceWithPoint(l.origin) === 0);

        const n = new Vector3().random().cross(l.direction).scaleNumber(100);
        ok(Math.abs(l.distanceWithPoint(n.addTo(l.origin)) - n.length) < n.length / 1000);
    });

    it('intersectWithLine3D', () =>
    {
        const l0 = new Line3().random();
        const l1 = new Line3().fromPoints(l0.origin.clone(), new Vector3().random());
        ok(
            l0.origin.equals(<Vector3>l0.intersectWithLine3D(l1))
        );

        l1.fromPoints(l0.getPoint(Math.random()), l0.getPoint(Math.random()));

        ok(
            l0.equals(<Line3>l0.intersectWithLine3D(l1))
        );
    });
});
