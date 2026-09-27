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
