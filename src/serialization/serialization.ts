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

namespace feng3d
{
    var SERIALIZE_KEY = "_serialize__";

    interface SerializeInfo
    {
        propertys: string[];
        default: Object;
    }

    /**
     * 序列化装饰器，被装饰属性将被序列化
     * @param {*} target                序列化原型
     * @param {string} propertyKey      序列化属性
     */
    export function serialize(target: any, propertyKey: string)
    {
        var serializeInfo: SerializeInfo = target[SERIALIZE_KEY];
        if (!Object.getOwnPropertyDescriptor(target, SERIALIZE_KEY))
            serializeInfo = target[SERIALIZE_KEY] = <any>{};
        serializeInfo.propertys = serializeInfo.propertys || [];
        serializeInfo.propertys.push(propertyKey);
    }

    export var serialization = {
        serialize(target)
        {
            //基础类型
            if (
                target == undefined
                || target == null
                || target.constructor == Boolean
                || target.constructor == String
                || target.constructor == Number
            )
                return target;

            //处理对象
            if (target.hasOwnProperty("serializable") && !target["serializable"])
                return undefined;

            //处理方法
            if (target.constructor === Function)
            {
                return { __t: "function", data: target.toString() }
            }

            //处理数组
            if (target.constructor === Array)
            {
                var arr: any[] = [];
                for (var i = 0; i < target.length; i++)
                {
                    arr[i] = serialization.serialize(target[i]);
                }
                return arr;
            }

            if (target.constructor === Object)
            {
                var object = <any>{};
                for (var key in target)
                {
                    if (target.hasOwnProperty(key))
                    {
                        if (target[key] !== undefined)
                        {
                            object[key] = serialization.serialize(target[key]);
                        }
                    }
                }
                return object;
            }

            var className = ClassUtils.getQualifiedClassName(target);
            var object = <any>{};
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
                    object[property] = serialization.serialize(target[property]);
                }
            }
            return object;
        },
        deserialize(object)
        {
            //基础类型
            if (
                object == undefined
                || object == null
                || typeof object == "boolean"
                || typeof object == "string"
                || typeof object == "number"
            )
                return object;
            //处理数组
            if (object.constructor == Array)
            {
                var arr: any[] = [];
                object.forEach(element =>
                {
                    arr.push(serialization.deserialize(element));
                });
                return arr;
            }

            //处理方法
            if (object.__t == "function")
            {
                var f;
                eval("f=" + object.data);
                return f;
            }

            //处理普通Object
            var className: string = object[CLASS_KEY];

            if (className == undefined)
            {
                var target = {};
                for (var key in object)
                {
                    target[key] = serialization.deserialize(object[key]);
                }
                return target;
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
            var serializableMembers = getSerializableMembers(target);
            for (var i = 0; i < serializableMembers.length; i++)
            {
                var property = serializableMembers[i];

                if (object[property] !== undefined)
                {
                    target[property] = serialization.deserialize(object[property]);
                }
            }
            return target;
        },
        clone(target)
        {
            return serialization.deserialize(serialization.serialize(target));
        },
    };

    var CLASS_KEY = "__class__";

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
}
