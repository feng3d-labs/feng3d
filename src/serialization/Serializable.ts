import { Constructor } from '@feng3d/polyfill';
import { __class__ } from './SerializationConst';

export const _definitionCache: any = {};

/**
 * 组件名称与类定义映射，新建组件一般都需扩展该接口。
 */
export interface SerializableMap { }

/**
 * 标记可序列化类
 *
 * 使用 @Serializable($className) 标记可序列化类
 *
 * @see https://docs.unity3d.com/cn/current/ScriptReference/Serializable.html
 */
export function Serializable<K extends keyof SerializableMap>(className: K)
{
    return (constructor: Constructor<SerializableMap[K]>) =>
    {
        if (_definitionCache[className])
        {
            console.warn(`重复定义类型 ${className}，${_definitionCache[className]} ${constructor} ！`);
        }
        else
        {
            const prototype = constructor.prototype;
            _definitionCache[className] = constructor;
            Object.defineProperty(prototype, __class__, { value: className, writable: true, enumerable: false });
        }
    };
}
