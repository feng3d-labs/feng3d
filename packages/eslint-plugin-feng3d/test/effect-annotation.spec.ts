import { describe, expect, it } from 'vitest';
import { Linter } from 'eslint';
import plugin from '../src/index.js';

/**
 * effect-annotation 规则（设计 4.4 惰性优先的强制层）：
 * 从 @feng3d/reactivity 导入的 effect 调用，上方 5 行内注释须含
 * 「@边界 effect」或「@过渡 effect」标注。
 */
const linter = new Linter();

const config = {
    plugins: { feng3d: plugin as never },
    rules: { 'feng3d/effect-annotation': 'error' },
} as never;

function verify(code: string)
{
    return linter.verify(code, config).filter(m => m.ruleId === 'feng3d/effect-annotation');
}

describe('eslint-plugin-feng3d/effect-annotation', () =>
{
    it('未标注的 effect 报错', () =>
    {
        const messages = verify(`
import { effect } from '@feng3d/reactivity';
effect(() => { x++; });
`);
        expect(messages).toHaveLength(1);
        expect(messages[0].messageId).toBe('needAnnotation');
    });

    it('@边界 effect 标注通过', () =>
    {
        const messages = verify(`
import { effect } from '@feng3d/reactivity';
// @边界 effect：DOM 同步
effect(() => { x++; });
`);
        expect(messages).toHaveLength(0);
    });

    it('@过渡 effect 标注通过', () =>
    {
        const messages = verify(`
import { effect } from '@feng3d/reactivity';
// @过渡 effect：writeBuffer push 桥（阶段 3 迁移后移除）
effect(() => { x++; });
`);
        expect(messages).toHaveLength(0);
    });

    it('多行注释块场景：5 行窗口内标注通过，超出报错', () =>
    {
        const ok = verify(`
import { effect } from '@feng3d/reactivity';
// @边界 effect：输入分发
// 第二行说明
// 第三行说明
let prev = null;
effect(() => { x++; });
`);
        expect(ok).toHaveLength(0);

        const bad = verify(`
import { effect } from '@feng3d/reactivity';
// @边界 effect：太远了
const a = 1;
const b = 2;
const c = 3;
const d = 4;
const e = 5;
const f = 6;
effect(() => { x++; });
`);
        expect(bad).toHaveLength(1);
    });

    it('导入别名也被追踪；非 reactivity 导入的 effect 不检查', () =>
    {
        const aliased = verify(`
import { effect as fx } from '@feng3d/reactivity';
fx(() => { x++; });
`);
        expect(aliased).toHaveLength(1);

        const foreign = verify(`
import { effect } from 'my-lib';
effect(() => { x++; });
`);
        expect(foreign).toHaveLength(0);
    });
});
