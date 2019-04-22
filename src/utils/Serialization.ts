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
     * 序列化对象属性
     * 
     * 序列化对象时建议使用 serialization.serialize
     * 
     * @param target 序列化后的对象，存放序列化后属性值的对象。
     * @param source 被序列化的对象，提供序列化前属性值的对象。
     * @param property 序列化属性
     * @param replacers 序列化属性函数列表
     */
    function serializeProperty(target: Object, source: Object, property: string, replacers: SerializeReplacer[])
    {
        for (let i = 0; i < replacers.length; i++)
        {
            if (replacers[i](target, source, property, replacers))
            {
                return true;
            }
        }
        return true;
    }

    /**
     * 序列化对象属性
     */
    interface SerializeReplacer
    {
        /**
         * 序列化对象属性
         * 
         * @param target 序列化后的对象，存放序列化后属性值的对象。
         * @param source 被序列化的对象，提供序列化前属性值的对象。
         * @param property 序列化属性名称
         * @param replacers 序列化属性函数列表
         * @returns 返回true时结束该属性后续处理。
         */
        (target: any, source: any, property: string, replacers: SerializeReplacer[]): boolean;
    }

    /**
     * 序列化
     */
    export class Serialization
    {
        /**
         * 序列化转换函数
         */
        serializeReplacers: SerializeReplacer[] = [];

        /**
         * 反序列化转换函数
         */
        deserializeReplacers: SerializeReplacer[] = [];

        /**
         * 序列化对象
         * @param target 被序列化的对象
         * @returns 序列化后可以转换为Json的数据对象 
         */
        serialize<T>(target: T): gPartial<T>
        {
            var result = {};
            serializeProperty(result, { "": target }, "", this.serializeReplacers);
            var v = result[""];
            return v;
        }

        /**
         * 比较两个对象的不同，提取出不同的数据
         * @param target 用于检测不同的数据
         * @param defaultInstance   模板（默认）数据
         * @param different 比较得出的不同（简单结构）数据
         * @returns 比较得出的不同（简单结构）数据
         */
        different<T>(target: T, defaultInstance: T, different?: gPartial<T>)
        {
            different = different || {};
            if (target == defaultInstance) return different;
            if (defaultInstance == null)
            {
                different = this.serialize(target);
                return different;
            }
            var serializableMembers = getSerializableMembers(target);
            if (target.constructor == Object)
                serializableMembers = Object.keys(target);
            for (var i = 0; i < serializableMembers.length; i++)
            {
                var property = serializableMembers[i];
                let propertyValue = target[property];
                let defaultPropertyValue = defaultInstance[property];
                if (propertyValue === defaultPropertyValue)
                    continue;

                if (defaultPropertyValue == null || Object.isBaseType(propertyValue) || Array.isArray(propertyValue) || defaultPropertyValue.constructor != propertyValue.constructor)
                {
                    different[property] = this.serialize(propertyValue);
                } else
                {
                    if (AssetData.isAssetData(propertyValue))
                    {
                        different[property] = this.serialize(propertyValue);
                    } else
                    {
                        var diff = this.different(propertyValue, defaultPropertyValue);
                        if (Object.keys(diff).length > 0)
                            different[property] = diff;
                    }
                }
            }
            return different;
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
            //基础类型
            if (Object.isBaseType(object)) return <any>object;

            if (debuger && Object.isObject(object))
            {
                let assetids = rs.getAssetsWithObject(object);
                var assets = assetids.reduce((pv, cv) => { var r = AssetData.getLoadedAssetData(cv); if (r) pv.push(r); return pv; }, []);
                console.assert(assetids.length == assets.length, `存在资源未加载，请使用 deserializeWithAssets 进行反序列化`)
            }
            //处理数组
            if (Array.isArray(object))
            {
                var arr = object.map(v => this.deserialize(v));
                return <any>arr;
            }
            if (!Object.isObject(object))
            {
                return <any>object;
            }
            // 获取类型
            var className: string = object[CLASS_KEY];
            // 处理普通Object
            if (className == "Object" || className == null)
            {
                var target: T = <any>{};
                for (var key in object)
                {
                    if (key != CLASS_KEY) target[key] = this.deserialize(object[key]);
                }
                return target;
            }

            //处理方法
            if (className == "function")
            {
                var f;
                eval("f=" + (<any>object).data);
                return f;
            }

            var cls = classUtils.getDefinitionByName(className);
            if (!cls)
            {
                console.warn(`无法序列号对象 ${className}`);
                return undefined;
            }
            target = new cls();

            // 处理资源
            if (AssetData.isAssetData(object))
            {
                target = <any>AssetData.deserialize(object);
                return target;
            }

            //处理自定义反序列化对象
            if (target["deserialize"])
                return target["deserialize"](object);

            //默认反序列
            this.setValue(target, object);
            return target;
        }

        /**
         * 从数据对象中提取数据给目标对象赋值
         * @param target 目标对象
         * @param source 数据对象
         */
        setValue<T>(target: T, source: gPartial<T>)
        {
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

            this.deserialize(sourcePropertyValue);

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

    serialization.serializeReplacers = [
        function (target, source, property)
        {
            var spv = source[property];
            //处理方法
            if (typeof spv == "function")
            {
                let object: any = {};
                object[CLASS_KEY] = "function";
                object.data = spv.toString();
                target[property] = object;
                return true;
            }
            return false;
        },
        function (target, source, property)
        {
            var spv = source[property];
            //基础类型
            if (Object.isBaseType(spv))
            {
                target[property] = spv;
                return true;
            }
            return false;
        },
        function (target, source, property)
        {
            var spv = source[property];
            // 排除不支持序列化对象 serializable == false 时不进行序列化
            if (spv && spv["serializable"] == false)
            {
                return true;
            }
            return false;
        },
        function (target, source, property)
        {
            var spv = source[property];
            if (spv instanceof Feng3dObject && (spv.hideFlags & HideFlags.DontSave))
            {
                return true;
            }
            return false;
        },
        function (target, source, property)
        {
            var spv = source[property];
            // 处理资源
            if (AssetData.isAssetData(spv))
            {
                target[property] = AssetData.serialize(<any>spv);
                return true;
            }
            return false;
        },
        function (target, source, property)
        {
            var spv = source[property];
            if (spv["serialize"])
            {
                let object = {};
                object[CLASS_KEY] = classUtils.getQualifiedClassName(spv);
                spv["serialize"](object);
                target[property] = object;
                return true;
            }
            return false;
        },
        function (target, source, property, replacers)
        {
            var spv = source[property];
            //处理数组
            if (Array.isArray(spv))
            {
                let arr = [];
                let keys = Object.keys(spv);
                keys.forEach(v =>
                {
                    serializeProperty(arr, spv, v, replacers);
                });
                target[property] = arr;
                return true;
            }
            return false;
        },
        function (target, source, property, replacers)
        {
            var spv = source[property];
            //处理普通Object
            if (Object.isObject(spv))
            {
                let object = <any>{};
                let keys = Object.keys(spv);
                keys.forEach(key =>
                {
                    serializeProperty(object, spv, key, replacers);
                });
                target[property] = object;
                return true;
            }
            return false;
        },
        function (target, source, property, replacers)
        {
            var spv = source[property];
            //使用默认序列化
            let object = {};
            object[CLASS_KEY] = classUtils.getQualifiedClassName(spv);
            var keys = getSerializableMembers(spv);
            keys.forEach(v =>
            {
                serializeProperty(object, spv, v, replacers);
            });
            target[property] = object;
            return true;
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