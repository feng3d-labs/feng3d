module feng3d {

	/**
	 * InteractiveObject3D 类是用户可以使用鼠标、键盘或其他用户输入设备与之交互的所有显示对象的抽象基类。
	 * @see		flash.display.InteractiveObject
	 * @author 	warden_feng 2014-5-5
	 */
    export abstract class InteractiveObject3D extends Object3D {
        protected _mouseEnabled: boolean = false;

		/**
		 * 调用新的 InteractiveObject3D() 构造函数会引发 ArgumentError 异常。
		 * @throws	me.feng.error.AbstractClassError
		 */
        constructor() {
            super();
        }

		/**
		 * 是否开启鼠标事件
		 */
        public get mouseEnabled(): boolean {
            return this._mouseEnabled;
        }

        public set mouseEnabled(value: boolean) {
            this._mouseEnabled = value;
        }

		/**
		 * @inheritDoc
		 */
        public dispatchEvent(event: Event): boolean {
            //处理3D鼠标事件禁用
            if (getQualifiedClassName(event) == "MouseEvent3D" && !this.mouseEnabled)
            {
                if (this.parent) {
                    return this.parent.dispatchEvent(event);
                }
                return false;
            }
            return super.dispatchEvent(event);
        }
    }
}
