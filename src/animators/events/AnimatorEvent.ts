module feng3d
{


	/**
	 * 动画事件
	 * @author feng 2014-5-27
	 */
    export class AnimatorEvent extends Event
    {
        /** 开始播放动画 */
        public static START: string = "start";

        /** 继续播放动画 */
        public static PLAY: string = "play";

        /** 停止播放动画 */
        public static STOP: string = "stop";

		/**
		 * 创建一个动画时间
		 * @param type			事件类型
		 * @param data			事件数据
		 * @param bubbles		是否冒泡
		 */
        constructor(type: string, data = null, bubbles: boolean = false)
        {
            super(type, data, bubbles);
        }
    }
}
