import { beforeEach, describe, expect, it, vi } from 'vitest';

// `ElMessage` 会碰 DOM 并弹 UI，测试里换成 spy，好检查"到底弹的是成功还是失败"
vi.mock('element-plus', () => ({ ElMessage: vi.fn() }));

import { ElMessage } from 'element-plus';
import { ScriptCompiler } from '../src/ScriptCompiler';

/**
 * issue #342：脚本编译失败时**仍弹「编译完成！」**。
 *
 * `ScriptCompiler.compile()` 原实现的三处问题叠在一起：
 *   1. `catch` 只 `console.log`，不重抛也不上报；
 *   2. `ElMessage({ message: '编译完成！' })` 写在 try/catch **之外**——失败时照样弹；
 *   3. 失败时 `output` 仍是 `null!`，被原样交给 `onComplete`。
 *
 * 于是"抛 ReferenceError 被吞掉"（这正是当前的真实情况：全局 `ts` 没有被加载）
 * 与"真的编译成功"在界面上无法区分。本 issue 只修"失败如实报错"。
 */
type MessageOptions = { message: string, type?: string };

function messagesOf(): MessageOptions[]
{
    return (ElMessage as unknown as { mock: { calls: [MessageOptions][] } }).mock.calls.map(([options]) => options);
}

function hasErrorContaining(text: string): boolean
{
    return messagesOf().some((m) => m.type === 'error' && m.message.includes(text));
}

function hasSuccess(): boolean
{
    return messagesOf().some((m) => m.message === '编译完成！');
}

/** 造一个绕过构造的实例（构造会往 globalEmitter 上挂监听）；只覆写被测方法用到的成员 */
function makeCompiler(transpileModule: () => { name: string, text: string }[]): ScriptCompiler
{
    const compiler = Object.create(ScriptCompiler.prototype) as ScriptCompiler;

    (compiler as unknown as { transpileModule: unknown }).transpileModule = transpileModule;

    return compiler;
}

describe('ScriptCompiler 的失败必须如实报错（issue #342）', () =>
{
    beforeEach(() =>
    {
        (ElMessage as unknown as { mockClear: () => void }).mockClear();
    });

    it('编译抛错时弹的是错误提示，而不是「编译完成！」', async () =>
    {
        // 模拟当前真实情况：全局 `ts` 不存在，`transpileModule` 一进去就抛
        const compiler = makeCompiler(() =>
        {
            throw new ReferenceError('ts is not defined');
        });

        const output = await (compiler as unknown as { compile: (l: unknown[]) => Promise<unknown> }).compile([]);

        // 失败结果必须可判别
        expect(output).toBeNull();
        // 弹的是 error，且带上原始错误信息
        expect(hasErrorContaining('ts is not defined')).toBe(true);
        // 关键：**不能**再出现「编译完成！」
        expect(hasSuccess()).toBe(false);
    });

    it('错误信息里带得上非 Error 的抛出物（字符串也算）', async () =>
    {
        const compiler = makeCompiler(() =>
        {
            // 这里**故意**抛一个非 `Error`：编译器/第三方库的失败通道未必都给 Error 实例，
            // 用来验证提示文案不会因为"不是 Error"而把信息丢掉。
            // eslint-disable-next-line no-throw-literal
            throw 'plain string failure';
        });

        await (compiler as unknown as { compile: (l: unknown[]) => Promise<unknown> }).compile([]);

        expect(hasErrorContaining('plain string failure')).toBe(true);
        expect(hasSuccess()).toBe(false);
    });

    it('只有"编译完成！"这一条成功提示，不会同时弹成功与失败', async () =>
    {
        const compiler = makeCompiler(() =>
        {
            throw new Error('boom');
        });

        await (compiler as unknown as { compile: (l: unknown[]) => Promise<unknown> }).compile([]);

        const messages = messagesOf();

        // 恰好一条消息，且是失败
        expect(messages).toHaveLength(1);
        expect(messages[0].type).toBe('error');
    });
});
