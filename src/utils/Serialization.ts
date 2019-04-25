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
     */
    function propertyHandler(target: Object, source: Object, property: string, handlers: PropertyHandler[])
    {
        for (let i = 0; i < handlers.length; i++)
        {
            if (handlers[i](target, source, property, handlers))
            {
                return true;
            }
        }
        return true;
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
     */
    function differentPropertyHandler(target: Object, source: Object, property: string, different: Object, handlers: DifferentPropertyHandler[])
    {
        for (let i = 0; i < handlers.length; i++)
        {
            if (handlers[i](target, source, property, different, handlers))
            {
                return true;
            }
        }
        return true;
    }

    /**
     * 序列化属性函数项
     */
    interface PropertyHandler
    {
        /**
         * 序列化属性函数项
         * 
         * @param target 序列化后的对象，存放序列化后属性值的对象。
         * @param source 被序列化的对象，提供序列化前属性值的对象。
         * @param property 序列化属性名称
         * @param handlers 序列化属性函数列表
         * @returns 返回true时结束该属性后续处理。
         */
        (target: any, source: any, property: string, handlers: PropertyHandler[]): boolean;
    }

    /**
     * 序列化属性函数项
     */
    interface DifferentPropertyHandler
    {
        /**
         * 序列化属性函数项
         * 
         * @param target 序列化后的对象，存放序列化后属性值的对象。
         * @param source 被序列化的对象，提供序列化前属性值的对象。
         * @param property 序列化属性名称
         * @param handlers 序列化属性函数列表
         * @returns 返回true时结束该属性后续处理。
         */
        (target: any, source: any, property: string, different: Object, handlers: DifferentPropertyHandler[]): boolean;
    }

    /**
     * 序列化
     */
    export class Serialization
    {
        /**
         * 序列化函数列表
         */
        serializeHandlers: { priority: number, handler: PropertyHandler }[] = [];

        /**
         * 反序列化函数列表
         */
        deserializeHandlers: { priority: number, handler: PropertyHandler }[] = [];

        /**
         * 比较差异函数列表
         */
        differentHandlers: { priority: number, handler: DifferentPropertyHandler }[] = [];

        /**
         * 设置函数列表
         */
        setValueHandlers: { priority: number, handler: PropertyHandler }[] = [];

        /**
         * 序列化对象
         * @param target 被序列化的对象
         * @returns 序列化后可以转换为Json的数据对象 
         */
        serialize<T>(target: T): gPartial<T>
        {
            var handlers = this.serializeHandlers.sort((a, b) => b.priority - a.priority).map(v => v.handler);
            var result = {};
            propertyHandler(result, { "": target }, "", handlers);
            var v = result[""];
            return v;
        }

        /**
         * 反序列化
         * 
         * 注意！ 如果反序列前需要把包含的资源提前加载，否则会报错！
         * 
         * @param object 换为Json的对象
         * @returns 反序列化后的数据
         */
        deserialize<T>(object: gPartial<T>): T
        {
            var handlers = this.deserializeHandlers.sort((a, b) => b.priority - a.priority).map(v => v.handler);
            var result = {};
            propertyHandler(result, { "": object }, "", handlers);
            var v = result[""];
            return v;
        }

        /**
         * 比较两个对象的不同，提取出不同的数据
         * 
         * @param target 用于检测不同的数据
         * @param defaultInstance   模板（默认）数据
         * @param different 比较得出的不同（简单结构）数据
         * @returns 比较得出的不同（简单结构）数据
         */
        different<T>(target: T, defaultInstance: T): gPartial<T>
        {
            var handlers = this.differentHandlers.sort((a, b) => b.priority - a.priority).map(v => v.handler);
            var different = { "": {} };
            differentPropertyHandler({ "": target }, { "": defaultInstance }, "", different, handlers);
            return different[""];
        }

        /**
         * 从数据对象中提取数据给目标对象赋值
         * @param target 目标对象
         * @param source 数据对象
         */
        setValue<T>(target: T, source: gPartial<T>)
        {
            // var handlers = this.setValueHandlers.sort((a, b) => b.priority - a.priority).map(v => v.handler);
            // propertyHandler({ "": target }, { "": source }, "", handlers);
            // return target;




            if (!source) return target;

            for (const property in source)
            {
                if (source.hasOwnProperty(property))
                {
                    this.setPropertyValue(target, source, property);
                }
            }
            return target;
        }

        /**
         * 给目标对象的指定属性赋值
         * 
         * @param target 目标对象
         * @param source 数据对象
         * @param property 属性名称
         */
        private setPropertyValue<T>(target: T, source: gPartial<T>, property: string)
        {
            var sourcePropertyValue = source[property];
            var targetPropertyValue = target[property];

            if (target[property] == source[property]) return;

            // 当原值等于null时直接反序列化赋值
            if (target[property] == null)
            {
                target[property] = this.deserialize(sourcePropertyValue);
                return;
            }
            if (Object.isBaseType(sourcePropertyValue))
            {
                target[property] = this.deserialize(sourcePropertyValue);
                return;
            }
            if (sourcePropertyValue.constructor == Array)
            {
                target[property] = this.deserialize(sourcePropertyValue);
                return;
            }
            // if(objvalue)

            // 处理同为Object类型
            if (sourcePropertyValue[CLASS_KEY] == undefined)
            {
                this.setValue(target[property], sourcePropertyValue);
                return;
            }

            // 处理资源
            if (target[property] instanceof AssetData)
            {
                target[property] = this.deserialize(sourcePropertyValue);
                return;
            }
            var targetClassName = classUtils.getQualifiedClassName(target[property]);
            if (targetClassName == sourcePropertyValue[CLASS_KEY])
            {
                this.setValue(target[property], sourcePropertyValue);
            } else
            {
                target[property] = this.deserialize(sourcePropertyValue);
            }
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

    export var CLASS_KEY = "__class__";

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
        if (serializePropertys) serializableMembers.concatToSelf(serializePropertys)
        serializableMembers.unique();
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
        //处理方法
        {
            priority: 0,
            handler: function (target, source, property)
            {
                var spv = source[property];
                if (spv && typeof spv == "function")
                {
                    let object: any = {};
                    object[CLASS_KEY] = "function";
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
        // 处理 Feng3dObject
        {
            priority: 0,
            handler: function (target, source, property)
            {
                var spv = source[property];
                if (spv instanceof Feng3dObject && (spv.hideFlags & HideFlags.DontSave))
                {
                    return true;
                }
                return false;
            }
        },
        // 处理资源
        {
            priority: 0,
            handler: function (target, source, property)
            {
                var spv = source[property];
                if (AssetData.isAssetData(spv))
                {
                    target[property] = AssetData.serialize(<any>spv);
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
                    object[CLASS_KEY] = classUtils.getQualifiedClassName(spv);
                    spv["serialize"](object);
                    target[property] = object;
                    return true;
                }
                return false;
            }
        },
        //处理数组
        {
            priority: 0,
            handler: function (target, source, property, replacers)
            {
                var spv = source[property];
                if (Array.isArray(spv))
                {
                    let arr = [];
                    let keys = Object.keys(spv);
                    keys.forEach(v =>
                    {
                        propertyHandler(arr, spv, v, replacers);
                    });
                    target[property] = arr;
                    return true;
                }
                return false;
            }
        },
        //处理普通Object
        {
            priority: 0,
            handler: function (target, source, property, replacers)
            {
                var spv = source[property];
                if (Object.isObject(spv))
                {
                    let object = <any>{};
                    let keys = Object.keys(spv);
                    keys.forEach(key =>
                    {
                        propertyHandler(object, spv, key, replacers);
                    });
                    target[property] = object;
                    return true;
                }
                return false;
            }
        },
        //使用默认序列化
        {
            priority: 0,
            handler: function (target, source, property, replacers)
            {
                var spv = source[property];
                let object = {};
                object[CLASS_KEY] = classUtils.getQualifiedClassName(spv);
                var keys = getSerializableMembers(spv);
                keys.forEach(v =>
                {
                    propertyHandler(object, spv, v, replacers);
                });
                target[property] = object;
                return true;
            }
        },
    );

    serialization.deserializeHandlers.push(
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
        //处理方法
        {
            priority: 0,
            handler: function (target, source, property)
            {
                var spv = source[property];
                if (spv && spv[CLASS_KEY] == "function")
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
        // 处理资源
        {
            priority: 0,
            handler: function (target, source, property, handlers)
            {
                var tpv = target[property];
                var spv = source[property];
                if (AssetData.isAssetData(spv))
                {
                    target[property] = AssetData.deserialize(spv);
                    return true;
                }
                if (AssetData.isAssetData(tpv))
                {
                    let result = {};
                    propertyHandler(result, { "": spv }, "", handlers);
                    target[property] = result[""];
                    return true;
                }
                return false;
            }
        },
        //处理数组
        {
            priority: 0,
            handler: function (target, source, property, handlers)
            {
                var spv = source[property];
                if (Array.isArray(spv))
                {
                    var arr = [];
                    var keys = Object.keys(spv);
                    keys.forEach(key =>
                    {
                        propertyHandler(arr, spv, key, handlers);
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
            handler: function (target, source, property, handlers)
            {
                var tpv = target[property];
                var spv = source[property];
                if (Object.isObject(spv) && spv[CLASS_KEY] == null)
                {
                    var obj = {};
                    if (tpv) obj = tpv;
                    //
                    var keys = Object.keys(spv);
                    keys.forEach(key =>
                    {
                        propertyHandler(obj, spv, key, handlers);
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
                var inst = classUtils.getInstanceByName(spv[CLASS_KEY]);
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
            priority: 0,
            handler: function (target, source, property, handlers)
            {
                var tpv = target[property];
                var spv = source[property];
                var inst = classUtils.getInstanceByName(spv[CLASS_KEY]);
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
                        if (key != CLASS_KEY)
                            propertyHandler(inst, spv, key, handlers);
                    });
                    target[property] = inst;
                    return true;
                }
                return false;
            }
        },
    );

    serialization.differentHandlers = [
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
        {
            priority: 0,
            handler: function (target, source, property, different)
            {
                if (null == source[property])
                {
                    different[property] = this.serialize(target[property]);
                    return true;
                }
                return false;
            }
        },
        {
            priority: 0,
            handler: function (target, source, property, different)
            {
                let propertyValue = target[property];
                if (Object.isBaseType(propertyValue))
                {
                    different[property] = propertyValue;
                    return true;
                }
                return false;
            }
        },
        {
            priority: 0,
            handler: function (target, source, property, different)
            {
                let propertyValue = target[property];
                if (Array.isArray(propertyValue))
                {
                    different[property] = this.serialize(propertyValue);
                    return true;
                }
                return false;
            }
        },
        {
            priority: 0,
            handler: function (target, source, property, different)
            {
                let propertyValue = target[property];
                let defaultPropertyValue = source[property];
                if (defaultPropertyValue.constructor != propertyValue.constructor)
                {
                    different[property] = this.serialize(propertyValue);
                    return true;
                }
                return false;
            }
        },
        {
            priority: 0,
            handler: function (target, source, property, different)
            {
                let propertyValue = target[property];
                if (AssetData.isAssetData(propertyValue))
                {
                    different[property] = this.serialize(propertyValue);
                    return true;
                }
                return false;
            }
        },
        {
            priority: 0,
            handler: function (target, source, property, different, handlers)
            {
                let tpv = target[property];
                let spv = source[property];

                var keys = getSerializableMembers(tpv);
                if (tpv.constructor == Object)
                    keys = Object.keys(tpv);

                var diff = {};
                keys.forEach(v =>
                {
                    differentPropertyHandler(tpv, spv, v, diff, handlers);
                });
                if (Object.keys(diff).length > 0)
                    different[property] = diff;
                return true;
            }
        },
    ];

    serialization.setValueHandlers = [
        {
            priority: 0,
            handler: function (target, source, property, handlers)
            {
                return false;
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