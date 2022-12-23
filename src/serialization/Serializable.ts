import { ConstructorOf } from "../polyfill/Types";
import { __class__ } from "./SerializationConst";

/**
 * 类名称与定义映射
 */
export interface ClassMap extends MixinsClassMap
{
}

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


declare global
{
    interface MixinsClassMap
    {
        Number: Number;
        Boolean: Boolean;
        String: String;
        Object: Object;
    }
}

// 标记 JS 内置类型
Serializable('Object')(Object);
Serializable('Number')(Number);
Serializable('String')(String);
Serializable('Boolean')(Boolean);