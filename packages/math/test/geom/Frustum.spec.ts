/**
 * @author bhouston / http://exocortex.com
 * @author TristanVALCKE / https://github.com/Itee
 */
import { ok } from 'assert';
import { Box3, Frustum, Matrix4x4, Plane, Sphere, Vector3 } from '../../src';

describe('Frustum', () =>
{
    // INSTANCING
    it('Instancing', () =>
    {
        let a = new Frustum();

        ok(a.planes !== undefined, 'Passed!');
        ok(a.planes.length === 6, 'Passed!');

        const pDefault = new Plane();
        for (let i = 0; i < 6; i++)
        {
            ok(a.planes[i].equals(pDefault), 'Passed!');
        }

        const p0 = new Plane(1, 0, 0, -1);
        const p1 = new Plane(1, 0, 0, 1);
        const p2 = new Plane(1, 0, 0, 2);
        const p3 = new Plane(1, 0, 0, 3);
        const p4 = new Plane(1, 0, 0, 4);
        const p5 = new Plane(1, 0, 0, 5);

        a = new Frustum(p0, p1, p2, p3, p4, p5);
        ok(a.planes[0].equals(p0), 'Passed!');
        ok(a.planes[1].equals(p1), 'Passed!');
        ok(a.planes[2].equals(p2), 'Passed!');
        ok(a.planes[3].equals(p3), 'Passed!');
        ok(a.planes[4].equals(p4), 'Passed!');
        ok(a.planes[5].equals(p5), 'Passed!');
    });

    // PUBLIC STUFF
    it('set', () =>
    {
        const a = new Frustum();
        const p0 = new Plane(1, 0, 0, -1);
        const p1 = new Plane(1, 0, 0, 1);
        const p2 = new Plane(1, 0, 0, 2);
        const p3 = new Plane(1, 0, 0, 3);
        const p4 = new Plane(1, 0, 0, 4);
        const p5 = new Plane(1, 0, 0, 5);

        a.set(p0, p1, p2, p3, p4, p5);

        ok(a.planes[0].equals(p0), 'Check plane #0');
        ok(a.planes[1].equals(p1), 'Check plane #1');
        ok(a.planes[2].equals(p2), 'Check plane #2');
        ok(a.planes[3].equals(p3), 'Check plane #3');
        ok(a.planes[4].equals(p4), 'Check plane #4');
        ok(a.planes[5].equals(p5), 'Check plane #5');
    });

    it('clone', () =>
    {
        const p0 = new Plane(1, 0, 0, -1);
        const p1 = new Plane(1, 0, 0, 1);
        const p2 = new Plane(1, 0, 0, 2);
        const p3 = new Plane(1, 0, 0, 3);
        const p4 = new Plane(1, 0, 0, 4);
        const p5 = new Plane(1, 0, 0, 5);

        const b = new Frustum(p0, p1, p2, p3, p4, p5);
        const a = b.clone();
        ok(a.planes[0].equals(p0), 'Passed!');
        ok(a.planes[1].equals(p1), 'Passed!');
        ok(a.planes[2].equals(p2), 'Passed!');
        ok(a.planes[3].equals(p3), 'Passed!');
        ok(a.planes[4].equals(p4), 'Passed!');
        ok(a.planes[5].equals(p5), 'Passed!');

        // ensure it is a true copy by modifying source
        a.planes[0].copy(p1);
        ok(b.planes[0].equals(p0), 'Passed!');
    });

    it('copy', () =>
    {
        const p0 = new Plane(1, 0, 0, -1);
        const p1 = new Plane(1, 0, 0, 1);
        const p2 = new Plane(1, 0, 0, 2);
        const p3 = new Plane(1, 0, 0, 3);
        const p4 = new Plane(1, 0, 0, 4);
        const p5 = new Plane(1, 0, 0, 5);

        const b = new Frustum(p0, p1, p2, p3, p4, p5);
        const a = new Frustum().copy(b);
        ok(a.planes[0].equals(p0), 'Passed!');
        ok(a.planes[1].equals(p1), 'Passed!');
        ok(a.planes[2].equals(p2), 'Passed!');
        ok(a.planes[3].equals(p3), 'Passed!');
        ok(a.planes[4].equals(p4), 'Passed!');
        ok(a.planes[5].equals(p5), 'Passed!');

        // ensure it is a true copy by modifying source
        b.planes[0] = p1;
        ok(a.planes[0].equals(p0), 'Passed!');
    });

    it('fromMatrix/makeOrthographic/containsPoint', () =>
    {
        const m = new Matrix4x4().setOrtho(-1, 1, -1, 1, 1, 100);
        const a = new Frustum().fromMatrix(m);

        ok(!a.containsPoint(new Vector3(0, 0, 0)), 'Passed!');
        ok(a.containsPoint(new Vector3(0, 0, 50)), 'Passed!');
        ok(a.containsPoint(new Vector3(0, 0, 1.001)), 'Passed!');
        ok(a.containsPoint(new Vector3(-1, -1, 1.001)), 'Passed!');
        ok(!a.containsPoint(new Vector3(-1.1, -1.1, 1.001)), 'Passed!');
        ok(a.containsPoint(new Vector3(1, 1, 1.001)), 'Passed!');
        ok(!a.containsPoint(new Vector3(1.1, 1.1, 1.001)), 'Passed!');
        ok(a.containsPoint(new Vector3(0, 0, 100)), 'Passed!');
        ok(a.containsPoint(new Vector3(-1, -1, 100)), 'Passed!');
        ok(!a.containsPoint(new Vector3(-1.1, -1.1, 100.1)), 'Passed!');
        ok(a.containsPoint(new Vector3(1, 1, 100)), 'Passed!');
        ok(!a.containsPoint(new Vector3(1.1, 1.1, 100.1)), 'Passed!');
        ok(!a.containsPoint(new Vector3(0, 0, 101)), 'Passed!');
    });

    it('fromMatrix/makePerspective/containsPoint', () =>
    {
        const m = new Matrix4x4().setPerspective(-1, 1, 1, -1, 1, 100);
        const a = new Frustum().fromMatrix(m);

        ok(!a.containsPoint(new Vector3(0, 0, 0)), 'Passed!');
        ok(a.containsPoint(new Vector3(0, 0, 50)), 'Passed!');
        ok(a.containsPoint(new Vector3(0, 0, 1.001)), 'Passed!');
        ok(a.containsPoint(new Vector3(-1, -1, 1.001)), 'Passed!');
        ok(!a.containsPoint(new Vector3(-1.1, -1.1, 1.001)), 'Passed!');
        ok(a.containsPoint(new Vector3(1, 1, 1.001)), 'Passed!');
        ok(!a.containsPoint(new Vector3(1.1, 1.1, 1.001)), 'Passed!');
        ok(a.containsPoint(new Vector3(0, 0, 99.999)), 'Passed!');
        ok(a.containsPoint(new Vector3(-99.999, -99.999, 99.999)), 'Passed!');
        ok(!a.containsPoint(new Vector3(-100.1, -100.1, 100.1)), 'Passed!');
        ok(a.containsPoint(new Vector3(99.999, 99.999, 99.999)), 'Passed!');
        ok(!a.containsPoint(new Vector3(100.1, 100.1, 100.1)), 'Passed!');
        ok(!a.containsPoint(new Vector3(0, 0, 101)), 'Passed!');
    });

    it('fromMatrix/makePerspective/intersectsSphere', () =>
    {
        const m = new Matrix4x4().setPerspective(-1, 1, 1, -1, 1, 100);
        const a = new Frustum().fromMatrix(m);

        ok(!a.intersectsSphere(new Sphere(new Vector3(0, 0, 0), 0)), 'Passed!');
        ok(!a.intersectsSphere(new Sphere(new Vector3(0, 0, 0), 0.9)), 'Passed!');
        ok(a.intersectsSphere(new Sphere(new Vector3(0, 0, 0), 1.1)), 'Passed!');
        ok(a.intersectsSphere(new Sphere(new Vector3(0, 0, 50), 0)), 'Passed!');
        ok(a.intersectsSphere(new Sphere(new Vector3(0, 0, 1.001), 0)), 'Passed!');
        ok(a.intersectsSphere(new Sphere(new Vector3(-1, -1, 1.001), 0)), 'Passed!');
        ok(!a.intersectsSphere(new Sphere(new Vector3(-1.1, -1.1, 1.001), 0)), 'Passed!');
        ok(a.intersectsSphere(new Sphere(new Vector3(-1.1, -1.1, 1.001), 0.5)), 'Passed!');
        ok(a.intersectsSphere(new Sphere(new Vector3(1, 1, 1.001), 0)), 'Passed!');
        ok(!a.intersectsSphere(new Sphere(new Vector3(1.1, 1.1, 1.001), 0)), 'Passed!');
        ok(a.intersectsSphere(new Sphere(new Vector3(1.1, 1.1, 1.001), 0.5)), 'Passed!');
        ok(a.intersectsSphere(new Sphere(new Vector3(0, 0, 99.999), 0)), 'Passed!');
        ok(a.intersectsSphere(new Sphere(new Vector3(-99.999, -99.999, 99.999), 0)), 'Passed!');
        ok(!a.intersectsSphere(new Sphere(new Vector3(-100.1, -100.1, 100.1), 0)), 'Passed!');
        ok(a.intersectsSphere(new Sphere(new Vector3(-100.1, -100.1, 100.1), 0.5)), 'Passed!');
        ok(a.intersectsSphere(new Sphere(new Vector3(99.999, 99.999, 99.999), 0)), 'Passed!');
        ok(!a.intersectsSphere(new Sphere(new Vector3(100.1, 100.1, 100.1), 0)), 'Passed!');
        ok(a.intersectsSphere(new Sphere(new Vector3(100.1, 100.1, 100.1), 0.2)), 'Passed!');
        ok(!a.intersectsSphere(new Sphere(new Vector3(0, 0, 101), 0)), 'Passed!');
        ok(a.intersectsSphere(new Sphere(new Vector3(0, 0, 101), 1.1)), 'Passed!');
    });

    it('intersectsBox', () =>
    {
        const m = new Matrix4x4().setPerspective(-1, 1, 1, -1, 1, 100);
        const a = new Frustum().fromMatrix(m);
        const box = new Box3(Vector3.ZERO.clone(), Vector3.ONE.clone());
        let intersects;

        intersects = a.intersectsBox(box);
        ok(!intersects, 'No intersection');

        box.translate(new Vector3(1, 1, 1));

        intersects = a.intersectsBox(box);
        ok(intersects, 'Successful intersection');
    });
});
