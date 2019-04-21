QUnit.module("Object", () =>
{
    QUnit.test("setValue", (assert) =>
    {
        var o = { a: 1, b: 2 };
        Object.setValue(o, { a: 1 });
        assert.ok(o.a == 1);

        var o1 = { a: 1, v2: new feng3d.Vector2() };
        var v2 = new feng3d.Vector2();
        Object.setValue(o1, { v2: v2 })

        assert.ok(o1.v2 == v2);
    });

    QUnit.test("setValueDeep", (assert) =>
    {
        var o = { a: 1, b: 2 };
        Object.setValueDeep(o, { a: 1 });
        assert.ok(o.a == 1);

        var v20 = new feng3d.Vector2();
        var o1 = { a: 1, v2: v20, str: "" };
        var v21 = new feng3d.Vector2();
        Object.setValueDeep(o1, { v2: v21, str: "asjdlskj" })
        assert.ok(o1.v2 == v20);

        var v3 = new feng3d.Vector3();
        var o2 = { a: 1, v2: v20, v3: v3 };
        Object.setValueDeep(o2, { v2: { x: 1, y: 2 }, v3: <any>{ __class__: "feng3d.Vector3", x: 1 } }, (t, s, k) =>
        {
            if (Object.isObject(s[k]) && s[k]["__class__"] == "feng3d.Vector3")
            {
                t[k] = new feng3d.Vector3();
            }
            return false;
        });

        assert.ok(o2.v2 == v20);
        assert.ok(o2.v2.y == 2);
        assert.ok(o2.v3 != v3);
        assert.ok(o2.v3.x == 1);
    });
});