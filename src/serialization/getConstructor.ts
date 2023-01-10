import { Constructor } from '../polyfill/Types';
import { SerializableMap, _definitionCache } from './Serializable';

/**
 * 通过类名称获取构造函数。
 *
 * @param className 类名称，实例甚至构造函数。
 *
 * @returns 对应类名称的构造函数。
 */
export function getConstructor<T extends keyof SerializableMap>(className: T | SerializableMap[T] | Constructor<SerializableMap[T]>): Constructor<SerializableMap[T]>
{
    if (typeof className === 'function')
    {
        return className;
    }

    if (typeof className === 'object')
    {
        return className.constructor as Constructor<SerializableMap[T]>;
    }

    const Constructor = _definitionCache[className] as Constructor<SerializableMap[T]>;
    if (!Constructor)
    {
        console.warn(`无法获取 ${className} 对应的构造函数，请使用 @RegisterComponent 进行注册！`);
    }

    return Constructor;
}
