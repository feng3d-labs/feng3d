namespace feng3d
{
    /**
     * 序列化装饰器，被装饰属性将被序列化
     * @param {*} target                序列化原型
     * @param {string} propertyKey      序列化属性
     */
    export function serialize(target: any, propertyKey: string) 
    {
        if (!Object.getOwnPropertyDescriptor(target, "__serializableMembers"))
            target.__serializableMembers = [];
        target.__serializableMembers.push(propertyKey);
        if (!Object.getOwnPropertyDescriptor(target, "serializableMembers"))
        {
            Object.defineProperty(target, "serializableMembers", {
                get: function ()
                {
                    var serializableMembers = [];
                    var superserializableMembers = target["__proto__"] && target["__proto__"]["serializableMembers"];
                    if (superserializableMembers)
                    {
                        serializableMembers = serializableMembers.concat(superserializableMembers);
                    }
                    serializableMembers = serializableMembers.concat(target.__serializableMembers);
                    return serializableMembers;
                },
                enumerable: false,
                configurable: false
            });
        }
    }
}

namespace feng3d
{
    export var serialization = {
        serialize: serialize,
        deserialize: deserialize,
    };

    function serialize(target)
    {
        //基础类型
        if (typeof target == "boolean"
            || typeof target == "string"
            || typeof target == "number"
            || target == null
            || target == undefined
        )
        {
            return target;
        }
        //处理数组
        else if (target instanceof Array)
        {
            var arr = [];
            target.forEach(element =>
            {
                var arritem = serialize(element);
                if (arritem !== undefined)
                    arr.push(arritem);
            });
            return arr;
        }
        //处理对象
        else
        {
            if (target.hasOwnProperty("serializable") && !target["serializable"])
                return undefined;

            var object = {};
            object["__class__"] = ClassUtils.getQualifiedClassName(target);

            if (target["serialize"])
            {
                target["serialize"](object);
            } else
            {
                var serializableMembers: string[] = target["serializableMembers"];
                if (serializableMembers)
                {
                    for (var i = 0, n = serializableMembers.length; i < n; i++)
                    {
                        var property = serializableMembers[i];
                        if (target[property] !== undefined)
                            object[property] = serialize(target[property]);
                    }
                } else
                {
                    for (var key in target)
                    {
                        if (target.hasOwnProperty(key))
                        {
                            if (target[key] !== undefined && !(target[key] instanceof Function))
                                object[key] = serialize(target[key]);
                        }
                    }
                }
            }
            return object;
        }
    }

    function deserialize(object, target = null)
    {
        //基础类型
        if (typeof object == "boolean"
            || typeof object == "string"
            || typeof object == "number"
            || object == null
            || object == undefined
        )
        {
            return object;
        }
        //处理数组
        else if (object instanceof Array)
        {
            var arr = [];
            object.forEach(element =>
            {
                arr.push(deserialize(element));
            });
            return arr;
        }
        //处理对象
        else
        {
            if (!target && object.uuid && Feng3dObject.get(object.uuid))
            {
                target = Feng3dObject.get(object.uuid);
            }

            if (!target)
            {
                var className = object["__class__"];
                if (className)
                {
                    var cls = ClassUtils.getDefinitionByName(className);
                    target = new cls();
                } else
                {
                    target = {};
                }
            }
            if (target["deserialize"])
            {
                target["deserialize"](object);
            } else
            {
                var serializableMembers: string[] = target["serializableMembers"];
                if (serializableMembers)
                {
                    for (var i = 0, n = serializableMembers.length; i < n; i++)
                    {
                        var property = serializableMembers[i];
                        target[property] = deserialize(object[property]);
                    }
                } else
                {
                    for (var key in object)
                    {
                        target[key] = deserialize(object[key]);
                    }
                }
            }
            return target;
        }
    }
}
