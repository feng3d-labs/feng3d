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

serializable('Object')(Object);

export const _definitionCache: ConstructorOf<ClassMap> = {} as any;

/**
 * 标记objectview对象界面类
 */
export function serializable<K extends keyof ClassMap>(className?: K)
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
