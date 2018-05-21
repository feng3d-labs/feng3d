namespace feng3d
{
    export var serialization: Serialization;

    /**
     * 序列化装饰器，被装饰属性将被序列化
     * @param {*} target                序列化原型
     * @param {string} propertyKey      序列化属性
     */
    export function serialize(target: any, propertyKey: string)
    {
        if (!Object.getOwnPropertyDescriptor(target, SERIALIZE_KEY))
        {
            Object.defineProperty(target, SERIALIZE_KEY, {
                /**
                 * uv数据
                 */
                value: { propertys: [] },
                enumerable: false,
                configurable: true
            });
        }
        var serializeInfo: SerializeInfo = target[SERIALIZE_KEY];
        serializeInfo.propertys.push(propertyKey);
    }

    export class Serialization
    {
        /**
         * 序列化对象
         * @param target 被序列化的数据
         * @returns 序列化后可以转换为Json的对象 
         */
        serialize(target)
        {
            //基础类型
            if (isBaseType(target))
                return target;

            // 排除不支持序列化对象
            if (target.hasOwnProperty("serializable") && !target["serializable"])
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
                object[CLASS_KEY] = "Object";
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

            var className = classUtils.getQualifiedClassName(target);
            object[CLASS_KEY] = className;

            if (target["serialize"])
                return target["serialize"](object);

            //使用默认序列化
            var defaultInstance = getDefaultInstance(target);
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
            var serializableMembers = getSerializableMembers(target);
            if (target.constructor == Object)
                serializableMembers = Object.keys(target);
            for (var i = 0; i < serializableMembers.length; i++)
            {
                var property = serializableMembers[i];

                if (target[property] === defaultInstance[property])
                    continue;
                if (isBaseType(target[property]))
                {
                    different[property] = target[property];
                    continue;
                }
                if (defaultInstance[property] == null)
                {
                    different[property] = this.serialize(target[property]);
                    continue;
                }
                if (defaultInstance[property].constructor != target[property].constructor)
                {
                    different[property] = this.serialize(target[property]);
                    continue;
                }
                if (target[property].constructor == Array)
                {
                    if (target[property].length == 0)
                    {
                        if (defaultInstance[property].length == 0)
                            continue;
                        different[property] = [];
                        continue;
                    }
                    different[property] = this.serialize(target[property]);
                    continue;
                }
                var diff = this.different(target[property], defaultInstance[property]);
                if (Object.keys(diff).length > 0)
                    different[property] = diff;
            }
            return different;
        }

        /**
         * 反序列化
         * @param object 换为Json的对象
         * @returns 反序列化后的数据
         */
        deserialize(object)
        {
            //基础类型
            if (isBaseType(object)) return object;

            //处理数组
            if (object.constructor == Array)
            {
                var arr: any[] = [];
                object.forEach(element =>
                {
                    arr.push(this.deserialize(element));
                });
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
                    target[key] = this.deserialize(object[key]);
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
                warn(`无法序列号对象 ${className}`);
                return undefined;
            }
            target = new cls();
            //处理自定义反序列化对象
            if (target["deserialize"])
                return target["deserialize"](object);

            //默认反序列
            this.setValue(target, object);
            return target;
        }
        setValue(target: Object, object: Object)
        {
            if (!object) return;

            for (const property in object)
            {
                if (object.hasOwnProperty(property))
                {
                    this.setPropertyValue(target, object, property);
                }
            }

            // var serializableMembers = getSerializableMembers(target);
            // for (var i = 0; i < serializableMembers.length; i++)
            // {
            //     var property = serializableMembers[i];

            //     if (object[property] !== undefined)
            //     {
            //         this.setPropertyValue(target, object, property);
            //     }
            // }
        }
        setPropertyValue(target: Object, object: Object, property: string)
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
            if (isBaseType(objvalue))
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
                if (target[property].constructor == Object)
                {
                    for (const key in objvalue)
                    {
                        this.setPropertyValue(target[property], objvalue, key);
                    }
                } else
                {
                    this.setValue(target[property], objvalue);
                }
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
        clone<T>(target: T): T
        {
            return this.deserialize(this.serialize(target));
        }
    }

    var CLASS_KEY = "__class__";

    var SERIALIZE_KEY = "_serialize__";

    interface SerializeInfo
    {
        propertys: string[];
        default: Object;
    }

    /**
     * 判断是否为基础类型（在序列化中不发生变化的对象）
     */
    function isBaseType(object)
    {
        //基础类型
        if (
            object == undefined
            || object == null
            || typeof object == "boolean"
            || typeof object == "string"
            || typeof object == "number"
        )
            return true;
    }

    /**
     * 获取默认实例
     */
    function getDefaultInstance(object: Object)
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
        serializeInfo.default = serializeInfo.default || new (<any>object.constructor)();
        return serializeInfo.default;
    }

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
        if (Object.getOwnPropertyDescriptor(object, SERIALIZE_KEY))
        {
            var serializeInfo: SerializeInfo = object[SERIALIZE_KEY];
            if (serializeInfo && serializeInfo.propertys)
            {
                var propertys = serializeInfo.propertys;
                for (let i = 0, n = propertys.length; i < n; i++)
                {
                    const element = propertys[i];
                    serializableMembers.push(propertys[i]);
                }
            }
        }
        return serializableMembers;
    }

    serialization = new Serialization();
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

// interface Object
// {
//     /**
//      * 给对象设置值
//      * @param target 被修改的对象
//      * @param object 修改数据
//      */
//     __setValue<T>(target: T, object: Object): T;
// }

// Object.defineProperty(Object.prototype, "__setValue", {
//     /**
//      * uv数据
//      */
//     value: function <T>(target: T, object: Object): T
//     {
//         feng3d.serialization.setValue(target, object);
//         return target;
//     },
//     enumerable: false,
//     configurable: true
// });