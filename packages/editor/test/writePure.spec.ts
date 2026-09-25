import { describe, expect, it } from 'vitest';
import {
    assertFiniteNumbers, cloneValue, isFiniteF32, primitiveTypeOf, resolvePath, toColor4,
} from '../src/bridge/write/writePure';

/** 造指定层数的嵌套对象 */
function nest(depth: number): unknown
{
    let value: unknown = 1;
    for (let i = 0; i < depth; i++) value = { child: value };

    return value;
}

describe('isFiniteF32', () =>
{
    it('接受 f32 能表示的数', () =>
    {
        expect(isFiniteF32(0)).toBe(true);
        expect(isFiniteF32(-1.5)).toBe(true);
        expect(isFiniteF32(1e38)).toBe(true);
    });

    it('拒绝 NaN / Infinity 与 f32 装不下的数（JS 里却是有限数）', () =>
    {
        expect(isFiniteF32(Number.NaN)).toBe(false);
        expect(isFiniteF32(Number.POSITIVE_INFINITY)).toBe(false);
        expect(isFiniteF32(1e39)).toBe(false);
        expect(isFiniteF32(-1e39)).toBe(false);
        expect(isFiniteF32(Number.MAX_VALUE)).toBe(false);
    });
});

describe('toColor4', () =>
{
    it('补全 __type__ 与缺失分量', () =>
    {
        expect(toColor4({ r: 1, g: 0, b: 0 })).toEqual({ __type__: 'Color4', r: 1, g: 0, b: 0, a: 1 });
        expect(toColor4({})).toEqual({ __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 });
    });

    it('保留已有的 __type__ 与分量', () =>
    {
        expect(toColor4({ __type__: 'Color4', r: 0.2, g: 0.3, b: 0.4, a: 0.5 }))
            .toEqual({ __type__: 'Color4', r: 0.2, g: 0.3, b: 0.4, a: 0.5 });
    });

    it('给了非法分量就报错，不静默替换（否则调用方以为改成功了）', () =>
    {
        expect(() => toColor4({ r: 'x' }, 'background')).toThrow(/background\.r/);
        expect(() => toColor4({ r: 1e39 }, 'background')).toThrow(/f32/);
        expect(() => toColor4({ r: 0, g: Number.NaN })).toThrow(/g/);
    });

    it('非对象原样返回（由调用方的类型检查负责）', () =>
    {
        expect(toColor4(null)).toBeNull();
        expect(toColor4('red')).toBe('red');
    });

    it('不改动传入的对象', () =>
    {
        const source = { r: 1, g: 0, b: 0 };
        toColor4(source);
        expect(source).toEqual({ r: 1, g: 0, b: 0 });
    });
});

describe('assertFiniteNumbers', () =>
{
    it('放行正常值（含嵌套与数组）', () =>
    {
        expect(() => assertFiniteNumbers({ x: 1, y: -2, z: 0 }, 'position')).not.toThrow();
        expect(() => assertFiniteNumbers([1, 2, 3], 'items')).not.toThrow();
        expect(() => assertFiniteNumbers(nest(5), 'value')).not.toThrow();
    });

    it('指出非法数字所在的字段路径', () =>
    {
        expect(() => assertFiniteNumbers({ x: 1e39, y: 0 }, 'position')).toThrow(/position\.x/);
        expect(() => assertFiniteNumbers([0, Number.NaN], 'items')).toThrow(/items\[1\]/);
    });

    it('非数字的值不参与检查（类型由 prepareSet 的防呆负责）', () =>
    {
        expect(() => assertFiniteNumbers({ name: 'cube', flag: true }, 'value')).not.toThrow();
    });

    it('嵌套过深直接拒绝', () =>
    {
        expect(() => assertFiniteNumbers(nest(12), 'value')).toThrow(/嵌套过深/);
    });
});

describe('resolvePath', () =>
{
    it('解析点路径与数组下标', () =>
    {
        const root = { position: { x: 0, y: 0, z: 0 }, components: [{ material: { uniforms: {} } }] };
        expect(resolvePath(root, 'position.y')).toEqual({ holder: root.position, key: 'y' });
        expect(resolvePath(root, 'components[0].material'))
            .toEqual({ holder: root.components[0], key: 'material' });
        expect(resolvePath(root, 'components.0')).toEqual({ holder: root.components, key: 0 });
    });

    it('中间段不存在时报错并列出候选字段', () =>
    {
        expect(() => resolvePath({ position: {} }, 'postion.y')).toThrow(/找不到 postion/);
        expect(() => resolvePath({ position: {} }, 'postion.y')).toThrow(/可用字段/);
    });

    it('空路径与穿到非对象都报错', () =>
    {
        expect(() => resolvePath({}, '')).toThrow(/路径为空/);
        expect(() => resolvePath({ a: 1 }, 'a.b')).toThrow(/不是对象/);
    });
});

describe('primitiveTypeOf / cloneValue', () =>
{
    it('只认三种原始类型', () =>
    {
        expect(primitiveTypeOf(1)).toBe('number');
        expect(primitiveTypeOf('a')).toBe('string');
        expect(primitiveTypeOf(false)).toBe('boolean');
        expect(primitiveTypeOf(null)).toBeNull();
        expect(primitiveTypeOf(undefined)).toBeNull();
        expect(primitiveTypeOf({})).toBeNull();
    });

    it('深拷贝，改副本不影响原值（撤销依赖这一点）', () =>
    {
        const source = { position: { x: 1 } };
        const copy = cloneValue(source) as typeof source;
        copy.position.x = 9;
        expect(source.position.x).toBe(1);
        expect(cloneValue(3)).toBe(3);
    });
});
