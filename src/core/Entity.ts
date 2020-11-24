namespace feng3d
{
    // export type Constructor<T> = (new (...args) => T);

    export interface EntityEventMap
    {
        /**
		 * 添加子组件事件
		 */
        addComponent: { gameobject: Entity, component: Component };
		/**
		 * 移除子组件事件
		 */
        removeComponent: { gameobject: Entity, component: Component };
    }

    export interface Entity
    {
        once<K extends keyof EntityEventMap>(type: K, listener: (event: Event<EntityEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof EntityEventMap>(type: K, data?: EntityEventMap[K], bubbles?: boolean): Event<GameObjectEventMap[K]>;
        has<K extends keyof EntityEventMap>(type: K): boolean;
        on<K extends keyof EntityEventMap>(type: K, listener: (event: Event<EntityEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof EntityEventMap>(type?: K, listener?: (event: Event<EntityEventMap[K]>) => any, thisObject?: any): void;
    }

    /**
     * 实体
     */
    export class Entity extends AssetData implements IDisposable
    {
        /**
         * 变换
         */
        get transform()
        {
            if (!this._transform)
                this._transform = this.getComponent("Transform");
            return this._transform;
        }
        private _transform: Transform;

        /**
         * 轴对称包围盒
         */
        get boundingBox()
        {
            if (!this._boundingBox)
            {
                this._boundingBox = this.getComponent("BoundingBox");
            }
            return this._boundingBox;
        }
        private _boundingBox: BoundingBox;

		/**
		 * 子组件个数
		 */
        get numComponents()
        {
            return this._components.length;
        }

        @serialize
        @oav({ component: "OAVComponentList" })
        get components()
        {
            return this._components.concat();
        }
        set components(value)
        {
            if (!value) return;
            this._transform = <any>null;
            for (var i = 0, n = value.length; i < n; i++)
            {
                var compnent = value[i];
                if (!compnent) continue;
                if (compnent.single) this.removeComponentsByType(<any>compnent.constructor);
                this.addComponentAt(value[i], this.numComponents);
            }
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
            this.name = "Entity";
            this.addComponent("Transform");

            this.onAny(this._onAnyListener, this);
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
         * 添加指定组件类型到游戏对象
         * 
		 * @type type 被添加组件
		 */
        addComponent<T extends ComponentNames>(type: T, callback: (component: ComponentMap[T]) => void = null): ComponentMap[T]
        {
            var component = this.getComponent(type);
            if (component && component.single)
            {
                // alert(`The compnent ${param["name"]} can't be added because ${this.name} already contains the same component.`);
                return component;
            }
            var cls: any = componentMap[type];
            component = new cls();
            this.addComponentAt(component, this._components.length);
            callback && callback(component);
            return component;
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
         * 获取游戏对象上第一个指定类型的组件，不存在时返回null
         * 
         * @param type				类定义
         * @return                  返回指定类型组件
         */
        getComponent<T extends ComponentNames>(type: T): ComponentMap[T]
        {
            var component = this.getComponents(type)[0];
            return component;
        }

        /**
         * 获取游戏对象上所有指定类型的组件数组
         * 
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponents<T extends ComponentNames>(type: T): ComponentMap[T][]
        {
            console.assert(!!type, `类型不能为空！`);

            var cls: any = componentMap[type];
            if (!cls)
            {
                console.warn(`无法找到 ${type} 组件类定义，请使用 @feng3d.RegisterComponent() 在组件类上标记。`);
                return [];
            }
            var filterResult: any = this._components.filter(v => v instanceof cls);
            return filterResult;
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
            this.dispatch("removeComponent", { component: component, gameobject: this }, true);
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
        private _onAnyListener(e: Event<any>)
        {
            this.components.forEach(element =>
            {
                element.dispatchEvent(e);
            });
        }

        /**
         * 销毁
         */
        dispose()
        {
            for (var i = this._components.length - 1; i >= 0; i--)
            {
                this.removeComponentAt(i);
            }
            super.dispose();
        }

        //------------------------------------------
        // Protected Properties
        //------------------------------------------
        /**
		 * 组件列表
		 */
        protected _components: Components[] = [];
        protected _children: GameObject[] = [];
        protected _scene: Scene;
        protected _parent: GameObject;
        protected _globalVisible = false;
        protected _globalVisibleInvalid = true;

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
        private addComponentAt(component: Components, index: number): void
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
            component.setGameObject(<any>this);
            component.init();
            //派发添加组件事件
            this.dispatch("addComponent", { component: component, gameobject: this }, true);
        }
    }
}