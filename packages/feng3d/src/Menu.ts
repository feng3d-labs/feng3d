import { Constructor } from '@feng3d/polyfill';

/**
 * 添加组件菜单
 *
 * 在组件类上新增 @AddComponentMenu("UI/Text") 可以把该组件添加到组件菜单上。
 *
 * @param path 组件菜单中路径
 * @param componentOrder 组件菜单中组件的顺序(从低到高)。
 */
export function AddComponentMenu(path: string, componentOrder = 0)
{
    return (target: Constructor) =>
    {
        if (!menuConfig.component) menuConfig.component = [];
        menuConfig.component.push({ path, order: componentOrder, type: target.name });

        menuConfig.component.sort((a, b) =>
        {
            if (a.path < b.path) return -1;

            return 1;
        });
        menuConfig.component.sort((a, b) => a.order - b.order);
    };
}

/**
 * 菜单配置
 */
export const menuConfig: MenuConfig = {};

/**
 * 菜单配置
 */
export interface MenuConfig
{
    /**
     * 组件菜单
     */
    component?: ComponentMenu[];
}

/**
 * 菜单项
 */
export interface ComponentMenu
{
    /**
     * 菜单路径
     */
    path: string;
    /**
     * 排序
     */
    order: number;
    /**
     * 组件类型名
     */
    type: string;
}
