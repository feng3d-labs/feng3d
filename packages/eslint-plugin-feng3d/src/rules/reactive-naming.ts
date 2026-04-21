import type { Rule } from 'eslint';

const rule: Rule.RuleModule = {
    meta: {
        type: 'suggestion',
        docs: {
            description: '强制响应式对象使用 r_ 前缀',
            recommended: true,
        },
        messages: {
            missingPrefix: '响应式对象 "{{name}}" 必须使用 r_ 前缀，例如: r_{{name}}',
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
                        // 检查是否有 r_ 前缀
                        if (!variable.startsWith('r_')) {
                            context.report({
                                node,
                                messageId: 'missingPrefix',
                                data: { name: variable },
                            });
                        }
                        reactiveVariables.add(variable);
                    }
                }
            },
        };
    },
};

export default rule;
