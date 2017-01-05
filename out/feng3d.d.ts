declare module feng3d {
}
declare module feng3d {
    /**
     * 事件
     * @author feng 2014-5-7
     */
    class Event {
        private _type;
        private _bubbles;
        private _target;
        private _currentTarget;
        private _isStopBubbles;
        private _isStop;
        /**
         * 事件携带的自定义数据
         */
        data: any;
        /**
         * 创建一个作为参数传递给事件侦听器的 Event 对象。
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type: string, data?: any, bubbles?: boolean);
        /**
         * 是否停止处理事件监听器
         */
        isStop: boolean;
        /**
         * 是否停止冒泡
         */
        isStopBubbles: boolean;
        tostring(): string;
        /**
         * 表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        readonly bubbles: boolean;
        /**
         * 事件的类型。类型区分大小写。
         */
        readonly type: string;
        /**
         * 事件目标。
         */
        target: IEventDispatcher;
        /**
         * 当前正在使用某个事件侦听器处理 Event 对象的对象。
         */
        readonly currentTarget: IEventDispatcher;
    }
}
declare module feng3d {
    /**
     * IEventDispatcher 接口定义用于添加或删除事件侦听器的方法，检查是否已注册特定类型的事件侦听器，并调度事件。
     * @author feng 2016-3-22
     */
    interface IEventDispatcher {
        /**
         * 名称
         */
        name: string;
        /**
         * 使用 EventDispatcher 对象注册事件侦听器对象，以使侦听器能够接收事件通知。
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        addEventListener(type: string, listener: (event: Event) => void, thisObject: any, priority?: number): void;
        /**
         * 从 EventDispatcher 对象中删除侦听器. 如果没有向 IEventDispatcher 对象注册任何匹配的侦听器，则对此方法的调用没有任何效果。
         *
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        removeEventListener(type: string, listener: (event: Event) => void, thisObject: any): void;
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEventDispatcher 对象。
         * @param event						调度到事件流中的 Event 对象。
         */
        dispatchEvent(event: Event): void;
        /**
         * 检查 EventDispatcher 对象是否为特定事件类型注册了任何侦听器.
         *
         * @param type		事件的类型。
         * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        hasEventListener(type: string): boolean;
    }
}
declare module feng3d {
    /**
     * 为了实现非flash原生显示列表的冒泡事件，自定义事件适配器
     * @author feng 2016-3-22
     */
    class EventDispatcher implements IEventDispatcher {
        /**
         * 名称
         */
        name: string;
        /**
         * 冒泡属性名称为“parent”
         */
        bubbleAttribute: string;
        /**
         * 事件适配主体
         */
        private target;
        /**
         * 构建事件适配器
         * @param target		事件适配主体
         */
        constructor(target?: IEventDispatcher);
        /**
         * 使用 EventDispatcher 对象注册事件侦听器对象，以使侦听器能够接收事件通知。
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        addEventListener(type: string, listener: (event: Event) => void, thisObject: any, priority?: number): void;
        /**
         * 从 EventDispatcher 对象中删除侦听器. 如果没有向 IEventDispatcher 对象注册任何匹配的侦听器，则对此方法的调用没有任何效果。
         *
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        removeEventListener(type: string, listener: (event: Event) => void, thisObject: any): void;
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEventDispatcher 对象。
         * @param event						调度到事件流中的 Event 对象。
         */
        dispatchEvent(event: Event): void;
        /**
         * 检查 EventDispatcher 对象是否为特定事件类型注册了任何侦听器.
         *
         * @param type		事件的类型。
         * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        hasEventListener(type: string): boolean;
        /**
         * 销毁
         */
        destroy(): void;
        /**
         * 派发冒泡事件
         * @param event						调度到事件流中的 Event 对象。
         */
        private dispatchBubbleEvent(event);
        /**
         * 获取冒泡对象
         * @param event						调度到事件流中的 Event 对象。
         */
        protected getBubbleTargets(event: Event): IEventDispatcher[];
    }
}
declare module feng3d {
    /**
     * 鼠标键盘输入，处理js事件中this关键字问题
     * @author feng 2016-12-19
     */
    class MouseKeyInput extends EventDispatcher {
        /**
         * 构建
         */
        constructor();
        /**
         * 初始化
         */
        private init();
        /**
         * 键盘按下事件
         */
        private onMouseKey(event);
    }
    /**
     * 鼠标事件类型
     */
    var $mouseKeyType: {
        "click": string;
        "dblclick": string;
        "mousedown": string;
        "mousemove": string;
        "mouseout": string;
        "mouseover": string;
        "mouseup": string;
        "keydown": string;
        "keypress": string;
        "keyup": string;
    };
    /**
     * 鼠标键盘输入
     */
    var $mouseKeyInput: MouseKeyInput;
}
declare module feng3d.shortcut {
    /**
     * 按键捕获
     * @author feng 2016-4-26
     */
    class KeyCapture {
        /**
         * 键盘按键字典 （补充常量，a-z以及鼠标按键不必再次列出）
         * 例如 boardKeyDic[17] = "ctrl";
         */
        private boardKeyDic;
        /**
         * 捕获的按键字典
         */
        private mouseKeyDic;
        /**
         * 快捷键环境
         */
        private shortCutContext;
        /**
         * 按键状态
         */
        private keyState;
        /**
         * 构建
         * @param stage		舞台
         */
        constructor(shortCutContext: ShortCutContext);
        /**
         * 默认支持按键
         */
        private defaultSupportKeys();
        /**
         * 鼠标事件
         */
        private onMouseOnce(event);
        /**
         * 鼠标事件
         */
        private onMousewheel(event);
        /**
         * 键盘按下事件
         */
        private onKeydown(event);
        /**
         * 键盘弹起事件
         */
        private onKeyup(event);
        /**
         * 获取键盘按键名称
         */
        private getBoardKey(keyCode);
    }
}
declare module feng3d.shortcut {
    /**
     * 按键状态
     * @author feng 2016-4-26
     */
    class KeyState extends EventDispatcher {
        /**
         * 按键状态{key:键名称,value:是否按下}
         */
        private keyStateDic;
        /**
         * 构建
         */
        constructor();
        /**
         * 按下键
         * @param key 	键名称
         * @param data	携带数据
         */
        pressKey(key: string, data?: Object): void;
        /**
         * 释放键
         * @param key	键名称
         * @param data	携带数据
         */
        releaseKey(key: string, data?: Object): void;
        /**
         * 获取按键状态
         * @param key 按键名称
         */
        getKeyState(key: string): Boolean;
    }
}
declare module feng3d.shortcut {
    /**
     * 快捷键捕获
     * @author feng 2016-4-26
     */
    class ShortCutCapture {
        /**
         * 快捷键环境
         */
        private shortCutContext;
        /**
         * 快捷键
         */
        private key;
        /**
         * 要执行的命令名称
         */
        private command;
        /**
         * 可执行的状态命令
         */
        private stateCommand;
        /**
         * 快捷键处于活动状态的条件
         */
        private when;
        /**
         * 按键状态
         */
        private keyState;
        /**
         * 按键列表
         */
        private keys;
        /**
         * 状态列表
         */
        private states;
        /**
         * 命令列表
         */
        private commands;
        /**
         * 命令列表
         */
        private stateCommands;
        /**
         * 构建快捷键捕获
         * @param shortCutContext		快捷键环境
         * @param key					快捷键
         * @param command				要执行的命令名称
         * @param stateCommand			可执行的状态命令
         * @param when					快捷键处于活动状态的条件
         */
        constructor(shortCutContext: ShortCutContext, key: string, command?: string, stateCommand?: string, when?: string);
        /**
         * 初始化
         */
        private init();
        /**
         * 处理捕获事件
         */
        private onCapture(event);
        /**
         * 派发命令
         */
        private dispatchCommands(commands, data);
        /**
         * 执行状态命令
         */
        private executeStateCommands(stateCommands);
        /**
         * 检测快捷键是否处于活跃状态
         */
        private checkActivityStates(states);
        /**
         * 获取是否处于指定状态中（支持一个！取反）
         * @param state 状态名称
         */
        private getState(state);
        /**
         * 检测是否按下给出的键
         * @param keys 按键数组
         */
        private checkActivityKeys(keys);
        /**
         * 获取按键状态（true：按下状态，false：弹起状态）
         */
        private getKeyValue(key);
        /**
         * 获取状态列表
         * @param when		状态字符串
         */
        private getStates(when);
        /**
         * 获取键列表
         * @param key		快捷键
         */
        private getKeys(key);
        /**
         * 获取命令列表
         * @param command	命令
         */
        private getCommands(command);
        /**
         * 获取状态命令列表
         * @param stateCommand	状态命令
         */
        private getStateCommand(stateCommand);
        /**
         * 销毁
         */
        destroy(): void;
    }
}
/**
 * 按键
 * @author feng 2016-6-6
 */
declare class Key {
    /**
     * 是否取反
     */
    not: Boolean;
    /**
     * 状态名称
     */
    key: string;
    constructor(key: string);
}
/**
 * 状态
 * @author feng 2016-6-6
 */
declare class State {
    /**
     * 是否取反
     */
    not: Boolean;
    /**
     * 状态名称
     */
    state: string;
    constructor(state: string);
}
/**
 * 状态命令
 * @author feng 2016-6-6
 */
declare class StateCommand {
    /**
     * 是否取反
     */
    not: Boolean;
    /**
     * 状态名称
     */
    state: string;
    constructor(state: string);
}
declare module feng3d.shortcut {
    /**
     * 快捷键环境
     * @author feng 2016-6-6
     */
    class ShortCutContext {
        /**
         * 命令派发器
         */
        commandDispatcher: IEventDispatcher;
        /**
         * 按键状态
         */
        keyState: KeyState;
        /**
         * 状态字典
         */
        stateDic: {};
        /**
         * 按键捕获
         */
        keyCapture: KeyCapture;
        /**
         * 捕获字典
         */
        captureDic: {};
        /**
         * 构建快捷键环境
         * @param stage 舞台
         */
        constructor();
        /**
         * 初始化快捷键模块
         */
        init(): void;
        /**
         * 添加快捷键
         * @param shortcuts		快捷键列表
         */
        addShortCuts(shortcuts: any[]): void;
        /**
         * 删除快捷键
         * @param shortcuts		快捷键列表
         */
        removeShortCuts(shortcuts: any[]): void;
        /**
         * 移除所有快捷键
         */
        removeAllShortCuts(): void;
        /**
         * 激活状态
         * @param state 状态名称
         */
        activityState(state: string): void;
        /**
         * 取消激活状态
         * @param state 状态名称
         */
        deactivityState(state: string): void;
        /**
         * 获取状态
         * @param state 状态名称
         */
        getState(state: string): Boolean;
        /**
         * 获取快捷键唯一字符串
         */
        private getShortcutUniqueKey(shortcut);
    }
}
declare module feng3d.shortcut {
    /**
     * 快捷键命令事件
     * @author feng 2016-4-27
     */
    class ShortCutEvent extends Event {
        /**
         * 携带数据
         */
        data: Object;
        /**
         * 构建
         * @param command		命令名称
         */
        constructor(command: string, data?: Object);
    }
}
declare module feng3d.shortcut {
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
         * 命令派发器
         */
        static commandDispatcher: IEventDispatcher;
        /**
         * 快捷键环境
         */
        private static shortcutContext;
        /**
         * 初始化快捷键模块
         */
        static init(): void;
        /**
         * 添加快捷键
         * @param shortcuts		快捷键列表
         */
        static addShortCuts(shortcuts: any[]): void;
        /**
         * 删除快捷键
         * @param shortcuts		快捷键列表
         */
        static removeShortCuts(shortcuts: any[]): void;
        /**
         * 移除所有快捷键
         */
        static removeAllShortCuts(): void;
        /**
         * 激活状态
         * @param state 状态名称
         */
        static activityState(state: string): void;
        /**
         * 取消激活状态
         * @param state 状态名称
         */
        static deactivityState(state: string): void;
        /**
         * 获取状态
         * @param state 状态名称
         */
        static getState(state: string): Boolean;
    }
}
declare module feng3d {
    /**
     * 组件事件
     * @author feng 2015-12-2
     */
    class ComponentEvent extends Event {
        /**
         * 添加子组件事件
         * data = { container: IComponent, child: IComponent }
         */
        static ADDED_COMPONENT: string;
        /**
         * 移除子组件事件
         * data = { container: IComponent, child: IComponent }
         */
        static REMOVED_COMPONENT: string;
        /**
         * 事件目标。
         */
        target: IComponent;
    }
}
declare module feng3d {
    /**
     * 组件接口
     * @author feng 2016-4-24
     */
    interface IComponent extends IEventDispatcher {
        /**
         * 组件数量
         */
        numComponents: number;
        /**
         * 父组件
         */
        parentComponent: IComponent;
        /**
         * 添加组件
         * @param component 被添加组件
         */
        addComponent(component: IComponent): void;
        /**
         * 添加组件到指定位置
         * @param component		被添加的组件
         * @param index			插入的位置
         */
        addComponentAt(component: IComponent, index: number): void;
        /**
         * 移除组件
         * @param component 被移除组件
         */
        removeComponent(component: IComponent): void;
        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        removeComponentAt(index: number): IComponent;
        /**
         * 获取组件在容器的索引位置
         * @param component			查询的组件
         * @return				    组件在容器的索引位置
         */
        getComponentIndex(com: IComponent): number;
        /**
        * 设置子组件的位置
        * @param component				子组件
        * @param index				    位置索引
        */
        setComponentIndex(component: IComponent, index: number): void;
        /**
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        getComponentAt(index: number): IComponent;
        /**
         * 根据组件名称获取组件
         * <p>注意：此处比较的是componentName而非name</p>
         * @param componentName		组件名称
         * @return 					获取到的组件
         */
        getComponentByName(componentName: String): IComponent;
        /**
        * 获取与给出组件名称相同的所有组件
        * <p>注意：此处比较的是componentName而非name</p>
        * @param componentName		组件名称
        * @return 					获取到的组件
        */
        getComponentsByName(componentName: String): IComponent[];
        /**
         * 根据类定义获取组件
         * <p>如果存在多个则返回第一个</p>
         * @param cls				类定义
         * @return
         */
        getComponentByClass<T extends IComponent>(cls: new () => T): T;
        /**
         * 根据类定义查找组件
         * @param cls		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsByClass<T extends IComponent>(cls: new () => T): T[];
        /**
         * 根据类定义获取或创建组件
         * <p>当不存在该类型对象时创建一个该组件并且添加到容器中</p>
         * @param cls
         * @return
         */
        getOrCreateComponentByClass<T extends IComponent>(cls: new () => T): T;
        /**
        * 判断是否拥有组件
        * @param com	被检测的组件
        * @return		true：拥有该组件；false：不拥有该组件。
        */
        hasComponent(com: IComponent): boolean;
        /**
         * 交换子组件位置
         * @param index1		第一个子组件的索引位置
         * @param index2		第二个子组件的索引位置
         */
        swapComponentsAt(index1: number, index2: number): void;
        /**
         * 交换子组件位置
         * @param a		第一个子组件
         * @param b		第二个子组件
         */
        swapComponents(a: IComponent, b: IComponent): void;
        /**
         * 派发子组件事件
         * <p>事件广播给子组件</p>
         * @param event     事件
         * @param depth     广播深度
         */
        dispatchChildrenEvent(event: Event, depth: number): void;
    }
}
declare module feng3d {
    /**
     * 组件容器（集合）
     * @author feng 2015-5-6
     */
    class Component extends EventDispatcher implements IComponent {
        /**
         * 父组件
         */
        protected _parentComponent: IComponent;
        /**
         * 组件列表
         */
        protected components: IComponent[];
        /**
         * 创建一个组件容器
         */
        constructor();
        /**
         * 初始化组件
         */
        protected initComponent(): void;
        /**
         * 父组件
         */
        readonly parentComponent: IComponent;
        /**
         * 子组件个数
         */
        readonly numComponents: number;
        /**
         * 添加组件
         * @param component 被添加组件
         */
        addComponent(component: IComponent): void;
        /**
         * 添加组件到指定位置
         * @param component		被添加的组件
         * @param index			插入的位置
         */
        addComponentAt(component: IComponent, index: number): void;
        /**
         * 移除组件
         * @param component 被移除组件
         */
        removeComponent(component: IComponent): void;
        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        removeComponentAt(index: number): IComponent;
        /**
         * 获取组件在容器的索引位置
         * @param component			查询的组件
         * @return				    组件在容器的索引位置
         */
        getComponentIndex(component: IComponent): number;
        /**
         * 设置子组件的位置
         * @param component				子组件
         * @param index				位置索引
         */
        setComponentIndex(component: IComponent, index: number): void;
        /**
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        getComponentAt(index: number): IComponent;
        /**
         * 根据组件名称获取组件
         * <p>注意：此处比较的是componentName而非name</p>
         * @param componentName		组件名称
         * @return 					获取到的组件
         */
        getComponentByName(name: String): IComponent;
        /**
         * 获取与给出组件名称相同的所有组件
         * <p>注意：此处比较的是componentName而非name</p>
         * @param name		        组件名称
         * @return 					获取到的组件
         */
        getComponentsByName(name: String): IComponent[];
        /**
         * 根据类定义获取组件
         * <p>如果存在多个则返回第一个</p>
         * @param cls				类定义
         * @return                  返回指定类型组件
         */
        getComponentByClass<T extends IComponent>(cls: new () => T): T;
        /**
         * 根据类定义查找组件
         * @param cls		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsByClass<T extends IComponent>(cls: new () => T): T[];
        /**
         * 根据类定义获取或创建组件
         * <p>当不存在该类型对象时创建一个该组件并且添加到容器中</p>
         * @param cls       类定义
         * @return          返回与给出类定义一致的组件
         */
        getOrCreateComponentByClass<T extends IComponent>(cls: new () => T): T;
        /**
         * 判断是否拥有组件
         * @param com	被检测的组件
         * @return		true：拥有该组件；false：不拥有该组件。
         */
        hasComponent(com: IComponent): boolean;
        /**
         * 交换子组件位置
         * @param index1		第一个子组件的索引位置
         * @param index2		第二个子组件的索引位置
         */
        swapComponentsAt(index1: number, index2: number): void;
        /**
         * 交换子组件位置
         * @param a		第一个子组件
         * @param b		第二个子组件
         */
        swapComponents(a: IComponent, b: IComponent): void;
        /**
         * 派发子组件事件
         * <p>事件广播给子组件</p>
         * @param event     事件
         * @param depth     广播深度
         */
        dispatchChildrenEvent(event: Event, depth?: number): void;
        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void;
        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void;
        /**
         * 获取冒泡对象
         */
        protected getBubbleTargets(event?: Event): IEventDispatcher[];
        /**
         * 处理添加组件事件，此处为被添加，设置父组件
         */
        private _onAddedComponent(event);
        /**
         * 处理移除组件事件，此处为被移除，清空父组件
         */
        private _onRemovedComponent(event);
    }
}
declare module feng3d {
    /**
     * 加载类
     * @author feng 2016-12-14
     */
    class Loader extends EventDispatcher {
        private request;
        private image;
        /**
         * 数据类型
         */
        dataFormat: string;
        private url;
        /**
         * 已加载的字节数
         */
        bytesLoaded: number;
        /**
         * 文件中压缩的字节数
         */
        bytesTotal: number;
        /**
         * 加载内容
         */
        content: any;
        /**
         * 加载资源
         * @param url   路径
         */
        load(url: string): void;
        /**
         * 加载文本
         * @param url   路径
         */
        loadText(url: string): void;
        /**
         * 加载二进制
         * @param url   路径
         */
        loadBinary(url: string): void;
        /**
         * 加载图片
         * @param url   路径
         */
        loadImage(url: string): void;
        /**
         * 使用XMLHttpRequest加载
         */
        private xmlHttpRequestLoad();
        /**
         * 请求进度回调
         */
        private onRequestProgress(event);
        /**
         * 请求状态变化回调
         */
        private onRequestReadystatechange(ev);
        /**
         * 加载图片完成回调
         */
        private onImageLoad(event);
        /**
         * 加载图片出错回调
         */
        private onImageError(event);
    }
}
declare module feng3d {
    /**
     * 加载事件
     * @author feng 2016-12-14
     */
    class LoaderEvent extends Event {
        /**
         * 加载进度发生改变时调度。
         */
        static PROGRESS: string;
        /**
         * 加载完成后调度。
         */
        static COMPLETE: string;
        /**
         * 加载出错时调度。
         */
        static ERROR: string;
    }
}
declare module feng3d {
    /**
     * 加载数据类型
     * @author feng 2016-12-14
     */
    class LoaderDataFormat {
        /**
         * 以原始二进制数据形式接收下载的数据。
         */
        static BINARY: string;
        /**
         * 以文本形式接收已下载的数据。
         */
        static TEXT: string;
        /**
         * 图片数据
         */
        static IMAGE: string;
    }
}
declare module feng3d {
    /**
     * 断言
     * @b			判定为真的表达式
     * @msg			在表达式为假时将输出的错误信息
     * @author feng 2014-10-29
     */
    function assert(b: boolean, msg?: string): void;
}
declare module feng3d {
    /**
     * 获取对象的类名
     * @author feng 2016-4-24
     */
    function getClassName(value: any): string;
}
declare module feng3d {
    class StringUtils {
        /**
         * 获取字符串
         * @param obj 转换为字符串的对象
         * @param showLen       显示长度
         * @param fill          长度不够是填充的字符串
         * @param tail          true（默认）:在尾部添加；false：在首部添加
         */
        static getString(obj: any, showLen?: number, fill?: string, tail?: boolean): string;
    }
}
declare module feng3d {
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
        static removeItem<T>(source: T[], item: T, all?: boolean): {
            deleteIndexs: number[];
            length: number;
        };
    }
}
declare module feng3d {
    /**
     * 构建Map类代替Dictionary
     * @author feng 2017-01-03
     */
    class Map<K, V> {
        private keyMap;
        private valueMap;
        /**
         * 删除
         */
        delete(k: K): void;
        /**
         * 添加映射
         */
        push(k: K, v: V): void;
        /**
         * 通过key获取value
         */
        get(k: K): V;
        /**
         * 获取键列表
         */
        getKeys(): K[];
        /**
         * 清理字典
         */
        clear(): void;
    }
}
declare module feng3d {
    /**
     * 获取对象UID
     * @author feng 2016-05-08
     */
    function getUID(object: {
        __uid__?: string;
    }): any;
}
declare module feng3d {
    class Version {
        /**
         * 获取对象版本
         * @param object 对象
         */
        getVersion(object: Object): number;
        /**
         * 升级对象版本（版本号+1）
         * @param object 对象
         */
        upgradeVersion(object: Object): void;
        /**
         * 设置版本号
         * @param object 对象
         * @param version 版本号
         */
        setVersion(object: Object, version: number): void;
        /**
         * 判断两个对象的版本号是否相等
         */
        equal(a: Object, b: Object): boolean;
        /**
         * 断言object为对象类型
         */
        private assertObject(object);
    }
    /**
     * 对象版本
     */
    var version: Version;
}
declare module feng3d {
    /**
     * 判断a对象是否为b类型
     */
    function is(a: any, b: Function): boolean;
}
declare module feng3d {
    /**
     * 如果a为b类型则返回，否则返回null
     */
    function as(a: any, b: Function): any;
}
declare module feng3d {
    /**
     * 渲染代码库
     * @author feng 2016-12-16
     */
    class ShaderLib {
        /**
         * 获取shaderCode
         */
        static getShaderCode(shaderName: string): string;
        /**
         * 获取ShaderMacro代码
         */
        static getMacroCode(macro: ShaderMacro): string;
    }
}
declare module feng3d {
    /**
     * 颜色
     * @author feng 2016-09-24
     */
    class Color {
        /**
         * 红[0,1]
         */
        r: number;
        /**
         * 绿[0,1]
         */
        g: number;
        /**
         * 蓝[0,1]
         */
        b: number;
        /**
         * 透明度[0,1]
         */
        a: number;
        /**
         * 构建颜色
         * @param r     红[0,1]
         * @param g     绿[0,1]
         * @param b     蓝[0,1]
         * @param a     透明度[0,1]
         */
        constructor(r?: number, g?: number, b?: number, a?: number);
        /**
         * 从RGBA整型初始化颜色
         * @param r     红[0,255]
         * @param g     绿[0,255]
         * @param b     蓝[0,255]
         * @param a     透明度[0,255]
         */
        fromInts(r: number, g: number, b: number, a: number): void;
        fromUnit(color: number, hasAlpha?: boolean): void;
        /**
         * 转换为数组
         */
        asArray(): number[];
        /**
         * 输出到数组
         * @param array     数组
         * @param index     存储在数组中的位置
         */
        toArray(array: number[], index?: number): Color;
        /**
         * 输出为向量
         */
        toVector3D(): Vector3D;
        /**
         * 输出16进制字符串
         */
        toHexString(): string;
        /**
         * 输出字符串
         */
        toString(): string;
        /**
         * [0,15]数值转为16进制字符串
         * param i  [0,15]数值
         */
        static ToHex(i: number): string;
    }
}
declare module feng3d {
    /**
     * 数学常量类
     */
    class MathConsts {
        /**
         * 弧度转角度因子
         */
        static RADIANS_TO_DEGREES: number;
        /**
         * 角度转弧度因子
         */
        static DEGREES_TO_RADIANS: number;
    }
}
declare module feng3d {
    /**
     * 矩形
     * @author feng 2016-04-27
     */
    class Rectangle {
        /**
         * X坐标
         */
        x: number;
        /**
         * Y坐标
         */
        y: number;
        /**
         * 宽度
         */
        width: number;
        /**
         * 高度
         */
        height: number;
        /**
         * 是否包含指定点
         * @param x 点的X坐标
         * @param y 点的Y坐标
         */
        contains(x: number, y: number): boolean;
    }
}
declare module feng3d {
    /**
     * Vector3D 类使用笛卡尔坐标 x、y 和 z 表示三维空间中的点或位置
     * @author feng 2016-3-21
     */
    class Vector3D {
        /**
        * 定义为 Vector3D 对象的 x 轴，坐标为 (1,0,0)。
        */
        static X_AXIS: Vector3D;
        /**
        * 定义为 Vector3D 对象的 y 轴，坐标为 (0,1,0)
        */
        static Y_AXIS: Vector3D;
        /**
        * 定义为 Vector3D 对象的 z 轴，坐标为 (0,0,1)
        */
        static Z_AXIS: Vector3D;
        /**
        * Vector3D 对象中的第一个元素，例如，三维空间中某个点的 x 坐标。默认值为 0
        */
        x: number;
        /**
        * Vector3D 对象中的第二个元素，例如，三维空间中某个点的 y 坐标。默认值为 0
        */
        y: number;
        /**
        * Vector3D 对象中的第三个元素，例如，三维空间中某个点的 z 坐标。默认值为 0
        */
        z: number;
        /**
        * Vector3D 对象的第四个元素（除了 x、y 和 z 属性之外）可以容纳数据，例如旋转角度。默认值为 0
        */
        w: number;
        /**
        * 当前 Vector3D 对象的长度（大小），即从原点 (0,0,0) 到该对象的 x、y 和 z 坐标的距离。w 属性将被忽略。单位矢量具有的长度或大小为一。
        */
        readonly length: number;
        /**
        * 当前 Vector3D 对象长度的平方，它是使用 x、y 和 z 属性计算出来的。w 属性将被忽略。尽可能使用 lengthSquared() 方法，而不要使用 Vector3D.length() 方法的 Math.sqrt() 方法调用，后者速度较慢。
        */
        readonly lengthSquared: number;
        /**
         * 创建 Vector3D 对象的实例。如果未指定构造函数的参数，则将使用元素 (0,0,0,0) 创建 Vector3D 对象。
         * @param x 第一个元素，例如 x 坐标。
         * @param y 第二个元素，例如 y 坐标。
         * @param z 第三个元素，例如 z 坐标。
         * @param w 表示额外数据的可选元素，例如旋转角度
         */
        constructor(x?: number, y?: number, z?: number, w?: number);
        /**
         * 将当前 Vector3D 对象的 x、y 和 z 元素的值与另一个 Vector3D 对象的 x、y 和 z 元素的值相加。
         * @param a 要与当前 Vector3D 对象相加的 Vector3D 对象。
         * @return 一个 Vector3D 对象，它是将当前 Vector3D 对象与另一个 Vector3D 对象相加所产生的结果。
         */
        add(a: Vector3D): Vector3D;
        /**
         * 返回一个新 Vector3D 对象，它是与当前 Vector3D 对象完全相同的副本。
         * @return 一个新 Vector3D 对象，它是当前 Vector3D 对象的副本。
         */
        clone(): Vector3D;
        /**
         * 将源 Vector3D 对象中的所有矢量数据复制到调用方 Vector3D 对象中。
         * @return 要从中复制数据的 Vector3D 对象。
         */
        copyFrom(sourceVector3D: Vector3D): void;
        /**
         * 返回一个新的 Vector3D 对象，它与当前 Vector3D 对象和另一个 Vector3D 对象垂直（成直角）。
         */
        crossProduct(a: Vector3D): Vector3D;
        /**
         * 按照指定的 Vector3D 对象的 x、y 和 z 元素的值递减当前 Vector3D 对象的 x、y 和 z 元素的值。
         */
        decrementBy(a: Vector3D): void;
        /**
         * 返回两个 Vector3D 对象之间的距离。
         */
        static distance(pt1: Vector3D, pt2: Vector3D): number;
        /**
         * 如果当前 Vector3D 对象和作为参数指定的 Vector3D 对象均为单位顶点，此方法将返回这两个顶点之间所成角的余弦值。
         */
        dotProduct(a: Vector3D): number;
        /**
         * 通过将当前 Vector3D 对象的 x、y 和 z 元素与指定的 Vector3D 对象的 x、y 和 z 元素进行比较，确定这两个对象是否相等。
         */
        equals(toCompare: Vector3D, allFour?: boolean): boolean;
        /**
         * 按照指定的 Vector3D 对象的 x、y 和 z 元素的值递增当前 Vector3D 对象的 x、y 和 z 元素的值。
         */
        incrementBy(a: Vector3D): void;
        /**
         * 将当前 Vector3D 对象设置为其逆对象。
         */
        negate(): void;
        /**
         * 通过将最前面的三个元素（x、y、z）除以矢量的长度可将 Vector3D 对象转换为单位矢量。
         */
        normalize(thickness?: number): void;
        /**
         * 按标量（大小）缩放当前的 Vector3D 对象。
         */
        scaleBy(s: number): void;
        /**
         * 将 Vector3D 的成员设置为指定值
         */
        setTo(xa: number, ya: number, za: number): void;
        /**
         * 从另一个 Vector3D 对象的 x、y 和 z 元素的值中减去当前 Vector3D 对象的 x、y 和 z 元素的值。
         */
        subtract(a: Vector3D): Vector3D;
        /**
         * 返回当前 Vector3D 对象的字符串表示形式。
         */
        toString(): string;
    }
}
declare module feng3d {
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
         * 一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        rawData: Float32Array;
        /**
         * 一个保存显示对象在转换参照帧中的 3D 坐标 (x,y,z) 位置的 Vector3D 对象。
         */
        position: Vector3D;
        /**
         * 一个用于确定矩阵是否可逆的数字。
         */
        readonly determinant: number;
        /**
         * 前方（+Z轴方向）
         */
        readonly forward: Vector3D;
        /**
         * 上方（+y轴方向）
         */
        readonly up: Vector3D;
        /**
         * 右方（+x轴方向）
         */
        readonly right: Vector3D;
        /**
         * 创建 Matrix3D 对象。
         * @param   datas    一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        constructor(datas?: Float32Array | number[]);
        /**
         * 创建旋转矩阵
         * @param   degrees         角度
         * @param   axis            旋转轴
         * @param   pivotPoint      旋转中心点
         */
        static createRotationMatrix3D(degrees: number, axis: Vector3D): Matrix3D;
        /**
         * 创建缩放矩阵
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        static createScaleMatrix3D(xScale: number, yScale: number, zScale: number): Matrix3D;
        /**
         * 创建位移矩阵
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        static createTranslationMatrix3D(x: number, y: number, z: number): Matrix3D;
        /**
         * 通过将另一个 Matrix3D 对象与当前 Matrix3D 对象相乘来后置一个矩阵。
         */
        append(lhs: Matrix3D): void;
        /**
         * 在 Matrix3D 对象上后置一个增量旋转。
         * @param   degrees         角度
         * @param   axis            旋转轴
         * @param   pivotPoint      旋转中心点
         */
        appendRotation(degrees: number, axis: Vector3D, pivotPoint?: Vector3D): void;
        /**
         * 在 Matrix3D 对象上后置一个增量缩放，沿 x、y 和 z 轴改变位置。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        appendScale(xScale: number, yScale: number, zScale: number): void;
        /**
         * 在 Matrix3D 对象上后置一个增量平移，沿 x、y 和 z 轴重新定位。
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        appendTranslation(x: number, y: number, z: number): void;
        /**
         * 返回一个新 Matrix3D 对象，它是与当前 Matrix3D 对象完全相同的副本。
         */
        clone(): Matrix3D;
        /**
         * 将 Vector3D 对象复制到调用方 Matrix3D 对象的特定列中。
         * @param   column      副本的目标列。
         * @param   vector3D    要从中复制数据的 Vector3D 对象。
         */
        copyColumnFrom(column: number, vector3D: Vector3D): void;
        /**
         * 将调用方 Matrix3D 对象的特定列复制到 Vector3D 对象中。
         * @param   column       要从中复制数据的列。
         * @param   vector3D     副本的目标 Vector3D 对象。
         */
        copyColumnTo(column: number, vector3D: Vector3D): void;
        /**
         * 将源 Matrix3D 对象中的所有矩阵数据复制到调用方 Matrix3D 对象中。
         * @param   sourceMatrix3D      要从中复制数据的 Matrix3D 对象。
         */
        copyFrom(sourceMatrix3D: Matrix3D): void;
        /**
         * 将源 Vector 对象中的所有矢量数据复制到调用方 Matrix3D 对象中。利用可选索引参数，您可以选择矢量中的任何起始文字插槽。
         * @param   vector      要从中复制数据的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        copyRawDataFrom(vector: Float32Array, index?: number, transpose?: boolean): void;
        /**
         * 将调用方 Matrix3D 对象中的所有矩阵数据复制到提供的矢量中。
         * @param   vector      要将数据复制到的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        copyRawDataTo(vector: Array<number>, index?: number, transpose?: boolean): void;
        /**
         * 将 Vector3D 对象复制到调用方 Matrix3D 对象的特定行中。
         * @param   row         要将数据复制到的行。
         * @param   vector3D    要从中复制数据的 Vector3D 对象。
         */
        copyRowFrom(row: number, vector3D: Vector3D): void;
        /**
         * 将调用方 Matrix3D 对象的特定行复制到 Vector3D 对象中。
         * @param   row         要从中复制数据的行。
         * @param   vector3D    将作为数据复制目的地的 Vector3D 对象。
         */
        copyRowTo(row: number, vector3D: Vector3D): void;
        /**
         * 拷贝当前矩阵
         * @param   dest    目标矩阵
         */
        copyToMatrix3D(dest: Matrix3D): void;
        /**
         * 将转换矩阵的平移、旋转和缩放设置作为由三个 Vector3D 对象组成的矢量返回。
         * @return      一个由三个 Vector3D 对象组成的矢量，其中，每个对象分别容纳平移、旋转和缩放设置。
         */
        decompose(): Vector3D[];
        /**
         * 使用不含平移元素的转换矩阵将 Vector3D 对象从一个空间坐标转换到另一个空间坐标。
         * @param   v   一个容纳要转换的坐标的 Vector3D 对象。
         * @return  一个包含转换后的坐标的 Vector3D 对象。
         */
        deltaTransformVector(v: Vector3D): Vector3D;
        /**
         * 将当前矩阵转换为恒等或单位矩阵。
         */
        identity(): void;
        /**
         * 反转当前矩阵。逆矩阵
         * @return      如果成功反转矩阵，则返回 true。
         */
        invert(): boolean;
        /**
         * 通过将当前 Matrix3D 对象与另一个 Matrix3D 对象相乘来前置一个矩阵。得到的结果将合并两个矩阵转换。
         * @param   rhs     个右侧矩阵，它与当前 Matrix3D 对象相乘。
         */
        prepend(rhs: Matrix3D): void;
        /**
         * 在 Matrix3D 对象上前置一个增量旋转。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行旋转，然后再执行其他转换。
         * @param   degrees     旋转的角度。
         * @param   axis        旋转的轴或方向。常见的轴为 X_AXIS (Vector3D(1,0,0))、Y_AXIS (Vector3D(0,1,0)) 和 Z_AXIS (Vector3D(0,0,1))。此矢量的长度应为 1。
         * @param   pivotPoint  一个用于确定旋转中心的点。对象的默认轴点为该对象的注册点。
         */
        prependRotation(degrees: number, axis: Vector3D, pivotPoint?: Vector3D): void;
        /**
         * 在 Matrix3D 对象上前置一个增量缩放，沿 x、y 和 z 轴改变位置。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行缩放更改，然后再执行其他转换。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        prependScale(xScale: number, yScale: number, zScale: number): void;
        /**
         * 在 Matrix3D 对象上前置一个增量平移，沿 x、y 和 z 轴重新定位。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行平移更改，然后再执行其他转换。
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        prependTranslation(x: number, y: number, z: number): void;
        /**
         * 设置转换矩阵的平移、旋转和缩放设置。
         * @param   components      一个由三个 Vector3D 对象组成的矢量，这些对象将替代 Matrix3D 对象的平移、旋转和缩放元素。
         */
        recompose(components: Vector3D[]): void;
        /**
         * 使用转换矩阵将 Vector3D 对象从一个空间坐标转换到另一个空间坐标。
         * @param   vin   一个容纳要转换的坐标的 Vector3D 对象。
         * @return  一个包含转换后的坐标的 Vector3D 对象。
         */
        transformVector(vin: Vector3D, vout?: Vector3D): Vector3D;
        /**
         * 使用转换矩阵将由数字构成的矢量从一个空间坐标转换到另一个空间坐标。
         * @param   vin     一个由多个数字组成的矢量，其中每三个数字构成一个要转换的 3D 坐标 (x,y,z)。
         * @param   vout    一个由多个数字组成的矢量，其中每三个数字构成一个已转换的 3D 坐标 (x,y,z)。
         */
        transformVectors(vin: number[], vout: number[]): void;
        /**
         * 将当前 Matrix3D 对象转换为一个矩阵，并将互换其中的行和列。
         */
        transpose(): void;
        /**
         * 比较矩阵是否相等
         */
        compare(matrix3D: Matrix3D, precision?: number): boolean;
        /**
         * 看向目标位置
         * @param target    目标位置
         * @param upAxis    向上朝向
         */
        lookAt(target: Vector3D, upAxis?: Vector3D): void;
        /**
         * 以字符串返回矩阵的值
         */
        toString(): string;
    }
}
declare module feng3d {
    /**
     * 3d面
     */
    class Plane3D {
        /**
         * 平面A系数
         * <p>同样也是面法线x尺寸</p>
         */
        a: number;
        /**
         * 平面B系数
         * <p>同样也是面法线y尺寸</p>
         */
        b: number;
        /**
         * 平面C系数
         * <p>同样也是面法线z尺寸</p>
         */
        c: number;
        /**
         * 平面D系数
         * <p>同样也是（0，0）点到平面的距离的负值</p>
         */
        d: number;
        /**
         * 对齐类型
         */
        _alignment: number;
        /**
         * 普通平面
         * <p>不与对称轴平行或垂直</p>
         */
        static ALIGN_ANY: number;
        /**
         * XY方向平面
         * <p>法线与Z轴平行</p>
         */
        static ALIGN_XY_AXIS: number;
        /**
         * YZ方向平面
         * <p>法线与X轴平行</p>
         */
        static ALIGN_YZ_AXIS: number;
        /**
         * XZ方向平面
         * <p>法线与Y轴平行</p>
         */
        static ALIGN_XZ_AXIS: number;
        /**
         * 创建一个平面
         * @param a		A系数
         * @param b		B系数
         * @param c		C系数
         * @param d		D系数
         */
        constructor(a?: number, b?: number, c?: number, d?: number);
        /**
         * 通过3顶点定义一个平面
         * @param p0		点0
         * @param p1		点1
         * @param p2		点2
         */
        fromPoints(p0: Vector3D, p1: Vector3D, p2: Vector3D): void;
        /**
         * 根据法线与点定义平面
         * @param normal		平面法线
         * @param point			平面上任意一点
         */
        fromNormalAndPoint(normal: Vector3D, point: Vector3D): void;
        /**
         * 标准化平面
         * @return		标准化后的平面
         */
        normalize(): Plane3D;
        /**
         * 计算点与平面的距离
         * @param p		点
         * @returns		距离
         */
        distance(p: Vector3D): number;
        /**
         * 顶点分类
         * <p>把顶点分为后面、前面、相交三类</p>
         * @param p			顶点
         * @return			顶点类型 PlaneClassification.BACK,PlaneClassification.FRONT,PlaneClassification.INTERSECT
         * @see				feng3d.core.math.PlaneClassification
         */
        classifyPoint(p: Vector3D, epsilon?: number): number;
        /**
         * 输出字符串
         */
        toString(): string;
    }
}
declare module feng3d {
    /**
     * 点与面的相对位置
     * @author feng
     */
    class PlaneClassification {
        /**
         * 在平面后面
         * <p>等价于平面内</p>
         * @see #IN
         */
        static BACK: number;
        /**
         * 在平面前面
         * <p>等价于平面外</p>
         * @see #OUT
         */
        static FRONT: number;
        /**
         * 在平面内
         * <p>等价于在平面后</p>
         * @see #BACK
         */
        static IN: number;
        /**
         * 在平面外
         * <p>等价于平面前面</p>
         * @see #FRONT
         */
        static OUT: number;
        /**
         * 与平面相交
         */
        static INTERSECT: number;
    }
}
declare module feng3d {
    /**
     * 渲染模式
     * @author feng 2016-09-28
     */
    enum RenderMode {
        DEFAULT,
        /**
         * 点渲染
         */
        POINTS,
        LINE_LOOP,
        LINE_STRIP,
        LINES,
        TRIANGLES,
        TRIANGLE_STRIP,
        TRIANGLE_FAN,
    }
}
declare module feng3d {
    /**
     * 渲染参数
     * @author feng 2016-12-14
     */
    interface ShaderParams {
        /**
         * 渲染模式
         */
        renderMode: RenderMode;
    }
}
declare module feng3d {
    /**
     * 渲染数据拥有者
     * @author feng 2016-6-7
     */
    class RenderDataHolder extends Component {
        protected renderData: RenderData;
        private _subRenderDataHolders;
        /**
         * 创建Context3D数据缓冲
         */
        constructor();
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
        /**
         * 激活
         * @param renderData	渲染数据
         */
        activate(renderData: RenderAtomic): void;
        /**
         * 释放
         * @param renderData	渲染数据
         */
        deactivate(renderData: RenderAtomic): void;
        /**
         * 添加组件到指定位置
         * @param component		被添加的组件
         * @param index			插入的位置
         */
        addComponentAt(component: IComponent, index: number): void;
        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        removeComponentAt(index: number): IComponent;
    }
}
declare module feng3d {
    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     * @author feng 2016-06-20
     */
    class RenderAtomic {
        /**
         * 顶点索引缓冲
         */
        indexBuffer: IndexRenderData;
        /**
         * 顶点渲染程序代码
         */
        vertexCode: string;
        /**
         * 片段渲染程序代码
         */
        fragmentCode: string;
        /**
         * 属性数据列表
         */
        attributes: {
            [name: string]: AttributeRenderData;
        };
        /**
         * 常量数据（包含纹理）列表
         */
        uniforms: {
            [name: string]: Matrix3D | Vector3D | TextureInfo | Vector3D[];
        };
        /**
         * 渲染参数
         */
        shaderParams: ShaderParams;
        /**
         * 着色器宏定义
         */
        shaderMacro: ShaderMacro;
    }
    /**
     * 渲染所需数据
     * @author feng 2016-12-28
     */
    class RenderData extends RenderAtomic {
    }
}
declare module feng3d {
    /**
     * 索引渲染数据
     * @author feng 2017-01-04
     */
    class IndexRenderData {
        /**
         * 索引数据
         */
        indices: Uint16Array;
        /**
         * 数据绑定目标，gl.ARRAY_BUFFER、gl.ELEMENT_ARRAY_BUFFER
         */
        target: number;
        /**
         * 渲染数量
         */
        count: number;
        /**
         * 数据类型，gl.UNSIGNED_BYTE、gl.UNSIGNED_SHORT
         */
        type: number;
        /**
         * 索引偏移
         */
        offset: number;
    }
    /**
     * 属性渲染数据
     * @author feng 2014-8-14
     */
    interface AttributeRenderData {
        /**
         * 属性数据
         */
        data: Float32Array;
        /**
         * 数据步长
         */
        stride: number;
    }
}
declare module feng3d {
}
declare module feng3d {
    /**
     * 对象池
     * @author feng 2016-04-26
     */
    class RenderBufferPool {
        /**
         * @param context3D     3D环境
         */
        private getContext3DBufferPool(context3D);
        /**
         * 获取渲染程序
         * @param context3D     3D环境
         * @param vertexCode    顶点着色器代码
         * @param fragmentCode  片段着色器代码
         * @return  渲染程序
         */
        getWebGLProgram(context3D: WebGLRenderingContext, vertexCode: string, fragmentCode: string): WebGLProgram;
        /**
         * 获取顶点渲染程序
         * @param context3D         3D环境
         * @param vertexCode        顶点渲染代码
         * @return                  顶点渲染程序
         */
        getVertexShader(context3D: WebGLRenderingContext, vertexCode: string): WebGLShader;
        /**
         * 获取顶点渲染程序
         * @param context3D         3D环境
         * @param fragmentCode      顶点渲染代码
         * @return                  顶点渲染程序
         */
        getFragmentShader(context3D: WebGLRenderingContext, fragmentCode: string): WebGLShader;
        /**
         * 获取索引缓冲
         */
        getIndexBuffer(context3D: WebGLRenderingContext, indices: Uint16Array): WebGLBuffer;
        /**
         * 获取顶点属性缓冲
         * @param data  数据
         */
        getVABuffer(context3D: WebGLRenderingContext, data: Float32Array): WebGLBuffer;
        /**
         * 获取顶点属性缓冲
         * @param data  数据
         */
        getTexture(context3D: WebGLRenderingContext, data: TextureInfo): WebGLBuffer;
        /**
         * 3D环境缓冲池
         */
        private context3DBufferPools;
    }
    /**
     * 3D环境对象池
     */
    var context3DPool: RenderBufferPool;
}
declare module feng3d {
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
        static active(renderAtomic: RenderAtomic, renderData: RenderData): void;
        /**
         * 释放渲染数据
         * @param renderAtomic  渲染原子
         * @param renderData    包含渲染数据的对象
         */
        static deactivate(renderAtomic: RenderAtomic, renderData: RenderData): void;
    }
}
declare module feng3d {
    /**
     * 渲染数据编号
     * @author feng 2016-06-20
     */
    class RenderDataID {
        /**
         * 顶点索引
         */
        static index: string;
        /**
         * 模型矩阵
         */
        static u_modelMatrix: string;
        /**
         * 世界投影矩阵
         */
        static u_viewProjection: string;
        static u_diffuseInput: string;
        /**
         * 漫反射贴图
         */
        static s_texture: string;
        /**
         * 天空盒纹理
         */
        static s_skyboxTexture: string;
        /**
         * 摄像机矩阵
         */
        static u_cameraMatrix: string;
        /**
         * 天空盒尺寸
         */
        static u_skyBoxSize: string;
        /**
         * 地形混合贴图
         */
        static s_blendTexture: string;
        /**
         * 地形块贴图1
         */
        static s_splatTexture1: string;
        /**
         * 地形块贴图2
         */
        static s_splatTexture2: string;
        /**
         * 地形块贴图3
         */
        static s_splatTexture3: string;
        /**
         * 地形块重复次数
         */
        static u_splatRepeats: string;
        /**
         * 点光源位置数组
         */
        static u_pointLightPositions: string;
        /**
         * 点光源漫反射颜色数组
         */
        static u_pointLightDiffuses: string;
        /**
         * 点光源镜面反射颜色数组
         */
        static u_pointLightSpeculars: string;
    }
}
declare module feng3d {
    /**
     * 渲染参数编号
     * @author feng 2016-10-15
     */
    enum ShaderParamID {
        /**
         * 渲染模式
         */
        renderMode = 0,
    }
}
declare module feng3d {
    /**
     * 着色器宏定义
     * @author feng 2016-12-17
     */
    class ShaderMacro {
        /**
         * 值类型宏
         */
        valueMacros: ValueMacros;
        /**
         * Boolean类型宏
         */
        boolMacros: BoolMacros;
        /**
         * 递增类型宏
         */
        addMacros: IAddMacros;
    }
    /**
     * 值类型宏
     * 没有默认值
     */
    class ValueMacros {
        DIFFUSE_INPUT_TYPE: 0 | 1 | 2;
        /**
         * 点光源数量
         */
        NUM_POINTLIGHT: number;
    }
    /**
     * Boolean类型宏
     * 没有默认值
     */
    class BoolMacros {
    }
    /**
     * 递增类型宏
     * 所有默认值为0
     */
    class IAddMacros {
        /**
         * 是否需要属性uv
         */
        A_UV_NEED: number;
        /**
         * 是否需要变量uv
         */
        V_UV_NEED: number;
        /**
         * 是否需要变量全局坐标
         */
        V_GLOBAL_POSITION_NEED: number;
        /**
         * 是否需要属性法线
         */
        A_NORMAL_NEED: number;
        /**
         * 是否需要变量法线
         */
        V_NORMAL_NEED: number;
        /**
         * 是否需要摄像机矩阵
         */
        U_CAMERAmATRIX_NEED: number;
    }
}
declare module feng3d {
    /**
     * 渲染环境
     * @author feng 2017-01-04
     */
    class RenderContext {
        protected renderData: RenderData;
        /**
         * 摄像机
         */
        camera: Camera3D;
        /**
         * 灯光
         */
        lights: Light[];
        /**
         * 更新渲染数据
         */
        updateRenderData(object3D: Object3D): void;
        /**
         * 激活
         * @param renderData	渲染数据
         */
        activate(renderData: RenderAtomic): void;
        /**
         * 释放
         * @param renderData	渲染数据
         */
        deactivate(renderData: RenderAtomic): void;
        /**
         * 清理
         */
        clear(): void;
    }
}
declare module feng3d {
    /**
     * 3D对象
     * @author feng 2016-04-26
     */
    class Object3D extends RenderDataHolder {
        private _transform;
        /**
         * 父对象
         */
        private _parent;
        /**
         * 子对象列表
         */
        private _children;
        private _scene;
        /**
         * 唯一标识符
         */
        readonly uid: any;
        /**
         * 变换
         */
        transform: Transform;
        /**
         * 构建3D对象
         */
        constructor(name?: string);
        /**
         * 父对象
         */
        readonly parent: Object3D;
        private _setParent(value);
        /**
         * 场景
         */
        readonly scene: Scene3D;
        private _setScene(value);
        /**
         * 添加子对象
         * @param child		子对象
         * @return			新增的子对象
         */
        addChild(child: Object3D): void;
        /**
         * 添加子对象到指定位置
         * @param   child   子对象
         * @param   index   添加到的位置
         */
        addChildAt(child: Object3D, index: number): void;
        /**
         * 移除子对象
         * @param   child   子对象
         * @return			被移除子对象索引
         */
        removeChild(child: Object3D): number;
        /**
         * 获取子对象索引
         * @param   child   子对象
         * @return  子对象位置
         */
        getChildIndex(child: Object3D): number;
        /**
         * 移出指定索引的子对象
         * @param childIndex	子对象索引
         * @return				被移除对象
         */
        removeChildAt(childIndex: number): Object3D;
        /**
         * 获取子对象
         * @param index         子对象索引
         * @return              指定索引的子对象
         */
        getChildAt(index: number): Object3D;
        /**
         * 获取子对象数量
         */
        readonly numChildren: number;
        /**
         * 处理添加子对象事件
         */
        private onAdded(event);
        /**
         * 处理删除子对象事件
         */
        private onRemoved(event);
    }
}
declare module feng3d {
    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    class View3D {
        private _context3D;
        private _camera;
        private _scene;
        private _canvas;
        /**
         * 绘制宽度
         */
        private renderWidth;
        /**
         * 绘制高度
         */
        private renderHeight;
        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        constructor(canvas: any, scene?: Scene3D, camera?: Camera3D);
        /**
         * 初始化GL
         */
        private initGL();
        /** 3d场景 */
        scene: Scene3D;
        /**
         * 绘制场景
         */
        private drawScene();
        /**
         * 重置尺寸
         */
        private resize();
        /**
         * 摄像机
         */
        camera: Camera3D;
    }
}
declare module feng3d {
    /**
     * 3D对象组件
     * @author feng 2016-09-02
     */
    class Object3DComponent extends RenderDataHolder {
        /**
         * 父组件
         */
        protected _parentComponent: Object3D;
        /**
         * 所属对象
         */
        readonly object3D: Object3D;
        /**
         * 构建3D对象组件
         */
        constructor();
        /**
         * 全局矩阵
         */
        readonly globalMatrix3d: Matrix3D;
    }
}
declare module feng3d {
    /**
     * 变换
     * @author feng 2016-04-26
     */
    class Transform extends Object3DComponent {
        private _x;
        private _y;
        private _z;
        private _rx;
        private _ry;
        private _rz;
        private _sx;
        private _sy;
        private _sz;
        private _matrix3D;
        private _matrix3DDirty;
        private _inverseMatrix3D;
        private _inverseMatrix3DDirty;
        /**
         * 全局矩阵是否变脏
         */
        private _globalMatrix3DDirty;
        /**
         * 全局矩阵
         */
        private _globalMatrix3D;
        private _inverseGlobalMatrix3DDirty;
        private _inverseGlobalMatrix3D;
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
        constructor(x?: number, y?: number, z?: number, rx?: number, ry?: number, rz?: number, sx?: number, sy?: number, sz?: number);
        /**
         * X坐标
         */
        x: number;
        /**
         * Y坐标
         */
        y: number;
        /**
         * Z坐标
         */
        z: number;
        /**
         * X旋转
         */
        rx: number;
        /**
         * Y旋转
         */
        ry: number;
        /**
         * Z旋转
         */
        rz: number;
        /**
         * X缩放
         */
        sx: number;
        /**
         * Y缩放
         */
        sy: number;
        /**
         * Z缩放
         */
        sz: number;
        /**
         * 位移
         */
        position: Vector3D;
        /**
         * 旋转
         */
        rotation: Vector3D;
        /**
         * 缩放
         */
        scale: Vector3D;
        /**
         * 全局坐标
         */
        readonly globalPosition: Vector3D;
        /**
         * 变换矩阵
         */
        matrix3d: Matrix3D;
        /**
         * 逆变换矩阵
         */
        readonly inverseMatrix3D: Matrix3D;
        /**
         * 看向目标位置
         * @param target    目标位置
         * @param upAxis    向上朝向
         */
        lookAt(target: Vector3D, upAxis?: Vector3D): void;
        /**
         * 全局矩阵
         */
        readonly globalMatrix3D: Matrix3D;
        /**
         * 逆全局矩阵
         */
        readonly inverseGlobalMatrix3D: Matrix3D;
        /**
         * 变换矩阵
         */
        private updateMatrix3D();
        /**
         * 使变换矩阵无效
         */
        protected invalidateMatrix3D(): void;
        /**
         * 发出状态改变消息
         */
        private notifyMatrix3DChanged();
        /**
         * 更新全局矩阵
         */
        private updateGlobalMatrix3D();
        /**
         * 更新逆全局矩阵
         */
        private updateInverseGlobalMatrix3D();
        /**
         * 通知全局变换改变
         */
        private notifySceneTransformChange();
        /**
         * 全局变换矩阵失效
         * @private
         */
        invalidateGlobalMatrix3D(): void;
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
    /**
     * 变换事件(3D状态发生改变、位置、旋转、缩放)
     * @author feng 2014-3-31
     */
    class TransfromEvent extends Event {
        /**
         * 平移
         */
        static POSITION_CHANGED: string;
        /**
         * 旋转
         */
        static ROTATION_CHANGED: string;
        /**
         * 缩放
         */
        static SCALE_CHANGED: string;
        /**
         * 变换
         */
        static TRANSFORM_CHANGED: string;
        /**
         * 变换已更新
         */
        static TRANSFORM_UPDATED: string;
        /**
         * 场景变换矩阵发生变化
         */
        static SCENETRANSFORM_CHANGED: string;
        /**
         * 发出事件的3D元素
         */
        data: Transform;
        /**
         * 创建一个作为参数传递给事件侦听器的 Event 对象。
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type: string, data: Transform, bubbles?: boolean);
    }
}
declare module feng3d {
    /**
     * 3D对象事件
     */
    class Object3DEvent extends Event {
        /**
         * 添加了子对象，当child被添加到parent中时派发冒泡事件
         */
        static ADDED: string;
        /**
         * 删除了子对象，当child被parent移除时派发冒泡事件
         */
        static REMOVED: string;
        /**
         * 事件数据
         */
        data: IObject3DEventData;
        /**
         * 创建一个作为参数传递给事件侦听器的 Event 对象。
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type: string, data?: IObject3DEventData, bubbles?: boolean);
    }
    /**
     * 3D对象事件数据
     */
    interface IObject3DEventData {
        /**
         * 父容器
         */
        parent?: Object3D;
        /**
         * 子对象
         */
        child?: Object3D;
    }
}
declare module feng3d {
    /**
     * 网格
     * @author feng 2016-12-12
     */
    class MeshFilter extends Object3DComponent {
        private _geometry;
        /**
         * 几何体
         */
        geometry: Geometry;
    }
}
declare module feng3d {
    /**
     * 渲染器
     * @author feng 2016-05-01
     */
    class Renderer extends Object3DComponent {
        /** 渲染原子 */
        private _renderAtomic;
        /**
         * 渲染
         */
        draw(context3D: WebGLRenderingContext, renderContext: RenderContext): void;
        /**
         * 绘制3D对象
         */
        private drawObject3D(context3D);
    }
}
declare module feng3d {
    /**
     * 网格渲染器
     * @author feng 2016-12-12
     */
    class MeshRenderer extends Renderer {
        private _material;
        /**
         * 材质
         */
        material: Material;
        constructor();
        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void;
        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void;
        /**
         * 处理添加到场景事件
         */
        private onAddedToScene(event);
        /**
         * 处理从场景移除事件
         */
        private onRemovedFromScene(event);
    }
}
declare module feng3d {
    /**
     * 3D场景
     * @author feng 2016-05-01
     */
    class Scene3D extends Object3D {
        private _renderContext;
        private _object3Ds;
        private _renderers;
        private _lights;
        /**
         * 渲染列表
         */
        readonly renderers: MeshRenderer[];
        /**
         * 灯光列表
         */
        readonly lights: Light[];
        /**
         * 构造3D场景
         */
        constructor();
        /**
         * 处理添加对象事件
         */
        private onAddedToScene(event);
        /**
         * 处理移除对象事件
         */
        private onRemovedFromScene(event);
        /**
         * 处理添加对象事件
         */
        private onAddedRendererToScene(event);
        /**
         * 处理移除对象事件
         */
        private onRemovedRendererFromScene(event);
        /**
         * 处理添加灯光事件
         */
        private onAddedLightToScene(event);
        /**
         * 处理移除灯光事件
         */
        private onRemovedLightFromScene(event);
        /**
         * 渲染
         */
        draw(context3D: WebGLRenderingContext, camera: Camera3D): void;
    }
}
declare module feng3d {
    /**
     * 3D场景事件
     * @author feng 2016-01-03
     */
    class Scene3DEvent extends Event {
        /**
         * 当Object3D的scene属性被设置是由Object3D与Scene3D分别派发不冒泡事件
         */
        static ADDED_TO_SCENE: string;
        /**
         * 当Object3D的scene属性被清空时由Object3D与Scene3D分别派发不冒泡事件
         */
        static REMOVED_FROM_SCENE: string;
        /**
         * 当拥有Light的Object3D添加到Scene3D或者Light添加到场景中的Object3D时派发不冒泡事件
         */
        static ADDED_LIGHT_TO_SCENE: string;
        /**
         * 当拥有Light的Object3D从Scene3D中移除或者Light从场景中的Object3D移除时派发不冒泡事件
         */
        static REMOVED_LIGHT_FROM_SCENE: string;
        /**
         * 当拥有Renderer的Object3D添加到Scene3D或者Renderer添加到场景中的Object3D时派发不冒泡事件
         */
        static ADDED_RENDERER_TO_SCENE: string;
        /**
         * 当拥有Renderer的Object3D从Scene3D中移除或者Renderer从场景中的Object3D移除时派发不冒泡事件
         */
        static REMOVED_RENDERER_FROM_SCENE: string;
        /**
         * 事件数据
         */
        data: IScene3DEventData;
        /**
         * 创建一个作为参数传递给事件侦听器的 Event 对象。
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type: string, data?: IScene3DEventData, bubbles?: boolean);
    }
    /**
     * 3D对象事件数据
     */
    interface IScene3DEventData {
        /**
         * 3d对象
         */
        object3d?: Object3D;
        /**
         * 场景
         */
        scene?: Scene3D;
        /**
         * 灯光
         */
        light?: Light;
        /**
         * 渲染器
         */
        renderer?: MeshRenderer;
    }
}
declare module feng3d {
    /**
     * opengl顶点属性名称
     */
    class GLAttribute {
        /**
         * 坐标
         */
        static a_position: string;
        /**
         * 法线
         */
        static a_normal: string;
        /**
         * 切线
         */
        static a_tangent: string;
        /**
         * uv（纹理坐标）
         */
        static a_uv: string;
    }
}
declare module feng3d {
    /**
     * 几何体
     * @author feng 2016-04-28
     */
    class Geometry extends RenderDataHolder {
        /**
         * 创建一个几何体
         */
        constructor();
        /**
         * 更新顶点索引数据
         */
        setIndices(indices: Uint16Array): void;
        /**
         * 设置顶点属性数据
         * @param vaId          顶点属性编号
         * @param data          顶点属性数据
         * @param stride        顶点数据步长
         */
        setVAData(vaId: string, data: Float32Array, stride: number): void;
        /**
         * 获取顶点属性数据
         * @param vaId 数据类型编号
         * @return 顶点属性数据
         */
        getVAData(vaId: string): AttributeRenderData;
    }
}
declare module feng3d {
    /**
     * 几何体事件
     * @author feng 2015-12-8
     */
    class GeometryEvent extends Event {
        /**
         * 获取几何体顶点数据
         */
        static GET_VA_DATA: string;
        /**
         * 改变几何体顶点数据事件
         */
        static CHANGED_VA_DATA: string;
        /**
         * 改变顶点索引数据事件
         */
        static CHANGED_INDEX_DATA: string;
        /**
         * 事件目标
         */
        target: Geometry;
        /**
         * 构建几何体事件
         */
        constructor(type: string, data?: any, bubbles?: boolean);
    }
}
declare module feng3d {
    /**
     * 线段组件
     * @author feng 2016-10-16
     */
    class SegmentGeometry extends Geometry {
        /**
         * 几何体是否变脏
         */
        private geometryDirty;
        private _segments;
        /**
         * 添加线段
         * @param segment		线段数据
         */
        addSegment(segment: Segment, needUpdateGeometry?: boolean): void;
        /**
         * 更新几何体
         */
        updateGeometry(): void;
        /**
         * 获取线段数据
         * @param index 		线段索引
         * @return				线段数据
         */
        getSegment(index: number): Segment;
        /**
         * 移除所有线段
         */
        removeAllSegments(): void;
        /**
         * 线段列表
         */
        readonly segments: Segment[];
    }
    /**
     * 线段
     * @author feng 2016-10-16
     */
    class Segment {
        thickness: number;
        start: Vector3D;
        end: Vector3D;
        startColor: number;
        endColor: number;
        /**
         * 创建线段
         * @param start 起点坐标
         * @param end 终点坐标
         * @param colorStart 起点颜色
         * @param colorEnd 终点颜色
         * @param thickness 线段厚度
         */
        constructor(start: Vector3D, end: Vector3D, colorStart?: number, colorEnd?: number, thickness?: number);
        /**
         * 坐标数据
         */
        readonly positionData: number[];
    }
}
declare module feng3d {
    /**
     * 几何体组件
     * @author feng 2016-10-16
     */
    class GeometryComponent extends Component {
        /**
         * 父组件
         */
        protected _parentComponent: Geometry;
        /**
         * 所属对象
         */
        readonly geometry: Geometry;
        /**
         * 构建几何体组件
         */
        constructor();
    }
}
declare module feng3d {
    /**
     * 镜头事件
     * @author feng 2014-10-14
     */
    class LensEvent extends Event {
        static MATRIX_CHANGED: string;
        /**
         * 镜头
         */
        data: LensBase;
        /**
         * 创建一个镜头事件。
         * @param type      事件的类型
         * @param lens      镜头
         * @param bubbles   确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type: string, lens?: LensBase, bubbles?: boolean);
    }
}
declare module feng3d {
    /**
     * 坐标系统类型
     * @author feng 2014-10-14
     */
    class CoordinateSystem {
        /**
         * 默认坐标系统，左手坐标系统
         */
        static LEFT_HANDED: number;
        /**
         * 右手坐标系统
         */
        static RIGHT_HANDED: number;
    }
}
declare module feng3d {
    /**
     * 摄像机镜头
     * @author feng 2014-10-14
     */
    abstract class LensBase extends Component {
        protected _matrix: Matrix3D;
        protected _scissorRect: Rectangle;
        protected _viewPort: Rectangle;
        protected _near: number;
        protected _far: number;
        protected _aspectRatio: number;
        protected _matrixInvalid: boolean;
        private _unprojection;
        private _unprojectionInvalid;
        /**
         * 创建一个摄像机镜头
         */
        constructor();
        /**
         * 投影矩阵
         */
        matrix: Matrix3D;
        /**
         * 最近距离
         */
        near: number;
        /**
         * 最远距离
         */
        far: number;
        /**
         * 视窗缩放比例(width/height)，在渲染器中设置
         */
        aspectRatio: number;
        /**
         * 场景坐标投影到屏幕坐标
         * @param point3d 场景坐标
         * @param v 屏幕坐标（输出）
         * @return 屏幕坐标
         */
        project(point3d: Vector3D, v?: Vector3D): Vector3D;
        /**
         * 投影逆矩阵
         */
        readonly unprojectionMatrix: Matrix3D;
        /**
         * 屏幕坐标投影到摄像机空间坐标
         * @param nX 屏幕坐标X -1（左） -> 1（右）
         * @param nY 屏幕坐标Y -1（上） -> 1（下）
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        abstract unproject(nX: number, nY: number, sZ: number, v: Vector3D): Vector3D;
        /**
         * 投影矩阵失效
         */
        protected invalidateMatrix(): void;
        /**
         * 更新投影矩阵
         */
        protected abstract updateMatrix(): any;
    }
}
declare module feng3d {
    /**
     * 透视摄像机镜头
     * @author feng 2014-10-14
     */
    class PerspectiveLens extends LensBase {
        private _fieldOfView;
        private _focalLength;
        private _focalLengthInv;
        private _yMax;
        private _xMax;
        private _coordinateSystem;
        /**
         * 创建一个透视摄像机镜头
         * @param fieldOfView 视野
         * @param coordinateSystem 坐标系统类型
         */
        constructor(fieldOfView?: number, coordinateSystem?: number);
        /**
         * 视野
         */
        fieldOfView: number;
        /**
         * 焦距
         */
        focalLength: number;
        unproject(nX: number, nY: number, sZ: number, v?: Vector3D): Vector3D;
        /**
         * 坐标系类型
         */
        coordinateSystem: number;
        /**
         * 更新投影矩阵
         */
        protected updateMatrix(): void;
    }
}
declare module feng3d {
    /**
     * 摄像机
     * @author feng 2016-08-16
     */
    class Camera3D extends Object3DComponent {
        private _viewProjection;
        private _viewProjectionDirty;
        private _lens;
        /**
         * 创建一个摄像机
         * @param lens 摄像机镜头
         */
        constructor(lens?: LensBase);
        /**
         * 镜头
         */
        readonly lens: LensBase;
        /**
         * 场景投影矩阵，世界空间转投影空间
         */
        readonly viewProjection: Matrix3D;
        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void;
        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void;
        /**
         * 处理镜头变化事件
         */
        private onLensMatrixChanged(event);
        private onSpaceTransformChanged(event);
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
}
declare module feng3d {
    /**
     * 3D基元类型
     * @author feng 2016-05-01
     */
    enum PrimitiveType {
        /**
         * 平面
         */
        Plane = 0,
        /**
         * 立方体
         */
        Cube = 1,
        /**
         * 球体
         */
        Sphere = 2,
        /**
         * 胶囊
         */
        Capsule = 3,
        /**
         * 圆柱体
         */
        Cylinder = 4,
    }
}
declare module feng3d.primitives {
    /**
     * 创建平面几何体
     * @param width 宽度
     * @param height 高度
     * @param segmentsW 横向分割数
     * @param segmentsH 纵向分割数
     * @param yUp 正面朝向 true:Y+ false:Z+
     * @param elements 顶点元素列表
     */
    function createPlane(width?: number, height?: number, segmentsW?: number, segmentsH?: number, yUp?: boolean, elements?: string[]): Geometry;
}
declare module feng3d.primitives {
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
    function createCube(width?: number, height?: number, depth?: number, segmentsW?: number, segmentsH?: number, segmentsD?: number, tile6?: boolean, elements?: string[]): Geometry;
}
declare module feng3d.primitives {
    /**
     * 创建球形几何体
     * @param radius 球体半径
     * @param segmentsW 横向分割数
     * @param segmentsH 纵向分割数
     * @param yUp 正面朝向 true:Y+ false:Z+
     * @param elements 顶点元素列表
     */
    function createSphere(radius?: number, segmentsW?: number, segmentsH?: number, yUp?: boolean, elements?: string[]): Geometry;
}
declare module feng3d.primitives {
    /**
     * 创建胶囊几何体
     * @param radius 胶囊体半径
     * @param height 胶囊体高度
     * @param segmentsW 横向分割数
     * @param segmentsH 纵向分割数
     * @param yUp 正面朝向 true:Y+ false:Z+
     * @param elements 顶点元素列表
     */
    function createCapsule(radius?: number, height?: number, segmentsW?: number, segmentsH?: number, yUp?: boolean, elements?: string[]): Geometry;
}
declare module feng3d.primitives {
    /**
     * 创建圆柱体
     */
    function createCylinder(topRadius?: number, bottomRadius?: number, height?: number, segmentsW?: number, segmentsH?: number, topClosed?: boolean, bottomClosed?: boolean, surfaceClosed?: boolean, yUp?: boolean, elements?: string[]): Geometry;
}
declare module feng3d.primitives {
    /**
     * 创建天空盒
     */
    function createSkyBox(): Geometry;
}
declare module feng3d {
    /**
     * 纹理信息
     * @author feng 2016-12-20
     */
    class TextureInfo {
        /**
         * 纹理类型
         */
        textureType: number;
        /**
         * 内部格式
         */
        internalformat: number;
        /**
         * 格式
         */
        format: number;
        /**
         * 数据类型
         */
        type: number;
        /**
         * 是否生成mipmap
         */
        generateMipmap: boolean;
        /**
         * 图片y轴向
         */
        flipY: number;
        minFilter: number;
        magFilter: number;
        wrapS: number;
        wrapT: number;
        /**
         * 图片数据
         */
        pixels: HTMLImageElement | HTMLImageElement[];
    }
}
declare module feng3d {
    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    class Texture2D extends TextureInfo {
        pixels: HTMLImageElement;
        constructor(pixels: HTMLImageElement);
    }
}
declare module feng3d {
    /**
     * 立方体纹理
     * @author feng 2016-12-28
     */
    class TextureCube extends TextureInfo {
        pixels: HTMLImageElement[];
        constructor(images: HTMLImageElement[]);
    }
}
declare module feng3d {
    /**
     * 材质
     * @author feng 2016-05-02
     */
    class Material extends RenderDataHolder {
        /**
        * 渲染模式
        */
        protected renderMode: RenderMode;
        /**
         * 渲染程序名称
         */
        protected shaderName: string;
        /**
         * 构建材质
         */
        constructor();
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
}
declare module feng3d {
    /**
     * 颜色材质
     * @author feng 2016-05-02
     */
    class ColorMaterial extends Material {
        /**
         * 颜色
         */
        color: Color;
        /**
         * 构建颜色材质
         * @param color 颜色
         * @param alpha 透明的
         */
        constructor(color?: Color);
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
}
declare module feng3d {
    /**
     * 线段材质
     * @author feng 2016-10-15
     */
    class SegmentMaterial extends Material {
        /**
         * 构建线段材质
         */
        constructor();
    }
}
declare module feng3d {
    /**
     * 材质组件
     * @author feng 2016-11-01
     */
    class MaterialComponent extends Component {
        /**
         * 父组件
         */
        protected _parentComponent: Material;
        /**
         * 所属对象
         */
        readonly material: Material;
        /**
         * 构建材质组件
         */
        constructor();
    }
}
declare module feng3d {
    /**
     * 纹理材质
     * @author feng 2016-12-23
     */
    class TextureMaterial extends Material {
        /**
         * 纹理数据
         */
        texture: Texture2D;
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
}
declare module feng3d {
    /**
     * 天空盒材质
     * @author feng 2016-12-20
     */
    class SkyBoxMaterial extends Material {
        skyBoxTextureCube: TextureCube;
        private skyBoxSize;
        constructor(images: HTMLImageElement[]);
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
}
declare module feng3d {
    /**
     * 灯光类型
     * @author feng 2016-12-12
     */
    enum LightType {
        /**
         * 点光
         */
        Point = 0,
        /**
         * 方向光
         */
        Directional = 1,
        /**
         * 聚光灯
         */
        Spot = 2,
    }
}
declare module feng3d {
    /**
     * 灯光
     * @author feng 2016-12-12
     */
    class Light extends Object3DComponent {
        /**
         * 灯光类型
         */
        type: LightType;
        /**
         * 颜色
         */
        color: Color;
        /**
         * 镜面反射反射率
         */
        specular: number;
        /**
         * 漫反射率
         */
        diffuse: number;
        /**
         * 灯光位置
         */
        readonly position: Vector3D;
        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: ComponentEvent): void;
        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: ComponentEvent): void;
        /**
         * 处理添加到场景事件
         */
        private onAddedToScene(event);
        /**
         * 处理从场景移除事件
         */
        private onRemovedFromScene(event);
    }
}
declare module feng3d {
    /**
     * 方向光源
     * @author feng 2016-12-13
     */
    class DirectionalLight extends Light {
        /**
         * 构建
         */
        constructor();
    }
}
declare module feng3d {
    /**
     * 点光源
     * @author feng 2016-12-13
     */
    class PointLight extends Light {
        /**
         * 最小半径
         */
        radius: number;
        /**
         * 可照射最大距离
         */
        fallOff: number;
        /**
         * 构建
         */
        constructor();
    }
}
declare module feng3d {
    class ControllerBase {
        /**
         * 控制对象
         */
        protected _target: Transform;
        /**
         * 控制器基类，用于动态调整3D对象的属性
         */
        constructor(target: Transform);
        /**
         * 手动应用更新到目标3D对象
         */
        update(interpolate?: boolean): void;
        target: Transform;
    }
}
declare module feng3d {
    class LookAtController extends ControllerBase {
        protected _lookAtPosition: Vector3D;
        protected _lookAtObject: Transform;
        protected _origin: Vector3D;
        protected _upAxis: Vector3D;
        private _pos;
        constructor(target?: Transform, lookAtObject?: Transform);
        upAxis: Vector3D;
        lookAtPosition: Vector3D;
        lookAtObject: Transform;
        update(interpolate?: boolean): void;
    }
}
declare module feng3d {
    /**
     * FPS模式控制器
     * @author feng 2016-12-19
     */
    class FPSController extends ControllerBase {
        /**
         * 按键记录
         */
        private keyDownDic;
        /**
         * 按键方向字典
         */
        private keyDirectionDic;
        /**
         * 加速度
         */
        private acceleration;
        /**
         * 速度
         */
        private velocity;
        /**
         * 上次鼠标位置
         */
        private preMousePoint;
        constructor(transform?: Transform);
        target: Transform;
        /**
         * 初始化
         */
        private init();
        /**
         * 手动应用更新到目标3D对象
         */
        update(interpolate?: boolean): void;
        /**
         * 处理鼠标移动事件
         */
        private onMouseMove(event);
        /**
         * 键盘按下事件
         */
        private onKeydown(event);
        /**
         * 键盘弹起事件
         */
        private onKeyup(event);
        /**
         * 停止xyz方向运动
         * @param direction     停止运动的方向
         */
        private stopDirectionVelocity(direction);
    }
}
declare module feng3d {
    /**
     * 地形几何体
     * @author feng 2016-04-28
     */
    class TerrainGeometry extends Geometry {
        private _segmentsW;
        private _segmentsH;
        private _width;
        private _height;
        private _depth;
        private _heightMap;
        private _minElevation;
        private _maxElevation;
        protected _geomDirty: boolean;
        protected _uvDirty: boolean;
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
        constructor(heightMap: ImageData, width?: number, height?: number, depth?: number, segmentsW?: number, segmentsH?: number, maxElevation?: number, minElevation?: number);
        /**
         * 创建顶点坐标
         */
        private buildGeometry();
        /**
         * 创建uv坐标
         */
        private buildUVs();
        /**
         * 获取位置在（x，z）处的高度y值
         * @param x x坐标
         * @param z z坐标
         * @return 高度
         */
        getHeightAt(x: number, z: number): number;
        /**
         * 获取像素值
         */
        private getPixel(imageData, u, v);
    }
}
declare module feng3d {
    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    class TerrainMaterial extends Material {
        diffuseTexture: Texture2D;
        splatTexture1: Texture2D;
        splatTexture2: Texture2D;
        splatTexture3: Texture2D;
        blendTexture: Texture2D;
        splatRepeats: Vector3D;
        /**
         * 构建材质
         */
        constructor();
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext): void;
    }
}
declare module feng3d {
    /**
     * 3D对象工厂
     * @author feng 2016-12-19
     */
    class Object3DFactory {
        /**
         * 创建平面
         */
        createPlane(): Object3D;
        /**
         * 创建立方体
         */
        createCube(): Object3D;
        /**
         * 创建球体
         */
        createSphere(): Object3D;
        /**
         * 创建胶囊
         */
        createCapsule(): Object3D;
        /**
         * 创建圆柱体
         */
        createCylinder(): Object3D;
        /**
         * 创建天空盒
         */
        createSkyBox(images: HTMLImageElement[]): Object3D;
    }
    /**
     * 3D对象工厂
     */
    var $object3DFactory: Object3DFactory;
}
