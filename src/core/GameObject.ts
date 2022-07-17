namespace feng3d
{
    export type Constructor<T> = (new (...args) => T);

    export interface GameObjectEventMap extends MouseEventMap
    {
        /**
         * 添加子组件事件
         */
        addComponent: { gameobject: GameObject, component: Component };

        /**
         * 移除子组件事件
         */
        removeComponent: { gameobject: GameObject, component: Component };

        /**
         * 添加了子对象，当child被添加到parent中时派发冒泡事件
         */
        addChild: { parent: GameObject, child: GameObject }
        /**
         * 删除了子对象，当child被parent移除时派发冒泡事件
         */
        removeChild: { parent: GameObject, child: GameObject };

        /**
         * 自身被添加到父对象中事件
         */
        added: { parent: GameObject };

        /**
         * 自身从父对象中移除事件
         */
        removed: { parent: GameObject };

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
        once<K extends keyof GameObjectEventMap>(type: K, listener: (event: IEvent<GameObjectEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        emit<K extends keyof GameObjectEventMap>(type: K, data?: GameObjectEventMap[K], bubbles?: boolean): IEvent<GameObjectEventMap[K]>;
        has<K extends keyof GameObjectEventMap>(type: K): boolean;
        on<K extends keyof GameObjectEventMap>(type: K, listener: (event: IEvent<GameObjectEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof GameObjectEventMap>(type?: K, listener?: (event: IEvent<GameObjectEventMap[K]>) => any, thisObject?: any): void;

    }

    /**
     * 游戏对象，场景唯一存在的对象类型
     */
    export class GameObject extends Feng3dObject implements IDisposable
    {
        __class__: "feng3d.GameObject";

        assetType = AssetType.gameobject;

        /**
         * 名称
         */
        @serialize
        @oav({ component: "OAVGameObjectName" })
        name: string;

        /**
         * The local active state of this GameObject.
         * 
         * This returns the local active state of this GameObject. Note that a GameObject may be inactive because a parent is not active, even if this returns true. This state will then be used once all parents are active. Use GameObject.activeInHierarchy if you want to check if the GameObject is actually treated as active in the Scene.
         */
        @serialize
        get activeSelf()
        {
            return this._activeSelf;
        }
        set activeSelf(v)
        {
            if (this._activeSelf == v) return;
            this._activeSelf = v;
            this._invalidateActiveInHierarchy();
        }
        private _activeSelf = true;

        /**
         * Defines whether the GameObject is active in the Scene.
         * 
         * This lets you know whether a GameObject is active in the game. That is the case if its GameObject.activeSelf property is enabled, as well as that of all its parents.
         */
        get activeInHierarchy()
        {
            if (this._activeInHierarchyInvalid)
            {
                this._updateActiveInHierarchy();
                this._activeInHierarchyInvalid = false;
            }
            return this._activeInHierarchy;
        }

        /**
         * The tag of this game object.
         */
        @serialize
        tag: string;

        /**
         * 自身以及子对象是否支持鼠标拾取
         */
        @serialize
        mouseEnabled = true;

        /**
         * 组件列表
         */
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
                var component = value[i];
                if (!component) continue;
                if (component.single) this.removeComponentsByType(<any>component.constructor);
                this.addComponentAt(value[i], this.numComponents);
            }
        }
        protected _components: Components[] = [];

        /**
         * 子组件个数
         */
        get numComponents()
        {
            return this._components.length;
        }

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

        //------------------------------------------
        // Variables
        //------------------------------------------

        /**
         * The Transform attached to this GameObject.
         */
        get transform()
        {
            const transform = this.getComponent(Transform);
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

        get scene()
        {
            return this._scene;
        }

        protected _parent: GameObject;
        protected _children: GameObject[] = [];

        get parent()
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

        get numChildren()
        {
            return this._children.length;
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
            this.addComponent(Transform);

            this.onAny(this._onAnyListener, this);
        }

        /**
         * Activates/Deactivates the GameObject, depending on the given true or false value.
         * 
         * A GameObject may be inactive because a parent is not active. In that case, calling SetActive will not activate it, but only set the local state of the GameObject, which you can check using GameObject.activeSelf. Unity can then use this state when all parents become active.
         * 
         * @param value Activate or deactivate the object, where true activates the GameObject and false deactivates the GameObject.
         */
        setActive(value: boolean)
        {
            this.activeSelf = value;
        }

        /**
         * Adds a component class of type componentType to the game object.
         *
         * @param type A component class of type.
         * @returns The component that is added.
         */
        /**
         * 添加一个类型为`type`的组件到游戏对象。
         *
         * @param type 组件类定义。
         * @returns 被添加的组件。
         */
        addComponent<T extends Component>(type: Constructor<T>): T
        {
            let component = this.getComponent(type);
            if (component && Component.isSingleComponent(type))
            {
                // alert(`The compnent ${param["name"]} can't be added because ${this.name} already contains the same component.`);
                return component;
            }
            const dependencies = Component.getDependencies(type);
            // 先添加依赖
            dependencies.forEach((dependency) =>
            {
                this.addComponent(dependency);
            });
            //
            component = new type();
            this.addComponentAt(component, this._components.length);

            return component;
        }

        /**
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         *
         * Using gameObject.GetComponent will return the first component that is found. If you expect there to be more than one component of the
         * same type, use gameObject.GetComponents instead, and cycle through the returned components testing for some unique property.
         *
         * @param type The type of Component to retrieve.
         * @returns The component to retrieve.
         */
        /**
         * 返回游戏对象附加的一个指定类型的组件，如果没有，则返回 null。
         *
         * 使用 gameObject.GetComponent 将返回找到的第一个组件。如果您希望有多个相同类型的组件，请改用 gameObject.GetComponents，并循环通过返回的组件测试某些唯一属性。
         *
         * @param type 要检索的组件类型。
         * @returns 要检索的组件。
         */
        getComponent<T extends Component>(type: Constructor<T>): T
        {
            for (let i = 0; i < this._components.length; i++)
            {
                if (this._components[i] instanceof type)
                {
                    return this._components[i] as T;
                }
            }

            return null;
        }

        /**
         * Returns the component of Type type in the GameObject or any of its children using depth first search.
         *
         * @param type The type of Component to retrieve.
         * @param includeInactive Should Components on inactive GameObjects be included in the found set?
         * @returns A component of the matching type, if found.
         */
        /**
         * 使用深度优先搜索返回 GameObject 或其任何子项中的 Type 组件。
         *
         * @param type 要检索的组件类型。
         * @param includeInactive 是否包含不活跃组件。
         * @returns 匹配类型的组件（如果找到）。
         */
        getComponentInChildren<T extends Component>(type: Constructor<T>, includeInactive = false): T
        {
            const component = this.getComponent(type);
            if (component)
            {
                return component;
            }

            for (let i = 0; i < this.numChildren; i++)
            {
                const gameObject = this.children[i];
                if (!includeInactive && !gameObject.activeSelf) continue;
                const compnent = gameObject.getComponentInChildren(type, includeInactive);
                if (compnent)
                {
                    return compnent;
                }
            }

            return null;
        }

        /**
         * Retrieves the component of Type type in the GameObject or any of its parents.
         *
         * This method recurses upwards until it finds a GameObject with a matching component. Only components on active GameObjects are matched.
         *
         * @param type Type of component to find.
         * @param includeInactive Should Components on inactive GameObjects be included in the found set?
         * @returns Returns a component if a component matching the type is found. Returns null otherwise.
         */
        /**
         * 检索GameObject或其任何父项type中的 Type 组件。
         *
         * 此方法向上递归，直到找到具有匹配组件的 GameObject。仅匹配活动游戏对象上的组件。
         *
         * @param type 要查找的组件类型。
         * @param includeInactive 是否包含不活跃组件。
         * @returns 如果找到与类型匹配的组件，则返回一个组件。否则返回 null。
         */
        getComponentInParent<T extends Component>(type: Constructor<T>, includeInactive = false): T
        {
            if (includeInactive || this.activeSelf)
            {
                const component = this.getComponent(type);
                if (component)
                {
                    return component;
                }
            }

            if (this.parent)
            {
                const component = this.parent.getComponentInParent(type, includeInactive);
                if (component)
                {
                    return component;
                }
            }

            return null;
        }

        /**
         * Returns all components of Type `type` in the GameObject.
         *
         * @param type The type of component to retrieve.
         * @param results List to receive the results.
         * @returns all components of Type type in the GameObject.
         */
        /**
         * 返回GameObject中指定类型的所有组件。
         *
         * @param type 要检索的组件类型。
         * @param results 列出接收找到的组件。
         * @returns GameObject中指定类型的所有组件。
         */
        getComponents<T extends Component = Component>(type?: Constructor<T>, results: T[] = []): T[]
        {
            for (let i = 0; i < this._components.length; i++)
            {
                const component = this._components[i];
                if (!type || component instanceof type)
                {
                    results.push(component as any);
                }
            }

            return results;
        }

        /**
         * Returns all components of Type type in the GameObject or any of its children children using depth first search. Works recursively.
         *
         * Unity searches for components recursively on child GameObjects. This means that it also includes all the child GameObjects of the target GameObject, and all subsequent child GameObjects.
         *
         * @param type The type of Component to retrieve.
         * @param includeInactive Should Components on inactive GameObjects be included in the found set?
         * @param results List to receive found Components.
         * @returns All found Components.
         */
        /**
         * 使用深度优先搜索返回 GameObject 或其任何子子项中 Type 的所有组件。递归工作。
         *
         * Unity 在子游戏对象上递归搜索组件。这意味着它还包括目标 GameObject 的所有子 GameObject，以及所有后续子 GameObject。
         *
         * @param type 要检索的组件类型。
         * @param includeInactive 非活动游戏对象上的组件是否应该包含在搜索结果中？
         * @param results 列出接收找到的组件。
         * @returns 所有找到的组件。
         */
        getComponentsInChildren<T extends Component>(type?: Constructor<T>, includeInactive = false, results: T[] = []): T[]
        {
            this.getComponents(type, results);

            for (let i = 0; i < this.children.length; i++)
            {
                const gameObject = this.children[i];
                if (!includeInactive && !gameObject.activeSelf) continue;
                gameObject.getComponentsInChildren(type, includeInactive, results);
            }

            return results;
        }

        /**
         * Returns all components of Type type in the GameObject or any of its parents.
         *
         * @param type The type of Component to retrieve.
         * @param includeInactive Should inactive Components be included in the found set?
         * @param results List holding the found Components.
         * @returns All components of Type type in the GameObject or any of its parents.
         */
        /**
         * 返回GameObject或其任何父级中指定的所有组件。
         *
         * @param type 要检索的组件类型。
         * @param includeInactive 非活动组件是否应该包含在搜索结果中？
         * @param results 列出找到的组件。
         * @returns GameObject或其任何父级中指定的所有组件。
         */
        getComponentsInParent<T extends Component>(type?: Constructor<T>, includeInactive = false, results: T[] = []): T[]
        {
            if (includeInactive || this.activeSelf)
            {
                this.getComponents(type, results);
            }

            if (this.parent)
            {
                this.parent.getComponentsInParent(type, includeInactive, results);
            }

            return results;
        }

        /**
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        getComponentAt(index: number): Component
        {
            console.assert(index < this.numComponents, "给出索引超出范围");
            return this._components[index];
        }

        /**
         * 设置子组件的位置
         * @param component				子组件
         * @param index				位置索引
         */
        setComponentIndex(component: Components, index: number): void
        {
            console.assert(index >= 0 && index < this.numComponents, "给出索引超出范围");

            var oldIndex = this._components.indexOf(component);
            console.assert(oldIndex >= 0 && oldIndex < this.numComponents, "子组件不在容器内");

            this._components.splice(oldIndex, 1);
            this._components.splice(index, 0, component);
        }

        /**
         * 设置组件到指定位置
         * @param component		被设置的组件
         * @param index			索引
         */
        setComponentAt(component: Components, index: number)
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
        removeComponent(component: Components): void
        {
            console.assert(this.hasComponent(component), "只能移除在容器中的组件");

            var index = this.getComponentIndex(component);
            this.removeComponentAt(index);
        }

        /**
         * 获取组件在容器的索引位置
         * @param component			查询的组件
         * @return				    组件在容器的索引位置
         */
        getComponentIndex(component: Components): number
        {
            console.assert(this._components.indexOf(component) != -1, "组件不在容器中");

            var index = this._components.indexOf(component);
            return index;
        }

        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        removeComponentAt(index: number): Component
        {
            console.assert(index >= 0 && index < this.numComponents, "给出索引超出范围");

            var component: Component = this._components.splice(index, 1)[0];
            //派发移除组件事件
            this.emit("removeComponent", { component: component, gameobject: this as any }, true);
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
            console.assert(index1 >= 0 && index1 < this.numComponents, "第一个子组件的索引位置超出范围");
            console.assert(index2 >= 0 && index2 < this.numComponents, "第二个子组件的索引位置超出范围");

            var temp: Components = this._components[index1];
            this._components[index1] = this._components[index2];
            this._components[index2] = temp;
        }

        /**
         * 交换子组件位置
         * @param a		第一个子组件
         * @param b		第二个子组件
         */
        swapComponents(a: Components, b: Components): void
        {
            console.assert(this.hasComponent(a), "第一个子组件不在容器中");
            console.assert(this.hasComponent(b), "第二个子组件不在容器中");

            this.swapComponentsAt(this.getComponentIndex(a), this.getComponentIndex(b));
        }

        /**
         * 移除指定类型组件
         * @param type 组件类型
         */
        removeComponentsByType<T extends Components>(type: Constructor<T>)
        {
            var removeComponents: T[] = [];
            for (var i = this._components.length - 1; i >= 0; i--)
            {
                if (this._components[i].constructor == type)
                    removeComponents.push(<T>this.removeComponentAt(i));
            }
            return removeComponents;
        }

        /**
         * 监听对象的所有事件并且传播到所有组件中
         */
        private _onAnyListener(e: IEvent<any>)
        {
            this.components.forEach(element =>
            {
                element.emitEvent(e);
            });
        }

        /**
         * 判断是否拥有组件
         * @param com	被检测的组件
         * @return		true：拥有该组件；false：不拥有该组件。
         */
        private hasComponent(com: Components): boolean
        {
            return this._components.indexOf(com) != -1;
        }

        /**
         * 添加组件到指定位置
         * @param component		被添加的组件
         * @param index			插入的位置
         */
        protected addComponentAt(component: Components, index: number): void
        {
            if (component == null)
                return;
            console.assert(index >= 0 && index <= this.numComponents, "给出索引超出范围");

            if (this.hasComponent(component))
            {
                index = Math.min(index, this._components.length - 1);
                this.setComponentIndex(component, index)
                return;
            }
            //组件唯一时移除同类型的组件
            if (component.single)
                this.removeComponentsByType(<Constructor<Components>>component.constructor);

            this._components.splice(index, 0, component);
            component.setGameObject(this as any);
            component.init();
            //派发添加组件事件
            this.emit("addComponent", { component: component, gameobject: this as any }, true);
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
         * 是否包含指定对象
         * 
         * @param child 可能的子孙对象
         */
        contains(child: GameObject)
        {
            var checkitem = child;
            do
            {
                if (checkitem == this)
                    return true;
                checkitem = checkitem.parent;
            } while (checkitem);
            return false;
        }

        /**
         * 添加子对象
         * 
         * @param child 子对象
         */
        addChild(child: GameObject)
        {
            if (child == null)
                return;
            if (child.parent == this)
            {
                // 把子对象移动到最后
                var childIndex = this._children.indexOf(child);
                if (childIndex != -1) this._children.splice(childIndex, 1);
                this._children.push(child);
            } else
            {
                if (child.contains(this))
                {
                    console.error("无法添加到自身中!");
                    return;
                }
                if (child._parent) child._parent.removeChild(child);
                child._setParent(this);
                this._children.push(child);
                child.emit("added", { parent: this });
                this.emit("addChild", { child: child, parent: this }, true);
            }
            return child;
        }

        /**
         * 添加子对象
         * 
         * @param childarray 子对象
         */
        addChildren(...childarray: GameObject[])
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
            if (this.parent) this.parent.removeChild(this);
        }

        /**
         * 移除所有子对象
         */
        removeChildren()
        {
            for (let i = this.numChildren - 1; i >= 0; i--)
            {
                this.removeChildAt(i);
            }
        }

        /**
         * 移除子对象
         * 
         * @param child 子对象
         */
        removeChild(child: GameObject)
        {
            if (child == null) return;
            var childIndex = this._children.indexOf(child);
            if (childIndex != -1) this.removeChildInternal(childIndex, child);
        }

        /**
         * 删除指定位置的子对象
         * 
         * @param index 需要删除子对象的所有
         */
        removeChildAt(index: number)
        {
            var child = this._children[index];
            return this.removeChildInternal(index, child);
        }

        /**
         * 获取指定位置的子对象
         * 
         * @param index 
         */
        getChildAt(index: number)
        {
            index = index;
            return this._children[index];
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

            child.emit("removed", { parent: this as any });
            this.emit("removeChild", { child: child, parent: this as any }, true);
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
            var model = this.getComponent(Renderable);
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
            var model = this.getComponent(Renderable);
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

        protected _scene: Scene;
        protected _activeInHierarchy = false;
        protected _activeInHierarchyInvalid = true;

        protected _updateActiveInHierarchy()
        {
            var activeSelf = this.activeSelf;
            if (this.parent)
            {
                activeSelf = activeSelf && this.parent.activeInHierarchy;
            }
            this._activeInHierarchy = activeSelf;
        }

        protected _invalidateActiveInHierarchy()
        {
            if (this._activeInHierarchyInvalid) return;

            this._activeInHierarchyInvalid = true;

            this._children.forEach(c =>
            {
                c._invalidateActiveInHierarchy();
            });
        }

        protected _setParent(value: GameObject | null)
        {
            this._parent = value;
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
                this.emit("removedFromScene", this);
            }
            this._scene = newScene;
            if (this._scene)
            {
                this.emit("addedToScene", this);
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
            path: "Create Empty",
            click: () =>
            {
                return new feng3d.GameObject();
            }
        },
    );
}