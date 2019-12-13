var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var feng3d;
(function (feng3d) {
    /**
     * 代理 EventTarget, 处理js事件中this关键字问题
     */
    var EventProxy = /** @class */ (function (_super) {
        __extends(EventProxy, _super);
        function EventProxy(target) {
            var _this = _super.call(this) || this;
            _this.pageX = 0;
            _this.pageY = 0;
            _this.clientX = 0;
            _this.clientY = 0;
            /**
             * 是否右击
             */
            _this.rightmouse = false;
            _this.key = "";
            _this.keyCode = 0;
            _this.deltaY = 0;
            _this.listentypes = [];
            /**
             * 处理鼠标按下时同时出发 "mousemove" 事件bug
             */
            _this.handleMouseMoveBug = true;
            /**
             * 键盘按下事件
             */
            _this.onMouseKey = function (event) {
                // this.clear();
                if (event["clientX"] != undefined) {
                    event = event;
                    _this.clientX = event.clientX;
                    _this.clientY = event.clientY;
                    _this.pageX = event.pageX;
                    _this.pageY = event.pageY;
                }
                if (event instanceof MouseEvent) {
                    _this.rightmouse = event.button == 2;
                    // 处理鼠标按下时同时出发 "mousemove" 事件bug
                    if (_this.handleMouseMoveBug) {
                        if (event.type == "mousedown") {
                            _this.mousedownposition = { x: event.clientX, y: event.clientY };
                        }
                        if (event.type == "mousemove") {
                            if (_this.mousedownposition) {
                                if (_this.mousedownposition.x == event.clientX && _this.mousedownposition.y == event.clientY) {
                                    // console.log(`由于系统原因，触发mousedown同时触发了mousemove，此处屏蔽mousemove事件派发！`);
                                    return;
                                }
                            }
                        }
                        if (event.type == "mouseup") {
                            _this.mousedownposition = null;
                        }
                    }
                }
                if (event instanceof KeyboardEvent) {
                    _this.keyCode = event.keyCode;
                    _this.key = event.key;
                }
                if (event instanceof WheelEvent) {
                    _this.deltaY = event.deltaY;
                }
                // 赋值上次鼠标事件值
                // event.clientX = this.clientX;
                // event.clientY = this.clientY;
                // event.pageX = this.pageX;
                // event.pageY = this.pageY;
                _this.dispatchEvent(event);
            };
            _this.target = target;
            return _this;
        }
        Object.defineProperty(EventProxy.prototype, "target", {
            get: function () {
                return this._target;
            },
            set: function (v) {
                var _this = this;
                if (this._target == v)
                    return;
                if (this._target) {
                    this.listentypes.forEach(function (element) {
                        _this._target.removeEventListener(element, _this.onMouseKey);
                    });
                }
                this._target = v;
                if (this._target) {
                    this.listentypes.forEach(function (element) {
                        _this._target.addEventListener(element, _this.onMouseKey);
                    });
                }
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
        EventProxy.prototype.once = function (type, listener, thisObject, priority) {
            this.on(type, listener, thisObject, priority, true);
        };
        /**
         * 添加监听
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        EventProxy.prototype.on = function (type, listener, thisObject, priority, once) {
            if (priority === void 0) { priority = 0; }
            if (once === void 0) { once = false; }
            _super.prototype.on.call(this, type, listener, thisObject, priority, once);
            if (this.listentypes.indexOf(type) == -1) {
                this.listentypes.push(type);
                this._target.addEventListener(type, this.onMouseKey);
            }
        };
        /**
         * 移除监听
         * @param dispatcher 派发器
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         */
        EventProxy.prototype.off = function (type, listener, thisObject) {
            var _this = this;
            _super.prototype.off.call(this, type, listener, thisObject);
            if (!type) {
                this.listentypes.forEach(function (element) {
                    _this._target.removeEventListener(element, _this.onMouseKey);
                });
                this.listentypes.length = 0;
            }
            else if (!this.has(type)) {
                this._target.removeEventListener(type, this.onMouseKey);
                this.listentypes.splice(this.listentypes.indexOf(type), 1);
            }
        };
        /**
         * 清理数据
         */
        EventProxy.prototype.clear = function () {
            this.clientX = 0;
            this.clientY = 0;
            this.rightmouse = false;
            this.key = "";
            this.keyCode = 0;
            this.deltaY = 0;
        };
        return EventProxy;
    }(feng3d.EventDispatcher));
    feng3d.EventProxy = EventProxy;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var WindowEventProxy = /** @class */ (function (_super) {
        __extends(WindowEventProxy, _super);
        function WindowEventProxy() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return WindowEventProxy;
    }(feng3d.EventProxy));
    feng3d.WindowEventProxy = WindowEventProxy;
    if (typeof window != "undefined")
        feng3d.windowEventProxy = new WindowEventProxy(window);
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 键盘按键字典 （补充常量，a-z以及鼠标按键不必再次列出）
     * 例如 boardKeyDic[17] = "ctrl";
     */
    var boardKeyDic = {
        17: "ctrl",
        16: "shift",
        32: "escape",
        18: "alt",
        46: "del",
    };
    var KeyBoard = /** @class */ (function () {
        function KeyBoard() {
        }
        /**
         * 获取键盘按键名称
         * @param code   按键值
         */
        KeyBoard.getKey = function (code) {
            var key = boardKeyDic[code];
            if (key == null && 65 <= code && code <= 90) {
                key = String.fromCharCode(code).toLocaleLowerCase();
            }
            return key;
        };
        /**
         * 获取按键值
         * @param key 按键
         */
        KeyBoard.getCode = function (key) {
            key = key.toLocaleLowerCase();
            var code = key.charCodeAt(0);
            if (key.length == 1 && 65 <= code && code <= 90) {
                return code;
            }
            for (var code_1 in boardKeyDic) {
                if (boardKeyDic.hasOwnProperty(code_1)) {
                    if (boardKeyDic[code_1] == key)
                        return Number(code_1);
                }
            }
            console.error("\u65E0\u6CD5\u83B7\u53D6\u6309\u952E " + key + " \u7684\u503C\uFF01");
            return code;
        };
        return KeyBoard;
    }());
    feng3d.KeyBoard = KeyBoard;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 按键捕获

     */
    var KeyCapture = /** @class */ (function () {
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
            if (!feng3d.windowEventProxy) {
                return;
            }
            feng3d.windowEventProxy.on("keydown", this.onKeydown, this);
            feng3d.windowEventProxy.on("keyup", this.onKeyup, this);
            //监听鼠标事件
            var mouseEvents = [
                "dblclick",
                "click",
                "mousedown",
                "mouseup",
                "mousemove",
                "mouseover",
                "mouseout",
            ];
            for (var i = 0; i < mouseEvents.length; i++) {
                feng3d.windowEventProxy.on(mouseEvents[i], this.onMouseOnce, this);
            }
            feng3d.windowEventProxy.on("wheel", this.onMousewheel, this);
        }
        /**
         * 鼠标事件
         */
        KeyCapture.prototype.onMouseOnce = function (event) {
            if (!feng3d.shortcut.enable)
                return;
            var mouseKey = event.type;
            this._keyState.pressKey(mouseKey, event);
            this._keyState.releaseKey(mouseKey, event);
        };
        /**
         * 鼠标事件
         */
        KeyCapture.prototype.onMousewheel = function (event) {
            if (!feng3d.shortcut.enable)
                return;
            var mouseKey = event.type;
            this._keyState.pressKey(mouseKey, event);
            this._keyState.releaseKey(mouseKey, event);
        };
        /**
         * 键盘按下事件
         */
        KeyCapture.prototype.onKeydown = function (event) {
            if (!feng3d.shortcut.enable)
                return;
            var boardKey = feng3d.KeyBoard.getKey(event.keyCode);
            boardKey = boardKey || event.key;
            if (boardKey) {
                boardKey = boardKey.toLocaleLowerCase();
                this._keyState.pressKey(boardKey, event);
            }
            else {
                console.error("\u65E0\u6CD5\u8BC6\u522B\u6309\u94AE " + event.key);
            }
        };
        /**
         * 键盘弹起事件
         */
        KeyCapture.prototype.onKeyup = function (event) {
            if (!feng3d.shortcut.enable)
                return;
            var boardKey = feng3d.KeyBoard.getKey(event.keyCode);
            boardKey = boardKey || event.key;
            if (boardKey) {
                boardKey = boardKey.toLocaleLowerCase();
                this._keyState.releaseKey(boardKey, event);
            }
            else {
                console.error("\u65E0\u6CD5\u8BC6\u522B\u6309\u94AE " + event.key);
            }
        };
        return KeyCapture;
    }());
    feng3d.KeyCapture = KeyCapture;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 按键状态

     */
    var KeyState = /** @class */ (function (_super) {
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
            // 处理鼠标中键与右键
            if (data instanceof MouseEvent) {
                if (["click", "mousedown", "mouseup"].indexOf(data.type) != -1) {
                    key = ["", "middle", "right"][data.button] + data.type;
                }
            }
            this._keyStateDic[key] = true;
            this.dispatch(key, data);
        };
        /**
         * 释放键
         * @param key	键名称
         * @param data	携带数据
         */
        KeyState.prototype.releaseKey = function (key, data) {
            // 处理鼠标中键与右键
            if (data instanceof MouseEvent) {
                if (["click", "mousedown", "mouseup"].indexOf(data.type) != -1) {
                    key = ["", "middle", "right"][data.button] + data.type;
                }
            }
            this._keyStateDic[key] = false;
            this.dispatch(key, data);
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
     */
    var ShortCutCapture = /** @class */ (function () {
        /**
         * 构建快捷键捕获
         * @param shortCut				快捷键环境
         * @param key					快捷键；用“+”连接多个按键，“!”表示没按下某键；例如 “a+!b”表示按下“a”与没按下“b”时触发。
         * @param command				要执行的command的id；使用“,”连接触发多个命令；例如 “commandA,commandB”表示满足触发条件后依次执行commandA与commandB命令。
         * @param stateCommand			要执行的状态命令id；使用“,”连接触发多个状态命令，没带“!”表示激活该状态，否则表示使其处于非激活状态；例如 “stateA,!stateB”表示满足触发条件后激活状态“stateA，使“stateB处于非激活状态。
         * @param when					快捷键激活的条件；使用“+”连接多个状态，没带“!”表示需要处于激活状态，否则需要处于非激活状态； 例如 “stateA+!stateB”表示stateA处于激活状态且stateB处于非激活状态时会判断按键是否满足条件。
         */
        function ShortCutCapture(shortCut, key, command, stateCommand, when) {
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
                this._keyState.on(this._keys[i].key, this.onCapture, this);
            }
        };
        /**
         * 处理捕获事件
         */
        ShortCutCapture.prototype.onCapture = function (event) {
            var inWhen = this.checkActivityStates(this._states);
            var pressKeys = this.checkActivityKeys(this._keys);
            if (pressKeys && inWhen) {
                this.dispatchCommands(this._commands, event);
                this.executeStateCommands(this._stateCommands);
            }
        };
        /**
         * 派发命令
         */
        ShortCutCapture.prototype.dispatchCommands = function (commands, data) {
            for (var i = 0; i < commands.length; i++) {
                this._shortCut.dispatch(commands[i], data);
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
            if (!when)
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
            if (!command)
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
            if (!stateCommand)
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
                this._keyState.off(this._keys[i].key, this.onCapture, this);
            }
            this._shortCut = null;
            this._keys = null;
            this._states = null;
        };
        return ShortCutCapture;
    }());
    feng3d.ShortCutCapture = ShortCutCapture;
    /**
     * 按键
     */
    var Key = /** @class */ (function () {
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
     */
    var State = /** @class */ (function () {
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
     */
    var StateCommand = /** @class */ (function () {
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
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 初始化快捷键模块
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
Event.on(shortCut,<any>"run", function(e:Event):void
{
    trace("接受到命令：" + e.type);
});
     * </pre>
     */
    var ShortCut = /** @class */ (function (_super) {
        __extends(ShortCut, _super);
        /**
         * 初始化快捷键模块
         */
        function ShortCut() {
            var _this = _super.call(this) || this;
            /**
             * 启动
             */
            _this.enable = true;
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
            return shortcut.key + "," + shortcut.command + "," + shortcut.stateCommand + "," + shortcut.when;
        };
        return ShortCut;
    }(feng3d.EventDispatcher));
    feng3d.ShortCut = ShortCut;
    feng3d.shortcut = new ShortCut();
})(feng3d || (feng3d = {}));
//# sourceMappingURL=shortcut.js.map