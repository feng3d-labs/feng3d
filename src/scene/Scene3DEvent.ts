module feng3d
{

    /**
     * 3D场景事件
     * @author feng 2016-01-03
     */
    export class Scene3DEvent extends Event
    {

        /**
         * 当Object3D的scene属性被设置是由Object3D与Scene3D分别派发不冒泡事件
         */
        public static ADDED_TO_SCENE: string = "addedToScene";

        /**
         * 当Object3D的scene属性被清空时由Object3D与Scene3D分别派发不冒泡事件
         */
        public static REMOVED_FROM_SCENE: string = "removedFromScene";

        /**
         * 当拥有Light的Object3D添加到Scene3D或者Light添加到场景中的Object3D时派发不冒泡事件
         */
        public static ADDED_LIGHT_TO_SCENE: string = "addedLightToScene";

        /**
         * 当拥有Light的Object3D从Scene3D中移除或者Light从场景中的Object3D移除时派发不冒泡事件
         */
        public static REMOVED_LIGHT_FROM_SCENE: string = "removedLightFromScene";

        /**
         * 当拥有Renderer的Object3D添加到Scene3D或者Renderer添加到场景中的Object3D时派发不冒泡事件
         */
        public static ADDED_RENDERER_TO_SCENE: string = "addedRendererToScene";

        /**
         * 当拥有Renderer的Object3D从Scene3D中移除或者Renderer从场景中的Object3D移除时派发不冒泡事件
         */
        public static REMOVED_RENDERER_FROM_SCENE: string = "removedRendererFromScene";

        /**
         * 事件数据
         */
        public data: IScene3DEventData;

		/**
		 * 创建一个作为参数传递给事件侦听器的 Event 对象。
		 * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
		 * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
		 */
        constructor(type: string, data: IScene3DEventData = null, bubbles = false)
        {
            super(type, data, bubbles);
        }
    }

    /**
     * 3D对象事件数据
     */
    export interface IScene3DEventData
    {

        /**
         * 3d对象
         */
        object3d?: Object3D;

        /**
         * 场景
         */
        scene?: Scene3D;

        /**
         * 灯光
         */
        light?: Light;

        /**
         * 渲染器
         */
        renderer?: Model;
    }
}