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
        fixable: 'code',
    },
    create(context) {
        const sourceCode = context.sourceCode;
        // 追踪需要修复的变量声明节点
        const fixDeclarators = new Set<Rule.Node>();

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
                    const idNode = node.id;
                    if (idNode?.type === 'Identifier') {
                        const oldName = idNode.name;
                        // 检查是否有 r_ 前缀
                        if (!oldName.startsWith('r_')) {
                            const newName = `r_${oldName}`;
                            fixDeclarators.add(node);

                            context.report({
                                node: idNode,
                                messageId: 'missingPrefix',
                                data: { name: oldName },
                                *fix(fixer) {
                                    yield fixer.replaceText(idNode, newName);
                                    // 修复文件中所有引用
                                    const scope = sourceCode.getScope(node);
                                    const variable = scope.variables.find((v: any) => v.name === oldName);
                                    if (variable) {
                                        for (const ref of variable.references) {
                                            const refId = ref.identifier;
                                            // 跳过声明本身
                                            if (refId !== idNode) {
                                                yield fixer.replaceText(refId, newName);
                                            }
                                        }
                                    }
                                },
                            });
                        }
                    }
                }
            },
        };
    },
};

export default rule;
