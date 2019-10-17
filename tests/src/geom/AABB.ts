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


        QUnit.test("toLocalFrame", (assert) =>
        {
            var trans = new CANNON.Transform();
            trans.position = feng3d.Vector3.random();
            trans.quaternion = feng3d.Quaternion.random();

            var aabb0 = AABB.random();
            var aabb1 = new CANNON.AABB(aabb0.min, aabb0.max);

            var aabb2 = new AABB();
            var aabb3 = new CANNON.AABB();
            aabb0.toLocalFrame(trans, aabb2);
            aabb1.toLocalFrame(trans, aabb3);

            var r = aabb2.min.equals(aabb3.min);
            if (!r)
            {
                console.log(aabb2.min, aabb3.min);
                // debugger;
            }
            assert.ok(r);
            var r = aabb2.max.equals(aabb3.max);
            if (!r)
            {
                console.log(aabb2.max, aabb3.max);
                // debugger;
            }
            assert.ok(r);
        });

        
        QUnit.test("toWorldFrame", (assert) =>
        {
            var trans = new CANNON.Transform();
            trans.position = feng3d.Vector3.random();
            trans.quaternion = feng3d.Quaternion.random();

            var aabb0 = AABB.random();
            var aabb1 = new CANNON.AABB(aabb0.min, aabb0.max);

            var aabb2 = new AABB();
            var aabb3 = new CANNON.AABB();
            aabb0.toWorldFrame(trans, aabb2);
            aabb1.toWorldFrame(trans, aabb3);

            var r = aabb2.min.equals(aabb3.min);
            if (!r)
            {
                console.log(aabb2.min, aabb3.min);
                // debugger;
            }
            assert.ok(r);
            var r = aabb2.max.equals(aabb3.max);
            if (!r)
            {
                console.log(aabb2.max, aabb3.max);
                // debugger;
            }
            assert.ok(r);
        });

    });
}