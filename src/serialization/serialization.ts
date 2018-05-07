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
        var serializeInfo: SerializeInfo = target[SERIALIZE_KEY];
        if (!Object.getOwnPropertyDescriptor(target, SERIALIZE_KEY))
        {
            Object.defineProperty(target, SERIALIZE_KEY, {
                /**
                 * uv数据
                 */
                value: {},
                enumerable: false,
                configurable: true
            });
        }
        serializeInfo = target[SERIALIZE_KEY];
        serializeInfo.propertys = serializeInfo.propertys || [];
        serializeInfo.propertys.push(propertyKey);
    }

    export class Serialization
    {
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

            //处理普通Object
            if (target.constructor === Object)
            {
                var object = <any>{};
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

            var object = <any>{};
            //处理方法
            if (typeof target == "function")
            {
                object[CLASS_KEY] = "function";
                object.data = target.toString();
                return object;
            }

            var className = ClassUtils.getQualifiedClassName(target);
            object[CLASS_KEY] = className;

            if (target["serialize"])
                return target["serialize"](object);

            //使用默认序列化
            var serializableMembers = getSerializableMembers(target);
            var defatutInstance = getDefatutInstance(target);
            for (var i = 0; i < serializableMembers.length; i++)
            {
                var property = serializableMembers[i];

                if (target[property] === defatutInstance[property])
                    continue;
                if (target[property] !== undefined)
                {
                    object[property] = this.serialize(target[property]);
                }
            }
            return object;
        }

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

            // 获取类型
            var className: string = object[CLASS_KEY];
            // 处理普通Object
            if (className == undefined)
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

            var cls = ClassUtils.getDefinitionByName(className);
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
            var serializableMembers = getSerializableMembers(target);
            for (var i = 0; i < serializableMembers.length; i++)
            {
                var property = serializableMembers[i];

                if (object[property] !== undefined)
                {
                    this.setPropertyValue(target, object, property);
                }
            }
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
            var targetClassName = ClassUtils.getQualifiedClassName(target[property]);
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
    function getDefatutInstance(object: Object)
    {
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