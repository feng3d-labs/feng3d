import { Serializable } from '../../src/serialization/Serializable';
import { serialization } from '../../src/serialization/Serialization';
import { SerializeProperty } from '../../src/serialization/SerializeProperty';


import { assert, describe, expect, it } from 'vitest'
const { ok, equal, deepEqual } = assert;

class ObjectBase
{
    @SerializeProperty()
    id = 1;
}

@Serializable('C')
class C extends ObjectBase
{
    // @SerializeProperty()
    // id = 2;

    @SerializeProperty()
    a = 1;

    @SerializeProperty()
    c = 1;

    @SerializeProperty()
    o = { a: 1, b: true, c: { d: 'string' } };

    change()
    {
        // eslint-disable-next-line prefer-rest-params
        console.log('change', this.a, arguments);
    }
}

@Serializable('LoopA')
class LoopA
{
    a: LoopA;
    aArr: LoopA[];

    constructor()
    {
        this.a = this;
        this.aArr = [this, this, this, this];
    }
}

describe('Serialization', () =>
{
    it('serialize&deserialize 函数', () =>
    {
        function add(a: number, b: number)
        {
            return a + b;
        }
        const result = serialization.serialize(add);
        const result1 = serialization.deserialize(result);

        const a = Math.random();
        const b = Math.random();
        ok(result1 !== add);
        ok(result1(a, b) === add(a, b));

        // 无法序列化复杂函数
        // // 序列化反序列化 serialization 工具中的函数列表
        // const r0 = serialization.serialize(serialization.serializeHandlers);
        // const serializeReplacers = serialization.deserialize(r0);
        // const r = serialization.serialize(serialization.deserializeHandlers);
        // const deserializeReplacers = serialization.deserialize(r);
        // //
        // const mySerialization = new Serialization();
        // mySerialization.serializeHandlers = serializeReplacers;
        // mySerialization.deserializeHandlers = deserializeReplacers;

        // // 使用序列化反序列化后的 serialization 工具进行序列化函数测试
        // {
        //     const result = mySerialization.serialize(add);
        //     const result1 = mySerialization.deserialize(result);
        //     const a = Math.random();
        //     const b = Math.random();
        //     ok(result1 !== add);
        //     ok(result1(a, b) === add(a, b));
        // }
    });

    it('serialize&deserialize 基础类型', () =>
    {
        const arr = [1, 'abc', true, null, undefined];

        const r = arr.map((v) => serialization.serialize(v));
        deepEqual(arr, r);

        const r1 = r.map((v) => serialization.deserialize(v));
        deepEqual(arr, r1);
    });

    it('serialize&deserialize 循环引用以及多次引用', () =>
    {
        const a: { a: any, a1: any, a2: any } = { a: null, a1: null, a2: null };
        a.a = a;
        a.a1 = a;
        a.a2 = a;

        const r = serialization.serialize(a);
        console.log(r);
        const r1 = serialization.deserialize(r);
        deepEqual(a, r1);

        ok(r1.a === r1);
        ok(r1.a1 === r1);
        ok(r1.a2 === r1);

        const aa = new LoopA();

        const rr = serialization.serialize(aa);

        const rr1 = serialization.deserialize(rr);
        deepEqual(aa, rr1);
    });

    it('serialize&deserialize 带serializable属性对象', () =>
    {
        const obj = { Serializable: false, a: 1 };
        const r = serialization.serialize(obj);
        ok(r === undefined);

        {
            obj.Serializable = true;
            const r = serialization.serialize(obj);
            ok(r.a === obj.a);
        }

        {
            delete obj.Serializable;
            const r = serialization.serialize(obj);
            ok(r.a === obj.a);
        }
    });

    // it('serialize&deserialize Feng3dObject对象', () =>
    // {
    //     const obj = new Feng3dObject();
    //     obj.hideFlags = HideFlags.DontSave;
    //     const r = serialization.serialize(obj);
    //     ok(r === undefined);

    //     {
    //         obj.hideFlags = HideFlags.None;
    //         const r = serialization.serialize(obj);
    //         deepEqual(r, <any>{ __class__: 'Feng3dObject' }); // 忽略默认值 hideFlags: HideFlags.None
    //     }

    //     const obj1 = serialization.deserialize(r);
    //     deepEqual(obj, obj1);
    // });

    it('serialize&deserialize 拥有自定义serialize函数的对象', () =>
    {
        const obj = {
            a: 1,
            serialize(obj)
            {
                obj.a = this.a * 2;
            },
        };
        const r = serialization.serialize(obj);
        ok(r.a === obj.a * 2);

        delete obj.serialize;
        const r1 = serialization.serialize(obj);
        ok(r1.a === 1);

        const r0 = serialization.deserialize(r1);
        ok(r0.a === 1);
    });

    it('serialize&deserialize Array', () =>
    {
        const arr = [1, 2, 3, 'a', 'b'];

        const result = serialization.serialize(arr);
        const result1 = serialization.deserialize(result);

        deepEqual(arr, result1);
    });

    it('serialize&deserialize Object', () =>
    {
        const obj = { a: 1, b: 2, c: { f: 3, d: 'a', e: 'b' } };

        const result = serialization.serialize(obj);
        const result1 = serialization.deserialize(result);

        deepEqual(obj, result1);
    });

    it('serialize&deserialize 自定义对象', () =>
    {
        const base = new ObjectBase();
        base.id = Math.random();
        const resultb = serialization.serialize(base);
        const base1: ObjectBase = serialization.deserialize(resultb);
        ok(base.id === base1.id);

        const c = new C();
        c.id = Math.random();
        c.a = Math.random();
        c.c = Math.random();
        const result = serialization.serialize(c);
        const c1: C = serialization.deserialize(result);
        deepEqual(c, c1);

        // // 检查 serialize 过程中使用 different 减少数据量
        // const o2 = new Vector2();
        // const r2 = serialization.serialize(o2);
        // deepEqual(r2, { __class__: 'Vector2' });

        // {
        //     o2.x = 1;
        //     const r2 = serialization.serialize(o2);
        //     deepEqual(r2, { __class__: 'Vector2', x: 1 });
        // }

        // //
        // const obj = new Entity().addComponent(Node3D);
        // const diff2 = serialization.serialize(obj);
        // deepEqual(diff2, { __class__: 'Node3D' });

        // //
        // const obj2 = serialization.deserialize(diff2);
        // const diff = serialization.different(obj, obj2);
        // deepEqual(diff, {});

        // obj.x = 1;
        // const r3 = serialization.serialize(obj);
        // deepEqual(r3, { __class__: 'Node3D' });

        // //
        // const obj3 = serialization.deserialize(r3);
        // const diff1 = serialization.different(obj, obj3);
        // deepEqual(diff1, {});

        // const entity = serialization.setValue(new Entity(), {
        //     name: 'entity',
        //     components: [{ __class__: 'MeshRenderer', geometry: Geometry.getDefault('Plane') }]
        // });

        // equal(entity.numComponents, 2);
        // const model = entity.getComponent(MeshRenderer);
        // assert.notEqual(model, null);
    });

    // it('different 相等对象', () =>
    // {
    //     const o = { a: 1, b: { c: true, d: { e: 'str' } } };
    //     const o1 = { a: 1, b: { c: true, d: { e: 'str' } } };

    //     const diff = serialization.different(o, o1);
    //     deepEqual(diff, {});

    //     const v = new Vector2();
    //     const v1 = new Vector2();
    //     const diff1 = serialization.different(v, v1);
    //     deepEqual(diff1, {});

    //     const c = new C();
    //     const nc = new C();
    //     const diff2 = serialization.different(c, nc);
    //     deepEqual(diff2, {});
    // });

    // it('different 目标数据为null时', () =>
    // {
    //     const o = { a: 1, b: null };
    //     const o1 = { a: 1, b: { c: true, d: { e: 'str' } } };

    //     const diff: gPartial<{
    //         a: number;
    //         b: { c: boolean, d: { e: string } };
    //     }> = serialization.different(o, o1);
    //     deepEqual(diff, { b: null });

    //     {
    //         const diff: gPartial<{
    //             a: number;
    //             b: { c: boolean, d: { e: string } };
    //         }> = serialization.different(o1, o);
    //         deepEqual(diff, { b: { c: true, d: { e: 'str' } } });
    //     }

    //     const o2 = { v: new Vector2() };
    //     const o3: { v: Vector2 } = { v: null };

    //     const diff1 = serialization.different(o2, o3);
    //     deepEqual(diff1, { v: { __class__: 'Vector2' } });

    //     {
    //         const diff1 = serialization.different(o3, o2);
    //         deepEqual(diff1, { v: null });
    //     }
    // });

    it('different 基础类型', () =>
    {
        const o = { a: 1, b: true, c: 'str', d: null, e: undefined, f: NaN };
        const o1 = { a: 2, b: false, c: 'str1', d: 1, e: 1, f: 1 };

        const diff = serialization.different(o, o1);
        deepEqual(diff, o);

        {
            const diff = serialization.different(o1, o);
            deepEqual(diff, <any>o1);
        }
    });

    it('different 数组', () =>
    {
        const arr = [1, true, 'str', null, undefined, NaN];
        const arr1 = [1, false, 'str1', 1, 1, 1];
        //
        const diff = serialization.different(arr, arr1);
        const expectDiff = [];
        arr.forEach((v, i) =>
        {
            if (arr[i] !== arr1[i]) expectDiff[i] = arr[i];
        });
        deepEqual(diff, expectDiff); // 此处有 expectDiff[0] 未定义
        //
        const diff1 = serialization.different(arr1, arr);
        const expectDiff1 = [];
        arr.forEach((v, i) =>
        {
            if (arr[i] !== arr1[i]) expectDiff1[i] = arr1[i];
        });
        deepEqual(diff1, expectDiff1);
    });

    // it('different 不同对象类型', () =>
    // {
    //     const o = { v: new Vector2() };
    //     const o1 = { v: new Vector3() };

    //     const serO = serialization.serialize(o);
    //     const serO1 = serialization.serialize(o1);

    //     const diff = serialization.different(o, <any>o1);
    //     deepEqual(diff, serO);

    //     {
    //         const diff = serialization.different(o1, <any>o);
    //         deepEqual(diff, serO1);
    //     }
    // });

    // it('different 资源', () =>
    // {
    //     const o = Material.getDefault('Default-Material'); // 默认材质资源
    //     const o1 = new Material();

    //     const diff = serialization.different(o, o1);
    //     deepEqual(diff, { name: 'Default-Material', hideFlags: HideFlags.NotEditable });

    //     const o2 = { v: Material.getDefault('Default-Material') }; // 默认材质资源
    //     const o3 = { v: new Material() };

    //     const expectDiff = serialization.serialize(o2);
    //     const diff1 = serialization.different(o2, o3);
    //     deepEqual(diff1, expectDiff);
    // });

    // it('different 默认处理', () =>
    // {
    //     const o = { a: 1, b: true, c: 'abc' };
    //     const o1 = { a: 2, b: true, c: 'abc' };

    //     const diff = serialization.different(o, o1);
    //     deepEqual(diff, { a: 1 });

    //     const o2 = new Vector3();
    //     const o3 = new Vector3(1, 2, 3);

    //     const diff1 = serialization.different(o2, o3);
    //     deepEqual(diff1, { x: 0, y: 0, z: 0 });

    //     //
    //     const diff2 = serialization.different(new Entity(), new Entity());
    //     deepEqual(diff2, {});
    // });

    // it('serialization.setValue', () =>
    // {
    //     const curve = serialization.setValue(new AnimationCurve(), { keys: [{ time: 0, value: 0, inTangent: 1, outTangent: 1 }, { time: 1, value: 1, inTangent: 1, outTangent: 1 }] });

    //     const curve1 = new AnimationCurve();
    //     serialization.setValue(curve1, serialization.serialize(curve));

    //     const str = JSON.stringify(serialization.serialize(curve));
    //     const str1 = JSON.stringify(serialization.serialize(curve1));

    //     ok(str === str1);
    // });
});
