namespace feng3d
{

    export interface Component3DEventMap extends ComponentEventMap, MouseEventMap
    {
    }

    export interface Component3D
    {
        once<K extends keyof Component3DEventMap>(type: K, listener: (event: Event<Component3DEventMap[K]>) => void, thisObject?: any, priority?: number): this;
        emit<K extends keyof Component3DEventMap>(type: K, data?: Component3DEventMap[K], bubbles?: boolean): Event<Component3DEventMap[K]>;
        has<K extends keyof Component3DEventMap>(type: K): boolean;
        on<K extends keyof Component3DEventMap>(type: K, listener: (event: Event<Component3DEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): this;
        off<K extends keyof Component3DEventMap>(type?: K, listener?: (event: Event<Component3DEventMap[K]>) => any, thisObject?: any): this;
    }

    /**
     * 3D组件
     * GameObject必须拥有Transform组件的
     */
    export class Component3D extends Component
    {
        /**
         * The Transform attached to this Entity (null if there is none attached).
         */
        get node3d()
        {
            return this._entity?.getComponent("Node3D");
        }

        /**
         * Returns all components of Type type in the Entity.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInChildren<T extends ComponentNames>(type?: T, filter?: (compnent: ComponentMap[T]) => { findchildren: boolean, value: boolean }, result?: ComponentMap[T][]): ComponentMap[T][]
        {
            return this.node3d.getComponentsInChildren(type, filter, result);
        }

        /**
         * 从父类中获取组件
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInParents<T extends ComponentNames>(type?: T, result?: ComponentMap[T][]): ComponentMap[T][]
        {
            return this.node3d.getComponentsInParents(type, result);
        }
    }
}