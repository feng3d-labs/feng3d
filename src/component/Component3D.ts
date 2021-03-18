namespace feng3d
{

    export interface Component3DEventMap extends ComponentEventMap, MouseEventMap
    {
    }

    /**
     * 3D组件
     * GameObject必须拥有Transform组件的
     */
    @RegisterComponent({ dependencies: [Node3D] })
    export class Component3D<T extends Component3DEventMap = Component3DEventMap> extends Component<T>
    {
        /**
         * The Transform attached to this Entity (null if there is none attached).
         */
        get node3d()
        {
            return this._entity?.getComponent(Node3D);
        }

        /**
         * Returns all components of Type type in the Entity.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInChildren<T extends Components>(type?: Constructor<T>, filter?: (compnent: T) => { findchildren: boolean, value: boolean }, result?: T[]): T[]
        {
            return this.node3d.getComponentsInChildren(type, filter, result);
        }

        /**
         * 从父类中获取组件
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInParents<T extends Components>(type?: Constructor<T>, result?: T[]): T[]
        {
            return this.node3d.getComponentsInParents(type, result);
        }
    }
}