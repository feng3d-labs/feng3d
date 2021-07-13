import { RegisterComponent } from "../component/Component";
import { Entity } from "./Entity";
import { Renderable } from "./Renderable";

declare module "../component/Component"
{
    export interface ComponentMap { MeshRenderer: MeshRenderer }
}

/**
 * 网格渲染器
 */
@RegisterComponent({ name: 'MeshRenderer' })
export class MeshRenderer extends Renderable
{
    __class__: "feng3d.MeshRenderer";

    static create(name = "Mesh", callback?: (component: MeshRenderer) => void)
    {
        var entity = new Entity();
        entity.name = name;
        var meshRenderer = entity.addComponent(MeshRenderer, callback);
        return meshRenderer;
    }
}
