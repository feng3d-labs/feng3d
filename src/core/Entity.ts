namespace feng3d
{

    export interface EntityEventMap
    {
        /**
         * 添加子组件事件
         */
        addComponent: { entity: Entity, component: Component };

        /**
         * 移除子组件事件
         */
        removeComponent: { entity: Entity, component: Component };

        /**
         * 包围盒失效
         */
        boundsInvalid: Geometry;

        /**
         * 刷新界面
         */
        refreshView: any;
    }

    /**
     * 实体，场景唯一存在的对象类型
     */
    export class Entity<T extends EntityEventMap = EntityEventMap> extends Feng3dObject<T> implements IDisposable
    {

        __class__: "feng3d.Entity";

        /**
         * 名称
         */
        @serialize
        @oav({ component: "OAVEntityName" })
        name: string;
        /**
         * 标签
         */
        @serialize
        tag: string;

        //------------------------------------------
        // Variables
        //------------------------------------------
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
            for (var i = 0, n = value.length; i < n; i++)
            {
                var component = value[i];
                if (!component) continue;
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

            this.onAny(this._onAnyListener, this);
        }

        /**
         * 获取指定位置索引的子组件
         * 
         * @param index			位置索引
         * @return				子组件
         */
        getComponentAt(index: number): Component
        {
            console.assert(index < this.numComponents, "给出索引超出范围");
            return this._components[index];
        }

        /**
         * 添加指定组件类型到实体
         * 
         * @type type 被添加组件类定义
         */
        addComponent<T extends Components>(type: Constructor<T>, callback?: (component: T) => void): T
        {
            var component = this.getComponent(type);
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
            callback && callback(component);
            return component;
        }

        /**
         * 添加脚本
         * 
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
         * 获取实体上第一个指定类型的组件，不存在时返回null
         * 
         * @param type				类定义
         * @return                  返回指定类型组件
         */
        getComponent<T extends Components>(type: Constructor<T>): T
        {
            var component = this.getComponents(type)[0];
            return component;
        }

        /**
         * 获取实体上所有指定类型的组件数组
         * 
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponents<T extends Components>(type: Constructor<T>): T[]
        {
            console.assert(!!type, `类型不能为空！`);

            var cls = type;
            if (!cls)
            {
                console.warn(`无法找到 ${type.name} 组件类定义，请使用 @RegisterComponent() 在组件类上标记。`);
                return [];
            }
            var filterResult: any = this._components.filter(v => v instanceof cls);
            return filterResult;
        }

        /**
         * 设置子组件的位置
         * 
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
         * 
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
         * 
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
         * 
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
         * 
         * @param index		要删除的 Component 的子索引。
         */
        removeComponentAt(index: number): Component
        {
            console.assert(index >= 0 && index < this.numComponents, "给出索引超出范围");

            var component: Component = this._components.splice(index, 1)[0];
            //派发移除组件事件
            this.emit("removeComponent", { component: component, entity: this }, true);
            component.dispose();
            return component;
        }

        /**
         * 交换子组件位置
         * 
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
         * 
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
         * 获取指定类型组件
         * 
         * @param type 组件类型
         */
        getComponentsByType<T extends Components>(type: Constructor<T>)
        {
            var removeComponents: T[] = [];
            for (let i = 0; i < this._components.length; i++)
            {
                if (this._components[i] instanceof type)
                    removeComponents.push(<any>this._components[i]);
            }
            return removeComponents;
        }

        /**
         * 移除指定类型组件
         * 
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
            this.components.forEach((element: Component) =>
            {
                element.emitEvent(e);
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
        // Static Functions
        //------------------------------------------
        /**
         * 查找指定名称的实体
         * 
         * @param name 
         */
        static find(name: string)
        {
            var entitys = Feng3dObject.getObjects(Entity)
            var result = entitys.filter(v => !v.disposed && (v.name == name));
            return result[0];
        }

        //------------------------------------------
        // Protected Properties
        //------------------------------------------
        /**
         * 组件列表
         */
        protected _components: Components[] = [];

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
         * 判断是否拥有组件
         * 
         * @param com	被检测的组件
         * @return		true：拥有该组件；false：不拥有该组件。
         */
        private hasComponent(com: Components): boolean
        {
            return this._components.indexOf(com) != -1;
        }

        /**
         * 添加组件到指定位置
         * 
         * @param component		被添加的组件
         * @param index			插入的位置
         */
        addComponentAt(component: Components, index: number): void
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
            var type = <Constructor<Components>>component.constructor;
            if (Component.isSingleComponent(type))
            {
                var oldComponents = this.getComponentsByType(type);
                if (oldComponents.length > 0)
                {
                    console.assert(oldComponents.length == 1);
                    this.removeComponent(oldComponents[0]);
                }
            }

            this._components.splice(index, 0, component);
            component.entity = this;
            component.init();
            //派发添加组件事件
            this.emit("addComponent", { component: component, entity: this }, true);
        }

        /**
         * 为了兼容以往json序列化格式
         * 
         * @deprecated
         */
        set children(v: Entity[])
        {
            var node3ds = v.map(v => v.getComponent(Node3D));
            var node3d = this.getComponent(Node3D);
            if (node3d)
            {
                node3d.children = node3ds;
            } else
            {
                var f = (e: Event<{
                    entity: Entity;
                    component: Component;
                }>) =>
                {
                    if (e.data.entity == this && e.data.component instanceof Node3D)
                    {
                        e.data.component.children = node3ds;
                        this.off("addComponent", f);
                    }
                };
                this.on("addComponent", f);
            }
            this._children = v;
        }
        // debug
        private _children: Entity[];

        /**
         * 创建指定类型的实体。
         * 
         * @param type 实体类型。
         * @param param 实体参数。
         */
        static createPrimitive<K extends keyof PrimitiveEntity>(type: K, param?: gPartial<Entity>)
        {
            var g = new Entity();
            g.name = type;

            var createHandler = this._registerPrimitives[type];
            if (createHandler != null) createHandler(g);

            serialization.setValue(g, param);
            return g.getComponent(Node3D);
        }

        /**
         * 注册原始实体，被注册后可以使用 Entity.createPrimitive 进行创建。
         * 
         * @param type 原始实体类型。
         * @param handler 构建原始实体的函数。
         */
        static registerPrimitive<K extends keyof PrimitiveEntity>(type: K, handler: (entity: Entity) => void)
        {
            if (this._registerPrimitives[type])
                console.warn(`重复注册原始实体 ${type} ！`);
            this._registerPrimitives[type] = handler;
        }
        static _registerPrimitives: { [type: string]: (gameObject: Entity) => void } = {};
    }

    /**
     * 原始实体，可以通过Entity.createPrimitive进行创建。
     */
    export interface PrimitiveEntity
    {
    }
}