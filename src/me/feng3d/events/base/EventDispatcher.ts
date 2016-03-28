module feng3d {

	/**
	 * 为了实现非flash原生显示列表的冒泡事件，自定义事件适配器
	 * @author feng 2016-3-22
	 */
    export class EventDispatcher implements IEventDispatcher {
        _target: IEventDispatcher;
        _eventListeners: any;

        /** 冒泡属性名称为“parent” */
        public static BUBBLE_PROPERTY: string = "parent";

		/**
		 * 构建事件适配器
		 * @param target		事件适配主体
		 */
        constructor(target: IEventDispatcher = null) {
            this._target = target;
            if (this._target == null)
                this._target = this;
            this._eventListeners = {};
        }

        public addEventListener(type: string, listener: Function, priority: number = 0, useWeakReference: boolean = false): void {
            if (listener == null)
                return;

            var listeners: Function[] = this._eventListeners[type];
            if (listeners == null)
                listeners = this._eventListeners[type] = [];
            var index = listeners.indexOf(listener);
            if (index == -1) {
                listeners.push(listener);
            }
        }

        public removeEventListener(type: string, listener: Function): void {
            if (this._eventListeners) {
                var listeners: Function[] = this._eventListeners[type];
                var index: number = listeners.indexOf(listener);
                listeners.splice(index, 1);
            }
        }

        public removeEventListeners(type: string = null): void {
            if (type && this._eventListeners)
                delete this._eventListeners[type];
            else
                this._eventListeners = {};
        }

		/**
		 * @inheritDoc
		 */
        public dispatchEvent(event: Event): boolean {
            //停止事件流
            if (!event || event.stopsPropagation)
                return false;

            //设置目标
            if (!event.target)
                event.setTarget(this._target);

            //处理当前事件(目标阶段)
            var listeners: Function[] = this._eventListeners[event.type];
            if (!event.stopsImmediatePropagation) {
                listeners.forEach(listener => {
                    //设置当前目标
                    event.setCurrentTarget(this._target);
                    listener(event);
                });
            }

            //事件冒泡(冒泡阶段)
            if (event.bubbles && this.parentDispatcher) {
                this.parentDispatcher.dispatchEvent(event);
            }

            return event.stopsPropagation;
        }

        public hasEventListener(type: string): boolean {
            var listeners: any = this._eventListeners ? this._eventListeners[type] : null;
            for (var key in listeners) {
                return true;
            }
            return false;
        }

		/**
		 * 该功能暂未实现
		 * @param type
		 * @return
		 */
        public willTrigger(type: string): boolean {
            // TODO Auto Generated method stub
            return false;
        }

		/**
		 * 父事件适配器
		 */
        private get parentDispatcher(): IEventDispatcher {
            return this._target[EventDispatcher.BUBBLE_PROPERTY];
        }
    }
}
