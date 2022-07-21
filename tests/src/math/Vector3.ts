namespace feng3d
{
    QUnit.module("Vector3", () =>
    {

        QUnit.test("creation", (test) =>
        {
            test.expect(3);

            var v = new Vector3(1, 2, 3);
            test.equal(v.x, 1, "Creating a vec3 should set the first parameter to the x value");
            test.equal(v.y, 2, "Creating a vec3 should set the second parameter to the y value");
            test.equal(v.z, 3, "Creating a vec3 should set the third parameter to the z value");

        });

        QUnit.test("cross", (test) =>
        {
            test.expect(3);

            var v = new Vector3(1, 2, 3);
            var u = new Vector3(4, 5, 6);
            v = v.crossTo(u);

            test.equal(v.x, -3, "Calculating cross product x");
            test.equal(v.y, 6, "Calculating cross product x");
            test.equal(v.z, -3, "Calculating cross product x");

        });

        QUnit.test("dot", (test) =>
        {
            test.expect(2);

            var v = new Vector3(1, 2, 3);
            var u = new Vector3(4, 5, 6);
            var dot = v.dot(u);

            test.equal(dot, 4 + 10 + 18, "Calculating dot product x");

            v = new Vector3(3, 2, 1);
            u = new Vector3(4, 5, 6);
            dot = v.dot(u);

            test.equal(dot, 12 + 10 + 6, "Calculating dot product x");

        });

        QUnit.test("set", (test) =>
        {
            test.expect(3);

            var v = new Vector3(1, 2, 3);
            v.set(4, 5, 6);

            test.equal(v.x, 4, "Setting values from x, y, z");
            test.equal(v.y, 5, "Setting values from x, y, z");
            test.equal(v.z, 6, "Setting values from x, y, z");

        });

        QUnit.test("addTo", (test) =>
        {
            test.expect(3);

            var v = new Vector3(1, 2, 3);
            var u = new Vector3(4, 5, 6);
            v = v.addTo(u);

            test.equal(v.x, 5, "Adding a vector (x)");
            test.equal(v.y, 7, "Adding a vector (y)");
            test.equal(v.z, 9, "Adding a vector (z)");

        });

        QUnit.test("isAntiparallelTo", (test) =>
        {
            test.ok(new Vector3(1, 0, 0).isAntiparallelTo(new Vector3(-1, 0, 0)));
        });


        QUnit.test("almostEquals", (test) =>
        {
            test.ok(new Vector3(1, 0, 0).equals(new Vector3(1, 0, 0)));
        });

        QUnit.test("isParallel", (test) =>
        {
            var v = Vector3.random();
            var v1 = v.scaleNumberTo(Math.random() * 2 - 1);
            test.ok(v.isParallel(v1));
        });
    });
}