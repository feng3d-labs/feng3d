import { describe, expect, it } from 'vitest';
import { logic, registerLogic } from '../src';

/**
 * logic() 对未注册 `__type__` 的处理（回归）。
 *
 * 修复前：未注册时把 `null` **永久**写入 WeakMap 缓存，
 * 事后调用 registerLogic 也不会生效——只有 import 顺序恰好正确才安全。
 * 这使「漏 import 某个模块」变成难以排查的静默失败
 *（`logic(data)` 永远返回 null，而类型上声明为非空）。
 */
describe('reactivity/logic 未注册类型', () =>
{
    it('未注册返回 null', () =>
    {
        const data = { __type__: 'NotRegisteredType' } as { __type__: 'NotRegisteredType' };

        expect(logic(data)).toBe(null);
    });

    it('未注册不污染缓存：事后 registerLogic 可生效（回归）', () =>
    {
        const data = { __type__: 'LateRegisteredType' } as { __type__: 'LateRegisteredType' };

        // 先触达（此时尚未注册）
        expect(logic(data)).toBe(null);

        // 事后注册
        class LateRegisteredLogic
        {
            #data: unknown;

            constructor(d: unknown)
            {
                this.#data = d;
            }

            get value(): string { return 'registered'; }
        }
        registerLogic('LateRegisteredType' as never, LateRegisteredLogic as never);

        // 修复前：缓存中的 null 使此处仍为 null
        const l = logic(data) as unknown as LateRegisteredLogic;
        expect(l).not.toBe(null);
        expect(l.value).toBe('registered');
    });
});
