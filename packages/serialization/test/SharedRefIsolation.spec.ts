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
/**
 * 按**身份**复用是刻意的（#315 的局限里写明）：两个内容相同但引用不同的对象不会被合并。
 * 按值合并会改变语义（值相等不代表是同一个东西），开销也不可控。这组用例守住这条边界，
 * 免得将来有人把它"优化"成按值合并。
 */
describe('按身份复用的边界（issue #311）', () =>
{
    it('内容相同但引用不同的对象不会被合并', () =>
    {
        const source = { a: { x: 1 }, b: { x: 1 } };
        const result = serialization.deserialize<{ a: unknown, b: unknown }>(source);

        expect(result.a).not.toBe(result.b);
        expect(result.a).toStrictEqual(result.b);
    });

    it('共享对象出现在两种容器里时，复用在两种容器上都成立', () =>
    {
        const shared = { x: 1 };
        const result = serialization.deserialize<{ o: unknown, list: unknown[] }>({ o: shared, list: [shared, shared] });

        expect(result.list[0]).toBe(result.list[1]);
        expect(result.o).toBe(result.list[0]);
    });
});
/**
 * 共享对象出现在**嵌套层级两侧**时，复用必须成立（跨层级复用）。
 *
 * 这组用例守护的是 #315（按源对象复用）：同一次 `deserialize` 调用里，各层 `propertyHandler`
 * 用的是同一份 `param`，所以共享在层级之间也必须成立，而不只是同一层里。
 *
 * 关于 #316（把 `param` 传进内部那 3 处直接递归）：**我没能为它写出有效用例**。
 * 把那些 `param` 去掉后，连下面这两条也照常通过（破坏实验见 issue #311），说明在当前可构造的
 * 输入下，那 3 个分支（target 为空 / 非 Object 类型 / 类名不同）不改变可观测结果——
 * 我的输入走的是普通对象 handler。所以 #316 是"冗余但自洽"的改动：它让所有递归共用一份
 * param/seen/refs，消除"入口不同、语义分叉"的隐患；但**没有测试能证明它生效**，这一点如实留在这里。
 */
describe('跨层级的复用（issue #311）', () =>
{
    it('共享对象同时出现在顶层字段与嵌套对象里', () =>
    {
        const shared = { x: 1 };
        const result = serialization.deserialize<{ a: unknown, outer: { inner: unknown } }>({
            a: shared,
            outer: { inner: shared },
        });

        expect(result.outer.inner).toBe(result.a);
    });

    it('共享对象同时出现在顶层字段与数组元素的对象里', () =>
    {
        const shared = { x: 1 };
        const result = serialization.deserialize<{ a: unknown, list: { b: unknown }[] }>({
            a: shared,
            list: [{ b: shared }, { b: shared }],
        });

        expect(result.list[0].b).toBe(result.a);
        expect(result.list[1].b).toBe(result.a);
    });
});