import { ConstructorOf } from "../polyfill/Types";
import { __class__ } from "./SerializationConst";

declare global
{
    interface MixinsClassMap { }
}

/**
 * 类名称与定义映射
 */
export interface ClassMap extends MixinsClassMap
{
    Object: Object;
}

Serializable('Object')(Object);

export const _definitionCache: ConstructorOf<ClassMap> = {} as any;

/**
 * 标记可序列化类
 * 
 * 使用 @Serializable($className) 标记可序列化类
 * 
 * @see https://docs.unity3d.com/cn/current/ScriptReference/Serializable.html
 */
export function Serializable<K extends keyof ClassMap>(className?: K)
{
    return (constructor: ConstructorOf<ClassMap>[K]) =>
    {
        const prototype = constructor.prototype;
        if (!className)
        {
            className = prototype.constructor.name;
        }
        _definitionCache[className] = constructor;
        Object.defineProperty(prototype, __class__, { value: className, writable: true, enumerable: false });
    };
}
