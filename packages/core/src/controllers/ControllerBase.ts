import { Component3DEventMap } from "../component/Component3D";
import { Node3D } from "../core/Node3D";

export class ControllerBase
{
    /**
     * 控制对象
     */
    protected _targetNode: Node3D<Component3DEventMap> | undefined;

    /**
     * 控制器基类，用于动态调整3D对象的属性
     */
    constructor(node3d?: Node3D)
    {
        this.targetNode = node3d;
    }

    /**
     * 手动应用更新到目标3D对象
     */
    update(interpolate = true): void
    {
        throw new Error("Abstract method");
    }

    get targetNode()
    {
        return this._targetNode;
    }

    set targetNode(val)
    {
        this._targetNode = val;
    }
}
