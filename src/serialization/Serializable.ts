import { Constructor } from '../polyfill/Types';
import { __class__ } from './SerializationConst';

export const _definitionCache = {};

/**
 * 标记可序列化类
 *
 * 使用 @Serializable($className) 标记可序列化类
 *
 * @see https://docs.unity3d.com/cn/current/ScriptReference/Serializable.html
 */
export function Serializable(className: string)
{
    return (constructor: Constructor<any>) =>
    {
        const prototype = constructor.prototype;
        _definitionCache[className] = constructor;
        Object.defineProperty(prototype, __class__, { value: className, writable: true, enumerable: false });
    };
}
