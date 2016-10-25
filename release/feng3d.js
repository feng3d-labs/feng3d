var feng3d;
(function (feng3d) {
    /**
     * feng3d的版本号
     */
    var $REVISION = "0.0.0";
    console.log(`Feng3D version ${$REVISION}`);
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 事件
     * @author feng 2014-5-7
     */
    class Event {
        /**
         * 创建一个作为参数传递给事件侦听器的 Event 对象。
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type, data = null, bubbles = false) {
            this._type = type;
            this._bubbles = bubbles;
            this.data = data;
        }
        /**
         * 是否停止处理事件监听器
         */
        get isStop() {
            return this._isStop;
        }
        set isStop(value) {
            this._isStopBubbles = this._isStop = this._isStopBubbles || value;
        }
        /**
         * 是否停止冒泡
         */
        get isStopBubbles() {
            return this._isStopBubbles;
        }
        set isStopBubbles(value) {
            this._isStopBubbles = this._isStopBubbles || value;
        }
        tostring() {
            return "[" + (typeof this) + " type=\"" + this._type + "\" bubbles=" + this._bubbles + "]";
        }
        /**
         * 表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        get bubbles() {
            return this._bubbles;
        }
        /**
         * 事件的类型。类型区分大小写。
         */
        get type() {
            return this._type;
        }
        /**
         * 事件目标。
         */
        get target() {
            return this._target;
        }
        set target(value) {
            this._currentTarget = value;
            if (this._target == null) {
                this._target = value;
            }
        }
        /**
         * 当前正在使用某个事件侦听器处理 Event 对象的对象。
         */
        get currentTarget() {
            return this._currentTarget;
        }
    }
    feng3d.Event = Event;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 为了实现非flash原生显示列表的冒泡事件，自定义事件适配器
     * @author feng 2016-3-22
     */
    class EventDispatcher {
        /**
         * 构建事件适配器
         * @param target		事件适配主体
         */
        constructor(target = null) {
            /**
             * 冒泡属性名称为“parent”
             */
            this.bubbleAttribute = "parent";
            this.target = target;
            if (this.target == null)
                this.target = this;
        }
        /**
         * 使用 EventDispatcher 对象注册事件侦听器对象，以使侦听器能够接收事件通知。
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        addEventListener(type, listener, thisObject, priority = 0) {
            if (listener == null)
                return;
            $listernerCenter //
                .remove(this.target, type, listener, thisObject) //
                .add(this.target, type, listener, thisObject, priority);
        }
        /**
         * 从 EventDispatcher 对象中删除侦听器. 如果没有向 IEventDispatcher 对象注册任何匹配的侦听器，则对此方法的调用没有任何效果。
         *
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        removeEventListener(type, listener, thisObject) {
            $listernerCenter //
                .remove(this.target, type, listener, thisObject);
        }
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEventDispatcher 对象。
         * @param event						调度到事件流中的 Event 对象。
         */
        dispatchEvent(event) {
            //设置目标
            event.target = this.target;
            var listeners = $listernerCenter.getListeners(this.target, event.type);
            //遍历调用事件回调函数
            for (var i = 0; !!listeners && i < listeners.length && !event.isStop; i++) {
                var element = listeners[i];
                element.listener.call(element.thisObject, event);
            }
            //事件冒泡(冒泡阶段)
            if (event.bubbles && !event.isStopBubbles) {
                this.dispatchBubbleEvent(event);
            }
        }
        /**
         * 检查 EventDispatcher 对象是否为特定事件类型注册了任何侦听器.
         *
         * @param type		事件的类型。
         * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        hasEventListener(type) {
            var has = $listernerCenter.hasEventListener(this.target, type);
            return has;
        }
        /**
         * 销毁
         */
        destroy() {
            $listernerCenter.destroyDispatcherListener(this.target);
        }
        /**
         * 派发冒泡事件
         * @param event						调度到事件流中的 Event 对象。
         */
        dispatchBubbleEvent(event) {
            var bubbleTargets = this.getBubbleTargets(event);
            bubbleTargets && bubbleTargets.forEach(element => {
                element && element.dispatchEvent(event);
            });
        }
        /**
         * 获取冒泡对象
         * @param event						调度到事件流中的 Event 对象。
         */
        getBubbleTargets(event) {
            return [this.target[this.bubbleAttribute]];
        }
    }
    feng3d.EventDispatcher = EventDispatcher;
    /**
     * 监听数据
     */
    class ListenerVO {
    }
    /**
     * 事件监听中心
     */
    class ListenerCenter {
        constructor() {
            /**
             * 派发器与监听器字典
             */
            this.map = [];
        }
        /**
         * 添加监听
         * @param dispatcher 派发器
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        add(dispatcher, type, listener, thisObject = null, priority = 0) {
            var dispatcherListener = this.getDispatcherListener(dispatcher);
            if (dispatcherListener == null) {
                dispatcherListener = this.createDispatcherListener(dispatcher);
            }
            var listeners = dispatcherListener.get(type) || [];
            this.remove(dispatcher, type, listener, thisObject);
            for (var i = 0; i < listeners.length; i++) {
                var element = listeners[i];
                if (priority > element.priority) {
                    break;
                }
            }
            listeners.splice(i, 0, { listener: listener, thisObject: thisObject, priority: priority });
            dispatcherListener.push(type, listeners);
            return this;
        }
        /**
         * 移除监听
         * @param dispatcher 派发器
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        remove(dispatcher, type, listener, thisObject = null) {
            var dispatcherListener = this.getDispatcherListener(dispatcher);
            if (dispatcherListener == null) {
                return this;
            }
            var listeners = dispatcherListener.get(type);
            if (listeners == null) {
                return this;
            }
            for (var i = listeners.length - 1; i >= 0; i--) {
                var element = listeners[i];
                if (element.listener == listener && element.thisObject == thisObject) {
                    listeners.splice(i, 1);
                }
            }
            if (listeners.length == 0) {
                dispatcherListener.delete(type);
            }
            if (dispatcherListener.isEmpty()) {
                this.destroyDispatcherListener(dispatcher);
            }
            return this;
        }
        /**
         * 获取某类型事件的监听列表
         * @param dispatcher 派发器
         * @param type  事件类型
         */
        getListeners(dispatcher, type) {
            var dispatcherListener = this.getDispatcherListener(dispatcher);
            if (dispatcherListener == null) {
                return null;
            }
            return dispatcherListener.get(type);
        }
        /**
         * 判断是否有监听事件
         * @param dispatcher 派发器
         * @param type  事件类型
         */
        hasEventListener(dispatcher, type) {
            var dispatcherListener = this.getDispatcherListener(dispatcher);
            if (dispatcherListener == null) {
                return false;
            }
            return !!dispatcherListener.get(type);
        }
        /**
         * 创建派发器监听
         * @param dispatcher 派发器
         */
        createDispatcherListener(dispatcher) {
            var dispatcherListener = new Map();
            this.map.push({ dispatcher: dispatcher, listener: dispatcherListener });
            return dispatcherListener;
        }
        /**
         * 销毁派发器监听
         * @param dispatcher 派发器
         */
        destroyDispatcherListener(dispatcher) {
            for (var i = 0; i < this.map.length; i++) {
                var element = this.map[i];
                if (element.dispatcher == dispatcher) {
                    element.dispatcher = null;
                    element.listener.destroy();
                    element.listener = null;
                    this.map.splice(i, 1);
                    break;
                }
            }
        }
        /**
         * 获取派发器监听
         * @param dispatcher 派发器
         */
        getDispatcherListener(dispatcher) {
            var dispatcherListener = null;
            this.map.forEach(element => {
                if (element.dispatcher == dispatcher)
                    dispatcherListener = element.listener;
            });
            return dispatcherListener;
        }
    }
    /**
     * 映射
     */
    class Map {
        constructor() {
            /**
             * 映射对象
             */
            this.map = {};
        }
        /**
         * 添加对象到字典
         * @param key       键
         * @param value     值
         */
        push(key, value) {
            this.map[key] = value;
        }
        /**
         * 删除
         * @param key       键
         */
        delete(key) {
            delete this.map[key];
        }
        /**
         * 获取值
         * @param key       键
         */
        get(key) {
            return this.map[key];
        }
        /**
         * 是否为空
         */
        isEmpty() {
            return Object.keys(this.map).length == 0;
        }
        /**
         * 销毁
         */
        destroy() {
            var keys = Object.keys(this.map);
            for (var i = 0; i < keys.length; i++) {
                var element = keys[i];
                delete this.map[element];
            }
            this.map = null;
        }
    }
    /**
     * 事件监听中心
     */
    var $listernerCenter = new ListenerCenter();
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 组件事件
     * @author feng 2015-12-2
     */
    class ComponentEvent extends feng3d.Event {
    }
    /**
     * 添加子组件事件
     * data = { container: IComponent, child: IComponent }
     */
    ComponentEvent.ADDED_COMPONENT = "addedComponent";
    /**
     * 移除子组件事件
     * data = { container: IComponent, child: IComponent }
     */
    ComponentEvent.REMOVED_COMPONENT = "removedComponent";
    feng3d.ComponentEvent = ComponentEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 组件容器（集合）
     * @author feng 2015-5-6
     */
    class Component extends feng3d.EventDispatcher {
        /**
         * 创建一个组件容器
         */
        constructor() {
            super();
            /**
             * 组件列表
             */
            this.components = [];
            this.initComponent();
        }
        /**
         * 初始化组件
         */
        initComponent() {
            //以最高优先级监听组件被添加，设置父组件
            this.addEventListener(feng3d.ComponentEvent.ADDED_COMPONENT, this._onAddedComponent, this, Number.MAX_VALUE);
            //以最低优先级监听组件被删除，清空父组件
            this.addEventListener(feng3d.ComponentEvent.REMOVED_COMPONENT, this._onRemovedComponent, this, Number.MIN_VALUE);
        }
        /**
         * 父组件
         */
        get parentComponent() {
            return this._parentComponent;
        }
        /**
         * 子组件个数
         */
        get numComponents() {
            return this.components.length;
        }
        /**
         * 添加组件
         * @param component 被添加组件
         */
        addComponent(component) {
            if (this.hasComponent(component)) {
                this.setComponentIndex(component, this.components.length - 1);
                return;
            }
            this.addComponentAt(component, this.components.length);
        }
        /**
         * 添加组件到指定位置
         * @param component		被添加的组件
         * @param index			插入的位置
         */
        addComponentAt(component, index) {
            assert(component != this, "子项与父项不能相同");
            assert(index >= 0 && index <= this.numComponents, "给出索引超出范围");
            if (this.hasComponent(component)) {
                index = Math.min(index, this.components.length - 1);
                this.setComponentIndex(component, index);
                return;
            }
            this.components.splice(index, 0, component);
            //派发添加组件事件
            component.dispatchEvent(new feng3d.ComponentEvent(feng3d.ComponentEvent.ADDED_COMPONENT, { container: this, child: component }, true));
        }
        /**
         * 移除组件
         * @param component 被移除组件
         */
        removeComponent(component) {
            assert(this.hasComponent(component), "只能移除在容器中的组件");
            var index = this.getComponentIndex(component);
            this.removeComponentAt(index);
        }
        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        removeComponentAt(index) {
            assert(index >= 0 && index < this.numComponents, "给出索引超出范围");
            var component = this.components.splice(index, 1)[0];
            //派发移除组件事件
            component.dispatchEvent(new feng3d.ComponentEvent(feng3d.ComponentEvent.REMOVED_COMPONENT, { container: this, child: component }, true));
            return component;
        }
        /**
         * 获取组件在容器的索引位置
         * @param component			查询的组件
         * @return				    组件在容器的索引位置
         */
        getComponentIndex(component) {
            assert(this.components.indexOf(component) != -1, "组件不在容器中");
            var index = this.components.indexOf(component);
            return index;
        }
        /**
         * 设置子组件的位置
         * @param component				子组件
         * @param index				位置索引
         */
        setComponentIndex(component, index) {
            assert(index >= 0 && index < this.numComponents, "给出索引超出范围");
            var oldIndex = this.components.indexOf(component);
            assert(oldIndex >= 0 && oldIndex < this.numComponents, "子组件不在容器内");
            this.components.splice(oldIndex, 1);
            this.components.splice(index, 0, component);
        }
        /**
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        getComponentAt(index) {
            assert(index < this.numComponents, "给出索引超出范围");
            return this.components[index];
        }
        /**
         * 根据组件名称获取组件
         * <p>注意：此处比较的是componentName而非name</p>
         * @param componentName		组件名称
         * @return 					获取到的组件
         */
        getComponentByName(name) {
            var filterResult = this.getComponentsByName(name);
            return filterResult[0];
        }
        /**
         * 获取与给出组件名称相同的所有组件
         * <p>注意：此处比较的是componentName而非name</p>
         * @param name		        组件名称
         * @return 					获取到的组件
         */
        getComponentsByName(name) {
            var filterResult = this.components.filter(function (item, ...args) {
                return item.name == name;
            });
            return filterResult;
        }
        /**
         * 根据类定义获取组件
         * <p>如果存在多个则返回第一个</p>
         * @param cls				类定义
         * @return                  返回指定类型组件
         */
        getComponentByClass(cls) {
            var component = this.getComponentsByClass(cls)[0];
            return component;
        }
        /**
         * 根据类定义查找组件
         * @param cls		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsByClass(cls) {
            var filterResult = this.components.filter(function (item, ...args) {
                return item instanceof cls;
            });
            return filterResult;
        }
        /**
         * 根据类定义获取或创建组件
         * <p>当不存在该类型对象时创建一个该组件并且添加到容器中</p>
         * @param cls       类定义
         * @return          返回与给出类定义一致的组件
         */
        getOrCreateComponentByClass(cls) {
            var component = this.getComponentByClass(cls);
            if (component == null) {
                component = new cls();
                this.addComponent(component);
            }
            return component;
        }
        /**
         * 判断是否拥有组件
         * @param com	被检测的组件
         * @return		true：拥有该组件；false：不拥有该组件。
         */
        hasComponent(com) {
            return this.components.indexOf(com) != -1;
        }
        /**
         * 交换子组件位置
         * @param index1		第一个子组件的索引位置
         * @param index2		第二个子组件的索引位置
         */
        swapComponentsAt(index1, index2) {
            assert(index1 >= 0 && index1 < this.numComponents, "第一个子组件的索引位置超出范围");
            assert(index2 >= 0 && index2 < this.numComponents, "第二个子组件的索引位置超出范围");
            var temp = this.components[index1];
            this.components[index1] = this.components[index2];
            this.components[index2] = temp;
        }
        /**
         * 交换子组件位置
         * @param a		第一个子组件
         * @param b		第二个子组件
         */
        swapComponents(a, b) {
            assert(this.hasComponent(a), "第一个子组件不在容器中");
            assert(this.hasComponent(b), "第二个子组件不在容器中");
            this.swapComponentsAt(this.getComponentIndex(a), this.getComponentIndex(b));
        }
        /**
         * 派发子组件事件
         * <p>事件广播给子组件</p>
         * @param event     事件
         * @param depth     广播深度
         */
        dispatchChildrenEvent(event, depth = 1) {
            if (depth == 0)
                return;
            this.components.forEach(function (item, ...args) {
                item.dispatchEvent(event);
                item.dispatchChildrenEvent(event, depth - 1);
            });
        }
        //------------------------------------------
        //@protected
        //------------------------------------------
        /**
         * 处理被添加组件事件
         */
        onBeAddedComponent(event) {
        }
        /**
         * 处理被移除组件事件
         */
        onBeRemovedComponent(event) {
        }
        /**
         * 获取冒泡对象
         */
        getBubbleTargets(event = null) {
            var bubbleTargets = super.getBubbleTargets(event);
            bubbleTargets.push(this._parentComponent);
            return bubbleTargets;
        }
        //------------------------------------------
        //@private
        //------------------------------------------
        /**
         * 处理添加组件事件，此处为被添加，设置父组件
         */
        _onAddedComponent(event) {
            var data = event.data;
            if (data.child == this) {
                this._parentComponent = data.container;
                this.onBeAddedComponent(event);
            }
        }
        /**
         * 处理移除组件事件，此处为被移除，清空父组件
         */
        _onRemovedComponent(event) {
            var data = event.data;
            if (event.data.child == this) {
                this.onBeRemovedComponent(event);
                this._parentComponent = null;
            }
        }
    }
    feng3d.Component = Component;
    /**
     * 断言
     * @b			判定为真的表达式
     * @msg			在表达式为假时将输出的错误信息
     * @author feng 2014-10-29
     */
    function assert(b, msg = "assert") {
        if (!b)
            throw new Error(msg);
    }
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 断言
     * @b			判定为真的表达式
     * @msg			在表达式为假时将输出的错误信息
     * @author feng 2014-10-29
     */
    function assert(b, msg = "assert") {
        if (!b)
            throw msg;
    }
    feng3d.assert = assert;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 获取对象的类名
     * @author feng 2016-4-24
     */
    function getClassName(value) {
        var prototype = value.prototype ? value.prototype : Object.getPrototypeOf(value);
        var className = prototype.constructor.name;
        return className;
    }
    feng3d.getClassName = getClassName;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    class StringUtils {
        /**
         * 获取字符串
         * @param obj 转换为字符串的对象
         * @param showLen       显示长度
         * @param fill          长度不够是填充的字符串
         * @param tail          true（默认）:在尾部添加；false：在首部添加
         */
        static getString(obj, showLen = -1, fill = " ", tail = true) {
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
        }
    }
    feng3d.StringUtils = StringUtils;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 构建Map类代替Dictionary
     */
    class Map {
        constructor() {
            /**
             * key,value组合列表
             */
            this.list = [];
        }
        /**
         * 删除
         */
        delete(k) {
            for (var i = 0; i < this.list.length; i++) {
                var element = this.list[i];
                if (element.k == k) {
                    this.list.splice(i, 1);
                    break;
                }
            }
        }
        /**
         * 添加映射
         */
        push(k, v) {
            var target = this._getKV(k);
            if (target != null)
                target.v = v;
            else {
                target = new KV(k, v);
                this.list.push(target);
            }
        }
        /**
         * 通过key获取value
         */
        get(k) {
            var target = this._getKV(k);
            if (target != null)
                return target.v;
            return null;
        }
        /**
         * 获取键列表
         */
        getKeys() {
            var keys = [];
            this.list.forEach(kv => {
                keys.push(kv.k);
            });
            return keys;
        }
        /**
         * 清理字典
         */
        clear() {
            this.list.length = 0;
        }
        /**
         * 通过key获取(key,value)组合
         */
        _getKV(k) {
            var target;
            this.list.forEach(kv => {
                if (kv.k == k) {
                    target = kv;
                }
            });
            return target;
        }
    }
    feng3d.Map = Map;
    /**
     * key,value组合
     */
    class KV {
        constructor(k, v) {
            this.k = k;
            this.v = v;
        }
    }
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 获取对象UID
     * @author feng 2016-05-08
     */
    function getUID(object) {
        //uid属性名称
        var uidKey = "__uid__";
        if (typeof object != "object") {
            throw `无法获取${object}的UID`;
        }
        if (object.hasOwnProperty(uidKey)) {
            return object[uidKey];
        }
        var uid = createUID(object);
        Object.defineProperty(object, uidKey, {
            value: uid,
            enumerable: false,
            writable: false
        });
        return uid;
    }
    feng3d.getUID = getUID;
    /**
     * 创建对象的UID
     * @param object 对象
     */
    function createUID(object) {
        var className = feng3d.getClassName(object);
        var uid = [
            className,
            feng3d.StringUtils.getString(~~uidStart[className], 8, "0", false),
            Date.now(),
        ].join("-");
        uidStart[className] = ~~uidStart[className] + 1;
        return uid;
    }
    /**
     * uid自增长编号
     */
    var uidStart = {};
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    class Version {
        /**
         * 获取对象版本
         * @param object 对象
         */
        getVersion(object) {
            this.assertObject(object);
            if (!object.hasOwnProperty(versionKey)) {
                return -1;
            }
            return ~~object[versionKey];
        }
        /**
         * 升级对象版本（版本号+1）
         * @param object 对象
         */
        upgradeVersion(object) {
            this.assertObject(object);
            if (!object.hasOwnProperty(versionKey)) {
                Object.defineProperty(object, versionKey, {
                    value: 0,
                    enumerable: false,
                    writable: true
                });
            }
            object[versionKey] = ~~object[versionKey] + 1;
        }
        /**
         * 设置版本号
         * @param object 对象
         * @param version 版本号
         */
        setVersion(object, version) {
            this.assertObject(object);
            object[versionKey] = ~~version;
        }
        /**
         * 判断两个对象的版本号是否相等
         */
        equal(a, b) {
            var va = this.getVersion(a);
            var vb = this.getVersion(b);
            if (va == -1 && vb == -1)
                return false;
            return va == vb;
        }
        /**
         * 断言object为对象类型
         */
        assertObject(object) {
            if (typeof object != "object") {
                throw `无法获取${object}的UID`;
            }
        }
    }
    feng3d.Version = Version;
    /**
     * 版本号键名称
     */
    var versionKey = "__version__";
    /**
     * 对象版本
     */
    feng3d.version = new Version();
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 判断a对象是否为b类型
     */
    function is(a, b) {
        var prototype = a.prototype ? a.prototype : Object.getPrototypeOf(a);
        while (prototype != null) {
            //类型==自身原型的构造函数
            if (prototype.constructor == b)
                return true;
            //父类就是原型的原型构造函数
            prototype = Object.getPrototypeOf(prototype);
        }
        return false;
    }
    feng3d.is = is;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 如果a为b类型则返回，否则返回null
     */
    function as(a, b) {
        if (!feng3d.is(a, b))
            return null;
        return a;
    }
    feng3d.as = as;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 颜色
     * @author feng 2016-09-24
     */
    class Color {
        /**
         * 构建颜色
         */
        constructor(color = 0xffffffff) {
            /**
             * 红色，0-1
             */
            this.r = 1;
            /**
             * 绿色，0-1
             */
            this.g = 1;
            /**
             * 蓝色，0-1
             */
            this.b = 1;
            /**
             * 透明度，0-1
             */
            this.a = 1;
            this.color = color;
        }
        /**
         * 颜色值，32位整数值
         */
        get color() {
            return this._color;
        }
        set color(value) {
            this._color = value;
            this.a = ((this._color >> 24) & 0xff) / 0xff;
            this.r = ((this._color >> 16) & 0xff) / 0xff;
            this.g = ((this._color >> 8) & 0xff) / 0xff;
            this.b = (this._color & 0xff) / 0xff;
        }
        get x() {
            return this.r;
        }
        get y() {
            return this.g;
        }
        get z() {
            return this.b;
        }
        get w() {
            return this.a;
        }
    }
    feng3d.Color = Color;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 数学常量类
     */
    class MathConsts {
    }
    /**
     * 弧度转角度因子
     */
    MathConsts.RADIANS_TO_DEGREES = 180 / Math.PI;
    /**
     * 角度转弧度因子
     */
    MathConsts.DEGREES_TO_RADIANS = Math.PI / 180;
    feng3d.MathConsts = MathConsts;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 矩形
     * @author feng 2016-04-27
     */
    class Rectangle {
        constructor() {
            /**
             * X坐标
             */
            this.x = 0;
            /**
             * Y坐标
             */
            this.y = 0;
            /**
             * 宽度
             */
            this.width = 0;
            /**
             * 高度
             */
            this.height = 0;
        }
        /**
         * 是否包含指定点
         * @param x 点的X坐标
         * @param y 点的Y坐标
         */
        contains(x, y) {
            return this.x <= x && x < this.x + this.width && this.y <= y && y < this.y + this.height;
        }
    }
    feng3d.Rectangle = Rectangle;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Vector3D 类使用笛卡尔坐标 x、y 和 z 表示三维空间中的点或位置
     * @author feng 2016-3-21
     */
    class Vector3D {
        /**
         * 创建 Vector3D 对象的实例。如果未指定构造函数的参数，则将使用元素 (0,0,0,0) 创建 Vector3D 对象。
         * @param x 第一个元素，例如 x 坐标。
         * @param y 第二个元素，例如 y 坐标。
         * @param z 第三个元素，例如 z 坐标。
         * @param w 表示额外数据的可选元素，例如旋转角度
         */
        constructor(x = 0, y = 0, z = 0, w = 0) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }
        /**
        * 当前 Vector3D 对象的长度（大小），即从原点 (0,0,0) 到该对象的 x、y 和 z 坐标的距离。w 属性将被忽略。单位矢量具有的长度或大小为一。
        */
        get length() {
            return Math.sqrt(this.lengthSquared);
        }
        /**
        * 当前 Vector3D 对象长度的平方，它是使用 x、y 和 z 属性计算出来的。w 属性将被忽略。尽可能使用 lengthSquared() 方法，而不要使用 Vector3D.length() 方法的 Math.sqrt() 方法调用，后者速度较慢。
        */
        get lengthSquared() {
            return this.x * this.x + this.y * this.y + this.z * this.z;
        }
        /**
         * 将当前 Vector3D 对象的 x、y 和 z 元素的值与另一个 Vector3D 对象的 x、y 和 z 元素的值相加。
         * @param a 要与当前 Vector3D 对象相加的 Vector3D 对象。
         * @return 一个 Vector3D 对象，它是将当前 Vector3D 对象与另一个 Vector3D 对象相加所产生的结果。
         */
        add(a) {
            return new Vector3D(this.x + a.x, this.y + a.y, this.z + a.z, this.w + a.w);
        }
        /**
         * 返回一个新 Vector3D 对象，它是与当前 Vector3D 对象完全相同的副本。
         * @return 一个新 Vector3D 对象，它是当前 Vector3D 对象的副本。
         */
        clone() {
            return new Vector3D(this.x, this.y, this.z, this.w);
        }
        /**
         * 将源 Vector3D 对象中的所有矢量数据复制到调用方 Vector3D 对象中。
         * @return 要从中复制数据的 Vector3D 对象。
         */
        copyFrom(sourceVector3D) {
            this.x = sourceVector3D.x;
            this.y = sourceVector3D.y;
            this.z = sourceVector3D.z;
            this.w = sourceVector3D.w;
        }
        /**
         * 返回一个新的 Vector3D 对象，它与当前 Vector3D 对象和另一个 Vector3D 对象垂直（成直角）。
         */
        crossProduct(a) {
            return new Vector3D(this.y * a.z - this.z * a.y, this.z * a.x - this.x * a.z, this.x * a.y - this.y * a.x, 1);
        }
        /**
         * 按照指定的 Vector3D 对象的 x、y 和 z 元素的值递减当前 Vector3D 对象的 x、y 和 z 元素的值。
         */
        decrementBy(a) {
            this.x -= a.x;
            this.y -= a.y;
            this.z -= a.z;
        }
        /**
         * 返回两个 Vector3D 对象之间的距离。
         */
        static distance(pt1, pt2) {
            var x = (pt1.x - pt2.x);
            var y = (pt1.y - pt2.y);
            var z = (pt1.z - pt2.z);
            return Math.sqrt(x * x + y * y + z * z);
        }
        /**
         * 如果当前 Vector3D 对象和作为参数指定的 Vector3D 对象均为单位顶点，此方法将返回这两个顶点之间所成角的余弦值。
         */
        dotProduct(a) {
            return this.x * a.x + this.y * a.y + this.z * a.z;
        }
        /**
         * 通过将当前 Vector3D 对象的 x、y 和 z 元素与指定的 Vector3D 对象的 x、y 和 z 元素进行比较，确定这两个对象是否相等。
         */
        equals(toCompare, allFour = false) {
            return (this.x == toCompare.x && this.y == toCompare.y && this.z == toCompare.z && (!allFour || this.w == toCompare.w));
        }
        /**
         * 按照指定的 Vector3D 对象的 x、y 和 z 元素的值递增当前 Vector3D 对象的 x、y 和 z 元素的值。
         */
        incrementBy(a) {
            this.x += a.x;
            this.y += a.y;
            this.z += a.z;
        }
        /**
         * 将当前 Vector3D 对象设置为其逆对象。
         */
        negate() {
            this.x = -this.x;
            this.y = -this.y;
            this.z = -this.z;
        }
        /**
         * 通过将最前面的三个元素（x、y、z）除以矢量的长度可将 Vector3D 对象转换为单位矢量。
         */
        normalize(thickness = 1) {
            if (this.length != 0) {
                var invLength = thickness / this.length;
                this.x *= invLength;
                this.y *= invLength;
                this.z *= invLength;
                return;
            }
        }
        /**
         * 按标量（大小）缩放当前的 Vector3D 对象。
         */
        scaleBy(s) {
            this.x *= s;
            this.y *= s;
            this.z *= s;
        }
        /**
         * 将 Vector3D 的成员设置为指定值
         */
        setTo(xa, ya, za) {
            this.x = xa;
            this.y = ya;
            this.z = za;
        }
        /**
         * 从另一个 Vector3D 对象的 x、y 和 z 元素的值中减去当前 Vector3D 对象的 x、y 和 z 元素的值。
         */
        subtract(a) {
            return new Vector3D(this.x - a.x, this.y - a.y, this.z - a.z);
        }
        /**
         * 返回当前 Vector3D 对象的字符串表示形式。
         */
        toString() {
            return "<" + this.x + ", " + this.y + ", " + this.z + ">";
        }
    }
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
    class Matrix3D {
        /**
         * 创建 Matrix3D 对象。
         * @param   datas    一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        constructor(datas = null) {
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
        /**
         * 一个保存显示对象在转换参照帧中的 3D 坐标 (x,y,z) 位置的 Vector3D 对象。
         */
        get position() {
            return new feng3d.Vector3D(this.rawData[12], this.rawData[13], this.rawData[14]);
        }
        set position(value) {
            this.rawData[12] = value.x;
            this.rawData[13] = value.y;
            this.rawData[14] = value.z;
        }
        /**
         * 一个用于确定矩阵是否可逆的数字。
         */
        get determinant() {
            return ((this.rawData[0] * this.rawData[5] - this.rawData[4] * this.rawData[1]) * (this.rawData[10] * this.rawData[15] - this.rawData[14] * this.rawData[11]) //
                - (this.rawData[0] * this.rawData[9] - this.rawData[8] * this.rawData[1]) * (this.rawData[6] * this.rawData[15] - this.rawData[14] * this.rawData[7]) //
                + (this.rawData[0] * this.rawData[13] - this.rawData[12] * this.rawData[1]) * (this.rawData[6] * this.rawData[11] - this.rawData[10] * this.rawData[7]) //
                + (this.rawData[4] * this.rawData[9] - this.rawData[8] * this.rawData[5]) * (this.rawData[2] * this.rawData[15] - this.rawData[14] * this.rawData[3]) //
                - (this.rawData[4] * this.rawData[13] - this.rawData[12] * this.rawData[5]) * (this.rawData[2] * this.rawData[11] - this.rawData[10] * this.rawData[3]) //
                + (this.rawData[8] * this.rawData[13] - this.rawData[12] * this.rawData[9]) * (this.rawData[2] * this.rawData[7] - this.rawData[6] * this.rawData[3]) //
            );
        }
        /**
         * 前方（+Z轴方向）
         */
        get forward() {
            var v = new feng3d.Vector3D(0.0, 0.0, 0.0);
            this.copyColumnTo(2, v);
            v.normalize();
            return v;
        }
        /**
         * 上方（+y轴方向）
         */
        get up() {
            var v = new feng3d.Vector3D();
            this.copyColumnTo(1, v);
            v.normalize();
            return v;
        }
        /**
         * 右方（+x轴方向）
         */
        get right() {
            var v = new feng3d.Vector3D();
            this.copyColumnTo(0, v);
            v.normalize();
            return v;
        }
        /**
         * 创建旋转矩阵
         * @param   degrees         角度
         * @param   axis            旋转轴
         * @param   pivotPoint      旋转中心点
         */
        static createRotationMatrix3D(degrees, axis) {
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
        }
        /**
         * 创建缩放矩阵
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        static createScaleMatrix3D(xScale, yScale, zScale) {
            var rotationMat = new Matrix3D([
                xScale, 0.0000, 0.0000, 0,
                0.0000, yScale, 0.0000, 0,
                0.0000, 0.0000, zScale, 0,
                0.0000, 0.0000, 0.0000, 1 //
            ]);
            return rotationMat;
        }
        /**
         * 创建位移矩阵
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        static createTranslationMatrix3D(x, y, z) {
            var rotationMat = new Matrix3D([
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                x, y, z, 1 //
            ]);
            return rotationMat;
        }
        /**
         * 通过将另一个 Matrix3D 对象与当前 Matrix3D 对象相乘来后置一个矩阵。
         */
        append(lhs) {
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
        }
        /**
         * 在 Matrix3D 对象上后置一个增量旋转。
         * @param   degrees         角度
         * @param   axis            旋转轴
         * @param   pivotPoint      旋转中心点
         */
        appendRotation(degrees, axis, pivotPoint = new feng3d.Vector3D()) {
            var rotationMat = Matrix3D.createRotationMatrix3D(degrees, axis);
            if (pivotPoint != null) {
                this.appendTranslation(-pivotPoint.x, -pivotPoint.y, -pivotPoint.z);
            }
            this.append(rotationMat);
            if (pivotPoint != null) {
                this.appendTranslation(pivotPoint.x, pivotPoint.y, pivotPoint.z);
            }
        }
        /**
         * 在 Matrix3D 对象上后置一个增量缩放，沿 x、y 和 z 轴改变位置。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        appendScale(xScale, yScale, zScale) {
            var scaleMat = Matrix3D.createScaleMatrix3D(xScale, yScale, zScale);
            this.append(scaleMat);
        }
        /**
         * 在 Matrix3D 对象上后置一个增量平移，沿 x、y 和 z 轴重新定位。
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        appendTranslation(x, y, z) {
            this.rawData[12] += x;
            this.rawData[13] += y;
            this.rawData[14] += z;
        }
        /**
         * 返回一个新 Matrix3D 对象，它是与当前 Matrix3D 对象完全相同的副本。
         */
        clone() {
            var ret = new Matrix3D();
            ret.copyFrom(this);
            return ret;
        }
        /**
         * 将 Vector3D 对象复制到调用方 Matrix3D 对象的特定列中。
         * @param   column      副本的目标列。
         * @param   vector3D    要从中复制数据的 Vector3D 对象。
         */
        copyColumnFrom(column, vector3D) {
            this.rawData[column * 4 + 0] = vector3D.x;
            this.rawData[column * 4 + 1] = vector3D.y;
            this.rawData[column * 4 + 2] = vector3D.z;
            this.rawData[column * 4 + 3] = vector3D.w;
        }
        /**
         * 将调用方 Matrix3D 对象的特定列复制到 Vector3D 对象中。
         * @param   column       要从中复制数据的列。
         * @param   vector3D     副本的目标 Vector3D 对象。
         */
        copyColumnTo(column, vector3D) {
            vector3D.x = this.rawData[column * 4 + 0];
            vector3D.y = this.rawData[column * 4 + 1];
            vector3D.z = this.rawData[column * 4 + 2];
            vector3D.w = this.rawData[column * 4 + 3];
        }
        /**
         * 将源 Matrix3D 对象中的所有矩阵数据复制到调用方 Matrix3D 对象中。
         * @param   sourceMatrix3D      要从中复制数据的 Matrix3D 对象。
         */
        copyFrom(sourceMatrix3D) {
            this.rawData.set(sourceMatrix3D.rawData);
        }
        /**
         * 将源 Vector 对象中的所有矢量数据复制到调用方 Matrix3D 对象中。利用可选索引参数，您可以选择矢量中的任何起始文字插槽。
         * @param   vector      要从中复制数据的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        copyRawDataFrom(vector, index = 0, transpose = false) {
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
        }
        /**
         * 将调用方 Matrix3D 对象中的所有矩阵数据复制到提供的矢量中。
         * @param   vector      要将数据复制到的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        copyRawDataTo(vector, index = 0, transpose = false) {
            if (transpose) {
                this.transpose();
            }
            for (var i = 0; i < 16; i++) {
                vector[i + index] = this.rawData[i];
            }
            if (transpose) {
                this.transpose();
            }
        }
        /**
         * 将 Vector3D 对象复制到调用方 Matrix3D 对象的特定行中。
         * @param   row         要将数据复制到的行。
         * @param   vector3D    要从中复制数据的 Vector3D 对象。
         */
        copyRowFrom(row, vector3D) {
            this.rawData[row + 4 * 0] = vector3D.x;
            this.rawData[row + 4 * 1] = vector3D.y;
            this.rawData[row + 4 * 2] = vector3D.z;
            this.rawData[row + 4 * 3] = vector3D.w;
        }
        /**
         * 将调用方 Matrix3D 对象的特定行复制到 Vector3D 对象中。
         * @param   row         要从中复制数据的行。
         * @param   vector3D    将作为数据复制目的地的 Vector3D 对象。
         */
        copyRowTo(row, vector3D) {
            vector3D.x = this.rawData[row + 4 * 0];
            vector3D.y = this.rawData[row + 4 * 1];
            vector3D.z = this.rawData[row + 4 * 2];
            vector3D.w = this.rawData[row + 4 * 3];
        }
        /**
         * 拷贝当前矩阵
         * @param   dest    目标矩阵
         */
        copyToMatrix3D(dest) {
            dest.rawData.set(this.rawData);
        }
        /**
         * 将转换矩阵的平移、旋转和缩放设置作为由三个 Vector3D 对象组成的矢量返回。
         * @return      一个由三个 Vector3D 对象组成的矢量，其中，每个对象分别容纳平移、旋转和缩放设置。
         */
        decompose() {
            var vec = [];
            var m = this.clone();
            var mr = m.rawData;
            var pos = new feng3d.Vector3D(mr[12], mr[13], mr[14]);
            mr[12] = 0;
            mr[13] = 0;
            mr[14] = 0;
            var scale = new feng3d.Vector3D();
            scale.x = Math.sqrt(mr[0] * mr[0] + mr[1] * mr[1] + mr[2] * mr[2]);
            scale.y = Math.sqrt(mr[4] * mr[4] + mr[5] * mr[5] + mr[6] * mr[6]);
            scale.z = Math.sqrt(mr[8] * mr[8] + mr[9] * mr[9] + mr[10] * mr[10]);
            if (mr[0] * (mr[5] * mr[10] - mr[6] * mr[9]) - mr[1] * (mr[4] * mr[10] - mr[6] * mr[8]) + mr[2] * (mr[4] * mr[9] - mr[5] * mr[8]) < 0)
                scale.z = -scale.z;
            mr[0] /= scale.x;
            mr[1] /= scale.x;
            mr[2] /= scale.x;
            mr[4] /= scale.y;
            mr[5] /= scale.y;
            mr[6] /= scale.y;
            mr[8] /= scale.z;
            mr[9] /= scale.z;
            mr[10] /= scale.z;
            var rot = new feng3d.Vector3D();
            rot.y = Math.asin(-mr[2]);
            if (mr[2] != 1 && mr[2] != -1) {
                rot.x = Math.atan2(mr[6], mr[10]);
                rot.z = Math.atan2(mr[1], mr[0]);
            }
            else {
                rot.z = 0;
                rot.x = Math.atan2(mr[4], mr[5]);
            }
            vec.push(pos);
            vec.push(rot);
            vec.push(scale);
            return vec;
        }
        /**
         * 使用不含平移元素的转换矩阵将 Vector3D 对象从一个空间坐标转换到另一个空间坐标。
         * @param   v   一个容纳要转换的坐标的 Vector3D 对象。
         * @return  一个包含转换后的坐标的 Vector3D 对象。
         */
        deltaTransformVector(v) {
            var tempx = this.rawData[12];
            var tempy = this.rawData[13];
            var tempz = this.rawData[14];
            this.rawData[12] = 0;
            this.rawData[13] = 0;
            this.rawData[14] = 0;
            var result = this.transformVector(v);
            this.rawData[12] = tempx;
            this.rawData[13] = tempy;
            this.rawData[14] = tempz;
            return result;
        }
        /**
         * 将当前矩阵转换为恒等或单位矩阵。
         */
        identity() {
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
        }
        /**
         * 反转当前矩阵。逆矩阵
         * @return      如果成功反转矩阵，则返回 true。
         */
        invert() {
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
            return invertable;
        }
        /**
         * 通过将当前 Matrix3D 对象与另一个 Matrix3D 对象相乘来前置一个矩阵。得到的结果将合并两个矩阵转换。
         * @param   rhs     个右侧矩阵，它与当前 Matrix3D 对象相乘。
         */
        prepend(rhs) {
            var mat = this.clone();
            this.copyFrom(rhs);
            this.append(mat);
        }
        /**
         * 在 Matrix3D 对象上前置一个增量旋转。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行旋转，然后再执行其他转换。
         * @param   degrees     旋转的角度。
         * @param   axis        旋转的轴或方向。常见的轴为 X_AXIS (Vector3D(1,0,0))、Y_AXIS (Vector3D(0,1,0)) 和 Z_AXIS (Vector3D(0,0,1))。此矢量的长度应为 1。
         * @param   pivotPoint  一个用于确定旋转中心的点。对象的默认轴点为该对象的注册点。
         */
        prependRotation(degrees, axis, pivotPoint = new feng3d.Vector3D()) {
            var rotationMat = Matrix3D.createRotationMatrix3D(degrees, axis);
            this.prepend(rotationMat);
        }
        /**
         * 在 Matrix3D 对象上前置一个增量缩放，沿 x、y 和 z 轴改变位置。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行缩放更改，然后再执行其他转换。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        prependScale(xScale, yScale, zScale) {
            var scaleMat = Matrix3D.createScaleMatrix3D(xScale, yScale, zScale);
            this.prepend(scaleMat);
        }
        /**
         * 在 Matrix3D 对象上前置一个增量平移，沿 x、y 和 z 轴重新定位。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行平移更改，然后再执行其他转换。
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        prependTranslation(x, y, z) {
            var translationMat = Matrix3D.createTranslationMatrix3D(x, y, z);
            this.prepend(translationMat);
        }
        /**
         * 设置转换矩阵的平移、旋转和缩放设置。
         * @param   components      一个由三个 Vector3D 对象组成的矢量，这些对象将替代 Matrix3D 对象的平移、旋转和缩放元素。
         */
        recompose(components) {
            this.identity();
            this.appendScale(components[2].x, components[2].y, components[2].z);
            this.appendRotation(components[1].x * feng3d.MathConsts.RADIANS_TO_DEGREES, feng3d.Vector3D.X_AXIS);
            this.appendRotation(components[1].y * feng3d.MathConsts.RADIANS_TO_DEGREES, feng3d.Vector3D.Y_AXIS);
            this.appendRotation(components[1].z * feng3d.MathConsts.RADIANS_TO_DEGREES, feng3d.Vector3D.Z_AXIS);
            this.appendTranslation(components[0].x, components[0].y, components[0].z);
        }
        /**
         * 使用转换矩阵将 Vector3D 对象从一个空间坐标转换到另一个空间坐标。
         * @param   vin   一个容纳要转换的坐标的 Vector3D 对象。
         * @return  一个包含转换后的坐标的 Vector3D 对象。
         */
        transformVector(vin, vout) {
            var x = vin.x;
            var y = vin.y;
            var z = vin.z;
            vout = vout || new feng3d.Vector3D();
            vout.x = x * this.rawData[0] + y * this.rawData[4] + z * this.rawData[8] + this.rawData[12];
            vout.y = x * this.rawData[1] + y * this.rawData[5] + z * this.rawData[9] + this.rawData[13];
            vout.z = x * this.rawData[2] + y * this.rawData[6] + z * this.rawData[10] + this.rawData[14];
            vout.w = x * this.rawData[3] + y * this.rawData[7] + z * this.rawData[11] + this.rawData[15];
            return vout;
        }
        /**
         * 使用转换矩阵将由数字构成的矢量从一个空间坐标转换到另一个空间坐标。
         * @param   vin     一个由多个数字组成的矢量，其中每三个数字构成一个要转换的 3D 坐标 (x,y,z)。
         * @param   vout    一个由多个数字组成的矢量，其中每三个数字构成一个已转换的 3D 坐标 (x,y,z)。
         */
        transformVectors(vin, vout) {
            var vec = new feng3d.Vector3D();
            for (var i = 0; i < vin.length; i += 3) {
                vec.setTo(vin[i], vin[i + 1], vin[i + 2]);
                vec = this.transformVector(vec);
                vout[i] = vec.x;
                vout[i + 1] = vec.y;
                vout[i + 2] = vec.z;
            }
        }
        /**
         * 将当前 Matrix3D 对象转换为一个矩阵，并将互换其中的行和列。
         */
        transpose() {
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
        }
        /**
         * 比较矩阵是否相等
         */
        compare(matrix3D, precision = 0.0001) {
            var r2 = matrix3D.rawData;
            for (var i = 0; i < 16; ++i) {
                if (Math.abs(this.rawData[i] - r2[i]) > precision)
                    return false;
            }
            return true;
        }
        /**
         * 以字符串返回矩阵的值
         */
        toString() {
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
        }
    }
    feng3d.Matrix3D = Matrix3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3d面
     */
    class Plane3D {
        /**
         * 创建一个平面
         * @param a		A系数
         * @param b		B系数
         * @param c		C系数
         * @param d		D系数
         */
        constructor(a = 0, b = 0, c = 0, d = 0) {
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
        /**
         * 通过3顶点定义一个平面
         * @param p0		点0
         * @param p1		点1
         * @param p2		点2
         */
        fromPoints(p0, p1, p2) {
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
        }
        /**
         * 根据法线与点定义平面
         * @param normal		平面法线
         * @param point			平面上任意一点
         */
        fromNormalAndPoint(normal, point) {
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
        }
        /**
         * 标准化平面
         * @return		标准化后的平面
         */
        normalize() {
            var len = 1 / Math.sqrt(this.a * this.a + this.b * this.b + this.c * this.c);
            this.a *= len;
            this.b *= len;
            this.c *= len;
            this.d *= len;
            return this;
        }
        /**
         * 计算点与平面的距离
         * @param p		点
         * @returns		距离
         */
        distance(p) {
            if (this._alignment == Plane3D.ALIGN_YZ_AXIS)
                return this.a * p.x - this.d;
            else if (this._alignment == Plane3D.ALIGN_XZ_AXIS)
                return this.b * p.y - this.d;
            else if (this._alignment == Plane3D.ALIGN_XY_AXIS)
                return this.c * p.z - this.d;
            else
                return this.a * p.x + this.b * p.y + this.c * p.z - this.d;
        }
        /**
         * 顶点分类
         * <p>把顶点分为后面、前面、相交三类</p>
         * @param p			顶点
         * @return			顶点类型 PlaneClassification.BACK,PlaneClassification.FRONT,PlaneClassification.INTERSECT
         * @see				feng3d.core.math.PlaneClassification
         */
        classifyPoint(p, epsilon = 0.01) {
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
        }
        /**
         * 输出字符串
         */
        toString() {
            return "Plane3D [this.a:" + this.a + ", this.b:" + this.b + ", this.c:" + this.c + ", this.d:" + this.d + "]";
        }
    }
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
    class PlaneClassification {
    }
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
     * 渲染模式
     * @author feng 2016-09-28
     */
    (function (RenderMode) {
        /**
         * 点渲染
         */
        RenderMode[RenderMode["POINTS"] = WebGLRenderingContext.POINTS] = "POINTS";
        RenderMode[RenderMode["LINE_LOOP"] = WebGLRenderingContext.LINE_LOOP] = "LINE_LOOP";
        RenderMode[RenderMode["LINE_STRIP"] = WebGLRenderingContext.LINE_STRIP] = "LINE_STRIP";
        RenderMode[RenderMode["LINES"] = WebGLRenderingContext.LINES] = "LINES";
        RenderMode[RenderMode["TRIANGLES"] = WebGLRenderingContext.TRIANGLES] = "TRIANGLES";
        RenderMode[RenderMode["TRIANGLE_STRIP"] = WebGLRenderingContext.TRIANGLE_STRIP] = "TRIANGLE_STRIP";
        RenderMode[RenderMode["TRIANGLE_FAN"] = WebGLRenderingContext.TRIANGLE_FAN] = "TRIANGLE_FAN";
    })(feng3d.RenderMode || (feng3d.RenderMode = {}));
    var RenderMode = feng3d.RenderMode;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染数据拥有者
     * @author feng 2016-6-7
     */
    class RenderDataHolder extends feng3d.Component {
        /**
         * 创建Context3D数据缓冲
         */
        constructor() {
            super();
            this.attributes = {};
            this.uniforms = {};
            this.shaderParams = {};
            this.addEventListener(feng3d.Context3DBufferEvent.GET_INDEXBUFFER, this.onGetIndexBuffer, this);
            this.addEventListener(feng3d.Context3DBufferEvent.GET_ATTRIBUTEBUFFER, this.onGetAttributeBuffer, this);
            this.addEventListener(feng3d.Context3DBufferEvent.GET_UNIFORMBUFFER, this.onGetUniformBuffer, this);
            this.addEventListener(feng3d.Context3DBufferEvent.GET_PROGRAMBUFFER, this.onGetProgramBuffer, this);
            this.addEventListener(feng3d.Context3DBufferEvent.GET_SHADERPARAM, this.onGetShaderParam, this);
        }
        /**
         * 映射索引缓冲
         */
        mapIndexBuffer(value) {
            var indexBuffer = this.indexBuffer = this.indexBuffer || new feng3d.IndexRenderData();
            indexBuffer.indices = value;
        }
        /**
         * 映射属性缓冲
         */
        mapAttributeBuffer(name, value, stride) {
            var attributeBuffer = this.attributes[name] = this.attributes[name] || new feng3d.AttributeRenderData();
            attributeBuffer.name = name;
            attributeBuffer.data = value;
            attributeBuffer.size = stride;
        }
        /**
         * 映射程序缓冲
         * @param vertexCode        顶点渲染程序代码
         * @param fragmentCode      片段渲染程序代码
         */
        mapProgram(vertexCode, fragmentCode) {
            var programBuffer = this.programBuffer = this.programBuffer || new feng3d.ProgramRenderData();
            programBuffer.vertexCode = vertexCode;
            programBuffer.fragmentCode = fragmentCode;
        }
        /**
         * 映射常量
         */
        mapUniform(name, data) {
            var uniformBuffer = this.uniforms[name] = this.uniforms[name] || new feng3d.UniformRenderData();
            uniformBuffer.name = name;
            uniformBuffer.data = data;
        }
        /**
         * 映射渲染参数
         */
        mapShaderParam(shaderParamID, param) {
            this.shaderParams[shaderParamID] = param;
        }
        /**
         * 处理获取索引缓冲事件
         */
        onGetIndexBuffer(event) {
            var eventData = event.data;
            eventData.buffer = eventData.buffer || this.indexBuffer;
        }
        /**
         * 处理获取属性缓冲事件
         */
        onGetAttributeBuffer(event) {
            var eventData = event.data;
            eventData.buffer = eventData.buffer || this.attributes[eventData.name];
        }
        /**
         * 处理获取缓冲事件
         */
        onGetUniformBuffer(event) {
            var eventData = event.data;
            eventData.buffer = eventData.buffer || this.uniforms[eventData.name];
        }
        /**
         * 处理获取缓冲事件
         */
        onGetProgramBuffer(event) {
            var eventData = event.data;
            eventData.buffer = eventData.buffer || this.programBuffer;
        }
        /**
         * 处理获取缓冲事件
         */
        onGetShaderParam(event) {
            var eventData = event.data;
            if (this.shaderParams[eventData.shaderParamID]) {
                eventData.data = this.shaderParams[eventData.shaderParamID];
            }
        }
    }
    feng3d.RenderDataHolder = RenderDataHolder;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D对象渲染数据
     * @author feng 2016-06-20
     */
    class RenderData {
        /**
         * 构建3D对象渲染数据
         */
        constructor(object3D) {
            /**
             * 渲染模式
             */
            this.renderMode = feng3d.RenderMode.TRIANGLES;
            this.renderBufferMap = new feng3d.Map();
            this.object3D = object3D;
        }
        /**
         * 获取3D对象渲染数据实例
         */
        static getInstance(object3D) {
            var renderData = this.renderDataMap.get(object3D);
            if (!renderData) {
                renderData = new RenderData(object3D);
                this.renderDataMap.push(object3D, renderData);
            }
            return renderData;
        }
        getRenderBuffer(context3D) {
            var renderBuffer = this.renderBufferMap.get(context3D);
            if (!renderBuffer) {
                renderBuffer = new feng3d.RenderBuffer(context3D, this);
                this.renderBufferMap.push(context3D, renderBuffer);
            }
            return renderBuffer;
        }
        /**
         * 准备数据
         */
        prepare() {
            this.prepareProgram();
            this.prepareIndex();
            this.prepareAttributes();
            this.prepareUniforms();
            this.prepareShaderParams();
        }
        /**
         * 准备程序
         */
        prepareProgram() {
            //从Object3D中获取程序数据
            var eventData = { buffer: null };
            this.object3D.dispatchChildrenEvent(new feng3d.Context3DBufferEvent(feng3d.Context3DBufferEvent.GET_PROGRAMBUFFER, eventData), Number.MAX_VALUE);
            feng3d.assert(eventData.buffer != null);
            this.programBuffer = eventData.buffer;
        }
        /**
         * 准备索引
         */
        prepareIndex() {
            //从Object3D中获取顶点索引数据
            var eventData = { buffer: null };
            this.object3D.dispatchChildrenEvent(new feng3d.Context3DBufferEvent(feng3d.Context3DBufferEvent.GET_INDEXBUFFER, eventData), Number.MAX_VALUE);
            feng3d.assert(eventData.buffer != null);
            this.indexBuffer = eventData.buffer;
        }
        /**
         * 准备属性
         */
        prepareAttributes() {
            this.attributes = feng3d.ShaderCodeUtils.getAttributes(this.programBuffer.vertexCode);
            for (var name in this.attributes) {
                //从Object3D中获取顶点属性数据
                var eventData = { name: name, buffer: null };
                this.object3D.dispatchChildrenEvent(new feng3d.Context3DBufferEvent(feng3d.Context3DBufferEvent.GET_ATTRIBUTEBUFFER, eventData), Number.MAX_VALUE);
                feng3d.assert(eventData.buffer != null);
                this.attributes[name].buffer = eventData.buffer;
            }
        }
        /**
         * 准备常量
         */
        prepareUniforms() {
            this.uniforms = this.programBuffer.getUniforms();
            for (var name in this.uniforms) {
                //从Object3D中获取常量数据
                var eventData = { name: name, buffer: null };
                this.object3D.dispatchChildrenEvent(new feng3d.Context3DBufferEvent(feng3d.Context3DBufferEvent.GET_UNIFORMBUFFER, eventData), Number.MAX_VALUE);
                feng3d.assert(eventData.buffer != null);
                this.uniforms[name].buffer = eventData.buffer;
            }
        }
        /**
         * 准备常量
         */
        prepareShaderParams() {
            //从Object3D中获取渲染参数
            var eventData = { shaderParamID: feng3d.ShaderParamID.renderMode, data: null };
            this.object3D.dispatchChildrenEvent(new feng3d.Context3DBufferEvent(feng3d.Context3DBufferEvent.GET_SHADERPARAM, eventData), Number.MAX_VALUE);
            if (eventData.data != null) {
                this.renderMode = eventData.data;
            }
        }
    }
    /**
     * 渲染数据字典
     */
    RenderData.renderDataMap = new feng3d.Map();
    feng3d.RenderData = RenderData;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染缓冲
     * @author feng 2016-06-20
     */
    class RenderBuffer {
        /**
         * 构建渲染缓冲
         * @param context3D     3D环境
         * @param renderData    渲染数据
         */
        constructor(context3D, renderData) {
            this.context3D = context3D;
            this.renderData = renderData;
        }
        /**
         * 激活缓冲
         */
        active() {
            this.renderData.prepare();
            this.activeProgram();
            this.activeAttributes();
            this.activeUniforms();
            this.draw();
        }
        /**
         * 激活程序
         */
        activeProgram() {
            var programBuffer = this.renderData.programBuffer;
            var shaderProgram = feng3d.context3DPool.getWebGLProgram(this.context3D, programBuffer.vertexCode, programBuffer.fragmentCode);
            this.context3D.useProgram(shaderProgram);
        }
        /**
         * 激活属性
         */
        activeAttributes() {
            var attributes = this.renderData.attributes;
            var locations = feng3d.ShaderCodeUtils.getAttribLocations(this.context3D, this.renderData.programBuffer.vertexCode, this.renderData.programBuffer.fragmentCode);
            for (var name in locations) {
                if (locations.hasOwnProperty(name)) {
                    var element = locations[name];
                    var buffer = attributes[name].buffer;
                    var squareVerticesBuffer = feng3d.context3DPool.getVABuffer(this.context3D, buffer.data);
                    this.context3D.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, squareVerticesBuffer);
                    this.context3D.vertexAttribPointer(element.location, 3, WebGLRenderingContext.FLOAT, false, 0, 0);
                }
            }
        }
        /**
         * 激活常量
         */
        activeUniforms() {
            var uniforms = this.renderData.uniforms;
            //获取属性在gpu中地址
            var programBuffer = this.renderData.programBuffer;
            var shaderProgram = feng3d.context3DPool.getWebGLProgram(this.context3D, programBuffer.vertexCode, programBuffer.fragmentCode);
            for (var name in uniforms) {
                if (uniforms.hasOwnProperty(name)) {
                    var item = uniforms[name];
                    var data = item.buffer.data;
                    var type = item.type;
                    var location = this.context3D.getUniformLocation(shaderProgram, name);
                    switch (type) {
                        case "mat4":
                            this.context3D.uniformMatrix4fv(location, false, data.rawData);
                            break;
                        case "vec4":
                            var vec4 = data;
                            this.context3D.uniform4f(location, vec4.x, vec4.y, vec4.z, vec4.w);
                            break;
                        default:
                            throw `无法识别的uniform类型 ${type}`;
                    }
                }
            }
        }
        /**
         */
        draw() {
            var indexBuffer = this.renderData.indexBuffer;
            var buffer = feng3d.context3DPool.getIndexBuffer(this.context3D, indexBuffer.indices);
            var count = indexBuffer.indices.length;
            this.context3D.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, buffer);
            this.context3D.drawElements(this.renderData.renderMode, count, WebGLRenderingContext.UNSIGNED_SHORT, 0);
        }
    }
    feng3d.RenderBuffer = RenderBuffer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染程序数据
     * @author feng 2016-05-09
     */
    class ProgramRenderData {
        /**
        * 获取程序常量列表
        */
        getUniforms() {
            var vertexUniforms = feng3d.ShaderCodeUtils.getUniforms(this.vertexCode);
            var fragmentUniforms = feng3d.ShaderCodeUtils.getUniforms(this.fragmentCode);
            var uniforms = vertexUniforms;
            for (var name in fragmentUniforms) {
                if (fragmentUniforms.hasOwnProperty(name)) {
                    var element = fragmentUniforms[name];
                    uniforms[name] = element;
                }
            }
            return uniforms;
        }
    }
    feng3d.ProgramRenderData = ProgramRenderData;
    /**
     * 索引渲染数据
     */
    class IndexRenderData {
    }
    feng3d.IndexRenderData = IndexRenderData;
    /**
     * 属性渲染数据
     * @author feng 2014-8-14
     */
    class AttributeRenderData {
    }
    feng3d.AttributeRenderData = AttributeRenderData;
    /**
     * 常量渲染数据
     */
    class UniformRenderData {
    }
    feng3d.UniformRenderData = UniformRenderData;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染代码工具
     * @author feng 2016-06-22
     */
    class ShaderCodeUtils {
        /**
         * 获取程序属性列表
         */
        static getAttributes(code) {
            var attributeReg = /attribute\s+(\w+)\s+(\w+)/g;
            var result = attributeReg.exec(code);
            var attributes = {}; //属性{类型，名称}
            while (result) {
                attributes[result[2]] = { type: result[1] };
                result = attributeReg.exec(code);
            }
            return attributes;
        }
        /**
         * 获取程序常量列表
         */
        static getUniforms(code) {
            var uniforms = {};
            var uniformReg = /uniform\s+(\w+)\s+(\w+)/g;
            var result = uniformReg.exec(code);
            while (result) {
                uniforms[result[2]] = { type: result[1] };
                result = uniformReg.exec(code);
            }
            return uniforms;
        }
        /**
         * 获取属性gpu地址
         */
        static getAttribLocations(context3D, vertexCode, fragmentCode) {
            var attributes = ShaderCodeUtils.getAttributes(vertexCode);
            //获取属性在gpu中地址
            var shaderProgram = feng3d.context3DPool.getWebGLProgram(context3D, vertexCode, fragmentCode);
            for (var name in attributes) {
                if (attributes.hasOwnProperty(name)) {
                    var element = attributes[name];
                    element.location = context3D.getAttribLocation(shaderProgram, name);
                    context3D.enableVertexAttribArray(element.location);
                }
            }
            return attributes;
        }
    }
    feng3d.ShaderCodeUtils = ShaderCodeUtils;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 对象池
     * @author feng 2016-04-26
     */
    class RenderBufferPool {
        constructor() {
            /**
             * 3D环境缓冲池
             */
            this.context3DBufferPools = {};
        }
        /**
         * @param context3D     3D环境
         */
        getContext3DBufferPool(context3D) {
            //获取3D环境唯一标识符
            var context3DUID = feng3d.getUID(context3D);
            return this.context3DBufferPools[context3DUID] = this.context3DBufferPools[context3DUID] || new Context3DBufferPool(context3D);
        }
        /**
         * 获取渲染程序
         * @param context3D     3D环境
         * @param vertexCode    顶点着色器代码
         * @param fragmentCode  片段着色器代码
         * @return  渲染程序
         */
        getWebGLProgram(context3D, vertexCode, fragmentCode) {
            var shaderCode = [vertexCode, fragmentCode].join("\n--- shaderCode ---\n");
            return this.getContext3DBufferPool(context3D).getWebGLProgram(vertexCode, fragmentCode);
        }
        /**
         * 获取顶点渲染程序
         * @param context3D         3D环境
         * @param vertexCode        顶点渲染代码
         * @return                  顶点渲染程序
         */
        getVertexShader(context3D, vertexCode) {
            return this.getContext3DBufferPool(context3D).getVertexShader(vertexCode);
        }
        /**
         * 获取顶点渲染程序
         * @param context3D         3D环境
         * @param fragmentCode      顶点渲染代码
         * @return                  顶点渲染程序
         */
        getFragmentShader(context3D, fragmentCode) {
            return this.getContext3DBufferPool(context3D).getFragmentShader(fragmentCode);
        }
        /**
         * 获取索引缓冲
         */
        getIndexBuffer(context3D, indices) {
            return this.getContext3DBufferPool(context3D).getIndexBuffer(indices);
        }
        /**
         * 获取顶点属性缓冲
         * @param data  数据
         */
        getVABuffer(context3D, data) {
            return this.getContext3DBufferPool(context3D).getVABuffer(data);
        }
    }
    feng3d.RenderBufferPool = RenderBufferPool;
    /**
     * 3D环境缓冲池
     */
    class Context3DBufferPool {
        /**
         * 构建3D环境缓冲池
         * @param context3D         3D环境
         */
        constructor(context3D) {
            /** 渲染程序对象池 */
            this.webGLProgramPool = {};
            /** 顶点渲染程序对象池 */
            this.vertexShaderPool = {};
            /** 顶点渲染程序对象池 */
            this.fragmentShaderPool = {};
            /**
             * 缓冲字典
             */
            this.bufferMap = {};
            this.context3D = context3D;
        }
        /**
         * 获取渲染程序
         * @param vertexCode    顶点着色器代码
         * @param fragmentCode  片段着色器代码
         * @return  渲染程序
         */
        getWebGLProgram(vertexCode, fragmentCode) {
            //获取3D环境唯一标识符
            var shaderCode = [vertexCode, fragmentCode].join("\n--- shaderCode ---\n");
            //获取3D环境中的渲染程序对象池
            return this.webGLProgramPool[shaderCode] = this.webGLProgramPool[shaderCode] || getWebGLProgram(this.context3D, vertexCode, fragmentCode);
        }
        /**
         * 获取顶点渲染程序
         * @param vertexCode        顶点渲染代码
         * @return                  顶点渲染程序
         */
        getVertexShader(vertexCode) {
            return this.vertexShaderPool[vertexCode] = this.vertexShaderPool[vertexCode] || getVertexShader(this.context3D, vertexCode);
        }
        /**
         * 获取顶点渲染程序
         * @param fragmentCode      顶点渲染代码
         * @return                  顶点渲染程序
         */
        getFragmentShader(fragmentCode) {
            return this.fragmentShaderPool[fragmentCode] = this.fragmentShaderPool[fragmentCode] || getFragmentShader(this.context3D, fragmentCode);
        }
        /**
         * 获取索引缓冲
         */
        getIndexBuffer(indices) {
            var indexBuffer = this.getBuffer(indices, WebGLRenderingContext.ELEMENT_ARRAY_BUFFER);
            return indexBuffer;
        }
        /**
         * 获取顶点属性缓冲
         * @param data  数据
         */
        getVABuffer(data) {
            var buffer = this.getBuffer(data, WebGLRenderingContext.ARRAY_BUFFER);
            return buffer;
        }
        /**
         * 获取缓冲
         * @param data  数据
         */
        getBuffer(data, target) {
            var context3D = this.context3D;
            var dataUID = feng3d.getUID(data);
            var buffer = this.bufferMap[dataUID] = this.bufferMap[dataUID] || context3D.createBuffer();
            if (!feng3d.version.equal(data, buffer)) {
                context3D.bindBuffer(target, buffer);
                context3D.bufferData(target, data, WebGLRenderingContext.STATIC_DRAW);
                feng3d.version.setVersion(buffer, feng3d.version.getVersion(data));
                //升级buffer和数据版本号一致
                var dataVersion = Math.max(0, feng3d.version.getVersion(data));
                feng3d.version.setVersion(data, dataVersion);
                feng3d.version.setVersion(buffer, dataVersion);
            }
            return buffer;
        }
    }
    /**
     * 获取WebGLProgram
     * @param context3D     3D环境上下文
     * @param vertexCode    顶点着色器代码
     * @param fragmentCode  片段着色器代码
     * @return  WebGL程序
     */
    function getWebGLProgram(context3D, vertexCode, fragmentCode) {
        var vertexShader = feng3d.context3DPool.getVertexShader(context3D, vertexCode);
        var fragmentShader = feng3d.context3DPool.getFragmentShader(context3D, fragmentCode);
        // 创建渲染程序
        var shaderProgram = context3D.createProgram();
        context3D.attachShader(shaderProgram, vertexShader);
        context3D.attachShader(shaderProgram, fragmentShader);
        context3D.linkProgram(shaderProgram);
        // 渲染程序创建失败时给出弹框
        if (!context3D.getProgramParameter(shaderProgram, context3D.LINK_STATUS)) {
            alert("无法初始化渲染程序。");
        }
        return shaderProgram;
    }
    /**
     * 获取顶点渲染程序
     * @param context3D         3D环境上下文
     * @param vertexCode        顶点渲染代码
     * @return                  顶点渲染程序
     */
    function getVertexShader(context3D, vertexCode) {
        var shader = context3D.createShader(WebGLRenderingContext.VERTEX_SHADER);
        shader = compileShader(context3D, shader, vertexCode);
        return shader;
    }
    /**
     * 获取片段渲染程序
     * @param context3D         3D环境上下文
     * @param fragmentCode      片段渲染代码
     * @return                  片段渲染程序
     */
    function getFragmentShader(context3D, fragmentCode) {
        var shader = context3D.createShader(WebGLRenderingContext.FRAGMENT_SHADER);
        shader = compileShader(context3D, shader, fragmentCode);
        return shader;
    }
    /**
     * 编译渲染程序
     * @param context3D         3D环境上下文
     * @param shader            渲染程序
     * @param shaderCode        渲染代码
     * @return                  完成编译的渲染程序
     */
    function compileShader(context3D, shader, shaderCode) {
        context3D.shaderSource(shader, shaderCode);
        context3D.compileShader(shader);
        if (!context3D.getShaderParameter(shader, context3D.COMPILE_STATUS)) {
            alert("编译渲染程序时发生错误: " + context3D.getShaderInfoLog(shader));
        }
        return shader;
    }
    /**
     * 3D环境对象池
     */
    feng3d.context3DPool = new RenderBufferPool();
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Context3D缓冲事件
     * @author feng 2016-05-26
     */
    class Context3DBufferEvent extends feng3d.Event {
    }
    /**
     * 获取AttributeBuffer
     */
    Context3DBufferEvent.GET_ATTRIBUTEBUFFER = "getAttributeBuffer";
    /**
     * 获取IndexBuffer
     */
    Context3DBufferEvent.GET_INDEXBUFFER = "getIndexBuffer";
    /**
     * 获取ProgramBuffer
     */
    Context3DBufferEvent.GET_PROGRAMBUFFER = "getProgramBuffer";
    /**
     * 获取UniformBuffer
     */
    Context3DBufferEvent.GET_UNIFORMBUFFER = "getUniformBuffer";
    /**
     * 获取UniformBuffer
     */
    Context3DBufferEvent.GET_SHADERPARAM = "getShaderParam";
    feng3d.Context3DBufferEvent = Context3DBufferEvent;
    /**
     * 获取AttributeBuffer事件数据
     */
    class GetAttributeBufferEventData {
    }
    feng3d.GetAttributeBufferEventData = GetAttributeBufferEventData;
    /**
     * 获取IndexBuffer事件数据
     */
    class GetIndexBufferEventData {
    }
    feng3d.GetIndexBufferEventData = GetIndexBufferEventData;
    /**
     * 获取ProgramBuffer事件数据
     */
    class GetProgramBufferEventData {
    }
    feng3d.GetProgramBufferEventData = GetProgramBufferEventData;
    /**
     * 获取UniformBuffer事件数据
     */
    class GetUniformBufferEventData {
    }
    feng3d.GetUniformBufferEventData = GetUniformBufferEventData;
    /**
     * 获取ShaderParam事件数据
     */
    class GetShaderParamEventData {
    }
    feng3d.GetShaderParamEventData = GetShaderParamEventData;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染数据编号
     * @author feng 2016-06-20
     */
    class RenderDataID {
    }
    /**
     * 顶点索引
     */
    RenderDataID.index = "index";
    /**
     * 模型矩阵
     */
    RenderDataID.uMVMatrix = "uMVMatrix";
    /**
     * 投影矩阵
     */
    RenderDataID.uPMatrix = "uPMatrix";
    RenderDataID.diffuseInput_fc_vector = "diffuseInput_fc_vector";
    feng3d.RenderDataID = RenderDataID;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染参数编号
     * @author feng 2016-10-15
     */
    (function (ShaderParamID) {
        /**
         * 渲染模式
         */
        ShaderParamID[ShaderParamID["renderMode"] = 0] = "renderMode";
    })(feng3d.ShaderParamID || (feng3d.ShaderParamID = {}));
    var ShaderParamID = feng3d.ShaderParamID;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染器
     * @author feng 2016-05-01
     */
    class Renderer {
        /**
         * 构建渲染器
         * @param context3D    webgl渲染上下文
         * @param scene 场景
         * @param camera 摄像机对象
         */
        constructor(context3D, scene, camera) {
            this.context3D = context3D;
            this.scene = scene;
            this.camera = camera;
            this.initGL();
        }
        /**
         * 初始化GL
         */
        initGL() {
            this.context3D.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
            this.context3D.clearDepth(1.0); // Clear everything
            this.context3D.enable(this.context3D.DEPTH_TEST); // Enable depth testing
            this.context3D.depthFunc(this.context3D.LEQUAL); // Near things obscure far things
        }
        /**
         * 渲染
         */
        render() {
            this.context3D.clear(this.context3D.COLOR_BUFFER_BIT | this.context3D.DEPTH_BUFFER_BIT);
            var renderables = this.scene.getRenderables();
            renderables.forEach(element => {
                this.drawObject3D(element);
            });
        }
        /**
         * 绘制3D对象
         */
        drawObject3D(object3D) {
            var context3DBuffer = object3D.getOrCreateComponentByClass(feng3d.RenderDataHolder);
            //模型矩阵
            var mvMatrix = object3D.sceneTransform3D;
            context3DBuffer.mapUniform(feng3d.RenderDataID.uMVMatrix, mvMatrix);
            //场景投影矩阵
            context3DBuffer.mapUniform(feng3d.RenderDataID.uPMatrix, this.camera.viewProjection);
            //绘制对象
            var renderData = feng3d.RenderData.getInstance(object3D);
            var object3DBuffer = renderData.getRenderBuffer(this.context3D);
            object3DBuffer.active();
        }
    }
    feng3d.Renderer = Renderer;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D对象
     * @author feng 2016-04-26
     */
    class Object3D extends feng3d.Component {
        /**
         * 构建3D对象
         */
        constructor(name, conponents = null) {
            super();
            this.name = name || feng3d.getClassName(this);
            conponents && conponents.forEach(element => {
                this.addComponent(element);
            });
            this.getOrCreateComponentByClass(feng3d.Material);
        }
        /**
         * 3D空间
         */
        get space3D() {
            return this.getOrCreateComponentByClass(feng3d.Space3D);
        }
        set space3D(value) {
            feng3d.assert(value != null, "3D空间不能为null");
            this.removeComponent(this.space3D);
            this.addComponent(value);
        }
        /**
         * 容器
         */
        get container3D() {
            return this.getOrCreateComponentByClass(feng3d.Container3D);
        }
        /**
         * 场景空间
         */
        get sceneSpace3D() {
            return this.getOrCreateComponentByClass(feng3d.SceneSpace3D);
        }
        /********************
         *
         * Container3D 组件中方法
         *
         *******************/
        /**
         * 父对象
         */
        get parent() { return this.container3D.parent; }
        /**
         * 添加子对象
         * @param child		子对象
         * @return			新增的子对象
         */
        addChild(child) { this.container3D.addChild(child); }
        /**
         * 添加子对象到指定位置
         * @param   child   子对象
         * @param   index   添加到的位置
         */
        addChildAt(child, index) { this.container3D.addChildAt(child, index); }
        /**
         * 移除子对象
         * @param   child   子对象
         * @return			被移除子对象索引
         */
        removeChild(child) { return this.container3D.removeChild(child); }
        /**
         * 获取子对象索引
         * @param   child   子对象
         * @return  子对象位置
         */
        getChildIndex(child) { return this.container3D.getChildIndex(child); }
        /**
         * 移出指定索引的子对象
         * @param childIndex	子对象索引
         * @return				被移除对象
         */
        removeChildAt(childIndex) { return this.container3D.removeChildAt(childIndex); }
        /**
         * 获取子对象
         * @param index         子对象索引
         * @return              指定索引的子对象
         */
        getChildAt(index) { return this.container3D.getChildAt(index); }
        /**
         * 获取子对象数量
         */
        get numChildren() { return this.container3D.numChildren; }
        ;
        /*********************
         *
         *********************/
        /**
         * 场景空间变换矩阵
         */
        get sceneTransform3D() { return this.sceneSpace3D.sceneTransform3D; }
        /**
         * 通知场景变换改变
         */
        notifySceneTransformChange() { this.sceneSpace3D.notifySceneTransformChange(); }
        /*********************
         *
         *********************/
        /**
         * 创建
         */
        static createPrimitive(type) {
            var object3D = new Object3D();
            switch (type) {
                case feng3d.PrimitiveType.Plane:
                    object3D.addComponent(feng3d.primitives.createPlane());
                    break;
                case feng3d.PrimitiveType.Cube:
                    object3D.addComponent(feng3d.primitives.createCube());
                    break;
                case feng3d.PrimitiveType.Sphere:
                    object3D.addComponent(feng3d.primitives.createSphere());
                    break;
                case feng3d.PrimitiveType.Capsule:
                    object3D.addComponent(feng3d.primitives.createCapsule());
                    break;
                case feng3d.PrimitiveType.Cylinder:
                    object3D.addComponent(feng3d.primitives.createCylinder());
                    break;
                default:
                    throw `无法创建3D基元对象 ${type}`;
            }
            return object3D;
        }
    }
    feng3d.Object3D = Object3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    class View3D {
        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        constructor(canvas, scene = null, camera = null) {
            feng3d.assert(canvas instanceof HTMLCanvasElement, `canvas参数必须为 HTMLCanvasElement 类型！`);
            this.canvas = canvas;
            this.context3d = this.canvas.getContext("experimental-webgl");
            this.context3d || alert("Unable to initialize WebGL. Your browser may not support it.");
            this.scene = scene || new feng3d.Scene3D();
            this.camera = camera || new feng3d.Camera3D();
            this.renderer = new feng3d.Renderer(this.context3d, this.scene, this._camera);
            setInterval(this.drawScene.bind(this), 15);
        }
        /** 3d场景 */
        get scene() {
            return this._scene;
        }
        set scene(value) {
            this._scene = value;
        }
        /**
         * 绘制场景
         */
        drawScene() {
            this.resize();
            this.renderer.render();
        }
        /**
         * 重置尺寸
         */
        resize() {
            if (this.renderWidth != this.canvas.width || this.renderHeight != this.canvas.height) {
                this.renderWidth = this.canvas.width;
                this.renderHeight = this.canvas.height;
                this.context3d.viewport(0, 0, this.renderWidth, this.renderHeight);
            }
        }
        /**
         * 摄像机
         */
        get camera() {
            return this._camera;
        }
        set camera(value) {
            this._camera = value;
        }
    }
    feng3d.View3D = View3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D对象组件
     * @author feng 2016-09-02
     */
    class Object3DComponent extends feng3d.Component {
        /**
         * 构建3D对象组件
         */
        constructor() {
            super();
        }
        /**
         * 所属对象
         */
        get object3D() { return this._parentComponent; }
    }
    feng3d.Object3DComponent = Object3DComponent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D空间
     * @author feng 2016-04-26
     */
    class Space3D extends feng3d.Object3DComponent {
        /**
         * 构建3D空间
         * @param x X坐标
         * @param y Y坐标
         * @param z Z坐标
         * @param rx X旋转
         * @param ry Y旋转
         * @param rz Z旋转
         * @param sx X缩放
         * @param sy Y缩放
         * @param sz Z缩放
         */
        constructor(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
            super();
            //private
            this._x = 0;
            this._y = 0;
            this._z = 0;
            this._rx = 0;
            this._ry = 0;
            this._rz = 0;
            this._sx = 1;
            this._sy = 1;
            this._sz = 1;
            this._transform3D = new feng3d.Matrix3D();
            this._inverseTransform = new feng3d.Matrix3D();
            this._x = x;
            this._y = y;
            this._z = z;
            this._rx = rx;
            this._ry = ry;
            this._rz = rz;
            this._sx = sx;
            this._sy = sy;
            this._sz = sz;
            this.invalidateTransform3D();
        }
        /**
         * X坐标
         */
        get x() { return this._x; }
        set x(value) { this._x = value; this.invalidateTransform3D(); }
        /**
         * Y坐标
         */
        get y() { return this._y; }
        set y(value) { this._y = value; this.invalidateTransform3D(); }
        /**
         * Z坐标
         */
        get z() { return this._z; }
        set z(value) { this._z = value; this.invalidateTransform3D(); }
        /**
         * X旋转
         */
        get rx() { return this._rx; }
        set rx(value) { this._rx = value; this.invalidateTransform3D(); }
        /**
         * Y旋转
         */
        get ry() { return this._ry; }
        set ry(value) { this._ry = value; this.invalidateTransform3D(); }
        /**
         * Z旋转
         */
        get rz() { return this._rz; }
        set rz(value) { this._rz = value; this.invalidateTransform3D(); }
        /**
         * X缩放
         */
        get sx() { return this._sx; }
        set sx(value) { this._sx = value; this.invalidateTransform3D(); }
        /**
         * Y缩放
         */
        get sy() { return this._sy; }
        set sy(value) { this._sy = value; this.invalidateTransform3D(); }
        /**
         * Z缩放
         */
        get sz() { return this._sz; }
        set sz(value) { this._sz = value; this.invalidateTransform3D(); }
        /**
         * 空间变换矩阵
         */
        get transform3D() {
            if (this._transform3DDirty)
                this.updateTransform3D();
            return this._transform3D;
        }
        set transform3D(value) {
            this._transform3DDirty = false;
            this._transform3D.rawData.set(value.rawData);
            var vecs = this._transform3D.decompose();
            this._x = vecs[0].x;
            this._y = vecs[0].y;
            this._z = vecs[0].z;
            this._rx = vecs[1].x * feng3d.MathConsts.RADIANS_TO_DEGREES;
            this._ry = vecs[1].y * feng3d.MathConsts.RADIANS_TO_DEGREES;
            this._rz = vecs[1].z * feng3d.MathConsts.RADIANS_TO_DEGREES;
            this._sx = vecs[2].x;
            this._sy = vecs[2].y;
            this._sz = vecs[2].z;
            this.invalidateTransform3D();
        }
        /**
         * 更新变换矩阵
         */
        updateTransform3D() {
            this._transform3D.recompose([
                new feng3d.Vector3D(this.x, this.y, this.z),
                new feng3d.Vector3D(this.rx * feng3d.MathConsts.DEGREES_TO_RADIANS, this.ry * feng3d.MathConsts.DEGREES_TO_RADIANS, this.rz * feng3d.MathConsts.DEGREES_TO_RADIANS),
                new feng3d.Vector3D(this.sx, this.sy, this.sz),
            ]);
            this._transform3DDirty = false;
        }
        /**
         * 使变换矩阵无效
         */
        invalidateTransform3D() {
            this._transform3DDirty = true;
            this._inverseTransformDirty = true;
            this.notifyTransformChanged();
        }
        get inverseTransform() {
            if (this._inverseTransformDirty) {
                this._inverseTransform.copyFrom(this.transform3D);
                this._inverseTransform.invert();
                this._inverseTransformDirty = false;
            }
            return this._inverseTransform;
        }
        /**
         * 发出状态改变消息
         */
        notifyTransformChanged() {
            var transformChanged = new Space3DEvent(Space3DEvent.TRANSFORM_CHANGED, this);
            this.object3D && this.object3D.dispatchEvent(transformChanged);
        }
        lookAt(target, upAxis = null) {
            var xAxis = new feng3d.Vector3D();
            var yAxis = new feng3d.Vector3D();
            var zAxis = new feng3d.Vector3D();
            upAxis = upAxis || feng3d.Vector3D.Y_AXIS;
            if (this._transform3DDirty)
                this.updateTransform3D();
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
            this._transform3D.rawData[0] = this._sx * xAxis.x;
            this._transform3D.rawData[1] = this._sx * xAxis.y;
            this._transform3D.rawData[2] = this._sx * xAxis.z;
            this._transform3D.rawData[3] = 0;
            this._transform3D.rawData[4] = this._sy * yAxis.x;
            this._transform3D.rawData[5] = this._sy * yAxis.y;
            this._transform3D.rawData[6] = this._sy * yAxis.z;
            this._transform3D.rawData[7] = 0;
            this._transform3D.rawData[8] = this._sz * zAxis.x;
            this._transform3D.rawData[9] = this._sz * zAxis.y;
            this._transform3D.rawData[10] = this._sz * zAxis.z;
            this._transform3D.rawData[11] = 0;
            this._transform3D.rawData[12] = this._x;
            this._transform3D.rawData[13] = this._y;
            this._transform3D.rawData[14] = this._z;
            this._transform3D.rawData[15] = 1;
            this.transform3D = this._transform3D;
            if (zAxis.z < 0) {
                this.ry = (180 - this.ry);
                this.rx -= 180;
                this.rz -= 180;
            }
        }
    }
    feng3d.Space3D = Space3D;
    /**
     * 3D对象事件(3D状态发生改变、位置、旋转、缩放)
     * @author feng 2014-3-31
     */
    class Space3DEvent extends feng3d.Event {
    }
    /**
     * 平移
     */
    Space3DEvent.POSITION_CHANGED = "positionChanged";
    /**
     * 旋转
     */
    Space3DEvent.ROTATION_CHANGED = "rotationChanged";
    /**
     * 缩放
     */
    Space3DEvent.SCALE_CHANGED = "scaleChanged";
    /**
     * 变换
     */
    Space3DEvent.TRANSFORM_CHANGED = "transformChanged";
    /**
     * 变换已更新
     */
    Space3DEvent.TRANSFORM_UPDATED = "transformUpdated";
    feng3d.Space3DEvent = Space3DEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D容器组件
     * @author feng 2016-04-26
     */
    class Container3D extends feng3d.Object3DComponent {
        /**
         * 构建3D容器组件
         */
        constructor() {
            super();
            /******************************************************************************************************************************
             * @private
             ******************************************************************************************************************************/
            /**
             * 父对象
             */
            this._parent = null;
            /**
             * 子对象列表
             */
            this.children = [];
        }
        /**
         * 父对象
         */
        get parent() {
            return this._parent;
        }
        /**
         * 添加子对象
         * @param child		子对象
         * @return			新增的子对象
         */
        addChild(child) {
            this.addChildAt(child, this.children.length);
        }
        /**
         * 添加子对象到指定位置
         * @param   child   子对象
         * @param   index   添加到的位置
         */
        addChildAt(child, index) {
            feng3d.assert(-1 < index && index <= this.children.length, "添加子对象的索引越界！");
            this.children.splice(index, 0, child);
            child.dispatchEvent(new feng3d.Container3DEvent(feng3d.Container3DEvent.ADDED, { parent: this.object3D, child: child }, true));
        }
        /**
         * 移除子对象
         * @param   child   子对象
         * @return			被移除子对象索引
         */
        removeChild(child) {
            var childIndex = this.children.indexOf(child);
            feng3d.assert(-1 < childIndex && childIndex < this.children.length, "删除的子对象不存在！");
            this.removeChildAt(childIndex);
            return childIndex;
        }
        /**
         * 获取子对象索引
         * @param   child   子对象
         * @return  子对象位置
         */
        getChildIndex(child) {
            return this.children.indexOf(child);
        }
        /**
         * 移出指定索引的子对象
         * @param childIndex	子对象索引
         * @return				被移除对象
         */
        removeChildAt(childIndex) {
            var child = this.children[childIndex];
            feng3d.assert(-1 < childIndex && childIndex < this.children.length, "删除的索引越界！");
            this.children.splice(childIndex, 1);
            child.dispatchEvent(new feng3d.Container3DEvent(feng3d.Container3DEvent.REMOVED, { parent: this.object3D, child: child }, true));
            return child;
        }
        /**
         * 获取子对象
         * @param index         子对象索引
         * @return              指定索引的子对象
         */
        getChildAt(index) {
            return this.children[index];
        }
        /**
         * 获取子对象数量
         */
        get numChildren() {
            return this.children.length;
        }
        /******************************************************************************************************************************
         * @protected
         ******************************************************************************************************************************/
        /**
         * 处理被添加组件事件
         */
        onBeAddedComponent(event) {
            //TODO 此处可以提供一个方法，向父组件中添加事件，当自身添加到父组件时自动添加监听，当自身从父组件移除时自动移除监听
            this.object3D.addEventListener(feng3d.Container3DEvent.ADDED, this.onAddedContainer3D, this);
            this.object3D.addEventListener(feng3d.Container3DEvent.REMOVED, this.onRemovedContainer3D, this);
        }
        /**
         * 处理被移除组件事件
         */
        onBeRemovedComponent(event) {
            this.object3D.addEventListener(feng3d.Container3DEvent.ADDED, this.onAddedContainer3D, this);
            this.object3D.addEventListener(feng3d.Container3DEvent.REMOVED, this.onRemovedContainer3D, this);
        }
        /**
         * 处理添加子对象事件
         */
        onAddedContainer3D(event) {
            if (event.data.child == this.object3D) {
                this._parent = event.data.parent;
            }
        }
        /**
         * 处理删除子对象事件
         */
        onRemovedContainer3D(event) {
            if (event.data.child == this.object3D) {
                this._parent = null;
            }
        }
    }
    feng3d.Container3D = Container3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D容器事件
     */
    class Container3DEvent extends feng3d.Event {
    }
    /**
     * 添加了子对象
     * data={parent: Object3D, child: Object3D}
     */
    Container3DEvent.ADDED = "added";
    /**
     * 删除了子对象
     * data={parent: Object3D, child: Object3D}
     */
    Container3DEvent.REMOVED = "removed";
    feng3d.Container3DEvent = Container3DEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D对象场景空间
     * @author feng 2016-09-02
     */
    class SceneSpace3D extends feng3d.Object3DComponent {
        /**
         * 构建3D对象场景空间
         */
        constructor() {
            super();
            //------------------------------------------
            //@private
            //------------------------------------------
            /**
             * 相对场景空间
             */
            this.sceneSpace3D = new feng3d.Space3D();
            this.sceneSpace3DDirty = true;
            this.addEventListener(feng3d.ComponentEvent.ADDED_COMPONENT, this.onBeAddedComponent, this);
        }
        /**
         * 场景空间变换矩阵
         */
        get sceneTransform3D() {
            this.sceneSpace3DDirty && this.updateSceneSpace3D();
            return this.sceneSpace3D.transform3D;
        }
        //------------------------------------------
        //@protected
        //------------------------------------------
        onBeAddedComponent(event) {
            this.object3D.addEventListener(feng3d.Space3DEvent.TRANSFORM_CHANGED, this.onTransformChanged, this);
        }
        /**
         * 使变换矩阵失效，场景变换矩阵也将失效
         */
        onTransformChanged(event) {
            this.notifySceneTransformChange();
        }
        /**
         * 通知场景变换改变
         */
        notifySceneTransformChange() {
            if (this.sceneSpace3DDirty)
                return;
            var sceneTransformChanged = new SceneSpace3DEvent(SceneSpace3DEvent.SCENETRANSFORM_CHANGED, this);
            this.object3D && this.object3D.dispatchEvent(sceneTransformChanged);
            if (this.object3D && this.object3D) {
                for (var i = 0; i < this.object3D.numChildren; i++) {
                    var element = this.object3D.getChildAt(i);
                    element.notifySceneTransformChange();
                }
            }
            this.invalidateSceneTransform();
        }
        /**
         * 场景变化失效
         */
        invalidateSceneTransform() {
            this.sceneSpace3DDirty = true;
        }
        /**
         * 更新场景空间
         */
        updateSceneSpace3D() {
            this.sceneSpace3DDirty = false;
            var transform3D = this.object3D.space3D.transform3D.clone();
            var parent = this.object3D.parent;
            if (parent != null) {
                var parentSceneTransform3D = parent.sceneTransform3D;
                transform3D.append(parentSceneTransform3D);
            }
            this.sceneSpace3D.transform3D = transform3D;
        }
    }
    feng3d.SceneSpace3D = SceneSpace3D;
    /**
     * 3D对象事件(3D状态发生改变、位置、旋转、缩放)
     * @author feng 2014-3-31
     */
    class SceneSpace3DEvent extends feng3d.Event {
    }
    /**
     * 场景变换矩阵发生变化
     */
    SceneSpace3DEvent.SCENETRANSFORM_CHANGED = "scenetransformChanged";
    feng3d.SceneSpace3DEvent = SceneSpace3DEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D场景节点
     */
    class Scene3DNode extends feng3d.EventDispatcher {
        /**
         * 构建3D场景节点
         * @param object3D 3D对象
         * @param parent 父节点
         */
        constructor(object3D, parent) {
            super();
            /**
             * 父节点
             */
            this.parent = null;
            /**
             * 子节点列表
             */
            this.children = [];
            this.object3D = object3D;
            this.parent = parent;
        }
        /**
         * 节点名称
         */
        get name() {
            return this.object3D.name;
        }
        set name(value) {
            this.object3D.name = value;
        }
        /**
         * 添加3D对象生成节点
         */
        addObject3D(object3D) {
            var child = new Scene3DNode(object3D, this);
            this.children.push(child);
            this.dispatchEvent(new feng3d.Scene3DEvent(feng3d.Scene3DEvent.ADDED, child, true));
            return this;
        }
        /**
         * 移除3D对象节点
         */
        removeObject(object3D) {
            var deletedChild;
            for (var i = 0; i < this.children.length; i++) {
                var element = this.children[i];
                if (element.object3D == object3D) {
                    this.children.splice(i, 1);
                    deletedChild = deletedChild;
                    this.dispatchEvent(new feng3d.Scene3DEvent(feng3d.Scene3DEvent.REMOVED, deletedChild, true));
                    break;
                }
            }
            return this;
        }
        /**
         * 根据名称深度查找节点
         * @param name 节点名称
         */
        find(name) {
            if (this.name == name) {
                return this;
            }
            for (var i = 0; i < this.children.length; i++) {
                var element = this.children[i];
                var target = element.find(name);
                if (target != null)
                    return target;
            }
            return null;
        }
        /**
         * 是否可渲染
         */
        get renderable() {
            return this.object3D != null;
        }
        /**
         * 获取可渲染对象列表
         */
        getRenderables(renderables = null) {
            renderables = renderables || [];
            this.renderable && renderables.push(this.object3D);
            this.children.forEach(element => {
                element.getRenderables(renderables);
            });
            return renderables;
        }
    }
    feng3d.Scene3DNode = Scene3DNode;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D场景
     * @author feng 2016-05-01
     */
    class Scene3D extends feng3d.Object3D {
        /**
         * 构造3D场景
         */
        constructor() {
            super("root");
            this._renderables = [];
            this.addEventListener(feng3d.Container3DEvent.ADDED, this.onAdded, this);
            this.addEventListener(feng3d.Container3DEvent.REMOVED, this.onRemoved, this);
        }
        /**
         * 处理添加对象事件
         */
        onAdded(event) {
            this._renderables.push(event.data.child);
        }
        /**
         * 处理添加对象事件
         */
        onRemoved(event) {
            var removedChild = event.data.child;
            var index = this._renderables.indexOf(removedChild);
            this._renderables.splice(index, 1);
        }
        /**
        * 获取可渲染对象列表
        */
        getRenderables() {
            return this._renderables;
        }
    }
    feng3d.Scene3D = Scene3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D场景事件
     * author feng 2016-05-01
     */
    class Scene3DEvent extends feng3d.Event {
        /**
         * 构建3D场景事件
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type, data = null, bubbles = false) {
            super(type, data, bubbles);
        }
    }
    /**
     * 添加3D场景节点
     */
    Scene3DEvent.ADDED = "scene3D_added";
    /**
     * 删除3D场景节点
     */
    Scene3DEvent.REMOVED = "scene3D_removed";
    feng3d.Scene3DEvent = Scene3DEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * opengl顶点属性名称
     */
    class GLAttribute {
    }
    /**
     * 坐标
     */
    GLAttribute.position = "vaPosition";
    /**
     * 法线
     */
    GLAttribute.normal = "vaNormal";
    /**
     * 切线
     */
    GLAttribute.tangent = "vaTangent";
    /**
     * uv（纹理坐标）
     */
    GLAttribute.uv = "vaUV";
    feng3d.GLAttribute = GLAttribute;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 几何体
     * @author feng 2016-04-28
     */
    class Geometry extends feng3d.RenderDataHolder {
        /**
         * 创建一个几何体
         */
        constructor() {
            super();
            this._vaIdList = [];
            /** 顶点属性数据步长字典 */
            this.strideObj = {};
            /** 顶点属性数据字典 */
            this.vaDataObj = {};
        }
        /**
         * 索引数据
         */
        get indices() {
            return this._indices;
        }
        /**
         * 更新顶点索引数据
         */
        set indices(value) {
            this._indices = value;
            this.mapIndexBuffer(value);
            this.dispatchEvent(new feng3d.GeometryEvent(feng3d.GeometryEvent.CHANGED_INDEX_DATA));
        }
        /**
         * 获取顶点属性步长(1-4)
         * @param vaId          顶点属性编号
         * @return 顶点属性步长
         */
        getVAStride(vaId) {
            return this.strideObj[vaId];
        }
        /**
         * 设置顶点属性数据
         * @param vaId          顶点属性编号
         * @param data          顶点属性数据
         * @param stride        顶点数据步长
         */
        setVAData(vaId, data, stride) {
            this.strideObj[vaId] = stride;
            this.vaDataObj[vaId] = data;
            this.mapAttributeBuffer(vaId, data, stride);
            this.dispatchEvent(new feng3d.GeometryEvent(feng3d.GeometryEvent.CHANGED_VA_DATA, vaId));
        }
        /**
         * 获取顶点属性数据
         * @param vaId 数据类型编号
         * @return 顶点属性数据
         */
        getVAData(vaId) {
            this.dispatchEvent(new feng3d.GeometryEvent(feng3d.GeometryEvent.GET_VA_DATA, vaId));
            return this.vaDataObj[vaId];
        }
        /**
         * 顶点属性编号列表
         */
        get vaIdList() {
            return this._vaIdList;
        }
    }
    feng3d.Geometry = Geometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 几何体事件
     * @author feng 2015-12-8
     */
    class GeometryEvent extends feng3d.Event {
        /**
         * 构建几何体事件
         */
        constructor(type, data = null, bubbles = false) {
            super(type, data, bubbles);
        }
    }
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
    feng3d.GeometryEvent = GeometryEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 几何体组件
     */
    class GeometryComponent extends feng3d.Component {
        /**
         * 构建几何体组件
         */
        constructor() {
            super();
        }
        /**
         * 所属对象
         */
        get geometry() { return this._parentComponent; }
    }
    feng3d.GeometryComponent = GeometryComponent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 线段组件
     * @author feng 2016-10-16
     */
    class SegmentGeometry extends feng3d.GeometryComponent {
        constructor() {
            super(...arguments);
            /**
             * 几何体是否变脏
             */
            this.geometryDirty = false;
            this._segments = [];
        }
        /**
         * 添加线段
         * @param segment		线段数据
         */
        addSegment(segment, needUpdateGeometry = true) {
            this._segments.push(segment);
            this.geometryDirty = true;
            this.updateGeometry();
        }
        /**
         * 更新几何体
         */
        updateGeometry() {
            this.geometryDirty = false;
            var segmentPositionStep = 6;
            var numSegments = this._segments.length;
            var indices = new Uint16Array(numSegments * 2);
            var positionData = new Float32Array(numSegments * segmentPositionStep);
            for (var i = 0; i < numSegments; i++) {
                var element = this._segments[i];
                indices.set([i * 2, i * 2 + 1], i * 2);
                positionData.set(element.positionData, i * segmentPositionStep);
            }
            this.geometry.setVAData(feng3d.GLAttribute.position, positionData, 3);
            this.geometry.indices = indices;
        }
        /**
         * 获取线段数据
         * @param index 		线段索引
         * @return				线段数据
         */
        getSegment(index) {
            if (index < this._segments.length)
                return this._segments[index];
            return null;
        }
        /**
         * 移除所有线段
         */
        removeAllSegments() {
            this.segments.length = 0;
            this.geometryDirty = true;
        }
        /**
         * 线段列表
         */
        get segments() {
            return this._segments;
        }
    }
    feng3d.SegmentGeometry = SegmentGeometry;
    /**
     * 线段
     * @author feng 2016-10-16
     */
    class Segment {
        /**
         * 创建线段
         * @param start 起点坐标
         * @param end 终点坐标
         * @param colorStart 起点颜色
         * @param colorEnd 终点颜色
         * @param thickness 线段厚度
         */
        constructor(start, end, colorStart = 0x333333, colorEnd = 0x333333, thickness = 1) {
            this.thickness = thickness * .5;
            this.start = start;
            this.end = end;
            this.startColor = colorStart;
            this.endColor = colorEnd;
        }
        /**
         * 坐标数据
         */
        get positionData() {
            return [this.start.x, this.start.y, this.start.z, this.end.x, this.end.y, this.end.z];
        }
    }
    feng3d.Segment = Segment;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 镜头事件
     * @author feng 2014-10-14
     */
    class LensEvent extends feng3d.Event {
        /**
         * 创建一个镜头事件。
         * @param type      事件的类型
         * @param lens      镜头
         * @param bubbles   确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type, lens = null, bubbles = false) {
            super(type, lens, bubbles);
        }
    }
    LensEvent.MATRIX_CHANGED = "matrixChanged";
    feng3d.LensEvent = LensEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 坐标系统类型
     * @author feng 2014-10-14
     */
    class CoordinateSystem {
    }
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
    class LensBase extends feng3d.Component {
        /**
         * 创建一个摄像机镜头
         */
        constructor() {
            super();
            this._scissorRect = new feng3d.Rectangle();
            this._viewPort = new feng3d.Rectangle();
            this._near = 0.1;
            this._far = 3000;
            this._aspectRatio = 1;
            this._matrixInvalid = true;
            this._unprojectionInvalid = true;
            this._matrix = new feng3d.Matrix3D();
        }
        /**
         * 投影矩阵
         */
        get matrix() {
            if (this._matrixInvalid) {
                this.updateMatrix();
                this._matrixInvalid = false;
            }
            return this._matrix;
        }
        set matrix(value) {
            this._matrix = value;
            this.invalidateMatrix();
        }
        /**
         * 最近距离
         */
        get near() {
            return this._near;
        }
        set near(value) {
            if (value == this._near)
                return;
            this._near = value;
            this.invalidateMatrix();
        }
        /**
         * 最远距离
         */
        get far() {
            return this._far;
        }
        set far(value) {
            if (value == this._far)
                return;
            this._far = value;
            this.invalidateMatrix();
        }
        /**
         * 视窗缩放比例(width/height)，在渲染器中设置
         */
        get aspectRatio() {
            return this._aspectRatio;
        }
        set aspectRatio(value) {
            if (this._aspectRatio == value || (value * 0) != 0)
                return;
            this._aspectRatio = value;
            this.invalidateMatrix();
        }
        /**
         * 场景坐标投影到屏幕坐标
         * @param point3d 场景坐标
         * @param v 屏幕坐标（输出）
         * @return 屏幕坐标
         */
        project(point3d, v = null) {
            if (!v)
                v = new feng3d.Vector3D();
            this.matrix.transformVector(point3d, v);
            v.x = v.x / v.w;
            v.y = -v.y / v.w;
            v.z = point3d.z;
            return v;
        }
        /**
         * 投影逆矩阵
         */
        get unprojectionMatrix() {
            if (this._unprojectionInvalid) {
                if (this._unprojection == null)
                    this._unprojection = new feng3d.Matrix3D();
                this._unprojection.copyFrom(this.matrix);
                this._unprojection.invert();
                this._unprojectionInvalid = false;
            }
            return this._unprojection;
        }
        /**
         * 投影矩阵失效
         */
        invalidateMatrix() {
            this._matrixInvalid = true;
            this._unprojectionInvalid = true;
            this.dispatchEvent(new feng3d.LensEvent(feng3d.LensEvent.MATRIX_CHANGED, this));
        }
    }
    feng3d.LensBase = LensBase;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 透视摄像机镜头
     * @author feng 2014-10-14
     */
    class PerspectiveLens extends feng3d.LensBase {
        /**
         * 创建一个透视摄像机镜头
         * @param fieldOfView 视野
         * @param coordinateSystem 坐标系统类型
         */
        constructor(fieldOfView = 60, coordinateSystem = feng3d.CoordinateSystem.LEFT_HANDED) {
            super();
            this.fieldOfView = fieldOfView;
            this.coordinateSystem = coordinateSystem;
        }
        /**
         * 视野
         */
        get fieldOfView() {
            return this._fieldOfView;
        }
        set fieldOfView(value) {
            if (value == this._fieldOfView)
                return;
            this._fieldOfView = value;
            this._focalLengthInv = Math.tan(this._fieldOfView * Math.PI / 360);
            this._focalLength = 1 / this._focalLengthInv;
            this.invalidateMatrix();
        }
        /**
         * 焦距
         */
        get focalLength() {
            return this._focalLength;
        }
        set focalLength(value) {
            if (value == this._focalLength)
                return;
            this._focalLength = value;
            this._focalLengthInv = 1 / this._focalLength;
            this._fieldOfView = Math.atan(this._focalLengthInv) * 360 / Math.PI;
            this.invalidateMatrix();
        }
        unproject(nX, nY, sZ, v = null) {
            if (!v)
                v = new feng3d.Vector3D();
            v.x = nX;
            v.y = -nY;
            v.z = sZ;
            v.w = 1;
            v.x *= sZ;
            v.y *= sZ;
            this.unprojectionMatrix.transformVector(v, v);
            v.z = sZ;
            return v;
        }
        /**
         * 坐标系类型
         */
        get coordinateSystem() {
            return this._coordinateSystem;
        }
        set coordinateSystem(value) {
            if (value == this._coordinateSystem)
                return;
            this._coordinateSystem = value;
            this.invalidateMatrix();
        }
        /**
         * 更新投影矩阵
         */
        updateMatrix() {
            var raw = tempRawData;
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
            this._matrixInvalid = false;
        }
    }
    feng3d.PerspectiveLens = PerspectiveLens;
    /**
     * 临时矩阵数据
     */
    var tempRawData = new Float32Array(16);
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 摄像机
     * @author feng 2016-08-16
     */
    class Camera3D extends feng3d.Object3D {
        /**
         * 创建一个摄像机
         * @param lens 摄像机镜头
         */
        constructor(lens = null) {
            super();
            this._viewProjection = new feng3d.Matrix3D();
            this._viewProjectionDirty = true;
            this._lens = lens || new feng3d.PerspectiveLens();
            this._lens.addEventListener(feng3d.LensEvent.MATRIX_CHANGED, this.onLensMatrixChanged, this);
            this.addEventListener(feng3d.Space3DEvent.TRANSFORM_CHANGED, this.onSpaceTransformChanged, this);
        }
        /**
         * 场景投影矩阵，世界空间转投影空间
         */
        get viewProjection() {
            if (this._viewProjectionDirty) {
                var inverseSceneTransform = this.space3D.transform3D.clone();
                inverseSceneTransform.invert();
                //场景空间转摄像机空间
                this._viewProjection.copyFrom(inverseSceneTransform);
                //+摄像机空间转投影空间 = 场景空间转投影空间
                this._viewProjection.append(this._lens.matrix);
                this._viewProjectionDirty = false;
            }
            return this._viewProjection;
        }
        /**
         * 处理镜头变化事件
         */
        onLensMatrixChanged(event) {
            this._viewProjectionDirty = true;
            this.dispatchEvent(event);
        }
        onSpaceTransformChanged(event) {
            this._viewProjectionDirty = true;
        }
    }
    feng3d.Camera3D = Camera3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D基元类型
     * @author feng 2016-05-01
     */
    (function (PrimitiveType) {
        /**
         * 平面
         */
        PrimitiveType[PrimitiveType["Plane"] = 0] = "Plane";
        /**
         * 立方体
         */
        PrimitiveType[PrimitiveType["Cube"] = 1] = "Cube";
        /**
         * 球体
         */
        PrimitiveType[PrimitiveType["Sphere"] = 2] = "Sphere";
        /**
         * 胶囊
         */
        PrimitiveType[PrimitiveType["Capsule"] = 3] = "Capsule";
        /**
         * 圆柱体
         */
        PrimitiveType[PrimitiveType["Cylinder"] = 4] = "Cylinder";
    })(feng3d.PrimitiveType || (feng3d.PrimitiveType = {}));
    var PrimitiveType = feng3d.PrimitiveType;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var primitives;
    (function (primitives) {
        /**
         * 创建平面几何体
         * @param width 宽度
         * @param height 高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         * @param elements 顶点元素列表
         */
        function createPlane(width = 100, height = 100, segmentsW = 1, segmentsH = 1, yUp = true, elements = [feng3d.GLAttribute.position, feng3d.GLAttribute.uv, feng3d.GLAttribute.normal, feng3d.GLAttribute.tangent]) {
            var geometry = new feng3d.Geometry();
            elements.forEach(element => {
                switch (element) {
                    case feng3d.GLAttribute.position:
                        var vertexPositionData = buildPosition(width, height, segmentsW, segmentsH, yUp);
                        geometry.setVAData(element, vertexPositionData, 3);
                        break;
                    case feng3d.GLAttribute.normal:
                        var vertexNormalData = buildNormal(segmentsW, segmentsH, yUp);
                        geometry.setVAData(element, vertexNormalData, 3);
                        break;
                    case feng3d.GLAttribute.tangent:
                        var vertexTangentData = buildTangent(segmentsW, segmentsH, yUp);
                        geometry.setVAData(element, vertexTangentData, 3);
                        break;
                    case feng3d.GLAttribute.uv:
                        var uvData = buildUVs(segmentsW, segmentsH);
                        geometry.setVAData(element, uvData, 2);
                        break;
                    default:
                        throw (`不支持为平面创建顶点属性 ${element}`);
                }
            });
            var indices = buildIndices(segmentsW, segmentsH, yUp);
            geometry.indices = indices;
            return geometry;
        }
        primitives.createPlane = createPlane;
        /**
         * 构建顶点坐标
         * @param width 宽度
         * @param height 高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        function buildPosition(width = 100, height = 100, segmentsW = 1, segmentsH = 1, yUp = true) {
            var vertexPositionData = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 3);
            var x, y;
            var positionIndex = 0;
            for (var yi = 0; yi <= segmentsH; ++yi) {
                for (var xi = 0; xi <= segmentsW; ++xi) {
                    x = (xi / segmentsW - .5) * width;
                    y = (yi / segmentsH - .5) * height;
                    //设置坐标数据
                    vertexPositionData[positionIndex++] = x;
                    if (yUp) {
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
        }
        /**
         * 构建顶点法线
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        function buildNormal(segmentsW = 1, segmentsH = 1, yUp = true) {
            var vertexNormalData = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 3);
            var normalIndex = 0;
            for (var yi = 0; yi <= segmentsH; ++yi) {
                for (var xi = 0; xi <= segmentsW; ++xi) {
                    //设置法线数据
                    vertexNormalData[normalIndex++] = 0;
                    if (yUp) {
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
        }
        /**
         * 构建顶点切线
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        function buildTangent(segmentsW = 1, segmentsH = 1, yUp = true) {
            var vertexTangentData = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 3);
            var tangentIndex = 0;
            for (var yi = 0; yi <= segmentsH; ++yi) {
                for (var xi = 0; xi <= segmentsW; ++xi) {
                    vertexTangentData[tangentIndex++] = 1;
                    vertexTangentData[tangentIndex++] = 0;
                    vertexTangentData[tangentIndex++] = 0;
                }
            }
            return vertexTangentData;
        }
        /**
         * 构建顶点索引
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        function buildIndices(segmentsW = 1, segmentsH = 1, yUp = true) {
            var indices = new Uint16Array(segmentsH * segmentsW * 6);
            var tw = segmentsW + 1;
            var numIndices = 0;
            var base;
            for (var yi = 0; yi <= segmentsH; ++yi) {
                for (var xi = 0; xi <= segmentsW; ++xi) {
                    //生成索引数据
                    if (xi != segmentsW && yi != segmentsH) {
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
        }
        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        function buildUVs(segmentsW = 1, segmentsH = 1) {
            var data = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 2);
            var index = 0;
            for (var yi = 0; yi <= this._segmentsH; ++yi) {
                for (var xi = 0; xi <= this._segmentsW; ++xi) {
                    data[index++] = xi / this._segmentsW;
                    data[index++] = 1 - yi / this._segmentsH;
                    if (this._doubleSided) {
                        data[index++] = xi / this._segmentsW;
                        data[index++] = 1 - yi / this._segmentsH;
                    }
                }
            }
            return data;
        }
    })(primitives = feng3d.primitives || (feng3d.primitives = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var primitives;
    (function (primitives) {
        /**
         * 创建立方几何体
         * @param   width           宽度
         * @param   height          高度
         * @param   depth           深度
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         * @param   tile6           是否为6块贴图
         * @param   elements        需要生成数据的属性
         */
        function createCube(width = 100, height = 100, depth = 100, segmentsW = 1, segmentsH = 1, segmentsD = 1, tile6 = true, elements = [feng3d.GLAttribute.position, feng3d.GLAttribute.uv, feng3d.GLAttribute.normal, feng3d.GLAttribute.tangent]) {
            var geometry = new feng3d.Geometry();
            elements.forEach(element => {
                switch (element) {
                    case feng3d.GLAttribute.position:
                        var vertexPositionData = buildPosition(width, height, depth, segmentsW, segmentsH, segmentsD);
                        geometry.setVAData(element, vertexPositionData, 3);
                        break;
                    case feng3d.GLAttribute.normal:
                        var vertexNormalData = buildNormal(segmentsW, segmentsH, segmentsD);
                        geometry.setVAData(element, vertexNormalData, 3);
                        break;
                    case feng3d.GLAttribute.tangent:
                        var vertexTangentData = buildTangent(segmentsW, segmentsH, segmentsD);
                        geometry.setVAData(element, vertexTangentData, 3);
                        break;
                    case feng3d.GLAttribute.uv:
                        var uvData = buildUVs(segmentsW, segmentsH, segmentsD, tile6);
                        geometry.setVAData(element, uvData, 2);
                        break;
                    default:
                        throw (`不支持为平面创建顶点属性 ${element}`);
                }
            });
            var indices = buildIndices(segmentsW, segmentsH, segmentsD);
            geometry.indices = indices;
            return geometry;
        }
        primitives.createCube = createCube;
        /**
         * 构建坐标
         * @param   width           宽度
         * @param   height          高度
         * @param   depth           深度
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        function buildPosition(width = 100, height = 100, depth = 100, segmentsW = 1, segmentsH = 1, segmentsD = 1) {
            var vertexPositionData = new Float32Array(((segmentsW + 1) * (segmentsH + 1) + (segmentsW + 1) * (segmentsD + 1) + (segmentsH + 1) * (segmentsD + 1)) * 2 * 3);
            var i, j;
            var hw, hh, hd; // halves
            var dw, dh, dd; // deltas
            var outer_pos;
            // Indices
            var positionIndex = 0;
            // half cube dimensions
            hw = width / 2;
            hh = height / 2;
            hd = depth / 2;
            // Segment dimensions
            dw = width / segmentsW;
            dh = height / segmentsH;
            dd = depth / segmentsD;
            for (i = 0; i <= segmentsW; i++) {
                outer_pos = -hw + i * dw;
                for (j = 0; j <= segmentsH; j++) {
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
            for (i = 0; i <= segmentsW; i++) {
                outer_pos = -hw + i * dw;
                for (j = 0; j <= segmentsD; j++) {
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
            for (i = 0; i <= segmentsD; i++) {
                outer_pos = hd - i * dd;
                for (j = 0; j <= segmentsH; j++) {
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
        }
        /**
         * 构建法线
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        function buildNormal(segmentsW = 1, segmentsH = 1, segmentsD = 1) {
            var vertexNormalData = new Float32Array(((segmentsW + 1) * (segmentsH + 1) + (segmentsW + 1) * (segmentsD + 1) + (segmentsH + 1) * (segmentsD + 1)) * 2 * 3);
            var i, j;
            // Indices
            var normalIndex = 0;
            for (i = 0; i <= segmentsW; i++) {
                for (j = 0; j <= segmentsH; j++) {
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
            for (i = 0; i <= segmentsW; i++) {
                for (j = 0; j <= segmentsD; j++) {
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
            for (i = 0; i <= segmentsD; i++) {
                for (j = 0; j <= segmentsH; j++) {
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
        }
        /**
         * 构建切线
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        function buildTangent(segmentsW = 1, segmentsH = 1, segmentsD = 1) {
            var vertexTangentData = new Float32Array(((segmentsW + 1) * (segmentsH + 1) + (segmentsW + 1) * (segmentsD + 1) + (segmentsH + 1) * (segmentsD + 1)) * 2 * 3);
            var i, j;
            // Indices
            var tangentIndex = 0;
            for (i = 0; i <= segmentsW; i++) {
                for (j = 0; j <= segmentsH; j++) {
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
            for (i = 0; i <= segmentsW; i++) {
                for (j = 0; j <= segmentsD; j++) {
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
            for (i = 0; i <= segmentsD; i++) {
                for (j = 0; j <= segmentsH; j++) {
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
        }
        /**
         * 构建索引
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        function buildIndices(segmentsW = 1, segmentsH = 1, segmentsD = 1) {
            var indices = new Uint16Array((segmentsW * segmentsH + segmentsW * segmentsD + segmentsH * segmentsD) * 12);
            var tl, tr, bl, br;
            var i, j, inc = 0;
            var fidx = 0;
            for (i = 0; i <= segmentsW; i++) {
                for (j = 0; j <= segmentsH; j++) {
                    // front
                    // back
                    if (i && j) {
                        tl = 2 * ((i - 1) * (segmentsH + 1) + (j - 1));
                        tr = 2 * (i * (segmentsH + 1) + (j - 1));
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
            inc += 2 * (segmentsW + 1) * (segmentsH + 1);
            for (i = 0; i <= segmentsW; i++) {
                for (j = 0; j <= segmentsD; j++) {
                    // top
                    // bottom
                    if (i && j) {
                        tl = inc + 2 * ((i - 1) * (segmentsD + 1) + (j - 1));
                        tr = inc + 2 * (i * (segmentsD + 1) + (j - 1));
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
            inc += 2 * (segmentsW + 1) * (segmentsD + 1);
            for (i = 0; i <= segmentsD; i++) {
                for (j = 0; j <= segmentsH; j++) {
                    // left
                    // right
                    if (i && j) {
                        tl = inc + 2 * ((i - 1) * (segmentsH + 1) + (j - 1));
                        tr = inc + 2 * (i * (segmentsH + 1) + (j - 1));
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
        }
        /**
         * 构建uv
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         * @param   tile6           是否为6块贴图
         */
        function buildUVs(segmentsW = 1, segmentsH = 1, segmentsD = 1, tile6 = true) {
            var i, j, uidx;
            var data = new Float32Array(((segmentsW + 1) * (segmentsH + 1) + (segmentsW + 1) * (segmentsD + 1) + (segmentsH + 1) * (segmentsD + 1)) * 2 * 2);
            var u_tile_dim, v_tile_dim;
            var u_tile_step, v_tile_step;
            var tl0u, tl0v;
            var tl1u, tl1v;
            var du, dv;
            if (tile6) {
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
            du = u_tile_dim / segmentsW;
            dv = v_tile_dim / segmentsH;
            for (i = 0; i <= segmentsW; i++) {
                for (j = 0; j <= segmentsH; j++) {
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
            du = u_tile_dim / segmentsW;
            dv = v_tile_dim / segmentsD;
            for (i = 0; i <= segmentsW; i++) {
                for (j = 0; j <= segmentsD; j++) {
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
            du = u_tile_dim / segmentsD;
            dv = v_tile_dim / segmentsH;
            for (i = 0; i <= segmentsD; i++) {
                for (j = 0; j <= segmentsH; j++) {
                    data[uidx++] = tl0u + i * du;
                    data[uidx++] = tl0v + (v_tile_dim - j * dv);
                    data[uidx++] = tl1u + (u_tile_dim - i * du);
                    data[uidx++] = tl1v + (v_tile_dim - j * dv);
                }
            }
            return data;
        }
    })(primitives = feng3d.primitives || (feng3d.primitives = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var primitives;
    (function (primitives) {
        /**
         * 创建球形几何体
         * @param radius 球体半径
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         * @param elements 顶点元素列表
         */
        function createSphere(radius = 50, segmentsW = 16, segmentsH = 12, yUp = true, elements = [feng3d.GLAttribute.position, feng3d.GLAttribute.uv, feng3d.GLAttribute.normal, feng3d.GLAttribute.tangent]) {
            var geometry = new feng3d.Geometry();
            var geometryData = buildGeometry(radius, segmentsW, segmentsH, yUp);
            elements.forEach(element => {
                switch (element) {
                    case feng3d.GLAttribute.position:
                        var vertexPositionData = geometryData[element];
                        geometry.setVAData(element, vertexPositionData, 3);
                        break;
                    case feng3d.GLAttribute.normal:
                        var vertexNormalData = geometryData[element];
                        geometry.setVAData(element, vertexNormalData, 3);
                        break;
                    case feng3d.GLAttribute.tangent:
                        var vertexTangentData = geometryData[element];
                        geometry.setVAData(element, vertexTangentData, 3);
                        break;
                    case feng3d.GLAttribute.uv:
                        var uvData = buildUVs(segmentsW, segmentsH);
                        geometry.setVAData(element, uvData, 2);
                        break;
                    default:
                        throw (`不支持为球体创建顶点属性 ${element}`);
                }
            });
            var indices = buildIndices(segmentsW, segmentsH, yUp);
            geometry.indices = indices;
            return geometry;
        }
        primitives.createSphere = createSphere;
        /**
         * 构建几何体数据
         * @param radius 球体半径
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        function buildGeometry(radius = 1, segmentsW = 1, segmentsH = 1, yUp = true) {
            var vertexPositionData = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 3);
            var vertexNormalData = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 3);
            var vertexTangentData = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 3);
            var startIndex;
            var index = 0;
            var comp1, comp2, t1, t2;
            for (var yi = 0; yi <= segmentsH; ++yi) {
                startIndex = index;
                var horangle = Math.PI * yi / segmentsH;
                var z = -radius * Math.cos(horangle);
                var ringradius = radius * Math.sin(horangle);
                for (var xi = 0; xi <= segmentsW; ++xi) {
                    var verangle = 2 * Math.PI * xi / segmentsW;
                    var x = ringradius * Math.cos(verangle);
                    var y = ringradius * Math.sin(verangle);
                    var normLen = 1 / Math.sqrt(x * x + y * y + z * z);
                    var tanLen = Math.sqrt(y * y + x * x);
                    if (yUp) {
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
                    if (xi == segmentsW) {
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
                        if (yi == segmentsH) {
                            vertexPositionData[index] = vertexPositionData[startIndex];
                            vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                            vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];
                        }
                    }
                    index += 3;
                }
            }
            var result = {};
            result[feng3d.GLAttribute.position] = vertexPositionData;
            result[feng3d.GLAttribute.normal] = vertexNormalData;
            result[feng3d.GLAttribute.tangent] = vertexTangentData;
            return result;
        }
        /**
         * 构建顶点索引
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        function buildIndices(segmentsW = 1, segmentsH = 1, yUp = true) {
            var indices = new Uint16Array(segmentsH * segmentsW * 6);
            var numIndices = 0;
            for (var yi = 0; yi <= segmentsH; ++yi) {
                for (var xi = 0; xi <= segmentsW; ++xi) {
                    if (xi > 0 && yi > 0) {
                        var a = (segmentsW + 1) * yi + xi;
                        var b = (segmentsW + 1) * yi + xi - 1;
                        var c = (segmentsW + 1) * (yi - 1) + xi - 1;
                        var d = (segmentsW + 1) * (yi - 1) + xi;
                        if (yi == segmentsH) {
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
        }
        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        function buildUVs(segmentsW = 1, segmentsH = 1) {
            var data = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 2);
            var index = 0;
            for (var yi = 0; yi <= this._segmentsH; ++yi) {
                for (var xi = 0; xi <= this._segmentsW; ++xi) {
                    data[index++] = xi / this._segmentsW;
                    data[index++] = yi / this._segmentsH;
                }
            }
            return data;
        }
    })(primitives = feng3d.primitives || (feng3d.primitives = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var primitives;
    (function (primitives) {
        /**
         * 创建胶囊几何体
         * @param radius 胶囊体半径
         * @param height 胶囊体高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         * @param elements 顶点元素列表
         */
        function createCapsule(radius = 50, height = 100, segmentsW = 16, segmentsH = 15, yUp = true, elements = [feng3d.GLAttribute.position, feng3d.GLAttribute.uv, feng3d.GLAttribute.normal, feng3d.GLAttribute.tangent]) {
            var geometry = new feng3d.Geometry();
            var geometryData = buildGeometry(radius, height, segmentsW, segmentsH, yUp);
            elements.forEach(element => {
                switch (element) {
                    case feng3d.GLAttribute.position:
                        var vertexPositionData = geometryData[element];
                        geometry.setVAData(element, vertexPositionData, 3);
                        break;
                    case feng3d.GLAttribute.normal:
                        var vertexNormalData = geometryData[element];
                        geometry.setVAData(element, vertexNormalData, 3);
                        break;
                    case feng3d.GLAttribute.tangent:
                        var vertexTangentData = geometryData[element];
                        geometry.setVAData(element, vertexTangentData, 3);
                        break;
                    case feng3d.GLAttribute.uv:
                        var uvData = buildUVs(segmentsW, segmentsH);
                        geometry.setVAData(element, uvData, 2);
                        break;
                    default:
                        throw (`不支持为胶囊体创建顶点属性 ${element}`);
                }
            });
            var indices = buildIndices(segmentsW, segmentsH, yUp);
            geometry.indices = indices;
            return geometry;
        }
        primitives.createCapsule = createCapsule;
        /**
         * 构建几何体数据
         * @param radius 胶囊体半径
         * @param height 胶囊体高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        function buildGeometry(radius = 1, height = 1, segmentsW = 1, segmentsH = 1, yUp = true) {
            var vertexPositionData = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 3);
            var vertexNormalData = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 3);
            var vertexTangentData = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 3);
            var startIndex;
            var index = 0;
            var comp1, comp2, t1, t2;
            for (var yi = 0; yi <= segmentsH; ++yi) {
                startIndex = index;
                var horangle = Math.PI * yi / segmentsH;
                var z = -radius * Math.cos(horangle);
                var ringradius = radius * Math.sin(horangle);
                for (var xi = 0; xi <= segmentsW; ++xi) {
                    var verangle = 2 * Math.PI * xi / segmentsW;
                    var x = ringradius * Math.cos(verangle);
                    var y = ringradius * Math.sin(verangle);
                    var normLen = 1 / Math.sqrt(x * x + y * y + z * z);
                    var tanLen = Math.sqrt(y * y + x * x);
                    var offset = yi > segmentsH / 2 ? height / 2 : -height / 2;
                    if (yUp) {
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
                    if (xi == segmentsW) {
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
                        vertexPositionData[index + 1] = yUp ? comp1 - offset : comp1;
                        vertexPositionData[index + 2] = yUp ? comp2 : comp2 + offset;
                        vertexNormalData[index] = x * normLen;
                        vertexNormalData[index + 1] = comp1 * normLen;
                        vertexNormalData[index + 2] = comp2 * normLen;
                        vertexTangentData[index] = tanLen > .007 ? -y / tanLen : 1;
                        vertexTangentData[index + 1] = t1;
                        vertexTangentData[index + 2] = t2;
                    }
                    if (xi > 0 && yi > 0) {
                        if (yi == segmentsH) {
                            vertexPositionData[index] = vertexPositionData[startIndex];
                            vertexPositionData[index + 1] = vertexPositionData[startIndex + 1];
                            vertexPositionData[index + 2] = vertexPositionData[startIndex + 2];
                        }
                    }
                    index += 3;
                }
            }
            var result = {};
            result[feng3d.GLAttribute.position] = vertexPositionData;
            result[feng3d.GLAttribute.normal] = vertexNormalData;
            result[feng3d.GLAttribute.tangent] = vertexTangentData;
            return result;
        }
        /**
         * 构建顶点索引
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        function buildIndices(segmentsW = 1, segmentsH = 1, yUp = true) {
            var indices = new Uint16Array(segmentsH * segmentsW * 6);
            var numIndices = 0;
            for (var yi = 0; yi <= segmentsH; ++yi) {
                for (var xi = 0; xi <= segmentsW; ++xi) {
                    if (xi > 0 && yi > 0) {
                        var a = (segmentsW + 1) * yi + xi;
                        var b = (segmentsW + 1) * yi + xi - 1;
                        var c = (segmentsW + 1) * (yi - 1) + xi - 1;
                        var d = (segmentsW + 1) * (yi - 1) + xi;
                        if (yi == segmentsH) {
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
        }
        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        function buildUVs(segmentsW = 1, segmentsH = 1) {
            var data = new Float32Array((segmentsH + 1) * (segmentsW + 1) * 2);
            var index = 0;
            for (var yi = 0; yi <= this._segmentsH; ++yi) {
                for (var xi = 0; xi <= this._segmentsW; ++xi) {
                    data[index++] = xi / this._segmentsW;
                    data[index++] = yi / this._segmentsH;
                }
            }
            return data;
        }
    })(primitives = feng3d.primitives || (feng3d.primitives = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var primitives;
    (function (primitives) {
        /**
         * 创建圆柱体
         */
        function createCylinder(topRadius = 50, bottomRadius = 50, height = 100, segmentsW = 16, segmentsH = 1, topClosed = true, bottomClosed = true, surfaceClosed = true, yUp = true, elements = [feng3d.GLAttribute.position, feng3d.GLAttribute.uv, feng3d.GLAttribute.normal, feng3d.GLAttribute.tangent]) {
            var geometry = new feng3d.Geometry();
            var geometryData = buildGeometry(topRadius, bottomRadius, height, segmentsW, segmentsH, topClosed, bottomClosed, surfaceClosed, yUp);
            elements.forEach(element => {
                switch (element) {
                    case feng3d.GLAttribute.position:
                        var vertexPositionData = geometryData[element];
                        geometry.setVAData(element, vertexPositionData, 3);
                        break;
                    case feng3d.GLAttribute.normal:
                        var vertexNormalData = geometryData[element];
                        geometry.setVAData(element, vertexNormalData, 3);
                        break;
                    case feng3d.GLAttribute.tangent:
                        var vertexTangentData = geometryData[element];
                        geometry.setVAData(element, vertexTangentData, 3);
                        break;
                    case feng3d.GLAttribute.uv:
                        var uvData = buildUVs(segmentsW, segmentsH, surfaceClosed, topClosed, bottomClosed);
                        geometry.setVAData(element, uvData, 2);
                        break;
                    default:
                        throw (`不支持为胶囊体创建顶点属性 ${element}`);
                }
            });
            var indices = buildIndices(topRadius, bottomRadius, height, segmentsW, segmentsH, topClosed, bottomClosed, surfaceClosed);
            geometry.indices = indices;
            return geometry;
        }
        primitives.createCylinder = createCylinder;
        /**
         * 计算几何体顶点数
         */
        function getNumVertices(segmentsW, segmentsH, surfaceClosed, topClosed, bottomClosed) {
            var numVertices = 0;
            if (surfaceClosed)
                numVertices += (segmentsH + 1) * (segmentsW + 1);
            if (topClosed)
                numVertices += 2 * (segmentsW + 1);
            if (bottomClosed)
                numVertices += 2 * (segmentsW + 1);
            return numVertices;
        }
        /**
         * 计算几何体三角形数量
         */
        function getNumTriangles(segmentsW, segmentsH, surfaceClosed, topClosed, bottomClosed) {
            var numTriangles = 0;
            if (surfaceClosed)
                numTriangles += segmentsH * segmentsW * 2;
            if (topClosed)
                numTriangles += segmentsW;
            if (bottomClosed)
                numTriangles += segmentsW;
            return numTriangles;
        }
        /**
         * 构建几何体数据
         */
        function buildGeometry(topRadius = 50, bottomRadius = 50, height = 100, segmentsW = 16, segmentsH = 1, topClosed = true, bottomClosed = true, surfaceClosed = true, yUp = true) {
            var i, j, index = 0;
            var x, y, z, radius, revolutionAngle;
            var dr, latNormElev, latNormBase;
            var comp1, comp2;
            var startIndex = 0;
            var t1, t2;
            var numVertices = getNumVertices(segmentsW, segmentsH, surfaceClosed, topClosed, bottomClosed);
            var vertexPositionData = new Float32Array(numVertices * 3);
            var vertexNormalData = new Float32Array(numVertices * 3);
            var vertexTangentData = new Float32Array(numVertices * 3);
            var revolutionAngleDelta = 2 * Math.PI / segmentsW;
            // 顶部
            if (topClosed && topRadius > 0) {
                z = -0.5 * height;
                for (i = 0; i <= segmentsW; ++i) {
                    // 中心顶点
                    if (yUp) {
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
                    x = topRadius * Math.cos(revolutionAngle);
                    y = topRadius * Math.sin(revolutionAngle);
                    if (yUp) {
                        comp1 = -z;
                        comp2 = y;
                    }
                    else {
                        comp1 = y;
                        comp2 = z;
                    }
                    if (i == segmentsW) {
                        addVertex(vertexPositionData[startIndex + 3], vertexPositionData[startIndex + 4], vertexPositionData[startIndex + 5], 0, t1, t2, 1, 0, 0);
                    }
                    else {
                        addVertex(x, comp1, comp2, 0, t1, t2, 1, 0, 0);
                    }
                }
            }
            // 底部
            if (bottomClosed && bottomRadius > 0) {
                z = 0.5 * height;
                startIndex = index;
                for (i = 0; i <= segmentsW; ++i) {
                    // 中心顶点
                    if (yUp) {
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
                    x = bottomRadius * Math.cos(revolutionAngle);
                    y = bottomRadius * Math.sin(revolutionAngle);
                    if (yUp) {
                        comp1 = -z;
                        comp2 = y;
                    }
                    else {
                        comp1 = y;
                        comp2 = z;
                    }
                    if (i == segmentsW) {
                        addVertex(x, vertexPositionData[startIndex + 1], vertexPositionData[startIndex + 2], 0, t1, t2, 1, 0, 0);
                    }
                    else {
                        addVertex(x, comp1, comp2, 0, t1, t2, 1, 0, 0);
                    }
                }
            }
            // 侧面
            dr = bottomRadius - topRadius;
            latNormElev = dr / height;
            latNormBase = (latNormElev == 0) ? 1 : height / dr;
            if (surfaceClosed) {
                var a, b, c, d;
                var na0, na1, naComp1, naComp2;
                for (j = 0; j <= segmentsH; ++j) {
                    radius = topRadius - ((j / segmentsH) * (topRadius - bottomRadius));
                    z = -(height / 2) + (j / segmentsH * height);
                    startIndex = index;
                    for (i = 0; i <= segmentsW; ++i) {
                        revolutionAngle = i * revolutionAngleDelta;
                        x = radius * Math.cos(revolutionAngle);
                        y = radius * Math.sin(revolutionAngle);
                        na0 = latNormBase * Math.cos(revolutionAngle);
                        na1 = latNormBase * Math.sin(revolutionAngle);
                        if (yUp) {
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
                        if (i == segmentsW) {
                            addVertex(vertexPositionData[startIndex], vertexPositionData[startIndex + 1], vertexPositionData[startIndex + 2], na0, latNormElev, na1, na1, t1, t2);
                        }
                        else {
                            addVertex(x, comp1, comp2, na0, naComp1, naComp2, -na1, t1, t2);
                        }
                    }
                }
            }
            var result = {};
            result[feng3d.GLAttribute.position] = vertexPositionData;
            result[feng3d.GLAttribute.normal] = vertexNormalData;
            result[feng3d.GLAttribute.tangent] = vertexTangentData;
            return result;
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
        }
        /**
         * 构建顶点索引
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        function buildIndices(topRadius = 50, bottomRadius = 50, height = 100, segmentsW = 16, segmentsH = 1, topClosed = true, bottomClosed = true, surfaceClosed = true) {
            var i, j, index = 0;
            var numTriangles = getNumTriangles(segmentsW, segmentsH, surfaceClosed, topClosed, bottomClosed);
            var indices = new Uint16Array(numTriangles * 3);
            var numIndices = 0;
            // 顶部
            if (topClosed && topRadius > 0) {
                for (i = 0; i <= segmentsW; ++i) {
                    index += 2;
                    if (i > 0)
                        addTriangleClockWise(index - 1, index - 3, index - 2);
                }
            }
            // 底部
            if (bottomClosed && bottomRadius > 0) {
                for (i = 0; i <= segmentsW; ++i) {
                    index += 2;
                    if (i > 0)
                        addTriangleClockWise(index - 2, index - 3, index - 1);
                }
            }
            // 侧面
            if (surfaceClosed) {
                var a, b, c, d;
                for (j = 0; j <= segmentsH; ++j) {
                    for (i = 0; i <= segmentsW; ++i) {
                        index++;
                        if (i > 0 && j > 0) {
                            a = index - 1;
                            b = index - 2;
                            c = b - segmentsW - 1;
                            d = a - segmentsW - 1;
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
        }
        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        function buildUVs(segmentsW, segmentsH, surfaceClosed, topClosed, bottomClosed) {
            var i, j;
            var x, y, revolutionAngle;
            var numVertices = getNumVertices(segmentsW, segmentsH, surfaceClosed, topClosed, bottomClosed);
            var data = new Float32Array(numVertices * 2);
            var revolutionAngleDelta = 2 * Math.PI / segmentsW;
            var index = 0;
            // 顶部
            if (topClosed) {
                for (i = 0; i <= segmentsW; ++i) {
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
            if (bottomClosed) {
                for (i = 0; i <= segmentsW; ++i) {
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
            if (surfaceClosed) {
                for (j = 0; j <= segmentsH; ++j) {
                    for (i = 0; i <= segmentsW; ++i) {
                        // 旋转顶点
                        data[index++] = (i / segmentsW);
                        data[index++] = (j / segmentsH);
                    }
                }
            }
            return data;
        }
    })(primitives = feng3d.primitives || (feng3d.primitives = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 材质
     * @author feng 2016-05-02
     */
    class Material extends feng3d.RenderDataHolder {
        /**
         * 构建材质
         */
        constructor() {
            super();
            this.vertexShaderStr = `
attribute vec3 vaPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(vaPosition, 1.0);
}`;
            this.fragmentShaderStr = `
void main(void) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}`;
            /**
            * 渲染模式
            */
            this.renderMode = feng3d.RenderMode.TRIANGLES;
            this.pass = new feng3d.MaterialPass();
            this.mapProgram(this.vertexShaderStr, this.fragmentShaderStr);
        }
    }
    feng3d.Material = Material;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 颜色材质
     * @author feng 2016-05-02
     */
    class ColorMaterial extends feng3d.Material {
        /**
         * 构建颜色材质
         * @param color 颜色
         * @param alpha 透明的
         */
        constructor(color = null) {
            super();
            this.vertexShaderStr = `
attribute vec3 vaPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(vaPosition, 1.0);
}`;
            this.fragmentShaderStr = `
precision mediump float;
uniform vec4 diffuseInput_fc_vector;
void main(void) {

    gl_FragColor = diffuseInput_fc_vector;
}`;
            this.color = color || new feng3d.Color();
            this.mapUniform(feng3d.RenderDataID.diffuseInput_fc_vector, this._color);
            this.mapProgram(this.vertexShaderStr, this.fragmentShaderStr);
        }
        /**
         * 颜色
         */
        get color() {
            return this._color;
        }
        set color(value) {
            this._color = value;
        }
    }
    feng3d.ColorMaterial = ColorMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 线段材质
     * @author feng 2016-10-15
     */
    class SegmentMaterial extends feng3d.Material {
        /**
         * 构建颜色材质
         * @param color 颜色
         * @param alpha 透明的
         */
        constructor(color = null) {
            super();
            /**
            * 渲染模式
            */
            this.renderMode = feng3d.RenderMode.LINES;
            this.mapShaderParam(feng3d.ShaderParamID.renderMode, this.renderMode);
        }
    }
    feng3d.SegmentMaterial = SegmentMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 材质通道
     */
    class MaterialPass {
    }
    feng3d.MaterialPass = MaterialPass;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    class ControllerBase {
        /**
         * 控制器基类，用于动态调整3D对象的属性
         */
        constructor(targetObject) {
            this._targetObject = targetObject;
        }
        /**
         * 手动应用更新到目标3D对象
         */
        update(interpolate = true) {
            throw new Error("Abstract method");
        }
        get targetObject() {
            return this._targetObject;
        }
        set targetObject(val) {
            if (this._targetObject == val)
                return;
            this._targetObject = val;
        }
    }
    feng3d.ControllerBase = ControllerBase;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    class LookAtController extends feng3d.ControllerBase {
        constructor(targetObject = null, lookAtObject = null) {
            super(targetObject);
            this._origin = new feng3d.Vector3D(0.0, 0.0, 0.0);
            this._upAxis = feng3d.Vector3D.Y_AXIS;
            this._pos = new feng3d.Vector3D();
            if (lookAtObject)
                this.lookAtObject = lookAtObject;
            else
                this.lookAtPosition = new feng3d.Vector3D();
        }
        get upAxis() {
            return this._upAxis;
        }
        set upAxis(upAxis) {
            this._upAxis = upAxis;
        }
        get lookAtPosition() {
            return this._lookAtPosition;
        }
        set lookAtPosition(val) {
            this._lookAtPosition = val;
        }
        get lookAtObject() {
            return this._lookAtObject;
        }
        set lookAtObject(value) {
            if (this._lookAtObject == value)
                return;
            this._lookAtObject = value;
        }
        update(interpolate = true) {
            if (this._targetObject) {
                if (this._lookAtPosition) {
                    this._targetObject.space3D.lookAt(this.lookAtPosition, this._upAxis);
                }
                else if (this._lookAtObject) {
                    this._pos.x = this._lookAtObject.space3D.x;
                    this._pos.y = this._lookAtObject.space3D.y;
                    this._pos.z = this._lookAtObject.space3D.z;
                    this._targetObject.space3D.lookAt(this._pos, this._upAxis);
                }
            }
        }
    }
    feng3d.LookAtController = LookAtController;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=feng3d.js.map