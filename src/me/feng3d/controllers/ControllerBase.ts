module feng3d {

	/**
	 * 控制器
	 * @author feng 2014-10-10
	 */
    export abstract class ControllerBase {
        protected _autoUpdate: boolean = true;
        protected _targetObject: Entity;

		/**
		 * 创建控制器
		 * @param targetObject 被控制对象
		 */
        constructor(targetObject: Entity = null) {
            this.targetObject = targetObject;
        }

		/**
		 * 被控制对象
		 */
        public get targetObject(): Entity {
            return this._targetObject;
        }

        public set targetObject(val: Entity) {
            if (this._targetObject == val)
                return;

            if (this._targetObject && this._autoUpdate)
                this._targetObject._controller = null;

            this._targetObject = val;

            if (this._targetObject && this._autoUpdate)
                this._targetObject._controller = this;

            this.notifyUpdate();
        }

		/**
		 * 通知被控制对象更新
		 */
        protected notifyUpdate(): void {
            this.update();
            //
            if (this._targetObject && this._targetObject.implicitPartition && this._autoUpdate)
                this._targetObject.implicitPartition.markForUpdate(this._targetObject);
        }

		/**
		 * 更新被控制对象状态
		 */
        public abstract update(): void;
    }
}
