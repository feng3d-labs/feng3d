import { inject } from 'vue';
import type { InjectionKey } from 'vue';
import type { EditorAsset } from '../../ui/assets/EditorAsset';

/**
 * 资源管理器的**注入键**（#278 路线 B 第二批）。
 *
 * ## 为什么这里 provide 的是"那个已有的实例"
 *
 * `EditorAsset` 是**有状态的全局单例**（资产树、当前展开的文件夹都在它身上），
 * 所以这一批**不能**像 `menuConfig` 那样"入口 new 一个新的"——组件必须拿到**同一个**实例。
 * 于是装配点（`vue-app/main.ts`）导入那个实例并 `provide` 它：**入口成为唯一的持有者**，
 * 消费方（组件）只依赖类型 + 注入。
 *
 * 这也是为什么它的收益比 `menuConfig` 那批大：`ProjectView.vue` 一个文件里就有 **35 处**用法。
 */
export const assetManagerKey: InjectionKey<EditorAsset> = Symbol('feng3d-editor:asset-manager');

/**
 * 取资源管理器（**必须在 `setup()` 里调用**）。
 *
 * @returns 资源管理器
 * @throws 应用没有 `provide(assetManagerKey, …)` 时抛出（装配错误不该静默）
 */
export function useEditorAssets(): EditorAsset
{
    const assetManager = inject(assetManagerKey);

    if (!assetManager)
    {
        throw new Error(
            '没有注入资源管理器：应用入口（vue-app/main.ts）应当 '
            + 'provide(assetManagerKey, editorAsset)',
        );
    }

    return assetManager;
}
