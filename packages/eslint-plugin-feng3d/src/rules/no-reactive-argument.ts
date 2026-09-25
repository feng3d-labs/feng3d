import type { Rule } from 'eslint';

const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description: '禁止将响应式对象作为函数参数传递',
            recommended: true,
        },
        messages: {
            noReactiveArgument: '不允许将响应式对象 "{{name}}" 作为函数参数传递，函数内部应自行创建响应式对象',
        },
        schema: [
            {
                type: 'object',
                properties: {
                    // 允许的函数名白名单
                    allowFunctions: {
                        type: 'array',
                        items: { type: 'string' },
                    },
                },
                additionalProperties: false,
            },
        ],
        fixable: 'code',
    },
    create(context) {
        const options = context.options[0] || {};
        const allowFunctions = new Set(options.allowFunctions || ['toRaw', 'computed', 'effect']);

        // 追踪响应式对象及其原始对象: r_xxx -> xxx
        const reactiveToOriginal = new Map<string, string>();
        // 追踪所有响应式对象变量（包括没有原始对象的）
        const reactiveVariables = new Set<string>();

        return {
            // 检测: const r_xxx = reactive(yyy)
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
                        const reactiveName = idNode.name;
                        reactiveVariables.add(reactiveName);

                        // 尝试找到原始对象
                        const arg = (node.init as any).arguments[0];
                        if (arg?.type === 'Identifier') {
                            // reactive(obj) -> r_obj -> obj
                            reactiveToOriginal.set(reactiveName, arg.name);
                        }
                    }
                }
            },

            // 检查函数调用参数
            CallExpression(node) {
                const callee = node.callee;

                // 获取函数名
                let functionName = '';
                if (callee.type === 'Identifier') {
                    functionName = callee.name;
                } else if (callee.type === 'MemberExpression' && 'name' in callee.property) {
                    functionName = callee.property.name as string;
                }

                // 如果在白名单中，跳过
                if (allowFunctions.has(functionName)) {
                    return;
                }

                // 检查参数
                for (const arg of node.arguments) {
                    let argName = '';

                    // 直接传递响应式对象变量: fn(r_obj)
                    if (arg.type === 'Identifier') {
                        argName = arg.name;
                    }
                    // 传递响应式对象的属性: fn(r_obj.prop)
                    else if (arg.type === 'MemberExpression') {
                        if (arg.object.type === 'Identifier') {
                            argName = arg.object.name;
                        }
                    }

                    if (argName && reactiveVariables.has(argName)) {
                        const originalName = reactiveToOriginal.get(argName);
                        context.report({
                            node: arg,
                            messageId: 'noReactiveArgument',
                            data: { name: argName },
                            fix: (fixer) => {
                                // 如果有原始对象，替换为原始对象
                                if (originalName) {
                                    // 成员访问（fn(r_obj.prop)）只替换对象部分以保留 .prop；
                                    // 替换整个参数节点会得到 fn(obj)，静默丢失成员访问。
                                    const target = arg.type === 'MemberExpression' ? arg.object : arg;
                                    return fixer.replaceText(target, originalName);
                                }
                                // 否则无法自动修复
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
