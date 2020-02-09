var feng3d;
(function (feng3d) {
    /**
     * 序列化装饰器
     *
     * 在属性定义前使用 @serialize 进行标记需要序列化
     *
     * @param {*} target                序列化原型
     * @param {string} propertyKey      序列化属性
     */
    function serialize(target, propertyKey) {
        if (!Object.getOwnPropertyDescriptor(target, SERIALIZE_KEY)) {
            Object.defineProperty(target, SERIALIZE_KEY, { value: [] });
        }
        var serializePropertys = target[SERIALIZE_KEY];
        serializePropertys.push(propertyKey);
    }
    feng3d.serialize = serialize;
    /**
     * 序列化属性函数
     *
     * 序列化对象时建议使用 serialization.serialize
     *
     * @param target 序列化后的对象，存放序列化后属性值的对象。
     * @param source 被序列化的对象，提供序列化前属性值的对象。
     * @param property 序列化属性名称
     * @param handlers 序列化属性函数列表
     */
    function propertyHandler(target, source, property, handlers, serialization) {
        for (var i = 0; i < handlers.length; i++) {
            if (handlers[i](target, source, property, handlers, serialization)) {
                return true;
            }
        }
        return true;
    }
    /**
     * 序列化属性函数
     *
     * 序列化对象时建议使用 serialization.serialize
     *
     * @param target 序列化后的对象，存放序列化后属性值的对象。
     * @param source 被序列化的对象，提供序列化前属性值的对象。
     * @param property 序列化属性名称
     * @param handlers 序列化属性函数列表
     */
    function differentPropertyHandler(target, source, property, different, handlers, serialization) {
        for (var i = 0; i < handlers.length; i++) {
            if (handlers[i](target, source, property, different, handlers, serialization)) {
                return true;
            }
        }
        return true;
    }
    var __root__ = "__root__";
    /**
     * 序列化
     */
    var Serialization = /** @class */ (function () {
        function Serialization() {
            /**
             * 是否忽略默认值
             */
            this.omitDefault = true;
            /**
             * 序列化函数列表
             */
            this.serializeHandlers = [];
            /**
             * 反序列化函数列表
             */
            this.deserializeHandlers = [];
            /**
             * 比较差异函数列表
             */
            this.differentHandlers = [];
            /**
             * 设置函数列表
             */
            this.setValueHandlers = [];
        }
        /**
         * 序列化对象
         *
         * 过程中使用 different与默认值作比较减少结果中的数据。
         *
         * @param target 被序列化的对象
         *
         * @returns 序列化后简单数据对象（由Object与Array组合可 JSON.stringify 的简单结构）
         */
        Serialization.prototype.serialize = function (target) {
            var handlers = this.serializeHandlers.sort(function (a, b) { return b.priority - a.priority; }).map(function (v) { return v.handler; });
            var result = {};
            propertyHandler(result, { __root__: target }, __root__, handlers, this);
            var v = result[__root__];
            return v;
        };
        /**
         * 删除 Json 对象中 CLASS_KEY 属性，防止被反序列化。
         *
         * @param obj
         */
        Serialization.prototype.deleteCLASS_KEY = function (obj) {
            if (Object.isBaseType(obj))
                return;
            delete obj[feng3d.CLASS_KEY];
            for (var key in obj) {
                this.deleteCLASS_KEY(obj[key]);
            }
        };
        /**
         * 反序列化对象为基础对象数据（由Object与Array组合）
         *
         * @param object 换为Json的对象
         * @returns 反序列化后的数据
         */
        Serialization.prototype.deserialize = function (object) {
            var handlers = this.deserializeHandlers.sort(function (a, b) { return b.priority - a.priority; }).map(function (v) { return v.handler; });
            var result = {};
            propertyHandler(result, { __root__: object }, __root__, handlers, this);
            var v = result[__root__];
            return v;
        };
        /**
         * 比较两个对象的不同，提取出不同的数据(可能会经过反序列化处理)
         *
         * @param target 用于检测不同的数据
         * @param source   模板（默认）数据
         * @param different 比较得出的不同（简单结构）数据
         *
         * @returns 比较得出的不同数据（由Object与Array组合可 JSON.stringify 的简单结构）
         */
        Serialization.prototype.different = function (target, source) {
            var handlers = this.differentHandlers.sort(function (a, b) { return b.priority - a.priority; }).map(function (v) { return v.handler; });
            var different = { __root__: {} };
            differentPropertyHandler({ __root__: target }, { __root__: source }, __root__, different, handlers, this);
            return different[__root__];
        };
        /**
         * 从数据对象中提取数据给目标对象赋值（可能会经过序列化处理）
         *
         * @param target 目标对象
         * @param source 数据对象 可由Object与Array以及自定义类型组合
         */
        Serialization.prototype.setValue = function (target, source) {
            if (Object.isBaseType(source) || target == source)
                return target;
            var handlers = this.setValueHandlers.sort(function (a, b) { return b.priority - a.priority; }).map(function (v) { return v.handler; });
            propertyHandler({ __root__: target }, { __root__: source }, __root__, handlers, this);
            return target;
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
    var SERIALIZE_KEY = "_serialize__";
    /**
     * 获取序列化属性列表
     */
    function getSerializableMembers(object, serializableMembers) {
        serializableMembers = serializableMembers || [];
        if (object["__proto__"]) {
            getSerializableMembers(object["__proto__"], serializableMembers);
        }
        var serializePropertys = object[SERIALIZE_KEY];
        if (serializePropertys)
            Array.concatToSelf(serializableMembers, serializePropertys);
        Array.unique(serializableMembers);
        return serializableMembers;
    }
    feng3d.serialization = new Serialization();
    feng3d.serialization.serializeHandlers.push(
    //基础类型
    {
        priority: 0,
        handler: function (target, source, property) {
            var spv = source[property];
            if (Object.isBaseType(spv)) {
                target[property] = spv;
                return true;
            }
            return false;
        }
    }, 
    //处理方法
    {
        priority: 0,
        handler: function (target, source, property) {
            var spv = source[property];
            if (spv && typeof spv == "function") {
                var object = {};
                object[feng3d.CLASS_KEY] = "function";
                object.data = spv.toString();
                target[property] = object;
                return true;
            }
            return false;
        }
    }, 
    // 排除不支持序列化对象 serializable == false 时不进行序列化
    {
        priority: 0,
        handler: function (target, source, property) {
            var spv = source[property];
            if (spv && spv["serializable"] == false) {
                return true;
            }
            return false;
        }
    }, 
    // 自定义序列化函数
    {
        priority: 0,
        handler: function (target, source, property) {
            var spv = source[property];
            if (spv && spv["serialize"]) {
                var object = {};
                object[feng3d.CLASS_KEY] = feng3d.classUtils.getQualifiedClassName(spv);
                spv["serialize"](object);
                target[property] = object;
                return true;
            }
            return false;
        }
    }, 
    //处理数组
    {
        priority: 0,
        handler: function (target, source, property, handlers, serialization) {
            var spv = source[property];
            if (Array.isArray(spv)) {
                var arr_1 = target[property] || [];
                var keys = Object.keys(spv);
                keys.forEach(function (v) {
                    propertyHandler(arr_1, spv, v, handlers, serialization);
                });
                target[property] = arr_1;
                return true;
            }
            return false;
        }
    }, 
    //处理普通Object
    {
        priority: 0,
        handler: function (target, source, property, handlers, serialization) {
            var spv = source[property];
            if (Object.isObject(spv)) {
                var object_1 = {};
                var keys = Object.keys(spv);
                keys.forEach(function (key) {
                    propertyHandler(object_1, spv, key, handlers, serialization);
                });
                target[property] = object_1;
                return true;
            }
            return false;
        }
    }, 
    // 使用默认序列化
    {
        priority: -10000,
        handler: function (target, source, property, handlers, serialization) {
            var tpv = target[property];
            var spv = source[property];
            if (!serialization.omitDefault) {
                var object_2 = {};
                var className = feng3d.classUtils.getQualifiedClassName(spv);
                var keys = getSerializableMembers(spv);
                keys.forEach(function (key) {
                    propertyHandler(object_2, spv, key, handlers, serialization);
                });
                object_2[feng3d.CLASS_KEY] = className;
                target[property] = object_2;
                return true;
            }
            // 执行默认忽略默认值
            if (tpv == null || tpv.constructor != spv.constructor) {
                var className = feng3d.classUtils.getQualifiedClassName(spv);
                // 获取或创建对象默认实例，把默认实例保存在构造函数上省去使用map保存。
                var inst = spv.constructor.inst;
                if (!inst)
                    inst = spv.constructor.inst = new spv.constructor();
                // .constructor 上的属性会被继承
                if (!(inst instanceof spv.constructor))
                    inst = spv.constructor.inst = new spv.constructor();
                var diff = serialization.different(spv, inst);
                diff[feng3d.CLASS_KEY] = className;
                target[property] = diff;
            }
            else {
                debugger;
                var diff = serialization.different(spv, tpv);
                if (diff)
                    target[property] = diff;
            }
            return true;
        }
    });
    feng3d.serialization.deserializeHandlers.push(
    //基础类型
    {
        priority: 0,
        handler: function (target, source, property) {
            var spv = source[property];
            if (Object.isBaseType(spv)) {
                target[property] = spv;
                return true;
            }
            return false;
        }
    }, 
    //处理方法
    {
        priority: 0,
        handler: function (target, source, property) {
            var spv = source[property];
            if (spv && spv[feng3d.CLASS_KEY] == "function") {
                target[property] = eval("(" + spv.data + ")");
                return true;
            }
            return false;
        }
    }, 
    // 处理非原生Object对象
    {
        priority: 0,
        handler: function (target, source, property) {
            var spv = source[property];
            if (!Object.isObject(spv) && !Array.isArray(spv)) {
                target[property] = spv;
                return true;
            }
            return false;
        }
    }, 
    //处理数组
    {
        priority: 0,
        handler: function (target, source, property, handlers, serialization) {
            var spv = source[property];
            if (Array.isArray(spv)) {
                var arr = target[property] || [];
                var keys = Object.keys(spv);
                keys.forEach(function (key) {
                    propertyHandler(arr, spv, key, handlers, serialization);
                });
                target[property] = arr;
                return true;
            }
            return false;
        }
    }, 
    // 处理 没有类名称标记的 普通Object
    {
        priority: 0,
        handler: function (target, source, property, handlers, serialization) {
            var tpv = target[property];
            var spv = source[property];
            if (Object.isObject(spv) && spv[feng3d.CLASS_KEY] == null) {
                var obj = {};
                if (tpv)
                    obj = tpv;
                //
                var keys = Object.keys(spv);
                keys.forEach(function (key) {
                    propertyHandler(obj, spv, key, handlers, serialization);
                });
                target[property] = obj;
                return true;
            }
            return false;
        }
    }, 
    // 处理自定义反序列化对象
    {
        priority: 0,
        handler: function (target, source, property) {
            var tpv = target[property];
            var spv = source[property];
            var inst = feng3d.classUtils.getInstanceByName(spv[feng3d.CLASS_KEY]);
            //处理自定义反序列化对象
            if (inst && inst["deserialize"]) {
                if (tpv && tpv.constructor == inst.constructor) {
                    inst = tpv;
                }
                inst["deserialize"](spv);
                target[property] = inst;
                return true;
            }
            return false;
        }
    }, 
    // 处理自定义对象的反序列化 
    {
        priority: -10000,
        handler: function (target, source, property, handlers, serialization) {
            var tpv = target[property];
            var spv = source[property];
            var inst = feng3d.classUtils.getInstanceByName(spv[feng3d.CLASS_KEY]);
            if (inst) {
                if (tpv && tpv.constructor == inst.constructor) {
                    inst = tpv;
                }
                //默认反序列
                var keys = Object.keys(spv);
                keys.forEach(function (key) {
                    if (key != feng3d.CLASS_KEY)
                        propertyHandler(inst, spv, key, handlers, serialization);
                });
                target[property] = inst;
                return true;
            }
            console.warn("\u672A\u5904\u7406");
            return false;
        }
    });
    feng3d.serialization.differentHandlers = [
        // 相等对象
        {
            priority: 0,
            handler: function (target, source, property) {
                if (target[property] == source[property]) {
                    return true;
                }
                return false;
            }
        },
        // 目标数据为null时
        {
            priority: 0,
            handler: function (target, source, property, different, handlers, serialization) {
                if (null == source[property]) {
                    different[property] = serialization.serialize(target[property]);
                    return true;
                }
                return false;
            }
        },
        // 基础类型
        {
            priority: 0,
            handler: function (target, source, property, different, handlers, serialization) {
                var tpv = target[property];
                if (Object.isBaseType(tpv)) {
                    different[property] = tpv;
                    return true;
                }
                return false;
            }
        },
        // 数组
        {
            priority: 0,
            handler: function (target, source, property, different, handlers, serialization) {
                var tpv = target[property];
                var spv = source[property];
                if (Array.isArray(tpv)) {
                    var keys = Object.keys(tpv);
                    var diff = [];
                    keys.forEach(function (key) {
                        differentPropertyHandler(tpv, spv, key, diff, handlers, serialization);
                    });
                    if (Object.keys(diff).length > 0)
                        different[property] = diff;
                    return true;
                }
                return false;
            }
        },
        // 不同对象类型
        {
            priority: 0,
            handler: function (target, source, property, different, handlers, serialization) {
                var tpv = target[property];
                var spv = source[property];
                if (spv.constructor != tpv.constructor) {
                    different[property] = serialization.serialize(tpv);
                    return true;
                }
                return false;
            }
        },
        // 默认处理
        {
            priority: -10000,
            handler: function (target, source, property, different, handlers, serialization) {
                var tpv = target[property];
                var spv = source[property];
                var keys = getSerializableMembers(tpv);
                if (tpv.constructor == Object)
                    keys = Object.keys(tpv);
                var diff = {};
                keys.forEach(function (v) {
                    differentPropertyHandler(tpv, spv, v, diff, handlers, serialization);
                });
                if (Object.keys(diff).length > 0)
                    different[property] = diff;
                return true;
            }
        },
    ];
    /**
     * 设置函数列表
     */
    feng3d.serialization.setValueHandlers = [
        // 值相等时直接返回
        {
            priority: 0,
            handler: function (target, source, property, handlers) {
                if (target[property] == source[property]) {
                    return true;
                }
                return false;
            }
        },
        // 当原值等于null时直接反序列化赋值
        {
            priority: 0,
            handler: function (target, source, property, handlers, serialization) {
                var tpv = target[property];
                var spv = source[property];
                if (tpv == null) {
                    target[property] = serialization.deserialize(spv);
                    return true;
                }
                return false;
            }
        },
        // 处理简单类型
        {
            priority: 0,
            handler: function (target, source, property, handlers) {
                var tpv = target[property];
                var spv = source[property];
                if (Object.isBaseType(spv)) {
                    target[property] = spv;
                    return true;
                }
                return false;
            }
        },
        // 处理数组
        {
            priority: 0,
            handler: function (target, source, property, handlers, serialization) {
                var tpv = target[property];
                var spv = source[property];
                if (Array.isArray(spv)) {
                    console.assert(!!tpv);
                    var keys = Object.keys(spv);
                    keys.forEach(function (key) {
                        propertyHandler(tpv, spv, key, handlers, serialization);
                    });
                    target[property] = tpv;
                    return true;
                }
                return false;
            }
        },
        // 处理非 Object 类型数据
        {
            priority: 0,
            handler: function (target, source, property, handlers, serialization) {
                var tpv = target[property];
                var spv = source[property];
                if (!Object.isObject(spv)) {
                    target[property] = serialization.deserialize(spv);
                    return true;
                }
                return false;
            }
        },
        // 处理 Object 基础类型数据
        {
            priority: 0,
            handler: function (target, source, property, handlers, serialization) {
                var tpv = target[property];
                var spv = source[property];
                if (Object.isObject(spv) && spv[feng3d.CLASS_KEY] == undefined) {
                    console.assert(!!tpv);
                    var keys = Object.keys(spv);
                    keys.forEach(function (key) {
                        propertyHandler(tpv, spv, key, handlers, serialization);
                    });
                    target[property] = tpv;
                    return true;
                }
                return false;
            }
        },
        // 处理自定义类型
        {
            priority: -10000,
            handler: function (target, source, property, handlers, serialization) {
                var tpv = target[property];
                var spv = source[property];
                var targetClassName = feng3d.classUtils.getQualifiedClassName(target[property]);
                // 相同对象类型
                if (targetClassName == spv[feng3d.CLASS_KEY]) {
                    var keys = Object.keys(spv);
                    keys.forEach(function (key) {
                        propertyHandler(tpv, spv, key, handlers, serialization);
                    });
                    target[property] = tpv;
                }
                else {
                    // 不同对象类型
                    target[property] = serialization.deserialize(spv);
                }
                return true;
            }
        },
    ];
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
//# sourceMappingURL=serialization.js.map