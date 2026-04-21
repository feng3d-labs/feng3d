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
        fixable: 'code',
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
                                    fix: (fixer) => {
                                        // 移除 export 关键字，保留变量声明
                                        const sourceCode = context.sourceCode;
                                        const exportKeyword = sourceCode.getFirstToken(node);
                                        if (exportKeyword) {
                                            // 找到 export 关键字后面的位置（直到 const/let/var）
                                            const nextToken = sourceCode.getTokenAfter(exportKeyword, {
                                                includeComments: false,
                                            });
                                            if (nextToken) {
                                                // 移除 export 关键字和它后面的空格
                                                return fixer.removeRange([
                                                    exportKeyword.range[0],
                                                    nextToken.range[0],
                                                ]);
                                            }
                                        }
                                        return null;
                                    },
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
                        fix: (fixer) => {
                            // 将 export default reactive(...) 改为 const xxx = reactive(...)
                            const sourceCode = context.sourceCode;
                            const exportToken = sourceCode.getFirstToken(node);
                            const declarationText = sourceCode.getText(declaration);
                            if (exportToken) {
                                return fixer.replaceText(
                                    node,
                                    `const autoGeneratedReactiveObject = ${declarationText}`,
                                );
                            }
                            return null;
                        },
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
                            fix: (fixer) => {
                                // 移除 export default
                                const sourceCode = context.sourceCode;
                                const exportToken = sourceCode.getFirstToken(node);
                                const defaultToken = sourceCode.getTokenAfter(exportToken!, {
                                    includeComments: false,
                                });
                                const identifierToken = sourceCode.getTokenAfter(defaultToken!, {
                                    includeComments: false,
                                });
                                if (exportToken && identifierToken) {
                                    // 移除 "export default " 保留变量名
                                    return fixer.removeRange([
                                        exportToken.range[0],
                                        identifierToken.range[0],
                                    ]);
                                }
                                return null;
                            },
                        });
                    }
                }
            },
        };
    },
};

export default rule;
