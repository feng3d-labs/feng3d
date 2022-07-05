namespace feng3d
{
    QUnit.module("Line3", () =>
    {
        QUnit.test("getPlane", (assert) =>
        {
            var line = Line3.random();
            var plane = line.getPlane();
            assert.ok(
                plane.onWithPoint(line.origin)
            );
            assert.ok(
                plane.onWithPoint(line.origin.addTo(line.direction))
            );
        });


        QUnit.test("distanceWithPoint", (assert) =>
        {
            var l = Line3.random();
            assert.ok(l.distanceWithPoint(l.origin) == 0);

            var n = Vector3.random().cross(l.direction).scaleNumber(100);
            assert.ok(Math.abs(l.distanceWithPoint(n.addTo(l.origin)) - n.length) < n.length / 1000)
        });

        QUnit.test("intersectWithLine3D", (assert) =>
        {
            var l0 = Line3.random();
            var l1 = Line3.fromPoints(l0.origin.clone(), Vector3.random());
            assert.ok(
                l0.origin.equals(<Vector3>l0.intersectWithLine3D(l1))
            );

            l1.fromPoints(l0.getPoint(Math.random()), l0.getPoint(Math.random()));

            assert.ok(
                l0.equals(<Line3>l0.intersectWithLine3D(l1))
            );

        });
    });
}