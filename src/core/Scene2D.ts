namespace feng3d
{
    /**
     * 2D场景
     * 
     * Scene2D同时拥有Node2D与Node3D组件。
     */
    @RegisterComponent({ single: true, dependencies: [Node] })
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
    }
}