import { describe, expect, it } from 'vitest';
import { ObjectView } from '../src/ObjectView';
import type { DataTypeSchema } from '../src/ObjectView';

/**
 * 字段发现的两级来源（issue #147）。
 *
 * 这里用**注入的合成描述表**而不是真的 feng3d 类型：被测的是 objectview 的发现逻辑
 * （怎么用描述表、怎么兜底、editable 怎么定），描述表从哪来与本包无关——
 * 真表的正确性由 `scripts/gen-objectview-schema.mjs --check` 与编辑器侧的
 * 描述表测试看护。
 */
const SCHEMA: DataTypeSchema = {
    Demo: [
        { name: 'count', control: 'number', type: 'number' },
        { name: 'flag', control: 'Boolean', optional: true, type: 'boolean' },
        { name: 'mode', control: 'Enum', values: ['a', 'b'], type: '"a" | "b"' },
        { name: 'bits', control: 'Enum', values: ['x', 'y'], numeric: true, type: 'Bits' },
        { name: 'nested', control: 'Object', typeNames: ['Other'], type: 'Others' },
    ],
    Other: [{ name: 'size', control: 'number' }],
};

/** 取「字段名 → 类型」的简表，断言更易读 */
function typeMap(info: { objectAttributeInfos: { name: string, type: string }[] })
{
    return Object.fromEntries(info.objectAttributeInfos.map((a) => [a.name, a.type]));
}

/** 取「字段名 → 是否可编辑」的简表 */
function editMap(info: { objectAttributeInfos: { name: string, editable: boolean }[] })
{
    return Object.fromEntries(info.objectAttributeInfos.map((a) => [a.name, a.editable]));
}

/** 建一个注册了合成描述表的 objectview（每个用例用独立实例，避免互相污染） */
function makeView(): ObjectView
{
    const view = new ObjectView();
    view.setDataTypeSchema(SCHEMA);

    return view;
}

describe('字段发现：描述表（方案 B）', () =>
{
    it('裸字面量也能列出全部字段，且类型来自描述表而不是运行时值', () =>
    {
        // 这是方案 B 存在的理由：`{ __type__: 'Demo' }` 上除了 __type__ 什么都没有，
        // 「遍历对象已有的字段」只会得到空面板
        const info = makeView().getObjectInfo({ __type__: 'Demo' }, true);

        expect(info.objectAttributeInfos.map((a) => a.name)).toEqual(['count', 'flag', 'mode', 'bits', 'nested']);
        // 类型取自描述表：运行时没有值，靠推断只能得到 null
        expect(typeMap(info)).toEqual({
            count: 'number',
            flag: 'Boolean',
            mode: 'Enum',
            bits: 'Enum',
            nested: 'Object',
        });
    });

    it('类型上声明但对象上没赋值的字段仍然可编辑', () =>
    {
        // 纯数据范式里可选字段常常根本没写（缺失时由 Logic 兜底）。
        // 早先的判据是「属性可写」（不存在也算不可写），会把这类字段全判成只读 → 面板点不动
        const info = makeView().getObjectInfo({ __type__: 'Demo' }, true);

        expect(editMap(info)).toEqual({
            count: true,
            flag: true,
            mode: true,
            bits: false, // 数字枚举是位标志，按只读展示
            nested: true,
        });
    });

    it('数字枚举只读，字符串枚举给出候选值', () =>
    {
        const info = makeView().getObjectInfo({ __type__: 'Demo' }, true);
        const mode = info.objectAttributeInfos.find((a) => a.name === 'mode');
        const bits = info.objectAttributeInfos.find((a) => a.name === 'bits');

        // OAVEnum 的控件参数：`for (const key in enumClass)` 展开成候选项
        expect(mode?.componentParam).toEqual({ enumClass: { a: 'a', b: 'b' } });
        expect(mode?.editable).toBe(true);
        // 位标志用下拉单选表达是错的 → 不给候选值、且不可编辑
        expect(bits?.editable).toBe(false);
        expect(bits?.componentParam).toBeUndefined();
    });

    it('__type__ 联合的候选类型名透传给控件', () =>
    {
        const info = makeView().getObjectInfo({ __type__: 'Demo' }, true);
        const nested = info.objectAttributeInfos.find((a) => a.name === 'nested');

        expect(nested?.componentParam).toEqual({ typeNames: ['Other'] });
    });

    it('已存在的只读访问器（getter 无 setter）仍然不可编辑', () =>
    {
        const object: Record<string, unknown> = { __type__: 'Demo' };
        Object.defineProperty(object, 'count', { get: () => 1, enumerable: true });

        const info = makeView().getObjectInfo(object, true);

        expect(editMap(info).count).toBe(false);
    });

    it('excludeAttrs 能排除字段（面板据此挡掉 __type__ / children / components）', () =>
    {
        const info = makeView().getObjectInfo({ __type__: 'Demo' }, true, ['nested', 'bits']);

        expect(info.objectAttributeInfos.map((a) => a.name)).toEqual(['count', 'flag', 'mode']);
    });

    it('嵌套对象自己也能按描述表展开（面板递归时的行为）', () =>
    {
        const info = makeView().getObjectInfo({ __type__: 'Other' }, true);

        expect(typeMap(info)).toEqual({ size: 'number' });
    });
});

describe('字段发现：兜底（方案 C）', () =>
{
    it('描述表没命中时退回「对象上实际存在的字段」', () =>
    {
        const info = makeView().getObjectInfo({ __type__: 'Unknown', alpha: 1, beta: 'x' }, true);

        expect(info.objectAttributeInfos.map((a) => a.name)).toEqual(['alpha', 'beta']);
    });

    it('兜底的类型只能由运行时值推断（这是它的固有天花板）', () =>
    {
        // `{x,y,z}` 会被认成普通 Object 而不是 Vector3，控件因此退化成默认视图——
        // 方案 B 补的正是这一点
        const info = makeView().getObjectInfo({ __type__: 'Unknown', position: { x: 0, y: 0, z: 0 } }, true);

        expect(typeMap(info).position).toBe('Object');
    });

    it('autocreate=false 且描述表未命中时不给任何字段', () =>
    {
        const info = makeView().getObjectInfo({ __type__: 'Unknown', alpha: 1 }, false);

        expect(info.objectAttributeInfos).toEqual([]);
    });

    it('描述表命中时不受 autocreate 影响（类型就是字段清单）', () =>
    {
        const info = makeView().getObjectInfo({ __type__: 'Demo' }, false);

        expect(info.objectAttributeInfos.length).toBe(5);
    });

    it('没有 __type__ 的普通对象仍走兜底', () =>
    {
        const info = makeView().getObjectInfo({ alpha: 1 }, true);

        expect(info.objectAttributeInfos.map((a) => a.name)).toEqual(['alpha']);
    });
});
