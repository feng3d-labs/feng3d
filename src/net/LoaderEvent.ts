module feng3d {

    /**
     * 加载事件
     * @author feng 2016-12-14
     */
    export class LoaderEvent extends Event {

        /**
         * 加载进度发生改变时调度。
         */
        public static PROGRESS = "progress";

        /**
         * 加载完成后调度。
         */
        public static COMPLETE = "complete";

        /**
         * 加载出错时调度。
         */
        public static ERROR = "error";

        /**
         * 加载类
         */
        public data: Loader;

		/**
		 * 创建一个作为参数传递给事件侦听器的 Event 对象。
		 * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 加载类
		 * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
		 */
        constructor(type: string, data: Loader = null, bubbles = false) {
            super(type, data, bubbles);
        }
    }
}