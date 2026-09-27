import { describe, expect, it } from 'vitest';
import { assertWhereConditionValue, compareField, WHERE_OPS } from '../src/bridge/read/whereCondition';

/**
 * `scene.find` 的 `where` 条件（issue #197，从 #139 拆出）。
 *
 * 这里最容易被静默吞掉：`{ op: "lt", value: "0" }`（value 写成字符串）原先走"类型不符 → 不匹配"，
 * 返回 0 命中且毫无提示，看起来像"场景里没有对象满足条件"。
 */
describe('assertWhereConditionValue', () =>
{
    it('数值比较要求 value 是有限数字（字符串一律拒绝并说明原因）', () =>
    {
        for (const op of ['lt', 'lte', 'gt', 'gte'])
        {
            expect(() => assertWhereConditionValue(op, '0')).toThrow(/需要有限数字/);
            expect(() => assertWhereConditionValue(op, Number.NaN)).toThrow(/需要有限数字/);
            expect(() => assertWhereConditionValue(op, Number.POSITIVE_INFINITY)).toThrow(/需要有限数字/);
            expect(() => assertWhereConditionValue(op, 0)).not.toThrow();
            expect(() => assertWhereConditionValue(op, -1.5)).not.toThrow();
        }
    });

    it('eq / ne 拒绝对象与数组（=== 引用比较永远"不等"）', () =>
    {
        expect(() => assertWhereConditionValue('eq', { x: 1 })).toThrow(/引用比较/);
        expect(() => assertWhereConditionValue('ne', [1, 2])).toThrow(/引用比较/);
        expect(() => assertWhereConditionValue('eq', 'Plane')).not.toThrow();
        expect(() => assertWhereConditionValue('eq', 3)).not.toThrow();
        expect(() => assertWhereConditionValue('eq', false)).not.toThrow();
    });

    it('eq / ne 拒绝 null（与"字段不存在"分不开，该用 exists）', () =>
    {
        expect(() => assertWhereConditionValue('eq', null)).toThrow(/exists/);
    });

    it('in 要求数组，exists 不看 value', () =>
    {
        expect(() => assertWhereConditionValue('in', 'A')).toThrow(/需要是数组/);
        expect(() => assertWhereConditionValue('in', ['A'])).not.toThrow();
        expect(() => assertWhereConditionValue('exists', undefined)).not.toThrow();
    });

    it('WHERE_OPS 覆盖所有支持的运算符', () =>
    {
        expect([...WHERE_OPS].sort()).toEqual(['eq', 'exists', 'gt', 'gte', 'in', 'lt', 'lte', 'ne']);
    });
});

describe('compareField', () =>
{
    it('exists 只看有没有值', () =>
    {
        expect(compareField(0, 'exists', undefined)).toBe(true);
        expect(compareField('', 'exists', undefined)).toBe(true);
        expect(compareField(undefined, 'exists', undefined)).toBe(false);
        expect(compareField(null, 'exists', undefined)).toBe(false);
    });

    it('数值比较在字段不是数字时返回 false（同一条件要跑过场景里每个对象）', () =>
    {
        expect(compareField(1, 'lt', 2)).toBe(true);
        expect(compareField(undefined, 'lt', 2)).toBe(false);
        expect(compareField('1', 'lt', 2)).toBe(false);
    });

    it('in 只对数组 value 生效', () =>
    {
        expect(compareField('A', 'in', ['A', 'B'])).toBe(true);
        expect(compareField('C', 'in', ['A', 'B'])).toBe(false);
        // value 不是数组时（调用方会拦）这里返回 false 而不是抛错
        expect(compareField('A', 'in', 'A')).toBe(false);
    });

    it('未知 op 抛错而不是静默 false', () =>
    {
        expect(() => compareField(1, 'like', 2)).toThrow(/未知的比较符/);
    });
});
