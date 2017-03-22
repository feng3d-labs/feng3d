module feng3d
{
	/**
	 * 事件
	 * @author feng 2014-5-7
	 */
    export class Event
    {

        /**
         * [广播事件] 进入新的一帧,监听此事件将会在下一帧开始时触发一次回调。这是一个广播事件，可以在任何一个显示对象上监听，无论它是否在显示列表中。
         */
        public static ENTER_FRAME: "enterFrame" = "enterFrame";
        /**
         * 发生变化时派发
         */
        public static CHANGE: "change" = "change";
        /**
         * 加载完成时派发
         */
        public static LOADED: "loaded" = "loaded";

        private _type: string;

        private _bubbles: boolean;

        private _target: IEventDispatcher;

        private _currentTarget: IEventDispatcher;

        private _isStopBubbles: boolean;

        private _isStop: boolean;

        /**
         * 事件携带的自定义数据
         */
        public data: any;

		/**
		 * 创建一个作为参数传递给事件侦听器的 Event 对象。
		 * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
		 * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
		 */
        constructor(type: string, data = null, bubbles = false)
        {
            this._type = type;
            this._bubbles = bubbles;
            this.data = data;
        }

        /**
         * 是否停止处理事件监听器
         */
        get isStop(): boolean
        {
            return this._isStop;
        }

        set isStop(value: boolean)
        {
            this._isStopBubbles = this._isStop = this._isStopBubbles || value;
        }

        /**
         * 是否停止冒泡
         */
        get isStopBubbles(): boolean
        {
            return this._isStopBubbles;
        }

        set isStopBubbles(value: boolean)
        {
            this._isStopBubbles = this._isStopBubbles || value;
        }

        public tostring(): string
        {
            return "[" + (typeof this) + " type=\"" + this._type + "\" bubbles=" + this._bubbles + "]";
        }

		/**
		 * 表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
		 */
        public get bubbles(): boolean
        {
            return this._bubbles;
        }

		/**
		 * 事件的类型。类型区分大小写。
		 */
        public get type(): string
        {
            return this._type;
        }

		/**
		 * 事件目标。
		 */
        public get target(): IEventDispatcher
        {
            return this._target;
        }

        public set target(value: IEventDispatcher)
        {
            this._currentTarget = value;
            if (this._target == null)
            {
                this._target = value;
            }
        }

		/**
		 * 当前正在使用某个事件侦听器处理 Event 对象的对象。
		 */
        public get currentTarget(): IEventDispatcher
        {
            return this._currentTarget;
        }
    }
}
