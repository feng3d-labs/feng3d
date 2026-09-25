import { ObjectUtils } from './ObjectUtils';
import { Constructor } from './Types';

export const __class__ = '__class__';

/**
 * 带原型（类/构造函数）的对象
 */
type HasPrototype = { prototype: object };

/**
 * 判断值是否为带 prototype 的类/构造函数
 */
function hasPrototype(value: unknown): value is HasPrototype
{
    return typeof value === 'function' && !!(value as HasPrototype).prototype;
}

/**
 * 类工具
 */
export class ClassUtils
{
    classUtilsHandlers: ((value: unknown) => void)[] = [];

    /**
     * 返回对象的类名。
     * @param value 需要类名称的对象，可以将任何 JavaScript 值传递给此方法，包括所有可用的 JavaScript 类型、对象实例、原始类型
     * （如number)和类对象
     * @returns 包含类名称的字符串。
     */
    getQualifiedClassName(value: unknown): string
    {
        if (ObjectUtils.objectIsEmpty(value))
        {
            return 'null';
        }

        const classUtilsHandlers = classUtils.classUtilsHandlers;
        if (classUtilsHandlers)
        {
            classUtilsHandlers.forEach((element) =>
            {
                element(value);
            });
        }

        // 类取 prototype，实例取原型链
        const prototype: object = hasPrototype(value) ? value.prototype : Object.getPrototypeOf(value) as object;

        if (prototype.hasOwnProperty(__class__))
        {
            return (prototype as Record<string, string>)[__class__];
        }

        //
        console.warn(value, `${(prototype as { constructor: { name: string } }).constructor.name} 未注册，请使用 registerClass 或者 @decoratorRegisterClass 进行注册反序列化的类。`);

        return null;
    }

    /**
     * 返回 name 参数指定的类的类对象引用。
     * @param name 类的名称。
     */
    getDefinitionByName(name: string): Constructor<unknown> | null
    {
        if (name === 'null')
        {
            return null;
        }
        if (!name)
        {
            return null;
        }
        if (_definitionCache[name])
        {
            return _definitionCache[name];
        }

        //
        const paths = name.split('.');
        const length = paths.length;
        // 沿全局对象路径逐层查找类定义
        let definition: Record<string, unknown> = globalThis as unknown as Record<string, unknown>;
        for (let i = 0; i < length; i++)
        {
            const path = paths[i];
            definition = definition[path] as Record<string, unknown>;
            if (!definition)
            {
                return null;
            }
        }
        _definitionCache[name] = definition as unknown as Constructor<unknown>;

        //
        console.warn(definition, `${name} 未注册，请使用 registerClass 或者 @decoratorRegisterClass 进行注册反序列化的类。`);

        return definition as unknown as Constructor<unknown>;
    }

    private defaultInstMap: { [className: string]: object } = {};

    /**
     * 获取默认实例
     *
     * @param name 类名称
     */
    getDefaultInstanceByName(name: string): object | null
    {
        if (name === undefined)
        {
            return null;
        }

        let defaultInst = this.defaultInstMap[name];
        if (defaultInst) return defaultInst;
        //
        const inst = this.getInstanceByName(name);
        if (!inst) return null;
        defaultInst = this.defaultInstMap[name] = inst;

        // 冻结对象，防止被修改
        Object.freeze(defaultInst);

        return defaultInst;
    }

    /**
     * 获取实例
     *
     * @param name 类名称
     */
    getInstanceByName(name: string): object | undefined
    {
        const cls = this.getDefinitionByName(name);
        console.assert(!!cls, `无法获取名称为 ${name} 的实例!`);
        if (!cls) return undefined;
        // new 出来的实例一定是 object
        const instance = this.getInstanceByDefinition<object>(cls as unknown as Constructor<object>);

        return instance;
    }

    getInstanceByDefinition<T>(Cls: Constructor<T>): T | undefined
    {
        console.assert(!!Cls);
        if (!Cls) return undefined;
        // @ts-expect-error __create__ 是动态添加的属性
        if (Cls.__create__)
        {
            // @ts-expect-error __create__ 是动态添加的属性
            return Cls.__create__();
        }

         
        let instance: T | undefined;
        try
        {
            instance = new Cls();
        }
        catch
        {
            // eslint-disable-next-line no-debugger
            debugger;
        }

        return instance;
    }
}

/**
 * 类工具
 */
export const classUtils = new ClassUtils();

const _definitionCache: { [className: string]: Constructor<unknown> } = {};

/**
 * 为一个类定义注册类名
 * @param constructor 类定义
 * @param className 类名
 */
export function registerClass(constructor: Constructor<unknown>, className?: string): void
{
    const prototype = constructor.prototype;
    if (!className)
    {
        className = prototype.constructor.name;
    }
    _definitionCache[className] = constructor;
    Object.defineProperty(prototype, __class__, { value: className, writable: true, enumerable: false });
}

/**
 * 标记objectview对象界面类
 */
export function decoratorRegisterClass(className?: string)
{
    return (constructor: Constructor<unknown>) =>
    {
        registerClass(constructor, className);
    };
}
