module feng3d
{
    export class ControllerBase
    {

        /**
         * 控制对象
         */
        protected _target: Object3D;

        /**
         * 控制器基类，用于动态调整3D对象的属性
         */
        constructor(target: Object3D)
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

        public get target(): Object3D
        {
            return this._target;
        }

        public set target(val: Object3D)
        {
            this._target = val;
        }
    }
}