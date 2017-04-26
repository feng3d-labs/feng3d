module feng3d
{
    /**
     * 3D场景事件
     * @author feng 2016-01-03
     */
    export class Scene3DEvent extends Event
    {
        /**
         * 当Object3D的scene属性被设置是由Scene3D派发
         */
        public static ADDED_TO_SCENE: string = "addedToScene";

        /**
         * 当Object3D的scene属性被清空时由Scene3D派发
         */
        public static REMOVED_FROM_SCENE: string = "removedFromScene";

        /**
         * 事件数据
         */
        public data: ObjectContainer3D;

		/**
		 * 创建一个作为参数传递给事件侦听器的 Event 对象。
		 * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
		 * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
		 */
        constructor(type: string, data: ObjectContainer3D = null, bubbles = false)
        {
            super(type, data, bubbles);
        }
    }
}