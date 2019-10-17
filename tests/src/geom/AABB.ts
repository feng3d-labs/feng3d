namespace feng3d
{
    QUnit.module("AABB", () =>
    {
        QUnit.test("intersectsTriangle", (assert) =>
        {
            var aabb = AABB.random();
            var triangle = Triangle3D.fromPoints(aabb.randomPoint(), aabb.randomPoint(), aabb.randomPoint());
            assert.ok(
                aabb.intersectsTriangle(triangle)
            );

            var triangle1 = Triangle3D.fromPoints(aabb.randomPoint(), aabb.randomPoint().addNumber(5), aabb.randomPoint().addNumber(6));
            assert.ok(
                aabb.intersectsTriangle(triangle1)
            );

            //
            var aabb2 = new AABB(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
            var triangle2 = new Triangle3D(new Vector3(1.5, 0, 0), new Vector3(0, 1.5, 0), new Vector3(1.5, 1.5, 0));
            assert.ok(
                aabb2.intersectsTriangle(triangle2)
            );

        });

    });
}