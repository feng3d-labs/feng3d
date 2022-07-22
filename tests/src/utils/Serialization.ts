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
        o = { a: 1, b: true, c: { d: 'string' } };

        change()
        {
            console.log('change', this.a, arguments);
        }
    }

    export class LoopA
    {
        a: LoopA;
        aArr: LoopA[];

        constructor()
        {
            this.a = this;
            this.aArr = [this, this, this, this];
        }
    }

    QUnit.module('Serialization', () =>
    {
        // QUnit.test('serialize&deserialize 函数', (assert) =>
        // {
        //     function add(a: number, b: number)
        //     {
        //         return a + b;
        //     }
        //     var result = serialization.serialize(add);
        //     var result1 = serialization.deserialize(result);

        //     var a = Math.random();
        //     var b = Math.random();
        //     assert.ok(result1 != add);
        //     assert.ok(result1(a, b) == add(a, b));

        //     // 序列化反序列化 serialization 工具中的函数列表
        //     const r0 = serialization.serialize(serialization.serializeHandlers);
        //     const serializeReplacers = serialization.deserialize(r0);
        //     const r = serialization.serialize(serialization.deserializeHandlers);
        //     const deserializeReplacers = serialization.deserialize(r);
        //     //
        //     const mySerialization = new Serialization();
        //     mySerialization.serializeHandlers = serializeReplacers;
        //     mySerialization.deserializeHandlers = deserializeReplacers;

        //     // 使用序列化反序列化后的 serialization 工具进行序列化函数测试
        //     var result = mySerialization.serialize(add);
        //     var result1 = mySerialization.deserialize(result);
        //     var a = Math.random();
        //     var b = Math.random();
        //     assert.ok(result1 != add);
        //     assert.ok(result1(a, b) == add(a, b));
        // });

        QUnit.test('serialize&deserialize 基础类型', (assert) =>
        {
            const arr = [1, 'abc', true, null, undefined];

            const r = arr.map((v) => serialization.serialize(v));
            assert.deepEqual(arr, r);

            const r1 = r.map((v) => serialization.deserialize(v));
            assert.deepEqual(arr, r1);
        });

        QUnit.test('serialize&deserialize 循环引用以及多次引用', (assert) =>
        {
            const a = { a: null, a1: null, a2: null };
            a.a = a;
            a.a1 = a;
            a.a2 = a;

            const r = serialization.serialize(a);

            const r1 = serialization.deserialize(r);
            assert.deepEqual(a, r1);

            assert.ok(r1.a == r1);
            assert.ok(r1.a1 == r1);
            assert.ok(r1.a2 == r1);

            const aa = new LoopA();

            const rr = serialization.serialize(aa);

            const rr1 = serialization.deserialize(rr);
            assert.deepEqual(aa, rr1);
        });

        QUnit.test('serialize&deserialize 带serializable属性对象', (assert) =>
        {
            const obj = { serializable: false, a: 1 };
            var r = serialization.serialize(obj);
            assert.ok(r == undefined);

            obj.serializable = true;
            var r = serialization.serialize(obj);
            assert.ok(r.a == obj.a);

            delete obj.serializable;
            var r = serialization.serialize(obj);
            assert.ok(r.a == obj.a);
        });

        QUnit.test('serialize&deserialize Feng3dObject对象', (assert) =>
        {
            const obj = new Feng3dObject();
            obj.hideFlags = HideFlags.DontSave;
            var r = serialization.serialize(obj);
            assert.ok(r == undefined);

            obj.hideFlags = HideFlags.None;
            var r = serialization.serialize(obj);
            assert.deepEqual(r, { __class__: 'feng3d.Feng3dObject' }); // 忽略默认值 hideFlags: HideFlags.None

            const obj1 = serialization.deserialize(r);
            assert.deepEqual(obj, obj1);
        });

        QUnit.test('serialize&deserialize 拥有自定义serialize函数的对象', (assert) =>
        {
            const obj = {
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

            const r0 = serialization.deserialize(r);
            assert.ok(r0.a == 1);
        });

        QUnit.test('serialize&deserialize Array', (assert) =>
        {
            const arr = [1, 2, 3, 'a', 'b'];

            const result = serialization.serialize(arr);
            const result1 = serialization.deserialize(result);

            assert.deepEqual(arr, result1);
        });

        QUnit.test('serialize&deserialize Object', (assert) =>
        {
            const obj = { a: 1, b: 2, c: { f: 3, d: 'a', e: 'b' } };

            const result = serialization.serialize(obj);
            const result1 = serialization.deserialize(result);

            assert.deepEqual(obj, result1);
        });

        QUnit.test('serialize&deserialize 自定义对象', (assert) =>
        {
            const base = new ObjectBase();
            base.id = Math.random();
            const resultb = serialization.serialize(base);
            const base1: ObjectBase = serialization.deserialize(resultb);
            assert.ok(base.id == base1.id);

            const c = new C();
            c.id = Math.random();
            c.a = Math.random();
            c.c = Math.random();
            const result = serialization.serialize(c);
            const c1: C = serialization.deserialize(result);
            assert.deepEqual(c, c1);

            // 检查 serialize 过程中使用 different 减少数据量
            const o2 = new feng3d.Vector2();
            var r2 = serialization.serialize(o2);
            assert.deepEqual(r2, { __class__: 'feng3d.Vector2' });

            o2.x = 1;
            var r2 = serialization.serialize(o2);
            assert.deepEqual(r2, { __class__: 'feng3d.Vector2', x: 1 });

            //
            const obj = new feng3d.GameObject();
            const diff2 = serialization.serialize(obj);
            assert.deepEqual(diff2, { __class__: 'feng3d.GameObject' });

            //
            const obj2 = serialization.deserialize(diff2);
            const diff = serialization.different(obj, obj2);
            assert.deepEqual(diff, {});

            obj.transform.x = 1;
            const r3 = serialization.serialize(obj);
            assert.deepEqual(r3, { __class__: 'feng3d.GameObject', components: [{ x: 1 }] });

            //
            const obj3 = serialization.deserialize(r3);
            const diff1 = serialization.different(obj, obj3);
            assert.deepEqual(diff1, {});

            const gameobject = serialization.setValue(new GameObject(), {
                name: 'gameobject',
                components: [{ __class__: 'feng3d.MeshRenderer', geometry: Geometry.getDefault('Plane') }]
            });

            assert.equal(gameobject.numComponents, 2);
            const model = gameobject.getComponent(MeshRenderer);
            assert.notEqual(model, null);
        });

        QUnit.test('different 相等对象', (assert) =>
        {
            const o = { a: 1, b: { c: true, d: { e: 'str' } } };
            const o1 = { a: 1, b: { c: true, d: { e: 'str' } } };

            const diff = serialization.different(o, o1);
            assert.deepEqual(diff, {});

            const v = new feng3d.Vector2();
            const v1 = new feng3d.Vector2();
            const diff1 = serialization.different(v, v1);
            assert.deepEqual(diff1, {});

            const c = new C();
            const nc = new C();
            const diff2 = serialization.different(c, nc);
            assert.deepEqual(diff2, {});
        });

        QUnit.test('different 目标数据为null时', (assert) =>
        {
            const o = { a: 1, b: null };
            const o1 = { a: 1, b: { c: true, d: { e: 'str' } } };

            var diff = serialization.different(o, o1);
            assert.deepEqual(diff, { b: null });

            var diff = serialization.different(o1, o);
            assert.deepEqual(diff, { b: { c: true, d: { e: 'str' } } });

            const o2 = { v: new feng3d.Vector2() };
            const o3 = { v: null };

            var diff1 = serialization.different(o2, o3);
            assert.deepEqual(diff1, { v: { __class__: 'feng3d.Vector2' } });

            var diff1 = serialization.different(o3, o2);
            assert.deepEqual(diff1, { v: null });
        });

        QUnit.test('different 基础类型', (assert) =>
        {
            const o = { a: 1, b: true, c: 'str', d: null, e: undefined, f: NaN };
            const o1 = { a: 2, b: false, c: 'str1', d: 1, e: 1, f: 1 };

            var diff = serialization.different(o, o1);
            assert.deepEqual(diff, o);

            var diff = serialization.different(o1, o);
            assert.deepEqual(diff, o1);
        });

        QUnit.test('different 数组', (assert) =>
        {
            const arr = [1, true, 'str', null, undefined, NaN];
            const arr1 = [1, false, 'str1', 1, 1, 1];
            //
            const diff = serialization.different(arr, arr1);
            const expectDiff = [];
            arr.forEach((v, i) =>
            {
                if (arr[i] != arr1[i]) expectDiff[i] = arr[i];
            });
            assert.deepEqual(diff, expectDiff); // 此处有 expectDiff[0] 未定义
            //
            const diff1 = serialization.different(arr1, arr);
            const expectDiff1 = [];
            arr.forEach((v, i) =>
            {
                if (arr[i] != arr1[i]) expectDiff1[i] = arr1[i];
            });
            assert.deepEqual(diff1, expectDiff1);
        });

        QUnit.test('different 不同对象类型', (assert) =>
        {
            const o = { v: new feng3d.Vector2() };
            const o1 = { v: new feng3d.Vector3() };

            const serO = serialization.serialize(o);
            const serO1 = serialization.serialize(o1);

            var diff = serialization.different(o, <any>o1);
            assert.deepEqual(diff, serO);

            var diff = serialization.different(o1, <any>o);
            assert.deepEqual(diff, serO1);
        });

        QUnit.test('different 资源', (assert) =>
        {
            const o = feng3d.Material.getDefault('Default-Material'); // 默认材质资源
            const o1 = new Material();

            const diff = serialization.different(o, o1);
            assert.deepEqual(diff, { name: 'Default-Material', hideFlags: HideFlags.NotEditable });

            const o2 = { v: feng3d.Material.getDefault('Default-Material') }; // 默认材质资源
            const o3 = { v: new Material() };

            const expectDiff = serialization.serialize(o2);
            const diff1 = serialization.different(o2, o3);
            assert.deepEqual(diff1, expectDiff);
        });

        QUnit.test('different 默认处理', (assert) =>
        {
            const o = { a: 1, b: true, c: 'abc' };
            const o1 = { a: 2, b: true, c: 'abc' };

            const diff = serialization.different(o, o1);
            assert.deepEqual(diff, { a: 1 });

            const o2 = new feng3d.Vector3();
            const o3 = new feng3d.Vector3(1, 2, 3);

            const diff1 = serialization.different(o2, o3);
            assert.deepEqual(diff1, { x: 0, y: 0, z: 0 });

            //
            const diff2 = feng3d.serialization.different(new feng3d.GameObject(), new feng3d.GameObject());
            assert.deepEqual(diff2, {});
        });

        QUnit.test('serialization.setValue', (assert) =>
        {
            const curve = feng3d.serialization.setValue(new feng3d.AnimationCurve(), { keys: [{ time: 0, value: 0, inTangent: 1, outTangent: 1 }, { time: 1, value: 1, inTangent: 1, outTangent: 1 }] });

            const curve1 = new feng3d.AnimationCurve();
            feng3d.serialization.setValue(curve1, feng3d.serialization.serialize(curve));

            const str = JSON.stringify(feng3d.serialization.serialize(curve));
            const str1 = JSON.stringify(feng3d.serialization.serialize(curve1));

            assert.ok(str == str1);
        });

        QUnit.test('Float32Array, Float64Array, Int8Array, Int16Array, Int32Array, Uint8Array, Uint16Array, Uint32Array, Uint8ClampedArray', (assert) =>
        {
            [Float32Array, Float64Array, Int8Array, Int16Array, Int32Array, Uint8Array, Uint16Array, Uint32Array, Uint8ClampedArray].forEach((item) =>
            {
                const float32Array = new item([1, 2, 3, 4, 5]);
                const newFloat32Array = serialization.clone(float32Array);

                assert.deepEqual(float32Array, newFloat32Array);
            });
        });
    });
}
