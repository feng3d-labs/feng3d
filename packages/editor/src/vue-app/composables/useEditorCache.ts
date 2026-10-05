import { inject } from 'vue';
import type { InjectionKey } from 'vue';
import type { EditorCache } from '../../caches/Editorcache';

/**
 * 编辑器缓存（偏好持久化）的**注入键**（#278 路线 B 第七批）。
 *
 * ## 为什么它也要走注入
 *
 * `EditorCache` 是**偏好持久化**（`localStorage` 的 `feng3d-editor` 键：上次打开的项目名、
 * 最近项目列表、界面布局）。它原先以 `getEditorCache()` 这种 **lazy 单例**的形式被 5 个文件
 * 隐式取用 —— 也就是说"谁在用偏好、用的时候有没有初始化好"看不出来。
 *
 * 与 `editorAsset` 那批的区别：`EditorCache` **不是**有状态的"同一棵树"（那个必须提供同一个
 * 实例），这里的诉求是**把创建点挪到入口、让消费面可计量、测试可替换**，所以入口 `new` 一个即可。
 *
 * 顺带说明一处**故意保留**的形态：`Editorcache.ts` 自己的 `beforeunload` 监听里仍会调
 * `getEditorCache()`（模块顶层注册的监听器拿不到注入实例），而且那个 lazy 单例仍在文件里。
 * 本批要的不是"删掉那个函数"，而是**外部没人再 import 它** —— 反向校验（"迁完的不许复活"）
 * 判的正是"谁 import 了它"，所以这条纪律是可执行的。
 */
export const editorCacheKey: InjectionKey<EditorCache> = Symbol('feng3d-editor:editor-cache');

/**
 * 取编辑器缓存（**必须在 `setup()` 里调用**）。
 *
 * @returns 编辑器缓存
 * @throws 应用没有 `provide(editorCacheKey, …)` 时抛出（装配错误不该静默）
 */
export function useEditorCache(): EditorCache
{
    const cache = inject(editorCacheKey);

    if (!cache)
    {
        throw new Error(
            '没有注入编辑器缓存：应用入口（vue-app/main.ts）应当 '
            + 'provide(editorCacheKey, editorCache)',
        );
    }

    return cache;
}
