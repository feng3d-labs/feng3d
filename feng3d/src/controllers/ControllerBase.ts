module feng3d {
    export class ControllerBase {
        protected _targetObject: Object3D;

        /**
         * 控制器基类，用于动态调整3D对象的属性
         */
        constructor(targetObject: Object3D) {
            this._targetObject = targetObject;
        }

        /**
         * 手动应用更新到目标3D对象
         */
        public update(interpolate: boolean = true): void {
            throw new Error("Abstract method");
        }

        public get targetObject(): Object3D {
            return this._targetObject;
        }

        public set targetObject(val: Object3D) {
            if (this._targetObject == val)
                return;

            this._targetObject = val;
        }
    }
}