module feng3d
{

    /**
     * 3D场景
     * @author feng 2016-05-01
     */
    export class Scene3D extends Object3D
    {
        /**
         * 背景颜色
         */
        public background = new Color(0, 0, 0, 1);
        /**
         * 环境光强度
         */
        public ambientColor = new Color();

        private _object3Ds: Object3D[] = [];
        private _renderers: Model[] = [];
        private _lights: Light[] = [];

        private _renderContext: RenderContext;

        /**
         * 渲染列表
         */
        public get renderers()
        {
            return this._renderers;
        }

        /**
         * 灯光列表
         */
        public get lights()
        {
            return this._lights;
        }

        /**
         * 渲染环境
         */
        public get renderContext()
        {
            return this._renderContext;
        }

        /**
         * 构造3D场景
         */
        constructor()
        {
            super("root");
            this._renderContext = new RenderContext(this);
            //
            this.addEventListener(Scene3DEvent.ADDED_TO_SCENE, this.onAddedToScene, this);
            this.addEventListener(Scene3DEvent.REMOVED_FROM_SCENE, this.onRemovedFromScene, this);
            this.addEventListener(Scene3DEvent.ADDED_RENDERER_TO_SCENE, this.onAddedRendererToScene, this);
            this.addEventListener(Scene3DEvent.REMOVED_RENDERER_FROM_SCENE, this.onRemovedRendererFromScene, this);
            this.addEventListener(Scene3DEvent.ADDED_LIGHT_TO_SCENE, this.onAddedLightToScene, this);
            this.addEventListener(Scene3DEvent.REMOVED_LIGHT_FROM_SCENE, this.onRemovedLightFromScene, this);
        }

        /**
         * 处理添加对象事件
         */
        private onAddedToScene(event: Scene3DEvent)
        {
            this._object3Ds.push(event.data.object3d);
        }

        /**
         * 处理移除对象事件
         */
        private onRemovedFromScene(event: Scene3DEvent)
        {
            ArrayUtils.removeItem(this._object3Ds, event.data.object3d);
        }

        /**
         * 处理添加对象事件
         */
        private onAddedRendererToScene(event: Scene3DEvent)
        {
            this._renderers.push(event.data.renderer);
        }

        /**
         * 处理移除对象事件
         */
        private onRemovedRendererFromScene(event: Scene3DEvent)
        {
            ArrayUtils.removeItem(this._renderers, event.data.renderer);
        }

        /**
         * 处理添加灯光事件
         */
        private onAddedLightToScene(event: Scene3DEvent)
        {
            this._lights.push(event.data.light);
        }

        /**
         * 处理移除灯光事件
         */
        private onRemovedLightFromScene(event: Scene3DEvent)
        {
            ArrayUtils.removeItem(this._lights, event.data.light);
        }
    }
}