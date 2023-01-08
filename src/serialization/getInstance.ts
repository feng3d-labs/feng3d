import { Constructor } from '../polyfill/Types';
import { _definitionCache } from './Serializable';

/**
 * 获取实例
 *
 * @param classname 类名称
 */
export function getInstance(classname: string)
{
    let Cls: Constructor = _definitionCache[classname];

    // 如果未定义则从全局查找
    if (!Cls)
    {
        const definition = globalThis[classname];
        if (definition && typeof definition === 'function' && definition.name === classname)
        {
            _definitionCache[classname] = definition;
            Cls = definition as any;
        }
    }

    //
    console.assert(!!Cls, `${classname} 未注册，请使用 @Serializable 进行注册反序列化的类。`);

    if (Cls.__create__)
    {
        return Cls.__create__();
    }

    const instance = new Cls();

    return instance;
}

declare global
{
    interface Function
    {
        __create__<T>(this: Constructor<T>): T
    }
}
