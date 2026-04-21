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
    },
    create(context) {
        const options = context.options[0] || {};
        const allowFunctions = new Set(options.allowFunctions || ['toRaw', 'computed', 'effect']);

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
                        context.report({
                            node: arg,
                            messageId: 'noReactiveArgument',
                            data: { name: argName },
                        });
                    }
                }
            },
        };
    },
};

export default rule;
