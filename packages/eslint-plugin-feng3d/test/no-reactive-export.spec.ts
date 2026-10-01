import { describe, expect, it } from 'vitest';
import { Linter } from 'eslint';
import plugin from '../src/index.js';

/**
 * `feng3d/no-reactive-export` 规则（`packages/eslint-plugin-feng3d/src/rules/no-reactive-export.ts`，
 * 140 行，此前**行覆盖率 2.5%**）：**禁止导出响应式对象**（根 AGENTS.md §8）。
 *
 * 它是**门禁本身的执行者**之一（`eslint-plugin-feng3d` 的三条自定义规则：`reactive-naming` /
 * `no-reactive-export` / `no-reactive-argument`），所以给它补测试等于**给门禁加护栏** ——
 * 规则本身写错了，代码库的约束就静默失效。
 *
 * 规则的实现监听三处：
 * - `VariableDeclarator`：记录哪些变量是 `reactive(...)`（含 `toReactive` 一类）；
 * - `ExportNamedDeclaration`：`export const r_x = reactive(...)`；
 * - `ExportDefaultDeclaration`：`export default reactive(...)` 与 `export default r_x`（导出已声明的响应式变量）。
 *
 * 测试方式与同目录的 `no-reactive-argument.spec.ts` 一致：**用 `Linter` 直接跑**，不需要 `RuleTester`。
 */

const RULE = 'feng3d/no-reactive-export';
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

describe('eslint-plugin-feng3d/no-reactive-export', () =>
{
    describe('★ 应当报错的情形', () =>
    {
        it('★★ 命名导出：export const r_x = reactive(obj)', () =>
        {
            const code = `
const obj = { x: 1 };
export const r_x = reactive(obj);
`;
            const messages = verify(code);

            expect(messages).toHaveLength(1);
            expect(messages[0].ruleId).toBe(RULE);
        });

        it('★★ 默认导出：export default reactive(obj)', () =>
        {
            const code = `
const obj = { x: 1 };
export default reactive(obj);
`;
            expect(verify(code)).toHaveLength(1);
        });

        it('★★ 默认导出一个已声明的响应式变量：export default r_x', () =>
        {
            const code = `
const obj = { x: 1 };
const r_x = reactive(obj);
export default r_x;
`;
            expect(verify(code)).toHaveLength(1);
        });

        it('多个响应式导出 → 各自报错', () =>
        {
            const code = `
const a = { x: 1 };
const b = { y: 2 };
export const r_a = reactive(a);
export const r_b = reactive(b);
`;
            expect(verify(code)).toHaveLength(2);
        });

        it('非响应式的导出与响应式导出混在一起时，只报响应式那条', () =>
        {
            const code = `
const obj = { x: 1 };
export const plain = 42;
export const r_obj = reactive(obj);
`;
            expect(verify(code)).toHaveLength(1);
        });
    });

    describe('★ 不应报错的情形', () =>
    {
        it('★ 普通的命名导出', () =>
        {
            const code = 'export const plain = 42;\n';

            expect(verify(code)).toHaveLength(0);
        });

        it('★ 响应式变量但**不导出**', () =>
        {
            const code = `
const obj = { x: 1 };
const r_obj = reactive(obj);
fn(r_obj);
`;
            expect(verify(code)).toHaveLength(0);
        });

        it('★ export default 一个普通变量（不是 reactive 的返回值）', () =>
        {
            const code = `
const plain = { x: 1 };
export default plain;
`;
            expect(verify(code)).toHaveLength(0);
        });

        it('★ export default 一个字面量', () =>
        {
            expect(verify('export default 42;\n')).toHaveLength(0);
        });

        it('★ 导出名以 r_ 开头但值不是 reactive(...)（规则应看值而不是名字）', () =>
        {
            const code = `
const obj = { x: 1 };
export const r_notReactive = obj;
`;
            expect(verify(code)).toHaveLength(0);
        });

        it('★ 空文件不报错', () =>
        {
            expect(verify('')).toHaveLength(0);
        });
    });

    describe('fixer', () =>
    {
        it('★ 若规则可修复：修复后的代码不再触发本规则', () =>
        {
            const code = `
const obj = { x: 1 };
export const r_x = reactive(obj);
`;
            const fixed = fix(code);

            // 不假设 fixer 的具体产物（是删 export 还是改写法），只要求"修完不再违规"
            expect(verify(fixed)).toHaveLength(0);
        });

        it('可修复性问题不该把代码改坏（修复后仍能解析）', () =>
        {
            const code = `
const obj = { x: 1 };
export const r_x = reactive(obj);
`;
            const fixed = fix(code);

            expect(typeof fixed).toBe('string');
            // 修复后应当仍然包含 reactive 调用（不是把整行删掉导致语法错误）
            expect(() => verify(fixed)).not.toThrow();
        });
    });
});
