import { mergeScriptCovs } from '@bcoe/v8-coverage';
import { describe, expect, it } from 'vitest';
import { mergeScriptCovsFixed } from '../scripts/vitest-v8-merge-script-covs.mjs';

/**
 * `mergeScriptCovsFixed`（`scripts/vitest-v8-merge-script-covs.mjs`）的回归测试（issue #667）。
 *
 * ## 为什么这份测试值得单独存在
 *
 * 它守的是 issue #667 的根因：vitest 的 v8 provider 用上游 `@bcoe/v8-coverage` 的 `mergeScriptCovs`
 * 合并**同一个模块在多个 worker 里**的 V8 coverage，而上游按「函数根 range」认函数——V8 对未执行
 * 函数报的根 range 会与**别的函数**雷同（实测 `PointGeometry.ts` 的 `<static_initializer>` 与
 * `<instance_members_initializer>` 同为 `[889, 4440]`），于是 `count = 0` 的那个被当成
 * 「同一函数的粗糙版本」丢掉，剩下的模块顶层 range（count = 加载次数）把整份文件算成 100%。
 *
 * 本文件**不跑 vitest 的覆盖率管线**（那要起子进程、慢且脆），而是直接构造两份「同根 range、
 * 不同函数名、count 一真一假」的合成 V8 数据，断言合并后两边都在。把 `mergeScriptCovsFixed` 的
 * 实现改回上游 `mergeScriptCovs`，本文件立刻失败——这就是它相对「跑一遍全量覆盖率看读数」的价值：
 * 快、且指向根因。
 */

interface Range
{
    startOffset: number;
    endOffset: number;
    count: number;
}

interface FuncCov
{
    functionName: string;
    ranges: Range[];
    isBlockCoverage: boolean;
}

interface ScriptCov
{
    scriptId: string;
    url: string;
    functions: FuncCov[];
}

const URL = 'file:///repo/packages/demo/src/Demo.ts';

function func(functionName: string, startOffset: number, endOffset: number, count: number, isBlockCoverage: boolean): FuncCov
{
    return { functionName, ranges: [{ startOffset, endOffset, count }], isBlockCoverage };
}

function script(...functions: FuncCov[]): ScriptCov
{
    return { scriptId: '1', url: URL, functions };
}

/** 一个 worker 的 V8 数据：模块顶层执行 1 次、静态初始化块执行 1 次、实例成员初始化器没执行 */
function oneWorker(): ScriptCov
{
    return script(
        func('', 0, 100, 1, true),
        func('<static_initializer>', 10, 40, 1, true),
        func('<instance_members_initializer>', 10, 40, 0, false),
    );
}

describe('覆盖率跨 worker 合并（issue #667）', () =>
{
    it('同根 range、不同函数名的条目不会被丢弃（根因回归）', () =>
    {
        const merged = mergeScriptCovsFixed([oneWorker(), oneWorker()]);
        const names = merged.functions.map((f) => f.functionName);

        expect(names).toContain('<static_initializer>');
        expect(names).toContain('<instance_members_initializer>');
    });

    it('未执行函数合并后仍是 count 0（不被顶层 range 的加载次数顶上来）', () =>
    {
        const merged = mergeScriptCovsFixed([oneWorker(), oneWorker()]);
        const instance = merged.functions.find((f) => f.functionName === '<instance_members_initializer>');

        expect(instance).toBeDefined();
        expect(instance.ranges.every((r) => r.count === 0)).toBe(true);
    });

    it('同根 range、不同函数名且都执行过时，两者都保留', () =>
    {
        const a = script(func('', 0, 100, 1, true), func('alpha', 10, 40, 1, true), func('beta', 10, 40, 2, true));
        const b = script(func('', 0, 100, 1, true), func('alpha', 10, 40, 1, true), func('beta', 10, 40, 2, true));
        const merged = mergeScriptCovsFixed([a, b]);
        const names = merged.functions.map((f) => f.functionName);

        expect(names).toContain('alpha');
        expect(names).toContain('beta');
    });

    it('单份数据走快路径，不增删函数', () =>
    {
        const merged = mergeScriptCovsFixed([oneWorker()]);

        expect(merged.functions.map((f) => f.functionName).sort()).toEqual(
            ['', '<instance_members_initializer>', '<static_initializer>'].sort(),
        );
    });

    /**
     * 对照：上游 `mergeScriptCovs` 在**同样的输入**下会丢掉 `count = 0` 的那个函数。
     *
     * 这条断言的作用是「证明上面的用例测的是真 bug」，而不是自说自话。
     * **上游修好 `mergeScriptCovs` 后它会失败——那是信号、不是回归**：届时按
     * `scripts/vitest-v8-merge-script-covs.mjs` 头部「何时删掉本文件」的说明，删掉该模块、
     * `scripts/vitest-v8-coverage-provider.mjs` 与本条断言。
     */
    it('对照：上游 mergeScriptCovs 会丢掉这个函数（上游修复后本条应删）', () =>
    {
        const merged = mergeScriptCovs([oneWorker(), oneWorker()]);
        const names = merged.functions.map((f) => f.functionName);

        expect(names).toContain('<static_initializer>');
        expect(names).not.toContain('<instance_members_initializer>');
    });
});
