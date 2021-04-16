namespace feng3d
{

    export interface Component3DEventMap extends ComponentEventMap, MouseEventMap
    {
    }

    /**
     * 3D组件
     * 
     * 所有基于3D空间的组件均可继承于该组件。
     */
    @RegisterComponent({ dependencies: [Node3D] })
    export class Component3D<T extends Component3DEventMap = Component3DEventMap> extends Component<T>
    {
        /**
         * The Node3D attached to this Entity (null if there is none attached).
         * 
         * 附加到此 Entity 的 Node3D。
         */
        get node3d()
        {
            return this.node as Node3D;
        }
    }
}