QUnit.module("Object", () =>
{
    QUnit.test("assignShallow", (assert) =>
    {
        var o = { a: 1, b: 2 };
        Object.assignShallow(o, { a: 1 });
        assert.ok(o.a == 1);

        var o1 = { a: 1, v2: new feng3d.Vector2() };
        var v2 = new feng3d.Vector2();
        Object.assignShallow(o1, { v2: v2 })

        assert.ok(o1.v2 == v2);
    });

    QUnit.test("assignDeep", (assert) =>
    {
        var o = { a: 1, b: 2 };
        Object.assignDeep(o, { a: 1 });
        assert.ok(o.a == 1);

        var v20 = new feng3d.Vector2();
        var o1 = { a: 1, v2: v20, str: "" };
        var v21 = new feng3d.Vector2();
        Object.assignDeep(o1, { v2: v21, str: "asjdlskj" })
        assert.ok(o1.v2 == v21);

        var v3 = new feng3d.Vector3();
        var o2 = { a: 1, v2: v20, v3: v3 };
        Object.assignDeep(o2, { v2: { x: 1, y: 2 }, v3: { __class__: "feng3d.Vector3", x: 1 } }, [(target, source, key, replacers, deep) =>
        {
            if (Object.isObject(source[key]) && source[key][feng3d.CLASS_KEY] == "feng3d.Vector3")
            {
                target[key] = new feng3d.Vector3();
            }
            return false;
        }]);

        assert.ok(o2.v2 == v20);
        assert.ok(o2.v2.y == 2);
        assert.ok(o2.v3 != v3);
        assert.ok(o2.v3.x == 1);

        // function

        var fo = { f: () => 1 };
        var o3 = { a: 3, fo: fo };
        Object.assignDeep(o3, { fo: { f: () => 3 } });

        assert.ok(o3.fo == fo);
        assert.ok(o3.fo.f() == 3);

    });

    QUnit.test("isObject", (assert) =>
    {
        class A { }

        assert.ok(!Object.isObject(1));
        assert.ok(!Object.isObject([]));
        assert.ok(!Object.isObject(new A()));
        assert.ok(!Object.isObject(false));
        assert.ok(!Object.isObject(window));
        assert.ok(!Object.isObject("window"));

        assert.ok(Object.isObject({}));
        assert.ok(Object.isObject({ a: 1 }));

        // 测试 参考：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
        var iframe = document.createElement('iframe');
        iframe.name = "test Object.isObject IFrame";
        document.body.appendChild(iframe);
        var xObject = window.frames[window.frames.length - 1]["Object"];
        var obj = new xObject();
        assert.ok(Object.isObject(obj));
        assert.ok(Object != obj.constructor);

        iframe.remove();
    });

    QUnit.test("equalDeep", (assert) =>
    {
        var o = { a: 1, b: { c: true, d: [1, 2, true, "abc"], e: "f" } };
        var o1 = JSON.parse(JSON.stringify(o));

        assert.ok(Object.equalDeep(o, o1));

        o.b.e = "a";
        assert.ok(!Object.equalDeep(o, o1));

        var v = new feng3d.Vector3(1, 2, 3);
        var v1 = new feng3d.Vector3(1, 2, 3);

        assert.ok(Object.equalDeep(v, v1));

        v1.z = 4;
        assert.ok(!Object.equalDeep(v, v1));
    });

    QUnit.test("getPropertyValue", (assert) =>
    {
        // 对象
        var o = { a: 1, b: { c: true, d: [1, 2, true, "abc"], e: "f" } };

        assert.ok(Object.getPropertyValue(o, "b.e") == o.b.e);
        assert.ok(Object.getPropertyValue(o, ["b", "e"]) == o.b.e);
        assert.ok(Object.getPropertyValue(o, "b.f") == undefined);

        // 数组
        var arr = [[1, 2, [3, 4, 5, [6, 7]]]];
        assert.ok(Object.getPropertyValue(arr, "0.1") == 2);
        assert.ok(Object.getPropertyValue(arr, ["0", "1"]) == 2);

        assert.ok(Object.getPropertyValue(arr, "0.2.3.1") == 7);
        assert.ok(Object.getPropertyValue(arr, ["0", "2", "3", "1"]) == 7);

        assert.ok(Object.getPropertyValue(arr, "2.2.3.1") == undefined);

    });

    QUnit.test("getPropertyChains", (assert) =>
    {
        // 对象
        var o = { a: 1, b: { c: true, d: [1, 2, true, "abc"], e: "f" } };

        var chains = Object.getPropertyChains(o);

        assert.equal(chains.length, 7);

        var o1 = { a: 1, b: { c: true } };

        var chains1 = Object.getPropertyChains(o1);
        assert.equal(chains1.length, 2);
        assert.ok(chains1.indexOf("a") != -1);
        assert.ok(chains1.indexOf("b.c") != -1);
    });

});