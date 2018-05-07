namespace feng3d
{
    /**
     * 序列化装饰器，被装饰属性将被序列化
     * @param {*} target                序列化原型
     * @param {string} propertyKey      序列化属性
     */
    export function serialize(defaultvalue?: any)
    {
        return (target: any, propertyKey: string) => 
        {
            if (!Object.getOwnPropertyDescriptor(target, SERIALIZE_KEY))
                target[SERIALIZE_KEY] = {};
            target[SERIALIZE_KEY][propertyKey] = defaultvalue;
        }
    }
}

var SERIALIZE_KEY = "__serialize__";

[Float32Array, Float64Array, Int8Array, Int16Array, Int32Array, Uint8Array, Uint16Array, Uint32Array, Uint8ClampedArray].forEach(element =>
{
    element.prototype["serialize"] = function (object: { value: number[] })
    {
        object.value = Array.from(this);
        return object;
    }

    element.prototype["deserialize"] = function (object: { value: number[] })
    {
        return new (<any>(this.constructor))(object.value);
    }
});

namespace feng3d
{
    export var serialization = {
        serialize: serialize,
        deserialize: deserialize,
        getSerializableMembers: getSerializableMembers,
        clone: clone,
    };


    var CLASS_KEY = "__class__";

    function getSerializableMembers(object: Object, serializableMembers?: { [propertyname: string]: any })
    {
        serializableMembers = serializableMembers || {};
        if (object["__proto__"])
        {
            getSerializableMembers(object["__proto__"], serializableMembers);
        }
        var superserializableMembers = object[SERIALIZE_KEY];
        if (superserializableMembers)
        {
            for (var key in superserializableMembers)
            {
                serializableMembers[key] = superserializableMembers[key];
            }
        }
        return serializableMembers;
    }

    function getSortSerializableMembers(object: Object)
    {
        var membersobj = getSerializableMembers(object);
        var memberslist: [string, any][] = [];
        for (var key in membersobj)
        {
            if (membersobj.hasOwnProperty(key))
            {
                memberslist.push([key, membersobj[key]]);
            }
        }
        memberslist = memberslist.sort((a, b) => { return a[0] < b[0] ? -1 : 1 });
        return memberslist;
    }

    function serialize(target)
    {
        var result = _serialize(target);
        return result;
    }

    function deserialize(result: any)
    {
        var object = _deserialize(result);
        return object;
    }

    function _serialize(target)
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
                arr[i] = _serialize(target[i]);
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
                        object[key] = _serialize(target[key]);
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
        var serializableMembers = getSortSerializableMembers(target);
        for (var i = 0; i < serializableMembers.length; i++)
        {
            var property = serializableMembers[i][0];
            var objectproperty = property;

            if (target[property] === serializableMembers[i][1])
                continue;
            if (target[property] !== undefined)
            {
                object[objectproperty] = _serialize(target[property]);
            }
        }
        return object;
    }

    function _deserialize(object)
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
                arr.push(_deserialize(element));
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
                target[key] = _deserialize(object[key]);
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
        var serializableMembers = getSortSerializableMembers(target);
        for (var i = 0; i < serializableMembers.length; i++)
        {
            var property = serializableMembers[i][0];
            var objectproperty = property;

            if (object[objectproperty] !== undefined)
            {
                target[property] = _deserialize(object[objectproperty]);
            }
        }
        return target;
    }

    function clone(target)
    {
        return _deserialize(_serialize(target));
    }
}
