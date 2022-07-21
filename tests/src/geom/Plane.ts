namespace feng3d
{
    QUnit.module("Plane", () =>
    {
        QUnit.test("getOrigin", (assert) =>
        {
            var p = Plane.random();
            assert.ok(
                p.onWithPoint(p.getOrigin())
            );
            assert.ok(
                mathUtil.equals(p.getOrigin().distance(Vector3.ZERO), p.distanceWithPoint(Vector3.ZERO))
            );
        });

        QUnit.test("randomPoint", (assert) =>
        {
            var p = Plane.random();
            assert.ok(
                p.onWithPoint(p.randomPoint())
            );
        });

        QUnit.test("distance", (assert) =>
        {
            var plane = new Plane();
            assert.ok(plane.distanceWithPoint(new Vector3()) == plane.d);
            //
            var p = Vector3.random().scaleNumber(100);
            var n = Vector3.random().normalize();
            var length = (0.5 - Math.random()) * 100;
            plane.fromNormalAndPoint(n, p);
            //
            var p0 = n.scaleNumberTo(length).add(p);
            assert.ok(plane.distanceWithPoint(p0).toPrecision(6) == length.toPrecision(6));
        });

        QUnit.test("intersectWithLine3D", (assert) =>
        {
            var line = new Line3().fromPoints(Vector3.random(), Vector3.random());
            var plane = Plane.random();
            var p = <Vector3>plane.intersectWithLine3(line);
            if (p)
            {
                assert.ok(line.onWithPoint(p))
                assert.ok(plane.onWithPoint(p));
            }
        });

        QUnit.test("intersectWithPlane3D", (assert) =>
        {
            var p0 = Vector3.random().scaleNumber(100);
            var p1 = Vector3.random().scaleNumber(100);
            var p2 = Vector3.random().scaleNumber(100);
            var p3 = Vector3.random().scaleNumber(100);

            var line = new Line3().fromPoints(p0, p1);

            var plane0 = Plane.fromPoints(p0, p1, p2);
            var plane1 = Plane.fromPoints(p0, p1, p3);

            var crossLine = plane0.intersectWithPlane3D(plane1);

            assert.ok(!!crossLine)
            if (crossLine)
                assert.ok(line.equals(crossLine));
        });

        QUnit.test("intersectWithTwoPlane3D", (assert) =>
        {
            var p1 = Plane.random();
            var p2 = Plane.random();
            var p3 = Plane.random();

            var cp = p1.intersectWithTwoPlane3D(p2, p3);

            assert.ok(p1.onWithPoint(cp));
            assert.ok(p2.onWithPoint(cp));
            assert.ok(p3.onWithPoint(cp));

        });
    });
}