namespace feng3d
{
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
        return (target: Constructor<Components>) =>
        {
            menuConfig.addComponent({ path: path, order: componentOrder, type: <any>target["name"] });
        }
    }

    /**
     * 添加实体菜单
     * 
     * 在创建实体函数上新增 @AddEntityMenu("3D对象/平面") 可以添加到实体菜单上。
     * 
     * @param path 菜单中路径
     * @param componentOrder 菜单中顺序(从低到高)。
     */
    export function AddEntityMenu(path: string, componentOrder = 0)
    {
        return (target: any, propertyKey: string, descriptor: PropertyDescriptor) =>
        {
            menuConfig.addEntity({ path: path, order: componentOrder, func: target[propertyKey].bind(target) });
        }
    }

    export class MenuConfig
    {
        private _componentOrderInvalid = false;

        /**
         * 组件菜单
         */
        get component()
        {
            if (this._componentOrderInvalid)
            {
                this._component.sort((a, b) => { if (a.path < b.path) return -1; return 1 })
                this._component.sort((a, b) => a.order - b.order);
                this._componentOrderInvalid = false;
            }
            return this._component;
        }
        private _component: ComponentMenu[] = [];

        /**
         * 新增组件菜单
         * @param componentMenu 
         */
        addComponent(componentMenu: ComponentMenu)
        {
            this._component.push(componentMenu);
            this._componentOrderInvalid = true;
        }

        /**
         * 实体菜单
         */
        get entity()
        {
            if (this._entityOrderInvalid)
            {
                // this._entity.sort((a, b) => { if (a.path < b.path) return -1; return 1 })
                this._entity.sort((a, b) => a.order - b.order);
                this._entityOrderInvalid = false;
            }
            return this._entity;
        }

        /**
         * 新增实体菜单
         * @param componentMenu 
         */
        addEntity(item: EntityMenu)
        {
            this._entity.push(item);
            this._entityOrderInvalid = true;
        }

        private _entity: EntityMenu[] = [];
        private _entityOrderInvalid = false;
    }

    /**
     * 菜单配置
     */
    export const menuConfig = new MenuConfig();

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
        type: ComponentNames;
    }

    export interface EntityMenu
    {
        path: string;
        order: number;
        func: () => Component;
    }
}