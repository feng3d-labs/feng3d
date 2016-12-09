module feng3d {
    export class ControllerBase {
        protected _targetObject: GameObject;

        /**
         * 控制器基类，用于动态调整3D对象的属性
         */
        constructor(targetObject: GameObject) {
            this._targetObject = targetObject;
        }

        /**
         * 手动应用更新到目标3D对象
         */
        public update(interpolate: boolean = true): void {
            throw new Error("Abstract method");
        }

        public get targetObject(): GameObject {
            return this._targetObject;
        }

        public set targetObject(val: GameObject) {
            if (this._targetObject == val)
                return;

            this._targetObject = val;
        }
    }
}