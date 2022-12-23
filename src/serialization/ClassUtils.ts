import { Constructor } from "../polyfill/Types";

export const __class__ = '__class__';

declare global
{
    interface Function
    {
        /**
         * 用戶提供的自定義構造函數
         */
        __create__<T>(): T;
    }

    interface MixinsClassMap { }
}

/**
 * 类名称与定义映射
 */
export interface ClassMap extends MixinsClassMap
{
    Object: Object;
}

/**
 * 类工具
 */
export class ClassUtils
{
    /**
     * 返回对象的类名。
     * @param instance 对象实例、原始类型（如number，Boolean等）对象
     * @returns 包含类名称的字符串。
     */
    getClassName(instance: Object): string
    {
        const prototype: Object = Object.getPrototypeOf(instance);
        if (prototype.hasOwnProperty(__class__))
        {
            return prototype[__class__];
        }

        console.warn(`名称为 ${prototype.constructor.name} 的 ${instance} 未注册，请使用 @serializable 进行注册反序列化的类。`);

        return null;
    }

    /**
     * 获取实例
     *
     * @param classname 类名称
     */
    getInstance<K extends keyof ClassMap>(classname: K)
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
}

/**
 * 类工具
 */
export const classUtils = new ClassUtils();

type ConstructorOf<T> = {
    [P in keyof T]: Constructor<T[P]>;
};

const _definitionCache: ConstructorOf<ClassMap> = {} as any;

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
