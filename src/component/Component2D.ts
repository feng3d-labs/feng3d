namespace feng3d
{

    export interface Component2DEventMap extends ComponentEventMap
    {
    }

    /**
     * 2D组件
     * 
     * 所有基于3D空间的组件均可继承于该组件。
     */
    @RegisterComponent({ dependencies: [Node2D] })
    export class Component2D<T extends Component2DEventMap = Component2DEventMap> extends Component<T>
    {
        /**
         * The Node2D attached to this Entity (null if there is none attached).
         * 
         * 附加到此 Entity 的 Node2D。
         */
        get node2d()
        {
            return this._entity?.getComponent(Node2D);
        }

        /**
         * Returns all components of Type type in the Entity.
         * 
         * 返回 Entity 或其任何子项中类型为 type 的所有组件。
         * 
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInChildren<T extends Components>(type?: Constructor<T>, filter?: (compnent: T) => { findchildren: boolean, value: boolean }, result?: T[]): T[]
        {
            return this.node2d.getComponentsInChildren(type, filter, result);
        }

        /**
         * 从父类中获取组件
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInParents<T extends Components>(type?: Constructor<T>, result?: T[]): T[]
        {
            return this.node2d.getComponentsInParents(type, result);
        }
    }
}