namespace feng3d
{

    export type ComponentConstructor<T> = (new () => T);

    export interface GameObjectEventMap extends MouseEventMap
    {
        /**
		 * 添加子组件事件
		 */
        addedComponent: Component;
		/**
		 * 移除子组件事件
		 */
        removedComponent: Component;
        /**
         * 添加了子对象，当child被添加到parent中时派发冒泡事件
         */
        added: GameObject
        /**
         * 删除了子对象，当child被parent移除时派发冒泡事件
         */
        removed: GameObject;
        /**
         * 当GameObject的scene属性被设置是由Scene3D派发
         */
        addedToScene: GameObject;

        /**
         * 当GameObject的scene属性被清空时由Scene3D派发
         */
        removedFromScene: GameObject;
        /**
         * 场景变化
         */
        sceneChanged: GameObject

        /**
		 * 包围盒失效
		 */
        boundsInvalid: Geometry;

        /**
         * 场景矩阵变化
         */
        scenetransformChanged: Transform;
    }

    export interface GameObject
    {
        once<K extends keyof GameObjectEventMap>(type: K, listener: (event: Event<GameObjectEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof GameObjectEventMap>(type: K, data?: GameObjectEventMap[K], bubbles?: boolean);
        has<K extends keyof GameObjectEventMap>(type: K): boolean;
        on<K extends keyof GameObjectEventMap>(type: K, listener: (event: Event<GameObjectEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof GameObjectEventMap>(type?: K, listener?: (event: Event<GameObjectEventMap[K]>) => any, thisObject?: any);
    }

    /**
     * 鼠标拾取层级
     */
    export var mouselayer = {
        editor: 100
    };

    export enum GameObjectFlag
    {
        feng3d = 1,
        editor = 2,
    }

    /**
     * Base class for all entities in feng3d scenes.
     */
    export class GameObject extends Feng3dObject
    {
        readonly renderAtomic = new RenderAtomic();

        /**
         * 游戏对象池
         */
        public static pool = new Map<string, GameObject>();

        private guid: string;
        protected _children: GameObject[] = [];
        protected _scene: Scene3D | null;
        protected _parent: GameObject | null;

        /**
         * 鼠标拾取层级（优先级），拾取过程优先考虑层级再考虑深度
         */
        mouselayer: number;

        /**
         * 是否可序列化
         */
        @serialize
        serializable = true;

        /**
         * 是否显示在层级界面
         */
        showinHierarchy = true;

        /**
         * The name of the Feng3dObject.
         * Components share the same name with the game object and all attached components.
         */
        @serialize
        @oav({ component: "OAVGameObjectName" })
        name: string;

        /**
         * 是否显示
         */
        @serialize
        visible = true;

        /**
         * 自身以及子对象是否支持鼠标拾取
         */
        @serialize
        mouseEnabled = true;

        /**
         * 模型生成的导航网格类型
         */
        @serialize
        navigationArea = -1;

        /**
         * 标记
         */
        flag = GameObjectFlag.feng3d;

        /**
         * 用户自定义数据
         */
        userData: any;

        //------------------------------------------
        // Variables
        //------------------------------------------
        /**
         * The Transform attached to this GameObject. (null if there is none attached).
         */
        get transform()
        {
            if (!this._transform)
                this._transform = this.getComponent(Transform);
            return this._transform;
        }
        private _transform: Transform;

        get parent(): GameObject | null
        {
            return this._parent;
        }

        /**
         * 子对象
         */
        @serialize
        get children()
        {
            return this._children.concat();
        }

        set children(value)
        {
            if (!value) return;
            for (var i = this._children.length - 1; i >= 0; i--)
            {
                this.removeChildAt(i)
            }
            for (var i = 0; i < value.length; i++)
            {
                this.addChild(value[i]);
            }
        }

        get numChildren(): number
        {
            return this._children.length;
        }

		/**
		 * 子组件个数
		 */
        get numComponents(): number
        {
            return this._components.length;
        }

        //------------------------------------------
        // Functions
        //------------------------------------------
        /**
         * 构建3D对象
         */
        constructor(raw: gPartial<GameObject>)
        {
            super();
            this.name = raw ? raw.name : "GameObject";
            this.addComponent(Transform);
            this.addComponent(BoundingComponent);
            this.guid = FMath.generateUUID();
            serialization.setValue(this, raw);
            //
            GameObject.pool.set(this.guid, this);
        }

        find(name: string): GameObject | null
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

        contains(child: GameObject)
        {
            var checkitem: GameObject | null = child;
            do
            {
                if (checkitem == this)
                    return true;
                checkitem = checkitem.parent;
            } while (checkitem);
            return false;
        }

        addChild(child: GameObject)
        {
            if (child == null)
                return;
            if (child.contains(this))
                throw "无法添加到自身中!";
            if (child._parent)
                child._parent.removeChild(child);
            child._setParent(this);
            this._children.push(child);
            this.dispatch("added", child, true);
            return child;
        }

        addChildren(...childarray)
        {
            for (var child_key_a in childarray)
            {
                var child: GameObject = childarray[child_key_a];
                this.addChild(child);
            }
        }

        /**
         * 移除自身
         */
        remove()
        {
            if (this.parent)
                this.parent.removeChild(this);
        }

        removeChild(child: GameObject)
        {
            if (child == null)
                throw new Error("Parameter child cannot be null").message;
            var childIndex = this._children.indexOf(child);
            if (childIndex == -1)
                throw new Error("Parameter is not a child of the caller").message;
            this.removeChildInternal(childIndex, child);
        }

        removeChildAt(index: number)
        {
            var child = this._children[index];
            this.removeChildInternal(index, child);
        }

        private _setParent(value: GameObject | null)
        {
            this._parent = value;
            this.updateScene();
            this.transform["invalidateSceneTransform"]();
        }

        getChildAt(index: number)
        {
            index = index;
            return this._children[index];
        }

        get scene(): Scene3D | null
        {
            return this._scene;
        }

        private updateScene()
        {
            var newScene = this._parent ? this._parent._scene : null;
            if (this._scene == newScene)
                return;
            if (this._scene)
            {
                this.dispatch("removedFromScene", this);
                this._scene._removeGameObject(this);
            }
            this._scene = newScene;
            if (this._scene)
            {
                this.dispatch("addedToScene", this);
                this._scene._addGameObject(this);
            }
            for (let i = 0, n = this._children.length; i < n; i++)
            {
                this._children[i].updateScene();
            }
            this.dispatch("sceneChanged", this);
        }

        /**
         * 获取子对象列表（备份）
         */
        getChildren()
        {
            return this._children.concat();
        }

        private removeChildInternal(childIndex: number, child: GameObject)
        {
            childIndex = childIndex;
            this._children.splice(childIndex, 1);
            child._setParent(null);

            this.dispatch("removed", child, true);
        }

        /**
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        getComponentAt(index: number): Component
        {
            debuger && assert(index < this.numComponents, "给出索引超出范围");
            return this._components[index];
        }

		/**
		 * 添加组件
         * Adds a component class named className to the game object.
		 * @param param 被添加组件
		 */
        addComponent<T extends Component>(param: ComponentConstructor<T>, callback: (component: T) => void = null): T
        {
            var component: T = this.getComponent(param);
            if (component && component.single)
            {
                // alert(`The compnent ${param["name"]} can't be added because ${this.name} already contains the same component.`);
                return component;
            }
            component = new param();
            this.addComponentAt(component, this._components.length);
            callback && callback(component);
            return component;
        }

        /**
         * 添加脚本
         * @param script   脚本路径
         */
        addScript(script: string)
        {
            var scriptComponent = new ScriptComponent();
            scriptComponent.script = script;
            this.addComponentAt(scriptComponent, this._components.length);
            return scriptComponent;
        }

        /**
         * 判断是否拥有组件
         * @param com	被检测的组件
         * @return		true：拥有该组件；false：不拥有该组件。
         */
        private hasComponent(com: Component): boolean
        {
            return this._components.indexOf(com) != -1;
        }

        /**
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         * @param type				类定义
         * @return                  返回指定类型组件
         */
        getComponent<T extends Component>(type: ComponentConstructor<T>): T
        {
            var component = this.getComponents(type)[0];
            return component;
        }

        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponents<T extends Component>(type?: ComponentConstructor<T>): T[]
        {
            var filterResult: Component[];
            if (!type)
            {
                filterResult = this._components.concat();
            } else
            {
                filterResult = this._components.filter(function (value: Component, index: number, array: Component[]): boolean
                {
                    return value instanceof type;
                });
            }
            return <T[]>filterResult;
        }

        /**
         * Returns the component of Type type in the GameObject or any of its children using depth first search.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInChildren<T extends Component>(type?: ComponentConstructor<T>, filter?: (compnent: T) => { findchildren: boolean, value: boolean }, result?: T[]): T[]
        {
            result = result || [];
            var findchildren = true;
            for (var i = 0, n = this._components.length; i < n; i++)
            {
                var item = <T>this._components[i];
                if (!type)
                {
                    result.push(item);
                } else if (item instanceof type)
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
            return <T[]>result;
        }

        /**
         * 设置子组件的位置
         * @param component				子组件
         * @param index				位置索引
         */
        setComponentIndex(component: Component, index: number): void
        {
            debuger && assert(index >= 0 && index < this.numComponents, "给出索引超出范围");

            var oldIndex = this._components.indexOf(component);
            debuger && assert(oldIndex >= 0 && oldIndex < this.numComponents, "子组件不在容器内");

            this._components.splice(oldIndex, 1);
            this._components.splice(index, 0, component);
        }

		/**
		 * 设置组件到指定位置
		 * @param component		被设置的组件
		 * @param index			索引
		 */
        setComponentAt(component: Component, index: number)
        {
            if (this._components[index])
            {
                this.removeComponentAt(index);
            }
            this.addComponentAt(component, index);
        }

		/**
		 * 移除组件
		 * @param component 被移除组件
		 */
        removeComponent(component: Component): void
        {
            debuger && assert(this.hasComponent(component), "只能移除在容器中的组件");

            var index = this.getComponentIndex(component);
            this.removeComponentAt(index);
        }

        /**
         * 获取组件在容器的索引位置
         * @param component			查询的组件
         * @return				    组件在容器的索引位置
         */
        getComponentIndex(component: Component): number
        {
            debuger && assert(this._components.indexOf(component) != -1, "组件不在容器中");

            var index = this._components.indexOf(component);
            return index;
        }

        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        removeComponentAt(index: number): Component
        {
            debuger && assert(index >= 0 && index < this.numComponents, "给出索引超出范围");

            var component: Component = this._components.splice(index, 1)[0];
            //派发移除组件事件
            this.dispatch("removedComponent", component);
            this._scene && this._scene._removeComponent(component);
            component.dispose();
            return component;
        }

        /**
         * 交换子组件位置
         * @param index1		第一个子组件的索引位置
         * @param index2		第二个子组件的索引位置
         */
        swapComponentsAt(index1: number, index2: number): void
        {
            debuger && assert(index1 >= 0 && index1 < this.numComponents, "第一个子组件的索引位置超出范围");
            debuger && assert(index2 >= 0 && index2 < this.numComponents, "第二个子组件的索引位置超出范围");

            var temp: Component = this._components[index1];
            this._components[index1] = this._components[index2];
            this._components[index2] = temp;
        }

        /**
         * 交换子组件位置
         * @param a		第一个子组件
         * @param b		第二个子组件
         */
        swapComponents(a: Component, b: Component): void
        {
            debuger && assert(this.hasComponent(a), "第一个子组件不在容器中");
            debuger && assert(this.hasComponent(b), "第二个子组件不在容器中");

            this.swapComponentsAt(this.getComponentIndex(a), this.getComponentIndex(b));
        }

        /**
         * 移除指定类型组件
         * @param type 组件类型
         */
        removeComponentsByType<T extends Component>(type: ComponentConstructor<T>)
        {
            var removeComponents: T[] = [];
            for (var i = this._components.length - 1; i >= 0; i--)
            {
                if (this._components[i].constructor == type)
                    removeComponents.push(<T>this.removeComponentAt(i));
            }
            return removeComponents;
        }
        //------------------------------------------
        // Static Functions
        //------------------------------------------
        /**
         * Finds a game object by name and returns it.
         * @param name 
         */
        static find(name: string)
        {
            var target: GameObject | null = null;
            this.pool.forEach(element =>
            {
                if (target == null && element.name == name)
                    target = element;
            });
            return target;
        }

        static create(name = "GameObject", raw?: gPartial<GameObject>)
        {
            raw = raw || {};
            raw.name = name;
            var gameobject = new GameObject(raw);
            return gameobject;
        }

        //------------------------------------------
        // Protected Properties
        //------------------------------------------
        /**
		 * 组件列表
		 */
        protected _components: Component[] = [];
        @serialize
        @oav({ component: "OAVComponentList" })
        get components()
        {
            return this._components.concat();
        }
        set components(value)
        {
            if (!value) return;
            for (var i = 0, n = value.length; i < n; i++)
            {
                var compnent = value[i];
                if (!compnent) continue;
                if (compnent.single) this.removeComponentsByType(<any>compnent.constructor);
                this.addComponentAt(value[i], this.numComponents);
            }
            this._transform = <any>null;
        }

        //------------------------------------------
        // Protected Functions
        //------------------------------------------

        //------------------------------------------
        // Private Properties
        //------------------------------------------

        //------------------------------------------
        // Private Methods
        //------------------------------------------
		/**
		 * 添加组件到指定位置
		 * @param component		被添加的组件
		 * @param index			插入的位置
		 */
        private addComponentAt(component: Component, index: number): void
        {
            if (component == null)
                return;
            debuger && assert(index >= 0 && index <= this.numComponents, "给出索引超出范围");

            if (this.hasComponent(component))
            {
                index = Math.min(index, this._components.length - 1);
                this.setComponentIndex(component, index)
                return;
            }
            //组件唯一时移除同类型的组件
            if (component.single)
                this.removeComponentsByType(<new () => Component>component.constructor);

            this._components.splice(index, 0, component);
            component.init(this);
            //派发添加组件事件
            this.dispatch("addedComponent", component);
            this._scene && this._scene._addComponent(component);
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
            GameObject.pool.delete(this.guid);
        }

        disposeWithChildren()
        {
            this.dispose();
            while (this.numChildren > 0)
                this.getChildAt(0).dispose();
        }

        preRender(renderAtomic: RenderAtomic)
        {
            this._components.forEach(element =>
            {
                element.preRender(renderAtomic);
            });
        }
    }
}