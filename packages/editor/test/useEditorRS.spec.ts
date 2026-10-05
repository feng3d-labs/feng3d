import { describe, expect, it } from 'vitest';
import { createApp } from 'vue';
import { editorRSKey, useEditorRS } from '../src/vue-app/composables/useEditorRS';
import { editorRS } from '../src/assets/EditorRS';

/**
 * 资源系统的**注入通道**（#278 阶段 4b）。
 *
 * 为什么值得单测：`InspectorView` 里那处 `useEditorRS()` 只在"保存属性"时才跑，
 * e2e 未必触发到——而"忘了 provide"是**装配错误**，它必须在任何用户操作之前就被发现。
 *
 * 这里**不挂载组件**：单测环境是 node（没有 `document`），而验证注入根本用不着 DOM——
 * `app.runWithContext()` 提供的就是注入上下文。少一层依赖，也少一层"测试环境自己出问题"的变量。
 */
describe('资源系统的注入通道（#278 阶段 4b）', () =>
{
    /** 造一个不挂载的空应用（`runWithContext` 只要求有 app 实例） */
    const blankApp = () => createApp({ render: () => null });

    it('provide 之后取到的是**装配点给的那个实例**', () =>
    {
        const app = blankApp();

        app.provide(editorRSKey, editorRS);

        expect(app.runWithContext(() => useEditorRS())).toBe(editorRS);
    });

    it('**没 provide 时当场抛**（而不是静默返回 undefined）', () =>
    {
        const app = blankApp();

        // 缺失是**装配错误**：让它当场炸，比让每个调用方到处判空好
        //（"不透明"正是这一步要消掉的东西）
        expect(() => app.runWithContext(() => useEditorRS())).toThrow(/没有注入资源系统/);
    });
});
