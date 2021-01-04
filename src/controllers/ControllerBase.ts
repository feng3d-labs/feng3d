
export class ControllerBase
{
    /**
     * 控制对象
     */
    protected _targetObject: GameObject | undefined;

    /**
     * 控制器基类，用于动态调整3D对象的属性
     */
    constructor(targetObject?: GameObject)
    {
        this.targetObject = targetObject;
    }

    /**
     * 手动应用更新到目标3D对象
     */
    update(interpolate = true): void
    {
        throw new Error("Abstract method");
    }

    get targetObject()
    {
        return this._targetObject;
    }

    set targetObject(val)
    {
        this._targetObject = val;
    }
}
