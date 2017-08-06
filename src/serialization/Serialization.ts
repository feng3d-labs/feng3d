interface Object
{
    /**
     * 序列化
     * @returns {*}         序列化数据
     * @memberof Object
     */
    serialize(): any
    /**
     * 反序列化
     * @param {*} object    序列化数据
     * @memberof Object
     */
    deserialize(object: any)
}

/**
 * 序列化装饰器，被装饰属性将被序列化
 * @param {*} target                序列化原型
 * @param {string} propertyKey      序列化属性
 */
function serialize(target: any, propertyKey: string) 
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
            enumerable: true,
            configurable: true
        });
    }
}

Object.prototype.serialize = function ()
{
    var object = {};
    var serializableMembers: string[] = this["serializableMembers"];
    if (serializableMembers)
    {
        for (var i = 0, n = serializableMembers.length; i < n; i++)
        {
            var property = serializableMembers[i]
            object[property] = this[property];
        }
    }
    return object;
}

Object.prototype.deserialize = function (object?: any)
{
    var serializableMembers: string[] = this["serializableMembers"];
    if (serializableMembers)
    {
        for (var i = 0, n = serializableMembers.length; i < n; i++)
        {
            var property = serializableMembers[i];
            this[property] = object[property];
        }
    }
}