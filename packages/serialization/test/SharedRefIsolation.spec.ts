import { describe, expect, it } from 'vitest';
import { serialization } from '../src';

/**
 * issue #55：反序列化遇到"不可更改对象"时是否就地修改。
 *
 * 原文的场景是 `Texture2D.default`（该类已移除），但它描述的行为本质仍在：
 * `Serialization` 用 `serializedMap` / `autoRefID` 刻意支持共享引用——源数据里两处指向
 * 同一个对象时，反序列化会复用同一个实例。于是问题是：被复用的那个实例，是新建的，
 * 还是源数据里那个对象本身？
 *
 * 若是后者，反序列化就会就地改到外部对象（如某个模块级 default 单例）。
 * 这组用例把判据固定下来，避免以后再靠"读代码猜"。
 *
 * 实测结论（见 issue #55 的结论评论）：
 *   - 不就地修改外部对象：已满足（#55 的诉求）
 *   - 但也不保留共享引用（两处各自变成独立对象）——已另开 issue #311 跟进
 */
describe('反序列化与外部共享对象（issue #55）', () =>
{
    it('共享引用被保留：同一源对象出现两次仍是同一个实例（issue #311）', () =>
    {
        const shared = { x: 1, y: 2 };

        const result = serialization.deserialize<{ a: unknown, b: unknown }>({ a: shared, b: shared });

        // 按源对象复用后，源数据里的共享结构被保留；
        // 同时（下面那条用例）结果仍然不是外部对象本身——两者可以并存，见 issue #311。
        expect(result.a).toBe(result.b);
    });

    it('不就地修改外部对象：结果不是源数据里那个对象本身', () =>
    {
        const shared = { x: 1, y: 2 };

        const result = serialization.deserialize<{ a: { x: number, y: number } }>({ a: shared });

        // 这一条是 issue #55 的核心判据：
        //   result.a === shared  -> 反序列化复用了外部对象（问题仍在）
        //   result.a !== shared  -> 新建了对象（正确）
        expect(result.a).not.toBe(shared);
    });

    it('修改反序列化结果不会影响外部对象', () =>
    {
        const shared = { x: 1, y: 2 };

        const result = serialization.deserialize<{ a: { x: number, y: number } }>({ a: shared });

        result.a.x = 999;

        expect(shared.x).toBe(1);
    });
});

/**
 * issue #311：含环的**原始对象**（未经 serialize，没有 `__serialize__Ref__` 标记）会让
 * `deserialize` 无限递归、最终以 `RangeError: Maximum call stack size exceeded` 崩掉——
 * 那个错误不带上下文，调用方很难定位。这里守住"至少是一个具名错误 + 带路径"。
 *
 * 注意这**只是防护不是根治**：真正要解决的是"按源对象复用"（让环与共享都能正确往返），
 * 那是 #311 的主体工作。这组用例把当前的边界行为固定下来。
 */
describe('循环引用防护（issue #311）', () =>
{
    it('自引用输入抛出具名错误，而不是 RangeError 挂栈', () =>
    {
        const a: any = { x: 1 };

        a.self = a;

        expect(() => serialization.deserialize({ root: a })).toThrow(/循环引用/);
    });

    it('互相引用输入同样抛出具名错误', () =>
    {
        const a: any = { name: 'a' };
        const b: any = { name: 'b' };

        a.other = b;
        b.other = a;

        expect(() => serialization.deserialize({ root: a })).toThrow(/循环引用/);
    });

    it('共享但不构成环的输入不会被拒绝（DAG 不受影响）', () =>
    {
        const shared = { x: 1 };
        const source = { a: shared, b: shared };

        expect(() => serialization.deserialize(source)).not.toThrow();
    });

    it('深层的环也能被检出：防护自身不因深度挂栈', () =>
    {
        // 20000 层：如果 assertNoCycle 用递归实现，它会在这条输入上自己 RangeError（而不是报出循环引用）。
        // 这个函数的目的恰恰是"不要在深层输入上挂栈"，所以它必须自己也是迭代的。
        let deep: any = { v: 0 };
        const root = deep;

        for (let i = 0; i < 20000; i++)
        {
            deep.child = { v: i };
            deep = deep.child;
        }
        deep.self = root;

        expect(() => serialization.deserialize(root)).toThrow(/循环引用/);
    });
});