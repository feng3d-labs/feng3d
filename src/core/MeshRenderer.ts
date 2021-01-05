import { Renderable } from "./Renderable";
import { RegisterComponent } from "../component/Component";

/**
 * 网格渲染器
 */
@RegisterComponent()
export class MeshRenderer extends Renderable
{
    __class__: "feng3d.MeshRenderer";
}
