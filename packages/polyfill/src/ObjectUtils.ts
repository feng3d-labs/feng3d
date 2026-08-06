import { ArrayUtils } from './ArrayUtils';
import { gPartial } from './Types';

/**
 * ObjectUtils.assignDeep 中 转换结果的函数定义
 */
interface AssignDeepHandler
{
    /**
     *
     * @param target 目标对象
     * @param source 源数据
     * @param key 属性名称
     * @param replacers 转换函数
     * @param deep 当前深度
     */
    (target: object, source: object, key: string, replacers: AssignDeepHandler[], deep: number): boolean;
}

export class ObjectUtils
{
    /**
     * 判断是否为基础类型 undefined,null,boolean,string,number
     */
    static isBaseType(object: unknown): boolean
    {
        // 基础类型
        if (
            object === undefined || object === null
            || typeof object === 'boolean'
            || typeof object === 'string'
            || typeof object === 'number'
        )
        { return true; }

        return false;
    }

    /**
     * 执行方法
     *
     * 用例：
     * 1. 给一个新建的对象进行初始化
     *
     *  ``` startLifetime = ObjectUtils.runFunc(new MinMaxCurve(), (obj) => { obj.mode = MinMaxCurveMode.Constant; (<MinMaxCurveConstant>obj.minMaxCurve).value = 5; }); ```
     *
     * @param obj 对象
     * @param func 被执行的方法
     */
    static runFunc<T>(obj: T, func: (obj: T) => void): T
    {
        func(obj);

        return obj;
    }

    /**
     * 判断是否为Object对象，构造函数是否为Object， 检测 ObjectUtils.constructor === Object
     *
     * @param object 用于判断的对象
     */
    static isObject(object: unknown): boolean
    {
        return (object as { constructor?: { name?: string } })?.constructor?.name === 'Object';
    }

    /**
     * 获取对象对应属性上的值
     *
     * @param object 对象
     * @param property 属性名称，可以是 "a" 或者 "a.b" 或者 ["a","b"]
     */
    static getPropertyValue(object: object, property: string | string[]): unknown
    {
        if (typeof property === 'string') property = property.split('.');
        let value: unknown = object;
        const len = property.length;
        for (let i = 0; i < len; i++)
        {
            if (ObjectUtils.objectIsEmpty(value)) return undefined;
            // 逐层索引访问，类型不可静态推断，统一按记录类型处理
            value = (value as Record<string, unknown>)[property[i]];
        }

        return value;
    }

    /**
     * 获取对象上属性链列表
     *
     * 例如 object值为{ a: { b: { c: 1 }, d: 2 } }时则返回 ["a.b.c","a.d"]
     *
     * @param object 对象
     */
    static getPropertyChains(object: object): string[]
    {
        const result: string[] = [];
        // 属性名称列表
        const propertys = Object.keys(object);
        // 属性所属对象列表
        const hosts: object[] = new Array(propertys.length).fill(object);
        // 父属性所在编号列表
        const parentPropertyIndices = new Array(propertys.length).fill(-1);
        // 处理到的位置
        let index = 0;
        while (index < propertys.length)
        {
            const host = hosts[index];
            const cp = propertys[index];
            const cv = (host as Record<string, unknown>)[cp];
            let vks: string[];
            if (ObjectUtils.objectIsEmpty(cv) || ObjectUtils.isBaseType(cv) || (vks = Object.keys(cv as object)).length === 0)
            {
                // 处理叶子属性
                const ps = [cp];
                let ci = index;
                // 查找并组合属性链
                while ((ci = parentPropertyIndices[ci]) !== -1)
                {
                    ps.push(propertys[ci]);
                }
                ps.reverse();
                result.push(ps.join('.'));
            }
            else
            {
                // 处理中间属性
                 
                vks.forEach((k) =>
                {
                    propertys.push(k);
                    hosts.push(cv as object);
                    parentPropertyIndices.push(index);
                });
            }

            index++;
        }

        return result;
    }

    /**
     * 浅赋值
     * 从源数据取所有可枚举属性值赋值给目标对象
     *
     * @param target 目标对象
     * @param source 源数据
     */
    static assignShallow<T>(target: T, source: Partial<T>): T
    {
        if (ObjectUtils.objectIsEmpty(source)) return target;
        const keys = Object.keys(source);
        keys.forEach((k) =>
        {
            target[k] = source[k];
        });

        return target;
    }

    /**
     * 深度赋值
     * 从源数据取所有子代可枚举属性值赋值给目标对象
     *
     * @param target 被赋值对象
     * @param source 源数据
     * @param handlers 处理函数列表，先于 ObjectUtils.assignDeepDefaultHandlers 执行。函数返回值为true表示该属性赋值已完成跳过默认属性赋值操作，否则执行默认属性赋值操作。执行在 ObjectUtils.DefaultAssignDeepReplacers 前。
     * @param deep 赋值深度，deep<1时直接返回。
     */
    static assignDeep<T>(target: T, source: gPartial<T>, handlers: AssignDeepHandler[] = [], deep = Number.MAX_SAFE_INTEGER): T
    {
        if (ObjectUtils.objectIsEmpty(source)) return target;
        if (deep < 1) return target;
        const keys = Object.keys(source);
        const concatHandlers = handlers.concat(ObjectUtils.assignDeepDefaultHandlers);
        // 反射式逐属性处理，target/source 视作可索引对象
        const t = target as Record<string, unknown>;
        const s = source as Record<string, unknown>;
        keys.forEach((k) =>
        {
            //
            for (let i = 0; i < concatHandlers.length; i++)
            {
                if (concatHandlers[i](t as object, s as object, k, handlers, deep))
                {
                    return;
                }
            }
            //
            t[k] = s[k];
        });

        return target;
    }

    /**
     * 深度比较两个对象子代可枚举属性值
     *
     * @param a 第一个对象
     * @param b 第二个对象
     */
    static equalDeep<T>(a: T, b: T): boolean
    {
        if (a === b) return true;
        if (ObjectUtils.isBaseType(a) || ObjectUtils.isBaseType(b)) return a === b;
        if (typeof a === 'function' || typeof b === 'function') return a === b;
        //
        const akeys = Object.keys(a);
        const bkeys = Object.keys(b);
        if (!ArrayUtils.equal(akeys, bkeys)) return false;
        if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length;
        // 检测所有属性
        for (let i = 0; i < akeys.length; i++)
        {
            const element = akeys[i];
            if (!ObjectUtils.equalDeep(a[element], b[element]))
            {
                return false;
            }
        }

        return true;
    }

    /**
     * 判断对象是否为null或者undefine
     *
     * @param obj
     * @returns
     */
    static objectIsEmpty(obj: unknown)
    {
        return (obj === undefined || obj === null);
    }

    /**
     * 从对象自身或者对象的原型中获取属性描述
     *
     * @param object 对象
     * @param property 属性名称
     */
    static getPropertyDescriptor(object: object, property: string): PropertyDescriptor | undefined
    {
        const data = Object.getOwnPropertyDescriptor(object, property);
        if (data)
        {
            return data;
        }
        const prototype = Object.getPrototypeOf(object);
        if (prototype)
        {
            return ObjectUtils.getPropertyDescriptor(prototype, property);
        }

        return undefined;
    }

    /**
     * 属性是否可写
     * @param obj 对象
     * @param property 属性名称
     */
    static propertyIsWritable(obj: object, property: string): boolean
    {
        const data = ObjectUtils.getPropertyDescriptor(obj, property);
        if (!data) return false;
        if (data.get && !data.set) return false;

        return true;
    }

    /**
     * ObjectUtils.assignDeep 中 默认转换结果的函数列表
     */
    static assignDeepDefaultHandlers: AssignDeepHandler[] = [
        function (target, source, key)
        {
            const t = target as Record<string, unknown>;
            const s = source as Record<string, unknown>;
            if (t[key] === s[key]) return true;

            return false;
        },
        function (target, source, key)
        {
            const t = target as Record<string, unknown>;
            const s = source as Record<string, unknown>;
            if (ObjectUtils.isBaseType(t[key]) || ObjectUtils.isBaseType(s[key]))
            {
                t[key] = s[key];

                return true;
            }

            return false;
        },
        function (target, source, key, handlers, deep)
        {
            const t = target as Record<string, unknown>;
            const s = source as Record<string, unknown>;
            if (Array.isArray(s[key]) || ObjectUtils.isObject(s[key]))
            {
                ObjectUtils.assignDeep(t[key], s[key], handlers, deep - 1);

                return true;
            }

            return false;
        },
    ];
}
