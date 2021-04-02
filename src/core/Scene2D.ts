namespace feng3d
{
    /**
     * 2D场景
     * 
     * Scene2D同时拥有Node2D与Node3D组件。
     */
    @RegisterComponent({ single: true, dependencies: [Node2D, Node3D] })
    @AddComponentMenu("Scene/Scene2D")
    export class Scene2D extends Component
    {
        @AddEntityMenu("Node2D/Scene2D")
        static create(name = "Scene2D")
        {
            var node2d = new Entity().addComponent(Scene2D);
            node2d.name = name;
            return node2d;
        }
        
        __class__: "feng3d.Scene2D";

        /**
         * 2D 节点
         * 
         * 拥有以下作用：
         * 1. Scene2D的根节点。
         * 1. 作为2D节点放入另一个Scene2D中的。
         */
        get node2d()
        {
            console.assert(!!this._entity);
            this._node2d = this._node2d || this._entity.getComponent(Node2D);
            console.assert(!!this._node2d);
            return this._node2d;
        }
        private _node2d: Node2D;

        /**
         * 3D 节点
         * 
         * 拥有以下作用：
         * 1. 作为3D节点放入另一个Scene3D中的。
         */
        get node3d()
        {
            console.assert(!!this._entity);
            this._node3d = this._node3d || this._entity.getComponent(Node3D);
            console.assert(!!this._node3d);
            return this._node3d;
        }
        private _node3d: Node3D;


    }
}