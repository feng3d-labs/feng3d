import { describe, expect, it } from 'vitest';
import { logic, logicOrThrow, registerLogic } from '../src';

/**
 * logicOrThrow()：『这里必须有 logic』的显式断言（issue #92）。
 *
 * `logic()` 签名如实改成 `Logic | null` 之后，期望非空的调用方不能再用「声明非空、运行期却可能是 null」
 * 的旧姿势；`logicOrThrow()` 把这一前提写成运行期断言，并在错误里给出**能照着修**的原因。
 */
describe('reactivity/logicOrThrow', () =>
{
    it('已注册时返回与 logic() 相同的实例（共用缓存）', () =>
    {
        const data = { __type__: 'OrThrowRegistered' } as { __type__: 'OrThrowRegistered' };

        function factory(_data: unknown): { readonly ok: boolean }
        {
            return { ok: true };
        }
        registerLogic('OrThrowRegistered' as never, factory);

        expect(logicOrThrow(data)).toBe(logic(data));
        expect(logicOrThrow(data).ok).toBe(true);
    });

    it('未注册时抛错，且消息里带 __type__ 与数据的键', () =>
    {
        const data = { __type__: 'OrThrowMissing', someKey: 1 } as unknown as { __type__: 'OrThrowMissing' };

        // 断言消息能**照着修**：类型名 + 该对象的键 + 指向 registerLogic
        expect(() => logicOrThrow(data)).toThrow(/OrThrowMissing/);
        expect(() => logicOrThrow(data)).toThrow(/someKey/);
        expect(() => logicOrThrow(data)).toThrow(/registerLogic/);
    });

    it('未注册抛错后**不污染缓存**：事后 registerLogic 仍生效', () =>
    {
        const data = { __type__: 'OrThrowLate' } as { __type__: 'OrThrowLate' };

        expect(() => logicOrThrow(data)).toThrow();

        function lateFactory(_data: unknown): { readonly value: string }
        {
            return { value: 'late' };
        }
        registerLogic('OrThrowLate' as never, lateFactory);

        expect(logicOrThrow(data).value).toBe('late');
    });

    it('__type__ 缺失时也抛错（不静默返回 null）', () =>
    {
        expect(() => logicOrThrow({} as never)).toThrow(/undefined/);
    });
});