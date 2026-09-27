import { describe, expect, it, vi } from 'vitest';
import { serialization } from '../src/Serialization';

/**
 * 边界用例：循环引用 / 多次引用 / 不可序列化对象 / TypedArray / 特殊值，
 * 以及 `deleteClassKey` / `different` / `setValue` 三个旁路 API 的行为。
 *
 * 每条断言都先跑探针实测再写（探针见 PR 描述）——这类边界最容易"想当然"：
 * 例如 TypedArray **不保类型**（退化为普通对象），是当前实现的真实行为而非直觉中的还原。
 */
describe('serialization 边界用例', () =>
{
    it('循环引用：反序列化后自引用指向同一对象', () =>
    {
        const node: { name: string, self?: unknown } = { name: 'a' };

        node.self = node;

        const saved = serialization.serialize(node);

        // 引用标记：序列化数据里 self 不是无限展开的副本
        expect(Object.keys(saved)).toContain('self');
        expect(JSON.stringify(saved).length).toBeLessThan(200);

        const loaded = serialization.deserialize(saved) as typeof node;

        expect(loaded.name).toBe('a');
        expect(loaded.self).toBe(loaded);
    });

    it('同一对象被多处引用：反序列化后仍共享同一实例', () =>
    {
        const shared = { v: 1 };
        const saved = serialization.serialize({ x: shared, y: shared });
        const loaded = serialization.deserialize(saved);

        expect(loaded.x).toEqual({ v: 1 });
        expect(loaded.y).toEqual({ v: 1 });
        expect(loaded.x).toBe(loaded.y);
    });

    it('serializable === false 的对象被整体跳过', () =>
    {
        const saved = serialization.serialize({
            a: 1,
            skip: { serializable: false, x: 1 },
        });

        expect(saved).toEqual({ a: 1 });
        expect('skip' in saved).toBe(false);
    });

    it('函数字段：序列化为源码文本，反序列化后仍可调用', () =>
    {
        const saved = serialization.serialize({ fn: (x: number) => x + 1 });

        expect(saved.fn).toEqual({ __class__: 'function', data: expect.any(String) });

        const loaded = serialization.deserialize(saved);

        expect(typeof loaded.fn).toBe('function');
        expect(loaded.fn(2)).toBe(3);
    });

    it('undefined 键被保留为 undefined，NaN 保持 NaN（不经过 JSON 时才成立）', () =>
    {
        const saved = serialization.serialize({ u: undefined, nan: NaN, n: null });

        expect(Object.keys(saved)).toEqual(['u', 'nan', 'n']);
        expect('u' in saved).toBe(true);
        expect(saved.u).toBeUndefined();
        expect(Number.isNaN(saved.nan)).toBe(true);
        expect(saved.n).toBeNull();

        // 对照：过一遍 JSON 后 undefined 键会消失、NaN 会变成 null——
        // 这正是「往返等价」只对 JSON 可表达数据成立的原因
        const jsoned = JSON.parse(JSON.stringify(saved)) as Record<string, unknown>;

        expect('u' in jsoned).toBe(false);
        expect(jsoned.nan).toBeNull();
    });

    it('TypedArray 往返会退化为普通对象（当前实现的已知限制）', () =>
    {
        // 未注册类名时 classUtils 会 console.warn，这里静音并顺带断言它确实警告过
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        try
        {
            const saved = serialization.serialize({ arr: new Float32Array([1, 2, 3]) });
            const loaded = serialization.deserialize(saved) as unknown as { arr: { value: number[] } };

            // 元素值不丢
            expect(loaded.arr.value).toEqual([1, 2, 3]);

            // 但类型丢失：Float32Array 未在 classUtils 注册类名，__class__ 为 null，
            // 反序列化走「无类名普通对象」分支。若将来支持 TypedArray 往返，请更新本用例。
            expect(loaded.arr instanceof Float32Array).toBe(false);
            expect(warnSpy).toHaveBeenCalled();
        }
        finally
        {
            warnSpy.mockRestore();
        }
    });

    it('deleteClassKey 递归删除 __class__', () =>
    {
        const obj: Record<string, unknown> = { __class__: 'X', a: { __class__: 'Y', b: 1 } };

        serialization.deleteClassKey(obj as never);

        expect(obj).toEqual({ a: { b: 1 } });
    });

    it('different 只提取与模板不同的字段', () =>
    {
        const diff = serialization.different(
            { a: 1, b: 2, c: { x: 1 } },
            { a: 1, b: 9, c: { x: 1 } },
        );

        expect(diff).toEqual({ b: 2 });
    });

    it('setValue 就地写入并返回同一个对象', () =>
    {
        const target = { a: 1, o: { x: 1 } };
        const result = serialization.setValue(target, { a: 2, o: { x: 5 } });

        expect(result).toBe(target);
        expect(target).toEqual({ a: 2, o: { x: 5 } });
    });
});
