if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        value: function (search, pos) {
            return this.substring(!pos || pos < 0 ? 0 : +pos, pos + search.length) === search;
        }
    });
}
if (!String.prototype.includes) {
    Object.defineProperty(String.prototype, 'includes', {
        value: function (search, start) {
            if (typeof start !== 'number') {
                start = 0;
            }
            if (start + search.length > this.length) {
                return false;
            }
            else {
                return this.indexOf(search, start) !== -1;
            }
        }
    });
}
if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (search, this_len) {
        if (this_len === undefined || this_len > this.length) {
            this_len = this.length;
        }
        return this.substring(this_len - search.length, this_len) === search;
    };
}
if (typeof Object.assign != 'function') {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, "assign", {
        value: function assign(target, varArgs) {
            'use strict';
            if (target == null) { // TypeError if undefined or null
                throw new TypeError('Cannot convert undefined or null to object');
            }
            var to = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];
                if (nextSource != null) { // Skip over if undefined or null
                    for (var nextKey in nextSource) {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        },
        writable: true,
        configurable: true
    });
}
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
//参考 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
Map.prototype.getKeys = function () {
    var keys = [];
    this.forEach(function (v, k) {
        keys.push(k);
    });
    return keys;
};
Map.prototype.getValues = function () {
    var values = [];
    this.forEach(function (v, k) {
        values.push(v);
    });
    return values;
};
Array.prototype.unique = function (compare) {
    if (compare === void 0) { compare = function (a, b) { return a == b; }; }
    var arr = this;
    for (var i = 0; i < arr.length; i++) {
        for (var j = arr.length - 1; j > i; j--) {
            if (compare(arr[i], arr[j]))
                arr.splice(j, 1);
        }
    }
    return this;
};
Array.prototype.delete = function (item) {
    var arr = this;
    var index = arr.indexOf(item);
    if (index != -1)
        arr.splice(index, 1);
    return index;
};
//# sourceMappingURL=index.js.map
(function universalModuleDefinition(root, factory)
{
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if (typeof define === 'function' && define.amd)
        define([], factory);
    else if (typeof exports === 'object')
        exports["@feng3d/polyfill"] = factory();
    else
        root["@feng3d/polyfill"] = factory();
    
    var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
    globalObject["feng3d"] = factory();
})(this, function ()
{
    return feng3d;
});
