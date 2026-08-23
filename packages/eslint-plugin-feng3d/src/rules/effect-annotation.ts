import type { Rule } from 'eslint';

/**
 * effect 使用需标注用途（框架设计文档 4.4）。
 *
 * 统一惰性响应式原则下，effect 默认视为违规：出现 `effect(...)` 调用时，
 * 其上方注释（跳过空行，最多回溯 3 行）必须含有标注——
 * - `@边界 effect`：引擎 → 外部系统的边界同步（DOM/日志/音频等推模式外设）
 * - `@过渡 effect`：向目标架构迁移的兼容桥（须附迁移任务说明）
 *
 * 只匹配从 @feng3d/reactivity 导入的 effect，避免误伤同名本地函数。
 */
const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'effect 调用必须带 @边界 effect / @过渡 effect 标注注释（设计 4.4 惰性优先）',
            recommended: true,
        },
        messages: {
            needAnnotation: 'effect 调用缺少标注：上方注释须含「@边界 effect」（外部系统同步）或「@过渡 effect」（迁移桥，附迁移任务），见框架设计文档 4.4',
        },
        schema: [],
    },
    create(context)
    {
        // 追踪从 @feng3d/reactivity 导入的 effect 绑定名（含别名）
        let effectNames: Set<string> | null = null;

        const isEffectCall = (node: any): boolean =>
        {
            if (!effectNames) return false;

            return node?.type === 'CallExpression'
                && node.callee?.type === 'Identifier'
                && effectNames.has(node.callee.name);
        };

        const hasAnnotationAbove = (node: any): boolean =>
        {
            const sourceCode = context.sourceCode;
            const comments = sourceCode.getAllComments();

            // 回溯 5 行内的注释（跳过空行；多行注释块场景需要足够窗口）
            for (let i = comments.length - 1; i >= 0; i--)
            {
                const comment = comments[i];
                if (comment.loc.end.line < node.loc.start.line - 5) break;
                if (comment.loc.end.line >= node.loc.start.line) continue;

                if (/@(边界|过渡)\s*effect/.test(comment.value))
                {
                    return true;
                }
            }

            return false;
        };

        return {
            ImportDeclaration(node: any)
            {
                if (node.source?.value !== '@feng3d/reactivity') return;

                effectNames ||= new Set<string>();
                for (const specifier of node.specifiers)
                {
                    if (specifier.type === 'ImportSpecifier' && specifier.imported?.name === 'effect')
                    {
                        effectNames.add(specifier.local?.name ?? 'effect');
                    }
                }
            },

            'CallExpression:exit'(node: any)
            {
                if (!isEffectCall(node)) return;
                if (hasAnnotationAbove(node)) return;

                context.report({ node, messageId: 'needAnnotation' });
            },
        };
    },
};

export default rule;
