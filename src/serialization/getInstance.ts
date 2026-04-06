import { Constructor, gPartial } from '../polyfill/Types';
import { SerializableMap, _definitionCache } from './Serializable';
import { $set } from './Serialization';

/**
 * 获取实例
 *
 * @param classname 类名称
 */
export function getInstance<K extends keyof SerializableMap>(classname: K, params?: gPartial<SerializableMap[K]>)
{
    let Cls: Constructor = _definitionCache[classname];

    // 如果未定义则从全局查找
    if (!Cls)
    {
        const definition = globalThis[classname as string];
        if (definition && typeof definition === 'function' && definition['name'] === classname)
        {
            _definitionCache[classname] = definition;
            Cls = definition as any;
        }
    }

    //
    console.assert(!!Cls, `${classname} 未注册，请使用 @Serializable 进行注册反序列化的类。`);

    let instance: any;
    if (Cls.__create__)
    {
        instance = Cls.__create__();
    }
    else
    {
        instance = new Cls();
    }
    $set(instance, params);

    return instance;
}

declare global
{
    interface Function
    {
        /**
         * @see Component.__create__
         */
        __create__<T>(this: Constructor<T>): T
    }
}
