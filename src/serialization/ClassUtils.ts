import { ObjectUtils } from "../polyfill/ObjectUtils";
import { Constructor } from "../polyfill/Types";

export const __class__ = '__class__';

/**
 * 类工具
 */
export class ClassUtils
{
    /**
     * 返回对象的类名。
     * @param value 需要类名称的对象，可以将任何 JavaScript 值传递给此方法，包括所有可用的 JavaScript 类型、对象实例、原始类型
     * （如number)和类对象
     * @returns 包含类名称的字符串。
     */
    getQualifiedClassName(value: Object): string
    {
        const prototype: Object = Object.getPrototypeOf(value);
        if (prototype.hasOwnProperty(__class__))
        {
            return prototype[__class__];
        }

        console.warn(`名称为 ${prototype.constructor.name} 的 ${value} 未注册，请使用 @serializable 进行注册反序列化的类。`);

        return null;
    }

    /**
     * 获取实例
     *
     * @param classname 类名称
     */
    getInstanceByName<T>(classname: string): T
    {
        const Cls: Constructor<T> = _definitionCache[classname];
        console.assert(Cls, `${classname} 未注册，请使用 @serializable 进行注册反序列化的类。`);

        if (Cls.__create__)
        {
            return Cls.__create__();
        }

        const instance = new Cls();

        return instance;
    }
}

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
 * 类工具
 */
export const classUtils = new ClassUtils();

const _definitionCache = {};

/**
 * 标记objectview对象界面类
 */
export function serializable(className?: string)
{
    return (constructor: Constructor<any>) =>
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
