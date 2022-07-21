QUnit.module("Object", () =>
{
    const ObjectUtils = feng3d.ObjectUtils;
    
    QUnit.test("assignShallow", (assert) =>
    {
        var o = { a: 1, b: 2 };
        ObjectUtils.assignShallow(o, { a: 1 });
        assert.ok(o.a == 1);

        var o1 = { a: 1, v2: new feng3d.Vector2() };
        var v2 = new feng3d.Vector2();
        ObjectUtils.assignShallow(o1, { v2: v2 })

        assert.ok(o1.v2 == v2);
    });

    QUnit.test("assignDeep", (assert) =>
    {
        var o = { a: 1, b: 2 };
        ObjectUtils.assignDeep(o, { a: 1 });
        assert.ok(o.a == 1);

        var v20 = new feng3d.Vector2();
        var o1 = { a: 1, v2: v20, str: "" };
        var v21 = new feng3d.Vector2();
        ObjectUtils.assignDeep(o1, { v2: v21, str: "asjdlskj" })
        assert.ok(o1.v2 == v21);

        var v3 = new feng3d.Vector3();
        var o2 = { a: 1, v2: v20, v3: v3 };
        ObjectUtils.assignDeep(o2, { v2: { x: 1, y: 2 }, v3: { __class__: "feng3d.Vector3", x: 1 } }, [(target, source, key, replacers, deep) =>
        {
            if (ObjectUtils.isObject(source[key]) && source[key][feng3d.__class__] == "feng3d.Vector3")
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
        ObjectUtils.assignDeep(o3, { fo: { f: () => 3 } });

        assert.ok(o3.fo == fo);
        assert.ok(o3.fo.f() == 3);

    });

    QUnit.test("isObject", (assert) =>
    {
        class A { }

        assert.ok(!ObjectUtils.isObject(1));
        assert.ok(!ObjectUtils.isObject([]));
        assert.ok(!ObjectUtils.isObject(new A()));
        assert.ok(!ObjectUtils.isObject(false));
        assert.ok(!ObjectUtils.isObject(window));
        assert.ok(!ObjectUtils.isObject("window"));

        assert.ok(ObjectUtils.isObject({}));
        assert.ok(ObjectUtils.isObject({ a: 1 }));

        // 测试 参考：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
        var iframe = document.createElement('iframe');
        iframe.name = "test ObjectUtils.isObject IFrame";
        document.body.appendChild(iframe);
        var xObject = window.frames[window.frames.length - 1]["Object"];
        var obj = new xObject();
        assert.ok(ObjectUtils.isObject(obj));
        assert.ok(Object != obj.constructor);

        iframe.remove();
    });

    QUnit.test("equalDeep", (assert) =>
    {
        var o = { a: 1, b: { c: true, d: [1, 2, true, "abc"], e: "f" } };
        var o1 = JSON.parse(JSON.stringify(o));

        assert.ok(ObjectUtils.equalDeep(o, o1));

        o.b.e = "a";
        assert.ok(!ObjectUtils.equalDeep(o, o1));

        var v = new feng3d.Vector3(1, 2, 3);
        var v1 = new feng3d.Vector3(1, 2, 3);

        assert.ok(ObjectUtils.equalDeep(v, v1));

        v1.z = 4;
        assert.ok(!ObjectUtils.equalDeep(v, v1));
    });

    QUnit.test("getPropertyValue", (assert) =>
    {
        // 对象
        var o = { a: 1, b: { c: true, d: [1, 2, true, "abc"], e: "f" } };

        assert.ok(ObjectUtils.getPropertyValue(o, "b.e") == o.b.e);
        assert.ok(ObjectUtils.getPropertyValue(o, ["b", "e"]) == o.b.e);
        assert.ok(ObjectUtils.getPropertyValue(o, "b.f") == undefined);

        // 数组
        var arr = [[1, 2, [3, 4, 5, [6, 7]]]];
        assert.ok(ObjectUtils.getPropertyValue(arr, "0.1") == 2);
        assert.ok(ObjectUtils.getPropertyValue(arr, ["0", "1"]) == 2);

        assert.ok(ObjectUtils.getPropertyValue(arr, "0.2.3.1") == 7);
        assert.ok(ObjectUtils.getPropertyValue(arr, ["0", "2", "3", "1"]) == 7);

        assert.ok(ObjectUtils.getPropertyValue(arr, "2.2.3.1") == undefined);

    });

    QUnit.test("getPropertyChains", (assert) =>
    {
        // 对象
        var o = { a: 1, b: { c: true, d: [1, 2, true, "abc"], e: "f" } };

        var chains = ObjectUtils.getPropertyChains(o);

        assert.equal(chains.length, 7);

        var o1 = { a: 1, b: { c: true } };

        var chains1 = ObjectUtils.getPropertyChains(o1);
        assert.equal(chains1.length, 2);
        assert.ok(chains1.indexOf("a") != -1);
        assert.ok(chains1.indexOf("b.c") != -1);
    });

});