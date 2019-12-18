"use strict";
var feng3d;
(function (feng3d) {
    /**
     * 观察装饰器，观察被装饰属性的变化
     *
     * @param onChange 属性变化回调  例如参数为“onChange”时，回调将会调用this.onChange(property, oldValue, newValue)
     *
     * 使用@watch后会自动生成一个带"_"的属性，例如 属性"a"会生成"_a"
     *
     * 通过使用 eval 函数 生成出 与自己手动写的set get 一样的函数，性能已经接近 手动写的get set函数。
     *
     */
    function watch(onChange) {
        return function (target, property) {
            var key = "_" + property;
            var get = eval("(function (){return this." + key + "})");
            var set = eval("(function (value){\n                if (this." + key + " == value)\n                    return;\n                var oldValue = this." + key + ";\n                this." + key + " = value;\n                this." + onChange + "(\"" + property + "\", oldValue, value);\n            })");
            console.assert(target[onChange], "\u5728\u5BF9\u8C61 " + target + " \u4E0A\u627E\u4E0D\u5230\u65B9\u6CD5 " + onChange);
            Object.defineProperty(target, property, {
                get: get,
                set: set,
                enumerable: true,
                configurable: true,
            });
        };
    }
    feng3d.watch = watch;
    var Watcher = /** @class */ (function () {
        function Watcher() {
        }
        /**
         * 监听对象属性的变化
         *
         * 注意：使用watch后获取该属性值的性能将会是原来的1/60，避免在运算密集处使用该函数。
         *
         * @param object 被监听对象
         * @param property 被监听属性
         * @param handler 变化回调函数 (object: T, property: string, oldvalue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        Watcher.prototype.watch = function (object, property, handler, thisObject) {
            if (!Object.getOwnPropertyDescriptor(object, feng3d.__watchs__)) {
                Object.defineProperty(object, feng3d.__watchs__, {
                    value: {},
                    enumerable: false,
                    configurable: true,
                    writable: false,
                });
            }
            var _property = property;
            var watchs = object[feng3d.__watchs__];
            if (!watchs[_property]) {
                var oldPropertyDescriptor = Object.getOwnPropertyDescriptor(object, _property);
                watchs[_property] = { value: object[_property], oldPropertyDescriptor: oldPropertyDescriptor, handlers: [] };
                //
                var data = Object.getPropertyDescriptor(object, _property);
                if (data && data.set && data.get) {
                    data = { enumerable: data.enumerable, configurable: true, get: data.get, set: data.set };
                    var orgSet = data.set;
                    data.set = function (value) {
                        var oldvalue = this[_property];
                        if (oldvalue != value) {
                            orgSet && orgSet.call(this, value);
                            notifyListener(this, _property, oldvalue);
                        }
                    };
                }
                else if (!data || (!data.get && !data.set)) {
                    data = { enumerable: true, configurable: true };
                    data.get = function () {
                        return this[feng3d.__watchs__][_property].value;
                    };
                    data.set = function (value) {
                        var oldvalue = this[feng3d.__watchs__][_property].value;
                        if (oldvalue != value) {
                            this[feng3d.__watchs__][_property].value = value;
                            notifyListener(this, _property, oldvalue);
                        }
                    };
                }
                else {
                    console.warn("watch " + object + " . " + _property + " \u5931\u8D25\uFF01");
                    return;
                }
                Object.defineProperty(object, _property, data);
            }
            var propertywatchs = watchs[_property];
            var has = propertywatchs.handlers.reduce(function (v, item) { return v || (item.handler == handler && item.thisObject == thisObject); }, false);
            if (!has)
                propertywatchs.handlers.push({ handler: handler, thisObject: thisObject });
        };
        /**
         * 取消监听对象属性的变化
         *
         * @param object 被监听对象
         * @param property 被监听属性
         * @param handler 变化回调函数 (object: T, property: string, oldvalue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        Watcher.prototype.unwatch = function (object, property, handler, thisObject) {
            var watchs = object[feng3d.__watchs__];
            if (!watchs)
                return;
            var _property = property;
            if (watchs[_property]) {
                var handlers = watchs[_property].handlers;
                if (handler === undefined)
                    handlers.length = 0;
                for (var i = handlers.length - 1; i >= 0; i--) {
                    if (handlers[i].handler == handler && (handlers[i].thisObject == thisObject || thisObject === undefined))
                        handlers.splice(i, 1);
                }
                if (handlers.length == 0) {
                    var value = object[_property];
                    delete object[_property];
                    if (watchs[_property].oldPropertyDescriptor)
                        Object.defineProperty(object, _property, watchs[_property].oldPropertyDescriptor);
                    object[_property] = value;
                    delete watchs[_property];
                }
                if (Object.keys(watchs).length == 0) {
                    delete object[feng3d.__watchs__];
                }
            }
        };
        /**
         * 监听对象属性链值变化
         *
         * @param object 被监听对象
         * @param property 被监听属性 例如："a.b"
         * @param handler 变化回调函数 (object: T, property: string, oldvalue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        Watcher.prototype.watchchain = function (object, property, handler, thisObject) {
            var _this = this;
            var notIndex = property.indexOf(".");
            if (notIndex == -1) {
                this.watch(object, property, handler, thisObject);
                return;
            }
            if (!Object.getOwnPropertyDescriptor(object, feng3d.__watchchains__))
                Object.defineProperty(object, feng3d.__watchchains__, { value: {}, enumerable: false, writable: false, configurable: true });
            var watchchains = object[feng3d.__watchchains__];
            if (!watchchains[property]) {
                watchchains[property] = [];
            }
            var propertywatchs = watchchains[property];
            var has = propertywatchs.reduce(function (v, item) { return v || (item.handler == handler && item.thisObject == thisObject); }, false);
            if (!has) {
                // 添加下级监听链
                var currentp = property.substr(0, notIndex);
                var nextp = property.substr(notIndex + 1);
                if (object[currentp]) {
                    this.watchchain(object[currentp], nextp, handler, thisObject);
                }
                // 添加链监听
                var watchchainFun = function (h, p, oldvalue) {
                    var newvalue = h[p];
                    if (oldvalue)
                        _this.unwatchchain(oldvalue, nextp, handler, thisObject);
                    if (newvalue)
                        _this.watchchain(newvalue, nextp, handler, thisObject);
                    // 当更换对象且监听值发生改变时触发处理函数
                    var ov = Object.getPropertyValue(oldvalue, nextp);
                    var nv = Object.getPropertyValue(newvalue, nextp);
                    if (ov != nv) {
                        handler.call(thisObject, newvalue, nextp, ov);
                    }
                };
                this.watch(object, currentp, watchchainFun);
                // 记录链监听函数
                propertywatchs.push({ handler: handler, thisObject: thisObject, watchchainFun: watchchainFun });
            }
        };
        /**
         * 取消监听对象属性链值变化
         *
         * @param object 被监听对象
         * @param property 被监听属性 例如："a.b"
         * @param handler 变化回调函数 (object: T, property: string, oldvalue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        Watcher.prototype.unwatchchain = function (object, property, handler, thisObject) {
            var notIndex = property.indexOf(".");
            if (notIndex == -1) {
                this.unwatch(object, property, handler, thisObject);
                return;
            }
            var currentp = property.substr(0, notIndex);
            var nextp = property.substr(notIndex + 1);
            //
            var watchchains = object[feng3d.__watchchains__];
            if (!watchchains || !watchchains[property])
                return;
            // 
            var propertywatchs = watchchains[property];
            for (var i = propertywatchs.length - 1; i >= 0; i--) {
                var element = propertywatchs[i];
                if (handler == null || (handler == element.handler && thisObject == element.thisObject)) {
                    // 删除下级监听链
                    if (object[currentp]) {
                        this.unwatchchain(object[currentp], nextp, element.handler, element.thisObject);
                    }
                    // 删除链监听
                    this.unwatch(object, currentp, element.watchchainFun);
                    // 清理记录链监听函数
                    propertywatchs.splice(i, 1);
                }
            }
            // 清理空列表
            if (propertywatchs.length == 0)
                delete watchchains[property];
            if (Object.keys(watchchains).length == 0) {
                delete object[feng3d.__watchchains__];
            }
        };
        /**
         * 监听对象属性链值变化
         *
         * @param object 被监听对象
         * @param property 被监听属性 例如：{a:{b:null,d:null}} 表示监听 object.a.b 与 object.a.d 值得变化，如果property == object时表示监听对象中所有叶子属性变化。
         * @param handler 变化回调函数 (object: T, property: string, oldvalue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        Watcher.prototype.watchobject = function (object, property, handler, thisObject) {
            var _this = this;
            var chains = Object.getPropertyChains(object);
            chains.forEach(function (v) {
                _this.watchchain(object, v, handler, thisObject);
            });
        };
        /**
         * 取消监听对象属性链值变化
         *
         * @param object 被监听对象
         * @param property 被监听属性 例如：{a:{b:null,d:null}} 表示监听 object.a.b 与 object.a.d 值得变化，如果property == object时表示监听对象中所有叶子属性变化。
         * @param handler 变化回调函数 (object: T, property: string, oldvalue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        Watcher.prototype.unwatchobject = function (object, property, handler, thisObject) {
            var _this = this;
            var chains = Object.getPropertyChains(property);
            chains.forEach(function (v) {
                _this.unwatchchain(object, v, handler, thisObject);
            });
        };
        return Watcher;
    }());
    feng3d.Watcher = Watcher;
    feng3d.watcher = new Watcher();
    feng3d.__watchs__ = "__watchs__";
    feng3d.__watchchains__ = "__watchchains__";
    function notifyListener(host, property, oldview) {
        var watchs = host[feng3d.__watchs__];
        var handlers = watchs[property].handlers;
        handlers.forEach(function (element) {
            element.handler.call(element.thisObject, host, property, oldview);
        });
    }
})(feng3d || (feng3d = {}));
//# sourceMappingURL=watcher.js.map