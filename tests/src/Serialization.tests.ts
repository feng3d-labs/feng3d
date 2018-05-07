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
            log("change", this.a, arguments);
        }
    }

    QUnit.module("Serialization", () =>
    {
        QUnit.test("serialize", (assert) =>
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

        QUnit.test("serialize function", (assert) =>
        {
            function add(a: number, b: number)
            {
                return a + b;
            }

            var result = serialization.serialize(add);
            var result1 = serialization.deserialize(result);

            var a = Math.random();
            var b = Math.random();
            assert.ok(result1(a, b) == add(a, b));

        });

        QUnit.test("serialize Array", (assert) =>
        {
            var arr = [1, 2, 3, "a", "b"];

            var result = serialization.serialize(arr);
            var result1 = serialization.deserialize(result);

            var r = arr.reduce((prev, item, index) => { if (!prev) return prev; return arr[index] == result1[index]; }, true);

            assert.ok(r);
        });

        QUnit.test("serialize Object", (assert) =>
        {
            var obj = { a: 1, b: 2, c: 3, d: "a", e: "b" };

            var result = serialization.serialize(obj);
            var result1 = serialization.deserialize(result);

            var r = Object.keys(obj).reduce((prev, item) => { if (!prev) return prev; return obj[item] == result1[item]; }, true);

            assert.ok(r);
        });

        QUnit.test("serialize.setValue 相同类型时不会新建对象", (assert) =>
        {
            var obj = { a: 1, b: { c: 3, d: "a", e: "b", o: new C() } };
            var obj1 = serialization.serialize(obj);

            obj1.b.c = 5;
            obj1.b.o.id = 5;

            var b = obj.b;

            serialization.setPropertyValue(obj, obj1, "b");
            assert.ok(obj.b == b);
            obj1.b.o.id = 3;
            assert.ok(obj.b != obj1.b);
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