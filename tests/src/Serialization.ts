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
            assert.ok(r != undefined);
            assert.ok(Object.keys(r).length == 1);

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
            assert.ok(c.id == c1.id);
            assert.ok(c.a == c1.a);
            assert.ok(c.c == c1.c);
        });

        QUnit.test("serialize.different 获取两个数据的差异", (assert) =>
        {
            var c = new C();
            c.id = 8;

            var diff = serialization.different(c, new C());
            assert.ok(Object.keys(diff).length == 1);
        });
    });
}