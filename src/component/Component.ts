import { Constructor } from '@feng3d/polyfill';
import { Feng3dObject } from '../core/Feng3dObject';
import type { Object3D, Object3DEventMap } from '../core/Object3D';

declare global
{
    interface MixinsComponentMap { }
    interface MixinsComponent { }
}

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
const __component__ = '__component__';

/**
 * 注册组件
 *
 * 使用 @RegisterComponent 在组件类定义上注册组件，配合扩展 ComponentMap 接口后可使用 componentQuery 等方法。
 *
 * @param component 组件名称，默认使用类名称
 */
export function RegisterComponent(component?: {
    /**
     * 组件名称，默认构造函数名称。当组件重名时可以使用该参数进行取别名，并且在接口 ComponentMap 中相应调整。
     */
    name: string,
    /**
     * 是否唯一，同类型组件只允许一个。
     */
    single?: boolean,
    /**
     * 所依赖的组件列表。当该组件被添加Entity上时，会补齐缺少的依赖组件。
     */
    dependencies?: Constructor<Component>[]
})
{
    return (constructor: Constructor<Component>) =>
    {
        component = component || <any>{};
        const info = component as ComponentInfo;
        info.name = info.name || component.name || constructor.name;
        info.type = constructor;
        info.dependencies = info.dependencies || [];
        constructor.prototype[__component__] = info;

        if (Component._componentMap[info.name])
        {
            console.warn(`重复定义组件${info.name}，${Component._componentMap[info.name]} ${constructor} ！`);
        }
        else
        {
            Component._componentMap[info.name] = constructor;
        }
    };
}

export function getComponentType<T extends ComponentNames>(type: T): Constructor<ComponentMap[T]>
{
    return Component._componentMap[type] as any;
}

/**
 * 组件名称与类定义映射，由 @RegisterComponent 装饰器进行填充。
 */
export const componentMap: ComponentMap = <any>{};

/**
 * 组件名称与类定义映射，新建组件一般都需扩展该接口。
 */
export interface ComponentMap extends MixinsComponentMap { Component: Component }

export type ComponentNames = keyof ComponentMap;
export type Components = ComponentMap[ComponentNames];

export interface Component extends MixinsComponent { }

/**
 * 组件
 *
 * 纯数据结构体：仅包含 readonly 基础属性，可 JSON 序列化。
 *
 * 所有行为逻辑（init/beforeRender/update/dispose 及各类 computed）由
 * {@link componentLogic} 返回的 logic 对象提供。
 *
 * 组件查询与增删使用 {@link componentQuery} 中的工具函数。
 *
 * 注意：保留 Feng3dObject 的 EventEmitter/uuid/name/hideFlags/disposed 作为数据基础设施。
 */
export class Component extends Feng3dObject<Object3DEventMap>
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
        let prototype = type.prototype;
        let dependencies: Constructor<Component>[] = [];
        while (prototype)
        {
            dependencies = dependencies.concat((prototype[__component__] as ComponentInfo)?.dependencies || []);
            prototype = prototype.__proto__;
        }

        return dependencies;
    }

    /**
     * 判断组件是否为唯一组件。
     *
     * @param type 组件类定义
     */
    static isSingleComponent<T extends Component>(type: Constructor<T>)
    {
        let prototype = type.prototype;
        let isSingle = false;
        while (prototype && !isSingle)
        {
            isSingle = !!((prototype[__component__] as ComponentInfo)?.single);
            prototype = prototype.__proto__;
        }

        return isSingle;
    }
}
