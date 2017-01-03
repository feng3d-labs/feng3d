module feng3d {

    /**
     * 3D对象事件
     */
    export class Object3DEvent extends Event {

        /**
         * 添加了子对象，当child被添加到parent中时派发冒泡事件
         */
        static ADDED: string = "added";

        /**
         * 删除了子对象，当child被parent移除时派发冒泡事件
         */
        static REMOVED: string = "removed";

        /**
         * 添加到舞台，当Object3D的scene属性被设置是由Object3D与Scene3D分别派发不冒泡事件
         */
        static ADDED_TO_SCENE: string = "addedToScene";

        /**
         * 从舞台移除，当Object3D的scene属性被清空时由Object3D与Scene3D分别派发不冒泡事件
         */
        static REMOVED_FROM_SCENE: string = "removedFromScene";

        /**
         * 事件数据
         */
        data: IObject3DEventData;

		/**
		 * 创建一个作为参数传递给事件侦听器的 Event 对象。
		 * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
		 * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
		 */
        constructor(type: string, data: IObject3DEventData = null, bubbles = false) {
            super(type, data, bubbles);
        }
    }

    /**
     * 3D对象事件数据
     */
    export interface IObject3DEventData {
        /**
         * 父容器（ADDED，REMOVED）
         */
        parent?: Object3D;
        /**
         * 子对象（ADDED，REMOVED）
         */
        child?: Object3D;
        /**
         * 3d对象（ADDED_TO_SCENE，REMOVED_FROM_SCENE）
         */
        object3d?: Object3D;
        /**
         * 场景（ADDED_TO_SCENE，REMOVED_FROM_SCENE）
         */
        scene?: Scene3D;
    }
}