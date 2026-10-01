import { describe, expect, it } from 'vitest';
import { Linter } from 'eslint';
import plugin from '../src/index.js';

/**
 * `feng3d/reactive-naming` 规则（`packages/eslint-plugin-feng3d/src/rules/reactive-naming.ts`，
 * 62 行，此前**行覆盖率 5%**）：**强制响应式对象使用 `r_` 前缀**（根 AGENTS.md §8.3）。
 *
 * 它是 `eslint-plugin-feng3d` 三条自定义规则中的**最后一条**（另两条 `no-reactive-export` 与
 * `no-reactive-argument` 已有 spec），也是**唯一带 fixer 自动改名**的一条 —— 所以除了"报不报"，
 * 更要钉住 **"改得对不对"**：fixer 必须把**声明**与**该变量的所有引用**一起改名，
 * 否则 `npm run lintfix` 会把代码改成"声明叫 r_x、引用还叫 x"的**未定义变量**。
 *
 * 规则识别的两种写法：
 * - `const x = reactive(obj)`（callee 是 `Identifier`）；
 * - `const x = ns.reactive(obj)`（callee 是 `MemberExpression`，`property.name === 'reactive'`）。
 *
 * 测试方式与同目录 spec 一致：**用 `Linter` 直接跑**。
 */

const RULE = 'feng3d/reactive-naming';
const linter = new Linter();
const config = {
    plugins: { feng3d: plugin as never },
    rules: { [RULE]: 'error' },
} as never;

/** 只保留本规则产生的消息 */
function verify(code: string)
{
    return linter.verify(code, config).filter((m) => m.ruleId === RULE);
}

function fix(code: string)
{
    return linter.verifyAndFix(code, config).output;
}

describe('eslint-plugin-feng3d/reactive-naming', () =>
{
    describe('★ 应当报错的情形', () =>
    {
        it('★★ const x = reactive(obj) → 报错，且消息里点名原变量', () =>
        {
            const code = `
const obj = { x: 1 };
const state = reactive(obj);
`;
            const messages = verify(code);

            expect(messages).toHaveLength(1);
            expect(messages[0].ruleId).toBe(RULE);
            expect(messages[0].message).toContain('state');
            expect(messages[0].message).toContain('r_');
        });

        it('★★ 命名空间形式 ns.reactive(obj) 也要报错', () =>
        {
            const code = `
const obj = { x: 1 };
const state = ns.reactive(obj);
`;
            expect(verify(code)).toHaveLength(1);
        });

        it('多个漏前缀的声明各自报错', () =>
        {
            const code = `
const a = { x: 1 };
const b = { y: 2 };
const ra = reactive(a);
const rb = reactive(b);
`;
            expect(verify(code)).toHaveLength(2);
        });

        it('报错位置落在变量名上（不是整条声明）', () =>
        {
            const code = 'const state = reactive({});\n';
            const messages = verify(code);

            expect(messages).toHaveLength(1);
            // idNode 的位置：从 `state` 开始
            expect(messages[0].column).toBe('const '.length + 1);
        });
    });

    describe('★ 不应报错的情形', () =>
    {
        it('★ 已有 r_ 前缀', () =>
        {
            const code = `
const obj = { x: 1 };
const r_state = reactive(obj);
`;
            expect(verify(code)).toHaveLength(0);
        });

        it('★ 不是 reactive 的调用', () =>
        {
            const code = `
const obj = { x: 1 };
const state = clone(obj);
`;
            expect(verify(code)).toHaveLength(0);
        });

        it('★ 声明但不初始化', () =>
        {
            expect(verify('let state;\n')).toHaveLength(0);
        });

        it('★ 初始化成普通对象（不是调用）', () =>
        {
            expect(verify('const state = { x: 1 };\n')).toHaveLength(0);
        });

        it('★ 空文件不报错', () =>
        {
            expect(verify('')).toHaveLength(0);
        });
    });

    describe('★★ fixer（比"报不报"更重要）', () =>
    {
        it('★★ 修复后声明带上前缀，且**引用点一起改**（否则会产生未定义变量）', () =>
        {
            const code = `
const obj = { x: 1 };
const state = reactive(obj);
fn(state);
`;
            const fixed = fix(code);

            expect(fixed).toContain('const r_state = reactive(obj);');
            expect(fixed).toContain('fn(r_state);');
            // 修复后不该再违规
            expect(verify(fixed)).toHaveLength(0);
        });

        it('★★ 多个引用点全部被改名', () =>
        {
            const code = `
const obj = { x: 1 };
const state = reactive(obj);
g(state);
h(state, state);
`;
            const fixed = fix(code);

            expect(fixed).toContain('g(r_state);');
            expect(fixed).toContain('h(r_state, r_state);');
            expect(fixed).not.toMatch(/\bstate\b(?!\s*=)/);
        });

        it('★ 已经合规的代码修复后不变（幂等）', () =>
        {
            const code = `
const obj = { x: 1 };
const r_state = reactive(obj);
fn(r_state);
`;
            const fixed = fix(code);

            expect(fixed).toBe(code);
        });
    });
});
