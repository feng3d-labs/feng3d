namespace feng3d
{
    /**
     * 添加组件菜单
     * 
     * 在组件类上新增 @feng3d.AddComponentMenu("UI/Text") 可以把该组件添加到组件菜单上。
     * 
     * @param path 组件菜单中路径
     * @param componentOrder 组件菜单中组件的顺序(从低到高)。
     */
    export function AddComponentMenu(path: string, componentOrder = 0)
    {
        return (target: Constructor<Components>) =>
        {
            if (!menuConfig.component) menuConfig.component = [];
            var component = menuConfig.component;

            menuConfig.component.push({ path: path, order: componentOrder, type: target })
        }
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
     * 组件菜单
     */
    export interface ComponentMenu
    {
        /**
         * 组件菜单中路径
         */
        path: string;
        /**
         * 组件菜单中组件的顺序(从低到高)。
         */
        order: number;
        /**
         * 组件类定义
         */
        type: Constructor<Components>;
    }
}