namespace feng3d
{
    export type Constructor<T> = (new (...args) => T);

    export interface GameObjectEventMap extends NodeEventMap<GameObject>, MouseEventMap
    {
        /**
         * 当GameObject的scene属性被设置是由Scene派发
         */
        addedToScene: GameObject;

        /**
         * 当GameObject的scene属性被清空时由Scene派发
         */
        removedFromScene: GameObject;

        /**
         * 包围盒失效
         */
        boundsInvalid: Geometry;

        /**
         * 刷新界面
         */
        refreshView: any;
    }

    export interface GameObject
    {
        once<K extends keyof GameObjectEventMap>(type: K, listener: (event: Event<GameObjectEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof GameObjectEventMap>(type: K, data?: GameObjectEventMap[K], bubbles?: boolean): Event<GameObjectEventMap[K]>;
        has<K extends keyof GameObjectEventMap>(type: K): boolean;
        on<K extends keyof GameObjectEventMap>(type: K, listener: (event: Event<GameObjectEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof GameObjectEventMap>(type?: K, listener?: (event: Event<GameObjectEventMap[K]>) => any, thisObject?: any): void;

        //
        get parent(): GameObject;
        get children(): GameObject[];
        set children(v: GameObject[]);
        addChild(child: GameObject): GameObject;
        getChildAt(index: number): GameObject;
        getChildren(): GameObject[];
    }

    /**
     * 游戏对象，场景唯一存在的对象类型
     */
    export class GameObject extends Node implements IDisposable
    {
        protected _parent: GameObject;
        protected _children: GameObject[];

        __class__: "feng3d.GameObject";

        assetType = AssetType.gameobject;

        /**
         * 预设资源编号
         */
        @serialize
        prefabId: string;

        /**
         * 资源编号
         */
        @serialize
        assetId: string;

        /**
         * 名称
         */
        @serialize
        @oav({ component: "OAVGameObjectName", priority: 10000 })
        name: string;

        /**
         * 是否显示
         */
        @serialize
        get visible()
        {
            return this._visible;
        }
        set visible(v)
        {
            if (this._visible == v) return;
            this._visible = v;
            this._invalidateGlobalVisible();
        }
        private _visible = true;

        /**
         * 自身以及子对象是否支持鼠标拾取
         */
        @serialize
        mouseEnabled = true;

        //------------------------------------------
        // Variables
        //------------------------------------------

        /**
         * 变换
         */
        get transform()
        {
            const transform = this.getComponent("Transform");
            return transform;
        }

        /**
         * 轴对称包围盒
         */
        get boundingBox()
        {
            if (!this._boundingBox)
            {
                this._boundingBox = new BoundingBox(this);
            }
            return this._boundingBox;
        }
        private _boundingBox: BoundingBox;

        /**
         * 全局是否可见
         */
        get globalVisible()
        {
            if (this._globalVisibleInvalid)
            {
                this._updateGlobalVisible();
                this._globalVisibleInvalid = false;
            }
            return this._globalVisible;
        }

        get scene()
        {
            return this._scene;
        }

        //------------------------------------------
        // Functions
        //------------------------------------------
        /**
         * 构建3D对象
         */
        constructor()
        {
            super();
            this.name = "GameObject";
            this.addComponent("Transform");
        }

        /**
         * 根据名称查找对象
         * 
         * @param name 对象名称
         */
        find(name: string): GameObject
        {
            if (this.name == name)
                return this;
            for (var i = 0; i < this._children.length; i++)
            {
                var target = this._children[i].find(name);
                if (target)
                    return target;
            }
            return null;
        }

        /**
         * 添加脚本
         * @param script   脚本路径
         */
        addScript(scriptName: string)
        {
            var scriptComponent = new ScriptComponent();
            scriptComponent.scriptName = scriptName;
            this.addComponentAt(scriptComponent, this._components.length);
            return scriptComponent;
        }

        /**
         * 从自身与子代（孩子，孩子的孩子，...）游戏对象中获取所有指定类型的组件
         * 
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInChildren<T extends ComponentNames>(type?: T, filter?: (compnent: ComponentMap[T]) => { findchildren: boolean, value: boolean }, result?: ComponentMap[T][]): ComponentMap[T][]
        {
            result = result || [];
            var findchildren = true;
            var cls: any = componentMap[type];
            for (var i = 0, n = this._components.length; i < n; i++)
            {
                var item = <ComponentMap[T]>this._components[i];
                if (!cls)
                {
                    result.push(item);
                } else if (item instanceof cls)
                {
                    if (filter)
                    {
                        var filterresult = filter(item);
                        filterresult && filterresult.value && result.push(item);
                        findchildren = filterresult ? (filterresult && filterresult.findchildren) : false;
                    }
                    else
                    {
                        result.push(item);
                    }
                }
            }
            if (findchildren)
            {
                for (var i = 0, n = this.numChildren; i < n; i++)
                {
                    this.getChildAt(i).getComponentsInChildren(type, filter, result);
                }
            }
            return result;
        }

        /**
         * 从父代（父亲，父亲的父亲，...）中获取组件
         * 
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInParents<T extends ComponentNames>(type?: T, result?: ComponentMap[T][]): ComponentMap[T][]
        {
            result = result || [];
            var parent = this.parent;
            while (parent)
            {
                var compnent = parent.getComponent(type);
                compnent && result.push(compnent);
                parent = parent.parent;
            }
            return result;
        }

        /**
         * 销毁
         */
        dispose()
        {
            if (this.parent)
                this.parent.removeChild(this);
            for (var i = this._children.length - 1; i >= 0; i--)
            {
                this.removeChildAt(i);
            }
            for (var i = this._components.length - 1; i >= 0; i--)
            {
                this.removeComponentAt(i);
            }
            super.dispose();
        }

        disposeWithChildren()
        {
            this.dispose();
            while (this.numChildren > 0)
                this.getChildAt(0).dispose();
        }

        /**
         * 是否加载完成
         */
        get isSelfLoaded()
        {
            var model = this.getComponent("Renderable");
            if (model) return model.isLoaded
            return true;
        }

        /**
         * 已加载完成或者加载完成时立即调用
         * @param callback 完成回调
         */
        onSelfLoadCompleted(callback: () => void)
        {
            if (this.isSelfLoaded)
            {
                callback();
                return;
            }
            var model = this.getComponent("Renderable");
            if (model)
            {
                model.onLoadCompleted(callback);
            }
            else callback();
        }

        /**
         * 是否加载完成
         */
        get isLoaded()
        {
            if (!this.isSelfLoaded) return false;
            for (let i = 0; i < this.children.length; i++)
            {
                const element = this.children[i];
                if (!element.isLoaded) return false;
            }
            return true;
        }

        /**
         * 已加载完成或者加载完成时立即调用
         * @param callback 完成回调
         */
        onLoadCompleted(callback: () => void)
        {
            var loadingNum = 0;
            if (!this.isSelfLoaded) 
            {
                loadingNum++;
                this.onSelfLoadCompleted(() =>
                {
                    loadingNum--;
                    if (loadingNum == 0) callback();
                });
            }
            for (let i = 0; i < this.children.length; i++)
            {
                const element = this.children[i];
                if (!element.isLoaded) 
                {
                    loadingNum++;
                    element.onLoadCompleted(() =>
                    {
                        loadingNum--;
                        if (loadingNum == 0) callback();
                    });
                }
            }
            if (loadingNum == 0) callback();
        }

        //------------------------------------------
        // Static Functions
        //------------------------------------------
        /**
         * 查找指定名称的游戏对象
         * 
         * @param name 
         */
        static find(name: string)
        {
            var gameobjects = Feng3dObject.getObjects(GameObject)
            var result = gameobjects.filter(v => !v.disposed && (v.name == name));
            return result[0];
        }

        //------------------------------------------
        // Protected Properties
        //------------------------------------------
        protected _scene: Scene;
        protected _globalVisible = false;
        protected _globalVisibleInvalid = true;

        //------------------------------------------
        // Protected Functions
        //------------------------------------------

        protected _updateGlobalVisible()
        {
            var visible = this.visible;
            if (this.parent)
            {
                visible = visible && this.parent.globalVisible;
            }
            this._globalVisible = visible;
        }

        protected _invalidateGlobalVisible()
        {
            if (this._globalVisibleInvalid) return;

            this._globalVisibleInvalid = true;

            this._children.forEach(c =>
            {
                c._invalidateGlobalVisible();
            });
        }
        //------------------------------------------
        // Private Properties
        //------------------------------------------

        //------------------------------------------
        // Private Methods
        //------------------------------------------
        protected _setParent(value: GameObject | null)
        {
            super._setParent(value);
            this.updateScene();
            this.transform["_invalidateSceneTransform"]();
        }

        private updateScene()
        {
            var newScene = this._parent ? this._parent._scene : null;
            if (this._scene == newScene)
                return;
            if (this._scene)
            {
                this.dispatch("removedFromScene", this);
            }
            this._scene = newScene;
            if (this._scene)
            {
                this.dispatch("addedToScene", this);
            }
            this.updateChildrenScene();
        }

        private updateChildrenScene()
        {
            for (let i = 0, n = this._children.length; i < n; i++)
            {
                this._children[i].updateScene();
            }
        }

        /**
         * 创建指定类型的游戏对象。
         * 
         * @param type 游戏对象类型。
         * @param param 游戏对象参数。
         */
        static createPrimitive<K extends keyof PrimitiveGameObject>(type: K, param?: gPartial<GameObject>)
        {
            var g = new GameObject();
            g.name = type;

            var createHandler = this._registerPrimitives[type];
            if (createHandler != null) createHandler(g);

            serialization.setValue(g, param);
            return g;
        }

        /**
         * 注册原始游戏对象，被注册后可以使用 GameObject.createPrimitive 进行创建。
         * 
         * @param type 原始游戏对象类型。
         * @param handler 构建原始游戏对象的函数。
         */
        static registerPrimitive<K extends keyof PrimitiveGameObject>(type: K, handler: (gameObject: GameObject) => void)
        {
            if (this._registerPrimitives[type])
                console.warn(`重复注册原始游戏对象 ${type} ！`);
            this._registerPrimitives[type] = handler;
        }
        static _registerPrimitives: { [type: string]: (gameObject: GameObject) => void } = {};
    }

    /**
     * 原始游戏对象，可以通过GameObject.createPrimitive进行创建。
     */
    export interface PrimitiveGameObject
    {
    }

    // 在 Hierarchy 界面右键创建游戏
    createNodeMenu.push(
        {
            path: "3D空对象",
            click: () =>
            {
                return new feng3d.GameObject();
            }
        },
    );
}