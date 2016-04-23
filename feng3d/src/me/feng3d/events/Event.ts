module feng3d {
	/**
	 * 自定义事件
	 * @author warden_feng 2014-5-7
	 */
    export class Event {
        private _type: string;

        private _bubbles: boolean;

        private _target: IEventDispatcher;

        private _currentTarget: IEventDispatcher;

        private _stopsPropagation: boolean;

        private _stopsImmediatePropagation: boolean;

        /**
         * 事件携带的自定义数据
         */
        public data: any;

		/**
		 * 创建一个作为参数传递给事件侦听器的 Event 对象。
		 * @param type 事件的类型，可以作为 Event.type 访问。
		 * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
		 * @param cancelable 确定是否可以取消 Event 对象。默认值为 false。
		 */
        constructor(type: string, data = null, bubbles = false, cancelable = false) {
            this._type = type;
            this._bubbles = bubbles;
            this.data = data;
        }

		/**
		 * 防止对事件流中当前节点中和所有后续节点中的事件侦听器进行处理。此方法会立即生效，并且会影响当前节点中的事件侦听器。相比之下，在当前节点中的所有事件侦听器都完成处理之前，stopPropagation() 方法不会生效。
		 */
        public stopImmediatePropagation() {
            this._stopsPropagation = this._stopsImmediatePropagation = true;
        }

		/**
		 * 防止对事件流中当前节点的后续节点中的所有事件侦听器进行处理。此方法不会影响当前节点 (currentTarget) 中的任何事件侦听器。相比之下，stopImmediatePropagation() 方法可以防止对当前节点中和后续节点中的事件侦听器进行处理。对此方法的其他调用没有任何效果。可以在事件流的任何阶段中调用此方法。
		 */
        public stopPropagation() {
            this._stopsPropagation = true;
        }

        public tostring(): string {
            return "[" + (typeof this) + " type=\"" + this._type + "\" bubbles=" + this._bubbles + "]";
        }

		/**
		 * 表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
		 */
        public get bubbles(): boolean {
            return this._bubbles;
        }

		/**
		 * 事件的类型。类型区分大小写。
		 */
        public get type(): string {
            return this._type;
        }

		/**
		 * 事件目标。
		 */
        public get target(): IEventDispatcher {
            return this._target;
        }

        public set target(value: IEventDispatcher) {
            this._currentTarget = value;
            if (this._target == null) {
                this._target = value;
            }
        }

		/**
		 * 当前正在使用某个事件侦听器处理 Event 对象的对象。
		 */
        public get currentTarget(): IEventDispatcher {
            return this._currentTarget;
        }

        get stopsImmediatePropagation(): boolean {
            return this._stopsImmediatePropagation;
        }

        get stopsPropagation(): boolean {
            return this._stopsPropagation;
        }
    }
}
