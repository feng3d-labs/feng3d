module feng3d
{
    export class ControllerBase
    {

        /**
         * 控制对象
         */
        protected _target: Transform;

        /**
         * 控制器基类，用于动态调整3D对象的属性
         */
        constructor(target: Transform)
        {
            this.target = target;
        }

        /**
         * 手动应用更新到目标3D对象
         */
        public update(interpolate: boolean = true): void
        {
            throw new Error("Abstract method");
        }

        public get target(): Transform
        {
            return this._target;
        }

        public set target(val: Transform)
        {
            this._target = val;
        }
    }
}