import { ArrayUtils } from '../polyfill/ArrayUtils';
import { ObjectUtils } from '../polyfill/ObjectUtils';
import { gPartial } from '../polyfill/Types';
import { getClassName } from './getClassName';
import { getInstance } from './getInstance';
import { Serializable } from './Serializable';
import { _serialize__, __class__ } from './SerializationConst';

/**
 * 序列化对象
 *
 * 过程中使用 different与默认值作比较减少结果中的数据。
 *
 * @param target 被序列化的对象
 * @param omitDefault 是否忽略默认值
 *
 * @returns 序列化后简单数据对象（由Object与Array组合可 JSON.stringify 的简单结构）
 */
export function $serialize<T>(target: T, omitDefault = true): gPartial<T>
{
    return serialization.serialize(target, omitDefault);
}

/**
 * 反序列化对象为基础对象数据（由Object与Array组合）
 *
 * @param object 换为Json的对象
 * @returns 反序列化后的数据
 */
export function $deserialize<T>(object: gPartial<T>): T
{
    return serialization.deserialize(object, true);
}

/**
 * 从数据对象中提取数据给目标对象赋值（可能会经过序列化处理）
 *
 * @param target 目标对象
 * @param source 数据对象 可由Object与Array以及自定义类型组合
 */
export function $set<T>(target: T, source: gPartial<T>)
{
    return serialization.setValue(target, source);
}

/**
 * 比较两个对象的不同，提取出不同的数据(可能会经过反序列化处理)
 *
 * @param target 用于检测不同的数据
 * @param source 模板（默认）数据
 *
 * @returns 比较得出的不同数据（由Object与Array组合可 JSON.stringify 的简单结构）
 */
export function $diff<T>(target: T, source: T): gPartial<T>
{
    return serialization.different(target, source, true);
}

/**
 * 深度克隆
 *
 * @param target 被克隆对象
 */
export function $clone<T>(target: T): T
{
    return serialization.clone(target);
}

/**
 * 序列化属性函数
 *
 * 序列化对象时建议使用 serialization.serialize
 *
 * @param target 序列化后的对象，存放序列化后属性值的对象。
 * @param source 被序列化的对象，提供序列化前属性值的对象。
 * @param property 序列化属性名称
 */
function propertyHandler<T extends HandlerParam>(target: any, source: any, property: string, param: T)
{
    const handlers = param.handlers;

    for (let i = 0; i < handlers.length; i++)
    {
        if (handlers[i](target, source, property, param))
        {
            return true;
        }
    }

    return true;
}

/**
 * 序列化属性函数项
 */
interface PropertyHandler<T extends HandlerParam>
{
    /**
     * 序列化属性函数项
     *
     * @param target 序列化后的对象，存放序列化后属性值的对象。
     * @param source 被序列化的对象，提供序列化前属性值的对象。
     * @param property 序列化属性名称
     * @param param 参数列表
     *
     * @returns 返回true时结束该属性后续处理。
     */
    (target: any, source: any, property: string, param: T): boolean;
}

interface HandlerParam
{
    handlers: PropertyHandler<HandlerParam>[]
    serialization: Serialization
    /**
     * 是否忽略默认值。
     */
    omitDefault: boolean
}

interface SerializeHandlerParam extends HandlerParam
{
    /**
     * 已经被序列化的列表
     *
     * {key: 被序列化的对象，value：{target:序列化后数据所存储对象,property:序列化后数据所存在属性名称}}
     *
     * 用于处理序列化循环引用以及多次引用的对象
     */
    serializedMap: Map<any, { target: any, property: string }>;
    handlers: PropertyHandler<SerializeHandlerParam>[];
    root: any;
    autoRefID: number;
}

interface DeserializeHandlerParam extends HandlerParam
{
    refs: {
        [refid: string]: {
            target: any;
            property: string;
            refs: { target: any, property: string }[];
        }
    };
}

interface DifferentHandlerParam extends HandlerParam
{
    handlers: PropertyHandler<DifferentHandlerParam>[];
    /**
     * 当前对象的不同数据
     */
    different: any;
}

/**
 * 序列化
 */
export class Serialization
{
    /**
     * 序列化函数列表
     */
    serializeHandlers: { priority: number, handler: PropertyHandler<SerializeHandlerParam> }[] = [];

    /**
     * 反序列化函数列表
     */
    deserializeHandlers: { priority: number, handler: PropertyHandler<DeserializeHandlerParam> }[] = [];

    /**
     * 比较差异函数列表
     */
    differentHandlers: { priority: number, handler: PropertyHandler<DifferentHandlerParam> }[] = [];

    /**
     * 设置函数列表
     */
    setValueHandlers: { priority: number, handler: PropertyHandler<HandlerParam> }[] = [];

    /**
     * 序列化对象
     *
     * 过程中使用 different与默认值作比较减少结果中的数据。
     *
     * @param target 被序列化的对象
     * @param omitDefault 是否忽略默认值
     *
     * @returns 序列化后简单数据对象（由Object与Array组合可 JSON.stringify 的简单结构）
     */
    serialize<T>(target: T, omitDefault = true): gPartial<T>
    {
        //
        const handlers = this.serializeHandlers.sort((a, b) => b.priority - a.priority).map((v) => v.handler);

        const param: SerializeHandlerParam = {
            handlers, serialization: this, root: target as any,
            serializedMap: new Map(),
            autoRefID: 1,
            omitDefault
        };

        const result: any = {};

        propertyHandler(result, { __root__: target }, rootKey, param);
        const v = result[rootKey];

        return v;
    }

    /**
     * 删除 Json 对象中 CLASS_KEY 属性，防止被反序列化。
     *
     * @param obj
     */
    deleteClassKey(obj: any)
    {
        if (ObjectUtils.isBaseType(obj)) return;

        delete obj[__class__];

        for (const key in obj)
        {
            this.deleteClassKey(obj[key]);
        }
    }

    /**
     * 反序列化对象为基础对象数据（由Object与Array组合）
     *
     * @param object 换为Json的对象
     * @returns 反序列化后的数据
     */
    deserialize<T>(object: gPartial<T>, omitDefault = true): T
    {
        const handlers = this.deserializeHandlers.sort((a, b) => b.priority - a.priority).map((v) => v.handler);

        const param: DeserializeHandlerParam = { handlers, serialization: this, refs: {}, omitDefault };

        const result: any = {};

        propertyHandler(result, { __root__: object }, rootKey, param);
        const v = result[rootKey];

        // 处理 循环引用以及多次引用
        Object.keys(param.refs).forEach((refid) =>
        {
            const refs = param.refs[refid];
            const value = refs.target[refs.property];

            delete value[serializeIsRawKey];
            refs.refs.forEach((ref) =>
            {
                ref.target[ref.property] = value;
            });
        });

        return v;
    }

    /**
     * 比较两个对象的不同，提取出不同的数据(可能会经过反序列化处理)
     *
     * @param target 用于检测不同的数据
     * @param source 模板（默认）数据
     * @param different 比较得出的不同（简单结构）数据
     *
     * @returns 比较得出的不同数据（由Object与Array组合可 JSON.stringify 的简单结构）
     */
    different<T>(target: T, source: T, omitDefault = true): gPartial<T>
    {
        const handlers = this.differentHandlers.sort((a, b) => b.priority - a.priority).map((v) => v.handler);

        const different = { __root__: {} };

        const param: DifferentHandlerParam = { different, handlers, serialization: this, omitDefault };

        propertyHandler({ __root__: target }, { __root__: source }, rootKey, param);

        return different[rootKey];
    }

    /**
     * 从数据对象中提取数据给目标对象赋值（可能会经过序列化处理）
     *
     * @param target 目标对象
     * @param source 数据对象 可由Object与Array以及自定义类型组合
     */
    setValue<T>(target: T, source: gPartial<T>, omitDefault = true)
    {
        if (ObjectUtils.isBaseType(source) || target === source) return target;
        const handlers = this.setValueHandlers.sort((a, b) => b.priority - a.priority).map((v) => v.handler);

        const param: HandlerParam = { handlers, serialization: this, omitDefault };

        propertyHandler({ __root__: target }, { __root__: source }, rootKey, param);

        return target;
    }

    /**
     * 克隆
     * @param target 被克隆对象
     */
    clone<T>(target: T): T
    {
        return this.deserialize(this.serialize(target));
    }
}

/**
 * 获取序列化属性列表
 */
function getSerializableMembers(object: any, serializableMembers?: string[])
{
    serializableMembers = serializableMembers || [];
    if (object[protoKey])
    {
        getSerializableMembers(object[protoKey], serializableMembers);
    }
    const serializePropertys: string[] = object[_serialize__];

    serializePropertys?.forEach((v) =>
    {
        serializableMembers.push(v);
    });
    ArrayUtils.unique(serializableMembers);

    return serializableMembers;
}

/**
 * 默认序列化工具
 */
export const serialization = new Serialization();

serialization.serializeHandlers.push(
    // 基础类型
    {
        priority: 0,
        handler(target, source, property)
        {
            const spv = source[property];

            if (ObjectUtils.isBaseType(spv))
            {
                target[property] = spv;

                return true;
            }

            return false;
        }
    },
    // 处理循环引用以及多次引用
    {
        priority: 0,
        handler(target, source, property, param)
        {
            const spv = source[property];

            const serializedMap = param.serializedMap;

            if (serializedMap.has(spv))
            {
                // 处理已经被序列化的对象
                const value = param.serializedMap.get(spv);
                const tpv = value.target[value.property];

                if (!ObjectUtils.isBaseType(tpv))
                {
                    if (tpv[serializeIsRawKey] === undefined)
                    {
                        tpv[serializeIsRawKey] = param.autoRefID++;
                    }
                    const newtpv: any = {};

                    newtpv[serializeIsRefKey] = tpv[serializeIsRawKey];
                    target[property] = newtpv;

                    return true;
                }
            }
            else
            {
                // 记录spv 序列化后的数据保存的位置
                serializedMap.set(spv, { target, property });
            }

            return false;
        }
    },
    // 处理方法
    {
        priority: 0,
        handler(target, source, property)
        {
            const spv = source[property];

            if (spv && typeof spv === 'function')
            {
                const object: any = {};

                object[__class__] = 'function';
                object.data = spv.toString();
                target[property] = object;

                return true;
            }

            return false;
        }
    },
    // 排除不支持序列化对象 Serializable === false 时不进行序列化
    {
        priority: 0,
        handler(target, source, property)
        {
            const spv = source[property];

            if (spv && spv.Serializable === false)
            {
                return true;
            }

            return false;
        }
    },
    // 自定义序列化函数
    {
        priority: 0,
        handler(target, source, property)
        {
            const spv = source[property];

            if (spv && spv.serialize)
            {
                const object = {};

                target[property] = object;
                object[__class__] = getClassName(spv);
                spv.serialize(object);

                return true;
            }

            return false;
        }
    },
    // 处理数组
    {
        priority: 0,
        handler(target, source, property, param)
        {
            const spv = source[property];

            if (Array.isArray(spv))
            {
                const arr = target[property] || [];

                target[property] = arr;
                const keys = Object.keys(spv);

                keys.forEach((v) =>
                {
                    propertyHandler(arr, spv, v, param);
                });

                return true;
            }

            return false;
        }
    },
    // 处理普通Object
    {
        priority: 0,
        handler(target, source, property, param)
        {
            const spv = source[property];

            if (ObjectUtils.isObject(spv))
            {
                const object = {};

                target[property] = object;
                const keys = Object.keys(spv);

                keys.forEach((key) =>
                {
                    propertyHandler(object, spv, key, param);
                });

                return true;
            }

            return false;
        }
    },
    // 使用默认序列化
    {
        priority: -10000,
        handler(target, source, property, param)
        {
            const tpv = target[property];
            const spv = source[property];

            if (!param.omitDefault)
            {
                const object = {};

                target[property] = object;
                const className = getClassName(spv);
                const keys = getSerializableMembers(spv);

                keys.forEach((key) =>
                {
                    propertyHandler(object, spv, key, param);
                });
                object[__class__] = className;

                return true;
            }

            // 执行默认忽略默认值
            if (ObjectUtils.objectIsEmpty(tpv) || tpv.constructor !== spv.constructor)
            {
                const className = getClassName(spv);
                // 获取或创建对象默认实例，把默认实例保存在构造函数上省去使用map保存。
                let inst = spv.constructor.inst;

                if (!inst)
                {
                    inst = spv.constructor.inst = new spv.constructor();
                }
                // .constructor 上的属性会被继承
                if (!(inst instanceof spv.constructor))
                {
                    inst = spv.constructor.inst = new spv.constructor();
                }
                const diff: any = param.serialization.different(spv, inst);

                diff[__class__] = className;
                target[property] = diff;
            }
            else
            {
                const diff: any = param.serialization.different(spv, tpv);

                if (diff)
                {
                    target[property] = diff;
                }
            }

            return true;
        }
    },
);

serialization.deserializeHandlers = [
    // 基础类型
    {
        priority: 0,
        handler(target, source, property)
        {
            const spv = source[property];

            if (ObjectUtils.isBaseType(spv))
            {
                target[property] = spv;

                return true;
            }

            return false;
        }
    },
    // 处理循环引用以及多次引用，学习 node.js 优化循环引用
    /**
     * ```
     * var o = {};
        o.o = o;
        o.o1 = o;
        o.o2 = o;

        console.log(o);
     * ```
     */
    {
        priority: 0,
        handler(target, source, property, param)
        {
            const spv = source[property];

            const refs = param.refs;

            if (spv[serializeIsRefKey] !== undefined || spv[serializeIsRawKey] !== undefined)
            {
                const refid = spv[serializeIsRefKey] || spv[serializeIsRawKey];

                const currentRef = refs[refid] = refs[refid] || { refs: [], target: null, property: null };

                if (spv[serializeIsRawKey])
                {
                    currentRef.target = target;
                    currentRef.property = property;
                }
                else
                {
                    currentRef.refs.push({ target, property });

                    return true;
                }
            }

            return false;
        }
    },
    // 处理方法
    {
        priority: 0,
        handler(target, source, property)
        {
            const spv = source[property];

            if (spv && spv[__class__] === 'function')
            {
                // eslint-disable-next-line no-new-func
                target[property] = Function(`return (${spv.data})`)();

                return true;
            }

            return false;
        }
    },
    // 处理非原生Object对象
    {
        priority: 0,
        handler(target, source, property)
        {
            const spv = source[property];

            if (!ObjectUtils.isObject(spv) && !Array.isArray(spv))
            {
                target[property] = spv;

                return true;
            }

            return false;
        }
    },
    // 处理数组
    {
        priority: 0,
        handler(target, source, property, param)
        {
            const spv = source[property];

            if (Array.isArray(spv))
            {
                const arr = target[property] || [];
                const keys = Object.keys(spv);

                keys.forEach((key) =>
                {
                    propertyHandler(arr, spv, key, param);
                });
                target[property] = arr;

                return true;
            }

            return false;
        }
    },
    // 处理 没有类名称标记的 普通Object
    {
        priority: 0,
        handler(target, source, property, param)
        {
            const tpv = target[property];
            const spv = source[property];

            if (ObjectUtils.isObject(spv) && ObjectUtils.objectIsEmpty(spv[__class__]))
            {
                let obj = {};

                if (tpv) obj = tpv;
                //
                const keys = Object.keys(spv);

                keys.forEach((key) =>
                {
                    propertyHandler(obj, spv, key, param);
                });
                target[property] = obj;

                return true;
            }

            return false;
        }
    },
    // 处理自定义反序列化对象
    {
        priority: 0,
        handler(target, source, property)
        {
            const tpv = target[property];
            const spv = source[property];
            let inst = getInstance(spv[__class__]);
            // 处理自定义反序列化对象

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (inst && inst.deserialize)
            {
                if (tpv && tpv.constructor === inst.constructor)
                {
                    inst = tpv;
                }
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                const result = inst.deserialize(spv);
                if (result)
                {
                    inst = result;
                }
                target[property] = inst;

                return true;
            }

            return false;
        }
    },
    // 处理自定义对象的反序列化
    {
        priority: -10000,
        handler(target, source, property, param)
        {
            const tpv = target[property];
            const spv = source[property];
            let inst = getInstance(spv[__class__]);

            if (inst)
            {
                if (tpv && tpv.constructor === inst.constructor)
                {
                    inst = tpv;
                }
                // 默认反序列
                const keys = Object.keys(spv);

                keys.forEach((key) =>
                {
                    if (key !== __class__)
                    { propertyHandler(inst, spv, key, param); }
                });
                target[property] = inst;

                return true;
            }
            console.warn(`未处理`);

            return false;
        }
    },
];

serialization.differentHandlers = [
    // 相等对象
    {
        priority: 0,
        handler(target, source, property)
        {
            if (target[property] === source[property])
            {
                return true;
            }

            return false;
        }
    },
    // 目标数据为null时
    {
        priority: 0,
        handler(target, source, property, param)
        {
            if (ObjectUtils.objectIsEmpty(source[property]))
            {
                param.different[property] = param.serialization.serialize(target[property]);

                return true;
            }

            return false;
        }
    },
    // 基础类型
    {
        priority: 0,
        handler(target, source, property, param)
        {
            const tpv = target[property];

            if (ObjectUtils.isBaseType(tpv))
            {
                param.different[property] = tpv;

                return true;
            }

            return false;
        }
    },
    // 数组
    {
        priority: 0,
        handler(target, source, property, param)
        {
            const different = param.different;

            const tpv = target[property];
            const spv = source[property];

            if (Array.isArray(tpv))
            {
                const keys = Object.keys(tpv);
                const diff = [];
                const newParam: DifferentHandlerParam = { different: diff, handlers: param.handlers, serialization: param.serialization, omitDefault: param.omitDefault };

                keys.forEach((key) =>
                {
                    propertyHandler(tpv, spv, key, newParam);
                });
                if (Object.keys(diff).length > 0)
                { different[property] = diff; }

                return true;
            }

            return false;
        }
    },
    // 不同对象类型
    {
        priority: 0,
        handler(target, source, property, param)
        {
            const tpv = target[property];
            const spv = source[property];

            if (spv.constructor !== tpv.constructor)
            {
                param.different[property] = param.serialization.serialize(tpv);

                return true;
            }

            return false;
        }
    },
    // 默认处理
    {
        priority: -10000,
        handler(target, source, property, param)
        {
            const different = param.different;
            const tpv = target[property];
            const spv = source[property];

            let keys = getSerializableMembers(tpv);

            if (tpv.constructor === Object)
            {
                keys = Object.keys(tpv);
            }

            const diff = {};
            const newParam: DifferentHandlerParam = { different: diff, handlers: param.handlers, serialization: param.serialization, omitDefault: param.omitDefault };

            keys.forEach((v) =>
            {
                propertyHandler(tpv, spv, v, newParam);
            });
            if (Object.keys(diff).length > 0)
            {
                different[property] = diff;
            }

            return true;
        }
    },
];

/**
 * 设置函数列表
 */
serialization.setValueHandlers = [
    // 值相等时直接返回
    {
        priority: 0,
        handler(target, source, property, _handlers)
        {
            if (target[property] === source[property])
            {
                return true;
            }

            return false;
        }
    },
    // 当原值等于null时直接反序列化赋值
    {
        priority: 0,
        handler(target, source, property, param)
        {
            const tpv = target[property];
            const spv = source[property];

            if (ObjectUtils.objectIsEmpty(tpv))
            {
                target[property] = param.serialization.deserialize(spv);

                return true;
            }

            return false;
        }
    },
    // 处理简单类型
    {
        priority: 0,
        handler(target, source, property)
        {
            const spv = source[property];

            if (ObjectUtils.isBaseType(spv))
            {
                target[property] = spv;

                return true;
            }

            return false;
        }
    },
    // 处理数组
    {
        priority: 0,
        handler(target, source, property, param)
        {
            const tpv = target[property];
            const spv = source[property];

            if (Array.isArray(spv))
            {
                console.assert(!!tpv);
                const keys = Object.keys(spv);

                keys.forEach((key) =>
                {
                    propertyHandler(tpv, spv, key, param);
                });
                target[property] = tpv;

                return true;
            }

            return false;
        }
    },
    // 处理非 Object 类型数据
    {
        priority: 0,
        handler(target, source, property, param)
        {
            const spv = source[property];

            if (!ObjectUtils.isObject(spv))
            {
                target[property] = param.serialization.deserialize(spv);

                return true;
            }

            return false;
        }
    },
    // 处理 Object 基础类型数据
    {
        priority: 0,
        handler(target, source, property, param)
        {
            const tpv = target[property];
            const spv = source[property];

            if (ObjectUtils.isObject(spv) && spv[__class__] === undefined)
            {
                console.assert(!!tpv);
                const keys = Object.keys(spv);

                keys.forEach((key) =>
                {
                    propertyHandler(tpv, spv, key, param);
                });
                target[property] = tpv;

                return true;
            }

            return false;
        }
    },
    // 处理自定义类型
    {
        priority: -10000,
        handler(target, source, property, param)
        {
            const tpv = target[property];
            const spv = source[property];

            const targetClassName = getClassName(target[property]);
            // 相同对象类型

            if (targetClassName === spv[__class__])
            {
                const keys = Object.keys(spv);

                keys.forEach((key) =>
                {
                    propertyHandler(tpv, spv, key, param);
                });
                target[property] = tpv;
            }
            else
            {
                // 不同对象类型
                target[property] = param.serialization.deserialize(spv);
            }

            return true;
        }
    },
];

[Float32Array, Float64Array, Int8Array, Int16Array, Int32Array, Uint8Array, Uint16Array, Uint32Array, Uint8ClampedArray].forEach((element) =>
{
    Serializable(element.name as any)(element);

    element.prototype['serialize'] = function (object: { value: number[] })
    {
        object.value = Array.from(this);

        return object;
    };

    element.prototype['deserialize'] = function (object: { value: number[] })
    {
        return new (this.constructor as any)(object.value);
    };
});

/**
 * 别引用标记，最初出现。
 */
const serializeIsRawKey = '__ref__';
/**
 * 引用标记，多次出现时使用。
 */
const serializeIsRefKey = '__cycle__';

const rootKey = '__root__';
const protoKey = '__proto__';
