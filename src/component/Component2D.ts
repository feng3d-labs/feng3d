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
            return this.node as Node2D;
        }
    }
}