namespace feng3d
{
    /**
	 * 组件事件
	 */
    export interface GameObjectEventMap
    {
        addToScene: GameObject;
        removeFromScene: GameObject;
        addComponentToScene: Component;
    }

    export interface ComponentMap { Scene: Scene; }

    /**
     * 3D场景
     */
    @RegisterComponent()
    export class Scene extends Component
    {

        __class__: "feng3d.Scene";

        /**
         * 背景颜色
         */
        @serialize
        @oav()
        background = new Color4(0, 0, 0, 1);

        /**
         * 环境光强度
         */
        @serialize
        @oav()
        ambientColor = new Color4();

        /**
         * 指定所运行环境
         * 
         * 控制运行符合指定环境场景中所有 Behaviour.update 方法
         * 
         * 用于处理某些脚本只在在feng3d引擎或者编辑器中运行的问题。例如 FPSController 默认只在feng3d中运行，在编辑器模式下不会运行。
         */
        runEnvironment = RunEnvironment.feng3d;

        /**
         * 鼠标射线，在渲染时被设置
         */
        mouseRay3D: Ray3;

        /**
         * 上次渲染时用的摄像机
         */
        camera: Camera;

        init()
        {
            super.init();
            this.transform.hideFlags = this.transform.hideFlags | HideFlags.Hide;
            this.gameObject.hideFlags = this.gameObject.hideFlags | HideFlags.DontTransform;

            //
            this._gameObject["_scene"] = this;
            this._gameObject["updateChildrenScene"]();
        }

        update(interval?: number)
        {
            interval = interval || (1000 / feng3d.ticker.frameRate);

            this._mouseCheckObjects = null;
            this._models = null;
            this._visibleAndEnabledModels = null;
            this._skyBoxs = null;
            this._activeSkyBoxs = null;
            this._directionalLights = null;
            this._activeDirectionalLights = null;
            this._pointLights = null;
            this._activePointLights = null;
            this._spotLights = null;
            this._activeSpotLights = null;
            this._animations = null;
            this._activeAnimations = null;
            this._behaviours = null;
            this._activeBehaviours = null;

            // 每帧清理拾取缓存
            this._pickMap.forEach(item => item.clear());

            this.behaviours.forEach(element =>
            {
                if (element.isVisibleAndEnabled && Boolean(this.runEnvironment & element.runEnvironment))
                    element.update(interval);
            });
        }

        /**
         * 所有 Model
         */
        get models()
        {
            this._models = this._models || this.getComponentsInChildren(Renderable);
            return this._models
        }

        /**
         * 所有 可见且开启的 Model
         */
        get visibleAndEnabledModels()
        {
            return this._visibleAndEnabledModels = this._visibleAndEnabledModels || this.models.filter(i => i.isVisibleAndEnabled)
        }

        /**
         * 所有 SkyBox
         */
        get skyBoxs()
        {
            this._skyBoxs = this._skyBoxs || this.getComponentsInChildren(SkyBox);
            return this._skyBoxs;
        }

        get activeSkyBoxs()
        {
            return this._activeSkyBoxs = this._activeSkyBoxs || this.skyBoxs.filter(i => i.gameObject.activeInHierarchy);
        }

        get directionalLights()
        {
            return this._directionalLights = this._directionalLights || this.getComponentsInChildren(DirectionalLight);
        }

        get activeDirectionalLights()
        {
            return this._activeDirectionalLights = this._activeDirectionalLights || this.directionalLights.filter(i => i.isVisibleAndEnabled);
        }

        get pointLights()
        {
            return this._pointLights = this._pointLights || this.getComponentsInChildren(PointLight);
        }

        get activePointLights()
        {
            return this._activePointLights = this._activePointLights || this.pointLights.filter(i => i.isVisibleAndEnabled);
        }

        get spotLights()
        {
            return this._spotLights = this._spotLights || this.getComponentsInChildren(SpotLight);
        }

        get activeSpotLights()
        {
            return this._activeSpotLights = this._activeSpotLights || this.spotLights.filter(i => i.isVisibleAndEnabled);
        }

        get animations()
        {
            return this._animations = this._animations || this.getComponentsInChildren(Animation);
        }

        get activeAnimations()
        {
            return this._activeAnimations = this._activeAnimations || this.animations.filter(i => i.isVisibleAndEnabled);
        }

        get behaviours()
        {
            this._behaviours = this._behaviours || this.getComponentsInChildren(Behaviour);
            return this._behaviours;
        }

        get activeBehaviours()
        {
            return this._activeBehaviours = this._activeBehaviours || this.behaviours.filter(i => i.isVisibleAndEnabled);
        }

        get mouseCheckObjects()
        {
            if (this._mouseCheckObjects)
                return this._mouseCheckObjects;

            var checkList = this.gameObject.getChildren();
            this._mouseCheckObjects = [];
            var i = 0;
            //获取所有需要拾取的对象并分层存储
            while (i < checkList.length)
            {
                var checkObject = checkList[i++];
                if (checkObject.mouseEnabled)
                {
                    if (checkObject.getComponents(Renderable))
                    {
                        this._mouseCheckObjects.push(checkObject);
                    }
                    checkList = checkList.concat(checkObject.getChildren());
                }
            }
            return this._mouseCheckObjects;
        }

        /**
         * 获取拾取缓存
         * @param camera 
         */
        getPickCache(camera: Camera)
        {
            if (this._pickMap.get(camera))
                return this._pickMap.get(camera);
            var pick = new ScenePickCache(this, camera);
            this._pickMap.set(camera, pick);
            return pick;
        }

        /**
         * 获取接收光照渲染对象列表
         * @param light 
         */
        getPickByDirectionalLight(light: DirectionalLight)
        {
            var openlist = [this.gameObject];
            var targets: Renderable[] = [];
            while (openlist.length > 0)
            {
                var item = openlist.shift();
                if (!item.activeSelf) continue;
                var model = item.getComponent(Renderable);
                if (model && (model.castShadows || model.receiveShadows)
                    && !model.material.renderParams.enableBlend
                    && model.material.renderParams.renderMode == RenderMode.TRIANGLES
                )
                {
                    targets.push(model);
                }
                item.children.forEach(element =>
                {
                    openlist.push(element);
                });
            }
            return targets;
        }

        /**
         * 获取 可被摄像机看见的 Model 列表
         * @param camera 
         */
        getModelsByCamera(camera: Camera)
        {
            var frustum = camera.frustum;

            var results = this.visibleAndEnabledModels.filter(i =>
            {
                var model = i.getComponent(Renderable);
                if (model.selfWorldBounds)
                {
                    if (frustum.intersectsBox(model.selfWorldBounds))
                        return true;
                }
                return false;
            });
            return results;
        }

        //
        private _mouseCheckObjects: GameObject[];
        private _models: Renderable[];
        private _visibleAndEnabledModels: Renderable[];
        private _skyBoxs: SkyBox[];
        private _activeSkyBoxs: SkyBox[];
        private _directionalLights: DirectionalLight[];
        private _activeDirectionalLights: DirectionalLight[];
        private _pointLights: PointLight[];
        private _activePointLights: PointLight[];
        private _spotLights: SpotLight[];
        private _activeSpotLights: SpotLight[];
        private _animations: Animation[];
        private _activeAnimations: Animation[];
        private _behaviours: Behaviour[];
        private _activeBehaviours: Behaviour[];
        private _pickMap = new Map<Camera, ScenePickCache>();
    }
}