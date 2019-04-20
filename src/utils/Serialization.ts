namespace feng3d
{
    /**
     * 序列化
     */
    export var serialization: Serialization;

    /**
     * 序列化装饰器，被装饰属性将被序列化
     * @param {*} target                序列化原型
     * @param {string} propertyKey      序列化属性
     */
    export function serialize(target: any, propertyKey: string)
    {
        var serializeInfo = getSerializeInfo(target);
        serializeInfo.propertys.push({ property: propertyKey });
    }

    export interface SerializationComponent
    {
        /**
         * 名称
         */
        name: string;
        /**
         * 序列化
         * 
         * @param target 序列化对象
         * 
         * @returns Json对象
         */
        serialize?(target: any): any

        /**
         * 反序列化
         * 
         * @param object Json的对象
         * 
         * @returns 反序列化后的数据
         */
        deserialize?(object: any): { result: any }
    }

    /**
     * 序列化
     */
    export class Serialization
    {
        components: SerializationComponent[] = [];

        /**
         * 序列化对象
         * @param target 被序列化的对象
         * @returns 序列化后可以转换为Json的数据对象 
         */
        serialize(target)
        {
            //基础类型
            if (Object.isBaseType(target))
                return target;

            // 排除不支持序列化对象
            if (target.hasOwnProperty("serializable") && !target["serializable"])
                return undefined;

            if (target instanceof Feng3dObject && !!(target.hideFlags & HideFlags.DontSave))
                return undefined;

            //处理数组
            if (target.constructor === Array)
            {
                var arr: any[] = [];
                for (var i = 0; i < target.length; i++)
                {
                    arr[i] = this.serialize(target[i]);
                }
                return arr;
            }

            var object = <any>{};

            //处理普通Object
            if (target.constructor === Object)
            {
                for (var key in target)
                {
                    if (target.hasOwnProperty(key))
                    {
                        if (target[key] !== undefined)
                        {
                            object[key] = this.serialize(target[key]);
                        }
                    }
                }
                return object;
            }

            //处理方法
            if (typeof target == "function")
            {
                object[CLASS_KEY] = "function";
                object.data = target.toString();
                return object;
            }

            // 处理资源
            if (AssetData.isAssetData(target))
            {
                object = AssetData.serialize(target);
                return object;
            }

            object[CLASS_KEY] = classUtils.getQualifiedClassName(target);

            if (target["serialize"])
                return target["serialize"](object);

            //使用默认序列化
            var defaultInstance = classUtils.getDefaultInstanceByName(object[CLASS_KEY]);
            this.different(target, defaultInstance, object);
            return object;
        }

        /**
         * 比较两个对象的不同，提取出不同的数据
         * @param target 用于检测不同的数据
         * @param defaultInstance   模板（默认）数据
         * @param different 比较得出的不同（简单结构）数据
         * @returns 比较得出的不同（简单结构）数据
         */
        different(target: Object, defaultInstance: Object, different?: Object)
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
                serializableMembers = Object.keys(target).map(v => { return { property: v } });
            for (var i = 0; i < serializableMembers.length; i++)
            {
                var property = serializableMembers[i].property;
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

                // if (Object.isBaseType(propertyValue))
                // {
                //     different[property] = this.serialize(propertyValue);
                //     continue;
                // }
                // if (defaultPropertyValue == null)
                // {
                //     different[property] = this.serialize(propertyValue);
                //     continue;
                // }
                // if (defaultPropertyValue.constructor != propertyValue.constructor)
                // {
                //     different[property] = this.serialize(propertyValue);
                //     continue;
                // }
                // if (propertyValue.constructor == Array)
                // {
                //     different[property] = this.serialize(propertyValue);
                //     continue;
                // }

                // // this.handleComponentsDeserialize()

                // // 处理序列化组件
                // // for (let i = 0; i < this.components.length; i++)
                // // {
                // //     let component = this.components[i];
                // //     if (!component.deserialize) continue;
                // //     var result = component.serialize(target[property]);
                // //     if (!result) continue;

                // //     return result.result;
                // // }

                // // 处理资源
                // if (AssetData.isAssetData(propertyValue))
                // {
                //     different[property] = this.serialize(propertyValue);
                //     continue;
                // }
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
        deserialize(object)
        {
            //基础类型
            if (Object.isBaseType(object)) return object;

            if (debuger && object.constructor == Object)
            {
                let assetids = rs.getAssetsWithObject(object);
                var assets = assetids.reduce((pv, cv) => { var r = AssetData.getLoadedAssetData(cv); if (r) pv.push(r); return pv; }, []);
                console.assert(assetids.length == assets.length, `存在资源未加载，请使用 deserializeWithAssets 进行反序列化`)
            }

            //处理数组
            if (Array.isArray(object))
            {
                var arr = object.map(v => this.deserialize(v));
                return arr;
            }
            if (object.constructor != Object)
            {
                return object;
            }
            // 获取类型
            var className: string = object[CLASS_KEY];
            // 处理普通Object
            if (className == "Object" || className == null)
            {
                var target = {};
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
                eval("f=" + object.data);
                return f;
            }

            var cls = classUtils.getDefinitionByName(className);
            if (!cls)
            {
                console.warn(`无法序列号对象 ${className}`);
                return undefined;
            }
            target = new cls();

            let result = this.handleComponentsDeserialize(object);
            if (result) return result.result;

            //处理自定义反序列化对象
            if (target["deserialize"])
                return target["deserialize"](object);

            //默认反序列
            this.setValue(target, object);
            return target;
        }

        /**
         * 处理组件反序列化
         * 
         * @returns 序列化是否返回null，否则返回 包含结果的 {result:any} 对象
         */
        private handleComponentsDeserialize(object: any): { result: any }
        {
            // 处理序列化组件
            for (let i = 0; i < this.components.length; i++)
            {
                let component = this.components[i];
                if (!component.deserialize) continue;
                var result = component.deserialize(object);
                if (!result) continue;
                return result;
            }
            return null;
        }

        /**
         * 从数据对象中提取数据给目标对象赋值
         * @param target 目标对象
         * @param object 数据对象
         */
        setValue<T>(target: T, object: gPartial<T>)
        {
            if (!object) return target;

            for (const property in object)
            {
                if (object.hasOwnProperty(property))
                {
                    this.setPropertyValue(target, object, property);
                }
            }
            return target;
        }

        /**
         * 给目标对象的指定属性赋值
         * @param target 目标对象
         * @param object 数据对象
         * @param property 属性名称
         */
        private setPropertyValue<T>(target: T, object: gPartial<T>, property: string)
        {
            if (target[property] == object[property])
                return;

            var objvalue = object[property];
            // 当原值等于null时直接反序列化赋值
            if (target[property] == null)
            {
                target[property] = this.deserialize(objvalue);
                return;
            }
            if (Object.isBaseType(objvalue))
            {
                target[property] = objvalue;
                return;
            }
            if (objvalue.constructor == Array)
            {
                target[property] = this.deserialize(objvalue);
                return;
            }
            // 处理同为Object类型
            if (objvalue[CLASS_KEY] == undefined)
            {
                this.setValue(target[property], objvalue);
                return;
            }

            // 处理资源
            if (target[property] instanceof AssetData)
            {
                target[property] = this.deserialize(objvalue);
                return;
            }
            var targetClassName = classUtils.getQualifiedClassName(target[property]);
            if (targetClassName == objvalue[CLASS_KEY])
            {
                this.setValue(target[property], objvalue);
            } else
            {
                target[property] = this.deserialize(objvalue);
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

    interface SerializeInfo
    {
        propertys: { property: string, asset?: boolean }[];
    }

    /**
     * 获取序列号信息
     * @param object 对象
     */
    function getSerializeInfo(object: Object)
    {
        if (!Object.getOwnPropertyDescriptor(object, SERIALIZE_KEY))
        {
            Object.defineProperty(object, SERIALIZE_KEY, {
                /**
                 * uv数据
                 */
                value: { propertys: [] },
                enumerable: false,
                configurable: true
            });
        }
        var serializeInfo: SerializeInfo = object[SERIALIZE_KEY];
        return serializeInfo;
    }

    /**
     * 获取序列化属性列表
     */
    function getSerializableMembers(object: Object, serializableMembers?: { property: string; asset?: boolean; }[])
    {
        serializableMembers = serializableMembers || [];
        if (object["__proto__"])
        {
            getSerializableMembers(object["__proto__"], serializableMembers);
        }
        var serializeInfo = getSerializeInfo(object);
        if (serializeInfo)
        {
            var propertys = serializeInfo.propertys;
            for (let i = 0, n = propertys.length; i < n; i++)
            {
                serializableMembers.push(propertys[i]);
            }
        }
        return serializableMembers;
    }

    export interface SerializationTempInfo
    {
        loadingNum?: number;
        onLoaded?: () => void;
    }

    serialization = new Serialization();

    serialization.components.push(
        {
            name: "资源序列化",

            deserialize: function (object: any)
            {
                // 处理资源
                if (AssetData.isAssetData(object))
                {
                    var result = AssetData.deserialize(object);
                    return { result: result };
                }
                return null;
            }
        }
    );
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