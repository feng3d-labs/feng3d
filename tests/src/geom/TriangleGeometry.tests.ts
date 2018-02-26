namespace feng3d
{
    QUnit.module("TriangleGeometry", () =>
    {
        QUnit.test("fromBox,getBox", (assert) =>
        {
            var box = Box.random();
            var triangleGeometry = TriangleGeometry.fromBox(box);

            assert.ok(
                triangleGeometry.getBox().equals(box)
            );

        });

        QUnit.test("getPoints", (assert) =>
        {
            var box = Box.random();
            var triangleGeometry = TriangleGeometry.fromBox(box);

            assert.ok(triangleGeometry.getPoints().length == 8);
        });

        QUnit.test("isClosed", (assert) =>
        {
            // var box = Box.random();
            var box = new Box(new Vector3(), new Vector3(1, 1, 1));
            var triangleGeometry = TriangleGeometry.fromBox(box);

            assert.ok(
                triangleGeometry.isClosed()
            );

            triangleGeometry.triangles.pop();

            assert.notOk(
                triangleGeometry.isClosed()
            );
        });

        QUnit.test("containsPoint", (assert) =>
        {
            var box = Box.random();
            var triangleGeometry = TriangleGeometry.fromBox(box);

            assert.ok(
                triangleGeometry.containsPoint(box.randomPoint())
            );

            assert.ok(
                box.toPoints().every((v) =>
                {
                    return triangleGeometry.containsPoint(v)
                })
            );

            assert.ok(!triangleGeometry.containsPoint(box.max.addTo(new Vector3(1, 0, 0))));
        });

        QUnit.test("intersectionWithSegment", (assert) =>
        {
            var box = Box.random();
            var triangleGeometry = TriangleGeometry.fromBox(box);

            var r = triangleGeometry.intersectionWithSegment(Segment3D.fromPoints(box.min, box.max))
            assert.ok(r);
            if (r)
            {
                assert.ok(r.segments.length == 0);
                assert.ok(r.points.length == 2);
                assert.ok(Segment3D.fromPoints(r.points[0], r.points[1]).equals(Segment3D.fromPoints(box.min, box.max)));
            }

            var p0 = new Vector3(box.min.x, box.min.y, FMath.lerp(box.min.z, box.max.z, Math.random()));
            var p1 = new Vector3(box.min.x, box.min.y, box.max.z + 1);
            var s = Segment3D.fromPoints(p0, p1);

            var r1 = triangleGeometry.intersectionWithSegment(s);
            assert.ok(r1);
            if (r1)
            {
                assert.ok(r1.segments.length == 1);
                assert.ok(r1.points.length == 0);
                assert.ok(Segment3D.fromPoints(p0, new Vector3(box.min.x, box.min.y, box.max.z)).equals(r1.segments[0]));
            }
        });
    });
}
