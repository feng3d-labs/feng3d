namespace feng3d
{
    export interface ComponentMap { MeshRenderer: MeshRenderer }

    /**
     * 网格渲染器
     */
    @RegisterComponent()
    export class MeshRenderer extends Renderable
    {
        __class__: "feng3d.MeshRenderer";

        static create(name = "Mesh", callback?: (component: MeshRenderer) => void)
        {
            var gameObject = new Entity();
            gameObject.name = name;
            var meshRenderer = gameObject.addComponent(MeshRenderer, callback);
            return meshRenderer;
        }
    }
}