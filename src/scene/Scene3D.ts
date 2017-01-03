module feng3d {

    /**
     * 3D场景
     * @author feng 2016-05-01
     */
    export class Scene3D extends Object3D {

        private _renderables: Object3D[] = [];
        private _lights: Light[] = [];

        /**
         * 渲染列表
         */
        public get renderables() {

            return this._renderables;
        }

        /**
         * 灯光列表
         */
        public get lights() {

            return this._lights;
        }

        /**
         * 构造3D场景
         */
        constructor() {

            super("root");
            this.addEventListener(Scene3DEvent.ADDED_TO_SCENE, this.onAddedToScene, this);
            this.addEventListener(Scene3DEvent.REMOVED_FROM_SCENE, this.onRemovedFromScene, this);
            this.addEventListener(Scene3DEvent.ADDED_LIGHT_TO_SCENE, this.onAddedLightToScene, this);
            this.addEventListener(Scene3DEvent.REMOVED_LIGHT_FROM_SCENE, this.onRemovedLightFromScene, this);
        }

        /**
         * 处理添加对象事件
         */
        private onAddedToScene(event: Scene3DEvent) {

            this._renderables.push(event.data.object3d);
        }

        /**
         * 处理移除对象事件
         */
        private onRemovedFromScene(event: Scene3DEvent) {

            ArrayUtils.removeItem(this._renderables, event.data.object3d);
        }

        /**
         * 处理添加灯光事件
         */
        private onAddedLightToScene(event: Scene3DEvent) {

            this._lights.push(event.data.light);
        }

        /**
         * 处理移除灯光事件
         */
        private onRemovedLightFromScene(event: Scene3DEvent) {

            ArrayUtils.removeItem(this._lights, event.data.light);
        }
    }

    /**
     * 舞台事件
     * @author feng 2016-01-03
     */
    export class Scene3DEvent extends Event {

        /**
         * 当Object3D的scene属性被设置是由Object3D与Scene3D分别派发不冒泡事件
         */
        static ADDED_TO_SCENE: string = "addedToScene";

        /**
         * 当Object3D的scene属性被清空时由Object3D与Scene3D分别派发不冒泡事件
         */
        static REMOVED_FROM_SCENE: string = "removedFromScene";

        /**
         * 当拥有Light的Object3D添加到Scene3D或者Light添加到场景中的Object3D时派发不冒泡事件
         */
        static ADDED_LIGHT_TO_SCENE: string = "addedLightToScene";

        /**
         * 当拥有Light的Object3D从Scene3D中移除或者Light从场景中的Object3D移除时派发不冒泡事件
         */
        static REMOVED_LIGHT_FROM_SCENE: string = "removedLightFromScene";

        /**
         * 事件数据
         */
        data: IScene3DEventData;

		/**
		 * 创建一个作为参数传递给事件侦听器的 Event 对象。
		 * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
		 * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
		 */
        constructor(type: string, data: IScene3DEventData = null, bubbles = false) {
            super(type, data, bubbles);
        }
    }

    /**
     * 3D对象事件数据
     */
    export interface IScene3DEventData {

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
    }
}