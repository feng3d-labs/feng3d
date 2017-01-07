var feng3d;
(function (feng3d) {
    /**
     * feng3d的版本号
     * @author feng 2015-03-20
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
     * 鼠标键盘输入，处理js事件中this关键字问题
     * @author feng 2016-12-19
     */
    class MouseKeyInput extends feng3d.EventDispatcher {
        /**
         * 构建
         */
        constructor() {
            super();
            this.init();
        }
        /**
         * 初始化
         */
        init() {
            for (var key in feng3d.$mouseKeyType) {
                window.addEventListener(key, this.onMouseKey.bind(this));
            }
        }
        /**
         * 键盘按下事件
         */
        onMouseKey(event) {
            this.dispatchEvent(new feng3d.Event(event.type, event, event.bubbles));
        }
    }
    feng3d.MouseKeyInput = MouseKeyInput;
    /**
     * 鼠标事件类型
     */
    feng3d.$mouseKeyType = {
        /** 鼠标单击 */
        "click": "click",
        /** 鼠标双击 */
        "dblclick": "dblclick",
        /** 鼠标按下 */
        "mousedown": "mousedown",
        /** 鼠标移动 */
        "mousemove": "mousemove",
        /** 鼠标移出 */
        "mouseout": "mouseout",
        /** 鼠标移入 */
        "mouseover": "mouseover",
        /** 鼠标弹起 */
        "mouseup": "mouseup",
        /** 键盘按下 */
        "keydown": "keydown",
        /** 键盘按着 */
        "keypress": "keypress",
        /** 键盘弹起 */
        "keyup": "keyup"
    };
    /**
     * 鼠标键盘输入
     */
    feng3d.$mouseKeyInput = new MouseKeyInput();
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var shortcut;
    (function (shortcut) {
        /**
         * 按键捕获
         * @author feng 2016-4-26
         */
        class KeyCapture {
            /**
             * 构建
             * @param stage		舞台
             */
            constructor(shortCutContext) {
                /**
                 * 捕获的按键字典
                 */
                this.mouseKeyDic = {};
                this.keyState = shortCutContext.keyState;
                //
                window.addEventListener("keydown", this.onKeydown.bind(this));
                window.addEventListener("keyup", this.onKeyup.bind(this));
                this.boardKeyDic = {};
                this.defaultSupportKeys();
                //监听鼠标事件
                var mouseEvents = [
                    "click",
                    "dblclick",
                    "mousedown",
                    "mousemove",
                    "mouseout",
                    "mouseover",
                    "mouseup",
                ];
                for (var i = 0; i < mouseEvents.length; i++) {
                    window.addEventListener(mouseEvents[i], this.onMouseOnce.bind(this));
                }
                window.addEventListener("mousewheel", this.onMousewheel.bind(this));
            }
            /**
             * 默认支持按键
             */
            defaultSupportKeys() {
                this.boardKeyDic[17] = "ctrl";
                this.boardKeyDic[16] = "shift";
                this.boardKeyDic[32] = "escape";
                this.boardKeyDic[18] = "alt";
            }
            /**
             * 鼠标事件
             */
            onMouseOnce(event) {
                var mouseKey = event.type;
                this.keyState.pressKey(mouseKey, event);
                this.keyState.releaseKey(mouseKey, event);
            }
            /**
             * 鼠标事件
             */
            onMousewheel(event) {
                var mouseKey = event.type;
                this.keyState.pressKey(mouseKey, event);
                this.keyState.releaseKey(mouseKey, event);
            }
            /**
             * 键盘按下事件
             */
            onKeydown(event) {
                var boardKey = this.getBoardKey(event.keyCode);
                if (boardKey != null)
                    this.keyState.pressKey(boardKey, event);
            }
            /**
             * 键盘弹起事件
             */
            onKeyup(event) {
                var boardKey = this.getBoardKey(event.keyCode);
                if (boardKey)
                    this.keyState.releaseKey(boardKey, event);
            }
            /**
             * 获取键盘按键名称
             */
            getBoardKey(keyCode) {
                var boardKey = this.boardKeyDic[keyCode];
                if (boardKey == null && 65 <= keyCode && keyCode <= 90) {
                    boardKey = String.fromCharCode(keyCode).toLocaleLowerCase();
                }
                return boardKey;
            }
        }
        shortcut.KeyCapture = KeyCapture;
    })(shortcut = feng3d.shortcut || (feng3d.shortcut = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var shortcut;
    (function (shortcut) {
        /**
         * 按键状态
         * @author feng 2016-4-26
         */
        class KeyState extends feng3d.EventDispatcher {
            /**
             * 构建
             */
            constructor() {
                super();
                this.keyStateDic = {};
            }
            /**
             * 按下键
             * @param key 	键名称
             * @param data	携带数据
             */
            pressKey(key, data = null) {
                this.keyStateDic[key] = true;
                this.dispatchEvent(new shortcut.ShortCutEvent(key, data));
            }
            /**
             * 释放键
             * @param key	键名称
             * @param data	携带数据
             */
            releaseKey(key, data = null) {
                this.keyStateDic[key] = false;
                this.dispatchEvent(new shortcut.ShortCutEvent(key, data));
            }
            /**
             * 获取按键状态
             * @param key 按键名称
             */
            getKeyState(key) {
                return !!this.keyStateDic[key];
            }
        }
        shortcut.KeyState = KeyState;
    })(shortcut = feng3d.shortcut || (feng3d.shortcut = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var shortcut;
    (function (shortcut) {
        /**
         * 快捷键捕获
         * @author feng 2016-4-26
         */
        class ShortCutCapture {
            /**
             * 构建快捷键捕获
             * @param shortCutContext		快捷键环境
             * @param key					快捷键
             * @param command				要执行的命令名称
             * @param stateCommand			可执行的状态命令
             * @param when					快捷键处于活动状态的条件
             */
            constructor(shortCutContext, key, command = null, stateCommand = null, when = null) {
                this.shortCutContext = shortCutContext;
                this.keyState = shortCutContext.keyState;
                this.key = key;
                this.command = command;
                this.stateCommand = stateCommand;
                this.when = when;
                this.keys = this.getKeys(key);
                this.states = this.getStates(when);
                this.commands = this.getCommands(command);
                this.stateCommands = this.getStateCommand(stateCommand);
                this.init();
            }
            /**
             * 初始化
             */
            init() {
                for (var i = 0; i < this.keys.length; i++) {
                    this.keyState.addEventListener(this.keys[i].key, this.onCapture, this);
                }
            }
            /**
             * 处理捕获事件
             */
            onCapture(event) {
                var inWhen = this.checkActivityStates(this.states);
                var pressKeys = this.checkActivityKeys(this.keys);
                if (pressKeys && inWhen) {
                    this.dispatchCommands(this.commands, event.data);
                    this.executeStateCommands(this.stateCommands);
                }
            }
            /**
             * 派发命令
             */
            dispatchCommands(commands, data) {
                for (var i = 0; i < commands.length; i++) {
                    this.shortCutContext.commandDispatcher.dispatchEvent(new shortcut.ShortCutEvent(commands[i], data));
                }
            }
            /**
             * 执行状态命令
             */
            executeStateCommands(stateCommands) {
                for (var i = 0; i < stateCommands.length; i++) {
                    var stateCommand = stateCommands[i];
                    if (stateCommand.not)
                        this.shortCutContext.deactivityState(stateCommand.state);
                    else
                        this.shortCutContext.activityState(stateCommand.state);
                }
            }
            /**
             * 检测快捷键是否处于活跃状态
             */
            checkActivityStates(states) {
                for (var i = 0; i < states.length; i++) {
                    if (!this.getState(states[i]))
                        return false;
                }
                return true;
            }
            /**
             * 获取是否处于指定状态中（支持一个！取反）
             * @param state 状态名称
             */
            getState(state) {
                var result = this.shortCutContext.getState(state.state);
                if (state.not) {
                    result = !result;
                }
                return result;
            }
            /**
             * 检测是否按下给出的键
             * @param keys 按键数组
             */
            checkActivityKeys(keys) {
                for (var i = 0; i < keys.length; i++) {
                    if (!this.getKeyValue(keys[i]))
                        return false;
                }
                return true;
            }
            /**
             * 获取按键状态（true：按下状态，false：弹起状态）
             */
            getKeyValue(key) {
                var value = this.keyState.getKeyState(key.key);
                if (key.not) {
                    value = !value;
                }
                return value;
            }
            /**
             * 获取状态列表
             * @param when		状态字符串
             */
            getStates(when) {
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
            }
            /**
             * 获取键列表
             * @param key		快捷键
             */
            getKeys(key) {
                var keyStrs = key.split("+");
                var keys = [];
                for (var i = 0; i < keyStrs.length; i++) {
                    keys.push(new Key(keyStrs[i]));
                }
                return keys;
            }
            /**
             * 获取命令列表
             * @param command	命令
             */
            getCommands(command) {
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
            }
            /**
             * 获取状态命令列表
             * @param stateCommand	状态命令
             */
            getStateCommand(stateCommand) {
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
            }
            /**
             * 销毁
             */
            destroy() {
                for (var i = 0; i < this.keys.length; i++) {
                    this.keyState.removeEventListener(this.keys[i].key, this.onCapture, this);
                }
                this.shortCutContext = null;
                this.keys = null;
                this.states = null;
            }
        }
        shortcut.ShortCutCapture = ShortCutCapture;
    })(shortcut = feng3d.shortcut || (feng3d.shortcut = {}));
})(feng3d || (feng3d = {}));
/**
 * 按键
 * @author feng 2016-6-6
 */
class Key {
    constructor(key) {
        key = key.trim();
        if (key.charAt(0) == "!") {
            this.not = true;
            key = key.substr(1).trim();
        }
        this.key = key;
    }
}
/**
 * 状态
 * @author feng 2016-6-6
 */
class State {
    constructor(state) {
        state = state.trim();
        if (state.charAt(0) == "!") {
            this.not = true;
            state = state.substr(1).trim();
        }
        this.state = state;
    }
}
/**
 * 状态命令
 * @author feng 2016-6-6
 */
class StateCommand {
    constructor(state) {
        state = state.trim();
        if (state.charAt(0) == "!") {
            this.not = true;
            state = state.substr(1).trim();
        }
        this.state = state;
    }
}
var feng3d;
(function (feng3d) {
    var shortcut;
    (function (shortcut_1) {
        /**
         * 快捷键环境
         * @author feng 2016-6-6
         */
        class ShortCutContext {
            /**
             * 构建快捷键环境
             * @param stage 舞台
             */
            constructor() {
                this.init();
            }
            /**
             * 初始化快捷键模块
             */
            init() {
                this.keyState = new shortcut_1.KeyState();
                this.keyCapture = new shortcut_1.KeyCapture(this);
                this.commandDispatcher = new feng3d.EventDispatcher();
                this.captureDic = {};
                this.stateDic = {};
            }
            /**
             * 添加快捷键
             * @param shortcuts		快捷键列表
             */
            addShortCuts(shortcuts) {
                for (var i = 0; i < shortcuts.length; i++) {
                    var shortcut = shortcuts[i];
                    var shortcutUniqueKey = this.getShortcutUniqueKey(shortcut);
                    this.captureDic[shortcutUniqueKey] = this.captureDic[shortcutUniqueKey] || new shortcut_1.ShortCutCapture(this, shortcut.key, shortcut.command, shortcut.stateCommand, shortcut.when);
                }
            }
            /**
             * 删除快捷键
             * @param shortcuts		快捷键列表
             */
            removeShortCuts(shortcuts) {
                for (var i = 0; i < shortcuts.length; i++) {
                    var shortcutUniqueKey = this.getShortcutUniqueKey(shortcuts[i]);
                    var shortCutCapture = this.captureDic[shortcutUniqueKey];
                    if (shortcut_1.ShortCutCapture != null) {
                        shortCutCapture.destroy();
                    }
                    delete this.captureDic[shortcutUniqueKey];
                }
            }
            /**
             * 移除所有快捷键
             */
            removeAllShortCuts() {
                var keys = [];
                var key;
                for (key in this.captureDic) {
                    keys.push(key);
                }
                keys.forEach(key => {
                    var shortCutCapture = this.captureDic[key];
                    shortCutCapture.destroy();
                    delete this.captureDic[key];
                });
            }
            /**
             * 激活状态
             * @param state 状态名称
             */
            activityState(state) {
                this.stateDic[state] = true;
            }
            /**
             * 取消激活状态
             * @param state 状态名称
             */
            deactivityState(state) {
                delete this.stateDic[state];
            }
            /**
             * 获取状态
             * @param state 状态名称
             */
            getState(state) {
                return !!this.stateDic[state];
            }
            /**
             * 获取快捷键唯一字符串
             */
            getShortcutUniqueKey(shortcut) {
                return shortcut.key + "," + shortcut.command + "," + shortcut.when;
            }
        }
        shortcut_1.ShortCutContext = ShortCutContext;
    })(shortcut = feng3d.shortcut || (feng3d.shortcut = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var shortcut;
    (function (shortcut) {
        /**
         * 快捷键命令事件
         * @author feng 2016-4-27
         */
        class ShortCutEvent extends feng3d.Event {
            /**
             * 构建
             * @param command		命令名称
             */
            constructor(command, data = null) {
                super(command, data);
            }
        }
        shortcut.ShortCutEvent = ShortCutEvent;
    })(shortcut = feng3d.shortcut || (feng3d.shortcut = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var shortcut;
    (function (shortcut) {
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
    ShortCut.addShortCuts(shortcuts);
    //监听命令
    ShortCut.commandDispatcher.addEventListener("run", function(e:Event):void
    {
        trace("接受到命令：" + e.type);
    });
         * </pre>
         */
        class ShortCut {
            /**
             * 初始化快捷键模块
             */
            static init() {
                ShortCut.shortcutContext = new shortcut.ShortCutContext();
                ShortCut.commandDispatcher = ShortCut.shortcutContext.commandDispatcher;
            }
            /**
             * 添加快捷键
             * @param shortcuts		快捷键列表
             */
            static addShortCuts(shortcuts) {
                ShortCut.shortcutContext.addShortCuts(shortcuts);
            }
            /**
             * 删除快捷键
             * @param shortcuts		快捷键列表
             */
            static removeShortCuts(shortcuts) {
                ShortCut.shortcutContext.removeShortCuts(shortcuts);
            }
            /**
             * 移除所有快捷键
             */
            static removeAllShortCuts() {
                ShortCut.shortcutContext.removeAllShortCuts();
            }
            /**
             * 激活状态
             * @param state 状态名称
             */
            static activityState(state) {
                ShortCut.shortcutContext.activityState(state);
            }
            /**
             * 取消激活状态
             * @param state 状态名称
             */
            static deactivityState(state) {
                ShortCut.shortcutContext.deactivityState(state);
            }
            /**
             * 获取状态
             * @param state 状态名称
             */
            static getState(state) {
                return ShortCut.shortcutContext.getState(state);
            }
        }
        shortcut.ShortCut = ShortCut;
    })(shortcut = feng3d.shortcut || (feng3d.shortcut = {}));
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
            var filterResult = this.components.filter(function (value, index, array) {
                return value.name == name;
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
            var filterResult = this.components.filter(function (value, index, array) {
                return value instanceof cls;
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
            this.components.forEach(function (value, index, array) {
                value.dispatchEvent(event);
                value.dispatchChildrenEvent(event, depth - 1);
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
     * 加载类
     * @author feng 2016-12-14
     */
    class Loader extends feng3d.EventDispatcher {
        /**
         * 加载资源
         * @param url   路径
         */
        load(url) {
            this.url = url;
        }
        /**
         * 加载文本
         * @param url   路径
         */
        loadText(url) {
            this.url = url;
            this.dataFormat = feng3d.LoaderDataFormat.TEXT;
            this.xmlHttpRequestLoad();
        }
        /**
         * 加载二进制
         * @param url   路径
         */
        loadBinary(url) {
            this.url = url;
            this.dataFormat = feng3d.LoaderDataFormat.BINARY;
            this.xmlHttpRequestLoad();
        }
        /**
         * 加载图片
         * @param url   路径
         */
        loadImage(url) {
            this.dataFormat = feng3d.LoaderDataFormat.IMAGE;
            this.image = new Image();
            this.image.onload = this.onImageLoad.bind(this);
            this.image.onerror = this.onImageError.bind(this);
            this.image.src = url;
        }
        /**
         * 使用XMLHttpRequest加载
         */
        xmlHttpRequestLoad() {
            this.request = new XMLHttpRequest();
            this.request.open('Get', this.url, true);
            this.request.responseType = this.dataFormat == feng3d.LoaderDataFormat.BINARY ? "arraybuffer" : "";
            this.request.onreadystatechange = this.onRequestReadystatechange.bind(this);
            this.request.onprogress = this.onRequestProgress.bind(this);
            this.request.send();
        }
        /**
         * 请求进度回调
         */
        onRequestProgress(event) {
            this.bytesLoaded = event.loaded;
            this.bytesTotal = event.total;
            this.dispatchEvent(new feng3d.LoaderEvent(feng3d.LoaderEvent.PROGRESS, this));
        }
        /**
         * 请求状态变化回调
         */
        onRequestReadystatechange(ev) {
            if (this.request.readyState == 4) {
                this.request.onreadystatechange = null;
                if (this.request.status >= 200 && this.request.status < 300) {
                    this.content = this.dataFormat == feng3d.LoaderDataFormat.TEXT ? this.request.responseText : this.request.response;
                    this.dispatchEvent(new feng3d.LoaderEvent(feng3d.LoaderEvent.COMPLETE, this));
                }
                else {
                    if (!this.hasEventListener(feng3d.LoaderEvent.ERROR)) {
                        throw new Error("Error status: " + this.request + " - Unable to load " + this.url);
                    }
                    this.dispatchEvent(new feng3d.LoaderEvent(feng3d.LoaderEvent.ERROR, this));
                }
            }
        }
        /**
         * 加载图片完成回调
         */
        onImageLoad(event) {
            this.content = this.image;
            this.dispatchEvent(new feng3d.LoaderEvent(feng3d.LoaderEvent.COMPLETE, this));
        }
        /**
         * 加载图片出错回调
         */
        onImageError(event) {
            console.error("Error while trying to load texture: " + this.url);
            //
            this.image.src = "data:image/jpg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QBmRXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAAExAAIAAAAQAAAATgAAAAAAAABgAAAAAQAAAGAAAAABcGFpbnQubmV0IDQuMC41AP/bAEMABAIDAwMCBAMDAwQEBAQFCQYFBQUFCwgIBgkNCw0NDQsMDA4QFBEODxMPDAwSGBITFRYXFxcOERkbGRYaFBYXFv/bAEMBBAQEBQUFCgYGChYPDA8WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFv/AABEIAQABAAMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APH6KKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76CiiigD5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BQooooA+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/voKKKKAPl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76CiiigD5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BQooooA+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/voKKKKAPl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76P//Z";
            //
            this.onImageLoad(null);
            this.dispatchEvent(new feng3d.LoaderEvent(feng3d.LoaderEvent.ERROR, this));
        }
    }
    feng3d.Loader = Loader;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 加载事件
     * @author feng 2016-12-14
     */
    class LoaderEvent extends feng3d.Event {
    }
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
    class LoaderDataFormat {
    }
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
     * 数组工具
     * @author feng 2017-01-03
     */
    class ArrayUtils {
        /**
         * 删除数据元素
         * @param source    数组源数据
         * @param item      被删除数据
         * @param all       是否删除所有相同数据
         */
        static removeItem(source, item, all = false) {
            var deleteIndexs = [];
            var index = source.indexOf(item);
            while (index != -1) {
                source.splice(index, 1);
                deleteIndexs.push(index);
                all || (index = -1);
            }
            return { deleteIndexs: deleteIndexs, length: source.length };
        }
    }
    feng3d.ArrayUtils = ArrayUtils;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 构建Map类代替Dictionary
     * @author feng 2017-01-03
     */
    class Map {
        constructor() {
            this.keyMap = {};
            this.valueMap = {};
        }
        /**
         * 删除
         */
        delete(k) {
            delete this.keyMap[feng3d.getUID(k)];
            delete this.valueMap[feng3d.getUID(k)];
        }
        /**
         * 添加映射
         */
        push(k, v) {
            this.keyMap[feng3d.getUID(k)] = k;
            this.valueMap[feng3d.getUID(k)] = v;
        }
        /**
         * 通过key获取value
         */
        get(k) {
            return this.valueMap[feng3d.getUID(k)];
        }
        /**
         * 获取键列表
         */
        getKeys() {
            var keys = [];
            for (var key in this.keyMap) {
                keys.push(this.keyMap[key]);
            }
            return keys;
        }
        /**
         * 清理字典
         */
        clear() {
            this.keyMap = {};
            this.valueMap = {};
        }
    }
    feng3d.Map = Map;
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
     * 渲染代码库
     * @author feng 2016-12-16
     */
    class ShaderLib {
        /**
         * 获取shaderCode
         */
        static getShaderCode(shaderName) {
            if (shaderMap[shaderName])
                return shaderMap[shaderName];
            getShaderLoader(shaderName);
            return null;
        }
        /**
         * 获取ShaderMacro代码
         */
        static getMacroCode(macro) {
            var macroHeader = "";
            var macroNames = Object.keys(macro.valueMacros);
            macroNames = macroNames.sort();
            macroNames.forEach(macroName => {
                var value = macro.valueMacros[macroName];
                macroHeader += `#define ${macroName} ${value}\n`;
            });
            macroNames = Object.keys(macro.boolMacros);
            macroNames = macroNames.sort();
            macroNames.forEach(macroName => {
                var value = macro.boolMacros[macroName];
                value && (macroHeader += `#define ${macroName}\n`);
            });
            macroNames = Object.keys(macro.addMacros);
            macroNames = macroNames.sort();
            macroNames.forEach(macroName => {
                var value = macro.addMacros[macroName];
                macroHeader += `#define ${macroName} ${value}\n`;
            });
            return macroHeader;
        }
    }
    feng3d.ShaderLib = ShaderLib;
    /**
     * 渲染代码字典
     */
    var shaderMap = {};
    /**
     * 渲染代码加载器字典
     */
    var shaderLoaderMap = {};
    /**
     * 获取shader加载器
     */
    function getShaderLoader(shaderName) {
        var shaderLoader = shaderLoaderMap[shaderName];
        if (shaderLoader == null) {
            shaderLoader = new ShaderLoader();
            shaderLoader.addEventListener(feng3d.LoaderEvent.COMPLETE, function (event) {
                shaderMap[shaderLoader.shaderName] = shaderLoader.shaderCode;
                delete shaderLoaderMap[shaderLoader.shaderName];
            }, null, Number.MAX_VALUE);
            shaderLoader.loadText(shaderName);
        }
        return shaderLoader;
    }
    /**
     * 着色器加载器
     * @author feng 2016-12-15
     */
    class ShaderLoader extends feng3d.EventDispatcher {
        /**
         * 加载shader
         * @param url   路径
         */
        loadText(shaderName) {
            this.shaderName = shaderName;
            var url = ShaderLoader.shadersRoot + this.shaderName + ".glsl";
            var loader = new feng3d.Loader();
            loader.addEventListener(feng3d.LoaderEvent.COMPLETE, this.onComplete, this);
            loader.loadText(url);
        }
        /**
         * shader加载完成
         */
        onComplete(event) {
            //#include 正则表达式
            var includeRegExp = /#include<(.+)>/g;
            //
            this.shaderCode = event.data.content;
            var match = includeRegExp.exec(this.shaderCode);
            this.subShaders = {};
            while (match != null) {
                var subShaderName = match[1];
                var subShaderCode = ShaderLib.getShaderCode(subShaderName);
                if (subShaderCode) {
                    this.shaderCode = this.shaderCode.replace(match[0], subShaderCode);
                }
                else {
                    var subShaderLoader = getShaderLoader(subShaderName);
                    subShaderLoader.addEventListener(feng3d.LoaderEvent.COMPLETE, this.onSubComplete, this);
                }
                this.subShaders[subShaderName] = match;
                match = includeRegExp.exec(this.shaderCode);
            }
            this.check();
        }
        /**
         * subShader加载完成
         */
        onSubComplete(event) {
            var shaderLoader = event.data;
            var match = this.subShaders[shaderLoader.shaderName];
            this.shaderCode = this.shaderCode.replace(match[0], shaderLoader.shaderCode);
            delete this.subShaders[shaderLoader.shaderName];
            //
            this.check();
        }
        /**
         * 检查是否加载完成
         */
        check() {
            if (Object.keys(this.subShaders).length == 0) {
                this.dispatchEvent(new feng3d.LoaderEvent(feng3d.LoaderEvent.COMPLETE, this));
            }
        }
    }
    /**
     * shader根路径
     */
    ShaderLoader.shadersRoot = "feng3d/shaders/";
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
         * @param r     红[0,1]
         * @param g     绿[0,1]
         * @param b     蓝[0,1]
         * @param a     透明度[0,1]
         */
        constructor(r = 1, g = 1, b = 1, a = 1) {
            /**
             * 红[0,1]
             */
            this.r = 1;
            /**
             * 绿[0,1]
             */
            this.g = 1;
            /**
             * 蓝[0,1]
             */
            this.b = 1;
            /**
             * 透明度[0,1]
             */
            this.a = 1;
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }
        /**
         * 从RGBA整型初始化颜色
         * @param r     红[0,255]
         * @param g     绿[0,255]
         * @param b     蓝[0,255]
         * @param a     透明度[0,255]
         */
        fromInts(r, g, b, a) {
            this.r = r / 0xff;
            this.g = g / 0xff;
            this.b = b / 0xff;
            this.a = a / 0xff;
        }
        fromUnit(color, hasAlpha = true) {
            this.a = (hasAlpha ? (color >> 24) & 0xff : 0xff) / 0xff;
            this.r = ((color >> 16) & 0xff) / 0xff;
            this.g = ((color >> 8) & 0xff) / 0xff;
            this.b = (color & 0xff) / 0xff;
        }
        /**
         * 转换为数组
         */
        asArray() {
            var result = [];
            this.toArray(result);
            return result;
        }
        /**
         * 输出到数组
         * @param array     数组
         * @param index     存储在数组中的位置
         */
        toArray(array, index = 0) {
            array[index] = this.r;
            array[index + 1] = this.g;
            array[index + 2] = this.b;
            array[index + 3] = this.a;
            return this;
        }
        /**
         * 输出为向量
         */
        toVector3D() {
            return new feng3d.Vector3D(this.r, this.g, this.b, this.a);
        }
        /**
         * 输出16进制字符串
         */
        toHexString() {
            var intR = (this.r * 0xff) | 0;
            var intG = (this.g * 0xff) | 0;
            var intB = (this.b * 0xff) | 0;
            var intA = (this.a * 0xff) | 0;
            return "#" + Color.ToHex(intA) + Color.ToHex(intR) + Color.ToHex(intG) + Color.ToHex(intB);
        }
        /**
         * 输出字符串
         */
        toString() {
            return "{R: " + this.r + " G:" + this.g + " B:" + this.b + " A:" + this.a + "}";
        }
        /**
         * [0,15]数值转为16进制字符串
         * param i  [0,15]数值
         */
        static ToHex(i) {
            var str = i.toString(16);
            if (i <= 0xf) {
                return ("0" + str).toUpperCase();
            }
            return str.toUpperCase();
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
         * 看向目标位置
         * @param target    目标位置
         * @param upAxis    向上朝向
         */
        lookAt(target, upAxis = null) {
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
        RenderMode[RenderMode["DEFAULT"] = WebGLRenderingContext.TRIANGLES] = "DEFAULT";
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
            this.renderData = new feng3d.RenderData();
            //
            this._subRenderDataHolders = [];
        }
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext) {
            this._subRenderDataHolders.forEach(element => {
                element.updateRenderData(renderContext);
            });
        }
        /**
         * 激活
         * @param renderData	渲染数据
         */
        activate(renderData) {
            feng3d.RenderDataUtil.active(renderData, this.renderData);
            this._subRenderDataHolders.forEach(element => {
                element.activate(renderData);
            });
        }
        /**
         * 释放
         * @param renderData	渲染数据
         */
        deactivate(renderData) {
            feng3d.RenderDataUtil.deactivate(renderData, this.renderData);
            this._subRenderDataHolders.forEach(element => {
                element.deactivate(renderData);
            });
        }
        /**
         * 添加组件到指定位置
         * @param component		被添加的组件
         * @param index			插入的位置
         */
        addComponentAt(component, index) {
            super.addComponentAt(component, index);
            if (component != null && feng3d.is(component, RenderDataHolder)) {
                var renderDataHolder = feng3d.as(component, RenderDataHolder);
                var index = this._subRenderDataHolders.indexOf(renderDataHolder);
                if (index == -1) {
                    this._subRenderDataHolders.splice(index, 0, renderDataHolder);
                }
            }
        }
        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        removeComponentAt(index) {
            var component = this.components[index];
            if (component != null && feng3d.is(component, RenderDataHolder)) {
                var renderDataHolder = feng3d.as(component, RenderDataHolder);
                var index = this._subRenderDataHolders.indexOf(renderDataHolder);
                if (index != -1) {
                    this._subRenderDataHolders.splice(index, 1);
                }
            }
            return super.removeComponentAt(index);
        }
    }
    feng3d.RenderDataHolder = RenderDataHolder;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     * @author feng 2016-06-20
     */
    class RenderAtomic {
        constructor() {
            /**
             * 属性数据列表
             */
            this.attributes = {};
            /**
             * 常量数据（包含纹理）列表
             */
            this.uniforms = {};
            /**
             * 渲染参数
             */
            this.shaderParams = {};
            /**
             * 着色器宏定义
             */
            this.shaderMacro = new feng3d.ShaderMacro();
        }
    }
    feng3d.RenderAtomic = RenderAtomic;
    /**
     * 渲染所需数据
     * @author feng 2016-12-28
     */
    class RenderData extends RenderAtomic {
    }
    feng3d.RenderData = RenderData;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 索引渲染数据
     * @author feng 2017-01-04
     */
    class IndexRenderData {
        constructor() {
            /**
             * 数据绑定目标，gl.ARRAY_BUFFER、gl.ELEMENT_ARRAY_BUFFER
             */
            this.target = WebGLRenderingContext.ELEMENT_ARRAY_BUFFER;
            /**
             * 数据类型，gl.UNSIGNED_BYTE、gl.UNSIGNED_SHORT
             */
            this.type = WebGLRenderingContext.UNSIGNED_SHORT;
            /**
             * 索引偏移
             */
            this.offset = 0;
        }
    }
    feng3d.IndexRenderData = IndexRenderData;
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
        /**
         * 获取顶点属性缓冲
         * @param data  数据
         */
        getTexture(context3D, data) {
            return this.getContext3DBufferPool(context3D).getTexture(data);
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
            /**
             * 纹理缓冲
             */
            this.textureBuffer = new feng3d.Map();
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
         * 获取顶点属性缓冲
         * @param data  数据
         */
        getTexture(textureInfo) {
            var buffer = this.textureBuffer.get(textureInfo.pixels);
            if (buffer != null) {
                return buffer;
            }
            var context3D = this.context3D;
            var texture = context3D.createTexture(); // Create a texture object
            //绑定纹理
            context3D.bindTexture(textureInfo.textureType, texture);
            if (textureInfo.textureType == WebGLRenderingContext.TEXTURE_2D) {
                //设置纹理图片
                context3D.texImage2D(textureInfo.textureType, 0, textureInfo.internalformat, textureInfo.format, textureInfo.type, textureInfo.pixels);
            }
            else if (textureInfo.textureType == WebGLRenderingContext.TEXTURE_CUBE_MAP) {
                var faces = [
                    WebGLRenderingContext.TEXTURE_CUBE_MAP_POSITIVE_X, WebGLRenderingContext.TEXTURE_CUBE_MAP_POSITIVE_Y, WebGLRenderingContext.TEXTURE_CUBE_MAP_POSITIVE_Z,
                    WebGLRenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_X, WebGLRenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_Y, WebGLRenderingContext.TEXTURE_CUBE_MAP_NEGATIVE_Z
                ];
                for (var i = 0; i < faces.length; i++) {
                    context3D.texImage2D(faces[i], 0, textureInfo.internalformat, textureInfo.format, textureInfo.type, textureInfo.pixels[i]);
                }
            }
            if (textureInfo.generateMipmap) {
                context3D.generateMipmap(textureInfo.textureType);
            }
            this.textureBuffer.push(textureInfo.pixels, texture);
            return texture;
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
     * 渲染数据工具
     * @author feng 2016-05-02
     */
    class RenderDataUtil {
        /**
         * 激活渲染数据
         * @param renderAtomic  渲染原子
         * @param renderData    包含渲染数据的对象
         */
        static active(renderAtomic, renderData) {
            renderData.vertexCode && (renderAtomic.vertexCode = renderData.vertexCode);
            renderData.fragmentCode && (renderAtomic.fragmentCode = renderData.fragmentCode);
            renderData.indexBuffer && (renderAtomic.indexBuffer = renderData.indexBuffer);
            for (var attributeName in renderData.attributes) {
                renderAtomic.attributes[attributeName] = renderData.attributes[attributeName];
            }
            for (var uniformName in renderData.uniforms) {
                renderAtomic.uniforms[uniformName] = renderData.uniforms[uniformName];
            }
            for (var shaderParamName in renderData.shaderParams) {
                renderAtomic.shaderParams[shaderParamName] = renderData.shaderParams[shaderParamName];
            }
            //ShaderMacro
            for (var boolMacroName in renderData.shaderMacro.boolMacros) {
                renderAtomic.shaderMacro.boolMacros[boolMacroName] = renderAtomic.shaderMacro.boolMacros[boolMacroName] || renderData.shaderMacro.boolMacros[boolMacroName];
            }
            for (var valueMacroName in renderData.shaderMacro.valueMacros) {
                renderAtomic.shaderMacro.valueMacros[valueMacroName] = renderData.shaderMacro.valueMacros[valueMacroName];
            }
            for (var addMacroName in renderData.shaderMacro.addMacros) {
                renderAtomic.shaderMacro.addMacros[addMacroName] = renderAtomic.shaderMacro.addMacros[addMacroName] + renderData.shaderMacro.addMacros[addMacroName];
            }
        }
        /**
         * 释放渲染数据
         * @param renderAtomic  渲染原子
         * @param renderData    包含渲染数据的对象
         */
        static deactivate(renderAtomic, renderData) {
            renderData.vertexCode && (renderAtomic.vertexCode = null);
            renderData.fragmentCode && (renderAtomic.fragmentCode = null);
            renderData.indexBuffer && (renderAtomic.indexBuffer = null);
            for (var attributeName in renderData.attributes) {
                delete renderAtomic.attributes[attributeName];
            }
            for (var uniformName in renderData.uniforms) {
                delete renderAtomic.uniforms[uniformName];
            }
            for (var shaderParamName in renderData.shaderParams) {
                delete renderAtomic.shaderParams[shaderParamName];
            }
            //ShaderMacro
            for (var boolMacroName in renderData.shaderMacro.boolMacros) {
                delete renderAtomic.shaderMacro.boolMacros[boolMacroName];
            }
            for (var valueMacroName in renderData.shaderMacro.valueMacros) {
                delete renderAtomic.shaderMacro.valueMacros[valueMacroName];
            }
            for (var addMacroName in renderData.shaderMacro.addMacros) {
                renderAtomic.shaderMacro.addMacros[addMacroName] = renderAtomic.shaderMacro.addMacros[addMacroName] - renderData.shaderMacro.addMacros[addMacroName];
            }
        }
    }
    feng3d.RenderDataUtil = RenderDataUtil;
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
    RenderDataID.u_modelMatrix = "u_modelMatrix";
    /**
     * 世界投影矩阵
     */
    RenderDataID.u_viewProjection = "u_viewProjection";
    RenderDataID.u_diffuseInput = "u_diffuseInput";
    /**
     * 漫反射贴图
     */
    RenderDataID.s_texture = "s_texture";
    /**
     * 天空盒纹理
     */
    RenderDataID.s_skyboxTexture = "s_skyboxTexture";
    /**
     * 摄像机矩阵
     */
    RenderDataID.u_cameraMatrix = "u_cameraMatrix";
    /**
     * 天空盒尺寸
     */
    RenderDataID.u_skyBoxSize = "u_skyBoxSize";
    /**
     * 地形混合贴图
     */
    RenderDataID.s_blendTexture = "s_blendTexture";
    /**
     * 地形块贴图1
     */
    RenderDataID.s_splatTexture1 = "s_splatTexture1";
    /**
     * 地形块贴图2
     */
    RenderDataID.s_splatTexture2 = "s_splatTexture2";
    /**
     * 地形块贴图3
     */
    RenderDataID.s_splatTexture3 = "s_splatTexture3";
    /**
     * 地形块重复次数
     */
    RenderDataID.u_splatRepeats = "u_splatRepeats";
    /**
     * 点光源位置数组
     */
    RenderDataID.u_pointLightPositions = "u_pointLightPositions";
    /**
     * 点光源颜色数组
     */
    RenderDataID.u_pointLightColors = "u_pointLightColors";
    /**
     * 点光源光照强度数组
     */
    RenderDataID.u_pointLightIntensitys = "u_pointLightIntensitys";
    /**
     * 基本颜色
     */
    RenderDataID.u_baseColor = "u_baseColor";
    /**
     * 反射率
     */
    RenderDataID.u_reflectance = "u_reflectance";
    /**
     * 粗糙度
     */
    RenderDataID.u_roughness = "u_roughness";
    /**
     * 金属度
     */
    RenderDataID.u_metalic = "u_metalic";
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
     * 着色器宏定义
     * @author feng 2016-12-17
     */
    class ShaderMacro {
        constructor() {
            /**
             * 值类型宏
             */
            this.valueMacros = new ValueMacros();
            /**
             * Boolean类型宏
             */
            this.boolMacros = new BoolMacros();
            /**
             * 递增类型宏
             */
            this.addMacros = new IAddMacros();
        }
    }
    feng3d.ShaderMacro = ShaderMacro;
    /**
     * 值类型宏
     * 没有默认值
     */
    class ValueMacros {
    }
    feng3d.ValueMacros = ValueMacros;
    /**
     * Boolean类型宏
     * 没有默认值
     */
    class BoolMacros {
    }
    feng3d.BoolMacros = BoolMacros;
    /**
     * 递增类型宏
     * 所有默认值为0
     */
    class IAddMacros {
        constructor() {
            /**
             * 是否需要属性uv
             */
            this.A_UV_NEED = 0;
            /**
             * 是否需要变量uv
             */
            this.V_UV_NEED = 0;
            /**
             * 是否需要变量全局坐标
             */
            this.V_GLOBAL_POSITION_NEED = 0;
            /**
             * 是否需要属性法线
             */
            this.A_NORMAL_NEED = 0;
            /**
             * 是否需要变量法线
             */
            this.V_NORMAL_NEED = 0;
            /**
             * 是否需要摄像机矩阵
             */
            this.U_CAMERAmATRIX_NEED = 0;
        }
    }
    feng3d.IAddMacros = IAddMacros;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染环境
     * @author feng 2017-01-04
     */
    class RenderContext {
        constructor() {
            this.renderData = new feng3d.RenderData();
            /**
             * 灯光
             */
            this.lights = [];
        }
        /**
         * 更新渲染数据
         */
        updateRenderData(object3D) {
            var pointLights = [];
            this.camera.updateRenderData(this);
            var light;
            for (var i = 0; i < this.lights.length; i++) {
                light = this.lights[i];
                light.updateRenderData(this);
                if (light.type == feng3d.LightType.Point)
                    pointLights.push(light);
            }
            //收集点光源数据
            var pointLightPositions = [];
            var pointLightDiffuses = [];
            var pointLightIntensitys = [];
            for (var i = 0; i < pointLights.length; i++) {
                light = pointLights[i];
                pointLightPositions.push(light.position);
                pointLightDiffuses.push(light.color.toVector3D());
                pointLightIntensitys.push(light.intensity);
            }
            //设置点光源数据
            this.renderData.shaderMacro.valueMacros.NUM_POINTLIGHT = pointLights.length;
            if (pointLights.length > 0) {
                this.renderData.shaderMacro.addMacros.A_NORMAL_NEED = 1;
                this.renderData.shaderMacro.addMacros.V_NORMAL_NEED = 1;
                this.renderData.shaderMacro.addMacros.V_GLOBAL_POSITION_NEED = 1;
                this.renderData.shaderMacro.addMacros.U_CAMERAmATRIX_NEED = 1;
                //
                this.renderData.uniforms[feng3d.RenderDataID.u_pointLightPositions] = pointLightPositions;
                this.renderData.uniforms[feng3d.RenderDataID.u_pointLightColors] = pointLightDiffuses;
                this.renderData.uniforms[feng3d.RenderDataID.u_pointLightIntensitys] = pointLightIntensitys;
            }
        }
        /**
         * 激活
         * @param renderData	渲染数据
         */
        activate(renderData) {
            feng3d.RenderDataUtil.active(renderData, this.renderData);
            this.camera.activate(renderData);
        }
        /**
         * 释放
         * @param renderData	渲染数据
         */
        deactivate(renderData) {
            feng3d.RenderDataUtil.deactivate(renderData, this.renderData);
            this.camera.deactivate(renderData);
        }
        /**
         * 清理
         */
        clear() {
            this.camera = null;
            this.lights = [];
        }
    }
    feng3d.RenderContext = RenderContext;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D对象
     * @author feng 2016-04-26
     */
    class Object3D extends feng3d.RenderDataHolder {
        /**
         * 构建3D对象
         */
        constructor(name) {
            super();
            /**
             * 父对象
             */
            this._parent = null;
            /**
             * 子对象列表
             */
            this._children = [];
            this.name = name || this.uid;
            //
            this.transform = new feng3d.Transform();
            //
            this.addEventListener(feng3d.Object3DEvent.ADDED, this.onAdded, this);
            this.addEventListener(feng3d.Object3DEvent.REMOVED, this.onRemoved, this);
        }
        /**
         * 唯一标识符
         */
        get uid() {
            return feng3d.getUID(this);
        }
        /**
         * 变换
         */
        get transform() {
            return this._transform;
        }
        set transform(value) {
            feng3d.assert(value != null, "3D空间不能为null");
            this._transform && this.removeComponent(this._transform);
            this._transform = value;
            this._transform && this.addComponentAt(this._transform, 0);
        }
        /**
         * 父对象
         */
        get parent() {
            return this._parent;
        }
        _setParent(value) {
            if (this._parent == value)
                return;
            this._parent = value;
            if (this._parent == null)
                this._setScene(null);
            else if (feng3d.is(this.parent, feng3d.Scene3D))
                this._setScene(this.parent);
            else
                this._setScene(this.parent.scene);
        }
        /**
         * 场景
         */
        get scene() {
            return this._scene;
        }
        _setScene(value) {
            if (this._scene == value)
                return;
            if (this._scene) {
                this.dispatchEvent(new feng3d.Scene3DEvent(feng3d.Scene3DEvent.REMOVED_FROM_SCENE, { object3d: this, scene: this._scene }));
                this._scene.dispatchEvent(new feng3d.Scene3DEvent(feng3d.Scene3DEvent.REMOVED_FROM_SCENE, { object3d: this, scene: this._scene }));
            }
            this._scene = value;
            if (this._scene) {
                this.dispatchEvent(new feng3d.Scene3DEvent(feng3d.Scene3DEvent.ADDED_TO_SCENE, { object3d: this, scene: this._scene }));
                this._scene.dispatchEvent(new feng3d.Scene3DEvent(feng3d.Scene3DEvent.ADDED_TO_SCENE, { object3d: this, scene: this._scene }));
            }
            this._children.forEach(child => {
                child._setScene(this._scene);
            });
        }
        /**
         * 添加子对象
         * @param child		子对象
         * @return			新增的子对象
         */
        addChild(child) {
            this.addChildAt(child, this._children.length);
        }
        /**
         * 添加子对象到指定位置
         * @param   child   子对象
         * @param   index   添加到的位置
         */
        addChildAt(child, index) {
            feng3d.assert(-1 < index && index <= this._children.length, "添加子对象的索引越界！");
            this._children.splice(index, 0, child);
            child.dispatchEvent(new feng3d.Object3DEvent(feng3d.Object3DEvent.ADDED, { parent: this, child: child }, true));
        }
        /**
         * 移除子对象
         * @param   child   子对象
         * @return			被移除子对象索引
         */
        removeChild(child) {
            var childIndex = this._children.indexOf(child);
            feng3d.assert(-1 < childIndex && childIndex < this._children.length, "删除的子对象不存在！");
            this.removeChildAt(childIndex);
            return childIndex;
        }
        /**
         * 获取子对象索引
         * @param   child   子对象
         * @return  子对象位置
         */
        getChildIndex(child) {
            return this._children.indexOf(child);
        }
        /**
         * 移出指定索引的子对象
         * @param childIndex	子对象索引
         * @return				被移除对象
         */
        removeChildAt(childIndex) {
            var child = this._children[childIndex];
            feng3d.assert(-1 < childIndex && childIndex < this._children.length, "删除的索引越界！");
            this._children.splice(childIndex, 1);
            child.dispatchEvent(new feng3d.Object3DEvent(feng3d.Object3DEvent.REMOVED, { parent: this, child: child }, true));
            return child;
        }
        /**
         * 获取子对象
         * @param index         子对象索引
         * @return              指定索引的子对象
         */
        getChildAt(index) {
            return this._children[index];
        }
        /**
         * 获取子对象数量
         */
        get numChildren() {
            return this._children.length;
        }
        /**
         * 处理添加子对象事件
         */
        onAdded(event) {
            if (event.data.child == this) {
                this._setParent(event.data.parent);
            }
        }
        /**
         * 处理删除子对象事件
         */
        onRemoved(event) {
            if (event.data.child == this) {
                this._setParent(null);
            }
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
            this._canvas = canvas;
            this._context3D = this._canvas.getContext("experimental-webgl");
            this._context3D || alert("Unable to initialize WebGL. Your browser may not support it.");
            this.initGL();
            this.scene = scene || new feng3d.Scene3D();
            this.camera = camera || new feng3d.Camera3D();
            setInterval(this.drawScene.bind(this), 15);
        }
        /**
         * 初始化GL
         */
        initGL() {
            this._context3D.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
            this._context3D.clearDepth(1.0); // Clear everything
            this._context3D.enable(this._context3D.DEPTH_TEST); // Enable depth testing
            this._context3D.depthFunc(this._context3D.LEQUAL); // Near things obscure far things
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
            this._scene.draw(this._context3D, this._camera);
        }
        /**
         * 重置尺寸
         */
        resize() {
            if (this.renderWidth != this._canvas.width || this.renderHeight != this._canvas.height) {
                this.renderWidth = this._canvas.width;
                this.renderHeight = this._canvas.height;
                this._context3D.viewport(0, 0, this.renderWidth, this.renderHeight);
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
    class Object3DComponent extends feng3d.RenderDataHolder {
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
        /**
         * 全局矩阵
         */
        get globalMatrix3d() {
            return this.object3D ? this.object3D.transform.globalMatrix3D : new feng3d.Matrix3D();
        }
    }
    feng3d.Object3DComponent = Object3DComponent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 变换
     * @author feng 2016-04-26
     */
    class Transform extends feng3d.Object3DComponent {
        /**
         * 构建变换
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
            //
            this._matrix3D = new feng3d.Matrix3D();
            this._inverseMatrix3D = new feng3d.Matrix3D();
            /**
             * 全局矩阵
             */
            this._globalMatrix3D = new feng3d.Matrix3D();
            this._inverseGlobalMatrix3D = new feng3d.Matrix3D();
            this._x = x;
            this._y = y;
            this._z = z;
            this._rx = rx;
            this._ry = ry;
            this._rz = rz;
            this._sx = sx;
            this._sy = sy;
            this._sz = sz;
            this.invalidateMatrix3D();
        }
        /**
         * X坐标
         */
        get x() { return this._x; }
        set x(value) { this._x = value; this.invalidateMatrix3D(); }
        /**
         * Y坐标
         */
        get y() { return this._y; }
        set y(value) { this._y = value; this.invalidateMatrix3D(); }
        /**
         * Z坐标
         */
        get z() { return this._z; }
        set z(value) { this._z = value; this.invalidateMatrix3D(); }
        /**
         * X旋转
         */
        get rx() { return this._rx; }
        set rx(value) { this._rx = value; this.invalidateMatrix3D(); }
        /**
         * Y旋转
         */
        get ry() { return this._ry; }
        set ry(value) { this._ry = value; this.invalidateMatrix3D(); }
        /**
         * Z旋转
         */
        get rz() { return this._rz; }
        set rz(value) { this._rz = value; this.invalidateMatrix3D(); }
        /**
         * X缩放
         */
        get sx() { return this._sx; }
        set sx(value) { this._sx = value; this.invalidateMatrix3D(); }
        /**
         * Y缩放
         */
        get sy() { return this._sy; }
        set sy(value) { this._sy = value; this.invalidateMatrix3D(); }
        /**
         * Z缩放
         */
        get sz() { return this._sz; }
        set sz(value) { this._sz = value; this.invalidateMatrix3D(); }
        /**
         * 位移
         */
        get position() { return new feng3d.Vector3D(this.x, this.y, this.z); }
        ;
        set position(value) { this._x = value.x; this._y = value.y; this._z = value.z; this.invalidateMatrix3D(); }
        /**
         * 旋转
         */
        get rotation() { return new feng3d.Vector3D(this.rx, this.ry, this.rz); }
        set rotation(value) { this._rx = value.x; this._ry = value.y; this._rz = value.z; this.invalidateMatrix3D(); }
        /**
         * 缩放
         */
        get scale() { return new feng3d.Vector3D(this.sx, this.sy, this.sz); }
        set scale(value) { this._sx = value.x; this._sy = value.y; this._sz = value.z; this.invalidateMatrix3D(); }
        /**
         * 全局坐标
         */
        get globalPosition() {
            return this.globalMatrix3D.position;
        }
        /**
         * 变换矩阵
         */
        get matrix3d() {
            if (this._matrix3DDirty)
                this.updateMatrix3D();
            return this._matrix3D;
        }
        set matrix3d(value) {
            this._matrix3DDirty = false;
            this._matrix3D.rawData.set(value.rawData);
            var vecs = this._matrix3D.decompose();
            this._x = vecs[0].x;
            this._y = vecs[0].y;
            this._z = vecs[0].z;
            this._rx = vecs[1].x * feng3d.MathConsts.RADIANS_TO_DEGREES;
            this._ry = vecs[1].y * feng3d.MathConsts.RADIANS_TO_DEGREES;
            this._rz = vecs[1].z * feng3d.MathConsts.RADIANS_TO_DEGREES;
            this._sx = vecs[2].x;
            this._sy = vecs[2].y;
            this._sz = vecs[2].z;
            this.notifyMatrix3DChanged();
            this.invalidateGlobalMatrix3D();
        }
        /**
         * 逆变换矩阵
         */
        get inverseMatrix3D() {
            if (this._inverseMatrix3DDirty) {
                this._inverseMatrix3D.copyFrom(this.matrix3d);
                this._inverseMatrix3D.invert();
                this._inverseMatrix3DDirty = false;
            }
            return this._inverseMatrix3D;
        }
        /**
         * 看向目标位置
         * @param target    目标位置
         * @param upAxis    向上朝向
         */
        lookAt(target, upAxis = null) {
            this.matrix3d.lookAt(target, upAxis);
            this.matrix3d = this.matrix3d;
        }
        /**
         * 全局矩阵
         */
        get globalMatrix3D() {
            this._globalMatrix3DDirty && this.updateGlobalMatrix3D();
            return this._globalMatrix3D;
        }
        /**
         * 逆全局矩阵
         */
        get inverseGlobalMatrix3D() {
            this._inverseGlobalMatrix3DDirty && this.updateInverseGlobalMatrix3D();
            return this._inverseGlobalMatrix3D;
        }
        /**
         * 变换矩阵
         */
        updateMatrix3D() {
            this._matrix3D.recompose([
                new feng3d.Vector3D(this.x, this.y, this.z),
                new feng3d.Vector3D(this.rx * feng3d.MathConsts.DEGREES_TO_RADIANS, this.ry * feng3d.MathConsts.DEGREES_TO_RADIANS, this.rz * feng3d.MathConsts.DEGREES_TO_RADIANS),
                new feng3d.Vector3D(this.sx, this.sy, this.sz),
            ]);
            this._matrix3DDirty = false;
        }
        /**
         * 使变换矩阵无效
         */
        invalidateMatrix3D() {
            this._matrix3DDirty = true;
            this.notifyMatrix3DChanged();
            //
            this.invalidateGlobalMatrix3D();
        }
        /**
         * 发出状态改变消息
         */
        notifyMatrix3DChanged() {
            var transformChanged = new TransfromEvent(TransfromEvent.TRANSFORM_CHANGED, this);
            this.object3D && this.object3D.dispatchEvent(transformChanged);
        }
        /**
         * 更新全局矩阵
         */
        updateGlobalMatrix3D() {
            this._globalMatrix3DDirty = false;
            this._globalMatrix3D.copyFrom(this.matrix3d);
            if (this.object3D.parent != null) {
                var parentGlobalMatrix3D = this.object3D.parent.transform.globalMatrix3D;
                this._globalMatrix3D.append(parentGlobalMatrix3D);
            }
        }
        /**
         * 更新逆全局矩阵
         */
        updateInverseGlobalMatrix3D() {
            this._inverseGlobalMatrix3DDirty = false;
            this._inverseGlobalMatrix3D.copyFrom(this.globalMatrix3D);
            this._inverseGlobalMatrix3D.invert();
        }
        /**
         * 通知全局变换改变
         */
        notifySceneTransformChange() {
            var sceneTransformChanged = new TransfromEvent(TransfromEvent.SCENETRANSFORM_CHANGED, this);
            this.object3D && this.object3D.dispatchEvent(sceneTransformChanged);
        }
        /**
         * 全局变换矩阵失效
         * @private
         */
        invalidateGlobalMatrix3D() {
            this._globalMatrix3DDirty = true;
            this._inverseGlobalMatrix3DDirty = true;
            this.notifySceneTransformChange();
            //
            if (this.object3D) {
                for (var i = 0; i < this.object3D.numChildren; i++) {
                    var element = this.object3D.getChildAt(i);
                    element.transform.invalidateGlobalMatrix3D();
                }
            }
        }
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext) {
            super.updateRenderData(renderContext);
            this.renderData.uniforms[feng3d.RenderDataID.u_modelMatrix] = this.globalMatrix3D;
        }
    }
    feng3d.Transform = Transform;
    /**
     * 变换事件(3D状态发生改变、位置、旋转、缩放)
     * @author feng 2014-3-31
     */
    class TransfromEvent extends feng3d.Event {
        /**
         * 创建一个作为参数传递给事件侦听器的 Event 对象。
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type, data, bubbles = false) {
            super(type, data, bubbles);
        }
    }
    /**
     * 平移
     */
    TransfromEvent.POSITION_CHANGED = "positionChanged";
    /**
     * 旋转
     */
    TransfromEvent.ROTATION_CHANGED = "rotationChanged";
    /**
     * 缩放
     */
    TransfromEvent.SCALE_CHANGED = "scaleChanged";
    /**
     * 变换
     */
    TransfromEvent.TRANSFORM_CHANGED = "transformChanged";
    /**
     * 变换已更新
     */
    TransfromEvent.TRANSFORM_UPDATED = "transformUpdated";
    /**
     * 场景变换矩阵发生变化
     */
    TransfromEvent.SCENETRANSFORM_CHANGED = "scenetransformChanged";
    feng3d.TransfromEvent = TransfromEvent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D对象事件
     */
    class Object3DEvent extends feng3d.Event {
        /**
         * 创建一个作为参数传递给事件侦听器的 Event 对象。
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type, data = null, bubbles = false) {
            super(type, data, bubbles);
        }
    }
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
     * 网格
     * @author feng 2016-12-12
     */
    class MeshFilter extends feng3d.Object3DComponent {
        /**
         * 几何体
         */
        get geometry() {
            return this._geometry;
        }
        set geometry(value) {
            this._geometry && this.removeComponent(this._geometry);
            this._geometry = value;
            this._geometry && this.addComponent(this._geometry);
        }
    }
    feng3d.MeshFilter = MeshFilter;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渲染器
     * @author feng 2016-05-01
     */
    class Renderer extends feng3d.Object3DComponent {
        constructor() {
            super(...arguments);
            /** 渲染原子 */
            this._renderAtomic = new feng3d.RenderAtomic();
        }
        /**
         * 渲染
         */
        draw(context3D, renderContext) {
            //更新数据
            renderContext.updateRenderData(this.object3D);
            this.object3D.updateRenderData(renderContext);
            //收集数据
            renderContext.activate(this._renderAtomic);
            this.object3D.activate(this._renderAtomic);
            //绘制
            this.drawObject3D(context3D); //
            //释放数据
            this.object3D.deactivate(this._renderAtomic);
            renderContext.deactivate(this._renderAtomic);
        }
        /**
         * 绘制3D对象
         */
        drawObject3D(context3D) {
            if (!this._renderAtomic.vertexCode || !this._renderAtomic.fragmentCode)
                return;
            samplerIndex = 0;
            var vertexCode = this._renderAtomic.vertexCode;
            var fragmentCode = this._renderAtomic.fragmentCode;
            //应用宏
            vertexCode = feng3d.ShaderLib.getMacroCode(this._renderAtomic.shaderMacro) + vertexCode;
            fragmentCode = feng3d.ShaderLib.getMacroCode(this._renderAtomic.shaderMacro) + fragmentCode;
            //渲染程序
            var shaderProgram = feng3d.context3DPool.getWebGLProgram(context3D, vertexCode, fragmentCode);
            context3D.useProgram(shaderProgram);
            //
            activeAttributes(context3D, shaderProgram, this._renderAtomic.attributes);
            activeUniforms(context3D, shaderProgram, this._renderAtomic.uniforms);
            dodraw(context3D, this._renderAtomic.shaderParams, this._renderAtomic.indexBuffer);
        }
    }
    feng3d.Renderer = Renderer;
    var samplerIndex = 0;
    /**
     * 激活属性
     */
    function activeAttributes(context3D, shaderProgram, attributes) {
        var numAttributes = context3D.getProgramParameter(shaderProgram, context3D.ACTIVE_ATTRIBUTES);
        var i = 0;
        while (i < numAttributes) {
            var activeInfo = context3D.getActiveAttrib(shaderProgram, i++);
            var buffer = attributes[activeInfo.name];
            setContext3DAttribute(context3D, shaderProgram, activeInfo, buffer.data);
        }
    }
    /**
     * 激活常量
     */
    function activeUniforms(context3D, shaderProgram, uniforms) {
        var numUniforms = context3D.getProgramParameter(shaderProgram, context3D.ACTIVE_UNIFORMS);
        var i = 0;
        while (i < numUniforms) {
            var activeInfo = context3D.getActiveUniform(shaderProgram, i++);
            if (activeInfo.name.indexOf("[") != -1) {
                //处理数组
                var baseName = activeInfo.name.substring(0, activeInfo.name.indexOf("["));
                for (var j = 0; j < activeInfo.size; j++) {
                    setContext3DUniform(context3D, shaderProgram, { name: baseName + `[${j}]`, type: activeInfo.type }, uniforms[baseName][j]);
                }
            }
            else {
                setContext3DUniform(context3D, shaderProgram, activeInfo, uniforms[activeInfo.name]);
            }
        }
    }
    /**
     */
    function dodraw(context3D, shaderParams, indexBuffer) {
        var buffer = feng3d.context3DPool.getIndexBuffer(context3D, indexBuffer.indices);
        context3D.bindBuffer(indexBuffer.target, buffer);
        context3D.lineWidth(1);
        context3D.drawElements(shaderParams.renderMode, indexBuffer.count, indexBuffer.type, indexBuffer.offset);
    }
    /**
     * 设置环境属性数据
     */
    function setContext3DAttribute(context3D, shaderProgram, activeInfo, data) {
        var location = context3D.getAttribLocation(shaderProgram, activeInfo.name);
        context3D.enableVertexAttribArray(location);
        //
        var squareVerticesBuffer = feng3d.context3DPool.getVABuffer(context3D, data);
        context3D.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, squareVerticesBuffer);
        switch (activeInfo.type) {
            case WebGLRenderingContext.FLOAT_VEC3:
                context3D.vertexAttribPointer(location, 3, WebGLRenderingContext.FLOAT, false, 0, 0);
                break;
            case WebGLRenderingContext.FLOAT_VEC2:
                context3D.vertexAttribPointer(location, 2, WebGLRenderingContext.FLOAT, false, 0, 0);
                break;
            default:
                throw `无法识别的attribute类型 ${activeInfo.name} ${data}`;
        }
    }
    /**
     * 设置环境Uniform数据
     */
    function setContext3DUniform(context3D, shaderProgram, activeInfo, data) {
        var location = context3D.getUniformLocation(shaderProgram, activeInfo.name);
        switch (activeInfo.type) {
            case WebGLRenderingContext.FLOAT_MAT4:
                context3D.uniformMatrix4fv(location, false, data.rawData);
                break;
            case WebGLRenderingContext.FLOAT:
                context3D.uniform1f(location, data);
                break;
            case WebGLRenderingContext.FLOAT_VEC3:
                context3D.uniform3f(location, data.x, data.y, data.z);
                break;
            case WebGLRenderingContext.FLOAT_VEC4:
                context3D.uniform4f(location, data.x, data.y, data.z, data.w);
                break;
            case WebGLRenderingContext.SAMPLER_2D:
            case WebGLRenderingContext.SAMPLER_CUBE:
                var textureInfo = data;
                var texture = feng3d.context3DPool.getTexture(context3D, textureInfo);
                //激活纹理编号
                context3D.activeTexture(WebGLRenderingContext["TEXTURE" + samplerIndex]);
                //绑定纹理
                context3D.bindTexture(textureInfo.textureType, texture);
                //设置图片y轴方向
                context3D.pixelStorei(WebGLRenderingContext.UNPACK_FLIP_Y_WEBGL, textureInfo.flipY);
                //设置纹理参数
                context3D.texParameteri(textureInfo.textureType, WebGLRenderingContext.TEXTURE_MIN_FILTER, textureInfo.minFilter);
                context3D.texParameteri(textureInfo.textureType, WebGLRenderingContext.TEXTURE_MAG_FILTER, textureInfo.magFilter);
                context3D.texParameteri(textureInfo.textureType, WebGLRenderingContext.TEXTURE_WRAP_S, textureInfo.wrapS);
                context3D.texParameteri(textureInfo.textureType, WebGLRenderingContext.TEXTURE_WRAP_T, textureInfo.wrapT);
                //设置纹理所在采样编号
                context3D.uniform1i(location, samplerIndex);
                samplerIndex++;
                break;
            default:
                throw `无法识别的uniform类型 ${activeInfo.name} ${data}`;
        }
    }
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 网格渲染器
     * @author feng 2016-12-12
     */
    class MeshRenderer extends feng3d.Renderer {
        constructor() {
            super();
            this.material = new feng3d.ColorMaterial();
        }
        /**
         * 材质
         */
        get material() {
            return this._material;
        }
        set material(value) {
            this._material && this.removeComponent(this._material);
            this._material = value;
            this._material && this.addComponent(this._material);
        }
        /**
         * 处理被添加组件事件
         */
        onBeAddedComponent(event) {
            this.object3D.addEventListener(feng3d.Scene3DEvent.ADDED_TO_SCENE, this.onAddedToScene, this);
            this.object3D.addEventListener(feng3d.Scene3DEvent.REMOVED_FROM_SCENE, this.onRemovedFromScene, this);
            if (this.object3D.scene) {
                this.object3D.scene.dispatchEvent(new feng3d.Scene3DEvent(feng3d.Scene3DEvent.ADDED_RENDERER_TO_SCENE, { renderer: this }));
            }
        }
        /**
         * 处理被移除组件事件
         */
        onBeRemovedComponent(event) {
            this.object3D.removeEventListener(feng3d.Scene3DEvent.ADDED_TO_SCENE, this.onAddedToScene, this);
            this.object3D.removeEventListener(feng3d.Scene3DEvent.REMOVED_FROM_SCENE, this.onRemovedFromScene, this);
            if (this.object3D.scene) {
                this.object3D.scene.dispatchEvent(new feng3d.Scene3DEvent(feng3d.Scene3DEvent.REMOVED_RENDERER_FROM_SCENE, { renderer: this }));
            }
        }
        /**
         * 处理添加到场景事件
         */
        onAddedToScene(event) {
            event.data.scene.dispatchEvent(new feng3d.Scene3DEvent(feng3d.Scene3DEvent.ADDED_RENDERER_TO_SCENE, { renderer: this }));
        }
        /**
         * 处理从场景移除事件
         */
        onRemovedFromScene(event) {
            event.data.scene.dispatchEvent(new feng3d.Scene3DEvent(feng3d.Scene3DEvent.REMOVED_RENDERER_FROM_SCENE, { renderer: this }));
        }
    }
    feng3d.MeshRenderer = MeshRenderer;
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
            this._renderContext = new feng3d.RenderContext();
            this._object3Ds = [];
            this._renderers = [];
            this._lights = [];
            this.addEventListener(feng3d.Scene3DEvent.ADDED_TO_SCENE, this.onAddedToScene, this);
            this.addEventListener(feng3d.Scene3DEvent.REMOVED_FROM_SCENE, this.onRemovedFromScene, this);
            this.addEventListener(feng3d.Scene3DEvent.ADDED_RENDERER_TO_SCENE, this.onAddedRendererToScene, this);
            this.addEventListener(feng3d.Scene3DEvent.REMOVED_RENDERER_FROM_SCENE, this.onRemovedRendererFromScene, this);
            this.addEventListener(feng3d.Scene3DEvent.ADDED_LIGHT_TO_SCENE, this.onAddedLightToScene, this);
            this.addEventListener(feng3d.Scene3DEvent.REMOVED_LIGHT_FROM_SCENE, this.onRemovedLightFromScene, this);
        }
        /**
         * 渲染列表
         */
        get renderers() {
            return this._renderers;
        }
        /**
         * 灯光列表
         */
        get lights() {
            return this._lights;
        }
        /**
         * 处理添加对象事件
         */
        onAddedToScene(event) {
            this._object3Ds.push(event.data.object3d);
        }
        /**
         * 处理移除对象事件
         */
        onRemovedFromScene(event) {
            feng3d.ArrayUtils.removeItem(this._object3Ds, event.data.object3d);
        }
        /**
         * 处理添加对象事件
         */
        onAddedRendererToScene(event) {
            this._renderers.push(event.data.renderer);
        }
        /**
         * 处理移除对象事件
         */
        onRemovedRendererFromScene(event) {
            feng3d.ArrayUtils.removeItem(this._renderers, event.data.renderer);
        }
        /**
         * 处理添加灯光事件
         */
        onAddedLightToScene(event) {
            this._lights.push(event.data.light);
        }
        /**
         * 处理移除灯光事件
         */
        onRemovedLightFromScene(event) {
            feng3d.ArrayUtils.removeItem(this._lights, event.data.light);
        }
        /**
         * 渲染
         */
        draw(context3D, camera) {
            //初始化渲染环境
            this._renderContext.clear();
            this._renderContext.camera = camera;
            this._renderContext.lights = this._lights;
            //
            context3D.clear(context3D.COLOR_BUFFER_BIT | context3D.DEPTH_BUFFER_BIT);
            var renderables = this.renderers;
            renderables.forEach(element => {
                element.draw(context3D, this._renderContext);
            });
        }
    }
    feng3d.Scene3D = Scene3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D场景事件
     * @author feng 2016-01-03
     */
    class Scene3DEvent extends feng3d.Event {
        /**
         * 创建一个作为参数传递给事件侦听器的 Event 对象。
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type, data = null, bubbles = false) {
            super(type, data, bubbles);
        }
    }
    /**
     * 当Object3D的scene属性被设置是由Object3D与Scene3D分别派发不冒泡事件
     */
    Scene3DEvent.ADDED_TO_SCENE = "addedToScene";
    /**
     * 当Object3D的scene属性被清空时由Object3D与Scene3D分别派发不冒泡事件
     */
    Scene3DEvent.REMOVED_FROM_SCENE = "removedFromScene";
    /**
     * 当拥有Light的Object3D添加到Scene3D或者Light添加到场景中的Object3D时派发不冒泡事件
     */
    Scene3DEvent.ADDED_LIGHT_TO_SCENE = "addedLightToScene";
    /**
     * 当拥有Light的Object3D从Scene3D中移除或者Light从场景中的Object3D移除时派发不冒泡事件
     */
    Scene3DEvent.REMOVED_LIGHT_FROM_SCENE = "removedLightFromScene";
    /**
     * 当拥有Renderer的Object3D添加到Scene3D或者Renderer添加到场景中的Object3D时派发不冒泡事件
     */
    Scene3DEvent.ADDED_RENDERER_TO_SCENE = "addedRendererToScene";
    /**
     * 当拥有Renderer的Object3D从Scene3D中移除或者Renderer从场景中的Object3D移除时派发不冒泡事件
     */
    Scene3DEvent.REMOVED_RENDERER_FROM_SCENE = "removedRendererFromScene";
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
    GLAttribute.a_position = "a_position";
    /**
     * 法线
     */
    GLAttribute.a_normal = "a_normal";
    /**
     * 切线
     */
    GLAttribute.a_tangent = "a_tangent";
    /**
     * uv（纹理坐标）
     */
    GLAttribute.a_uv = "a_uv";
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
        }
        /**
         * 更新顶点索引数据
         */
        setIndices(indices) {
            this.renderData.indexBuffer = new feng3d.IndexRenderData();
            this.renderData.indexBuffer.indices = indices;
            this.renderData.indexBuffer.count = indices.length;
            this.dispatchEvent(new feng3d.GeometryEvent(feng3d.GeometryEvent.CHANGED_INDEX_DATA));
        }
        /**
         * 设置顶点属性数据
         * @param vaId          顶点属性编号
         * @param data          顶点属性数据
         * @param stride        顶点数据步长
         */
        setVAData(vaId, data, stride) {
            this.renderData.attributes[vaId] = { data: data, stride: stride };
            this.dispatchEvent(new feng3d.GeometryEvent(feng3d.GeometryEvent.CHANGED_VA_DATA, vaId));
        }
        /**
         * 获取顶点属性数据
         * @param vaId 数据类型编号
         * @return 顶点属性数据
         */
        getVAData(vaId) {
            this.dispatchEvent(new feng3d.GeometryEvent(feng3d.GeometryEvent.GET_VA_DATA, vaId));
            return this.renderData.attributes[vaId];
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
     * 线段组件
     * @author feng 2016-10-16
     */
    class SegmentGeometry extends feng3d.Geometry {
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
            this.setVAData(feng3d.GLAttribute.a_position, positionData, 3);
            this.setIndices(indices);
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
     * 几何体组件
     * @author feng 2016-10-16
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
    class Camera3D extends feng3d.Object3DComponent {
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
        }
        /**
         * 镜头
         */
        get lens() {
            return this._lens;
        }
        /**
         * 场景投影矩阵，世界空间转投影空间
         */
        get viewProjection() {
            if (this._viewProjectionDirty) {
                var inverseSceneTransform = this.object3D ? this.object3D.transform.inverseGlobalMatrix3D : new feng3d.Matrix3D();
                //场景空间转摄像机空间
                this._viewProjection.copyFrom(inverseSceneTransform);
                //+摄像机空间转投影空间 = 场景空间转投影空间
                this._viewProjection.append(this._lens.matrix);
                this._viewProjectionDirty = false;
            }
            return this._viewProjection;
        }
        /**
         * 处理被添加组件事件
         */
        onBeAddedComponent(event) {
            this.object3D.addEventListener(feng3d.TransfromEvent.TRANSFORM_CHANGED, this.onSpaceTransformChanged, this);
        }
        /**
         * 处理被移除组件事件
         */
        onBeRemovedComponent(event) {
            this.object3D.removeEventListener(feng3d.TransfromEvent.TRANSFORM_CHANGED, this.onSpaceTransformChanged, this);
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
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext) {
            super.updateRenderData(renderContext);
            //
            this.renderData.uniforms[feng3d.RenderDataID.u_viewProjection] = this.viewProjection;
            this.renderData.uniforms[feng3d.RenderDataID.u_cameraMatrix] = this.globalMatrix3d;
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
        function createPlane(width = 100, height = 100, segmentsW = 1, segmentsH = 1, yUp = true, elements = [feng3d.GLAttribute.a_position, feng3d.GLAttribute.a_uv, feng3d.GLAttribute.a_normal, feng3d.GLAttribute.a_tangent]) {
            var geometry = new feng3d.Geometry();
            elements.forEach(element => {
                switch (element) {
                    case feng3d.GLAttribute.a_position:
                        var vertexPositionData = buildPosition(width, height, segmentsW, segmentsH, yUp);
                        geometry.setVAData(element, vertexPositionData, 3);
                        break;
                    case feng3d.GLAttribute.a_normal:
                        var vertexNormalData = buildNormal(segmentsW, segmentsH, yUp);
                        geometry.setVAData(element, vertexNormalData, 3);
                        break;
                    case feng3d.GLAttribute.a_tangent:
                        var vertexTangentData = buildTangent(segmentsW, segmentsH, yUp);
                        geometry.setVAData(element, vertexTangentData, 3);
                        break;
                    case feng3d.GLAttribute.a_uv:
                        var uvData = buildUVs(segmentsW, segmentsH);
                        geometry.setVAData(element, uvData, 2);
                        break;
                    default:
                        throw (`不支持为平面创建顶点属性 ${element}`);
                }
            });
            var indices = buildIndices(segmentsW, segmentsH, yUp);
            geometry.setIndices(indices);
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
        function createCube(width = 100, height = 100, depth = 100, segmentsW = 1, segmentsH = 1, segmentsD = 1, tile6 = true, elements = [feng3d.GLAttribute.a_position, feng3d.GLAttribute.a_uv, feng3d.GLAttribute.a_normal, feng3d.GLAttribute.a_tangent]) {
            var geometry = new feng3d.Geometry();
            elements.forEach(element => {
                switch (element) {
                    case feng3d.GLAttribute.a_position:
                        var vertexPositionData = buildPosition(width, height, depth, segmentsW, segmentsH, segmentsD);
                        geometry.setVAData(element, vertexPositionData, 3);
                        break;
                    case feng3d.GLAttribute.a_normal:
                        var vertexNormalData = buildNormal(segmentsW, segmentsH, segmentsD);
                        geometry.setVAData(element, vertexNormalData, 3);
                        break;
                    case feng3d.GLAttribute.a_tangent:
                        var vertexTangentData = buildTangent(segmentsW, segmentsH, segmentsD);
                        geometry.setVAData(element, vertexTangentData, 3);
                        break;
                    case feng3d.GLAttribute.a_uv:
                        var uvData = buildUVs(segmentsW, segmentsH, segmentsD, tile6);
                        geometry.setVAData(element, uvData, 2);
                        break;
                    default:
                        throw (`不支持为平面创建顶点属性 ${element}`);
                }
            });
            var indices = buildIndices(segmentsW, segmentsH, segmentsD);
            geometry.setIndices(indices);
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
        function createSphere(radius = 50, segmentsW = 16, segmentsH = 12, yUp = true, elements = [feng3d.GLAttribute.a_position, feng3d.GLAttribute.a_uv, feng3d.GLAttribute.a_normal, feng3d.GLAttribute.a_tangent]) {
            var geometry = new feng3d.Geometry();
            var geometryData = buildGeometry(radius, segmentsW, segmentsH, yUp);
            elements.forEach(element => {
                switch (element) {
                    case feng3d.GLAttribute.a_position:
                        var vertexPositionData = geometryData[element];
                        geometry.setVAData(element, vertexPositionData, 3);
                        break;
                    case feng3d.GLAttribute.a_normal:
                        var vertexNormalData = geometryData[element];
                        geometry.setVAData(element, vertexNormalData, 3);
                        break;
                    case feng3d.GLAttribute.a_tangent:
                        var vertexTangentData = geometryData[element];
                        geometry.setVAData(element, vertexTangentData, 3);
                        break;
                    case feng3d.GLAttribute.a_uv:
                        var uvData = buildUVs(segmentsW, segmentsH);
                        geometry.setVAData(element, uvData, 2);
                        break;
                    default:
                        throw (`不支持为球体创建顶点属性 ${element}`);
                }
            });
            var indices = buildIndices(segmentsW, segmentsH, yUp);
            geometry.setIndices(indices);
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
            result[feng3d.GLAttribute.a_position] = vertexPositionData;
            result[feng3d.GLAttribute.a_normal] = vertexNormalData;
            result[feng3d.GLAttribute.a_tangent] = vertexTangentData;
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
        function createCapsule(radius = 50, height = 100, segmentsW = 16, segmentsH = 15, yUp = true, elements = [feng3d.GLAttribute.a_position, feng3d.GLAttribute.a_uv, feng3d.GLAttribute.a_normal, feng3d.GLAttribute.a_tangent]) {
            var geometry = new feng3d.Geometry();
            var geometryData = buildGeometry(radius, height, segmentsW, segmentsH, yUp);
            elements.forEach(element => {
                switch (element) {
                    case feng3d.GLAttribute.a_position:
                        var vertexPositionData = geometryData[element];
                        geometry.setVAData(element, vertexPositionData, 3);
                        break;
                    case feng3d.GLAttribute.a_normal:
                        var vertexNormalData = geometryData[element];
                        geometry.setVAData(element, vertexNormalData, 3);
                        break;
                    case feng3d.GLAttribute.a_tangent:
                        var vertexTangentData = geometryData[element];
                        geometry.setVAData(element, vertexTangentData, 3);
                        break;
                    case feng3d.GLAttribute.a_uv:
                        var uvData = buildUVs(segmentsW, segmentsH);
                        geometry.setVAData(element, uvData, 2);
                        break;
                    default:
                        throw (`不支持为胶囊体创建顶点属性 ${element}`);
                }
            });
            var indices = buildIndices(segmentsW, segmentsH, yUp);
            geometry.setIndices(indices);
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
            result[feng3d.GLAttribute.a_position] = vertexPositionData;
            result[feng3d.GLAttribute.a_normal] = vertexNormalData;
            result[feng3d.GLAttribute.a_tangent] = vertexTangentData;
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
        function createCylinder(topRadius = 50, bottomRadius = 50, height = 100, segmentsW = 16, segmentsH = 1, topClosed = true, bottomClosed = true, surfaceClosed = true, yUp = true, elements = [feng3d.GLAttribute.a_position, feng3d.GLAttribute.a_uv, feng3d.GLAttribute.a_normal, feng3d.GLAttribute.a_tangent]) {
            var geometry = new feng3d.Geometry();
            var geometryData = buildGeometry(topRadius, bottomRadius, height, segmentsW, segmentsH, topClosed, bottomClosed, surfaceClosed, yUp);
            elements.forEach(element => {
                switch (element) {
                    case feng3d.GLAttribute.a_position:
                        var vertexPositionData = geometryData[element];
                        geometry.setVAData(element, vertexPositionData, 3);
                        break;
                    case feng3d.GLAttribute.a_normal:
                        var vertexNormalData = geometryData[element];
                        geometry.setVAData(element, vertexNormalData, 3);
                        break;
                    case feng3d.GLAttribute.a_tangent:
                        var vertexTangentData = geometryData[element];
                        geometry.setVAData(element, vertexTangentData, 3);
                        break;
                    case feng3d.GLAttribute.a_uv:
                        var uvData = buildUVs(segmentsW, segmentsH, surfaceClosed, topClosed, bottomClosed);
                        geometry.setVAData(element, uvData, 2);
                        break;
                    default:
                        throw (`不支持为胶囊体创建顶点属性 ${element}`);
                }
            });
            var indices = buildIndices(topRadius, bottomRadius, height, segmentsW, segmentsH, topClosed, bottomClosed, surfaceClosed);
            geometry.setIndices(indices);
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
            result[feng3d.GLAttribute.a_position] = vertexPositionData;
            result[feng3d.GLAttribute.a_normal] = vertexNormalData;
            result[feng3d.GLAttribute.a_tangent] = vertexTangentData;
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
    var primitives;
    (function (primitives) {
        /**
         * 创建天空盒
         */
        function createSkyBox() {
            var geometry = new feng3d.Geometry();
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
            geometry.setVAData(feng3d.GLAttribute.a_position, vertexPositionData, 3);
            //6个面，12个三角形，36个顶点索引
            var indices = new Uint16Array([
                0, 1, 2, 2, 3, 0,
                6, 5, 4, 4, 7, 6,
                2, 6, 7, 7, 3, 2,
                4, 5, 1, 1, 0, 4,
                4, 0, 3, 3, 7, 4,
                2, 1, 5, 5, 6, 2 //
            ]);
            geometry.setIndices(indices);
            return geometry;
        }
        primitives.createSkyBox = createSkyBox;
    })(primitives = feng3d.primitives || (feng3d.primitives = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 纹理信息
     * @author feng 2016-12-20
     */
    class TextureInfo {
        constructor() {
            /**
             * 内部格式
             */
            this.internalformat = WebGLRenderingContext.RGB;
            /**
             * 格式
             */
            this.format = WebGLRenderingContext.RGB;
            /**
             * 数据类型
             */
            this.type = WebGLRenderingContext.UNSIGNED_BYTE;
            /**
             * 是否生成mipmap
             */
            this.generateMipmap = true;
            /**
             * 图片y轴向
             */
            this.flipY = 1;
            this.minFilter = WebGLRenderingContext.LINEAR;
            this.magFilter = WebGLRenderingContext.NEAREST;
            this.wrapS = WebGLRenderingContext.CLAMP_TO_EDGE;
            this.wrapT = WebGLRenderingContext.CLAMP_TO_EDGE;
        }
    }
    feng3d.TextureInfo = TextureInfo;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    class Texture2D extends feng3d.TextureInfo {
        constructor(pixels) {
            super();
            this.textureType = WebGLRenderingContext.TEXTURE_2D;
            this.pixels = pixels;
        }
    }
    feng3d.Texture2D = Texture2D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 立方体纹理
     * @author feng 2016-12-28
     */
    class TextureCube extends feng3d.TextureInfo {
        constructor(images) {
            super();
            this.textureType = WebGLRenderingContext.TEXTURE_CUBE_MAP;
            this.pixels = images;
        }
    }
    feng3d.TextureCube = TextureCube;
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
            /**
            * 渲染模式
            */
            this.renderMode = feng3d.RenderMode.TRIANGLES;
        }
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext) {
            super.updateRenderData(renderContext);
            //
            this.renderData.shaderParams.renderMode = this.renderMode;
            //
            this.renderData.shaderMacro.valueMacros.DIFFUSE_INPUT_TYPE = 0;
            //
            if (this.shaderName) {
                this.renderData.vertexCode = feng3d.ShaderLib.getShaderCode(this.shaderName + ".vertex");
                this.renderData.fragmentCode = feng3d.ShaderLib.getShaderCode(this.shaderName + ".fragment");
            }
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
            this.shaderName = "color";
            this.color = color || new feng3d.Color();
        }
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext) {
            super.updateRenderData(renderContext);
            this.renderData.uniforms[feng3d.RenderDataID.u_diffuseInput] = new feng3d.Vector3D(this.color.r, this.color.g, this.color.b, this.color.a);
            //
            this.renderData.shaderMacro.valueMacros.DIFFUSE_INPUT_TYPE = 1;
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
         * 构建线段材质
         */
        constructor() {
            super();
            this.shaderName = "segment";
            this.renderMode = feng3d.RenderMode.LINES;
        }
    }
    feng3d.SegmentMaterial = SegmentMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 材质组件
     * @author feng 2016-11-01
     */
    class MaterialComponent extends feng3d.Component {
        /**
         * 构建材质组件
         */
        constructor() {
            super();
        }
        /**
         * 所属对象
         */
        get material() { return this._parentComponent; }
    }
    feng3d.MaterialComponent = MaterialComponent;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 纹理材质
     * @author feng 2016-12-23
     */
    class TextureMaterial extends feng3d.Material {
        constructor() {
            super();
            this.shaderName = "texture";
        }
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext) {
            super.updateRenderData(renderContext);
            this.renderData.uniforms[feng3d.RenderDataID.s_texture] = this.texture;
            this.renderData.shaderMacro.valueMacros.DIFFUSE_INPUT_TYPE = 2;
            this.renderData.shaderMacro.addMacros.A_UV_NEED = 1;
            this.renderData.shaderMacro.addMacros.V_UV_NEED = 1;
        }
    }
    feng3d.TextureMaterial = TextureMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 天空盒材质
     * @author feng 2016-12-20
     */
    class SkyBoxMaterial extends feng3d.Material {
        constructor(images) {
            super();
            this.shaderName = "skybox";
            this.skyBoxSize = new feng3d.Vector3D();
            this.skyBoxTextureCube = new feng3d.TextureCube(images);
        }
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext) {
            super.updateRenderData(renderContext);
            //
            this.skyBoxSize.x = this.skyBoxSize.y = this.skyBoxSize.z = renderContext.camera.lens.far / Math.sqrt(3);
            //
            this.renderData.uniforms[feng3d.RenderDataID.s_skyboxTexture] = this.skyBoxTextureCube;
            this.renderData.uniforms[feng3d.RenderDataID.u_skyBoxSize] = this.skyBoxSize;
        }
    }
    feng3d.SkyBoxMaterial = SkyBoxMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 标准材质
     * @author feng 2016-05-02
     */
    class StandardMaterial extends feng3d.Material {
        /**
         * 构建
         */
        constructor() {
            super();
            /**
             * 基本颜色
             */
            this.baseColor = new feng3d.Color(1, 1, 1, 1);
            /**
             * 反射率
             */
            this.reflectance = 1.0;
            /**
             * 粗糙度
             */
            this.roughness = 1.0;
            /**
             * 金属度
             */
            this.metalic = 1.0;
            this.shaderName = "standard";
        }
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext) {
            super.updateRenderData(renderContext);
            this.renderData.uniforms[feng3d.RenderDataID.u_baseColor] = this.baseColor.toVector3D();
            this.renderData.uniforms[feng3d.RenderDataID.u_reflectance] = this.reflectance;
            this.renderData.uniforms[feng3d.RenderDataID.u_roughness] = this.roughness;
            this.renderData.uniforms[feng3d.RenderDataID.u_metalic] = this.metalic;
        }
    }
    feng3d.StandardMaterial = StandardMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 灯光类型
     * @author feng 2016-12-12
     */
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
    })(feng3d.LightType || (feng3d.LightType = {}));
    var LightType = feng3d.LightType;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 灯光
     * @author feng 2016-12-12
     */
    class Light extends feng3d.Object3DComponent {
        constructor() {
            super(...arguments);
            /**
             * 颜色
             */
            this.color = new feng3d.Color();
            /**
             * 光照强度
             */
            this.intensity = 1;
        }
        /**
         * 灯光位置
         */
        get position() {
            return this.object3D.transform.globalPosition;
        }
        /**
         * 处理被添加组件事件
         */
        onBeAddedComponent(event) {
            this.object3D.addEventListener(feng3d.Scene3DEvent.ADDED_TO_SCENE, this.onAddedToScene, this);
            this.object3D.addEventListener(feng3d.Scene3DEvent.REMOVED_FROM_SCENE, this.onRemovedFromScene, this);
            if (this.object3D.scene) {
                this.object3D.scene.dispatchEvent(new feng3d.Scene3DEvent(feng3d.Scene3DEvent.ADDED_LIGHT_TO_SCENE, { light: this }));
            }
        }
        /**
         * 处理被移除组件事件
         */
        onBeRemovedComponent(event) {
            this.object3D.removeEventListener(feng3d.Scene3DEvent.ADDED_TO_SCENE, this.onAddedToScene, this);
            this.object3D.removeEventListener(feng3d.Scene3DEvent.REMOVED_FROM_SCENE, this.onRemovedFromScene, this);
            if (this.object3D.scene) {
                this.object3D.scene.dispatchEvent(new feng3d.Scene3DEvent(feng3d.Scene3DEvent.REMOVED_LIGHT_FROM_SCENE, { light: this }));
            }
        }
        /**
         * 处理添加到场景事件
         */
        onAddedToScene(event) {
            event.data.scene.dispatchEvent(new feng3d.Scene3DEvent(feng3d.Scene3DEvent.ADDED_LIGHT_TO_SCENE, { light: this }));
        }
        /**
         * 处理从场景移除事件
         */
        onRemovedFromScene(event) {
            event.data.scene.dispatchEvent(new feng3d.Scene3DEvent(feng3d.Scene3DEvent.REMOVED_LIGHT_FROM_SCENE, { light: this }));
        }
    }
    feng3d.Light = Light;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 方向光源
     * @author feng 2016-12-13
     */
    class DirectionalLight extends feng3d.Light {
        /**
         * 构建
         */
        constructor() {
            super();
            this.type = feng3d.LightType.Directional;
        }
    }
    feng3d.DirectionalLight = DirectionalLight;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 点光源
     * @author feng 2016-12-13
     */
    class PointLight extends feng3d.Light {
        /**
         * 构建
         */
        constructor() {
            super();
            this.type = feng3d.LightType.Point;
        }
    }
    feng3d.PointLight = PointLight;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    class ControllerBase {
        /**
         * 控制器基类，用于动态调整3D对象的属性
         */
        constructor(target) {
            this.target = target;
        }
        /**
         * 手动应用更新到目标3D对象
         */
        update(interpolate = true) {
            throw new Error("Abstract method");
        }
        get target() {
            return this._target;
        }
        set target(val) {
            this._target = val;
        }
    }
    feng3d.ControllerBase = ControllerBase;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    class LookAtController extends feng3d.ControllerBase {
        constructor(target = null, lookAtObject = null) {
            super(target);
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
            if (this._target) {
                if (this._lookAtPosition) {
                    this._target.lookAt(this.lookAtPosition, this._upAxis);
                }
                else if (this._lookAtObject) {
                    this._pos.x = this._lookAtObject.x;
                    this._pos.y = this._lookAtObject.y;
                    this._pos.z = this._lookAtObject.z;
                    this._target.lookAt(this._pos, this._upAxis);
                }
            }
        }
    }
    feng3d.LookAtController = LookAtController;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * FPS模式控制器
     * @author feng 2016-12-19
     */
    class FPSController extends feng3d.ControllerBase {
        constructor(transform = null) {
            super(transform);
            /**
             * 按键记录
             */
            this.keyDownDic = {};
            /**
             * 按键方向字典
             */
            this.keyDirectionDic = {};
            /**
             * 加速度
             */
            this.acceleration = 0.2;
            this.init();
        }
        get target() {
            return this._target;
        }
        set target(value) {
            if (this._target != null) {
                feng3d.$mouseKeyInput.removeEventListener("keydown", this.onKeydown, this);
                feng3d.$mouseKeyInput.removeEventListener("keyup", this.onKeyup, this);
                feng3d.$mouseKeyInput.removeEventListener("mousemove", this.onMouseMove, this);
            }
            this._target = value;
            if (this._target != null) {
                feng3d.$mouseKeyInput.addEventListener("keydown", this.onKeydown, this);
                feng3d.$mouseKeyInput.addEventListener("keyup", this.onKeyup, this);
                feng3d.$mouseKeyInput.addEventListener("mousemove", this.onMouseMove, this);
                this.preMousePoint = null;
                this.velocity = new feng3d.Vector3D();
                this.keyDownDic = {};
            }
        }
        /**
         * 初始化
         */
        init() {
            this.keyDirectionDic["a"] = new feng3d.Vector3D(-1, 0, 0); //左
            this.keyDirectionDic["d"] = new feng3d.Vector3D(1, 0, 0); //右
            this.keyDirectionDic["w"] = new feng3d.Vector3D(0, 0, 1); //前
            this.keyDirectionDic["s"] = new feng3d.Vector3D(0, 0, -1); //后
            this.keyDirectionDic["e"] = new feng3d.Vector3D(0, 1, 0); //上
            this.keyDirectionDic["q"] = new feng3d.Vector3D(0, -1, 0); //下
        }
        /**
         * 手动应用更新到目标3D对象
         */
        update(interpolate = true) {
            if (this.target == null)
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
            var right = this.target.matrix3d.right;
            var up = this.target.matrix3d.up;
            var forward = this.target.matrix3d.forward;
            right.scaleBy(this.velocity.x);
            up.scaleBy(this.velocity.y);
            forward.scaleBy(this.velocity.z);
            //计算位移
            var displacement = right.clone();
            displacement.incrementBy(up);
            displacement.incrementBy(forward);
            this.target.x += displacement.x;
            this.target.y += displacement.y;
            this.target.z += displacement.z;
        }
        /**
         * 处理鼠标移动事件
         */
        onMouseMove(event) {
            var mouseEvent = event.data;
            if (this.target == null)
                return;
            if (this.preMousePoint == null) {
                this.preMousePoint = { x: mouseEvent.clientX, y: mouseEvent.clientY };
                return;
            }
            //计算旋转
            var offsetPoint = { x: mouseEvent.clientX - this.preMousePoint.x, y: mouseEvent.clientY - this.preMousePoint.y };
            offsetPoint.x *= 0.15;
            offsetPoint.y *= 0.15;
            var matrix3d = this.target.matrix3d;
            var right = matrix3d.right;
            var position = matrix3d.position;
            matrix3d.appendRotation(offsetPoint.y, right, position);
            matrix3d.appendRotation(offsetPoint.x, feng3d.Vector3D.Y_AXIS, position);
            this.target.matrix3d = matrix3d;
            //
            this.preMousePoint = { x: mouseEvent.clientX, y: mouseEvent.clientY };
        }
        /**
         * 键盘按下事件
         */
        onKeydown(event) {
            var keyboardEvent = event.data;
            var boardKey = String.fromCharCode(keyboardEvent.keyCode).toLocaleLowerCase();
            if (this.keyDirectionDic[boardKey] == null)
                return;
            if (!this.keyDownDic[boardKey])
                this.stopDirectionVelocity(this.keyDirectionDic[boardKey]);
            this.keyDownDic[boardKey] = true;
        }
        /**
         * 键盘弹起事件
         */
        onKeyup(event) {
            var keyboardEvent = event.data;
            var boardKey = String.fromCharCode(keyboardEvent.keyCode).toLocaleLowerCase();
            if (this.keyDirectionDic[boardKey] == null)
                return;
            this.keyDownDic[boardKey] = false;
            this.stopDirectionVelocity(this.keyDirectionDic[boardKey]);
        }
        /**
         * 停止xyz方向运动
         * @param direction     停止运动的方向
         */
        stopDirectionVelocity(direction) {
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
        }
    }
    feng3d.FPSController = FPSController;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 地形几何体
     * @author feng 2016-04-28
     */
    class TerrainGeometry extends feng3d.Geometry {
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
        constructor(heightMap, width = 1000, height = 100, depth = 1000, segmentsW = 30, segmentsH = 30, maxElevation = 255, minElevation = 0) {
            super();
            this._geomDirty = true;
            this._uvDirty = true;
            this._heightMap = heightMap;
            this._segmentsW = segmentsW;
            this._segmentsH = segmentsH;
            this._width = width;
            this._height = height;
            this._depth = depth;
            this._maxElevation = maxElevation;
            this._minElevation = minElevation;
            this.buildUVs();
            this.buildGeometry();
        }
        /**
         * 创建顶点坐标
         */
        buildGeometry() {
            var x, z;
            var numInds = 0;
            var base = 0;
            //一排顶点数据
            var tw = this._segmentsW + 1;
            //总顶点数量
            var numVerts = (this._segmentsH + 1) * tw;
            //一个格子所占高度图X轴像素数
            var uDiv = (this._heightMap.width - 1) / this._segmentsW;
            //一个格子所占高度图Y轴像素数
            var vDiv = (this._heightMap.height - 1) / this._segmentsH;
            var u, v;
            var y;
            var vertices = new Float32Array(numVerts * 3);
            var indices = new Uint16Array(this._segmentsH * this._segmentsW * 6);
            numVerts = 0;
            var col;
            for (var zi = 0; zi <= this._segmentsH; ++zi) {
                for (var xi = 0; xi <= this._segmentsW; ++xi) {
                    //顶点坐标
                    x = (xi / this._segmentsW - .5) * this._width;
                    z = (zi / this._segmentsH - .5) * this._depth;
                    //格子对应高度图uv坐标
                    u = xi * uDiv;
                    v = (this._segmentsH - zi) * vDiv;
                    //获取颜色值
                    col = this.getPixel(this._heightMap, u, v) & 0xff;
                    //计算高度值
                    y = (col > this._maxElevation) ? (this._maxElevation / 0xff) * this._height : ((col < this._minElevation) ? (this._minElevation / 0xff) * this._height : (col / 0xff) * this._height);
                    //保存顶点坐标
                    vertices[numVerts++] = x;
                    vertices[numVerts++] = y;
                    vertices[numVerts++] = z;
                    if (xi != this._segmentsW && zi != this._segmentsH) {
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
            this.setVAData(feng3d.GLAttribute.a_position, vertices, 3);
            this.setIndices(indices);
        }
        /**
         * 创建uv坐标
         */
        buildUVs() {
            var numUvs = (this._segmentsH + 1) * (this._segmentsW + 1) * 2;
            var uvs = new Float32Array(numUvs);
            numUvs = 0;
            //计算每个顶点的uv坐标
            for (var yi = 0; yi <= this._segmentsH; ++yi) {
                for (var xi = 0; xi <= this._segmentsW; ++xi) {
                    uvs[numUvs++] = xi / this._segmentsW;
                    uvs[numUvs++] = 1 - yi / this._segmentsH;
                }
            }
            this.setVAData(feng3d.GLAttribute.a_uv, uvs, 2);
        }
        /**
         * 获取位置在（x，z）处的高度y值
         * @param x x坐标
         * @param z z坐标
         * @return 高度
         */
        getHeightAt(x, z) {
            //得到高度图中的值
            var u = (x / this._width + .5) * (this._heightMap.width - 1);
            var v = (-z / this._depth + .5) * (this._heightMap.height - 1);
            var col = this.getPixel(this._heightMap, u, v) & 0xff;
            var h;
            if (col > this._maxElevation) {
                h = (this._maxElevation / 0xff) * this._height;
            }
            else if (col < this._minElevation) {
                h = (this._minElevation / 0xff) * this._height;
            }
            else {
                h = (col / 0xff) * this._height;
            }
            return h;
        }
        /**
         * 获取像素值
         */
        getPixel(imageData, u, v) {
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
        }
    }
    feng3d.TerrainGeometry = TerrainGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    class TerrainMaterial extends feng3d.Material {
        /**
         * 构建材质
         */
        constructor() {
            super();
            this.shaderName = "terrain";
        }
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext) {
            super.updateRenderData(renderContext);
            this.renderData.uniforms[feng3d.RenderDataID.s_texture] = this.diffuseTexture;
            this.renderData.uniforms[feng3d.RenderDataID.s_blendTexture] = this.blendTexture;
            this.renderData.uniforms[feng3d.RenderDataID.s_splatTexture1] = this.splatTexture1;
            this.renderData.uniforms[feng3d.RenderDataID.s_splatTexture2] = this.splatTexture2;
            this.renderData.uniforms[feng3d.RenderDataID.s_splatTexture3] = this.splatTexture3;
            this.renderData.uniforms[feng3d.RenderDataID.u_splatRepeats] = this.splatRepeats;
        }
    }
    feng3d.TerrainMaterial = TerrainMaterial;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D对象工厂
     * @author feng 2016-12-19
     */
    class Object3DFactory {
        /**
         * 创建平面
         */
        createPlane() {
            var object3D = new feng3d.Object3D("plane");
            var mesh = object3D.getOrCreateComponentByClass(feng3d.MeshFilter);
            mesh.geometry = feng3d.primitives.createPlane();
            object3D.getOrCreateComponentByClass(feng3d.MeshRenderer);
            return object3D;
        }
        /**
         * 创建立方体
         */
        createCube() {
            var object3D = new feng3d.Object3D("cube");
            var mesh = object3D.getOrCreateComponentByClass(feng3d.MeshFilter);
            mesh.geometry = feng3d.primitives.createCube();
            object3D.getOrCreateComponentByClass(feng3d.MeshRenderer);
            return object3D;
        }
        /**
         * 创建球体
         */
        createSphere() {
            var object3D = new feng3d.Object3D("sphere");
            var mesh = object3D.getOrCreateComponentByClass(feng3d.MeshFilter);
            mesh.geometry = feng3d.primitives.createSphere();
            object3D.getOrCreateComponentByClass(feng3d.MeshRenderer);
            return object3D;
        }
        /**
         * 创建胶囊
         */
        createCapsule() {
            var object3D = new feng3d.Object3D("capsule");
            var mesh = object3D.getOrCreateComponentByClass(feng3d.MeshFilter);
            mesh.geometry = feng3d.primitives.createCapsule();
            object3D.getOrCreateComponentByClass(feng3d.MeshRenderer);
            return object3D;
        }
        /**
         * 创建圆柱体
         */
        createCylinder() {
            var object3D = new feng3d.Object3D("cylinder");
            var mesh = object3D.getOrCreateComponentByClass(feng3d.MeshFilter);
            mesh.geometry = feng3d.primitives.createCylinder();
            object3D.getOrCreateComponentByClass(feng3d.MeshRenderer);
            return object3D;
        }
        /**
         * 创建天空盒
         */
        createSkyBox(images) {
            var object3D = new feng3d.Object3D("skyBox");
            object3D.getOrCreateComponentByClass(feng3d.MeshFilter).geometry = feng3d.primitives.createSkyBox();
            object3D.getOrCreateComponentByClass(feng3d.MeshRenderer).material = new feng3d.SkyBoxMaterial(images);
            return object3D;
        }
    }
    feng3d.Object3DFactory = Object3DFactory;
    /**
     * 3D对象工厂
     */
    feng3d.$object3DFactory = new Object3DFactory();
})(feng3d || (feng3d = {}));
//# sourceMappingURL=feng3d.js.map