import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { startTicker, ticker } from './Ticker';

/**
 * Ticker 的启动时机（R2 零模块级副作用，issue #88）。
 *
 * 原实现在模块顶层调用 `runTickerFuncs()`：任何 `import { ticker } from '../utils/Ticker'`
 * 都会无条件启动 rAF 循环——既无法关闭（这个模块永远无法被整体消除），又在没人注册任务时空转。
 * 现在改成「第一次注册 ticker 函数时惰性启动」，并保留幂等的显式入口 `startTicker()`。
 *
 * 「顶层不许裸调用」这一半由 `scripts/check-module-side-effects.mjs` 静态守着：
 * fake timers 只能统计启用之后创建的计时器，模块加载阶段（即使真的启动了循环）看不到。
 */
describe('Ticker 惰性启动（issue #88）', () =>
{
    beforeEach(() =>
    {
        vi.useFakeTimers();
    });

    afterEach(() =>
    {
        vi.useRealTimers();
    });

    it('注册 ticker 函数才启动循环，且 startTicker 幂等', () =>
    {
        // 注册之前没有循环（本文件此时还没人注册过任务）
        expect(vi.getTimerCount()).toBe(0);

        // 注册 → 惰性启动（node 环境走 setTimeout 回退）
        ticker.on(() => 16, () => undefined);

        expect(vi.getTimerCount()).toBe(1);

        // 幂等：重复显式启动不会叠加第二条循环
        startTicker();
        startTicker();

        expect(vi.getTimerCount()).toBe(1);
    });
});
