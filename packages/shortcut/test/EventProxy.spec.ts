import { EventProxy } from '../src/EventProxy';

import { assert, describe, it } from 'vitest';

/**
 * issue #624 / #620 回归：`EventProxy` 的宿主目标必须**惰性取得**。
 *
 * 改造前 `packages/shortcut/src/WindowEventProxy.ts` 在**模块顶层**写
 * `new EventProxy<WindowEventMap>(self)`，Node / SSR 下 `import` 即 `ReferenceError: self is not defined`。
 * 现在目标由「解析函数」提供，模块 import 期不读宿主全局，首次 `on()` 时才解析。
 */
describe('EventProxy 惰性目标（issue #624）', () =>
{
    it('构造时不解析目标，首次使用时才解析且只解析一次', () =>
    {
        let providerCalls = 0;
        const added: string[] = [];
        // 用最小的事件目标替身，避免依赖宿主 DOM 事件类
        const target = {
            addEventListener: (type: string) => { added.push(type); },
            removeEventListener: () => { /* 本用例不校验解绑 */ },
        } as unknown as EventTarget;
        const proxy = new EventProxy<WindowEventMap>(() =>
        {
            providerCalls++;

            return target;
        });

        // 构造之后：解析函数一次都没被调用（宿主全局的读取被推迟到首次使用）。
        // 注意不能在这里读 `proxy.target`——读它会触发解析（这是有意保留的语义：
        // 构造后读 target 与改动前一样能拿到宿主目标）。
        assert.strictEqual(providerCalls, 0);

        // 首次 on()：解析目标，并把该事件类型绑到目标上
        proxy.on('click', () => { /* 仅注册 */ });
        assert.strictEqual(providerCalls, 1);
        assert.strictEqual(proxy.target, target);
        assert.deepStrictEqual(added, ['click']);

        // 再注册其它类型：沿用已解析的目标，不重复解析
        proxy.on('keydown', () => { /* 仅注册 */ });
        assert.strictEqual(providerCalls, 1);
        assert.deepStrictEqual(added, ['click', 'keydown']);
    });

    it('解析不到目标（非浏览器宿主）时退化为纯 EventEmitter，不抛错', () =>
    {
        const proxy = new EventProxy<WindowEventMap>(() => undefined);

        proxy.on('click', () => { /* 仅注册 */ });
        assert.strictEqual(proxy.target, undefined);

        // off 同样不因目标缺省而抛（改造前这里是 `this._target!.removeEventListener`）
        proxy.off('click');
    });

    it('显式传入目标对象时行为不变（向后兼容）', () =>
    {
        const target = new EventTarget();
        const proxy = new EventProxy<WindowEventMap>(target);

        assert.strictEqual(proxy.target, target);
    });
});
