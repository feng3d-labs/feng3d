namespace feng3d
{
    QUnit.module("Box3", () =>
    {
        QUnit.test("intersectsTriangle", (assert) =>
        {
            var aabb = Box3.random();
            var triangle = Triangle3.fromPoints(aabb.randomPoint(), aabb.randomPoint(), aabb.randomPoint());
            assert.ok(
                aabb.intersectsTriangle(triangle)
            );

            var triangle1 = Triangle3.fromPoints(aabb.randomPoint(), aabb.randomPoint().addNumber(5), aabb.randomPoint().addNumber(6));
            assert.ok(
                aabb.intersectsTriangle(triangle1)
            );

            //
            var aabb2 = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
            var triangle2 = new Triangle3(new Vector3(1.5, 0, 0), new Vector3(0, 1.5, 0), new Vector3(1.5, 1.5, 0));
            assert.ok(
                aabb2.intersectsTriangle(triangle2)
            );

        });

    });
}