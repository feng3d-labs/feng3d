var feng3d;
(function (feng3d) {
    /**
     * 序列化装饰器，被装饰属性将被序列化
     * @param {*} target                序列化原型
     * @param {string} propertyKey      序列化属性
     */
    function serialize(target, propertyKey) {
        var serializeInfo = getSerializeInfo(target);
        serializeInfo.propertys.push({ property: propertyKey });
    }
    feng3d.serialize = serialize;
    /**
     * 序列化
     */
    var Serialization = /** @class */ (function () {
        function Serialization() {
        }
        /**
         * 序列化对象
         * @param target 被序列化的对象
         * @returns 序列化后可以转换为Json的数据对象
         */
        Serialization.prototype.serialize = function (target, saveFlags) {
            if (saveFlags === void 0) { saveFlags = HideFlags.DontSave; }
            //基础类型
            if (isBaseType(target))
                return target;
            // 排除不支持序列化对象
            if (target.hasOwnProperty("serializable") && !target["serializable"])
                return undefined;
            if (target instanceof Feng3dObject && !!(target.hideFlags & saveFlags))
                return undefined;
            //处理数组
            if (target.constructor === Array) {
                var arr = [];
                for (var i = 0; i < target.length; i++) {
                    arr[i] = this.serialize(target[i]);
                }
                return arr;
            }
            var object = {};
            //处理普通Object
            if (target.constructor === Object) {
                for (var key in target) {
                    if (target.hasOwnProperty(key)) {
                        if (target[key] !== undefined) {
                            object[key] = this.serialize(target[key]);
                        }
                    }
                }
                return object;
            }
            //处理方法
            if (typeof target == "function") {
                object[feng3d.CLASS_KEY] = "function";
                object.data = target.toString();
                return object;
            }
            object[feng3d.CLASS_KEY] = classUtils.getQualifiedClassName(target);
            if (target["serialize"])
                return target["serialize"](object);
            //使用默认序列化
            var defaultInstance = getDefaultInstance(target);
            this.different(target, defaultInstance, object);
            return object;
        };
        /**
         * 比较两个对象的不同，提取出不同的数据
         * @param target 用于检测不同的数据
         * @param defaultInstance   模板（默认）数据
         * @param different 比较得出的不同（简单结构）数据
         * @returns 比较得出的不同（简单结构）数据
         */
        Serialization.prototype.different = function (target, defaultInstance, different) {
            different = different || {};
            if (target == defaultInstance)
                return different;
            if (defaultInstance == null) {
                different = this.serialize(target);
                return different;
            }
            var serializableMembers = getSerializableMembers(target);
            if (target.constructor == Object)
                serializableMembers = Object.keys(target).map(function (v) { return { property: v }; });
            for (var i = 0; i < serializableMembers.length; i++) {
                var property = serializableMembers[i].property;
                if (target[property] === defaultInstance[property])
                    continue;
                if (isBaseType(target[property])) {
                    different[property] = target[property];
                    continue;
                }
                if (defaultInstance[property] == null) {
                    different[property] = this.serialize(target[property]);
                    continue;
                }
                if (defaultInstance[property].constructor != target[property].constructor) {
                    different[property] = this.serialize(target[property]);
                    continue;
                }
                if (target[property].constructor == Array) {
                    if (target[property].length == 0) {
                        if (defaultInstance[property].length == 0)
                            continue;
                        different[property] = [];
                        continue;
                    }
                    different[property] = this.serialize(target[property]);
                    continue;
                }
                // 处理资源
                if (target[property] instanceof AssetData && target[property].assetId != undefined) {
                    var diff0 = {};
                    diff0[feng3d.CLASS_KEY] = classUtils.getQualifiedClassName(target[property]);
                    diff0.assetId = target[property].assetId;
                    different[property] = diff0;
                    continue;
                }
                var diff = this.different(target[property], defaultInstance[property]);
                if (Object.keys(diff).length > 0)
                    different[property] = diff;
            }
            return different;
        };
        /**
         * 反序列化
         *
         * 注意！ 如果反序列前需要把包含的资源提前加载，否则会报错！
         *
         * @param object 换为Json的对象
         * @returns 反序列化后的数据
         */
        Serialization.prototype.deserialize = function (object) {
            var _this = this;
            //基础类型
            if (isBaseType(object))
                return object;
            if (debug.debuger && object.constructor == Object) {
                var assetids = this.getAssets(object);
                var assets = assetids.reduce(function (pv, cv) { var r = rs.getAssetData(cv); if (r)
                    pv.push(r); return pv; }, []);
                console.assert(assetids.length == assets.length, "\u5B58\u5728\u8D44\u6E90\u672A\u52A0\u8F7D\uFF0C\u8BF7\u4F7F\u7528 deserializeWithAssets \u8FDB\u884C\u53CD\u5E8F\u5217\u5316");
            }
            //处理数组
            if (object instanceof Array) {
                var arr = object.map(function (v) { return _this.deserialize(v); });
                return arr;
            }
            if (object.constructor != Object) {
                return object;
            }
            // 获取类型
            var className = object[feng3d.CLASS_KEY];
            // 处理普通Object
            if (className == "Object" || className == null) {
                var target = {};
                for (var key in object) {
                    if (key != feng3d.CLASS_KEY)
                        target[key] = this.deserialize(object[key]);
                }
                return target;
            }
            //处理方法
            if (className == "function") {
                var f;
                eval("f=" + object.data);
                return f;
            }
            var cls = classUtils.getDefinitionByName(className);
            if (!cls) {
                console.warn("\u65E0\u6CD5\u5E8F\u5217\u53F7\u5BF9\u8C61 " + className);
                return undefined;
            }
            target = new cls();
            // 处理资源
            if (target instanceof AssetData && object.assetId != undefined) {
                var result = rs.getAssetData(object.assetId);
                debug.debuger && console.assert(!!result);
                return result;
            }
            //处理自定义反序列化对象
            if (target["deserialize"])
                return target["deserialize"](object);
            //默认反序列
            this.setValue(target, object);
            return target;
        };
        /**
         * 从数据对象中提取数据给目标对象赋值
         * @param target 目标对象
         * @param object 数据对象
         */
        Serialization.prototype.setValue = function (target, object) {
            if (!object)
                return target;
            for (var property in object) {
                if (object.hasOwnProperty(property)) {
                    this.setPropertyValue(target, object, property);
                }
            }
            return target;
        };
        /**
         * 给目标对象的指定属性赋值
         * @param target 目标对象
         * @param object 数据对象
         * @param property 属性名称
         */
        Serialization.prototype.setPropertyValue = function (target, object, property) {
            if (target[property] == object[property])
                return;
            var objvalue = object[property];
            // 当原值等于null时直接反序列化赋值
            if (target[property] == null) {
                target[property] = this.deserialize(objvalue);
                return;
            }
            if (isBaseType(objvalue)) {
                target[property] = objvalue;
                return;
            }
            if (objvalue.constructor == Array) {
                target[property] = this.deserialize(objvalue);
                return;
            }
            // 处理同为Object类型
            if (objvalue[feng3d.CLASS_KEY] == undefined) {
                if (target[property].constructor == Object) {
                    for (var key in objvalue) {
                        this.setPropertyValue(target[property], objvalue, key);
                    }
                }
                else {
                    this.setValue(target[property], objvalue);
                }
                return;
            }
            // 处理资源
            if (target[property] instanceof AssetData) {
                target[property] = this.deserialize(objvalue);
                return;
            }
            var targetClassName = classUtils.getQualifiedClassName(target[property]);
            if (targetClassName == objvalue[feng3d.CLASS_KEY]) {
                this.setValue(target[property], objvalue);
            }
            else {
                target[property] = this.deserialize(objvalue);
            }
        };
        /**
         * 获取需要反序列化对象中的资源id列表
         */
        Serialization.prototype.getAssets = function (object, assetids) {
            var _this = this;
            if (assetids === void 0) { assetids = []; }
            //基础类型
            if (isBaseType(object))
                return assetids;
            //处理数组
            if (object instanceof Array) {
                object.forEach(function (v) { return _this.getAssets(v, assetids); });
                return assetids;
            }
            // 获取类型
            var className = object[feng3d.CLASS_KEY];
            // 处理普通Object
            if (className == "Object" || className == null) {
                for (var key in object) {
                    if (key != feng3d.CLASS_KEY)
                        this.getAssets(object[key], assetids);
                }
                return assetids;
            }
            //处理方法
            if (className == "function")
                return assetids;
            var cls = classUtils.getDefinitionByName(className);
            if (!cls) {
                console.warn("\u65E0\u6CD5\u5E8F\u5217\u53F7\u5BF9\u8C61 " + className);
                return assetids;
            }
            var target = new cls();
            // 处理资源
            if (target instanceof AssetData && object.assetId != undefined) {
                assetids.push(object.assetId);
                return assetids;
            }
            return assetids;
        };
        /**
         * 反序列化包含资源的对象
         *
         * @param object 反序列化的对象
         * @param callback 完成回调
         */
        Serialization.prototype.deserializeWithAssets = function (object, callback) {
            var _this = this;
            var assetids = this.getAssets(object);
            var result = [];
            var fns = assetids.map(function (v) { return function (callback) {
                rs.readAssetData(v, function (err, data) {
                    result.push(data);
                });
            }; });
            task.parallel(fns)(function () {
                debug.debuger && console.assert(assetids.length == result.filter(function (v) { return v != null; }).length);
                var r = _this.deserialize(object);
                callback(r);
            });
        };
        /**
         * 克隆
         * @param target 被克隆对象
         */
        Serialization.prototype.clone = function (target) {
            return this.deserialize(this.serialize(target));
        };
        return Serialization;
    }());
    feng3d.Serialization = Serialization;
    feng3d.CLASS_KEY = "__class__";
    var SERIALIZE_KEY = "_serialize__";
    /**
     * 判断是否为基础类型（在序列化中不发生变化的对象）
     */
    function isBaseType(object) {
        //基础类型
        if (object == undefined
            || object == null
            || typeof object == "boolean"
            || typeof object == "string"
            || typeof object == "number")
            return true;
    }
    /**
     * 获取默认实例
     */
    function getDefaultInstance(object) {
        var serializeInfo = getSerializeInfo(object);
        serializeInfo.default = serializeInfo.default || new object.constructor();
        return serializeInfo.default;
    }
    /**
     * 获取序列号信息
     * @param object 对象
     */
    function getSerializeInfo(object) {
        if (!Object.getOwnPropertyDescriptor(object, SERIALIZE_KEY)) {
            Object.defineProperty(object, SERIALIZE_KEY, {
                /**
                 * uv数据
                 */
                value: { propertys: [] },
                enumerable: false,
                configurable: true
            });
        }
        var serializeInfo = object[SERIALIZE_KEY];
        return serializeInfo;
    }
    /**
     * 获取序列化属性列表
     */
    function getSerializableMembers(object, serializableMembers) {
        serializableMembers = serializableMembers || [];
        if (object["__proto__"]) {
            getSerializableMembers(object["__proto__"], serializableMembers);
        }
        var serializeInfo = getSerializeInfo(object);
        if (serializeInfo) {
            var propertys = serializeInfo.propertys;
            for (var i = 0, n = propertys.length; i < n; i++) {
                serializableMembers.push(propertys[i]);
            }
        }
        return serializableMembers;
    }
    function initTempInfo(tempInfo) {
        tempInfo = tempInfo || { loadingNum: 0, onLoaded: function () { } };
        tempInfo.loadingNum = tempInfo.loadingNum || 0;
        return tempInfo;
    }
    feng3d.serialization = new Serialization();
})(feng3d || (feng3d = {}));
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
//# sourceMappingURL=index.js.map
(function universalModuleDefinition(root, factory)
{
    if (typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if (typeof define === 'function' && define.amd)
        define([], factory);
    else if (typeof exports === 'object')
        exports["@feng3d/serialization"] = factory();
    else
        root["@feng3d/serialization"] = factory();
    
    var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
    globalObject["feng3d"] = factory();
})(this, function ()
{
    return feng3d;
});
