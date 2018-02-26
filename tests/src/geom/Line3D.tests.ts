namespace feng3d
{
    QUnit.module("Line3D", () =>
    {
        QUnit.test("getPlane", (assert) =>
        {
            var line = Line3D.random();
            var plane = line.getPlane();
            assert.ok(
                plane.onWithPoint(line.position)
            );
            assert.ok(
                plane.onWithPoint(line.position.addTo(line.direction))
            );
        });


        QUnit.test("distanceWithPoint", (assert) =>
        {
            var l = Line3D.random();
            assert.ok(l.distanceWithPoint(l.position) == 0);

            var n = Vector3.random().cross(l.direction).scale(100);
            assert.ok(Math.abs(l.distanceWithPoint(n.addTo(l.position)) - n.length) < n.length / 1000)
        });

        QUnit.test("intersectWithLine3D", (assert) =>
        {
            var l0 = Line3D.random();
            var l1 = Line3D.fromPoints(l0.position.clone(), Vector3.random());
            assert.ok(
                l0.position.equals(<Vector3>l0.intersectWithLine3D(l1))
            );

            l1.fromPoints(l0.getPoint(Math.random()), l0.getPoint(Math.random()));

            assert.ok(
                l0.equals(<Line3D>l0.intersectWithLine3D(l1))
            );

        });
    });
}