import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * issue #56：初始化 feng3d 时控制台出现音效警告。
 *
 * 根因：`packages/feng3d/src/audio/AudioListener.ts` 在**模块顶层**用 IIFE 执行了
 * `new AudioContext()` + 建 GainNode + 设置 listener 朝向。浏览器要求 AudioContext 在
 * **用户交互之后**才能启动，模块加载即创建会报 "The AudioContext was not allowed to start"。
 *
 * 这同时是 R2（零模块级副作用）禁止的形态：`scripts/check-module-side-effects.mjs` 只把
 * 「顶层定时器/rAF/ticker 启动」与「顶层 `Map`/`WeakMap`/`Set`/`ChainMap` 缓存」列为错误，"其它顶层调用"
 * 仅作统计——所以这类 `new` 逃过了门禁。这里补一条针对音频模块的静态守卫。
 *
 * 为什么用**静态**断言而不是运行期断言：在 Node 测试环境里 `typeof window === 'undefined'`，
 * 旧代码会提前 return，根本创建不出 AudioContext——也就是说**运行期测不出这个 bug**，
 * 只有看源码结构才能守住。
 */
const listenerSource = readFileSync(
    fileURLToPath(new URL('../packages/feng3d/src/audio/AudioListener.ts', import.meta.url)),
    'utf8',
);

describe('音频模块没有模块级副作用（issue #56）', () =>
{
    it('AudioListener.ts 顶层没有 new 调用', () =>
    {
        // "顶层"= 顶格的行（函数体/类体里的语句都有缩进）且不是注释
        const offenders = listenerSource
            .split(/\r?\n/)
            .map((line, index) => ({ line, no: index + 1 }))
            .filter(({ line }) => /^\S/.test(line))
            .filter(({ line }) => !/^\s*(\/\/|\/\*|\*)/.test(line))
            .filter(({ line }) => /\bnew\s+[A-Za-z_$]/.test(line))
            .map(({ line, no }) => `${no}: ${line.trim()}`);

        expect(offenders).toEqual([]);
    });

    it('AudioContext 只能通过惰性函数创建', () =>
    {
        // 正向：惰性入口存在
        expect(listenerSource).toContain('export function getAudioCtx()');
        expect(listenerSource).toContain('export function getGlobalGain()');

        // 反向：不再有"模块级可写的 audioCtx/globalGain 变量"这种必须靠顶层初始化才能用的形态
        expect(listenerSource).not.toMatch(/^export let audioCtx\b/m);
        expect(listenerSource).not.toMatch(/^export let globalGain\b/m);
    });

    it('AudioContext 的创建点在 getAudioCtx 函数体内（首次调用才创建）', () =>
    {
        const callIndex = listenerSource.indexOf('const ctx = new AudioContext();');
        const funcIndex = listenerSource.indexOf('export function getAudioCtx()');

        expect(funcIndex).toBeGreaterThanOrEqual(0);
        expect(callIndex).toBeGreaterThan(funcIndex);

        // 并且被缓存守卫包住：第二次调用直接返回缓存
        expect(listenerSource).toContain('if (audioCtxCache !== null) return audioCtxCache;');
    });
});
