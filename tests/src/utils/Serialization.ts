namespace feng3d
{
    export class ObjectBase
    {
        @serialize
        id = 1;
    }

    export class C extends ObjectBase
    {
        // @serialize
        // id = 2;

        @serialize
        a = 1;

        @serialize
        c = 1;

        @serialize
        o = { a: 1, b: true, c: { d: "string" } }

        change()
        {
            console.log("change", this.a, arguments);
        }
    }

    QUnit.module("Serialization", () =>
    {
        QUnit.test("serialize&deserialize 函数", (assert) =>
        {
            function add(a: number, b: number)
            {
                return a + b;
            }
            var result = serialization.serialize(add);
            var result1 = serialization.deserialize(result);

            var a = Math.random();
            var b = Math.random();
            assert.ok(result1 != add);
            assert.ok(result1(a, b) == add(a, b));

            // 序列化反序列化 serialization 工具中的函数列表
            var r = serialization.serialize(serialization.serializeHandlers);
            var serializeReplacers = serialization.deserialize(r);
            var r = serialization.serialize(serialization.deserializeHandlers);
            var deserializeReplacers = serialization.deserialize(r);
            //
            var mySerialization = new Serialization();
            mySerialization.serializeHandlers = serializeReplacers;
            mySerialization.deserializeHandlers = deserializeReplacers;

            // 使用序列化反序列化后的 serialization 工具进行序列化函数测试
            var result = mySerialization.serialize(add);
            var result1 = mySerialization.deserialize(result);
            var a = Math.random();
            var b = Math.random();
            assert.ok(result1 != add);
            assert.ok(result1(a, b) == add(a, b));
        });

        QUnit.test("serialize&deserialize 基础类型", (assert) =>
        {
            var arr = [1, "abc", true, null, undefined];

            var r = arr.map(v => serialization.serialize(v));
            assert.deepEqual(arr, r);

            var r1 = r.map(v => serialization.deserialize(v));
            assert.deepEqual(arr, r1);
        });

        QUnit.test("serialize&deserialize 带serializable属性对象", (assert) =>
        {
            var obj = { serializable: false, a: 1 };
            var r = serialization.serialize(obj);
            assert.ok(r == undefined);

            obj.serializable = true;
            var r = serialization.serialize(obj);
            assert.ok(r.a == obj.a);

            delete obj.serializable;
            var r = serialization.serialize(obj);
            assert.ok(r.a == obj.a);
        });

        QUnit.test("serialize&deserialize Feng3dObject对象", (assert) =>
        {
            var obj = new Feng3dObject();
            obj.hideFlags = HideFlags.DontSave;
            var r = serialization.serialize(obj);
            assert.ok(r == undefined);

            obj.hideFlags = HideFlags.None;
            var r = serialization.serialize(obj);
            assert.deepEqual(r, { __class__: "feng3d.Feng3dObject" }); // 忽略默认值 hideFlags: HideFlags.None

            var obj1 = serialization.deserialize(r);
            assert.deepEqual(obj, obj1);
        });

        QUnit.test("serialize&deserialize 拥有自定义serialize函数的对象", (assert) =>
        {
            var obj = {
                a: 1,
                serialize(obj)
                {
                    obj.a = this.a * 2;
                },
            };
            var r = serialization.serialize(obj);
            assert.ok(r.a == obj.a * 2);

            delete obj.serialize;
            var r = serialization.serialize(obj);
            assert.ok(r.a == 1);

            var r0 = serialization.deserialize(r);
            assert.ok(r0.a == 1);
        });

        QUnit.test("serialize&deserialize Array", (assert) =>
        {
            var arr = [1, 2, 3, "a", "b"];

            var result = serialization.serialize(arr);
            var result1 = serialization.deserialize(result);

            assert.deepEqual(arr, result1);
        });

        QUnit.test("serialize&deserialize Object", (assert) =>
        {
            var obj = { a: 1, b: 2, c: { f: 3, d: "a", e: "b" } };

            var result = serialization.serialize(obj);
            var result1 = serialization.deserialize(result);

            assert.deepEqual(obj, result1);
        });

        QUnit.test("serialize&deserialize 自定义对象", (assert) =>
        {
            var base = new ObjectBase();
            base.id = Math.random();
            var resultb = serialization.serialize(base);
            var base1: ObjectBase = serialization.deserialize(resultb);
            assert.ok(base.id == base1.id);

            var c = new C();
            c.id = Math.random();
            c.a = Math.random();
            c.c = Math.random();
            var result = serialization.serialize(c);
            var c1: C = serialization.deserialize(result);
            assert.deepEqual(c, c1);

            // 检查 serialize 过程中使用 different 减少数据量
            var o2 = new feng3d.Vector2();
            var r2 = serialization.serialize(o2);
            assert.deepEqual(r2, { __class__: "feng3d.Vector2" })

            o2.x = 1
            var r2 = serialization.serialize(o2);
            assert.deepEqual(r2, { __class__: "feng3d.Vector2", x: 1 })

            //
            var obj = new feng3d.GameObject()
            var diff2 = serialization.serialize(obj);
            assert.deepEqual(diff2, { __class__: "feng3d.GameObject" });

            //
            var obj2 = serialization.deserialize(diff2);
            var diff = serialization.different(obj, obj2);
            assert.deepEqual(diff, {});

            obj.transform.x = 1;
            var r3 = serialization.serialize(obj);
            assert.deepEqual(r3, { __class__: "feng3d.GameObject", components: [{ x: 1 }] });

            //
            var obj3 = serialization.deserialize(r3);
            var diff1 = serialization.different(obj, obj3);
            assert.deepEqual(diff1, {});


            var gameobject = serialization.setValue(new GameObject(), {
                name: "gameobject",
                components: [{ __class__: "feng3d.MeshModel", geometry: Geometry.plane },]
            });

            assert.equal(gameobject.numComponents, 2);
            var model = gameobject.getComponent(feng3d.MeshModel);
            assert.notEqual(model, null);

        });

        QUnit.test("different 相等对象", (assert) =>
        {
            var o = { a: 1, b: { c: true, d: { e: "str" } } };
            var o1 = { a: 1, b: { c: true, d: { e: "str" } } };

            var diff = serialization.different(o, o1);
            assert.deepEqual(diff, {});

            var v = new feng3d.Vector2();
            var v1 = new feng3d.Vector2();
            var diff1 = serialization.different(v, v1);
            assert.deepEqual(diff1, {});

            var c = new C();
            var nc = new C();
            var diff2 = serialization.different(c, nc);
            assert.deepEqual(diff2, {});
        });

        QUnit.test("different 目标数据为null时", (assert) =>
        {
            var o = { a: 1, b: null };
            var o1 = { a: 1, b: { c: true, d: { e: "str" } } };

            var diff = serialization.different(o, o1);
            assert.deepEqual(diff, { b: null });

            var diff = serialization.different(o1, o);
            assert.deepEqual(diff, { b: { c: true, d: { e: "str" } } });

            var o2 = { v: new feng3d.Vector2() };
            var o3 = { v: null };

            var diff1 = serialization.different(o2, o3);
            assert.deepEqual(diff1, { v: { __class__: "feng3d.Vector2" } });

            var diff1 = serialization.different(o3, o2);
            assert.deepEqual(diff1, { v: null });
        });

        QUnit.test("different 基础类型", (assert) =>
        {
            var o = { a: 1, b: true, c: "str", d: null, e: undefined, f: NaN };
            var o1 = { a: 2, b: false, c: "str1", d: 1, e: 1, f: 1 };

            var diff = serialization.different(o, o1);
            assert.deepEqual(diff, o);

            var diff = serialization.different(o1, o);
            assert.deepEqual(diff, o1);
        });

        QUnit.test("different 数组", (assert) =>
        {
            var arr = [1, true, "str", null, undefined, NaN];
            var arr1 = [1, false, "str1", 1, 1, 1];
            //
            var diff = serialization.different(arr, arr1);
            var expectDiff = [];
            arr.forEach((v, i) =>
            {
                if (arr[i] != arr1[i]) expectDiff[i] = arr[i];
            });
            assert.deepEqual(diff, expectDiff); // 此处有 expectDiff[0] 未定义
            //
            var diff1 = serialization.different(arr1, arr);
            var expectDiff1 = [];
            arr.forEach((v, i) =>
            {
                if (arr[i] != arr1[i]) expectDiff1[i] = arr1[i];
            });
            assert.deepEqual(diff1, expectDiff1);
        });

        QUnit.test("different 不同对象类型", (assert) =>
        {
            var o = { v: new feng3d.Vector2() };
            var o1 = { v: new feng3d.Vector3() };

            var serO = serialization.serialize(o);
            var serO1 = serialization.serialize(o1);

            var diff = serialization.different(o, <any>o1);
            assert.deepEqual(diff, serO);

            var diff = serialization.different(o1, <any>o);
            assert.deepEqual(diff, serO1);
        });

        QUnit.test("different 资源", (assert) =>
        {
            var o = feng3d.Material.default; //默认材质资源
            var o1 = new Material();

            var diff = serialization.different(o, o1);
            assert.deepEqual(diff, { name: "Default-Material", assetId: "Default-Material", hideFlags: HideFlags.NotEditable });

            var o2 = { v: feng3d.Material.default }; //默认材质资源
            var o3 = { v: new Material() };

            var expectDiff = serialization.serialize(o2);
            var diff1 = serialization.different(o2, o3);
            assert.deepEqual(diff1, expectDiff);
        });

        QUnit.test("different 默认处理", (assert) =>
        {
            var o = { a: 1, b: true, c: "abc" };
            var o1 = { a: 2, b: true, c: "abc" };

            var diff = serialization.different(o, o1);
            assert.deepEqual(diff, { a: 1 });

            var o2 = new feng3d.Vector3();
            var o3 = new feng3d.Vector3(1, 2, 3);

            var diff1 = serialization.different(o2, o3);
            assert.deepEqual(diff1, { x: 0, y: 0, z: 0 });

            //
            var diff2 = feng3d.serialization.different(new feng3d.GameObject(), new feng3d.GameObject());
            assert.deepEqual(diff2, {});
        });

        QUnit.test("serialization.setValue", (assert) =>
        {
            // todo

            serialization.setValue

            assert.ok(true);
        });
    });
}