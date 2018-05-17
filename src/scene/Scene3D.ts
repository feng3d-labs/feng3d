namespace feng3d
{
    /**
	 * 组件事件
	 */
    export interface Scene3DEventMap
    {
        addToScene: GameObject;
        removeFromScene: GameObject;
        addComponentToScene: Component;
        removeComponentFromScene: Component;
    }

    export interface Scene3D
    {
        once<K extends keyof Scene3DEventMap>(type: K, listener: (event: Event<Scene3DEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof Scene3DEventMap>(type: K, data?: Scene3DEventMap[K], bubbles?: boolean);
        has<K extends keyof Scene3DEventMap>(type: K): boolean;
        on<K extends keyof Scene3DEventMap>(type: K, listener: (event: Event<Scene3DEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof Scene3DEventMap>(type?: K, listener?: (event: Event<Scene3DEventMap[K]>) => any, thisObject?: any);
    }

    /**
     * 3D场景
     * @author feng 2016-05-01
     */
    export class Scene3D extends Component
    {
        /**
         * 是否编辑器模式
         */
        iseditor = false;
        /**W
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
         * 指定更新脚本标记，用于过滤需要调用update的脚本
         */
        updateScriptFlag = ScriptFlag.feng3d;

        /**
         * 收集组件
         */
        collectComponents: {
            cameras: {
                cls: typeof Camera;
                list: Camera[];
            };
            pointLights: {
                cls: typeof PointLight;
                list: PointLight[];
            };
            directionalLights: {
                cls: typeof DirectionalLight;
                list: DirectionalLight[];
            };
            skyboxs: {
                cls: typeof SkyBox;
                list: SkyBox[];
            };
            animations: {
                cls: typeof Animation;
                list: Animation[];
            };
            scripts: {
                cls: typeof ScriptComponent;
                list: ScriptComponent[];
            };
            behaviours: {
                cls: typeof Behaviour;
                list: Behaviour[];
            };
        };

        _mouseCheckObjects: { layer: number, objects: GameObject[] }[];

        /**
         * 构造3D场景
         */
        init(gameObject: GameObject)
        {
            super.init(gameObject);
            gameObject["_scene"] = this;
            this.transform.showInInspector = false;

            ticker.onframe(this.onEnterFrame, this)

            this.initCollectComponents();
        }

        dispose()
        {
            ticker.offframe(this.onEnterFrame, this)
            super.dispose();
        }

        initCollectComponents()
        {
            this.collectComponents = {
                cameras: { cls: Camera, list: new Array<Camera>() },
                pointLights: { cls: PointLight, list: new Array<PointLight>() },
                directionalLights: { cls: DirectionalLight, list: new Array<DirectionalLight>() },
                skyboxs: { cls: SkyBox, list: new Array<SkyBox>() },
                animations: { cls: Animation, list: new Array<Animation>() },
                behaviours: { cls: Behaviour, list: new Array<Behaviour>() },
                scripts: { cls: ScriptComponent, list: new Array<ScriptComponent>() },
            };
            var _this = this;
            collect(this.gameObject);

            function collect(gameobject: GameObject)
            {
                gameobject["_scene"] = _this;
                _this._addGameObject(gameobject);

                gameobject.children.forEach(element =>
                {
                    collect(element);
                });
            }
        }

        private onEnterFrame(interval: number)
        {
            this.collectComponents.animations.list.forEach(element =>
            {
                if (element.isplaying)
                    element.update(interval);
            });
            this.collectComponents.behaviours.list.forEach(element =>
            {
                if (element.isVisibleAndEnabled && (this.updateScriptFlag & element.flag))
                    element.update(interval);
            });
        }

        update()
        {
            this._mouseCheckObjects = <any>null;
        }

        get mouseCheckObjects()
        {
            if (this._mouseCheckObjects)
                return this._mouseCheckObjects;

            var checkList = this.gameObject.getChildren();
            var layers: { [mouselayer: number]: GameObject[] } = {};
            var i = 0;
            //获取所有需要拾取的对象并分层存储
            while (i < checkList.length)
            {
                var checkObject = checkList[i++];
                if (checkObject.mouseEnabled)
                {
                    if (checkObject.getComponents(MeshRenderer))
                    {
                        var mouselayer = ~~checkObject.mouselayer;
                        layers[mouselayer] = layers[mouselayer] || [];
                        layers[mouselayer].push(checkObject);
                    }
                    checkList = checkList.concat(checkObject.getChildren());
                }
            }
            //获取分层数组
            this._mouseCheckObjects = [];
            var results = this._mouseCheckObjects;
            for (var layer in layers)
            {
                if (layers.hasOwnProperty(layer))
                {
                    results.push({ layer: ~~layer, objects: layers[layer] });
                }
            }
            //按层级排序
            results = results.sort((a, b) => { return b.layer - a.layer; });
            return results;
        }

        _addGameObject(gameobject: GameObject)
        {
            gameobject.components.forEach(element =>
            {
                this._addComponent(element);
            });
            this.dispatch("addToScene", gameobject);
        }

        _removeGameObject(gameobject: GameObject)
        {
            gameobject.components.forEach(element =>
            {
                this._removeComponent(element);
            });

            this.dispatch("removeFromScene", gameobject);
        }

        _addComponent(component: Component)
        {
            var collectComponents = this.collectComponents;
            for (var key in collectComponents)
            {
                if (collectComponents.hasOwnProperty(key))
                {
                    var element: {
                        cls: typeof Component;
                        list: Component[];
                    } = collectComponents[key];
                    if (component instanceof element.cls)
                    {
                        element.list.push(component);
                    }
                }
            }
            this.dispatch("addComponentToScene", component);
        }

        _removeComponent(component: Component)
        {
            var collectComponents = this.collectComponents;
            for (var key in collectComponents)
            {
                if (collectComponents.hasOwnProperty(key))
                {
                    var element: {
                        cls: typeof Component;
                        list: Component[];
                    } = collectComponents[key];
                    if (component instanceof element.cls)
                    {
                        var index = element.list.indexOf(component);
                        if (index != -1)
                            element.list.splice(index, 1);
                    }
                }
            }
            this.dispatch("removeComponentFromScene", component);
        }
    }
}