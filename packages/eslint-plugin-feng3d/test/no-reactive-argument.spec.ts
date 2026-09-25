import { describe, expect, it } from 'vitest';
import { Linter } from 'eslint';
import plugin from '../src/index.js';

/**
 * no-reactive-argument 规则：禁止将响应式对象作为函数参数传递。
 *
 * fixer 必须**保留成员访问**：`fn(r_obj.prop)` 应修成 `fn(obj.prop)`。
 * 若替换整个参数节点，会得到 `fn(obj)` —— 静默丢失 `.prop`，
 * 使 `npm run lintfix` 成为代码破坏器。
 */
const linter = new Linter();

const config = {
    plugins: { feng3d: plugin as never },
    rules: { 'feng3d/no-reactive-argument': 'error' },
} as never;

function verify(code: string)
{
    return linter.verify(code, config).filter(m => m.ruleId === 'feng3d/no-reactive-argument');
}

function fix(code: string)
{
    return linter.verifyAndFix(code, config).output;
}

describe('eslint-plugin-feng3d/no-reactive-argument', () =>
{
    it('直接传递响应式对象变量：报错并修复为原始对象', () =>
    {
        const code = `
const obj = { x: 1 };
const r_obj = reactive(obj);
fn(r_obj);
`;
        expect(verify(code)).toHaveLength(1);
        expect(fix(code)).toContain('fn(obj);');
    });

    it('传递响应式对象的属性：修复须保留成员访问（回归）', () =>
    {
        // 修复前 fixer 替换整个参数节点 → fn(entity)，丢失 .parent
        const code = `
const entity = { parent: null };
const r_entity = reactive(entity);
fn(r_entity.parent);
`;
        expect(verify(code)).toHaveLength(1);
        expect(fix(code)).toContain('fn(entity.parent);');
    });

    it('非响应式对象作为参数不报错', () =>
    {
        const code = `
const obj = { x: 1 };
fn(obj);
`;
        expect(verify(code)).toHaveLength(0);
    });

    it('白名单函数（toRaw/computed/effect）不报错', () =>
    {
        const code = `
const obj = { x: 1 };
const r_obj = reactive(obj);
toRaw(r_obj);
`;
        expect(verify(code)).toHaveLength(0);
    });
});
