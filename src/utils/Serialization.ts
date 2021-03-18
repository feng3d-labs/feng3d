namespace feng3d
{
    /**
     * 默认序列化工具
     */
    export var serialization: Serialization;

    /**
     * 序列化装饰器
     * 
     * 在属性定义前使用 @serialize 进行标记需要序列化
     * 
     * @param {*} target                序列化原型
     * @param {string} propertyKey      序列化属性
     */
    export function serialize(target: any, propertyKey: string)
    {
        if (!Object.getOwnPropertyDescriptor(target, SERIALIZE_KEY))
        {
            Object.defineProperty(target, SERIALIZE_KEY, { value: [] });
        }
        var serializePropertys: string[] = target[SERIALIZE_KEY];
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
     * @param handlers 序列化属性函数列表
     * @param beforeHandler 在处理列表前执行
     * @param affterHandler 在处理列表后执行
     */
    function propertyHandler<T extends HandlerParam>(target: Object, source: Object, property: string, param: T)
    {
        var handlers = param.handlers;
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
        (target: any, source: any, property: string, param: T): boolean;
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
    //     (target: any, source: any, property: string, different: Object, handlers: DifferentPropertyHandler[], serialization: Serialization): boolean;
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
        serializedMap: Map<Object, { target: any, property: string }>;
        handlers: PropertyHandler<SerializeHandlerParam>[];
        root: object;
        autoRefID: number;
    }

    interface DeserializeHandlerParam extends HandlerParam
    {
        refs: {
            [refid: string]: {
                target: Object;
                property: string;
                refs: { target: Object, property: string }[];
            }
        };
    }

    interface DifferentHandlerParam extends HandlerParam
    {
        handlers: PropertyHandler<DifferentHandlerParam>[];
        /**
         * 当前对象的不同数据
         */
        different: Object;
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
            var handlers = this.serializeHandlers.sort((a, b) => b.priority - a.priority).map(v => v.handler);

            var param: SerializeHandlerParam = {
                handlers: handlers, serialization: this, root: <any>target,
                serializedMap: new Map(),
                autoRefID: 1,
            };

            var result = {};
            propertyHandler(result, { "__root__": target }, "__root__", param);
            var v = result["__root__"];
            return v;
        }

        /**
         * 删除 Json 对象中 CLASS_KEY 属性，防止被反序列化。
         * 
         * @param obj 
         */
        deleteCLASS_KEY(obj: Object)
        {
            if (Object.isBaseType(obj)) return;

            delete obj[__class__];

            for (const key in obj)
            {
                this.deleteCLASS_KEY(obj[key]);
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
            var handlers = this.deserializeHandlers.sort((a, b) => b.priority - a.priority).map(v => v.handler);

            var param: DeserializeHandlerParam = { handlers: handlers, serialization: this, refs: {} };

            var result = {};
            propertyHandler(result, { "__root__": object }, "__root__", param);
            var v = result["__root__"];

            // 处理 循环引用以及多次引用
            Object.keys(param.refs).forEach(refid =>
            {
                var refs = param.refs[refid];
                var value = refs.target[refs.property];
                delete value["__serialize__IsRaw__"];
                delete value["__serialize__Ref__"];
                refs.refs.forEach(ref =>
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
         * @param source   模板（默认）数据
         * @param different 比较得出的不同（简单结构）数据
         * 
         * @returns 比较得出的不同数据（由Object与Array组合可 JSON.stringify 的简单结构）
         */
        different<T>(target: T, source: T): gPartial<T>
        {
            var handlers = this.differentHandlers.sort((a, b) => b.priority - a.priority).map(v => v.handler);

            var different = { "__root__": {} };

            var param: DifferentHandlerParam = { different: different, handlers: handlers, serialization: this };

            propertyHandler({ "__root__": target }, { __root__: source }, "__root__", param);
            return different["__root__"];
        }

        /**
         * 从数据对象中提取数据给目标对象赋值（可能会经过序列化处理）
         * 
         * @param target 目标对象 
         * @param source 数据对象 可由Object与Array以及自定义类型组合
         */
        setValue<T>(target: T, source: gPartial<T>)
        {
            if (Object.isBaseType(source) || target == source) return target;
            var handlers = this.setValueHandlers.sort((a, b) => b.priority - a.priority).map(v => v.handler);

            var param: HandlerParam = { handlers: handlers, serialization: this };

            propertyHandler({ "__root__": target }, { "__root__": source }, "__root__", param);
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

    var SERIALIZE_KEY = "_serialize__";

    /**
     * 获取序列化属性列表
     */
    function getSerializableMembers(object: Object, serializableMembers?: string[])
    {
        serializableMembers = serializableMembers || [];
        if (object["__proto__"])
        {
            getSerializableMembers(object["__proto__"], serializableMembers);
        }
        var serializePropertys = object[SERIALIZE_KEY];
        if (serializePropertys) Array.concatToSelf(serializableMembers, serializePropertys)
        Array.unique(serializableMembers);
        return serializableMembers;
    }

    export interface SerializationTempInfo
    {
        loadingNum?: number;
        onLoaded?: () => void;
    }

    serialization = new Serialization();

    serialization.serializeHandlers.push(
        //基础类型
        {
            priority: 0,
            handler: function (target, source, property)
            {
                var spv = source[property];
                if (Object.isBaseType(spv))
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
            handler: function (target, source, property, param)
            {
                var spv = source[property];

                var serializedMap = param.serializedMap;
                if (serializedMap.has(spv))
                {
                    // 处理已经被序列化的对象
                    var value = param.serializedMap.get(spv);
                    var tpv = value.target[value.property];
                    if (!Object.isBaseType(tpv))
                    {
                        if (!tpv["__serialize__Ref__"])
                        {
                            tpv["__serialize__Ref__"] = param.autoRefID++;
                            tpv["__serialize__IsRaw__"] = true;
                        }
                        var newtpv = {};
                        newtpv["__serialize__Ref__"] = tpv["__serialize__Ref__"];
                        newtpv["__serialize__IsRef__"] = true;
                        target[property] = newtpv;
                        return true;
                    }

                } else
                {
                    // 记录spv 序列化后的数据保存的位置
                    serializedMap.set(spv, { target: target, property: property });
                }
                return false;
            }
        },
        //处理方法
        {
            priority: 0,
            handler: function (target, source, property)
            {
                var spv = source[property];
                if (spv && typeof spv == "function")
                {
                    let object: any = {};
                    object[__class__] = "function";
                    object.data = spv.toString();
                    target[property] = object;
                    return true;
                }
                return false;
            }
        },
        // 排除不支持序列化对象 serializable == false 时不进行序列化
        {
            priority: 0,
            handler: function (target, source, property)
            {
                var spv = source[property];
                if (spv && spv["serializable"] == false)
                {
                    return true;
                }
                return false;
            }
        },
        // 自定义序列化函数
        {
            priority: 0,
            handler: function (target, source, property)
            {
                var spv = source[property];
                if (spv && spv["serialize"])
                {
                    let object = {};
                    target[property] = object;
                    object[__class__] = classUtils.getQualifiedClassName(spv);
                    spv["serialize"](object);
                    return true;
                }
                return false;
            }
        },
        //处理数组
        {
            priority: 0,
            handler: function (target, source, property, param)
            {
                var spv = source[property];
                if (Array.isArray(spv))
                {
                    let arr = target[property] || [];
                    target[property] = arr;
                    let keys = Object.keys(spv);
                    keys.forEach(v =>
                    {
                        propertyHandler(arr, spv, v, param);
                    });
                    return true;
                }
                return false;
            }
        },
        //处理普通Object
        {
            priority: 0,
            handler: function (target, source, property, param)
            {
                var spv = source[property];
                if (Object.isObject(spv))
                {
                    let object = <any>{};
                    target[property] = object;
                    let keys = Object.keys(spv);
                    keys.forEach(key =>
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
            handler: function (target, source, property, param)
            {
                var tpv = target[property];
                var spv = source[property];

                if (!param.serialization.omitDefault)
                {
                    let object = <any>{};
                    target[property] = object;
                    var className = classUtils.getQualifiedClassName(spv);
                    var keys = getSerializableMembers(spv);
                    keys.forEach(key =>
                    {
                        propertyHandler(object, spv, key, param);
                    });
                    object[__class__] = className;
                    return true;
                }

                // 执行默认忽略默认值
                if (tpv == null || tpv.constructor != spv.constructor)
                {
                    var className = classUtils.getQualifiedClassName(spv);
                    // 获取或创建对象默认实例，把默认实例保存在构造函数上省去使用map保存。
                    var inst = spv.constructor.inst;
                    if (!inst)
                        inst = spv.constructor.inst = new spv.constructor();
                    // .constructor 上的属性会被继承
                    if (!(inst instanceof spv.constructor))
                        inst = spv.constructor.inst = new spv.constructor();
                    var diff: any = param.serialization.different(spv, inst);
                    diff[__class__] = className;
                    target[property] = diff;
                } else
                {
                    debugger;
                    var diff: any = param.serialization.different(spv, tpv);
                    if (diff)
                        target[property] = diff;
                }


                return true;
            }
        },
    );

    serialization.deserializeHandlers = [
        //基础类型
        {
            priority: 0,
            handler: function (target, source, property)
            {
                var spv = source[property];
                if (Object.isBaseType(spv))
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
            handler: function (target, source, property, param)
            {
                var spv = source[property];

                var refs = param.refs;

                if (spv["__serialize__Ref__"] != undefined)
                {
                    var refid = spv["__serialize__Ref__"];

                    var currentRef = refs[refid] = refs[refid] || { refs: [], target: null, property: null };
                    if (spv["__serialize__IsRaw__"])
                    {
                        currentRef.target = target;
                        currentRef.property = property;
                    } else
                    {
                        currentRef.refs.push({ target: target, property: property });
                        return true;
                    }
                }
                return false;
            }
        },
        //处理方法
        {
            priority: 0,
            handler: function (target, source, property)
            {
                var spv = source[property];
                if (spv && spv[__class__] == "function")
                {
                    target[property] = eval(`(${spv.data})`);
                    return true;
                }
                return false;
            }
        },
        // 处理非原生Object对象
        {
            priority: 0,
            handler: function (target, source, property)
            {
                var spv = source[property];
                if (!Object.isObject(spv) && !Array.isArray(spv))
                {
                    target[property] = spv;
                    return true;
                }
                return false;
            }
        },
        //处理数组
        {
            priority: 0,
            handler: function (target, source, property, param)
            {
                var spv = source[property];
                if (Array.isArray(spv))
                {
                    var arr = target[property] || [];
                    var keys = Object.keys(spv);
                    keys.forEach(key =>
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
            handler: function (target, source, property, param)
            {
                var tpv = target[property];
                var spv = source[property];
                if (Object.isObject(spv) && spv[__class__] == null)
                {
                    var obj = {};
                    if (tpv) obj = tpv;
                    //
                    var keys = Object.keys(spv);
                    keys.forEach(key =>
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
            handler: function (target, source, property)
            {
                var tpv = target[property];
                var spv = source[property];
                var inst = classUtils.getInstanceByName(spv[__class__]);
                //处理自定义反序列化对象
                if (inst && inst["deserialize"])
                {
                    if (tpv && tpv.constructor == inst.constructor)
                    {
                        inst = tpv;
                    }
                    inst["deserialize"](spv);
                    target[property] = inst;
                    return true;
                }
                return false;
            }
        },
        // 处理自定义对象的反序列化 
        {
            priority: -10000,
            handler: function (target, source, property, param)
            {
                var tpv = target[property];
                var spv = source[property];
                var inst = classUtils.getInstanceByName(spv[__class__]);
                if (inst)
                {
                    if (tpv && tpv.constructor == inst.constructor)
                    {
                        inst = tpv;
                    }
                    //默认反序列
                    var keys = Object.keys(spv);
                    keys.forEach(key =>
                    {
                        if (key != __class__)
                            propertyHandler(inst, spv, key, param);
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
            handler: function (target, source, property)
            {
                if (target[property] == source[property])
                {
                    return true;
                }
                return false;
            }
        },
        // 目标数据为null时
        {
            priority: 0,
            handler: function (target, source, property, param)
            {
                if (null == source[property])
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
            handler: function (target, source, property, param)
            {
                let tpv = target[property];
                if (Object.isBaseType(tpv))
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
            handler: function (target, source, property, param)
            {
                var different = param.different;

                let tpv = target[property];
                let spv = source[property];
                if (Array.isArray(tpv))
                {
                    var keys = Object.keys(tpv);
                    var diff = [];
                    var newParam: DifferentHandlerParam = { different: diff, handlers: param.handlers, serialization: param.serialization };
                    keys.forEach(key =>
                    {
                        propertyHandler(tpv, spv, key, newParam);
                    });
                    if (Object.keys(diff).length > 0)
                        different[property] = diff;
                    return true;
                }
                return false;
            }
        },
        // 不同对象类型
        {
            priority: 0,
            handler: function (target, source, property, param)
            {
                let tpv = target[property];
                let spv = source[property];
                if (spv.constructor != tpv.constructor)
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
            handler: function (target, source, property, param)
            {
                var different = param.different;
                let tpv = target[property];
                let spv = source[property];

                var keys = getSerializableMembers(tpv);
                if (tpv.constructor == Object)
                    keys = Object.keys(tpv);

                var diff = {};
                var newParam: DifferentHandlerParam = { different: diff, handlers: param.handlers, serialization: param.serialization };
                keys.forEach(v =>
                {
                    propertyHandler(tpv, spv, v, newParam);
                });
                if (Object.keys(diff).length > 0)
                    different[property] = diff;
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
            handler: function (target, source, property, handlers)
            {
                if (target[property] == source[property])
                {
                    return true;
                }
                return false;
            }
        },
        // 当原值等于null时直接反序列化赋值
        {
            priority: 0,
            handler: function (target, source, property, param)
            {
                var tpv = target[property];
                var spv = source[property];
                if (tpv == null)
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
            handler: function (target, source, property)
            {
                var tpv = target[property];
                var spv = source[property];
                if (Object.isBaseType(spv))
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
            handler: function (target, source, property, param)
            {
                var tpv = target[property];
                var spv = source[property];
                if (Array.isArray(spv))
                {
                    console.assert(!!tpv);
                    var keys = Object.keys(spv);
                    keys.forEach(key =>
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
            handler: function (target, source, property, param)
            {
                var tpv = target[property];
                var spv = source[property];
                if (!Object.isObject(spv))
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
            handler: function (target, source, property, param)
            {
                var tpv = target[property];
                var spv = source[property];
                if (Object.isObject(spv) && spv[__class__] == undefined)
                {
                    console.assert(!!tpv);
                    var keys = Object.keys(spv);
                    keys.forEach(key =>
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
            handler: function (target, source, property, param)
            {
                var tpv = target[property];
                var spv = source[property];

                var targetClassName = classUtils.getQualifiedClassName(target[property]);
                // 相同对象类型
                if (targetClassName == spv[__class__])
                {
                    var keys = Object.keys(spv);
                    keys.forEach(key =>
                    {
                        propertyHandler(tpv, spv, key, param);
                    });
                    target[property] = tpv;
                } else
                {
                    // 不同对象类型
                    target[property] = param.serialization.deserialize(spv);
                }
                return true;
            }
        },
    ];


}



// [Float32Array, Float64Array, Int8Array, Int16Array, Int32Array, Uint8Array, Uint16Array, Uint32Array, Uint8ClampedArray].forEach(element =>
// {
//     element.prototype["serialize"] = function (object: { value: number[] })
//     {
//         object.value = Array.from(this);
//         return object;
//     }

//     element.prototype["deserialize"] = function (object: { value: number[] })
//     {
//         return new (<any>(this.constructor))(object.value);
//     }
// });