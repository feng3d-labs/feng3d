import { gPartial, ObjectUtils, __class__, ArrayUtils, classUtils } from '@feng3d/polyfill';

/**
 * 可被序列化保存的基础数据（可由 JSON.stringify 处理的简单结构）。
 *
 * 序列化后的数据天然是异构的：可能是基础类型、数组或带动态键的对象。
 */
export type Serializable = boolean | number | string | SerializableObject | SerializableArray;

/**
 * 序列化后的普通对象，键为字符串，值为可序列化数据
 */
export interface SerializableObject
{
    [key: string]: Serializable;
}

/**
 * 序列化后的数组，元素为可序列化数据
 */
export type SerializableArray = Serializable[];

/**
 * 带有字符串键的可索引对象
 */
type IndexedObject = Record<string, unknown>;

/**
 * 带有动态键的容器，用于序列化过程中读写的 target/source。
 *
 * 既可能是序列化后的简单数据（Serializable），也可能是被序列化的源对象（含方法等）；
 * 也包括数组（数组按下标作为键参与序列化）。
 */
type DataContainer = IndexedObject | unknown[];

/**
 * 序列化装饰器
 *
 * 在属性定义前使用 @serialize 进行标记需要序列化
 *
 * @param target 序列化原型
 * @param propertyKey 序列化属性
 */
export function serialize(target: object, propertyKey: string)
{
    const container = target as DataContainer;
    if (!Object.getOwnPropertyDescriptor(container, serializeKey))
    {
        Object.defineProperty(container, serializeKey, { value: [] });
    }
    const serializePropertys = container[serializeKey] as string[];

    serializePropertys.push(propertyKey);
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
function propertyHandler<T extends HandlerParam>(target: DataContainer, source: DataContainer, property: string, param: T)
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

// /**
//  * 序列化属性函数
//  *
//  * 序列化对象时建议使用 serialization.serialize
//  *
//  * @param target 序列化后的对象，存放序列化后属性值的对象。
//  * @param source 被序列化的对象，提供序列化前属性值的对象。
//  * @param property 序列化属性名称
//  * @param handlers 序列化属性函数列表
//  * @param beforeHandler 在处理列表前执行
//  * @param affterHandler 在处理列表后执行
//  */
// function propertyHandler(target: Object, source: Object, property: string, handlers: PropertyHandler[], serialization: Serialization)
// {
//     for (let i = 0; i < handlers.length; i++)
//     {
//         if (handlers[i](target, source, property, handlers, serialization))
//         {
//             return true;
//         }
//     }
//     return true;
// }

// /**
//  * 序列化属性函数
//  *
//  * 序列化对象时建议使用 serialization.serialize
//  *
//  * @param target 序列化后的对象，存放序列化后属性值的对象。
//  * @param source 被序列化的对象，提供序列化前属性值的对象。
//  * @param property 序列化属性名称
//  * @param handlers 序列化属性函数列表
//  */
// function differentPropertyHandler(target: Object, source: Object, property: string, different: Object, handlers: DifferentPropertyHandler[], serialization: Serialization)
// {
//     for (let i = 0; i < handlers.length; i++)
//     {
//         if (handlers[i](target, source, property, different, handlers, serialization))
//         {
//             return true;
//         }
//     }
//     return true;
// }

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
    (target: DataContainer, source: DataContainer, property: string, param: T): boolean;
}

// /**
//  * 序列化属性函数项
//  */
// interface DifferentPropertyHandler
// {
//     /**
//      * 序列化属性函数项
//      *
//      * @param target 序列化后的对象，存放序列化后属性值的对象。
//      * @param source 被序列化的对象，提供序列化前属性值的对象。
//      * @param property 序列化属性名称
//      * @param handlers 序列化属性函数列表
//      * @param serialization 序列化工具自身
//      *
//      * @returns 返回true时结束该属性后续处理。
//      */
//     (target: DataContainer, source: DataContainer, property: string, different: Object, handlers: DifferentPropertyHandler[], serialization: Serialization): boolean;
// }

interface HandlerParam
{
    handlers: PropertyHandler<HandlerParam>[]
    serialization: Serialization
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
    serializedMap: Map<object, { target: DataContainer, property: string }>;
    handlers: PropertyHandler<SerializeHandlerParam>[];
    /**
     * 序列化的根对象引用（仅作记录，序列化过程中不会读取）
     */
    root: unknown;
    autoRefID: number;
}

interface DeserializeHandlerParam extends HandlerParam
{
    refs: {
        [refid: string]: {
            target: DataContainer;
            property: string;
            refs: { target: DataContainer, property: string }[];
        }
    };
}

interface DifferentHandlerParam extends HandlerParam
{
    handlers: PropertyHandler<DifferentHandlerParam>[];
    /**
     * 当前对象的不同数据（可能是对象或数组）
     */
    different: DataContainer;
}

/**
 * 序列化
 */
export class Serialization
{
    /**
     * 是否忽略默认值
     */
    omitDefault = true;

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
     *
     * @returns 序列化后简单数据对象（由Object与Array组合可 JSON.stringify 的简单结构）
     */
    serialize<T>(target: T): gPartial<T>
    {
        //
        const handlers = this.serializeHandlers.sort((a, b) => b.priority - a.priority).map((v) => v.handler);

        const param: SerializeHandlerParam = {
            handlers, serialization: this, root: target,
            serializedMap: new Map(),
            autoRefID: 1,
        };

        const result: SerializableObject = {};

        propertyHandler(result, { __root__: target }, rootKey, param);
        const v = result[rootKey];

        return v as gPartial<T>;
    }

    /**
     * 删除 Json 对象中 CLASS_KEY 属性，防止被反序列化。
     *
     * @param obj 待清理的 JSON 数据
     */
    deleteClassKey(obj: Serializable)
    {
        if (ObjectUtils.isBaseType(obj)) return;

        // 数组元素递归处理，数组本身没有 __class__ 键
        if (Array.isArray(obj))
        {
            obj.forEach((element) => this.deleteClassKey(element));

            return;
        }

        const object = obj as SerializableObject;

        delete object[__class__];

        for (const key in object)
        {
            this.deleteClassKey(object[key]);
        }
    }

    /**
     * 反序列化对象为基础对象数据（由Object与Array组合）
     *
     * @param object 换为Json的对象
     * @returns 反序列化后的数据
     */
    deserialize<T>(object: gPartial<T>): T
    {
        const handlers = this.deserializeHandlers.sort((a, b) => b.priority - a.priority).map((v) => v.handler);

        const param: DeserializeHandlerParam = { handlers, serialization: this, refs: {} };

        const result: DataContainer = {};

        propertyHandler(result, { __root__: object }, rootKey, param);
        const v = result[rootKey];

        // 处理 循环引用以及多次引用
        Object.keys(param.refs).forEach((refid) =>
        {
            const refs = param.refs[refid];
            const value = refs.target[refs.property] as DataContainer;

            delete value[serializeIsRawKey];
            delete value[serializeRefKey];
            refs.refs.forEach((ref) =>
            {
                ref.target[ref.property] = value;
            });
        });

        return v as T;
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
    different<T>(target: T, source: T): gPartial<T>
    {
        const handlers = this.differentHandlers.sort((a, b) => b.priority - a.priority).map((v) => v.handler);

        const different: DataContainer = { __root__: {} };

        const param: DifferentHandlerParam = { different, handlers, serialization: this };

        propertyHandler({ __root__: target }, { __root__: source }, rootKey, param);

        return different[rootKey] as gPartial<T>;
    }

    /**
     * 从数据对象中提取数据给目标对象赋值（可能会经过序列化处理）
     *
     * @param target 目标对象
     * @param source 数据对象 可由Object与Array以及自定义类型组合
     */
    setValue<T>(target: T, source: gPartial<T>)
    {
        if (ObjectUtils.isBaseType(source) || target === source) return target;
        const handlers = this.setValueHandlers.sort((a, b) => b.priority - a.priority).map((v) => v.handler);

        const param: HandlerParam = { handlers, serialization: this };

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
 * 判断值是否为可索引的对象容器（非 null、非基础类型，且可按字符串键读写）。
 *
 * 用于在序列化处理器中对 unknown 类型的属性值进行类型收敛。
 */
function isDataContainer(value: unknown): value is DataContainer
{
    return value !== null && typeof value === 'object';
}

/**
 * 可被自定义序列化的对象：可能定义 serialize 方法或 serializable 标记
 */
interface CustomSerializable extends IndexedObject
{
    /** 自定义序列化实现，把数据写入 object */
    serialize?(object: SerializableObject): void;
    /** 是否可序列化，false 时将被跳过 */
    serializable?: boolean;
}

/**
 * 可被自定义反序列化的对象：可能定义 deserialize 方法
 */
interface CustomDeserializable extends IndexedObject
{
    /** 自定义反序列化实现，从 source 读取数据，返回最终对象 */
    deserialize?(source: DataContainer): unknown;
}

/**
 * 构造函数上可能缓存默认实例（用于忽略默认值比较）
 */
interface ConstructorWithInst
{
    new (...args: unknown[]): IndexedObject;
    inst?: IndexedObject;
}

/**
 * 携带构造函数引用的实例
 */
interface InstanceWithConstructor extends IndexedObject
{
    constructor: ConstructorWithInst;
}

/**
 * 获取序列化属性列表
 */
function getSerializableMembers(object: DataContainer, serializableMembers?: string[])
{
    serializableMembers = serializableMembers || [];
    const proto = object[protoKey] as DataContainer;
    if (proto)
    {
        getSerializableMembers(proto, serializableMembers);
    }
    const serializePropertys = object[serializeKey] as string[];

    if (serializePropertys) ArrayUtils.concatToSelf(serializableMembers, serializePropertys);
    ArrayUtils.unique(serializableMembers);

    return serializableMembers;
}

export interface SerializationTempInfo
{
    loadingNum?: number;
    onLoaded?: () => void;
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

            // 仅对象/数组才可能出现循环或多次引用
            if (!isDataContainer(spv)) return false;

            const serializedMap = param.serializedMap;

            if (serializedMap.has(spv))
            {
                // 处理已经被序列化的对象
                const value = param.serializedMap.get(spv);
                const tpv = value.target[value.property];

                if (!ObjectUtils.isBaseType(tpv) && isDataContainer(tpv))
                {
                    if (!tpv[serializeRefKey])
                    {
                        tpv[serializeRefKey] = param.autoRefID++;
                        tpv[serializeIsRawKey] = true;
                    }
                    const newtpv: SerializableObject = {};

                    newtpv[serializeRefKey] = tpv[serializeRefKey];
                    newtpv[serializeIsRefKey] = true;
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
                const object: SerializableObject = {};

                object[__class__] = 'function';
                object.data = spv.toString();
                target[property] = object;

                return true;
            }

            return false;
        }
    },
    // 排除不支持序列化对象 serializable === false 时不进行序列化
    {
        priority: 0,
        handler(target, source, property)
        {
            const spv = source[property];

            if (spv && (spv as { serializable?: unknown }).serializable === false)
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

            if (isDataContainer(spv))
            {
                const custom = spv as CustomSerializable;
                if (custom.serialize)
                {
                    const object: SerializableObject = {};

                    target[property] = object;
                    object[__class__] = classUtils.getQualifiedClassName(spv);
                    custom.serialize(object);

                    return true;
                }
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
                const arr = (target[property] as unknown[] | undefined) || [];

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

            if (ObjectUtils.isObject(spv) && isDataContainer(spv))
            {
                const object: SerializableObject = {};

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

            if (!isDataContainer(spv)) return false;
            const sourceObj = spv as InstanceWithConstructor;

            if (!param.serialization.omitDefault)
            {
                const object: SerializableObject = {};

                target[property] = object;
                const className = classUtils.getQualifiedClassName(spv);
                const keys = getSerializableMembers(sourceObj);

                keys.forEach((key) =>
                {
                    propertyHandler(object, sourceObj, key, param);
                });
                object[__class__] = className;

                return true;
            }

            // 执行默认忽略默认值
            const targetObj = tpv as InstanceWithConstructor;
            if (ObjectUtils.objectIsEmpty(tpv) || targetObj.constructor !== sourceObj.constructor)
            {
                const className = classUtils.getQualifiedClassName(spv);
                // 获取或创建对象默认实例，把默认实例保存在构造函数上省去使用map保存。
                const ctor = sourceObj.constructor;
                let inst = ctor.inst;

                if (!inst)
                {
                    ctor.inst = new ctor();
                    inst = ctor.inst;
                }
                // .constructor 上的属性会被继承
                if (!(inst instanceof ctor))
                {
                    ctor.inst = new ctor();
                    inst = ctor.inst;
                }
                const diff = param.serialization.different(sourceObj, inst) as SerializableObject;

                diff[__class__] = className;
                target[property] = diff;
            }
            else
            {
                const diff = param.serialization.different(sourceObj, targetObj) as SerializableObject;

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
    // 处理循环引用以及多次引用
    {
        priority: 0,
        handler(target, source, property, param)
        {
            const spv = source[property];

            if (!isDataContainer(spv)) return false;

            const refs = param.refs;

            if (spv[serializeRefKey] !== undefined)
            {
                const refid = spv[serializeRefKey] as string;

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

            if (isDataContainer(spv) && spv[__class__] === 'function')
            {
                const data = spv['data'] as string;

                target[property] = Function(`return (${data})`)();

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
                const arr = (target[property] as unknown[] | undefined) || [];
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

            if (ObjectUtils.isObject(spv) && isDataContainer(spv) && ObjectUtils.objectIsEmpty(spv[__class__]))
            {
                let obj: DataContainer = {};

                if (tpv) obj = tpv as DataContainer;
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

            if (!isDataContainer(spv)) return false;
            let inst = classUtils.getInstanceByName(spv[__class__] as string) as (CustomDeserializable & InstanceWithConstructor) | undefined;
            // 处理自定义反序列化对象

            if (inst && inst.deserialize)
            {
                if (tpv && (tpv as InstanceWithConstructor).constructor === inst.constructor)
                {
                    inst = tpv as CustomDeserializable & InstanceWithConstructor;
                }
                const result = inst.deserialize(spv);
                if (result)
                {
                    inst = result as CustomDeserializable & InstanceWithConstructor;
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

            if (!isDataContainer(spv)) return false;
            let inst = classUtils.getInstanceByName(spv[__class__] as string) as (DataContainer & InstanceWithConstructor) | undefined;

            if (inst)
            {
                if (tpv && (tpv as InstanceWithConstructor).constructor === inst.constructor)
                {
                    inst = tpv as DataContainer & InstanceWithConstructor;
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
                const diff: unknown[] = [];
                const newParam: DifferentHandlerParam = { different: diff, handlers: param.handlers, serialization: param.serialization };

                keys.forEach((key) =>
                {
                    propertyHandler(tpv, spv as DataContainer, key, newParam);
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

            if (isDataContainer(tpv) && isDataContainer(spv)
                && (spv as InstanceWithConstructor).constructor !== (tpv as InstanceWithConstructor).constructor)
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

            if (!isDataContainer(tpv)) return false;
            const tpvObj = tpv as IndexedObject;
            const ctor = tpvObj['constructor'] as Function;

            let keys = getSerializableMembers(tpvObj);

            if (ctor === Object)
            {
                keys = Object.keys(tpvObj);
            }

            const diff: SerializableObject = {};
            const newParam: DifferentHandlerParam = { different: diff, handlers: param.handlers, serialization: param.serialization };

            keys.forEach((v) =>
            {
                propertyHandler(tpvObj, spv as DataContainer, v, newParam);
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
                    propertyHandler(tpv as DataContainer, spv, key, param);
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

            if (ObjectUtils.isObject(spv) && isDataContainer(spv) && spv[__class__] === undefined)
            {
                // 目标为空时创建纯数据容器。
                //
                // 主仓的 Object3D / Scene / 几何体 / 材质已迁移为**纯数据接口**（无构造器），
                // 其 JSON 只带 `__type__`、不带 `__class__`，会走到本分支；而旧实现要求
                // `target[property]` 已存在（`console.assert(!!tpv)` 后直接对 tpv 写字段），
                // 纯数据 JSON 在此处会对 undefined 取属性而崩溃，导致整棵场景树反序列化失败。
                const container: DataContainer = isDataContainer(tpv) ? tpv : {};

                const keys = Object.keys(spv);

                keys.forEach((key) =>
                {
                    propertyHandler(container, spv, key, param);
                });
                target[property] = container;

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

            const targetClassName = classUtils.getQualifiedClassName(target[property]);
            // 相同对象类型

            if (isDataContainer(spv) && targetClassName === spv[__class__])
            {
                const keys = Object.keys(spv);

                keys.forEach((key) =>
                {
                    propertyHandler(tpv as DataContainer, spv, key, param);
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

/**
 * 类型化数组实例的最小结构（用于 serialize 时读取元素）
 */
interface TypedArrayLike
{
    readonly length: number;
    [index: number]: number;
}

/**
 * 类型化数组构造函数（可由数组或长度构造）
 */
type TypedArrayConstructor = new (source: number[] | ArrayLike<number>) => TypedArrayLike;

[Float32Array, Float64Array, Int8Array, Int16Array, Int32Array, Uint8Array, Uint16Array, Uint32Array, Uint8ClampedArray].forEach((element: TypedArrayConstructor) =>
{
    element.prototype['serialize'] = function (this: TypedArrayLike, object: { value: number[] })
    {
        object.value = Array.from(this);

        return object;
    };

    element.prototype['deserialize'] = function (this: TypedArrayLike, object: { value: number[] })
    {
        const ctor = this.constructor as TypedArrayConstructor;

        return new ctor(object.value);
    };
});

const serializeRefKey = '__serialize__Ref__';
const serializeIsRefKey = '__serialize__IsRef__';
const serializeIsRawKey = '__serialize__IsRaw__';
const rootKey = '__root__';
const protoKey = '__proto__';
const serializeKey = '_serialize__';
