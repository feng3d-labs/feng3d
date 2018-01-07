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
        object.value = feng3d.numberutils.toArray(this);
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
        /**
         * 默认数据不保存
         */
        defaultvaluedontsave: true,
        /**
         * 是否压缩
         */
        compress: false,

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

    export interface SerializeVO
    {
        defaultvaluedontsave: boolean;
        compress: boolean;
        strings: string[];
        value: any;
    }

    var defaultSerializeVO: SerializeVO = {
        defaultvaluedontsave: true,
        compress: false,
        strings: [],
        value: null
    };

    function serialize(target)
    {
        var result: SerializeVO = {
            defaultvaluedontsave: serialization.defaultvaluedontsave,
            compress: serialization.compress,
            strings: [],
            value: null
        };
        result.value = _serialize(target, result);
        return result;
    }

    function deserialize(result: any)
    {
        if (result.value)
            var object = _deserialize(result.value, result);
        else
            var object = _deserialize(result);
        return object;
    }

    function _serialize(target, serializeVO?: SerializeVO)
    {
        serializeVO = serializeVO || defaultSerializeVO;
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
                arr[i] = _serialize(target[i], serializeVO);
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
                        object[key] = _serialize(target[key], serializeVO);
                    }
                }
            }
            return object;
        }

        var className = ClassUtils.getQualifiedClassName(target);
        var object = <any>{};
        if (serializeVO.compress)
        {
            var typeIndex = serializeVO.strings.indexOf(className);
            if (typeIndex == -1)
            {
                typeIndex = serializeVO.strings.length;
                serializeVO.strings.push(className);
            }
            object["-1"] = typeIndex;
        } else
            object[CLASS_KEY] = className;

        if (target["serialize"])
            return target["serialize"](object);

        //使用默认序列化
        var serializableMembers = getSortSerializableMembers(target);
        for (var i = 0; i < serializableMembers.length; i++)
        {
            var property = serializableMembers[i][0];
            var objectproperty = serializeVO.compress ? i : property;

            if (serializeVO.defaultvaluedontsave && target[property] === serializableMembers[i][1])
                continue;
            if (target[property] !== undefined)
            {
                object[objectproperty] = _serialize(target[property], serializeVO);
            }
        }
        return object;
    }

    function _deserialize(object, serializeVO?: SerializeVO)
    {
        serializeVO = serializeVO || defaultSerializeVO;

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
                arr.push(_deserialize(element, serializeVO));
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
        var className: string;
        if (serializeVO.compress)
            className = serializeVO.strings[object["-1"]];
        else
            className = object[CLASS_KEY];

        if (className == undefined)
        {
            var target = {};
            for (var key in object)
            {
                target[key] = _deserialize(object[key], serializeVO);
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
            var objectproperty = serializeVO.compress ? i : property;

            if (object[objectproperty] !== undefined)
                target[property] = _deserialize(object[objectproperty], serializeVO);
        }
        return target;
    }

    function clone(target)
    {
        return _deserialize(_serialize(target));
    }
}
