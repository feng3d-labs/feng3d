var feng3d;
(function (feng3d) {
    feng3d.lazy = {
        getvalue: function (lazyItem) {
            if (typeof lazyItem == "function")
                return lazyItem();
            return lazyItem;
        }
    };
})(feng3d || (feng3d = {}));
Object.isBaseType = function (object) {
    //基础类型
    if (object == undefined
        || object == null
        || typeof object == "boolean"
        || typeof object == "string"
        || typeof object == "number")
        return true;
};
Object.getPropertyDescriptor = function (host, property) {
    var data = Object.getOwnPropertyDescriptor(host, property);
    if (data) {
        return data;
    }
    var prototype = Object.getPrototypeOf(host);
    if (prototype) {
        return Object.getPropertyDescriptor(prototype, property);
    }
    return null;
};
Object.propertyIsWritable = function (host, property) {
    var data = Object.getPropertyDescriptor(host, property);
    if (!data)
        return false;
    if (data.get && !data.set)
        return false;
    return true;
};
Object.runFunc = function (obj, func) {
    func(obj);
    return obj;
};
Object.isObject = function (obj) {
    return obj != null && (obj.constructor == Object || (obj.constructor.name == "Object")); // 兼容其他 HTMLIFrameElement 传入的Object
};
Object.getPropertyValue = function (object, property) {
    if (typeof property == "string")
        property = property.split(".");
    var value = object;
    var len = property.length;
    for (var i = 0; i < property.length; i++) {
        if (value == null)
            return undefined;
        value = value[property[i]];
    }
    return value;
};
Object.getPropertyChains = function (object) {
    var result = [];
    // 属性名称列表
    var propertys = Object.keys(object);
    // 属性所属对象列表
    var hosts = new Array(propertys.length).fill(object);
    // 父属性所在编号列表
    var parentPropertyIndices = new Array(propertys.length).fill(-1);
    // 处理到的位置
    var index = 0;
    while (index < propertys.length) {
        var host = hosts[index];
        var cp = propertys[index];
        var cv = host[cp];
        var vks;
        if (cv == null || Object.isBaseType(cv) || (vks = Object.keys(cv)).length == 0) {
            // 处理叶子属性
            var ps = [cp];
            var ci = index;
            // 查找并组合属性链
            while ((ci = parentPropertyIndices[ci]) != -1) {
                ps.push(propertys[ci]);
            }
            ps.reverse();
            result.push(ps.join("."));
        }
        else {
            // 处理中间属性
            vks.forEach(function (k) {
                propertys.push(k);
                hosts.push(cv);
                parentPropertyIndices.push(index);
            });
        }
        index++;
    }
    return result;
};
Object.equalDeep = function (a, b) {
    if (a == b)
        return true;
    if (Object.isBaseType(a) || Object.isBaseType(b))
        return a == b;
    if (typeof a == "function" || typeof b == "function")
        return a == b;
    //
    var akeys = Object.keys(a);
    var bkeys = Object.keys(b);
    if (!Array.equal(akeys, bkeys))
        return false;
    if (Array.isArray(a) && Array.isArray(b))
        return a.length == b.length;
    // 检测所有属性
    for (var i = 0; i < akeys.length; i++) {
        var element = akeys[i];
        if (!Object.equalDeep(a[element], b[element])) {
            return false;
        }
    }
    return true;
};
Object.assignShallow = function (target, source) {
    if (source == null)
        return target;
    var keys = Object.keys(source);
    keys.forEach(function (k) {
        target[k] = source[k];
    });
    return target;
};
Object.assignDeep = function (target, source, replacers, deep) {
    if (replacers === void 0) { replacers = []; }
    if (deep === void 0) { deep = Number.MAX_SAFE_INTEGER; }
    if (source == null)
        return target;
    if (deep < 1)
        return target;
    var keys = Object.keys(source);
    keys.forEach(function (k) {
        //
        var handles = [].concat(replacers).concat(Object.assignDeepDefaultHandlers);
        for (var i = 0; i < handles.length; i++) {
            if (handles[i](target, source, k, replacers, deep)) {
                return;
            }
        }
        //
        target[k] = source[k];
    });
    return target;
};
Object.assignDeepDefaultHandlers = [
    function (target, source, key) {
        if (target[key] == source[key])
            return true;
    },
    function (target, source, key) {
        if (Object.isBaseType(target[key]) || Object.isBaseType(source[key])) {
            target[key] = source[key];
            return true;
        }
    },
    function (target, source, key, handlers, deep) {
        if (Array.isArray(source[key]) || Object.isObject(source[key])) {
            Object.assignDeep(target[key], source[key], handlers, deep - 1);
            return true;
        }
    },
];
Map.getKeys = function (map) {
    var keys = [];
    map.forEach(function (v, k) {
        keys.push(k);
    });
    return keys;
};
Map.getValues = function (map) {
    var values = [];
    map.forEach(function (v, k) {
        values.push(v);
    });
    return values;
};
Array.equal = function (self, arr) {
    if (self.length != arr.length)
        return false;
    var keys = Object.keys(arr);
    for (var i = 0, n = keys.length; i < n; i++) {
        var key = keys[i];
        if (self[key] != arr[key])
            return false;
    }
    return true;
};
Array.concatToSelf = function (self) {
    var items = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        items[_i - 1] = arguments[_i];
    }
    var arr = [];
    items.forEach(function (v) { return arr = arr.concat(v); });
    arr.forEach(function (v) { return self.push(v); });
    return self;
};
Array.unique = function (arr, compare) {
    if (compare === void 0) { compare = function (a, b) { return a == b; }; }
    var keys = Object.keys(arr);
    var ids = keys.map(function (v) { return Number(v); }).filter(function (v) { return !isNaN(v); });
    var deleteMap = {};
    //
    for (var i = 0, n = ids.length; i < n; i++) {
        var ki = ids[i];
        if (deleteMap[ki])
            continue;
        for (var j = i + 1; j < n; j++) {
            var kj = ids[j];
            if (compare(arr[ki], arr[kj]))
                deleteMap[kj] = true;
        }
    }
    //
    for (var i = ids.length - 1; i >= 0; i--) {
        var id = ids[i];
        if (deleteMap[id])
            arr.splice(id, 1);
    }
    return arr;
};
Array.delete = function (arr, item) {
    var index = arr.indexOf(item);
    if (index != -1)
        arr.splice(index, 1);
    return index;
};
Array.replace = function (arr, a, b, isAdd) {
    if (isAdd === void 0) { isAdd = true; }
    var isreplace = false;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == a) {
            arr[i] = b;
            isreplace = true;
            break;
        }
    }
    if (!isreplace && isAdd)
        arr.push(b);
    return arr;
};
//# sourceMappingURL=polyfill.js.map