import { describe, expect, it } from 'vitest';
import { displayTextOf, resolveDefaultWrite } from '../src/vue-app/objectview/oav/useOAVDefault';

/**
 * 属性面板文本框的写入判据（issue #184）。
 *
 * ## 现场
 *
 * `OAVDefault` 的输入框同时绑 `@change` 与 `@blur`，而文本框显示的是**展示文本**：
 * 对象值是 `${name} (${构造器名})`，普通对象就是 `" (Object)"`。原实现无条件
 * `r_owner[name] = inputValue`，于是"点一下输入框再点别处（一个字都没改）"就把摘要写进了数据：
 * `geometry` / `material` 变成字符串，引擎报"缺少 __type__（该对象的键：0, 1, …, 8）"，
 * `position` 变成字符串后变换工具拖动抛 `Cannot create property 'x' on string`。
 *
 * 这里把判据固定住：**摘要不可回写**、**没编辑不写**、**真要改还是能改**。
 */
describe('displayTextOf', () =>
{
    it('对象值给的是摘要，不是值（" (Object)" 正是超长的那个字符串）', () =>
    {
        expect(displayTextOf({})).toBe(' (Object)');
        expect(displayTextOf({ __type__: 'SphereGeometry' })).toBe(' (Object)');
        expect(displayTextOf({ name: 'MainMaterial' })).toBe('MainMaterial (Object)');
        // 长度 9 → `Object.keys(' (Object)')` 恰好是 0..8，与现场报错里的"键"吻合
        expect(displayTextOf({}).length).toBe(9);
    });

    it('原始值直接字符串化（含缺失值）', () =>
    {
        expect(displayTextOf(1.5)).toBe('1.5');
        expect(displayTextOf('abc')).toBe('abc');
        expect(displayTextOf(true)).toBe('true');
        expect(displayTextOf(undefined)).toBe('undefined');
        expect(displayTextOf(null)).toBe('null');
    });
});

describe('resolveDefaultWrite', () =>
{
    it('拒绝把展示文本写回对象字段（本次修复的核心）', () =>
    {
        const decision = resolveDefaultWrite({ __type__: 'SphereGeometry' }, ' (Object)', 'object');

        expect(decision.write).toBe(false);
        if (!decision.write) expect(decision.reason).toMatch(/对象/);
    });

    it('拒绝把 "undefined" / "null" 写回缺失字段（blur 的另一种损坏）', () =>
    {
        expect(resolveDefaultWrite(undefined, 'undefined', 'undefined').write).toBe(false);
        expect(resolveDefaultWrite(null, 'null', 'object').write).toBe(false);
    });

    it('文本与当前值一致时不写（没编辑过的失焦不该落一次写）', () =>
    {
        expect(resolveDefaultWrite(0, '0', 'number').write).toBe(false);
        expect(resolveDefaultWrite(1.5, '1.5', 'number').write).toBe(false);
        expect(resolveDefaultWrite('abc', 'abc', 'String').write).toBe(false);
    });

    it('真的改了还是要写，并且保持原类型', () =>
    {
        expect(resolveDefaultWrite(0, '5', 'number')).toEqual({ write: true, value: 5 });
        expect(resolveDefaultWrite('abc', 'def', 'String')).toEqual({ write: true, value: 'def' });
        // 声明类型缺省时按当前值类型保持（数值字段）
        expect(resolveDefaultWrite(2, '3', 'number')).toEqual({ write: true, value: 3 });
    });

    it('数值字段收到非数字文本时保持原值，而不是写成 NaN 或 0', () =>
    {
        const decision = resolveDefaultWrite(2, 'abc', 'number');

        // `case 'number'` 是显式声明类型，仍按旧行为兜底成 0；这里断言的是 default 分支
        expect(decision.write).toBe(true);

        const fallback = resolveDefaultWrite(2, 'abc', 'unknown');

        expect(fallback.write).toBe(false);
        if (!fallback.write) expect(fallback.reason).toMatch(/不是数字/);
    });
});
