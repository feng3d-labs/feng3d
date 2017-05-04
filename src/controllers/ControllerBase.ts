module feng3d
{
    export class ControllerBase
    {
        /**
         * 控制对象
         */
        protected _target: GameObject;

        /**
         * 控制器基类，用于动态调整3D对象的属性
         */
        constructor(target: GameObject)
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

        public get target(): GameObject
        {
            return this._target;
        }

        public set target(val: GameObject)
        {
            this._target = val;
        }
    }
}