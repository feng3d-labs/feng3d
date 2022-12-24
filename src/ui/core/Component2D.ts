import { NodeComponent } from "../../core/core/NodeComponent";
import { Node2D, Node2DEventMap } from "./Node2D";

export class Component2D extends NodeComponent<Node2DEventMap>
{
    /**
     * 2D节点。
     */
    get node2d()
    {
        return this._entity as Node2D;
    }
}
