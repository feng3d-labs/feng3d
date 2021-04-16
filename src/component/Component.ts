namespace feng3d
{
    interface ComponentInfo
    {
        /**
         * 组件名称，默认构造函数名称。当组件重名时可以使用该参数进行取别名，并且在接口 ComponentMap 中相应调整。
         */
        name: string;
        /**
         * 是否唯一，同类型组件只允许一个。
         */
        single: boolean;
        /**
         * 构造函数
         */
        type: Constructor<Component>;
        /**
         * 所依赖的组件列表。当该组件被添加Entity上时，会补齐缺少的依赖组件。
         */
        dependencies: Constructor<Component>[];
    }

    /**
     * 组件信息属性常量，保存组件名称与组件依赖ComponentInfo，由 @RegisterComponent 装饰器进行填充。
     */
    const __component__ = "__component__";

    /**
     * 注册组件
     * 
     * 使用 @RegisterComponent 在组件类定义上注册组件，配合扩展 ComponentMap 接口后可使用 Entity.getComponent 等方法。
     * 
     * @param component 组件名称，默认使用类名称
     */
    export function RegisterComponent(component: {
        /**
         * 组件名称，默认构造函数名称。当组件重名时可以使用该参数进行取别名，并且在接口 ComponentMap 中相应调整。
         */
        name?: string,
        /**
         * 是否唯一，同类型组件只允许一个。
         */
        single?: boolean,
        /**
         * 所依赖的组件列表。当该组件被添加Entity上时，会补齐缺少的依赖组件。
         */
        dependencies?: Constructor<Component>[]
    } = {})
    {
        return (constructor: Constructor<Component>) =>
        {
            var info = component as ComponentInfo;
            info.name = info.name || constructor.name;
            info.type = <any>constructor;
            info.dependencies = info.dependencies || [];
            constructor.prototype[__component__] = info;

            if (Component._componentMap[info.name])
            {
                console.warn(`重复定义组件${info.name}，${Component._componentMap[info.name]} ${constructor} ！`);
            } else
            {
                Component._componentMap[info.name] = constructor;
            }
        }
    }

    export function getComponentType<T extends ComponentNames>(type: T): Constructor<ComponentMap[T]>
    {
        return Component._componentMap[type] as any;
    }

    /**
     * 组件名称与类定义映射，新建组件一般都需扩展该接口。
     */
    export interface ComponentMap { Component: Component }

    export type ComponentNames = keyof ComponentMap;
    export type Components = ComponentMap[ComponentNames];

    export interface ComponentEventMap extends EntityEventMap
    {
    }

    /**
     * 组件
     * 
     * 所有附加到Entity的基类。
     * 
     * 注意，您的代码不会直接创建 Component，而是您编写脚本代码，然后将该脚本附加到 Entity。
     */
    export class Component<T extends ComponentEventMap = ComponentEventMap> extends Feng3dObject<T> implements IDisposable
    {
        /**
         * 组件名称与类定义映射，由 @RegisterComponent 装饰器进行填充。
         * @private
         */
        static _componentMap: { [name: string]: Constructor<Component> } = {};

        /**
         * 获取组件依赖列表
         * 
         * @param type 组件类定义
         */
        static getDependencies(type: Constructor<Component>)
        {
            var prototype = type.prototype;
            var dependencies: Constructor<Component>[] = [];
            while (prototype)
            {
                dependencies = dependencies.concat((prototype[__component__] as ComponentInfo)?.dependencies || []);
                prototype = prototype["__proto__"];
            }
            return dependencies;
        }

        /**
         * 判断组件是否为唯一组件。
         * 
         * @param type 组件类定义
         */
        static isSingleComponent(type: Constructor<Component>)
        {
            var prototype = type.prototype;
            var isSingle = false;
            while (prototype && !isSingle)
            {
                isSingle = !!((prototype[__component__] as ComponentInfo)?.single);
                prototype = prototype["__proto__"];
            }
            return isSingle;
        }

        //------------------------------------------
        // Variables
        //------------------------------------------
        /**
         * 此组件附加到的实体。组件总是附加到实体上。
         */
        @serialize
        get entity()
        {
            return this._entity;
        }

        set entity(v)
        {
            console.assert(!this._entity, "组件无法再次加入其它Entity中!");
            this._entity = v;
        }
        private _entity: Entity = null;

        get node()
        {
            return this._node || this._entity?.getComponent(Node);
        }

        set node(v)
        {
            console.assert(!this._node, "无法重复赋值!");
            this._node = v;
        }
        private _node: Node;

        /**
         * 名称。
         * 
         * 组件与实体及所有附加组件使用相同的名称。
         */
        get name()
        {
            return this._entity.name;
        }

        set name(v)
        {
            this._entity.name = v;
        }

        /**
         * 此实体的标签。
         * 
         * 可使用标签来识别实体。 
         */
        get tag()
        {
            return this._entity.tag;
        }

        set tag(v)
        {
            this._entity.tag = v;
        }

        /**
         * 是否已销毁
         */
        get disposed() { return this._disposed; }
        private _disposed = false;

        //------------------------------------------
        // Functions
        //------------------------------------------
        /**
         * 创建一个组件
         */
        constructor()
        {
            super();
            this.onAny(this._onAnyListener, this);
        }

        /**
         * 初始化组件
         * 
         * 在添加到Entity时立即被调用。
         */
        init()
        {
        }

        /**
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        getComponentAt(index: number): Component
        {
            return this._entity.getComponentAt(index);
        }

        /**
         * 添加指定组件类型到实体
         * 
         * @type type 被添加组件
         */
        addComponent<T extends Components>(type: Constructor<T>, callback: (component: T) => void = null): T
        {
            return this._entity.addComponent(type, callback);
        }

        /**
         * 添加脚本
         * @param script   脚本路径
         */
        addScript(scriptName: string)
        {
            return this._entity.addScript(scriptName);
        }

        /**
         * 获取实体上第一个指定类型的组件，不存在时返回null
         * 
         * @param type				类定义
         * @return                  返回指定类型组件
         */
        getComponent<T extends Components>(type: Constructor<T>): T
        {
            return this._entity.getComponent(type);
        }

        /**
         * 获取实体上所有指定类型的组件数组
         * 
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponents<T extends Components>(type: Constructor<T>): T[]
        {
            return this._entity.getComponents(type);
        }

        /**
         * 设置子组件的位置
         * @param component				子组件
         * @param index				位置索引
         */
        setComponentIndex(component: Components, index: number): void
        {
            this._entity.setComponentIndex(component, index);
        }

        /**
         * 设置组件到指定位置
         * @param component		被设置的组件
         * @param index			索引
         */
        setComponentAt(component: Components, index: number)
        {
            this._entity.setComponentAt(component, index);
        }

        /**
         * 移除组件
         * @param component 被移除组件
         */
        removeComponent(component: Components): void
        {
            this._entity.removeComponent(component);
        }

        /**
         * 获取组件在容器的索引位置
         * @param component			查询的组件
         * @return				    组件在容器的索引位置
         */
        getComponentIndex(component: Components): number
        {
            return this._entity.getComponentIndex(component);
        }

        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        removeComponentAt(index: number): Component
        {
            return this._entity.removeComponentAt(index);
        }

        /**
         * 交换子组件位置
         * @param index1		第一个子组件的索引位置
         * @param index2		第二个子组件的索引位置
         */
        swapComponentsAt(index1: number, index2: number): void
        {
            this._entity.swapComponentsAt(index1, index2);
        }

        /**
         * 交换子组件位置
         * @param a		第一个子组件
         * @param b		第二个子组件
         */
        swapComponents(a: Components, b: Components): void
        {
            this._entity.swapComponents(a, b);
        }

        /**
         * 销毁
         */
        dispose()
        {
            this._entity = <any>null;
            this._disposed = true;
        }

        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera)
        {

        }

        /**
         * Returns all components of Type type in the Entity.
         * 
         * 返回 Entity 或其任何子项中类型为 type 的所有组件。
         * 
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInChildren<T extends Components>(type?: Constructor<T>, filter?: (compnent: T) => { findchildren: boolean, value: boolean }, result?: T[]): T[]
        {
            return this.node.getComponentsInChildren(type, filter, result);
        }

        /**
         * 从父类中获取组件
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInParents<T extends Components>(type?: Constructor<T>, result?: T[]): T[]
        {
            return this.node.getComponentsInParents(type, result);
        }

        /**
         * 监听对象的所有事件并且传播到所有组件中
         */
        private _onAnyListener(e: Event<any>)
        {
            this._entity?.emitEvent(e);
        }

        //------------------------------------------
        // Static Functions
        //------------------------------------------

        //------------------------------------------
        // Protected Properties
        //------------------------------------------

        //------------------------------------------
        // Protected Functions
        //------------------------------------------

        //------------------------------------------
        // Private Properties
        //------------------------------------------
    }
}
