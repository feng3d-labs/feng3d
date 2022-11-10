export class Watcher
{
    /**
     * 监听对象属性的变化
     *
     * 注意：使用watch后获取该属性值的性能将会是原来的1/60，避免在运算密集处使用该函数。
     *
     * @param object 被监听对象
     * @param property 被监听属性
     * @param handler 变化回调函数 (newValue: V, oldValue: V, object: T, property: string) => void
     * @param thisObject 变化回调函数 this值
     */
    watch<T, K extends PropertyNames<T>, V extends T[K]>(object: T, property: K, handler: (newValue: V, oldValue: V, object: T, property: string) => void, thisObject?: any)
    {
        if (!Object.getOwnPropertyDescriptor(object, __watchs__))
        {
            Object.defineProperty(object, __watchs__, {
                value: {},
                enumerable: false,
                configurable: true,
                writable: false,
            });
        }
        const _property: string = property as any;
        const watchs: Watchs = object[__watchs__];

        if (!watchs[_property])
        {
            const oldPropertyDescriptor = Object.getOwnPropertyDescriptor(object, _property);

            watchs[_property] = { value: object[_property], oldPropertyDescriptor, handlers: [] };
            //
            let data = getPropertyDescriptor(object, _property);

            if (data && data.set && data.get)
            {
                data = { enumerable: data.enumerable, configurable: true, get: data.get, set: data.set };
                const orgSet = data.set;

                data.set = function (value)
                {
                    const oldValue = this[_property];

                    if (oldValue !== value)
                    {
                        orgSet && orgSet.call(this, value);
                        notifyListener(value, oldValue, this, _property);
                    }
                };
            }
            else if (!data || (!data.get && !data.set))
            {
                data = { enumerable: true, configurable: true };
                data.get = function ()
                {
                    return this[__watchs__][_property].value;
                };
                data.set = function (value)
                {
                    const oldValue = this[__watchs__][_property].value;

                    if (oldValue !== value)
                    {
                        this[__watchs__][_property].value = value;
                        notifyListener(value, oldValue, this, _property);
                    }
                };
            }
            else
            {
                console.warn(`watch ${object} . ${_property} 失败！`);

                return;
            }
            Object.defineProperty(object, _property, data);
        }

        const propertywatchs = watchs[_property];
        const has = propertywatchs.handlers.reduce((v, item) => v || (item.handler === handler && item.thisObject === thisObject), false);

        if (!has)
        {
            propertywatchs.handlers.push({ handler, thisObject });
        }
    }

    /**
     * 取消监听对象属性的变化
     *
     * @param object 被监听对象
     * @param property 被监听属性
     * @param handler 变化回调函数 (newValue: V, oldValue: V, object: T, property: string) => void
     * @param thisObject 变化回调函数 this值
     */
    unwatch<T, K extends PropertyNames<T>, V extends T[K]>(object: T, property: K, handler?: (newValue: V, oldValue: V, object: T, property: string) => void, thisObject?: any)
    {
        const watchs: Watchs = object[__watchs__];

        if (!watchs) return;
        const _property: string = property as any;

        if (watchs[_property])
        {
            const handlers = watchs[_property].handlers;

            if (handler === undefined)
            {
                handlers.length = 0;
            }
            for (let i = handlers.length - 1; i >= 0; i--)
            {
                if (handlers[i].handler === handler && (handlers[i].thisObject === thisObject || thisObject === undefined))
                {
                    handlers.splice(i, 1);
                }
            }
            if (handlers.length === 0)
            {
                const value = object[_property];

                delete object[_property];
                if (watchs[_property].oldPropertyDescriptor)
                {
                    Object.defineProperty(object, _property, watchs[_property].oldPropertyDescriptor);
                }
                object[_property] = value;
                delete watchs[_property];
            }
            if (Object.keys(watchs).length === 0)
            {
                delete object[__watchs__];
            }
        }
    }

    private _binds: [any, string, () => void, any, string, () => void][] = [];

    /**
     * 绑定两个对象的指定属性，保存两个属性值同步。
     *
     * @param object0 第一个对象。
     * @param property0 第一个对象的属性名称。
     * @param object1 第二个对象。
     * @param property1 第二个对象的属性名称。
     */
    bind<T0, T1, K0 extends PropertyNames<T0>, K1 extends PropertyNames<T1>>(object0: T0, property0: K0, object1: T1, property1: K1)
    {
        const fun0 = () =>
        {
            object1[property1] = object0[property0] as any;
        };
        const fun1 = () =>
        {
            object0[property0] = object1[property1] as any;
        };

        this.watch(object0, property0, fun0);
        this.watch(object1, property1, fun1);

        this._binds.push([object0, property0 as any, fun0, object1, property1 as any, fun1]);
    }

    /**
     * 解除两个对象的指定属性的绑定。
     *
     * @param object0 第一个对象。
     * @param property0 第一个对象的属性名称。
     * @param object1 第二个对象。
     * @param property1 第二个对象的属性名称。
     */
    unbind<T0, T1, K0 extends PropertyNames<T0>, K1 extends PropertyNames<T1>>(object0: T0, property0: K0, object1: T1, property1: K1)
    {
        const binds = this._binds;

        for (let i = binds.length - 1; i >= 0; i--)
        {
            const v = binds[i];

            if ((v[1] === property0 && v[4] === property1) || (v[1] === property1 && v[4] === property0))
            {
                if ((v[0] === object0 && v[3] === object1) || (v[0] === object1 && v[3] === object0))
                {
                    this.unwatch(v[0], v[1], v[2]);
                    this.unwatch(v[3], v[4], v[5]);
                    binds.splice(i, 1);
                    break;
                }
            }
        }
    }

    /**
     * 监听对象属性链值变化
     *
     * @param object 被监听对象
     * @param property 被监听属性 例如："a.b"
     * @param handler 变化回调函数 (newValue: any, oldValue: any, object: any, property: string) => void
     * @param thisObject 变化回调函数 this值
     */
    watchchain(object: any, property: string, handler: (newValue: any, oldValue: any, object: any, property: string) => void, thisObject?: any)
    {
        const notIndex = property.indexOf('.');

        if (notIndex === -1)
        {
            this.watch(object, property, handler, thisObject);

            return;
        }
        if (!Object.getOwnPropertyDescriptor(object, __watchchains__))
        {
            Object.defineProperty(object, __watchchains__, { value: {}, enumerable: false, writable: false, configurable: true });
        }
        const watchchains: WatchChains = object[__watchchains__];

        if (!watchchains[property])
        {
            watchchains[property] = [];
        }

        const propertywatchs = watchchains[property];
        const has = propertywatchs.reduce((v, item) => v || (item.handler === handler && item.thisObject === thisObject), false);

        if (!has)
        {
            // 添加下级监听链
            const currentp = property.substr(0, notIndex);
            const nextp = property.substr(notIndex + 1);

            if (object[currentp])
            {
                this.watchchain(object[currentp], nextp, handler, thisObject);
            }

            // 添加链监听
            const watchchainFun = (newValue: any, oldValue: any) =>
            {
                if (oldValue) this.unwatchchain(oldValue, nextp, handler, thisObject);
                if (newValue) this.watchchain(newValue, nextp, handler, thisObject);
                // 当更换对象且监听值发生改变时触发处理函数
                const ov = getObjectPropertyValue(oldValue, nextp);
                const nv = getObjectPropertyValue(newValue, nextp);

                if (ov !== nv)
                {
                    handler.call(thisObject, nv, ov, newValue, nextp);
                }
            };

            this.watch(object, currentp, watchchainFun);

            // 记录链监听函数
            propertywatchs.push({ handler, thisObject, watchchainFun });
        }
    }

    /**
     * 取消监听对象属性链值变化
     *
     * @param object 被监听对象
     * @param property 被监听属性 例如："a.b"
     * @param handler 变化回调函数 (object: T, property: string, oldValue: V) => void
     * @param thisObject 变化回调函数 this值
     */
    unwatchchain(object: any, property: string, handler?: (newValue: any, oldValue: any, object: any, property: string) => void, thisObject?: any)
    {
        const notIndex = property.indexOf('.');

        if (notIndex === -1)
        {
            this.unwatch(object, property, handler, thisObject);

            return;
        }

        const currentp = property.substr(0, notIndex);
        const nextp = property.substr(notIndex + 1);

        //
        const watchchains: WatchChains = object[__watchchains__];

        if (!watchchains || !watchchains[property]) return;

        //
        const propertywatchs = watchchains[property];

        for (let i = propertywatchs.length - 1; i >= 0; i--)
        {
            const element = propertywatchs[i];

            if (objectIsEmpty(handler) || (handler === element.handler && thisObject === element.thisObject))
            {
                // 删除下级监听链
                if (object[currentp])
                {
                    this.unwatchchain(object[currentp], nextp, element.handler, element.thisObject);
                }
                // 删除链监听
                this.unwatch(object, currentp, element.watchchainFun);
                // 清理记录链监听函数
                propertywatchs.splice(i, 1);
            }
        }
        // 清理空列表
        if (propertywatchs.length === 0) delete watchchains[property];
        if (Object.keys(watchchains).length === 0)
        {
            delete object[__watchchains__];
        }
    }

    /**
     * 监听对象属性链值变化
     *
     * @param object 被监听对象
     * @param property 被监听属性 例如：{a:{b:null,d:null}} 表示监听 object.a.b 与 object.a.d 值得变化，如果property===object时表示监听对象中所有叶子属性变化。
     * @param handler 变化回调函数 (newValue: any, oldValue: any, host: any, property: string) => void
     * @param thisObject 变化回调函数 this值
     */
    watchobject<T>(object: T, property: gPartial<T>, handler: (newValue: any, oldValue: any, host: any, property: string) => void, thisObject?: any)
    {
        const chains = getObjectPropertyChains(property);

        chains.forEach((v) =>
        {
            this.watchchain(object, v, handler, thisObject);
        });
    }

    /**
     * 取消监听对象属性链值变化
     *
     * @param object 被监听对象
     * @param property 被监听属性 例如：{a:{b:null,d:null}} 表示监听 object.a.b 与 object.a.d 值得变化，如果property===object时表示监听对象中所有叶子属性变化。
     * @param handler 变化回调函数 newValue: any, oldValue: any, host: any, property: string => void
     * @param thisObject 变化回调函数 this值
     */
    unwatchobject<T>(object: T, property: gPartial<T>, handler?: (newValue: any, oldValue: any, host: any, property: string) => void, thisObject?: any)
    {
        const chains = getObjectPropertyChains(property);

        chains.forEach((v) =>
        {
            this.unwatchchain(object, v, handler, thisObject);
        });
    }
}

export const watcher = new Watcher();

interface Watchs
{
    [property: string]: { value: any, oldPropertyDescriptor: any, handlers: { handler: (newValue: any, oldValue: any, host: any, property: string) => void, thisObject: any }[] };
}

interface WatchChains
{
    [property: string]: { handler: (newValue: any, oldValue: any, host: any, property: string) => void, thisObject: any, watchchainFun: (newValue: any, oldValue: any, host: any, property: string) => void }[];
}

export const __watchs__ = '__watchs__';
export const __watchchains__ = '__watchchains__';

function notifyListener(newValue: any, oldValue: any, host: any, property: string): void
{
    const watchs: Watchs = host[__watchs__];
    const handlers = watchs[property].handlers;

    handlers.forEach((element) =>
    {
        element.handler.call(element.thisObject, newValue, oldValue, host, property);
    });
}

/**
 * 让T中以及所有键值中的所有键都是可选的
 */
type gPartial<T> = {
    [P in keyof T]?: gPartial<T[P]>;
};

/**
 * 从对象自身或者对象的原型中获取属性描述
 *
 * @param object 对象
 * @param property 属性名称
 */
function getPropertyDescriptor(object: Object, property: string): PropertyDescriptor | undefined
{
    const data = Object.getOwnPropertyDescriptor(object, property);
    if (data)
    {
        return data;
    }
    const prototype = Object.getPrototypeOf(object);
    if (prototype)
    {
        return getPropertyDescriptor(prototype, property);
    }

    return undefined;
}

/**
 * 判断对象是否为null或者undefine
 *
 * @param obj
 * @returns
 */
function objectIsEmpty(obj: any)
{
    if (obj === undefined || obj === null)
    {
        return true;
    }

    return false;
}

/**
 * 选取T类型中值为非函数类型的所有键
 */
type PropertyNames<T> = NonTypePropertyNames<T, Function>;

/**
 * 获取T类型中除值为KT类型以外的所有键
 *
 * ```
 * class A
 * {
 *      a = 1;
 *      f(){}
 * }
 *
 * var a: NonTypePropertyNames<A, number>; //var a:"f"
 * var a1: NonTypePropertyNames<A, Function>; //var a:"a"
 *
 * ```
 */
type NonTypePropertyNames<T, KT> = { [K in keyof T]: T[K] extends KT ? never : K }[keyof T];

/**
 * 获取对象对应属性上的值
 *
 * @param object 对象
 * @param property 属性名称，可以是 "a" 或者 "a.b" 或者 ["a","b"]
 */
function getObjectPropertyValue(object: Object, property: string | string[])
{
    if (typeof property === 'string') property = property.split('.');
    let value = object;
    for (let i = 0; i < property.length; i++)
    {
        if (objectIsEmpty(value)) return undefined;
        value = value[property[i]];
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
function getObjectPropertyChains(object: Object): string[]
{
    const result: string[] = [];
    // 属性名称列表
    const propertys = Object.keys(object);
    // 属性所属对象列表
    const hosts = new Array(propertys.length).fill(object);
    // 父属性所在编号列表
    const parentPropertyIndices = new Array(propertys.length).fill(-1);
    // 处理到的位置
    let index = 0;
    while (index < propertys.length)
    {
        const host = hosts[index];
        const cp = propertys[index];
        const cv = host[cp];
        let vks: string[];
        if (objectIsEmpty(cv) || isBaseType(cv) || (vks = Object.keys(cv)).length === 0)
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
            // eslint-disable-next-line no-loop-func
            vks.forEach((k) =>
            {
                propertys.push(k);
                hosts.push(cv);
                parentPropertyIndices.push(index);
            });
        }

        index++;
    }

    return result;
}

/**
 * 判断是否为基础类型 undefined,null,boolean,string,number
 */
function isBaseType(object: any): boolean
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

