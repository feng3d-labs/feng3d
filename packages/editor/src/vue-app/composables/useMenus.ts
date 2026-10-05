import { inject } from 'vue';
import type { InjectionKey } from 'vue';
import type { MenuConfig } from '../../configs/CommonConfig';

/**
 * 菜单装配的**注入键**（#278 路线 B 第一批）。
 *
 * ## 为什么先拆它
 *
 * `MenuConfig` 原来以 `export const menuConfig = new MenuConfig()` 挂在模块顶层，
 * 三个 Vue 组件直接 import 它。而登记台账后发现三个单例**依赖成环**
 * （`editorRS → getEditorCache → editorAsset → editorRS`），任何"先迁一个消费方"都会被环卡住——
 * **但 `menuConfig` 是环的外沿**：它依赖 `editorRS` / `getEditorCache` / `editorAsset`，
 * 却**没被它们依赖**。所以它是"拆环"的第一个安全切口。
 *
 * ## 做法
 *
 * 把**创建**从 `CommonConfig.ts` 的模块顶层挪到入口（`vue-app/main.ts`），组件走注入。
 * 与 `useEditorRS` 同一套模式：引用面可计量、实例可替换、装配点唯一。
 */
export const menusKey: InjectionKey<MenuConfig> = Symbol('feng3d-editor:menus');

/**
 * 取菜单装配（**必须在 `setup()` 里调用**）。
 *
 * @returns 菜单装配
 * @throws 应用没有 `provide(menusKey, …)` 时抛出（装配错误不该静默——与 `useEditorRS` 同一条纪律）
 */
export function useMenus(): MenuConfig
{
    const menus = inject(menusKey);

    if (!menus)
    {
        throw new Error(
            '没有注入菜单装配：应用入口（vue-app/main.ts）应当 '
            + 'provide(menusKey, new MenuConfig())',
        );
    }

    return menus;
}
