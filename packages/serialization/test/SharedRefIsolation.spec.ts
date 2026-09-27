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
    it('当前行为：源数据里的共享引用不会被保留（跟进 issue #311）', () =>
    {
        const shared = { x: 1, y: 2 };

        const result = serialization.deserialize<{ a: unknown, b: unknown }>({ a: shared, b: shared });

        // 这一条不是在断言"这样才对"，而是把现状固定下来（避免它悄悄变化），并指向跟进 issue：
        // 复用与"不就地改外部对象"是一对取舍，当前实现站在了安全的一侧。
        expect(result.a).not.toBe(result.b);
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