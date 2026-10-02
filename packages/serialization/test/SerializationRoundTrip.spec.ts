import { registerClass } from '@feng3d/polyfill';
import { describe, expect, it } from 'vitest';
import { serialize, serialization } from '../src/Serialization';

/**
 * 往返测试：锁定 serialization 包「保存 → 加载 → 等价」这条核心承诺。
 *
 * 这里的「保存」链路按真实用法取两级：
 * 1. `serialize()` 得到可 `JSON.stringify` 的简单数据；
 * 2. 真正落盘/传输时还要过一次 `JSON.stringify` → `JSON.parse`（这一步会把
 *    `undefined` / `NaN` / 函数 / 引用标记之外的运行时值变形成 JSON 能表达的样子，
 *    所以只对 JSON 可表达的数据断言等价）。
 *
 * 所有断言都是先实测行为再写下的（探针见 PR 描述），不是照实现转述。
 */
describe('serialization 往返（保存 → 加载 → 等价）', () =>
{
    it('纯数据对象 serialize → deserialize 后与原对象等价', () =>
    {
        const json = {
            __type__: 'Object3D',
            name: 'root',
            position: { x: 1, y: 2, z: 3 },
            children: [{
                __type__: 'Object3D',
                name: 'Cube',
                components: [{ __type__: 'MeshRenderer' }],
            }],
        };

        const loaded = serialization.deserialize(serialization.serialize(json));

        expect(loaded).toEqual(json);
    });

    it('serialize 保留 __type__ 与嵌套结构（纯数据不做默认值裁剪）', () =>
    {
        const json = { __type__: 'CubeGeometry', width: 1 };

        // omitDefault 默认为 true，但它只作用于 class 实例（与默认实例比较），
        // 纯数据对象走「普通 Object」分支，字段原样保留。
        expect(serialization.omitDefault).toBe(true);
        expect(serialization.serialize(json)).toEqual({ __type__: 'CubeGeometry', width: 1 });
    });

    it('★ 纯数据 math 字段不走 `obj.constructor` 分支（issue #134 阶段 C-a 专项验证）', () =>
    {
        // 为什么专项验证这一条：`docs/MATH_PURE_FUNCTIONS_MIGRATION.md` §11.7.7 的 P3 / §11.7.8 的 N4
        // 登记了「`Serialization.ts:720/919/949/1058` 用 `obj.constructor` 与默认实例比对——
        // class 变字面量后 `constructor` 从 `Vector3` 变成 `Object`，`new ctor()` 从 `(0,0,0)` 变成 `{}`」，
        // 并注明「§5.6 只验证了反序列化侧，**序列化侧没测过**」。本用例补上序列化侧的实测。
        //
        // 实测结论（断言逐条对应）：纯数据对象（无论带不带 `__type__`）的 `constructor.name` 是 `'Object'`，
        // `ObjectUtils.isObject` 因此为真，于是被「处理普通Object」处理器（priority 0，排在 `constructor`
        // 处理器之前）接住、逐字段递归复制——**根本走不到** `obj.constructor` 那条路。
        // 判别依据②就是「`Object` 构造函数上没有被挂上默认实例」。这也解释了为什么阶段 C 把 class
        // 换成「带 `__type__` 的纯数据接口」不会改变序列化行为：走的是另一条分支。
        const data = {
            __type__: 'Object3D',
            position: { __type__: 'Vector3', x: 1, y: 2, z: 3 },
            rotation: { x: 0, y: 0, z: 0 },
            rect: { __type__: 'Rectangle', x: 1, y: 2, width: 3, height: 4 },
            euler: { __type__: 'Euler', x: 0, y: 0.5, z: 0, order: 0 },
        };
        const ObjectCtor = Object as unknown as { inst?: unknown };

        // 前置：`Object` 构造函数上本来没有默认实例缓存
        expect(ObjectCtor.inst).toBeUndefined();

        const saved = serialization.serialize(data);

        // ① 字段原样保留：不裁剪默认值、不加 `__class__`，也没有 `__class__: undefined` 这类隐藏键
        expect(saved).toStrictEqual(data);
        // ② 没走到 `obj.constructor` 那条路（走到了就会执行 `ctor.inst = new ctor()`，把 `{}` 挂到 `Object` 上）
        expect(ObjectCtor.inst).toBeUndefined();

        // ③ 过一遍 JSON（真实落盘 / 传输路径）再反序列化，往返等价
        const loaded = serialization.deserialize(JSON.parse(JSON.stringify(saved)));

        expect(loaded).toStrictEqual(data);
    });

    it('经 JSON.stringify/parse 之后反序列化仍与原对象等价', () =>
    {
        const json = {
            __type__: 'Scene',
            background: { __type__: 'Color4', r: 0.4, g: 0.38, b: 0.36, a: 1 },
            counts: [1, 2, 3],
            nested: { deep: { value: 'x' } },
        };

        const saved = JSON.parse(JSON.stringify(serialization.serialize(json)));
        const loaded = serialization.deserialize(saved);

        expect(loaded).toEqual(json);
    });

    it('clone 结果与原对象等价且不共享引用', () =>
    {
        const source = { a: { b: 1 }, arr: [1, 2, 3] };
        const copy = serialization.clone(source);

        expect(copy).toEqual(source);
        expect(copy).not.toBe(source);
        expect(copy.a).not.toBe(source.a);
        expect(copy.arr).not.toBe(source.arr);

        // 改克隆体不能影响原对象
        copy.a.b = 2;
        copy.arr.push(4);

        expect(source.a.b).toBe(1);
        expect(source.arr).toEqual([1, 2, 3]);
    });

    it('serialize 不修改源对象', () =>
    {
        const source = { a: 1, o: { b: 2 }, arr: [1, 2] };
        const snapshot = JSON.parse(JSON.stringify(source));

        serialization.serialize(source);

        expect(source).toEqual(snapshot);
    });

    it('class 实例：@serialize 标记的字段按与默认实例的差异保存', () =>
    {
        class Point
        {
            @serialize x = 1;

            @serialize y = 2;
        }

        registerClass(Point, 'Point');

        const point = new Point();

        point.y = 5;

        const saved = serialization.serialize({ point });

        // 只保存与默认实例不同的字段（x 保持默认 1 → 不出现）
        expect(saved).toEqual({ point: { y: 5, __class__: 'Point' } });

        const loaded = serialization.deserialize(saved);

        expect(loaded.point).toBeInstanceOf(Point);
        expect(loaded.point.y).toBe(5);
        expect(loaded.point.x).toBe(1);
    });

    it('class 实例：未标记 @serialize 的字段不参与序列化（设计如此）', () =>
    {
        class Widget
        {
            @serialize id = 'default';

            untracked = 'init';
        }

        registerClass(Widget, 'Widget');

        const widget = new Widget();

        widget.id = 'changed';
        widget.untracked = 'changed';

        const saved = serialization.serialize({ widget });

        expect(saved).toEqual({ widget: { id: 'changed', __class__: 'Widget' } });

        const loaded = serialization.deserialize(saved);

        // 未标记字段不落盘，加载后是构造时的初始值
        expect(loaded.widget.id).toBe('changed');
        expect(loaded.widget.untracked).toBe('init');
    });
});
