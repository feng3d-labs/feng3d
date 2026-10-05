import type { Rule } from 'eslint';

/**
 * 模块顶层禁止创建的缓存构造器。
 *
 *   - `Map` / `WeakMap` / `Set`：内置容器；带字面量参数的 `new Set([...])` 是只读常量集合，放行。
 *   - `ChainMap`：**项目自有**的缓存容器（`packages/webgpu/src/utils/ChainMap.ts`——内部用 `WeakMap`
 *     逐级嵌套、`wrapKey` 把字面量键包成对象，对外只有 `get` / `set` / `delete` / `size`，
 *     语义就是「键 → 值」的按需缓存；全仓唯一用途是 `packages/webgpu/src/caches/*` 的身份键缓存）。
 *     它**未声明 `constructor`**，所以下面"带参放行"那条对它没有实际影响（任何合法写法的实参个数都是 0）；
 *     将来若给它加可选构造参数，`scripts/check-module-side-effects.mjs` 那一层仍会判为缓存创建
 *     （脚本层对项目自有容器**不套空参限制**），本规则只覆盖"真正模块顶层"的形态。
 *
 * 已知覆盖边界：本规则的 `isModuleScope` 见到 `ClassBody` 就放行，所以**类 `static` 字段 / 块里的
 * 缓存创建不归它管**（`static map = new ChainMap()` 由脚本层的 AST 判据拦）。该缺口登记在
 * `scripts/probe-r2-blindspots.mjs` 的文件头。
 */
const CACHE_CONSTRUCTORS = ['Map', 'WeakMap', 'Set', 'ChainMap'];

/** 模块顶层禁止的启动型调用：定时器 / rAF / ticker 启动 */
const STARTUP_CALLS = ['setInterval', 'setTimeout', 'requestAnimationFrame', 'runTickerFuncs', 'startTicker'];

/**
 * 判断节点是否处于「模块顶层」——即 import 时就会执行的位置。
 *
 * 函数体、类字段初始化（实例化时才执行）都不算；只读常量集合与 lazy-init 形态放行。
 */
function isModuleScope(node: Rule.Node): boolean {
    let current: Rule.Node | undefined = node.parent as Rule.Node | undefined;

    while (current) {
        if (
            current.type === 'FunctionDeclaration' ||
            current.type === 'FunctionExpression' ||
            current.type === 'ArrowFunctionExpression' ||
            current.type === 'ClassBody'
        ) {
            return false;
        }
        if (current.type === 'Program') return true;
        current = current.parent as Rule.Node | undefined;
    }

    return true;
}

const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description: '禁止模块级副作用（R2）：顶层缓存创建 / 启动型调用 / globalThis 写入',
            recommended: true,
        },
        messages: {
            moduleCache:
                '模块顶层不得创建缓存 `new {{name}}()`：import 就分配内存、副作用无法关闭，'
                + '并让 tree-shaking 判断不了这个模块能否整体消除。改为 lazy-init：'
                + '`let cache = null; function getCache() { if (!cache) cache = new {{name}}(); return cache; }`',
            moduleStartup:
                '模块顶层不得执行 `{{name}}(...)`：import 即启动（定时器 / rAF / ticker 循环），'
                + '调用方无法关闭。移进显式函数（如 `startTicker()`），由使用方主动调用',
            globalWrite:
                '模块顶层不得写 `globalThis.{{name}}`：import 即产生全局副作用。改为显式初始化函数',
        },
        schema: [],
    },
    create(context) {
        return {
            NewExpression(node) {
                if (node.callee.type !== 'Identifier') return;
                if (!CACHE_CONSTRUCTORS.includes(node.callee.name)) return;
                // 带参数（如 `new Set([...])`）视为只读常量集合，放行
                if ((node.arguments?.length ?? 0) > 0) return;
                if (!isModuleScope(node)) return;

                context.report({
                    node,
                    messageId: 'moduleCache',
                    data: { name: node.callee.name },
                });
            },

            CallExpression(node) {
                if (node.callee.type !== 'Identifier') return;
                if (!STARTUP_CALLS.includes(node.callee.name)) return;
                if (!isModuleScope(node)) return;

                context.report({
                    node,
                    messageId: 'moduleStartup',
                    data: { name: node.callee.name },
                });
            },

            AssignmentExpression(node) {
                const left = node.left;

                if (left.type !== 'MemberExpression' || left.object.type !== 'Identifier') return;
                if (left.object.name !== 'globalThis') return;
                if (!isModuleScope(node)) return;

                const name = left.property.type === 'Identifier' ? left.property.name : '<computed>';
                context.report({
                    node,
                    messageId: 'globalWrite',
                    data: { name },
                });
            },
        };
    },
};

export default rule;
