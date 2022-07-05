/**
 * @author bhouston / http://exocortex.com
 * @author TristanVALCKE / https://github.com/Itee
 */
namespace feng3d
{
	const eps = 0.0001;

	QUnit.module('Frustum', () =>
	{
		// INSTANCING
		QUnit.test("Instancing", (assert) =>
		{
			var a = new Frustum();

			assert.ok(a.planes !== undefined, "Passed!");
			assert.ok(a.planes.length === 6, "Passed!");

			var pDefault = new Plane();
			for (var i = 0; i < 6; i++)
			{
				assert.ok(a.planes[i].equals(pDefault), "Passed!");
			}

			var p0 = new Plane(1, 0, 0, - 1);
			var p1 = new Plane(1, 0, 0, 1);
			var p2 = new Plane(1, 0, 0, 2);
			var p3 = new Plane(1, 0, 0, 3);
			var p4 = new Plane(1, 0, 0, 4);
			var p5 = new Plane(1, 0, 0, 5);

			var a = new Frustum(p0, p1, p2, p3, p4, p5);
			assert.ok(a.planes[0].equals(p0), "Passed!");
			assert.ok(a.planes[1].equals(p1), "Passed!");
			assert.ok(a.planes[2].equals(p2), "Passed!");
			assert.ok(a.planes[3].equals(p3), "Passed!");
			assert.ok(a.planes[4].equals(p4), "Passed!");
			assert.ok(a.planes[5].equals(p5), "Passed!");

		});

		// PUBLIC STUFF
		QUnit.test("set", (assert) =>
		{

			var a = new Frustum();
			var p0 = new Plane(1, 0, 0, - 1);
			var p1 = new Plane(1, 0, 0, 1);
			var p2 = new Plane(1, 0, 0, 2);
			var p3 = new Plane(1, 0, 0, 3);
			var p4 = new Plane(1, 0, 0, 4);
			var p5 = new Plane(1, 0, 0, 5);

			a.set(p0, p1, p2, p3, p4, p5);

			assert.ok(a.planes[0].equals(p0), "Check plane #0");
			assert.ok(a.planes[1].equals(p1), "Check plane #1");
			assert.ok(a.planes[2].equals(p2), "Check plane #2");
			assert.ok(a.planes[3].equals(p3), "Check plane #3");
			assert.ok(a.planes[4].equals(p4), "Check plane #4");
			assert.ok(a.planes[5].equals(p5), "Check plane #5");

		});

		QUnit.test("clone", (assert) =>
		{
			var p0 = new Plane(1, 0, 0, - 1);
			var p1 = new Plane(1, 0, 0, 1);
			var p2 = new Plane(1, 0, 0, 2);
			var p3 = new Plane(1, 0, 0, 3);
			var p4 = new Plane(1, 0, 0, 4);
			var p5 = new Plane(1, 0, 0, 5);

			var b = new Frustum(p0, p1, p2, p3, p4, p5);
			var a = b.clone();
			assert.ok(a.planes[0].equals(p0), "Passed!");
			assert.ok(a.planes[1].equals(p1), "Passed!");
			assert.ok(a.planes[2].equals(p2), "Passed!");
			assert.ok(a.planes[3].equals(p3), "Passed!");
			assert.ok(a.planes[4].equals(p4), "Passed!");
			assert.ok(a.planes[5].equals(p5), "Passed!");

			// ensure it is a true copy by modifying source
			a.planes[0].copy(p1);
			assert.ok(b.planes[0].equals(p0), "Passed!");

		});

		QUnit.test("copy", (assert) =>
		{
			var p0 = new Plane(1, 0, 0, - 1);
			var p1 = new Plane(1, 0, 0, 1);
			var p2 = new Plane(1, 0, 0, 2);
			var p3 = new Plane(1, 0, 0, 3);
			var p4 = new Plane(1, 0, 0, 4);
			var p5 = new Plane(1, 0, 0, 5);

			var b = new Frustum(p0, p1, p2, p3, p4, p5);
			var a = new Frustum().copy(b);
			assert.ok(a.planes[0].equals(p0), "Passed!");
			assert.ok(a.planes[1].equals(p1), "Passed!");
			assert.ok(a.planes[2].equals(p2), "Passed!");
			assert.ok(a.planes[3].equals(p3), "Passed!");
			assert.ok(a.planes[4].equals(p4), "Passed!");
			assert.ok(a.planes[5].equals(p5), "Passed!");

			// ensure it is a true copy by modifying source
			b.planes[0] = p1;
			assert.ok(a.planes[0].equals(p0), "Passed!");

		});

		QUnit.test("fromMatrix/makeOrthographic/containsPoint", (assert) =>
		{

			var m = new Matrix4x4().setOrtho(- 1, 1, - 1, 1, 1, 100);
			var a = new Frustum().fromMatrix(m);

			assert.ok(!a.containsPoint(new Vector3(0, 0, 0)), "Passed!");
			assert.ok(a.containsPoint(new Vector3(0, 0, 50)), "Passed!");
			assert.ok(a.containsPoint(new Vector3(0, 0, 1.001)), "Passed!");
			assert.ok(a.containsPoint(new Vector3(- 1, - 1, 1.001)), "Passed!");
			assert.ok(!a.containsPoint(new Vector3(- 1.1, - 1.1, 1.001)), "Passed!");
			assert.ok(a.containsPoint(new Vector3(1, 1, 1.001)), "Passed!");
			assert.ok(!a.containsPoint(new Vector3(1.1, 1.1, 1.001)), "Passed!");
			assert.ok(a.containsPoint(new Vector3(0, 0, 100)), "Passed!");
			assert.ok(a.containsPoint(new Vector3(- 1, - 1, 100)), "Passed!");
			assert.ok(!a.containsPoint(new Vector3(- 1.1, - 1.1, 100.1)), "Passed!");
			assert.ok(a.containsPoint(new Vector3(1, 1, 100)), "Passed!");
			assert.ok(!a.containsPoint(new Vector3(1.1, 1.1, 100.1)), "Passed!");
			assert.ok(!a.containsPoint(new Vector3(0, 0, 101)), "Passed!");

		});

		QUnit.test("setFromMatrix/makePerspective/containsPoint", (assert) =>
		{

			var m = new Matrix4x4().setPerspective(- 1, 1, 1, - 1, 1, 100);
			var a = new Frustum().fromMatrix(m);

			assert.ok(!a.containsPoint(new Vector3(0, 0, 0)), "Passed!");
			assert.ok(a.containsPoint(new Vector3(0, 0, 50)), "Passed!");
			assert.ok(a.containsPoint(new Vector3(0, 0, 1.001)), "Passed!");
			assert.ok(a.containsPoint(new Vector3(- 1, - 1, 1.001)), "Passed!");
			assert.ok(!a.containsPoint(new Vector3(- 1.1, - 1.1, 1.001)), "Passed!");
			assert.ok(a.containsPoint(new Vector3(1, 1, 1.001)), "Passed!");
			assert.ok(!a.containsPoint(new Vector3(1.1, 1.1, 1.001)), "Passed!");
			assert.ok(a.containsPoint(new Vector3(0, 0, 99.999)), "Passed!");
			assert.ok(a.containsPoint(new Vector3(- 99.999, - 99.999, 99.999)), "Passed!");
			assert.ok(!a.containsPoint(new Vector3(- 100.1, - 100.1, 100.1)), "Passed!");
			assert.ok(a.containsPoint(new Vector3(99.999, 99.999, 99.999)), "Passed!");
			assert.ok(!a.containsPoint(new Vector3(100.1, 100.1, 100.1)), "Passed!");
			assert.ok(!a.containsPoint(new Vector3(0, 0, 101)), "Passed!");

		});

		QUnit.test("setFromMatrix/makePerspective/intersectsSphere", (assert) =>
		{

			var m = new Matrix4x4().setPerspective(- 1, 1, 1, - 1, 1, 100);
			var a = new Frustum().fromMatrix(m);

			assert.ok(!a.intersectsSphere(new Sphere(new Vector3(0, 0, 0), 0)), "Passed!");
			assert.ok(!a.intersectsSphere(new Sphere(new Vector3(0, 0, 0), 0.9)), "Passed!");
			assert.ok(a.intersectsSphere(new Sphere(new Vector3(0, 0, 0), 1.1)), "Passed!");
			assert.ok(a.intersectsSphere(new Sphere(new Vector3(0, 0, 50), 0)), "Passed!");
			assert.ok(a.intersectsSphere(new Sphere(new Vector3(0, 0, 1.001), 0)), "Passed!");
			assert.ok(a.intersectsSphere(new Sphere(new Vector3(- 1, - 1, 1.001), 0)), "Passed!");
			assert.ok(!a.intersectsSphere(new Sphere(new Vector3(- 1.1, - 1.1, 1.001), 0)), "Passed!");
			assert.ok(a.intersectsSphere(new Sphere(new Vector3(- 1.1, - 1.1, 1.001), 0.5)), "Passed!");
			assert.ok(a.intersectsSphere(new Sphere(new Vector3(1, 1, 1.001), 0)), "Passed!");
			assert.ok(!a.intersectsSphere(new Sphere(new Vector3(1.1, 1.1, 1.001), 0)), "Passed!");
			assert.ok(a.intersectsSphere(new Sphere(new Vector3(1.1, 1.1, 1.001), 0.5)), "Passed!");
			assert.ok(a.intersectsSphere(new Sphere(new Vector3(0, 0, 99.999), 0)), "Passed!");
			assert.ok(a.intersectsSphere(new Sphere(new Vector3(- 99.999, - 99.999, 99.999), 0)), "Passed!");
			assert.ok(!a.intersectsSphere(new Sphere(new Vector3(- 100.1, - 100.1, 100.1), 0)), "Passed!");
			assert.ok(a.intersectsSphere(new Sphere(new Vector3(- 100.1, - 100.1, 100.1), 0.5)), "Passed!");
			assert.ok(a.intersectsSphere(new Sphere(new Vector3(99.999, 99.999, 99.999), 0)), "Passed!");
			assert.ok(!a.intersectsSphere(new Sphere(new Vector3(100.1, 100.1, 100.1), 0)), "Passed!");
			assert.ok(a.intersectsSphere(new Sphere(new Vector3(100.1, 100.1, 100.1), 0.2)), "Passed!");
			assert.ok(!a.intersectsSphere(new Sphere(new Vector3(0, 0, 101), 0)), "Passed!");
			assert.ok(a.intersectsSphere(new Sphere(new Vector3(0, 0, 101), 1.1)), "Passed!");

		});

		QUnit.test("intersectsBox", (assert) =>
		{
			var m = new Matrix4x4().setPerspective(- 1, 1, 1, - 1, 1, 100);
			var a = new Frustum().fromMatrix(m);
			var box = new Box3(Vector3.ZERO.clone(), Vector3.ONE.clone());
			var intersects;

			intersects = a.intersectsBox(box);
			assert.notOk(intersects, "No intersection");

			box.translate(new Vector3(1, 1, 1));

			intersects = a.intersectsBox(box);
			assert.ok(intersects, "Successful intersection");

		});

	});
}