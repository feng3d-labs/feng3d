var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var feng3d;
(function (feng3d) {
    /**
     * 断言
     * @b			判定为真的表达式
     * @msg			在表达式为假时将输出的错误信息
     * @author feng 2014-10-29
     */
    function assert(b, msg) {
        if (msg === void 0) { msg = "assert"; }
        if (!b)
            throw msg;
    }
    feng3d.assert = assert;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 类工具
     * @author feng 2017-02-15
     */
    var ClassUtils = (function () {
        function ClassUtils() {
        }
        /**
         * 判断a对象是否为b类型
         */
        ClassUtils.is = function (a, b) {
            var prototype = a.prototype ? a.prototype : Object.getPrototypeOf(a);
            while (prototype != null) {
                //类型==自身原型的构造函数
                if (prototype.constructor == b)
                    return true;
                //父类就是原型的原型构造函数
                prototype = Object.getPrototypeOf(prototype);
            }
            return false;
        };
        /**
         * 如果a为b类型则返回，否则返回null
         */
        ClassUtils.as = function (a, b) {
            if (!ClassUtils.is(a, b))
                return null;
            return a;
        };
        /**
         * 是否为基础类型
         * @param object    对象
         */
        ClassUtils.isBaseType = function (object) {
            return object == null || typeof object == "number" || typeof object == "boolean" || typeof object == "string";
        };
        /**
         * 返回对象的完全限定类名。
         * @param value 需要完全限定类名称的对象，可以将任何 JavaScript 值传递给此方法，包括所有可用的 JavaScript 类型、对象实例、原始类型
         * （如number)和类对象
         * @returns 包含完全限定类名称的字符串。
         */
        ClassUtils.getQualifiedClassName = function (value) {
            if (value == null) {
                return null;
            }
            var className = null;
            var prototype = value.prototype ? value.prototype : Object.getPrototypeOf(value);
            if (prototype.hasOwnProperty(_CLASS_KEY)) {
                className = prototype[_CLASS_KEY];
            }
            if (className == null) {
                className = prototype.constructor.name;
                if (ClassUtils.getDefinitionByName(className) == prototype.constructor) {
                    ClassUtils.registerClass(prototype.constructor, className);
                }
                else {
                    //在可能的命名空间内查找
                    for (var i = 0; i < _classNameSpaces.length; i++) {
                        var tryClassName = _classNameSpaces[i] + "." + className;
                        if (ClassUtils.getDefinitionByName(tryClassName) == prototype.constructor) {
                            className = tryClassName;
                            ClassUtils.registerClass(prototype.constructor, className);
                            break;
                        }
                    }
                }
            }
            feng3d.debuger && feng3d.assert(ClassUtils.getDefinitionByName(className) == prototype.constructor);
            return className;
        };
        /**
         * 获取父类定义
         */
        ClassUtils.getSuperClass = function (value) {
            return value && value["__proto__"];
        };
        /**
         * 返回 value 参数指定的对象的基类的完全限定类名。
         * @param value 需要取得父类的对象，可以将任何 JavaScript 值传递给此方法，包括所有可用的 JavaScript 类型、对象实例、原始类型（如number）和类对象
         * @returns 完全限定的基类名称，或 null（如果不存在基类名称）。
         */
        ClassUtils.getQualifiedSuperclassName = function (value) {
            if (value == null) {
                return null;
            }
            var prototype = value.prototype ? value.prototype : Object.getPrototypeOf(value);
            var superProto = Object.getPrototypeOf(prototype);
            if (!superProto) {
                return null;
            }
            var superClass = ClassUtils.getQualifiedClassName(superProto.constructor);
            if (!superClass) {
                return null;
            }
            return superClass;
        };
        /**
         * 返回 name 参数指定的类的类对象引用。
         * @param name 类的名称。
         */
        ClassUtils.getDefinitionByName = function (name) {
            if (!name)
                return null;
            var definition = _definitionCache[name];
            if (definition) {
                return definition;
            }
            var paths = name.split(".");
            var length = paths.length;
            definition = _global;
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
         * 为一个类定义注册完全限定类名
         * @param classDefinition 类定义
         * @param className 完全限定类名
         */
        ClassUtils.registerClass = function (classDefinition, className) {
            var prototype = classDefinition.prototype;
            Object.defineProperty(prototype, _CLASS_KEY, {
                value: className,
                enumerable: false,
                writable: true
            });
        };
        /**
         * 新增反射对象所在的命名空间，使得getQualifiedClassName能够得到正确的结果
         */
        ClassUtils.addClassNameSpace = function (namespace) {
            if (_classNameSpaces.indexOf(namespace) == -1) {
                _classNameSpaces.push(namespace);
            }
        };
        return ClassUtils;
    }());
    feng3d.ClassUtils = ClassUtils;
    var _definitionCache = {};
    var _global = window;
    var _CLASS_KEY = "__class__";
    var _classNameSpaces = ["feng3d"];
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 对象工具
     * @author feng 2017-02-15
     */
    var ObjectUtils = (function () {
        function ObjectUtils() {
        }
        /**
         * 深克隆
         * @param source        源数据
         * @returns             克隆数据
         */
        ObjectUtils.deepClone = function (source) {
            if (feng3d.ClassUtils.isBaseType(source))
                return source;
            var target = ObjectUtils.getInstance(source);
            for (var attribute in source) {
                target[attribute] = ObjectUtils.deepClone(source[attribute]);
            }
            return target;
        };
        /**
         * 获取实例
         * @param source 实例对象
         */
        ObjectUtils.getInstance = function (source) {
            var cls = source.constructor;
            var className = feng3d.ClassUtils.getQualifiedClassName(source);
            var target = null;
            switch (className) {
                case "Uint16Array":
                case "Int16Array":
                case "Float32Array":
                    target = new cls(source["length"]);
                    break;
                default:
                    target = new cls();
            }
            return target;
        };
        /**
         * （浅）克隆
         * @param source        源数据
         * @returns             克隆数据
         */
        ObjectUtils.clone = function (source) {
            if (feng3d.ClassUtils.isBaseType(source))
                return source;
            var prototype = source["prototype"] ? source["prototype"] : Object.getPrototypeOf(source);
            var target = new prototype.constructor();
            for (var attribute in source) {
                target[attribute] = source[attribute];
            }
            return target;
        };
        /**
         * （浅）拷贝数据
         */
        ObjectUtils.copy = function (target, source) {
            var keys = Object.keys(source);
            keys.forEach(function (element) {
                target[element] = source[element];
            });
        };
        /**
         * 深拷贝数据
         */
        ObjectUtils.deepCopy = function (target, source) {
            var keys = Object.keys(source);
            keys.forEach(function (element) {
                if (!source[element] || feng3d.ClassUtils.isBaseType(source[element])) {
                    target[element] = source[element];
                }
                else if (!target[element]) {
                    target[element] = ObjectUtils.deepClone(source[element]);
                }
                else {
                    ObjectUtils.copy(target[element], source[element]);
                }
            });
        };
        /**
         * 合并数据
         * @param source        源数据
         * @param mergeData     合并数据
         * @param createNew     是否合并为新对象，默认为false
         * @returns             如果createNew为true时返回新对象，否则返回源数据
         */
        ObjectUtils.merge = function (source, mergeData, createNew) {
            if (createNew === void 0) { createNew = false; }
            if (feng3d.ClassUtils.isBaseType(mergeData))
                return mergeData;
            var target = createNew ? ObjectUtils.clone(source) : source;
            for (var mergeAttribute in mergeData) {
                target[mergeAttribute] = ObjectUtils.merge(source[mergeAttribute], mergeData[mergeAttribute], createNew);
            }
            return target;
        };
        return ObjectUtils;
    }());
    feng3d.ObjectUtils = ObjectUtils;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var VersionUtils = (function () {
        function VersionUtils() {
        }
        /**
         * 获取对象版本
         * @param object 对象
         */
        VersionUtils.getVersion = function (object) {
            this.assertObject(object);
            if (!object.hasOwnProperty(_versionKey)) {
                return -1;
            }
            return ~~object[_versionKey];
        };
        /**
         * 升级对象版本（版本号+1）
         * @param object 对象
         */
        VersionUtils.upgradeVersion = function (object) {
            this.assertObject(object);
            if (!object.hasOwnProperty(_versionKey)) {
                Object.defineProperty(object, _versionKey, {
                    value: 0,
                    enumerable: false,
                    writable: true
                });
            }
            object[_versionKey] = ~~object[_versionKey] + 1;
        };
        /**
         * 设置版本号
         * @param object 对象
         * @param version 版本号
         */
        VersionUtils.setVersion = function (object, version) {
            this.assertObject(object);
            object[_versionKey] = ~~version;
        };
        /**
         * 判断两个对象的版本号是否相等
         */
        VersionUtils.equal = function (a, b) {
            var va = this.getVersion(a);
            var vb = this.getVersion(b);
            if (va == -1 && vb == -1)
                return false;
            return va == vb;
        };
        /**
         * 断言object为对象类型
         */
        VersionUtils.assertObject = function (object) {
            if (typeof object != "object") {
                throw "\u65E0\u6CD5\u83B7\u53D6" + object + "\u7684UID";
            }
        };
        return VersionUtils;
    }());
    feng3d.VersionUtils = VersionUtils;
    /**
     * 版本号键名称
     */
    var _versionKey = "__version__";
})(feng3d || (feng3d = {}));
//参考 egret https://github.com/egret-labs/egret-core/blob/master/src/extension/eui/binding/Watcher.ts
var feng3d;
(function (feng3d) {
    /**
     * @private
     */
    var listeners = "__listeners__";
    /**
     * @private
     */
    var bindables = "__bindables__";
    /**
     * @private
     */
    var bindableCount = 0;
    /**
     * Register a property of an instance is can be bound.
     * This method is ususally invoked by Watcher class.
     *
     * @param instance the instance to be registered.
     * @param property the property of specified instance to be registered.
     *
     * @version Egret 2.4
     * @version eui 1.0
     * @platform Web,Native
     * @language en_US
     */
    /**
     * 标记实例的一个属性是可绑定的,此方法通常由 Watcher 类调用。
     *
     * @param instance 要标记的实例
     * @param property 可绑定的属性。
     *
     * @version Egret 2.4
     * @version eui 1.0
     * @platform Web,Native
     * @language zh_CN
     */
    function registerBindable(instance, property) {
        if (instance.hasOwnProperty(bindables)) {
            instance[bindables].push(property);
        }
        else {
            var list = [property];
            if (instance[bindables]) {
                list = instance[bindables].concat(list);
            }
            instance[bindables] = list;
        }
    }
    feng3d.registerBindable = registerBindable;
    /**
     * @private
     *
     * @param host
     * @param property
     * @returns
     */
    function getPropertyDescriptor(host, property) {
        var data = Object.getOwnPropertyDescriptor(host, property);
        if (data) {
            return data;
        }
        var prototype = Object.getPrototypeOf(host);
        if (prototype) {
            return getPropertyDescriptor(prototype, property);
        }
        return null;
    }
    function notifyListener(host, property) {
        var list = host[listeners];
        var length = list.length;
        for (var i = 0; i < length; i += 2) {
            var listener = list[i];
            var target = list[i + 1];
            listener.call(target, property);
        }
    }
    /**
     * The Watcher class defines utility method that you can use with bindable properties.
     * These methods var you define an event handler that is executed whenever a bindable property is updated.
     *
     * @version Egret 2.4
     * @version eui 1.0
     * @platform Web,Native
     * @includeExample extension/eui/binding/WatcherExample.ts
     * @language en_US
     */
    /**
     * Watcher 类能够监视可绑定属性的改变，您可以定义一个事件处理函数作为 Watcher 的回调方法，在每次可绑定属性的值改变时都执行此函数。
     *
     * @version Egret 2.4
     * @version eui 1.0
     * @platform Web,Native
     * @includeExample extension/eui/binding/WatcherExample.ts
     * @language zh_CN
     */
    var Watcher = (function () {
        /**
         * Constructor.
         * Not for public use. This method is called only from the <code>watch()</code> method.
         * See the <code>watch()</code> method for parameter usage.
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 构造函数，非公开。只能从 watch() 方法中调用此方法。有关参数用法，请参阅 watch() 方法。
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language zh_CN
         */
        function Watcher(property, handler, thisObject, next) {
            /**
             * @private
             */
            this.isExecuting = false;
            this.property = property;
            this.handler = handler;
            this.next = next;
            this.thisObject = thisObject;
        }
        /**
         * Creates and starts a Watcher instance.
         * The Watcher can only watch the property of a Object which host is instance of egret.IEventDispatcher.
         * @param host The object that hosts the property or property chain to be watched.
         * You can use the use the <code>reset()</code> method to change the value of the <code>host</code> argument
         * after creating the Watcher instance.
         * The <code>host</code> maintains a list of <code>handlers</code> to invoke when <code>prop</code> changes.
         * @param chain A value specifying the property or chain to be watched.
         * For example, to watch the property <code>host.a.b.c</code>,
         * call the method as: <code>watch(host, ["a","b","c"], ...)</code>.
         * @param handler  An event handler function called when the value of the watched property
         * (or any property in a watched chain) is modified.
         * @param thisObject <code>this</code> object of which binding with handler
         * @returns he ChangeWatcher instance, if at least one property name has been specified to
         * the <code>chain</code> argument; null otherwise.
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 创建并启动 Watcher 实例。注意：Watcher 只能监视 host 为 egret.IEventDispatcher 对象的属性改变。若属性链中某个属性所对应的实例不是 egret.IEventDispatcher，
         * 则属性链中在它之后的属性改变将无法检测到。
         * @param host 用于承载要监视的属性或属性链的对象。
         * 创建Watcher实例后，您可以利用<code>reset()</code>方法更改<code>host</code>参数的值。
         * 当<code>prop</code>改变的时候，会使得host对应的一系列<code>handlers</code>被触发。
         * @param chain 用于指定要监视的属性链的值。例如，要监视属性 host.a.b.c，需按以下形式调用此方法：watch¬(host, ["a","b","c"], ...)。
         * @param handler 在监视的目标属性链中任何属性的值发生改变时调用的事件处理函数。
         * @param thisObject handler 方法绑定的this对象
         * @returns 如果已为 chain 参数至少指定了一个属性名称，则返回 Watcher 实例；否则返回 null。
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language zh_CN
         */
        Watcher.watch = function (host, chain, handler, thisObject) {
            if (chain.length > 0) {
                var property = chain.shift();
                var next = Watcher.watch(null, chain, handler, thisObject);
                var watcher = new Watcher(property, handler, thisObject, next);
                watcher.reset(host);
                return watcher;
            }
            else {
                return null;
            }
        };
        /**
         * @private
         * 检查属性是否可以绑定。若还未绑定，尝试添加绑定事件。若是只读或只写属性，返回false。
         */
        Watcher.checkBindable = function (host, property) {
            var list = host[bindables];
            if (list && list.indexOf(property) != -1) {
                return true;
            }
            if (!host[listeners]) {
                host[listeners] = [];
            }
            var data = getPropertyDescriptor(host, property);
            if (data && data.set && data.get) {
                var orgSet = data.set;
                data.set = function (value) {
                    if (this[property] != value) {
                        orgSet.call(this, value);
                        notifyListener(this, property);
                    }
                };
            }
            else if (!data || (!data.get && !data.set)) {
                bindableCount++;
                var newProp = "_" + bindableCount + property;
                host[newProp] = data ? data.value : undefined;
                data = { enumerable: true, configurable: true };
                data.get = function () {
                    return this[newProp];
                };
                data.set = function (value) {
                    if (this[newProp] != value) {
                        this[newProp] = value;
                        notifyListener(this, property);
                    }
                };
            }
            else {
                return false;
            }
            Object.defineProperty(host, property, data);
            registerBindable(host, property);
        };
        /**
         * Detaches this Watcher instance, and its handler function, from the current host.
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 从当前宿主中断开此 Watcher 实例及其处理函数。
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language zh_CN
         */
        Watcher.prototype.unwatch = function () {
            this.reset(null);
            this.handler = null;
            if (this.next) {
                this.next.handler = null;
            }
        };
        /**
         * Retrieves the current value of the watched property or property chain, or null if the host object is null.
         * @example
         * <pre>
         * watch(obj, ["a","b","c"], ...).getValue() === obj.a.b.c
         * </pre>
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 检索观察的属性或属性链的当前值，当宿主对象为空时此值为空。
         * @example
         * <pre>
         * watch(obj, ["a","b","c"], ...).getValue() === obj.a.b.c
         * </pre>
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language zh_CN
         */
        Watcher.prototype.getValue = function () {
            if (this.next) {
                return this.next.getValue();
            }
            return this.getHostPropertyValue();
        };
        Watcher.prototype.setValue = function (value) {
            if (this.next) {
                this.next.setValue(value);
            }
            else {
                this.setHostPropertyValue(value);
            }
        };
        /**
         * Sets the handler function.s
         * @param handler The handler function. This argument must not be null.
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 设置处理函数。
         * @param handler 处理函数，此参数必须为非空。
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language zh_CN
         */
        Watcher.prototype.setHandler = function (handler, thisObject) {
            this.handler = handler;
            this.thisObject = thisObject;
            if (this.next) {
                this.next.setHandler(handler, thisObject);
            }
        };
        /**
         * Resets this ChangeWatcher instance to use a new host object.
         * You can call this method to reuse a watcher instance on a different host.
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 重置此 Watcher 实例使用新的宿主对象。
         * 您可以通过该方法实现一个Watcher实例用于不同的宿主。
         * @version Egret 2.4
         * @version eui 1.0
         * @platform Web,Native
         * @language zh_CN
         */
        Watcher.prototype.reset = function (newHost) {
            if (newHost == this.host)
                return;
            var oldHost = this.host;
            if (oldHost) {
                var list = oldHost[listeners];
                var index = list.indexOf(this);
                list.splice(index - 1, 2);
            }
            this.host = newHost;
            if (newHost) {
                Watcher.checkBindable(newHost, this.property);
                var list = newHost[listeners];
                list.push(this.onPropertyChange);
                list.push(this);
            }
            if (this.next)
                this.next.reset(this.getHostPropertyValue());
        };
        /**
         * @private
         *
         * @returns
         */
        Watcher.prototype.getHostPropertyValue = function () {
            return this.host ? this.host[this.property] : null;
        };
        /**
         * @private
         *
         * @returns
         */
        Watcher.prototype.setHostPropertyValue = function (value) {
            this.host && (this.host[this.property] = value);
        };
        /**
         * @private
         */
        Watcher.prototype.onPropertyChange = function (property) {
            if (property == this.property && !this.isExecuting) {
                try {
                    this.isExecuting = true;
                    if (this.next)
                        this.next.reset(this.getHostPropertyValue());
                    this.handler.call(this.thisObject, this.getValue());
                }
                finally {
                    this.isExecuting = false;
                }
            }
        };
        return Watcher;
    }());
    feng3d.Watcher = Watcher;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 绑定工具类
     */
    var Binding = (function () {
        function Binding() {
        }
        /**
         * （单向）绑定属性
         * @param host 用于承载要监视的属性或属性链的对象。
         * 当 <code>host</code>上<code>chain</code>所对应的值发生改变时，<code>target</code>上的<code>prop</code>属性将被自动更新。
         * @param chain 用于指定要监视的属性链的值。例如，要监视属性 <code>host.a.b.c</code>，需按以下形式调用此方法：<code>bindProperty(host, ["a","b","c"], ...)。</code>
         * @param target 本次绑定要更新的目标对象。
         * @param prop 本次绑定要更新的目标属性名称。
         * @returns 如果已为 chain 参数至少指定了一个属性名称，则返回 Watcher 实例；否则返回 null。
         */
        Binding.bindProperty = function (host, chain, target, prop) {
            var watcher = feng3d.Watcher.watch(host, chain, null, null);
            if (watcher) {
                var assign = function (value) {
                    target[prop] = value;
                };
                watcher.setHandler(assign, null);
            }
            return watcher;
        };
        /**
         * 双向绑定属性
         */
        Binding.bothBindProperty = function (hosta, chaina, hostb, chainb) {
            var bothBind = new BothBind(hosta, chaina, hostb, chainb);
            return bothBind;
        };
        return Binding;
    }());
    feng3d.Binding = Binding;
    var BothBind = (function () {
        function BothBind(hosta, chaina, hostb, chainb) {
            this._watchera = feng3d.Watcher.watch(hosta, chaina, this.todata, this);
            this._watcherb = feng3d.Watcher.watch(hostb, chainb, this.fromdata, this);
        }
        BothBind.prototype.todata = function () {
            var value = this._watchera.getValue();
            if (value !== undefined) {
                this._watcherb.setValue(value);
            }
        };
        BothBind.prototype.fromdata = function () {
            var value = this._watcherb.getValue();
            if (value !== undefined) {
                this._watchera.setValue(value);
            }
        };
        BothBind.prototype.unwatch = function () {
            this._watchera.unwatch();
            this._watcherb.unwatch();
        };
        return BothBind;
    }());
    feng3d.BothBind = BothBind;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 获取feng3d运行时间，毫秒为单位
     */
    function getTimer() {
        return Date.now() - feng3d.ticker.startTime;
    }
    feng3d.getTimer = getTimer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var StringUtils = (function () {
        function StringUtils() {
        }
        /**
         * 获取字符串
         * @param obj 转换为字符串的对象
         * @param showLen       显示长度
         * @param fill          长度不够是填充的字符串
         * @param tail          true（默认）:在尾部添加；false：在首部添加
         */
        StringUtils.getString = function (obj, showLen, fill, tail) {
            if (showLen === void 0) { showLen = -1; }
            if (fill === void 0) { fill = " "; }
            if (tail === void 0) { tail = true; }
            var str = "";
            if (obj.toString != null) {
                str = obj.toString();
            }
            else {
                str = obj;
            }
            if (showLen != -1) {
                while (str.length < showLen) {
                    if (tail) {
                        str = str + fill;
                    }
                    else {
                        str = fill + str;
                    }
                }
                if (str.length > showLen) {
                    str = str.substr(0, showLen);
                }
            }
            return str;
        };
        return StringUtils;
    }());
    feng3d.StringUtils = StringUtils;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 构建Map类代替Dictionary
     * @author feng 2017-01-03
     */
    var Map = (function () {
        function Map() {
            this.keyMap = {};
            this.valueMap = {};
        }
        /**
         * 删除
         */
        Map.prototype.delete = function (k) {
            delete this.keyMap[k.uuid];
            delete this.valueMap[k.uuid];
        };
        /**
         * 添加映射
         */
        Map.prototype.push = function (k, v) {
            this.keyMap[k.uuid] = k;
            this.valueMap[k.uuid] = v;
        };
        /**
         * 通过key获取value
         */
        Map.prototype.get = function (k) {
            return this.valueMap[k.uuid];
        };
        /**
         * 获取键列表
         */
        Map.prototype.getKeys = function () {
            var keys = [];
            for (var key in this.keyMap) {
                keys.push(this.keyMap[key]);
            }
            return keys;
        };
        /**
         * 清理字典
         */
        Map.prototype.clear = function () {
            this.keyMap = {};
            this.valueMap = {};
        };
        return Map;
    }());
    feng3d.Map = Map;
})(feng3d || (feng3d = {}));
Math.DEG2RAD = Math.PI / 180;
Math.RAD2DEG = 180 / Math.PI;
Math.generateUUID = function () {
    // http://www.broofa.com/Tools/Math.uuid.htm
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = new Array(36);
    var rnd = 0, r;
    return function generateUUID() {
        for (var i = 0; i < 36; i++) {
            if (i === 8 || i === 13 || i === 18 || i === 23) {
                uuid[i] = '-';
            }
            else if (i === 14) {
                uuid[i] = '4';
            }
            else {
                if (rnd <= 0x02)
                    rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
                r = rnd & 0xf;
                rnd = rnd >> 4;
                uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
            }
        }
        return uuid.join('');
    };
}();
Math.clamp = function (value, min, max) {
    return Math.max(min, Math.min(max, value));
};
Math.euclideanModulo = function (n, m) {
    return ((n % m) + m) % m;
};
Math.mapLinear = function (x, a1, a2, b1, b2) {
    return b1 + (x - a1) * (b2 - b1) / (a2 - a1);
};
Math.lerp = function (x, y, t) {
    return (1 - t) * x + t * y;
};
Math.smoothstep = function (x, min, max) {
    if (x <= min)
        return 0;
    if (x >= max)
        return 1;
    x = (x - min) / (max - min);
    return x * x * (3 - 2 * x);
};
Math.smootherstep = function (x, min, max) {
    if (x <= min)
        return 0;
    if (x >= max)
        return 1;
    x = (x - min) / (max - min);
    return x * x * x * (x * (x * 6 - 15) + 10);
};
Math.randInt = function (low, high) {
    return low + Math.floor(Math.random() * (high - low + 1));
};
Math.randFloat = function (low, high) {
    return low + Math.random() * (high - low);
};
Math.randFloatSpread = function (range) {
    return range * (0.5 - Math.random());
};
Math.degToRad = function (degrees) {
    return degrees * Math.DEG2RAD;
};
Math.radToDeg = function (radians) {
    return radians * Math.RAD2DEG;
};
Math.isPowerOfTwo = function (value) {
    return (value & (value - 1)) === 0 && value !== 0;
};
Math.nearestPowerOfTwo = function (value) {
    return Math.pow(2, Math.round(Math.log(value) / Math.LN2));
};
Math.nextPowerOfTwo = function (value) {
    value--;
    value |= value >> 1;
    value |= value >> 2;
    value |= value >> 4;
    value |= value >> 8;
    value |= value >> 16;
    value++;
    return value;
};
var feng3d;
(function (feng3d) {
    /**
     * Orientation3D 类是用于表示 Matrix3D 对象的方向样式的常量值枚举。方向的三个类型分别为欧拉角、轴角和四元数。Matrix3D 对象的 decompose 和 recompose 方法采用其中的某一个枚举类型来标识矩阵的旋转组件。
     * @author feng 2016-3-21
     */
    var Orientation3D = (function () {
        function Orientation3D() {
        }
        return Orientation3D;
    }());
    /**
    * 轴角方向结合使用轴和角度来确定方向。
    */
    Orientation3D.AXIS_ANGLE = "axisAngle";
    /**
    * 欧拉角（decompose() 和 recompose() 方法的默认方向）通过三个不同的对应于每个轴的旋转角来定义方向。
    */
    Orientation3D.EULER_ANGLES = "eulerAngles";
    /**
    * 四元数方向使用复数。
    */
    Orientation3D.QUATERNION = "quaternion";
    feng3d.Orientation3D = Orientation3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var DEG_TO_RAD = Math.PI / 180;
    /**
     * Point 对象表示二维坐标系统中的某个位置，其中 x 表示水平轴，y 表示垂直轴。
     */
    var Point = (function () {
        /**
         * 创建一个 egret.Point 对象.若不传入任何参数，将会创建一个位于（0，0）位置的点。
         * @param x 该对象的x属性值，默认为0
         * @param y 该对象的y属性值，默认为0
         */
        function Point(x, y) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            this.x = x;
            this.y = y;
        }
        Object.defineProperty(Point.prototype, "length", {
            /**
             * 从 (0,0) 到此点的线段长度。
             */
            get: function () {
                return Math.sqrt(this.x * this.x + this.y * this.y);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 将 Point 的成员设置为指定值
         * @param x 该对象的x属性值
         * @param y 该对象的y属性值
         */
        Point.prototype.setTo = function (x, y) {
            this.x = x;
            this.y = y;
            return this;
        };
        /**
         * 克隆点对象
         */
        Point.prototype.clone = function () {
            return new Point(this.x, this.y);
        };
        /**
         * 确定两个点是否相同。如果两个点具有相同的 x 和 y 值，则它们是相同的点。
         * @param toCompare 要比较的点。
         * @returns 如果该对象与此 Point 对象相同，则为 true 值，如果不相同，则为 false。
         */
        Point.prototype.equals = function (toCompare) {
            return this.x == toCompare.x && this.y == toCompare.y;
        };
        /**
         * 返回 pt1 和 pt2 之间的距离。
         * @param p1 第一个点
         * @param p2 第二个点
         * @returns 第一个点和第二个点之间的距离。
         */
        Point.distance = function (p1, p2) {
            return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
        };
        /**
         * 将源 Point 对象中的所有点数据复制到调用方 Point 对象中。
         * @param sourcePoint 要从中复制数据的 Point 对象。
         */
        Point.prototype.copyFrom = function (sourcePoint) {
            this.x = sourcePoint.x;
            this.y = sourcePoint.y;
        };
        /**
         * 将另一个点的坐标添加到此点的坐标以创建一个新点。
         * @param v 要添加的点。
         * @returns 新点。
         */
        Point.prototype.add = function (v) {
            return new Point(this.x + v.x, this.y + v.y);
        };
        /**
         * 确定两个指定点之间的点。
         * 参数 f 确定新的内插点相对于参数 pt1 和 pt2 指定的两个端点所处的位置。参数 f 的值越接近 1.0，则内插点就越接近第一个点（参数 pt1）。参数 f 的值越接近 0，则内插点就越接近第二个点（参数 pt2）。
         * @param pt1 第一个点。
         * @param pt2 第二个点。
         * @param f 两个点之间的内插级别。表示新点将位于 pt1 和 pt2 连成的直线上的什么位置。如果 f=1，则返回 pt1；如果 f=0，则返回 pt2。
         * @returns 新的内插点。
         */
        Point.interpolate = function (pt1, pt2, f) {
            var f1 = 1 - f;
            return new Point(pt1.x * f + pt2.x * f1, pt1.y * f + pt2.y * f1);
        };
        /**
         * 将 (0,0) 和当前点之间的线段缩放为设定的长度。
         * @param thickness 缩放值。例如，如果当前点为 (0,5) 并且您将它规范化为 1，则返回的点位于 (0,1) 处。
         */
        Point.prototype.normalize = function (thickness) {
            if (this.x != 0 || this.y != 0) {
                var relativeThickness = thickness / this.length;
                this.x *= relativeThickness;
                this.y *= relativeThickness;
            }
        };
        /**
         * 按指定量偏移 Point 对象。dx 的值将添加到 x 的原始值中以创建新的 x 值。dy 的值将添加到 y 的原始值中以创建新的 y 值。
         * @param dx 水平坐标 x 的偏移量。
         * @param dy 水平坐标 y 的偏移量。
         */
        Point.prototype.offset = function (dx, dy) {
            this.x += dx;
            this.y += dy;
        };
        /**
         * 将一对极坐标转换为笛卡尔点坐标。
         * @param len 极坐标对的长度。
         * @param angle 极坐标对的角度（以弧度表示）。
         */
        Point.polar = function (len, angle) {
            return new Point(len * Math.cos(angle / DEG_TO_RAD), len * Math.sin(angle / DEG_TO_RAD));
        };
        /**
         * 从此点的坐标中减去另一个点的坐标以创建一个新点。
         * @param v 要减去的点。
         * @returns 新点。
         */
        Point.prototype.subtract = function (v) {
            return new Point(this.x - v.x, this.y - v.y);
        };
        /**
         * 返回包含 x 和 y 坐标的值的字符串。该字符串的格式为 "(x=x, y=y)"，因此为点 23,17 调用 toString() 方法将返回 "(x=23, y=17)"。
         * @returns 坐标的字符串表示形式。
         */
        Point.prototype.toString = function () {
            return "(x=" + this.x + ", y=" + this.y + ")";
        };
        /**
         * 返回包含 x 和 y 坐标值的数组
         */
        Point.prototype.toArray = function () {
            return [this.x, this.y];
        };
        return Point;
    }());
    feng3d.Point = Point;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var rectanglePool = [];
    /**
     * 矩形
     *
     * Rectangle 对象是按其位置（由它左上角的点 (x, y) 确定）以及宽度和高度定义的区域。<br/>
     * Rectangle 类的 x、y、width 和 height 属性相互独立；更改一个属性的值不会影响其他属性。
     * 但是，right 和 bottom 属性与这四个属性是整体相关的。例如，如果更改 right 属性的值，则 width
     * 属性的值将发生变化；如果更改 bottom 属性，则 height 属性的值将发生变化。
     * @author feng 2016-04-27
     */
    var Rectangle = (function () {
        /**
         * 创建一个新 Rectangle 对象，其左上角由 x 和 y 参数指定，并具有指定的 width 和 height 参数。
         * @param x 矩形左上角的 x 坐标。
         * @param y 矩形左上角的 y 坐标。
         * @param width 矩形的宽度（以像素为单位）。
         * @param height 矩形的高度（以像素为单位）。
         */
        function Rectangle(x, y, width, height) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (width === void 0) { width = 0; }
            if (height === void 0) { height = 0; }
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        Object.defineProperty(Rectangle.prototype, "right", {
            /**
             * x 和 width 属性的和。
             */
            get: function () {
                return this.x + this.width;
            },
            set: function (value) {
                this.width = value - this.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "bottom", {
            /**
             * y 和 height 属性的和。
             */
            get: function () {
                return this.y + this.height;
            },
            set: function (value) {
                this.height = value - this.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "left", {
            /**
             * 矩形左上角的 x 坐标。更改 Rectangle 对象的 left 属性对 y 和 height 属性没有影响。但是，它会影响 width 属性，而更改 x 值不会影响 width 属性。
             * left 属性的值等于 x 属性的值。
             */
            get: function () {
                return this.x;
            },
            set: function (value) {
                this.width += this.x - value;
                this.x = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "top", {
            /**
             * 矩形左上角的 y 坐标。更改 Rectangle 对象的 top 属性对 x 和 width 属性没有影响。但是，它会影响 height 属性，而更改 y 值不会影响 height 属性。<br/>
             * top 属性的值等于 y 属性的值。
             */
            get: function () {
                return this.y;
            },
            set: function (value) {
                this.height += this.y - value;
                this.y = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "topLeft", {
            /**
             * 由该点的 x 和 y 坐标确定的 Rectangle 对象左上角的位置。
             */
            get: function () {
                return new feng3d.Point(this.left, this.top);
            },
            set: function (value) {
                this.top = value.y;
                this.left = value.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "bottomRight", {
            /**
             * 由 right 和 bottom 属性的值确定的 Rectangle 对象的右下角的位置。
             */
            get: function () {
                return new feng3d.Point(this.right, this.bottom);
            },
            set: function (value) {
                this.bottom = value.y;
                this.right = value.x;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 将源 Rectangle 对象中的所有矩形数据复制到调用方 Rectangle 对象中。
         * @param sourceRect 要从中复制数据的 Rectangle 对象。
         */
        Rectangle.prototype.copyFrom = function (sourceRect) {
            this.x = sourceRect.x;
            this.y = sourceRect.y;
            this.width = sourceRect.width;
            this.height = sourceRect.height;
            return this;
        };
        /**
         * 将 Rectangle 的成员设置为指定值
         * @param x 矩形左上角的 x 坐标。
         * @param y 矩形左上角的 y 坐标。
         * @param width 矩形的宽度（以像素为单位）。
         * @param height 矩形的高度（以像素为单位）。
         */
        Rectangle.prototype.setTo = function (x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            return this;
        };
        /**
         * 确定由此 Rectangle 对象定义的矩形区域内是否包含指定的点。
         * @param x 检测点的x轴
         * @param y 检测点的y轴
         * @returns 如果检测点位于矩形内，返回true，否则，返回false
         */
        Rectangle.prototype.contains = function (x, y) {
            return this.x <= x &&
                this.x + this.width >= x &&
                this.y <= y &&
                this.y + this.height >= y;
        };
        /**
         * 如果在 toIntersect 参数中指定的 Rectangle 对象与此 Rectangle 对象相交，则返回交集区域作为 Rectangle 对象。如果矩形不相交，
         * 则此方法返回一个空的 Rectangle 对象，其属性设置为 0。
         * @param toIntersect 要对照比较以查看其是否与此 Rectangle 对象相交的 Rectangle 对象。
         * @returns 等于交集区域的 Rectangle 对象。如果该矩形不相交，则此方法返回一个空的 Rectangle 对象；即，其 x、y、width 和
         * height 属性均设置为 0 的矩形。
         */
        Rectangle.prototype.intersection = function (toIntersect) {
            return this.clone().$intersectInPlace(toIntersect);
        };
        /**
         * 按指定量增加 Rectangle 对象的大小（以像素为单位）
         * 保持 Rectangle 对象的中心点不变，使用 dx 值横向增加它的大小，使用 dy 值纵向增加它的大小。
         * @param dx Rectangle 对象横向增加的值。
         * @param dy Rectangle 对象纵向增加的值。
         */
        Rectangle.prototype.inflate = function (dx, dy) {
            this.x -= dx;
            this.width += 2 * dx;
            this.y -= dy;
            this.height += 2 * dy;
        };
        /**
         * @private
         */
        Rectangle.prototype.$intersectInPlace = function (clipRect) {
            var x0 = this.x;
            var y0 = this.y;
            var x1 = clipRect.x;
            var y1 = clipRect.y;
            var l = Math.max(x0, x1);
            var r = Math.min(x0 + this.width, x1 + clipRect.width);
            if (l <= r) {
                var t = Math.max(y0, y1);
                var b = Math.min(y0 + this.height, y1 + clipRect.height);
                if (t <= b) {
                    this.setTo(l, t, r - l, b - t);
                    return this;
                }
            }
            this.setEmpty();
            return this;
        };
        /**
         * 确定在 toIntersect 参数中指定的对象是否与此 Rectangle 对象相交。此方法检查指定的 Rectangle
         * 对象的 x、y、width 和 height 属性，以查看它是否与此 Rectangle 对象相交。
         * @param toIntersect 要与此 Rectangle 对象比较的 Rectangle 对象。
         * @returns 如果两个矩形相交，返回true，否则返回false
         */
        Rectangle.prototype.intersects = function (toIntersect) {
            return Math.max(this.x, toIntersect.x) <= Math.min(this.right, toIntersect.right)
                && Math.max(this.y, toIntersect.y) <= Math.min(this.bottom, toIntersect.bottom);
        };
        /**
         * 确定此 Rectangle 对象是否为空。
         * @returns 如果 Rectangle 对象的宽度或高度小于等于 0，则返回 true 值，否则返回 false。
         */
        Rectangle.prototype.isEmpty = function () {
            return this.width <= 0 || this.height <= 0;
        };
        /**
         * 将 Rectangle 对象的所有属性设置为 0。
         */
        Rectangle.prototype.setEmpty = function () {
            this.x = 0;
            this.y = 0;
            this.width = 0;
            this.height = 0;
        };
        /**
         * 返回一个新的 Rectangle 对象，其 x、y、width 和 height 属性的值与原始 Rectangle 对象的对应值相同。
         * @returns 新的 Rectangle 对象，其 x、y、width 和 height 属性的值与原始 Rectangle 对象的对应值相同。
         */
        Rectangle.prototype.clone = function () {
            return new Rectangle(this.x, this.y, this.width, this.height);
        };
        /**
         * 确定由此 Rectangle 对象定义的矩形区域内是否包含指定的点。
         * 此方法与 Rectangle.contains() 方法类似，只不过它采用 Point 对象作为参数。
         * @param point 包含点对象
         * @returns 如果包含，返回true，否则返回false
         */
        Rectangle.prototype.containsPoint = function (point) {
            if (this.x < point.x
                && this.x + this.width > point.x
                && this.y < point.y
                && this.y + this.height > point.y) {
                return true;
            }
            return false;
        };
        /**
         * 确定此 Rectangle 对象内是否包含由 rect 参数指定的 Rectangle 对象。
         * 如果一个 Rectangle 对象完全在另一个 Rectangle 的边界内，我们说第二个 Rectangle 包含第一个 Rectangle。
         * @param rect 所检查的 Rectangle 对象
         * @returns 如果此 Rectangle 对象包含您指定的 Rectangle 对象，则返回 true 值，否则返回 false。
         */
        Rectangle.prototype.containsRect = function (rect) {
            var r1 = rect.x + rect.width;
            var b1 = rect.y + rect.height;
            var r2 = this.x + this.width;
            var b2 = this.y + this.height;
            return (rect.x >= this.x) && (rect.x < r2) && (rect.y >= this.y) && (rect.y < b2) && (r1 > this.x) && (r1 <= r2) && (b1 > this.y) && (b1 <= b2);
        };
        /**
         * 确定在 toCompare 参数中指定的对象是否等于此 Rectangle 对象。
         * 此方法将某个对象的 x、y、width 和 height 属性与此 Rectangle 对象所对应的相同属性进行比较。
         * @param toCompare 要与此 Rectangle 对象进行比较的矩形。
         * @returns 如果对象具有与此 Rectangle 对象完全相同的 x、y、width 和 height 属性值，则返回 true 值，否则返回 false。
         */
        Rectangle.prototype.equals = function (toCompare) {
            if (this === toCompare) {
                return true;
            }
            return this.x === toCompare.x && this.y === toCompare.y
                && this.width === toCompare.width && this.height === toCompare.height;
        };
        /**
         * 增加 Rectangle 对象的大小。此方法与 Rectangle.inflate() 方法类似，只不过它采用 Point 对象作为参数。
         */
        Rectangle.prototype.inflatePoint = function (point) {
            this.inflate(point.x, point.y);
        };
        /**
         * 按指定量调整 Rectangle 对象的位置（由其左上角确定）。
         * @param dx 将 Rectangle 对象的 x 值移动此数量。
         * @param dy 将 Rectangle 对象的 t 值移动此数量。
         */
        Rectangle.prototype.offset = function (dx, dy) {
            this.x += dx;
            this.y += dy;
        };
        /**
         * 将 Point 对象用作参数来调整 Rectangle 对象的位置。此方法与 Rectangle.offset() 方法类似，只不过它采用 Point 对象作为参数。
         * @param point 要用于偏移此 Rectangle 对象的 Point 对象。
         */
        Rectangle.prototype.offsetPoint = function (point) {
            this.offset(point.x, point.y);
        };
        /**
         * 生成并返回一个字符串，该字符串列出 Rectangle 对象的水平位置和垂直位置以及高度和宽度。
         * @returns 一个字符串，它列出了 Rectangle 对象的下列各个属性的值：x、y、width 和 height。
         */
        Rectangle.prototype.toString = function () {
            return "(x=" + this.x + ", y=" + this.y + ", width=" + this.width + ", height=" + this.height + ")";
        };
        /**
         * 通过填充两个矩形之间的水平和垂直空间，将这两个矩形组合在一起以创建一个新的 Rectangle 对象。
         * @param toUnion 要添加到此 Rectangle 对象的 Rectangle 对象。
         * @returns 充当两个矩形的联合的新 Rectangle 对象。
         */
        Rectangle.prototype.union = function (toUnion) {
            var result = this.clone();
            if (toUnion.isEmpty()) {
                return result;
            }
            if (result.isEmpty()) {
                result.copyFrom(toUnion);
                return result;
            }
            var l = Math.min(result.x, toUnion.x);
            var t = Math.min(result.y, toUnion.y);
            result.setTo(l, t, Math.max(result.right, toUnion.right) - l, Math.max(result.bottom, toUnion.bottom) - t);
            return result;
        };
        return Rectangle;
    }());
    feng3d.Rectangle = Rectangle;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Vector3D 类使用笛卡尔坐标 x、y 和 z 表示三维空间中的点或位置
     * @author feng 2016-3-21
     */
    var Vector3D = (function () {
        /**
         * 创建 Vector3D 对象的实例。如果未指定构造函数的参数，则将使用元素 (0,0,0,0) 创建 Vector3D 对象。
         * @param x 第一个元素，例如 x 坐标。
         * @param y 第二个元素，例如 y 坐标。
         * @param z 第三个元素，例如 z 坐标。
         * @param w 表示额外数据的可选元素，例如旋转角度
         */
        function Vector3D(x, y, z, w) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (z === void 0) { z = 0; }
            if (w === void 0) { w = 0; }
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }
        Object.defineProperty(Vector3D.prototype, "length", {
            /**
            * 当前 Vector3D 对象的长度（大小），即从原点 (0,0,0) 到该对象的 x、y 和 z 坐标的距离。w 属性将被忽略。单位矢量具有的长度或大小为一。
            */
            get: function () {
                return Math.sqrt(this.lengthSquared);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector3D.prototype, "lengthSquared", {
            /**
            * 当前 Vector3D 对象长度的平方，它是使用 x、y 和 z 属性计算出来的。w 属性将被忽略。尽可能使用 lengthSquared() 方法，而不要使用 Vector3D.length() 方法的 Math.sqrt() 方法调用，后者速度较慢。
            */
            get: function () {
                return this.x * this.x + this.y * this.y + this.z * this.z;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 将当前 Vector3D 对象的 x、y 和 z 元素的值与另一个 Vector3D 对象的 x、y 和 z 元素的值相加。
         * @param a 要与当前 Vector3D 对象相加的 Vector3D 对象。
         * @return 一个 Vector3D 对象，它是将当前 Vector3D 对象与另一个 Vector3D 对象相加所产生的结果。
         */
        Vector3D.prototype.add = function (a) {
            return new Vector3D(this.x + a.x, this.y + a.y, this.z + a.z, this.w + a.w);
        };
        /**
         * 返回一个新 Vector3D 对象，它是与当前 Vector3D 对象完全相同的副本。
         * @return 一个新 Vector3D 对象，它是当前 Vector3D 对象的副本。
         */
        Vector3D.prototype.clone = function () {
            return new Vector3D(this.x, this.y, this.z, this.w);
        };
        /**
         * 将源 Vector3D 对象中的所有矢量数据复制到调用方 Vector3D 对象中。
         * @return 要从中复制数据的 Vector3D 对象。
         */
        Vector3D.prototype.copyFrom = function (sourceVector3D) {
            this.x = sourceVector3D.x;
            this.y = sourceVector3D.y;
            this.z = sourceVector3D.z;
            this.w = sourceVector3D.w;
        };
        /**
         * 返回一个新的 Vector3D 对象，它与当前 Vector3D 对象和另一个 Vector3D 对象垂直（成直角）。
         */
        Vector3D.prototype.crossProduct = function (a) {
            return new Vector3D(this.y * a.z - this.z * a.y, this.z * a.x - this.x * a.z, this.x * a.y - this.y * a.x, 1);
        };
        /**
         * 按照指定的 Vector3D 对象的 x、y 和 z 元素的值递减当前 Vector3D 对象的 x、y 和 z 元素的值。
         */
        Vector3D.prototype.decrementBy = function (a) {
            this.x -= a.x;
            this.y -= a.y;
            this.z -= a.z;
        };
        /**
         * 通过将当前 Vector3D 对象的 x、y 和 z 元素乘以指定的 Vector3D 对象的 x、y 和 z 元素得到新对象。
         */
        Vector3D.prototype.multiply = function (a) {
            return new Vector3D(this.x * a.x, this.y * a.y, this.z * a.z);
        };
        /**
         * 通过将当前 Vector3D 对象的 x、y 和 z 元素除以指定的 Vector3D 对象的 x、y 和 z 元素得到新对象。
         */
        Vector3D.prototype.divide = function (a) {
            return new Vector3D(this.x / a.x, this.y / a.y, this.z / a.z);
        };
        /**
         * 如果当前 Vector3D 对象和作为参数指定的 Vector3D 对象均为单位顶点，此方法将返回这两个顶点之间所成角的余弦值。
         */
        Vector3D.prototype.dotProduct = function (a) {
            return this.x * a.x + this.y * a.y + this.z * a.z;
        };
        /**
         * 通过将当前 Vector3D 对象的 x、y 和 z 元素与指定的 Vector3D 对象的 x、y 和 z 元素进行比较，确定这两个对象是否相等。
         */
        Vector3D.prototype.equals = function (toCompare, allFour) {
            if (allFour === void 0) { allFour = false; }
            return (this.x == toCompare.x && this.y == toCompare.y && this.z == toCompare.z && (!allFour || this.w == toCompare.w));
        };
        /**
         * 按照指定的 Vector3D 对象的 x、y 和 z 元素的值递增当前 Vector3D 对象的 x、y 和 z 元素的值。
         */
        Vector3D.prototype.incrementBy = function (a) {
            this.x += a.x;
            this.y += a.y;
            this.z += a.z;
        };
        /**
         * 将当前 Vector3D 对象设置为其逆对象。
         */
        Vector3D.prototype.negate = function () {
            this.x = -this.x;
            this.y = -this.y;
            this.z = -this.z;
        };
        /**
         * 通过将最前面的三个元素（x、y、z）除以矢量的长度可将 Vector3D 对象转换为单位矢量。
         */
        Vector3D.prototype.normalize = function (thickness) {
            if (thickness === void 0) { thickness = 1; }
            if (this.length != 0) {
                var invLength = thickness / this.length;
                this.x *= invLength;
                this.y *= invLength;
                this.z *= invLength;
                return;
            }
        };
        /**
         * 按标量（大小）缩放当前的 Vector3D 对象。
         */
        Vector3D.prototype.scaleBy = function (s) {
            this.x *= s;
            this.y *= s;
            this.z *= s;
        };
        /**
         * 将 Vector3D 的成员设置为指定值
         */
        Vector3D.prototype.setTo = function (x, y, z, w) {
            if (w === void 0) { w = 1; }
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        };
        /**
         * 从另一个 Vector3D 对象的 x、y 和 z 元素的值中减去当前 Vector3D 对象的 x、y 和 z 元素的值。
         */
        Vector3D.prototype.subtract = function (a) {
            return new Vector3D(this.x - a.x, this.y - a.y, this.z - a.z);
        };
        /**
         * 返回当前 Vector3D 对象的字符串表示形式。
         */
        Vector3D.prototype.toString = function () {
            return "<" + this.x + ", " + this.y + ", " + this.z + ">";
        };
        /**
         * 返回当前 Vector3D 对象4个元素的数组
         */
        Vector3D.prototype.toArray = function (num) {
            if (num === void 0) { num = 4; }
            if (num == 3) {
                return [this.x, this.y, this.z];
            }
            else {
                return [this.x, this.y, this.z, this.w];
            }
        };
        return Vector3D;
    }());
    /**
    * 定义为 Vector3D 对象的 x 轴，坐标为 (1,0,0)。
    */
    Vector3D.X_AXIS = new Vector3D(1, 0, 0);
    /**
    * 定义为 Vector3D 对象的 y 轴，坐标为 (0,1,0)
    */
    Vector3D.Y_AXIS = new Vector3D(0, 1, 0);
    /**
    * 定义为 Vector3D 对象的 z 轴，坐标为 (0,0,1)
    */
    Vector3D.Z_AXIS = new Vector3D(0, 0, 1);
    feng3d.Vector3D = Vector3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Matrix3D 类表示一个转换矩阵，该矩阵确定三维 (3D) 显示对象的位置和方向。
     * 该矩阵可以执行转换功能，包括平移（沿 x、y 和 z 轴重新定位）、旋转和缩放（调整大小）。
     * Matrix3D 类还可以执行透视投影，这会将 3D 坐标空间中的点映射到二维 (2D) 视图。
     *
     *  ---            方向              平移 ---
     *  |   scaleX      0         0       tx    |
     *  |     0       scaleY      0       ty    |
     *  |     0         0       scaleZ    tz    |
     *  |     0         0         0       tw    |
     *  ---  x轴        y轴      z轴          ---
     *
     *  ---            方向              平移 ---
     *  |     0         4         8       12    |
     *  |     1         5         9       13    |
     *  |     2         6        10       14    |
     *  |     3         7        11       15    |
     *  ---  x轴        y轴      z轴          ---
     */
    var Matrix3D = (function () {
        /**
         * 创建 Matrix3D 对象。
         * @param   datas    一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        function Matrix3D(datas) {
            if (datas === void 0) { datas = null; }
            datas = datas || [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1 //
            ];
            if (datas instanceof Float32Array)
                this.rawData = datas;
            else {
                this.rawData = new Float32Array(datas);
            }
        }
        Object.defineProperty(Matrix3D.prototype, "position", {
            /**
             * 一个保存显示对象在转换参照帧中的 3D 坐标 (x,y,z) 位置的 Vector3D 对象。
             */
            get: function () {
                return new feng3d.Vector3D(this.rawData[12], this.rawData[13], this.rawData[14]);
            },
            set: function (value) {
                this.rawData[12] = value.x;
                this.rawData[13] = value.y;
                this.rawData[14] = value.z;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix3D.prototype, "determinant", {
            /**
             * 一个用于确定矩阵是否可逆的数字。
             */
            get: function () {
                return ((this.rawData[0] * this.rawData[5] - this.rawData[4] * this.rawData[1]) * (this.rawData[10] * this.rawData[15] - this.rawData[14] * this.rawData[11]) //
                    - (this.rawData[0] * this.rawData[9] - this.rawData[8] * this.rawData[1]) * (this.rawData[6] * this.rawData[15] - this.rawData[14] * this.rawData[7]) //
                    + (this.rawData[0] * this.rawData[13] - this.rawData[12] * this.rawData[1]) * (this.rawData[6] * this.rawData[11] - this.rawData[10] * this.rawData[7]) //
                    + (this.rawData[4] * this.rawData[9] - this.rawData[8] * this.rawData[5]) * (this.rawData[2] * this.rawData[15] - this.rawData[14] * this.rawData[3]) //
                    - (this.rawData[4] * this.rawData[13] - this.rawData[12] * this.rawData[5]) * (this.rawData[2] * this.rawData[11] - this.rawData[10] * this.rawData[3]) //
                    + (this.rawData[8] * this.rawData[13] - this.rawData[12] * this.rawData[9]) * (this.rawData[2] * this.rawData[7] - this.rawData[6] * this.rawData[3]) //
                );
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix3D.prototype, "forward", {
            /**
             * 前方（+Z轴方向）
             */
            get: function () {
                var v = new feng3d.Vector3D(0.0, 0.0, 0.0);
                this.copyColumnTo(2, v);
                v.normalize();
                return v;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix3D.prototype, "up", {
            /**
             * 上方（+y轴方向）
             */
            get: function () {
                var v = new feng3d.Vector3D();
                this.copyColumnTo(1, v);
                v.normalize();
                return v;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix3D.prototype, "right", {
            /**
             * 右方（+x轴方向）
             */
            get: function () {
                var v = new feng3d.Vector3D();
                this.copyColumnTo(0, v);
                v.normalize();
                return v;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix3D.prototype, "back", {
            /**
             * 后方（-z轴方向）
             */
            get: function () {
                var v = new feng3d.Vector3D(0.0, 0.0, 0.0);
                this.copyColumnTo(2, v);
                v.normalize();
                v.negate();
                return v;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix3D.prototype, "down", {
            /**
             * 下方（-y轴方向）
             */
            get: function () {
                var v = new feng3d.Vector3D();
                this.copyColumnTo(1, v);
                v.normalize();
                v.negate();
                return v;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix3D.prototype, "left", {
            /**
             * 左方（-x轴方向）
             */
            get: function () {
                var v = new feng3d.Vector3D();
                this.copyColumnTo(0, v);
                v.normalize();
                v.negate();
                return v;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 创建旋转矩阵
         * @param   degrees         角度
         * @param   axis            旋转轴
         * @param   pivotPoint      旋转中心点
         */
        Matrix3D.createRotationMatrix3D = function (degrees, axis) {
            var n = axis.clone();
            n.normalize();
            var q = degrees * Math.PI / 180;
            var sinq = Math.sin(q);
            var cosq = Math.cos(q);
            var lcosq = 1 - cosq;
            var rotationMat = new Matrix3D([
                n.x * n.x * lcosq + cosq, n.x * n.y * lcosq + n.z * sinq, n.x * n.z * lcosq - n.y * sinq, 0,
                n.x * n.y * lcosq - n.z * sinq, n.y * n.y * lcosq + cosq, n.y * n.z * lcosq + n.x * sinq, 0,
                n.x * n.z * lcosq + n.y * sinq, n.y * n.z * lcosq - n.x * sinq, n.z * n.z * lcosq + cosq, 0,
                0, 0, 0, 1 //
            ]);
            return rotationMat;
        };
        /**
         * 创建缩放矩阵
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        Matrix3D.createScaleMatrix3D = function (xScale, yScale, zScale) {
            var rotationMat = new Matrix3D([
                xScale, 0.0000, 0.0000, 0,
                0.0000, yScale, 0.0000, 0,
                0.0000, 0.0000, zScale, 0,
                0.0000, 0.0000, 0.0000, 1 //
            ]);
            return rotationMat;
        };
        /**
         * 创建位移矩阵
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        Matrix3D.createTranslationMatrix3D = function (x, y, z) {
            var rotationMat = new Matrix3D([
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                x, y, z, 1 //
            ]);
            return rotationMat;
        };
        /**
         * 通过将另一个 Matrix3D 对象与当前 Matrix3D 对象相乘来后置一个矩阵。
         */
        Matrix3D.prototype.append = function (lhs) {
            var //
            m111 = this.rawData[0], m121 = this.rawData[4], m131 = this.rawData[8], m141 = this.rawData[12], //
            m112 = this.rawData[1], m122 = this.rawData[5], m132 = this.rawData[9], m142 = this.rawData[13], //
            m113 = this.rawData[2], m123 = this.rawData[6], m133 = this.rawData[10], m143 = this.rawData[14], //
            m114 = this.rawData[3], m124 = this.rawData[7], m134 = this.rawData[11], m144 = this.rawData[15], //
            m211 = lhs.rawData[0], m221 = lhs.rawData[4], m231 = lhs.rawData[8], m241 = lhs.rawData[12], //
            m212 = lhs.rawData[1], m222 = lhs.rawData[5], m232 = lhs.rawData[9], m242 = lhs.rawData[13], //
            m213 = lhs.rawData[2], m223 = lhs.rawData[6], m233 = lhs.rawData[10], m243 = lhs.rawData[14], //
            m214 = lhs.rawData[3], m224 = lhs.rawData[7], m234 = lhs.rawData[11], m244 = lhs.rawData[15];
            this.rawData[0] = m111 * m211 + m112 * m221 + m113 * m231 + m114 * m241;
            this.rawData[1] = m111 * m212 + m112 * m222 + m113 * m232 + m114 * m242;
            this.rawData[2] = m111 * m213 + m112 * m223 + m113 * m233 + m114 * m243;
            this.rawData[3] = m111 * m214 + m112 * m224 + m113 * m234 + m114 * m244;
            this.rawData[4] = m121 * m211 + m122 * m221 + m123 * m231 + m124 * m241;
            this.rawData[5] = m121 * m212 + m122 * m222 + m123 * m232 + m124 * m242;
            this.rawData[6] = m121 * m213 + m122 * m223 + m123 * m233 + m124 * m243;
            this.rawData[7] = m121 * m214 + m122 * m224 + m123 * m234 + m124 * m244;
            this.rawData[8] = m131 * m211 + m132 * m221 + m133 * m231 + m134 * m241;
            this.rawData[9] = m131 * m212 + m132 * m222 + m133 * m232 + m134 * m242;
            this.rawData[10] = m131 * m213 + m132 * m223 + m133 * m233 + m134 * m243;
            this.rawData[11] = m131 * m214 + m132 * m224 + m133 * m234 + m134 * m244;
            this.rawData[12] = m141 * m211 + m142 * m221 + m143 * m231 + m144 * m241;
            this.rawData[13] = m141 * m212 + m142 * m222 + m143 * m232 + m144 * m242;
            this.rawData[14] = m141 * m213 + m142 * m223 + m143 * m233 + m144 * m243;
            this.rawData[15] = m141 * m214 + m142 * m224 + m143 * m234 + m144 * m244;
            feng3d.debuger && feng3d.assert(this.rawData[0] !== NaN && this.rawData[4] !== NaN && this.rawData[8] !== NaN && this.rawData[12] !== NaN);
            return this;
        };
        /**
         * 在 Matrix3D 对象上后置一个增量旋转。
         * @param   degrees         角度
         * @param   axis            旋转轴
         * @param   pivotPoint      旋转中心点
         */
        Matrix3D.prototype.appendRotation = function (degrees, axis, pivotPoint) {
            if (pivotPoint === void 0) { pivotPoint = new feng3d.Vector3D(); }
            var rotationMat = Matrix3D.createRotationMatrix3D(degrees, axis);
            if (pivotPoint != null) {
                this.appendTranslation(-pivotPoint.x, -pivotPoint.y, -pivotPoint.z);
            }
            this.append(rotationMat);
            if (pivotPoint != null) {
                this.appendTranslation(pivotPoint.x, pivotPoint.y, pivotPoint.z);
            }
            return this;
        };
        /**
         * 在 Matrix3D 对象上后置一个增量缩放，沿 x、y 和 z 轴改变位置。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        Matrix3D.prototype.appendScale = function (xScale, yScale, zScale) {
            var scaleMat = Matrix3D.createScaleMatrix3D(xScale, yScale, zScale);
            this.append(scaleMat);
            return this;
        };
        /**
         * 在 Matrix3D 对象上后置一个增量平移，沿 x、y 和 z 轴重新定位。
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        Matrix3D.prototype.appendTranslation = function (x, y, z) {
            this.rawData[12] += x;
            this.rawData[13] += y;
            this.rawData[14] += z;
            return this;
        };
        /**
         * 返回一个新 Matrix3D 对象，它是与当前 Matrix3D 对象完全相同的副本。
         */
        Matrix3D.prototype.clone = function () {
            var ret = new Matrix3D();
            ret.copyFrom(this);
            return ret;
        };
        /**
         * 将 Vector3D 对象复制到调用方 Matrix3D 对象的特定列中。
         * @param   column      副本的目标列。
         * @param   vector3D    要从中复制数据的 Vector3D 对象。
         */
        Matrix3D.prototype.copyColumnFrom = function (column, vector3D) {
            this.rawData[column * 4 + 0] = vector3D.x;
            this.rawData[column * 4 + 1] = vector3D.y;
            this.rawData[column * 4 + 2] = vector3D.z;
            this.rawData[column * 4 + 3] = vector3D.w;
            return this;
        };
        /**
         * 将调用方 Matrix3D 对象的特定列复制到 Vector3D 对象中。
         * @param   column       要从中复制数据的列。
         * @param   vector3D     副本的目标 Vector3D 对象。
         */
        Matrix3D.prototype.copyColumnTo = function (column, vector3D) {
            vector3D.x = this.rawData[column * 4 + 0];
            vector3D.y = this.rawData[column * 4 + 1];
            vector3D.z = this.rawData[column * 4 + 2];
            vector3D.w = this.rawData[column * 4 + 3];
            return this;
        };
        /**
         * 将源 Matrix3D 对象中的所有矩阵数据复制到调用方 Matrix3D 对象中。
         * @param   sourceMatrix3D      要从中复制数据的 Matrix3D 对象。
         */
        Matrix3D.prototype.copyFrom = function (sourceMatrix3D) {
            this.rawData.set(sourceMatrix3D.rawData);
            return this;
        };
        /**
         * 将源 Vector 对象中的所有矢量数据复制到调用方 Matrix3D 对象中。利用可选索引参数，您可以选择矢量中的任何起始文字插槽。
         * @param   vector      要从中复制数据的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        Matrix3D.prototype.copyRawDataFrom = function (vector, index, transpose) {
            if (index === void 0) { index = 0; }
            if (transpose === void 0) { transpose = false; }
            if (vector.length - index < 16) {
                throw new Error("vector参数数据长度不够！");
            }
            if (transpose) {
                this.transpose();
            }
            for (var i = 0; i < 16; i++) {
                this.rawData[i] = vector[index + i];
            }
            if (transpose) {
                this.transpose();
            }
            return this;
        };
        /**
         * 将调用方 Matrix3D 对象中的所有矩阵数据复制到提供的矢量中。
         * @param   vector      要将数据复制到的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        Matrix3D.prototype.copyRawDataTo = function (vector, index, transpose) {
            if (index === void 0) { index = 0; }
            if (transpose === void 0) { transpose = false; }
            if (transpose) {
                this.transpose();
            }
            for (var i = 0; i < 16; i++) {
                vector[i + index] = this.rawData[i];
            }
            if (transpose) {
                this.transpose();
            }
            return this;
        };
        /**
         * 将 Vector3D 对象复制到调用方 Matrix3D 对象的特定行中。
         * @param   row         要将数据复制到的行。
         * @param   vector3D    要从中复制数据的 Vector3D 对象。
         */
        Matrix3D.prototype.copyRowFrom = function (row, vector3D) {
            this.rawData[row + 4 * 0] = vector3D.x;
            this.rawData[row + 4 * 1] = vector3D.y;
            this.rawData[row + 4 * 2] = vector3D.z;
            this.rawData[row + 4 * 3] = vector3D.w;
            return this;
        };
        /**
         * 将调用方 Matrix3D 对象的特定行复制到 Vector3D 对象中。
         * @param   row         要从中复制数据的行。
         * @param   vector3D    将作为数据复制目的地的 Vector3D 对象。
         */
        Matrix3D.prototype.copyRowTo = function (row, vector3D) {
            vector3D.x = this.rawData[row + 4 * 0];
            vector3D.y = this.rawData[row + 4 * 1];
            vector3D.z = this.rawData[row + 4 * 2];
            vector3D.w = this.rawData[row + 4 * 3];
            return this;
        };
        /**
         * 拷贝当前矩阵
         * @param   dest    目标矩阵
         */
        Matrix3D.prototype.copyToMatrix3D = function (dest) {
            dest.rawData.set(this.rawData);
            return this;
        };
        /**
         * 将转换矩阵的平移、旋转和缩放设置作为由三个 Vector3D 对象组成的矢量返回。
         * @return      一个由三个 Vector3D 对象组成的矢量，其中，每个对象分别容纳平移、旋转和缩放设置。
         */
        Matrix3D.prototype.decompose = function (orientationStyle, result) {
            if (orientationStyle === void 0) { orientationStyle = "eulerAngles"; }
            if (result === void 0) { result = null; }
            var raw = this.rawData;
            var a = raw[0];
            var e = raw[1];
            var i = raw[2];
            var b = raw[4];
            var f = raw[5];
            var j = raw[6];
            var c = raw[8];
            var g = raw[9];
            var k = raw[10];
            var x = raw[12];
            var y = raw[13];
            var z = raw[14];
            var tx = Math.sqrt(a * a + e * e + i * i);
            var ty = Math.sqrt(b * b + f * f + j * j);
            var tz = Math.sqrt(c * c + g * g + k * k);
            var tw = 0;
            var scaleX = tx;
            var scaleY = ty;
            var scaleZ = tz;
            if (a * (f * k - j * g) - e * (b * k - j * c) + i * (b * g - f * c) < 0) {
                scaleZ = -scaleZ;
            }
            a = a / scaleX;
            e = e / scaleX;
            i = i / scaleX;
            b = b / scaleY;
            f = f / scaleY;
            j = j / scaleY;
            c = c / scaleZ;
            g = g / scaleZ;
            k = k / scaleZ;
            if (orientationStyle == feng3d.Orientation3D.EULER_ANGLES) {
                tx = Math.atan2(j, k);
                ty = Math.atan2(-i, Math.sqrt(a * a + e * e));
                var s1 = Math.sin(tx);
                var c1 = Math.cos(tx);
                tz = Math.atan2(s1 * c - c1 * b, c1 * f - s1 * g);
            }
            else if (orientationStyle == feng3d.Orientation3D.AXIS_ANGLE) {
                tw = Math.acos((a + f + k - 1) / 2);
                var len = Math.sqrt((j - g) * (j - g) + (c - i) * (c - i) + (e - b) * (e - b));
                tx = (j - g) / len;
                ty = (c - i) / len;
                tz = (e - b) / len;
            }
            else {
                var tr = a + f + k;
                if (tr > 0) {
                    tw = Math.sqrt(1 + tr) / 2;
                    tx = (j - g) / (4 * tw);
                    ty = (c - i) / (4 * tw);
                    tz = (e - b) / (4 * tw);
                }
                else if ((a > f) && (a > k)) {
                    tx = Math.sqrt(1 + a - f - k) / 2;
                    tw = (j - g) / (4 * tx);
                    ty = (e + b) / (4 * tx);
                    tz = (c + i) / (4 * tx);
                }
                else if (f > k) {
                    ty = Math.sqrt(1 + f - a - k) / 2;
                    tx = (e + b) / (4 * ty);
                    tw = (c - i) / (4 * ty);
                    tz = (j + g) / (4 * ty);
                }
                else {
                    tz = Math.sqrt(1 + k - a - f) / 2;
                    tx = (c + i) / (4 * tz);
                    ty = (j + g) / (4 * tz);
                    tw = (e - b) / (4 * tz);
                }
            }
            result = result || [new feng3d.Vector3D(), new feng3d.Vector3D(), new feng3d.Vector3D()];
            result[0].x = x;
            result[0].y = y;
            result[0].z = z;
            result[1].x = tx;
            result[1].y = ty;
            result[1].z = tz;
            result[1].w = tw;
            result[2].x = scaleX;
            result[2].y = scaleY;
            result[2].z = scaleZ;
            return result;
        };
        /**
         * 使用不含平移元素的转换矩阵将 Vector3D 对象从一个空间坐标转换到另一个空间坐标。
         * @param   v   一个容纳要转换的坐标的 Vector3D 对象。
         * @return  一个包含转换后的坐标的 Vector3D 对象。
         */
        Matrix3D.prototype.deltaTransformVector = function (v, vout) {
            var tempx = this.rawData[12];
            var tempy = this.rawData[13];
            var tempz = this.rawData[14];
            this.rawData[12] = 0;
            this.rawData[13] = 0;
            this.rawData[14] = 0;
            vout = this.transformVector(v, vout);
            this.rawData[12] = tempx;
            this.rawData[13] = tempy;
            this.rawData[14] = tempz;
            return vout;
        };
        /**
         * 将当前矩阵转换为恒等或单位矩阵。
         */
        Matrix3D.prototype.identity = function () {
            this.rawData[1] = 0;
            this.rawData[2] = 0;
            this.rawData[3] = 0;
            this.rawData[4] = 0;
            this.rawData[6] = 0;
            this.rawData[7] = 0;
            this.rawData[8] = 0;
            this.rawData[9] = 0;
            this.rawData[11] = 0;
            this.rawData[12] = 0;
            this.rawData[13] = 0;
            this.rawData[14] = 0;
            this.rawData[0] = 1;
            this.rawData[5] = 1;
            this.rawData[10] = 1;
            this.rawData[15] = 1;
            return this;
        };
        /**
         * 反转当前矩阵。逆矩阵
         * @return      如果成功反转矩阵，则返回 该矩阵。
         */
        Matrix3D.prototype.invert = function () {
            var d = this.determinant;
            var invertable = Math.abs(d) > 0.00000000001;
            if (invertable) {
                d = 1 / d;
                var m11 = this.rawData[0];
                var m21 = this.rawData[4];
                var m31 = this.rawData[8];
                var m41 = this.rawData[12];
                var m12 = this.rawData[1];
                var m22 = this.rawData[5];
                var m32 = this.rawData[9];
                var m42 = this.rawData[13];
                var m13 = this.rawData[2];
                var m23 = this.rawData[6];
                var m33 = this.rawData[10];
                var m43 = this.rawData[14];
                var m14 = this.rawData[3];
                var m24 = this.rawData[7];
                var m34 = this.rawData[11];
                var m44 = this.rawData[15];
                this.rawData[0] = d * (m22 * (m33 * m44 - m43 * m34) - m32 * (m23 * m44 - m43 * m24) + m42 * (m23 * m34 - m33 * m24));
                this.rawData[1] = -d * (m12 * (m33 * m44 - m43 * m34) - m32 * (m13 * m44 - m43 * m14) + m42 * (m13 * m34 - m33 * m14));
                this.rawData[2] = d * (m12 * (m23 * m44 - m43 * m24) - m22 * (m13 * m44 - m43 * m14) + m42 * (m13 * m24 - m23 * m14));
                this.rawData[3] = -d * (m12 * (m23 * m34 - m33 * m24) - m22 * (m13 * m34 - m33 * m14) + m32 * (m13 * m24 - m23 * m14));
                this.rawData[4] = -d * (m21 * (m33 * m44 - m43 * m34) - m31 * (m23 * m44 - m43 * m24) + m41 * (m23 * m34 - m33 * m24));
                this.rawData[5] = d * (m11 * (m33 * m44 - m43 * m34) - m31 * (m13 * m44 - m43 * m14) + m41 * (m13 * m34 - m33 * m14));
                this.rawData[6] = -d * (m11 * (m23 * m44 - m43 * m24) - m21 * (m13 * m44 - m43 * m14) + m41 * (m13 * m24 - m23 * m14));
                this.rawData[7] = d * (m11 * (m23 * m34 - m33 * m24) - m21 * (m13 * m34 - m33 * m14) + m31 * (m13 * m24 - m23 * m14));
                this.rawData[8] = d * (m21 * (m32 * m44 - m42 * m34) - m31 * (m22 * m44 - m42 * m24) + m41 * (m22 * m34 - m32 * m24));
                this.rawData[9] = -d * (m11 * (m32 * m44 - m42 * m34) - m31 * (m12 * m44 - m42 * m14) + m41 * (m12 * m34 - m32 * m14));
                this.rawData[10] = d * (m11 * (m22 * m44 - m42 * m24) - m21 * (m12 * m44 - m42 * m14) + m41 * (m12 * m24 - m22 * m14));
                this.rawData[11] = -d * (m11 * (m22 * m34 - m32 * m24) - m21 * (m12 * m34 - m32 * m14) + m31 * (m12 * m24 - m22 * m14));
                this.rawData[12] = -d * (m21 * (m32 * m43 - m42 * m33) - m31 * (m22 * m43 - m42 * m23) + m41 * (m22 * m33 - m32 * m23));
                this.rawData[13] = d * (m11 * (m32 * m43 - m42 * m33) - m31 * (m12 * m43 - m42 * m13) + m41 * (m12 * m33 - m32 * m13));
                this.rawData[14] = -d * (m11 * (m22 * m43 - m42 * m23) - m21 * (m12 * m43 - m42 * m13) + m41 * (m12 * m23 - m22 * m13));
                this.rawData[15] = d * (m11 * (m22 * m33 - m32 * m23) - m21 * (m12 * m33 - m32 * m13) + m31 * (m12 * m23 - m22 * m13));
            }
            if (invertable)
                return this;
            return null;
        };
        /**
         * 通过将当前 Matrix3D 对象与另一个 Matrix3D 对象相乘来前置一个矩阵。得到的结果将合并两个矩阵转换。
         * @param   rhs     个右侧矩阵，它与当前 Matrix3D 对象相乘。
         */
        Matrix3D.prototype.prepend = function (rhs) {
            var mat = this.clone();
            this.copyFrom(rhs);
            this.append(mat);
            return this;
        };
        /**
         * 在 Matrix3D 对象上前置一个增量旋转。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行旋转，然后再执行其他转换。
         * @param   degrees     旋转的角度。
         * @param   axis        旋转的轴或方向。常见的轴为 X_AXIS (Vector3D(1,0,0))、Y_AXIS (Vector3D(0,1,0)) 和 Z_AXIS (Vector3D(0,0,1))。此矢量的长度应为 1。
         * @param   pivotPoint  一个用于确定旋转中心的点。对象的默认轴点为该对象的注册点。
         */
        Matrix3D.prototype.prependRotation = function (degrees, axis, pivotPoint) {
            if (pivotPoint === void 0) { pivotPoint = new feng3d.Vector3D(); }
            var rotationMat = Matrix3D.createRotationMatrix3D(degrees, axis);
            this.prepend(rotationMat);
            return this;
        };
        /**
         * 在 Matrix3D 对象上前置一个增量缩放，沿 x、y 和 z 轴改变位置。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行缩放更改，然后再执行其他转换。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        Matrix3D.prototype.prependScale = function (xScale, yScale, zScale) {
            var scaleMat = Matrix3D.createScaleMatrix3D(xScale, yScale, zScale);
            this.prepend(scaleMat);
            return this;
        };
        /**
         * 在 Matrix3D 对象上前置一个增量平移，沿 x、y 和 z 轴重新定位。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行平移更改，然后再执行其他转换。
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        Matrix3D.prototype.prependTranslation = function (x, y, z) {
            var translationMat = Matrix3D.createTranslationMatrix3D(x, y, z);
            this.prepend(translationMat);
            return this;
        };
        /**
         * X轴方向移动
         * @param distance  移动距离
         */
        Matrix3D.prototype.moveRight = function (distance) {
            var direction = this.right;
            direction.scaleBy(distance);
            this.position = this.position.add(direction);
            return this;
        };
        /**
         * Y轴方向移动
         * @param distance  移动距离
         */
        Matrix3D.prototype.moveUp = function (distance) {
            var direction = this.up;
            direction.scaleBy(distance);
            this.position = this.position.add(direction);
            return this;
        };
        /**
         * Z轴方向移动
         * @param distance  移动距离
         */
        Matrix3D.prototype.moveForward = function (distance) {
            var direction = this.forward;
            direction.scaleBy(distance);
            this.position = this.position.add(direction);
            return this;
        };
        /**
         * 设置转换矩阵的平移、旋转和缩放设置。
         * @param   components      一个由三个 Vector3D 对象组成的矢量，这些对象将替代 Matrix3D 对象的平移、旋转和缩放元素。
         */
        Matrix3D.prototype.recompose = function (components) {
            this.identity();
            this.appendScale(components[2].x, components[2].y, components[2].z);
            this.appendRotation(components[1].x * Math.RAD2DEG, feng3d.Vector3D.X_AXIS);
            this.appendRotation(components[1].y * Math.RAD2DEG, feng3d.Vector3D.Y_AXIS);
            this.appendRotation(components[1].z * Math.RAD2DEG, feng3d.Vector3D.Z_AXIS);
            this.appendTranslation(components[0].x, components[0].y, components[0].z);
            return this;
        };
        /**
         * 使用转换矩阵将 Vector3D 对象从一个空间坐标转换到另一个空间坐标。
         * @param   vin   一个容纳要转换的坐标的 Vector3D 对象。
         * @return  一个包含转换后的坐标的 Vector3D 对象。
         */
        Matrix3D.prototype.transformVector = function (vin, vout) {
            var x = vin.x;
            var y = vin.y;
            var z = vin.z;
            vout = vout || new feng3d.Vector3D();
            vout.x = x * this.rawData[0] + y * this.rawData[4] + z * this.rawData[8] + this.rawData[12];
            vout.y = x * this.rawData[1] + y * this.rawData[5] + z * this.rawData[9] + this.rawData[13];
            vout.z = x * this.rawData[2] + y * this.rawData[6] + z * this.rawData[10] + this.rawData[14];
            vout.w = x * this.rawData[3] + y * this.rawData[7] + z * this.rawData[11] + this.rawData[15];
            return vout;
        };
        /**
         * 使用转换矩阵将由数字构成的矢量从一个空间坐标转换到另一个空间坐标。
         * @param   vin     一个由多个数字组成的矢量，其中每三个数字构成一个要转换的 3D 坐标 (x,y,z)。
         * @param   vout    一个由多个数字组成的矢量，其中每三个数字构成一个已转换的 3D 坐标 (x,y,z)。
         */
        Matrix3D.prototype.transformVectors = function (vin, vout) {
            var vec = new feng3d.Vector3D();
            for (var i = 0; i < vin.length; i += 3) {
                vec.setTo(vin[i], vin[i + 1], vin[i + 2]);
                vec = this.transformVector(vec);
                vout[i] = vec.x;
                vout[i + 1] = vec.y;
                vout[i + 2] = vec.z;
            }
        };
        /**
         * 将当前 Matrix3D 对象转换为一个矩阵，并将互换其中的行和列。
         */
        Matrix3D.prototype.transpose = function () {
            var swap;
            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 4; j++) {
                    if (i > j) {
                        swap = this.rawData[i * 4 + j];
                        this.rawData[i * 4 + j] = this.rawData[j * 4 + i];
                        this.rawData[j * 4 + i] = swap;
                    }
                }
            }
        };
        /**
         * 比较矩阵是否相等
         */
        Matrix3D.prototype.compare = function (matrix3D, precision) {
            if (precision === void 0) { precision = 0.0001; }
            var r2 = matrix3D.rawData;
            for (var i = 0; i < 16; ++i) {
                if (Math.abs(this.rawData[i] - r2[i]) > precision)
                    return false;
            }
            return true;
        };
        /**
         * 看向目标位置
         * @param target    目标位置
         * @param upAxis    向上朝向
         */
        Matrix3D.prototype.lookAt = function (target, upAxis) {
            if (upAxis === void 0) { upAxis = null; }
            //获取位移，缩放，在变换过程位移与缩放不变
            var vec = this.decompose();
            var position = vec[0];
            var scale = vec[2];
            //
            var xAxis = new feng3d.Vector3D();
            var yAxis = new feng3d.Vector3D();
            var zAxis = new feng3d.Vector3D();
            upAxis = upAxis || feng3d.Vector3D.Y_AXIS;
            zAxis.x = target.x - this.position.x;
            zAxis.y = target.y - this.position.y;
            zAxis.z = target.z - this.position.z;
            zAxis.normalize();
            xAxis.x = upAxis.y * zAxis.z - upAxis.z * zAxis.y;
            xAxis.y = upAxis.z * zAxis.x - upAxis.x * zAxis.z;
            xAxis.z = upAxis.x * zAxis.y - upAxis.y * zAxis.x;
            xAxis.normalize();
            if (xAxis.length < .05) {
                xAxis.x = upAxis.y;
                xAxis.y = upAxis.x;
                xAxis.z = 0;
                xAxis.normalize();
            }
            yAxis.x = zAxis.y * xAxis.z - zAxis.z * xAxis.y;
            yAxis.y = zAxis.z * xAxis.x - zAxis.x * xAxis.z;
            yAxis.z = zAxis.x * xAxis.y - zAxis.y * xAxis.x;
            this.rawData[0] = scale.x * xAxis.x;
            this.rawData[1] = scale.x * xAxis.y;
            this.rawData[2] = scale.x * xAxis.z;
            this.rawData[3] = 0;
            this.rawData[4] = scale.y * yAxis.x;
            this.rawData[5] = scale.y * yAxis.y;
            this.rawData[6] = scale.y * yAxis.z;
            this.rawData[7] = 0;
            this.rawData[8] = scale.z * zAxis.x;
            this.rawData[9] = scale.z * zAxis.y;
            this.rawData[10] = scale.z * zAxis.z;
            this.rawData[11] = 0;
            this.rawData[12] = position.x;
            this.rawData[13] = position.y;
            this.rawData[14] = position.z;
            this.rawData[15] = 1;
        };
        /**
         * 以字符串返回矩阵的值
         */
        Matrix3D.prototype.toString = function () {
            var str = "";
            var showLen = 5;
            var precision = Math.pow(10, showLen - 1);
            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 4; j++) {
                    str += feng3d.StringUtils.getString(Math.round(this.rawData[i * 4 + j] * precision) / precision, showLen, " ");
                }
                if (i != 3)
                    str += "\n";
            }
            return str;
        };
        return Matrix3D;
    }());
    /**
     * 用于运算临时变量
     */
    Matrix3D.RAW_DATA_CONTAINER = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1 //
    ]);
    feng3d.Matrix3D = Matrix3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * A Quaternion object which can be used to represent rotations.
     */
    var Quaternion = (function () {
        /**
         * Creates a new Quaternion object.
         * @param x The x value of the quaternion.
         * @param y The y value of the quaternion.
         * @param z The z value of the quaternion.
         * @param w The w value of the quaternion.
         */
        function Quaternion(x, y, z, w) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (z === void 0) { z = 0; }
            if (w === void 0) { w = 1; }
            /**
             * The x value of the quaternion.
             */
            this.x = 0;
            /**
             * The y value of the quaternion.
             */
            this.y = 0;
            /**
             * The z value of the quaternion.
             */
            this.z = 0;
            /**
             * The w value of the quaternion.
             */
            this.w = 1;
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }
        Object.defineProperty(Quaternion.prototype, "magnitude", {
            /**
             * Returns the magnitude of the quaternion object.
             */
            get: function () {
                return Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Fills the quaternion object with the result from a multiplication of two quaternion objects.
         *
         * @param    qa    The first quaternion in the multiplication.
         * @param    qb    The second quaternion in the multiplication.
         */
        Quaternion.prototype.multiply = function (qa, qb) {
            var w1 = qa.w, x1 = qa.x, y1 = qa.y, z1 = qa.z;
            var w2 = qb.w, x2 = qb.x, y2 = qb.y, z2 = qb.z;
            this.w = w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2;
            this.x = w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2;
            this.y = w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2;
            this.z = w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2;
        };
        Quaternion.prototype.multiplyVector = function (vector, target) {
            if (target === void 0) { target = null; }
            target = target || new Quaternion();
            var x2 = vector.x;
            var y2 = vector.y;
            var z2 = vector.z;
            target.w = -this.x * x2 - this.y * y2 - this.z * z2;
            target.x = this.w * x2 + this.y * z2 - this.z * y2;
            target.y = this.w * y2 - this.x * z2 + this.z * x2;
            target.z = this.w * z2 + this.x * y2 - this.y * x2;
            return target;
        };
        /**
         * Fills the quaternion object with values representing the given rotation around a vector.
         *
         * @param    axis    The axis around which to rotate
         * @param    angle    The angle in radians of the rotation.
         */
        Quaternion.prototype.fromAxisAngle = function (axis, angle) {
            var sin_a = Math.sin(angle / 2);
            var cos_a = Math.cos(angle / 2);
            this.x = axis.x * sin_a;
            this.y = axis.y * sin_a;
            this.z = axis.z * sin_a;
            this.w = cos_a;
            this.normalize();
        };
        /**
         * Spherically interpolates between two quaternions, providing an interpolation between rotations with constant angle change rate.
         * @param qa The first quaternion to interpolate.
         * @param qb The second quaternion to interpolate.
         * @param t The interpolation weight, a value between 0 and 1.
         */
        Quaternion.prototype.slerp = function (qa, qb, t) {
            var w1 = qa.w, x1 = qa.x, y1 = qa.y, z1 = qa.z;
            var w2 = qb.w, x2 = qb.x, y2 = qb.y, z2 = qb.z;
            var dot = w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2;
            // shortest direction
            if (dot < 0) {
                dot = -dot;
                w2 = -w2;
                x2 = -x2;
                y2 = -y2;
                z2 = -z2;
            }
            if (dot < 0.95) {
                // interpolate angle linearly
                var angle = Math.acos(dot);
                var s = 1 / Math.sin(angle);
                var s1 = Math.sin(angle * (1 - t)) * s;
                var s2 = Math.sin(angle * t) * s;
                this.w = w1 * s1 + w2 * s2;
                this.x = x1 * s1 + x2 * s2;
                this.y = y1 * s1 + y2 * s2;
                this.z = z1 * s1 + z2 * s2;
            }
            else {
                // nearly identical angle, interpolate linearly
                this.w = w1 + t * (w2 - w1);
                this.x = x1 + t * (x2 - x1);
                this.y = y1 + t * (y2 - y1);
                this.z = z1 + t * (z2 - z1);
                var len = 1.0 / Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
                this.w *= len;
                this.x *= len;
                this.y *= len;
                this.z *= len;
            }
        };
        /**
         * 线性求插值
         * @param qa 第一个四元素
         * @param qb 第二个四元素
         * @param t 权重
         */
        Quaternion.prototype.lerp = function (qa, qb, t) {
            var w1 = qa.w, x1 = qa.x, y1 = qa.y, z1 = qa.z;
            var w2 = qb.w, x2 = qb.x, y2 = qb.y, z2 = qb.z;
            var len;
            // shortest direction
            if (w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2 < 0) {
                w2 = -w2;
                x2 = -x2;
                y2 = -y2;
                z2 = -z2;
            }
            this.w = w1 + t * (w2 - w1);
            this.x = x1 + t * (x2 - x1);
            this.y = y1 + t * (y2 - y1);
            this.z = z1 + t * (z2 - z1);
            len = 1.0 / Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
            this.w *= len;
            this.x *= len;
            this.y *= len;
            this.z *= len;
        };
        /**
         * Fills the quaternion object with values representing the given euler rotation.
         *
         * @param    ax        The angle in radians of the rotation around the ax axis.
         * @param    ay        The angle in radians of the rotation around the ay axis.
         * @param    az        The angle in radians of the rotation around the az axis.
         */
        Quaternion.prototype.fromEulerAngles = function (ax, ay, az) {
            var halfX = ax * .5, halfY = ay * .5, halfZ = az * .5;
            var cosX = Math.cos(halfX), sinX = Math.sin(halfX);
            var cosY = Math.cos(halfY), sinY = Math.sin(halfY);
            var cosZ = Math.cos(halfZ), sinZ = Math.sin(halfZ);
            this.w = cosX * cosY * cosZ + sinX * sinY * sinZ;
            this.x = sinX * cosY * cosZ - cosX * sinY * sinZ;
            this.y = cosX * sinY * cosZ + sinX * cosY * sinZ;
            this.z = cosX * cosY * sinZ - sinX * sinY * cosZ;
        };
        /**
         * Fills a target Vector3D object with the Euler angles that form the rotation represented by this quaternion.
         * @param target An optional Vector3D object to contain the Euler angles. If not provided, a new object is created.
         * @return The Vector3D containing the Euler angles.
         */
        Quaternion.prototype.toEulerAngles = function (target) {
            if (target === void 0) { target = null; }
            target = target || new feng3d.Vector3D();
            target.x = Math.atan2(2 * (this.w * this.x + this.y * this.z), 1 - 2 * (this.x * this.x + this.y * this.y));
            target.y = Math.asin(2 * (this.w * this.y - this.z * this.x));
            target.z = Math.atan2(2 * (this.w * this.z + this.x * this.y), 1 - 2 * (this.y * this.y + this.z * this.z));
            return target;
        };
        /**
         * Normalises the quaternion object.
         */
        Quaternion.prototype.normalize = function (val) {
            if (val === void 0) { val = 1; }
            var mag = val / Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
            this.x *= mag;
            this.y *= mag;
            this.z *= mag;
            this.w *= mag;
        };
        /**
         * Used to trace the values of a quaternion.
         *
         * @return A string representation of the quaternion object.
         */
        Quaternion.prototype.toString = function () {
            return "{this.x:" + this.x + " this.y:" + this.y + " this.z:" + this.z + " this.w:" + this.w + "}";
        };
        /**
         * Converts the quaternion to a Matrix3D object representing an equivalent rotation.
         * @param target An optional Matrix3D container to store the transformation in. If not provided, a new object is created.
         * @return A Matrix3D object representing an equivalent rotation.
         */
        Quaternion.prototype.toMatrix3D = function (target) {
            if (target === void 0) { target = null; }
            if (!target)
                target = new feng3d.Matrix3D();
            var rawData = target.rawData;
            var xy2 = 2.0 * this.x * this.y, xz2 = 2.0 * this.x * this.z, xw2 = 2.0 * this.x * this.w;
            var yz2 = 2.0 * this.y * this.z, yw2 = 2.0 * this.y * this.w, zw2 = 2.0 * this.z * this.w;
            var xx = this.x * this.x, yy = this.y * this.y, zz = this.z * this.z, ww = this.w * this.w;
            rawData[0] = xx - yy - zz + ww;
            rawData[4] = xy2 - zw2;
            rawData[8] = xz2 + yw2;
            rawData[12] = 0;
            rawData[1] = xy2 + zw2;
            rawData[5] = -xx + yy - zz + ww;
            rawData[9] = yz2 - xw2;
            rawData[13] = 0;
            rawData[2] = xz2 - yw2;
            rawData[6] = yz2 + xw2;
            rawData[10] = -xx - yy + zz + ww;
            rawData[14] = 0;
            rawData[3] = 0.0;
            rawData[7] = 0.0;
            rawData[11] = 0;
            rawData[15] = 1;
            target.copyRawDataFrom(rawData);
            return target;
        };
        /**
         * Extracts a quaternion rotation matrix out of a given Matrix3D object.
         * @param matrix The Matrix3D out of which the rotation will be extracted.
         */
        Quaternion.prototype.fromMatrix = function (matrix) {
            var v = matrix.decompose()[1];
            this.fromEulerAngles(v.x, v.y, v.z);
        };
        /**
         * Converts the quaternion to a Vector.&lt;number&gt; matrix representation of a rotation equivalent to this quaternion.
         * @param target The Vector.&lt;number&gt; to contain the raw matrix data.
         * @param exclude4thRow If true, the last row will be omitted, and a 4x3 matrix will be generated instead of a 4x4.
         */
        Quaternion.prototype.toRawData = function (target, exclude4thRow) {
            if (exclude4thRow === void 0) { exclude4thRow = false; }
            var xy2 = 2.0 * this.x * this.y, xz2 = 2.0 * this.x * this.z, xw2 = 2.0 * this.x * this.w;
            var yz2 = 2.0 * this.y * this.z, yw2 = 2.0 * this.y * this.w, zw2 = 2.0 * this.z * this.w;
            var xx = this.x * this.x, yy = this.y * this.y, zz = this.z * this.z, ww = this.w * this.w;
            target[0] = xx - yy - zz + ww;
            target[1] = xy2 - zw2;
            target[2] = xz2 + yw2;
            target[4] = xy2 + zw2;
            target[5] = -xx + yy - zz + ww;
            target[6] = yz2 - xw2;
            target[8] = xz2 - yw2;
            target[9] = yz2 + xw2;
            target[10] = -xx - yy + zz + ww;
            target[3] = target[7] = target[11] = 0;
            if (!exclude4thRow) {
                target[12] = target[13] = target[14] = 0;
                target[15] = 1;
            }
        };
        /**
         * Clones the quaternion.
         * @return An exact duplicate of the current Quaternion.
         */
        Quaternion.prototype.clone = function () {
            return new Quaternion(this.x, this.y, this.z, this.w);
        };
        /**
         * Rotates a point.
         * @param vector The Vector3D object to be rotated.
         * @param target An optional Vector3D object that will contain the rotated coordinates. If not provided, a new object will be created.
         * @return A Vector3D object containing the rotated point.
         */
        Quaternion.prototype.rotatePoint = function (vector, target) {
            if (target === void 0) { target = null; }
            var x1, y1, z1, w1;
            var x2 = vector.x, y2 = vector.y, z2 = vector.z;
            target = target || new feng3d.Vector3D();
            // p*q'
            w1 = -this.x * x2 - this.y * y2 - this.z * z2;
            x1 = this.w * x2 + this.y * z2 - this.z * y2;
            y1 = this.w * y2 - this.x * z2 + this.z * x2;
            z1 = this.w * z2 + this.x * y2 - this.y * x2;
            target.x = -w1 * this.x + x1 * this.w - y1 * this.z + z1 * this.y;
            target.y = -w1 * this.y + x1 * this.z + y1 * this.w - z1 * this.x;
            target.z = -w1 * this.z - x1 * this.y + y1 * this.x + z1 * this.w;
            return target;
        };
        /**
         * Copies the data from a quaternion into this instance.
         * @param q The quaternion to copy from.
         */
        Quaternion.prototype.copyFrom = function (q) {
            this.x = q.x;
            this.y = q.y;
            this.z = q.z;
            this.w = q.w;
        };
        return Quaternion;
    }());
    feng3d.Quaternion = Quaternion;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3d直线
     * @author feng 2013-6-13
     */
    var Line3D = (function () {
        /**
         * 根据直线某点与方向创建直线
         * @param position 直线上某点
         * @param direction 直线的方向
         */
        function Line3D(position, direction) {
            if (position === void 0) { position = null; }
            if (direction === void 0) { direction = null; }
            this.position = position ? position : new feng3d.Vector3D();
            this.direction = direction ? direction : new feng3d.Vector3D(0, 0, 1);
        }
        /**
         * 根据直线上两点初始化直线
         * @param p0 Vector3D
         * @param p1 Vector3D
         */
        Line3D.prototype.fromPoints = function (p0, p1) {
            this.position = p0;
            this.direction = p1.subtract(p0);
        };
        /**
         * 根据直线某点与方向初始化直线
         * @param position 直线上某点
         * @param direction 直线的方向
         */
        Line3D.prototype.fromPosAndDir = function (position, direction) {
            this.position = position;
            this.direction = direction;
        };
        /**
         * 获取直线上的一个点
         * @param length 与原点距离
         */
        Line3D.prototype.getPoint = function (length) {
            if (length === void 0) { length = 0; }
            var lengthDir = this.direction.clone();
            lengthDir.scaleBy(length);
            var newPoint = this.position.add(lengthDir);
            return newPoint;
        };
        return Line3D;
    }());
    feng3d.Line3D = Line3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D射线
     * @author feng 2013-6-13
     */
    var Ray3D = (function (_super) {
        __extends(Ray3D, _super);
        function Ray3D(position, direction) {
            if (position === void 0) { position = null; }
            if (direction === void 0) { direction = null; }
            return _super.call(this, position, direction) || this;
        }
        return Ray3D;
    }(feng3d.Line3D));
    feng3d.Ray3D = Ray3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3d面
     */
    var Plane3D = (function () {
        /**
         * 创建一个平面
         * @param a		A系数
         * @param b		B系数
         * @param c		C系数
         * @param d		D系数
         */
        function Plane3D(a, b, c, d) {
            if (a === void 0) { a = 0; }
            if (b === void 0) { b = 0; }
            if (c === void 0) { c = 0; }
            if (d === void 0) { d = 0; }
            this.a = a;
            this.b = b;
            this.c = c;
            this.d = d;
            if (a == 0 && b == 0)
                this._alignment = Plane3D.ALIGN_XY_AXIS;
            else if (b == 0 && c == 0)
                this._alignment = Plane3D.ALIGN_YZ_AXIS;
            else if (a == 0 && c == 0)
                this._alignment = Plane3D.ALIGN_XZ_AXIS;
            else
                this._alignment = Plane3D.ALIGN_ANY;
        }
        Object.defineProperty(Plane3D.prototype, "normal", {
            /**
             * 法线
             */
            get: function () {
                return new feng3d.Vector3D(this.a, this.b, this.c);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 通过3顶点定义一个平面
         * @param p0		点0
         * @param p1		点1
         * @param p2		点2
         */
        Plane3D.prototype.fromPoints = function (p0, p1, p2) {
            //计算向量1
            var d1x = p1.x - p0.x;
            var d1y = p1.y - p0.y;
            var d1z = p1.z - p0.z;
            //计算向量2
            var d2x = p2.x - p0.x;
            var d2y = p2.y - p0.y;
            var d2z = p2.z - p0.z;
            //叉乘计算法线
            this.a = d1y * d2z - d1z * d2y;
            this.b = d1z * d2x - d1x * d2z;
            this.c = d1x * d2y - d1y * d2x;
            //平面上点与法线点乘计算D值
            this.d = this.a * p0.x + this.b * p0.y + this.c * p0.z;
            //法线平行z轴
            if (this.a == 0 && this.b == 0)
                this._alignment = Plane3D.ALIGN_XY_AXIS;
            else if (this.b == 0 && this.c == 0)
                this._alignment = Plane3D.ALIGN_YZ_AXIS;
            else if (this.a == 0 && this.c == 0)
                this._alignment = Plane3D.ALIGN_XZ_AXIS;
            else
                this._alignment = Plane3D.ALIGN_ANY;
        };
        /**
         * 根据法线与点定义平面
         * @param normal		平面法线
         * @param point			平面上任意一点
         */
        Plane3D.prototype.fromNormalAndPoint = function (normal, point) {
            this.a = normal.x;
            this.b = normal.y;
            this.c = normal.z;
            this.d = this.a * point.x + this.b * point.y + this.c * point.z;
            if (this.a == 0 && this.b == 0)
                this._alignment = Plane3D.ALIGN_XY_AXIS;
            else if (this.b == 0 && this.c == 0)
                this._alignment = Plane3D.ALIGN_YZ_AXIS;
            else if (this.a == 0 && this.c == 0)
                this._alignment = Plane3D.ALIGN_XZ_AXIS;
            else
                this._alignment = Plane3D.ALIGN_ANY;
        };
        /**
         * 标准化平面
         * @return		标准化后的平面
         */
        Plane3D.prototype.normalize = function () {
            var len = 1 / Math.sqrt(this.a * this.a + this.b * this.b + this.c * this.c);
            this.a *= len;
            this.b *= len;
            this.c *= len;
            this.d *= len;
            return this;
        };
        /**
         * 计算点与平面的距离
         * @param p		点
         * @returns		距离
         */
        Plane3D.prototype.distance = function (p) {
            if (this._alignment == Plane3D.ALIGN_YZ_AXIS)
                return this.a * p.x - this.d;
            else if (this._alignment == Plane3D.ALIGN_XZ_AXIS)
                return this.b * p.y - this.d;
            else if (this._alignment == Plane3D.ALIGN_XY_AXIS)
                return this.c * p.z - this.d;
            else
                return this.a * p.x + this.b * p.y + this.c * p.z - this.d;
        };
        /**
         * 顶点分类
         * <p>把顶点分为后面、前面、相交三类</p>
         * @param p			顶点
         * @return			顶点类型 PlaneClassification.BACK,PlaneClassification.FRONT,PlaneClassification.INTERSECT
         * @see				feng3d.core.math.PlaneClassification
         */
        Plane3D.prototype.classifyPoint = function (p, epsilon) {
            if (epsilon === void 0) { epsilon = 0.01; }
            // check NaN
            if (this.d != this.d)
                return feng3d.PlaneClassification.FRONT;
            var len;
            if (this._alignment == Plane3D.ALIGN_YZ_AXIS)
                len = this.a * p.x - this.d;
            else if (this._alignment == Plane3D.ALIGN_XZ_AXIS)
                len = this.b * p.y - this.d;
            else if (this._alignment == Plane3D.ALIGN_XY_AXIS)
                len = this.c * p.z - this.d;
            else
                len = this.a * p.x + this.b * p.y + this.c * p.z - this.d;
            if (len < -epsilon)
                return feng3d.PlaneClassification.BACK;
            else if (len > epsilon)
                return feng3d.PlaneClassification.FRONT;
            else
                return feng3d.PlaneClassification.INTERSECT;
        };
        /**
         * 获取与直线交点
         */
        Plane3D.prototype.lineCross = function (line3D) {
            var lineDir = line3D.direction.clone();
            lineDir.normalize();
            var cosAngle = lineDir.dotProduct(this.normal);
            var distance = this.distance(line3D.position);
            var addVec = lineDir.clone();
            addVec.scaleBy(-distance / cosAngle);
            var crossPos = line3D.position.add(addVec);
            return crossPos;
        };
        /**
         * 输出字符串
         */
        Plane3D.prototype.toString = function () {
            return "Plane3D [this.a:" + this.a + ", this.b:" + this.b + ", this.c:" + this.c + ", this.d:" + this.d + "]";
        };
        return Plane3D;
    }());
    /**
     * 普通平面
     * <p>不与对称轴平行或垂直</p>
     */
    Plane3D.ALIGN_ANY = 0;
    /**
     * XY方向平面
     * <p>法线与Z轴平行</p>
     */
    Plane3D.ALIGN_XY_AXIS = 1;
    /**
     * YZ方向平面
     * <p>法线与X轴平行</p>
     */
    Plane3D.ALIGN_YZ_AXIS = 2;
    /**
     * XZ方向平面
     * <p>法线与Y轴平行</p>
     */
    Plane3D.ALIGN_XZ_AXIS = 3;
    feng3d.Plane3D = Plane3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 点与面的相对位置
     * @author feng
     */
    var PlaneClassification = (function () {
        function PlaneClassification() {
        }
        return PlaneClassification;
    }());
    /**
     * 在平面后面
     * <p>等价于平面内</p>
     * @see #IN
     */
    PlaneClassification.BACK = 0;
    /**
     * 在平面前面
     * <p>等价于平面外</p>
     * @see #OUT
     */
    PlaneClassification.FRONT = 1;
    /**
     * 在平面内
     * <p>等价于在平面后</p>
     * @see #BACK
     */
    PlaneClassification.IN = 0;
    /**
     * 在平面外
     * <p>等价于平面前面</p>
     * @see #FRONT
     */
    PlaneClassification.OUT = 1;
    /**
     * 与平面相交
     */
    PlaneClassification.INTERSECT = 2;
    feng3d.PlaneClassification = PlaneClassification;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 颜色
     * @author feng 2016-09-24
     */
    var Color = (function (_super) {
        __extends(Color, _super);
        /**
         * 构建颜色
         * @param r     红[0,1]
         * @param g     绿[0,1]
         * @param b     蓝[0,1]
         * @param a     透明度[0,1]
         */
        function Color(r, g, b, a) {
            if (r === void 0) { r = 1; }
            if (g === void 0) { g = 1; }
            if (b === void 0) { b = 1; }
            if (a === void 0) { a = 1; }
            return _super.call(this, r, g, b, a) || this;
        }
        Object.defineProperty(Color.prototype, "r", {
            /**
             * 红[0,1]
             */
            get: function () { return this.x; },
            set: function (value) { this.x = value; },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(Color.prototype, "g", {
            /**
             * 绿[0,1]
             */
            get: function () { return this.y; },
            set: function (value) { this.y = value; },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(Color.prototype, "b", {
            /**
             * 蓝[0,1]
             */
            get: function () { return this.z; },
            set: function (value) { this.z = value; },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        Object.defineProperty(Color.prototype, "a", {
            /**
             * 透明度[0,1]
             */
            get: function () { return this.w; },
            set: function (value) { this.w = value; },
            enumerable: true,
            configurable: true
        });
        ;
        ;
        /**
         * 通过
         * @param color
         * @param hasAlpha
         */
        Color.prototype.fromUnit = function (color, hasAlpha) {
            if (hasAlpha === void 0) { hasAlpha = false; }
            if (hasAlpha)
                this.a = ((color >> 24) & 0xff) / 0xff;
            this.r = ((color >> 16) & 0xff) / 0xff;
            this.g = ((color >> 8) & 0xff) / 0xff;
            this.b = (color & 0xff) / 0xff;
        };
        Color.prototype.toInt = function () {
            var value = (this.a * 0xff) << 24 + (this.r * 0xff) << 16 + (this.g * 0xff) << 8 + (this.b * 0xff);
            return value;
        };
        /**
         * 输出16进制字符串
         */
        Color.prototype.toHexString = function () {
            var intR = (this.r * 0xff) | 0;
            var intG = (this.g * 0xff) | 0;
            var intB = (this.b * 0xff) | 0;
            var intA = (this.a * 0xff) | 0;
            return "#" + Color.ToHex(intA) + Color.ToHex(intR) + Color.ToHex(intG) + Color.ToHex(intB);
        };
        /**
         * 混合颜色
         * @param color 混入的颜色
         * @param rate  混入比例
         */
        Color.prototype.mix = function (color, rate) {
            if (rate === void 0) { rate = 0.5; }
            this.r = this.r * (1 - rate) + color.r * rate;
            this.g = this.g * (1 - rate) + color.g * rate;
            this.b = this.b * (1 - rate) + color.b * rate;
            this.a = this.a * (1 - rate) + color.a * rate;
            return this;
        };
        /**
         * 输出字符串
         */
        Color.prototype.toString = function () {
            return "{R: " + this.r + " G:" + this.g + " B:" + this.b + " A:" + this.a + "}";
        };
        /**
         * [0,15]数值转为16进制字符串
         * param i  [0,15]数值
         */
        Color.ToHex = function (i) {
            var str = i.toString(16);
            if (i <= 0xf) {
                return ("0" + str).toUpperCase();
            }
            return str.toUpperCase();
        };
        return Color;
    }(feng3d.Vector3D));
    feng3d.Color = Color;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 数据序列化
     * @author feng 2017-03-11
     */
    var Serialization = (function () {
        function Serialization() {
        }
        /**
         * 由纯数据对象（无循环引用）转换为复杂类型（例如feng3d对象）
         */
        Serialization.prototype.readObject = function (data) {
            //处理简单类型
            if (feng3d.ClassUtils.isBaseType(data)) {
                return data;
            }
            //处理数组
            if (data instanceof Array) {
                var arr = [];
                for (var i = 0; i < data.length; i++) {
                    arr[i] = this.readObject(data[i]);
                }
                return arr;
            }
            //处理其他数据结构
            var cls = feng3d.ClassUtils.getDefinitionByName(data.__className__);
            feng3d.debuger && feng3d.assert(cls != null);
            var object = new cls();
            var keys = Object.keys(data);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var ishandle = this.handle(object, key, data[key]);
                if (ishandle)
                    continue;
                object[key] = this.readObject(data[key]);
            }
            return object;
        };
        Serialization.prototype.handle = function (object, key, data) {
            if (feng3d.ClassUtils.is(object, feng3d.GameObject) && key == "children_") {
                var children = this.readObject(data);
                var object3D = object;
                for (var i = 0; i < children.length; i++) {
                    children[i] && object3D.transform.setChildAt(children[i].transform, i);
                }
                return true;
            }
            if (feng3d.ClassUtils.is(object, feng3d.GameObject) && key == "components_") {
                var components = this.readObject(data);
                var component = object;
                for (var i = 0; i < components.length; i++) {
                    component.setComponentAt(components[i], i);
                }
                return true;
            }
            if (feng3d.ClassUtils.is(object, feng3d.SegmentGeometry) && key == "segments_") {
                var segments = this.readObject(data);
                var segmentGeometry = object;
                for (var i = 0; i < segments.length; i++) {
                    segmentGeometry.setSegmentAt(segments[i], i);
                }
                return true;
            }
            return false;
        };
        /**
         * 由复杂类型（例如feng3d对象）转换为纯数据对象（无循环引用）
         */
        Serialization.prototype.writeObject = function (object) {
            //排除指定对象
            if (feng3d.serializationConfig.excludeObject.indexOf(object) != -1) {
                return undefined;
            }
            if (feng3d.ClassUtils.isBaseType(object)) {
                return object;
            }
            if (object instanceof Array) {
                var arr = [];
                for (var i = 0; i < object.length; i++) {
                    var item = this.writeObject(object[i]);
                    if (item !== undefined) {
                        arr.push(item);
                    }
                }
                if (arr.length == 0)
                    return undefined;
                return arr;
            }
            var className = feng3d.ClassUtils.getQualifiedClassName(object);
            var toJson = feng3d.serializationConfig.classConfig[className] && feng3d.serializationConfig.classConfig[className].toJson;
            if (toJson) {
                return toJson(object);
            }
            var attributeNames = this.getAttributes(object);
            attributeNames = attributeNames.sort();
            //没有属性时不保存该对象
            if (attributeNames.length == 0)
                return undefined;
            var json = {};
            json.__className__ = className;
            for (var i = 0; i < attributeNames.length; i++) {
                var attributeName = attributeNames[i];
                var value = this.writeObject(object[attributeName]);
                if (value !== undefined) {
                    json[attributeName] = value;
                }
            }
            return json;
        };
        Serialization.prototype.getAttributes = function (object) {
            var className = feng3d.ClassUtils.getQualifiedClassName(object);
            //保存以字母开头或者纯数字的所有属性
            var filterReg = /([a-zA-Z](\w*)|(\d+))/;
            if (className == "Array" || className == "Object") {
                var attributeNames = Object.keys(object);
            }
            else {
                //
                var attributeNames = Object.keys(this.getNewObject(className));
                attributeNames = attributeNames.filter(function (value, index, array) {
                    var result = filterReg.exec(value);
                    return result[0] == value;
                });
            }
            return attributeNames;
        };
        /**
         * 获取新对象来判断存储的属性
         */
        Serialization.prototype.getNewObject = function (className) {
            if (tempObjectMap[className]) {
                return tempObjectMap[className];
            }
            var cls = feng3d.ClassUtils.getDefinitionByName(className);
            tempObjectMap[className] = new cls();
            return tempObjectMap[className];
        };
        return Serialization;
    }());
    feng3d.Serialization = Serialization;
    var tempObjectMap = {};
    feng3d.serializationConfig = {
        // export var serializationConfig = {
        excludeObject: [],
        excludeClass: [], classConfig: {}
    };
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 事件
     * @author feng 2014-5-7
     */
    var Event = (function () {
        /**
         * 创建一个作为参数传递给事件侦听器的 Event 对象。
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        function Event(type, data, bubbles) {
            if (data === void 0) { data = null; }
            if (bubbles === void 0) { bubbles = false; }
            this._type = type;
            this._bubbles = bubbles;
            this.data = data;
        }
        Object.defineProperty(Event.prototype, "isStop", {
            /**
             * 是否停止处理事件监听器
             */
            get: function () {
                return this._isStop;
            },
            set: function (value) {
                this._isStopBubbles = this._isStop = this._isStopBubbles || value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Event.prototype, "isStopBubbles", {
            /**
             * 是否停止冒泡
             */
            get: function () {
                return this._isStopBubbles;
            },
            set: function (value) {
                this._isStopBubbles = this._isStopBubbles || value;
            },
            enumerable: true,
            configurable: true
        });
        Event.prototype.tostring = function () {
            return "[" + (typeof this) + " type=\"" + this._type + "\" bubbles=" + this._bubbles + "]";
        };
        Object.defineProperty(Event.prototype, "bubbles", {
            /**
             * 表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
             */
            get: function () {
                return this._bubbles;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Event.prototype, "type", {
            /**
             * 事件的类型。类型区分大小写。
             */
            get: function () {
                return this._type;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Event.prototype, "target", {
            /**
             * 事件目标。
             */
            get: function () {
                return this._target;
            },
            set: function (value) {
                this._currentTarget = value;
                if (this._target == null) {
                    this._target = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Event.prototype, "currentTarget", {
            /**
             * 当前正在使用某个事件侦听器处理 Event 对象的对象。
             */
            get: function () {
                return this._currentTarget;
            },
            enumerable: true,
            configurable: true
        });
        return Event;
    }());
    /**
     * [广播事件] 进入新的一帧,监听此事件将会在下一帧开始时触发一次回调。这是一个广播事件，可以在任何一个显示对象上监听，无论它是否在显示列表中。
     */
    Event.ENTER_FRAME = "enterFrame";
    /**
     * 发生变化时派发
     */
    Event.CHANGE = "change";
    /**
     * 加载完成时派发
     */
    Event.LOADED = "loaded";
    feng3d.Event = Event;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 为了实现非flash原生显示列表的冒泡事件，自定义事件适配器
     * @author feng 2016-3-22
     */
    var EventDispatcher = (function () {
        //------------------------------------------
        // Public Functions
        //------------------------------------------
        /**
         * 构建事件适配器
         * @param target		事件适配主体
         */
        function EventDispatcher(target) {
            if (target === void 0) { target = null; }
            //------------------------------------------
            // Protected Properties
            //------------------------------------------
            /**
             * 冒泡属性名称为“parent”
             */
            this._bubbleAttribute = "parent";
            /**
             * 延迟计数，当计数大于0时事件将会被收集，等到计数等于0时派发
             */
            this._delaycount = 0;
            /**
             * 被延迟的事件列表
             */
            this._delayEvents = [];
            this._listenermap = {};
            this._target = target;
            if (this._target == null)
                this._target = this;
        }
        Object.defineProperty(EventDispatcher.prototype, "isLockEvent", {
            /**
             * 事件是否被锁住
             */
            get: function () {
                return this._delaycount > 0;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 监听一次事件后将会被移除
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        EventDispatcher.prototype.once = function (type, listener, thisObject, priority) {
            if (priority === void 0) { priority = 0; }
            if (listener == null)
                return;
            this._addEventListener(type, listener, thisObject, priority, true);
        };
        /**
         * 使用 EventDispatcher 对象注册事件侦听器对象，以使侦听器能够接收事件通知。
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        EventDispatcher.prototype.addEventListener = function (type, listener, thisObject, priority) {
            if (priority === void 0) { priority = 0; }
            if (listener == null)
                return;
            this._addEventListener(type, listener, thisObject, priority);
        };
        /**
         * 从 EventDispatcher 对象中删除侦听器. 如果没有向 IEventDispatcher 对象注册任何匹配的侦听器，则对此方法的调用没有任何效果。
         *
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        EventDispatcher.prototype.removeEventListener = function (type, listener, thisObject) {
            this._removeEventListener(type, listener, thisObject);
        };
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEventDispatcher 对象。
         * @param event						调度到事件流中的 Event 对象。
         * @returns                         被延迟返回false，否则返回true
         */
        EventDispatcher.prototype.dispatchEvent = function (event) {
            if (this._delaycount > 0) {
                if (this._delayEvents.indexOf(event) == -1)
                    this._delayEvents.push(event);
                return false;
            }
            //设置目标
            event.target = this._target;
            var listeners = this._listenermap[event.type];
            if (listeners && listeners.length > 0) {
                var onceElements = [];
                //遍历调用事件回调函数
                for (var i = 0; i < listeners.length && !event.isStop; i++) {
                    var element = listeners[i];
                    element.listener.call(element.thisObject, event);
                    if (element.once) {
                        onceElements.push(i);
                    }
                }
                while (onceElements.length > 0) {
                    listeners.splice(onceElements.pop(), 1);
                }
            }
            //事件冒泡(冒泡阶段)
            if (event.bubbles && !event.isStopBubbles) {
                this.dispatchBubbleEvent(event);
            }
            return true;
        };
        /**
         * 锁住事件
         * 当派发事件时先收集下来，调用unlockEvent派发被延迟的事件
         * 每调用一次lockEvent计数加1、调用unlockEvent一次计数减1，当计数为0时派发所有被收集事件
         * 与unlockEvent配合使用
         */
        EventDispatcher.prototype.lockEvent = function () {
            this._delaycount = this._delaycount + 1;
        };
        /**
         * 解锁事件，派发被锁住的事件
         * 每调用一次lockEvent计数加1、调用unlockEvent一次计数减1，当计数为0时派发所有被收集事件
         * 与delay配合使用
         */
        EventDispatcher.prototype.unlockEvent = function () {
            this._delaycount = this._delaycount - 1;
            if (this._delaycount == 0) {
                for (var i = 0; i < this._delayEvents.length; i++) {
                    this.dispatchEvent(this._delayEvents[i]);
                }
                this._delayEvents.length = 0;
            }
        };
        /**
         * 检查 EventDispatcher 对象是否为特定事件类型注册了任何侦听器.
         *
         * @param type		事件的类型。
         * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        EventDispatcher.prototype.hasEventListener = function (type) {
            return !!(this._listenermap[type] && this._listenermap[type].length);
        };
        //------------------------------------------
        // Protected Functions
        //------------------------------------------
        /**
         * 获取冒泡对象
         * @param event						调度到事件流中的 Event 对象。
         */
        EventDispatcher.prototype.getBubbleTargets = function (event) {
            return [this._target[this._bubbleAttribute]];
        };
        //------------------------------------------
        // Private Methods
        //------------------------------------------
        /**
         * 添加监听
         * @param dispatcher 派发器
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        EventDispatcher.prototype._addEventListener = function (type, listener, thisObject, priority, once) {
            if (thisObject === void 0) { thisObject = null; }
            if (priority === void 0) { priority = 0; }
            if (once === void 0) { once = false; }
            this._removeEventListener(type, listener, thisObject);
            var listeners = this._listenermap[type] = this._listenermap[type] || [];
            for (var i = 0; i < listeners.length; i++) {
                var element = listeners[i];
                if (priority > element.priority) {
                    break;
                }
            }
            listeners.splice(i, 0, { listener: listener, thisObject: thisObject, priority: priority, once: once });
        };
        /**
         * 移除监听
         * @param dispatcher 派发器
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        EventDispatcher.prototype._removeEventListener = function (type, listener, thisObject) {
            if (thisObject === void 0) { thisObject = null; }
            var listeners = this._listenermap[type];
            if (listeners) {
                for (var i = listeners.length - 1; i >= 0; i--) {
                    var element = listeners[i];
                    if (element.listener == listener && element.thisObject == thisObject) {
                        listeners.splice(i, 1);
                    }
                }
                if (listeners.length == 0) {
                    delete this._listenermap[type];
                }
            }
        };
        /**
         * 派发冒泡事件
         * @param event						调度到事件流中的 Event 对象。
         */
        EventDispatcher.prototype.dispatchBubbleEvent = function (event) {
            var bubbleTargets = this.getBubbleTargets(event);
            bubbleTargets && bubbleTargets.forEach(function (element) {
                element && element.dispatchEvent(event);
            });
        };
        return EventDispatcher;
    }());
    feng3d.EventDispatcher = EventDispatcher;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var ArrayList = (function (_super) {
        __extends(ArrayList, _super);
        function ArrayList(source) {
            if (source === void 0) { source = null; }
            var _this = _super.call(this) || this;
            _this._source = source || [];
            _this._eventDispatcher = new feng3d.EventDispatcher();
            return _this;
        }
        Object.defineProperty(ArrayList.prototype, "length", {
            /**
             * 此集合中的项目数。
             */
            get: function () {
                return this._source.length;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 向列表末尾添加指定项目。
         */
        ArrayList.prototype.addItem = function (item) {
            this.addItemAt(item, this._source.length);
        };
        /**
         * 在指定的索引处添加项目。
         */
        ArrayList.prototype.addItemAt = function (item, index) {
            if (item instanceof Array) {
                for (var i = item.length - 1; i >= 0; i--) {
                    this.addItemAt(item[i], index);
                }
            }
            else {
                this._source.splice(index, 0, item);
                if (item instanceof feng3d.EventDispatcher) {
                    var _listenermap = this._eventDispatcher["_listenermap"];
                    for (var type in _listenermap) {
                        var listenerVOs = _listenermap[type];
                        for (var i = 0; i < listenerVOs.length; i++) {
                            var element = listenerVOs[i];
                            item.addEventListener(type, element.listener, element.thisObject, element.priority);
                        }
                    }
                }
            }
        };
        /**
         * 获取指定索引处的项目。
         */
        ArrayList.prototype.getItemAt = function (index) {
            return this._source[index];
        };
        /**
         * 如果项目位于列表中（这样的话 getItemAt(index) == item），则返回该项目的索引。
         */
        ArrayList.prototype.getItemIndex = function (item) {
            return this._source.indexOf(item);
        };
        /**
         * 删除列表中的所有项目。
         */
        ArrayList.prototype.removeAll = function () {
            while (this._source.length > 0) {
                this.removeItemAt(this._source.length - 1);
            }
        };
        /**
         * 删除指定项目。
         */
        ArrayList.prototype.removeItem = function (item) {
            if (item instanceof Array) {
                for (var i = item.length - 1; i >= 0; i--) {
                    this.removeItem(item[i]);
                }
            }
            else {
                var index = this.getItemIndex(item);
                if (index > -1)
                    this.removeItemAt(index);
            }
        };
        /**
         * 删除指定索引处的项目并返回该项目。
         */
        ArrayList.prototype.removeItemAt = function (index) {
            var item = this._source.splice(index, 1)[0];
            if (item instanceof feng3d.EventDispatcher) {
                var _listenermap = this._eventDispatcher["_listenermap"];
                for (var type in _listenermap) {
                    var listenerVOs = _listenermap[type];
                    for (var i = 0; i < listenerVOs.length; i++) {
                        var element = listenerVOs[i];
                        item.removeEventListener(type, element.listener, element.thisObject);
                    }
                }
            }
            return item;
        };
        /**
         * 在指定的索引处放置项目。
         */
        ArrayList.prototype.setItemAt = function (item, index) {
            var deleteItem = this.removeItemAt(index);
            this.addItemAt(item, index);
            return deleteItem;
        };
        /**
         * 返回与 IList 实现的填充顺序相同的 Array。
         */
        ArrayList.prototype.toArray = function () {
            return this._source.concat();
        };
        /**
         * 添加项事件
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        ArrayList.prototype.addItemEventListener = function (type, listener, thisObject, priority) {
            if (priority === void 0) { priority = 0; }
            this._eventDispatcher.addEventListener(type, listener, thisObject, priority);
            for (var i = 0; i < this._source.length; i++) {
                if (item instanceof feng3d.EventDispatcher) {
                    var item = this._source[i];
                    item.addEventListener(type, listener, thisObject, priority);
                }
            }
        };
        /**
         * 移除项事件
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        ArrayList.prototype.removeItemEventListener = function (type, listener, thisObject) {
            this._eventDispatcher.removeEventListener(type, listener, thisObject);
            for (var i = 0; i < this._source.length; i++) {
                var item = this._source[i];
                if (item instanceof feng3d.EventDispatcher) {
                    item.removeEventListener(type, listener, thisObject);
                }
            }
        };
        return ArrayList;
    }(feng3d.EventDispatcher));
    feng3d.ArrayList = ArrayList;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 心跳计时器
     */
    var SystemTicker = (function (_super) {
        __extends(SystemTicker, _super);
        /**
         * @private
         */
        function SystemTicker() {
            var _this = _super.call(this) || this;
            _this._startTime = -1;
            _this._startTime = Date.now();
            _this.init();
            return _this;
        }
        Object.defineProperty(SystemTicker.prototype, "startTime", {
            /**
             * 启动时间
             */
            get: function () {
                return this._startTime;
            },
            enumerable: true,
            configurable: true
        });
        SystemTicker.prototype.init = function () {
            var requestAnimationFrame = window["requestAnimationFrame"] ||
                window["webkitRequestAnimationFrame"] ||
                window["mozRequestAnimationFrame"] ||
                window["oRequestAnimationFrame"] ||
                window["msRequestAnimationFrame"];
            if (!requestAnimationFrame) {
                requestAnimationFrame = function (callback) {
                    return window.setTimeout(callback, 1000 / 60);
                };
            }
            requestAnimationFrame.call(window, onTick);
            var ticker = this;
            function onTick() {
                ticker.update();
                requestAnimationFrame.call(window, onTick);
            }
        };
        /**
         * @private
         * 执行一次刷新
         */
        SystemTicker.prototype.update = function () {
            this.dispatchEvent(new feng3d.Event(feng3d.Event.ENTER_FRAME));
        };
        return SystemTicker;
    }(feng3d.EventDispatcher));
    feng3d.SystemTicker = SystemTicker;
})(feng3d || (feng3d = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var feng3d;
(function (feng3d) {
    /**
     * The Timer class is the interface to timers, which let you run code on a specified time sequence. Use the start()
     * method to start a timer. Add an event listener for the timer event to set up code to be run on the timer interval.<br/>
     * You can create Timer objects to run once or repeat at specified intervals to execute code on a schedule. Depending
     * on the framerate or the runtime environment (available memory and other factors), the runtime may dispatchEvent events at
     * slightly offset intervals.
     * @see egret.TimerEvent
     * @version Egret 2.4
     * @platform Web,Native
     * @includeExample egret/utils/Timer.ts
     * @language en_US
     */
    /**
     * Timer 类是计时器的接口，它使您能按指定的时间序列运行代码。
     * 使用 start() 方法来启动计时器。为 timer 事件添加事件侦听器，以便将代码设置为按计时器间隔运行。
     * 可以创建 Timer 对象以运行一次或按指定间隔重复运行，从而按计划执行代码。
     * 根据 Egret 的帧速率或运行时环境（可用内存和其他因素），运行时调度事件的间隔可能稍有不同。
     * @see egret.TimerEvent
     * @version Egret 2.4
     * @platform Web,Native
     * @includeExample egret/utils/Timer.ts
     * @language zh_CN
     */
    var Timer = (function (_super) {
        __extends(Timer, _super);
        /**
         * Constructs a new Timer object with the specified delay and repeatCount states.
         * @param delay The delay between timer events, in milliseconds. A delay lower than 20 milliseconds is not recommended.
         * Timer frequency is limited to 60 frames per second, meaning a delay lower than 16.6 milliseconds causes runtime problems.
         * @param repeatCount Specifies the number of repetitions. If zero, the timer repeats indefinitely.If nonzero,
         * the timer runs the specified number of times and then stops.
         * @version Egret 2.4
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 使用指定的 delay 和 repeatCount 状态构造新的 Timer 对象。
         * @param delay 计时器事件间的延迟（以毫秒为单位）。建议 delay 不要低于 20 毫秒。计时器频率不得超过 60 帧/秒，这意味着低于 16.6 毫秒的延迟可导致出现运行时问题。
         * @param repeatCount 指定重复次数。如果为零，则计时器将持续不断重复运行。如果不为 0，则将运行计时器，运行次数为指定的次数，然后停止。
         * @version Egret 2.4
         * @platform Web,Native
         * @language zh_CN
         */
        function Timer(delay, repeatCount) {
            if (repeatCount === void 0) { repeatCount = 0; }
            var _this = _super.call(this) || this;
            /**
             * @private
             */
            _this._delay = 0;
            /**
             * @private
             */
            _this._currentCount = 0;
            /**
             * @private
             */
            _this._running = false;
            /**
             * @private
             */
            _this.updateInterval = 1000;
            /**
             * @private
             */
            _this.lastCount = 1000;
            /**
             * @private
             */
            _this.lastTimeStamp = 0;
            _this.delay = delay;
            _this.repeatCount = +repeatCount | 0;
            return _this;
        }
        Object.defineProperty(Timer.prototype, "delay", {
            /**
             * The delay between timer events, in milliseconds. A delay lower than 20 milliseconds is not recommended.<br/>
             * Note: Timer frequency is limited to 60 frames per second, meaning a delay lower than 16.6 milliseconds causes runtime problems.
             * @version Egret 2.4
             * @platform Web,Native
             * @language en_US
             */
            /**
             * 计时器事件间的延迟（以毫秒为单位）。如果在计时器正在运行时设置延迟间隔，则计时器将按相同的 repeatCount 迭代重新启动。<br/>
             * 注意：建议 delay 不要低于 20 毫秒。计时器频率不得超过 60 帧/秒，这意味着低于 16.6 毫秒的延迟可导致出现运行时问题。
             * @version Egret 2.4
             * @platform Web,Native
             * @language zh_CN
             */
            get: function () {
                return this._delay;
            },
            set: function (value) {
                //value = +value||0;
                if (value < 1) {
                    value = 1;
                }
                if (this._delay == value) {
                    return;
                }
                this._delay = value;
                this.lastCount = this.updateInterval = Math.round(60 * value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Timer.prototype, "currentCount", {
            /**
             * The total number of times the timer has fired since it started at zero. If the timer has been reset, only the fires since the reset are counted.
             * @version Egret 2.4
             * @platform Web,Native
             * @language en_US
             */
            /**
             * 计时器从 0 开始后触发的总次数。如果已重置了计时器，则只会计入重置后的触发次数。
             * @version Egret 2.4
             * @platform Web,Native
             * @language zh_CN
             */
            get: function () {
                return this._currentCount;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Timer.prototype, "running", {
            /**
             * The timer's current state; true if the timer is running, otherwise false.
             * @version Egret 2.4
             * @platform Web,Native
             * @language en_US
             */
            /**
             * 计时器的当前状态；如果计时器正在运行，则为 true，否则为 false。
             * @version Egret 2.4
             * @platform Web,Native
             * @language zh_CN
             */
            get: function () {
                return this._running;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Stops the timer, if it is running, and sets the currentCount property back to 0, like the reset button of a stopwatch.
         * Then, when start() is called, the timer instance runs for the specified number of repetitions, as set by the repeatCount value.
         * @version Egret 2.4
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 如果计时器正在运行，则停止计时器，并将 currentCount 属性设回为 0，这类似于秒表的重置按钮。然后，在调用 start() 后，将运行计时器实例，运行次数为指定的重复次数（由 repeatCount 值设置）。
         * @version Egret 2.4
         * @platform Web,Native
         * @language zh_CN
         */
        Timer.prototype.reset = function () {
            this.stop();
            this._currentCount = 0;
        };
        /**
         * Starts the timer, if it is not already running.
         * @version Egret 2.4
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 如果计时器尚未运行，则启动计时器。
         * @version Egret 2.4
         * @platform Web,Native
         * @language zh_CN
         */
        Timer.prototype.start = function () {
            if (this._running)
                return;
            this.lastCount = this.updateInterval;
            this.lastTimeStamp = feng3d.getTimer();
            feng3d.ticker.addEventListener(feng3d.Event.ENTER_FRAME, this.$update, this);
            this._running = true;
        };
        /**
         * Stops the timer. When start() is called after stop(), the timer instance runs for the remaining number of
         * repetitions, as set by the repeatCount property.
         * @version Egret 2.4
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 停止计时器。如果在调用 stop() 后调用 start()，则将继续运行计时器实例，运行次数为剩余的 重复次数（由 repeatCount 属性设置）。
         * @version Egret 2.4
         * @platform Web,Native
         * @language zh_CN
         */
        Timer.prototype.stop = function () {
            if (!this._running)
                return;
            feng3d.ticker.removeEventListener(feng3d.Event.ENTER_FRAME, this.$update, this);
            this._running = false;
        };
        /**
         * @private
         * Ticker以60FPS频率刷新此方法
         */
        Timer.prototype.$update = function () {
            var timeStamp = feng3d.getTimer();
            var deltaTime = timeStamp - this.lastTimeStamp;
            if (deltaTime >= this._delay) {
                this.lastCount = this.updateInterval;
            }
            else {
                this.lastCount -= 1000;
                if (this.lastCount > 0) {
                    return false;
                }
                this.lastCount += this.updateInterval;
            }
            this.lastTimeStamp = timeStamp;
            this._currentCount++;
            var complete = (this.repeatCount > 0 && this._currentCount >= this.repeatCount);
            this.dispatchEvent(new feng3d.TimerEvent(feng3d.TimerEvent.TIMER));
            if (complete) {
                this.stop();
                this.dispatchEvent(new feng3d.TimerEvent(feng3d.TimerEvent.TIMER_COMPLETE));
            }
            return false;
        };
        return Timer;
    }(feng3d.EventDispatcher));
    feng3d.Timer = Timer;
})(feng3d || (feng3d = {}));
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var feng3d;
(function (feng3d) {
    /**
     * A Timer object dispatches a TimerEvent objects whenever the Timer object reaches the interval specified by the Timer.delay property.
     * @see egret.Timer
     * @version Egret 2.4
     * @platform Web,Native
     * @includeExample egret/events/TimerEvent.ts
     * @language en_US
     */
    /**
     * 每当 Timer 对象达到由 Timer.delay 属性指定的间隔时，Timer 对象即会调度 TimerEvent 对象。
     * @see egret.Timer
     * @version Egret 2.4
     * @platform Web,Native
     * @includeExample egret/events/TimerEvent.ts
     * @language zh_CN
     */
    var TimerEvent = (function (_super) {
        __extends(TimerEvent, _super);
        /**
         * Creates an Event object with specific information relevant to timer events.
         * @param type The type of the event. Event listeners can access this information through the inherited type property.
         * @param bubbles Determines whether the Event object bubbles. Event listeners can access this information through
         * the inherited bubbles property.
         * @param cancelable Determines whether the Event object can be canceled. Event listeners can access this information
         * through the inherited cancelable property.
         * @version Egret 2.4
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 创建一个 Event 对象，其中包含有关 timer 事件的特定信息。
         * @param type 事件的类型。事件侦听器可以通过继承的 type 属性访问此信息。
         * @param bubbles 确定 Event 对象是否冒泡。事件侦听器可以通过继承的 bubbles 属性访问此信息。
         * @param cancelable 确定是否可以取消 Event 对象。事件侦听器可以通过继承的 cancelable 属性访问此信息。
         * @version Egret 2.4
         * @platform Web,Native
         * @language zh_CN
         */
        function TimerEvent(type, data, bubbles) {
            if (data === void 0) { data = null; }
            return _super.call(this, type, data, bubbles) || this;
        }
        return TimerEvent;
    }(feng3d.Event));
    /**
     * Dispatched whenever a Timer object reaches an interval specified according to the Timer.delay property.
     * @version Egret 2.4
     * @platform Web,Native
     * @language en_US
     */
    /**
     * 每当 Timer 对象达到根据 Timer.delay 属性指定的间隔时调度。
     * @version Egret 2.4
     * @platform Web,Native
     * @language zh_CN
     */
    TimerEvent.TIMER = "timer";
    /**
     * Dispatched whenever it has completed the number of requests set by Timer.repeatCount.
     * @version Egret 2.4
     * @platform Web,Native
     * @language en_US
     */
    /**
     * 每当它完成 Timer.repeatCount 设置的请求数后调度。
     * @version Egret 2.4
     * @platform Web,Native
     * @language zh_CN
     */
    TimerEvent.TIMER_COMPLETE = "timerComplete";
    feng3d.TimerEvent = TimerEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 鼠标键盘输入，处理js事件中this关键字问题
     * @author feng 2016-12-19
     */
    var Input = (function (_super) {
        __extends(Input, _super);
        function Input() {
            var _this = _super.call(this) || this;
            _this.clientX = 0;
            _this.clientY = 0;
            var mouseKeyType = [
                "click", "dblclick",
                "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "mousewheel",
                "keydown", "keypress", "keyup"
            ];
            for (var i = 0; i < mouseKeyType.length; i++) {
                window.addEventListener(mouseKeyType[i], _this.onMouseKey.bind(_this));
            }
            return _this;
        }
        /**
         * 键盘按下事件
         */
        Input.prototype.onMouseKey = function (event) {
            if (event["clientX"] != undefined) {
                event = event;
                this.clientX = event.clientX;
                this.clientY = event.clientY;
            }
            this.dispatchEvent(new InputEvent(event, this, true));
        };
        /**
         *
         */
        Input.prototype.addEventListener = function (type, listener, thisObject, priority) {
            if (priority === void 0) { priority = 0; }
            _super.prototype.addEventListener.call(this, type, listener, thisObject, priority);
        };
        return Input;
    }(feng3d.EventDispatcher));
    feng3d.Input = Input;
    var InputEventType = (function () {
        function InputEventType() {
            /** 鼠标双击 */
            this.DOUBLE_CLICK = "dblclick";
            /** 鼠标单击 */
            this.CLICK = "click";
            /** 鼠标按下 */
            this.MOUSE_DOWN = "mousedown";
            /** 鼠标弹起 */
            this.MOUSE_UP = "mouseup";
            /** 鼠标中键单击 */
            this.MIDDLE_CLICK = "middleclick";
            /** 鼠标中键按下 */
            this.MIDDLE_MOUSE_DOWN = "middlemousedown";
            /** 鼠标中键弹起 */
            this.MIDDLE_MOUSE_UP = "middlemouseup";
            /** 鼠标右键单击 */
            this.RIGHT_CLICK = "rightclick";
            /** 鼠标右键按下 */
            this.RIGHT_MOUSE_DOWN = "rightmousedown";
            /** 鼠标右键弹起 */
            this.RIGHT_MOUSE_UP = "rightmouseup";
            /** 鼠标移动 */
            this.MOUSE_MOVE = "mousemove";
            /** 鼠标移出 */
            this.MOUSE_OUT = "mouseout";
            /** 鼠标移入 */
            this.MOUSE_OVER = "mouseover";
            /** 鼠标滚动滚轮 */
            this.MOUSE_WHEEL = "mousewheel";
            /** 键盘按下 */
            this.KEY_DOWN = "keydown";
            /** 键盘按着 */
            this.KEY_PRESS = "keypress";
            /** 键盘弹起 */
            this.KEY_UP = "keyup";
        }
        return InputEventType;
    }());
    feng3d.InputEventType = InputEventType;
    var InputEvent = (function (_super) {
        __extends(InputEvent, _super);
        function InputEvent(event, data, bubbles) {
            if (data === void 0) { data = null; }
            if (bubbles === void 0) { bubbles = true; }
            var _this = _super.call(this, event.type, null, true) || this;
            if (event["clientX"] != undefined) {
                var mouseEvent = event;
                _this.clientX = mouseEvent.clientX;
                _this.clientY = mouseEvent.clientY;
                if (["click", "mousedown", "mouseup"].indexOf(mouseEvent.type) != -1) {
                    _this["_type"] = ["", "middle", "right"][mouseEvent.button] + mouseEvent.type;
                }
            }
            if (event["keyCode"] != undefined) {
                var keyboardEvent = event;
                _this.keyCode = keyboardEvent.keyCode;
            }
            if (event["wheelDelta"] != undefined) {
                var wheelEvent = event;
                _this.wheelDelta = wheelEvent.wheelDelta;
            }
            return _this;
        }
        return InputEvent;
    }(feng3d.Event));
    feng3d.InputEvent = InputEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 按键捕获
     * @author feng 2016-4-26
     */
    var KeyCapture = (function () {
        /**
         * 构建
         * @param stage		舞台
         */
        function KeyCapture(shortCut) {
            /**
             * 捕获的按键字典
             */
            this._mouseKeyDic = {};
            this._keyState = shortCut.keyState;
            //
            feng3d.input.addEventListener(feng3d.inputType.KEY_DOWN, this.onKeydown, this);
            feng3d.input.addEventListener(feng3d.inputType.KEY_UP, this.onKeyup, this);
            this._boardKeyDic = {};
            this.defaultSupportKeys();
            //监听鼠标事件
            var mouseEvents = [
                feng3d.inputType.DOUBLE_CLICK,
                feng3d.inputType.CLICK,
                feng3d.inputType.MOUSE_DOWN,
                feng3d.inputType.MOUSE_UP,
                feng3d.inputType.MIDDLE_CLICK,
                feng3d.inputType.MIDDLE_MOUSE_DOWN,
                feng3d.inputType.MIDDLE_MOUSE_UP,
                feng3d.inputType.RIGHT_CLICK,
                feng3d.inputType.RIGHT_MOUSE_DOWN,
                feng3d.inputType.RIGHT_MOUSE_UP,
                feng3d.inputType.MOUSE_MOVE,
                feng3d.inputType.MOUSE_OVER,
                feng3d.inputType.MOUSE_OUT,
            ];
            for (var i = 0; i < mouseEvents.length; i++) {
                feng3d.input.addEventListener(mouseEvents[i], this.onMouseOnce, this);
            }
            feng3d.input.addEventListener(feng3d.inputType.MOUSE_WHEEL, this.onMousewheel, this);
        }
        /**
         * 默认支持按键
         */
        KeyCapture.prototype.defaultSupportKeys = function () {
            this._boardKeyDic[17] = "ctrl";
            this._boardKeyDic[16] = "shift";
            this._boardKeyDic[32] = "escape";
            this._boardKeyDic[18] = "alt";
            this._boardKeyDic[46] = "del";
        };
        /**
         * 鼠标事件
         */
        KeyCapture.prototype.onMouseOnce = function (event) {
            var mouseKey = event.type;
            this._keyState.pressKey(mouseKey, event);
            this._keyState.releaseKey(mouseKey, event);
        };
        /**
         * 鼠标事件
         */
        KeyCapture.prototype.onMousewheel = function (event) {
            var mouseKey = event.type;
            this._keyState.pressKey(mouseKey, event);
            this._keyState.releaseKey(mouseKey, event);
        };
        /**
         * 键盘按下事件
         */
        KeyCapture.prototype.onKeydown = function (event) {
            var boardKey = this.getBoardKey(event.keyCode);
            if (boardKey != null)
                this._keyState.pressKey(boardKey, event);
        };
        /**
         * 键盘弹起事件
         */
        KeyCapture.prototype.onKeyup = function (event) {
            var boardKey = this.getBoardKey(event.keyCode);
            if (boardKey)
                this._keyState.releaseKey(boardKey, event);
        };
        /**
         * 获取键盘按键名称
         */
        KeyCapture.prototype.getBoardKey = function (keyCode) {
            var boardKey = this._boardKeyDic[keyCode];
            if (boardKey == null && 65 <= keyCode && keyCode <= 90) {
                boardKey = String.fromCharCode(keyCode).toLocaleLowerCase();
            }
            return boardKey;
        };
        return KeyCapture;
    }());
    feng3d.KeyCapture = KeyCapture;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 按键状态
     * @author feng 2016-4-26
     */
    var KeyState = (function (_super) {
        __extends(KeyState, _super);
        /**
         * 构建
         */
        function KeyState() {
            var _this = _super.call(this) || this;
            _this._keyStateDic = {};
            return _this;
        }
        /**
         * 按下键
         * @param key 	键名称
         * @param data	携带数据
         */
        KeyState.prototype.pressKey = function (key, data) {
            this._keyStateDic[key] = true;
            this.dispatchEvent(new feng3d.ShortCutEvent(key, data));
        };
        /**
         * 释放键
         * @param key	键名称
         * @param data	携带数据
         */
        KeyState.prototype.releaseKey = function (key, data) {
            this._keyStateDic[key] = false;
            this.dispatchEvent(new feng3d.ShortCutEvent(key, data));
        };
        /**
         * 获取按键状态
         * @param key 按键名称
         */
        KeyState.prototype.getKeyState = function (key) {
            return !!this._keyStateDic[key];
        };
        return KeyState;
    }(feng3d.EventDispatcher));
    feng3d.KeyState = KeyState;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 快捷键捕获
     * @author feng 2016-4-26
     */
    var ShortCutCapture = (function () {
        /**
         * 构建快捷键捕获
         * @param shortCut				快捷键环境
         * @param key					快捷键；用“+”连接多个按键，“!”表示没按下某键；例如 “a+!b”表示按下“a”与没按下“b”时触发。
         * @param command				要执行的command的id；使用“,”连接触发多个命令；例如 “commandA,commandB”表示满足触发条件后依次执行commandA与commandB命令。
         * @param stateCommand			要执行的状态命令id；使用“,”连接触发多个状态命令，没带“!”表示激活该状态，否则表示使其处于非激活状态；例如 “stateA,!stateB”表示满足触发条件后激活状态“stateA，使“stateB处于非激活状态。
         * @param when					快捷键激活的条件；使用“+”连接多个状态，没带“!”表示需要处于激活状态，否则需要处于非激活状态； 例如 “stateA+!stateB”表示stateA处于激活状态且stateB处于非激活状态时会判断按键是否满足条件。
         */
        function ShortCutCapture(shortCut, key, command, stateCommand, when) {
            if (command === void 0) { command = null; }
            if (stateCommand === void 0) { stateCommand = null; }
            if (when === void 0) { when = null; }
            this._shortCut = shortCut;
            this._keyState = shortCut.keyState;
            this._key = key;
            this._command = command;
            this._stateCommand = stateCommand;
            this._when = when;
            this._keys = this.getKeys(key);
            this._states = this.getStates(when);
            this._commands = this.getCommands(command);
            this._stateCommands = this.getStateCommand(stateCommand);
            this.init();
        }
        /**
         * 初始化
         */
        ShortCutCapture.prototype.init = function () {
            for (var i = 0; i < this._keys.length; i++) {
                this._keyState.addEventListener(this._keys[i].key, this.onCapture, this);
            }
        };
        /**
         * 处理捕获事件
         */
        ShortCutCapture.prototype.onCapture = function (event) {
            var inWhen = this.checkActivityStates(this._states);
            var pressKeys = this.checkActivityKeys(this._keys);
            if (pressKeys && inWhen) {
                this.dispatchCommands(this._commands, event.data);
                this.executeStateCommands(this._stateCommands);
            }
        };
        /**
         * 派发命令
         */
        ShortCutCapture.prototype.dispatchCommands = function (commands, data) {
            for (var i = 0; i < commands.length; i++) {
                this._shortCut.dispatchEvent(new feng3d.ShortCutEvent(commands[i], data));
            }
        };
        /**
         * 执行状态命令
         */
        ShortCutCapture.prototype.executeStateCommands = function (stateCommands) {
            for (var i = 0; i < stateCommands.length; i++) {
                var stateCommand = stateCommands[i];
                if (stateCommand.not)
                    this._shortCut.deactivityState(stateCommand.state);
                else
                    this._shortCut.activityState(stateCommand.state);
            }
        };
        /**
         * 检测快捷键是否处于活跃状态
         */
        ShortCutCapture.prototype.checkActivityStates = function (states) {
            for (var i = 0; i < states.length; i++) {
                if (!this.getState(states[i]))
                    return false;
            }
            return true;
        };
        /**
         * 获取是否处于指定状态中（支持一个！取反）
         * @param state 状态名称
         */
        ShortCutCapture.prototype.getState = function (state) {
            var result = this._shortCut.getState(state.state);
            if (state.not) {
                result = !result;
            }
            return result;
        };
        /**
         * 检测是否按下给出的键
         * @param keys 按键数组
         */
        ShortCutCapture.prototype.checkActivityKeys = function (keys) {
            for (var i = 0; i < keys.length; i++) {
                if (!this.getKeyValue(keys[i]))
                    return false;
            }
            return true;
        };
        /**
         * 获取按键状态（true：按下状态，false：弹起状态）
         */
        ShortCutCapture.prototype.getKeyValue = function (key) {
            var value = this._keyState.getKeyState(key.key);
            if (key.not) {
                value = !value;
            }
            return value;
        };
        /**
         * 获取状态列表
         * @param when		状态字符串
         */
        ShortCutCapture.prototype.getStates = function (when) {
            var states = [];
            if (when == null)
                return states;
            var state = when.trim();
            if (state.length == 0) {
                return states;
            }
            var stateStrs = state.split("+");
            for (var i = 0; i < stateStrs.length; i++) {
                states.push(new State(stateStrs[i]));
            }
            return states;
        };
        /**
         * 获取键列表
         * @param key		快捷键
         */
        ShortCutCapture.prototype.getKeys = function (key) {
            var keyStrs = key.split("+");
            var keys = [];
            for (var i = 0; i < keyStrs.length; i++) {
                keys.push(new Key(keyStrs[i]));
            }
            return keys;
        };
        /**
         * 获取命令列表
         * @param command	命令
         */
        ShortCutCapture.prototype.getCommands = function (command) {
            var commands = [];
            if (command == null)
                return commands;
            command = command.trim();
            var commandStrs = command.split(",");
            for (var i = 0; i < commandStrs.length; i++) {
                var commandStr = commandStrs[i].trim();
                if (commandStr.length > 0) {
                    commands.push(commandStr);
                }
            }
            return commands;
        };
        /**
         * 获取状态命令列表
         * @param stateCommand	状态命令
         */
        ShortCutCapture.prototype.getStateCommand = function (stateCommand) {
            var stateCommands = [];
            if (stateCommand == null)
                return stateCommands;
            stateCommand = stateCommand.trim();
            var stateCommandStrs = stateCommand.split(",");
            for (var i = 0; i < stateCommandStrs.length; i++) {
                var commandStr = stateCommandStrs[i].trim();
                if (commandStr.length > 0) {
                    stateCommands.push(new StateCommand(commandStr));
                }
            }
            return stateCommands;
        };
        /**
         * 销毁
         */
        ShortCutCapture.prototype.destroy = function () {
            for (var i = 0; i < this._keys.length; i++) {
                this._keyState.removeEventListener(this._keys[i].key, this.onCapture, this);
            }
            this._shortCut = null;
            this._keys = null;
            this._states = null;
        };
        return ShortCutCapture;
    }());
    feng3d.ShortCutCapture = ShortCutCapture;
})(feng3d || (feng3d = {}));
/**
 * 按键
 * @author feng 2016-6-6
 */
var Key = (function () {
    function Key(key) {
        key = key.trim();
        if (key.charAt(0) == "!") {
            this.not = true;
            key = key.substr(1).trim();
        }
        this.key = key;
    }
    return Key;
}());
/**
 * 状态
 * @author feng 2016-6-6
 */
var State = (function () {
    function State(state) {
        state = state.trim();
        if (state.charAt(0) == "!") {
            this.not = true;
            state = state.substr(1).trim();
        }
        this.state = state;
    }
    return State;
}());
/**
 * 状态命令
 * @author feng 2016-6-6
 */
var StateCommand = (function () {
    function StateCommand(state) {
        state = state.trim();
        if (state.charAt(0) == "!") {
            this.not = true;
            state = state.substr(1).trim();
        }
        this.state = state;
    }
    return StateCommand;
}());
var feng3d;
(function (feng3d) {
    /**
     * 快捷键命令事件
     * @author feng 2016-4-27
     */
    var ShortCutEvent = (function (_super) {
        __extends(ShortCutEvent, _super);
        /**
         * 构建
         * @param command		命令名称
         */
        function ShortCutEvent(command, data) {
            return _super.call(this, command, data) || this;
        }
        return ShortCutEvent;
    }(feng3d.Event));
    feng3d.ShortCutEvent = ShortCutEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 初始化快捷键模块
     * @author feng 2016-4-26
     *
     * <pre>
var shortcuts:Array = [ //
//在按下key1时触发命令command1
    {key: "key1", command: "command1", when: ""}, //
     //在按下key1时触发状态命令改变stateCommand1为激活状态
    {key: "key1", stateCommand: "stateCommand1", when: "state1"}, //
     //处于state1状态时按下key1触发命令command1
    {key: "key1", command: "command1", when: "state1"}, //
    //处于state1状态不处于state2时按下key1与没按下key2触发command1与command2，改变stateCommand1为激活状态，stateCommand2为非激活状态
    {key: "key1+ ! key2", command: "command1,command2", stateCommand: "stateCommand1,!stateCommand2", when: "state1+!state2"}, //
    ];
//添加快捷键
shortCut.addShortCuts(shortcuts);
//监听命令
shortCut.addEventListener("run", function(e:Event):void
{
    trace("接受到命令：" + e.type);
});
     * </pre>
     */
    var ShortCut = (function (_super) {
        __extends(ShortCut, _super);
        /**
         * 初始化快捷键模块
         */
        function ShortCut() {
            var _this = _super.call(this) || this;
            _this.keyState = new feng3d.KeyState();
            _this.keyCapture = new feng3d.KeyCapture(_this);
            _this.captureDic = {};
            _this.stateDic = {};
            return _this;
        }
        /**
         * 添加快捷键
         * @param shortcuts		快捷键列表
         */
        ShortCut.prototype.addShortCuts = function (shortcuts) {
            for (var i = 0; i < shortcuts.length; i++) {
                var shortcut = shortcuts[i];
                var shortcutUniqueKey = this.getShortcutUniqueKey(shortcut);
                this.captureDic[shortcutUniqueKey] = this.captureDic[shortcutUniqueKey] || new feng3d.ShortCutCapture(this, shortcut.key, shortcut.command, shortcut.stateCommand, shortcut.when);
            }
        };
        /**
         * 删除快捷键
         * @param shortcuts		快捷键列表
         */
        ShortCut.prototype.removeShortCuts = function (shortcuts) {
            for (var i = 0; i < shortcuts.length; i++) {
                var shortcutUniqueKey = this.getShortcutUniqueKey(shortcuts[i]);
                var shortCutCapture = this.captureDic[shortcutUniqueKey];
                if (feng3d.ShortCutCapture != null) {
                    shortCutCapture.destroy();
                }
                delete this.captureDic[shortcutUniqueKey];
            }
        };
        /**
         * 移除所有快捷键
         */
        ShortCut.prototype.removeAllShortCuts = function () {
            var _this = this;
            var keys = [];
            var key;
            for (key in this.captureDic) {
                keys.push(key);
            }
            keys.forEach(function (key) {
                var shortCutCapture = _this.captureDic[key];
                shortCutCapture.destroy();
                delete _this.captureDic[key];
            });
        };
        /**
         * 激活状态
         * @param state 状态名称
         */
        ShortCut.prototype.activityState = function (state) {
            this.stateDic[state] = true;
        };
        /**
         * 取消激活状态
         * @param state 状态名称
         */
        ShortCut.prototype.deactivityState = function (state) {
            delete this.stateDic[state];
        };
        /**
         * 获取状态
         * @param state 状态名称
         */
        ShortCut.prototype.getState = function (state) {
            return !!this.stateDic[state];
        };
        /**
         * 获取快捷键唯一字符串
         */
        ShortCut.prototype.getShortcutUniqueKey = function (shortcut) {
            return shortcut.key + "," + shortcut.command + "," + shortcut.when;
        };
        return ShortCut;
    }(feng3d.EventDispatcher));
    feng3d.ShortCut = ShortCut;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 加载类
     * @author feng 2016-12-14
     */
    var Loader = (function (_super) {
        __extends(Loader, _super);
        function Loader() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * 加载资源
         * @param url   路径
         */
        Loader.prototype.load = function (url) {
            this._url = url;
        };
        /**
         * 加载文本
         * @param url   路径
         */
        Loader.prototype.loadText = function (url) {
            this._url = url;
            this.dataFormat = feng3d.LoaderDataFormat.TEXT;
            this.xmlHttpRequestLoad();
        };
        /**
         * 加载二进制
         * @param url   路径
         */
        Loader.prototype.loadBinary = function (url) {
            this._url = url;
            this.dataFormat = feng3d.LoaderDataFormat.BINARY;
            this.xmlHttpRequestLoad();
        };
        /**
         * 加载图片
         * @param url   路径
         */
        Loader.prototype.loadImage = function (url) {
            this.dataFormat = feng3d.LoaderDataFormat.IMAGE;
            this._image = new Image();
            this._image.crossOrigin = "Anonymous";
            this._image.onload = this.onImageLoad.bind(this);
            this._image.onerror = this.onImageError.bind(this);
            this._image.src = url;
        };
        /**
         * 使用XMLHttpRequest加载
         */
        Loader.prototype.xmlHttpRequestLoad = function () {
            this._request = new XMLHttpRequest();
            this._request.open('Get', this._url, true);
            this._request.responseType = this.dataFormat == feng3d.LoaderDataFormat.BINARY ? "arraybuffer" : "";
            this._request.onreadystatechange = this.onRequestReadystatechange.bind(this);
            this._request.onprogress = this.onRequestProgress.bind(this);
            this._request.send();
        };
        /**
         * 请求进度回调
         */
        Loader.prototype.onRequestProgress = function (event) {
            this.bytesLoaded = event.loaded;
            this.bytesTotal = event.total;
            this.dispatchEvent(new feng3d.LoaderEvent(feng3d.LoaderEvent.PROGRESS, this));
        };
        /**
         * 请求状态变化回调
         */
        Loader.prototype.onRequestReadystatechange = function (ev) {
            if (this._request.readyState == 4) {
                this._request.onreadystatechange = null;
                if (this._request.status >= 200 && this._request.status < 300) {
                    this.content = this.dataFormat == feng3d.LoaderDataFormat.TEXT ? this._request.responseText : this._request.response;
                    this.dispatchEvent(new feng3d.LoaderEvent(feng3d.LoaderEvent.COMPLETE, this));
                }
                else {
                    if (!this.hasEventListener(feng3d.LoaderEvent.ERROR)) {
                        throw new Error("Error status: " + this._request + " - Unable to load " + this._url);
                    }
                    this.dispatchEvent(new feng3d.LoaderEvent(feng3d.LoaderEvent.ERROR, this));
                }
            }
        };
        /**
         * 加载图片完成回调
         */
        Loader.prototype.onImageLoad = function (event) {
            this.content = this._image;
            this.dispatchEvent(new feng3d.LoaderEvent(feng3d.LoaderEvent.COMPLETE, this));
        };
        /**
         * 加载图片出错回调
         */
        Loader.prototype.onImageError = function (event) {
            feng3d.debuger && console.error("Error while trying to load texture: " + this._url);
            //
            this._image.src = "data:image/jpg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QBmRXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAAExAAIAAAAQAAAATgAAAAAAAABgAAAAAQAAAGAAAAABcGFpbnQubmV0IDQuMC41AP/bAEMABAIDAwMCBAMDAwQEBAQFCQYFBQUFCwgIBgkNCw0NDQsMDA4QFBEODxMPDAwSGBITFRYXFxcOERkbGRYaFBYXFv/bAEMBBAQEBQUFCgYGChYPDA8WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFv/AABEIAQABAAMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APH6KKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76CiiigD5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BQooooA+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/voKKKKAPl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76CiiigD5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BQooooA+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/voKKKKAPl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76P//Z";
            //
            this.onImageLoad(null);
            this.dispatchEvent(new feng3d.LoaderEvent(feng3d.LoaderEvent.ERROR, this));
        };
        return Loader;
    }(feng3d.EventDispatcher));
    feng3d.Loader = Loader;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 加载事件
     * @author feng 2016-12-14
     */
    var LoaderEvent = (function (_super) {
        __extends(LoaderEvent, _super);
        function LoaderEvent() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return LoaderEvent;
    }(feng3d.Event));
    /**
     * 加载进度发生改变时调度。
     */
    LoaderEvent.PROGRESS = "progress";
    /**
     * 加载完成后调度。
     */
    LoaderEvent.COMPLETE = "complete";
    /**
     * 加载出错时调度。
     */
    LoaderEvent.ERROR = "error";
    feng3d.LoaderEvent = LoaderEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 加载数据类型
     * @author feng 2016-12-14
     */
    var LoaderDataFormat = (function () {
        function LoaderDataFormat() {
        }
        return LoaderDataFormat;
    }());
    /**
     * 以原始二进制数据形式接收下载的数据。
     */
    LoaderDataFormat.BINARY = "binary";
    /**
     * 以文本形式接收已下载的数据。
     */
    LoaderDataFormat.TEXT = "text";
    /**
     * 图片数据
     */
    LoaderDataFormat.IMAGE = "image";
    feng3d.LoaderDataFormat = LoaderDataFormat;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    feng3d.GL = WebGL2RenderingContext || WebGLRenderingContext;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var GLProxy = (function () {
        function GLProxy(canvas, options) {
            if (options === void 0) { options = null; }
            options = options || {};
            options.preferWebGl2 = false;
            var gl = this.getWebGLContext(canvas, options);
            //
            Object.defineProperty(this, "gl", { value: gl });
            Object.defineProperty(gl, "proxy", { value: this });
            Object.defineProperty(gl, "uuid", { value: Math.generateUUID() });
            Object.defineProperty(gl, "webgl2", { value: !!gl.drawArraysInstanced });
            gl.programs = {};
            //
            new feng3d.GLExtension(gl);
        }
        /**
         * Initialize and get the rendering for WebGL
         * @param canvas <cavnas> element
         * @param opt_debug flag to initialize the context for debugging
         * @return the rendering context for WebGL
         */
        GLProxy.prototype.getWebGLContext = function (canvas, options) {
            if (options === void 0) { options = null; }
            var preferWebGl2 = (options && options.preferWebGl2 !== undefined) ? options.preferWebGl2 : true;
            var names = preferWebGl2 ? ["webgl2", "experimental-webgl2", "webgl", "experimental-webgl"] : ["webgl", "experimental-webgl"];
            var gl = null;
            for (var i = 0; i < names.length; ++i) {
                try {
                    gl = canvas.getContext(names[i], options);
                }
                catch (e) { }
                if (gl) {
                    break;
                }
            }
            if (!gl) {
                throw "无法初始化WEBGL";
            }
            return gl;
        };
        return GLProxy;
    }());
    feng3d.GLProxy = GLProxy;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * GL扩展
     */
    var GLExtension = (function () {
        function GLExtension(gl) {
            this.supportIphone(gl);
            this.cacheGLQuery(gl);
            this.extensionWebGL(gl);
            new feng3d.GLProgramExtension(gl);
        }
        /**
         * 在iphone中WebGLRenderingContext中静态变量值值未定义，因此此处初始化来支持iphone
         * @param gl WebGL对象
         */
        GLExtension.prototype.supportIphone = function (gl) {
            for (var key in gl) {
                var element = gl[key];
                if (typeof element == "number" && feng3d.GL[key] == undefined) {
                    feng3d.GL[key] = element;
                }
            }
        };
        /**
         * 扩展GL
         * @param gl GL实例
         */
        GLExtension.prototype.extensionWebGL = function (gl) {
            //
            gl.anisotropicExt =
                gl.getExtension('EXT_texture_filter_anisotropic')
                    || gl.getExtension('MOZ_EXT_texture_filter_anisotropic')
                    || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
            gl.maxAnisotropy = gl.getParameter(gl.anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            if (!gl.webgl2) {
                var ext = gl.getExtension('OES_standard_derivatives');
                var ext1 = gl.getExtension('EXT_shader_texture_lod');
                gl.vertexAttribDivisor = function (index, divisor) {
                    var _ext = gl.getExtension('ANGLE_instanced_arrays');
                    _ext.vertexAttribDivisorANGLE(index, divisor);
                };
                gl.drawElementsInstanced = function (mode, count, type, offset, instanceCount) {
                    var _ext = gl.getExtension('ANGLE_instanced_arrays');
                    _ext.drawElementsInstancedANGLE(mode, count, type, offset, instanceCount);
                };
            }
        };
        /**
         * 缓存GL查询
         * @param gl GL实例
         */
        GLExtension.prototype.cacheGLQuery = function (gl) {
            var extensions = {};
            var oldGetExtension = gl.getExtension;
            gl.getExtension = function (name) {
                extensions[name] = extensions[name] || oldGetExtension.apply(gl, arguments);
                return extensions[name];
            };
            //
            var oldGetParameter = gl.getParameter;
            var parameters = {};
            gl.getParameter = function (pname) {
                parameters[pname] = parameters[pname] || oldGetParameter.apply(gl, arguments);
                return parameters[pname];
            };
        };
        return GLExtension;
    }());
    feng3d.GLExtension = GLExtension;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var GLProgramExtension = (function () {
        function GLProgramExtension(gl) {
            var oldCreateProgram = gl.createProgram;
            gl.createProgram = function () {
                if (arguments.length == 2) {
                    return createProgram(gl, arguments[0], arguments[1]);
                }
                var webGLProgram = oldCreateProgram.apply(gl, arguments);
                webGLProgram.destroy = function () {
                    gl.deleteProgram(webGLProgram);
                    gl.deleteShader(webGLProgram.fragmentShader);
                    gl.deleteShader(webGLProgram.vertexShader);
                };
                return webGLProgram;
            };
        }
        return GLProgramExtension;
    }());
    feng3d.GLProgramExtension = GLProgramExtension;
    /**
     * Create the linked program object
     * @param gl GL context
     * @param vshader a vertex shader program (string)
     * @param fshader a fragment shader program (string)
     * @return created program object, or null if the creation has failed
     */
    function createProgram(gl, vshader, fshader) {
        // Create shader object
        var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
        var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
        if (!vertexShader || !fragmentShader) {
            return null;
        }
        // Create a program object
        var program = gl.createProgram();
        if (!program) {
            return null;
        }
        // Attach the shader objects
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        // Link the program object
        gl.linkProgram(program);
        // Check the result of linking
        var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
            var error = gl.getProgramInfoLog(program);
            feng3d.debuger && alert('Failed to link program: ' + error);
            gl.deleteProgram(program);
            gl.deleteShader(fragmentShader);
            gl.deleteShader(vertexShader);
            return null;
        }
        program.gl = gl;
        program.vertexShader = vertexShader;
        program.fragmentShader = fragmentShader;
        initProgram(program);
        return program;
    }
    /**
     * 初始化渲染程序
     * @param shaderProgram WebGL渲染程序
     */
    function initProgram(shaderProgram) {
        var gl = shaderProgram.gl;
        //获取属性信息
        var numAttributes = gl.getProgramParameter(shaderProgram, gl.ACTIVE_ATTRIBUTES);
        shaderProgram.attributes = [];
        var i = 0;
        while (i < numAttributes) {
            var activeInfo = gl.getActiveAttrib(shaderProgram, i++);
            activeInfo.location = gl.getAttribLocation(shaderProgram, activeInfo.name);
            shaderProgram.attributes.push(activeInfo);
        }
        //获取uniform信息
        var numUniforms = gl.getProgramParameter(shaderProgram, gl.ACTIVE_UNIFORMS);
        shaderProgram.uniforms = [];
        var i = 0;
        var textureID = 0;
        while (i < numUniforms) {
            var activeInfo = gl.getActiveUniform(shaderProgram, i++);
            if (activeInfo.name.indexOf("[") != -1) {
                //处理数组
                var baseName = activeInfo.name.substring(0, activeInfo.name.indexOf("["));
                activeInfo.uniformBaseName = baseName;
                var uniformLocation = activeInfo.uniformLocation = [];
                for (var j = 0; j < activeInfo.size; j++) {
                    var location = gl.getUniformLocation(shaderProgram, baseName + ("[" + j + "]"));
                    uniformLocation.push(location);
                }
            }
            else {
                activeInfo.uniformLocation = gl.getUniformLocation(shaderProgram, activeInfo.name);
            }
            if (activeInfo.type == feng3d.GL.SAMPLER_2D || activeInfo.type == feng3d.GL.SAMPLER_CUBE) {
                activeInfo.textureID = textureID;
                textureID++;
            }
            shaderProgram.uniforms.push(activeInfo);
        }
    }
    /**
     * Create a shader object
     * @param gl GL context
     * @param type the type of the shader object to be created
     * @param source shader program (string)
     * @return created shader object, or null if the creation has failed.
     */
    function loadShader(gl, type, source) {
        // Create shader object
        var shader = gl.createShader(type);
        if (shader == null) {
            feng3d.debuger && alert('unable to create shader');
            return null;
        }
        // Set the shader program
        gl.shaderSource(shader, source);
        // Compile the shader
        gl.compileShader(shader);
        // Check the result of compilation
        var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
            var error = gl.getShaderInfoLog(shader);
            feng3d.debuger && alert('Failed to compile shader: ' + error);
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染模式
     * @author feng 2016-09-28
     */
    var RenderMode = (function () {
        function RenderMode() {
        }
        return RenderMode;
    }());
    feng3d.RenderMode = RenderMode;
    (feng3d.initFunctions || (feng3d.initFunctions = [])).push(function () {
        RenderMode.POINTS = feng3d.GL.POINTS;
        RenderMode.LINE_LOOP = feng3d.GL.LINE_LOOP;
        RenderMode.LINE_STRIP = feng3d.GL.LINE_STRIP;
        RenderMode.LINES = feng3d.GL.LINES;
        RenderMode.TRIANGLES = feng3d.GL.TRIANGLES;
        RenderMode.TRIANGLE_STRIP = feng3d.GL.TRIANGLE_STRIP;
        RenderMode.TRIANGLE_FAN = feng3d.GL.TRIANGLE_FAN;
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 混合因子（R分量系数，G分量系数，B分量系数）
     */
    var BlendFactor = (function () {
        function BlendFactor() {
        }
        return BlendFactor;
    }());
    feng3d.BlendFactor = BlendFactor;
    (feng3d.initFunctions || (feng3d.initFunctions = [])).push(function () {
        BlendFactor.ZERO = feng3d.GL.ZERO;
        BlendFactor.ONE = feng3d.GL.ONE;
        BlendFactor.SRC_COLOR = feng3d.GL.SRC_COLOR;
        BlendFactor.ONE_MINUS_SRC_COLOR = feng3d.GL.ONE_MINUS_SRC_COLOR;
        BlendFactor.DST_COLOR = feng3d.GL.DST_COLOR;
        BlendFactor.ONE_MINUS_DST_COLOR = feng3d.GL.ONE_MINUS_DST_COLOR;
        BlendFactor.SRC_ALPHA = feng3d.GL.SRC_ALPHA;
        BlendFactor.ONE_MINUS_SRC_ALPHA = feng3d.GL.ONE_MINUS_SRC_ALPHA;
        BlendFactor.DST_ALPHA = feng3d.GL.DST_ALPHA;
        BlendFactor.ONE_MINUS_DST_ALPHA = feng3d.GL.ONE_MINUS_DST_ALPHA;
        BlendFactor.SRC_ALPHA_SATURATE = feng3d.GL.SRC_ALPHA_SATURATE;
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 混合方法
     */
    var BlendEquation = (function () {
        function BlendEquation() {
        }
        return BlendEquation;
    }());
    feng3d.BlendEquation = BlendEquation;
    (feng3d.initFunctions || (feng3d.initFunctions = [])).push(function () {
        BlendEquation.FUNC_ADD = feng3d.GL.FUNC_ADD;
        BlendEquation.FUNC_SUBTRACT = feng3d.GL.FUNC_SUBTRACT;
        BlendEquation.FUNC_REVERSE_SUBTRACT = feng3d.GL.FUNC_REVERSE_SUBTRACT;
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var TextureType = (function () {
        function TextureType() {
        }
        return TextureType;
    }());
    feng3d.TextureType = TextureType;
    (feng3d.initFunctions || (feng3d.initFunctions = [])).push(function () {
        TextureType.TEXTURE_2D = feng3d.GL.TEXTURE_2D;
        TextureType.TEXTURE_CUBE_MAP = feng3d.GL.TEXTURE_CUBE_MAP;
    });
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var RenderElement = (function (_super) {
        __extends(RenderElement, _super);
        function RenderElement() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        RenderElement.prototype.invalidate = function () {
            this.dispatchEvent(new feng3d.Event(feng3d.Event.CHANGE));
        };
        return RenderElement;
    }(feng3d.EventDispatcher));
    feng3d.RenderElement = RenderElement;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var RenderData = (function (_super) {
        __extends(RenderData, _super);
        function RenderData() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._elementMap = {};
            _this._elements = [];
            return _this;
        }
        Object.defineProperty(RenderData.prototype, "elements", {
            get: function () {
                return this._elements.concat();
            },
            enumerable: true,
            configurable: true
        });
        RenderData.prototype.createIndexBuffer = function (indices) {
            var renderData = this._elementMap["index"];
            if (!renderData) {
                this._elementMap["index"] = renderData = new feng3d.IndexRenderData();
                this.addRenderElement(renderData);
            }
            renderData.indices = indices;
            return renderData;
        };
        RenderData.prototype.createUniformData = function (name, data) {
            var renderData = this._elementMap[name];
            if (!renderData) {
                this._elementMap[name] = renderData = new feng3d.UniformData(name, data);
                this.addRenderElement(renderData);
            }
            renderData.data = data;
            return renderData;
        };
        RenderData.prototype.createAttributeRenderData = function (name, data, size, divisor) {
            if (data === void 0) { data = null; }
            if (size === void 0) { size = 3; }
            if (divisor === void 0) { divisor = 0; }
            var renderData = this._elementMap[name];
            if (!renderData) {
                this._elementMap[name] = renderData = new feng3d.AttributeRenderData(name, data, size, divisor);
                this.addRenderElement(renderData);
            }
            renderData.data = data;
            renderData.size = size;
            renderData.divisor = divisor;
            return renderData;
        };
        RenderData.prototype.createShaderCode = function (code) {
            var renderData = this._elementMap["shader"];
            if (!renderData) {
                this._elementMap["shader"] = renderData = new feng3d.ShaderCode(code);
                this.addRenderElement(renderData);
            }
            renderData.code = code;
            return renderData;
        };
        RenderData.prototype.createValueMacro = function (name, value) {
            var renderData = this._elementMap[name];
            if (!renderData) {
                this._elementMap[name] = renderData = new feng3d.ValueMacro(name, value);
                this.addRenderElement(renderData);
            }
            renderData.value = value;
            return renderData;
        };
        RenderData.prototype.createBoolMacro = function (name, value) {
            var renderData = this._elementMap[name];
            if (!renderData) {
                this._elementMap[name] = renderData = new feng3d.BoolMacro(name, value);
                this.addRenderElement(renderData);
            }
            renderData.value = value;
            return renderData;
        };
        RenderData.prototype.createAddMacro = function (name, value) {
            var renderData = this._elementMap[name];
            if (!renderData) {
                this._elementMap[name] = renderData = new feng3d.AddMacro(name, value);
                this.addRenderElement(renderData);
            }
            renderData.value = value;
            return renderData;
        };
        RenderData.prototype.createInstanceCount = function (value) {
            var renderData = this._elementMap["instanceCount"];
            if (!renderData) {
                this._elementMap["instanceCount"] = renderData = new feng3d.RenderInstanceCount();
                this.addRenderElement(renderData);
            }
            renderData.data = value;
            return renderData;
        };
        RenderData.prototype.createShaderParam = function (name, value) {
            var renderData = this._elementMap[name];
            if (!renderData) {
                this._elementMap["instanceCount"] = renderData = new feng3d.ShaderParam(name);
                this.addRenderElement(renderData);
            }
            renderData.value = value;
            return renderData;
        };
        RenderData.prototype.addRenderElement = function (element) {
            if (element instanceof feng3d.RenderElement) {
                this._elements.push(element);
                this.dispatchEvent(new feng3d.Event(feng3d.Object3DRenderAtomic.ADD_RENDERELEMENT, element));
            }
            else {
                for (var i = 0; i < element.length; i++) {
                    this.addRenderElement(element[i]);
                }
            }
        };
        RenderData.prototype.removeRenderElement = function (element) {
            if (element instanceof feng3d.RenderElement) {
                var index = this._elements.indexOf(element);
                if (index != -1) {
                    this._elements.splice(i, 1);
                    this.dispatchEvent(new feng3d.Event(feng3d.Object3DRenderAtomic.REMOVE_RENDERELEMENT, element));
                }
            }
            else {
                for (var i = 0; i < element.length; i++) {
                    this.removeRenderElement(element[i]);
                }
            }
        };
        return RenderData;
    }(feng3d.EventDispatcher));
    feng3d.RenderData = RenderData;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var UniformData = (function (_super) {
        __extends(UniformData, _super);
        function UniformData(name, data) {
            var _this = _super.call(this) || this;
            _this.name = name;
            _this.data = data;
            return _this;
        }
        return UniformData;
    }(feng3d.RenderElement));
    feng3d.UniformData = UniformData;
    var RenderInstanceCount = (function (_super) {
        __extends(RenderInstanceCount, _super);
        function RenderInstanceCount() {
            var _this = _super.call(this) || this;
            _this.name = "instanceCount";
            return _this;
        }
        return RenderInstanceCount;
    }(feng3d.RenderElement));
    feng3d.RenderInstanceCount = RenderInstanceCount;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var ShaderCode = (function (_super) {
        __extends(ShaderCode, _super);
        function ShaderCode(code) {
            var _this = _super.call(this) || this;
            _this.code = code;
            return _this;
        }
        Object.defineProperty(ShaderCode.prototype, "code", {
            /**
             * 渲染程序代码
             */
            get: function () {
                return this._code;
            },
            set: function (value) {
                this._code = value;
                this.dispatchEvent(new feng3d.Event(feng3d.Event.CHANGE));
            },
            enumerable: true,
            configurable: true
        });
        return ShaderCode;
    }(feng3d.RenderElement));
    feng3d.ShaderCode = ShaderCode;
    var MacroType;
    (function (MacroType) {
        MacroType[MacroType["value"] = 0] = "value";
        MacroType[MacroType["bool"] = 1] = "bool";
        MacroType[MacroType["add"] = 2] = "add";
    })(MacroType = feng3d.MacroType || (feng3d.MacroType = {}));
    var Macro = (function (_super) {
        __extends(Macro, _super);
        function Macro() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return Macro;
    }(feng3d.RenderElement));
    feng3d.Macro = Macro;
    var ValueMacro = (function (_super) {
        __extends(ValueMacro, _super);
        function ValueMacro(name, value) {
            var _this = _super.call(this) || this;
            _this.name = name;
            _this.value = value;
            _this.type = MacroType.value;
            return _this;
        }
        return ValueMacro;
    }(Macro));
    feng3d.ValueMacro = ValueMacro;
    var BoolMacro = (function (_super) {
        __extends(BoolMacro, _super);
        function BoolMacro(name, value) {
            var _this = _super.call(this) || this;
            _this.name = name;
            _this.value = value;
            _this.type = MacroType.bool;
            return _this;
        }
        return BoolMacro;
    }(Macro));
    feng3d.BoolMacro = BoolMacro;
    var AddMacro = (function (_super) {
        __extends(AddMacro, _super);
        function AddMacro(name, value) {
            var _this = _super.call(this) || this;
            _this.name = name;
            _this.value = value;
            _this.type = MacroType.add;
            return _this;
        }
        return AddMacro;
    }(Macro));
    feng3d.AddMacro = AddMacro;
    var ShaderParam = (function (_super) {
        __extends(ShaderParam, _super);
        function ShaderParam(name) {
            var _this = _super.call(this) || this;
            _this.name = name;
            return _this;
        }
        return ShaderParam;
    }(feng3d.RenderElement));
    feng3d.ShaderParam = ShaderParam;
    var ShaderRenderData = (function () {
        function ShaderRenderData() {
            //
            this._invalid = true;
            /**
             * 渲染参数
             */
            this.shaderParams = {};
            this.macros = [];
            Object.defineProperty(this, "uuid", { value: Math.generateUUID() });
            Object.defineProperty(this, "version", { value: 0, writable: true });
        }
        ShaderRenderData.prototype.setShaderCode = function (shaderCode) {
            this.shaderCode = shaderCode;
        };
        ShaderRenderData.prototype.addMacro = function (macro) {
            var index = this.macros.indexOf(macro);
            if (index == -1) {
                this.macros.push(macro);
            }
        };
        ShaderRenderData.prototype.removeMacro = function (macro) {
            var index = this.macros.indexOf(macro);
            if (index != -1) {
                this.macros.splice(index, 1);
            }
        };
        /**
         * 激活渲染程序
         */
        ShaderRenderData.prototype.activeShaderProgram = function (gl) {
            if (!this.shaderCode || !this.shaderCode.code)
                return null;
            // if (this._invalid)
            {
                //应用宏
                var shaderMacroStr = this.getMacroCode(this.macros);
                if (this.shaderCode.code instanceof Function) {
                    var code = this.shaderCode.code();
                    var vertexCode = code.vertexCode;
                    var fragmentCode = code.fragmentCode;
                }
                else {
                    var vertexCode = this.shaderCode.code.vertexCode;
                    var fragmentCode = this.shaderCode.code.fragmentCode;
                }
                this._resultVertexCode = vertexCode.replace(/#define\s+macros/, shaderMacroStr);
                this._resultFragmentCode = fragmentCode.replace(/#define\s+macros/, shaderMacroStr);
                this.version++;
            }
            //渲染程序
            var shaderProgram = gl.programs[this.uuid];
            if (shaderProgram) {
                if (shaderProgram.vertexCode != this._resultVertexCode || shaderProgram.fragmentCode != this._resultFragmentCode) 
                // if (shaderProgram.version != this.version)
                {
                    shaderProgram.destroy();
                    shaderProgram = null;
                    delete gl.programs[this.uuid];
                }
            }
            if (!shaderProgram) {
                shaderProgram = gl.programs[this.uuid] = gl.createProgram(this._resultVertexCode, this._resultFragmentCode);
                shaderProgram.version = this.version;
                shaderProgram.vertexCode = this._resultVertexCode;
                shaderProgram.fragmentCode = this._resultFragmentCode;
            }
            gl.useProgram(shaderProgram);
            return shaderProgram;
        };
        ShaderRenderData.prototype.invalidate = function () {
            this._invalid = true;
        };
        ShaderRenderData.prototype.getMacroCode = function (macros) {
            var macro = { valueMacros: {}, boolMacros: {}, addMacros: {} };
            for (var i = 0; i < macros.length; i++) {
                var element = macros[i];
                var value = element.value;
                if (value instanceof Function) {
                    value = value();
                }
                switch (element.type) {
                    case MacroType.value:
                        macro.valueMacros[element.name] = value;
                        break;
                    case MacroType.bool:
                        macro.boolMacros[element.name] = macro.boolMacros[element.name] || value;
                        break;
                    case MacroType.add:
                        macro.boolMacros[element.name] = ~~macro.boolMacros[element.name] + value;
                        break;
                }
            }
            var macroHeader = "";
            var macroNames = Object.keys(macro.valueMacros);
            macroNames = macroNames.sort();
            macroNames.forEach(function (macroName) {
                var value = macro.valueMacros[macroName];
                macroHeader += "#define " + macroName + " " + value + "\n";
            });
            macroNames = Object.keys(macro.boolMacros);
            macroNames = macroNames.sort();
            macroNames.forEach(function (macroName) {
                var value = macro.boolMacros[macroName];
                value && (macroHeader += "#define " + macroName + "\n");
            });
            macroNames = Object.keys(macro.addMacros);
            macroNames = macroNames.sort();
            macroNames.forEach(function (macroName) {
                var value = macro.addMacros[macroName];
                macroHeader += "#define " + macroName + " " + value + "\n";
            });
            return macroHeader;
        };
        return ShaderRenderData;
    }());
    feng3d.ShaderRenderData = ShaderRenderData;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染数据拥有者
     * @author feng 2016-6-7
     */
    var RenderDataHolder = (function (_super) {
        __extends(RenderDataHolder, _super);
        /**
         * 创建GL数据缓冲
         */
        function RenderDataHolder() {
            var _this = _super.call(this) || this;
            _this._updateEverytime = false;
            _this.childrenRenderDataHolder = [];
            return _this;
        }
        Object.defineProperty(RenderDataHolder.prototype, "updateEverytime", {
            /**
             * 是否每次必须更新
             */
            get: function () { return this._updateEverytime; },
            enumerable: true,
            configurable: true
        });
        /**
         * 收集渲染数据拥有者
         * @param renderAtomic 渲染原子
         */
        RenderDataHolder.prototype.collectRenderDataHolder = function (renderAtomic) {
            if (renderAtomic === void 0) { renderAtomic = null; }
            renderAtomic.addRenderDataHolder(this);
            for (var i = 0; i < this.childrenRenderDataHolder.length; i++) {
                this.childrenRenderDataHolder[i].collectRenderDataHolder(renderAtomic);
            }
        };
        RenderDataHolder.prototype.addRenderDataHolder = function (renderDataHolder) {
            if (this.childrenRenderDataHolder.indexOf(renderDataHolder) == -1)
                this.childrenRenderDataHolder.push(renderDataHolder);
            this.dispatchEvent(new feng3d.Event(feng3d.Object3DRenderAtomic.ADD_RENDERHOLDER, renderDataHolder));
        };
        RenderDataHolder.prototype.removeRenderDataHolder = function (renderDataHolder) {
            var index = this.childrenRenderDataHolder.indexOf(renderDataHolder);
            if (index != -1)
                this.childrenRenderDataHolder.splice(index, 1);
            this.dispatchEvent(new feng3d.Event(feng3d.Object3DRenderAtomic.REMOVE_RENDERHOLDER, renderDataHolder));
        };
        /**
         * 更新渲染数据
         */
        RenderDataHolder.prototype.updateRenderData = function (renderContext, renderData) {
        };
        return RenderDataHolder;
    }(feng3d.RenderData));
    feng3d.RenderDataHolder = RenderDataHolder;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     * @author feng 2016-06-20
     */
    var RenderAtomic = (function () {
        function RenderAtomic() {
            this.elements = [];
            /**
             * 渲染程序
             */
            this.shader = new feng3d.ShaderRenderData();
            /**
             * 属性数据列表
             */
            this.attributes = {};
            /**
             * Uniform渲染数据
             */
            this.uniforms = {};
        }
        RenderAtomic.prototype.addRenderElement = function (element) {
            if (element instanceof feng3d.RenderElement) {
                if (element instanceof feng3d.UniformData) {
                    this.addUniform(element);
                }
                else if (element instanceof feng3d.AttributeRenderData) {
                    this.addAttribute(element);
                }
                else if (element instanceof feng3d.IndexRenderData) {
                    this.indexBuffer = element;
                }
                else if (element instanceof feng3d.Macro) {
                    this.shader.addMacro(element);
                }
                else if (element instanceof feng3d.ShaderCode) {
                    this.shader.setShaderCode(element);
                }
                else if (element instanceof feng3d.RenderInstanceCount) {
                    this.instanceCount = element.data;
                }
                else if (element instanceof feng3d.ShaderParam) {
                    this.shader.shaderParams[element.name] = element.value;
                }
                else {
                    throw "未知RenderElement！";
                }
                element.addEventListener(feng3d.Event.CHANGE, this.onElementChange, this);
                this.elements.push(element);
            }
            else {
                for (var i = 0; i < element.length; i++) {
                    this.addRenderElement(element[i]);
                }
            }
        };
        RenderAtomic.prototype.removeRenderElement = function (element) {
            if (element instanceof feng3d.RenderElement) {
                if (element instanceof feng3d.UniformData) {
                    this.removeUniform(element);
                }
                else if (element instanceof feng3d.AttributeRenderData) {
                    this.removeAttribute(element);
                }
                else if (element instanceof feng3d.IndexRenderData) {
                    delete this.indexBuffer;
                }
                else if (element instanceof feng3d.Macro) {
                    this.shader.removeMacro(element);
                }
                else if (element instanceof feng3d.ShaderCode) {
                    this.shader.setShaderCode(null);
                }
                else if (element instanceof feng3d.RenderInstanceCount) {
                    delete this.instanceCount;
                }
                else if (element instanceof feng3d.ShaderParam) {
                    delete this.shader.shaderParams[element.name];
                }
                else {
                    throw "未知RenderElement！";
                }
                element.removeEventListener(feng3d.Event.CHANGE, this.onElementChange, this);
            }
            else {
                for (var i = 0; i < element.length; i++) {
                    this.removeRenderElement(element[i]);
                }
            }
        };
        RenderAtomic.prototype.onElementChange = function (event) {
            var element = event.target;
            if (element instanceof feng3d.UniformData) {
            }
            else if (element instanceof feng3d.AttributeRenderData) {
            }
            else if (element instanceof feng3d.IndexRenderData) {
            }
            else if (element instanceof feng3d.Macro) {
                this.shader.invalidate();
            }
            else if (element instanceof feng3d.ShaderCode) {
                this.shader.invalidate();
            }
            else if (element instanceof feng3d.RenderInstanceCount) {
            }
            else if (element instanceof feng3d.ShaderParam) {
            }
            else {
                throw "未知RenderElement！";
            }
        };
        RenderAtomic.prototype.addUniform = function (uniformData) {
            this.uniforms[uniformData.name] = uniformData;
        };
        RenderAtomic.prototype.removeUniform = function (uniformData) {
            delete this.uniforms[uniformData.name];
        };
        RenderAtomic.prototype.addAttribute = function (attributeData) {
            this.attributes[attributeData.name] = attributeData;
        };
        RenderAtomic.prototype.removeAttribute = function (attributeData) {
            delete this.attributes[attributeData.name];
        };
        RenderAtomic.prototype.setIndexBuffer = function (indexBuffer) {
            this.indexBuffer = indexBuffer;
        };
        RenderAtomic.prototype.invalidateShader = function () {
            this.shader.invalidate();
        };
        /**
         * 激活属性
         */
        RenderAtomic.prototype.activeAttributes = function (gl, attributeInfos) {
            for (var i = 0; i < attributeInfos.length; i++) {
                var activeInfo = attributeInfos[i];
                var buffer = this.attributes[activeInfo.name];
                buffer.active(gl, activeInfo.location);
            }
        };
        /**
         * 激活常量
         */
        RenderAtomic.prototype.activeUniforms = function (gl, uniformInfos) {
            for (var o = 0; o < uniformInfos.length; o++) {
                var activeInfo = uniformInfos[o];
                if (activeInfo.uniformBaseName) {
                    var baseName = activeInfo.uniformBaseName;
                    var uniformData = this.uniforms[baseName];
                    if (uniformData instanceof feng3d.UniformData) {
                        uniformData = uniformData.data;
                    }
                    if (uniformData instanceof Function) {
                        uniformData = uniformData();
                    }
                    //处理数组
                    for (var j = 0; j < activeInfo.size; j++) {
                        this.setContext3DUniform(gl, { name: baseName + ("[" + j + "]"), type: activeInfo.type, uniformLocation: activeInfo.uniformLocation[j], textureID: activeInfo.textureID }, uniformData[j]);
                    }
                }
                else {
                    var uniformData = this.uniforms[activeInfo.name];
                    if (uniformData instanceof feng3d.UniformData) {
                        uniformData = uniformData.data;
                    }
                    if (uniformData instanceof Function) {
                        uniformData = uniformData();
                    }
                    this.setContext3DUniform(gl, activeInfo, uniformData);
                }
            }
        };
        /**
         * 设置环境Uniform数据
         */
        RenderAtomic.prototype.setContext3DUniform = function (gl, activeInfo, data) {
            var location = activeInfo.uniformLocation;
            switch (activeInfo.type) {
                case feng3d.GL.INT:
                    gl.uniform1i(location, data);
                    break;
                case feng3d.GL.FLOAT_MAT4:
                    gl.uniformMatrix4fv(location, false, data.rawData);
                    break;
                case feng3d.GL.FLOAT:
                    gl.uniform1f(location, data);
                    break;
                case feng3d.GL.FLOAT_VEC2:
                    gl.uniform2f(location, data.x, data.y);
                    break;
                case feng3d.GL.FLOAT_VEC3:
                    gl.uniform3f(location, data.x, data.y, data.z);
                    break;
                case feng3d.GL.FLOAT_VEC4:
                    gl.uniform4f(location, data.x, data.y, data.z, data.w);
                    break;
                case feng3d.GL.SAMPLER_2D:
                case feng3d.GL.SAMPLER_CUBE:
                    var textureInfo = data;
                    //激活纹理编号
                    gl.activeTexture(feng3d.GL["TEXTURE" + activeInfo.textureID]);
                    textureInfo.active(gl);
                    //设置纹理所在采样编号
                    gl.uniform1i(location, activeInfo.textureID);
                    break;
                default:
                    throw "\u65E0\u6CD5\u8BC6\u522B\u7684uniform\u7C7B\u578B " + activeInfo.name + " " + data;
            }
        };
        /**
         */
        RenderAtomic.prototype.dodraw = function (gl) {
            var instanceCount = this.instanceCount;
            if (instanceCount instanceof Function) {
                instanceCount = instanceCount();
            }
            instanceCount = ~~instanceCount;
            var indexBuffer = this.indexBuffer;
            var shaderParams = this.shader.shaderParams;
            indexBuffer.active(gl);
            var renderMode = shaderParams.renderMode;
            if (renderMode instanceof Function)
                renderMode = renderMode();
            if (instanceCount > 1) {
                gl.drawElementsInstanced(renderMode, indexBuffer.count, indexBuffer.type, indexBuffer.offset, instanceCount);
            }
            else {
                gl.drawElements(renderMode, indexBuffer.count, indexBuffer.type, indexBuffer.offset);
            }
        };
        return RenderAtomic;
    }());
    feng3d.RenderAtomic = RenderAtomic;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var Object3DRenderAtomic = (function (_super) {
        __extends(Object3DRenderAtomic, _super);
        function Object3DRenderAtomic() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._invalidateRenderDataHolderList = [];
            _this.renderHolderInvalid = true;
            _this.renderDataHolders = [];
            _this.updateEverytimeList = [];
            return _this;
        }
        Object3DRenderAtomic.prototype.onInvalidate = function (event) {
            var renderDataHolder = event.target;
            this.addInvalidateHolders(renderDataHolder);
        };
        Object3DRenderAtomic.prototype.onAddElement = function (event) {
            this.addRenderElement(event.data);
        };
        Object3DRenderAtomic.prototype.onRemoveElement = function (event) {
            this.removeRenderElement(event.data);
        };
        Object3DRenderAtomic.prototype.onInvalidateShader = function (event) {
            var renderDataHolder = event.target;
            this.addInvalidateShader(renderDataHolder);
        };
        Object3DRenderAtomic.prototype.onAddRenderHolder = function (event) {
            this.renderHolderInvalid = true;
            this.addRenderDataHolder(event.data);
        };
        Object3DRenderAtomic.prototype.onRemoveRenderHolder = function (event) {
            this.renderHolderInvalid = true;
            this.removeRenderDataHolder(event.data);
        };
        Object3DRenderAtomic.prototype.addInvalidateHolders = function (renderDataHolder) {
            if (this._invalidateRenderDataHolderList.indexOf(renderDataHolder) == -1) {
                this._invalidateRenderDataHolderList.push(renderDataHolder);
            }
        };
        Object3DRenderAtomic.prototype.addInvalidateShader = function (renderDataHolder) {
            this.invalidateShader();
        };
        Object3DRenderAtomic.prototype.addRenderDataHolder = function (renderDataHolder) {
            if (renderDataHolder instanceof feng3d.RenderDataHolder) {
                this.addRenderDataHolder(renderDataHolder.childrenRenderDataHolder);
                this.renderDataHolders.push(renderDataHolder);
                if (renderDataHolder.updateEverytime) {
                    this.updateEverytimeList.push(renderDataHolder);
                }
                this.addRenderElement(renderDataHolder.elements);
                this.addInvalidateShader(renderDataHolder);
                renderDataHolder.addEventListener(Object3DRenderAtomic.ADD_RENDERELEMENT, this.onAddElement, this);
                renderDataHolder.addEventListener(Object3DRenderAtomic.REMOVE_RENDERELEMENT, this.onRemoveElement, this);
                renderDataHolder.addEventListener(Object3DRenderAtomic.ADD_RENDERHOLDER, this.onAddRenderHolder, this);
                renderDataHolder.addEventListener(Object3DRenderAtomic.REMOVE_RENDERHOLDER, this.onRemoveRenderHolder, this);
            }
            else {
                for (var i = 0; i < renderDataHolder.length; i++) {
                    this.addRenderDataHolder(renderDataHolder[i]);
                }
            }
        };
        Object3DRenderAtomic.prototype.removeRenderDataHolder = function (renderDataHolder) {
            if (renderDataHolder instanceof Array) {
                for (var i = 0; i < renderDataHolder.length; i++) {
                    this.removeRenderDataHolder(renderDataHolder[i]);
                }
            }
            else {
                this.removeRenderDataHolder(renderDataHolder.childrenRenderDataHolder);
                var index = this.renderDataHolders.indexOf(renderDataHolder);
                if (index != -1)
                    this.renderDataHolders.splice(index, 1);
                if (renderDataHolder.updateEverytime) {
                    var index_1 = this.updateEverytimeList.indexOf(renderDataHolder);
                    if (index_1 != -1)
                        this.updateEverytimeList.splice(index_1, 1);
                }
                this.removeRenderElement(renderDataHolder.elements);
                this.addInvalidateShader(renderDataHolder);
                renderDataHolder.removeEventListener(Object3DRenderAtomic.ADD_RENDERELEMENT, this.onAddElement, this);
                renderDataHolder.removeEventListener(Object3DRenderAtomic.REMOVE_RENDERELEMENT, this.onRemoveElement, this);
                renderDataHolder.removeEventListener(Object3DRenderAtomic.ADD_RENDERHOLDER, this.onAddRenderHolder, this);
                renderDataHolder.removeEventListener(Object3DRenderAtomic.REMOVE_RENDERHOLDER, this.onRemoveRenderHolder, this);
            }
        };
        Object3DRenderAtomic.prototype.update = function (renderContext) {
            var _this = this;
            renderContext.updateRenderData1();
            this.addRenderDataHolder(renderContext);
            if (this.updateEverytimeList.length > 0) {
                this.updateEverytimeList.forEach(function (element) {
                    element.updateRenderData(renderContext, _this);
                });
            }
            if (this._invalidateRenderDataHolderList.length > 0) {
                this._invalidateRenderDataHolderList.forEach(function (element) {
                    element.updateRenderData(renderContext, _this);
                });
                this._invalidateRenderDataHolderList.length = 0;
            }
        };
        Object3DRenderAtomic.prototype.clear = function () {
            var _this = this;
            this.renderDataHolders.forEach(function (element) {
                _this.removeRenderDataHolder(element);
            });
        };
        return Object3DRenderAtomic;
    }(feng3d.RenderAtomic));
    /**
     * 添加渲染元素
     */
    Object3DRenderAtomic.ADD_RENDERELEMENT = "addRenderElement";
    /**
     * 移除渲染元素
     */
    Object3DRenderAtomic.REMOVE_RENDERELEMENT = "removeRenderElement";
    /**
     * 添加渲染数据拥有者
     */
    Object3DRenderAtomic.ADD_RENDERHOLDER = "addRenderHolder";
    /**
     * 移除渲染数据拥有者
     */
    Object3DRenderAtomic.REMOVE_RENDERHOLDER = "removeRenderHolder";
    feng3d.Object3DRenderAtomic = Object3DRenderAtomic;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 索引渲染数据
     * @author feng 2017-01-04
     */
    var IndexRenderData = (function (_super) {
        __extends(IndexRenderData, _super);
        function IndexRenderData() {
            var _this = _super.call(this) || this;
            /**
             * 数据类型，gl.UNSIGNED_BYTE、gl.UNSIGNED_SHORT
             */
            _this.type = feng3d.GL.UNSIGNED_SHORT;
            /**
             * 索引偏移
             */
            _this.offset = 0;
            /**
             * 缓冲
             */
            _this._indexBufferMap = new feng3d.Map();
            /**
             * 是否失效
             */
            _this._invalid = true;
            return _this;
        }
        Object.defineProperty(IndexRenderData.prototype, "indices", {
            /**
             * 索引数据
             */
            get: function () {
                return this._indices;
            },
            set: function (value) {
                if (this._indices == value)
                    return;
                this._indices = value;
                this._invalid = true;
                this.count = this.indices ? this.indices.length : 0;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 激活缓冲
         * @param gl
         */
        IndexRenderData.prototype.active = function (gl) {
            if (this._invalid) {
                this.clear();
                this._invalid = false;
            }
            var buffer = this.getBuffer(gl);
            gl.bindBuffer(feng3d.GL.ELEMENT_ARRAY_BUFFER, buffer);
        };
        /**
         * 获取缓冲
         */
        IndexRenderData.prototype.getBuffer = function (gl) {
            var buffer = this._indexBufferMap.get(gl);
            if (!buffer) {
                buffer = gl.createBuffer();
                gl.bindBuffer(feng3d.GL.ELEMENT_ARRAY_BUFFER, buffer);
                gl.bufferData(feng3d.GL.ELEMENT_ARRAY_BUFFER, this.indices, feng3d.GL.STATIC_DRAW);
                this._indexBufferMap.push(gl, buffer);
            }
            return buffer;
        };
        /**
         * 清理缓冲
         */
        IndexRenderData.prototype.clear = function () {
            var gls = this._indexBufferMap.getKeys();
            for (var i = 0; i < gls.length; i++) {
                gls[i].deleteBuffer(this._indexBufferMap.get(gls[i]));
            }
            this._indexBufferMap.clear();
        };
        /**
         * 克隆
         */
        IndexRenderData.prototype.clone = function () {
            var cls = this.constructor;
            var ins = new cls();
            var indices = new Uint16Array(this.indices.length);
            indices.set(this.indices, 0);
            ins.indices = indices;
            ins.count = this.count;
            ins.type = this.type;
            ins.offset = this.offset;
            return ins;
        };
        return IndexRenderData;
    }(feng3d.RenderElement));
    feng3d.IndexRenderData = IndexRenderData;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 属性渲染数据
     * @author feng 2014-8-14
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer}
     */
    var AttributeRenderData = (function (_super) {
        __extends(AttributeRenderData, _super);
        function AttributeRenderData(name, data, size, divisor) {
            if (data === void 0) { data = null; }
            if (size === void 0) { size = 3; }
            if (divisor === void 0) { divisor = 0; }
            var _this = _super.call(this) || this;
            _this._size = 3;
            /**
             *  A GLenum specifying the data type of each component in the array. Possible values:
                    - gl.BYTE: signed 8-bit integer, with values in [-128, 127]
                    - gl.SHORT: signed 16-bit integer, with values in [-32768, 32767]
                    - gl.UNSIGNED_BYTE: unsigned 8-bit integer, with values in [0, 255]
                    - gl.UNSIGNED_SHORT: unsigned 16-bit integer, with values in [0, 65535]
                    - gl.FLOAT: 32-bit floating point number
                When using a WebGL 2 context, the following values are available additionally:
                   - gl.HALF_FLOAT: 16-bit floating point number
             */
            _this.type = feng3d.GL.FLOAT;
            /**
             * A GLboolean specifying whether integer data values should be normalized when being casted to a float.
                  -  If true, signed integers are normalized to [-1, 1].
                  -  If true, unsigned integers are normalized to [0, 1].
                  -  For types gl.FLOAT and gl.HALF_FLOAT, this parameter has no effect.
             */
            _this.normalized = false;
            /**
             * A GLsizei specifying the offset in bytes between the beginning of consecutive vertex attributes. Cannot be larger than 255.
             */
            _this.stride = 0;
            /**
             * A GLintptr specifying an offset in bytes of the first component in the vertex attribute array. Must be a multiple of type.
             */
            _this.offset = 0;
            _this._divisor = 0;
            /**
             * 顶点数据缓冲
             */
            _this._indexBufferMap = new feng3d.Map();
            /**
             * 是否失效
             */
            _this._invalid = true;
            _this.name = name;
            _this._data = data;
            _this._size = size;
            _this._divisor = divisor;
            _this._invalid = true;
            return _this;
        }
        Object.defineProperty(AttributeRenderData.prototype, "data", {
            /**
             * 属性数据
             */
            get: function () { return this._data; },
            set: function (value) { this.invalidate(); this._data = value; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AttributeRenderData.prototype, "size", {
            /**
             * 数据尺寸
             *
             * A GLint specifying the number of components per vertex attribute. Must be 1, 2, 3, or 4.
             */
            get: function () { return this._size; },
            set: function (value) { this.invalidate(); this._size = value; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AttributeRenderData.prototype, "divisor", {
            /**
             * drawElementsInstanced时将会用到的因子，表示divisor个geometry共用一个数据
             *
             * A GLuint specifying the number of instances that will pass between updates of the generic attribute.
             * @see https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/vertexAttribDivisorANGLE
             */
            get: function () { return this._divisor; },
            set: function (value) { this.invalidate(); this._divisor = value; },
            enumerable: true,
            configurable: true
        });
        /**
         * 使数据缓冲失效
         */
        AttributeRenderData.prototype.invalidate = function () {
            this._invalid = true;
        };
        /**
         *
         * @param gl
         * @param location A GLuint specifying the index of the vertex attribute that is to be modified.
         */
        AttributeRenderData.prototype.active = function (gl, location) {
            if (this._invalid) {
                this.clear();
                this._invalid = false;
            }
            gl.enableVertexAttribArray(location);
            var buffer = this.getBuffer(gl);
            gl.bindBuffer(feng3d.GL.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(location, this.size, this.type, this.normalized, this.stride, this.offset);
            if (this.divisor > 0) {
                gl.vertexAttribDivisor(location, this.divisor);
            }
        };
        /**
         * 获取缓冲
         */
        AttributeRenderData.prototype.getBuffer = function (gl) {
            var buffer = this._indexBufferMap.get(gl);
            if (!buffer) {
                buffer = gl.createBuffer();
                buffer.uuid = Math.generateUUID();
                gl.bindBuffer(feng3d.GL.ARRAY_BUFFER, buffer);
                gl.bufferData(feng3d.GL.ARRAY_BUFFER, this.data, feng3d.GL.STATIC_DRAW);
                this._indexBufferMap.push(gl, buffer);
            }
            return buffer;
        };
        /**
         * 清理缓冲
         */
        AttributeRenderData.prototype.clear = function () {
            var gls = this._indexBufferMap.getKeys();
            for (var i = 0; i < gls.length; i++) {
                gls[i].deleteBuffer(this._indexBufferMap.get(gls[i]));
            }
            this._indexBufferMap.clear();
        };
        /**
         * 克隆
         */
        AttributeRenderData.prototype.clone = function () {
            var cls = this.constructor;
            var ins = new cls();
            ins.name = this.name;
            ins.data = new Float32Array(this.data.length);
            ins.data.set(this.data, 0);
            ins.size = this.size;
            ins.divisor = this.divisor;
            return ins;
        };
        return AttributeRenderData;
    }(feng3d.RenderElement));
    feng3d.AttributeRenderData = AttributeRenderData;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染环境
     * @author feng 2017-01-04
     */
    var RenderContext = (function (_super) {
        __extends(RenderContext, _super);
        function RenderContext() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(RenderContext.prototype, "camera", {
            /**
             * 摄像机
             */
            get: function () {
                return this._camera;
            },
            set: function (value) {
                if (this._camera == value)
                    return;
                if (this._camera)
                    this.removeRenderDataHolder(this._camera);
                this._camera = value;
                if (this._camera)
                    this.addRenderDataHolder(this._camera);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 更新渲染数据
         */
        RenderContext.prototype.updateRenderData1 = function () {
            var pointLights = feng3d.PointLight.pointLights;
            var directionalLights = feng3d.DirectionalLight.directionalLights;
            this.createValueMacro("NUM_LIGHT", feng3d.Light.lights.length);
            //收集点光源数据
            var pointLightPositions = [];
            var pointLightColors = [];
            var pointLightIntensitys = [];
            var pointLightRanges = [];
            for (var i = 0; i < pointLights.length; i++) {
                var pointLight = pointLights[i];
                pointLightPositions.push(pointLight.position);
                pointLightColors.push(pointLight.color);
                pointLightIntensitys.push(pointLight.intensity);
                pointLightRanges.push(pointLight.range);
            }
            //设置点光源数据
            this.createValueMacro("NUM_POINTLIGHT", pointLights.length);
            if (pointLights.length > 0) {
                this.createAddMacro("A_NORMAL_NEED", 1);
                this.createAddMacro("V_NORMAL_NEED", 1);
                this.createAddMacro("V_GLOBAL_POSITION_NEED", 1);
                this.createAddMacro("U_CAMERAMATRIX_NEED", 1);
                //
                this.createUniformData("u_pointLightPositions", pointLightPositions);
                this.createUniformData("u_pointLightColors", pointLightColors);
                this.createUniformData("u_pointLightIntensitys", pointLightIntensitys);
                this.createUniformData("u_pointLightRanges", pointLightRanges);
            }
            var directionalLightDirections = [];
            var directionalLightColors = [];
            var directionalLightIntensitys = [];
            for (var i = 0; i < directionalLights.length; i++) {
                var directionalLight = directionalLights[i];
                directionalLightDirections.push(directionalLight.sceneDirection);
                directionalLightColors.push(directionalLight.color);
                directionalLightIntensitys.push(directionalLight.intensity);
            }
            this.createValueMacro("NUM_DIRECTIONALLIGHT", directionalLights.length);
            if (directionalLights.length > 0) {
                this.createAddMacro("A_NORMAL_NEED", 1);
                this.createAddMacro("V_NORMAL_NEED", 1);
                this.createAddMacro("U_CAMERAMATRIX_NEED", 1);
                //
                this.createUniformData("u_directionalLightDirections", directionalLightDirections);
                this.createUniformData("u_directionalLightColors", directionalLightColors);
                this.createUniformData("u_directionalLightIntensitys", directionalLightIntensitys);
            }
            this.createUniformData("u_sceneAmbientColor", this.scene3d.ambientColor);
            this.createUniformData("u_scaleByDepth", this.view3D.getScaleByDepth(1));
        };
        return RenderContext;
    }(feng3d.RenderDataHolder));
    feng3d.RenderContext = RenderContext;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染代码库
     * @author feng 2016-12-16
     */
    var ShaderLib = (function () {
        function ShaderLib() {
        }
        ShaderLib.getShaderContentByName = function (shaderName) {
            var shaderPath = "shaders/" + shaderName + ".glsl";
            return feng3d.shaderFileMap[shaderPath];
        };
        /**
         * 获取shaderCode
         */
        ShaderLib.getShaderCode = function (shaderName) {
            if (!_shaderMap[shaderName])
                _shaderMap[shaderName] = ShaderLoader.loadText(shaderName);
            return _shaderMap[shaderName];
        };
        return ShaderLib;
    }());
    feng3d.ShaderLib = ShaderLib;
    /**
     * 渲染代码字典
     */
    var _shaderMap = {};
    /**
     * 渲染代码加载器字典
     */
    var _shaderLoaderMap = {};
    /**
     * 着色器加载器
     * @author feng 2016-12-15
     */
    var ShaderLoader = (function () {
        function ShaderLoader() {
        }
        /**
         * 加载shader
         * @param url   路径
         */
        ShaderLoader.loadText = function (shaderName) {
            var shaderCode = ShaderLib.getShaderContentByName(shaderName);
            //#include 正则表达式
            var includeRegExp = /#include<(.+)>/g;
            //
            var match = includeRegExp.exec(shaderCode);
            while (match != null) {
                var subShaderName = match[1];
                var subShaderCode = ShaderLib.getShaderCode(subShaderName);
                if (subShaderCode) {
                    shaderCode = shaderCode.replace(match[0], subShaderCode);
                }
                else {
                    var subShaderCode = ShaderLoader.loadText(subShaderName);
                    shaderCode = shaderCode.replace(match[0], subShaderCode);
                }
                match = includeRegExp.exec(shaderCode);
            }
            return shaderCode;
        };
        return ShaderLoader;
    }());
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Bit mask that controls object destruction, saving and visibility in inspectors.
     */
    var HideFlags;
    (function (HideFlags) {
        /**
         * A normal, visible object. This is the default.
         */
        HideFlags[HideFlags["None"] = 0] = "None";
        /**
         * The object will not appear in the hierarchy.
         */
        HideFlags[HideFlags["HideInHierarchy"] = 1] = "HideInHierarchy";
        /**
         * It is not possible to view it in the inspector.
         */
        HideFlags[HideFlags["HideInInspector"] = 2] = "HideInInspector";
        /**
         * The object will not be saved to the scene in the editor.
         */
        HideFlags[HideFlags["DontSaveInEditor"] = 4] = "DontSaveInEditor";
        /**
         * The object is not be editable in the inspector.
         */
        HideFlags[HideFlags["NotEditable"] = 8] = "NotEditable";
        /**
         * The object will not be saved when building a player.
         */
        HideFlags[HideFlags["DontSaveInBuild"] = 16] = "DontSaveInBuild";
        /**
         * The object will not be unloaded by Resources.UnloadUnusedAssets.
         */
        HideFlags[HideFlags["DontUnloadUnusedAsset"] = 32] = "DontUnloadUnusedAsset";
        /**
         * The object will not be saved to the scene. It will not be destroyed when a new scene is loaded. It is a shortcut for HideFlags.DontSaveInBuild | HideFlags.DontSaveInEditor | HideFlags.DontUnloadUnusedAsset.
         */
        HideFlags[HideFlags["DontSave"] = 52] = "DontSave";
        /**
         * A combination of not shown in the hierarchy, not saved to to scenes and not unloaded by The object will not be unloaded by Resources.UnloadUnusedAssets.
         */
        HideFlags[HideFlags["HideAndDontSave"] = 61] = "HideAndDontSave";
    })(HideFlags = feng3d.HideFlags || (feng3d.HideFlags = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Base class for all objects feng3d can reference.
     *
     * Any public variable you make that derives from Feng3dObject gets shown in the inspector as a drop target, allowing you to set the value from the GUI.
     */
    var Feng3dObject = (function (_super) {
        __extends(Feng3dObject, _super);
        //------------------------------------------
        // Public Functions
        //------------------------------------------
        function Feng3dObject() {
            var _this = _super.call(this) || this;
            _this._uuid = Math.generateUUID();
            return _this;
        }
        /**
         * Returns the instance id of the Feng3dObject.
         */
        Feng3dObject.prototype.getInstanceID = function () {
            return this._uuid;
        };
        /**
         * Returns the name of the game Feng3dObject.
         */
        Feng3dObject.prototype.toString = function () {
            return this.name;
        };
        //------------------------------------------
        // Static Functions
        //------------------------------------------
        /**
         * Removes a gameobject, component or asset.
         * @param obj	The Feng3dObject to destroy.
         * @param t	    The optional amount of time to delay before destroying the Feng3dObject.
         */
        Feng3dObject.destroy = function (obj, t) {
            if (t === void 0) { t = 0; }
        };
        /**
         * Destroys the Feng3dObject obj immediately.
         * @param obj	                    Feng3dObject to be destroyed.
         * @param allowDestroyingAssets	    Set to true to allow assets to be destoyed.
         */
        Feng3dObject.destroyImmediate = function (obj, allowDestroyingAssets) {
            if (allowDestroyingAssets === void 0) { allowDestroyingAssets = false; }
        };
        /**
         * Makes the Feng3dObject target not be destroyed automatically when loading a new scene.
         */
        Feng3dObject.dontDestroyOnLoad = function (target) {
        };
        /**
         * Returns the first active loaded Feng3dObject of Type type.
         */
        Feng3dObject.findObjectOfType = function (type) {
            return null;
        };
        /**
         * Returns a list of all active loaded objects of Type type.
         */
        Feng3dObject.findObjectsOfType = function (type) {
            return null;
        };
        /**
         * Returns a copy of the Feng3dObject original.
         * @param original	An existing Feng3dObject that you want to make a copy of.
         * @param position	Position for the new Feng3dObject(default Vector3.zero).
         * @param rotation	Orientation of the new Feng3dObject(default Quaternion.identity).
         * @param parent	The transform the Feng3dObject will be parented to.
         * @param worldPositionStays	If when assigning the parent the original world position should be maintained.
         */
        Feng3dObject.instantiate = function (original, position, rotation, parent, worldPositionStays) {
            if (position === void 0) { position = null; }
            if (rotation === void 0) { rotation = null; }
            if (parent === void 0) { parent = null; }
            if (worldPositionStays === void 0) { worldPositionStays = false; }
            return null;
        };
        return Feng3dObject;
    }(feng3d.RenderDataHolder));
    feng3d.Feng3dObject = Feng3dObject;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 组件事件
     * @author feng 2015-12-2
     */
    var ComponentEvent = (function (_super) {
        __extends(ComponentEvent, _super);
        function ComponentEvent() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return ComponentEvent;
    }(feng3d.Event));
    /**
     * 添加子组件事件
     */
    ComponentEvent.ADDED_COMPONENT = "addedComponent";
    /**
     * 移除子组件事件
     */
    ComponentEvent.REMOVED_COMPONENT = "removedComponent";
    feng3d.ComponentEvent = ComponentEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Base class for everything attached to GameObjects.
     *
     * Note that your code will never directly create a Component. Instead, you write script code, and attach the script to a GameObject. See Also: ScriptableObject as a way to create scripts that do not attach to any GameObject.
     */
    var Component = (function (_super) {
        __extends(Component, _super);
        //------------------------------------------
        // Public Functions
        //------------------------------------------
        /**
         * 创建一个组件容器
         */
        function Component() {
            var _this = _super.call(this) || this;
            //------------------------------------------
            // Static Functions
            //------------------------------------------
            //------------------------------------------
            // Protected Properties
            //------------------------------------------
            /**
             * 组件列表
             */
            _this._single = false;
            _this.initComponent();
            return _this;
        }
        Object.defineProperty(Component.prototype, "gameObject", {
            //------------------------------------------
            // Variables
            //------------------------------------------
            /**
             * The game object this component is attached to. A component is always attached to a game object.
             */
            get: function () {
                return this.internalGetGameObject();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Component.prototype, "tag", {
            /**
             * The tag of this game object.
             */
            get: function () {
                return this._tag;
            },
            set: function (value) {
                this._tag = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Component.prototype, "transform", {
            /**
             * The Transform attached to this GameObject (null if there is none attached).
             */
            get: function () {
                if (this._transform == null) {
                    this._transform = this.internalGetTransform();
                }
                return this._transform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Component.prototype, "single", {
            /**
             * 是否唯一，同类型3D对象组件只允许一个
             */
            get: function () {
                return this._single;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         * @param type				The type of Component to retrieve.
         * @return                  返回指定类型组件
         */
        Component.prototype.getComponent = function (type) {
            return this.gameObject.getComponent(type);
        };
        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        Component.prototype.getComponents = function (type) {
            if (type === void 0) { type = null; }
            return this.gameObject.getComponents(type);
        };
        /**
         * 派发事件，该事件将会强制冒泡到3D对象中
         * @param event						调度到事件流中的 Event 对象。
         */
        Component.prototype.dispatchEvent = function (event) {
            var result = _super.prototype.dispatchEvent.call(this, event);
            if (result) {
                this.gameObject && this.gameObject.dispatchEvent(event);
            }
            return result;
        };
        //------------------------------------------
        // Protected Functions
        //------------------------------------------
        /**
         * 初始化组件
         */
        Component.prototype.initComponent = function () {
            //以最高优先级监听组件被添加，设置父组件
            this.addEventListener(feng3d.ComponentEvent.ADDED_COMPONENT, this._onAddedComponent, this, Number.MAX_VALUE);
            //以最低优先级监听组件被删除，清空父组件
            this.addEventListener(feng3d.ComponentEvent.REMOVED_COMPONENT, this._onRemovedComponent, this, Number.MIN_VALUE);
        };
        /**
         * 处理被添加组件事件
         */
        Component.prototype.onBeAddedComponent = function (event) {
        };
        /**
         * 处理被移除组件事件
         */
        Component.prototype.onBeRemovedComponent = function (event) {
        };
        /**
         * 获取冒泡对象
         */
        Component.prototype.getBubbleTargets = function (event) {
            if (event === void 0) { event = null; }
            var bubbleTargets = _super.prototype.getBubbleTargets.call(this, event);
            bubbleTargets.push(this.gameObject);
            return bubbleTargets;
        };
        //------------------------------------------
        // Private Methods
        //------------------------------------------
        /**
         * 处理添加组件事件，此处为被添加，设置父组件
         */
        Component.prototype._onAddedComponent = function (event) {
            var data = event.data;
            if (data.child == this) {
                this._gameObject = data.container;
                this.onBeAddedComponent(event);
            }
        };
        /**
         * 处理移除组件事件，此处为被移除，清空父组件
         */
        Component.prototype._onRemovedComponent = function (event) {
            var data = event.data;
            if (event.data.child == this) {
                this.onBeRemovedComponent(event);
                this._gameObject = null;
            }
        };
        Component.prototype.internalGetTransform = function () {
            if (this._gameObject)
                return this._gameObject.transform;
            return null;
        };
        Component.prototype.internalGetGameObject = function () {
            return this._gameObject;
        };
        return Component;
    }(feng3d.Feng3dObject));
    feng3d.Component = Component;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 帧缓冲对象
     * @author feng 2017-02-18
     */
    var FrameBufferObject = (function () {
        function FrameBufferObject() {
            this.OFFSCREEN_WIDTH = 1024;
            this.OFFSCREEN_HEIGHT = 1024;
        }
        FrameBufferObject.prototype.init = function (gl) {
            // Create a framebuffer object (FBO)
            this.framebuffer = gl.createFramebuffer();
            if (!this.framebuffer) {
                feng3d.debuger && alert('Failed to create frame buffer object');
                return this.clear(gl);
            }
            // Create a texture object and set its size and parameters
            this.texture = gl.createTexture(); // Create a texture object
            if (!this.texture) {
                feng3d.debuger && alert('Failed to create texture object');
                return this.clear(gl);
            }
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.OFFSCREEN_WIDTH, this.OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            // Create a renderbuffer object and Set its size and parameters
            this.depthBuffer = gl.createRenderbuffer(); // Create a renderbuffer object
            if (!this.depthBuffer) {
                feng3d.debuger && alert('Failed to create renderbuffer object');
                return this.clear(gl);
            }
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.OFFSCREEN_WIDTH, this.OFFSCREEN_HEIGHT);
            // Attach the texture and the renderbuffer object to the FBO
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);
            // Check if FBO is configured correctly
            var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            if (gl.FRAMEBUFFER_COMPLETE !== e) {
                feng3d.debuger && alert('Frame buffer object is incomplete: ' + e.toString());
                return this.clear(gl);
            }
            // Unbind the buffer object
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        };
        FrameBufferObject.prototype.active = function (gl) {
            gl.bindFramebuffer(feng3d.GL.FRAMEBUFFER, this.framebuffer);
        };
        FrameBufferObject.prototype.deactive = function (gl) {
            gl.bindFramebuffer(feng3d.GL.FRAMEBUFFER, null);
        };
        FrameBufferObject.prototype.clear = function (gl) {
            if (this.framebuffer)
                gl.deleteFramebuffer(this.framebuffer);
            if (this.texture)
                gl.deleteTexture(this.texture);
            if (this.depthBuffer)
                gl.deleteRenderbuffer(this.depthBuffer);
            return null;
        };
        return FrameBufferObject;
    }());
    feng3d.FrameBufferObject = FrameBufferObject;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染器
     * @author feng 2016-05-01
     */
    var Renderer = (function (_super) {
        __extends(Renderer, _super);
        function Renderer() {
            var _this = _super.call(this) || this;
            _this.addRenderDataHolder(_this.material);
            Renderer.renderers.push(_this);
            return _this;
        }
        Object.defineProperty(Renderer.prototype, "material", {
            /**
             * 材质
             * Returns the first instantiated Material assigned to the renderer.
             */
            get: function () { return this._material || feng3d.defaultMaterial; },
            set: function (value) {
                if (this._material == value)
                    return;
                this.removeRenderDataHolder(this.material);
                this._material = value;
                this.addRenderDataHolder(this.material);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Renderer.prototype, "enabled", {
            /**
             * Makes the rendered 3D object visible if enabled.
             */
            get: function () {
                return this._enabled;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Renderer.prototype, "enable", {
            set: function (value) {
                this._enabled = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Renderer.prototype, "isVisible", {
            /**
             * Is this renderer visible in any camera? (Read Only)
             */
            get: function () {
                return this.gameObject.transform.visible;
            },
            enumerable: true,
            configurable: true
        });
        Renderer.prototype.drawRenderables = function (renderContext) {
            var object3D = this.gameObject;
            //更新数据
            object3D.updateRender(renderContext);
            var gl = renderContext.gl;
            // try
            // {
            //绘制
            var material = this.material;
            if (material.enableBlend) {
                //
                gl.enable(feng3d.GL.BLEND);
                gl.blendEquation(material.blendEquation);
                gl.depthMask(false);
                gl.blendFunc(material.sfactor, material.dfactor);
            }
            else {
                gl.disable(feng3d.GL.BLEND);
                gl.depthMask(true);
            }
            this.drawObject3D(gl, object3D.renderData); //
            // } catch (error)
            // {
            //     console.log(error);
            // }
        };
        /**
         * 绘制3D对象
         */
        Renderer.prototype.drawObject3D = function (gl, renderAtomic, shader) {
            if (shader === void 0) { shader = null; }
            shader = shader || renderAtomic.shader;
            var shaderProgram = shader.activeShaderProgram(gl);
            if (!shaderProgram)
                return;
            //
            renderAtomic.activeAttributes(gl, shaderProgram.attributes);
            renderAtomic.activeUniforms(gl, shaderProgram.uniforms);
            renderAtomic.dodraw(gl);
        };
        return Renderer;
    }(feng3d.Component));
    Renderer.renderers = [];
    feng3d.Renderer = Renderer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 前向渲染器
     * @author feng 2017-02-20
     */
    var ForwardRenderer = (function () {
        function ForwardRenderer() {
            this.viewRect = new feng3d.Rectangle(0, 0, 100, 100);
        }
        /**
         * 渲染
         */
        ForwardRenderer.prototype.draw = function (renderContext) {
            var gl = renderContext.gl;
            var scene3D = renderContext.scene3d;
            // 默认渲染
            gl.clearColor(scene3D.background.r, scene3D.background.g, scene3D.background.b, scene3D.background.a);
            gl.clear(feng3d.GL.COLOR_BUFFER_BIT | feng3d.GL.DEPTH_BUFFER_BIT);
            gl.viewport(0, 0, this.viewRect.width, this.viewRect.height);
            gl.enable(feng3d.GL.DEPTH_TEST);
            // gl.cullFace()
            var meshRenderers = feng3d.MeshRenderer.meshRenderers;
            for (var i = 0; i < meshRenderers.length; i++) {
                meshRenderers[i].drawRenderables(renderContext);
            }
        };
        return ForwardRenderer;
    }());
    feng3d.ForwardRenderer = ForwardRenderer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 深度渲染器
     * @author  feng    2017-03-25
     */
    var DepthRenderer = (function () {
        function DepthRenderer() {
        }
        return DepthRenderer;
    }());
    feng3d.DepthRenderer = DepthRenderer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 鼠标拾取渲染器
     * @author feng 2017-02-06
     */
    var MouseRenderer = (function (_super) {
        __extends(MouseRenderer, _super);
        function MouseRenderer() {
            var _this = _super.call(this) || this;
            _this._shaderName = "mouse";
            _this.objects = [null];
            return _this;
        }
        /**
         * 渲染
         */
        MouseRenderer.prototype.draw = function (renderContext) {
            this.objects.length = 1;
            var gl = renderContext.gl;
            //启动裁剪，只绘制一个像素
            gl.enable(feng3d.GL.SCISSOR_TEST);
            gl.scissor(0, 0, 1, 1);
            // super.draw(renderContext);
            gl.disable(feng3d.GL.SCISSOR_TEST);
            //读取鼠标拾取索引
            // this.frameBufferObject.readBuffer(gl, "objectID");
            var data = new Uint8Array(4);
            gl.readPixels(0, 0, 1, 1, feng3d.GL.RGBA, feng3d.GL.UNSIGNED_BYTE, data);
            var id = data[0] + data[1] * 255 + data[2] * 255 * 255 + data[3] * 255 * 255 * 255 - data[3]; //最后（- data[3]）表示很奇怪，不过data[3]一般情况下为0
            // console.log(`选中索引3D对象${id}`, data.toString());
            this.selectedObject3D = this.objects[id];
        };
        MouseRenderer.prototype.drawRenderables = function (renderContext, meshRenderer) {
            if (meshRenderer.gameObject.transform.mouseEnabled) {
                var object = meshRenderer.gameObject;
                this.objects.push(object);
                object.renderData.addUniform(this.createUniformData("u_objectID", this.objects.length - 1));
                // super.drawRenderables(renderContext, meshRenderer);
            }
        };
        /**
         * 绘制3D对象
         */
        MouseRenderer.prototype.drawObject3D = function (gl, renderAtomic, shader) {
            if (shader === void 0) { shader = null; }
            var vertexCode = feng3d.ShaderLib.getShaderCode(this._shaderName + ".vertex");
            var fragmentCode = feng3d.ShaderLib.getShaderCode(this._shaderName + ".fragment");
            var shader = new feng3d.ShaderRenderData();
            shader.setShaderCode(this.createShaderCode({ vertexCode: vertexCode, fragmentCode: fragmentCode }));
            // super.drawObject3D(gl, renderAtomic, shader);
        };
        return MouseRenderer;
    }(feng3d.RenderDataHolder));
    feng3d.MouseRenderer = MouseRenderer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 后处理渲染器
     * @author feng 2017-02-20
     */
    var PostProcessRenderer = (function () {
        function PostProcessRenderer() {
        }
        return PostProcessRenderer;
    }());
    feng3d.PostProcessRenderer = PostProcessRenderer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 阴影图渲染器
     * @author  feng    2017-03-25
     */
    var ShadowRenderer = (function () {
        function ShadowRenderer() {
        }
        /**
         * 渲染
         */
        ShadowRenderer.prototype.draw = function (renderContext) {
            var gl = renderContext.gl;
            var lights = feng3d.Light.lights;
            for (var i = 0; i < lights.length; i++) {
                var light = lights[i];
                var frameBufferObject = new feng3d.FrameBufferObject();
                frameBufferObject.init(gl);
                frameBufferObject.active(gl);
                feng3d.MeshRenderer.meshRenderers.forEach(function (element) {
                    // this.drawRenderables(renderContext, element);
                });
                frameBufferObject.deactive(gl);
            }
        };
        return ShadowRenderer;
    }());
    feng3d.ShadowRenderer = ShadowRenderer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 后处理效果
     * @author feng 2017-02-20
     */
    var PostEffect = (function () {
        function PostEffect() {
        }
        return PostEffect;
    }());
    feng3d.PostEffect = PostEffect;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 快速近似抗锯齿（Fast Approximate Anti-Aliasing）后处理效果
     * @author feng 2017-02-20
     *
     * @see
     * https://github.com/BabylonJS/Babylon.js/blob/master/src/Shaders/fxaa.fragment.fx
     * https://github.com/playcanvas/engine/blob/master/extras/posteffects/posteffect-fxaa.js
     */
    var FXAAEffect = (function () {
        function FXAAEffect() {
        }
        return FXAAEffect;
    }());
    feng3d.FXAAEffect = FXAAEffect;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * A class to access the Mesh of the mesh filter.
     * Use this with a procedural mesh interface. See Also: Mesh class.
     */
    var MeshFilter = (function (_super) {
        __extends(MeshFilter, _super);
        function MeshFilter() {
            var _this = _super.call(this) || this;
            _this.addRenderDataHolder(_this.mesh);
            return _this;
        }
        Object.defineProperty(MeshFilter.prototype, "mesh", {
            /**
             * Returns the instantiated Mesh assigned to the mesh filter.
             */
            get: function () {
                return this._mesh || feng3d.defaultGeometry;
            },
            set: function (value) {
                if (this._mesh == value)
                    return;
                if (this._mesh) {
                    this.removeRenderDataHolder(this.mesh);
                }
                this._mesh = value;
                this.addRenderDataHolder(this.mesh);
            },
            enumerable: true,
            configurable: true
        });
        return MeshFilter;
    }(feng3d.Component));
    feng3d.MeshFilter = MeshFilter;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Position, rotation and scale of an object.
     */
    var Object3D = (function (_super) {
        __extends(Object3D, _super);
        //------------------------------------------
        // Public Functions
        //------------------------------------------
        function Object3D() {
            var _this = _super.call(this) || this;
            //------------------------------------------
            // Protected Properties
            //------------------------------------------
            _this._matrix3d = new feng3d.Matrix3D();
            _this._scaleX = 1;
            _this._scaleY = 1;
            _this._scaleZ = 1;
            _this._x = 0;
            _this._y = 0;
            _this._z = 0;
            _this._pivotPoint = new feng3d.Vector3D();
            _this._pivotZero = true;
            _this._pos = new feng3d.Vector3D();
            _this._rot = new feng3d.Vector3D();
            _this._sca = new feng3d.Vector3D();
            _this._zOffset = 0;
            //------------------------------------------
            // Private Properties
            //------------------------------------------
            _this._smallestNumber = 0.0000000000000000000001;
            _this._transformDirty = true;
            _this._positionDirty = false;
            _this._rotationDirty = false;
            _this._scaleDirty = false;
            _this._rotationX = 0;
            _this._rotationY = 0;
            _this._rotationZ = 0;
            _this._eulers = new feng3d.Vector3D();
            _this._flipY = new feng3d.Matrix3D();
            _this._listenToPositionChanged = false;
            _this._listenToRotationChanged = false;
            _this._listenToScaleChanged = false;
            _this._position = new feng3d.Vector3D();
            tempAxeX = tempAxeX || new feng3d.Vector3D();
            tempAxeY = tempAxeY || new feng3d.Vector3D();
            tempAxeZ = tempAxeZ || new feng3d.Vector3D();
            _this._transformComponents = [];
            _this._transformComponents[0] = _this._pos;
            _this._transformComponents[1] = _this._rot;
            _this._transformComponents[2] = _this._sca;
            _this._matrix3d.identity();
            _this._flipY.appendScale(1, -1, 1);
            return _this;
        }
        Object.defineProperty(Object3D.prototype, "x", {
            //------------------------------------------
            // Variables
            //------------------------------------------
            get: function () {
                return this._x;
            },
            set: function (val) {
                if (this._x == val)
                    return;
                this._x = val;
                this.invalidatePosition();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "y", {
            get: function () {
                return this._y;
            },
            set: function (val) {
                if (this._y == val)
                    return;
                this._y = val;
                this.invalidatePosition();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "z", {
            get: function () {
                return this._z;
            },
            set: function (val) {
                if (this._z == val)
                    return;
                this._z = val;
                this.invalidatePosition();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "rotationX", {
            get: function () {
                return this._rotationX * Math.RAD2DEG;
            },
            set: function (val) {
                if (this.rotationX == val)
                    return;
                this._rotationX = val * Math.DEG2RAD;
                this.invalidateRotation();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "rotationY", {
            get: function () {
                return this._rotationY * Math.RAD2DEG;
            },
            set: function (val) {
                if (this.rotationY == val)
                    return;
                this._rotationY = val * Math.DEG2RAD;
                this.invalidateRotation();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "rotationZ", {
            get: function () {
                return this._rotationZ * Math.RAD2DEG;
            },
            set: function (val) {
                if (this.rotationZ == val)
                    return;
                this._rotationZ = val * Math.DEG2RAD;
                this.invalidateRotation();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "scaleX", {
            get: function () {
                return this._scaleX;
            },
            set: function (val) {
                if (this._scaleX == val)
                    return;
                this._scaleX = val;
                this.invalidateScale();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "scaleY", {
            get: function () {
                return this._scaleY;
            },
            set: function (val) {
                if (this._scaleY == val)
                    return;
                this._scaleY = val;
                this.invalidateScale();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "scaleZ", {
            get: function () {
                return this._scaleZ;
            },
            set: function (val) {
                if (this._scaleZ == val)
                    return;
                this._scaleZ = val;
                this.invalidateScale();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "eulers", {
            get: function () {
                this._eulers.x = this._rotationX * Math.RAD2DEG;
                this._eulers.y = this._rotationY * Math.RAD2DEG;
                this._eulers.z = this._rotationZ * Math.RAD2DEG;
                return this._eulers;
            },
            set: function (value) {
                this._rotationX = value.x * Math.DEG2RAD;
                this._rotationY = value.y * Math.DEG2RAD;
                this._rotationZ = value.z * Math.DEG2RAD;
                this.invalidateRotation();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "matrix3d", {
            /**
             * @private
             */
            get: function () {
                if (this._transformDirty)
                    this.updateMatrix3D();
                return this._matrix3d;
            },
            set: function (val) {
                var raw = feng3d.Matrix3D.RAW_DATA_CONTAINER;
                val.copyRawDataTo(raw);
                if (!raw[0]) {
                    raw[0] = this._smallestNumber;
                    val.copyRawDataFrom(raw);
                }
                var elements = val.decompose();
                var vec;
                vec = elements[0];
                if (this._x != vec.x || this._y != vec.y || this._z != vec.z) {
                    this._x = vec.x;
                    this._y = vec.y;
                    this._z = vec.z;
                    this.invalidatePosition();
                }
                vec = elements[1];
                if (this._rotationX != vec.x || this._rotationY != vec.y || this._rotationZ != vec.z) {
                    this._rotationX = vec.x;
                    this._rotationY = vec.y;
                    this._rotationZ = vec.z;
                    this.invalidateRotation();
                }
                vec = elements[2];
                if (this._scaleX != vec.x || this._scaleY != vec.y || this._scaleZ != vec.z) {
                    this._scaleX = vec.x;
                    this._scaleY = vec.y;
                    this._scaleZ = vec.z;
                    this.invalidateScale();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "pivotPoint", {
            get: function () {
                return this._pivotPoint;
            },
            set: function (pivot) {
                if (!this._pivotPoint)
                    this._pivotPoint = new feng3d.Vector3D();
                this._pivotPoint.x = pivot.x;
                this._pivotPoint.y = pivot.y;
                this._pivotPoint.z = pivot.z;
                this.invalidatePivot();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "position", {
            get: function () {
                this._position.setTo(this._x, this._y, this._z);
                return this._position;
            },
            set: function (value) {
                if (this._x != value.x || this._y != value.y || this._z != value.z) {
                    this._x = value.x;
                    this._y = value.y;
                    this._z = value.z;
                    this.invalidatePosition();
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "forwardVector", {
            get: function () {
                return this.matrix3d.forward;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "rightVector", {
            get: function () {
                return this.matrix3d.right;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "upVector", {
            get: function () {
                return this.matrix3d.up;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "backVector", {
            get: function () {
                var director = this.matrix3d.forward;
                director.negate();
                return director;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "leftVector", {
            get: function () {
                var director = this.matrix3d.left;
                director.negate();
                return director;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "downVector", {
            get: function () {
                var director = this.matrix3d.up;
                director.negate();
                return director;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Object3D.prototype, "zOffset", {
            get: function () {
                return this._zOffset;
            },
            set: function (value) {
                this._zOffset = value;
            },
            enumerable: true,
            configurable: true
        });
        Object3D.prototype.getPosition = function (position) {
            if (position === void 0) { position = null; }
            position = position || new feng3d.Vector3D();
            position.setTo(this._x, this._y, this._z);
            return position;
        };
        Object3D.prototype.setPosition = function (x, y, z) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (z === void 0) { z = 0; }
            if (this._x != x || this._y != y || this._z != z) {
                this._x = x;
                this._y = y;
                this._z = z;
                this.invalidatePosition();
            }
        };
        Object3D.prototype.getRotation = function (rotation) {
            if (rotation === void 0) { rotation = null; }
            rotation = rotation || new feng3d.Vector3D();
            rotation.setTo(this._rotationX, this._rotationY, this._rotationZ);
            rotation.scaleBy(Math.RAD2DEG);
            return rotation;
        };
        Object3D.prototype.setRotation = function (x, y, z) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (z === void 0) { z = 0; }
            x = x * Math.DEG2RAD;
            y = y * Math.DEG2RAD;
            z = z * Math.DEG2RAD;
            if (this._x != x || this._y != y || this._z != z) {
                this._x = x;
                this._y = y;
                this._z = z;
                this.invalidatePosition();
            }
        };
        Object3D.prototype.getScale = function (scale) {
            if (scale === void 0) { scale = null; }
            scale = scale || new feng3d.Vector3D();
            scale.setTo(this._scaleX, this._scaleY, this._scaleZ);
            return scale;
        };
        Object3D.prototype.setScale = function (x, y, z) {
            if (x === void 0) { x = 1; }
            if (y === void 0) { y = 1; }
            if (z === void 0) { z = 1; }
            if (this._scaleX != x || this._scaleY != y || this._scaleZ != z) {
                this._scaleX = x;
                this._scaleY = y;
                this._scaleZ = z;
                this.invalidateScale();
            }
        };
        Object3D.prototype.scale = function (value) {
            this._scaleX *= value;
            this._scaleY *= value;
            this._scaleZ *= value;
            this.invalidateScale();
        };
        Object3D.prototype.moveForward = function (distance) {
            this.translateLocal(feng3d.Vector3D.Z_AXIS, distance);
        };
        Object3D.prototype.moveBackward = function (distance) {
            this.translateLocal(feng3d.Vector3D.Z_AXIS, -distance);
        };
        Object3D.prototype.moveLeft = function (distance) {
            this.translateLocal(feng3d.Vector3D.X_AXIS, -distance);
        };
        Object3D.prototype.moveRight = function (distance) {
            this.translateLocal(feng3d.Vector3D.X_AXIS, distance);
        };
        Object3D.prototype.moveUp = function (distance) {
            this.translateLocal(feng3d.Vector3D.Y_AXIS, distance);
        };
        Object3D.prototype.moveDown = function (distance) {
            this.translateLocal(feng3d.Vector3D.Y_AXIS, -distance);
        };
        Object3D.prototype.moveTo = function (dx, dy, dz) {
            if (this._x == dx && this._y == dy && this._z == dz)
                return;
            this._x = dx;
            this._y = dy;
            this._z = dz;
            this.invalidatePosition();
        };
        Object3D.prototype.movePivot = function (dx, dy, dz) {
            if (!this._pivotPoint)
                this._pivotPoint = new feng3d.Vector3D();
            this._pivotPoint.x += dx;
            this._pivotPoint.y += dy;
            this._pivotPoint.z += dz;
            this.invalidatePivot();
        };
        Object3D.prototype.translate = function (axis, distance) {
            var x = axis.x, y = axis.y, z = axis.z;
            var len = distance / Math.sqrt(x * x + y * y + z * z);
            this._x += x * len;
            this._y += y * len;
            this._z += z * len;
            this.invalidatePosition();
        };
        Object3D.prototype.translateLocal = function (axis, distance) {
            var x = axis.x, y = axis.y, z = axis.z;
            var len = distance / Math.sqrt(x * x + y * y + z * z);
            this.matrix3d.prependTranslation(x * len, y * len, z * len);
            this._matrix3d.copyColumnTo(3, this._pos);
            this._x = this._pos.x;
            this._y = this._pos.y;
            this._z = this._pos.z;
            this.invalidatePosition();
        };
        Object3D.prototype.pitch = function (angle) {
            this.rotate(feng3d.Vector3D.X_AXIS, angle);
        };
        Object3D.prototype.yaw = function (angle) {
            this.rotate(feng3d.Vector3D.Y_AXIS, angle);
        };
        Object3D.prototype.roll = function (angle) {
            this.rotate(feng3d.Vector3D.Z_AXIS, angle);
        };
        Object3D.prototype.clone = function () {
            var clone = new Object3D();
            clone.pivotPoint = this.pivotPoint;
            clone.matrix3d = this.matrix3d;
            clone.name = this.name;
            return clone;
        };
        Object3D.prototype.rotateTo = function (ax, ay, az) {
            this._rotationX = ax * Math.DEG2RAD;
            this._rotationY = ay * Math.DEG2RAD;
            this._rotationZ = az * Math.DEG2RAD;
            this.invalidateRotation();
        };
        Object3D.prototype.rotate = function (axis, angle) {
            var m = new feng3d.Matrix3D();
            m.prependRotation(angle, axis);
            var vec = m.decompose()[1];
            this._rotationX += vec.x;
            this._rotationY += vec.y;
            this._rotationZ += vec.z;
            this.invalidateRotation();
        };
        Object3D.prototype.lookAt = function (target, upAxis) {
            if (upAxis === void 0) { upAxis = null; }
            var xAxis = tempAxeX;
            var yAxis = tempAxeY;
            var zAxis = tempAxeZ;
            var raw;
            upAxis = upAxis || feng3d.Vector3D.Y_AXIS;
            if (this._transformDirty) {
                this.updateMatrix3D();
            }
            zAxis.x = target.x - this._x;
            zAxis.y = target.y - this._y;
            zAxis.z = target.z - this._z;
            zAxis.normalize();
            xAxis.x = upAxis.y * zAxis.z - upAxis.z * zAxis.y;
            xAxis.y = upAxis.z * zAxis.x - upAxis.x * zAxis.z;
            xAxis.z = upAxis.x * zAxis.y - upAxis.y * zAxis.x;
            xAxis.normalize();
            if (xAxis.length < .05) {
                xAxis.x = upAxis.y;
                xAxis.y = upAxis.x;
                xAxis.z = 0;
                xAxis.normalize();
            }
            yAxis.x = zAxis.y * xAxis.z - zAxis.z * xAxis.y;
            yAxis.y = zAxis.z * xAxis.x - zAxis.x * xAxis.z;
            yAxis.z = zAxis.x * xAxis.y - zAxis.y * xAxis.x;
            raw = feng3d.Matrix3D.RAW_DATA_CONTAINER;
            raw[0] = this._scaleX * xAxis.x;
            raw[1] = this._scaleX * xAxis.y;
            raw[2] = this._scaleX * xAxis.z;
            raw[3] = 0;
            raw[4] = this._scaleY * yAxis.x;
            raw[5] = this._scaleY * yAxis.y;
            raw[6] = this._scaleY * yAxis.z;
            raw[7] = 0;
            raw[8] = this._scaleZ * zAxis.x;
            raw[9] = this._scaleZ * zAxis.y;
            raw[10] = this._scaleZ * zAxis.z;
            raw[11] = 0;
            raw[12] = this._x;
            raw[13] = this._y;
            raw[14] = this._z;
            raw[15] = 1;
            this._matrix3d.copyRawDataFrom(raw);
            this.matrix3d = this.matrix3d;
            if (zAxis.z < 0) {
                this.rotationY = (180 - this.rotationY);
                this.rotationX -= 180;
                this.rotationZ -= 180;
            }
        };
        Object3D.prototype.dispose = function () {
        };
        Object3D.prototype.disposeAsset = function () {
            this.dispose();
        };
        Object3D.prototype.invalidateTransform = function () {
            this._transformDirty = true;
        };
        Object3D.prototype.addEventListener = function (type, listener, thisObject, priority) {
            if (priority === void 0) { priority = 0; }
            _super.prototype.addEventListener.call(this, type, listener, thisObject, priority);
            switch (type) {
                case feng3d.Object3DEvent.POSITION_CHANGED:
                    this._listenToPositionChanged = true;
                    break;
                case feng3d.Object3DEvent.ROTATION_CHANGED:
                    this._listenToRotationChanged = true;
                    break;
                case feng3d.Object3DEvent.SCALE_CHANGED:
                    this._listenToRotationChanged = true;
                    break;
            }
        };
        Object3D.prototype.removeEventListener = function (type, listener, thisObject) {
            var _self__ = this;
            _super.prototype.removeEventListener.call(this, type, listener, thisObject);
            if (_self__.hasEventListener(type))
                return;
            switch (type) {
                case feng3d.Object3DEvent.POSITION_CHANGED:
                    this._listenToPositionChanged = false;
                    break;
                case feng3d.Object3DEvent.ROTATION_CHANGED:
                    this._listenToRotationChanged = false;
                    break;
                case feng3d.Object3DEvent.SCALE_CHANGED:
                    this._listenToScaleChanged = false;
                    break;
            }
        };
        //------------------------------------------
        // Protected Functions
        //------------------------------------------
        Object3D.prototype.updateMatrix3D = function () {
            this._pos.x = this._x;
            this._pos.y = this._y;
            this._pos.z = this._z;
            this._rot.x = this._rotationX;
            this._rot.y = this._rotationY;
            this._rot.z = this._rotationZ;
            if (!this._pivotZero) {
                this._sca.x = 1;
                this._sca.y = 1;
                this._sca.z = 1;
                this._matrix3d.recompose(this._transformComponents);
                this._matrix3d.appendTranslation(this._pivotPoint.x, this._pivotPoint.y, this._pivotPoint.z);
                this._matrix3d.prependTranslation(-this._pivotPoint.x, -this._pivotPoint.y, -this._pivotPoint.z);
                this._matrix3d.prependScale(this._scaleX, this._scaleY, this._scaleZ);
                this._sca.x = this._scaleX;
                this._sca.y = this._scaleY;
                this._sca.z = this._scaleZ;
            }
            else {
                this._sca.x = this._scaleX;
                this._sca.y = this._scaleY;
                this._sca.z = this._scaleZ;
                this._matrix3d.recompose(this._transformComponents);
            }
            this._transformDirty = false;
            this._positionDirty = false;
            this._rotationDirty = false;
            this._scaleDirty = false;
        };
        //------------------------------------------
        // Private Methods
        //------------------------------------------
        Object3D.prototype.invalidateRotation = function () {
            if (this._rotationDirty)
                return;
            this._rotationDirty = true;
            this.invalidateTransform();
            if (this._listenToRotationChanged)
                this.notifyRotationChanged();
        };
        Object3D.prototype.notifyRotationChanged = function () {
            var _self__ = this;
            if (!this._rotationChanged)
                this._rotationChanged = new feng3d.Object3DEvent(feng3d.Object3DEvent.ROTATION_CHANGED, this);
            _self__.dispatchEvent(this._rotationChanged);
        };
        Object3D.prototype.invalidateScale = function () {
            if (this._scaleDirty)
                return;
            this._scaleDirty = true;
            this.invalidateTransform();
            if (this._listenToScaleChanged)
                this.notifyScaleChanged();
        };
        Object3D.prototype.notifyScaleChanged = function () {
            var _self__ = this;
            if (!this._scaleChanged)
                this._scaleChanged = new feng3d.Object3DEvent(feng3d.Object3DEvent.SCALE_CHANGED, this);
            _self__.dispatchEvent(this._scaleChanged);
        };
        Object3D.prototype.invalidatePivot = function () {
            this._pivotZero = (this._pivotPoint.x == 0) && (this._pivotPoint.y == 0) && (this._pivotPoint.z == 0);
            this.invalidateTransform();
        };
        Object3D.prototype.invalidatePosition = function () {
            if (this._positionDirty)
                return;
            this._positionDirty = true;
            this.invalidateTransform();
            if (this._listenToPositionChanged)
                this.notifyPositionChanged();
        };
        Object3D.prototype.notifyPositionChanged = function () {
            var _self__ = this;
            if (!this._positionChanged)
                this._positionChanged = new feng3d.Object3DEvent(feng3d.Object3DEvent.POSITION_CHANGED, this);
            _self__.dispatchEvent(this._positionChanged);
        };
        return Object3D;
    }(feng3d.Component));
    feng3d.Object3D = Object3D;
    var tempAxeX;
    var tempAxeY;
    var tempAxeZ;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var ObjectContainer3D = (function (_super) {
        __extends(ObjectContainer3D, _super);
        //------------------------------------------
        // Public Functions
        //------------------------------------------
        function ObjectContainer3D() {
            var _this = _super.call(this) || this;
            //------------------------------------------
            // Variables
            //------------------------------------------
            _this._ancestorsAllowMouseEnabled = false;
            _this._isRoot = false;
            _this._sceneTransform = new feng3d.Matrix3D();
            _this._sceneTransformDirty = true;
            _this._mouseEnabled = false;
            _this._ignoreTransform = false;
            _this._children = [];
            _this._mouseChildren = true;
            _this._worldToLocalMatrix = new feng3d.Matrix3D();
            _this._worldToLocalMatrixDirty = true;
            _this._scenePosition = new feng3d.Vector3D();
            _this._scenePositionDirty = true;
            _this._explicitVisibility = true;
            _this._implicitVisibility = true;
            _this._listenToSceneTransformChanged = false;
            _this._listenToSceneChanged = false;
            return _this;
        }
        Object.defineProperty(ObjectContainer3D.prototype, "childCount", {
            get: function () {
                return this._children.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "ignoreTransform", {
            get: function () {
                return this._ignoreTransform;
            },
            set: function (value) {
                this._ignoreTransform = value;
                this._sceneTransformDirty = !value;
                this._worldToLocalMatrixDirty = !value;
                this._scenePositionDirty = !value;
                if (!value) {
                    this._sceneTransform.identity();
                    this._scenePosition.setTo(0, 0, 0);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "isVisible", {
            get: function () {
                return this._implicitVisibility && this._explicitVisibility;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "mouseEnabled", {
            get: function () {
                return this._mouseEnabled;
            },
            set: function (value) {
                this._mouseEnabled = value;
                this.updateMouseChildren();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "mouseChildren", {
            get: function () {
                return this._mouseChildren;
            },
            set: function (value) {
                this._mouseChildren = value;
                this.updateMouseChildren();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "visible", {
            get: function () {
                return this._explicitVisibility;
            },
            set: function (value) {
                var len = this._children.length;
                this._explicitVisibility = value;
                for (var i = 0; i < len; ++i)
                    this._children[i].updateImplicitVisibility();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "scenePosition", {
            get: function () {
                if (this._scenePositionDirty) {
                    this.localToWorldMatrix.copyColumnTo(3, this._scenePosition);
                    this._scenePositionDirty = false;
                }
                return this._scenePosition;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "minX", {
            get: function () {
                var i = 0;
                var len = this._children.length;
                var min = Number.POSITIVE_INFINITY;
                var m = 0;
                while (i < len) {
                    var child = this._children[i++];
                    m = child.minX + child.x;
                    if (m < min)
                        min = m;
                }
                return min;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "minY", {
            get: function () {
                var i = 0;
                var len = this._children.length;
                var min = Number.POSITIVE_INFINITY;
                var m = 0;
                while (i < len) {
                    var child = this._children[i++];
                    m = child.minY + child.y;
                    if (m < min)
                        min = m;
                }
                return min;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "minZ", {
            get: function () {
                var i = 0;
                var len = this._children.length;
                var min = Number.POSITIVE_INFINITY;
                var m = 0;
                while (i < len) {
                    var child = this._children[i++];
                    m = child.minZ + child.z;
                    if (m < min)
                        min = m;
                }
                return min;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "maxX", {
            get: function () {
                var i = 0;
                var len = this._children.length;
                var max = Number.NEGATIVE_INFINITY;
                var m = 0;
                while (i < len) {
                    var child = this._children[i++];
                    m = child.maxX + child.x;
                    if (m > max)
                        max = m;
                }
                return max;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "maxY", {
            get: function () {
                var i = 0;
                var len = this._children.length;
                var max = Number.NEGATIVE_INFINITY;
                var m = 0;
                while (i < len) {
                    var child = this._children[i++];
                    m = child.maxY + child.y;
                    if (m > max)
                        max = m;
                }
                return max;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "maxZ", {
            get: function () {
                var i = 0;
                var len = this._children.length;
                var max = Number.NEGATIVE_INFINITY;
                var m = 0;
                while (i < len) {
                    var child = this._children[i++];
                    m = child.maxZ + child.z;
                    if (m > max)
                        max = m;
                }
                return max;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "localToWorldMatrix", {
            /**
             * Matrix that transforms a point from local space into world space.
             */
            get: function () {
                if (this._sceneTransformDirty)
                    this.updateLocalToWorldMatrix();
                return this._sceneTransform;
            },
            set: function (value) {
                value = value.clone();
                this._parent && value.append(this._parent.worldToLocalMatrix);
                this.matrix3d = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "scene", {
            get: function () {
                return this._scene;
            },
            set: function (value) {
                var i = 0;
                var len = this._children.length;
                while (i < len)
                    this._children[i++].scene = value;
                if (this._scene == value)
                    return;
                if (value == null)
                    this._oldScene = this._scene;
                if (value)
                    this._oldScene = null;
                this._scene = value;
                if (this._scene)
                    this._scene.dispatchEvent(new feng3d.Scene3DEvent(feng3d.Scene3DEvent.ADDED_TO_SCENE, this));
                else if (this._oldScene)
                    this._oldScene.dispatchEvent(new feng3d.Scene3DEvent(feng3d.Scene3DEvent.REMOVED_FROM_SCENE, this));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "worldToLocalMatrix", {
            /**
             * Matrix that transforms a point from world space into local space (Read Only).
             */
            get: function () {
                if (this._worldToLocalMatrixDirty) {
                    this._worldToLocalMatrix.copyFrom(this.localToWorldMatrix);
                    this._worldToLocalMatrix.invert();
                    this._worldToLocalMatrixDirty = false;
                }
                return this._worldToLocalMatrix;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ObjectContainer3D.prototype, "parent", {
            get: function () {
                return this._parent;
            },
            enumerable: true,
            configurable: true
        });
        ObjectContainer3D.prototype.contains = function (child) {
            return this._children.indexOf(child) >= 0;
        };
        ObjectContainer3D.prototype.addChild = function (child) {
            if (child == null)
                throw new Error("Parameter child cannot be null.").message;
            if (child._parent)
                child._parent.removeChild(child);
            child.setParent(this);
            child.scene = this._scene;
            child.notifySceneTransformChange();
            child.updateMouseChildren();
            child.updateImplicitVisibility();
            this._children.push(child);
            return child;
        };
        ObjectContainer3D.prototype.addChildren = function () {
            var childarray = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                childarray[_i] = arguments[_i];
            }
            for (var child_key_a in childarray) {
                var child = childarray[child_key_a];
                this.addChild(child);
            }
        };
        ObjectContainer3D.prototype.setChildAt = function (child, index) {
            if (child == null)
                throw new Error("Parameter child cannot be null.").message;
            if (child._parent) {
                if (child._parent != this) {
                    child._parent.removeChild(child);
                }
                else {
                    var oldIndex = this._children.indexOf(child);
                    this._children.splice(oldIndex, 1);
                    this._children.splice(index, 0, child);
                }
            }
            else {
                child.setParent(this);
                child.scene = this._scene;
                child.notifySceneTransformChange();
                child.updateMouseChildren();
                child.updateImplicitVisibility();
                this._children[index] = child;
            }
        };
        ObjectContainer3D.prototype.removeChild = function (child) {
            if (child == null)
                throw new Error("Parameter child cannot be null").message;
            var childIndex = this._children.indexOf(child);
            if (childIndex == -1)
                throw new Error("Parameter is not a child of the caller").message;
            this.removeChildInternal(childIndex, child);
        };
        ObjectContainer3D.prototype.removeChildAt = function (index) {
            index = index;
            var child = this._children[index];
            this.removeChildInternal(index, child);
        };
        ObjectContainer3D.prototype.setParent = function (value) {
            this._parent = value;
            this.updateMouseChildren();
            if (value == null) {
                this.scene = null;
                return;
            }
            this.notifySceneTransformChange();
            this.notifySceneChange();
        };
        ObjectContainer3D.prototype.getChildAt = function (index) {
            index = index;
            return this._children[index];
        };
        ObjectContainer3D.prototype.lookAt = function (target, upAxis) {
            if (upAxis === void 0) { upAxis = null; }
            _super.prototype.lookAt.call(this, target, upAxis);
            this.notifySceneTransformChange();
        };
        ObjectContainer3D.prototype.translateLocal = function (axis, distance) {
            _super.prototype.translateLocal.call(this, axis, distance);
            this.notifySceneTransformChange();
        };
        ObjectContainer3D.prototype.dispose = function () {
            if (this.parent)
                this.parent.removeChild(this);
        };
        ObjectContainer3D.prototype.disposeWithChildren = function () {
            this.dispose();
            while (this.childCount > 0)
                this.getChildAt(0).dispose();
        };
        ObjectContainer3D.prototype.clone = function () {
            var clone = new ObjectContainer3D();
            clone.pivotPoint = this.pivotPoint;
            clone.matrix3d = this.matrix3d;
            clone.name = this.name;
            var len = this._children.length;
            for (var i = 0; i < len; ++i)
                clone.addChild(this._children[i].clone());
            return clone;
        };
        ObjectContainer3D.prototype.rotate = function (axis, angle) {
            _super.prototype.rotate.call(this, axis, angle);
            this.notifySceneTransformChange();
        };
        ObjectContainer3D.prototype.updateImplicitVisibility = function () {
            var len = this._children.length;
            this._implicitVisibility = this._parent._explicitVisibility && this._parent._implicitVisibility;
            for (var i = 0; i < len; ++i)
                this._children[i].updateImplicitVisibility();
        };
        ObjectContainer3D.prototype.addEventListener = function (type, listener, thisObject, priority) {
            if (priority === void 0) { priority = 0; }
            _super.prototype.addEventListener.call(this, type, listener, thisObject, priority);
            switch (type) {
                case feng3d.Object3DEvent.SCENETRANSFORM_CHANGED:
                    this._listenToSceneTransformChanged = true;
                    break;
                case feng3d.Object3DEvent.SCENE_CHANGED:
                    this._listenToSceneChanged = true;
                    break;
            }
        };
        ObjectContainer3D.prototype.removeEventListener = function (type, listener, thisObject) {
            var _self__ = this;
            _super.prototype.removeEventListener.call(this, type, listener, thisObject);
            if (_self__.hasEventListener(type))
                return;
            switch (type) {
                case feng3d.Object3DEvent.SCENETRANSFORM_CHANGED:
                    this._listenToSceneTransformChanged = false;
                    break;
                case feng3d.Object3DEvent.SCENE_CHANGED:
                    this._listenToSceneChanged = false;
                    break;
            }
        };
        /**
         * 获取子对象列表（备份）
         */
        ObjectContainer3D.prototype.getChildren = function () {
            return this._children.concat();
        };
        ObjectContainer3D.prototype.invalidateTransform = function () {
            _super.prototype.invalidateTransform.call(this);
            this.notifySceneTransformChange();
        };
        //------------------------------------------
        // Protected Functions
        //------------------------------------------
        ObjectContainer3D.prototype.updateMouseChildren = function () {
            if (this._parent && !this._parent._isRoot) {
                this._ancestorsAllowMouseEnabled = this.parent._ancestorsAllowMouseEnabled && this._parent.mouseChildren;
            }
            else
                this._ancestorsAllowMouseEnabled = this.mouseChildren;
            var len = this._children.length;
            for (var i = 0; i < len; ++i)
                this._children[i].updateMouseChildren();
        };
        ObjectContainer3D.prototype.invalidateSceneTransform = function () {
            this._sceneTransformDirty = !this._ignoreTransform;
            this._worldToLocalMatrixDirty = !this._ignoreTransform;
            this._scenePositionDirty = !this._ignoreTransform;
        };
        ObjectContainer3D.prototype.updateLocalToWorldMatrix = function () {
            if (this._parent && !this._parent._isRoot) {
                this._sceneTransform.copyFrom(this._parent.localToWorldMatrix);
                this._sceneTransform.prepend(this.matrix3d);
            }
            else
                this._sceneTransform.copyFrom(this.matrix3d);
            this._sceneTransformDirty = false;
        };
        //------------------------------------------
        // Private Methods
        //------------------------------------------
        ObjectContainer3D.prototype.notifySceneTransformChange = function () {
            if (this._sceneTransformDirty || this._ignoreTransform)
                return;
            this.invalidateSceneTransform();
            var i = 0;
            var len = this._children.length;
            while (i < len)
                this._children[i++].notifySceneTransformChange();
            if (this._listenToSceneTransformChanged) {
                if (!this._sceneTransformChanged)
                    this._sceneTransformChanged = new feng3d.Object3DEvent(feng3d.Object3DEvent.SCENETRANSFORM_CHANGED, this);
                this.dispatchEvent(this._sceneTransformChanged);
            }
        };
        ObjectContainer3D.prototype.notifySceneChange = function () {
            this.notifySceneTransformChange();
            var i = 0;
            var len = this._children.length;
            while (i < len)
                this._children[i++].notifySceneChange();
            if (this._listenToSceneChanged) {
                if (!this._scenechanged)
                    this._scenechanged = new feng3d.Object3DEvent(feng3d.Object3DEvent.SCENE_CHANGED, this);
                this.dispatchEvent(this._scenechanged);
            }
        };
        ObjectContainer3D.prototype.removeChildInternal = function (childIndex, child) {
            childIndex = childIndex;
            this._children.splice(childIndex, 1);
            child.setParent(null);
        };
        return ObjectContainer3D;
    }(feng3d.Object3D));
    feng3d.ObjectContainer3D = ObjectContainer3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Position, rotation and scale of an object.
     *
     * Every object in a scene has a Transform. It's used to store and manipulate the position, rotation and scale of the object. Every Transform can have a parent, which allows you to apply position, rotation and scale hierarchically. This is the hierarchy seen in the Hierarchy pane.
     */
    var Transform = (function (_super) {
        __extends(Transform, _super);
        /**
         * 创建一个实体，该类为虚类
         */
        function Transform() {
            var _this = _super.call(this) || this;
            _this._boundsInvalid = true;
            _this._worldBoundsInvalid = true;
            /**
             * 是否为公告牌（默认永远朝向摄像机），默认false。
             */
            _this.isBillboard = false;
            /**
             * 保持缩放尺寸
             */
            _this.holdSize = NaN;
            _this._updateEverytime = true;
            _this._bounds = _this.getDefaultBoundingVolume();
            _this._worldBounds = _this.getDefaultBoundingVolume();
            _this._bounds.addEventListener(feng3d.Event.CHANGE, _this.onBoundsChange, _this);
            //
            _this.createUniformData("u_modelMatrix", function () { return _this.localToWorldMatrix; });
            return _this;
        }
        /**
         * 更新渲染数据
         */
        Transform.prototype.updateRenderData = function (renderContext, renderData) {
            if (this.isBillboard) {
                var parentInverseSceneTransform = (this.parent && this.parent.worldToLocalMatrix) || new feng3d.Matrix3D();
                var cameraPos = parentInverseSceneTransform.transformVector(renderContext.camera.sceneTransform.position);
                var yAxis = parentInverseSceneTransform.deltaTransformVector(feng3d.Vector3D.Y_AXIS);
                this.lookAt(cameraPos, yAxis);
            }
            if (this.holdSize) {
                var depthScale = this.getDepthScale(renderContext);
                var vec = this.localToWorldMatrix.decompose();
                vec[2].setTo(depthScale, depthScale, depthScale);
                this.localToWorldMatrix.recompose(vec);
            }
            _super.prototype.updateRenderData.call(this, renderContext, renderData);
        };
        Transform.prototype.getDepthScale = function (renderContext) {
            var cameraTranform = renderContext.camera.sceneTransform;
            var distance = this.scenePosition.subtract(cameraTranform.position);
            var depth = distance.dotProduct(cameraTranform.forward);
            var scale = renderContext.view3D.getScaleByDepth(depth);
            return scale;
        };
        Object.defineProperty(Transform.prototype, "minX", {
            /**
             * @inheritDoc
             */
            get: function () {
                if (this._boundsInvalid)
                    this.updateBounds();
                return this._bounds.min.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "minY", {
            /**
             * @inheritDoc
             */
            get: function () {
                if (this._boundsInvalid)
                    this.updateBounds();
                return this._bounds.min.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "minZ", {
            /**
             * @inheritDoc
             */
            get: function () {
                if (this._boundsInvalid)
                    this.updateBounds();
                return this._bounds.min.z;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "maxX", {
            /**
             * @inheritDoc
             */
            get: function () {
                if (this._boundsInvalid)
                    this.updateBounds();
                return this._bounds.max.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "maxY", {
            /**
             * @inheritDoc
             */
            get: function () {
                if (this._boundsInvalid)
                    this.updateBounds();
                return this._bounds.max.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "maxZ", {
            /**
             * @inheritDoc
             */
            get: function () {
                if (this._boundsInvalid)
                    this.updateBounds();
                return this._bounds.max.z;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Transform.prototype, "bounds", {
            /**
             * 边界
             */
            get: function () {
                if (this._boundsInvalid)
                    this.updateBounds();
                return this._bounds;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * @inheritDoc
         */
        Transform.prototype.invalidateSceneTransform = function () {
            _super.prototype.invalidateSceneTransform.call(this);
            this._worldBoundsInvalid = true;
        };
        /**
         * 边界失效
         */
        Transform.prototype.invalidateBounds = function () {
            this._boundsInvalid = true;
        };
        /**
         * 获取默认边界（默认盒子边界）
         * @return
         */
        Transform.prototype.getDefaultBoundingVolume = function () {
            return new feng3d.AxisAlignedBoundingBox();
        };
        Object.defineProperty(Transform.prototype, "pickingCollisionVO", {
            /**
             * 获取碰撞数据
             */
            get: function () {
                if (!this._pickingCollisionVO)
                    this._pickingCollisionVO = new feng3d.PickingCollisionVO(this.gameObject);
                return this._pickingCollisionVO;
            },
            enumerable: true,
            configurable: true
        });
        /**
          * 判断射线是否穿过对象
          * @param ray3D
          * @return
          */
        Transform.prototype.isIntersectingRay = function (ray3D) {
            if (!this.pickingCollisionVO.localNormal)
                this.pickingCollisionVO.localNormal = new feng3d.Vector3D();
            //转换到当前实体坐标系空间
            var localRay = this.pickingCollisionVO.localRay;
            this.worldToLocalMatrix.transformVector(ray3D.position, localRay.position);
            this.worldToLocalMatrix.deltaTransformVector(ray3D.direction, localRay.direction);
            //检测射线与边界的碰撞
            var rayEntryDistance = this.bounds.rayIntersection(localRay, this.pickingCollisionVO.localNormal);
            if (rayEntryDistance < 0)
                return false;
            //保存碰撞数据
            this.pickingCollisionVO.rayEntryDistance = rayEntryDistance;
            this.pickingCollisionVO.ray3D = ray3D;
            this.pickingCollisionVO.rayOriginIsInsideBounds = rayEntryDistance == 0;
            return true;
        };
        Object.defineProperty(Transform.prototype, "worldBounds", {
            /**
             * 世界边界
             */
            get: function () {
                if (this._worldBoundsInvalid)
                    this.updateWorldBounds();
                return this._worldBounds;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 更新世界边界
         */
        Transform.prototype.updateWorldBounds = function () {
            this._worldBounds.transformFrom(this.bounds, this.localToWorldMatrix);
            this._worldBoundsInvalid = false;
        };
        /**
         * 处理包围盒变换事件
         */
        Transform.prototype.onBoundsChange = function () {
            this._worldBoundsInvalid = true;
        };
        /**
         * @inheritDoc
         */
        Transform.prototype.updateBounds = function () {
            var meshFilter = this.gameObject.getComponent(feng3d.MeshFilter);
            this._bounds.geometry = meshFilter.mesh;
            this._bounds.fromGeometry(meshFilter.mesh);
            this._boundsInvalid = false;
        };
        /**
         * 碰撞前设置碰撞状态
         * @param shortestCollisionDistance 最短碰撞距离
         * @param findClosest 是否寻找最优碰撞
         * @return
         */
        Transform.prototype.collidesBefore = function (pickingCollider, shortestCollisionDistance, findClosest) {
            pickingCollider.setLocalRay(this._pickingCollisionVO.localRay);
            this._pickingCollisionVO.renderable = null;
            var meshFilter = this.gameObject.getComponent(feng3d.MeshFilter);
            var model = meshFilter.mesh;
            if (pickingCollider.testSubMeshCollision(model, this._pickingCollisionVO, shortestCollisionDistance)) {
                shortestCollisionDistance = this._pickingCollisionVO.rayEntryDistance;
                this._pickingCollisionVO.renderable = model;
                if (!findClosest)
                    return true;
            }
            return this._pickingCollisionVO.renderable != null;
        };
        return Transform;
    }(feng3d.ObjectContainer3D));
    feng3d.Transform = Transform;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Base class for all entities in feng3d scenes.
     */
    var GameObject = (function (_super) {
        __extends(GameObject, _super);
        //------------------------------------------
        // Public Functions
        //------------------------------------------
        /**
         * 构建3D对象
         */
        function GameObject(name) {
            if (name === void 0) { name = "GameObject"; }
            var _this = _super.call(this) || this;
            /**
             * @private
             */
            _this.renderData = new feng3d.Object3DRenderAtomic();
            //------------------------------------------
            // Protected Properties
            //------------------------------------------
            /**
             * 组件列表
             */
            _this.components = [];
            _this.name = name;
            _this._transform = _this.addComponent(feng3d.Transform);
            //
            GameObject._gameObjects.push(_this);
            return _this;
        }
        Object.defineProperty(GameObject.prototype, "transform", {
            //------------------------------------------
            // Variables
            //------------------------------------------
            /**
             * The Transform attached to this GameObject. (null if there is none attached).
             */
            get: function () {
                return this._transform;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GameObject.prototype, "numComponents", {
            /**
             * 子组件个数
             */
            get: function () {
                return this.components.length;
            },
            enumerable: true,
            configurable: true
        });
        GameObject.prototype.updateRender = function (renderContext) {
            if (this.renderData.renderHolderInvalid) {
                this.renderData.clear();
                this.collectRenderDataHolder(this.renderData);
                this.renderData.renderHolderInvalid = false;
            }
            this.renderData.update(renderContext);
        };
        /**
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        GameObject.prototype.getComponentAt = function (index) {
            feng3d.debuger && feng3d.assert(index < this.numComponents, "给出索引超出范围");
            return this.components[index];
        };
        /**
         * 添加组件
         * Adds a component class named className to the game object.
         * @param param 被添加组件
         */
        GameObject.prototype.addComponent = function (param) {
            var component;
            if (this.getComponent(param)) {
                alert("The compnent " + component.constructor["name"] + " can't be added because " + this.name + " already contains the same component.");
                return;
            }
            component = new param();
            this.addComponentAt(component, this.components.length);
            return component;
        };
        /**
         * 判断是否拥有组件
         * @param com	被检测的组件
         * @return		true：拥有该组件；false：不拥有该组件。
         */
        GameObject.prototype.hasComponent = function (com) {
            return this.components.indexOf(com) != -1;
        };
        /**
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         * @param type				类定义
         * @return                  返回指定类型组件
         */
        GameObject.prototype.getComponent = function (type) {
            var component = this.getComponents(type)[0];
            return component;
        };
        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        GameObject.prototype.getComponents = function (type) {
            if (type === void 0) { type = null; }
            var filterResult;
            if (!type) {
                filterResult = this.components.concat();
            }
            else {
                filterResult = this.components.filter(function (value, index, array) {
                    return value instanceof type;
                });
            }
            return filterResult;
        };
        /**
         * 设置子组件的位置
         * @param component				子组件
         * @param index				位置索引
         */
        GameObject.prototype.setComponentIndex = function (component, index) {
            feng3d.debuger && feng3d.assert(index >= 0 && index < this.numComponents, "给出索引超出范围");
            var oldIndex = this.components.indexOf(component);
            feng3d.debuger && feng3d.assert(oldIndex >= 0 && oldIndex < this.numComponents, "子组件不在容器内");
            this.components.splice(oldIndex, 1);
            this.components.splice(index, 0, component);
        };
        /**
         * 设置组件到指定位置
         * @param component		被设置的组件
         * @param index			索引
         */
        GameObject.prototype.setComponentAt = function (component, index) {
            if (this.components[index]) {
                this.removeComponentAt(index);
            }
            this.addComponentAt(component, index);
        };
        /**
         * 移除组件
         * @param component 被移除组件
         */
        GameObject.prototype.removeComponent = function (component) {
            feng3d.debuger && feng3d.assert(this.hasComponent(component), "只能移除在容器中的组件");
            var index = this.getComponentIndex(component);
            this.removeComponentAt(index);
        };
        /**
         * 获取组件在容器的索引位置
         * @param component			查询的组件
         * @return				    组件在容器的索引位置
         */
        GameObject.prototype.getComponentIndex = function (component) {
            feng3d.debuger && feng3d.assert(this.components.indexOf(component) != -1, "组件不在容器中");
            var index = this.components.indexOf(component);
            return index;
        };
        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        GameObject.prototype.removeComponentAt = function (index) {
            feng3d.debuger && feng3d.assert(index >= 0 && index < this.numComponents, "给出索引超出范围");
            var component = this.components.splice(index, 1)[0];
            //派发移除组件事件
            component.dispatchEvent(new feng3d.ComponentEvent(feng3d.ComponentEvent.REMOVED_COMPONENT, { container: this, child: component }));
            this.dispatchEvent(new feng3d.ComponentEvent(feng3d.ComponentEvent.REMOVED_COMPONENT, { container: this, child: component }));
            this.removeRenderDataHolder(component);
            return component;
        };
        /**
         * 交换子组件位置
         * @param index1		第一个子组件的索引位置
         * @param index2		第二个子组件的索引位置
         */
        GameObject.prototype.swapComponentsAt = function (index1, index2) {
            feng3d.debuger && feng3d.assert(index1 >= 0 && index1 < this.numComponents, "第一个子组件的索引位置超出范围");
            feng3d.debuger && feng3d.assert(index2 >= 0 && index2 < this.numComponents, "第二个子组件的索引位置超出范围");
            var temp = this.components[index1];
            this.components[index1] = this.components[index2];
            this.components[index2] = temp;
        };
        /**
         * 交换子组件位置
         * @param a		第一个子组件
         * @param b		第二个子组件
         */
        GameObject.prototype.swapComponents = function (a, b) {
            feng3d.debuger && feng3d.assert(this.hasComponent(a), "第一个子组件不在容器中");
            feng3d.debuger && feng3d.assert(this.hasComponent(b), "第二个子组件不在容器中");
            this.swapComponentsAt(this.getComponentIndex(a), this.getComponentIndex(b));
        };
        /**
         * 移除指定类型组件
         * @param type 组件类型
         */
        GameObject.prototype.removeComponentsByType = function (type) {
            var removeComponents = [];
            for (var i = this.components.length - 1; i >= 0; i--) {
                if (this.components[i].constructor == type)
                    removeComponents.push(this.removeComponentAt(i));
            }
            return removeComponents;
        };
        /**
         * Finds a game object by name and returns it.
         * @param name
         */
        GameObject.find = function (name) {
            for (var i = 0; i < this._gameObjects.length; i++) {
                var element = this._gameObjects[i];
                if (element.name == name)
                    return element;
            }
        };
        //------------------------------------------
        // Protected Functions
        //------------------------------------------
        //------------------------------------------
        // Private Properties
        //------------------------------------------
        //------------------------------------------
        // Private Methods
        //------------------------------------------
        /**
         * 添加组件到指定位置
         * @param component		被添加的组件
         * @param index			插入的位置
         */
        GameObject.prototype.addComponentAt = function (component, index) {
            feng3d.debuger && feng3d.assert(index >= 0 && index <= this.numComponents, "给出索引超出范围");
            if (this.hasComponent(component)) {
                index = Math.min(index, this.components.length - 1);
                this.setComponentIndex(component, index);
                return;
            }
            //组件唯一时移除同类型的组件
            if (component.single)
                this.removeComponentsByType(component.constructor);
            this.components.splice(index, 0, component);
            //派发添加组件事件
            component.dispatchEvent(new feng3d.ComponentEvent(feng3d.ComponentEvent.ADDED_COMPONENT, { container: this, child: component }));
            this.dispatchEvent(new feng3d.ComponentEvent(feng3d.ComponentEvent.ADDED_COMPONENT, { container: this, child: component }));
            this.addRenderDataHolder(component);
        };
        return GameObject;
    }(feng3d.Feng3dObject));
    //------------------------------------------
    // Static Functions
    //------------------------------------------
    GameObject._gameObjects = [];
    feng3d.GameObject = GameObject;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    var View3D = (function () {
        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        function View3D(canvas, scene, camera, autoRender) {
            if (canvas === void 0) { canvas = null; }
            if (scene === void 0) { scene = null; }
            if (camera === void 0) { camera = null; }
            if (autoRender === void 0) { autoRender = true; }
            /**
             * 鼠标在3D视图中的位置
             */
            this.mousePos = new feng3d.Point();
            //初始化引擎
            feng3d.initEngine();
            if (!canvas) {
                canvas = document.createElement("canvas");
                canvas.id = "glcanvas";
                canvas.style.width = "100%";
                canvas.style.height = "100%";
                document.body.appendChild(canvas);
            }
            feng3d.debuger && feng3d.assert(canvas instanceof HTMLCanvasElement, "canvas\u53C2\u6570\u5FC5\u987B\u4E3A HTMLCanvasElement \u7C7B\u578B\uFF01");
            this._canvas = canvas;
            var glProxy = new feng3d.GLProxy(canvas);
            this._gl = glProxy.gl;
            this.initGL();
            this._viewRect = new feng3d.Rectangle(this._canvas.clientLeft, this._canvas.clientTop, this._canvas.clientWidth, this._canvas.clientHeight);
            this.scene = scene || new feng3d.Scene3D();
            this.camera = camera || new feng3d.CameraObject3D();
            this.autoRender = autoRender;
            this.defaultRenderer = new feng3d.ForwardRenderer();
            this.mouse3DManager = new feng3d.Mouse3DManager();
            this.shadowRenderer = new feng3d.ShadowRenderer();
            this._renderContext = new feng3d.RenderContext();
            feng3d.input.addEventListener(feng3d.inputType.MOUSE_MOVE, this.onMouseEvent, this);
        }
        Object.defineProperty(View3D.prototype, "autoRender", {
            /**
             * 是否自动渲染
             */
            get: function () {
                return this._autoRender;
            },
            set: function (value) {
                if (this._autoRender)
                    feng3d.ticker.removeEventListener(feng3d.Event.ENTER_FRAME, this.render, this);
                this._autoRender = value;
                if (this._autoRender)
                    feng3d.ticker.addEventListener(feng3d.Event.ENTER_FRAME, this.render, this);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 初始化GL
         */
        View3D.prototype.initGL = function () {
            this._gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
            this._gl.clearDepth(1.0); // Clear everything
            this._gl.enable(feng3d.GL.DEPTH_TEST); // Enable depth testing
            this._gl.depthFunc(feng3d.GL.LEQUAL); // Near things obscure far things
        };
        Object.defineProperty(View3D.prototype, "scene", {
            /** 3d场景 */
            get: function () {
                return this._scene;
            },
            set: function (value) {
                this._scene = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(View3D.prototype, "width", {
            /**
             * 视窗宽度
             */
            get: function () {
                return this._canvas.width;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 绘制场景
         */
        View3D.prototype.render = function () {
            this._canvas.width = this._canvas.clientWidth;
            this._canvas.height = this._canvas.clientHeight;
            this._renderContext.camera = this._camera.camera;
            this._renderContext.scene3d = this._scene;
            this._renderContext.view3D = this;
            this._renderContext.gl = this._gl;
            var viewClientRect = this._canvas.getBoundingClientRect();
            var viewRect = this._viewRect = this._viewRect || new feng3d.Rectangle();
            viewRect.setTo(viewClientRect.left, viewClientRect.top, viewClientRect.width, viewClientRect.height);
            this.camera.camera.lens.aspectRatio = viewRect.width / viewRect.height;
            //鼠标拾取渲染
            this.mouse3DManager.viewRect.copyFrom(viewRect);
            this.mouse3DManager.draw(this._renderContext);
            //绘制阴影图
            // this.shadowRenderer.draw(this._gl, this._scene, this._camera.camera);
            // 默认渲染
            this.defaultRenderer.viewRect.copyFrom(viewRect);
            this.defaultRenderer.draw(this._renderContext);
        };
        Object.defineProperty(View3D.prototype, "camera", {
            /**
             * 摄像机
             */
            get: function () {
                return this._camera;
            },
            set: function (value) {
                this._camera = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 监听鼠标事件收集事件类型
         */
        View3D.prototype.onMouseEvent = function (event) {
            this.mousePos.setTo(event.clientX - this._viewRect.x, event.clientY - this._viewRect.y);
        };
        /**
         * 获取鼠标射线（与鼠标重叠的摄像机射线）
         */
        View3D.prototype.getMouseRay3D = function () {
            var pos = this.mousePos;
            return this.getRay3D(pos.x, pos.y);
        };
        /**
         * 获取与坐标重叠的射线
         * @param x view3D上的X坐标
         * @param y view3D上的X坐标
         * @return
         */
        View3D.prototype.getRay3D = function (x, y, ray3D) {
            if (ray3D === void 0) { ray3D = null; }
            //摄像机坐标
            var rayPosition = this.unproject(x, y, 0, View3D.tempRayPosition);
            //摄像机前方1处坐标
            var rayDirection = this.unproject(x, y, 1, View3D.tempRayDirection);
            //射线方向
            rayDirection.x = rayDirection.x - rayPosition.x;
            rayDirection.y = rayDirection.y - rayPosition.y;
            rayDirection.z = rayDirection.z - rayPosition.z;
            rayDirection.normalize();
            //定义射线
            ray3D = ray3D || new feng3d.Ray3D(rayPosition, rayDirection);
            return ray3D;
        };
        /**
         * 投影坐标（世界坐标转换为3D视图坐标）
         * @param point3d 世界坐标
         * @return 屏幕的绝对坐标
         */
        View3D.prototype.project = function (point3d) {
            var v = this._camera.camera.project(point3d);
            v.x = (v.x + 1.0) * this._canvas.width / 2.0;
            v.y = (v.y + 1.0) * this._canvas.height / 2.0;
            return v;
        };
        /**
         * 屏幕坐标投影到场景坐标
         * @param nX 屏幕坐标X ([0-width])
         * @param nY 屏幕坐标Y ([0-height])
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        View3D.prototype.unproject = function (sX, sY, sZ, v) {
            if (v === void 0) { v = null; }
            var gpuPos = this.screenToGpuPosition(new feng3d.Point(sX, sY));
            return this._camera.camera.unproject(gpuPos.x, gpuPos.y, sZ, v);
        };
        /**
         * 屏幕坐标转GPU坐标
         * @param screenPos 屏幕坐标 (x:[0-width],y:[0-height])
         * @return GPU坐标 (x:[-1,1],y:[-1-1])
         */
        View3D.prototype.screenToGpuPosition = function (screenPos) {
            var gpuPos = new feng3d.Point();
            gpuPos.x = (screenPos.x * 2 - this._canvas.width) / this._canvas.width;
            gpuPos.y = (screenPos.y * 2 - this._canvas.height) / this._canvas.height;
            return gpuPos;
        };
        /**
         * 获取单位像素在指定深度映射的大小
         * @param   depth   深度
         */
        View3D.prototype.getScaleByDepth = function (depth) {
            var centerX = this._viewRect.width / 2;
            var centerY = this._viewRect.height / 2;
            var lt = this.unproject(centerX - 0.5, centerY - 0.5, depth);
            var rb = this.unproject(centerX + 0.5, centerY + 0.5, depth);
            var scale = lt.subtract(rb).length;
            return scale;
        };
        return View3D;
    }());
    /**
     * 射线坐标临时变量
     */
    View3D.tempRayPosition = new feng3d.Vector3D();
    /**
     * 射线方向临时变量
     */
    View3D.tempRayDirection = new feng3d.Vector3D();
    feng3d.View3D = View3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D对象事件
     */
    var Object3DEvent = (function (_super) {
        __extends(Object3DEvent, _super);
        /**
         * 创建一个作为参数传递给事件侦听器的 Event 对象。
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        function Object3DEvent(type, data, bubbles) {
            if (data === void 0) { data = null; }
            if (bubbles === void 0) { bubbles = false; }
            var _this = _super.call(this, type, data, bubbles) || this;
            _this.object = data;
            return _this;
        }
        return Object3DEvent;
    }(feng3d.Event));
    Object3DEvent.VISIBLITY_UPDATED = "visiblityUpdated";
    Object3DEvent.SCENETRANSFORM_CHANGED = "scenetransformChanged";
    Object3DEvent.SCENE_CHANGED = "sceneChanged";
    Object3DEvent.POSITION_CHANGED = "positionChanged";
    Object3DEvent.ROTATION_CHANGED = "rotationChanged";
    Object3DEvent.SCALE_CHANGED = "scaleChanged";
    /**
     * 添加了子对象，当child被添加到parent中时派发冒泡事件
     */
    Object3DEvent.ADDED = "added";
    /**
     * 删除了子对象，当child被parent移除时派发冒泡事件
     */
    Object3DEvent.REMOVED = "removed";
    feng3d.Object3DEvent = Object3DEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Renders meshes inserted by the MeshFilter or TextMesh.
     */
    var MeshRenderer = (function (_super) {
        __extends(MeshRenderer, _super);
        /**
         * 构建
         */
        function MeshRenderer() {
            var _this = _super.call(this) || this;
            _this._single = true;
            MeshRenderer._meshRenderers.push(_this);
            return _this;
        }
        Object.defineProperty(MeshRenderer, "meshRenderers", {
            get: function () {
                return this._meshRenderers;
            },
            enumerable: true,
            configurable: true
        });
        MeshRenderer.prototype.drawRenderables = function (renderContext) {
            if (this.gameObject.transform.isVisible) {
                var frustumPlanes = renderContext.camera.frustumPlanes;
                var gameObject = this.gameObject;
                var isIn = gameObject.transform.worldBounds.isInFrustum(frustumPlanes, 6);
                var model = gameObject.getComponent(MeshRenderer);
                if (gameObject.getComponent(feng3d.MeshFilter).mesh instanceof feng3d.SkyBoxGeometry) {
                    isIn = true;
                }
                if (isIn) {
                    _super.prototype.drawRenderables.call(this, renderContext);
                }
            }
        };
        return MeshRenderer;
    }(feng3d.Renderer));
    MeshRenderer._meshRenderers = [];
    feng3d.MeshRenderer = MeshRenderer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3d对象脚本
     * @author feng 2017-03-11
     */
    var Object3dScript = (function (_super) {
        __extends(Object3dScript, _super);
        function Object3dScript() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            /**
             * 脚本路径
             */
            _this.script = "";
            return _this;
        }
        return Object3dScript;
    }(feng3d.Component));
    feng3d.Object3dScript = Object3dScript;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D场景
     * @author feng 2016-05-01
     */
    var Scene3D = (function (_super) {
        __extends(Scene3D, _super);
        /**
         * 构造3D场景
         */
        function Scene3D() {
            var _this = _super.call(this) || this;
            /**
             * 背景颜色
             */
            _this.background = new feng3d.Color(0, 0, 0, 1);
            /**
             * 环境光强度
             */
            _this.ambientColor = new feng3d.Color();
            _this._scene = _this;
            _this._isRoot = true;
            return _this;
        }
        return Scene3D;
    }(feng3d.Transform));
    feng3d.Scene3D = Scene3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D场景事件
     * @author feng 2016-01-03
     */
    var Scene3DEvent = (function (_super) {
        __extends(Scene3DEvent, _super);
        /**
         * 创建一个作为参数传递给事件侦听器的 Event 对象。
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        function Scene3DEvent(type, data, bubbles) {
            if (data === void 0) { data = null; }
            if (bubbles === void 0) { bubbles = false; }
            return _super.call(this, type, data, bubbles) || this;
        }
        return Scene3DEvent;
    }(feng3d.Event));
    /**
     * 当Object3D的scene属性被设置是由Scene3D派发
     */
    Scene3DEvent.ADDED_TO_SCENE = "addedToScene";
    /**
     * 当Object3D的scene属性被清空时由Scene3D派发
     */
    Scene3DEvent.REMOVED_FROM_SCENE = "removedFromScene";
    feng3d.Scene3DEvent = Scene3DEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 几何体
     * @author feng 2016-04-28
     */
    var Geometry = (function (_super) {
        __extends(Geometry, _super);
        /**
         * 创建一个几何体
         */
        function Geometry() {
            var _this = _super.call(this) || this;
            /**
             * 属性数据列表
             */
            _this._attributes = {};
            _this._geometryInvalid = true;
            _this._useFaceWeights = false;
            _this._scaleU = 1;
            _this._scaleV = 1;
            _this._single = true;
            return _this;
        }
        Object.defineProperty(Geometry.prototype, "positions", {
            /**
             * 坐标数据
             */
            get: function () {
                return this.getVAData1("a_position");
            },
            set: function (value) {
                this.setVAData("a_position", value, 3);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Geometry.prototype, "uvs", {
            /**
             * uv数据
             */
            get: function () {
                return this.getVAData1("a_uv");
            },
            set: function (value) {
                this.setVAData("a_uv", value, 2);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Geometry.prototype, "normals", {
            /**
             * 法线数据
             */
            get: function () {
                return this.getVAData1("a_normal");
            },
            set: function (value) {
                this.setVAData("a_normal", value, 3);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Geometry.prototype, "tangents", {
            /**
             * 切线数据
             */
            get: function () {
                return this.getVAData1("a_tangent");
            },
            set: function (value) {
                this.setVAData("a_tangent", value, 3);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 更新渲染数据
         */
        Geometry.prototype.updateRenderData = function (renderContext, renderData) {
            this.updateGrometry();
            _super.prototype.updateRenderData.call(this, renderContext, renderData);
        };
        /**
         * 几何体变脏
         */
        Geometry.prototype.invalidateGeometry = function () {
            this._geometryInvalid = true;
        };
        /**
         * 更新几何体
         */
        Geometry.prototype.updateGrometry = function () {
            if (this._geometryInvalid) {
                this.buildGeometry();
                this._geometryInvalid = false;
                this.invalidateBounds();
            }
        };
        /**
         * 构建几何体
         */
        Geometry.prototype.buildGeometry = function () {
        };
        Object.defineProperty(Geometry.prototype, "indices", {
            /**
             * 索引数据
             */
            get: function () {
                return this._indexBuffer && this._indexBuffer.indices;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 更新顶点索引数据
         */
        Geometry.prototype.setIndices = function (indices) {
            this._indexBuffer = this.createIndexBuffer(indices);
            this.dispatchEvent(new feng3d.GeometryEvent(feng3d.GeometryEvent.CHANGED_INDEX_DATA));
        };
        /**
         * 获取顶点数据
         */
        Geometry.prototype.getIndexData = function () {
            return this._indexBuffer;
        };
        /**
         * 设置顶点属性数据
         * @param vaId          顶点属性编号
         * @param data          顶点属性数据
         * @param size          顶点数据尺寸
         */
        Geometry.prototype.setVAData = function (vaId, data, size) {
            if (data) {
                if (!this._attributes[vaId])
                    this._attributes[vaId] = this.createAttributeRenderData(vaId, data, size);
                this._attributes[vaId].data = data;
            }
            else {
                delete this._attributes[vaId];
            }
            this.dispatchEvent(new feng3d.GeometryEvent(feng3d.GeometryEvent.CHANGED_VA_DATA, vaId));
        };
        /**
         * 获取顶点属性数据
         * @param vaId 数据类型编号
         * @return 顶点属性数据
         */
        Geometry.prototype.getVAData = function (vaId) {
            this.updateGrometry();
            this.dispatchEvent(new feng3d.GeometryEvent(feng3d.GeometryEvent.GET_VA_DATA, vaId));
            return this._attributes[vaId];
        };
        /**
         * 获取顶点属性数据
         * @param vaId 数据类型编号
         * @return 顶点属性数据
         */
        Geometry.prototype.getVAData1 = function (vaId) {
            var attributeRenderData = this.getVAData(vaId);
            return attributeRenderData && attributeRenderData.data;
        };
        Object.defineProperty(Geometry.prototype, "numVertex", {
            /**
             * 顶点数量
             */
            get: function () {
                var numVertex = 0;
                for (var attributeName in this._attributes) {
                    var attributeRenderData = this._attributes[attributeName];
                    numVertex = attributeRenderData.data.length / attributeRenderData.size;
                    break;
                }
                return numVertex;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 添加几何体
         * @param geometry          被添加的几何体
         * @param transform         变换矩阵，把克隆被添加几何体的数据变换后再添加到该几何体中
         */
        Geometry.prototype.addGeometry = function (geometry, transform) {
            if (transform === void 0) { transform = null; }
            //更新几何体
            this.updateGrometry();
            geometry.updateGrometry();
            //变换被添加的几何体
            if (transform != null) {
                geometry = geometry.clone();
                geometry.applyTransformation(transform);
            }
            //如果自身为空几何体
            if (!this._indexBuffer) {
                this.cloneFrom(geometry);
                return;
            }
            //
            var attributes = this._attributes;
            var addAttributes = geometry._attributes;
            //当前顶点数量
            var oldNumVertex = this.numVertex;
            //合并索引
            var indices = this._indexBuffer.indices;
            var targetIndices = geometry._indexBuffer.indices;
            var totalIndices = new Uint16Array(indices.length + targetIndices.length);
            totalIndices.set(indices, 0);
            for (var i = 0; i < targetIndices.length; i++) {
                totalIndices[indices.length + i] = targetIndices[i] + oldNumVertex;
            }
            this.setIndices(totalIndices);
            //合并后顶点数量
            var totalVertex = oldNumVertex + geometry.numVertex;
            //合并属性数据
            for (var attributeName in attributes) {
                var stride = attributes[attributeName].size;
                var data = new Float32Array(totalVertex * stride);
                data.set(attributes[attributeName].data, 0);
                data.set(addAttributes[attributeName].data, oldNumVertex * stride);
                this.setVAData(attributeName, data, stride);
            }
        };
        /**
         * 应用变换矩阵
         * @param transform 变换矩阵
         */
        Geometry.prototype.applyTransformation = function (transform) {
            this.updateGrometry();
            var positionRenderData = this.getVAData("a_position");
            var normalRenderData = this.getVAData("a_normal");
            var tangentRenderData = this.getVAData("a_tangent");
            var vertices = positionRenderData.data;
            var normals = normalRenderData.data;
            var tangents = tangentRenderData.data;
            var posStride = positionRenderData.size;
            var normalStride = normalRenderData.size;
            var tangentStride = tangentRenderData.size;
            var len = vertices.length / posStride;
            var i, i1, i2;
            var vector = new feng3d.Vector3D();
            var bakeNormals = normals != null;
            var bakeTangents = tangents != null;
            var invTranspose;
            if (bakeNormals || bakeTangents) {
                invTranspose = transform.clone();
                invTranspose.invert();
                invTranspose.transpose();
            }
            var vi0 = 0;
            var ni0 = 0;
            var ti0 = 0;
            for (i = 0; i < len; ++i) {
                i1 = vi0 + 1;
                i2 = vi0 + 2;
                // bake position
                vector.x = vertices[vi0];
                vector.y = vertices[i1];
                vector.z = vertices[i2];
                vector = transform.transformVector(vector);
                vertices[vi0] = vector.x;
                vertices[i1] = vector.y;
                vertices[i2] = vector.z;
                vi0 += posStride;
                // bake normal
                if (bakeNormals) {
                    i1 = ni0 + 1;
                    i2 = ni0 + 2;
                    vector.x = normals[ni0];
                    vector.y = normals[i1];
                    vector.z = normals[i2];
                    vector = invTranspose.deltaTransformVector(vector);
                    vector.normalize();
                    normals[ni0] = vector.x;
                    normals[i1] = vector.y;
                    normals[i2] = vector.z;
                    ni0 += normalStride;
                }
                // bake tangent
                if (bakeTangents) {
                    i1 = ti0 + 1;
                    i2 = ti0 + 2;
                    vector.x = tangents[ti0];
                    vector.y = tangents[i1];
                    vector.z = tangents[i2];
                    vector = invTranspose.deltaTransformVector(vector);
                    vector.normalize();
                    tangents[ti0] = vector.x;
                    tangents[i1] = vector.y;
                    tangents[i2] = vector.z;
                    ti0 += tangentStride;
                }
            }
            positionRenderData.invalidate();
            normalRenderData.invalidate();
            normalRenderData.invalidate();
        };
        Object.defineProperty(Geometry.prototype, "scaleU", {
            /**
             * 纹理U缩放，默认为1。
             */
            get: function () {
                return this._scaleU;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Geometry.prototype, "scaleV", {
            /**
             * 纹理V缩放，默认为1。
             */
            get: function () {
                return this._scaleV;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 缩放UV
         * @param scaleU 纹理U缩放，默认1。
         * @param scaleV 纹理V缩放，默认1。
         */
        Geometry.prototype.scaleUV = function (scaleU, scaleV) {
            if (scaleU === void 0) { scaleU = 1; }
            if (scaleV === void 0) { scaleV = 1; }
            this.updateGrometry();
            var uvVaData = this.getVAData("a_uv");
            var uvs = uvVaData.data;
            var len = uvs.length;
            var ratioU = scaleU / this._scaleU;
            var ratioV = scaleV / this._scaleV;
            for (var i = 0; i < len; i += 2) {
                uvs[i] *= ratioU;
                uvs[i + 1] *= ratioV;
            }
            this._scaleU = scaleU;
            this._scaleV = scaleV;
            uvVaData.invalidate();
        };
        /**
         * 包围盒失效
         */
        Geometry.prototype.invalidateBounds = function () {
            this.dispatchEvent(new feng3d.GeometryEvent(feng3d.GeometryEvent.BOUNDS_INVALID));
        };
        /**
         * 创建顶点法线
         */
        Geometry.prototype.createVertexNormals = function () {
            //生成法线
            var normals = feng3d.GeometryUtils.createVertexNormals(this.indices, this.positions, this._useFaceWeights);
            this.normals = new Float32Array(normals);
        };
        /**
         * 创建顶点切线
         */
        Geometry.prototype.createVertexTangents = function () {
            //生成切线
            var tangents = feng3d.GeometryUtils.createVertexTangents(this.indices, this.positions, this.uvs, this._useFaceWeights);
            this.tangents = new Float32Array(tangents);
        };
        /**
         * 克隆一个几何体
         */
        Geometry.prototype.clone = function () {
            var geometry = new Geometry();
            geometry.cloneFrom(this);
            return geometry;
        };
        /**
         * 从一个几何体中克隆数据
         */
        Geometry.prototype.cloneFrom = function (geometry) {
            geometry.updateGrometry();
            this._indexBuffer = geometry._indexBuffer.clone();
            this._attributes = {};
            for (var key in geometry._attributes) {
                var attributeRenderData = geometry._attributes[key];
                this.setVAData(key, attributeRenderData.data, attributeRenderData.size);
            }
        };
        return Geometry;
    }(feng3d.Component));
    feng3d.Geometry = Geometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 几何体事件
     * @author feng 2015-12-8
     */
    var GeometryEvent = (function (_super) {
        __extends(GeometryEvent, _super);
        /**
         * 构建几何体事件
         */
        function GeometryEvent(type, data, bubbles) {
            if (data === void 0) { data = null; }
            if (bubbles === void 0) { bubbles = false; }
            return _super.call(this, type, data, bubbles) || this;
        }
        return GeometryEvent;
    }(feng3d.Event));
    /**
     * 获取几何体顶点数据
     */
    GeometryEvent.GET_VA_DATA = "getVAData";
    /**
     * 改变几何体顶点数据事件
     */
    GeometryEvent.CHANGED_VA_DATA = "changedVAData";
    /**
     * 改变顶点索引数据事件
     */
    GeometryEvent.CHANGED_INDEX_DATA = "changedIndexData";
    /**
     * 包围盒失效
     */
    GeometryEvent.BOUNDS_INVALID = "boundsInvalid";
    feng3d.GeometryEvent = GeometryEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var GeometryUtils = (function () {
        function GeometryUtils() {
        }
        GeometryUtils.createFaceNormals = function (indices, positions, useFaceWeights) {
            if (useFaceWeights === void 0) { useFaceWeights = false; }
            var i = 0, j = 0, k = 0;
            var index = 0;
            var len = indices.length;
            var x1 = 0, x2 = 0, x3 = 0;
            var y1 = 0, y2 = 0, y3 = 0;
            var z1 = 0, z2 = 0, z3 = 0;
            var dx1 = 0, dy1 = 0, dz1 = 0;
            var dx2 = 0, dy2 = 0, dz2 = 0;
            var cx = 0, cy = 0, cz = 0;
            var d = 0;
            var posStride = 3;
            var faceNormals = new Array(len);
            if (useFaceWeights)
                var faceWeights = new Array(len / 3);
            while (i < len) {
                index = indices[i++] * posStride;
                x1 = positions[index];
                y1 = positions[index + 1];
                z1 = positions[index + 2];
                index = indices[i++] * posStride;
                x2 = positions[index];
                y2 = positions[index + 1];
                z2 = positions[index + 2];
                index = indices[i++] * posStride;
                x3 = positions[index];
                y3 = positions[index + 1];
                z3 = positions[index + 2];
                dx1 = x3 - x1;
                dy1 = y3 - y1;
                dz1 = z3 - z1;
                dx2 = x2 - x1;
                dy2 = y2 - y1;
                dz2 = z2 - z1;
                cx = dz1 * dy2 - dy1 * dz2;
                cy = dx1 * dz2 - dz1 * dx2;
                cz = dy1 * dx2 - dx1 * dy2;
                d = Math.sqrt(cx * cx + cy * cy + cz * cz);
                if (useFaceWeights) {
                    var w = d * 10000;
                    if (w < 1)
                        w = 1;
                    faceWeights[k++] = w;
                }
                d = 1 / d;
                faceNormals[j++] = cx * d;
                faceNormals[j++] = cy * d;
                faceNormals[j++] = cz * d;
            }
            return { faceNormals: faceNormals, faceWeights: faceWeights };
        };
        GeometryUtils.createVertexNormals = function (_indices, positions, useFaceWeights) {
            if (useFaceWeights === void 0) { useFaceWeights = false; }
            var faceNormalsResult = GeometryUtils.createFaceNormals(_indices, positions, useFaceWeights);
            var faceWeights = faceNormalsResult.faceWeights;
            var faceNormals = faceNormalsResult.faceNormals;
            var v1 = 0;
            var f1 = 0, f2 = 1, f3 = 2;
            var lenV = positions.length;
            var normalStride = 3;
            var normalOffset = 0;
            var normals = new Array(lenV);
            v1 = 0;
            while (v1 < lenV) {
                normals[v1] = 0.0;
                normals[v1 + 1] = 0.0;
                normals[v1 + 2] = 0.0;
                v1 += normalStride;
            }
            var i = 0, k = 0;
            var lenI = _indices.length;
            var index = 0;
            var weight = 0;
            while (i < lenI) {
                weight = useFaceWeights ? faceWeights[k++] : 1;
                index = normalOffset + _indices[i++] * normalStride;
                normals[index++] += faceNormals[f1] * weight;
                normals[index++] += faceNormals[f2] * weight;
                normals[index] += faceNormals[f3] * weight;
                index = normalOffset + _indices[i++] * normalStride;
                normals[index++] += faceNormals[f1] * weight;
                normals[index++] += faceNormals[f2] * weight;
                normals[index] += faceNormals[f3] * weight;
                index = normalOffset + _indices[i++] * normalStride;
                normals[index++] += faceNormals[f1] * weight;
                normals[index++] += faceNormals[f2] * weight;
                normals[index] += faceNormals[f3] * weight;
                f1 += 3;
                f2 += 3;
                f3 += 3;
            }
            v1 = normalOffset;
            while (v1 < lenV) {
                var vx = normals[v1];
                var vy = normals[v1 + 1];
                var vz = normals[v1 + 2];
                var d = 1.0 / Math.sqrt(vx * vx + vy * vy + vz * vz);
                normals[v1] = vx * d;
                normals[v1 + 1] = vy * d;
                normals[v1 + 2] = vz * d;
                v1 += normalStride;
            }
            return normals;
        };
        GeometryUtils.createVertexTangents = function (indices, positions, uvs, _useFaceWeights) {
            if (_useFaceWeights === void 0) { _useFaceWeights = false; }
            var faceTangentsResult = GeometryUtils.createFaceTangents(indices, positions, uvs);
            var faceWeights = faceTangentsResult.faceWeights;
            var faceTangents = faceTangentsResult.faceTangents;
            var i = 0;
            var lenV = positions.length;
            var tangentStride = 3;
            var tangentOffset = 0;
            var target = new Array(lenV);
            i = tangentOffset;
            while (i < lenV) {
                target[i] = 0.0;
                target[i + 1] = 0.0;
                target[i + 2] = 0.0;
                i += tangentStride;
            }
            var k = 0;
            var lenI = indices.length;
            var index = 0;
            var weight = 0;
            var f1 = 0, f2 = 1, f3 = 2;
            i = 0;
            while (i < lenI) {
                weight = _useFaceWeights ? faceWeights[k++] : 1;
                index = tangentOffset + indices[i++] * tangentStride;
                target[index++] += faceTangents[f1] * weight;
                target[index++] += faceTangents[f2] * weight;
                target[index] += faceTangents[f3] * weight;
                index = tangentOffset + indices[i++] * tangentStride;
                target[index++] += faceTangents[f1] * weight;
                target[index++] += faceTangents[f2] * weight;
                target[index] += faceTangents[f3] * weight;
                index = tangentOffset + indices[i++] * tangentStride;
                target[index++] += faceTangents[f1] * weight;
                target[index++] += faceTangents[f2] * weight;
                target[index] += faceTangents[f3] * weight;
                f1 += 3;
                f2 += 3;
                f3 += 3;
            }
            i = tangentOffset;
            while (i < lenV) {
                var vx = target[i];
                var vy = target[i + 1];
                var vz = target[i + 2];
                var d = 1.0 / Math.sqrt(vx * vx + vy * vy + vz * vz);
                target[i] = vx * d;
                target[i + 1] = vy * d;
                target[i + 2] = vz * d;
                i += tangentStride;
            }
            return target;
        };
        GeometryUtils.createFaceTangents = function (indices, positions, uvs, useFaceWeights) {
            if (useFaceWeights === void 0) { useFaceWeights = false; }
            var i = 0, k = 0;
            var index1 = 0, index2 = 0, index3 = 0;
            var len = indices.length;
            var ui = 0, vi = 0;
            var v0 = 0;
            var dv1 = 0, dv2 = 0;
            var denom = 0;
            var x0 = 0, y0 = 0, z0 = 0;
            var dx1 = 0, dy1 = 0, dz1 = 0;
            var dx2 = 0, dy2 = 0, dz2 = 0;
            var cx = 0, cy = 0, cz = 0;
            var posStride = 3;
            var posOffset = 0;
            var texStride = 2;
            var texOffset = 0;
            var faceTangents = new Array(indices.length);
            if (useFaceWeights)
                var faceWeights = new Array(len / 3);
            while (i < len) {
                index1 = indices[i];
                index2 = indices[i + 1];
                index3 = indices[i + 2];
                ui = texOffset + index1 * texStride + 1;
                v0 = uvs[ui];
                ui = texOffset + index2 * texStride + 1;
                dv1 = uvs[ui] - v0;
                ui = texOffset + index3 * texStride + 1;
                dv2 = uvs[ui] - v0;
                vi = posOffset + index1 * posStride;
                x0 = positions[vi];
                y0 = positions[vi + 1];
                z0 = positions[vi + 2];
                vi = posOffset + index2 * posStride;
                dx1 = positions[vi] - x0;
                dy1 = positions[vi + 1] - y0;
                dz1 = positions[vi + 2] - z0;
                vi = posOffset + index3 * posStride;
                dx2 = positions[vi] - x0;
                dy2 = positions[vi + 1] - y0;
                dz2 = positions[vi + 2] - z0;
                cx = dv2 * dx1 - dv1 * dx2;
                cy = dv2 * dy1 - dv1 * dy2;
                cz = dv2 * dz1 - dv1 * dz2;
                denom = Math.sqrt(cx * cx + cy * cy + cz * cz);
                if (useFaceWeights) {
                    var w = denom * 10000;
                    if (w < 1)
                        w = 1;
                    faceWeights[k++] = w;
                }
                denom = 1 / denom;
                faceTangents[i++] = denom * cx;
                faceTangents[i++] = denom * cy;
                faceTangents[i++] = denom * cz;
            }
            return { faceTangents: faceTangents, faceWeights: faceWeights };
        };
        return GeometryUtils;
    }());
    feng3d.GeometryUtils = GeometryUtils;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 点几何体
     * @author feng 2017-01-11
     */
    var PointGeometry = (function (_super) {
        __extends(PointGeometry, _super);
        function PointGeometry() {
            var _this = _super.call(this) || this;
            /**
             * 几何体是否变脏
             */
            _this.geometryDirty = false;
            _this._points = [];
            _this.addPoint(new PointInfo(new feng3d.Vector3D(0, 0, 0)));
            return _this;
        }
        /**
         * 添加点
         * @param point		点数据
         */
        PointGeometry.prototype.addPoint = function (point, needUpdateGeometry) {
            if (needUpdateGeometry === void 0) { needUpdateGeometry = true; }
            this._points.push(point);
            this.geometryDirty = true;
            this.updateGeometry();
        };
        /**
         * 更新几何体
         */
        PointGeometry.prototype.updateGeometry = function () {
            this.geometryDirty = false;
            var positionStep = 3;
            var normalStep = 3;
            var uvStep = 2;
            var numPoints = this._points.length;
            var indices = new Uint16Array(numPoints);
            var positionData = new Float32Array(numPoints * positionStep);
            var normalData = new Float32Array(numPoints * normalStep);
            var uvData = new Float32Array(numPoints * uvStep);
            for (var i = 0; i < numPoints; i++) {
                var element = this._points[i];
                indices[i] = i;
                positionData.set(element.position.toArray(3), i * positionStep);
                normalData.set(element.normal.toArray(3), i * normalStep);
                uvData.set(element.uv.toArray(), i * uvStep);
            }
            this.positions = positionData;
            this.uvs = uvData;
            this.normals = normalData;
            this.setIndices(indices);
        };
        /**
         * 获取线段数据
         * @param index 		线段索引
         * @return				线段数据
         */
        PointGeometry.prototype.getPoint = function (index) {
            if (index < this._points.length)
                return this._points[index];
            return null;
        };
        /**
         * 移除所有线段
         */
        PointGeometry.prototype.removeAllPoints = function () {
            this.points.length = 0;
            this.geometryDirty = true;
        };
        Object.defineProperty(PointGeometry.prototype, "points", {
            /**
             * 线段列表
             */
            get: function () {
                return this._points;
            },
            enumerable: true,
            configurable: true
        });
        return PointGeometry;
    }(feng3d.Geometry));
    feng3d.PointGeometry = PointGeometry;
    /**
     * 点信息
     * @author feng 2016-10-16
     */
    var PointInfo = (function () {
        /**
         * 创建点
         * @param position 坐标
         */
        function PointInfo(position, uv, normal) {
            if (position === void 0) { position = new feng3d.Vector3D(); }
            if (uv === void 0) { uv = new feng3d.Point(); }
            if (normal === void 0) { normal = new feng3d.Vector3D(0, 1, 0); }
            this.position = position;
            this.normal = normal;
            this.uv = uv;
        }
        return PointInfo;
    }());
    feng3d.PointInfo = PointInfo;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 线段组件
     * @author feng 2016-10-16
     */
    var SegmentGeometry = (function (_super) {
        __extends(SegmentGeometry, _super);
        function SegmentGeometry() {
            var _this = _super.call(this) || this;
            _this.segments_ = [];
            return _this;
        }
        /**
         * 添加线段
         * @param segment		            线段数据
         */
        SegmentGeometry.prototype.addSegment = function (segment) {
            this.segments_.push(segment);
            this.invalidateGeometry();
        };
        /**
         * 设置线段
         * @param segment		            线段数据
         * @param index		                线段索引
         */
        SegmentGeometry.prototype.setSegmentAt = function (segment, index) {
            this.segments_[index] = segment;
            this.invalidateGeometry();
        };
        /**
         * 更新几何体
         */
        SegmentGeometry.prototype.buildGeometry = function () {
            var segmentPositionStep = 6;
            var segmentColorStep = 8;
            var numSegments = this.segments_.length;
            var indices = new Uint16Array(numSegments * 2);
            var positionData = new Float32Array(numSegments * segmentPositionStep);
            var colorData = new Float32Array(numSegments * segmentColorStep);
            for (var i = 0; i < numSegments; i++) {
                var element = this.segments_[i];
                indices.set([i * 2, i * 2 + 1], i * 2);
                positionData.set(element.positionData, i * segmentPositionStep);
                colorData.set(element.colorData, i * segmentColorStep);
            }
            this.setVAData("a_position", positionData, 3);
            this.setVAData("a_color", colorData, 4);
            this.setIndices(indices);
        };
        /**
         * 获取线段数据
         * @param index 		线段索引
         * @return				线段数据
         */
        SegmentGeometry.prototype.getSegment = function (index) {
            if (index < this.segments_.length)
                return this.segments_[index];
            return null;
        };
        /**
         * 移除所有线段
         */
        SegmentGeometry.prototype.removeAllSegments = function () {
            this.segments.length = 0;
            this.invalidateGeometry();
        };
        Object.defineProperty(SegmentGeometry.prototype, "segments", {
            /**
             * 线段列表
             */
            get: function () {
                return this.segments_;
            },
            enumerable: true,
            configurable: true
        });
        return SegmentGeometry;
    }(feng3d.Geometry));
    feng3d.SegmentGeometry = SegmentGeometry;
    /**
     * 线段
     * @author feng 2016-10-16
     */
    var Segment = (function () {
        /**
         * 创建线段
         * @param start 起点坐标
         * @param end 终点坐标
         * @param colorStart 起点颜色
         * @param colorEnd 终点颜色
         * @param thickness 线段厚度
         */
        function Segment(start, end, colorStart, colorEnd, thickness) {
            if (colorStart === void 0) { colorStart = 0x333333; }
            if (colorEnd === void 0) { colorEnd = 0x333333; }
            if (thickness === void 0) { thickness = 1; }
            this.thickness = thickness * .5;
            this.start = start;
            this.end = end;
            this.startColor = new feng3d.Color();
            this.startColor.fromUnit(colorStart, colorStart > 1 << 24);
            this.endColor = new feng3d.Color();
            this.endColor.fromUnit(colorEnd, colorEnd > 1 << 24);
        }
        Object.defineProperty(Segment.prototype, "positionData", {
            /**
             * 坐标数据
             */
            get: function () {
                return [this.start.x, this.start.y, this.start.z, this.end.x, this.end.y, this.end.z];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Segment.prototype, "colorData", {
            /**
             * 颜色数据
             */
            get: function () {
                return [
                    this.startColor.r, this.startColor.g, this.startColor.b, this.startColor.a,
                    this.endColor.r, this.endColor.g, this.endColor.b, this.endColor.a,
                ];
            },
            enumerable: true,
            configurable: true
        });
        return Segment;
    }());
    feng3d.Segment = Segment;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 几何体组件
     * @author feng 2016-10-16
     */
    var GeometryComponent = (function (_super) {
        __extends(GeometryComponent, _super);
        /**
         * 构建几何体组件
         */
        function GeometryComponent() {
            return _super.call(this) || this;
        }
        Object.defineProperty(GeometryComponent.prototype, "geometry", {
            /**
             * 所属对象
             */
            get: function () { return this._parentComponent; },
            enumerable: true,
            configurable: true
        });
        return GeometryComponent;
    }(feng3d.Component));
    feng3d.GeometryComponent = GeometryComponent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 坐标系统类型
     * @author feng 2014-10-14
     */
    var CoordinateSystem = (function () {
        function CoordinateSystem() {
        }
        return CoordinateSystem;
    }());
    /**
     * 默认坐标系统，左手坐标系统
     */
    CoordinateSystem.LEFT_HANDED = 0;
    /**
     * 右手坐标系统
     */
    CoordinateSystem.RIGHT_HANDED = 1;
    feng3d.CoordinateSystem = CoordinateSystem;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 摄像机镜头
     * @author feng 2014-10-14
     */
    var LensBase = (function (_super) {
        __extends(LensBase, _super);
        /**
         * 创建一个摄像机镜头
         */
        function LensBase() {
            var _this = _super.call(this) || this;
            _this._scissorRect = new feng3d.Rectangle();
            _this._viewPort = new feng3d.Rectangle();
            _this._near = 0.1;
            _this._far = 10000;
            _this._aspectRatio = 1;
            _this._matrixInvalid = true;
            _this._frustumCorners = [];
            _this._unprojectionInvalid = true;
            _this._matrix = new feng3d.Matrix3D();
            return _this;
        }
        Object.defineProperty(LensBase.prototype, "frustumCorners", {
            /**
             * Retrieves the corner points of the lens frustum.
             */
            get: function () {
                return this._frustumCorners;
            },
            set: function (frustumCorners) {
                this._frustumCorners = frustumCorners;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LensBase.prototype, "matrix", {
            /**
             * 投影矩阵
             */
            get: function () {
                if (this._matrixInvalid) {
                    this.updateMatrix();
                    this._matrixInvalid = false;
                }
                return this._matrix;
            },
            set: function (value) {
                this._matrix = value;
                this.invalidateMatrix();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LensBase.prototype, "near", {
            /**
             * 最近距离
             */
            get: function () {
                return this._near;
            },
            set: function (value) {
                if (value == this._near)
                    return;
                this._near = value;
                this.invalidateMatrix();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LensBase.prototype, "far", {
            /**
             * 最远距离
             */
            get: function () {
                return this._far;
            },
            set: function (value) {
                if (value == this._far)
                    return;
                this._far = value;
                this.invalidateMatrix();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LensBase.prototype, "aspectRatio", {
            /**
             * 视窗缩放比例(width/height)，在渲染器中设置
             */
            get: function () {
                return this._aspectRatio;
            },
            set: function (value) {
                if (this._aspectRatio == value || (value * 0) != 0)
                    return;
                this._aspectRatio = value;
                this.invalidateMatrix();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 场景坐标投影到屏幕坐标
         * @param point3d 场景坐标
         * @param v 屏幕坐标（输出）
         * @return 屏幕坐标
         */
        LensBase.prototype.project = function (point3d, v) {
            if (v === void 0) { v = null; }
            if (!v)
                v = new feng3d.Vector3D();
            this.matrix.transformVector(point3d, v);
            v.x = v.x / v.w;
            v.y = -v.y / v.w;
            //z is unaffected by transform
            v.z = point3d.z;
            return v;
        };
        Object.defineProperty(LensBase.prototype, "unprojectionMatrix", {
            /**
             * 投影逆矩阵
             */
            get: function () {
                if (this._unprojectionInvalid) {
                    if (this._unprojection == null)
                        this._unprojection = new feng3d.Matrix3D();
                    this._unprojection.copyFrom(this.matrix);
                    this._unprojection.invert();
                    this._unprojectionInvalid = false;
                }
                return this._unprojection;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 投影矩阵失效
         */
        LensBase.prototype.invalidateMatrix = function () {
            this._matrixInvalid = true;
            this._unprojectionInvalid = true;
            // notify the camera that the lens this.matrix is changing. this will mark the 
            // viewProjectionMatrix in the camera as invalid, and force the this.matrix to
            // be re-queried from the lens, and therefore rebuilt.
            this.dispatchEvent(new feng3d.LensEvent(feng3d.LensEvent.MATRIX_CHANGED, this));
        };
        return LensBase;
    }(feng3d.EventDispatcher));
    feng3d.LensBase = LensBase;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     *
     * @author feng 2015-5-28
     */
    var FreeMatrixLens = (function (_super) {
        __extends(FreeMatrixLens, _super);
        function FreeMatrixLens() {
            return _super.call(this) || this;
        }
        FreeMatrixLens.prototype.updateMatrix = function () {
            this._matrixInvalid = false;
        };
        /**
         * 屏幕坐标投影到摄像机空间坐标
         * @param nX 屏幕坐标X -1（左） -> 1（右）
         * @param nY 屏幕坐标Y -1（上） -> 1（下）
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        FreeMatrixLens.prototype.unproject = function (nX, nY, sZ, v) {
            return null;
        };
        return FreeMatrixLens;
    }(feng3d.LensBase));
    feng3d.FreeMatrixLens = FreeMatrixLens;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 透视摄像机镜头
     * @author feng 2014-10-14
     */
    var PerspectiveLens = (function (_super) {
        __extends(PerspectiveLens, _super);
        /**
         * 创建一个透视摄像机镜头
         * @param fieldOfView 视野
         * @param coordinateSystem 坐标系统类型
         */
        function PerspectiveLens(fieldOfView, coordinateSystem) {
            if (fieldOfView === void 0) { fieldOfView = 60; }
            if (coordinateSystem === void 0) { coordinateSystem = feng3d.CoordinateSystem.LEFT_HANDED; }
            var _this = _super.call(this) || this;
            _this.fieldOfView = fieldOfView;
            _this.coordinateSystem = coordinateSystem;
            return _this;
        }
        Object.defineProperty(PerspectiveLens.prototype, "fieldOfView", {
            /**
             * 视野
             */
            get: function () {
                return this._fieldOfView;
            },
            set: function (value) {
                if (value == this._fieldOfView)
                    return;
                this._fieldOfView = value;
                this._focalLengthInv = Math.tan(this._fieldOfView * Math.PI / 360);
                this._focalLength = 1 / this._focalLengthInv;
                this.invalidateMatrix();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerspectiveLens.prototype, "focalLength", {
            /**
             * 焦距
             */
            get: function () {
                return this._focalLength;
            },
            set: function (value) {
                if (value == this._focalLength)
                    return;
                this._focalLength = value;
                this._focalLengthInv = 1 / this._focalLength;
                this._fieldOfView = Math.atan(this._focalLengthInv) * 360 / Math.PI;
                this.invalidateMatrix();
            },
            enumerable: true,
            configurable: true
        });
        PerspectiveLens.prototype.unproject = function (nX, nY, sZ, v) {
            if (v === void 0) { v = null; }
            if (!v)
                v = new feng3d.Vector3D();
            v.x = nX;
            v.y = -nY;
            v.z = sZ;
            v.w = 1;
            v.x *= sZ;
            v.y *= sZ;
            this.unprojectionMatrix.transformVector(v, v);
            //z is unaffected by transform
            v.z = sZ;
            return v;
        };
        Object.defineProperty(PerspectiveLens.prototype, "coordinateSystem", {
            /**
             * 坐标系类型
             */
            get: function () {
                return this._coordinateSystem;
            },
            set: function (value) {
                if (value == this._coordinateSystem)
                    return;
                this._coordinateSystem = value;
                this.invalidateMatrix();
            },
            enumerable: true,
            configurable: true
        });
        PerspectiveLens.prototype.updateMatrix = function () {
            var raw = feng3d.Matrix3D.RAW_DATA_CONTAINER;
            this._yMax = this._near * this._focalLengthInv;
            this._xMax = this._yMax * this._aspectRatio;
            var left, right, top, bottom;
            if (this._scissorRect.x == 0 && this._scissorRect.y == 0 && this._scissorRect.width == this._viewPort.width && this._scissorRect.height == this._viewPort.height) {
                // assume unscissored frustum
                left = -this._xMax;
                right = this._xMax;
                top = -this._yMax;
                bottom = this._yMax;
                // assume unscissored frustum
                raw[0] = this._near / this._xMax;
                raw[5] = this._near / this._yMax;
                raw[10] = this._far / (this._far - this._near);
                raw[11] = 1;
                raw[1] = raw[2] = raw[3] = raw[4] = raw[6] = raw[7] = raw[8] = raw[9] = raw[12] = raw[13] = raw[15] = 0;
                raw[14] = -this._near * raw[10];
            }
            else {
                // assume scissored frustum
                var xWidth = this._xMax * (this._viewPort.width / this._scissorRect.width);
                var yHgt = this._yMax * (this._viewPort.height / this._scissorRect.height);
                var center = this._xMax * (this._scissorRect.x * 2 - this._viewPort.width) / this._scissorRect.width + this._xMax;
                var middle = -this._yMax * (this._scissorRect.y * 2 - this._viewPort.height) / this._scissorRect.height - this._yMax;
                left = center - xWidth;
                right = center + xWidth;
                top = middle - yHgt;
                bottom = middle + yHgt;
                raw[0] = 2 * this._near / (right - left);
                raw[5] = 2 * this._near / (bottom - top);
                raw[8] = (right + left) / (right - left);
                raw[9] = (bottom + top) / (bottom - top);
                raw[10] = (this._far + this._near) / (this._far - this._near);
                raw[11] = 1;
                raw[1] = raw[2] = raw[3] = raw[4] = raw[6] = raw[7] = raw[12] = raw[13] = raw[15] = 0;
                raw[14] = -2 * this._far * this._near / (this._far - this._near);
            }
            // Switch projection transform from left to right handed.
            if (this._coordinateSystem == feng3d.CoordinateSystem.RIGHT_HANDED)
                raw[5] = -raw[5];
            this._matrix.copyRawDataFrom(raw);
            var yMaxFar = this._far * this._focalLengthInv;
            var xMaxFar = yMaxFar * this._aspectRatio;
            this._frustumCorners[0] = this._frustumCorners[9] = left;
            this._frustumCorners[3] = this._frustumCorners[6] = right;
            this._frustumCorners[1] = this._frustumCorners[4] = top;
            this._frustumCorners[7] = this._frustumCorners[10] = bottom;
            this._frustumCorners[12] = this._frustumCorners[21] = -xMaxFar;
            this._frustumCorners[15] = this._frustumCorners[18] = xMaxFar;
            this._frustumCorners[13] = this._frustumCorners[16] = -yMaxFar;
            this._frustumCorners[19] = this._frustumCorners[22] = yMaxFar;
            this._frustumCorners[2] = this._frustumCorners[5] = this._frustumCorners[8] = this._frustumCorners[11] = this._near;
            this._frustumCorners[14] = this._frustumCorners[17] = this._frustumCorners[20] = this._frustumCorners[23] = this._far;
            this._matrixInvalid = false;
        };
        return PerspectiveLens;
    }(feng3d.LensBase));
    feng3d.PerspectiveLens = PerspectiveLens;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 镜头事件
     * @author feng 2014-10-14
     */
    var LensEvent = (function (_super) {
        __extends(LensEvent, _super);
        function LensEvent(type, lens, bubbles) {
            if (lens === void 0) { lens = null; }
            if (bubbles === void 0) { bubbles = false; }
            return _super.call(this, type, lens, bubbles) || this;
        }
        Object.defineProperty(LensEvent.prototype, "lens", {
            get: function () {
                return this.data;
            },
            enumerable: true,
            configurable: true
        });
        return LensEvent;
    }(feng3d.Event));
    LensEvent.MATRIX_CHANGED = "matrixChanged";
    feng3d.LensEvent = LensEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 摄像机
     * @author feng 2016-08-16
     */
    var Camera = (function (_super) {
        __extends(Camera, _super);
        /**
         * 创建一个摄像机
         * @param lens 摄像机镜头
         */
        function Camera(lens) {
            if (lens === void 0) { lens = null; }
            var _this = _super.call(this) || this;
            _this._viewProjection = new feng3d.Matrix3D();
            _this._viewProjectionDirty = true;
            _this._frustumPlanesDirty = true;
            _this._single = true;
            _this._lens = lens || new feng3d.PerspectiveLens();
            _this._lens.addEventListener(feng3d.LensEvent.MATRIX_CHANGED, _this.onLensMatrixChanged, _this);
            _this._frustumPlanes = [];
            for (var i = 0; i < 6; ++i)
                _this._frustumPlanes[i] = new feng3d.Plane3D();
            //
            _this.createUniformData("u_viewProjection", function () { return _this.viewProjection; });
            _this.createUniformData("u_cameraMatrix", function () {
                return _this.gameObject ? _this.gameObject.transform.localToWorldMatrix : new feng3d.Matrix3D();
            });
            _this.createUniformData("u_skyBoxSize", function () { return _this._lens.far / Math.sqrt(3); });
            return _this;
        }
        /**
         * 处理镜头变化事件
         */
        Camera.prototype.onLensMatrixChanged = function (event) {
            this._viewProjectionDirty = true;
            this._frustumPlanesDirty = true;
            this.dispatchEvent(event);
        };
        Object.defineProperty(Camera.prototype, "lens", {
            /**
             * 镜头
             */
            get: function () {
                return this._lens;
            },
            set: function (value) {
                if (this._lens == value)
                    return;
                if (!value)
                    throw new Error("Lens cannot be null!");
                this._lens.removeEventListener(feng3d.LensEvent.MATRIX_CHANGED, this.onLensMatrixChanged, this);
                this._lens = value;
                this._lens.addEventListener(feng3d.LensEvent.MATRIX_CHANGED, this.onLensMatrixChanged, this);
                this.dispatchEvent(new feng3d.CameraEvent(feng3d.CameraEvent.LENS_CHANGED, this));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera.prototype, "viewProjection", {
            /**
             * 场景投影矩阵，世界空间转投影空间
             */
            get: function () {
                if (this._viewProjectionDirty) {
                    //场景空间转摄像机空间
                    this._viewProjection.copyFrom(this.inverseSceneTransform);
                    //+摄像机空间转投影空间 = 场景空间转投影空间
                    this._viewProjection.append(this._lens.matrix);
                    this._viewProjectionDirty = false;
                }
                return this._viewProjection;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera.prototype, "inverseSceneTransform", {
            get: function () {
                return this.gameObject ? this.gameObject.transform.worldToLocalMatrix : new feng3d.Matrix3D();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Camera.prototype, "sceneTransform", {
            get: function () {
                return this.gameObject ? this.gameObject.transform.localToWorldMatrix : new feng3d.Matrix3D();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 屏幕坐标投影到场景坐标
         * @param nX 屏幕坐标X -1（左） -> 1（右）
         * @param nY 屏幕坐标Y -1（上） -> 1（下）
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        Camera.prototype.unproject = function (nX, nY, sZ, v) {
            if (v === void 0) { v = null; }
            return this.sceneTransform.transformVector(this.lens.unproject(nX, nY, sZ, v), v);
        };
        /**
         * 场景坐标投影到屏幕坐标
         * @param point3d 场景坐标
         * @param v 屏幕坐标（输出）
         * @return 屏幕坐标
         */
        Camera.prototype.project = function (point3d, v) {
            if (v === void 0) { v = null; }
            return this.lens.project(this.inverseSceneTransform.transformVector(point3d, v), v);
        };
        /**
         * 处理被添加组件事件
         */
        Camera.prototype.onBeAddedComponent = function (event) {
            this.gameObject.transform.addEventListener(feng3d.Object3DEvent.SCENETRANSFORM_CHANGED, this.onScenetransformChanged, this);
            this._viewProjectionDirty = true;
            this._frustumPlanesDirty = true;
        };
        /**
         * 处理被移除组件事件
         */
        Camera.prototype.onBeRemovedComponent = function (event) {
            this.gameObject.transform.removeEventListener(feng3d.Object3DEvent.SCENETRANSFORM_CHANGED, this.onScenetransformChanged, this);
        };
        /**
         * 处理场景变换改变事件
         */
        Camera.prototype.onScenetransformChanged = function () {
            this._viewProjectionDirty = true;
            this._frustumPlanesDirty = true;
        };
        Object.defineProperty(Camera.prototype, "frustumPlanes", {
            /**
             * 视锥体面
             */
            get: function () {
                if (this._frustumPlanesDirty)
                    this.updateFrustum();
                return this._frustumPlanes;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 更新视锥体6个面，平面均朝向视锥体内部
         * @see http://www.linuxgraphics.cn/graphics/opengl_view_frustum_culling.html
         */
        Camera.prototype.updateFrustum = function () {
            var a, b, c;
            //var d :number;
            var c11, c12, c13, c14;
            var c21, c22, c23, c24;
            var c31, c32, c33, c34;
            var c41, c42, c43, c44;
            var p;
            var raw = feng3d.Matrix3D.RAW_DATA_CONTAINER;
            //长度倒数
            var invLen;
            this.viewProjection.copyRawDataTo(raw);
            c11 = raw[0];
            c12 = raw[4];
            c13 = raw[8];
            c14 = raw[12];
            c21 = raw[1];
            c22 = raw[5];
            c23 = raw[9];
            c24 = raw[13];
            c31 = raw[2];
            c32 = raw[6];
            c33 = raw[10];
            c34 = raw[14];
            c41 = raw[3];
            c42 = raw[7];
            c43 = raw[11];
            c44 = raw[15];
            // left plane
            p = this._frustumPlanes[0];
            a = c41 + c11;
            b = c42 + c12;
            c = c43 + c13;
            invLen = 1 / Math.sqrt(a * a + b * b + c * c);
            p.a = a * invLen;
            p.b = b * invLen;
            p.c = c * invLen;
            p.d = -(c44 + c14) * invLen;
            // right plane
            p = this._frustumPlanes[1];
            a = c41 - c11;
            b = c42 - c12;
            c = c43 - c13;
            invLen = 1 / Math.sqrt(a * a + b * b + c * c);
            p.a = a * invLen;
            p.b = b * invLen;
            p.c = c * invLen;
            p.d = (c14 - c44) * invLen;
            // bottom
            p = this._frustumPlanes[2];
            a = c41 + c21;
            b = c42 + c22;
            c = c43 + c23;
            invLen = 1 / Math.sqrt(a * a + b * b + c * c);
            p.a = a * invLen;
            p.b = b * invLen;
            p.c = c * invLen;
            p.d = -(c44 + c24) * invLen;
            // top
            p = this._frustumPlanes[3];
            a = c41 - c21;
            b = c42 - c22;
            c = c43 - c23;
            invLen = 1 / Math.sqrt(a * a + b * b + c * c);
            p.a = a * invLen;
            p.b = b * invLen;
            p.c = c * invLen;
            p.d = (c24 - c44) * invLen;
            // near
            p = this._frustumPlanes[4];
            a = c31;
            b = c32;
            c = c33;
            invLen = 1 / Math.sqrt(a * a + b * b + c * c);
            p.a = a * invLen;
            p.b = b * invLen;
            p.c = c * invLen;
            p.d = -c34 * invLen;
            // far
            p = this._frustumPlanes[5];
            a = c41 - c31;
            b = c42 - c32;
            c = c43 - c33;
            invLen = 1 / Math.sqrt(a * a + b * b + c * c);
            p.a = a * invLen;
            p.b = b * invLen;
            p.c = c * invLen;
            p.d = (c34 - c44) * invLen;
            this._frustumPlanesDirty = false;
        };
        return Camera;
    }(feng3d.Component));
    feng3d.Camera = Camera;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 摄像机事件
     * @author feng 2014-10-14
     */
    var CameraEvent = (function (_super) {
        __extends(CameraEvent, _super);
        function CameraEvent(type, camera, bubbles) {
            if (camera === void 0) { camera = null; }
            if (bubbles === void 0) { bubbles = false; }
            return _super.call(this, type, camera, bubbles) || this;
        }
        Object.defineProperty(CameraEvent.prototype, "camera", {
            get: function () {
                return this.data;
            },
            enumerable: true,
            configurable: true
        });
        return CameraEvent;
    }(feng3d.Event));
    CameraEvent.LENS_CHANGED = "lensChanged";
    feng3d.CameraEvent = CameraEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 包围盒基类
     * @author feng 2014-4-27
     */
    var BoundingVolumeBase = (function (_super) {
        __extends(BoundingVolumeBase, _super);
        /**
         * 创建包围盒
         */
        function BoundingVolumeBase() {
            var _this = _super.call(this) || this;
            _this._aabbPointsDirty = true;
            _this._min = new feng3d.Vector3D();
            _this._max = new feng3d.Vector3D();
            return _this;
        }
        Object.defineProperty(BoundingVolumeBase.prototype, "geometry", {
            /**
             * 用于生产包围盒的几何体
             */
            get: function () {
                return this._geometry;
            },
            set: function (value) {
                if (this._geometry) {
                    this._geometry.removeEventListener(feng3d.GeometryEvent.BOUNDS_INVALID, this.onGeometryBoundsInvalid, this);
                }
                this._geometry = value;
                this.fromGeometry(this._geometry);
                if (this._geometry) {
                    this._geometry.addEventListener(feng3d.GeometryEvent.BOUNDS_INVALID, this.onGeometryBoundsInvalid, this);
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BoundingVolumeBase.prototype, "max", {
            /**
             * The maximum extreme of the bounds
             */
            get: function () {
                return this._max;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BoundingVolumeBase.prototype, "min", {
            /**
             * The minimum extreme of the bounds
             */
            get: function () {
                return this._min;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 处理几何体包围盒失效
         */
        BoundingVolumeBase.prototype.onGeometryBoundsInvalid = function () {
            this.fromGeometry(this.geometry);
            this.dispatchEvent(new feng3d.Event(feng3d.Event.CHANGE));
        };
        /**
         * 根据几何结构更新边界
         */
        BoundingVolumeBase.prototype.fromGeometry = function (geometry) {
            var minX, minY, minZ;
            var maxX, maxY, maxZ;
            var vertices = geometry.positions;
            if (!vertices) {
                this.fromExtremes(0, 0, 0, 0, 0, 0);
                return;
            }
            var i = 0;
            minX = maxX = vertices[i];
            minY = maxY = vertices[i + 1];
            minZ = maxZ = vertices[i + 2];
            var vertexDataLen = vertices.length;
            i = 0;
            var stride = 3;
            while (i < vertexDataLen) {
                var v = vertices[i];
                if (v < minX)
                    minX = v;
                else if (v > maxX)
                    maxX = v;
                v = vertices[i + 1];
                if (v < minY)
                    minY = v;
                else if (v > maxY)
                    maxY = v;
                v = vertices[i + 2];
                if (v < minZ)
                    minZ = v;
                else if (v > maxZ)
                    maxZ = v;
                i += stride;
            }
            this.fromExtremes(minX, minY, minZ, maxX, maxY, maxZ);
        };
        /**
         * 根据所给极值设置边界
         * @param minX 边界最小X坐标
         * @param minY 边界最小Y坐标
         * @param minZ 边界最小Z坐标
         * @param maxX 边界最大X坐标
         * @param maxY 边界最大Y坐标
         * @param maxZ 边界最大Z坐标
         */
        BoundingVolumeBase.prototype.fromExtremes = function (minX, minY, minZ, maxX, maxY, maxZ) {
            this._min.x = minX;
            this._min.y = minY;
            this._min.z = minZ;
            this._max.x = maxX;
            this._max.y = maxY;
            this._max.z = maxZ;
        };
        /**
         * 检测射线是否与边界交叉
         * @param ray3D						射线
         * @param targetNormal				交叉点法线值
         * @return							射线起点到交点距离
         */
        BoundingVolumeBase.prototype.rayIntersection = function (ray3D, targetNormal) {
            return -1;
        };
        /**
         * 检测是否包含指定点
         * @param position 		被检测点
         * @return				true：包含指定点
         */
        BoundingVolumeBase.prototype.containsPoint = function (position) {
            return false;
        };
        /**
         * 从给出的球体设置边界
         * @param center 		球心坐标
         * @param radius 		球体半径
         */
        BoundingVolumeBase.prototype.fromSphere = function (center, radius) {
            this.fromExtremes(center.x - radius, center.y - radius, center.z - radius, center.x + radius, center.y + radius, center.z + radius);
        };
        return BoundingVolumeBase;
    }(feng3d.EventDispatcher));
    feng3d.BoundingVolumeBase = BoundingVolumeBase;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 轴对其包围盒
     * @author feng 2014-4-27
     */
    var AxisAlignedBoundingBox = (function (_super) {
        __extends(AxisAlignedBoundingBox, _super);
        /**
         * 创建轴对其包围盒
         */
        function AxisAlignedBoundingBox() {
            var _this = _super.call(this) || this;
            _this._centerX = 0;
            _this._centerY = 0;
            _this._centerZ = 0;
            _this._halfExtentsX = 0;
            _this._halfExtentsY = 0;
            _this._halfExtentsZ = 0;
            return _this;
        }
        /**
         * 测试轴对其包围盒是否出现在摄像机视锥体内
         * @param planes 		视锥体面向量
         * @return 				true：出现在视锥体内
         * @see me.feng3d.cameras.Camera3D.updateFrustum()
         */
        AxisAlignedBoundingBox.prototype.isInFrustum = function (planes, numPlanes) {
            for (var i = 0; i < numPlanes; ++i) {
                var plane = planes[i];
                var a = plane.a;
                var b = plane.b;
                var c = plane.c;
                //最可能出现在平面内的点，即距离最可能大于0的点 (如果这个点都不在平面内的话，其他的点肯定会不在平面内)
                var flippedExtentX = a < 0 ? -this._halfExtentsX : this._halfExtentsX;
                var flippedExtentY = b < 0 ? -this._halfExtentsY : this._halfExtentsY;
                var flippedExtentZ = c < 0 ? -this._halfExtentsZ : this._halfExtentsZ;
                var projDist = a * (this._centerX + flippedExtentX) + b * (this._centerY + flippedExtentY) + c * (this._centerZ + flippedExtentZ) - plane.d;
                //小于0表示包围盒8个点都在平面内，同时就表面不存在点在视锥体内。注：视锥体6个平面朝内
                if (projDist < 0)
                    return false;
            }
            return true;
        };
        /**
         * @inheritDoc
         */
        AxisAlignedBoundingBox.prototype.fromExtremes = function (minX, minY, minZ, maxX, maxY, maxZ) {
            this._centerX = (maxX + minX) * .5;
            this._centerY = (maxY + minY) * .5;
            this._centerZ = (maxZ + minZ) * .5;
            this._halfExtentsX = (maxX - minX) * .5;
            this._halfExtentsY = (maxY - minY) * .5;
            this._halfExtentsZ = (maxZ - minZ) * .5;
            _super.prototype.fromExtremes.call(this, minX, minY, minZ, maxX, maxY, maxZ);
        };
        /**
         * @inheritDoc
         */
        AxisAlignedBoundingBox.prototype.rayIntersection = function (ray3D, targetNormal) {
            var position = ray3D.position;
            var direction = ray3D.direction;
            if (this.containsPoint(position))
                return 0;
            var px = position.x - this._centerX, py = position.y - this._centerY, pz = position.z - this._centerZ;
            var vx = direction.x, vy = direction.y, vz = direction.z;
            var ix, iy, iz;
            var rayEntryDistance;
            // ray-plane tests
            var intersects;
            if (vx < 0) {
                rayEntryDistance = (this._halfExtentsX - px) / vx;
                if (rayEntryDistance > 0) {
                    iy = py + rayEntryDistance * vy;
                    iz = pz + rayEntryDistance * vz;
                    if (iy > -this._halfExtentsY && iy < this._halfExtentsY && iz > -this._halfExtentsZ && iz < this._halfExtentsZ) {
                        targetNormal.x = 1;
                        targetNormal.y = 0;
                        targetNormal.z = 0;
                        intersects = true;
                    }
                }
            }
            if (!intersects && vx > 0) {
                rayEntryDistance = (-this._halfExtentsX - px) / vx;
                if (rayEntryDistance > 0) {
                    iy = py + rayEntryDistance * vy;
                    iz = pz + rayEntryDistance * vz;
                    if (iy > -this._halfExtentsY && iy < this._halfExtentsY && iz > -this._halfExtentsZ && iz < this._halfExtentsZ) {
                        targetNormal.x = -1;
                        targetNormal.y = 0;
                        targetNormal.z = 0;
                        intersects = true;
                    }
                }
            }
            if (!intersects && vy < 0) {
                rayEntryDistance = (this._halfExtentsY - py) / vy;
                if (rayEntryDistance > 0) {
                    ix = px + rayEntryDistance * vx;
                    iz = pz + rayEntryDistance * vz;
                    if (ix > -this._halfExtentsX && ix < this._halfExtentsX && iz > -this._halfExtentsZ && iz < this._halfExtentsZ) {
                        targetNormal.x = 0;
                        targetNormal.y = 1;
                        targetNormal.z = 0;
                        intersects = true;
                    }
                }
            }
            if (!intersects && vy > 0) {
                rayEntryDistance = (-this._halfExtentsY - py) / vy;
                if (rayEntryDistance > 0) {
                    ix = px + rayEntryDistance * vx;
                    iz = pz + rayEntryDistance * vz;
                    if (ix > -this._halfExtentsX && ix < this._halfExtentsX && iz > -this._halfExtentsZ && iz < this._halfExtentsZ) {
                        targetNormal.x = 0;
                        targetNormal.y = -1;
                        targetNormal.z = 0;
                        intersects = true;
                    }
                }
            }
            if (!intersects && vz < 0) {
                rayEntryDistance = (this._halfExtentsZ - pz) / vz;
                if (rayEntryDistance > 0) {
                    ix = px + rayEntryDistance * vx;
                    iy = py + rayEntryDistance * vy;
                    if (iy > -this._halfExtentsY && iy < this._halfExtentsY && ix > -this._halfExtentsX && ix < this._halfExtentsX) {
                        targetNormal.x = 0;
                        targetNormal.y = 0;
                        targetNormal.z = 1;
                        intersects = true;
                    }
                }
            }
            if (!intersects && vz > 0) {
                rayEntryDistance = (-this._halfExtentsZ - pz) / vz;
                if (rayEntryDistance > 0) {
                    ix = px + rayEntryDistance * vx;
                    iy = py + rayEntryDistance * vy;
                    if (iy > -this._halfExtentsY && iy < this._halfExtentsY && ix > -this._halfExtentsX && ix < this._halfExtentsX) {
                        targetNormal.x = 0;
                        targetNormal.y = 0;
                        targetNormal.z = -1;
                        intersects = true;
                    }
                }
            }
            return intersects ? rayEntryDistance : -1;
        };
        /**
         * @inheritDoc
         */
        AxisAlignedBoundingBox.prototype.containsPoint = function (position) {
            var px = position.x - this._centerX, py = position.y - this._centerY, pz = position.z - this._centerZ;
            return px <= this._halfExtentsX && px >= -this._halfExtentsX && py <= this._halfExtentsY && py >= -this._halfExtentsY && pz <= this._halfExtentsZ && pz >= -this._halfExtentsZ;
        };
        /**
         * 对包围盒进行变换
         * @param bounds		包围盒
         * @param matrix		变换矩阵
         * @see http://www.cppblog.com/lovedday/archive/2008/02/23/43122.html
         */
        AxisAlignedBoundingBox.prototype.transformFrom = function (bounds, matrix) {
            var aabb = bounds;
            var cx = aabb._centerX;
            var cy = aabb._centerY;
            var cz = aabb._centerZ;
            var raw = feng3d.Matrix3D.RAW_DATA_CONTAINER;
            matrix.copyRawDataTo(raw);
            var m11 = raw[0], m12 = raw[4], m13 = raw[8], m14 = raw[12];
            var m21 = raw[1], m22 = raw[5], m23 = raw[9], m24 = raw[13];
            var m31 = raw[2], m32 = raw[6], m33 = raw[10], m34 = raw[14];
            this._centerX = cx * m11 + cy * m12 + cz * m13 + m14;
            this._centerY = cx * m21 + cy * m22 + cz * m23 + m24;
            this._centerZ = cx * m31 + cy * m32 + cz * m33 + m34;
            if (m11 < 0)
                m11 = -m11;
            if (m12 < 0)
                m12 = -m12;
            if (m13 < 0)
                m13 = -m13;
            if (m21 < 0)
                m21 = -m21;
            if (m22 < 0)
                m22 = -m22;
            if (m23 < 0)
                m23 = -m23;
            if (m31 < 0)
                m31 = -m31;
            if (m32 < 0)
                m32 = -m32;
            if (m33 < 0)
                m33 = -m33;
            var hx = aabb._halfExtentsX;
            var hy = aabb._halfExtentsY;
            var hz = aabb._halfExtentsZ;
            this._halfExtentsX = hx * m11 + hy * m12 + hz * m13;
            this._halfExtentsY = hx * m21 + hy * m22 + hz * m23;
            this._halfExtentsZ = hx * m31 + hy * m32 + hz * m33;
            this._min.x = this._centerX - this._halfExtentsX;
            this._min.y = this._centerY - this._halfExtentsY;
            this._min.z = this._centerZ - this._halfExtentsZ;
            this._max.x = this._centerX + this._halfExtentsX;
            this._max.y = this._centerY + this._halfExtentsY;
            this._max.z = this._centerZ + this._halfExtentsZ;
            this._aabbPointsDirty = true;
        };
        return AxisAlignedBoundingBox;
    }(feng3d.BoundingVolumeBase));
    feng3d.AxisAlignedBoundingBox = AxisAlignedBoundingBox;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 立方体几何体
     * @author feng 2016-09-12
     */
    var PlaneGeometry = (function (_super) {
        __extends(PlaneGeometry, _super);
        /**
         * 创建平面几何体
         * @param width 宽度
         * @param height 高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        function PlaneGeometry(width, height, segmentsW, segmentsH, yUp) {
            if (width === void 0) { width = 100; }
            if (height === void 0) { height = 100; }
            if (segmentsW === void 0) { segmentsW = 1; }
            if (segmentsH === void 0) { segmentsH = 1; }
            if (yUp === void 0) { yUp = true; }
            var _this = _super.call(this) || this;
            _this._width = 100;
            _this._height = 100;
            _this._segmentsW = 1;
            _this._segmentsH = 1;
            _this._yUp = true;
            _this.width = width;
            _this.height = height;
            _this.segmentsW = segmentsW;
            _this.segmentsH = segmentsH;
            _this.yUp = yUp;
            return _this;
        }
        Object.defineProperty(PlaneGeometry.prototype, "width", {
            get: function () {
                return this._width;
            },
            set: function (value) {
                if (this._width == value)
                    return;
                this._width = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlaneGeometry.prototype, "height", {
            get: function () {
                return this._height;
            },
            set: function (value) {
                if (this._height == value)
                    return;
                this._height = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlaneGeometry.prototype, "segmentsW", {
            get: function () {
                return this._segmentsW;
            },
            set: function (value) {
                if (this._segmentsW == value)
                    return;
                this._segmentsW = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlaneGeometry.prototype, "segmentsH", {
            get: function () {
                return this._segmentsH;
            },
            set: function (value) {
                if (this._segmentsH == value)
                    return;
                this._segmentsH = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PlaneGeometry.prototype, "yUp", {
            get: function () {
                return this._yUp;
            },
            set: function (value) {
                if (this._yUp == value)
                    return;
                this._yUp = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 构建几何体数据
         */
        PlaneGeometry.prototype.buildGeometry = function () {
            var vertexPositionData = this.buildPosition();
            this.setVAData("a_position", vertexPositionData, 3);
            var vertexNormalData = this.buildNormal();
            this.setVAData("a_normal", vertexNormalData, 3);
            var vertexTangentData = this.buildTangent();
            this.setVAData("a_tangent", vertexTangentData, 3);
            var uvData = this.buildUVs();
            this.setVAData("a_uv", uvData, 2);
            var indices = this.buildIndices();
            this.setIndices(indices);
        };
        /**
         * 构建顶点坐标
         * @param this.width 宽度
         * @param this.height 高度
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        PlaneGeometry.prototype.buildPosition = function () {
            var vertexPositionData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var x, y;
            var positionIndex = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    x = (xi / this.segmentsW - .5) * this.width;
                    y = (yi / this.segmentsH - .5) * this.height;
                    //设置坐标数据
                    vertexPositionData[positionIndex++] = x;
                    if (this.yUp) {
                        vertexPositionData[positionIndex++] = 0;
                        vertexPositionData[positionIndex++] = y;
                    }
                    else {
                        vertexPositionData[positionIndex++] = y;
                        vertexPositionData[positionIndex++] = 0;
                    }
                }
            }
            return vertexPositionData;
        };
        /**
         * 构建顶点法线
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        PlaneGeometry.prototype.buildNormal = function () {
            var vertexNormalData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var normalIndex = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    //设置法线数据
                    vertexNormalData[normalIndex++] = 0;
                    if (this.yUp) {
                        vertexNormalData[normalIndex++] = 1;
                        vertexNormalData[normalIndex++] = 0;
                    }
                    else {
                        vertexNormalData[normalIndex++] = 0;
                        vertexNormalData[normalIndex++] = -1;
                    }
                }
            }
            return vertexNormalData;
        };
        /**
         * 构建顶点切线
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        PlaneGeometry.prototype.buildTangent = function () {
            var vertexTangentData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var tangentIndex = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    vertexTangentData[tangentIndex++] = 1;
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 0;
                }
            }
            return vertexTangentData;
        };
        /**
         * 构建顶点索引
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        PlaneGeometry.prototype.buildIndices = function () {
            var indices = new Uint16Array(this.segmentsH * this.segmentsW * 6);
            var tw = this.segmentsW + 1;
            var numIndices = 0;
            var base;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    //生成索引数据
                    if (xi != this.segmentsW && yi != this.segmentsH) {
                        base = xi + yi * tw;
                        indices[numIndices++] = base;
                        indices[numIndices++] = base + tw;
                        indices[numIndices++] = base + tw + 1;
                        indices[numIndices++] = base;
                        indices[numIndices++] = base + tw + 1;
                        indices[numIndices++] = base + 1;
                    }
                }
            }
            return indices;
        };
        /**
         * 构建uv
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         */
        PlaneGeometry.prototype.buildUVs = function () {
            var data = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 2);
            var index = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    data[index++] = xi / this.segmentsW;
                    data[index++] = 1 - yi / this.segmentsH;
                }
            }
            return data;
        };
        return PlaneGeometry;
    }(feng3d.Geometry));
    feng3d.PlaneGeometry = PlaneGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 立方体几何体
     * @author feng 2016-09-12
     */
    var CubeGeometry = (function (_super) {
        __extends(CubeGeometry, _super);
        /**
         * 创建立方几何体
         * @param   width           宽度，默认为100。
         * @param   height          高度，默认为100。
         * @param   depth           深度，默认为100。
         * @param   segmentsW       宽度方向分割，默认为1。
         * @param   segmentsH       高度方向分割，默认为1。
         * @param   segmentsD       深度方向分割，默认为1。
         * @param   tile6           是否为6块贴图，默认true。
         */
        function CubeGeometry(width, height, depth, segmentsW, segmentsH, segmentsD, tile6) {
            if (width === void 0) { width = 100; }
            if (height === void 0) { height = 100; }
            if (depth === void 0) { depth = 100; }
            if (segmentsW === void 0) { segmentsW = 1; }
            if (segmentsH === void 0) { segmentsH = 1; }
            if (segmentsD === void 0) { segmentsD = 1; }
            if (tile6 === void 0) { tile6 = true; }
            var _this = _super.call(this) || this;
            _this._width = 100;
            _this._height = 100;
            _this._depth = 100;
            _this._segmentsW = 1;
            _this._segmentsH = 1;
            _this._segmentsD = 1;
            _this._tile6 = true;
            _this.width = width;
            _this.height = height;
            _this.depth = depth;
            _this.segmentsW = segmentsW;
            _this.segmentsH = segmentsH;
            _this.segmentsD = segmentsD;
            _this.tile6 = tile6;
            return _this;
        }
        Object.defineProperty(CubeGeometry.prototype, "width", {
            get: function () {
                return this._width;
            },
            set: function (value) {
                if (this._width == value)
                    return;
                this._width = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CubeGeometry.prototype, "height", {
            get: function () {
                return this._height;
            },
            set: function (value) {
                if (this._height == value)
                    return;
                this._height = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CubeGeometry.prototype, "depth", {
            get: function () {
                return this._depth;
            },
            set: function (value) {
                if (this._depth == value)
                    return;
                this._depth = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CubeGeometry.prototype, "segmentsW", {
            get: function () {
                return this._segmentsW;
            },
            set: function (value) {
                if (this._segmentsW == value)
                    return;
                this._segmentsW = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CubeGeometry.prototype, "segmentsH", {
            get: function () {
                return this._segmentsH;
            },
            set: function (value) {
                if (this._segmentsH == value)
                    return;
                this._segmentsH = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CubeGeometry.prototype, "segmentsD", {
            get: function () {
                return this._segmentsD;
            },
            set: function (value) {
                if (this._segmentsD == value)
                    return;
                this._segmentsD = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CubeGeometry.prototype, "tile6", {
            get: function () {
                return this._tile6;
            },
            set: function (value) {
                if (this._tile6 == value)
                    return;
                this._tile6 = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        CubeGeometry.prototype.buildGeometry = function () {
            var vertexPositionData = this.buildPosition();
            this.setVAData("a_position", vertexPositionData, 3);
            var vertexNormalData = this.buildNormal();
            this.setVAData("a_normal", vertexNormalData, 3);
            var vertexTangentData = this.buildTangent();
            this.setVAData("a_tangent", vertexTangentData, 3);
            var uvData = this.buildUVs();
            this.setVAData("a_uv", uvData, 2);
            var indices = this.buildIndices();
            this.setIndices(indices);
        };
        /**
         * 构建坐标
         * @param   width           宽度
         * @param   height          高度
         * @param   depth           深度
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        CubeGeometry.prototype.buildPosition = function () {
            var vertexPositionData = new Float32Array(((this.segmentsW + 1) * (this.segmentsH + 1) + (this.segmentsW + 1) * (this.segmentsD + 1) + (this.segmentsH + 1) * (this.segmentsD + 1)) * 2 * 3);
            var i, j;
            var hw, hh, hd; // halves
            var dw, dh, dd; // deltas
            var outer_pos;
            // Indices
            var positionIndex = 0;
            // half cube dimensions
            hw = this.width / 2;
            hh = this.height / 2;
            hd = this.depth / 2;
            // Segment dimensions
            dw = this.width / this.segmentsW;
            dh = this.height / this.segmentsH;
            dd = this.depth / this.segmentsD;
            for (i = 0; i <= this.segmentsW; i++) {
                outer_pos = -hw + i * dw;
                for (j = 0; j <= this.segmentsH; j++) {
                    // front
                    vertexPositionData[positionIndex++] = outer_pos;
                    vertexPositionData[positionIndex++] = -hh + j * dh;
                    vertexPositionData[positionIndex++] = -hd;
                    // back
                    vertexPositionData[positionIndex++] = outer_pos;
                    vertexPositionData[positionIndex++] = -hh + j * dh;
                    vertexPositionData[positionIndex++] = hd;
                }
            }
            for (i = 0; i <= this.segmentsW; i++) {
                outer_pos = -hw + i * dw;
                for (j = 0; j <= this.segmentsD; j++) {
                    // top
                    vertexPositionData[positionIndex++] = outer_pos;
                    vertexPositionData[positionIndex++] = hh;
                    vertexPositionData[positionIndex++] = -hd + j * dd;
                    // bottom
                    vertexPositionData[positionIndex++] = outer_pos;
                    vertexPositionData[positionIndex++] = -hh;
                    vertexPositionData[positionIndex++] = -hd + j * dd;
                }
            }
            for (i = 0; i <= this.segmentsD; i++) {
                outer_pos = hd - i * dd;
                for (j = 0; j <= this.segmentsH; j++) {
                    // left
                    vertexPositionData[positionIndex++] = -hw;
                    vertexPositionData[positionIndex++] = -hh + j * dh;
                    vertexPositionData[positionIndex++] = outer_pos;
                    // right
                    vertexPositionData[positionIndex++] = hw;
                    vertexPositionData[positionIndex++] = -hh + j * dh;
                    vertexPositionData[positionIndex++] = outer_pos;
                }
            }
            return vertexPositionData;
        };
        /**
         * 构建法线
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        CubeGeometry.prototype.buildNormal = function () {
            var vertexNormalData = new Float32Array(((this.segmentsW + 1) * (this.segmentsH + 1) + (this.segmentsW + 1) * (this.segmentsD + 1) + (this.segmentsH + 1) * (this.segmentsD + 1)) * 2 * 3);
            var i, j;
            // Indices
            var normalIndex = 0;
            for (i = 0; i <= this.segmentsW; i++) {
                for (j = 0; j <= this.segmentsH; j++) {
                    // front
                    vertexNormalData[normalIndex++] = 0;
                    vertexNormalData[normalIndex++] = 0;
                    vertexNormalData[normalIndex++] = -1;
                    // back
                    vertexNormalData[normalIndex++] = 0;
                    vertexNormalData[normalIndex++] = 0;
                    vertexNormalData[normalIndex++] = 1;
                }
            }
            for (i = 0; i <= this.segmentsW; i++) {
                for (j = 0; j <= this.segmentsD; j++) {
                    // top
                    vertexNormalData[normalIndex++] = 0;
                    vertexNormalData[normalIndex++] = 1;
                    vertexNormalData[normalIndex++] = 0;
                    // bottom
                    vertexNormalData[normalIndex++] = 0;
                    vertexNormalData[normalIndex++] = -1;
                    vertexNormalData[normalIndex++] = 0;
                }
            }
            for (i = 0; i <= this.segmentsD; i++) {
                for (j = 0; j <= this.segmentsH; j++) {
                    // left
                    vertexNormalData[normalIndex++] = -1;
                    vertexNormalData[normalIndex++] = 0;
                    vertexNormalData[normalIndex++] = 0;
                    // right
                    vertexNormalData[normalIndex++] = 1;
                    vertexNormalData[normalIndex++] = 0;
                    vertexNormalData[normalIndex++] = 0;
                }
            }
            return new Float32Array(vertexNormalData);
        };
        /**
         * 构建切线
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        CubeGeometry.prototype.buildTangent = function () {
            var vertexTangentData = new Float32Array(((this.segmentsW + 1) * (this.segmentsH + 1) + (this.segmentsW + 1) * (this.segmentsD + 1) + (this.segmentsH + 1) * (this.segmentsD + 1)) * 2 * 3);
            var i, j;
            // Indices
            var tangentIndex = 0;
            for (i = 0; i <= this.segmentsW; i++) {
                for (j = 0; j <= this.segmentsH; j++) {
                    // front
                    vertexTangentData[tangentIndex++] = 1;
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 0;
                    // back
                    vertexTangentData[tangentIndex++] = -1;
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 0;
                }
            }
            for (i = 0; i <= this.segmentsW; i++) {
                for (j = 0; j <= this.segmentsD; j++) {
                    // top
                    vertexTangentData[tangentIndex++] = 1;
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 0;
                    // bottom
                    vertexTangentData[tangentIndex++] = 1;
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 0;
                }
            }
            for (i = 0; i <= this.segmentsD; i++) {
                for (j = 0; j <= this.segmentsH; j++) {
                    // left
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = -1;
                    // right
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 1;
                }
            }
            return vertexTangentData;
        };
        /**
         * 构建索引
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        CubeGeometry.prototype.buildIndices = function () {
            var indices = new Uint16Array((this.segmentsW * this.segmentsH + this.segmentsW * this.segmentsD + this.segmentsH * this.segmentsD) * 12);
            var tl, tr, bl, br;
            var i, j, inc = 0;
            var fidx = 0;
            for (i = 0; i <= this.segmentsW; i++) {
                for (j = 0; j <= this.segmentsH; j++) {
                    // front
                    // back
                    if (i && j) {
                        tl = 2 * ((i - 1) * (this.segmentsH + 1) + (j - 1));
                        tr = 2 * (i * (this.segmentsH + 1) + (j - 1));
                        bl = tl + 2;
                        br = tr + 2;
                        indices[fidx++] = tl;
                        indices[fidx++] = bl;
                        indices[fidx++] = br;
                        indices[fidx++] = tl;
                        indices[fidx++] = br;
                        indices[fidx++] = tr;
                        indices[fidx++] = tr + 1;
                        indices[fidx++] = br + 1;
                        indices[fidx++] = bl + 1;
                        indices[fidx++] = tr + 1;
                        indices[fidx++] = bl + 1;
                        indices[fidx++] = tl + 1;
                    }
                }
            }
            inc += 2 * (this.segmentsW + 1) * (this.segmentsH + 1);
            for (i = 0; i <= this.segmentsW; i++) {
                for (j = 0; j <= this.segmentsD; j++) {
                    // top
                    // bottom
                    if (i && j) {
                        tl = inc + 2 * ((i - 1) * (this.segmentsD + 1) + (j - 1));
                        tr = inc + 2 * (i * (this.segmentsD + 1) + (j - 1));
                        bl = tl + 2;
                        br = tr + 2;
                        indices[fidx++] = tl;
                        indices[fidx++] = bl;
                        indices[fidx++] = br;
                        indices[fidx++] = tl;
                        indices[fidx++] = br;
                        indices[fidx++] = tr;
                        indices[fidx++] = tr + 1;
                        indices[fidx++] = br + 1;
                        indices[fidx++] = bl + 1;
                        indices[fidx++] = tr + 1;
                        indices[fidx++] = bl + 1;
                        indices[fidx++] = tl + 1;
                    }
                }
            }
            inc += 2 * (this.segmentsW + 1) * (this.segmentsD + 1);
            for (i = 0; i <= this.segmentsD; i++) {
                for (j = 0; j <= this.segmentsH; j++) {
                    // left
                    // right
                    if (i && j) {
                        tl = inc + 2 * ((i - 1) * (this.segmentsH + 1) + (j - 1));
                        tr = inc + 2 * (i * (this.segmentsH + 1) + (j - 1));
                        bl = tl + 2;
                        br = tr + 2;
                        indices[fidx++] = tl;
                        indices[fidx++] = bl;
                        indices[fidx++] = br;
                        indices[fidx++] = tl;
                        indices[fidx++] = br;
                        indices[fidx++] = tr;
                        indices[fidx++] = tr + 1;
                        indices[fidx++] = br + 1;
                        indices[fidx++] = bl + 1;
                        indices[fidx++] = tr + 1;
                        indices[fidx++] = bl + 1;
                        indices[fidx++] = tl + 1;
                    }
                }
            }
            return indices;
        };
        /**
         * 构建uv
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         * @param   tile6           是否为6块贴图
         */
        CubeGeometry.prototype.buildUVs = function () {
            var i, j, uidx;
            var data = new Float32Array(((this.segmentsW + 1) * (this.segmentsH + 1) + (this.segmentsW + 1) * (this.segmentsD + 1) + (this.segmentsH + 1) * (this.segmentsD + 1)) * 2 * 2);
            var u_tile_dim, v_tile_dim;
            var u_tile_step, v_tile_step;
            var tl0u, tl0v;
            var tl1u, tl1v;
            var du, dv;
            if (this.tile6) {
                u_tile_dim = u_tile_step = 1 / 3;
                v_tile_dim = v_tile_step = 1 / 2;
            }
            else {
                u_tile_dim = v_tile_dim = 1;
                u_tile_step = v_tile_step = 0;
            }
            // Create planes two and two, the same way that they were
            // constructed in the this.buildGeometry() function. First calculate
            // the top-left UV coordinate for both planes, and then loop
            // over the points, calculating the UVs from these numbers.
            // When this.tile6 is true, the layout is as follows:
            //       .-----.-----.-----. (1,1)
            //       | Bot |  T  | Bak |
            //       |-----+-----+-----|
            //       |  L  |  F  |  R  |
            // (0,0)'-----'-----'-----'
            uidx = 0;
            // FRONT / BACK
            tl0u = 1 * u_tile_step;
            tl0v = 1 * v_tile_step;
            tl1u = 2 * u_tile_step;
            tl1v = 0 * v_tile_step;
            du = u_tile_dim / this.segmentsW;
            dv = v_tile_dim / this.segmentsH;
            for (i = 0; i <= this.segmentsW; i++) {
                for (j = 0; j <= this.segmentsH; j++) {
                    data[uidx++] = tl0u + i * du;
                    data[uidx++] = tl0v + (v_tile_dim - j * dv);
                    data[uidx++] = tl1u + (u_tile_dim - i * du);
                    data[uidx++] = tl1v + (v_tile_dim - j * dv);
                }
            }
            // TOP / BOTTOM
            tl0u = 1 * u_tile_step;
            tl0v = 0 * v_tile_step;
            tl1u = 0 * u_tile_step;
            tl1v = 0 * v_tile_step;
            du = u_tile_dim / this.segmentsW;
            dv = v_tile_dim / this.segmentsD;
            for (i = 0; i <= this.segmentsW; i++) {
                for (j = 0; j <= this.segmentsD; j++) {
                    data[uidx++] = tl0u + i * du;
                    data[uidx++] = tl0v + (v_tile_dim - j * dv);
                    data[uidx++] = tl1u + i * du;
                    data[uidx++] = tl1v + j * dv;
                }
            }
            // LEFT / RIGHT
            tl0u = 0 * u_tile_step;
            tl0v = 1 * v_tile_step;
            tl1u = 2 * u_tile_step;
            tl1v = 1 * v_tile_step;
            du = u_tile_dim / this.segmentsD;
            dv = v_tile_dim / this.segmentsH;
            for (i = 0; i <= this.segmentsD; i++) {
                for (j = 0; j <= this.segmentsH; j++) {
                    data[uidx++] = tl0u + i * du;
                    data[uidx++] = tl0v + (v_tile_dim - j * dv);
                    data[uidx++] = tl1u + (u_tile_dim - i * du);
                    data[uidx++] = tl1v + (v_tile_dim - j * dv);
                }
            }
            return data;
        };
        return CubeGeometry;
    }(feng3d.Geometry));
    feng3d.CubeGeometry = CubeGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 球体几何体
     * @author DawnKing 2016-09-12
     */
    var SphereGeometry = (function (_super) {
        __extends(SphereGeometry, _super);
        /**
         * 创建球形几何体
         * @param radius 球体半径
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        function SphereGeometry(radius, segmentsW, segmentsH, yUp) {
            if (radius === void 0) { radius = 50; }
            if (segmentsW === void 0) { segmentsW = 16; }
            if (segmentsH === void 0) { segmentsH = 12; }
            if (yUp === void 0) { yUp = true; }
            var _this = _super.call(this) || this;
            _this._radius = 50;
            _this._segmentsW = 16;
            _this._segmentsH = 12;
            _this._yUp = true;
            _this.radius = radius;
            _this.segmentsW = _this.segmentsW;
            _this.segmentsH = _this.segmentsH;
            _this.yUp = yUp;
            return _this;
        }
        Object.defineProperty(SphereGeometry.prototype, "radius", {
            get: function () {
                return this._radius;
            },
            set: function (value) {
                if (this._radius == value)
                    return;
                this._radius = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SphereGeometry.prototype, "segmentsW", {
            get: function () {
                return this._segmentsW;
            },
            set: function (value) {
                if (this._segmentsW == value)
                    return;
                this._segmentsW = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SphereGeometry.prototype, "segmentsH", {
            get: function () {
                return this._segmentsH;
            },
            set: function (value) {
                if (this._segmentsH == value)
                    return;
                this._segmentsH = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SphereGeometry.prototype, "yUp", {
            get: function () {
                return this._yUp;
            },
            set: function (value) {
                if (this._yUp == value)
                    return;
                this._yUp = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 构建几何体数据
         * @param this.radius 球体半径
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        SphereGeometry.prototype.buildGeometry = function () {
            var vertexPositionData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var vertexNormalData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var vertexTangentData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var startIndex;
            var index = 0;
            var comp1, comp2, t1, t2;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                startIndex = index;
                var horangle = Math.PI * yi / this.segmentsH;
                var z = -this.radius * Math.cos(horangle);
                var ringradius = this.radius * Math.sin(horangle);
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    var verangle = 2 * Math.PI * xi / this.segmentsW;
                    var x = ringradius * Math.cos(verangle);
                    var y = ringradius * Math.sin(verangle);
                    var normLen = 1 / Math.sqrt(x * x + y * y + z * z);
                    var tanLen = Math.sqrt(y * y + x * x);
                    if (this.yUp) {
                        t1 = 0;
                        t2 = tanLen > .007 ? x / tanLen : 0;
                        comp1 = -z;
                        comp2 = y;
                    }
                    else {
                        t1 = tanLen > .007 ? x / tanLen : 0;
                        t2 = 0;
                        comp1 = y;
                        comp2 = z;
                    }
                    if (xi == this.segmentsW) {
                        vertexPositionData[index] = vertexPositionData[startIndex];
                        vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                        vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];
                        vertexNormalData[index] = vertexNormalData[startIndex] + x * normLen * 0.5;
                        vertexNormalData[index + 1] = vertexNormalData[startIndex + 1] + comp1 * normLen * 0.5;
                        vertexNormalData[index + 2] = vertexNormalData[startIndex + 2] + comp2 * normLen * 0.5;
                        vertexTangentData[index] = tanLen > .007 ? -y / tanLen : 1;
                        vertexTangentData[index + 1] = t1;
                        vertexTangentData[index + 2] = t2;
                    }
                    else {
                        vertexPositionData[index] = x;
                        vertexPositionData[index + 1] = comp1;
                        vertexPositionData[index + 2] = comp2;
                        vertexNormalData[index] = x * normLen;
                        vertexNormalData[index + 1] = comp1 * normLen;
                        vertexNormalData[index + 2] = comp2 * normLen;
                        vertexTangentData[index] = tanLen > .007 ? -y / tanLen : 1;
                        vertexTangentData[index + 1] = t1;
                        vertexTangentData[index + 2] = t2;
                    }
                    if (xi > 0 && yi > 0) {
                        if (yi == this.segmentsH) {
                            vertexPositionData[index] = vertexPositionData[startIndex];
                            vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                            vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];
                        }
                    }
                    index += 3;
                }
            }
            this.setVAData("a_position", vertexPositionData, 3);
            this.setVAData("a_normal", vertexNormalData, 3);
            this.setVAData("a_tangent", vertexTangentData, 3);
            var uvData = this.buildUVs();
            this.setVAData("a_uv", uvData, 2);
            var indices = this.buildIndices();
            this.setIndices(indices);
        };
        /**
         * 构建顶点索引
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        SphereGeometry.prototype.buildIndices = function () {
            var indices = new Uint16Array(this.segmentsH * this.segmentsW * 6);
            var numIndices = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    if (xi > 0 && yi > 0) {
                        var a = (this.segmentsW + 1) * yi + xi;
                        var b = (this.segmentsW + 1) * yi + xi - 1;
                        var c = (this.segmentsW + 1) * (yi - 1) + xi - 1;
                        var d = (this.segmentsW + 1) * (yi - 1) + xi;
                        if (yi == this.segmentsH) {
                            indices[numIndices++] = a;
                            indices[numIndices++] = c;
                            indices[numIndices++] = d;
                        }
                        else if (yi == 1) {
                            indices[numIndices++] = a;
                            indices[numIndices++] = b;
                            indices[numIndices++] = c;
                        }
                        else {
                            indices[numIndices++] = a;
                            indices[numIndices++] = b;
                            indices[numIndices++] = c;
                            indices[numIndices++] = a;
                            indices[numIndices++] = c;
                            indices[numIndices++] = d;
                        }
                    }
                }
            }
            return indices;
        };
        /**
         * 构建uv
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         */
        SphereGeometry.prototype.buildUVs = function () {
            var data = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 2);
            var index = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    data[index++] = xi / this.segmentsW;
                    data[index++] = yi / this.segmentsH;
                }
            }
            return data;
        };
        return SphereGeometry;
    }(feng3d.Geometry));
    feng3d.SphereGeometry = SphereGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 胶囊体几何体
     * @author DawnKing 2016-09-12
     */
    var CapsuleGeometry = (function (_super) {
        __extends(CapsuleGeometry, _super);
        /**
         * 创建胶囊几何体
         * @param radius 胶囊体半径
         * @param height 胶囊体高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        function CapsuleGeometry(radius, height, segmentsW, segmentsH, yUp) {
            if (radius === void 0) { radius = 50; }
            if (height === void 0) { height = 100; }
            if (segmentsW === void 0) { segmentsW = 16; }
            if (segmentsH === void 0) { segmentsH = 15; }
            if (yUp === void 0) { yUp = true; }
            var _this = _super.call(this) || this;
            _this._radius = 50;
            _this._height = 100;
            _this._segmentsW = 16;
            _this._segmentsH = 15;
            _this._yUp = true;
            _this.radius = radius;
            _this.height = height;
            _this.segmentsW = segmentsW;
            _this.segmentsH = segmentsH;
            _this.yUp = yUp;
            return _this;
        }
        Object.defineProperty(CapsuleGeometry.prototype, "radius", {
            get: function () {
                return this._radius;
            },
            set: function (value) {
                if (this._radius == value)
                    return;
                this._radius = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CapsuleGeometry.prototype, "height", {
            get: function () {
                return this._height;
            },
            set: function (value) {
                if (this._height == value)
                    return;
                this._height = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CapsuleGeometry.prototype, "segmentsW", {
            get: function () {
                return this._segmentsW;
            },
            set: function (value) {
                if (this._segmentsW == value)
                    return;
                this._segmentsW = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CapsuleGeometry.prototype, "segmentsH", {
            get: function () {
                return this._segmentsH;
            },
            set: function (value) {
                if (this._segmentsH == value)
                    return;
                this._segmentsH = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CapsuleGeometry.prototype, "yUp", {
            get: function () {
                return this._yUp;
            },
            set: function (value) {
                if (this._yUp == value)
                    return;
                this._yUp = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 构建几何体数据
         * @param radius 胶囊体半径
         * @param height 胶囊体高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        CapsuleGeometry.prototype.buildGeometry = function () {
            var vertexPositionData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var vertexNormalData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var vertexTangentData = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 3);
            var startIndex;
            var index = 0;
            var comp1, comp2, t1, t2;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                startIndex = index;
                var horangle = Math.PI * yi / this.segmentsH;
                var z = -this.radius * Math.cos(horangle);
                var ringradius = this.radius * Math.sin(horangle);
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    var verangle = 2 * Math.PI * xi / this.segmentsW;
                    var x = ringradius * Math.cos(verangle);
                    var y = ringradius * Math.sin(verangle);
                    var normLen = 1 / Math.sqrt(x * x + y * y + z * z);
                    var tanLen = Math.sqrt(y * y + x * x);
                    var offset = yi > this.segmentsH / 2 ? this.height / 2 : -this.height / 2;
                    if (this.yUp) {
                        t1 = 0;
                        t2 = tanLen > .007 ? x / tanLen : 0;
                        comp1 = -z;
                        comp2 = y;
                    }
                    else {
                        t1 = tanLen > .007 ? x / tanLen : 0;
                        t2 = 0;
                        comp1 = y;
                        comp2 = z;
                    }
                    if (xi == this.segmentsW) {
                        vertexPositionData[index] = vertexPositionData[startIndex];
                        vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                        vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];
                        vertexNormalData[index] = (vertexNormalData[startIndex] + x * normLen) * 0.5;
                        vertexNormalData[index + 1] = (vertexNormalData[startIndex + 1] + comp1 * normLen) * 0.5;
                        vertexNormalData[index + 2] = (vertexNormalData[startIndex + 2] + comp2 * normLen) * 0.5;
                        vertexTangentData[index] = (vertexTangentData[startIndex] + tanLen > .007 ? -y / tanLen : 1) * 0.5;
                        vertexTangentData[index + 1] = (vertexTangentData[startIndex + 1] + t1) * 0.5;
                        vertexTangentData[index + 2] = (vertexTangentData[startIndex + 2] + t2) * 0.5;
                    }
                    else {
                        vertexPositionData[index] = x;
                        vertexPositionData[index + 1] = this.yUp ? comp1 - offset : comp1;
                        vertexPositionData[index + 2] = this.yUp ? comp2 : comp2 + offset;
                        vertexNormalData[index] = x * normLen;
                        vertexNormalData[index + 1] = comp1 * normLen;
                        vertexNormalData[index + 2] = comp2 * normLen;
                        vertexTangentData[index] = tanLen > .007 ? -y / tanLen : 1;
                        vertexTangentData[index + 1] = t1;
                        vertexTangentData[index + 2] = t2;
                    }
                    if (xi > 0 && yi > 0) {
                        if (yi == this.segmentsH) {
                            vertexPositionData[index] = vertexPositionData[startIndex];
                            vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                            vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];
                        }
                    }
                    index += 3;
                }
            }
            this.setVAData("a_position", vertexPositionData, 3);
            this.setVAData("a_normal", vertexNormalData, 3);
            this.setVAData("a_tangent", vertexTangentData, 3);
            var uvData = this.buildUVs();
            this.setVAData("a_uv", uvData, 2);
            this.buildIndices();
        };
        /**
         * 构建顶点索引
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        CapsuleGeometry.prototype.buildIndices = function () {
            var indices = new Uint16Array(this.segmentsH * this.segmentsW * 6);
            var numIndices = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    if (xi > 0 && yi > 0) {
                        var a = (this.segmentsW + 1) * yi + xi;
                        var b = (this.segmentsW + 1) * yi + xi - 1;
                        var c = (this.segmentsW + 1) * (yi - 1) + xi - 1;
                        var d = (this.segmentsW + 1) * (yi - 1) + xi;
                        if (yi == this.segmentsH) {
                            indices[numIndices++] = a;
                            indices[numIndices++] = c;
                            indices[numIndices++] = d;
                        }
                        else if (yi == 1) {
                            indices[numIndices++] = a;
                            indices[numIndices++] = b;
                            indices[numIndices++] = c;
                        }
                        else {
                            indices[numIndices++] = a;
                            indices[numIndices++] = b;
                            indices[numIndices++] = c;
                            indices[numIndices++] = a;
                            indices[numIndices++] = c;
                            indices[numIndices++] = d;
                        }
                    }
                }
            }
            this.setIndices(indices);
        };
        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        CapsuleGeometry.prototype.buildUVs = function () {
            var data = new Float32Array((this.segmentsH + 1) * (this.segmentsW + 1) * 2);
            var index = 0;
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    data[index++] = xi / this.segmentsW;
                    data[index++] = yi / this.segmentsH;
                }
            }
            return data;
        };
        return CapsuleGeometry;
    }(feng3d.Geometry));
    feng3d.CapsuleGeometry = CapsuleGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 圆柱体几何体
     * @author DawnKing 2016-09-12
     */
    var CylinderGeometry = (function (_super) {
        __extends(CylinderGeometry, _super);
        /**
         * 创建圆柱体
         */
        function CylinderGeometry(topRadius, bottomRadius, height, segmentsW, segmentsH, topClosed, bottomClosed, surfaceClosed, yUp) {
            if (topRadius === void 0) { topRadius = 50; }
            if (bottomRadius === void 0) { bottomRadius = 50; }
            if (height === void 0) { height = 100; }
            if (segmentsW === void 0) { segmentsW = 16; }
            if (segmentsH === void 0) { segmentsH = 1; }
            if (topClosed === void 0) { topClosed = true; }
            if (bottomClosed === void 0) { bottomClosed = true; }
            if (surfaceClosed === void 0) { surfaceClosed = true; }
            if (yUp === void 0) { yUp = true; }
            var _this = _super.call(this) || this;
            _this._topRadius = 50;
            _this._bottomRadius = 50;
            _this._height = 100;
            _this._segmentsW = 16;
            _this._segmentsH = 1;
            _this._topClosed = true;
            _this._bottomClosed = true;
            _this._surfaceClosed = true;
            _this._yUp = true;
            _this.topRadius = topRadius;
            _this.bottomRadius = bottomRadius;
            _this.height = height;
            _this.segmentsW = segmentsW;
            _this.segmentsH = segmentsH;
            _this.topClosed = topClosed;
            _this.bottomClosed = bottomClosed;
            _this.surfaceClosed = surfaceClosed;
            _this.yUp = yUp;
            return _this;
        }
        Object.defineProperty(CylinderGeometry.prototype, "topRadius", {
            get: function () {
                return this._topRadius;
            },
            set: function (value) {
                if (this._topRadius == value)
                    return;
                this._topRadius = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CylinderGeometry.prototype, "bottomRadius", {
            get: function () {
                return this._bottomRadius;
            },
            set: function (value) {
                if (this._bottomRadius == value)
                    return;
                this._bottomRadius = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CylinderGeometry.prototype, "height", {
            get: function () {
                return this._height;
            },
            set: function (value) {
                if (this._height == value)
                    return;
                this._height = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CylinderGeometry.prototype, "segmentsW", {
            get: function () {
                return this._segmentsW;
            },
            set: function (value) {
                if (this._segmentsW == value)
                    return;
                this._segmentsW = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CylinderGeometry.prototype, "segmentsH", {
            get: function () {
                return this._segmentsH;
            },
            set: function (value) {
                if (this._segmentsH == value)
                    return;
                this._segmentsH = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CylinderGeometry.prototype, "topClosed", {
            get: function () {
                return this._topClosed;
            },
            set: function (value) {
                if (this._topClosed == value)
                    return;
                this._topClosed = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CylinderGeometry.prototype, "bottomClosed", {
            get: function () {
                return this._bottomClosed;
            },
            set: function (value) {
                if (this._bottomClosed == value)
                    return;
                this._bottomClosed = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CylinderGeometry.prototype, "surfaceClosed", {
            get: function () {
                return this._surfaceClosed;
            },
            set: function (value) {
                if (this._surfaceClosed == value)
                    return;
                this._surfaceClosed = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(CylinderGeometry.prototype, "yUp", {
            get: function () {
                return this._yUp;
            },
            set: function (value) {
                if (this._yUp == value)
                    return;
                this._yUp = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 计算几何体顶点数
         */
        CylinderGeometry.prototype.getNumVertices = function () {
            var numVertices = 0;
            if (this.surfaceClosed)
                numVertices += (this.segmentsH + 1) * (this.segmentsW + 1);
            if (this.topClosed)
                numVertices += 2 * (this.segmentsW + 1);
            if (this.bottomClosed)
                numVertices += 2 * (this.segmentsW + 1);
            return numVertices;
        };
        /**
         * 计算几何体三角形数量
         */
        CylinderGeometry.prototype.getNumTriangles = function () {
            var numTriangles = 0;
            if (this.surfaceClosed)
                numTriangles += this.segmentsH * this.segmentsW * 2;
            if (this.topClosed)
                numTriangles += this.segmentsW;
            if (this.bottomClosed)
                numTriangles += this.segmentsW;
            return numTriangles;
        };
        /**
         * 构建几何体数据
         */
        CylinderGeometry.prototype.buildGeometry = function () {
            var i, j, index = 0;
            var x, y, z, radius, revolutionAngle;
            var dr, latNormElev, latNormBase;
            var comp1, comp2;
            var startIndex = 0;
            var t1, t2;
            var numVertices = this.getNumVertices();
            var vertexPositionData = new Float32Array(numVertices * 3);
            var vertexNormalData = new Float32Array(numVertices * 3);
            var vertexTangentData = new Float32Array(numVertices * 3);
            var revolutionAngleDelta = 2 * Math.PI / this.segmentsW;
            // 顶部
            if (this.topClosed && this.topRadius > 0) {
                z = -0.5 * this.height;
                for (i = 0; i <= this.segmentsW; ++i) {
                    // 中心顶点
                    if (this.yUp) {
                        t1 = 1;
                        t2 = 0;
                        comp1 = -z;
                        comp2 = 0;
                    }
                    else {
                        t1 = 0;
                        t2 = -1;
                        comp1 = 0;
                        comp2 = z;
                    }
                    addVertex(0, comp1, comp2, 0, t1, t2, 1, 0, 0);
                    // 旋转顶点
                    revolutionAngle = i * revolutionAngleDelta;
                    x = this.topRadius * Math.cos(revolutionAngle);
                    y = this.topRadius * Math.sin(revolutionAngle);
                    if (this.yUp) {
                        comp1 = -z;
                        comp2 = y;
                    }
                    else {
                        comp1 = y;
                        comp2 = z;
                    }
                    if (i == this.segmentsW) {
                        addVertex(vertexPositionData[startIndex + 3], vertexPositionData[startIndex + 4], vertexPositionData[startIndex + 5], 0, t1, t2, 1, 0, 0);
                    }
                    else {
                        addVertex(x, comp1, comp2, 0, t1, t2, 1, 0, 0);
                    }
                }
            }
            // 底部
            if (this.bottomClosed && this.bottomRadius > 0) {
                z = 0.5 * this.height;
                startIndex = index;
                for (i = 0; i <= this.segmentsW; ++i) {
                    // 中心顶点
                    if (this.yUp) {
                        t1 = -1;
                        t2 = 0;
                        comp1 = -z;
                        comp2 = 0;
                    }
                    else {
                        t1 = 0;
                        t2 = 1;
                        comp1 = 0;
                        comp2 = z;
                    }
                    addVertex(0, comp1, comp2, 0, t1, t2, 1, 0, 0);
                    // 旋转顶点
                    revolutionAngle = i * revolutionAngle;
                    x = this.bottomRadius * Math.cos(revolutionAngle);
                    y = this.bottomRadius * Math.sin(revolutionAngle);
                    if (this.yUp) {
                        comp1 = -z;
                        comp2 = y;
                    }
                    else {
                        comp1 = y;
                        comp2 = z;
                    }
                    if (i == this.segmentsW) {
                        addVertex(x, vertexPositionData[startIndex + 1], vertexPositionData[startIndex + 2], 0, t1, t2, 1, 0, 0);
                    }
                    else {
                        addVertex(x, comp1, comp2, 0, t1, t2, 1, 0, 0);
                    }
                }
            }
            // 侧面
            dr = this.bottomRadius - this.topRadius;
            latNormElev = dr / this.height;
            latNormBase = (latNormElev == 0) ? 1 : this.height / dr;
            if (this.surfaceClosed) {
                var a, b, c, d;
                var na0, na1, naComp1, naComp2;
                for (j = 0; j <= this.segmentsH; ++j) {
                    radius = this.topRadius - ((j / this.segmentsH) * (this.topRadius - this.bottomRadius));
                    z = -(this.height / 2) + (j / this.segmentsH * this.height);
                    startIndex = index;
                    for (i = 0; i <= this.segmentsW; ++i) {
                        revolutionAngle = i * revolutionAngleDelta;
                        x = radius * Math.cos(revolutionAngle);
                        y = radius * Math.sin(revolutionAngle);
                        na0 = latNormBase * Math.cos(revolutionAngle);
                        na1 = latNormBase * Math.sin(revolutionAngle);
                        if (this.yUp) {
                            t1 = 0;
                            t2 = -na0;
                            comp1 = -z;
                            comp2 = y;
                            naComp1 = latNormElev;
                            naComp2 = na1;
                        }
                        else {
                            t1 = -na0;
                            t2 = 0;
                            comp1 = y;
                            comp2 = z;
                            naComp1 = na1;
                            naComp2 = latNormElev;
                        }
                        if (i == this.segmentsW) {
                            addVertex(vertexPositionData[startIndex], vertexPositionData[startIndex + 1], vertexPositionData[startIndex + 2], na0, latNormElev, na1, na1, t1, t2);
                        }
                        else {
                            addVertex(x, comp1, comp2, na0, naComp1, naComp2, -na1, t1, t2);
                        }
                    }
                }
            }
            this.setVAData("a_position", vertexPositionData, 3);
            this.setVAData("a_normal", vertexNormalData, 3);
            this.setVAData("a_tangent", vertexTangentData, 3);
            function addVertex(px, py, pz, nx, ny, nz, tx, ty, tz) {
                vertexPositionData[index] = px;
                vertexPositionData[index + 1] = py;
                vertexPositionData[index + 2] = pz;
                vertexNormalData[index] = nx;
                vertexNormalData[index + 1] = ny;
                vertexNormalData[index + 2] = nz;
                vertexTangentData[index] = tx;
                vertexTangentData[index + 1] = ty;
                vertexTangentData[index + 2] = tz;
                index += 3;
            }
            //
            var uvData = this.buildUVs();
            this.setVAData("a_uv", uvData, 2);
            var indices = this.buildIndices();
            this.setIndices(indices);
        };
        /**
         * 构建顶点索引
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        CylinderGeometry.prototype.buildIndices = function () {
            var i, j, index = 0;
            var numTriangles = this.getNumTriangles();
            var indices = new Uint16Array(numTriangles * 3);
            var numIndices = 0;
            // 顶部
            if (this.topClosed && this.topRadius > 0) {
                for (i = 0; i <= this.segmentsW; ++i) {
                    index += 2;
                    if (i > 0)
                        addTriangleClockWise(index - 1, index - 3, index - 2);
                }
            }
            // 底部
            if (this.bottomClosed && this.bottomRadius > 0) {
                for (i = 0; i <= this.segmentsW; ++i) {
                    index += 2;
                    if (i > 0)
                        addTriangleClockWise(index - 2, index - 3, index - 1);
                }
            }
            // 侧面
            if (this.surfaceClosed) {
                var a, b, c, d;
                for (j = 0; j <= this.segmentsH; ++j) {
                    for (i = 0; i <= this.segmentsW; ++i) {
                        index++;
                        if (i > 0 && j > 0) {
                            a = index - 1;
                            b = index - 2;
                            c = b - this.segmentsW - 1;
                            d = a - this.segmentsW - 1;
                            addTriangleClockWise(a, b, c);
                            addTriangleClockWise(a, c, d);
                        }
                    }
                }
            }
            return indices;
            function addTriangleClockWise(cwVertexIndex0, cwVertexIndex1, cwVertexIndex2) {
                indices[numIndices++] = cwVertexIndex0;
                indices[numIndices++] = cwVertexIndex1;
                indices[numIndices++] = cwVertexIndex2;
            }
        };
        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        CylinderGeometry.prototype.buildUVs = function () {
            var i, j;
            var x, y, revolutionAngle;
            var numVertices = this.getNumVertices();
            var data = new Float32Array(numVertices * 2);
            var revolutionAngleDelta = 2 * Math.PI / this.segmentsW;
            var index = 0;
            // 顶部
            if (this.topClosed) {
                for (i = 0; i <= this.segmentsW; ++i) {
                    revolutionAngle = i * revolutionAngleDelta;
                    x = 0.5 + 0.5 * -Math.cos(revolutionAngle);
                    y = 0.5 + 0.5 * Math.sin(revolutionAngle);
                    // 中心顶点
                    data[index++] = 0.5;
                    data[index++] = 0.5;
                    // 旋转顶点
                    data[index++] = x;
                    data[index++] = y;
                }
            }
            // 底部
            if (this.bottomClosed) {
                for (i = 0; i <= this.segmentsW; ++i) {
                    revolutionAngle = i * revolutionAngleDelta;
                    x = 0.5 + 0.5 * Math.cos(revolutionAngle);
                    y = 0.5 + 0.5 * Math.sin(revolutionAngle);
                    // 中心顶点
                    data[index++] = 0.5;
                    data[index++] = 0.5;
                    // 旋转顶点
                    data[index++] = x;
                    data[index++] = y;
                }
            }
            // 侧面
            if (this.surfaceClosed) {
                for (j = 0; j <= this.segmentsH; ++j) {
                    for (i = 0; i <= this.segmentsW; ++i) {
                        // 旋转顶点
                        data[index++] = (i / this.segmentsW);
                        data[index++] = (j / this.segmentsH);
                    }
                }
            }
            return data;
        };
        return CylinderGeometry;
    }(feng3d.Geometry));
    feng3d.CylinderGeometry = CylinderGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 圆锥体
     * @author feng 2017-02-07
     */
    var ConeGeometry = (function (_super) {
        __extends(ConeGeometry, _super);
        /**
         * 创建圆锥体
         * @param radius 底部半径
         * @param height 高度
         * @param segmentsW
         * @param segmentsH
         * @param yUp
         */
        function ConeGeometry(radius, height, segmentsW, segmentsH, closed, yUp) {
            if (radius === void 0) { radius = 50; }
            if (height === void 0) { height = 100; }
            if (segmentsW === void 0) { segmentsW = 16; }
            if (segmentsH === void 0) { segmentsH = 1; }
            if (closed === void 0) { closed = true; }
            if (yUp === void 0) { yUp = true; }
            return _super.call(this, 0, radius, height, segmentsW, segmentsH, false, closed, true, yUp) || this;
        }
        return ConeGeometry;
    }(feng3d.CylinderGeometry));
    feng3d.ConeGeometry = ConeGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 圆环几何体
     */
    var TorusGeometry = (function (_super) {
        __extends(TorusGeometry, _super);
        /**
         * 创建<code>Torus</code>实例
         * @param radius						圆环半径
         * @param tubeRadius					管道半径
         * @param segmentsR						横向段数
         * @param segmentsT						纵向段数
         * @param yUp							Y轴是否朝上
         */
        function TorusGeometry(radius, tubeRadius, segmentsR, segmentsT, yUp) {
            if (radius === void 0) { radius = 50; }
            if (tubeRadius === void 0) { tubeRadius = 10; }
            if (segmentsR === void 0) { segmentsR = 16; }
            if (segmentsT === void 0) { segmentsT = 8; }
            if (yUp === void 0) { yUp = true; }
            var _this = _super.call(this) || this;
            _this._radius = 50;
            _this._tubeRadius = 10;
            _this._segmentsR = 16;
            _this._segmentsT = 8;
            _this._yUp = true;
            _this._vertexPositionStride = 3;
            _this._vertexNormalStride = 3;
            _this._vertexTangentStride = 3;
            _this.radius = radius;
            _this.tubeRadius = tubeRadius;
            _this.segmentR = segmentsR;
            _this.segmentsT = segmentsT;
            _this.yUp = yUp;
            return _this;
        }
        Object.defineProperty(TorusGeometry.prototype, "radius", {
            get: function () {
                return this._radius;
            },
            set: function (value) {
                if (this._radius == value)
                    return;
                this._radius = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TorusGeometry.prototype, "tubeRadius", {
            get: function () {
                return this._tubeRadius;
            },
            set: function (value) {
                if (this._tubeRadius == value)
                    return;
                this._tubeRadius = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TorusGeometry.prototype, "segmentsR", {
            get: function () {
                return this._segmentsR;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TorusGeometry.prototype, "segmentR", {
            set: function (value) {
                if (this._segmentsR == value)
                    return;
                this._segmentsR = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TorusGeometry.prototype, "segmentsT", {
            get: function () {
                return this._segmentsT;
            },
            set: function (value) {
                if (this._segmentsT == value)
                    return;
                this._segmentsT = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TorusGeometry.prototype, "yUp", {
            get: function () {
                return this._yUp;
            },
            set: function (value) {
                if (this._yUp == value)
                    return;
                this._yUp = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 添加顶点数据
         */
        TorusGeometry.prototype.addVertex = function (vertexIndex, px, py, pz, nx, ny, nz, tx, ty, tz) {
            this._vertexPositionData[vertexIndex * this._vertexPositionStride] = px;
            this._vertexPositionData[vertexIndex * this._vertexPositionStride + 1] = py;
            this._vertexPositionData[vertexIndex * this._vertexPositionStride + 2] = pz;
            this._vertexNormalData[vertexIndex * this._vertexNormalStride] = nx;
            this._vertexNormalData[vertexIndex * this._vertexNormalStride + 1] = ny;
            this._vertexNormalData[vertexIndex * this._vertexNormalStride + 2] = nz;
            this._vertexTangentData[vertexIndex * this._vertexTangentStride] = tx;
            this._vertexTangentData[vertexIndex * this._vertexTangentStride + 1] = ty;
            this._vertexTangentData[vertexIndex * this._vertexTangentStride + 2] = tz;
        };
        /**
         * 添加三角形索引数据
         * @param currentTriangleIndex		当前三角形索引
         * @param cwVertexIndex0			索引0
         * @param cwVertexIndex1			索引1
         * @param cwVertexIndex2			索引2
         */
        TorusGeometry.prototype.addTriangleClockWise = function (currentTriangleIndex, cwVertexIndex0, cwVertexIndex1, cwVertexIndex2) {
            this._rawIndices[currentTriangleIndex * 3] = cwVertexIndex0;
            this._rawIndices[currentTriangleIndex * 3 + 1] = cwVertexIndex1;
            this._rawIndices[currentTriangleIndex * 3 + 2] = cwVertexIndex2;
        };
        /**
         * @inheritDoc
         */
        TorusGeometry.prototype.buildGeometry = function () {
            var i, j;
            var x, y, z, nx, ny, nz, revolutionAngleR, revolutionAngleT;
            var numTriangles;
            // reset utility variables
            this._numVertices = 0;
            this._vertexIndex = 0;
            this._currentTriangleIndex = 0;
            // evaluate target number of vertices, triangles and indices
            this._numVertices = (this.segmentsT + 1) * (this.segmentsR + 1); // this.segmentsT + 1 because of closure, this.segmentsR + 1 because of closure
            numTriangles = this.segmentsT * this.segmentsR * 2; // each level has segmentR quads, each of 2 triangles
            this._vertexPositionData = new Float32Array(this._numVertices * this._vertexPositionStride);
            this._vertexNormalData = new Float32Array(this._numVertices * this._vertexNormalStride);
            this._vertexTangentData = new Float32Array(this._numVertices * this._vertexTangentStride);
            this._rawIndices = new Uint16Array(numTriangles * 3);
            this.buildUVs();
            // evaluate revolution steps
            var revolutionAngleDeltaR = 2 * Math.PI / this.segmentsR;
            var revolutionAngleDeltaT = 2 * Math.PI / this.segmentsT;
            var comp1, comp2;
            var t1, t2, n1, n2;
            var startPositionIndex;
            // surface
            var a, b, c, d, length;
            for (j = 0; j <= this.segmentsT; ++j) {
                startPositionIndex = j * (this.segmentsR + 1) * this._vertexPositionStride;
                for (i = 0; i <= this.segmentsR; ++i) {
                    this._vertexIndex = j * (this.segmentsR + 1) + i;
                    // revolution vertex
                    revolutionAngleR = i * revolutionAngleDeltaR;
                    revolutionAngleT = j * revolutionAngleDeltaT;
                    length = Math.cos(revolutionAngleT);
                    nx = length * Math.cos(revolutionAngleR);
                    ny = length * Math.sin(revolutionAngleR);
                    nz = Math.sin(revolutionAngleT);
                    x = this.radius * Math.cos(revolutionAngleR) + this.tubeRadius * nx;
                    y = this.radius * Math.sin(revolutionAngleR) + this.tubeRadius * ny;
                    z = (j == this.segmentsT) ? 0 : this.tubeRadius * nz;
                    if (this.yUp) {
                        n1 = -nz;
                        n2 = ny;
                        t1 = 0;
                        t2 = (length ? nx / length : x / this.radius);
                        comp1 = -z;
                        comp2 = y;
                    }
                    else {
                        n1 = ny;
                        n2 = nz;
                        t1 = (length ? nx / length : x / this.radius);
                        t2 = 0;
                        comp1 = y;
                        comp2 = z;
                    }
                    if (i == this.segmentsR) {
                        this.addVertex(this._vertexIndex, x, this._vertexPositionData[startPositionIndex + 1], this._vertexPositionData[startPositionIndex + 2], nx, n1, n2, -(length ? ny / length : y / this.radius), t1, t2);
                    }
                    else {
                        this.addVertex(this._vertexIndex, x, comp1, comp2, nx, n1, n2, -(length ? ny / length : y / this.radius), t1, t2);
                    }
                    // close triangle
                    if (i > 0 && j > 0) {
                        a = this._vertexIndex; // current
                        b = this._vertexIndex - 1; // previous
                        c = b - this.segmentsR - 1; // previous of last level
                        d = a - this.segmentsR - 1; // current of last level
                        this.addTriangleClockWise(this._currentTriangleIndex++, a, b, c);
                        this.addTriangleClockWise(this._currentTriangleIndex++, a, c, d);
                    }
                }
            }
            this.setVAData("a_position", this._vertexPositionData, 3);
            this.setVAData("a_normal", this._vertexNormalData, 3);
            this.setVAData("a_tangent", this._vertexTangentData, 3);
            this.setIndices(this._rawIndices);
        };
        /**
         * @inheritDoc
         */
        TorusGeometry.prototype.buildUVs = function () {
            var i, j;
            var stride = 2;
            var data = new Float32Array(this._numVertices * stride);
            // evaluate num uvs
            var numUvs = this._numVertices * stride;
            // current uv component index
            var currentUvCompIndex = 0;
            var index = 0;
            // surface
            for (j = 0; j <= this.segmentsT; ++j) {
                for (i = 0; i <= this.segmentsR; ++i) {
                    index = j * (this.segmentsR + 1) + i;
                    // revolution vertex
                    data[index * stride] = i / this.segmentsR;
                    data[index * stride + 1] = j / this.segmentsT;
                }
            }
            // build real data from raw data
            this.setVAData("a_uv", data, 2);
        };
        return TorusGeometry;
    }(feng3d.Geometry));
    feng3d.TorusGeometry = TorusGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 天空盒几何体
     * @author feng 2016-09-12
     */
    var SkyBoxGeometry = (function (_super) {
        __extends(SkyBoxGeometry, _super);
        /**
         * 创建天空盒
         */
        function SkyBoxGeometry() {
            var _this = _super.call(this) || this;
            //八个顶点，32个number
            var vertexPositionData = new Float32Array([
                -1, 1, -1,
                1, 1, -1,
                1, 1, 1,
                -1, 1, 1,
                -1, -1, -1,
                1, -1, -1,
                1, -1, 1,
                -1, -1, 1 //
            ]);
            _this.setVAData("a_position", vertexPositionData, 3);
            //6个面，12个三角形，36个顶点索引
            var indices = new Uint16Array([
                0, 1, 2, 2, 3, 0,
                6, 5, 4, 4, 7, 6,
                2, 6, 7, 7, 3, 2,
                4, 5, 1, 1, 0, 4,
                4, 0, 3, 3, 7, 4,
                2, 1, 5, 5, 6, 2 //
            ]);
            _this.setIndices(indices);
            return _this;
        }
        return SkyBoxGeometry;
    }(feng3d.Geometry));
    feng3d.SkyBoxGeometry = SkyBoxGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 纹理信息
     * @author feng 2016-12-20
     */
    var TextureInfo = (function (_super) {
        __extends(TextureInfo, _super);
        /**
         * 构建纹理
         */
        function TextureInfo() {
            var _this = _super.call(this) || this;
            _this._width = 100;
            _this._height = 100;
            _this._size = new feng3d.Point(100, 100);
            _this._format = feng3d.GL.RGB;
            _this._type = feng3d.GL.UNSIGNED_BYTE;
            _this._generateMipmap = false;
            _this._flipY = false;
            _this._premulAlpha = false;
            _this.minFilter = feng3d.GL.LINEAR;
            _this.magFilter = feng3d.GL.LINEAR;
            /**
             * 表示x轴的纹理的回环方式，就是当纹理的宽度小于需要贴图的平面的宽度的时候，平面剩下的部分应该p以何种方式贴图的问题。
             */
            _this.wrapS = feng3d.GL.REPEAT;
            /**
             * 表示y轴的纹理回环方式。 magFilter和minFilter表示过滤的方式，这是OpenGL的基本概念，我将在下面讲一下，目前你不用担心它的使用。当您不设置的时候，它会取默认值，所以，我们这里暂时不理睬他。
             */
            _this.wrapT = feng3d.GL.REPEAT;
            /**
             * 各向异性过滤。使用各向异性过滤能够使纹理的效果更好，但是会消耗更多的内存、CPU、GPU时间。默认为0。
             */
            _this.anisotropy = 0;
            /**
             * 纹理缓冲
             */
            _this._textureMap = new feng3d.Map();
            /**
             * 是否失效
             */
            _this._invalid = true;
            return _this;
        }
        Object.defineProperty(TextureInfo.prototype, "textureType", {
            /**
             * 纹理类型
             */
            get: function () { return this._textureType; },
            set: function (value) { this._textureType = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "pixels", {
            /**
             * 图片数据
             */
            get: function () { return this._pixels; },
            set: function (value) { this._pixels = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "width", {
            /**
             * 纹理宽度
             */
            get: function () {
                var o = {};
                if (this._pixels && this._pixels.hasOwnProperty("width"))
                    return this._pixels["width"];
                return this._width;
            },
            set: function (value) { this._width = value; },
            enumerable: true,
            configurable: true
        });
        ;
        Object.defineProperty(TextureInfo.prototype, "height", {
            /**
             * 纹理高度
             */
            get: function () {
                var o = {};
                if (this._pixels && this._pixels.hasOwnProperty("height"))
                    return this._pixels["height"];
                return this._height;
            },
            set: function (value) { this._height = value; },
            enumerable: true,
            configurable: true
        });
        ;
        Object.defineProperty(TextureInfo.prototype, "size", {
            /**
             * 纹理尺寸
             */
            get: function () { this._size.setTo(this.width, this.height); return this._size; },
            set: function (value) { this.width = value.x; this.height = value.y; },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "format", {
            /**
             * 格式
             */
            get: function () { return this._format; },
            set: function (value) { this._format = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "type", {
            /**
             * 数据类型
             */
            get: function () { return this._type; },
            set: function (value) { this._type = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "generateMipmap", {
            /**
             * 是否生成mipmap
             */
            get: function () { return this._generateMipmap; },
            set: function (value) { this._generateMipmap = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "flipY", {
            /**
             * 对图像进行Y轴反转。默认值为false
             */
            get: function () { return this._flipY; },
            set: function (value) { this._flipY = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TextureInfo.prototype, "premulAlpha", {
            /**
             * 将图像RGB颜色值得每一个分量乘以A。默认为false
             */
            get: function () { return this._premulAlpha; },
            set: function (value) { this._premulAlpha = value; this.invalidate(); },
            enumerable: true,
            configurable: true
        });
        /**
         * 判断数据是否满足渲染需求
         */
        TextureInfo.prototype.checkRenderData = function () {
            feng3d.debuger && feng3d.assert(false);
            return false;
        };
        /**
         * 使纹理失效
         */
        TextureInfo.prototype.invalidate = function () {
            this._invalid = true;
        };
        /**
         * 激活纹理
         * @param gl
         */
        TextureInfo.prototype.active = function (gl) {
            if (!this.checkRenderData())
                return;
            if (this._invalid) {
                this.clear();
                this._invalid = false;
            }
            var texture = this.getTexture(gl);
            //绑定纹理
            gl.bindTexture(this._textureType, texture);
            //设置纹理参数
            gl.texParameteri(this._textureType, feng3d.GL.TEXTURE_MIN_FILTER, this.minFilter);
            gl.texParameteri(this._textureType, feng3d.GL.TEXTURE_MAG_FILTER, this.magFilter);
            gl.texParameteri(this._textureType, feng3d.GL.TEXTURE_WRAP_S, this.wrapS);
            gl.texParameteri(this._textureType, feng3d.GL.TEXTURE_WRAP_T, this.wrapT);
            //
            if (this.anisotropy) {
                if (gl.anisotropicExt) {
                    gl.texParameterf(gl.TEXTURE_2D, gl.anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(this.anisotropy, gl.maxAnisotropy));
                }
                else {
                    feng3d.debuger && alert("浏览器不支持各向异性过滤（anisotropy）特性！");
                }
            }
        };
        /**
         * 获取顶点属性缓冲
         * @param data  数据
         */
        TextureInfo.prototype.getTexture = function (gl) {
            var texture = this._textureMap.get(gl);
            if (!texture) {
                texture = gl.createTexture(); // Create a texture object
                texture.uuid = Math.generateUUID();
                //设置图片y轴方向
                gl.pixelStorei(feng3d.GL.UNPACK_FLIP_Y_WEBGL, this.flipY ? 1 : 0);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premulAlpha ? 1 : 0);
                //绑定纹理
                gl.bindTexture(this._textureType, texture);
                if (this._textureType == feng3d.GL.TEXTURE_2D) {
                    //设置纹理图片
                    this.initTexture2D(gl);
                }
                else if (this._textureType == feng3d.GL.TEXTURE_CUBE_MAP) {
                    this.initTextureCube(gl);
                }
                if (this._generateMipmap) {
                    gl.generateMipmap(this._textureType);
                }
                this._textureMap.push(gl, texture);
            }
            return texture;
        };
        /**
         * 初始化纹理
         */
        TextureInfo.prototype.initTexture2D = function (gl) {
            gl.texImage2D(this._textureType, 0, this._format, this._format, this._type, this._pixels);
        };
        /**
         * 初始化纹理
         */
        TextureInfo.prototype.initTextureCube = function (gl) {
            var faces = [
                feng3d.GL.TEXTURE_CUBE_MAP_POSITIVE_X, feng3d.GL.TEXTURE_CUBE_MAP_POSITIVE_Y, feng3d.GL.TEXTURE_CUBE_MAP_POSITIVE_Z,
                feng3d.GL.TEXTURE_CUBE_MAP_NEGATIVE_X, feng3d.GL.TEXTURE_CUBE_MAP_NEGATIVE_Y, feng3d.GL.TEXTURE_CUBE_MAP_NEGATIVE_Z
            ];
            for (var i = 0; i < faces.length; i++) {
                gl.texImage2D(faces[i], 0, this._format, this._format, this._type, this._pixels[i]);
            }
        };
        /**
         * 清理纹理
         */
        TextureInfo.prototype.clear = function () {
            var gls = this._textureMap.getKeys();
            for (var i = 0; i < gls.length; i++) {
                gls[i].deleteTexture(this._textureMap.get(gls[i]));
            }
            this._textureMap.clear();
        };
        return TextureInfo;
    }(feng3d.EventDispatcher));
    feng3d.TextureInfo = TextureInfo;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    var Texture2D = (function (_super) {
        __extends(Texture2D, _super);
        function Texture2D(url) {
            if (url === void 0) { url = ""; }
            var _this = _super.call(this) || this;
            _this._textureType = feng3d.TextureType.TEXTURE_2D;
            _this._pixels = new Image();
            _this._pixels.crossOrigin = "Anonymous";
            _this._pixels.addEventListener("load", _this.onLoad.bind(_this));
            _this._pixels.src = url;
            return _this;
        }
        Object.defineProperty(Texture2D.prototype, "url", {
            get: function () {
                return this._pixels.src;
            },
            set: function (value) {
                this._pixels.src = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 处理加载完成
         */
        Texture2D.prototype.onLoad = function () {
            this.invalidate();
            this.dispatchEvent(new feng3d.Event(feng3d.Event.LOADED, this));
        };
        /**
         * 判断数据是否满足渲染需求
         */
        Texture2D.prototype.checkRenderData = function () {
            if (!this._pixels)
                return false;
            if (!this._pixels.width || !this._pixels.height)
                return false;
            return true;
        };
        return Texture2D;
    }(feng3d.TextureInfo));
    feng3d.Texture2D = Texture2D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 立方体纹理
     * @author feng 2016-12-28
     */
    var TextureCube = (function (_super) {
        __extends(TextureCube, _super);
        function TextureCube(images) {
            var _this = _super.call(this) || this;
            _this._textureType = feng3d.TextureType.TEXTURE_CUBE_MAP;
            _this._pixels = [];
            for (var i = 0; i < 6; i++) {
                _this._pixels[i] = new Image();
                _this._pixels[i].crossOrigin = "Anonymous";
                _this._pixels[i].addEventListener("load", _this.invalidate.bind(_this));
                _this._pixels[i].src = images[i];
            }
            return _this;
        }
        /**
         * 判断数据是否满足渲染需求
         */
        TextureCube.prototype.checkRenderData = function () {
            if (!this._pixels)
                return false;
            for (var i = 0; i < this._pixels.length; i++) {
                var element = this._pixels[i];
                if (!element.width || !element.height)
                    return false;
            }
            return true;
        };
        return TextureCube;
    }(feng3d.TextureInfo));
    feng3d.TextureCube = TextureCube;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染目标纹理
     */
    var RenderTargetTexture = (function (_super) {
        __extends(RenderTargetTexture, _super);
        function RenderTargetTexture() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return RenderTargetTexture;
    }(feng3d.TextureInfo));
    feng3d.RenderTargetTexture = RenderTargetTexture;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 材质
     * @author feng 2016-05-02
     */
    var Material = (function (_super) {
        __extends(Material, _super);
        /**
         * 构建材质
         */
        function Material() {
            var _this = _super.call(this) || this;
            _this._pointSize = 1;
            _this._enableBlend = false;
            _this._renderMode = feng3d.RenderMode.TRIANGLES;
            /**
             * 是否渲染双面
             */
            _this.bothSides = true;
            /**
             * 混合方程，默认BlendEquation.FUNC_ADD
             */
            _this.blendEquation = feng3d.BlendEquation.FUNC_ADD;
            /**
             * 源混合因子，默认BlendFactor.SRC_ALPHA
             */
            _this.sfactor = feng3d.BlendFactor.SRC_ALPHA;
            /**
             * 目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA
             */
            _this.dfactor = feng3d.BlendFactor.ONE_MINUS_SRC_ALPHA;
            _this._methods = [];
            _this.createShaderCode(function () { return { vertexCode: _this.vertexCode, fragmentCode: _this.fragmentCode }; });
            _this.createBoolMacro("IS_POINTS_MODE", function () { return _this.renderMode == feng3d.RenderMode.POINTS; });
            _this.createUniformData("u_PointSize", function () { return _this.pointSize; });
            _this.createShaderParam("renderMode", function () { return _this.renderMode; });
            return _this;
        }
        Object.defineProperty(Material.prototype, "renderMode", {
            /**
            * 渲染模式，默认RenderMode.TRIANGLES
            */
            get: function () {
                return this._renderMode;
            },
            set: function (value) {
                this._renderMode = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "vertexCode", {
            /**
             * 顶点渲染程序代码
             */
            get: function () {
                return this._vertexCode;
            },
            set: function (value) {
                if (this._vertexCode == value)
                    return;
                this._vertexCode = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "fragmentCode", {
            /**
             * 片段渲染程序代码
             */
            get: function () {
                return this._fragmentCode;
            },
            set: function (value) {
                if (this._fragmentCode == value)
                    return;
                this._fragmentCode = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "enableBlend", {
            /**
             * 是否开启混合
             * <混合后的颜色> = <源颜色>*sfactor + <目标颜色>*dfactor
             */
            get: function () {
                return this._enableBlend;
            },
            set: function (value) {
                this._enableBlend = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Material.prototype, "pointSize", {
            /**
             * 点绘制时点的尺寸
             */
            get: function () {
                return this._pointSize;
            },
            set: function (value) {
                this._pointSize = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 设置渲染程序
         * @param shaderName 渲染程序名称
         */
        Material.prototype.setShader = function (shaderName) {
            this.vertexCode = feng3d.ShaderLib.getShaderCode(shaderName + ".vertex");
            this.fragmentCode = feng3d.ShaderLib.getShaderCode(shaderName + ".fragment");
        };
        /**
         * 添加方法
         */
        Material.prototype.addMethod = function (method) {
            var index = this._methods.indexOf(method);
            if (index != -1)
                return;
            this._methods.push(method);
            this.addRenderDataHolder(method);
        };
        /**
         * 删除方法
         */
        Material.prototype.removeMethod = function (method) {
            var index = this._methods.indexOf(method);
            if (index != -1) {
                this._methods.splice(index, 1);
                this.removeRenderDataHolder(method);
            }
        };
        return Material;
    }(feng3d.RenderDataHolder));
    feng3d.Material = Material;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 颜色材质
     * @author feng 2017-01-11
     */
    var PointMaterial = (function (_super) {
        __extends(PointMaterial, _super);
        /**
         * 构建颜色材质
         */
        function PointMaterial() {
            var _this = _super.call(this) || this;
            _this.setShader("point");
            _this.renderMode = feng3d.RenderMode.POINTS;
            return _this;
        }
        return PointMaterial;
    }(feng3d.Material));
    feng3d.PointMaterial = PointMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 颜色材质
     * @author feng 2016-05-02
     */
    var ColorMaterial = (function (_super) {
        __extends(ColorMaterial, _super);
        /**
         * 构建颜色材质
         * @param color 颜色
         * @param alpha 透明的
         */
        function ColorMaterial(color) {
            if (color === void 0) { color = null; }
            var _this = _super.call(this) || this;
            _this.setShader("color");
            _this.color = color || new feng3d.Color();
            //
            _this.createUniformData("u_diffuseInput", function () { return _this.color; });
            return _this;
        }
        Object.defineProperty(ColorMaterial.prototype, "color", {
            /**
             * 颜色
             */
            get: function () {
                return this._color;
            },
            set: function (value) {
                if (this._color == value)
                    return;
                this._color = value;
            },
            enumerable: true,
            configurable: true
        });
        return ColorMaterial;
    }(feng3d.Material));
    feng3d.ColorMaterial = ColorMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 线段材质
     * 目前webgl不支持修改线条宽度，参考：https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth
     * @author feng 2016-10-15
     */
    var SegmentMaterial = (function (_super) {
        __extends(SegmentMaterial, _super);
        /**
         * 构建线段材质
         */
        function SegmentMaterial() {
            var _this = _super.call(this) || this;
            _this.setShader("segment");
            _this.renderMode = feng3d.RenderMode.LINES;
            return _this;
        }
        return SegmentMaterial;
    }(feng3d.Material));
    feng3d.SegmentMaterial = SegmentMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 材质组件
     * @author feng 2016-11-01
     */
    var MaterialComponent = (function (_super) {
        __extends(MaterialComponent, _super);
        /**
         * 构建材质组件
         */
        function MaterialComponent() {
            return _super.call(this) || this;
        }
        Object.defineProperty(MaterialComponent.prototype, "material", {
            /**
             * 所属对象
             */
            get: function () { return this._parentComponent; },
            enumerable: true,
            configurable: true
        });
        return MaterialComponent;
    }(feng3d.Component));
    feng3d.MaterialComponent = MaterialComponent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 纹理材质
     * @author feng 2016-12-23
     */
    var TextureMaterial = (function (_super) {
        __extends(TextureMaterial, _super);
        function TextureMaterial() {
            var _this = _super.call(this) || this;
            _this.setShader("texture");
            //
            _this.createUniformData("s_texture", function () { return _this.texture; });
            return _this;
        }
        Object.defineProperty(TextureMaterial.prototype, "texture", {
            /**
             * 纹理数据
             */
            get: function () {
                return this._texture;
            },
            set: function (value) {
                if (this._texture == value)
                    return;
                this._texture = value;
            },
            enumerable: true,
            configurable: true
        });
        return TextureMaterial;
    }(feng3d.Material));
    feng3d.TextureMaterial = TextureMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 天空盒材质
     * @author feng 2016-12-20
     */
    var SkyBoxMaterial = (function (_super) {
        __extends(SkyBoxMaterial, _super);
        function SkyBoxMaterial(images) {
            if (images === void 0) { images = null; }
            var _this = _super.call(this) || this;
            _this.setShader("skybox");
            if (images) {
                _this.texture = new feng3d.TextureCube(images);
            }
            //
            _this.createUniformData("s_skyboxTexture", function () { return _this.texture; });
            return _this;
        }
        Object.defineProperty(SkyBoxMaterial.prototype, "texture", {
            get: function () {
                return this._texture;
            },
            set: function (value) {
                if (this._texture == value)
                    return;
                this._texture = value;
            },
            enumerable: true,
            configurable: true
        });
        return SkyBoxMaterial;
    }(feng3d.Material));
    feng3d.SkyBoxMaterial = SkyBoxMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 标准材质
     * @author feng 2016-05-02
     */
    var StandardMaterial = (function (_super) {
        __extends(StandardMaterial, _super);
        /**
         * 构建
         */
        function StandardMaterial(diffuseUrl, normalUrl, specularUrl, ambientUrl) {
            if (diffuseUrl === void 0) { diffuseUrl = ""; }
            if (normalUrl === void 0) { normalUrl = ""; }
            if (specularUrl === void 0) { specularUrl = ""; }
            if (ambientUrl === void 0) { ambientUrl = ""; }
            var _this = _super.call(this) || this;
            _this.setShader("standard");
            _this.diffuseMethod = new feng3d.DiffuseMethod(diffuseUrl);
            _this.normalMethod = new feng3d.NormalMethod(normalUrl);
            _this.specularMethod = new feng3d.SpecularMethod(specularUrl);
            _this.ambientMethod = new feng3d.AmbientMethod(ambientUrl);
            return _this;
        }
        Object.defineProperty(StandardMaterial.prototype, "diffuseMethod", {
            /**
             * 漫反射函数
             */
            get: function () {
                return this._diffuseMethod;
            },
            set: function (value) {
                this._diffuseMethod = value;
                if (this._diffuseMethod)
                    this.addMethod(this._diffuseMethod);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial.prototype, "normalMethod", {
            /**
             * 法线函数
             */
            get: function () {
                return this._normalMethod;
            },
            set: function (value) {
                this._normalMethod = value;
                if (this._normalMethod)
                    this.addMethod(this._normalMethod);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial.prototype, "specularMethod", {
            /**
             * 镜面反射函数
             */
            get: function () {
                return this._specularMethod;
            },
            set: function (value) {
                this._specularMethod = value;
                if (this._specularMethod)
                    this.addMethod(this._specularMethod);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial.prototype, "ambientMethod", {
            /**
             * 环境反射函数
             */
            get: function () {
                return this._ambientMethod;
            },
            set: function (value) {
                this._ambientMethod = value;
                if (this._ambientMethod)
                    this.addMethod(this._ambientMethod);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(StandardMaterial.prototype, "enableBlend", {
            // /**
            //  * 反射率
            //  */
            // public reflectance: number = 1.0;
            // /**
            //  * 粗糙度
            //  */
            // public roughness: number = 1.0;
            // /**
            //  * 金属度
            //  */
            // public metalic: number = 1.0;
            /**
             * 是否开启混合
             */
            get: function () {
                return this._enableBlend || this.diffuseMethod.color.a != 1.0;
            },
            set: function (value) {
                this._enableBlend = value;
            },
            enumerable: true,
            configurable: true
        });
        return StandardMaterial;
    }(feng3d.Material));
    feng3d.StandardMaterial = StandardMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 漫反射函数
     * @author feng 2017-03-22
     */
    var DiffuseMethod = (function (_super) {
        __extends(DiffuseMethod, _super);
        /**
         * 构建
         */
        function DiffuseMethod(diffuseUrl) {
            if (diffuseUrl === void 0) { diffuseUrl = ""; }
            var _this = _super.call(this) || this;
            /**
             * 基本颜色
             */
            _this.color = new feng3d.Color(1, 1, 1, 1);
            /**
             * 透明阈值，透明度小于该值的像素被片段着色器丢弃
             */
            _this.alphaThreshold = 0;
            _this.difuseTexture = new feng3d.Texture2D(diffuseUrl);
            _this.color = new feng3d.Color(1, 1, 1, 1);
            //
            _this.createUniformData("u_diffuse", function () { return _this.color; });
            _this.createUniformData("s_diffuse", function () { return _this.difuseTexture; });
            _this.createUniformData("u_alphaThreshold", function () { return _this.alphaThreshold; });
            _this.createBoolMacro("HAS_DIFFUSE_SAMPLER", function () { return _this.difuseTexture.checkRenderData(); });
            return _this;
        }
        Object.defineProperty(DiffuseMethod.prototype, "difuseTexture", {
            /**
             * 漫反射纹理
             */
            get: function () {
                return this._difuseTexture;
            },
            set: function (value) {
                this._difuseTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        return DiffuseMethod;
    }(feng3d.RenderDataHolder));
    feng3d.DiffuseMethod = DiffuseMethod;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 法线函数
     * @author feng 2017-03-22
     */
    var NormalMethod = (function (_super) {
        __extends(NormalMethod, _super);
        /**
         * 构建
         */
        function NormalMethod(normalUrl) {
            if (normalUrl === void 0) { normalUrl = ""; }
            var _this = _super.call(this) || this;
            _this.normalTexture = new feng3d.Texture2D(normalUrl);
            //
            _this.createUniformData("s_normal", function () { return _this.normalTexture; });
            _this.createBoolMacro("HAS_NORMAL_SAMPLER", function () { return _this.normalTexture.checkRenderData(); });
            return _this;
        }
        Object.defineProperty(NormalMethod.prototype, "normalTexture", {
            /**
             * 漫反射纹理
             */
            get: function () {
                return this._normalTexture;
            },
            set: function (value) {
                this._normalTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        return NormalMethod;
    }(feng3d.RenderDataHolder));
    feng3d.NormalMethod = NormalMethod;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 法线函数
     * @author feng 2017-03-22
     */
    var SpecularMethod = (function (_super) {
        __extends(SpecularMethod, _super);
        /**
         * 构建
         */
        function SpecularMethod(specularUrl) {
            if (specularUrl === void 0) { specularUrl = ""; }
            var _this = _super.call(this) || this;
            /**
             * 镜面反射颜色
             */
            _this.specularColor = new feng3d.Color();
            /**
             * 高光系数
             */
            _this.glossiness = 50;
            _this.specularTexture = new feng3d.Texture2D(specularUrl);
            //
            _this.createUniformData("s_specular", function () { return _this.specularTexture; });
            _this.createUniformData("u_specular", function () { return _this.specularColor; });
            _this.createUniformData("u_glossiness", function () { return _this.glossiness; });
            _this.createBoolMacro("HAS_SPECULAR_SAMPLER", function () { return _this.specularTexture.checkRenderData(); });
            return _this;
        }
        Object.defineProperty(SpecularMethod.prototype, "specularTexture", {
            /**
             * 镜面反射光泽图
             */
            get: function () {
                return this._specularTexture;
            },
            set: function (value) {
                this._specularTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SpecularMethod.prototype, "specular", {
            /**
             * 镜面反射光反射强度
             */
            get: function () {
                return this.specularColor.a;
            },
            set: function (value) {
                this.specularColor.a = value;
            },
            enumerable: true,
            configurable: true
        });
        return SpecularMethod;
    }(feng3d.RenderDataHolder));
    feng3d.SpecularMethod = SpecularMethod;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 漫反射函数
     * @author feng 2017-03-22
     */
    var AmbientMethod = (function (_super) {
        __extends(AmbientMethod, _super);
        /**
         * 构建
         */
        function AmbientMethod(ambientUrl, color) {
            if (ambientUrl === void 0) { ambientUrl = ""; }
            if (color === void 0) { color = null; }
            var _this = _super.call(this) || this;
            _this.ambientTexture = new feng3d.Texture2D(ambientUrl);
            _this.color = color || new feng3d.Color();
            //
            _this.createUniformData("u_ambient", function () { return _this._color; });
            _this.createUniformData("s_ambient", function () { return _this._ambientTexture; });
            _this.createBoolMacro("HAS_AMBIENT_SAMPLER", function () { return _this.ambientTexture.checkRenderData(); });
            return _this;
        }
        Object.defineProperty(AmbientMethod.prototype, "ambientTexture", {
            /**
             * 环境纹理
             */
            get: function () {
                return this._ambientTexture;
            },
            set: function (value) {
                this._ambientTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AmbientMethod.prototype, "color", {
            /**
             * 颜色
             */
            get: function () {
                return this._color;
            },
            set: function (value) {
                this._color = value;
            },
            enumerable: true,
            configurable: true
        });
        return AmbientMethod;
    }(feng3d.RenderDataHolder));
    feng3d.AmbientMethod = AmbientMethod;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var FogMethod = (function (_super) {
        __extends(FogMethod, _super);
        /**
         * @param fogColor      雾颜色
         * @param minDistance   雾近距离
         * @param maxDistance   雾远距离
         * @param density       雾浓度
         */
        function FogMethod(fogColor, minDistance, maxDistance, density, mode) {
            if (fogColor === void 0) { fogColor = new feng3d.Color(); }
            if (minDistance === void 0) { minDistance = 0; }
            if (maxDistance === void 0) { maxDistance = 100; }
            if (density === void 0) { density = 0.1; }
            if (mode === void 0) { mode = FogMode.LINEAR; }
            var _this = _super.call(this) || this;
            _this._minDistance = 0;
            _this._maxDistance = 100;
            _this._fogColor = fogColor;
            _this._minDistance = minDistance;
            _this._maxDistance = maxDistance;
            _this._density = density;
            _this._mode = mode;
            //
            _this.createUniformData("u_fogColor", _this._fogColor);
            _this.createUniformData("u_fogMinDistance", _this._minDistance);
            _this.createUniformData("u_fogMaxDistance", _this._maxDistance);
            _this.createUniformData("u_fogDensity", _this._density);
            _this.createUniformData("u_fogMode", _this._mode);
            _this.createBoolMacro("HAS_FOG_METHOD", true);
            _this.createAddMacro("V_GLOBAL_POSITION_NEED", 1);
            return _this;
        }
        Object.defineProperty(FogMethod.prototype, "minDistance", {
            /**
             * 出现雾效果的最近距离
             */
            get: function () {
                return this._minDistance;
            },
            set: function (value) {
                this._minDistance = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FogMethod.prototype, "maxDistance", {
            /**
             * 最远距离
             */
            get: function () {
                return this._maxDistance;
            },
            set: function (value) {
                this._maxDistance = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FogMethod.prototype, "fogColor", {
            /**
             * 雾的颜色
             */
            get: function () {
                return this._fogColor;
            },
            set: function (value) {
                this._fogColor = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FogMethod.prototype, "density", {
            get: function () {
                return this._density;
            },
            set: function (value) {
                this.density = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(FogMethod.prototype, "mode", {
            /**
             * 雾模式
             */
            get: function () {
                return this._mode;
            },
            set: function (value) {
                this._mode = value;
            },
            enumerable: true,
            configurable: true
        });
        return FogMethod;
    }(feng3d.RenderDataHolder));
    feng3d.FogMethod = FogMethod;
    /**
     * 雾模式
     */
    var FogMode;
    (function (FogMode) {
        FogMode[FogMode["NONE"] = 0] = "NONE";
        FogMode[FogMode["EXP"] = 1] = "EXP";
        FogMode[FogMode["EXP2"] = 2] = "EXP2";
        FogMode[FogMode["LINEAR"] = 3] = "LINEAR";
    })(FogMode = feng3d.FogMode || (feng3d.FogMode = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 环境映射函数
     */
    var EnvMapMethod = (function (_super) {
        __extends(EnvMapMethod, _super);
        /**
         * 创建EnvMapMethod实例
         * @param envMap		        环境映射贴图
         * @param reflectivity			反射率
         */
        function EnvMapMethod(envMap, reflectivity) {
            if (reflectivity === void 0) { reflectivity = 1; }
            var _this = _super.call(this) || this;
            _this._cubeTexture = envMap;
            _this.reflectivity = reflectivity;
            //
            _this.createUniformData("s_envMap", function () { return _this._cubeTexture; });
            _this.createUniformData("u_reflectivity", function () { return _this._reflectivity; });
            _this.createBoolMacro("HAS_ENV_METHOD", true);
            return _this;
        }
        Object.defineProperty(EnvMapMethod.prototype, "envMap", {
            /**
             * 环境映射贴图
             */
            get: function () {
                return this._cubeTexture;
            },
            set: function (value) {
                if (this._cubeTexture == value)
                    return;
                this._cubeTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(EnvMapMethod.prototype, "reflectivity", {
            /**
             * 反射率
             */
            get: function () {
                return this._reflectivity;
            },
            set: function (value) {
                if (this._reflectivity == value)
                    return;
                this._reflectivity = value;
            },
            enumerable: true,
            configurable: true
        });
        return EnvMapMethod;
    }(feng3d.RenderDataHolder));
    feng3d.EnvMapMethod = EnvMapMethod;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 灯光类型
     * @author feng 2016-12-12
     */
    var LightType;
    (function (LightType) {
        /**
         * 点光
         */
        LightType[LightType["Point"] = 0] = "Point";
        /**
         * 方向光
         */
        LightType[LightType["Directional"] = 1] = "Directional";
        /**
         * 聚光灯
         */
        LightType[LightType["Spot"] = 2] = "Spot";
    })(LightType = feng3d.LightType || (feng3d.LightType = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 灯光
     * @author feng 2016-12-12
     */
    var Light = (function (_super) {
        __extends(Light, _super);
        function Light() {
            var _this = _super.call(this) || this;
            /**
             * 颜色
             */
            _this.color = new feng3d.Color();
            /**
             * 光照强度
             */
            _this.intensity = 1;
            /**
             * 是否生成阴影（未实现）
             */
            _this.castsShadows = false;
            _this._shadowMap = new feng3d.Texture2D();
            Light._lights.push(_this);
            return _this;
        }
        Object.defineProperty(Light, "lights", {
            get: function () {
                return this._lights;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Light.prototype, "shadowMap", {
            get: function () {
                return this._shadowMap;
            },
            enumerable: true,
            configurable: true
        });
        return Light;
    }(feng3d.Component));
    Light._lights = [];
    feng3d.Light = Light;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 方向光源
     * @author feng 2016-12-13
     */
    var DirectionalLight = (function (_super) {
        __extends(DirectionalLight, _super);
        /**
         * 构建
         */
        function DirectionalLight() {
            var _this = _super.call(this) || this;
            _this.lightType = feng3d.LightType.Directional;
            var xDir = 0, yDir = -1, zDir = 1;
            _this.direction = new feng3d.Vector3D(xDir, yDir, zDir);
            _this._sceneDirection = new feng3d.Vector3D(xDir, yDir, zDir);
            _this._sceneDirection.normalize();
            //
            DirectionalLight._directionalLights.push(_this);
            return _this;
        }
        Object.defineProperty(DirectionalLight, "directionalLights", {
            get: function () {
                return this._directionalLights;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DirectionalLight.prototype, "sceneDirection", {
            get: function () {
                return this._sceneDirection;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DirectionalLight.prototype, "direction", {
            /**
             * 光照方向
             */
            get: function () {
                return this._direction;
            },
            set: function (value) {
                this._direction = value;
                if (this.gameObject) {
                    var tmpLookAt = this.gameObject.transform.getPosition();
                    tmpLookAt.incrementBy(this._direction);
                    this.gameObject.transform.lookAt(tmpLookAt);
                    this.gameObject.transform.localToWorldMatrix.copyColumnTo(2, this._sceneDirection);
                    this._sceneDirection.normalize();
                }
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 处理被添加组件事件
         */
        DirectionalLight.prototype.onBeAddedComponent = function (event) {
            this.gameObject.transform.addEventListener(feng3d.Object3DEvent.SCENETRANSFORM_CHANGED, this.onScenetransformChanged, this);
            var tmpLookAt = this.gameObject.transform.getPosition();
            tmpLookAt.incrementBy(this._direction);
            this.gameObject.transform.lookAt(tmpLookAt);
        };
        /**
         * 处理被移除组件事件
         */
        DirectionalLight.prototype.onBeRemovedComponent = function (event) {
            this.gameObject.transform.removeEventListener(feng3d.Object3DEvent.SCENETRANSFORM_CHANGED, this.onScenetransformChanged, this);
        };
        DirectionalLight.prototype.onScenetransformChanged = function () {
            this.gameObject.transform.localToWorldMatrix.copyColumnTo(2, this._sceneDirection);
            this._sceneDirection.normalize();
        };
        return DirectionalLight;
    }(feng3d.Light));
    DirectionalLight._directionalLights = [];
    feng3d.DirectionalLight = DirectionalLight;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 点光源
     * @author feng 2016-12-13
     */
    var PointLight = (function (_super) {
        __extends(PointLight, _super);
        /**
         * 构建
         */
        function PointLight() {
            var _this = _super.call(this) || this;
            /**
             * 光照范围
             */
            _this.range = 600;
            _this.lightType = feng3d.LightType.Point;
            PointLight._pointLights.push(_this);
            return _this;
        }
        Object.defineProperty(PointLight, "pointLights", {
            get: function () {
                return this._pointLights;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PointLight.prototype, "position", {
            /**
             * 灯光位置
             */
            get: function () {
                return this.gameObject.transform.scenePosition;
            },
            enumerable: true,
            configurable: true
        });
        return PointLight;
    }(feng3d.Light));
    PointLight._pointLights = [];
    feng3d.PointLight = PointLight;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var ControllerBase = (function () {
        /**
         * 控制器基类，用于动态调整3D对象的属性
         */
        function ControllerBase(targetObject) {
            this.targetObject = targetObject;
        }
        /**
         * 手动应用更新到目标3D对象
         */
        ControllerBase.prototype.update = function (interpolate) {
            if (interpolate === void 0) { interpolate = true; }
            throw new Error("Abstract method");
        };
        Object.defineProperty(ControllerBase.prototype, "targetObject", {
            get: function () {
                return this._targetObject;
            },
            set: function (val) {
                this._targetObject = val;
            },
            enumerable: true,
            configurable: true
        });
        return ControllerBase;
    }());
    feng3d.ControllerBase = ControllerBase;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var LookAtController = (function (_super) {
        __extends(LookAtController, _super);
        function LookAtController(target, lookAtObject) {
            if (target === void 0) { target = null; }
            if (lookAtObject === void 0) { lookAtObject = null; }
            var _this = _super.call(this, target) || this;
            _this._origin = new feng3d.Vector3D(0.0, 0.0, 0.0);
            _this._upAxis = feng3d.Vector3D.Y_AXIS;
            _this._pos = new feng3d.Vector3D();
            if (lookAtObject)
                _this.lookAtObject = lookAtObject;
            else
                _this.lookAtPosition = new feng3d.Vector3D();
            return _this;
        }
        Object.defineProperty(LookAtController.prototype, "upAxis", {
            get: function () {
                return this._upAxis;
            },
            set: function (upAxis) {
                this._upAxis = upAxis;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LookAtController.prototype, "lookAtPosition", {
            get: function () {
                return this._lookAtPosition;
            },
            set: function (val) {
                this._lookAtPosition = val;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LookAtController.prototype, "lookAtObject", {
            get: function () {
                return this._lookAtObject;
            },
            set: function (value) {
                if (this._lookAtObject == value)
                    return;
                this._lookAtObject = value;
            },
            enumerable: true,
            configurable: true
        });
        LookAtController.prototype.update = function (interpolate) {
            if (interpolate === void 0) { interpolate = true; }
            if (this._targetObject) {
                if (this._lookAtPosition) {
                    this._targetObject.transform.lookAt(this.lookAtPosition, this._upAxis);
                }
                else if (this._lookAtObject) {
                    this._lookAtObject.transform.getPosition(this._pos);
                    this._targetObject.transform.lookAt(this._pos, this._upAxis);
                }
            }
        };
        return LookAtController;
    }(feng3d.ControllerBase));
    feng3d.LookAtController = LookAtController;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var HoverController = (function (_super) {
        __extends(HoverController, _super);
        function HoverController(targetObject, lookAtObject, panAngle, tiltAngle, distance, minTiltAngle, maxTiltAngle, minPanAngle, maxPanAngle, steps, yFactor, wrapPanAngle) {
            if (targetObject === void 0) { targetObject = null; }
            if (lookAtObject === void 0) { lookAtObject = null; }
            if (panAngle === void 0) { panAngle = 0; }
            if (tiltAngle === void 0) { tiltAngle = 90; }
            if (distance === void 0) { distance = 1000; }
            if (minTiltAngle === void 0) { minTiltAngle = -90; }
            if (maxTiltAngle === void 0) { maxTiltAngle = 90; }
            if (minPanAngle === void 0) { minPanAngle = NaN; }
            if (maxPanAngle === void 0) { maxPanAngle = NaN; }
            if (steps === void 0) { steps = 8; }
            if (yFactor === void 0) { yFactor = 2; }
            if (wrapPanAngle === void 0) { wrapPanAngle = false; }
            var _this = _super.call(this, targetObject, lookAtObject) || this;
            _this._currentPanAngle = 0;
            _this._currentTiltAngle = 90;
            _this._panAngle = 0;
            _this._tiltAngle = 90;
            _this._distance = 1000;
            _this._minPanAngle = -Infinity;
            _this._maxPanAngle = Infinity;
            _this._minTiltAngle = -90;
            _this._maxTiltAngle = 90;
            _this._steps = 8;
            _this._yFactor = 2;
            _this._wrapPanAngle = false;
            _this.distance = distance;
            _this.panAngle = panAngle;
            _this.tiltAngle = tiltAngle;
            _this.minPanAngle = minPanAngle || -Infinity;
            _this.maxPanAngle = maxPanAngle || Infinity;
            _this.minTiltAngle = minTiltAngle;
            _this.maxTiltAngle = maxTiltAngle;
            _this.steps = steps;
            _this.yFactor = yFactor;
            _this.wrapPanAngle = wrapPanAngle;
            _this._currentPanAngle = _this._panAngle;
            _this._currentTiltAngle = _this._tiltAngle;
            return _this;
        }
        Object.defineProperty(HoverController.prototype, "steps", {
            get: function () {
                return this._steps;
            },
            set: function (val) {
                val = (val < 1) ? 1 : val;
                if (this._steps == val)
                    return;
                this._steps = val;
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoverController.prototype, "panAngle", {
            get: function () {
                return this._panAngle;
            },
            set: function (val) {
                val = Math.max(this._minPanAngle, Math.min(this._maxPanAngle, val));
                if (this._panAngle == val)
                    return;
                this._panAngle = val;
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoverController.prototype, "tiltAngle", {
            get: function () {
                return this._tiltAngle;
            },
            set: function (val) {
                val = Math.max(this._minTiltAngle, Math.min(this._maxTiltAngle, val));
                if (this._tiltAngle == val)
                    return;
                this._tiltAngle = val;
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoverController.prototype, "distance", {
            get: function () {
                return this._distance;
            },
            set: function (val) {
                if (this._distance == val)
                    return;
                this._distance = val;
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoverController.prototype, "minPanAngle", {
            get: function () {
                return this._minPanAngle;
            },
            set: function (val) {
                if (this._minPanAngle == val)
                    return;
                this._minPanAngle = val;
                this.panAngle = Math.max(this._minPanAngle, Math.min(this._maxPanAngle, this._panAngle));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoverController.prototype, "maxPanAngle", {
            get: function () {
                return this._maxPanAngle;
            },
            set: function (val) {
                if (this._maxPanAngle == val)
                    return;
                this._maxPanAngle = val;
                this.panAngle = Math.max(this._minPanAngle, Math.min(this._maxPanAngle, this._panAngle));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoverController.prototype, "minTiltAngle", {
            get: function () {
                return this._minTiltAngle;
            },
            set: function (val) {
                if (this._minTiltAngle == val)
                    return;
                this._minTiltAngle = val;
                this.tiltAngle = Math.max(this._minTiltAngle, Math.min(this._maxTiltAngle, this._tiltAngle));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoverController.prototype, "maxTiltAngle", {
            get: function () {
                return this._maxTiltAngle;
            },
            set: function (val) {
                if (this._maxTiltAngle == val)
                    return;
                this._maxTiltAngle = val;
                this.tiltAngle = Math.max(this._minTiltAngle, Math.min(this._maxTiltAngle, this._tiltAngle));
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoverController.prototype, "yFactor", {
            get: function () {
                return this._yFactor;
            },
            set: function (val) {
                if (this._yFactor == val)
                    return;
                this._yFactor = val;
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(HoverController.prototype, "wrapPanAngle", {
            get: function () {
                return this._wrapPanAngle;
            },
            set: function (val) {
                if (this._wrapPanAngle == val)
                    return;
                this._wrapPanAngle = val;
                this.update();
            },
            enumerable: true,
            configurable: true
        });
        HoverController.prototype.update = function (interpolate) {
            if (interpolate === void 0) { interpolate = true; }
            if (this._tiltAngle != this._currentTiltAngle || this._panAngle != this._currentPanAngle) {
                if (this._wrapPanAngle) {
                    if (this._panAngle < 0) {
                        this._currentPanAngle += this._panAngle % 360 + 360 - this._panAngle;
                        this._panAngle = this._panAngle % 360 + 360;
                    }
                    else {
                        this._currentPanAngle += this._panAngle % 360 - this._panAngle;
                        this._panAngle = this._panAngle % 360;
                    }
                    while (this._panAngle - this._currentPanAngle < -180)
                        this._currentPanAngle -= 360;
                    while (this._panAngle - this._currentPanAngle > 180)
                        this._currentPanAngle += 360;
                }
                if (interpolate) {
                    this._currentTiltAngle += (this._tiltAngle - this._currentTiltAngle) / (this.steps + 1);
                    this._currentPanAngle += (this._panAngle - this._currentPanAngle) / (this.steps + 1);
                }
                else {
                    this._currentPanAngle = this._panAngle;
                    this._currentTiltAngle = this._tiltAngle;
                }
                if ((Math.abs(this.tiltAngle - this._currentTiltAngle) < 0.01) && (Math.abs(this._panAngle - this._currentPanAngle) < 0.01)) {
                    this._currentTiltAngle = this._tiltAngle;
                    this._currentPanAngle = this._panAngle;
                }
            }
            if (!this._targetObject)
                return;
            if (this._lookAtPosition) {
                this._pos["x"] = this._lookAtPosition["x"];
                this._pos["y"] = this._lookAtPosition["y"];
                this._pos["z"] = this._lookAtPosition["z"];
            }
            else if (this._lookAtObject) {
                if (this._targetObject.transform.parent && this._lookAtObject.transform.parent) {
                    if (this._targetObject.transform.parent != this._lookAtObject.transform.parent) {
                        this._pos["x"] = this._lookAtObject.transform.scenePosition["x"];
                        this._pos["y"] = this._lookAtObject.transform.scenePosition["y"];
                        this._pos["z"] = this._lookAtObject.transform.scenePosition["z"];
                        this._targetObject.transform.parent.worldToLocalMatrix.transformVector(this._pos, this._pos);
                    }
                    else {
                        this._pos.copyFrom(this._lookAtObject.transform.position);
                    }
                }
                else if (this._lookAtObject.transform.scene) {
                    this._pos["x"] = this._lookAtObject.transform.scenePosition["x"];
                    this._pos["y"] = this._lookAtObject.transform.scenePosition["y"];
                    this._pos["z"] = this._lookAtObject.transform.scenePosition["z"];
                }
                else {
                    this._pos.copyFrom(this._lookAtObject.transform.position);
                }
            }
            else {
                this._pos["x"] = this._origin["x"];
                this._pos["y"] = this._origin["y"];
                this._pos["z"] = this._origin["z"];
            }
            this._targetObject.transform.x = this._pos["x"] + this._distance * Math.sin(this._currentPanAngle * Math.DEG2RAD) * Math.cos(this._currentTiltAngle * Math.DEG2RAD);
            this._targetObject.transform.z = this._pos["z"] + this._distance * Math.cos(this._currentPanAngle * Math.DEG2RAD) * Math.cos(this._currentTiltAngle * Math.DEG2RAD);
            this._targetObject.transform.y = this._pos["y"] + this._distance * Math.sin(this._currentTiltAngle * Math.DEG2RAD) * this._yFactor;
            _super.prototype.update.call(this);
        };
        return HoverController;
    }(feng3d.LookAtController));
    feng3d.HoverController = HoverController;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * FPS模式控制器
     * @author feng 2016-12-19
     */
    var FPSController = (function (_super) {
        __extends(FPSController, _super);
        function FPSController(transform) {
            if (transform === void 0) { transform = null; }
            var _this = _super.call(this, transform) || this;
            /**
             * 按键记录
             */
            _this.keyDownDic = {};
            /**
             * 按键方向字典
             */
            _this.keyDirectionDic = {};
            /**
             * 加速度
             */
            _this.acceleration = 0.05;
            _this.init();
            return _this;
        }
        Object.defineProperty(FPSController.prototype, "targetObject", {
            get: function () {
                return this._targetObject;
            },
            set: function (value) {
                if (this._targetObject != null) {
                    feng3d.input.removeEventListener(feng3d.inputType.MOUSE_DOWN, this.onMousedown, this);
                    feng3d.input.removeEventListener(feng3d.inputType.MOUSE_UP, this.onMouseup, this);
                }
                this._targetObject = value;
                if (this._targetObject != null) {
                    feng3d.input.addEventListener(feng3d.inputType.MOUSE_DOWN, this.onMousedown, this);
                    feng3d.input.addEventListener(feng3d.inputType.MOUSE_UP, this.onMouseup, this);
                }
            },
            enumerable: true,
            configurable: true
        });
        FPSController.prototype.onMousedown = function () {
            this.preMousePoint = null;
            this.velocity = new feng3d.Vector3D();
            this.keyDownDic = {};
            feng3d.input.addEventListener(feng3d.inputType.KEY_DOWN, this.onKeydown, this);
            feng3d.input.addEventListener(feng3d.inputType.KEY_UP, this.onKeyup, this);
            feng3d.input.addEventListener(feng3d.inputType.MOUSE_MOVE, this.onMouseMove, this);
            feng3d.ticker.addEventListener(feng3d.Event.ENTER_FRAME, this.onEnterFrame, this);
        };
        FPSController.prototype.onMouseup = function () {
            feng3d.input.removeEventListener(feng3d.inputType.KEY_DOWN, this.onKeydown, this);
            feng3d.input.removeEventListener(feng3d.inputType.KEY_UP, this.onKeyup, this);
            feng3d.input.removeEventListener(feng3d.inputType.MOUSE_MOVE, this.onMouseMove, this);
            feng3d.ticker.removeEventListener(feng3d.Event.ENTER_FRAME, this.onEnterFrame, this);
        };
        FPSController.prototype.onEnterFrame = function () {
            this.update();
        };
        /**
         * 初始化
         */
        FPSController.prototype.init = function () {
            this.keyDirectionDic["a"] = new feng3d.Vector3D(-1, 0, 0); //左
            this.keyDirectionDic["d"] = new feng3d.Vector3D(1, 0, 0); //右
            this.keyDirectionDic["w"] = new feng3d.Vector3D(0, 0, 1); //前
            this.keyDirectionDic["s"] = new feng3d.Vector3D(0, 0, -1); //后
            this.keyDirectionDic["e"] = new feng3d.Vector3D(0, 1, 0); //上
            this.keyDirectionDic["q"] = new feng3d.Vector3D(0, -1, 0); //下
        };
        /**
         * 手动应用更新到目标3D对象
         */
        FPSController.prototype.update = function (interpolate) {
            if (interpolate === void 0) { interpolate = true; }
            if (this.targetObject == null)
                return;
            //计算加速度
            var accelerationVec = new feng3d.Vector3D();
            for (var key in this.keyDirectionDic) {
                if (this.keyDownDic[key] == true) {
                    var element = this.keyDirectionDic[key];
                    accelerationVec.incrementBy(element);
                }
            }
            accelerationVec.scaleBy(this.acceleration);
            //计算速度
            this.velocity.incrementBy(accelerationVec);
            var right = this.targetObject.transform.rightVector;
            var up = this.targetObject.transform.upVector;
            var forward = this.targetObject.transform.forwardVector;
            right.scaleBy(this.velocity.x);
            up.scaleBy(this.velocity.y);
            forward.scaleBy(this.velocity.z);
            //计算位移
            var displacement = right.clone();
            displacement.incrementBy(up);
            displacement.incrementBy(forward);
            this.targetObject.transform.x += displacement.x;
            this.targetObject.transform.y += displacement.y;
            this.targetObject.transform.z += displacement.z;
        };
        /**
         * 处理鼠标移动事件
         */
        FPSController.prototype.onMouseMove = function (event) {
            if (this.targetObject == null)
                return;
            var mousePoint = new feng3d.Point(feng3d.input.clientX, feng3d.input.clientY);
            if (this.preMousePoint == null) {
                this.preMousePoint = mousePoint;
                return;
            }
            //计算旋转
            var offsetPoint = mousePoint.subtract(this.preMousePoint);
            offsetPoint.x *= 0.15;
            offsetPoint.y *= 0.15;
            var matrix3d = this.targetObject.transform.localToWorldMatrix;
            matrix3d.appendRotation(offsetPoint.y, matrix3d.right, matrix3d.position);
            var up = feng3d.Vector3D.Y_AXIS;
            if (matrix3d.up.dotProduct(up) < 0) {
                up = up.clone();
                up.scaleBy(-1);
            }
            matrix3d.appendRotation(offsetPoint.x, up, matrix3d.position);
            this.targetObject.transform.localToWorldMatrix = matrix3d;
            //
            this.preMousePoint = mousePoint;
        };
        /**
         * 键盘按下事件
         */
        FPSController.prototype.onKeydown = function (event) {
            var boardKey = String.fromCharCode(event.keyCode).toLocaleLowerCase();
            if (this.keyDirectionDic[boardKey] == null)
                return;
            if (!this.keyDownDic[boardKey])
                this.stopDirectionVelocity(this.keyDirectionDic[boardKey]);
            this.keyDownDic[boardKey] = true;
        };
        /**
         * 键盘弹起事件
         */
        FPSController.prototype.onKeyup = function (event) {
            var boardKey = String.fromCharCode(event.keyCode).toLocaleLowerCase();
            if (this.keyDirectionDic[boardKey] == null)
                return;
            this.keyDownDic[boardKey] = false;
            this.stopDirectionVelocity(this.keyDirectionDic[boardKey]);
        };
        /**
         * 停止xyz方向运动
         * @param direction     停止运动的方向
         */
        FPSController.prototype.stopDirectionVelocity = function (direction) {
            if (direction == null)
                return;
            if (direction.x != 0) {
                this.velocity.x = 0;
            }
            if (direction.y != 0) {
                this.velocity.y = 0;
            }
            if (direction.z != 0) {
                this.velocity.z = 0;
            }
        };
        return FPSController;
    }(feng3d.ControllerBase));
    feng3d.FPSController = FPSController;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 拾取的碰撞数据
     */
    var PickingCollisionVO = (function () {
        /**
         * 创建射线拾取碰撞数据
         * @param entity
         */
        function PickingCollisionVO(entity) {
            /**
             * 本地坐标系射线
             */
            this.localRay = new feng3d.Ray3D();
            /**
             * 场景中碰撞射线
             */
            this.ray3D = new feng3d.Ray3D();
            this.firstEntity = entity;
        }
        Object.defineProperty(PickingCollisionVO.prototype, "scenePosition", {
            /**
             * 实体上碰撞世界坐标
             */
            get: function () {
                return this.firstEntity.transform.localToWorldMatrix.transformVector(this.localPosition);
            },
            enumerable: true,
            configurable: true
        });
        return PickingCollisionVO;
    }());
    feng3d.PickingCollisionVO = PickingCollisionVO;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 使用纯计算与实体相交
     */
    var AS3PickingCollider = (function () {
        /**
         * 创建一个AS碰撞检测器
         * @param findClosestCollision 是否查找最短距离碰撞
         */
        function AS3PickingCollider(findClosestCollision) {
            if (findClosestCollision === void 0) { findClosestCollision = false; }
            this._findClosestCollision = findClosestCollision;
        }
        AS3PickingCollider.prototype.testSubMeshCollision = function (geometry, pickingCollisionVO, shortestCollisionDistance, bothSides) {
            if (shortestCollisionDistance === void 0) { shortestCollisionDistance = 0; }
            if (bothSides === void 0) { bothSides = true; }
            var indexData = geometry.getIndexData().indices;
            var vertexData = geometry.getVAData("a_position").data;
            var uvData = geometry.getVAData("a_uv").data;
            var t = 0;
            var i0 = 0, i1 = 0, i2 = 0;
            var rx = 0, ry = 0, rz = 0;
            var nx = 0, ny = 0, nz = 0;
            var cx = 0, cy = 0, cz = 0;
            var coeff = 0, u = 0, v = 0, w = 0;
            var p0x = 0, p0y = 0, p0z = 0;
            var p1x = 0, p1y = 0, p1z = 0;
            var p2x = 0, p2y = 0, p2z = 0;
            var s0x = 0, s0y = 0, s0z = 0;
            var s1x = 0, s1y = 0, s1z = 0;
            var nl = 0, nDotV = 0, D = 0, disToPlane = 0;
            var Q1Q2 = 0, Q1Q1 = 0, Q2Q2 = 0, RQ1 = 0, RQ2 = 0;
            var collisionTriangleIndex = -1;
            var vertexStride = 3;
            var vertexOffset = 0;
            var uvStride = 2;
            var numIndices = indexData.length;
            //遍历每个三角形 检测碰撞
            for (var index = 0; index < numIndices; index += 3) {
                //三角形三个顶点索引
                i0 = vertexOffset + indexData[index] * vertexStride;
                i1 = vertexOffset + indexData[index + 1] * vertexStride;
                i2 = vertexOffset + indexData[index + 2] * vertexStride;
                //三角形三个顶点数据
                p0x = vertexData[i0];
                p0y = vertexData[i0 + 1];
                p0z = vertexData[i0 + 2];
                p1x = vertexData[i1];
                p1y = vertexData[i1 + 1];
                p1z = vertexData[i1 + 2];
                p2x = vertexData[i2];
                p2y = vertexData[i2 + 1];
                p2z = vertexData[i2 + 2];
                //计算出三角面的法线
                s0x = p1x - p0x; // s0 = p1 - p0
                s0y = p1y - p0y;
                s0z = p1z - p0z;
                s1x = p2x - p0x; // s1 = p2 - p0
                s1y = p2y - p0y;
                s1z = p2z - p0z;
                nx = s0y * s1z - s0z * s1y; // n = s0 x s1
                ny = s0z * s1x - s0x * s1z;
                nz = s0x * s1y - s0y * s1x;
                nl = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz); // normalize n
                nx *= nl;
                ny *= nl;
                nz *= nl;
                //初始化射线数据
                var rayPosition = this.ray3D.position;
                var rayDirection = this.ray3D.direction;
                //计算射线与法线的点积，不等于零表示射线所在直线与三角面相交
                nDotV = nx * rayDirection.x + ny * +rayDirection.y + nz * rayDirection.z; // rayDirection . normal
                //判断射线是否与三角面相交
                if ((!bothSides && nDotV < 0.0) || (bothSides && nDotV != 0.0)) {
                    //计算平面方程D值，参考Plane3D
                    D = -(nx * p0x + ny * p0y + nz * p0z);
                    //射线点到平面的距离
                    disToPlane = -(nx * rayPosition.x + ny * rayPosition.y + nz * rayPosition.z + D);
                    t = disToPlane / nDotV;
                    //得到交点
                    cx = rayPosition.x + t * rayDirection.x;
                    cy = rayPosition.y + t * rayDirection.y;
                    cz = rayPosition.z + t * rayDirection.z;
                    //判断交点是否在三角形内( using barycentric coordinates )
                    Q1Q2 = s0x * s1x + s0y * s1y + s0z * s1z;
                    Q1Q1 = s0x * s0x + s0y * s0y + s0z * s0z;
                    Q2Q2 = s1x * s1x + s1y * s1y + s1z * s1z;
                    rx = cx - p0x;
                    ry = cy - p0y;
                    rz = cz - p0z;
                    RQ1 = rx * s0x + ry * s0y + rz * s0z;
                    RQ2 = rx * s1x + ry * s1y + rz * s1z;
                    coeff = 1 / (Q1Q1 * Q2Q2 - Q1Q2 * Q1Q2);
                    v = coeff * (Q2Q2 * RQ1 - Q1Q2 * RQ2);
                    w = coeff * (-Q1Q2 * RQ1 + Q1Q1 * RQ2);
                    if (v < 0)
                        continue;
                    if (w < 0)
                        continue;
                    u = 1 - v - w;
                    //u v w都大于0表示点在三角形内 射线的坐标t大于0表示射线朝向三角面
                    if (!(u < 0) && t > 0 && t < shortestCollisionDistance) {
                        shortestCollisionDistance = t;
                        collisionTriangleIndex = index / 3;
                        pickingCollisionVO.rayEntryDistance = t;
                        pickingCollisionVO.localPosition = new feng3d.Vector3D(cx, cy, cz);
                        pickingCollisionVO.localNormal = new feng3d.Vector3D(nx, ny, nz);
                        pickingCollisionVO.uv = this.getCollisionUV(indexData, uvData, index, v, w, u, 0, uvStride);
                        pickingCollisionVO.index = index;
                        //是否继续寻找最优解
                        if (!this._findClosestCollision)
                            return true;
                    }
                }
            }
            if (collisionTriangleIndex >= 0)
                return true;
            return false;
        };
        /**
         * 获取碰撞法线
         * @param indexData 顶点索引数据
         * @param vertexData 顶点数据
         * @param triangleIndex 三角形索引
         * @param normal 碰撞法线
         * @return 碰撞法线
         *
         */
        AS3PickingCollider.prototype.getCollisionNormal = function (indexData, vertexData, triangleIndex, normal) {
            if (triangleIndex === void 0) { triangleIndex = 0; }
            if (normal === void 0) { normal = null; }
            var i0 = indexData[triangleIndex] * 3;
            var i1 = indexData[triangleIndex + 1] * 3;
            var i2 = indexData[triangleIndex + 2] * 3;
            var side0x = vertexData[i1] - vertexData[i0];
            var side0y = vertexData[i1 + 1] - vertexData[i0 + 1];
            var side0z = vertexData[i1 + 2] - vertexData[i0 + 2];
            var side1x = vertexData[i2] - vertexData[i0];
            var side1y = vertexData[i2 + 1] - vertexData[i0 + 1];
            var side1z = vertexData[i2 + 2] - vertexData[i0 + 2];
            if (!normal)
                normal = new feng3d.Vector3D();
            normal.x = side0y * side1z - side0z * side1y;
            normal.y = side0z * side1x - side0x * side1z;
            normal.z = side0x * side1y - side0y * side1x;
            normal.w = 1;
            normal.normalize();
            return normal;
        };
        /**
         * 获取碰撞uv
         * @param indexData 顶点数据
         * @param uvData uv数据
         * @param triangleIndex 三角形所有
         * @param v
         * @param w
         * @param u
         * @param uvOffset
         * @param uvStride
         * @param uv uv坐标
         * @return 碰撞uv
         */
        AS3PickingCollider.prototype.getCollisionUV = function (indexData, uvData, triangleIndex, v, w, u, uvOffset, uvStride, uv) {
            if (uv === void 0) { uv = null; }
            var uIndex = indexData[triangleIndex] * uvStride + uvOffset;
            var uv0x = uvData[uIndex];
            var uv0y = uvData[uIndex + 1];
            uIndex = indexData[triangleIndex + 1] * uvStride + uvOffset;
            var uv1x = uvData[uIndex];
            var uv1y = uvData[uIndex + 1];
            uIndex = indexData[triangleIndex + 2] * uvStride + uvOffset;
            var uv2x = uvData[uIndex];
            var uv2y = uvData[uIndex + 1];
            if (!uv)
                uv = new feng3d.Point();
            uv.x = u * uv0x + v * uv1x + w * uv2x;
            uv.y = u * uv0y + v * uv1y + w * uv2y;
            return uv;
        };
        /**
         * 设置碰撞射线
         */
        AS3PickingCollider.prototype.setLocalRay = function (ray3D) {
            this.ray3D = ray3D;
        };
        return AS3PickingCollider;
    }());
    feng3d.AS3PickingCollider = AS3PickingCollider;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 射线投射拾取器
     * @author feng 2014-4-29
     */
    var RaycastPicker = (function () {
        /**
         *
         * @param findClosestCollision 是否需要寻找最接近的
         */
        function RaycastPicker(findClosestCollision) {
            this._findClosestCollision = findClosestCollision;
            RaycastPicker.pickingCollider = RaycastPicker.pickingCollider || new feng3d.AS3PickingCollider();
        }
        /**
         * 获取射线穿过的实体
         * @param ray3D 射线
         * @param entitys 实体列表
         * @return
         */
        RaycastPicker.prototype.getViewCollision = function (ray3D, entitys) {
            var _this = this;
            this._entities = [];
            if (entitys.length == 0)
                return null;
            entitys.forEach(function (entity) {
                if (entity.transform.isIntersectingRay(ray3D))
                    _this._entities.push(entity);
            });
            if (this._entities.length == 0)
                return null;
            return this.getPickingCollisionVO();
        };
        /**
         *获取射线穿过的实体
         */
        RaycastPicker.prototype.getPickingCollisionVO = function () {
            // Sort entities from closest to furthest.
            this._entities = this._entities.sort(this.sortOnNearT);
            // ---------------------------------------------------------------------
            // Evaluate triangle collisions when needed.
            // Replaces collision data provided by bounds collider with more precise data.
            // ---------------------------------------------------------------------
            var shortestCollisionDistance = Number.MAX_VALUE;
            var bestCollisionVO;
            var pickingCollisionVO;
            var entity;
            var i;
            for (i = 0; i < this._entities.length; ++i) {
                entity = this._entities[i];
                pickingCollisionVO = entity.transform._pickingCollisionVO;
                if (RaycastPicker.pickingCollider) {
                    // If a collision exists, update the collision data and stop all checks.
                    if ((bestCollisionVO == null || pickingCollisionVO.rayEntryDistance < bestCollisionVO.rayEntryDistance) && entity.transform.collidesBefore(RaycastPicker.pickingCollider, shortestCollisionDistance, this._findClosestCollision)) {
                        shortestCollisionDistance = pickingCollisionVO.rayEntryDistance;
                        bestCollisionVO = pickingCollisionVO;
                        if (!this._findClosestCollision) {
                            this.updateLocalPosition(pickingCollisionVO);
                            return pickingCollisionVO;
                        }
                    }
                }
                else if (bestCollisionVO == null || pickingCollisionVO.rayEntryDistance < bestCollisionVO.rayEntryDistance) {
                    // Note: a bounds collision with a ray origin inside its bounds is ONLY ever used
                    // to enable the detection of a corresponsding triangle collision.
                    // Therefore, bounds collisions with a ray origin inside its bounds can be ignored
                    // if it has been established that there is NO triangle collider to test
                    if (!pickingCollisionVO.rayOriginIsInsideBounds) {
                        this.updateLocalPosition(pickingCollisionVO);
                        return pickingCollisionVO;
                    }
                }
            }
            return bestCollisionVO;
        };
        /**
         * 按与射线原点距离排序
         */
        RaycastPicker.prototype.sortOnNearT = function (entity1, entity2) {
            return entity1.transform.pickingCollisionVO.rayEntryDistance > entity2.transform.pickingCollisionVO.rayEntryDistance ? 1 : -1;
        };
        /**
         * 更新碰撞本地坐标
         * @param pickingCollisionVO
         */
        RaycastPicker.prototype.updateLocalPosition = function (pickingCollisionVO) {
            pickingCollisionVO.localPosition = pickingCollisionVO.localRay.getPoint(pickingCollisionVO.rayEntryDistance);
        };
        return RaycastPicker;
    }());
    feng3d.RaycastPicker = RaycastPicker;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 地形几何体
     * @author feng 2016-04-28
     */
    var TerrainGeometry = (function (_super) {
        __extends(TerrainGeometry, _super);
        /**
         * 创建高度地形 拥有segmentsW*segmentsH个顶点
         * @param    heightMap	高度图
         * @param    width	地形宽度
         * @param    height	地形高度
         * @param    depth	地形深度
         * @param    segmentsW	x轴上网格段数
         * @param    segmentsH	y轴上网格段数
         * @param    maxElevation	最大地形高度
         * @param    minElevation	最小地形高度
         */
        function TerrainGeometry(heightMapUrl, width, height, depth, segmentsW, segmentsH, maxElevation, minElevation) {
            if (width === void 0) { width = 1000; }
            if (height === void 0) { height = 100; }
            if (depth === void 0) { depth = 1000; }
            if (segmentsW === void 0) { segmentsW = 30; }
            if (segmentsH === void 0) { segmentsH = 30; }
            if (maxElevation === void 0) { maxElevation = 255; }
            if (minElevation === void 0) { minElevation = 0; }
            var _this = _super.call(this) || this;
            _this._width = 1000;
            _this._height = 100;
            _this._depth = 1000;
            _this._segmentsW = 30;
            _this._segmentsH = 30;
            _this._maxElevation = 255;
            _this._minElevation = 0;
            _this.width = width;
            _this.height = height;
            _this.depth = depth;
            _this.segmentsW = segmentsW;
            _this.segmentsH = segmentsH;
            _this.maxElevation = maxElevation;
            _this.minElevation = minElevation;
            _this._heightImage = new Image();
            _this._heightImage.crossOrigin = "Anonymous";
            _this._heightImage.addEventListener("load", _this.onHeightMapLoad.bind(_this));
            _this.heightMapUrl = heightMapUrl;
            return _this;
        }
        Object.defineProperty(TerrainGeometry.prototype, "heightMapUrl", {
            get: function () {
                return this._heightImage.src;
            },
            set: function (value) {
                if (this._heightImage.src == value)
                    return;
                this._heightImage.src = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainGeometry.prototype, "width", {
            get: function () {
                return this._width;
            },
            set: function (value) {
                if (this._width == value)
                    return;
                this._width = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainGeometry.prototype, "height", {
            get: function () {
                return this._height;
            },
            set: function (value) {
                if (this._height == value)
                    return;
                this._height = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainGeometry.prototype, "depth", {
            get: function () {
                return this._depth;
            },
            set: function (value) {
                if (this._depth == value)
                    return;
                this._depth = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainGeometry.prototype, "segmentsW", {
            get: function () {
                return this._segmentsW;
            },
            set: function (value) {
                if (this._segmentsW == value)
                    return;
                this._segmentsW = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainGeometry.prototype, "segmentsH", {
            get: function () {
                return this._segmentsH;
            },
            set: function (value) {
                if (this._segmentsH == value)
                    return;
                this._segmentsH = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainGeometry.prototype, "maxElevation", {
            get: function () {
                return this._maxElevation;
            },
            set: function (value) {
                if (this._maxElevation == value)
                    return;
                this._maxElevation = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainGeometry.prototype, "minElevation", {
            get: function () {
                return this._minElevation;
            },
            set: function (value) {
                if (this._minElevation == value)
                    return;
                this._minElevation = value;
                this.invalidateGeometry();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 高度图加载完成
         */
        TerrainGeometry.prototype.onHeightMapLoad = function () {
            var canvasImg = document.createElement("canvas");
            canvasImg.width = this._heightImage.width;
            canvasImg.height = this._heightImage.height;
            var ctxt = canvasImg.getContext('2d');
            ctxt.drawImage(this._heightImage, 0, 0);
            var terrainHeightData = ctxt.getImageData(0, 0, this._heightImage.width, this._heightImage.height); //读取整张图片的像素。
            ctxt.putImageData(terrainHeightData, terrainHeightData.width, terrainHeightData.height);
            this._heightMap = terrainHeightData;
            this.invalidateGeometry();
        };
        /**
         * 创建顶点坐标
         */
        TerrainGeometry.prototype.buildGeometry = function () {
            if (!this._heightMap)
                return;
            var x, z;
            var numInds = 0;
            var base = 0;
            //一排顶点数据
            var tw = this.segmentsW + 1;
            //总顶点数量
            var numVerts = (this.segmentsH + 1) * tw;
            //一个格子所占高度图X轴像素数
            var uDiv = (this._heightMap.width - 1) / this.segmentsW;
            //一个格子所占高度图Y轴像素数
            var vDiv = (this._heightMap.height - 1) / this.segmentsH;
            var u, v;
            var y;
            var vertices = new Float32Array(numVerts * 3);
            var indices = new Uint16Array(this.segmentsH * this.segmentsW * 6);
            numVerts = 0;
            var col;
            for (var zi = 0; zi <= this.segmentsH; ++zi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    //顶点坐标
                    x = (xi / this.segmentsW - .5) * this.width;
                    z = (zi / this.segmentsH - .5) * this.depth;
                    //格子对应高度图uv坐标
                    u = xi * uDiv;
                    v = (this.segmentsH - zi) * vDiv;
                    //获取颜色值
                    col = this.getPixel(this._heightMap, u, v) & 0xff;
                    //计算高度值
                    y = (col > this.maxElevation) ? (this.maxElevation / 0xff) * this.height : ((col < this.minElevation) ? (this.minElevation / 0xff) * this.height : (col / 0xff) * this.height);
                    //保存顶点坐标
                    vertices[numVerts++] = x;
                    vertices[numVerts++] = y;
                    vertices[numVerts++] = z;
                    if (xi != this.segmentsW && zi != this.segmentsH) {
                        //增加 一个顶点同时 生成一个格子或两个三角形
                        base = xi + zi * tw;
                        indices[numInds++] = base;
                        indices[numInds++] = base + tw;
                        indices[numInds++] = base + tw + 1;
                        indices[numInds++] = base;
                        indices[numInds++] = base + tw + 1;
                        indices[numInds++] = base + 1;
                    }
                }
            }
            var uvs = this.buildUVs();
            this.setVAData("a_position", vertices, 3);
            this.setVAData("a_uv", uvs, 2);
            this.setIndices(indices);
            var normals = feng3d.GeometryUtils.createVertexNormals(indices, vertices);
            this.normals = new Float32Array(normals);
            //生成切线
            var tangents = feng3d.GeometryUtils.createVertexTangents(indices, vertices, uvs);
            this.tangents = new Float32Array(tangents);
        };
        /**
         * 创建uv坐标
         */
        TerrainGeometry.prototype.buildUVs = function () {
            var numUvs = (this.segmentsH + 1) * (this.segmentsW + 1) * 2;
            var uvs = new Float32Array(numUvs);
            numUvs = 0;
            //计算每个顶点的uv坐标
            for (var yi = 0; yi <= this.segmentsH; ++yi) {
                for (var xi = 0; xi <= this.segmentsW; ++xi) {
                    uvs[numUvs++] = xi / this.segmentsW;
                    uvs[numUvs++] = 1 - yi / this.segmentsH;
                }
            }
            return uvs;
        };
        /**
         * 获取位置在（x，z）处的高度y值
         * @param x x坐标
         * @param z z坐标
         * @return 高度
         */
        TerrainGeometry.prototype.getHeightAt = function (x, z) {
            //得到高度图中的值
            var u = (x / this.width + .5) * (this._heightMap.width - 1);
            var v = (-z / this.depth + .5) * (this._heightMap.height - 1);
            var col = this.getPixel(this._heightMap, u, v) & 0xff;
            var h;
            if (col > this.maxElevation) {
                h = (this.maxElevation / 0xff) * this.height;
            }
            else if (col < this.minElevation) {
                h = (this.minElevation / 0xff) * this.height;
            }
            else {
                h = (col / 0xff) * this.height;
            }
            return h;
        };
        /**
         * 获取像素值
         */
        TerrainGeometry.prototype.getPixel = function (imageData, u, v) {
            //取整
            u = ~~u;
            v = ~~v;
            var index = (v * imageData.width + u) * 4;
            var data = imageData.data;
            var red = data[index]; //红色色深
            var green = data[index + 1]; //绿色色深
            var blue = data[index + 2]; //蓝色色深
            var alpha = data[index + 3]; //透明度
            return blue;
        };
        return TerrainGeometry;
    }(feng3d.Geometry));
    feng3d.TerrainGeometry = TerrainGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    var TerrainMethod = (function (_super) {
        __extends(TerrainMethod, _super);
        /**
         * 构建材质
         */
        function TerrainMethod(blendUrl, splatUrls, splatRepeats) {
            if (blendUrl === void 0) { blendUrl = ""; }
            if (splatUrls === void 0) { splatUrls = ["", "", ""]; }
            if (splatRepeats === void 0) { splatRepeats = new feng3d.Vector3D(1, 1, 1, 1); }
            var _this = _super.call(this) || this;
            _this.blendTexture = new feng3d.Texture2D(blendUrl);
            _this.splatTexture1 = new feng3d.Texture2D(splatUrls[0] || "");
            _this.splatTexture2 = new feng3d.Texture2D(splatUrls[1] || "");
            _this.splatTexture3 = new feng3d.Texture2D(splatUrls[2] || "");
            _this.splatTexture1.generateMipmap = true;
            _this.splatTexture1.minFilter = feng3d.GL.LINEAR_MIPMAP_LINEAR;
            _this.splatTexture1.wrapS = feng3d.GL.REPEAT;
            _this.splatTexture1.wrapT = feng3d.GL.REPEAT;
            _this.splatTexture2.generateMipmap = true;
            _this.splatTexture2.minFilter = feng3d.GL.LINEAR_MIPMAP_LINEAR;
            _this.splatTexture2.wrapS = feng3d.GL.REPEAT;
            _this.splatTexture2.wrapT = feng3d.GL.REPEAT;
            _this.splatTexture3.generateMipmap = true;
            _this.splatTexture3.minFilter = feng3d.GL.LINEAR_MIPMAP_LINEAR;
            _this.splatTexture3.wrapS = feng3d.GL.REPEAT;
            _this.splatTexture3.wrapT = feng3d.GL.REPEAT;
            _this.splatRepeats = splatRepeats;
            //
            _this.createUniformData("s_blendTexture", function () { return _this.blendTexture; });
            _this.createUniformData("s_splatTexture1", function () { return _this.splatTexture1; });
            _this.createUniformData("s_splatTexture2", function () { return _this.splatTexture2; });
            _this.createUniformData("s_splatTexture3", function () { return _this.splatTexture3; });
            _this.createUniformData("u_splatRepeats", function () { return _this.splatRepeats; });
            _this.createBoolMacro("HAS_TERRAIN_METHOD", function () {
                return _this.blendTexture.checkRenderData()
                    && _this.splatTexture1.checkRenderData()
                    && _this.splatTexture2.checkRenderData()
                    && _this.splatTexture3.checkRenderData();
            });
            return _this;
        }
        Object.defineProperty(TerrainMethod.prototype, "splatTexture1", {
            get: function () {
                return this._splatTexture1;
            },
            set: function (value) {
                this._splatTexture1 = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainMethod.prototype, "splatTexture2", {
            get: function () {
                return this._splatTexture2;
            },
            set: function (value) {
                this._splatTexture2 = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainMethod.prototype, "splatTexture3", {
            get: function () {
                return this._splatTexture3;
            },
            set: function (value) {
                this._splatTexture3 = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainMethod.prototype, "blendTexture", {
            get: function () {
                return this._blendTexture;
            },
            set: function (value) {
                this._blendTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainMethod.prototype, "splatRepeats", {
            get: function () {
                return this._splatRepeats;
            },
            set: function (value) {
                this._splatRepeats = value;
            },
            enumerable: true,
            configurable: true
        });
        return TerrainMethod;
    }(feng3d.RenderDataHolder));
    feng3d.TerrainMethod = TerrainMethod;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    var TerrainMergeMethod = (function (_super) {
        __extends(TerrainMergeMethod, _super);
        /**
         * 构建材质
         */
        function TerrainMergeMethod(blendUrl, splatMergeUrl, splatRepeats) {
            if (blendUrl === void 0) { blendUrl = ""; }
            if (splatMergeUrl === void 0) { splatMergeUrl = ""; }
            if (splatRepeats === void 0) { splatRepeats = new feng3d.Vector3D(1, 1, 1, 1); }
            var _this = _super.call(this) || this;
            _this.blendTexture = new feng3d.Texture2D(blendUrl);
            _this.splatMergeTexture = new feng3d.Texture2D(splatMergeUrl || "");
            _this.splatMergeTexture.minFilter = feng3d.GL.NEAREST;
            _this.splatMergeTexture.magFilter = feng3d.GL.NEAREST;
            _this.splatMergeTexture.wrapS = feng3d.GL.REPEAT;
            _this.splatMergeTexture.wrapT = feng3d.GL.REPEAT;
            _this.splatRepeats = splatRepeats;
            //
            _this.createUniformData("s_blendTexture", _this.blendTexture);
            _this.createUniformData("s_splatMergeTexture", _this.splatMergeTexture);
            _this.createUniformData("u_splatMergeTextureSize", _this.splatMergeTexture.size);
            _this.createUniformData("u_splatRepeats", _this.splatRepeats);
            //
            _this.createUniformData("u_imageSize", new feng3d.Point(2048.0, 1024.0));
            _this.createUniformData("u_tileSize", new feng3d.Point(512.0, 512.0));
            _this.createUniformData("u_maxLod", 7);
            _this.createUniformData("u_uvPositionScale", 0.001);
            _this.createUniformData("u_tileOffset", [
                new feng3d.Vector3D(0.5, 0.5, 0.0, 0.0),
                new feng3d.Vector3D(0.5, 0.5, 0.5, 0.0),
                new feng3d.Vector3D(0.5, 0.5, 0.0, 0.5),
            ]);
            _this.createUniformData("u_lod0vec", new feng3d.Vector3D(0.5, 1, 0, 0));
            _this.createBoolMacro("HAS_TERRAIN_METHOD", true);
            _this.createBoolMacro("USE_TERRAIN_MERGE", true);
            return _this;
        }
        Object.defineProperty(TerrainMergeMethod.prototype, "splatMergeTexture", {
            get: function () {
                return this._splatMergeTexture;
            },
            set: function (value) {
                this._splatMergeTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainMergeMethod.prototype, "blendTexture", {
            get: function () {
                return this._blendTexture;
            },
            set: function (value) {
                this._blendTexture = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(TerrainMergeMethod.prototype, "splatRepeats", {
            get: function () {
                return this._splatRepeats;
            },
            set: function (value) {
                this._splatRepeats = value;
            },
            enumerable: true,
            configurable: true
        });
        return TerrainMergeMethod;
    }(feng3d.RenderDataHolder));
    feng3d.TerrainMergeMethod = TerrainMergeMethod;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 动画状态基类
     * @author feng 2015-9-18
     */
    var AnimationStateBase = (function () {
        /**
         * 创建动画状态基类
         * @param animator				动画
         * @param animationNode			动画节点
         */
        function AnimationStateBase(animator, animationNode) {
            this._rootDelta = new feng3d.Vector3D();
            this._positionDeltaDirty = true;
            this._time = 0;
            this._startTime = 0;
            this._animator = animator;
            this._animationNode = animationNode;
        }
        Object.defineProperty(AnimationStateBase.prototype, "positionDelta", {
            /**
             * @inheritDoc
             */
            get: function () {
                if (this._positionDeltaDirty)
                    this.updatePositionDelta();
                return this._rootDelta;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * @inheritDoc
         */
        AnimationStateBase.prototype.offset = function (startTime) {
            this._startTime = startTime;
            this._positionDeltaDirty = true;
        };
        /**
         * @inheritDoc
         */
        AnimationStateBase.prototype.update = function (time) {
            if (this._time == time - this._startTime)
                return;
            this.updateTime(time);
        };
        /**
         * @inheritDoc
         */
        AnimationStateBase.prototype.phase = function (value) {
        };
        /**
         * 更新时间
         * @param time		当前时间
         */
        AnimationStateBase.prototype.updateTime = function (time) {
            this._time = time - this._startTime;
            this._positionDeltaDirty = true;
        };
        /**
         * 位置偏移
         */
        AnimationStateBase.prototype.updatePositionDelta = function () {
        };
        return AnimationStateBase;
    }());
    feng3d.AnimationStateBase = AnimationStateBase;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 动画剪辑状态
     * @author feng 2015-9-18
     */
    var AnimationClipState = (function (_super) {
        __extends(AnimationClipState, _super);
        /**
         * 创建一个帧动画状态
         * @param animator				动画
         * @param animationClipNode		帧动画节点
         */
        function AnimationClipState(animator, animationClipNode) {
            var _this = _super.call(this, animator, animationClipNode) || this;
            _this._currentFrame = 0;
            _this._framesDirty = true;
            _this._animationClipNode = animationClipNode;
            return _this;
        }
        Object.defineProperty(AnimationClipState.prototype, "blendWeight", {
            /**
             * 混合权重	(0[当前帧],1[下一帧])
             * @see #currentFrame
             * @see #nextFrame
             */
            get: function () {
                if (this._framesDirty)
                    this.updateFrames();
                return this._blendWeight;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationClipState.prototype, "currentFrame", {
            /**
             * 当前帧
             */
            get: function () {
                if (this._framesDirty)
                    this.updateFrames();
                return this._currentFrame;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationClipState.prototype, "nextFrame", {
            /**
             * 下一帧
             */
            get: function () {
                if (this._framesDirty)
                    this.updateFrames();
                return this._nextFrame;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * @inheritDoc
         */
        AnimationClipState.prototype.update = function (time) {
            if (!this._animationClipNode.looping) {
                if (time > this._startTime + this._animationClipNode.totalDuration)
                    time = this._startTime + this._animationClipNode.totalDuration;
                else if (time < this._startTime)
                    time = this._startTime;
            }
            if (this._time == time - this._startTime)
                return;
            this.updateTime(time);
        };
        /**
         * @inheritDoc
         */
        AnimationClipState.prototype.phase = function (value) {
            var time = value * this._animationClipNode.totalDuration + this._startTime;
            if (this._time == time - this._startTime)
                return;
            this.updateTime(time);
        };
        /**
         * @inheritDoc
         */
        AnimationClipState.prototype.updateTime = function (time) {
            this._framesDirty = true;
            this._timeDir = (time - this._startTime > this._time) ? 1 : -1;
            _super.prototype.updateTime.call(this, time);
        };
        /**
         * 更新帧，计算当前帧、下一帧与混合权重
         *
         * @see #currentFrame
         * @see #nextFrame
         * @see #blendWeight
         */
        AnimationClipState.prototype.updateFrames = function () {
            this._framesDirty = false;
            var looping = this._animationClipNode.looping;
            var totalDuration = this._animationClipNode.totalDuration;
            var lastFrame = this._animationClipNode.lastFrame;
            var time = this._time;
            //trace("time", time, totalDuration)
            if (looping && (time >= totalDuration || time < 0)) {
                time %= totalDuration;
                if (time < 0)
                    time += totalDuration;
            }
            if (!looping && time >= totalDuration) {
                this.notifyPlaybackComplete();
                this._currentFrame = lastFrame;
                this._nextFrame = lastFrame;
                this._blendWeight = 0;
            }
            else if (!looping && time <= 0) {
                this._currentFrame = 0;
                this._nextFrame = 0;
                this._blendWeight = 0;
            }
            else if (this._animationClipNode.fixedFrameRate) {
                var t = time / totalDuration * lastFrame;
                this._currentFrame = ~~t;
                this._blendWeight = t - this._currentFrame;
                this._nextFrame = this._currentFrame + 1;
            }
            else {
                this._currentFrame = 0;
                this._nextFrame = 0;
                var dur = 0, frameTime;
                var durations = this._animationClipNode.durations;
                do {
                    frameTime = dur;
                    dur += durations[this.nextFrame];
                    this._currentFrame = this._nextFrame++;
                } while (time > dur);
                if (this._currentFrame == lastFrame) {
                    this._currentFrame = 0;
                    this._nextFrame = 1;
                }
                this._blendWeight = (time - frameTime) / durations[this._currentFrame];
            }
        };
        /**
         * 通知播放完成
         */
        AnimationClipState.prototype.notifyPlaybackComplete = function () {
            this._animationClipNode.dispatchEvent(new feng3d.AnimationStateEvent(feng3d.AnimationStateEvent.PLAYBACK_COMPLETE, this._animator, this, this._animationClipNode));
        };
        return AnimationClipState;
    }(feng3d.AnimationStateBase));
    feng3d.AnimationClipState = AnimationClipState;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 粒子动画组件
     * @author feng 2017-01-09
     */
    var ParticleComponent = (function (_super) {
        __extends(ParticleComponent, _super);
        function ParticleComponent() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            /**
             * 优先级
             */
            _this.priority = 0;
            return _this;
        }
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        ParticleComponent.prototype.generateParticle = function (particle) {
        };
        ParticleComponent.prototype.setRenderState = function (particleAnimator) {
        };
        return ParticleComponent;
    }(feng3d.RenderDataHolder));
    feng3d.ParticleComponent = ParticleComponent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 粒子发射器
     * @author feng 2017-01-09
     */
    var ParticleEmission = (function (_super) {
        __extends(ParticleEmission, _super);
        function ParticleEmission() {
            var _this = _super.call(this) || this;
            /**
             * 发射率，每秒发射粒子数量
             */
            _this.rate = 10;
            /**
             * 爆发，在time时刻额外喷射particles粒子
             */
            _this.bursts = [];
            _this.isDirty = true;
            _this.priority = Number.MAX_VALUE;
            return _this;
        }
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        ParticleEmission.prototype.generateParticle = function (particle) {
            if (this._numParticles != particle.total)
                this.isDirty = true;
            this._numParticles = particle.total;
            particle.birthTime = this.getBirthTimeArray(particle.total)[particle.index];
        };
        /**
         * 获取出生时间数组
         */
        ParticleEmission.prototype.getBirthTimeArray = function (numParticles) {
            if (this.isDirty) {
                this.isDirty = false;
                var birthTimes = [];
                var bursts = this.bursts.concat();
                //按时间降序排列
                bursts.sort(function (a, b) { return b.time - a.time; });
                var index = 0;
                var time = 0; //以秒为单位
                var i = 0;
                var timeStep = 1 / this.rate;
                while (index < numParticles) {
                    while (bursts.length > 0 && bursts[bursts.length - 1].time <= time) {
                        var burst = bursts.pop();
                        for (i = 0; i < burst.particles; i++) {
                            birthTimes[index++] = burst.time;
                        }
                    }
                    birthTimes[index++] = time;
                    time += timeStep;
                }
                this._birthTimes = birthTimes;
            }
            return this._birthTimes;
        };
        return ParticleEmission;
    }(feng3d.ParticleComponent));
    feng3d.ParticleEmission = ParticleEmission;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 粒子速度组件
     * @author feng 2017-01-09
     */
    var ParticlePosition = (function (_super) {
        __extends(ParticlePosition, _super);
        function ParticlePosition() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        ParticlePosition.prototype.generateParticle = function (particle) {
            var baseRange = 100;
            var x = (Math.random() - 0.5) * baseRange;
            var y = (Math.random() - 0.5) * baseRange;
            var z = (Math.random() - 0.5) * baseRange;
            particle.position = new feng3d.Vector3D(x, y, z);
            particle.position = new feng3d.Vector3D();
        };
        return ParticlePosition;
    }(feng3d.ParticleComponent));
    feng3d.ParticlePosition = ParticlePosition;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 粒子速度组件
     * @author feng 2017-01-09
     */
    var ParticleVelocity = (function (_super) {
        __extends(ParticleVelocity, _super);
        function ParticleVelocity() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        ParticleVelocity.prototype.generateParticle = function (particle) {
            var baseVelocity = 100;
            var x = (Math.random() - 0.5) * baseVelocity;
            var y = baseVelocity;
            var z = (Math.random() - 0.5) * baseVelocity;
            particle.velocity = new feng3d.Vector3D(x, y, z);
        };
        return ParticleVelocity;
    }(feng3d.ParticleComponent));
    feng3d.ParticleVelocity = ParticleVelocity;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 粒子颜色组件
     * @author feng 2017-03-14
     */
    var ParticleColor = (function (_super) {
        __extends(ParticleColor, _super);
        function ParticleColor() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        ParticleColor.prototype.generateParticle = function (particle) {
            particle.color = new feng3d.Color(1, 0, 0, 1).mix(new feng3d.Color(0, 1, 0, 1), particle.index / particle.total);
        };
        return ParticleColor;
    }(feng3d.ParticleComponent));
    feng3d.ParticleColor = ParticleColor;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var ParticleBillboard = (function (_super) {
        __extends(ParticleBillboard, _super);
        /**
         * 创建一个广告牌节点
         * @param billboardAxis
         */
        function ParticleBillboard(camera, billboardAxis) {
            if (billboardAxis === void 0) { billboardAxis = null; }
            var _this = _super.call(this) || this;
            _this._matrix = new feng3d.Matrix3D;
            _this.billboardAxis = billboardAxis;
            _this._camera = camera;
            return _this;
        }
        ParticleBillboard.prototype.setRenderState = function (particleAnimator) {
            var gameObject = particleAnimator.gameObject;
            var comps;
            if (this._billboardAxis) {
                var pos = gameObject.transform.localToWorldMatrix.position;
                var look = this._camera.sceneTransform.position.subtract(pos);
                var right = look.crossProduct(this._billboardAxis);
                right.normalize();
                look = this._billboardAxis.crossProduct(right);
                look.normalize();
                //create a quick inverse projection matrix
                this._matrix.copyFrom(gameObject.transform.localToWorldMatrix);
                comps = this._matrix.decompose(feng3d.Orientation3D.AXIS_ANGLE);
                this._matrix.copyColumnFrom(0, right);
                this._matrix.copyColumnFrom(1, this._billboardAxis);
                this._matrix.copyColumnFrom(2, look);
                this._matrix.copyColumnFrom(3, pos);
                this._matrix.appendRotation(-comps[1].w * Math.RAD2DEG, comps[1]);
            }
            else {
                //create a quick inverse projection matrix
                this._matrix.copyFrom(gameObject.transform.localToWorldMatrix);
                this._matrix.append(this._camera.inverseSceneTransform);
                //decompose using axis angle rotations
                comps = this._matrix.decompose(feng3d.Orientation3D.AXIS_ANGLE);
                //recreate the matrix with just the rotation data
                this._matrix.identity();
                this._matrix.appendRotation(-comps[1].w * Math.RAD2DEG, comps[1]);
            }
            particleAnimator.animatorSet.setGlobal("billboardMatrix", this._matrix);
        };
        Object.defineProperty(ParticleBillboard.prototype, "billboardAxis", {
            /**
             * 广告牌轴线
             */
            get: function () {
                return this._billboardAxis;
            },
            set: function (value) {
                this._billboardAxis = value ? value.clone() : null;
                if (this._billboardAxis)
                    this._billboardAxis.normalize();
            },
            enumerable: true,
            configurable: true
        });
        return ParticleBillboard;
    }(feng3d.ParticleComponent));
    feng3d.ParticleBillboard = ParticleBillboard;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var ParticleAnimationSet = (function (_super) {
        __extends(ParticleAnimationSet, _super);
        function ParticleAnimationSet() {
            var _this = _super.call(this) || this;
            /**
             * 属性数据列表
             */
            _this._attributes = {};
            _this._animations = [];
            /**
             * 生成粒子函数列表，优先级越高先执行
             */
            _this.generateFunctions = [];
            _this.particleGlobal = {};
            /**
             * 粒子数量
             */
            _this.numParticles = 1000;
            _this._isDirty = true;
            _this.createInstanceCount(function () { return _this.numParticles; });
            return _this;
        }
        /**
         * 粒子全局属性，作用于所有粒子元素
         */
        ParticleAnimationSet.prototype.setGlobal = function (property, value) {
            this.particleGlobal[property] = value;
            this.createUniformData(("u_particle_" + property), value);
            this.createBoolMacro(("D_u_particle_" + property), true);
        };
        ParticleAnimationSet.prototype.addAnimation = function (animation) {
            if (this._animations.indexOf(animation) == -1)
                this._animations.push(animation);
        };
        ParticleAnimationSet.prototype.update = function (particleAnimator) {
            if (this._isDirty) {
                this.generateParticles();
                this._isDirty = false;
            }
            this._animations.forEach(function (element) {
                element.setRenderState(particleAnimator);
            });
        };
        /**
         * 生成粒子
         */
        ParticleAnimationSet.prototype.generateParticles = function () {
            var generateFunctions = this.generateFunctions.concat();
            var components = this._animations;
            components.forEach(function (element) {
                generateFunctions.push({ generate: element.generateParticle.bind(element), priority: element.priority });
            });
            //按优先级排序，优先级越高先执行
            generateFunctions.sort(function (a, b) { return b.priority - a.priority; });
            //
            for (var i = 0; i < this.numParticles; i++) {
                var particle = {};
                particle.index = i;
                particle.total = this.numParticles;
                generateFunctions.forEach(function (element) {
                    element.generate(particle);
                });
                this.collectionParticle(particle);
            }
            //更新宏定义
            for (var attribute in this._attributes) {
                this.createBoolMacro(("D_" + attribute), true);
            }
        };
        /**
         * 收集粒子数据
         * @param particle      粒子
         */
        ParticleAnimationSet.prototype.collectionParticle = function (particle) {
            for (var attribute in particle) {
                this.collectionParticleAttribute(attribute, particle);
            }
        };
        /**
         * 收集粒子属性数据
         * @param attributeID       属性编号
         * @param index             粒子编号
         * @param data              属性数据
         */
        ParticleAnimationSet.prototype.collectionParticleAttribute = function (attribute, particle) {
            var attributeID = "a_particle_" + attribute;
            var data = particle[attribute];
            var index = particle.index;
            var numParticles = particle.total;
            //
            var attributeRenderData = this._attributes[attributeID];
            var vector3DData;
            if (typeof data == "number") {
                if (!attributeRenderData) {
                    this._attributes[attributeID] = attributeRenderData = this.createAttributeRenderData(attributeID, new Float32Array(numParticles), 1, 1);
                }
                vector3DData = attributeRenderData.data;
                vector3DData[index] = data;
            }
            else if (data instanceof feng3d.Vector3D) {
                if (!attributeRenderData) {
                    this._attributes[attributeID] = attributeRenderData = this.createAttributeRenderData(attributeID, new Float32Array(numParticles * 3), 3, 1);
                }
                vector3DData = attributeRenderData.data;
                vector3DData[index * 3] = data.x;
                vector3DData[index * 3 + 1] = data.y;
                vector3DData[index * 3 + 2] = data.z;
            }
            else if (data instanceof feng3d.Color) {
                if (!attributeRenderData) {
                    this._attributes[attributeID] = attributeRenderData = this.createAttributeRenderData(attributeID, new Float32Array(numParticles * 4), 4, 1);
                }
                vector3DData = attributeRenderData.data;
                vector3DData[index * 4] = data.r;
                vector3DData[index * 4 + 1] = data.g;
                vector3DData[index * 4 + 2] = data.b;
                vector3DData[index * 4 + 3] = data.a;
            }
            else {
                throw new Error("\u65E0\u6CD5\u5904\u7406" + feng3d.ClassUtils.getQualifiedClassName(data) + "\u7C92\u5B50\u5C5E\u6027");
            }
        };
        return ParticleAnimationSet;
    }(feng3d.RenderDataHolder));
    feng3d.ParticleAnimationSet = ParticleAnimationSet;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 粒子动画
     * @author feng 2017-01-09
     */
    var ParticleAnimator = (function (_super) {
        __extends(ParticleAnimator, _super);
        function ParticleAnimator() {
            var _this = _super.call(this) || this;
            /**
             * 粒子时间
             */
            _this.time = 0;
            /**
             * 起始时间
             */
            _this.startTime = 0;
            /**
             * 播放速度
             */
            _this.playbackSpeed = 1;
            /**
             * 周期
             */
            _this.cycle = 10000;
            _this._single = true;
            _this._updateEverytime = true;
            //
            _this.createUniformData("u_particleTime", function () { return _this.time; });
            //
            _this.createBoolMacro("HAS_PARTICLE_ANIMATOR", function () { return _this.isPlaying = true; });
            return _this;
        }
        Object.defineProperty(ParticleAnimator.prototype, "animatorSet", {
            get: function () {
                return this._animatorSet;
            },
            set: function (value) {
                if (this._animatorSet == value)
                    return;
                if (this._animatorSet)
                    this.removeRenderDataHolder(this._animatorSet);
                this._animatorSet = value;
                if (this._animatorSet)
                    this.addRenderDataHolder(this._animatorSet);
            },
            enumerable: true,
            configurable: true
        });
        ParticleAnimator.prototype.play = function () {
            if (this.isPlaying)
                return;
            if (!this.animatorSet) {
                return;
            }
            this.startTime = feng3d.getTimer();
            this.isPlaying = true;
            feng3d.ticker.addEventListener(feng3d.Event.ENTER_FRAME, this.update, this);
        };
        ParticleAnimator.prototype.update = function () {
            this.time = ((feng3d.getTimer() - this.startTime) / 1000) % this.cycle;
            this.animatorSet.update(this);
        };
        /**
         * 收集渲染数据拥有者
         * @param renderAtomic 渲染原子
         */
        ParticleAnimator.prototype.collectRenderDataHolder = function (renderAtomic) {
            if (renderAtomic === void 0) { renderAtomic = null; }
            this.animatorSet.collectRenderDataHolder(renderAtomic);
            _super.prototype.collectRenderDataHolder.call(this, renderAtomic);
        };
        return ParticleAnimator;
    }(feng3d.Component));
    feng3d.ParticleAnimator = ParticleAnimator;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Dispatched to notify changes in an animation state's state.
     */
    var AnimationStateEvent = (function (_super) {
        __extends(AnimationStateEvent, _super);
        /**
         * Create a new <code>AnimatonStateEvent</code>
         *
         * @param type The event type.
         * @param animator The animation state object that is the subject of this event.
         * @param animationNode The animation node inside the animation state from which the event originated.
         */
        function AnimationStateEvent(type, animator, animationState, animationNode) {
            var _this = _super.call(this, type, false, false) || this;
            _this._animator = animator;
            _this._animationState = animationState;
            _this._animationNode = animationNode;
            return _this;
        }
        Object.defineProperty(AnimationStateEvent.prototype, "animator", {
            /**
             * The animator object that is the subject of this event.
             */
            get: function () {
                return this._animator;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationStateEvent.prototype, "animationState", {
            /**
             * The animation state object that is the subject of this event.
             */
            get: function () {
                return this._animationState;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationStateEvent.prototype, "animationNode", {
            /**
             * The animation node inside the animation state from which the event originated.
             */
            get: function () {
                return this._animationNode;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Clones the event.
         *
         * @return An exact duplicate of the current object.
         */
        AnimationStateEvent.prototype.clone = function () {
            return new AnimationStateEvent(this.type, this._animator, this._animationState, this._animationNode);
        };
        return AnimationStateEvent;
    }(feng3d.Event));
    /**
     * Dispatched when a non-looping clip node inside an animation state reaches the end of its timeline.
     */
    AnimationStateEvent.PLAYBACK_COMPLETE = "playbackComplete";
    AnimationStateEvent.TRANSITION_COMPLETE = "transitionComplete";
    feng3d.AnimationStateEvent = AnimationStateEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 动画事件
     * @author feng 2014-5-27
     */
    var AnimatorEvent = (function (_super) {
        __extends(AnimatorEvent, _super);
        /**
         * 创建一个动画时间
         * @param type			事件类型
         * @param data			事件数据
         * @param bubbles		是否冒泡
         */
        function AnimatorEvent(type, data, bubbles) {
            if (data === void 0) { data = null; }
            if (bubbles === void 0) { bubbles = false; }
            return _super.call(this, type, data, bubbles) || this;
        }
        return AnimatorEvent;
    }(feng3d.Event));
    /** 开始播放动画 */
    AnimatorEvent.START = "start";
    /** 继续播放动画 */
    AnimatorEvent.PLAY = "play";
    /** 停止播放动画 */
    AnimatorEvent.STOP = "stop";
    feng3d.AnimatorEvent = AnimatorEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 动画节点基类
     * @author feng 2014-5-20
     */
    var AnimationNodeBase = (function (_super) {
        __extends(AnimationNodeBase, _super);
        /**
         * 创建一个动画节点基类
         */
        function AnimationNodeBase() {
            return _super.call(this) || this;
        }
        Object.defineProperty(AnimationNodeBase.prototype, "stateClass", {
            /**
             * 状态类
             */
            get: function () {
                return this._stateClass;
            },
            enumerable: true,
            configurable: true
        });
        return AnimationNodeBase;
    }(feng3d.Component));
    feng3d.AnimationNodeBase = AnimationNodeBase;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 动画基类
     * @author feng 2014-5-27
     */
    var AnimatorBase = (function (_super) {
        __extends(AnimatorBase, _super);
        /**
         * 创建一个动画基类
         */
        function AnimatorBase() {
            var _this = _super.call(this) || this;
            _this._autoUpdate = true;
            _this._time = 0;
            /** 播放速度 */
            _this._playbackSpeed = 1;
            /** 当前动画时间 */
            _this._absoluteTime = 0;
            _this._animationStates = {};
            /**
             * 是否更新位置
             */
            _this.updatePosition = true;
            return _this;
        }
        /**
         * 获取动画状态
         * @param node		动画节点
         * @return			动画状态
         */
        AnimatorBase.prototype.getAnimationState = function (node) {
            var cls = node.stateClass;
            var className = feng3d.ClassUtils.getQualifiedClassName(cls);
            if (this._animationStates[className] == null)
                this._animationStates[className] = new cls(this, node);
            return this._animationStates[className];
        };
        Object.defineProperty(AnimatorBase.prototype, "time", {
            /**
             * 动画时间
             */
            get: function () {
                return this._time;
            },
            set: function (value) {
                if (this._time == value)
                    return;
                this.update(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimatorBase.prototype, "playbackSpeed", {
            /**
             * 播放速度
             * <p>默认为1，表示正常速度</p>
             */
            get: function () {
                return this._playbackSpeed;
            },
            set: function (value) {
                this._playbackSpeed = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 开始动画，当自动更新为true时有效
         */
        AnimatorBase.prototype.start = function () {
            if (this._isPlaying || !this._autoUpdate)
                return;
            this._time = this._absoluteTime = feng3d.getTimer();
            this._isPlaying = true;
            feng3d.ticker.addEventListener(feng3d.Event.ENTER_FRAME, this.onEnterFrame, this);
            if (!this.hasEventListener(feng3d.AnimatorEvent.START))
                return;
            this.dispatchEvent(new feng3d.AnimatorEvent(feng3d.AnimatorEvent.START, this));
        };
        /**
         * 暂停播放动画
         * @see #time
         * @see #update()
         */
        AnimatorBase.prototype.stop = function () {
            if (!this._isPlaying)
                return;
            this._isPlaying = false;
            if (feng3d.ticker.hasEventListener(feng3d.Event.ENTER_FRAME))
                feng3d.ticker.removeEventListener(feng3d.Event.ENTER_FRAME, this.onEnterFrame, this);
            if (!this.hasEventListener(feng3d.AnimatorEvent.STOP))
                return;
            this.dispatchEvent(new feng3d.AnimatorEvent(feng3d.AnimatorEvent.STOP, this));
        };
        /**
         * 更新动画
         * @param time			动画时间
         */
        AnimatorBase.prototype.update = function (time) {
            var dt = (time - this._time) * this.playbackSpeed;
            this.updateDeltaTime(dt);
            this._time = time;
        };
        /**
         * 更新偏移时间
         * @private
         */
        AnimatorBase.prototype.updateDeltaTime = function (dt) {
            this._absoluteTime += dt;
            this._activeState.update(this._absoluteTime);
            if (this.updatePosition)
                this.applyPositionDelta();
        };
        /**
         * 自动更新动画时帧更新事件
         */
        AnimatorBase.prototype.onEnterFrame = function (event) {
            if (event === void 0) { event = null; }
            this.update(feng3d.getTimer());
        };
        /**
         * 应用位置偏移量
         */
        AnimatorBase.prototype.applyPositionDelta = function () {
            var delta = this._activeState.positionDelta;
            var dist = delta.length;
            var len;
            if (dist > 0) {
            }
        };
        return AnimatorBase;
    }(feng3d.Component));
    feng3d.AnimatorBase = AnimatorBase;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 动画播放器
     * @author feng 2017-01-04
     */
    var AnimationPlayer = (function () {
        function AnimationPlayer() {
            this._time = 0;
            this.preTime = 0;
            this._isPlaying = false;
            /**
             * 播放速度
             */
            this.playbackSpeed = 1;
        }
        Object.defineProperty(AnimationPlayer.prototype, "time", {
            /**
             * 动画时间
             */
            get: function () {
                return this._time;
            },
            set: function (value) {
                this._time = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 开始
         */
        AnimationPlayer.prototype.start = function () {
            this.time = 0;
            this.continue();
        };
        /**
         * 停止
         */
        AnimationPlayer.prototype.stop = function () {
            this.pause();
        };
        /**
         * 继续
         */
        AnimationPlayer.prototype.continue = function () {
            this._isPlaying;
            this.preTime = feng3d.getTimer();
            feng3d.ticker.addEventListener(feng3d.Event.ENTER_FRAME, this.onEnterFrame, this);
        };
        /**
         * 暂停
         */
        AnimationPlayer.prototype.pause = function () {
            feng3d.ticker.removeEventListener(feng3d.Event.ENTER_FRAME, this.onEnterFrame, this);
        };
        /**
         * 自动更新动画时帧更新事件
         */
        AnimationPlayer.prototype.onEnterFrame = function (event) {
            var currentTime = feng3d.getTimer();
            this.time = this.time + (currentTime - this.preTime) * this.playbackSpeed;
            this.preTime = feng3d.getTimer();
        };
        return AnimationPlayer;
    }());
    feng3d.AnimationPlayer = AnimationPlayer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 帧动画播放器
     * @author feng 2017-01-04
     */
    var AnimationClipPlayer = (function (_super) {
        __extends(AnimationClipPlayer, _super);
        function AnimationClipPlayer() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return AnimationClipPlayer;
    }(feng3d.AnimationPlayer));
    feng3d.AnimationClipPlayer = AnimationClipPlayer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 骨骼关节数据
     * @author feng 2014-5-20
     */
    var SkeletonJoint = (function () {
        function SkeletonJoint() {
            /** 父关节索引 （-1说明本身是总父节点，这个序号其实就是行号了，譬如上面”origin“节点的序号就是0，无父节点； "body"节点序号是1，父节点序号是0，也就是说父节点是”origin“）*/
            this.parentIndex = -1;
        }
        Object.defineProperty(SkeletonJoint.prototype, "matrix3D", {
            get: function () {
                if (!this._matrix3D) {
                    this._matrix3D = this.orientation.toMatrix3D();
                    this._matrix3D.appendTranslation(this.translation.x, this.translation.y, this.translation.z);
                }
                return this._matrix3D;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SkeletonJoint.prototype, "invertMatrix3D", {
            get: function () {
                if (!this._invertMatrix3D) {
                    this._invertMatrix3D = this.matrix3D.clone();
                    this._invertMatrix3D.invert();
                }
                return this._invertMatrix3D;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SkeletonJoint.prototype, "inverseBindPose", {
            get: function () {
                return this.invertMatrix3D.rawData;
            },
            enumerable: true,
            configurable: true
        });
        SkeletonJoint.prototype.invalid = function () {
            this._matrix3D = null;
            this._invertMatrix3D = null;
        };
        return SkeletonJoint;
    }());
    feng3d.SkeletonJoint = SkeletonJoint;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 骨骼数据
     * @author feng 2014-5-20
     */
    var Skeleton = (function (_super) {
        __extends(Skeleton, _super);
        function Skeleton() {
            var _this = _super.call(this) || this;
            _this.joints = [];
            return _this;
        }
        Object.defineProperty(Skeleton.prototype, "numJoints", {
            get: function () {
                return this.joints.length;
            },
            enumerable: true,
            configurable: true
        });
        return Skeleton;
    }(feng3d.Component));
    feng3d.Skeleton = Skeleton;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 关节pose
     * @author feng 2014-5-20
     */
    var JointPose = (function () {
        function JointPose() {
            /** 旋转信息 */
            this.orientation = new feng3d.Quaternion();
            /** 位移信息 */
            this.translation = new feng3d.Vector3D();
        }
        Object.defineProperty(JointPose.prototype, "matrix3D", {
            get: function () {
                if (!this._matrix3D) {
                    this._matrix3D = this.orientation.toMatrix3D();
                    this._matrix3D.appendTranslation(this.translation.x, this.translation.y, this.translation.z);
                }
                return this._matrix3D;
            },
            set: function (value) {
                this._matrix3D = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(JointPose.prototype, "invertMatrix3D", {
            get: function () {
                if (!this._invertMatrix3D) {
                    this._invertMatrix3D = this.matrix3D.clone();
                    this._invertMatrix3D.invert();
                }
                return this._invertMatrix3D;
            },
            enumerable: true,
            configurable: true
        });
        JointPose.prototype.invalid = function () {
            this._matrix3D = null;
            this._invertMatrix3D = null;
        };
        return JointPose;
    }());
    feng3d.JointPose = JointPose;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 骨骼pose
     * @author feng 2014-5-20
     */
    var SkeletonPose = (function () {
        function SkeletonPose() {
            this.jointPoses = [];
        }
        Object.defineProperty(SkeletonPose.prototype, "numJointPoses", {
            get: function () {
                return this.jointPoses.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SkeletonPose.prototype, "globalMatrix3Ds", {
            get: function () {
                if (!this._globalMatrix3Ds) {
                    var matrix3Ds = this._globalMatrix3Ds = [];
                    for (var i = 0; i < this.jointPoses.length; i++) {
                        var jointPose = this.jointPoses[i];
                        matrix3Ds[i] = jointPose.matrix3D.clone();
                        if (jointPose.parentIndex >= 0) {
                            matrix3Ds[i].append(matrix3Ds[jointPose.parentIndex]);
                        }
                    }
                }
                return this._globalMatrix3Ds;
            },
            enumerable: true,
            configurable: true
        });
        SkeletonPose.prototype.invalid = function () {
            this._globalMatrix3Ds = null;
        };
        return SkeletonPose;
    }());
    feng3d.SkeletonPose = SkeletonPose;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 动画剪辑节点基类(用于控制动画播放，包含每帧持续时间，是否循环播放等)
     * @author feng 2014-5-20
     */
    var AnimationClipNodeBase = (function (_super) {
        __extends(AnimationClipNodeBase, _super);
        function AnimationClipNodeBase() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this._looping = true;
            _this._totalDuration = 0;
            _this._stitchDirty = true;
            _this._stitchFinalFrame = false;
            _this._numFrames = 0;
            _this._durations = [];
            _this._totalDelta = new feng3d.Vector3D();
            /** 是否稳定帧率 */
            _this.fixedFrameRate = true;
            return _this;
        }
        Object.defineProperty(AnimationClipNodeBase.prototype, "durations", {
            /**
             * 持续时间列表（ms）
             */
            get: function () {
                return this._durations;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationClipNodeBase.prototype, "totalDelta", {
            /**
             * 总坐标偏移量
             */
            get: function () {
                if (this._stitchDirty)
                    this.updateStitch();
                return this._totalDelta;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationClipNodeBase.prototype, "looping", {
            /**
             * 是否循环播放
             */
            get: function () {
                return this._looping;
            },
            set: function (value) {
                if (this._looping == value)
                    return;
                this._looping = value;
                this._stitchDirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationClipNodeBase.prototype, "stitchFinalFrame", {
            /**
             * 是否过渡结束帧
             */
            get: function () {
                return this._stitchFinalFrame;
            },
            set: function (value) {
                if (this._stitchFinalFrame == value)
                    return;
                this._stitchFinalFrame = value;
                this._stitchDirty = true;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationClipNodeBase.prototype, "totalDuration", {
            /**
             * 总持续时间
             */
            get: function () {
                if (this._stitchDirty)
                    this.updateStitch();
                return this._totalDuration;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AnimationClipNodeBase.prototype, "lastFrame", {
            /**
             * 最后帧数
             */
            get: function () {
                if (this._stitchDirty)
                    this.updateStitch();
                return this._lastFrame;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 更新动画播放控制状态
         */
        AnimationClipNodeBase.prototype.updateStitch = function () {
            this._stitchDirty = false;
            this._lastFrame = (this._looping && this._stitchFinalFrame) ? this._numFrames : this._numFrames - 1;
            this._totalDuration = 0;
            this._totalDelta.x = 0;
            this._totalDelta.y = 0;
            this._totalDelta.z = 0;
        };
        return AnimationClipNodeBase;
    }(feng3d.AnimationNodeBase));
    feng3d.AnimationClipNodeBase = AnimationClipNodeBase;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 骨骼动画节点（一般用于一个动画的帧列表）
     * 包含基于时间的动画数据作为单独的骨架构成。
     * @author feng 2014-5-20
     */
    var SkeletonClipNode = (function (_super) {
        __extends(SkeletonClipNode, _super);
        /**
         * 创建骨骼动画节点
         */
        function SkeletonClipNode() {
            var _this = _super.call(this) || this;
            _this._frames = [];
            _this._stateClass = feng3d.SkeletonClipState;
            return _this;
        }
        Object.defineProperty(SkeletonClipNode.prototype, "frames", {
            /**
             * 骨骼姿势动画帧列表
             */
            get: function () {
                return this._frames;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 添加帧到动画
         * @param skeletonPose 骨骼姿势
         * @param duration 持续时间
         */
        SkeletonClipNode.prototype.addFrame = function (skeletonPose, duration) {
            this._frames.push(skeletonPose);
            this._durations.push(duration);
            this._totalDuration += duration;
            this._numFrames = this._durations.length;
            this._stitchDirty = true;
        };
        /**
         * @inheritDoc
         */
        SkeletonClipNode.prototype.updateStitch = function () {
            _super.prototype.updateStitch.call(this);
            var i = this._numFrames - 1;
            var p1, p2, delta;
            while (i--) {
                this._totalDuration += this._durations[i];
                p1 = this._frames[i].jointPoses[0].translation;
                p2 = this._frames[i + 1].jointPoses[0].translation;
                delta = p2.subtract(p1);
                this._totalDelta.x += delta.x;
                this._totalDelta.y += delta.y;
                this._totalDelta.z += delta.z;
            }
            if (this._stitchFinalFrame && this._looping) {
                this._totalDuration += this._durations[this._numFrames - 1];
                if (this._numFrames > 1) {
                    p1 = this._frames[0].jointPoses[0].translation;
                    p2 = this._frames[1].jointPoses[0].translation;
                    delta = p2.subtract(p1);
                    this._totalDelta.x += delta.x;
                    this._totalDelta.y += delta.y;
                    this._totalDelta.z += delta.z;
                }
            }
        };
        return SkeletonClipNode;
    }(feng3d.AnimationClipNodeBase));
    feng3d.SkeletonClipNode = SkeletonClipNode;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 骨骼剪辑状态
     * @author feng 2015-9-18
     */
    var SkeletonClipState = (function (_super) {
        __extends(SkeletonClipState, _super);
        /**
         * 创建骨骼剪辑状态实例
         * @param animator				动画
         * @param skeletonClipNode		骨骼剪辑节点
         */
        function SkeletonClipState(animator, skeletonClipNode) {
            var _this = _super.call(this, animator, skeletonClipNode) || this;
            _this._rootPos = new feng3d.Vector3D();
            _this._skeletonPose = new feng3d.SkeletonPose();
            _this._skeletonPoseDirty = true;
            _this._skeletonClipNode = skeletonClipNode;
            _this._frames = _this._skeletonClipNode.frames;
            return _this;
        }
        Object.defineProperty(SkeletonClipState.prototype, "currentPose", {
            /**
             * 当前骨骼姿势
             */
            get: function () {
                if (this._framesDirty)
                    this.updateFrames();
                return this._currentPose;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SkeletonClipState.prototype, "nextPose", {
            /**
             * 下个姿势
             */
            get: function () {
                if (this._framesDirty)
                    this.updateFrames();
                return this._nextPose;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * @inheritDoc
         */
        SkeletonClipState.prototype.getSkeletonPose = function () {
            if (this._skeletonPoseDirty)
                this.updateSkeletonPose();
            return this._skeletonPose;
        };
        /**
         * @inheritDoc
         */
        SkeletonClipState.prototype.updateTime = function (time) {
            this._skeletonPoseDirty = true;
            _super.prototype.updateTime.call(this, time);
        };
        /**
         * @inheritDoc
         */
        SkeletonClipState.prototype.updateFrames = function () {
            _super.prototype.updateFrames.call(this);
            this._currentPose = this._frames[this._currentFrame];
            if (this._skeletonClipNode.looping && this._nextFrame >= this._skeletonClipNode.lastFrame) {
                this._nextPose = this._frames[0];
            }
            else
                this._nextPose = this._frames[this._nextFrame];
        };
        /**
         * 更新骨骼姿势
         * @param skeleton 骨骼
         */
        SkeletonClipState.prototype.updateSkeletonPose = function () {
            this._skeletonPoseDirty = false;
            if (!this._skeletonClipNode.totalDuration)
                return;
            if (this._framesDirty)
                this.updateFrames();
            var currentPose = this._currentPose.jointPoses;
            var nextPose = this._nextPose.jointPoses;
            var numJoints = this._currentPose.numJointPoses;
            var p1, p2;
            var pose1, pose2;
            var showPoses = this._skeletonPose.jointPoses;
            var showPose;
            var tr;
            for (var i = 0; i < numJoints; ++i) {
                pose1 = currentPose[i];
                pose2 = nextPose[i];
                //
                showPose = showPoses[i];
                if (showPose == null) {
                    showPose = showPoses[i] = new feng3d.JointPose();
                    showPose.name = pose1.name;
                    showPose.parentIndex = pose1.parentIndex;
                }
                p1 = pose1.translation;
                p2 = pose2.translation;
                //根据前后两个关节姿势计算出当前显示关节姿势
                showPose.orientation.lerp(pose1.orientation, pose2.orientation, this._blendWeight);
                //计算显示的关节位置
                if (i > 0) {
                    tr = showPose.translation;
                    tr.x = p1.x + this._blendWeight * (p2.x - p1.x);
                    tr.y = p1.y + this._blendWeight * (p2.y - p1.y);
                    tr.z = p1.z + this._blendWeight * (p2.z - p1.z);
                }
                showPose.invalid();
            }
            this._skeletonPose.invalid();
        };
        /**
         * @inheritDoc
         */
        SkeletonClipState.prototype.updatePositionDelta = function () {
            this._positionDeltaDirty = false;
            if (this._framesDirty)
                this.updateFrames();
            var p1, p2, p3;
            var totalDelta = this._skeletonClipNode.totalDelta;
            //跳过最后，重置位置
            if ((this._timeDir > 0 && this._nextFrame < this._oldFrame) || (this._timeDir < 0 && this._nextFrame > this._oldFrame)) {
                this._rootPos.x -= totalDelta.x * this._timeDir;
                this._rootPos.y -= totalDelta.y * this._timeDir;
                this._rootPos.z -= totalDelta.z * this._timeDir;
            }
            /** 保存骨骼根节点原位置 */
            var dx = this._rootPos.x;
            var dy = this._rootPos.y;
            var dz = this._rootPos.z;
            //计算骨骼根节点位置
            if (this._skeletonClipNode.stitchFinalFrame && this._nextFrame == this._skeletonClipNode.lastFrame) {
                p1 = this._frames[0].jointPoses[0].translation;
                p2 = this._frames[1].jointPoses[0].translation;
                p3 = this._currentPose.jointPoses[0].translation;
                this._rootPos.x = p3.x + p1.x + this._blendWeight * (p2.x - p1.x);
                this._rootPos.y = p3.y + p1.y + this._blendWeight * (p2.y - p1.y);
                this._rootPos.z = p3.z + p1.z + this._blendWeight * (p2.z - p1.z);
            }
            else {
                p1 = this._currentPose.jointPoses[0].translation;
                p2 = this._frames[this._nextFrame].jointPoses[0].translation; //cover the instances where we wrap the pose but still want the final frame translation values
                this._rootPos.x = p1.x + this._blendWeight * (p2.x - p1.x);
                this._rootPos.y = p1.y + this._blendWeight * (p2.y - p1.y);
                this._rootPos.z = p1.z + this._blendWeight * (p2.z - p1.z);
            }
            //计算骨骼根节点偏移量
            this._rootDelta.x = this._rootPos.x - dx;
            this._rootDelta.y = this._rootPos.y - dy;
            this._rootDelta.z = this._rootPos.z - dz;
            //保存旧帧编号
            this._oldFrame = this._nextFrame;
        };
        return SkeletonClipState;
    }(feng3d.AnimationClipState));
    feng3d.SkeletonClipState = SkeletonClipState;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var SkeletonAnimationSet = (function () {
        function SkeletonAnimationSet() {
        }
        return SkeletonAnimationSet;
    }());
    feng3d.SkeletonAnimationSet = SkeletonAnimationSet;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 骨骼动画
     * @author feng 2014-5-27
     */
    var SkeletonAnimator = (function (_super) {
        __extends(SkeletonAnimator, _super);
        /**
         * 创建一个骨骼动画类
         */
        function SkeletonAnimator(skeleton) {
            var _this = _super.call(this) || this;
            /** 动画节点列表 */
            _this.animations = [];
            _this._globalMatrices = [];
            _this._globalPropertiesDirty = true;
            _this.skeleton = skeleton;
            //
            _this.createUniformData("u_skeletonGlobalMatriices", function () { return _this.globalMatrices; });
            _this.createValueMacro("NUM_SKELETONJOINT", function () { return _this._skeleton.numJoints; });
            _this.createBoolMacro("HAS_SKELETON_ANIMATION", function () { return !!_this._activeSkeletonState; });
            return _this;
        }
        Object.defineProperty(SkeletonAnimator.prototype, "skeleton", {
            /**
             * 骨骼
             */
            get: function () {
                return this._skeleton;
            },
            set: function (value) {
                if (this._skeleton == value)
                    return;
                this._skeleton = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SkeletonAnimator.prototype, "globalMatrices", {
            /**
             * 当前骨骼姿势的全局矩阵
             * @see #globalPose
             */
            get: function () {
                if (this._globalPropertiesDirty)
                    this.updateGlobalProperties();
                return this._globalMatrices;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 播放动画
         * @param name 动作名称
         */
        SkeletonAnimator.prototype.play = function () {
            if (!this._activeNode)
                this._activeNode = this.animations[0];
            this._activeState = this.getAnimationState(this._activeNode);
            if (this.updatePosition) {
                //this.update straight away to this.reset position deltas
                this._activeState.update(this._absoluteTime);
                this._activeState.positionDelta;
            }
            this._activeSkeletonState = this._activeState;
            this.start();
        };
        /**
         * @inheritDoc
         */
        SkeletonAnimator.prototype.updateDeltaTime = function (dt) {
            _super.prototype.updateDeltaTime.call(this, dt);
            this._globalPropertiesDirty = true;
        };
        /**
         * 更新骨骼全局变换矩阵
         */
        SkeletonAnimator.prototype.updateGlobalProperties = function () {
            if (!this._activeSkeletonState)
                return;
            this._globalPropertiesDirty = false;
            //获取全局骨骼姿势
            var currentSkeletonPose = this._activeSkeletonState.getSkeletonPose();
            var globalMatrix3Ds = currentSkeletonPose.globalMatrix3Ds;
            //姿势变换矩阵
            var joints = this._skeleton.joints;
            //遍历每个关节
            for (var i = 0; i < this._skeleton.numJoints; ++i) {
                var inverseMatrix3D = joints[i].invertMatrix3D;
                var matrix3D = globalMatrix3Ds[i].clone();
                matrix3D.prepend(inverseMatrix3D);
                this._globalMatrices[i] = matrix3D;
            }
        };
        return SkeletonAnimator;
    }(feng3d.AnimatorBase));
    feng3d.SkeletonAnimator = SkeletonAnimator;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 变换动作
     */
    var TransformAnimator = (function (_super) {
        __extends(TransformAnimator, _super);
        function TransformAnimator() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return TransformAnimator;
    }(feng3d.Component));
    feng3d.TransformAnimator = TransformAnimator;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Obj模型解析器
     * @author feng 2017-01-13
     */
    var OBJParser = (function () {
        function OBJParser() {
        }
        OBJParser.parser = function (context) {
            var objData = { mtl: null, objs: [] };
            var lines = context.split("\n").reverse();
            do {
                var line = lines.pop();
                parserLine(line, objData);
            } while (line);
            currentObj = null;
            currentSubObj = null;
            return objData;
        };
        return OBJParser;
    }());
    feng3d.OBJParser = OBJParser;
    /** mtl正则 */
    var mtlReg = /mtllib\s+([\w.]+)/;
    /** 对象名称正则 */
    var objReg = /o\s+([\w]+)/;
    /** 顶点坐标正则 */
    var vertexReg = /v\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/;
    /** 顶点法线正则 */
    var vnReg = /vn\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/;
    /** 顶点uv正则 */
    var vtReg = /vt\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/;
    /** 使用材质正则 */
    var usemtlReg = /usemtl\s+([\w.]+)/;
    /** 面正则 vertex */
    var faceVReg = /f\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/;
    /** 面正则 vertex/uv/normal */
    var faceVUNReg = /f\s+((\d+)\/(\d+)\/(\d+))\s+((\d+)\/(\d+)\/(\d+))\s+((\d+)\/(\d+)\/(\d+))/;
    var gReg = /g\s+(\w+)/;
    var sReg = /s\s+(\w+)/;
    //
    var currentObj;
    var currentSubObj;
    function parserLine(line, objData) {
        if (!line)
            return;
        line = line.trim();
        if (!line.length)
            return;
        if (line.charAt(0) == "#")
            return;
        var result;
        if ((result = mtlReg.exec(line)) && result[0] == line) {
            objData.mtl = result[1];
        }
        else if ((result = objReg.exec(line)) && result[0] == line) {
            currentObj = { name: result[1], vertex: [], subObjs: [], vn: [], vt: [] };
            objData.objs.push(currentObj);
        }
        else if ((result = vertexReg.exec(line)) && result[0] == line) {
            if (currentObj == null) {
                currentObj = { name: "", vertex: [], subObjs: [], vn: [], vt: [] };
                objData.objs.push(currentObj);
            }
            currentObj.vertex.push({ x: parseFloat(result[1]), y: parseFloat(result[2]), z: parseFloat(result[3]) });
        }
        else if ((result = vnReg.exec(line)) && result[0] == line) {
            currentObj.vn.push({ x: parseFloat(result[1]), y: parseFloat(result[2]), z: parseFloat(result[3]) });
        }
        else if ((result = vtReg.exec(line)) && result[0] == line) {
            currentObj.vt.push({ u: parseFloat(result[1]), v: 1 - parseFloat(result[2]), s: parseFloat(result[3]) });
        }
        else if ((result = gReg.exec(line)) && result[0] == line) {
            if (currentSubObj == null) {
                currentSubObj = { faces: [] };
                currentObj.subObjs.push(currentSubObj);
            }
            currentSubObj.g = result[1];
        }
        else if ((result = sReg.exec(line)) && result[0] == line) {
        }
        else if ((result = usemtlReg.exec(line)) && result[0] == line) {
            currentSubObj = { faces: [] };
            currentObj.subObjs.push(currentSubObj);
            currentSubObj.material = result[1];
        }
        else if ((result = faceVReg.exec(line)) && result[0] == line) {
            currentSubObj.faces.push({
                indexIds: [result[1], result[2], result[3], result[3]],
                vertexIndices: [parseInt(result[1]), parseInt(result[2]), parseInt(result[3]), parseInt(result[4])]
            });
        }
        else if ((result = faceVUNReg.exec(line)) && result[0] == line) {
            currentSubObj.faces.push({
                indexIds: [result[1], result[5], result[9]],
                vertexIndices: [parseInt(result[2]), parseInt(result[6]), parseInt(result[10])],
                uvIndices: [parseInt(result[3]), parseInt(result[7]), parseInt(result[11])],
                normalIndices: [parseInt(result[4]), parseInt(result[8]), parseInt(result[12])]
            });
        }
        else {
            throw new Error("\u65E0\u6CD5\u89E3\u6790" + line);
        }
    }
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Obj模型Mtl解析器
     * @author feng 2017-01-13
     */
    var MtlParser = (function () {
        function MtlParser() {
        }
        MtlParser.parser = function (context) {
            var mtl = {};
            var lines = context.split("\n").reverse();
            do {
                var line = lines.pop();
                parserLine(line, mtl);
            } while (line);
            return mtl;
        };
        return MtlParser;
    }());
    feng3d.MtlParser = MtlParser;
    var newmtlReg = /newmtl\s+([\w.]+)/;
    var kaReg = /Ka\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/;
    var kdReg = /Kd\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/;
    var ksReg = /Ks\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/;
    var nsReg = /Ns\s+([\d.]+)/;
    var niReg = /Ni\s+([\d.]+)/;
    var dReg = /d\s+([\d.]+)/;
    var illumReg = /illum\s+([\d]+)/;
    var currentMaterial;
    function parserLine(line, mtl) {
        if (!line)
            return;
        line = line.trim();
        if (!line.length)
            return;
        if (line.charAt(0) == "#")
            return;
        var result;
        if ((result = newmtlReg.exec(line)) && result[0] == line) {
            currentMaterial = { name: result[1], ka: [], kd: [], ks: [], ns: 0, ni: 0, d: 0, illum: 0 };
            mtl[currentMaterial.name] = currentMaterial;
        }
        else if ((result = kaReg.exec(line)) && result[0] == line) {
            currentMaterial.ka = [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])];
        }
        else if ((result = kdReg.exec(line)) && result[0] == line) {
            currentMaterial.kd = [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])];
        }
        else if ((result = ksReg.exec(line)) && result[0] == line) {
            currentMaterial.ks = [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])];
        }
        else if ((result = nsReg.exec(line)) && result[0] == line) {
            currentMaterial.ns = parseFloat(result[1]);
        }
        else if ((result = niReg.exec(line)) && result[0] == line) {
            currentMaterial.ni = parseFloat(result[1]);
        }
        else if ((result = dReg.exec(line)) && result[0] == line) {
            currentMaterial.d = parseFloat(result[1]);
        }
        else if ((result = illumReg.exec(line)) && result[0] == line) {
            currentMaterial.illum = parseFloat(result[1]);
        }
        else {
            throw new Error("\u65E0\u6CD5\u89E3\u6790" + line);
        }
    }
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var MD5MeshParser = (function () {
        function MD5MeshParser() {
        }
        MD5MeshParser.parse = function (context) {
            //
            var md5MeshData = {};
            var lines = context.split("\n").reverse();
            do {
                var line = lines.pop();
                parserLine(line, md5MeshData);
            } while (line);
            return md5MeshData;
        };
        return MD5MeshParser;
    }());
    feng3d.MD5MeshParser = MD5MeshParser;
    var MD5VersionReg = /MD5Version\s+(\d+)/;
    var commandlineReg = /commandline\s+"([\w\s/.-]+)"/;
    var numJointsReg = /numJoints\s+(\d+)/;
    var numMeshesReg = /numMeshes\s+(\d+)/;
    var jointsStartReg = /joints\s+{/;
    var jointsReg = /"(\w+)"\s+([-\d]+)\s+\(\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+\)\s+\(\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+\)(\s+\/\/(\s+\w+)?)?/;
    var endBlockReg = /}/;
    var meshStartReg = /mesh\s+{/;
    var annotationReg = /\/\/[\s\w:]+/;
    var shaderReg = /shader\s+"([\w\/]+)"/;
    var numvertsReg = /numverts\s+(\d+)/;
    var vertReg = /vert\s+(\d+)\s+\(\s+([\d.]+)\s+([\d.]+)\s+\)\s+(\d+)\s+(\d+)/;
    var numtrisReg = /numtris\s+(\d+)/;
    var triReg = /tri\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/;
    var numweightsReg = /numweights\s+(\d+)/;
    var weightReg = /weight\s+(\d+)\s+(\d+)\s+([\d.]+)\s+\(\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+\)/;
    /**
     * 状态
     */
    var State;
    (function (State) {
        /** 读取关节 */
        State[State["joints"] = 0] = "joints";
        State[State["mesh"] = 1] = "mesh";
    })(State || (State = {}));
    /** 当前处于状态 */
    var states = [];
    var currentMesh;
    function parserLine(line, md5MeshData) {
        if (!line)
            return;
        line = line.trim();
        if (!line.length)
            return;
        var result;
        if ((result = MD5VersionReg.exec(line)) && result[0] == line) {
            md5MeshData.MD5Version = parseInt(result[1]);
        }
        else if ((result = commandlineReg.exec(line)) && result[0] == line) {
            md5MeshData.commandline = result[1];
        }
        else if ((result = numJointsReg.exec(line)) && result[0] == line) {
            md5MeshData.numJoints = parseInt(result[1]);
        }
        else if ((result = numMeshesReg.exec(line)) && result[0] == line) {
            md5MeshData.numMeshes = parseInt(result[1]);
        }
        else if ((result = jointsStartReg.exec(line)) && result[0] == line) {
            states.push(State.joints);
            md5MeshData.joints = [];
        }
        else if ((result = jointsReg.exec(line)) && result[0] == line) {
            md5MeshData.joints.push({
                name: result[1], parentIndex: parseInt(result[2]),
                position: [parseFloat(result[3]), parseFloat(result[4]), parseFloat(result[5])],
                rotation: [parseFloat(result[6]), parseFloat(result[7]), parseFloat(result[8])]
            });
        }
        else if ((result = endBlockReg.exec(line)) && result[0] == line) {
            var exitState = states.pop();
            if (exitState == State.mesh) {
                currentMesh = null;
            }
        }
        else if ((result = meshStartReg.exec(line)) && result[0] == line) {
            states.push(State.mesh);
            if (!md5MeshData.meshs) {
                md5MeshData.meshs = [];
            }
            currentMesh = {};
            md5MeshData.meshs.push(currentMesh);
        }
        else if ((result = annotationReg.exec(line)) && result[0] == line) {
        }
        else if ((result = shaderReg.exec(line)) && result[0] == line) {
            currentMesh.shader = result[1];
        }
        else if ((result = numvertsReg.exec(line)) && result[0] == line) {
            currentMesh.numverts = parseInt(result[1]);
            currentMesh.verts = [];
        }
        else if ((result = vertReg.exec(line)) && result[0] == line) {
            currentMesh.verts.push({
                index: parseFloat(result[1]), u: parseFloat(result[2]), v: parseFloat(result[3]),
                startWeight: parseFloat(result[4]), countWeight: parseFloat(result[5])
            });
        }
        else if ((result = numtrisReg.exec(line)) && result[0] == line) {
            currentMesh.numtris = parseInt(result[1]);
            currentMesh.tris = [];
        }
        else if ((result = triReg.exec(line)) && result[0] == line) {
            var index = parseInt(result[1]) * 3;
            currentMesh.tris[index] = parseInt(result[2]);
            currentMesh.tris[index + 1] = parseInt(result[3]);
            currentMesh.tris[index + 2] = parseInt(result[4]);
        }
        else if ((result = numweightsReg.exec(line)) && result[0] == line) {
            currentMesh.numweights = parseInt(result[1]);
            currentMesh.weights = [];
        }
        else if ((result = weightReg.exec(line)) && result[0] == line) {
            currentMesh.weights.push({
                index: parseInt(result[1]), joint: parseInt(result[2]), bias: parseFloat(result[3]),
                pos: [parseFloat(result[4]), parseFloat(result[5]), parseFloat(result[6])]
            });
        }
        else {
            throw new Error("\u65E0\u6CD5\u89E3\u6790" + line);
        }
    }
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var MD5AnimParser = (function () {
        function MD5AnimParser() {
        }
        MD5AnimParser.parse = function (context) {
            var md5AnimData = {};
            var lines = context.split("\n").reverse();
            do {
                var line = lines.pop();
                parserLine(line, md5AnimData);
            } while (line);
            return md5AnimData;
        };
        return MD5AnimParser;
    }());
    feng3d.MD5AnimParser = MD5AnimParser;
    var MD5VersionReg = /MD5Version\s+(\d+)/;
    var commandlineReg = /commandline\s+"([\w\s/.-]+)"/;
    var numFramesReg = /numFrames\s+(\d+)/;
    var numJointsReg = /numJoints\s+(\d+)/;
    var frameRateReg = /frameRate\s+(\d+)/;
    var numAnimatedComponentsReg = /numAnimatedComponents\s+(\d+)/;
    var hierarchyStartReg = /hierarchy\s+{/;
    var hierarchyReg = /"(\w+)"\s+([\d-]+)\s+(\d+)\s+(\d+)(\s+\/\/(\s+\w+)?(\s+\([\s\w]+\))?)?/;
    var endBlockReg = /}/;
    var boundsStartReg = /bounds\s+{/;
    //2组3个number
    var number32Reg = /\(\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+\)\s+\(\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+\)/;
    var baseframeStartReg = /baseframe\s+{/;
    var frameStartReg = /frame\s+(\d+)\s+{/;
    var numbersReg = /(-?[\d.]+)(\s+-?[\d.]+){0,}/;
    /**
     * 状态
     */
    var State;
    (function (State) {
        State[State["hierarchy"] = 0] = "hierarchy";
        State[State["bounds"] = 1] = "bounds";
        State[State["baseframe"] = 2] = "baseframe";
        State[State["frame"] = 3] = "frame";
    })(State || (State = {}));
    /** 当前处于状态 */
    var states = [];
    var currentFrame;
    function parserLine(line, md5AnimData) {
        if (!line)
            return;
        line = line.trim();
        if (!line.length)
            return;
        var result;
        if ((result = MD5VersionReg.exec(line)) && result[0] == line) {
            md5AnimData.MD5Version = parseInt(result[1]);
        }
        else if ((result = commandlineReg.exec(line)) && result[0] == line) {
            md5AnimData.commandline = result[1];
        }
        else if ((result = numFramesReg.exec(line)) && result[0] == line) {
            md5AnimData.numFrames = parseInt(result[1]);
        }
        else if ((result = numJointsReg.exec(line)) && result[0] == line) {
            md5AnimData.numJoints = parseInt(result[1]);
        }
        else if ((result = frameRateReg.exec(line)) && result[0] == line) {
            md5AnimData.frameRate = parseInt(result[1]);
        }
        else if ((result = numAnimatedComponentsReg.exec(line)) && result[0] == line) {
            md5AnimData.numAnimatedComponents = parseInt(result[1]);
        }
        else if ((result = hierarchyStartReg.exec(line)) && result[0] == line) {
            md5AnimData.hierarchy = [];
            states.push(State.hierarchy);
        }
        else if ((result = hierarchyReg.exec(line)) && result[0] == line) {
            switch (states[states.length - 1]) {
                case State.hierarchy:
                    md5AnimData.hierarchy.push({
                        name: result[1], parentIndex: parseInt(result[2]),
                        flags: parseInt(result[3]), startIndex: parseInt(result[4])
                    });
                    break;
                default:
                    throw new Error("没有对应的数据处理");
            }
        }
        else if ((result = endBlockReg.exec(line)) && result[0] == line) {
            var state = states.pop();
            if (state == State.frame) {
                if (currentFrame.components.length != md5AnimData.numAnimatedComponents) {
                    throw new Error("frame中数据不对");
                }
                currentFrame = null;
            }
        }
        else if ((result = boundsStartReg.exec(line)) && result[0] == line) {
            md5AnimData.bounds = [];
            states.push(State.bounds);
        }
        else if ((result = baseframeStartReg.exec(line)) && result[0] == line) {
            md5AnimData.baseframe = [];
            states.push(State.baseframe);
        }
        else if ((result = number32Reg.exec(line)) && result[0] == line) {
            switch (states[states.length - 1]) {
                case State.bounds:
                    md5AnimData.bounds.push({ min: [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])], max: [parseFloat(result[4]), parseFloat(result[5]), parseFloat(result[6])] });
                    break;
                case State.baseframe:
                    md5AnimData.baseframe.push({ position: [parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])], orientation: [parseFloat(result[4]), parseFloat(result[5]), parseFloat(result[6])] });
                    break;
                default:
                    throw new Error("没有对应的数据处理");
            }
        }
        else if ((result = frameStartReg.exec(line)) && result[0] == line) {
            if (!md5AnimData.frame) {
                md5AnimData.frame = [];
            }
            currentFrame = { index: parseInt(result[1]), components: [] };
            md5AnimData.frame.push(currentFrame);
            states.push(State.frame);
        }
        else if ((result = numbersReg.exec(line)) && result[0] == line) {
            switch (states[states.length - 1]) {
                case State.frame:
                    var numbers = line.split(" ");
                    while (numbers.length > 0) {
                        currentFrame.components.push(parseFloat(numbers.shift()));
                    }
                    break;
                default:
                    throw new Error("没有对应的数据处理");
            }
        }
        else {
            throw new Error("\u65E0\u6CD5\u89E3\u6790" + line);
        }
    }
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Obj模型加载类
     * @author feng 2017-01-18
     */
    var ObjLoader = (function () {
        function ObjLoader() {
        }
        /**
         * 加载资源
         * @param url   路径
         */
        ObjLoader.prototype.load = function (url, material, completed) {
            if (completed === void 0) { completed = null; }
            this._completed = completed;
            this._url = url;
            this._material = material;
            var loader = new feng3d.Loader();
            loader.addEventListener(feng3d.LoaderEvent.COMPLETE, this.onComplete, this);
            loader.loadText(url);
        };
        ObjLoader.prototype.onComplete = function (e) {
            var objData = this._objData = feng3d.OBJParser.parser(e.data.content);
            var mtl = objData.mtl;
            if (mtl) {
                var mtlRoot = this._url.substring(0, this._url.lastIndexOf("/") + 1);
                var mtlLoader = new feng3d.Loader();
                mtlLoader.loadText(mtlRoot + mtl);
                mtlLoader.addEventListener(feng3d.LoaderEvent.COMPLETE, function (e) {
                    var mtlData = this._mtlData = feng3d.MtlParser.parser(e.data.content);
                    this.createObj(this._material);
                }, this);
            }
            else {
                this.createObj(this._material);
            }
        };
        ObjLoader.prototype.createObj = function (material) {
            var object = new feng3d.GameObject();
            var objData = this._objData;
            var objs = objData.objs;
            for (var i = 0; i < objs.length; i++) {
                var obj = objs[i];
                var object3D = this.createSubObj(obj, material);
                object.transform.addChild(object3D.transform);
            }
            if (this._completed) {
                this._completed(object);
            }
        };
        ObjLoader.prototype.createSubObj = function (obj, material) {
            var object3D = new feng3d.GameObject(obj.name);
            var subObjs = obj.subObjs;
            for (var i = 0; i < subObjs.length; i++) {
                var materialObj = this.createMaterialObj(obj, subObjs[i], material);
                object3D.transform.addChild(materialObj.transform);
            }
            return object3D;
        };
        ObjLoader.prototype.createMaterialObj = function (obj, subObj, material) {
            var gameObject = new feng3d.GameObject();
            var model = gameObject.addComponent(feng3d.MeshRenderer);
            model.material = material || new feng3d.ColorMaterial();
            this._vertices = obj.vertex;
            this._vertexNormals = obj.vn;
            this._uvs = obj.vt;
            var meshFilter = gameObject.addComponent(feng3d.MeshFilter);
            var geometry = meshFilter.mesh = new feng3d.Geometry();
            var vertices = [];
            var normals = [];
            var uvs = [];
            this._realIndices = [];
            this._vertexIndex = 0;
            var faces = subObj.faces;
            var indices = [];
            for (var i = 0; i < faces.length; i++) {
                var face = faces[i];
                var numVerts = face.indexIds.length - 1;
                for (var j = 1; j < numVerts; ++j) {
                    this.translateVertexData(face, j, vertices, uvs, indices, normals);
                    this.translateVertexData(face, 0, vertices, uvs, indices, normals);
                    this.translateVertexData(face, j + 1, vertices, uvs, indices, normals);
                }
            }
            geometry.setIndices(new Uint16Array(indices));
            geometry.setVAData("a_position", new Float32Array(vertices), 3);
            geometry.setVAData("a_normal", new Float32Array(normals), 3);
            geometry.setVAData("a_uv", new Float32Array(uvs), 2);
            geometry.createVertexTangents();
            if (this._mtlData && this._mtlData[subObj.material]) {
                var materialInfo = this._mtlData[subObj.material];
                var kd = materialInfo.kd;
                var colorMaterial = new feng3d.ColorMaterial();
                colorMaterial.color.r = kd[0];
                colorMaterial.color.g = kd[1];
                colorMaterial.color.b = kd[2];
                model.material = colorMaterial;
            }
            return gameObject;
        };
        ObjLoader.prototype.translateVertexData = function (face, vertexIndex, vertices, uvs, indices, normals) {
            var index;
            var vertex;
            var vertexNormal;
            var uv;
            if (!this._realIndices[face.indexIds[vertexIndex]]) {
                index = this._vertexIndex;
                this._realIndices[face.indexIds[vertexIndex]] = ++this._vertexIndex;
                vertex = this._vertices[face.vertexIndices[vertexIndex] - 1];
                vertices.push(vertex.x, vertex.y, vertex.z);
                if (face.normalIndices.length > 0) {
                    vertexNormal = this._vertexNormals[face.normalIndices[vertexIndex] - 1];
                    normals.push(vertexNormal.x, vertexNormal.y, vertexNormal.z);
                }
                if (face.uvIndices.length > 0) {
                    try {
                        uv = this._uvs[face.uvIndices[vertexIndex] - 1];
                        uvs.push(uv.u, uv.v);
                    }
                    catch (e) {
                        switch (vertexIndex) {
                            case 0:
                                uvs.push(0, 1);
                                break;
                            case 1:
                                uvs.push(.5, 0);
                                break;
                            case 2:
                                uvs.push(1, 1);
                        }
                    }
                }
            }
            else
                index = this._realIndices[face.indexIds[vertexIndex]] - 1;
            indices.push(index);
        };
        return ObjLoader;
    }());
    feng3d.ObjLoader = ObjLoader;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * MD5模型加载类
     * @author feng 2017-01-18
     */
    var MD5Loader = (function (_super) {
        __extends(MD5Loader, _super);
        function MD5Loader() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        /**
         * 加载资源
         * @param url   路径
         */
        MD5Loader.prototype.load = function (url, completed) {
            if (completed === void 0) { completed = null; }
            this._url = url;
            this._completed = completed;
            var loader = new feng3d.Loader();
            loader.addEventListener(feng3d.LoaderEvent.COMPLETE, function (e) {
                var objData = feng3d.MD5MeshParser.parse(e.data.content);
                this.createMD5Mesh(objData);
            }, this);
            loader.loadText(url);
        };
        MD5Loader.prototype.loadAnim = function (url, completed) {
            if (completed === void 0) { completed = null; }
            this._url = url;
            this._animCompleted = completed;
            var loader = new feng3d.Loader();
            loader.addEventListener(feng3d.LoaderEvent.COMPLETE, function (e) {
                var objData = feng3d.MD5AnimParser.parse(e.data.content);
                this.createAnimator(objData);
            }, this);
            loader.loadText(url);
        };
        MD5Loader.prototype.createMD5Mesh = function (md5MeshData) {
            var object3D = new feng3d.GameObject();
            //顶点最大关节关联数
            var _maxJointCount = this.calculateMaxJointCount(md5MeshData);
            feng3d.debuger && feng3d.assert(_maxJointCount <= 8, "顶点最大关节关联数最多支持8个");
            this._skeleton = this.createSkeleton(md5MeshData.joints);
            var skeletonAnimator = new feng3d.SkeletonAnimator(this._skeleton);
            for (var i = 0; i < md5MeshData.meshs.length; i++) {
                var geometry = this.createGeometry(md5MeshData.meshs[i]);
                var skeletonObject3D = new feng3d.GameObject();
                skeletonObject3D.addComponent(feng3d.MeshRenderer).material = new feng3d.StandardMaterial();
                skeletonObject3D.addComponent(feng3d.MeshFilter).mesh = geometry;
                skeletonObject3D.addComponent(skeletonAnimator);
                object3D.transform.addChild(skeletonObject3D.transform);
            }
            if (this._completed) {
                this._completed(object3D, skeletonAnimator);
            }
        };
        /**
         * 计算最大关节数量
         */
        MD5Loader.prototype.calculateMaxJointCount = function (md5MeshData) {
            var _maxJointCount = 0;
            //遍历所有的网格数据
            var numMeshData = md5MeshData.meshs.length;
            for (var i = 0; i < numMeshData; ++i) {
                var meshData = md5MeshData.meshs[i];
                var vertexData = meshData.verts;
                var numVerts = vertexData.length;
                //遍历每个顶点 寻找关节关联最大数量
                for (var j = 0; j < numVerts; ++j) {
                    var zeroWeights = this.countZeroWeightJoints(vertexData[j], meshData.weights);
                    var totalJoints = vertexData[j].countWeight - zeroWeights;
                    if (totalJoints > _maxJointCount)
                        _maxJointCount = totalJoints;
                }
            }
            return _maxJointCount;
        };
        /**
         * 计算0权重关节数量
         * @param vertex 顶点数据
         * @param weights 关节权重数组
         * @return
         */
        MD5Loader.prototype.countZeroWeightJoints = function (vertex, weights) {
            var start = vertex.startWeight;
            var end = vertex.startWeight + vertex.countWeight;
            var count = 0;
            var weight;
            for (var i = start; i < end; ++i) {
                weight = weights[i].bias;
                if (weight == 0)
                    ++count;
            }
            return count;
        };
        MD5Loader.prototype.createSkeleton = function (joints) {
            var skeleton = new feng3d.Skeleton();
            for (var i = 0; i < joints.length; i++) {
                var skeletonJoint = this.createSkeletonJoint(joints[i]);
                skeleton.joints.push(skeletonJoint);
            }
            return skeleton;
        };
        MD5Loader.prototype.createSkeletonJoint = function (joint) {
            var skeletonJoint = new feng3d.SkeletonJoint();
            skeletonJoint.name = joint.name;
            skeletonJoint.parentIndex = joint.parentIndex;
            var position = joint.position;
            var rotation = joint.rotation;
            var quat = new feng3d.Quaternion(rotation[0], -rotation[1], -rotation[2]);
            // quat supposed to be unit length
            var t = 1 - quat.x * quat.x - quat.y * quat.y - quat.z * quat.z;
            quat.w = t < 0 ? 0 : -Math.sqrt(t);
            //
            skeletonJoint.translation = new feng3d.Vector3D(-position[0], position[1], position[2]);
            skeletonJoint.translation = skeletonJoint.translation;
            //
            skeletonJoint.orientation = quat;
            return skeletonJoint;
        };
        MD5Loader.prototype.createGeometry = function (md5Mesh) {
            var vertexData = md5Mesh.verts;
            var weights = md5Mesh.weights;
            var indices = md5Mesh.tris;
            var geometry = new feng3d.Geometry();
            var len = vertexData.length;
            var vertex;
            var weight;
            var bindPose;
            var pos;
            //uv数据
            var uvs = [];
            uvs.length = len * 2;
            //顶点位置数据
            var vertices = [];
            vertices.length = len * 3;
            //关节索引数据
            var jointIndices0 = [];
            jointIndices0.length = len * 4;
            var jointIndices1 = [];
            jointIndices1.length = len * 4;
            //关节权重数据
            var jointWeights0 = [];
            jointWeights0.length = len * 4;
            var jointWeights1 = [];
            jointWeights1.length = len * 4;
            for (var i = 0; i < len; ++i) {
                vertex = vertexData[i];
                vertices[i * 3] = vertices[i * 3 + 1] = vertices[i * 3 + 2] = 0;
                /**
                 * 参考 http://blog.csdn.net/summerhust/article/details/17421213
                 * VertexPos = (MJ-0 * weight[index0].pos * weight[index0].bias) + ... + (MJ-N * weight[indexN].pos * weight[indexN].bias)
                 * 变量对应  MJ-N -> bindPose; 第J个关节的变换矩阵
                 * weight[indexN].pos -> weight.pos;
                 * weight[indexN].bias -> weight.bias;
                 */
                var weightJoints = [];
                var weightBiass = [];
                for (var j = 0; j < 8; ++j) {
                    weightJoints[j] = 0;
                    weightBiass[j] = 0;
                    if (j < vertex.countWeight) {
                        weight = weights[vertex.startWeight + j];
                        if (weight.bias > 0) {
                            bindPose = this._skeleton.joints[weight.joint].matrix3D;
                            pos = bindPose.transformVector(new feng3d.Vector3D(-weight.pos[0], weight.pos[1], weight.pos[2]));
                            vertices[i * 3] += pos.x * weight.bias;
                            vertices[i * 3 + 1] += pos.y * weight.bias;
                            vertices[i * 3 + 2] += pos.z * weight.bias;
                            weightJoints[j] = weight.joint;
                            weightBiass[j] = weight.bias;
                        }
                    }
                }
                jointIndices0[i * 4] = weightJoints[0];
                jointIndices0[i * 4 + 1] = weightJoints[1];
                jointIndices0[i * 4 + 2] = weightJoints[2];
                jointIndices0[i * 4 + 3] = weightJoints[3];
                jointIndices1[i * 4] = weightJoints[4];
                jointIndices1[i * 4 + 1] = weightJoints[5];
                jointIndices1[i * 4 + 2] = weightJoints[6];
                jointIndices1[i * 4 + 3] = weightJoints[7];
                //
                jointWeights0[i * 4] = weightBiass[0];
                jointWeights0[i * 4 + 1] = weightBiass[1];
                jointWeights0[i * 4 + 2] = weightBiass[2];
                jointWeights0[i * 4 + 3] = weightBiass[3];
                jointWeights1[i * 4] = weightBiass[4];
                jointWeights1[i * 4 + 1] = weightBiass[5];
                jointWeights1[i * 4 + 2] = weightBiass[6];
                jointWeights1[i * 4 + 3] = weightBiass[7];
                uvs[vertex.index * 2] = vertex.u;
                uvs[vertex.index * 2 + 1] = vertex.v;
            }
            //更新索引数据
            geometry.setIndices(new Uint16Array(indices));
            //更新顶点坐标与uv数据
            geometry.setVAData("a_position", new Float32Array(vertices), 3);
            geometry.setVAData("a_uv", new Float32Array(uvs), 2);
            geometry.createVertexNormals();
            //
            var tangents = feng3d.GeometryUtils.createVertexTangents(indices, vertices, uvs);
            geometry.setVAData("a_tangent", new Float32Array(tangents), 3);
            //更新关节索引与权重索引
            geometry.setVAData("a_jointindex0", new Float32Array(jointIndices0), 4);
            geometry.setVAData("a_jointweight0", new Float32Array(jointWeights0), 4);
            geometry.setVAData("a_jointindex1", new Float32Array(jointIndices1), 4);
            geometry.setVAData("a_jointweight1", new Float32Array(jointWeights1), 4);
            return geometry;
        };
        MD5Loader.prototype.createAnimator = function (md5AnimData) {
            var object = new feng3d.GameObject();
            var _clip = new feng3d.SkeletonClipNode();
            for (var i = 0; i < md5AnimData.numFrames; ++i)
                _clip.addFrame(this.translatePose(md5AnimData, md5AnimData.frame[i]), 1000 / md5AnimData.frameRate);
            if (this._animCompleted) {
                this._animCompleted(_clip);
            }
        };
        /**
         * 将一个关键帧数据转换为SkeletonPose
         * @param frameData 帧数据
         * @return 包含帧数据的SkeletonPose对象
         */
        MD5Loader.prototype.translatePose = function (md5AnimData, frameData) {
            var hierarchy;
            var pose;
            var base;
            var flags;
            var j;
            //偏移量
            var translate = new feng3d.Vector3D();
            //旋转四元素
            var orientation = new feng3d.Quaternion();
            var components = frameData.components;
            //骨骼pose数据
            var skelPose = new feng3d.SkeletonPose();
            //骨骼pose列表
            var jointPoses = skelPose.jointPoses;
            for (var i = 0; i < md5AnimData.numJoints; ++i) {
                //通过原始帧数据与层级数据计算出当前骨骼pose数据
                j = 0;
                //层级数据
                hierarchy = md5AnimData.hierarchy[i];
                //基础帧数据
                base = md5AnimData.baseframe[i];
                //层级标记
                flags = hierarchy.flags;
                translate.x = base.position[0];
                translate.y = base.position[1];
                translate.z = base.position[2];
                orientation.x = base.orientation[0];
                orientation.y = base.orientation[1];
                orientation.z = base.orientation[2];
                //调整位移与角度数据
                if (flags & 1)
                    translate.x = components[hierarchy.startIndex + (j++)];
                if (flags & 2)
                    translate.y = components[hierarchy.startIndex + (j++)];
                if (flags & 4)
                    translate.z = components[hierarchy.startIndex + (j++)];
                if (flags & 8)
                    orientation.x = components[hierarchy.startIndex + (j++)];
                if (flags & 16)
                    orientation.y = components[hierarchy.startIndex + (j++)];
                if (flags & 32)
                    orientation.z = components[hierarchy.startIndex + (j++)];
                //计算四元素w值
                var w = 1 - orientation.x * orientation.x - orientation.y * orientation.y - orientation.z * orientation.z;
                orientation.w = w < 0 ? 0 : -Math.sqrt(w);
                //创建关节pose数据
                pose = new feng3d.JointPose();
                pose.name = hierarchy.name;
                pose.parentIndex = hierarchy.parentIndex;
                pose.orientation.copyFrom(orientation);
                pose.translation.x = translate.x;
                pose.translation.y = translate.y;
                pose.translation.z = translate.z;
                pose.orientation.y = -pose.orientation.y;
                pose.orientation.z = -pose.orientation.z;
                pose.translation.x = -pose.translation.x;
                jointPoses[i] = pose;
            }
            return skelPose;
        };
        return MD5Loader;
    }(feng3d.Loader));
    feng3d.MD5Loader = MD5Loader;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 坐标系，三叉戟
     * @author feng 2017-02-06
     */
    var Trident = (function (_super) {
        __extends(Trident, _super);
        function Trident(length) {
            if (length === void 0) { length = 100; }
            var _this = _super.call(this) || this;
            _this.buildTrident(Math.abs((length == 0) ? 10 : length));
            return _this;
        }
        Trident.prototype.buildTrident = function (length) {
            this._xLine = new feng3d.GameObject();
            var segmentGeometry = new feng3d.SegmentGeometry();
            segmentGeometry.addSegment(new feng3d.Segment(new feng3d.Vector3D(), new feng3d.Vector3D(length, 0, 0), 0xff0000, 0xff0000));
            this._xLine.addComponent(feng3d.MeshFilter).mesh = segmentGeometry;
            this._xLine.addComponent(feng3d.MeshRenderer).material = new feng3d.SegmentMaterial();
            this.transform.addChild(this._xLine.transform);
            //
            this._yLine = new feng3d.GameObject();
            var segmentGeometry = new feng3d.SegmentGeometry();
            segmentGeometry.addSegment(new feng3d.Segment(new feng3d.Vector3D(), new feng3d.Vector3D(0, length, 0), 0x00ff00, 0x00ff00));
            this._yLine.addComponent(feng3d.MeshFilter).mesh = segmentGeometry;
            this._yLine.addComponent(feng3d.MeshRenderer).material = new feng3d.SegmentMaterial();
            this.transform.addChild(this._yLine.transform);
            //
            this._zLine = new feng3d.GameObject();
            var segmentGeometry = new feng3d.SegmentGeometry();
            segmentGeometry.addSegment(new feng3d.Segment(new feng3d.Vector3D(), new feng3d.Vector3D(0, 0, length), 0x0000ff, 0x0000ff));
            this._zLine.addComponent(feng3d.MeshFilter).mesh = segmentGeometry;
            this._zLine.addComponent(feng3d.MeshRenderer).material = new feng3d.SegmentMaterial();
            this.transform.addChild(this._zLine.transform);
            //
            this._xArrow = new feng3d.GameObject();
            this._xArrow.transform.x = length;
            this._xArrow.transform.rotationZ = -90;
            this._xArrow.addComponent(feng3d.MeshFilter).mesh = new feng3d.ConeGeometry(5, 18);
            ;
            var material = this._xArrow.addComponent(feng3d.MeshRenderer).material = new feng3d.ColorMaterial();
            material.color = new feng3d.Color(1, 0, 0);
            this.transform.addChild(this._xArrow.transform);
            //
            this._yArrow = new feng3d.GameObject();
            this._yArrow.transform.y = length;
            this._yArrow.addComponent(feng3d.MeshFilter).mesh = new feng3d.ConeGeometry(5, 18);
            var material = this._yArrow.addComponent(feng3d.MeshRenderer).material = new feng3d.ColorMaterial();
            material.color = new feng3d.Color(0, 1, 0);
            this.transform.addChild(this._yArrow.transform);
            //
            this._zArrow = new feng3d.GameObject();
            this._zArrow.transform.z = length;
            this._zArrow.transform.rotationX = 90;
            this._zArrow.addComponent(feng3d.MeshFilter).mesh = new feng3d.ConeGeometry(5, 18);
            var material = this._zArrow.addComponent(feng3d.MeshRenderer).material = new feng3d.ColorMaterial();
            material.color = new feng3d.Color(0, 0, 1);
            this.transform.addChild(this._zArrow.transform);
        };
        return Trident;
    }(feng3d.GameObject));
    feng3d.Trident = Trident;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 摄像机3D对象
     * @author feng 2017-02-06
     */
    var CameraObject3D = (function (_super) {
        __extends(CameraObject3D, _super);
        function CameraObject3D(name) {
            if (name === void 0) { name = "camera"; }
            var _this = _super.call(this, name) || this;
            _this.camera = _this.addComponent(feng3d.Camera);
            return _this;
        }
        return CameraObject3D;
    }(feng3d.GameObject));
    feng3d.CameraObject3D = CameraObject3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var GameObjectFactory = (function () {
        function GameObjectFactory() {
        }
        GameObjectFactory.createCube = function (name) {
            if (name === void 0) { name = "cube"; }
            var gameobject = new feng3d.GameObject(name);
            var model = gameobject.addComponent(feng3d.MeshRenderer);
            gameobject.addComponent(feng3d.MeshFilter).mesh = new feng3d.CubeGeometry();
            model.material = new feng3d.StandardMaterial();
            return gameobject;
        };
        GameObjectFactory.createPlane = function (name) {
            if (name === void 0) { name = "plane"; }
            var gameobject = new feng3d.GameObject(name);
            var model = gameobject.addComponent(feng3d.MeshRenderer);
            gameobject.addComponent(feng3d.MeshFilter).mesh = new feng3d.PlaneGeometry();
            model.material = new feng3d.StandardMaterial();
            return gameobject;
        };
        GameObjectFactory.createCylinder = function (name) {
            if (name === void 0) { name = "cylinder"; }
            var gameobject = new feng3d.GameObject(name);
            var model = gameobject.addComponent(feng3d.MeshRenderer);
            gameobject.addComponent(feng3d.MeshFilter).mesh = new feng3d.CylinderGeometry();
            model.material = new feng3d.StandardMaterial();
            return gameobject;
        };
        GameObjectFactory.createSphere = function (name) {
            if (name === void 0) { name = "sphere"; }
            var gameobject = new feng3d.GameObject(name);
            var model = gameobject.addComponent(feng3d.MeshRenderer);
            gameobject.addComponent(feng3d.MeshFilter).mesh = new feng3d.SphereGeometry();
            model.material = new feng3d.StandardMaterial();
            return gameobject;
        };
        GameObjectFactory.createCapsule = function (name) {
            if (name === void 0) { name = "capsule"; }
            var gameobject = new feng3d.GameObject(name);
            var model = gameobject.addComponent(feng3d.MeshRenderer);
            gameobject.addComponent(feng3d.MeshFilter).mesh = new feng3d.CapsuleGeometry();
            model.material = new feng3d.StandardMaterial();
            return gameobject;
        };
        return GameObjectFactory;
    }());
    feng3d.GameObjectFactory = GameObjectFactory;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 鼠标事件管理
     * @author feng 2014-4-29
     */
    var Mouse3DManager = (function () {
        function Mouse3DManager() {
            this.viewRect = new feng3d.Rectangle(0, 0, 100, 100);
            this.mouseX = 0;
            this.mouseY = 0;
            this.mouseEventTypes = [];
            /** 射线采集器(采集射线穿过场景中物体的列表) */
            this._mousePicker = new feng3d.RaycastPicker(false);
            this._catchMouseMove = false;
            this.mouseRenderer = new feng3d.MouseRenderer();
            //
            mouse3DEventMap[feng3d.inputType.CLICK] = Mouse3DEvent.CLICK;
            mouse3DEventMap[feng3d.inputType.DOUBLE_CLICK] = Mouse3DEvent.DOUBLE_CLICK;
            mouse3DEventMap[feng3d.inputType.MOUSE_DOWN] = Mouse3DEvent.MOUSE_DOWN;
            mouse3DEventMap[feng3d.inputType.MOUSE_MOVE] = Mouse3DEvent.MOUSE_MOVE;
            mouse3DEventMap[feng3d.inputType.MOUSE_UP] = Mouse3DEvent.MOUSE_UP;
            //
            feng3d.input.addEventListener(feng3d.inputType.CLICK, this.onMouseEvent, this);
            feng3d.input.addEventListener(feng3d.inputType.DOUBLE_CLICK, this.onMouseEvent, this);
            feng3d.input.addEventListener(feng3d.inputType.MOUSE_DOWN, this.onMouseEvent, this);
            feng3d.input.addEventListener(feng3d.inputType.MOUSE_UP, this.onMouseEvent, this);
        }
        Object.defineProperty(Mouse3DManager.prototype, "catchMouseMove", {
            /**
             * 是否捕捉鼠标移动，默认false。
             */
            get: function () {
                return this._catchMouseMove;
            },
            set: function (value) {
                if (this._catchMouseMove == value)
                    return;
                if (this._catchMouseMove) {
                    feng3d.input.removeEventListener(feng3d.inputType.MOUSE_MOVE, this.onMouseEvent, this);
                }
                this._catchMouseMove = value;
                if (this._catchMouseMove) {
                    feng3d.input.addEventListener(feng3d.inputType.MOUSE_MOVE, this.onMouseEvent, this);
                }
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 监听鼠标事件收集事件类型
         */
        Mouse3DManager.prototype.onMouseEvent = function (event) {
            if (this.mouseEventTypes.indexOf(event.type) == -1)
                this.mouseEventTypes.push(event.type);
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        };
        /**
         * 渲染
         */
        Mouse3DManager.prototype.draw = function (renderContext) {
            if (!this.viewRect.contains(this.mouseX, this.mouseY))
                return;
            if (this.mouseEventTypes.length == 0)
                return;
            var mouseCollisionEntitys = this.getMouseCheckObjects(renderContext);
            if (mouseCollisionEntitys.length == 0)
                return;
            this.pick(renderContext);
            // this.glPick(renderContext);
        };
        Mouse3DManager.prototype.pick = function (renderContext) {
            var mouseCollisionEntitys = this.getMouseCheckObjects(renderContext);
            var mouseRay3D = renderContext.view3D.getMouseRay3D();
            //计算得到鼠标射线相交的物体
            var _collidingObject = this._mousePicker.getViewCollision(mouseRay3D, mouseCollisionEntitys);
            var object3D = _collidingObject && _collidingObject.firstEntity;
            this.setSelectedObject3D(object3D);
        };
        Mouse3DManager.prototype.glPick = function (renderContext) {
            var gl = renderContext.gl;
            var offsetX = -(this.mouseX - this.viewRect.x);
            var offsetY = -(this.viewRect.height - (this.mouseY - this.viewRect.y)); //y轴与window中坐标反向，所以需要 h = (maxHeight - h)
            gl.clearColor(0, 0, 0, 0);
            gl.clearDepth(1);
            gl.clear(feng3d.GL.COLOR_BUFFER_BIT | feng3d.GL.DEPTH_BUFFER_BIT);
            gl.viewport(offsetX, offsetY, this.viewRect.width, this.viewRect.height);
            this.mouseRenderer.draw(renderContext);
            var object3D = this.mouseRenderer.selectedObject3D;
            this.setSelectedObject3D(object3D);
        };
        Mouse3DManager.prototype.getMouseCheckObjects = function (renderContext) {
            var scene3d = renderContext.scene3d;
            var checkList = scene3d.getChildren();
            var results = [];
            var i = 0;
            while (i < checkList.length) {
                var checkObject = checkList[i++];
                if (checkObject.mouseEnabled && checkObject.getComponents(feng3d.Geometry)) {
                    results.push(checkObject.gameObject);
                }
                if (checkObject.mouseChildren) {
                    checkList = checkList.concat(checkObject.getChildren());
                }
            }
            return results;
        };
        /**
         * 设置选中对象
         */
        Mouse3DManager.prototype.setSelectedObject3D = function (value) {
            var _this = this;
            if (this.selectedObject3D != value) {
                if (this.selectedObject3D)
                    this.selectedObject3D.dispatchEvent(new Mouse3DEvent(Mouse3DEvent.MOUSE_OUT, null, true));
                if (value)
                    value.dispatchEvent(new Mouse3DEvent(Mouse3DEvent.MOUSE_OVER, null, true));
            }
            this.selectedObject3D = value;
            if (this.selectedObject3D) {
                this.mouseEventTypes.forEach(function (element) {
                    switch (element) {
                        case feng3d.inputType.MOUSE_DOWN:
                            if (_this.preMouseDownObject3D != _this.selectedObject3D) {
                                _this.Object3DClickNum = 0;
                                _this.preMouseDownObject3D = _this.selectedObject3D;
                            }
                            _this.selectedObject3D.dispatchEvent(new Mouse3DEvent(mouse3DEventMap[element], null, true));
                            break;
                        case feng3d.inputType.MOUSE_UP:
                            if (_this.selectedObject3D == _this.preMouseDownObject3D) {
                                _this.Object3DClickNum++;
                            }
                            else {
                                _this.Object3DClickNum = 0;
                                _this.preMouseDownObject3D = null;
                            }
                            _this.selectedObject3D.dispatchEvent(new Mouse3DEvent(mouse3DEventMap[element], null, true));
                            break;
                        case feng3d.inputType.MOUSE_MOVE:
                            _this.selectedObject3D.dispatchEvent(new Mouse3DEvent(mouse3DEventMap[element], null, true));
                            break;
                        case feng3d.inputType.CLICK:
                            if (_this.Object3DClickNum > 0)
                                _this.selectedObject3D.dispatchEvent(new Mouse3DEvent(mouse3DEventMap[element], null, true));
                            break;
                        case feng3d.inputType.DOUBLE_CLICK:
                            if (_this.Object3DClickNum > 1)
                                _this.selectedObject3D.dispatchEvent(new Mouse3DEvent(mouse3DEventMap[element], null, true));
                            break;
                    }
                });
            }
            else {
                this.Object3DClickNum = 0;
                this.preMouseDownObject3D = null;
            }
            this.mouseEventTypes.length = 0;
        };
        return Mouse3DManager;
    }());
    feng3d.Mouse3DManager = Mouse3DManager;
    /**
     * 3D鼠标事件
     */
    var Mouse3DEvent = (function (_super) {
        __extends(Mouse3DEvent, _super);
        function Mouse3DEvent() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return Mouse3DEvent;
    }(feng3d.Event));
    /** 鼠标单击 */
    Mouse3DEvent.CLICK = "click3D";
    /** 鼠标按下 */
    Mouse3DEvent.MOUSE_DOWN = "mousedown3d";
    /** 鼠标移动 */
    Mouse3DEvent.MOUSE_MOVE = "mousemove3d";
    /** 鼠标移出 */
    Mouse3DEvent.MOUSE_OUT = "mouseout3d";
    /** 鼠标移入 */
    Mouse3DEvent.MOUSE_OVER = "mouseover3d";
    /** 鼠标弹起 */
    Mouse3DEvent.MOUSE_UP = "mouseup3d";
    feng3d.Mouse3DEvent = Mouse3DEvent;
    /**
     * 鼠标事件与3D鼠标事件类型映射
     */
    var mouse3DEventMap = {};
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    feng3d.shaderFileMap = {
        "shaders/color.fragment.glsl": "\r\n\r\nprecision mediump float;\r\n\r\nuniform vec4 u_diffuseInput;\r\n\r\n\r\n\r\nvoid main(void) {\r\n   \r\n    gl_FragColor = u_diffuseInput;\r\n}\r\n",
        "shaders/color.vertex.glsl": "\r\n\r\nattribute vec3 a_position;\r\n\r\nuniform mat4 u_modelMatrix;\r\nuniform mat4 u_viewProjection;\r\n\r\nvoid main(void) {\r\n\r\n    vec4 globalPosition = u_modelMatrix * vec4(a_position, 1.0);\r\n    gl_Position = u_viewProjection * globalPosition;\r\n}",
        "shaders/modules/envmap.fragment.glsl": "uniform samplerCube s_envMap;\r\nuniform float u_reflectivity;\r\n\r\nvec4 envmapMethod(vec4 finalColor)\r\n{\r\n    vec3 cameraToVertex = normalize( v_globalPosition - u_cameraMatrix[3].xyz );\r\n    vec3 reflectVec = reflect( cameraToVertex, v_normal );\r\n    vec4 envColor = textureCube( s_envMap, reflectVec );\r\n    finalColor.xyz *= envColor.xyz * u_reflectivity;\r\n    return finalColor;\r\n}",
        "shaders/modules/fog.fragment.glsl": "#define FOGMODE_NONE    0.\r\n#define FOGMODE_EXP     1.\r\n#define FOGMODE_EXP2    2.\r\n#define FOGMODE_LINEAR  3.\r\n#define E 2.71828\r\n\r\nuniform float u_fogMode;\r\nuniform float u_fogMinDistance;\r\nuniform float u_fogMaxDistance;\r\nuniform float u_fogDensity;\r\nuniform vec3 u_fogColor;\r\n\r\nfloat CalcFogFactor(float fogDistance)\r\n{\r\n\tfloat fogCoeff = 1.0;\r\n\tif (FOGMODE_LINEAR == u_fogMode)\r\n\t{\r\n\t\tfogCoeff = (u_fogMaxDistance - fogDistance) / (u_fogMaxDistance - u_fogMinDistance);\r\n\t}\r\n\telse if (FOGMODE_EXP == u_fogMode)\r\n\t{\r\n\t\tfogCoeff = 1.0 / pow(E, fogDistance * u_fogDensity);\r\n\t}\r\n\telse if (FOGMODE_EXP2 == u_fogMode)\r\n\t{\r\n\t\tfogCoeff = 1.0 / pow(E, fogDistance * fogDistance * u_fogDensity * u_fogDensity);\r\n\t}\r\n\r\n\treturn clamp(fogCoeff, 0.0, 1.0);\r\n}\r\n\r\nvec4 fogMethod(vec4 color)\r\n{\r\n    vec3 fogDistance = u_cameraMatrix[3].xyz - v_globalPosition.xyz;\r\n\tfloat fog = CalcFogFactor(length(fogDistance));\r\n\tcolor.rgb = fog * color.rgb + (1.0 - fog) * u_fogColor;\r\n    return color;\r\n}",
        "shaders/modules/particle.fragment.glsl": "#ifdef D_a_particle_color\r\n    varying vec4 v_particle_color;\r\n#endif\r\n\r\nvec4 particleAnimation(vec4 color) {\r\n\r\n    #ifdef D_a_particle_color\r\n        color = color * v_particle_color;\r\n    #endif\r\n    return color;\r\n}",
        "shaders/modules/particle.vertex.glsl": "//根据是否提供(a_particle_position)数据自动定义 #define D_(a_particle_position)\r\n\r\n#ifdef D_a_particle_birthTime\r\n    attribute float a_particle_birthTime;\r\n#endif\r\n\r\n#ifdef D_a_particle_position\r\n    attribute vec3 a_particle_position;\r\n#endif\r\n\r\n#ifdef D_a_particle_velocity\r\n    attribute vec3 a_particle_velocity;\r\n#endif\r\n\r\n#ifdef D_a_particle_lifetime\r\n    attribute float a_particle_lifetime;\r\n#endif\r\n\r\n#ifdef D_a_particle_color\r\n    attribute vec4 a_particle_color;\r\n    varying vec4 v_particle_color;\r\n#endif\r\n\r\nuniform float u_particleTime;\r\n\r\n#ifdef D_u_particle_acceleration\r\n    uniform vec3 u_particle_acceleration;\r\n#endif\r\n\r\n#ifdef D_u_particle_billboardMatrix\r\n    uniform mat4 u_particle_billboardMatrix;\r\n#endif\r\n\r\nvec4 particleAnimation(vec4 position) {\r\n\r\n    #ifdef D_a_particle_birthTime\r\n    float pTime = u_particleTime - a_particle_birthTime;\r\n    if(pTime > 0.0){\r\n\r\n        #ifdef D_a_particle_lifetime\r\n            pTime = mod(pTime,a_particle_lifetime);\r\n        #endif\r\n\r\n        vec3 pVelocity = vec3(0.0,0.0,0.0);\r\n\r\n        #ifdef D_u_particle_billboardMatrix\r\n            position = u_particle_billboardMatrix * position;\r\n        #endif\r\n\r\n        #ifdef D_a_particle_position\r\n            position.xyz = position.xyz + a_particle_position;\r\n        #endif\r\n\r\n        #ifdef D_a_particle_velocity\r\n            pVelocity = pVelocity + a_particle_velocity;\r\n        #endif\r\n\r\n        #ifdef D_u_particle_acceleration\r\n            pVelocity = pVelocity + u_particle_acceleration * pTime;\r\n        #endif\r\n        \r\n        #ifdef D_a_particle_color\r\n            v_particle_color = a_particle_color;\r\n        #endif\r\n\r\n        position.xyz = position.xyz + pVelocity * pTime;\r\n    }\r\n    #endif\r\n    \r\n    return position;\r\n}",
        "shaders/modules/pointLightShading.declare.glsl.bak": "//参考资料\r\n//http://blog.csdn.net/leonwei/article/details/44539217\r\n//https://github.com/mcleary/pbr/blob/master/shaders/phong_pbr_frag.glsl\r\n\r\n#if NUM_POINTLIGHT > 0\r\n    //点光源位置列表\r\n    uniform vec3 u_pointLightPositions[NUM_POINTLIGHT];\r\n    //点光源漫反射颜色\r\n    uniform vec3 u_pointLightColors[NUM_POINTLIGHT];\r\n    //点光源镜面反射颜色\r\n    uniform float u_pointLightIntensitys[NUM_POINTLIGHT];\r\n    //反射率\r\n    uniform float u_reflectance;\r\n    //粗糙度\r\n    uniform float u_roughness;\r\n    //金属度\r\n    uniform float u_metalic;\r\n\r\n    vec3 fresnelSchlick(float VdotH,vec3 reflectance){\r\n\r\n        return reflectance + (1.0 - reflectance) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);\r\n        // return reflectance;\r\n    }\r\n\r\n    float normalDistributionGGX(float NdotH,float alphaG){\r\n\r\n        float alphaG2 = alphaG * alphaG;\r\n        float d = NdotH * NdotH * (alphaG2 - 1.0) + 1.0; \r\n        return alphaG2 / (3.1415926 * d * d);\r\n    }\r\n\r\n    float smithVisibility(float dot,float alphaG){\r\n\r\n        float tanSquared = (1.0 - dot * dot) / (dot * dot);\r\n        return 2.0 / (1.0 + sqrt(1.0 + alphaG * alphaG * tanSquared));\r\n    }\r\n\r\n    vec3 calculateLight(vec3 normal,vec3 viewDir,vec3 lightDir,vec3 lightColor,float lightIntensity,vec3 baseColor,vec3 reflectance,float roughness){\r\n\r\n        //BRDF = D(h) * F(1, h) * V(l, v, h) / (4 * dot(n, l) * dot(n, v));\r\n\r\n        vec3 halfVec = normalize(lightDir + viewDir);\r\n        float NdotL = clamp(dot(normal,lightDir),0.0,1.0);\r\n        float NdotH = clamp(dot(normal,halfVec),0.0,1.0);\r\n        float NdotV = max(abs(dot(normal,viewDir)),0.000001);\r\n        float VdotH = clamp(dot(viewDir, halfVec),0.0,1.0);\r\n        \r\n        float alphaG = max(roughness * roughness,0.0005);\r\n\r\n        //F(v,h)\r\n        vec3 F = fresnelSchlick(VdotH, reflectance);\r\n\r\n        //D(h)\r\n        float D = normalDistributionGGX(NdotH,alphaG);\r\n\r\n        //V(l,h)\r\n        float V = smithVisibility(NdotL,alphaG) * smithVisibility(NdotV,alphaG) / (4.0 * NdotL * NdotV);\r\n\r\n        vec3 specular = max(0.0, D * V) * 3.1415926 * F;\r\n        \r\n        return (baseColor + specular) * NdotL * lightColor * lightIntensity;\r\n    }\r\n\r\n    //渲染点光源\r\n    vec3 pointLightShading(vec3 normal,vec3 baseColor){\r\n\r\n        float reflectance = u_reflectance;\r\n        float roughness = u_roughness;\r\n        float metalic = u_metalic;\r\n\r\n        reflectance = mix(0.0,0.5,reflectance);\r\n        vec3 realBaseColor = (1.0 - metalic) * baseColor;\r\n        vec3 realReflectance = mix(vec3(reflectance),baseColor,metalic);\r\n\r\n        vec3 totalLightColor = vec3(0.0,0.0,0.0);\r\n        for(int i = 0;i<NUM_POINTLIGHT;i++){\r\n            //光照方向\r\n            vec3 lightDir = normalize(u_pointLightPositions[i] - v_globalPosition);\r\n            //视线方向\r\n            vec3 viewDir = normalize(u_cameraMatrix[3].xyz - v_globalPosition);\r\n            //灯光颜色\r\n            vec3 lightColor = u_pointLightColors[i];\r\n            //灯光强度\r\n            float lightIntensity = u_pointLightIntensitys[i];\r\n\r\n            totalLightColor = totalLightColor + calculateLight(normal,viewDir,lightDir,lightColor,lightIntensity,realBaseColor,realReflectance,roughness);\r\n        }\r\n        \r\n        return totalLightColor;\r\n    }\r\n#endif",
        "shaders/modules/pointLightShading.fragment.glsl": "#if NUM_POINTLIGHT > 0\r\n    //点光源位置数组\r\n    uniform vec3 u_pointLightPositions[NUM_POINTLIGHT];\r\n    //点光源颜色数组\r\n    uniform vec3 u_pointLightColors[NUM_POINTLIGHT];\r\n    //点光源光照强度数组\r\n    uniform float u_pointLightIntensitys[NUM_POINTLIGHT];\r\n    //点光源光照范围数组\r\n    uniform float u_pointLightRanges[NUM_POINTLIGHT];\r\n#endif\r\n#if NUM_DIRECTIONALLIGHT > 0\r\n    //方向光源方向数组\r\n    uniform vec3 u_directionalLightDirections[NUM_DIRECTIONALLIGHT];\r\n    //方向光源颜色数组\r\n    uniform vec3 u_directionalLightColors[NUM_DIRECTIONALLIGHT];\r\n    //方向光源光照强度数组\r\n    uniform float u_directionalLightIntensitys[NUM_DIRECTIONALLIGHT];\r\n#endif\r\n\r\n//计算光照漫反射系数\r\nvec3 calculateLightDiffuse(vec3 normal,vec3 lightDir,vec3 lightColor,float lightIntensity){\r\n\r\n    vec3 diffuse = lightColor * lightIntensity * clamp(dot(normal,lightDir),0.0,1.0);\r\n    return diffuse;\r\n}\r\n\r\n//计算光照镜面反射系数\r\nvec3 calculateLightSpecular(vec3 normal,vec3 lightDir,vec3 lightColor,float lightIntensity,vec3 viewDir,float glossiness){\r\n\r\n    vec3 halfVec = normalize(lightDir + viewDir);\r\n    float specComp = clamp(dot(normal,halfVec),0.0,1.0);\r\n    specComp = pow(specComp, max(1., glossiness));\r\n\r\n    vec3 diffuse = lightColor * lightIntensity * specComp;\r\n    return diffuse;\r\n}\r\n\r\n//根据距离计算衰减\r\nfloat computeDistanceLightFalloff(float lightDistance, float range)\r\n{\r\n    #ifdef USEPHYSICALLIGHTFALLOFF\r\n        float lightDistanceFalloff = 1.0 / ((lightDistance * lightDistance + 0.0001));\r\n    #else\r\n        float lightDistanceFalloff = max(0., 1.0 - lightDistance / range);\r\n    #endif\r\n    \r\n    return lightDistanceFalloff;\r\n}\r\n\r\n//渲染点光源\r\nvec3 pointLightShading(vec3 normal,vec3 diffuseColor,vec3 specularColor,vec3 ambientColor,float glossiness){\r\n\r\n    //视线方向\r\n    vec3 viewDir = normalize(u_cameraMatrix[3].xyz - v_globalPosition);\r\n\r\n    vec3 totalDiffuseLightColor = vec3(0.0,0.0,0.0);\r\n    vec3 totalSpecularLightColor = vec3(0.0,0.0,0.0);\r\n    #if NUM_POINTLIGHT > 0\r\n        for(int i = 0;i<NUM_POINTLIGHT;i++){\r\n            //\r\n            vec3 lightOffset = u_pointLightPositions[i] - v_globalPosition;\r\n            float lightDistance = length(lightOffset);\r\n            //光照方向\r\n            vec3 lightDir = normalize(lightOffset);\r\n            //灯光颜色\r\n            vec3 lightColor = u_pointLightColors[i];\r\n            //灯光强度\r\n            float lightIntensity = u_pointLightIntensitys[i];\r\n            //光照范围\r\n            float range = u_pointLightRanges[i];\r\n            float attenuation = computeDistanceLightFalloff(lightDistance,range);\r\n            lightIntensity = lightIntensity * attenuation;\r\n            //\r\n            totalDiffuseLightColor = totalDiffuseLightColor +  calculateLightDiffuse(normal,lightDir,lightColor,lightIntensity);\r\n            totalSpecularLightColor = totalSpecularLightColor +  calculateLightSpecular(normal,lightDir,lightColor,lightIntensity,viewDir,glossiness);\r\n        }\r\n    #endif\r\n    #if NUM_DIRECTIONALLIGHT > 0\r\n        for(int i = 0;i<NUM_DIRECTIONALLIGHT;i++){\r\n            //光照方向\r\n            vec3 lightDir = normalize(-u_directionalLightDirections[i]);\r\n            //灯光颜色\r\n            vec3 lightColor = u_directionalLightColors[i];\r\n            //灯光强度\r\n            float lightIntensity = u_directionalLightIntensitys[i];\r\n            //\r\n            totalDiffuseLightColor = totalDiffuseLightColor +  calculateLightDiffuse(normal,lightDir,lightColor,lightIntensity);\r\n            totalSpecularLightColor = totalSpecularLightColor +  calculateLightSpecular(normal,lightDir,lightColor,lightIntensity,viewDir,glossiness);\r\n        }\r\n    #endif\r\n\r\n    vec3 resultColor = vec3(0.0,0.0,0.0);\r\n    resultColor = resultColor + totalDiffuseLightColor * diffuseColor;\r\n    resultColor = resultColor + totalSpecularLightColor * specularColor;\r\n    resultColor = resultColor + ambientColor * diffuseColor;\r\n    return resultColor;\r\n}",
        "shaders/modules/pointLightShading.main.glsl.bak": "#if NUM_POINTLIGHT > 0\r\n    // finalColor = finalColor * 0.5 +  pointLightShading(v_normal,u_baseColor) * 0.5;\r\n    finalColor.xyz = pointLightShading(v_normal,finalColor.xyz);\r\n#endif",
        "shaders/modules/skeleton.vertex.glsl": "attribute vec4 a_jointindex0;\r\nattribute vec4 a_jointweight0;\r\n\r\nattribute vec4 a_jointindex1;\r\nattribute vec4 a_jointweight1;\r\nuniform mat4 u_skeletonGlobalMatriices[NUM_SKELETONJOINT];\r\n\r\nvec4 skeletonAnimation(vec4 position) {\r\n\r\n    vec4 totalPosition = vec4(0.0,0.0,0.0,1.0);\r\n    for(int i = 0; i < 4; i++){\r\n        totalPosition += u_skeletonGlobalMatriices[int(a_jointindex0[i])] * position * a_jointweight0[i];\r\n    }\r\n    for(int i = 0; i < 4; i++){\r\n        totalPosition += u_skeletonGlobalMatriices[int(a_jointindex1[i])] * position * a_jointweight1[i];\r\n    }\r\n    position.xyz = totalPosition.xyz;\r\n    return position;\r\n}",
        "shaders/modules/terrain.fragment.glsl": "#ifdef USE_TERRAIN_MERGE\r\n    #include<modules/terrainMerge.fragment>\r\n#else\r\n    #include<modules/terrainDefault.fragment>\r\n#endif",
        "shaders/modules/terrainDefault.fragment.glsl": "uniform sampler2D s_splatTexture1;\r\nuniform sampler2D s_splatTexture2;\r\nuniform sampler2D s_splatTexture3;\r\n\r\nuniform sampler2D s_blendTexture;\r\nuniform vec4 u_splatRepeats;\r\n\r\nvec4 terrainMethod(vec4 diffuseColor,vec2 v_uv) {\r\n\r\n    vec4 blend = texture2D(s_blendTexture,v_uv);\r\n\r\n    vec2 t_uv = v_uv.xy * u_splatRepeats.y;\r\n    vec4 tColor = texture2D(s_splatTexture1,t_uv);\r\n    diffuseColor = (tColor - diffuseColor) * blend.x + diffuseColor;\r\n\r\n    t_uv = v_uv.xy * u_splatRepeats.z;\r\n    tColor = texture2D(s_splatTexture2,t_uv);\r\n    diffuseColor = (tColor - diffuseColor) * blend.y + diffuseColor;\r\n\r\n    t_uv = v_uv.xy * u_splatRepeats.w;\r\n    tColor = texture2D(s_splatTexture3,t_uv);\r\n    diffuseColor = (tColor - diffuseColor) * blend.z + diffuseColor;\r\n    return diffuseColor;\r\n}",
        "shaders/modules/terrainMerge.fragment.1.glsl": "//代码实现lod，使用默认线性插值\r\n#extension GL_EXT_shader_texture_lod : enable\r\n#extension GL_OES_standard_derivatives : enable\r\n\r\n#define LOD_LINEAR\r\n\r\nuniform sampler2D s_splatMergeTexture;\r\nuniform sampler2D s_blendTexture;\r\nuniform vec4 u_splatRepeats;\r\n\r\nvec2 imageSize =    vec2(2048.0,1024.0);\r\nvec4 offset[3];\r\nvec2 tileSize = vec2(512.0,512.0);\r\n// float maxLod = 7.0;\r\nfloat maxLod = 5.0;\r\n\r\nvec4 terrainTexture2DLod(sampler2D s_splatMergeTexture,vec2 uv,float lod,vec4 offset){\r\n\r\n    //计算不同lod像素缩放以及起始坐标\r\n    vec4 lodvec = vec4(0.5,1.0,0.0,0.0);\r\n    lodvec.x = lodvec.x * pow(0.5,lod);\r\n    lodvec.y = lodvec.x * 2.0;\r\n    lodvec.z = 1.0 - lodvec.y;\r\n\r\n    //lod块尺寸\r\n    vec2 lodSize = imageSize * lodvec.xy;\r\n    vec2 lodPixelOffset = 1.0 / lodSize;\r\n\r\n    //扩展边缘一像素\r\n    offset.xy = offset.xy - lodPixelOffset * 2.0;\r\n    offset.zw = offset.zw + lodPixelOffset;\r\n    //lod块中uv\r\n    vec2 t_uv = uv * offset.xy + offset.zw;\r\n    t_uv = t_uv * lodvec.xy;\r\n    //取整像素\r\n    t_uv = (t_uv * imageSize + vec2(-0.0,0.0)) / imageSize;\r\n    // t_uv = (t_uv * imageSize + 0.5) / imageSize;\r\n    // t_uv = floor(t_uv * imageSize - 1.0) / imageSize;\r\n    // t_uv = ceil(t_uv * imageSize + 1.0) / imageSize;\r\n    //添加lod起始坐标\r\n    t_uv = t_uv * (1.0 - 1.0 / imageSize);\r\n    t_uv = t_uv + lodvec.zw;\r\n    vec4 tColor = texture2D(s_splatMergeTexture,t_uv);\r\n\r\n    return tColor;\r\n\r\n    // return vec4(mixFactor.x,mixFactor.y,0.0,1.0);\r\n    // return vec4(mixFactor.x + 0.5,mixFactor.y + 0.5,0.0,1.0);\r\n}\r\n\r\n//参考 http://blog.csdn.net/cgwbr/article/details/6620318\r\n//计算MipMap层函数：\r\nfloat mipmapLevel(vec2 uv, vec2 textureSize)\r\n{\r\n    vec2 dx = dFdx(uv * textureSize.x);\r\n    vec2 dy = dFdy(uv * textureSize.y);\r\n    float d = max(dot(dx, dx), dot(dy, dy));  \r\n    return 0.5 * log2(d);\r\n}\r\n\r\nvec4 terrainTexture2D(sampler2D s_splatMergeTexture,vec2 t_uv,float lod,vec4 offset){\r\n \r\n    #ifdef LOD_LINEAR\r\n        vec4 tColor = mix(terrainTexture2DLod(s_splatMergeTexture,t_uv,floor(lod),offset),terrainTexture2DLod(s_splatMergeTexture,t_uv,ceil(lod),offset),fract(lod));\r\n    #else\r\n        vec4 tColor = terrainTexture2DLod(s_splatMergeTexture,t_uv,floor(lod),offset);\r\n    #endif\r\n\r\n    return tColor;\r\n}\r\n\r\nvec4 terrainMethod(vec4 diffuseColor,vec2 v_uv) {\r\n    \r\n    offset[0] = vec4(0.5,0.5,0.0,0.0);\r\n    offset[1] = vec4(0.5,0.5,0.5,0.0);\r\n    offset[2] = vec4(0.5,0.5,0.0,0.5);\r\n    \r\n    vec4 blend = texture2D(s_blendTexture,v_uv);\r\n    for(int i = 0; i < 3; i++)\r\n    {\r\n        vec2 t_uv = v_uv.xy * u_splatRepeats[i];\r\n        float lod = mipmapLevel(t_uv,tileSize);\r\n        lod = clamp(lod,0.0,maxLod);\r\n        // lod = 5.0;\r\n        t_uv = fract(t_uv);\r\n        vec4 tColor = terrainTexture2D(s_splatMergeTexture,t_uv,lod,offset[i]);\r\n        diffuseColor = (tColor - diffuseColor) * blend[i] + diffuseColor;\r\n    }\r\n\r\n    // diffuseColor.xyz = vec3(1.0,0.0,0.0);\r\n    // diffuseColor.xyz = vec3(floor(lod)/7.0,0.0,0.0);\r\n    return diffuseColor;\r\n}",
        "shaders/modules/terrainMerge.fragment.glsl": "//代码实现lod以及线性插值 feng\r\n#extension GL_EXT_shader_texture_lod : enable\r\n#extension GL_OES_standard_derivatives : enable\r\n\r\n#define LOD_LINEAR\r\n\r\nuniform sampler2D s_splatMergeTexture;\r\nuniform sampler2D s_blendTexture;\r\nuniform vec4 u_splatRepeats;\r\n\r\nuniform vec2 u_imageSize;\r\nuniform vec4 u_tileOffset[3];\r\nuniform vec4 u_lod0vec;\r\nuniform vec2 u_tileSize;\r\nuniform float u_maxLod;\r\nuniform float u_scaleByDepth;\r\nuniform float u_uvPositionScale;\r\n\r\n\r\nvec4 terrainTexture2DLod(sampler2D s_splatMergeTexture,vec2 uv,float lod,vec4 offset){\r\n\r\n    //计算不同lod像素缩放以及起始坐标\r\n    vec4 lodvec = u_lod0vec;\r\n    lodvec.x = lodvec.x * pow(0.5,lod);\r\n    lodvec.y = lodvec.x * 2.0;\r\n    lodvec.z = 1.0 - lodvec.y;\r\n\r\n    //lod块尺寸\r\n    vec2 lodSize = u_imageSize * lodvec.xy;\r\n    vec2 lodPixelOffset = 1.0 / lodSize * 2.0;\r\n\r\n    // uv = uv - 1.0 / lodPixelOffset;\r\n    vec2 mixFactor = mod(uv, lodPixelOffset) / lodPixelOffset;\r\n\r\n    //lod块中像素索引\r\n    vec2 t_uv = fract(uv + lodPixelOffset * vec2(0.0, 0.0));\r\n    t_uv = t_uv * offset.xy + offset.zw;\r\n    //添加lod起始坐标\r\n    t_uv = t_uv * lodvec.xy + lodvec.zw;\r\n    //取整像素\r\n    t_uv = floor(t_uv * u_imageSize) / u_imageSize;\r\n    vec4 tColor00 = texture2D(s_splatMergeTexture,t_uv);\r\n\r\n    t_uv = fract(uv + lodPixelOffset * vec2(1.0, 0.0));\r\n    t_uv = t_uv * offset.xy + offset.zw;\r\n    //添加lod起始坐标\r\n    t_uv = t_uv * lodvec.xy + lodvec.zw;\r\n    //取整像素\r\n    t_uv = floor(t_uv * u_imageSize) / u_imageSize;\r\n    vec4 tColor10 = texture2D(s_splatMergeTexture,t_uv);\r\n\r\n    t_uv = fract(uv + lodPixelOffset * vec2(0.0, 1.0));\r\n    t_uv = t_uv * offset.xy + offset.zw;\r\n    //添加lod起始坐标\r\n    t_uv = t_uv * lodvec.xy + lodvec.zw;\r\n    //取整像素\r\n    t_uv = floor(t_uv * u_imageSize) / u_imageSize;\r\n    vec4 tColor01 = texture2D(s_splatMergeTexture,t_uv);\r\n\r\n    t_uv = fract(uv + lodPixelOffset * vec2(1.0, 1.0));\r\n    t_uv = t_uv * offset.xy + offset.zw;\r\n    //添加lod起始坐标\r\n    t_uv = t_uv * lodvec.xy + lodvec.zw;\r\n    //取整像素\r\n    t_uv = floor(t_uv * u_imageSize) / u_imageSize;\r\n    vec4 tColor11 = texture2D(s_splatMergeTexture,t_uv);\r\n\r\n    vec4 tColor0 = mix(tColor00,tColor10,mixFactor.x);\r\n    vec4 tColor1 = mix(tColor01,tColor11,mixFactor.x);\r\n    vec4 tColor = mix(tColor0,tColor1,mixFactor.y);\r\n\r\n    return tColor;\r\n\r\n    // return vec4(mixFactor.x,mixFactor.y,0.0,1.0);\r\n    // return vec4(mixFactor.x + 0.5,mixFactor.y + 0.5,0.0,1.0);\r\n}\r\n\r\n//参考 http://blog.csdn.net/cgwbr/article/details/6620318\r\n//计算MipMap层函数：\r\nfloat mipmapLevel(vec2 uv)\r\n{\r\n    vec2 dx = dFdx(uv);\r\n    vec2 dy = dFdy(uv);\r\n    float d = max(dot(dx, dx), dot(dy, dy));\r\n    return 0.5 * log2(d);\r\n}\r\n\r\n//根据距离以及法线计算MipMap层函数：\r\nfloat mipmapLevel1(vec2 uv)\r\n{\r\n    //视线方向\r\n    vec3 viewDir = u_cameraMatrix[3].xyz - v_globalPosition.xyz;\r\n    float fogDistance = length(viewDir);\r\n    float value = u_scaleByDepth * fogDistance * u_uvPositionScale;//uv变化率与距离成正比，0.001为顶点位置与uv的变化比率\r\n    viewDir = normalize(viewDir);\r\n    float dd = clamp(dot(viewDir, v_normal),0.05,1.0);//取法线与视线余弦值的倒数，余弦值越大（朝向摄像机时uv变化程度越低）lod越小\r\n    value = value / dd;\r\n    value = value * 0.5;//还没搞懂0.5的来历\r\n    return log2(value);\r\n}\r\n\r\nvec4 terrainTexture2D(sampler2D s_splatMergeTexture,vec2 t_uv,float lod,vec4 offset){\r\n \r\n    #ifdef LOD_LINEAR\r\n        vec4 tColor = mix(terrainTexture2DLod(s_splatMergeTexture,t_uv,floor(lod),offset),terrainTexture2DLod(s_splatMergeTexture,t_uv,ceil(lod),offset),fract(lod));\r\n    #else\r\n        vec4 tColor = terrainTexture2DLod(s_splatMergeTexture,t_uv,ceil(lod),offset);\r\n    #endif\r\n\r\n    return tColor;\r\n}\r\n\r\nvec4 terrainMethod(vec4 diffuseColor,vec2 v_uv) {\r\n    \r\n    float lod = 0.0;\r\n    vec4 blend = texture2D(s_blendTexture,v_uv);\r\n    for(int i = 0; i < 3; i++)\r\n    {\r\n        vec2 t_uv = v_uv * u_splatRepeats[i];\r\n        // lod = mipmapLevel(v_uv) + log2(u_tileSize.x * u_splatRepeats[i]);\r\n        lod = mipmapLevel1(v_uv) + log2(u_tileSize.x * u_splatRepeats[i]);\r\n        lod = clamp(lod,0.0,u_maxLod);\r\n        vec4 tColor = terrainTexture2D(s_splatMergeTexture,t_uv,lod,u_tileOffset[i]);\r\n        diffuseColor = (tColor - diffuseColor) * blend[i] + diffuseColor;\r\n    }\r\n\r\n    // diffuseColor.xyz = vec3(1.0,0.0,0.0);\r\n    // diffuseColor.xyz = vec3(lod/u_maxLod,0.0,0.0);\r\n    // diffuseColor.xyz = vec3(floor(lod)/u_maxLod,0.0,0.0);\r\n    return diffuseColor;\r\n}",
        "shaders/modules/terrainMerge.fragment1.glsl": "#extension GL_EXT_shader_texture_lod : enable\r\n#extension GL_OES_standard_derivatives : enable\r\n\r\n#define LOD_LINEAR\r\n\r\nuniform sampler2D s_splatMergeTexture;\r\nuniform sampler2D s_blendTexture;\r\nuniform vec4 u_splatRepeats;\r\n\r\nvec2 imageSize =    vec2(2048.0,1024.0);\r\nvec4 offset[3];\r\nvec2 tileSize = vec2(512.0,512.0);\r\nfloat maxLod = 7.0;\r\n\r\nvec4 terrainTexture2DLod(sampler2D s_splatMergeTexture,vec2 t_uv,float lod)\r\n{\r\n    vec4 lodvec = vec4(0.5,1.0,0.0,0.0);\r\n    lodvec.x = lodvec.x * pow(0.5,lod);\r\n    lodvec.y = lodvec.x * 2.0;\r\n    lodvec.z = 1.0 - lodvec.y;\r\n    \r\n    t_uv = t_uv * lodvec.xy + lodvec.zw;\r\n    t_uv = floor(t_uv * imageSize) / imageSize;\r\n    \r\n    vec4 tColor = texture2D(s_splatMergeTexture,t_uv);\r\n    return tColor;\r\n}\r\n\r\n//参考 http://blog.csdn.net/cgwbr/article/details/6620318\r\n//计算MipMap层函数：\r\nfloat mipmapLevel(vec2 uv, vec2 textureSize)\r\n{\r\n    vec2 dx = dFdx(uv * textureSize.x);\r\n    vec2 dy = dFdy(uv * textureSize.y);\r\n    float d = max(dot(dx, dx), dot(dy, dy));  \r\n    return 0.5 * log2(d);\r\n}\r\n\r\nvec4 terrainTexture2DLodMix(sampler2D s_splatMergeTexture,vec2 t_uv,vec4 offset)\r\n{\r\n    float lod = mipmapLevel(t_uv,tileSize);\r\n    lod = clamp(lod,0.0,maxLod);\r\n    t_uv = fract(t_uv);\r\n    t_uv = t_uv * offset.xy + offset.zw;\r\n \r\n    #ifdef LOD_LINEAR\r\n        vec4 tColor = mix(terrainTexture2DLod(s_splatMergeTexture,t_uv,floor(lod)),terrainTexture2DLod(s_splatMergeTexture,t_uv,ceil(lod)),fract(lod));\r\n    #else\r\n        vec4 tColor = terrainTexture2DLod(s_splatMergeTexture,t_uv,ceil(lod));\r\n    #endif\r\n    return tColor;\r\n}\r\n\r\nvec4 terrainTexture2D(sampler2D s_splatMergeTexture,vec2 t_uv,float splatRepeat,vec4 offset)\r\n{\r\n    t_uv = t_uv.xy * splatRepeat;\r\n    \r\n    vec2 dx = dFdx(t_uv);\r\n    vec2 dy = dFdy(t_uv);\r\n    \r\n    vec4 tColor0 = terrainTexture2DLodMix(s_splatMergeTexture, t_uv, offset);\r\n    vec4 tColor1 = terrainTexture2DLodMix(s_splatMergeTexture, t_uv + dx, offset);\r\n\r\n    vec4 tColor = mix(tColor0,tColor1,0.5);\r\n\r\n    return tColor;\r\n}\r\n\r\nvec4 terrainMethod(vec4 diffuseColor,vec2 v_uv) \r\n{\r\n    \r\n    offset[0] = vec4(0.5,0.5,0.0,0.0);\r\n    offset[1] = vec4(0.5,0.5,0.5,0.0);\r\n    offset[2] = vec4(0.5,0.5,0.0,0.5);\r\n    \r\n    vec4 blend = texture2D(s_blendTexture,v_uv);\r\n    for(int i = 0; i < 3; i++)\r\n    {\r\n        vec4 tColor = terrainTexture2D(s_splatMergeTexture,v_uv,u_splatRepeats[i],offset[i]);\r\n        diffuseColor = (tColor - diffuseColor) * blend[i] + diffuseColor;\r\n    }\r\n\r\n    // diffuseColor.xyz = vec3(1.0,0.0,0.0);\r\n    // diffuseColor.xyz = vec3(floor(lod)/7.0,0.0,0.0);\r\n    return diffuseColor;\r\n}",
        "shaders/mouse.fragment.glsl": "\r\n\r\nprecision highp float;\r\n\r\nuniform int u_objectID;\r\n\r\nvoid main(){\r\n\r\n    //支持 255*255*255*255 个索引\r\n    const float invColor = 1.0/255.0;\r\n    float temp = float(u_objectID);\r\n    temp = floor(temp) * invColor;\r\n    gl_FragColor.x = fract(temp);\r\n    temp = floor(temp) * invColor;\r\n    gl_FragColor.y = fract(temp);\r\n    temp = floor(temp) * invColor;\r\n    gl_FragColor.z = fract(temp);\r\n    temp = floor(temp) * invColor;\r\n    gl_FragColor.w = fract(temp);\r\n}",
        "shaders/mouse.vertex.glsl": "\r\n\r\nattribute vec3 a_position;\r\n\r\nuniform mat4 u_modelMatrix;\r\nuniform mat4 u_viewProjection;\r\n\r\nvoid main(){\r\n\r\n    vec4 globalPosition = u_modelMatrix * vec4(a_position, 1.0);\r\n    gl_Position = u_viewProjection * globalPosition;\r\n}",
        "shaders/point.fragment.glsl": "\r\n\r\nprecision mediump float;\r\n\r\n\r\n\r\nvoid main(void) {\r\n   \r\n    gl_FragColor = vec4(1.0,1.0,1.0,1.0);\r\n}\r\n",
        "shaders/point.vertex.glsl": "\r\n\r\nattribute vec3 a_position;\r\n\r\nuniform float u_PointSize;\r\n\r\nuniform mat4 u_modelMatrix;\r\nuniform mat4 u_viewProjection;\r\n\r\nvoid main(void) {\r\n\r\n    vec4 globalPosition = u_modelMatrix * vec4(a_position, 1.0);\r\n    gl_Position = u_viewProjection * globalPosition;\r\n    gl_PointSize = u_PointSize;\r\n}",
        "shaders/postEffect/fxaa.fragment.glsl": "\r\n\r\n#define FXAA_REDUCE_Mvarying   (1.0/128.0)\r\n#define FXAA_REDUCE_MUL   (1.0/8.0)\r\n#define FXAA_SPAN_MAX     8.0\r\n\r\nvarying vec2 vUV;\r\nuniform sampler2D textureSampler;\r\nuniform vec2 texelSize;\r\n\r\n\r\n\r\nvoid main(){\r\n\tvec2 localTexelSize = texelSize;\r\n\tvec4 rgbNW = texture2D(textureSampler, (vUV + vec2(-1.0, -1.0) * localTexelSize));\r\n\tvec4 rgbNE = texture2D(textureSampler, (vUV + vec2(1.0, -1.0) * localTexelSize));\r\n\tvec4 rgbSW = texture2D(textureSampler, (vUV + vec2(-1.0, 1.0) * localTexelSize));\r\n\tvec4 rgbSE = texture2D(textureSampler, (vUV + vec2(1.0, 1.0) * localTexelSize));\r\n\tvec4 rgbM = texture2D(textureSampler, vUV);\r\n\tvec4 luma = vec4(0.299, 0.587, 0.114, 1.0);\r\n\tfloat lumaNW = dot(rgbNW, luma);\r\n\tfloat lumaNE = dot(rgbNE, luma);\r\n\tfloat lumaSW = dot(rgbSW, luma);\r\n\tfloat lumaSE = dot(rgbSE, luma);\r\n\tfloat lumaM = dot(rgbM, luma);\r\n\tfloat lumaMvarying = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));\r\n\tfloat lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));\r\n\r\n\tvec2 dir = vec2(-((lumaNW + lumaNE) - (lumaSW + lumaSE)), ((lumaNW + lumaSW) - (lumaNE + lumaSE)));\r\n\r\n\tfloat dirReduce = max(\r\n\t\t(lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL),\r\n\t\tFXAA_REDUCE_MIN);\r\n\r\n\tfloat rcpDirMvarying = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);\r\n\tdir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),\r\n\t\tmax(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),\r\n\t\tdir * rcpDirMin)) * localTexelSize;\r\n\r\n\tvec4 rgbA = 0.5 * (\r\n\t\ttexture2D(textureSampler, vUV + dir * (1.0 / 3.0 - 0.5)) +\r\n\t\ttexture2D(textureSampler, vUV + dir * (2.0 / 3.0 - 0.5)));\r\n\r\n\tvec4 rgbB = rgbA * 0.5 + 0.25 * (\r\n\t\ttexture2D(textureSampler, vUV + dir *  -0.5) +\r\n\t\ttexture2D(textureSampler, vUV + dir * 0.5));\r\n\tfloat lumaB = dot(rgbB, luma);\r\n\tif ((lumaB < lumaMin) || (lumaB > lumaMax)) {\r\n\t\tgl_FragColor = rgbA;\r\n\t}\r\n\telse {\r\n\t\tgl_FragColor = rgbB;\r\n\t}\r\n}",
        "shaders/segment.fragment.glsl": "\r\nprecision mediump float;\r\n\r\nvarying vec4 v_color;\r\n\r\n\r\n\r\nvoid main(void) {\r\n    gl_FragColor = v_color;\r\n}",
        "shaders/segment.vertex.glsl": "\r\n\r\nattribute vec3 a_position;\r\nattribute vec4 a_color;\r\n\r\nuniform mat4 u_modelMatrix;\r\nuniform mat4 u_viewProjection;\r\n\r\nvarying vec4 v_color;\r\n\r\nvoid main(void) {\r\n    gl_Position = u_viewProjection * u_modelMatrix * vec4(a_position, 1.0);\r\n    v_color = a_color;\r\n}",
        "shaders/shadow.fragment.glsl": "precision mediump float;\r\n\r\nvoid main() {\r\n    const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0);\r\n    const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);\r\n    vec4 rgbaDepth = fract(gl_FragCoord.z * bitShift); // Calculate the value stored into each byte\r\n    rgbaDepth -= rgbaDepth.gbaa * bitMask; // Cut off the value which do not fit in 8 bits\r\n    gl_FragColor = rgbaDepth;\r\n}",
        "shaders/shadow.vertex.glsl": "attribute vec3 a_position;\r\n\r\nuniform mat4 u_modelMatrix;\r\nuniform mat4 u_viewProjection;\r\n\r\nvoid main(void) {\r\n\r\n    vec4 globalPosition = u_modelMatrix * vec4(a_position, 1.0);\r\n    gl_Position = u_viewProjection * globalPosition;\r\n}",
        "shaders/skybox.fragment.glsl": "\r\n\r\nprecision highp float;\r\n\r\nuniform samplerCube s_skyboxTexture;\r\nuniform mat4 u_cameraMatrix;\r\n\r\nvarying vec3 v_worldPos;\r\n\r\n\r\n\r\nvoid main(){\r\n    vec3 viewDir = normalize(v_worldPos - u_cameraMatrix[3].xyz);\r\n    gl_FragColor = textureCube(s_skyboxTexture, viewDir);\r\n}",
        "shaders/skybox.vertex.glsl": "\r\n\r\nattribute vec3 a_position;\r\n\r\nuniform mat4 u_cameraMatrix;\r\nuniform mat4 u_viewProjection;\r\n\r\nuniform float u_skyBoxSize;\r\n\r\nvarying vec3 v_worldPos;\r\n\r\nvoid main(){\r\n    vec3 worldPos = a_position.xyz * u_skyBoxSize + u_cameraMatrix[3].xyz;\r\n    gl_Position = u_viewProjection * vec4(worldPos.xyz,1.0);\r\n    v_worldPos = worldPos;\r\n}",
        "shaders/standard.fragment.glsl": "\r\nprecision mediump float;\r\n\r\n//此处将填充宏定义\r\n#define macros\r\n\r\nvarying vec2 v_uv;\r\nvarying vec3 v_globalPosition;\r\nvarying vec3 v_normal;\r\n\r\n#ifdef HAS_NORMAL_SAMPLER\r\n    varying vec3 v_tangent;\r\n    varying vec3 v_bitangent;\r\n#endif\r\n\r\nuniform mat4 u_cameraMatrix;\r\n\r\n\r\nuniform float u_alphaThreshold;\r\n//漫反射\r\nuniform vec4 u_diffuse;\r\n#ifdef HAS_DIFFUSE_SAMPLER\r\n    uniform sampler2D s_diffuse;\r\n#endif\r\n\r\n//法线贴图\r\n#ifdef HAS_NORMAL_SAMPLER\r\n    uniform sampler2D s_normal;\r\n#endif\r\n\r\n//镜面反射\r\nuniform vec3 u_specular;\r\nuniform float u_glossiness;\r\n#ifdef HAS_SPECULAR_SAMPLER\r\n    uniform sampler2D s_specular;\r\n#endif\r\n\r\nuniform vec4 u_sceneAmbientColor;\r\n\r\n//环境\r\nuniform vec4 u_ambient;\r\n#ifdef HAS_AMBIENT_SAMPLER\r\n    uniform sampler2D s_ambient;\r\n#endif\r\n\r\n#ifdef HAS_TERRAIN_METHOD\r\n    #include<modules/terrain.fragment>\r\n#endif\r\n\r\n#include<modules/pointLightShading.fragment>\r\n\r\n#ifdef HAS_FOG_METHOD\r\n    #include<modules/fog.fragment>\r\n#endif\r\n\r\n#ifdef HAS_ENV_METHOD\r\n    #include<modules/envmap.fragment>\r\n#endif\r\n\r\n#ifdef HAS_PARTICLE_ANIMATOR\r\n    #include<modules/particle.fragment>\r\n#endif\r\n\r\nvoid main(void) {\r\n\r\n    vec4 finalColor = vec4(1.0,1.0,1.0,1.0);\r\n\r\n    //获取法线\r\n    vec3 normal;\r\n    #ifdef HAS_NORMAL_SAMPLER\r\n        normal = texture2D(s_normal,v_uv).xyz * 2.0 - 1.0;\r\n        normal = normalize(normal.x * v_tangent + normal.y * v_bitangent + normal.z * v_normal);\r\n    #else\r\n        normal = normalize(v_normal);\r\n    #endif\r\n\r\n    //获取漫反射基本颜色\r\n    vec4 diffuseColor = u_diffuse;\r\n    #ifdef HAS_DIFFUSE_SAMPLER\r\n        diffuseColor = diffuseColor * texture2D(s_diffuse, v_uv);\r\n    #endif\r\n\r\n    if(diffuseColor.w < u_alphaThreshold)\r\n    {\r\n        discard;\r\n    }\r\n\r\n    #ifdef HAS_TERRAIN_METHOD\r\n        diffuseColor = terrainMethod(diffuseColor, v_uv);\r\n    #endif\r\n\r\n    //环境光\r\n    vec3 ambientColor = u_ambient.w * u_ambient.xyz * u_sceneAmbientColor.xyz * u_sceneAmbientColor.w;\r\n    #ifdef HAS_AMBIENT_SAMPLER\r\n        ambientColor = ambientColor * texture2D(s_ambient, v_uv).xyz;\r\n    #endif\r\n\r\n    finalColor = diffuseColor;\r\n\r\n    //渲染灯光\r\n    #if NUM_LIGHT > 0\r\n\r\n        //获取高光值\r\n        float glossiness = u_glossiness;\r\n        //获取镜面反射基本颜色\r\n        vec3 specularColor = u_specular;\r\n        #ifdef HAS_SPECULAR_SAMPLER\r\n            vec4 specularMapColor = texture2D(s_specular, v_uv);\r\n            specularColor.xyz = specularMapColor.xyz;\r\n            glossiness = glossiness * specularMapColor.w;\r\n        #endif\r\n        \r\n        finalColor.xyz = pointLightShading(normal, diffuseColor.xyz, specularColor, ambientColor, glossiness);\r\n    #endif\r\n\r\n    #ifdef HAS_ENV_METHOD\r\n        finalColor = envmapMethod(finalColor);\r\n    #endif\r\n\r\n    #ifdef HAS_PARTICLE_ANIMATOR\r\n        finalColor = particleAnimation(finalColor);\r\n    #endif\r\n\r\n    #ifdef HAS_FOG_METHOD\r\n        finalColor = fogMethod(finalColor);\r\n    #endif\r\n\r\n    gl_FragColor = finalColor;\r\n}",
        "shaders/standard.vertex.glsl": "//此处将填充宏定义\r\n#define macros\r\n\r\n//坐标属性\r\nattribute vec3 a_position;\r\nattribute vec2 a_uv;\r\nattribute vec3 a_normal;\r\n\r\nuniform mat4 u_modelMatrix;\r\nuniform mat4 u_viewProjection;\r\n\r\nvarying vec2 v_uv;\r\nvarying vec3 v_globalPosition;\r\nvarying vec3 v_normal;\r\n\r\n#ifdef HAS_NORMAL_SAMPLER\r\n    attribute vec3 a_tangent;\r\n\r\n    varying vec3 v_tangent;\r\n    varying vec3 v_bitangent;\r\n#endif\r\n\r\n#ifdef HAS_SKELETON_ANIMATION\r\n    #include<modules/skeleton.vertex>\r\n#endif\r\n\r\n#ifdef IS_POINTS_MODE\r\n    uniform float u_PointSize;\r\n#endif\r\n\r\n#ifdef HAS_PARTICLE_ANIMATOR\r\n    #include<modules/particle.vertex>\r\n#endif\r\n\r\nvoid main(void) {\r\n\r\n    vec4 position = vec4(a_position,1.0);\r\n\r\n    #ifdef HAS_SKELETON_ANIMATION\r\n        position = skeletonAnimation(position);\r\n    #endif\r\n    \r\n    #ifdef HAS_PARTICLE_ANIMATOR\r\n        position = particleAnimation(position);\r\n    #endif\r\n\r\n    //获取全局坐标\r\n    vec4 globalPosition = u_modelMatrix * position;\r\n    //计算投影坐标\r\n    gl_Position = u_viewProjection * globalPosition;\r\n    //输出全局坐标\r\n    v_globalPosition = globalPosition.xyz;\r\n    //输出uv\r\n    v_uv = a_uv;\r\n\r\n    //计算法线\r\n    v_normal = normalize((u_modelMatrix * vec4(a_normal,0.0)).xyz);\r\n    #ifdef HAS_NORMAL_SAMPLER\r\n        v_tangent = normalize((u_modelMatrix * vec4(a_tangent,0.0)).xyz);\r\n        v_bitangent = cross(v_normal,v_tangent);\r\n    #endif\r\n    \r\n    #ifdef IS_POINTS_MODE\r\n        gl_PointSize = u_PointSize;\r\n    #endif\r\n}",
        "shaders/texture.fragment.glsl": "\r\n\r\nprecision mediump float;\r\n\r\nuniform sampler2D s_texture;\r\nvarying vec2 v_uv;\r\n\r\n\r\n\r\nvoid main(void) {\r\n\r\n    gl_FragColor = texture2D(s_texture, v_uv);\r\n}\r\n",
        "shaders/texture.vertex.glsl": "\r\n\r\nattribute vec3 a_position;\r\nattribute vec2 a_uv;\r\n\r\nvarying vec2 v_uv;\r\nuniform mat4 u_modelMatrix;\r\nuniform mat4 u_viewProjection;\r\n\r\nvoid main(void) {\r\n\r\n    gl_Position = u_viewProjection * u_modelMatrix * vec4(a_position, 1.0);\r\n    v_uv = a_uv;\r\n}"
    };
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * feng3d的版本号
     * @author feng 2015-03-20
     */
    feng3d.revision = "0.0.0";
    /**
     * 是否开启调试(主要用于断言)
     */
    feng3d.debuger = true;
    /**
     * 初始化引擎
     */
    function initEngine() {
        if (feng3d.initFunctions) {
            for (var i = 0; i < feng3d.initFunctions.length; i++) {
                var element = feng3d.initFunctions[i];
                element();
            }
            delete feng3d.initFunctions;
        }
        if (!isInit) {
            isInit = true;
            console.log("Feng3D version " + this.revision);
            feng3d.serialization = new feng3d.Serialization();
            feng3d.input = new feng3d.Input();
            feng3d.inputType = new feng3d.InputEventType();
            feng3d.shortcut = new feng3d.ShortCut();
            feng3d.defaultMaterial = new feng3d.StandardMaterial();
            feng3d.defaultGeometry = new feng3d.CubeGeometry();
            feng3d.ticker = new feng3d.SystemTicker();
        }
    }
    feng3d.initEngine = initEngine;
    var isInit = false;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=feng3d.js.map