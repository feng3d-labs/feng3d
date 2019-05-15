namespace feng3d
{
    QUnit.module("Box3", () =>
    {
        QUnit.test("intersectsTriangle", (assert) =>
        {
            var box = Box.random();
            var triangle = Triangle3D.fromPoints(box.randomPoint(), box.randomPoint(), box.randomPoint());
            assert.ok(
                box.intersectsTriangle(triangle)
            );

            var triangle1 = Triangle3D.fromPoints(box.randomPoint(), box.randomPoint().addNumber(5), box.randomPoint().addNumber(6));
            assert.ok(
                box.intersectsTriangle(triangle1)
            );

            //
            var box2 = new Box(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
            var triangle2 = new Triangle3D(new Vector3(1.5, 0, 0), new Vector3(0, 1.5, 0), new Vector3(1.5, 1.5, 0));
            assert.ok(
                box2.intersectsTriangle(triangle2)
            );

        });

    });
}