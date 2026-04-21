import type { Rule } from 'eslint';

const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description: '禁止导出响应式对象',
            recommended: true,
        },
        messages: {
            noExportReactive: '不允许导出响应式对象 "{{name}}"，响应式对象应仅在模块内部使用',
        },
        schema: [],
    },
    create(context) {
        // 追踪响应式对象变量名
        const reactiveVariables = new Set<string>();

        return {
            // 检测: const xxx = reactive(...)
            VariableDeclarator(node) {
                if (
                    node.init?.type === 'CallExpression' &&
                    ((node.init.callee?.type === 'Identifier' && node.init.callee.name === 'reactive') ||
                        (node.init.callee?.type === 'MemberExpression' &&
                            'name' in node.init.callee.property &&
                            node.init.callee.property.name === 'reactive'))
                ) {
                    const variable = (node.id as any)?.name;
                    if (variable && typeof variable === 'string') {
                        reactiveVariables.add(variable);
                    }
                }
            },

            // 检查 export 语句
            ExportNamedDeclaration(node) {
                // 检查 export { xxx }
                if (node.declaration === null && node.specifiers) {
                    for (const spec of node.specifiers) {
                        if (spec.type === 'ExportSpecifier' && spec.local.type === 'Identifier') {
                            const name = spec.local.name;
                            if (reactiveVariables.has(name)) {
                                context.report({
                                    node: spec,
                                    messageId: 'noExportReactive',
                                    data: { name },
                                });
                            }
                        }
                    }
                }

                // 检查 export const xxx = reactive(...)
                if (node.declaration?.type === 'VariableDeclaration') {
                    for (const declarator of (node.declaration as any).declarations) {
                        if (
                            declarator.init?.type === 'CallExpression' &&
                            ((declarator.init.callee?.type === 'Identifier' &&
                                declarator.init.callee.name === 'reactive') ||
                                (declarator.init.callee?.type === 'MemberExpression' &&
                                    'name' in declarator.init.callee.property &&
                                    declarator.init.callee.property.name === 'reactive'))
                        ) {
                            const name = (declarator.id as any)?.name;
                            if (name) {
                                context.report({
                                    node: node.declaration,
                                    messageId: 'noExportReactive',
                                    data: { name },
                                });
                            }
                        }
                    }
                }
            },

            // 检查 export default xxx
            ExportDefaultDeclaration(node) {
                const declaration = node.declaration;

                // export default reactive(...)
                if (
                    declaration.type === 'CallExpression' &&
                    ((declaration.callee?.type === 'Identifier' && declaration.callee.name === 'reactive') ||
                        (declaration.callee?.type === 'MemberExpression' &&
                            'name' in declaration.callee.property &&
                            declaration.callee.property.name === 'reactive'))
                ) {
                    context.report({
                        node,
                        messageId: 'noExportReactive',
                        data: { name: 'default' },
                    });
                }

                // export default xxx (xxx 是响应式对象)
                if (declaration.type === 'Identifier') {
                    const name = declaration.name;
                    if (reactiveVariables.has(name)) {
                        context.report({
                            node,
                            messageId: 'noExportReactive',
                            data: { name },
                        });
                    }
                }
            },
        };
    },
};

export default rule;
