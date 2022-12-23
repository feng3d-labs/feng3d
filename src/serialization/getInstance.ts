import { ClassMap, _definitionCache } from "./serializable";

declare global
{
    interface Function
    {
        /**
         * 用戶提供的自定義構造函數
         */
        __create__<T>(): T;
    }
}

/**
 * 获取实例
 *
 * @param classname 类名称
 */
export function getInstance<K extends keyof ClassMap>(classname: K)
{
    const Cls = _definitionCache[classname];
    console.assert(Cls, `${classname} 未注册，请使用 @serializable 进行注册反序列化的类。`);

    if (Cls.__create__)
    {
        return Cls.__create__<ClassMap[K]>();
    }

    const instance = new Cls();

    return instance;
}
