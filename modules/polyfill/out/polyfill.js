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
var feng3d;
(function (feng3d) {
    feng3d.CLASS_KEY = "__class__";
    /**
     * 类工具
     */
    var ClassUtils = /** @class */ (function () {
        function ClassUtils() {
            this.defaultInstMap = {};
        }
        /**
         * 返回对象的完全限定类名。
         * @param value 需要完全限定类名称的对象，可以将任何 JavaScript 值传递给此方法，包括所有可用的 JavaScript 类型、对象实例、原始类型
         * （如number)和类对象
         * @returns 包含完全限定类名称的字符串。
         */
        ClassUtils.prototype.getQualifiedClassName = function (value) {
            if (value == null)
                return "null";
            var prototype = value.prototype ? value.prototype : Object.getPrototypeOf(value);
            if (prototype.hasOwnProperty(feng3d.CLASS_KEY))
                return prototype[feng3d.CLASS_KEY];
            var className = prototype.constructor.name;
            if (_global[className] == prototype.constructor)
                return className;
            //在可能的命名空间内查找
            for (var i = 0; i < _classNameSpaces.length; i++) {
                var tryClassName = _classNameSpaces[i] + "." + className;
                if (this.getDefinitionByName(tryClassName) == prototype.constructor) {
                    className = tryClassName;
                    registerClass(prototype.constructor, className);
                    return className;
                }
            }
            // console.warn(`未在给出的命名空间 ${_classNameSpaces} 内找到 ${value} 的定义`);
            return className;
        };
        /**
         * 返回 name 参数指定的类的类对象引用。
         * @param name 类的名称。
         */
        ClassUtils.prototype.getDefinitionByName = function (name, readCache) {
            if (readCache === void 0) { readCache = true; }
            if (name == "null")
                return null;
            if (!name)
                return null;
            if (_global[name])
                return _global[name];
            if (readCache && _definitionCache[name])
                return _definitionCache[name];
            var paths = name.split(".");
            var length = paths.length;
            var definition = _global;
            for (var i = 0; i < length; i++) {
                var path = paths[i];
                definition = definition[path];
                if (!definition) {
                    return null;
                }
            }
            _definitionCache[name] = definition;
            return definition;
        };
        /**
         * 获取默认实例
         *
         * @param name 类名称
         */
        ClassUtils.prototype.getDefaultInstanceByName = function (name) {
            var defaultInst = this.defaultInstMap[name];
            if (defaultInst)
                return defaultInst;
            //
            var cls = this.getDefinitionByName(name);
            if (!cls)
                return undefined;
            defaultInst = this.defaultInstMap[name] = new cls();
            // 冻结对象，防止被修改
            Object.freeze(defaultInst);
            return defaultInst;
        };
        /**
         * 获取实例
         *
         * @param name 类名称
         */
        ClassUtils.prototype.getInstanceByName = function (name) {
            var cls = this.getDefinitionByName(name);
            console.assert(cls);
            if (!cls)
                return undefined;
            return new cls();
        };
        /**
         * 新增反射对象所在的命名空间，使得getQualifiedClassName能够得到正确的结果
         */
        ClassUtils.prototype.addClassNameSpace = function (namespace) {
            if (_classNameSpaces.indexOf(namespace) == -1) {
                _classNameSpaces.push(namespace);
            }
        };
        return ClassUtils;
    }());
    feng3d.ClassUtils = ClassUtils;
    ;
    feng3d.classUtils = new ClassUtils();
    var _definitionCache = {};
    var _global;
    var global;
    if (typeof window != "undefined") {
        _global = window;
    }
    else if (typeof global != "undefined") {
        _global = global;
    }
    var _classNameSpaces = ["feng3d"];
    /**
     * 为一个类定义注册完全限定类名
     * @param classDefinition 类定义
     * @param className 完全限定类名
     */
    function registerClass(classDefinition, className) {
        var prototype = classDefinition.prototype;
        Object.defineProperty(prototype, feng3d.CLASS_KEY, { value: className, writable: true, enumerable: false });
    }
})(feng3d || (feng3d = {}));
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
/**
 * 数组元素是否唯一
 * @param equalFn 比较函数
 */
Array.isUnique = function (array, compare) {
    for (var i = array.length - 1; i >= 0; i--) {
        for (var j = 0; j < i; j++) {
            if (compare(array[i], array[j])) {
                return false;
            }
        }
    }
    return true;
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
Math.DEG2RAD = Math.PI / 180;
Math.RAD2DEG = 180 / Math.PI;
Math.PRECISION = 1e-6;
/**
 * 获取唯一标识符
 * @see http://www.broofa.com/Tools/Math.uuid.htm
 */
Math.uuid = Math.uuid || function (length) {
    if (length === void 0) { length = 36; }
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var id = new Array(length);
    var rnd = 0, r = 0;
    return function generateUUID() {
        for (var i = 0; i < length; i++) {
            if (i === 8 || i === 13 || i === 18 || i === 23) {
                id[i] = '-';
            }
            else if (i === 14) {
                id[i] = '4';
            }
            else {
                if (rnd <= 0x02)
                    rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
                r = rnd & 0xf;
                rnd = rnd >> 4;
                id[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
            }
        }
        return id.join('');
    };
}();
/**
 * （夹紧）计算指定值到区间[edge0 ,edge1]最近的值
 *
 * @param value 指定值
 * @param lowerlimit 区间下界
 * @param upperlimit 区间上界
 */
Math.clamp = Math.clamp || function (value, lowerlimit, upperlimit) {
    if ((value - lowerlimit) * (value - upperlimit) <= 0)
        return value;
    if (value < lowerlimit)
        return lowerlimit < upperlimit ? lowerlimit : upperlimit;
    return lowerlimit > upperlimit ? lowerlimit : upperlimit;
};
/**
 * 计算欧几里得模（整数模） ((n % m) + m) % m
 *
 * @param n 被除数
 * @param m 除数
 * @see https://en.wikipedia.org/wiki/Modulo_operation
 */
Math.euclideanModulo = Math.euclideanModulo || function (n, m) {
    return ((n % m) + m) % m;
};
/**
 * 使 x 值从区间 <a1, a2> 线性映射到区间 <b1, b2>
 *
 * @param x 第一个区间中值
 * @param a1 第一个区间起始值
 * @param a2 第一个区间终止值
 * @param b1 第二个区间起始值
 * @param b2 第二个区间起始值
 */
Math.mapLinear = Math.mapLinear || function (x, a1, a2, b1, b2) {
    return b1 + (x - a1) * (b2 - b1) / (a2 - a1);
};
/**
 * 线性插值
 *
 * @param start 起始值
 * @param end 终止值
 * @param t 插值系数 [0 ,1]
 *
 * @see https://en.wikipedia.org/wiki/Linear_interpolation
 */
Math.lerp = Math.lerp || function (start, end, t) {
    return (1 - t) * start + t * end;
};
/**
 * 计算平滑值 3x^2 - 2x^3
 *
 * @param x
 * @param min 最小值
 * @param max 最大值
 *
 * @see http://en.wikipedia.org/wiki/Smoothstep
 */
Math.smoothstep = Math.smoothstep || function (x, min, max) {
    if (x <= min)
        return 0;
    if (x >= max)
        return 1;
    x = (x - min) / (max - min);
    return x * x * (3 - 2 * x);
};
/**
 * 计算平滑值 6x^5 - 15x^4 + 10x^3
 *
 * @param x
 * @param min 最小值
 * @param max 最大值
 */
Math.smootherstep = Math.smootherstep || function (x, min, max) {
    if (x <= min)
        return 0;
    if (x >= max)
        return 1;
    x = (x - min) / (max - min);
    return x * x * x * (x * (x * 6 - 15) + 10);
};
/**
 * 从<low, high>获取随机整数
 *
 * @param low 区间起始值
 * @param high 区间终止值
 */
Math.randInt = Math.randInt || function (low, high) {
    return low + Math.floor(Math.random() * (high - low + 1));
};
/**
 * 从<low, high>获取随机浮点数
 *
 * @param low 区间起始值
 * @param high 区间终止值
 */
Math.randFloat = Math.randFloat || function (low, high) {
    return low + Math.random() * (high - low);
};
/**
 * 从<-range/2, range/2>获取随机浮点数
 *
 * @param range 范围
 */
Math.randFloatSpread = Math.randFloatSpread || function (range) {
    return range * (0.5 - Math.random());
};
/**
 * 角度转换为弧度
 *
 * @param degrees 角度
 */
Math.degToRad = Math.degToRad || function (degrees) {
    return degrees * this.DEG2RAD;
};
/**
 * 弧度转换为角度
 *
 * @param radians 弧度
 */
Math.radToDeg = Math.radToDeg || function (radians) {
    return radians * this.RAD2DEG;
};
/**
 * 判断指定整数是否为2的幂
 *
 * @param value 整数
 */
Math.isPowerOfTwo = Math.isPowerOfTwo || function (value) {
    return (value & (value - 1)) === 0 && value !== 0;
};
/**
 * 获取离指定整数最近的2的幂
 *
 * @param value 整数
 */
Math.nearestPowerOfTwo = Math.nearestPowerOfTwo || function (value) {
    return Math.pow(2, Math.round(Math.log(value) / Math.LN2));
};
/**
 * 获取指定大于等于整数最小2的幂，3->4,5->8,17->32,33->64
 *
 * @param value 整数
 */
Math.nextPowerOfTwo = Math.nextPowerOfTwo || function (value) {
    value--;
    value |= value >> 1;
    value |= value >> 2;
    value |= value >> 4;
    value |= value >> 8;
    value |= value >> 16;
    value++;
    return value;
};
/**
 * 获取目标最近的值
 *
 * source增加或者减少整数倍precision后得到离target最近的值
 *
 * ```
 * Math.toRound(71,0,5);//运算结果为1
 * ```
 *
 * @param source 初始值
 * @param target 目标值
 * @param precision 精度
 */
Math.toRound = Math.toRound || function (source, target, precision) {
    if (precision === void 0) { precision = 360; }
    return source + Math.round((target - source) / precision) * precision;
};
/**
 * 比较两个Number是否相等
 *
 * @param a 数字a
 * @param b 数字b
 * @param precision 进度
 */
Math.equals = Math.equals || function (a, b, precision) {
    if (precision == undefined)
        precision = this.PRECISION;
    return Math.abs(a - b) < precision;
};
/**
 * 计算最大公约数
 *
 * @param a 整数a
 * @param b 整数b
 *
 * @see https://en.wikipedia.org/wiki/Greatest_common_divisor
 */
Math.gcd = Math.gcd || function (a, b) {
    if (b)
        while ((a %= b) && (b %= a))
            ;
    return a + b;
};
/**
 * 计算最小公倍数
 * Least common multiple
 *
 * @param a 整数a
 * @param b 整数b
 *
 * @see https://en.wikipedia.org/wiki/Least_common_multiple
 */
Math.lcm = Math.lcm || function (a, b) {
    return a * b / Math.gcd(a, b);
};
//# sourceMappingURL=polyfill.js.map