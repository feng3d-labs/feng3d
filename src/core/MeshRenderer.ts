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
    }
}