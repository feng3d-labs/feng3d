namespace feng3d
{
    export class ControllerBase
    {
        /**
         * 控制对象
         */
        protected _targetObject: Transform | undefined;

        /**
         * 控制器基类，用于动态调整3D对象的属性
         */
        constructor(transform?: Transform)
        {
            this.targetObject = transform;
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
}