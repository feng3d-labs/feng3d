import { inject } from 'vue';
import type { InjectionKey } from 'vue';
import type { EditorRS } from '../../assets/EditorRS';

/**
 * 资源系统的**注入键**（#278 阶段 4b）。
 *
 * ## 为什么不直接 import 单例
 *
 * `editorRS` 是模块级单例：组件 import 它意味着"谁都拿得到、谁都能改"，而且**不可替换**
 * ——测试想塞一个假的资源系统没有入口。改成注入之后：
 *
 * - 组件只依赖**类型**，实例由装配点（`main.ts`）提供；
 * - 引用数能被 `editor-singleton-survey.mjs` 计量，并**只减不增**（`EDITORRS_MAX_REFERENCES`）；
 * - 将来要换实现（例如"按项目隔离的资源系统"）只改装配点一处。
 */
export const editorRSKey: InjectionKey<EditorRS> = Symbol('feng3d-editor:resource-system');

/**
 * 取资源系统（**必须在 `setup()` 里调用**）。
 *
 * 取不到时**直接抛**，而不是返回 `undefined`：缺失是**装配错误**（`main.ts` 忘了 provide），
 * 让它当场炸比让每个调用方到处判空好——"不透明"正是这一步要消掉的东西。
 *
 * @returns 资源系统
 * @throws 应用没有 `provide(editorRSKey, …)` 时抛出
 */
export function useEditorRS(): EditorRS
{
    const rs = inject(editorRSKey);

    if (!rs)
    {
        throw new Error(
            '没有注入资源系统：应用入口（vue-app/main.ts）应当 '
            + 'provide(editorRSKey, installEditorResourceSystem())',
        );
    }

    return rs;
}
