var feng3d;
(function (feng3d) {
    /**
     * Object 工具
     *
     * 增强Object功能
     */
    var ObjectUtils = /** @class */ (function () {
        function ObjectUtils() {
        }
        /**
         * 从对象以及对象的原型中获取属性描述
         * @param obj 对象
         * @param property 属性名称
         */
        ObjectUtils.prototype.getPropertyDescriptor = function (host, property) {
            var data = Object.getOwnPropertyDescriptor(host, property);
            if (data)
                return data;
            var prototype = Object.getPrototypeOf(host);
            if (prototype)
                return this.getPropertyDescriptor(prototype, property);
            return null;
        };
        /**
         * 属性是否可写
         * @param obj 对象
         * @param property 属性名称
         */
        ObjectUtils.prototype.propertyIsWritable = function (host, property) {
            var data = this.getPropertyDescriptor(host, property);
            if (!data)
                return false;
            if (data.get && !data.set)
                return false;
            return true;
        };
        /**
         * 执行方法
         *
         * 用例：
         * 1. 给一个新建的对象进行初始化
         *
         *  ``` startLifetime = Object.runFunc(new MinMaxCurve(), (obj) => { obj.mode = MinMaxCurveMode.Constant; (<MinMaxCurveConstant>obj.minMaxCurve).value = 5; }); ```
         *
         * @param obj 对象
         * @param func 被执行的方法
         */
        ObjectUtils.prototype.runFunc = function (obj, func) {
            func(obj);
            return obj;
        };
        return ObjectUtils;
    }());
    feng3d.ObjectUtils = ObjectUtils;
    feng3d.objectutils = new ObjectUtils();
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 增强Map功能
     */
    var MapUtils = /** @class */ (function () {
        function MapUtils() {
        }
        /**
         * 获取所有键
         *
         * @param map Map对象
         */
        MapUtils.prototype.getKeys = function (map) {
            var keys = [];
            map.forEach(function (v, k) {
                keys.push(k);
            });
            return keys;
        };
        /**
         * 获取所有值
         *
         * @param map Map对象
         */
        MapUtils.prototype.getValues = function (map) {
            var values = [];
            map.forEach(function (v, k) {
                values.push(v);
            });
            return values;
        };
        return MapUtils;
    }());
    feng3d.MapUtils = MapUtils;
    feng3d.maputils = new MapUtils();
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 数组工具，增强Array功能
     */
    var ArrayUtils = /** @class */ (function () {
        function ArrayUtils() {
        }
        /**
         * 使数组变得唯一，不存在两个相等的元素
         *
         * @param arr 数组
         * @param compare 比较函数
         *
         * @returns 返回传入的数组
         */
        ArrayUtils.prototype.unique = function (arr, compare) {
            for (var i = 0; i < arr.length; i++) {
                for (var j = arr.length - 1; j > i; j--) {
                    if (compare(arr[i], arr[j]))
                        arr.splice(j, 1);
                }
            }
            return arr;
        };
        /**
         * 删除第一个指定元素
         *
         * @param arr 数组
         * @param item 被删除元素
         *
         * @returns 被删除元素在数组中的位置
         */
        ArrayUtils.prototype.delete = function (arr, item) {
            var index = arr.indexOf(item);
            if (index != -1)
                arr.splice(index, 1);
            return index;
        };
        return ArrayUtils;
    }());
    feng3d.ArrayUtils = ArrayUtils;
    feng3d.arrayutils = new ArrayUtils();
})(feng3d || (feng3d = {}));
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
