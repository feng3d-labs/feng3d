interface ObjectConstructor {
    /**
     * Copy the values of all of the enumerable own properties from one or more source objects to a
     * target object. Returns the target object.
     * @param target The target object to copy to.
     * @param source The source object from which to copy properties.
     */
    assign<T, U>(target: T, source: U): T & U;
    /**
     * Copy the values of all of the enumerable own properties from one or more source objects to a
     * target object. Returns the target object.
     * @param target The target object to copy to.
     * @param source1 The first source object from which to copy properties.
     * @param source2 The second source object from which to copy properties.
     */
    assign<T, U, V>(target: T, source1: U, source2: V): T & U & V;
    /**
     * Copy the values of all of the enumerable own properties from one or more source objects to a
     * target object. Returns the target object.
     * @param target The target object to copy to.
     * @param source1 The first source object from which to copy properties.
     * @param source2 The second source object from which to copy properties.
     * @param source3 The third source object from which to copy properties.
     */
    assign<T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;
    /**
     * Copy the values of all of the enumerable own properties from one or more source objects to a
     * target object. Returns the target object.
     * @param target The target object to copy to.
     * @param sources One or more source objects from which to copy properties
     */
    assign(target: object, ...sources: any[]): any;
}
interface Map<K, V> {
    clear(): void;
    delete(key: K): boolean;
    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void;
    get(key: K): V | undefined;
    has(key: K): boolean;
    set(key: K, value: V): this;
    readonly size: number;
}
interface MapConstructor {
    new (): Map<any, any>;
    new <K, V>(entries?: [K, V][]): Map<K, V>;
    readonly prototype: Map<any, any>;
}
declare var Map: MapConstructor;
interface ReadonlyMap<K, V> {
    forEach(callbackfn: (value: V, key: K, map: ReadonlyMap<K, V>) => void, thisArg?: any): void;
    get(key: K): V | undefined;
    has(key: K): boolean;
    readonly size: number;
}
interface WeakMap<K extends object, V> {
    delete(key: K): boolean;
    get(key: K): V | undefined;
    has(key: K): boolean;
    set(key: K, value: V): this;
}
interface WeakMapConstructor {
    new (): WeakMap<object, any>;
    new <K extends object, V>(entries?: [K, V][]): WeakMap<K, V>;
    readonly prototype: WeakMap<object, any>;
}
declare var WeakMap: WeakMapConstructor;
interface Set<T> {
    add(value: T): this;
    clear(): void;
    delete(value: T): boolean;
    forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any): void;
    has(value: T): boolean;
    readonly size: number;
}
interface SetConstructor {
    new (): Set<any>;
    new <T>(values?: T[]): Set<T>;
    readonly prototype: Set<any>;
}
declare var Set: SetConstructor;
interface ReadonlySet<T> {
    forEach(callbackfn: (value: T, value2: T, set: ReadonlySet<T>) => void, thisArg?: any): void;
    has(value: T): boolean;
    readonly size: number;
}
interface WeakSet<T> {
    add(value: T): this;
    delete(value: T): boolean;
    has(value: T): boolean;
}
interface WeakSetConstructor {
    new (): WeakSet<object>;
    new <T extends object>(values?: T[]): WeakSet<T>;
    readonly prototype: WeakSet<object>;
}
declare var WeakSet: WeakSetConstructor;
interface Map<K, V> {
    getKeys(): K[];
    getValues(): V[];
}
interface ArrayConstructor {
    /**
     * Creates an array from an array-like object.
     * @param arrayLike An array-like object to convert to an array.
     * @param mapfn A mapping function to call on every element of the array.
     * @param thisArg Value of 'this' used to invoke the mapfn.
     */
    from<T, U = T>(arrayLike: ArrayLike<T>, mapfn?: (v: T, k: number) => U, thisArg?: any): U[];
}
interface Array<T> {
    /**
     * 使数组元素变得唯一,除去相同值
     * @param compareFn 比较函数
     */
    unique(compareFn?: (a: T, b: T) => boolean): this;
    /**
     * 数组元素是否唯一
     * @param compareFn 比较函数
     */
    isUnique(compareFn?: (a: T, b: T) => boolean): boolean;
}
declare namespace feng3d {
    /**
     * 事件
     */
    interface Event<T> {
        /**
         * 事件的类型。类型区分大小写。
         */
        type: string;
        /**
         * 事件携带的自定义数据
         */
        data: T;
        /**
         * 表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        bubbles?: boolean;
        /**
         * 事件目标。
         */
        target?: any;
        /**
         * 当前正在使用某个事件侦听器处理 Event 对象的对象。
         */
        currentTarget?: any;
        /**
         * 是否停止处理事件监听器
         */
        isStop?: boolean;
        /**
         * 是否停止冒泡
         */
        isStopBubbles?: boolean;
    }
    interface IEventDispatcher<T> {
        once<K extends keyof T>(type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof T>(type: K, data?: T[K], bubbles?: boolean): any;
        has<K extends keyof T>(type: K): boolean;
        on<K extends keyof T>(type: K, listener: (event: Event<T[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof T>(type?: K, listener?: (event: Event<T[K]>) => any, thisObject?: any): any;
    }
    const EVENT_KEY = "__event__";
    /**
     * 事件适配器
     */
    class EventDispatcher {
        /**
         * 监听一次事件后将会被移除
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        once(type: string, listener: (event: any) => void, thisObject?: any, priority?: number): void;
        /**
         * 派发事件
         * @param event   事件对象
         */
        dispatchEvent(event: Event<any>): void;
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        dispatch(type: string, data?: any, bubbles?: boolean): void;
        /**
         * 检查 Event 对象是否为特定事件类型注册了任何侦听器.
         *
         * @param type		事件的类型。
         * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        has(type: string): boolean;
        /**
         * 添加监听
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        on(type: string, listener: (event: any) => any, thisObject?: any, priority?: number, once?: boolean): void;
        /**
         * 移除监听
         * @param dispatcher 派发器
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         */
        off(type?: string, listener?: (event: any) => any, thisObject?: any): void;
    }
}
declare namespace feng3d {
    /**
     * 代理 EventTarget, 处理js事件中this关键字问题
     * @author feng 2016-12-19
     */
    class EventProxy<T> extends EventDispatcher {
        clientX: number;
        clientY: number;
        /**
         * 是否右击
         */
        rightmouse: boolean;
        key: string;
        keyCode: number;
        wheelDelta: number;
        private listentypes;
        private target;
        constructor(target: EventTarget);
        /**
         * 监听一次事件后将会被移除
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        once<K extends keyof T>(type: K, listener: (event: T[K]) => void, thisObject?: any, priority?: number): void;
        /**
         * 添加监听
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        on<K extends keyof T>(type: K, listener: (event: T[K]) => any, thisObject?: any, priority?: number, once?: boolean): void;
        /**
         * 移除监听
         * @param dispatcher 派发器
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         */
        off<K extends keyof T>(type?: K, listener?: (event: T[K]) => any, thisObject?: any): void;
        /**
         * 键盘按下事件
         */
        private onMouseKey;
        /**
         * 清理数据
         */
        private clear();
    }
    /**
     * 键盘鼠标输入
     */
    var windowEventProxy: EventProxy<WindowEventMap>;
}
declare namespace feng3d {
    /**
     * 全局事件
     */
    var globalEvent: GlobalEventDispatcher;
    interface GlobalEventMap {
        /**
         * shader资源发生变化
         */
        shaderChanged: any;
        /**
         * 脚本发生变化
         */
        scriptChanged: any;
        /**
         * 图片资源发生变化
         */
        imageAssetsChanged: {
            url: string;
        };
    }
    interface GlobalEventDispatcher {
        once<K extends keyof GlobalEventMap>(type: K, listener: (event: Event<GlobalEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof GlobalEventMap>(type: K, data?: GlobalEventMap[K], bubbles?: boolean): any;
        has<K extends keyof GlobalEventMap>(type: K): boolean;
        on<K extends keyof GlobalEventMap>(type: K, listener: (event: Event<GlobalEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof GlobalEventMap>(type?: K, listener?: (event: Event<GlobalEventMap[K]>) => any, thisObject?: any): any;
    }
    /**
     * 全局事件
     */
    class GlobalEventDispatcher extends EventDispatcher {
    }
}
declare namespace feng3d {
    var loadjs: {
        load: (params: {
            paths: string | string[] | {
                url: string;
                type: string;
            } | {
                url: string;
                type: string;
            }[];
            bundleId?: string;
            success?: () => void;
            error?: (pathsNotFound?: string[]) => void;
            async?: boolean;
            numRetries?: number;
            before?: (path: {
                url: string;
                type: string;
            }, e: any) => boolean;
            onitemload?: (url: string, content: string) => void;
        }) => void;
        ready: (params: {
            depends: string | string[];
            success?: () => void;
            error?: (pathsNotFound?: string[]) => void;
        }) => void;
    };
}
declare namespace feng3d {
    /**
     * 测试代码运行时间
     * @param fn 被测试的方法
     * @param labal 标签
     */
    function time(fn: Function, labal?: string): void;
    /**
     * 断言，测试不通过时报错
     * @param test 测试项
     * @param message 测试失败时提示信息
     * @param optionalParams
     */
    function assert(test?: boolean, message?: string, ...optionalParams: any[]): void;
    /**
     * 输出错误
     * @param message 错误信息
     * @param optionalParams
     */
    function error(message?: any, ...optionalParams: any[]): void;
    /**
     * 记录日志信息
     * @param message 日志信息
     * @param optionalParams
     */
    function log(message?: any, ...optionalParams: any[]): void;
    /**
     * 警告
     * @param message 警告信息
     * @param optionalParams
     */
    function warn(message?: any, ...optionalParams: any[]): void;
}
declare namespace feng3d {
    /**
     * 观察装饰器，观察被装饰属性的变化
     *
     * 使用@watch后会自动生成一个带"_"的属性，例如 属性"a"会生成"_a"
     *
     * 通过使用 eval 函数 生成出 与自己手动写的set get 一样的函数，性能已经接近 手动写的get set函数。
     *
     * 性能：
     * chrome：
     * 测试 get ：
Test.ts:100 watch与getset最大耗时比 1.2222222222222223
Test.ts:101 watch与getset最小耗时比 0.7674418604651163
Test.ts:102 watch与getset平均耗时比 0.9558823529411765
Test.ts:103 watch平均耗时比 13
Test.ts:104 getset平均耗时比 13.6
Test.ts:98 测试 set ：
Test.ts:100 watch与getset最大耗时比 4.5
Test.ts:101 watch与getset最小耗时比 2.409090909090909
Test.ts:102 watch与getset平均耗时比 3.037037037037037
Test.ts:103 watch平均耗时比 57.4
Test.ts:104 getset平均耗时比 18.9

     *
     * nodejs:
     * 测试 get ：
watch与getset最大耗时比 1.3333333333333333
watch与getset最小耗时比 0.55
watch与getset平均耗时比 1.0075757575757576
watch平均耗时比 13.3
getset平均耗时比 13.2
测试 set ：
watch与getset最大耗时比 4.9
watch与getset最小耗时比 3
watch与getset平均耗时比 4.143497757847534
watch平均耗时比 92.4
getset平均耗时比 22.3
     *
     *
     * firefox:
     * 测试 get ：  Test.js:122:5
watch与getset最大耗时比 4.142857142857143  Test.js:124:5
watch与getset最小耗时比 0.4090909090909091  Test.js:125:5
watch与getset平均耗时比 1.0725806451612903  Test.js:126:5
watch平均耗时比 13.3  Test.js:127:5
getset平均耗时比 12.4  Test.js:128:5
测试 set ：  Test.js:122:5
watch与getset最大耗时比 1.5333333333333334  Test.js:124:5
watch与getset最小耗时比 0.6842105263157895  Test.js:125:5
watch与getset平均耗时比 0.9595375722543352  Test.js:126:5
watch平均耗时比 16.6  Test.js:127:5
getset平均耗时比 17.3
     *
     * 结果分析：
     * chrome、nodejs、firefox运行结果出现差异,firefox运行结果最完美
     *
     * 使用watch后的get测试的消耗与手动写get消耗一致
     * chrome与nodejs上set消耗是手动写set的消耗(3-4)倍
     *
     * 注：不适用eval的情况下，chrome表现最好的，与此次测试结果差不多；在nodejs与firfox上将会出现比使用eval情况下消耗的（40-400）倍，其中详细原因不明，求高人解释！
     *
     * @param onChange 属性变化回调
     * @see https://gitee.com/feng3d/feng3d/issues/IGIK0
     */
    function watch(onChange: string): (target: any, propertyKey: string) => void;
    var watcher: Watcher;
    class Watcher {
        /**
         * 注意：使用watch后获取该属性值的性能将会是原来的1/60，禁止在feng3d引擎内部使用watch
         * @param host
         * @param property
         * @param handler
         * @param thisObject
         */
        watch<T extends Object>(host: T, property: keyof T, handler: (host: any, property: string, oldvalue: any) => void, thisObject?: any): void;
        unwatch<T extends Object>(host: T, property: keyof T, handler?: (host: any, property: string, oldvalue: any) => void, thisObject?: any): void;
        watchchain(host: any, property: string, handler?: (host: any, property: string, oldvalue: any) => void, thisObject?: any): void;
        unwatchchain(host: any, property: string, handler?: (host: any, property: string, oldvalue: any) => void, thisObject?: any): void;
    }
}
declare namespace feng3d {
    var serialization: Serialization;
    /**
     * 序列化装饰器，被装饰属性将被序列化
     * @param {*} target                序列化原型
     * @param {string} propertyKey      序列化属性
     */
    function serialize(target: any, propertyKey: string): void;
    class Serialization {
        /**
         * 序列化对象
         * @param target 被序列化的数据
         * @returns 序列化后可以转换为Json的对象
         */
        serialize(target: any): any;
        /**
         * 比较两个对象的不同，提取出不同的数据
         * @param target 用于检测不同的数据
         * @param defaultInstance   模板（默认）数据
         * @param different 比较得出的不同（简单结构）数据
         * @returns 比较得出的不同（简单结构）数据
         */
        different(target: Object, defaultInstance: Object, different?: Object): Object;
        /**
         * 反序列化
         * @param object 换为Json的对象
         * @returns 反序列化后的数据
         */
        deserialize(object: any): any;
        setValue(target: Object, object: Object): void;
        setPropertyValue(target: Object, object: Object, property: string): void;
        clone<T>(target: T): T;
    }
}
declare namespace feng3d {
    /**
     * 标记objectview对象界面类
     */
    function OVComponent(component?: string): (constructor: Function) => void;
    /**
     * 标记objectview块界面类
     */
    function OBVComponent(component?: string): (constructor: Function) => void;
    /**
     * 标记objectview属性界面类
     */
    function OAVComponent(component?: string): (constructor: Function) => void;
    /**
     * objectview类装饰器
     */
    function ov<K extends keyof OVComponentParam>(param: {
        component?: K;
        componentParam?: OVComponentParam[K];
    }): (constructor: Function) => void;
    /**
     * objectview属性装饰器
     * @param param 参数
     */
    function oav<K extends keyof OAVComponentParam>(param?: {
        block?: string;
        component?: K;
        componentParam?: OAVComponentParam[K];
    }): (target: any, propertyKey: string) => void;
    /**
     * 对象界面
     */
    var objectview: ObjectView;
    /**
     * 对象界面
     * @author feng 2016-3-10
     */
    class ObjectView {
        /**
         * 默认基础类型对象界面类定义
         */
        defaultBaseObjectViewClass: string;
        /**
         * 默认对象界面类定义
         */
        defaultObjectViewClass: string;
        /**
         * 默认对象属性界面类定义
         */
        defaultObjectAttributeViewClass: string;
        /**
         * 属性块默认界面
         */
        defaultObjectAttributeBlockView: string;
        /**
         * 指定属性类型界面类定义字典（key:属性类名称,value:属性界面类定义）
         */
        defaultTypeAttributeView: {};
        OAVComponent: {};
        OBVComponent: {};
        OVComponent: {};
        setDefaultTypeAttributeView(type: string, component: AttributeTypeDefinition): void;
        /**
         * 获取对象界面
         *
         * @static
         * @param {Object} object				用于生成界面的对象
         * @param autocreate					当对象没有注册属性时是否自动创建属性信息
         * @param excludeAttrs					排除属性列表
         * @returns 							对象界面
         *
         * @memberOf ObjectView
         */
        getObjectView(object: Object, autocreate?: boolean, excludeAttrs?: string[]): IObjectView;
        /**
         * 获取属性界面
         *
         * @static
         * @param {AttributeViewInfo} attributeViewInfo			属性界面信息
         * @returns {egret.DisplayObject}						属性界面
         *
         * @memberOf ObjectView
         */
        getAttributeView(attributeViewInfo: AttributeViewInfo): IObjectAttributeView;
        /**
         * 获取块界面
         *
         * @static
         * @param {BlockViewInfo} blockViewInfo			块界面信息
         * @returns {egret.DisplayObject}				块界面
         *
         * @memberOf ObjectView
         */
        getBlockView(blockViewInfo: BlockViewInfo): IObjectBlockView;
        addOAV<K extends keyof OAVComponentParam>(target: any, propertyKey: string, param?: {
            block?: string;
            component?: K;
            componentParam?: OAVComponentParam[K];
        }): void;
        /**
         * 获取对象信息
         * @param object				对象
         * @param autocreate			当对象没有注册属性时是否自动创建属性信息
         * @param excludeAttrs			排除属性列表
         * @return
         */
        getObjectInfo(object: Object, autocreate?: boolean, excludeAttrs?: string[]): ObjectViewInfo;
    }
    interface OAVComponentParam {
        属性组件名称: "属性组件参数";
        [component: string]: any;
    }
    interface OBVComponentParam {
        块组件名称: "块组件参数";
        [component: string]: any;
    }
    interface OVComponentParam {
        类组件名称: "类组件参数";
        [component: string]: any;
    }
    /**
     * 定义属性
     * @author feng 2016-3-23
     */
    interface AttributeDefinition {
        /**
         * 属性名称
         */
        name: string;
        /**
         * 所属块名称
         */
        block?: string;
        /**
         * 组件
         */
        component?: string;
        /**
         * 组件参数
         */
        componentParam?: Object;
    }
    /**
     * 定义特定属性类型默认界面
     * @author feng 2016-3-25
     */
    interface AttributeTypeDefinition {
        /**
         * 界面类
         */
        component: string;
        /**
         * 组件参数
         */
        componentParam?: Object;
    }
    /**
     * 块定义
     * @author feng 2016-3-23
     */
    interface BlockDefinition {
        /**
         * 块名称
         */
        name: string;
        /**
         * 组件
         */
        component?: string;
        /**
         * 组件参数
         */
        componentParam?: Object;
    }
    /**
     * ObjectView类配置
     * @author feng 2016-3-23
     */
    interface ClassDefinition {
        /**
         * 组件
         */
        component?: string;
        /**
         * 组件参数
         */
        componentParam?: Object;
        /**
         * 自定义对象属性定义字典（key:属性名,value:属性定义）
         */
        attributeDefinitionVec: AttributeDefinition[];
        /**
         * 自定义对象属性块界面类定义字典（key:属性块名称,value:自定义对象属性块界面类定义）
         */
        blockDefinitionVec: BlockDefinition[];
    }
    /**
     * 对象属性界面接口
     * @author feng 2016-3-10
     */
    interface IObjectAttributeView {
        /**
         * 界面所属对象（空间）
         */
        space: Object;
        /**
         * 更新界面
         */
        updateView(): void;
        /**
         * 属性名称
         */
        attributeName: string;
        /**
         * 属性值
         */
        attributeValue: Object;
        /**
         * 对象属性界面
         */
        objectView: IObjectView;
        /**
         * 对象属性块界面
         */
        objectBlockView: IObjectBlockView;
    }
    /**
     * 对象属性块界面接口
     * @author feng 2016-3-22
     */
    interface IObjectBlockView {
        /**
         * 界面所属对象（空间）
         */
        space: Object;
        /**
         * 块名称
         */
        blockName: string;
        /**
         * 对象属性界面
         */
        objectView: IObjectView;
        /**
         * 更新界面
         */
        updateView(): void;
        /**
         * 获取属性界面
         * @param attributeName		属性名称
         */
        getAttributeView(attributeName: string): IObjectAttributeView;
    }
    /**
     * 对象界面接口
     * @author feng 2016-3-11
     */
    interface IObjectView {
        /**
         * 界面所属对象（空间）
         */
        space: Object;
        /**
         * 更新界面
         */
        updateView(): void;
        /**
         * 获取块界面
         * @param blockName		块名称
         */
        getblockView(blockName: string): IObjectBlockView;
        /**
         * 获取属性界面
         * @param attributeName		属性名称
         */
        getAttributeView(attributeName: string): IObjectAttributeView;
    }
    /**
     * 对象属性信息
     * @author feng 2016-3-10
     */
    interface AttributeViewInfo {
        /**
         * 属性名称
         */
        name: string;
        /**
         * 属性类型
         */
        type: string;
        /**
         * 是否可写
         */
        writable: boolean;
        /**
         * 所属块名称
         */
        block?: string;
        /**
         * 组件
         */
        component?: string;
        /**
         * 组件参数
         */
        componentParam?: Object;
        /**
         * 属性所属对象
         */
        owner: Object;
    }
    /**
     * 对象属性块
     * @author feng 2016-3-22
     */
    interface BlockViewInfo {
        /**
         * 块名称
         */
        name: string;
        /**
         * 组件
         */
        component?: string;
        /**
         * 组件参数
         */
        componentParam?: Object;
        /**
         * 属性信息列表
         */
        itemList: AttributeViewInfo[];
        /**
         * 属性拥有者
         */
        owner: Object;
    }
    /**
     * 对象信息
     * @author feng 2016-3-29
     */
    interface ObjectViewInfo {
        /**
         * 组件
         */
        component?: string;
        /**
         * 组件参数
         */
        componentParam?: Object;
        /**
         * 对象属性列表
         */
        objectAttributeInfos: AttributeViewInfo[];
        /**
         * 对象块信息列表
         */
        objectBlockInfos: BlockViewInfo[];
        /**
         * 保存类的一个实例，为了能够获取动态属性信息
         */
        owner: Object;
    }
}
declare namespace feng3d {
    /**
     * 心跳计时器
     */
    var ticker: Ticker;
    /**
     * 心跳计时器
     */
    class Ticker {
        /**
         * 帧率
         */
        frameRate: number;
        /**
         * 注册帧函数
         * @param func  执行方法
         * @param thisObject    方法this指针
         * @param priority      执行优先级
         */
        onframe(func: (interval: number) => void, thisObject?: Object, priority?: number): this;
        /**
         * 注册帧函数（只执行一次）
         * @param func  执行方法
         * @param thisObject    方法this指针
         * @param priority      执行优先级
         */
        onceframe(func: (interval: number) => void, thisObject?: Object, priority?: number): this;
        /**
         * 注销帧函数（只执行一次）
         * @param func  执行方法
         * @param thisObject    方法this指针
         * @param priority      执行优先级
         */
        offframe(func: (interval: number) => void, thisObject?: Object): this;
        /**
         * 注册周期函数
         * @param interval  执行周期，以ms为单位
         * @param func  执行方法
         * @param thisObject    方法this指针
         * @param priority      执行优先级
         */
        on(interval: Lazy<number>, func: (interval: number) => void, thisObject?: Object, priority?: number): this;
        /**
         * 注册周期函数（只执行一次）
         * @param interval  执行周期，以ms为单位
         * @param func  执行方法
         * @param thisObject    方法this指针
         * @param priority      执行优先级
         */
        once(interval: Lazy<number>, func: (interval: number) => void, thisObject?: Object, priority?: number): this;
        /**
         * 注销周期函数
         * @param interval  执行周期，以ms为单位
         * @param func  执行方法
         * @param thisObject    方法this指针
         */
        off(interval: Lazy<number>, func: (interval: number) => void, thisObject?: Object): this;
        /**
         * 重复指定次数 执行函数
         * @param interval  执行周期，以ms为单位
         * @param 	repeatCount     执行次数
         * @param func  执行方法
         * @param thisObject    方法this指针
         * @param priority      执行优先级
         */
        repeat(interval: Lazy<number>, repeatCount: number, func: (interval: number) => void, thisObject?: Object, priority?: number): Timer;
    }
    class Timer {
        private ticker;
        private interval;
        private priority;
        private func;
        private thisObject;
        /**
         * 计时器从 0 开始后触发的总次数。
         */
        currentCount: number;
        /**
         * 计时器事件间的延迟（以毫秒为单位）。
         */
        delay: number;
        /**
         * 设置的计时器运行总次数。
         */
        repeatCount: number;
        constructor(ticker: Ticker, interval: Lazy<number>, repeatCount: number, func: (interval: number) => void, thisObject?: Object, priority?: number);
        /**
         * 如果计时器尚未运行，则启动计时器。
         */
        start(): this;
        /**
         * 停止计时器。
         */
        stop(): this;
        /**
         * 如果计时器正在运行，则停止计时器，并将 currentCount 属性设回为 0，这类似于秒表的重置按钮。
         */
        reset(): this;
        private runfunc();
    }
}
/**
 * The unescape() function computes a new string in which hexadecimal escape sequences are replaced with the character that it represents. The escape sequences might be introduced by a function like escape. Usually, decodeURI or decodeURIComponent are preferred over unescape.
 * @param str A string to be decoded.
 * @return A new string in which certain characters have been unescaped.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/unescape
 */
declare function unescape(str: string): string;
/**
 * The escape() function computes a new string in which certain characters have been replaced by a hexadecimal escape sequence.
 * @param str A string to be encoded.
 * @return A new string in which certain characters have been escaped.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/escape
 */
declare function escape(str: string): string;
declare namespace feng3d {
    /**
     * 数据类型转换
     * TypeArray、ArrayBuffer、Blob、File、DataURL、canvas的相互转换
     * @see http://blog.csdn.net/yinwhm12/article/details/73482904
     */
    var dataTransform: DataTransform;
    /**
     * 数据类型转换
     * TypeArray、ArrayBuffer、Blob、File、DataURL、canvas的相互转换
     * @see http://blog.csdn.net/yinwhm12/article/details/73482904
     */
    class DataTransform {
        /**
         * Blob to ArrayBuffer
         */
        blobToArrayBuffer(blob: Blob, callback: (arrayBuffer: ArrayBuffer) => void): void;
        /**
         * ArrayBuffer to Blob
         */
        arrayBufferToBlob(arrayBuffer: ArrayBuffer, callback: (blob: Blob) => void): void;
        /**
         * ArrayBuffer to Uint8
         * Uint8数组可以直观的看到ArrayBuffer中每个字节（1字节 == 8位）的值。一般我们要将ArrayBuffer转成Uint类型数组后才能对其中的字节进行存取操作。
         */
        arrayBufferToUint8(arrayBuffer: ArrayBuffer, callback: (uint8Array: Uint8Array) => void): void;
        /**
         * Uint8 to ArrayBuffer
         * 我们Uint8数组可以直观的看到ArrayBuffer中每个字节（1字节 == 8位）的值。一般我们要将ArrayBuffer转成Uint类型数组后才能对其中的字节进行存取操作。
         */
        uint8ToArrayBuffer(uint8Array: Uint8Array, callback: (arrayBuffer: ArrayBuffer) => void): void;
        /**
         * Array to ArrayBuffer
         * @param array 例如：[0x15, 0xFF, 0x01, 0x00, 0x34, 0xAB, 0x11];
         */
        arrayToArrayBuffer(array: number[], callback: (arrayBuffer: ArrayBuffer) => void): void;
        /**
         * TypeArray to Array
         */
        uint8ArrayToArray(u8a: Uint8Array): number[];
        /**
         * canvas转换为dataURL
         */
        canvasToDataURL(canvas: HTMLCanvasElement, type: "png" | "jpeg", callback: (dataurl: string) => void): void;
        /**
         * File、Blob对象转换为dataURL
         * File对象也是一个Blob对象，二者的处理相同。
         */
        blobToDataURL(blob: Blob, callback: (dataurl: string) => void): void;
        /**
         * dataURL转换为Blob对象
         */
        dataURLtoBlob(dataurl: string, callback: (blob: Blob) => void): void;
        /**
         * dataURL图片数据转换为HTMLImageElement
         * dataURL图片数据绘制到canvas
         * 先构造Image对象，src为dataURL，图片onload之后绘制到canvas
         */
        dataURLDrawCanvas(dataurl: string, canvas: HTMLCanvasElement, callback: (img: HTMLImageElement) => void): void;
        arrayBufferToDataURL(arrayBuffer: ArrayBuffer, callback: (dataurl: string) => void): void;
        dataURLToImage(dataurl: string, callback: (img: HTMLImageElement) => void): void;
        arrayBufferToImage(arrayBuffer: ArrayBuffer, callback: (img: HTMLImageElement) => void): void;
        blobToText(blob: Blob, callback: (content: string) => void): void;
        stringToArrayBuffer(str: string, callback: (arrayBuffer: ArrayBuffer) => void): void;
        arrayBufferToString(arrayBuffer: ArrayBuffer, callback: (content: string) => void): void;
        stringToUint8Array(str: string, callback: (uint8Array: Uint8Array) => void): void;
        uint8ArrayToString(arr: Uint8Array, callback: (str: string) => void): void;
    }
}
declare namespace feng3d {
    /**
     * 类工具
     * @author feng 2017-02-15
     */
    var classUtils: ClassUtils;
    /**
     * 类工具
     * @author feng 2017-02-15
     */
    class ClassUtils {
        /**
         * 返回对象的完全限定类名。
         * @param value 需要完全限定类名称的对象，可以将任何 JavaScript 值传递给此方法，包括所有可用的 JavaScript 类型、对象实例、原始类型
         * （如number)和类对象
         * @returns 包含完全限定类名称的字符串。
         */
        getQualifiedClassName(value: any): string;
        /**
         * 返回 name 参数指定的类的类对象引用。
         * @param name 类的名称。
         */
        getDefinitionByName(name: string, readCache?: boolean): any;
        /**
         * 新增反射对象所在的命名空间，使得getQualifiedClassName能够得到正确的结果
         */
        addClassNameSpace(namespace: string): void;
    }
}
declare namespace feng3d {
    /**
     * 图片相关工具
     */
    var imageUtil: ImageUtil;
    /**
     * 图片相关工具
     */
    class ImageUtil {
        /**
         * 加载图片
         * @param url 图片路径
         * @param callback 加载完成回调
         */
        loadImage(url: string, callback: (err: Error, image: HTMLImageElement) => void): void;
        /**
         * 获取图片数据
         * @param image 加载完成的图片元素
         */
        getImageData(image: HTMLImageElement): ImageData;
        /**
         * 从url获取图片数据
         * @param url 图片路径
         * @param callback 获取图片数据完成回调
         */
        getImageDataFromUrl(url: string, callback: (imageData: ImageData) => void): void;
        /**
         * 创建ImageData
         * @param width 数据宽度
         * @param height 数据高度
         * @param fillcolor 填充颜色
         */
        createImageData(width?: number, height?: number, fillcolor?: number): ImageData;
    }
}
/**
 * @author mrdoob / http://mrdoob.com/
 */
interface Performance {
    memory: any;
}
interface Element {
    style: {
        display;
        cssText;
        cursor;
        position;
        top;
        width;
        height;
        textAlign;
        opacity;
        left;
        textDecoration;
    };
}
declare namespace feng3d {
    class Stats {
        static instance: Stats;
        static init(parent?: HTMLElement): void;
        REVISION: number;
        dom: HTMLDivElement;
        domElement: HTMLDivElement;
        addPanel: (panel: StatsPanel) => StatsPanel;
        showPanel: (id: number) => void;
        setMode: (id: number) => void;
        begin: () => void;
        end: () => number;
        update: () => void;
        constructor();
    }
    class StatsPanel {
        dom: HTMLCanvasElement;
        update: (value: number, maxValue: number) => void;
        constructor(name: string, fg: string, bg: string);
    }
}
declare namespace feng3d {
    var FMath: {
        DEG2RAD: number;
        RAD2DEG: number;
        PRECISION: number;
        generateUUID: () => string;
        clamp: (value: any, min: any, max: any) => number;
        euclideanModulo: (n: any, m: any) => number;
        mapLinear: (x: any, a1: any, a2: any, b1: any, b2: any) => any;
        lerp: (x: any, y: any, t: any) => number;
        smoothstep: (x: any, min: any, max: any) => number;
        smootherstep: (x: any, min: any, max: any) => number;
        randInt: (low: any, high: any) => any;
        randFloat: (low: any, high: any) => any;
        randFloatSpread: (range: any) => number;
        degToRad: (degrees: any) => number;
        radToDeg: (radians: any) => number;
        isPowerOfTwo: (value: any) => boolean;
        nearestPowerOfTwo: (value: any) => number;
        nextPowerOfTwo: (value: any) => any;
        toRound: (source: number, target: number, precision?: number) => number;
        equals(a: number, b: number, precision?: number): boolean;
    };
}
declare namespace feng3d {
    /**
     * Point 对象表示二维坐标系统中的某个位置，其中 x 表示水平轴，y 表示垂直轴。
     */
    class Vector2 {
        /**
         * 原点
         */
        static ZERO: Vector2;
        /**
         * 将一对极坐标转换为笛卡尔点坐标。
         * @param len 极坐标对的长度。
         * @param angle 极坐标对的角度（以弧度表示）。
         */
        static polar(len: number, angle: number): Vector2;
        /**
         * 创建一个 egret.Point 对象.若不传入任何参数，将会创建一个位于（0，0）位置的点。
         * @param x 该对象的x属性值，默认为0
         * @param y 该对象的y属性值，默认为0
         */
        constructor(x?: number, y?: number);
        /**
         * 该点的水平坐标。
         * @default 0
         */
        x: number;
        /**
         * 该点的垂直坐标。
         * @default 0
         */
        y: number;
        /**
         * 从 (0,0) 到此点的线段长度。
         */
        readonly length: number;
        /**
         * 将 Point 的成员设置为指定值
         * @param x 该对象的x属性值
         * @param y 该对象的y属性值
         */
        init(x: number, y: number): Vector2;
        /**
         * 克隆点对象
         */
        clone(): Vector2;
        /**
         * 确定两个点是否相同。如果两个点具有相同的 x 和 y 值，则它们是相同的点。
         * @param toCompare 要比较的点。
         * @returns 如果该对象与此 Point 对象相同，则为 true 值，如果不相同，则为 false。
         */
        equals(toCompare: Vector2): boolean;
        /**
         * 返回 pt1 和 pt2 之间的距离。
         * @param p1 第一个点
         * @param p2 第二个点
         * @returns 第一个点和第二个点之间的距离。
         */
        static distance(p1: Vector2, p2: Vector2): number;
        /**
         * 将源 Point 对象中的所有点数据复制到调用方 Point 对象中。
         * @param sourcePoint 要从中复制数据的 Point 对象。
         */
        copy(sourcePoint: Vector2): this;
        /**
         * 将另一个点的坐标添加到此点的坐标以创建一个新点。
         * @param v 要添加的点。
         * @returns 新点。
         */
        addTo(v: Vector2, vout?: Vector2): Vector2;
        /**
         * 将 (0,0) 和当前点之间的线段缩放为设定的长度。
         * @param thickness 缩放值。例如，如果当前点为 (0,5) 并且您将它规范化为 1，则返回的点位于 (0,1) 处。
         */
        normalize(thickness?: number): this;
        /**
         * 负向量
         */
        negate(): this;
        /**
         * 按标量（大小）缩放当前的 Vector3 对象。
         */
        scale(s: number): Vector2;
        /**
         * 按指定量偏移 Point 对象。dx 的值将添加到 x 的原始值中以创建新的 x 值。dy 的值将添加到 y 的原始值中以创建新的 y 值。
         * @param dx 水平坐标 x 的偏移量。
         * @param dy 水平坐标 y 的偏移量。
         */
        offset(dx: number, dy: number): Vector2;
        /**
         * 从此点的坐标中减去另一个点的坐标以创建一个新点。
         * @param v 要减去的点。
         * @returns 新点。
         */
        sub(v: Vector2): this;
        /**
         * 从此点的坐标中减去另一个点的坐标以创建一个新点。
         * @param v 要减去的点。
         * @returns 新点。
         */
        subTo(v: Vector2, vout?: Vector2): Vector2;
        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        lerp(p: Vector2, alpha: Vector2): Vector2;
        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回新向量
         */
        lerpTo(v: Vector2, alpha: Vector2, vout?: Vector2): Vector2;
        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        lerpNumber(v: Vector2, alpha: number): this;
        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        lerpNumberTo(v: Vector2, alpha: number, vout?: Vector2): Vector2;
        /**
         * 返回包含 x 和 y 坐标的值的字符串。该字符串的格式为 "(x=x, y=y)"，因此为点 23,17 调用 toString() 方法将返回 "(x=23, y=17)"。
         * @returns 坐标的字符串表示形式。
         */
        toString(): string;
        /**
         * 返回包含 x 和 y 坐标值的数组
         */
        toArray(): number[];
    }
}
declare namespace feng3d {
    interface Vector3Raw {
        __class__?: "feng3d.Vector3";
        x?: number;
        y?: number;
        z?: number;
        w?: number;
    }
    /**
     * Vector3 类使用笛卡尔坐标 x、y 和 z 表示三维空间中的点或位置
     * @author feng 2016-3-21
     */
    class Vector3 {
        /**
        * 定义为 Vector3 对象的 x 轴，坐标为 (1,0,0)。
        */
        static X_AXIS: Vector3;
        /**
        * 定义为 Vector3 对象的 y 轴，坐标为 (0,1,0)
        */
        static Y_AXIS: Vector3;
        /**
        * 定义为 Vector3 对象的 z 轴，坐标为 (0,0,1)
        */
        static Z_AXIS: Vector3;
        /**
         * 原点
         */
        static ZERO: Vector3;
        /**
         * 从数组中初始化向量
         * @param array 数组
         * @param offset 偏移
         * @return 返回新向量
         */
        static fromArray(array: ArrayLike<number>, offset?: number): Vector3;
        /**
         * 随机三维向量
         */
        static random(): Vector3;
        /**
         * 从Vector2初始化
         */
        static fromVector2(vector: Vector2, z?: number): Vector3;
        /**
        * Vector3 对象中的第一个元素，例如，三维空间中某个点的 x 坐标。默认值为 0
        */
        x: number;
        /**
         * Vector3 对象中的第二个元素，例如，三维空间中某个点的 y 坐标。默认值为 0
         */
        y: number;
        /**
         * Vector3 对象中的第三个元素，例如，三维空间中某个点的 z 坐标。默认值为 0
         */
        z: number;
        /**
        * 当前 Vector3 对象的长度（大小），即从原点 (0,0,0) 到该对象的 x、y 和 z 坐标的距离。w 属性将被忽略。单位矢量具有的长度或大小为一。
        */
        readonly length: number;
        /**
        * 当前 Vector3 对象长度的平方，它是使用 x、y 和 z 属性计算出来的。w 属性将被忽略。尽可能使用 lengthSquared() 方法，而不要使用 Vector3.length() 方法的 Math.sqrt() 方法调用，后者速度较慢。
        */
        readonly lengthSquared: number;
        /**
         * 创建 Vector3 对象的实例。如果未指定构造函数的参数，则将使用元素 (0,0,0,0) 创建 Vector3 对象。
         * @param x 第一个元素，例如 x 坐标。
         * @param y 第二个元素，例如 y 坐标。
         * @param z 第三个元素，例如 z 坐标。
         */
        constructor(x?: number, y?: number, z?: number);
        /**
         * 将 Vector3 的成员设置为指定值
         */
        init(x: number, y: number, z: number): this;
        /**
         * 从Vector2初始化
         */
        fromVector2(vector: Vector2, z?: number): this;
        fromArray(array: ArrayLike<number>, offset?: number): this;
        /**
         * 转换为Vector2
         */
        toVector2(vector?: Vector2): Vector2;
        /**
         * 转换为Vector4
         */
        toVector4(vector4?: Vector4): Vector4;
        /**
         * 加上指定向量得到新向量
         * @param v 加向量
         * @return 返回新向量
         */
        add(a: Vector3): this;
        /**
         * 加上指定向量得到新向量
         * @param v 加向量
         * @return 返回新向量
         */
        addTo(a: Vector3, vout?: Vector3): Vector3;
        /**
         * 乘以向量
         * @param a 向量
         */
        multiply(a: Vector3): this;
        /**
         * 乘以向量
         * @param a 向量
         * @param vout 输出向量
         */
        multiplyTo(a: Vector3, vout?: Vector3): Vector3;
        /**
         * 除以向量
         * @param a 向量
         */
        divide(a: Vector3): this;
        /**
         * 除以向量
         * @param a 向量
         * @param vout 输出向量
         */
        divideTo(a: Vector3, vout?: Vector3): Vector3;
        /**
         * 叉乘向量
         * @param a 向量
         */
        cross(a: Vector3): Vector3;
        /**
         * 叉乘向量
         * @param a 向量
         * @param vout 输出向量
         */
        crossTo(a: Vector3, vout?: Vector3): Vector3;
        /**
         * 如果当前 Vector3 对象和作为参数指定的 Vector3 对象均为单位顶点，此方法将返回这两个顶点之间所成角的余弦值。
         */
        dot(a: Vector3): number;
        /**
         * 加上标量
         * @param n 标量
         */
        addNumber(n: number): this;
        /**
         * 增加标量
         * @param n 标量
         */
        addNumberTo(n: number, vout?: Vector3): Vector3;
        /**
         * 减去标量
         * @param n 标量
         */
        subNumber(n: number): this;
        /**
         * 减去标量
         * @param n 标量
         */
        subNumberTo(n: number, vout?: Vector3): Vector3;
        /**
         * 乘以标量
         * @param n 标量
         */
        multiplyNumber(n: number): this;
        /**
         * 乘以标量
         * @param n 标量
         * @param vout 输出向量
         */
        multiplyNumberTo(n: number, vout?: Vector3): Vector3;
        /**
         * 除以标量
         * @param n 标量
         */
        divideNumber(n: number): this;
        /**
         * 除以标量
         * @param n 标量
         * @param vout 输出向量
         */
        divideNumberTo(n: number, vout?: Vector3): Vector3;
        /**
         * 返回一个新 Vector3 对象，它是与当前 Vector3 对象完全相同的副本。
         * @return 一个新 Vector3 对象，它是当前 Vector3 对象的副本。
         */
        clone(): Vector3;
        /**
         * 将源 Vector3 对象中的所有矢量数据复制到调用方 Vector3 对象中。
         * @return 要从中复制数据的 Vector3 对象。
         */
        copy(v: Vector3): this;
        /**
         * 通过将当前 Vector3 对象的 x、y 和 z 元素与指定的 Vector3 对象的 x、y 和 z 元素进行比较，确定这两个对象是否相等。
         */
        equals(object: Vector3, precision?: number): boolean;
        /**
         * 将当前 Vector3 对象设置为其逆对象。
         */
        negate(): this;
        /**
         * 通过将最前面的三个元素（x、y、z）除以矢量的长度可将 Vector3 对象转换为单位矢量。
         */
        normalize(thickness?: number): this;
        /**
         * 按标量（大小）缩放当前的 Vector3 对象。
         */
        scale(s: number): this;
        /**
         * 按标量（大小）缩放当前的 Vector3 对象。
         */
        scaleTo(s: number, vout?: Vector3): Vector3;
        /**
         * 减去向量
         * @param a 减去的向量
         * @return 返回新向量
         */
        sub(a: Vector3): this;
        /**
         * 减去向量
         * @param a 减去的向量
         * @return 返回新向量
         */
        subTo(a: Vector3, vout?: Vector3): Vector3;
        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        lerp(v: Vector3, alpha: Vector3): this;
        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        lerpTo(v: Vector3, alpha: Vector3, vout?: Vector3): Vector3;
        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        lerpNumber(v: Vector3, alpha: number): this;
        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        lerpNumberTo(v: Vector3, alpha: number, vout?: Vector3): Vector3;
        /**
         * 小于指定点
         * @param p 点
         */
        less(p: Vector3): boolean;
        /**
         * 小于等于指定点
         * @param p 点
         */
        lessequal(p: Vector3): boolean;
        /**
         * 大于指定点
         * @param p 点
         */
        greater(p: Vector3): boolean;
        /**
         * 大于等于指定点
         * @param p 点
         */
        greaterequal(p: Vector3): boolean;
        /**
         * 加紧？
         * @param min 最小值
         * @param max 最大值
         */
        clamp(min: Vector3, max: Vector3): this;
        /**
         * 加紧？
         * @param min 最小值
         * @param max 最大值
         */
        clampTo(min: Vector3, max: Vector3, vout?: Vector3): Vector3;
        /**
         * 取最小元素
         * @param v 向量
         */
        min(v: Vector3): this;
        /**
         * 取最大元素
         * @param v 向量
         */
        max(v: Vector3): this;
        /**
         * 应用矩阵
         * @param mat 矩阵
         */
        applyMatrix4x4(mat: Matrix4x4): this;
        applyMatrix41(m: Matrix4x4): this;
        /**
         * 应用四元素
         * @param q 四元素
         */
        applyQuaternion(q: Quaternion): this;
        /**
         * 与点之间的距离平方
         * @param v 点
         */
        distanceSquared(v: Vector3): number;
        /**
         * 与点之间的距离平方
         * @param v 点
         */
        distance(v: Vector3): number;
        /**
         * 向下取整
         */
        floor(): this;
        /**
         * 向上取整
         */
        ceil(): this;
        /**
         * 四舍五入
         */
        round(): this;
        /**
         * 向0取整
         */
        roundToZero(): this;
        /**
         * 与指定向量是否平行
         * @param v 向量
         */
        isParallel(v: Vector3, precision?: number): boolean;
        /**
         * 返回当前 Vector3 对象的字符串表示形式。
         */
        toString(): string;
        /**
         * 转换为数组
         * @param array 数组
         * @param offset 偏移
         * @return 返回数组
         */
        toArray(array?: number[], offset?: number): number[];
    }
}
declare namespace feng3d {
    /**
     * 四维向量
     */
    class Vector4 {
        static fromArray(array: ArrayLike<number>, offset?: number): Vector4;
        static fromVector3(vector3: Vector3, w?: number): Vector4;
        static random(): Vector4;
        /**
        * Vector4 对象中的第一个元素。默认值为 0
        */
        x: number;
        /**
         * Vector4 对象中的第二个元素。默认值为 0
         */
        y: number;
        /**
         * Vector4 对象中的第三个元素。默认值为 0
         */
        z: number;
        /**
         * Vector4 对象的第四个元素。默认值为 0
         */
        w: number;
        /**
         * 创建 Vector4 对象的实例。如果未指定构造函数的参数，则将使用元素 (0,0,0,0) 创建 Vector4 对象。
         * @param x 第一个元素
         * @param y 第二个元素
         * @param z 第三个元素
         * @param w 第四个元素
         */
        constructor(x?: number, y?: number, z?: number, w?: number);
        /**
         * 初始化向量
         * @param x 第一个元素
         * @param y 第二个元素
         * @param z 第三个元素
         * @param w 第四个元素
         * @return 返回自身
         */
        init(x: number, y: number, z: number, w: number): this;
        /**
         * 从数组初始化
         * @param array 提供数据的数组
         * @param offset 数组中起始位置
         * @return 返回自身
         */
        fromArray(array: ArrayLike<number>, offset?: number): this;
        /**
         * 从三维向量初始化
         * @param vector3 三维向量
         * @param w 向量第四个值
         * @return 返回自身
         */
        fromVector3(vector3: Vector3, w?: number): this;
        /**
         * 转换为三维向量
         * @param v3 三维向量
         */
        toVector3(v3?: Vector3): Vector3;
        /**
         * 转换为数组
         * @param array 数组
         * @param offset 偏移
         */
        toArray(array?: number[], offset?: number): number[];
        /**
         * 加上指定向量得到新向量
         * @param v 加向量
         * @return 返回新向量
         */
        add(v: Vector4): this;
        /**
         * 加上指定向量得到新向量
         * @param v 加向量
         * @return 返回新向量
         */
        addTo(v: Vector4, vout?: Vector4): Vector4;
        /**
         * 克隆一个向量
         * @return 返回一个拷贝向量
         */
        clone(): Vector4;
        /**
         * 从指定向量拷贝数据
         * @param v 被拷贝向量
         * @return 返回自身
         */
        copy(v: Vector4): this;
        /**
         * 减去指定向量
         * @param v 减去的向量
         * @return 返回自身
         */
        sub(v: Vector4): this;
        /**
         * 减去指定向量
         * @param v 减去的向量
         * @return 返回新向量
         */
        subTo(v: Vector4, vout?: Vector4): Vector4;
        /**
         * 乘以指定向量
         * @param v 乘以的向量
         * @return 返回自身
         */
        mul(v: Vector4): this;
        /**
         * 乘以指定向量
         * @param v 乘以的向量
         * @return 返回新向量
         */
        mulTo(v: Vector4, vout?: Vector4): Vector4;
        /**
         * 除以指定向量
         * @param v 除以的向量
         * @return 返回自身
         */
        div(v: Vector4): this;
        /**
         * 除以指定向量
         * @param v 除以的向量
         * @return 返回新向量
         */
        divTo(v: Vector4, vout?: Vector4): Vector4;
        /**
         * 与指定向量比较是否相等
         * @param v 比较的向量
         * @param precision 允许误差
         * @return 相等返回true，否则false
         */
        equals(v: Vector4, precision?: number): boolean;
        /**
         * 负向量
         * @return 返回自身
         */
        negate(): this;
        /**
         * 负向量
         * @return 返回新向量
         */
        negateTo(vout?: Vector4): Vector4;
        /**
         * 缩放指定系数
         * @param s 缩放系数
         * @return 返回自身
         */
        scale(s: number): this;
        /**
         * 缩放指定系数
         * @param s 缩放系数
         * @return 返回新向量
         */
        scaleTo(s: number): Vector4;
        /**
         * 获取到指定向量的插值
         * @param v 终点插值向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        lerp(v: Vector4, alpha: number): this;
        /**
         * 获取到指定向量的插值
         * @param v 终点插值向量
         * @param alpha 插值系数
         * @return 返回新向量
         */
        lerpTo(v: Vector4, alpha: number, vout?: Vector4): Vector4;
        /**
         * 应用矩阵
         * @param mat 矩阵
         */
        applyMatrix4x4(mat: Matrix4x4): this;
        /**
         * 返回当前 Vector4 对象的字符串表示形式。
         */
        toString(): string;
    }
}
declare namespace feng3d {
    /**
     * Orientation3D 类是用于表示 Matrix4x4 对象的方向样式的常量值枚举。方向的三个类型分别为欧拉角、轴角和四元数。Matrix4x4 对象的 decompose 和 recompose 方法采用其中的某一个枚举类型来标识矩阵的旋转组件。
     * @author feng 2016-3-21
     */
    enum Orientation3D {
        /**
        * 轴角方向结合使用轴和角度来确定方向。
        */
        AXIS_ANGLE = "axisAngle",
        /**
        * 欧拉角（decompose() 和 recompose() 方法的默认方向）通过三个不同的对应于每个轴的旋转角来定义方向。
        */
        EULER_ANGLES = "eulerAngles",
        /**
        * 四元数方向使用复数。
        */
        QUATERNION = "quaternion",
    }
}
declare namespace feng3d {
    /**
     * 矩形
     *
     * Rectangle 对象是按其位置（由它左上角的点 (x, y) 确定）以及宽度和高度定义的区域。<br/>
     * Rectangle 类的 x、y、width 和 height 属性相互独立；更改一个属性的值不会影响其他属性。
     * 但是，right 和 bottom 属性与这四个属性是整体相关的。例如，如果更改 right 属性的值，则 width
     * 属性的值将发生变化；如果更改 bottom 属性，则 height 属性的值将发生变化。
     * @author feng 2016-04-27
     */
    class Rectangle {
        /**
         * 创建一个新 Rectangle 对象，其左上角由 x 和 y 参数指定，并具有指定的 width 和 height 参数。
         * @param x 矩形左上角的 x 坐标。
         * @param y 矩形左上角的 y 坐标。
         * @param width 矩形的宽度（以像素为单位）。
         * @param height 矩形的高度（以像素为单位）。
         */
        constructor(x?: number, y?: number, width?: number, height?: number);
        /**
         * 矩形左上角的 x 坐标。
         * @default 0
         */
        x: number;
        /**
         * 矩形左上角的 y 坐标。
         * @default 0
         */
        y: number;
        /**
         * 矩形的宽度（以像素为单位）。
         * @default 0
         */
        width: number;
        /**
         * 矩形的高度（以像素为单位）。
         * @default 0
         */
        height: number;
        /**
         * x 和 width 属性的和。
         */
        right: number;
        /**
         * y 和 height 属性的和。
         */
        bottom: number;
        /**
         * 矩形左上角的 x 坐标。更改 Rectangle 对象的 left 属性对 y 和 height 属性没有影响。但是，它会影响 width 属性，而更改 x 值不会影响 width 属性。
         * left 属性的值等于 x 属性的值。
         */
        left: number;
        /**
         * 矩形左上角的 y 坐标。更改 Rectangle 对象的 top 属性对 x 和 width 属性没有影响。但是，它会影响 height 属性，而更改 y 值不会影响 height 属性。<br/>
         * top 属性的值等于 y 属性的值。
         */
        top: number;
        /**
         * 由该点的 x 和 y 坐标确定的 Rectangle 对象左上角的位置。
         */
        topLeft: Vector2;
        /**
         * 由 right 和 bottom 属性的值确定的 Rectangle 对象的右下角的位置。
         */
        bottomRight: Vector2;
        /**
         * 将源 Rectangle 对象中的所有矩形数据复制到调用方 Rectangle 对象中。
         * @param sourceRect 要从中复制数据的 Rectangle 对象。
         */
        copyFrom(sourceRect: Rectangle): Rectangle;
        /**
         * 将 Rectangle 的成员设置为指定值
         * @param x 矩形左上角的 x 坐标。
         * @param y 矩形左上角的 y 坐标。
         * @param width 矩形的宽度（以像素为单位）。
         * @param height 矩形的高度（以像素为单位）。
         */
        setTo(x: number, y: number, width: number, height: number): Rectangle;
        /**
         * 确定由此 Rectangle 对象定义的矩形区域内是否包含指定的点。
         * @param x 检测点的x轴
         * @param y 检测点的y轴
         * @returns 如果检测点位于矩形内，返回true，否则，返回false
         */
        contains(x: number, y: number): boolean;
        /**
         * 如果在 toIntersect 参数中指定的 Rectangle 对象与此 Rectangle 对象相交，则返回交集区域作为 Rectangle 对象。如果矩形不相交，
         * 则此方法返回一个空的 Rectangle 对象，其属性设置为 0。
         * @param toIntersect 要对照比较以查看其是否与此 Rectangle 对象相交的 Rectangle 对象。
         * @returns 等于交集区域的 Rectangle 对象。如果该矩形不相交，则此方法返回一个空的 Rectangle 对象；即，其 x、y、width 和
         * height 属性均设置为 0 的矩形。
         */
        intersection(toIntersect: Rectangle): Rectangle;
        /**
         * 按指定量增加 Rectangle 对象的大小（以像素为单位）
         * 保持 Rectangle 对象的中心点不变，使用 dx 值横向增加它的大小，使用 dy 值纵向增加它的大小。
         * @param dx Rectangle 对象横向增加的值。
         * @param dy Rectangle 对象纵向增加的值。
         */
        inflate(dx: number, dy: number): void;
        /**
         * 确定在 toIntersect 参数中指定的对象是否与此 Rectangle 对象相交。此方法检查指定的 Rectangle
         * 对象的 x、y、width 和 height 属性，以查看它是否与此 Rectangle 对象相交。
         * @param toIntersect 要与此 Rectangle 对象比较的 Rectangle 对象。
         * @returns 如果两个矩形相交，返回true，否则返回false
         */
        intersects(toIntersect: Rectangle): boolean;
        /**
         * 确定此 Rectangle 对象是否为空。
         * @returns 如果 Rectangle 对象的宽度或高度小于等于 0，则返回 true 值，否则返回 false。
         */
        isEmpty(): boolean;
        /**
         * 将 Rectangle 对象的所有属性设置为 0。
         */
        setEmpty(): void;
        /**
         * 返回一个新的 Rectangle 对象，其 x、y、width 和 height 属性的值与原始 Rectangle 对象的对应值相同。
         * @returns 新的 Rectangle 对象，其 x、y、width 和 height 属性的值与原始 Rectangle 对象的对应值相同。
         */
        clone(): Rectangle;
        /**
         * 确定由此 Rectangle 对象定义的矩形区域内是否包含指定的点。
         * 此方法与 Rectangle.contains() 方法类似，只不过它采用 Point 对象作为参数。
         * @param point 包含点对象
         * @returns 如果包含，返回true，否则返回false
         */
        containsPoint(point: Vector2): boolean;
        /**
         * 确定此 Rectangle 对象内是否包含由 rect 参数指定的 Rectangle 对象。
         * 如果一个 Rectangle 对象完全在另一个 Rectangle 的边界内，我们说第二个 Rectangle 包含第一个 Rectangle。
         * @param rect 所检查的 Rectangle 对象
         * @returns 如果此 Rectangle 对象包含您指定的 Rectangle 对象，则返回 true 值，否则返回 false。
         */
        containsRect(rect: Rectangle): boolean;
        /**
         * 确定在 toCompare 参数中指定的对象是否等于此 Rectangle 对象。
         * 此方法将某个对象的 x、y、width 和 height 属性与此 Rectangle 对象所对应的相同属性进行比较。
         * @param toCompare 要与此 Rectangle 对象进行比较的矩形。
         * @returns 如果对象具有与此 Rectangle 对象完全相同的 x、y、width 和 height 属性值，则返回 true 值，否则返回 false。
         */
        equals(toCompare: Rectangle): boolean;
        /**
         * 增加 Rectangle 对象的大小。此方法与 Rectangle.inflate() 方法类似，只不过它采用 Point 对象作为参数。
         */
        inflatePoint(point: Vector2): void;
        /**
         * 按指定量调整 Rectangle 对象的位置（由其左上角确定）。
         * @param dx 将 Rectangle 对象的 x 值移动此数量。
         * @param dy 将 Rectangle 对象的 t 值移动此数量。
         */
        offset(dx: number, dy: number): void;
        /**
         * 将 Point 对象用作参数来调整 Rectangle 对象的位置。此方法与 Rectangle.offset() 方法类似，只不过它采用 Point 对象作为参数。
         * @param point 要用于偏移此 Rectangle 对象的 Point 对象。
         */
        offsetPoint(point: Vector2): void;
        /**
         * 生成并返回一个字符串，该字符串列出 Rectangle 对象的水平位置和垂直位置以及高度和宽度。
         * @returns 一个字符串，它列出了 Rectangle 对象的下列各个属性的值：x、y、width 和 height。
         */
        toString(): string;
        /**
         * 通过填充两个矩形之间的水平和垂直空间，将这两个矩形组合在一起以创建一个新的 Rectangle 对象。
         * @param toUnion 要添加到此 Rectangle 对象的 Rectangle 对象。
         * @returns 充当两个矩形的联合的新 Rectangle 对象。
         */
        union(toUnion: Rectangle): Rectangle;
        /**
         * The size of the Rectangle object, expressed as a Point object with the
         * values of the <code>width</code> and <code>height</code> properties.
         */
        readonly size: Vector2;
    }
}
declare namespace feng3d {
    /**
     * The Matrix export class represents a transformation matrix that determines how to
     * map points from one coordinate space to another. You can perform various
     * graphical transformations on a display object by setting the properties of
     * a Matrix object, applying that Matrix object to the <code>matrix</code>
     * property of a Transform object, and then applying that Transform object as
     * the <code>transform</code> property of the display object. These
     * transformation functions include translation(<i>x</i> and <i>y</i>
     * repositioning), rotation, scaling, and skewing.
     *
     * <p>Together these types of transformations are known as <i>affine
     * transformations</i>. Affine transformations preserve the straightness of
     * lines while transforming, so that parallel lines stay parallel.</p>
     *
     * <p>To apply a transformation matrix to a display object, you create a
     * Transform object, set its <code>matrix</code> property to the
     * transformation matrix, and then set the <code>transform</code> property of
     * the display object to the Transform object. Matrix objects are also used as
     * parameters of some methods, such as the following:</p>
     *
     * <ul>
     *   <li>The <code>draw()</code> method of a BitmapData object</li>
     *   <li>The <code>beginBitmapFill()</code> method,
     * <code>beginGradientFill()</code> method, or
     * <code>lineGradientStyle()</code> method of a Graphics object</li>
     * </ul>
     *
     * <p>A transformation matrix object is a 3 x 3 matrix with the following
     * contents:</p>
     *
     * <p>In traditional transformation matrixes, the <code>u</code>,
     * <code>v</code>, and <code>w</code> properties provide extra capabilities.
     * The Matrix export class can only operate in two-dimensional space, so it always
     * assumes that the property values <code>u</code> and <code>v</code> are 0.0,
     * and that the property value <code>w</code> is 1.0. The effective values of
     * the matrix are as follows:</p>
     *
     * <p>You can get and set the values of all six of the other properties in a
     * Matrix object: <code>a</code>, <code>b</code>, <code>c</code>,
     * <code>d</code>, <code>tx</code>, and <code>ty</code>.</p>
     *
     * <p>The Matrix export class supports the four major types of transformations:
     * translation, scaling, rotation, and skewing. You can set three of these
     * transformations by using specialized methods, as described in the following
     * table: </p>
     *
     * <p>Each transformation function alters the current matrix properties so
     * that you can effectively combine multiple transformations. To do this, you
     * call more than one transformation function before applying the matrix to
     * its display object target(by using the <code>transform</code> property of
     * that display object).</p>
     *
     * <p>Use the <code>new Matrix()</code> constructor to create a Matrix object
     * before you can call the methods of the Matrix object.</p>
     */
    class Matrix {
        rawData: Float32Array;
        /**
         * The value that affects the positioning of pixels along the <i>x</i> axis
         * when scaling or rotating an image.
         */
        a: number;
        /**
         * The value that affects the positioning of pixels along the <i>y</i> axis
         * when rotating or skewing an image.
         */
        b: number;
        /**
         * The value that affects the positioning of pixels along the <i>x</i> axis
         * when rotating or skewing an image.
         */
        c: number;
        /**
         * The value that affects the positioning of pixels along the <i>y</i> axis
         * when scaling or rotating an image.
         */
        d: number;
        /**
         * The distance by which to translate each point along the <i>x</i> axis.
         */
        tx: number;
        /**
         * The distance by which to translate each point along the <i>y</i> axis.
         */
        ty: number;
        /**
         * Creates a new Matrix object with the specified parameters. In matrix
         * notation, the properties are organized like this:
         *
         * <p>If you do not provide any parameters to the <code>new Matrix()</code>
         * constructor, it creates an <i>identity matrix</i> with the following
         * values:</p>
         *
         * <p>In matrix notation, the identity matrix looks like this:</p>
         *
         * @param a  The value that affects the positioning of pixels along the
         *           <i>x</i> axis when scaling or rotating an image.
         * @param b  The value that affects the positioning of pixels along the
         *           <i>y</i> axis when rotating or skewing an image.
         * @param c  The value that affects the positioning of pixels along the
         *           <i>x</i> axis when rotating or skewing an image.
         * @param d  The value that affects the positioning of pixels along the
         *           <i>y</i> axis when scaling or rotating an image..
         * @param tx The distance by which to translate each point along the <i>x</i>
         *           axis.
         * @param ty The distance by which to translate each point along the <i>y</i>
         *           axis.
         */
        constructor(rawData?: Float32Array);
        constructor(a?: number, b?: number, c?: number, d?: number, tx?: number, ty?: number);
        copyRawDataFrom(vector: Float32Array, index?: number): void;
        /**
         * Returns a new Matrix object that is a clone of this matrix, with an exact
         * copy of the contained object.
         *
         * @return A Matrix object.
         */
        clone(): Matrix;
        /**
         * Concatenates a matrix with the current matrix, effectively combining the
         * geometric effects of the two. In mathematical terms, concatenating two
         * matrixes is the same as combining them using matrix multiplication.
         *
         * <p>For example, if matrix <code>m1</code> scales an object by a factor of
         * four, and matrix <code>m2</code> rotates an object by 1.5707963267949
         * radians(<code>Math.PI/2</code>), then <code>m1.concat(m2)</code>
         * transforms <code>m1</code> into a matrix that scales an object by a factor
         * of four and rotates the object by <code>Math.PI/2</code> radians. </p>
         *
         * <p>This method replaces the source matrix with the concatenated matrix. If
         * you want to concatenate two matrixes without altering either of the two
         * source matrixes, first copy the source matrix by using the
         * <code>clone()</code> method, as shown in the Class Examples section.</p>
         *
         * @param matrix The matrix to be concatenated to the source matrix.
         */
        concat(matrix: Matrix): void;
        /**
         * Copies a Vector3 object into specific column of the calling Matrix4x4
         * object.
         *
         * @param column   The column from which to copy the data from.
         * @param vector3D The Vector3 object from which to copy the data.
         */
        copyColumnFrom(column: number, vector3D: Vector3): void;
        /**
         * Copies specific column of the calling Matrix object into the Vector3
         * object. The w element of the Vector3 object will not be changed.
         *
         * @param column   The column from which to copy the data from.
         * @param vector3D The Vector3 object from which to copy the data.
         */
        copyColumnTo(column: number, vector3D: Vector3): void;
        /**
         * Copies all of the matrix data from the source Point object into the
         * calling Matrix object.
         *
         * @param sourceMatrix The Matrix object from which to copy the data.
         */
        copyFrom(sourceMatrix: Matrix): void;
        /**
         * Copies a Vector3 object into specific row of the calling Matrix object.
         *
         * @param row      The row from which to copy the data from.
         * @param vector3D The Vector3 object from which to copy the data.
         */
        copyRowFrom(row: number, vector3D: Vector3): void;
        /**
         * Copies specific row of the calling Matrix object into the Vector3 object.
         * The w element of the Vector3 object will not be changed.
         *
         * @param row      The row from which to copy the data from.
         * @param vector3D The Vector3 object from which to copy the data.
         */
        copyRowTo(row: number, vector3D: Vector3): void;
        /**
         * Includes parameters for scaling, rotation, and translation. When applied
         * to a matrix it sets the matrix's values based on those parameters.
         *
         * <p>Using the <code>createBox()</code> method lets you obtain the same
         * matrix as you would if you applied the <code>identity()</code>,
         * <code>rotate()</code>, <code>scale()</code>, and <code>translate()</code>
         * methods in succession. For example, <code>mat1.createBox(2,2,Math.PI/4,
         * 100, 100)</code> has the same effect as the following:</p>
         *
         * @param scaleX   The factor by which to scale horizontally.
         * @param scaleY   The factor by which scale vertically.
         * @param rotation The amount to rotate, in radians.
         * @param tx       The number of pixels to translate(move) to the right
         *                 along the <i>x</i> axis.
         * @param ty       The number of pixels to translate(move) down along the
         *                 <i>y</i> axis.
         */
        createBox(scaleX: number, scaleY: number, rotation?: number, tx?: number, ty?: number): void;
        /**
         * Creates the specific style of matrix expected by the
         * <code>beginGradientFill()</code> and <code>lineGradientStyle()</code>
         * methods of the Graphics class. Width and height are scaled to a
         * <code>scaleX</code>/<code>scaleY</code> pair and the
         * <code>tx</code>/<code>ty</code> values are offset by half the width and
         * height.
         *
         * <p>For example, consider a gradient with the following
         * characteristics:</p>
         *
         * <ul>
         *   <li><code>GradientType.LINEAR</code></li>
         *   <li>Two colors, green and blue, with the ratios array set to <code>[0,
         * 255]</code></li>
         *   <li><code>SpreadMethod.PAD</code></li>
         *   <li><code>InterpolationMethod.LINEAR_RGB</code></li>
         * </ul>
         *
         * <p>The following illustrations show gradients in which the matrix was
         * defined using the <code>createGradientBox()</code> method with different
         * parameter settings:</p>
         *
         * @param width    The width of the gradient box.
         * @param height   The height of the gradient box.
         * @param rotation The amount to rotate, in radians.
         * @param tx       The distance, in pixels, to translate to the right along
         *                 the <i>x</i> axis. This value is offset by half of the
         *                 <code>width</code> parameter.
         * @param ty       The distance, in pixels, to translate down along the
         *                 <i>y</i> axis. This value is offset by half of the
         *                 <code>height</code> parameter.
         */
        createGradientBox(width: number, height: number, rotation?: number, tx?: number, ty?: number): void;
        /**
         * Given a point in the pretransform coordinate space, returns the
         * coordinates of that point after the transformation occurs. Unlike the
         * standard transformation applied using the <code>transformPoint()</code>
         * method, the <code>deltaTransformPoint()</code> method's transformation
         * does not consider the translation parameters <code>tx</code> and
         * <code>ty</code>.
         *
         * @param point The point for which you want to get the result of the matrix
         *              transformation.
         * @return The point resulting from applying the matrix transformation.
         */
        deltaTransformPoint(point: Vector2): Vector2;
        /**
         * Sets each matrix property to a value that causes a null transformation. An
         * object transformed by applying an identity matrix will be identical to the
         * original.
         *
         * <p>After calling the <code>identity()</code> method, the resulting matrix
         * has the following properties: <code>a</code>=1, <code>b</code>=0,
         * <code>c</code>=0, <code>d</code>=1, <code>tx</code>=0,
         * <code>ty</code>=0.</p>
         *
         * <p>In matrix notation, the identity matrix looks like this:</p>
         *
         */
        identity(): void;
        /**
         * Performs the opposite transformation of the original matrix. You can apply
         * an inverted matrix to an object to undo the transformation performed when
         * applying the original matrix.
         */
        invert(): void;
        /**
         * Returns a new Matrix object that is a clone of this matrix, with an exact
         * copy of the contained object.
         *
         * @param matrix The matrix for which you want to get the result of the matrix
         *               transformation.
         * @return A Matrix object.
         */
        multiply(matrix: Matrix): Matrix;
        /**
         * Applies a rotation transformation to the Matrix object.
         *
         * <p>The <code>rotate()</code> method alters the <code>a</code>,
         * <code>b</code>, <code>c</code>, and <code>d</code> properties of the
         * Matrix object. In matrix notation, this is the same as concatenating the
         * current matrix with the following:</p>
         *
         * @param angle The rotation angle in radians.
         */
        rotate(angle: number): void;
        /**
         * Applies a scaling transformation to the matrix. The <i>x</i> axis is
         * multiplied by <code>sx</code>, and the <i>y</i> axis it is multiplied by
         * <code>sy</code>.
         *
         * <p>The <code>scale()</code> method alters the <code>a</code> and
         * <code>d</code> properties of the Matrix object. In matrix notation, this
         * is the same as concatenating the current matrix with the following
         * matrix:</p>
         *
         * @param sx A multiplier used to scale the object along the <i>x</i> axis.
         * @param sy A multiplier used to scale the object along the <i>y</i> axis.
         */
        scale(sx: number, sy: number): void;
        /**
         * Sets the members of Matrix to the specified values.
         *
         * @param a  The value that affects the positioning of pixels along the
         *           <i>x</i> axis when scaling or rotating an image.
         * @param b  The value that affects the positioning of pixels along the
         *           <i>y</i> axis when rotating or skewing an image.
         * @param c  The value that affects the positioning of pixels along the
         *           <i>x</i> axis when rotating or skewing an image.
         * @param d  The value that affects the positioning of pixels along the
         *           <i>y</i> axis when scaling or rotating an image..
         * @param tx The distance by which to translate each point along the <i>x</i>
         *           axis.
         * @param ty The distance by which to translate each point along the <i>y</i>
         *           axis.
         */
        setTo(a: number, b: number, c: number, d: number, tx: number, ty: number): void;
        /**
         * Returns a text value listing the properties of the Matrix object.
         *
         * @return A string containing the values of the properties of the Matrix
         *         object: <code>a</code>, <code>b</code>, <code>c</code>,
         *         <code>d</code>, <code>tx</code>, and <code>ty</code>.
         */
        toString(): string;
        /**
         * Returns the result of applying the geometric transformation represented by
         * the Matrix object to the specified point.
         *
         * @param point The point for which you want to get the result of the Matrix
         *              transformation.
         * @return The point resulting from applying the Matrix transformation.
         */
        transformPoint(point: Vector2): Vector2;
        /**
         * Translates the matrix along the <i>x</i> and <i>y</i> axes, as specified
         * by the <code>dx</code> and <code>dy</code> parameters.
         *
         * @param dx The amount of movement along the <i>x</i> axis to the right, in
         *           pixels.
         * @param dy The amount of movement down along the <i>y</i> axis, in pixels.
         */
        translate(dx: number, dy: number): void;
    }
}
declare namespace feng3d {
    /**
     * Matrix4x4 类表示一个转换矩阵，该矩阵确定三维 (3D) 显示对象的位置和方向。
     * 该矩阵可以执行转换功能，包括平移（沿 x、y 和 z 轴重新定位）、旋转和缩放（调整大小）。
     * Matrix4x4 类还可以执行透视投影，这会将 3D 坐标空间中的点映射到二维 (2D) 视图。
     * ```
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
     * ```
     */
    class Matrix4x4 {
        /**
         * 用于运算临时变量
         */
        static RAW_DATA_CONTAINER: number[];
        /**
         * 一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        rawData: number[];
        /**
         * 一个保存显示对象在转换参照帧中的 3D 坐标 (x,y,z) 位置的 Vector3 对象。
         */
        position: Vector3;
        /**
         * 一个用于确定矩阵是否可逆的数字。
         */
        readonly determinant: number;
        /**
         * 前方（+Z轴方向）
         */
        readonly forward: Vector3;
        /**
         * 上方（+y轴方向）
         */
        readonly up: Vector3;
        /**
         * 右方（+x轴方向）
         */
        readonly right: Vector3;
        /**
         * 后方（-z轴方向）
         */
        readonly back: Vector3;
        /**
         * 下方（-y轴方向）
         */
        readonly down: Vector3;
        /**
         * 左方（-x轴方向）
         */
        readonly left: Vector3;
        /**
         * 创建 Matrix4x4 对象。
         * @param   datas    一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        constructor(datas?: number[]);
        /**
         * 创建旋转矩阵
         * @param   axis            旋转轴
         * @param   degrees         角度
         */
        static fromAxisRotate(axis: Vector3, degrees: number): Matrix4x4;
        /**
         * 创建旋转矩阵
         * @param   rx      用于沿 x 轴旋转对象的角度。
         * @param   ry      用于沿 y 轴旋转对象的角度。
         * @param   rz      用于沿 z 轴旋转对象的角度。
         */
        static fromRotation(rx: number, ry: number, rz: number): Matrix4x4;
        /**
         * 创建旋转矩阵
         * @param   euler         角度（角度值）
         */
        static fromRotation(euler: {
            x: number;
            y: number;
            z: number;
        }): Matrix4x4;
        /**
         * 创建缩放矩阵
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        static fromScale(xScale: number, yScale: number, zScale: number): any;
        /**
         * 创建缩放矩阵
         * @param   scale       缩放值
         */
        static fromScale(scale: Vector3): any;
        /**
         * 创建位移矩阵
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        static fromPosition(x: number, y: number, z: number): any;
        /**
         * 创建位移矩阵
         * @param   position        位置
         */
        static fromPosition(position: Vector3): any;
        /**
         * 通过将另一个 Matrix4x4 对象与当前 Matrix4x4 对象相乘来后置一个矩阵。
         */
        append(lhs: Matrix4x4): this;
        /**
         * 在 Matrix4x4 对象上后置一个增量旋转。
         * @param   axis            旋转轴
         * @param   degrees         角度
         * @param   pivotPoint      旋转中心点
         */
        appendRotation(axis: Vector3, degrees: number, pivotPoint?: Vector3): this;
        /**
         * 在 Matrix4x4 对象上后置一个增量缩放，沿 x、y 和 z 轴改变位置。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        appendScale(xScale: number, yScale: number, zScale: number): this;
        /**
         * 在 Matrix4x4 对象上后置一个增量平移，沿 x、y 和 z 轴重新定位。
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        appendTranslation(x: number, y: number, z: number): this;
        /**
         * 返回一个新 Matrix4x4 对象，它是与当前 Matrix4x4 对象完全相同的副本。
         */
        clone(): Matrix4x4;
        /**
         * 将 Vector3 对象复制到调用方 Matrix4x4 对象的特定列中。
         * @param   column      副本的目标列。
         * @param   vector3D    要从中复制数据的 Vector3 对象。
         */
        copyColumnFrom(column: number, vector3D: Vector4): this;
        /**
         * 将调用方 Matrix4x4 对象的特定列复制到 Vector3 对象中。
         * @param   column       要从中复制数据的列。
         * @param   vector3D     副本的目标 Vector3 对象。
         */
        copyColumnToVector3(column: number, vector3D?: Vector3): Vector3;
        /**
         * 将调用方 Matrix4x4 对象的特定列复制到 Vector3 对象中。
         * @param   column       要从中复制数据的列。
         * @param   vector3D     副本的目标 Vector3 对象。
         */
        copyColumnToVector4(column: number, vector3D?: Vector4): Vector4;
        /**
         * 将源 Matrix4x4 对象中的所有矩阵数据复制到调用方 Matrix4x4 对象中。
         * @param   sourceMatrix3D      要从中复制数据的 Matrix4x4 对象。
         */
        copyFrom(sourceMatrix3D: Matrix4x4): this;
        /**
         * 将源 Vector 对象中的所有矢量数据复制到调用方 Matrix4x4 对象中。利用可选索引参数，您可以选择矢量中的任何起始文字插槽。
         * @param   vector      要从中复制数据的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        copyRawDataFrom(vector: number[], index?: number, transpose?: boolean): this;
        /**
         * 将调用方 Matrix4x4 对象中的所有矩阵数据复制到提供的矢量中。
         * @param   vector      要将数据复制到的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        copyRawDataTo(vector: number[] | Float32Array, index?: number, transpose?: boolean): this;
        /**
         * 将 Vector3 对象复制到调用方 Matrix4x4 对象的特定行中。
         * @param   row         要将数据复制到的行。
         * @param   vector3D    要从中复制数据的 Vector3 对象。
         */
        copyRowFrom(row: number, vector3D: Vector4): this;
        /**
         * 将调用方 Matrix4x4 对象的特定行复制到 Vector3 对象中。
         * @param   row         要从中复制数据的行。
         * @param   vector3D    将作为数据复制目的地的 Vector3 对象。
         */
        copyRowTo(row: number, vector3D: Vector4): this;
        /**
         * 拷贝当前矩阵
         * @param   dest    目标矩阵
         */
        copyToMatrix3D(dest: Matrix4x4): this;
        /**
         * 将转换矩阵的平移、旋转和缩放设置作为由三个 Vector3 对象组成的矢量返回。
         * @return      一个由三个 Vector3 对象组成的矢量，其中，每个对象分别容纳平移、旋转和缩放设置。
         */
        decompose(orientationStyle?: Orientation3D, result?: Vector3[]): Vector3[];
        /**
         * 使用不含平移元素的转换矩阵将 Vector3 对象从一个空间坐标转换到另一个空间坐标。
         * @param   v   一个容纳要转换的坐标的 Vector3 对象。
         * @return  一个包含转换后的坐标的 Vector3 对象。
         */
        deltaTransformVector(v: Vector3, vout?: Vector3): Vector3;
        /**
         * 将当前矩阵转换为恒等或单位矩阵。
         */
        identity(): this;
        /**
         * 反转当前矩阵。逆矩阵
         * @return      如果成功反转矩阵，则返回 该矩阵。
         */
        invert(): this;
        /**
         * 通过将当前 Matrix4x4 对象与另一个 Matrix4x4 对象相乘来前置一个矩阵。得到的结果将合并两个矩阵转换。
         * @param   rhs     个右侧矩阵，它与当前 Matrix4x4 对象相乘。
         */
        prepend(rhs: Matrix4x4): this;
        /**
         * 在 Matrix4x4 对象上前置一个增量旋转。在将 Matrix4x4 对象应用于显示对象时，矩阵会在 Matrix4x4 对象中先执行旋转，然后再执行其他转换。
         * @param   axis        旋转的轴或方向。常见的轴为 X_AXIS (Vector3(1,0,0))、Y_AXIS (Vector3(0,1,0)) 和 Z_AXIS (Vector3(0,0,1))。此矢量的长度应为 1。
         * @param   degrees     旋转的角度。
         * @param   pivotPoint  一个用于确定旋转中心的点。对象的默认轴点为该对象的注册点。
         */
        prependRotation(axis: Vector3, degrees: number, pivotPoint?: Vector3): this;
        /**
         * 在 Matrix4x4 对象上前置一个增量缩放，沿 x、y 和 z 轴改变位置。在将 Matrix4x4 对象应用于显示对象时，矩阵会在 Matrix4x4 对象中先执行缩放更改，然后再执行其他转换。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        prependScale(xScale: number, yScale: number, zScale: number): this;
        /**
         * 在 Matrix4x4 对象上前置一个增量平移，沿 x、y 和 z 轴重新定位。在将 Matrix4x4 对象应用于显示对象时，矩阵会在 Matrix4x4 对象中先执行平移更改，然后再执行其他转换。
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        prependTranslation(x: number, y: number, z: number): this;
        /**
         * X轴方向移动
         * @param distance  移动距离
         */
        moveRight(distance: number): this;
        /**
         * Y轴方向移动
         * @param distance  移动距离
         */
        moveUp(distance: number): this;
        /**
         * Z轴方向移动
         * @param distance  移动距离
         */
        moveForward(distance: number): this;
        /**
         * 设置转换矩阵的平移、旋转和缩放设置。
         * @param   components      一个由三个 Vector3 对象组成的矢量，这些对象将替代 Matrix4x4 对象的平移、旋转和缩放元素。
         */
        recompose(components: Vector3[]): this;
        /**
         * 使用转换矩阵将 Vector3 对象从一个空间坐标转换到另一个空间坐标。
         * @param   vin   一个容纳要转换的坐标的 Vector3 对象。
         * @return  一个包含转换后的坐标的 Vector3 对象。
         */
        transformVector(vin: Vector3, vout?: Vector3): Vector3;
        /**
         * 使用转换矩阵将 Vector3 对象从一个空间坐标转换到另一个空间坐标。
         * @param   vin   一个容纳要转换的坐标的 Vector3 对象。
         * @return  一个包含转换后的坐标的 Vector3 对象。
         */
        transformVector4(vin: Vector4, vout?: Vector4): Vector4;
        /**
         * 使用转换矩阵将由数字构成的矢量从一个空间坐标转换到另一个空间坐标。
         * @param   vin     一个由多个数字组成的矢量，其中每三个数字构成一个要转换的 3D 坐标 (x,y,z)。
         * @param   vout    一个由多个数字组成的矢量，其中每三个数字构成一个已转换的 3D 坐标 (x,y,z)。
         */
        transformVectors(vin: number[], vout: number[]): void;
        transformRotation(vin: Vector3, vout?: Vector3): Vector3;
        /**
         * 将当前 Matrix4x4 对象转换为一个矩阵，并将互换其中的行和列。
         */
        transpose(): this;
        /**
         * 比较矩阵是否相等
         */
        equals(matrix3D: Matrix4x4, precision?: number): boolean;
        /**
         * 看向目标位置
         * @param target    目标位置
         * @param upAxis    向上朝向
         */
        lookAt(target: Vector3, upAxis?: Vector3): void;
        /**
         * 获取XYZ轴中最大缩放值
         */
        getMaxScaleOnAxis(): number;
        /**
         * 以字符串返回矩阵的值
         */
        toString(): string;
    }
}
declare namespace feng3d {
    /**
     * A Quaternion object which can be used to represent rotations.
     */
    class Quaternion {
        static fromArray(array: ArrayLike<number>, offset?: number): Quaternion;
        /**
         * The x value of the quaternion.
         */
        x: number;
        /**
         * The y value of the quaternion.
         */
        y: number;
        /**
         * The z value of the quaternion.
         */
        z: number;
        /**
         * The w value of the quaternion.
         */
        w: number;
        /**
         * Creates a new Quaternion object.
         * @param x The x value of the quaternion.
         * @param y The y value of the quaternion.
         * @param z The z value of the quaternion.
         * @param w The w value of the quaternion.
         */
        constructor(x?: number, y?: number, z?: number, w?: number);
        /**
         * Returns the magnitude of the quaternion object.
         */
        readonly magnitude: number;
        setTo(x?: number, y?: number, z?: number, w?: number): void;
        fromArray(array: ArrayLike<number>, offset?: number): this;
        toArray(array?: number[], offset?: number): number[];
        /**
         * Fills the quaternion object with the result from a multiplication of two quaternion objects.
         *
         * @param    qa    The first quaternion in the multiplication.
         * @param    qb    The second quaternion in the multiplication.
         */
        multiply(qa: Quaternion, qb: Quaternion): void;
        multiplyVector(vector: Vector3, target?: Quaternion): Quaternion;
        /**
         * Fills the quaternion object with values representing the given rotation around a vector.
         *
         * @param    axis    The axis around which to rotate
         * @param    angle    The angle in radians of the rotation.
         */
        fromAxisAngle(axis: Vector3, angle: number): void;
        /**
         * Spherically interpolates between two quaternions, providing an interpolation between rotations with constant angle change rate.
         * @param qa The first quaternion to interpolate.
         * @param qb The second quaternion to interpolate.
         * @param t The interpolation weight, a value between 0 and 1.
         */
        slerp(qa: Quaternion, qb: Quaternion, t: number): void;
        /**
         * 线性求插值
         * @param qa 第一个四元素
         * @param qb 第二个四元素
         * @param t 权重
         */
        lerp(qa: Quaternion, qb: Quaternion, t: number): void;
        /**
         * Fills the quaternion object with values representing the given euler rotation.
         *
         * @param    ax        The angle in radians of the rotation around the ax axis.
         * @param    ay        The angle in radians of the rotation around the ay axis.
         * @param    az        The angle in radians of the rotation around the az axis.
         */
        fromEulerAngles(ax: number, ay: number, az: number): void;
        /**
         * Fills a target Vector3 object with the Euler angles that form the rotation represented by this quaternion.
         * @param target An optional Vector3 object to contain the Euler angles. If not provided, a new object is created.
         * @return The Vector3 containing the Euler angles.
         */
        toEulerAngles(target?: Vector3): Vector3;
        /**
         * Normalises the quaternion object.
         */
        normalize(val?: number): void;
        /**
         * Used to trace the values of a quaternion.
         *
         * @return A string representation of the quaternion object.
         */
        toString(): string;
        /**
         * Converts the quaternion to a Matrix4x4 object representing an equivalent rotation.
         * @param target An optional Matrix4x4 container to store the transformation in. If not provided, a new object is created.
         * @return A Matrix4x4 object representing an equivalent rotation.
         */
        toMatrix3D(target?: Matrix4x4): Matrix4x4;
        /**
         * Extracts a quaternion rotation matrix out of a given Matrix4x4 object.
         * @param matrix The Matrix4x4 out of which the rotation will be extracted.
         */
        fromMatrix(matrix: Matrix4x4): this;
        /**
         * Converts the quaternion to a Vector.&lt;number&gt; matrix representation of a rotation equivalent to this quaternion.
         * @param target The Vector.&lt;number&gt; to contain the raw matrix data.
         * @param exclude4thRow If true, the last row will be omitted, and a 4x3 matrix will be generated instead of a 4x4.
         */
        toRawData(target: number[], exclude4thRow?: boolean): void;
        /**
         * Clones the quaternion.
         * @return An exact duplicate of the current Quaternion.
         */
        clone(): Quaternion;
        /**
         * Rotates a point.
         * @param vector The Vector3 object to be rotated.
         * @param target An optional Vector3 object that will contain the rotated coordinates. If not provided, a new object will be created.
         * @return A Vector3 object containing the rotated point.
         */
        rotatePoint(vector: Vector3, target?: Vector3): Vector3;
        /**
         * Copies the data from a quaternion into this instance.
         * @param q The quaternion to copy from.
         */
        copyFrom(q: Quaternion): void;
    }
}
declare namespace feng3d {
}
declare namespace feng3d {
    /**
     * 3d直线
     * @author feng 2013-6-13
     */
    class Line3D {
        /**
         * 根据直线上两点初始化直线
         * @param p0 Vector3
         * @param p1 Vector3
         */
        static fromPoints(p0: Vector3, p1: Vector3): Line3D;
        /**
         * 根据直线某点与方向初始化直线
         * @param position 直线上某点
         * @param direction 直线的方向
         */
        static fromPosAndDir(position: Vector3, direction: Vector3): Line3D;
        /**
         * 随机直线，比如用于单元测试
         */
        static random(): Line3D;
        /**
         * 直线上某一点
         */
        position: Vector3;
        /**
         * 直线方向(已标准化)
         */
        direction: Vector3;
        /**
         * 根据直线某点与方向创建直线
         * @param position 直线上某点
         * @param direction 直线的方向
         */
        constructor(position?: Vector3, direction?: Vector3);
        /**
         * 根据直线上两点初始化直线
         * @param p0 Vector3
         * @param p1 Vector3
         */
        fromPoints(p0: Vector3, p1: Vector3): this;
        /**
         * 根据直线某点与方向初始化直线
         * @param position 直线上某点
         * @param direction 直线的方向
         */
        fromPosAndDir(position: Vector3, direction: Vector3): this;
        /**
         * 获取经过该直线的平面
         */
        getPlane(plane?: Plane3D): Plane3D;
        /**
         * 获取直线上的一个点
         * @param length 与原点距离
         */
        getPoint(length?: number, vout?: Vector3): Vector3;
        /**
         * 指定点到该直线距离
         * @param point 指定点
         */
        distanceWithPoint(point: Vector3): number;
        /**
         * 与指定点最近点的系数
         * @param point 点
         */
        closestPointParameterWithPoint(point: Vector3): number;
        /**
         * 与指定点最近的点
         * @param point 点
         * @param vout 输出点
         */
        closestPointWithPoint(point: Vector3, vout?: Vector3): Vector3;
        /**
         * 判定点是否在直线上
         * @param point 点
         * @param precision 精度
         */
        onWithPoint(point: Vector3, precision?: number): boolean;
        /**
         * 与直线相交
         * @param line3D 直线
         */
        intersectWithLine3D(line3D: Line3D): Vector3 | Line3D;
        /**
         * 应用矩阵
         * @param mat 矩阵
         */
        applyMatri4x4(mat: Matrix4x4): this;
        /**
         * 与指定向量比较是否相等
         * @param v 比较的向量
         * @param precision 允许误差
         * @return 相等返回true，否则false
         */
        equals(line: Line3D, precision?: number): boolean;
        /**
         * 拷贝
         * @param line 直线
         */
        copy(line: Line3D): this;
        /**
         * 克隆
         */
        clone(): Line3D;
    }
}
declare namespace feng3d {
    /**
     * 3D线段
     */
    class Segment3D {
        /**
         * 初始化线段
         * @param p0
         * @param p1
         */
        static fromPoints(p0: Vector3, p1: Vector3): Segment3D;
        /**
         * 随机线段
         */
        static random(): Segment3D;
        /**
         * 线段起点
         */
        p0: Vector3;
        /**
         * 线段终点
         */
        p1: Vector3;
        constructor(p0?: Vector3, p1?: Vector3);
        /**
         * 获取线段所在直线
         */
        getLine(line?: Line3D): Line3D;
        /**
         * 获取指定位置上的点，当position=0时返回p0，当position=1时返回p1
         * @param position 线段上的位置
         */
        getPoint(position: number, pout?: Vector3): Vector3;
        /**
         * 判定点是否在线段上
         * @param point
         */
        onWithPoint(point: Vector3): boolean;
        /**
         * 判定点是否投影在线段上
         * @param point
         */
        projectOnWithPoint(point: Vector3): boolean;
        /**
         * 获取点在线段上的位置，当点投影在线段上p0位置时返回0，当点投影在线段p1上时返回1
         * @param point 点
         */
        getPositionByPoint(point: Vector3): number;
        /**
         * 获取直线到点的法线（线段到点垂直方向）
         * @param point 点
         */
        getNormalWithPoint(point: Vector3): Vector3;
        /**
         * 指定点到该线段距离，如果投影点不在线段上时，该距离为指定点到最近的线段端点的距离
         * @param point 指定点
         */
        getPointDistance(point: Vector3): number;
        /**
         * 与直线相交
         * @param line 直线
         */
        intersectionWithLine(line: Line3D): Vector3 | Segment3D;
        /**
         * 与线段相交
         * @param segment 直线
         */
        intersectionWithSegment(segment: Segment3D): Vector3 | Segment3D;
        /**
         * 与指定点最近的点
         * @param point 点
         * @param vout 输出点
         */
        closestPointWithPoint(point: Vector3, vout?: Vector3): Vector3;
        /**
         * 把点压缩到线段内
         */
        clampPoint(point: Vector3, pout?: Vector3): Vector3;
        /**
         * 判定线段是否相等
         */
        equals(segment: Segment3D): boolean;
        /**
         * 复制
         */
        copy(segment: Segment3D): this;
        /**
         * 克隆
         */
        clone(): Segment3D;
    }
}
declare namespace feng3d {
    /**
     * 3D射线
     * @author feng 2013-6-13
     */
    class Ray3D extends Line3D {
        constructor(position?: Vector3, direction?: Vector3);
    }
}
declare namespace feng3d {
    /**
     * 三角形
     */
    class Triangle3D {
        /**
         * 通过3顶点定义一个三角形
         * @param p0		点0
         * @param p1		点1
         * @param p2		点2
         */
        static fromPoints(p0: Vector3, p1: Vector3, p2: Vector3): Triangle3D;
        /**
         * 随机三角形
         */
        static random(): Triangle3D;
        /**
         * 三角形0号点
         */
        p0: Vector3;
        /**
         * 三角形1号点
         */
        p1: Vector3;
        /**
         * 三角形2号点
         */
        p2: Vector3;
        constructor(p0?: Vector3, p1?: Vector3, p2?: Vector3);
        /**
         * 三角形三个点
         */
        getPoints(): Vector3[];
        /**
         * 三边
         */
        getSegments(): Segment3D[];
        /**
         * 三角形所在平面
         */
        getPlane3d(pout?: Plane3D): Plane3D;
        /**
         * 获取法线
         */
        getNormal(vout?: Vector3): Vector3;
        /**
         * 重心,三条中线相交的点叫做重心。
         */
        getBarycenter(pout?: Vector3): Vector3;
        /**
         * 外心，外切圆心,三角形三边的垂直平分线的交点，称为三角形外心。
         * @see https://baike.baidu.com/item/%E4%B8%89%E8%A7%92%E5%BD%A2%E4%BA%94%E5%BF%83/218867
         */
        getCircumcenter(pout?: Vector3): Vector3;
        /**
         * 外心，内切圆心,三角形内心为三角形三条内角平分线的交点。
         * @see https://baike.baidu.com/item/%E4%B8%89%E8%A7%92%E5%BD%A2%E4%BA%94%E5%BF%83/218867
         */
        getInnercenter(pout?: Vector3): Vector3;
        /**
         * 垂心，三角形三边上的三条高或其延长线交于一点，称为三角形垂心。
         * @see https://baike.baidu.com/item/%E4%B8%89%E8%A7%92%E5%BD%A2%E4%BA%94%E5%BF%83/218867
         */
        getOrthocenter(pout?: Vector3): Vector3;
        /**
         * 通过3顶点定义一个三角形
         * @param p0		点0
         * @param p1		点1
         * @param p2		点2
         */
        fromPoints(p0: Vector3, p1: Vector3, p2: Vector3): this;
        /**
         * 获取三角形内的点
         * @param p 三点的权重
         * @param pout 输出点
         */
        getPoint(p: Vector3, pout?: Vector3): Vector3;
        /**
         * 获取三角形内随机点
         * @param pout 输出点
         */
        randomPoint(pout?: Vector3): Vector3;
        /**
         * 获取与直线相交，当直线与三角形不相交时返回null
         */
        intersectionWithLine(line: Line3D): Vector3 | Segment3D;
        /**
         * 获取与线段相交
         */
        intersectionWithSegment(segment: Segment3D): Vector3 | Segment3D;
        /**
         * 判定点是否在三角形上
         * @param p
         */
        onWithPoint(p: Vector3): boolean;
        /**
         * 获取指定点分别占三个点的混合值
         */
        blendWithPoint(p: Vector3): Vector3;
        /**
         * 是否与盒子相交
         */
        intersectsBox(box: Box): boolean;
        /**
         * 与指定点最近的点
         * @param point 点
         * @param vout 输出点
         */
        closestPointWithPoint(point: Vector3, vout?: Vector3): Vector3;
        /**
         * 用点分解（切割）三角形
         */
        decomposeWithPoint(p: Vector3): Triangle3D[];
        /**
         * 用点分解（切割）三角形
         */
        decomposeWithPoints(ps: Vector3[]): Triangle3D[];
        /**
         * 用线段分解（切割）三角形
         * @param segment 线段
         */
        decomposeWithSegment(segment: Segment3D): Triangle3D[];
        /**
         * 用直线分解（切割）三角形
         * @param line 直线
         */
        decomposeWithLine(line: Line3D): Triangle3D[];
        /**
         * 面积
         */
        area(): number;
        /**
         * 复制
         * @param triangle 三角形
         */
        copy(triangle: Triangle3D): this;
        /**
         * 克隆
         */
        clone(): Triangle3D;
    }
}
declare namespace feng3d {
    /**
     * 长方体，盒子
     */
    class Box {
        /**
         * 从一组顶点初始化盒子
         * @param positions 坐标数据列表
         */
        static formPositions(positions: number[]): Box;
        /**
         * 从一组点初始化盒子
         * @param ps 点列表
         */
        static fromPoints(ps: Vector3[]): Box;
        /**
         * 随机盒子
         */
        static random(): Box;
        /**
         * 最小点
         */
        min: Vector3;
        /**
         * 最大点
         */
        max: Vector3;
        /**
         * 获取中心点
         * @param vout 输出向量
         */
        getCenter(vout?: Vector3): Vector3;
        /**
         * 尺寸
         */
        getSize(vout?: Vector3): Vector3;
        /**
         * 创建盒子
         * @param min 最小点
         * @param max 最大点
         */
        constructor(min?: Vector3, max?: Vector3);
        /**
         * 初始化盒子
         * @param min 最小值
         * @param max 最大值
         */
        init(min: Vector3, max: Vector3): this;
        /**
         * 转换为盒子八个角所在点列表
         */
        toPoints(): Vector3[];
        /**
         * 从一组顶点初始化盒子
         * @param positions 坐标数据列表
         */
        formPositions(positions: number[]): this;
        /**
         * 从一组点初始化盒子
         * @param ps 点列表
         */
        fromPoints(ps: Vector3[]): this;
        /**
         * 盒子内随机点
         */
        randomPoint(pout?: Vector3): Vector3;
        /**
         * 使用点扩张盒子
         * @param point 点
         */
        expandByPoint(point: Vector3): this;
        /**
         * 应用矩阵
         * @param mat 矩阵
         */
        applyMatrix3D(mat: Matrix4x4): this;
        /**
         * 应用矩阵
         * @param mat 矩阵
         */
        applyMatrix3DTo(mat: Matrix4x4, out?: Box): Box;
        /**
         *
         */
        clone(): Box;
        /**
         * 是否包含指定点
         * @param p 点
         */
        containsPoint(p: Vector3): boolean;
        /**
         * 是否包含盒子
         * @param box 盒子
         */
        containsBox(box: Box): boolean;
        /**
         * 拷贝
         * @param box 盒子
         */
        copy(box: Box): this;
        /**
         * 比较盒子是否相等
         * @param box 盒子
         */
        equals(box: Box): boolean;
        /**
         * 膨胀盒子
         * @param dx x方向膨胀量
         * @param dy y方向膨胀量
         * @param dz z方向膨胀量
         */
        inflate(dx: any, dy: any, dz: any): void;
        /**
         * 膨胀盒子
         * @param delta 膨胀量
         */
        inflatePoint(delta: Vector3): void;
        /**
         * 与盒子相交
         * @param box 盒子
         */
        intersection(box: Box): Box;
        /**
         * 与盒子相交
         * @param box 盒子
         */
        intersectionTo(box: Box, vbox?: Box): Box;
        /**
         * 盒子是否相交
         * @param box 盒子
         */
        intersects(box: Box): boolean;
        /**
         * 与射线相交
         * @param position 射线起点
         * @param direction 射线方向
         * @param targetNormal 相交处法线
         * @return 起点到box距离
         */
        rayIntersection(position: Vector3, direction: Vector3, targetNormal: Vector3): number;
        /**
         * Finds the closest point on the Box to another given point. This can be used for maximum error calculations for content within a given Box.
         *
         * @param point The point for which to find the closest point on the Box
         * @param target An optional Vector3 to store the result to prevent creating a new object.
         * @return
         */
        closestPointToPoint(point: Vector3, target?: Vector3): Vector3;
        /**
         * 清空盒子
         */
        empty(): this;
        /**
         * 是否为空
         * 当体积为0时为空
         */
        isEmpty(): boolean;
        /**
         * 偏移
         * @param dx x轴偏移
         * @param dy y轴偏移
         * @param dz z轴偏移
         */
        offset(dx: number, dy: number, dz: number): this;
        /**
         * 偏移
         * @param position 偏移量
         */
        offsetPosition(position: Vector3): this;
        toString(): string;
        /**
         * 联合盒子
         * @param box 盒子
         */
        union(box: Box): Box;
        /**
         * 是否与球相交
         * @param sphere 球
         */
        intersectsSphere(sphere: Sphere): boolean;
        /**
         *
         * @param point 点
         * @param pout 输出点
         */
        clampPoint(point: Vector3, pout?: Vector3): Vector3;
        /**
         * 是否与平面相交
         * @param plane 平面
         */
        intersectsPlane(plane: Plane3D): boolean;
        /**
         * 是否与三角形相交
         * @param triangle 三角形
         */
        intersectsTriangle(triangle: Triangle3D): boolean;
        /**
         * 转换为三角形列表
         */
        toTriangles(triangles?: Triangle3D[]): Triangle3D[];
    }
}
declare namespace feng3d {
    /**
     * 球
     */
    class Sphere {
        /**
         * 从一组点初始化球
         * @param points 点列表
         */
        static fromPoints(points: Vector3[]): Sphere;
        /**
         * 从一组顶点初始化球
         * @param positions 坐标数据列表
         */
        static fromPositions(positions: number[]): Sphere;
        /**
         * 球心
         */
        center: Vector3;
        /**
         * 半径
         */
        radius: number;
        /**
         * Create a Sphere with ABCD coefficients
         */
        constructor(center?: Vector3, radius?: number);
        /**
         * 与射线相交
         * @param position 射线起点
         * @param direction 射线方向
         * @param targetNormal 目标法线
         * @return 射线起点到交点的距离
         */
        rayIntersection(position: Vector3, direction: Vector3, targetNormal: Vector3): number;
        /**
         * 是否包含指定点
         * @param position 点
         */
        containsPoint(position: Vector3): boolean;
        /**
         * 从一组点初始化球
         * @param points 点列表
         */
        fromPoints(points: Vector3[]): this;
        /**
         * 从一组顶点初始化球
         * @param positions 坐标数据列表
         */
        fromPositions(positions: number[]): this;
        /**
         * 拷贝
         */
        copy(sphere: Sphere): this;
        /**
         * 克隆
         */
        clone(): Sphere;
        /**
         * 是否为空
         */
        isEmpty(): boolean;
        /**
         * 点到球的距离
         * @param point 点
         */
        distanceToPoint(point: Vector3): number;
        /**
         * 与指定球是否相交
         */
        intersectsSphere(sphere: Sphere): boolean;
        /**
         * 是否与盒子相交
         * @param box 盒子
         */
        intersectsBox(box: Box): boolean;
        /**
         * 是否与平面相交
         * @param plane 平面
         */
        intersectsPlane(plane: Plane3D): boolean;
        /**
         *
         * @param point 点
         * @param pout 输出点
         */
        clampPoint(point: Vector3, pout?: Vector3): Vector3;
        /**
         * 获取包围盒
         */
        getBoundingBox(box?: Box): Box;
        /**
         * 应用矩阵
         * @param matrix 矩阵
         */
        applyMatrix4(matrix: Matrix4x4): this;
        /**
         * 平移
         * @param offset 偏移量
         */
        translate(offset: Vector3): this;
        /**
         * 是否相等
         * @param sphere 球
         */
        equals(sphere: Sphere): boolean;
        toString(): string;
    }
}
declare namespace feng3d {
    /**
     * 3d面
     * ax+by+cz+d=0
     */
    class Plane3D {
        /**
         * 通过3顶点定义一个平面
         * @param p0		点0
         * @param p1		点1
         * @param p2		点2
         */
        static fromPoints(p0: Vector3, p1: Vector3, p2: Vector3): Plane3D;
        /**
         * 根据法线与点定义平面
         * @param normal		平面法线
         * @param point			平面上任意一点
         */
        static fromNormalAndPoint(normal: Vector3, point: Vector3): Plane3D;
        /**
         * 随机平面
         */
        static random(): Plane3D;
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
         * <p>同样也是原点到平面的距离</p>
         */
        d: number;
        /**
         * 创建一个平面
         * @param a		A系数
         * @param b		B系数
         * @param c		C系数
         * @param d		D系数
         */
        constructor(a?: number, b?: number, c?: number, d?: number);
        /**
         * 原点在平面上的投影
         * @param vout 输出点
         */
        getOrigin(vout?: Vector3): Vector3;
        /**
         * 平面上随机点
         * @param vout 输出点
         */
        randomPoint(vout?: Vector3): Vector3;
        /**
         * 法线
         */
        getNormal(vout?: Vector3): Vector3;
        /**
         * 通过3顶点定义一个平面
         * @param p0		点0
         * @param p1		点1
         * @param p2		点2
         */
        fromPoints(p0: Vector3, p1: Vector3, p2: Vector3): this;
        /**
         * 根据法线与点定义平面
         * @param normal		平面法线
         * @param point			平面上任意一点
         */
        fromNormalAndPoint(normal: Vector3, point: Vector3): this;
        /**
         * 计算点与平面的距离
         * @param p		点
         * @returns		距离
         */
        distanceWithPoint(p: Vector3): number;
        /**
         * 点是否在平面上
         * @param p 点
         */
        onWithPoint(p: Vector3): boolean;
        /**
         * 顶点分类
         * <p>把顶点分为后面、前面、相交三类</p>
         * @param p			顶点
         * @return			顶点类型 PlaneClassification.BACK,PlaneClassification.FRONT,PlaneClassification.INTERSECT
         */
        classifyPoint(p: Vector3, precision?: number): PlaneClassification;
        /**
         * 判定与直线是否平行
         * @param line3D
         */
        parallelWithLine3D(line3D: Line3D, precision?: number): boolean;
        /**
         * 判定与平面是否平行
         * @param plane3D
         */
        parallelWithPlane3D(plane3D: Plane3D, precision?: number): boolean;
        /**
         * 获取与直线交点
         */
        intersectWithLine3D(line3D: Line3D): Vector3 | Line3D;
        /**
         * 获取与平面相交直线
         * @param plane3D
         */
        intersectWithPlane3D(plane3D: Plane3D): Line3D;
        /**
         * 翻转平面
         */
        negate(): this;
        /**
         * 点到平面的投影
         * @param point
         */
        projectPoint(point: Vector3, vout?: Vector3): Vector3;
        /**
         * 与指定点最近的点
         * @param point 点
         * @param vout 输出点
         */
        closestPointWithPoint(point: Vector3, vout?: Vector3): Vector3;
        /**
         * 复制
         */
        copy(plane: Plane3D): this;
        /**
         * 克隆
         */
        clone(): Plane3D;
        /**
         * 输出字符串
         */
        toString(): string;
    }
}
declare namespace feng3d {
    /**
     * 点与面的相对位置
     * @author feng
     */
    enum PlaneClassification {
        /**
         * 在平面后面
         */
        BACK = 0,
        /**
         * 在平面前面
         */
        FRONT = 1,
        /**
         * 与平面相交
         */
        INTERSECT = 2,
    }
}
declare namespace feng3d {
    interface Color3Raw {
        __class__?: "feng3d.Color3";
        b?: number;
        g?: number;
        r?: number;
    }
    /**
     * 颜色
     * @author feng 2016-09-24
     */
    class Color3 {
        static WHITE: Color3;
        static BLACK: Color3;
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
         * 构建颜色
         * @param r     红[0,1]
         * @param g     绿[0,1]
         * @param b     蓝[0,1]
         */
        constructor(r?: number, g?: number, b?: number);
        setTo(r: number, g: number, b: number): this;
        /**
         * 通过
         * @param color
         */
        fromUnit(color: number): this;
        toInt(): number;
        /**
         * 输出16进制字符串
         */
        toHexString(): string;
        /**
         * 混合颜色
         * @param color 混入的颜色
         * @param rate  混入比例
         */
        mix(color: Color3, rate?: number): this;
        /**
         * 拷贝
         */
        copyFrom(color: Color3): this;
        toVector3(vector3?: Vector3): Vector3;
        toColor4(color4?: Color4): Color4;
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
    var ColorKeywords: {
        'aliceblue': number;
        'antiquewhite': number;
        'aqua': number;
        'aquamarine': number;
        'azure': number;
        'beige': number;
        'bisque': number;
        'black': number;
        'blanchedalmond': number;
        'blue': number;
        'blueviolet': number;
        'brown': number;
        'burlywood': number;
        'cadetblue': number;
        'chartreuse': number;
        'chocolate': number;
        'coral': number;
        'cornflowerblue': number;
        'cornsilk': number;
        'crimson': number;
        'cyan': number;
        'darkblue': number;
        'darkcyan': number;
        'darkgoldenrod': number;
        'darkgray': number;
        'darkgreen': number;
        'darkgrey': number;
        'darkkhaki': number;
        'darkmagenta': number;
        'darkolivegreen': number;
        'darkorange': number;
        'darkorchid': number;
        'darkred': number;
        'darksalmon': number;
        'darkseagreen': number;
        'darkslateblue': number;
        'darkslategray': number;
        'darkslategrey': number;
        'darkturquoise': number;
        'darkviolet': number;
        'deeppink': number;
        'deepskyblue': number;
        'dimgray': number;
        'dimgrey': number;
        'dodgerblue': number;
        'firebrick': number;
        'floralwhite': number;
        'forestgreen': number;
        'fuchsia': number;
        'gainsboro': number;
        'ghostwhite': number;
        'gold': number;
        'goldenrod': number;
        'gray': number;
        'green': number;
        'greenyellow': number;
        'grey': number;
        'honeydew': number;
        'hotpink': number;
        'indianred': number;
        'indigo': number;
        'ivory': number;
        'khaki': number;
        'lavender': number;
        'lavenderblush': number;
        'lawngreen': number;
        'lemonchiffon': number;
        'lightblue': number;
        'lightcoral': number;
        'lightcyan': number;
        'lightgoldenrodyellow': number;
        'lightgray': number;
        'lightgreen': number;
        'lightgrey': number;
        'lightpink': number;
        'lightsalmon': number;
        'lightseagreen': number;
        'lightskyblue': number;
        'lightslategray': number;
        'lightslategrey': number;
        'lightsteelblue': number;
        'lightyellow': number;
        'lime': number;
        'limegreen': number;
        'linen': number;
        'magenta': number;
        'maroon': number;
        'mediumaquamarine': number;
        'mediumblue': number;
        'mediumorchid': number;
        'mediumpurple': number;
        'mediumseagreen': number;
        'mediumslateblue': number;
        'mediumspringgreen': number;
        'mediumturquoise': number;
        'mediumvioletred': number;
        'midnightblue': number;
        'mintcream': number;
        'mistyrose': number;
        'moccasin': number;
        'navajowhite': number;
        'navy': number;
        'oldlace': number;
        'olive': number;
        'olivedrab': number;
        'orange': number;
        'orangered': number;
        'orchid': number;
        'palegoldenrod': number;
        'palegreen': number;
        'paleturquoise': number;
        'palevioletred': number;
        'papayawhip': number;
        'peachpuff': number;
        'peru': number;
        'pink': number;
        'plum': number;
        'powderblue': number;
        'purple': number;
        'rebeccapurple': number;
        'red': number;
        'rosybrown': number;
        'royalblue': number;
        'saddlebrown': number;
        'salmon': number;
        'sandybrown': number;
        'seagreen': number;
        'seashell': number;
        'sienna': number;
        'silver': number;
        'skyblue': number;
        'slateblue': number;
        'slategray': number;
        'slategrey': number;
        'snow': number;
        'springgreen': number;
        'steelblue': number;
        'tan': number;
        'teal': number;
        'thistle': number;
        'tomato': number;
        'turquoise': number;
        'violet': number;
        'wheat': number;
        'white': number;
        'whitesmoke': number;
        'yellow': number;
        'yellowgreen': number;
    };
}
declare namespace feng3d {
    interface Color4Raw {
        __class__?: "feng3d.Color4";
        a?: number;
        b?: number;
        g?: number;
        r?: number;
    }
    /**
     * 颜色（包含透明度）
     * @author feng 2016-09-24
     */
    class Color4 {
        static WHITE: Color4;
        static BLACK: Color4;
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
        setTo(r: number, g: number, b: number, a?: number): this;
        /**
         * 通过
         * @param color
         */
        fromUnit(color: number): this;
        toInt(): number;
        /**
         * 输出16进制字符串
         */
        toHexString(): string;
        /**
         * 混合颜色
         * @param color 混入的颜色
         * @param rate  混入比例
         */
        mix(color: Color4, rate?: number): this;
        /**
         * 拷贝
         */
        copyFrom(color: Color4): this;
        /**
         * 输出字符串
         */
        toString(): string;
        toColor3(color?: Color3): Color3;
        toVector4(vector4?: Vector4): Vector4;
    }
}
declare namespace feng3d {
    /**
     * 截头锥体,平截头体,视锥体
     */
    class Frustum {
        planes: Plane3D[];
        constructor(p0?: Plane3D, p1?: Plane3D, p2?: Plane3D, p3?: Plane3D, p4?: Plane3D, p5?: Plane3D);
        /**
         * 更新视锥体6个面，平面均朝向视锥体内部
         * @see http://www.linuxgraphics.cn/graphics/opengl_view_frustum_culling.html
         */
        fromMatrix3D(matrix3D: Matrix4x4): void;
        /**
         * 是否与盒子相交
         * @param box 盒子
         */
        intersectsBox(box: Box): boolean;
        /**
         * 是否与球相交
         */
        intersectsSphere(sphere: Sphere): boolean;
        /**
         * 是否包含指定点
         */
        containsPoint(point: any): boolean;
        /**
         * 复制
         */
        copy(frustum: Frustum): this;
        /**
         * 克隆
         */
        clone(): Frustum;
    }
}
declare namespace feng3d {
    /**
     * 由三角形构成的几何体
     * ### 限定：
     *  * 只包含三角形，不存在四边形等其他多边形
     *  *
     */
    class TriangleGeometry {
        /**
         * 从盒子初始化
         * @param box 盒子
         */
        static fromBox(box: Box): TriangleGeometry;
        triangles: Triangle3D[];
        constructor(triangles?: Triangle3D[]);
        /**
         * 从盒子初始化
         * @param box 盒子
         */
        fromBox(box: Box): this;
        /**
         * 获取所有顶点，去除重复顶点
         */
        getPoints(): Vector3[];
        /**
         * 是否闭合
         * 方案：获取所有三角形的线段，当每条线段（a,b）都存在且仅有一条与之相对于的线段（b，a）时几何体闭合
         */
        isClosed(): boolean;
        /**
         * 包围盒
         */
        getBox(box?: Box): Box;
        /**
         * 与指定点最近的点
         * @param point 点
         * @param vout 输出点
         */
        closestPointWithPoint(point: Vector3, vout?: Vector3): Vector3;
        /**
         * 给指定点分类
         * @param p 点
         * @return 点相对于几何体位置；0:在几何体表面上，1：在几何体外，-1：在几何体内
         * 方案：当指定点不在几何体上时，在几何体上找到距离指定点最近点，最近点到给定点形成的向量与最近点所在面（当最近点在多个面上时取点乘摸最大的面）法线点乘大于0时给定点在几何体内，否则在几何体外。
         */
        classifyPoint(p: Vector3): 1 | 0 | -1;
        /**
         * 是否包含指定点
         * @param p 点
         */
        containsPoint(p: Vector3): boolean;
        /**
         * 给指定线段分类
         * @param segment 线段
         * @return 线段相对于几何体位置；0:在几何体表面上，1：在几何体外，-1：在几何体内，2：横跨几何体
         */
        classifySegment(segment: Segment3D): 1 | 2 | 0 | -1;
        /**
         * 给指定三角形分类
         * @param triangle 三角形
         * @return 三角形相对于几何体位置；0:在几何体表面上，1：在几何体外，-1：在几何体内
         */
        classifyTriangle(triangle: Triangle3D): void;
        /**
         * 与直线碰撞
         * @param line3d 直线
         */
        intersectionWithLine(line3d: Line3D): {
            segments: Segment3D[];
            points: Vector3[];
        };
        /**
         * 与线段相交
         * @param segment 线段
         * @return 不相交时返回null，相交时返回 碰撞线段列表与碰撞点列表
         */
        intersectionWithSegment(segment: Segment3D): {
            segments: Segment3D[];
            points: Vector3[];
        };
        /**
         * 分解三角形
         * @param triangle 三角形
         */
        decomposeTriangle(triangle: Triangle3D): void;
        /**
         * 拷贝
         */
        copy(triangleGeometry: TriangleGeometry): this;
        /**
         * 克隆
         */
        clone(): TriangleGeometry;
    }
}
declare namespace feng3d {
    class KeyBoard {
        /**
         * 获取键盘按键名称
         * @param code   按键值
         */
        static getKey(code: number): string;
        /**
         * 获取按键值
         * @param key 按键
         */
        static getCode(key: string): number;
    }
}
declare namespace feng3d {
    /**
     * 按键捕获
     * @author feng 2016-4-26
     */
    class KeyCapture {
        /**
         * 捕获的按键字典
         */
        private _mouseKeyDic;
        /**
         * 按键状态
         */
        private _keyState;
        /**
         * 构建
         * @param stage		舞台
         */
        constructor(shortCut: ShortCut);
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
    }
}
declare namespace feng3d {
    /**
     * 按键状态
     * @author feng 2016-4-26
     */
    class KeyState extends EventDispatcher {
        /**
         * 按键状态{key:键名称,value:是否按下}
         */
        private _keyStateDic;
        /**
         * 构建
         */
        constructor();
        /**
         * 按下键
         * @param key 	键名称
         * @param data	携带数据
         */
        pressKey(key: string, data: KeyboardEvent | WheelEvent | MouseEvent): void;
        /**
         * 释放键
         * @param key	键名称
         * @param data	携带数据
         */
        releaseKey(key: string, data: KeyboardEvent | WheelEvent | MouseEvent): void;
        /**
         * 获取按键状态
         * @param key 按键名称
         */
        getKeyState(key: string): boolean;
    }
}
declare namespace feng3d {
    /**
     * 快捷键捕获
     * @author feng 2016-4-26
     */
    class ShortCutCapture {
        /**
         * 快捷键环境
         */
        private _shortCut;
        /**
         * 快捷键
         */
        private _key;
        /**
         * 要执行的命令名称
         */
        private _command;
        /**
         * 可执行的状态命令
         */
        private _stateCommand;
        /**
         * 快捷键处于活动状态的条件
         */
        private _when;
        /**
         * 按键状态
         */
        private _keyState;
        /**
         * 按键列表
         */
        private _keys;
        /**
         * 状态列表
         */
        private _states;
        /**
         * 命令列表
         */
        private _commands;
        /**
         * 命令列表
         */
        private _stateCommands;
        /**
         * 构建快捷键捕获
         * @param shortCut				快捷键环境
         * @param key					快捷键；用“+”连接多个按键，“!”表示没按下某键；例如 “a+!b”表示按下“a”与没按下“b”时触发。
         * @param command				要执行的command的id；使用“,”连接触发多个命令；例如 “commandA,commandB”表示满足触发条件后依次执行commandA与commandB命令。
         * @param stateCommand			要执行的状态命令id；使用“,”连接触发多个状态命令，没带“!”表示激活该状态，否则表示使其处于非激活状态；例如 “stateA,!stateB”表示满足触发条件后激活状态“stateA，使“stateB处于非激活状态。
         * @param when					快捷键激活的条件；使用“+”连接多个状态，没带“!”表示需要处于激活状态，否则需要处于非激活状态； 例如 “stateA+!stateB”表示stateA处于激活状态且stateB处于非激活状态时会判断按键是否满足条件。
         */
        constructor(shortCut: ShortCut, key: string, command?: string, stateCommand?: string, when?: string);
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
        private getStates(when?);
        /**
         * 获取键列表
         * @param key		快捷键
         */
        private getKeys(key);
        /**
         * 获取命令列表
         * @param command	命令
         */
        private getCommands(command?);
        /**
         * 获取状态命令列表
         * @param stateCommand	状态命令
         */
        private getStateCommand(stateCommand?);
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
    not: boolean;
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
    not: boolean;
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
    not: boolean;
    /**
     * 状态名称
     */
    state: string;
    constructor(state: string);
}
declare namespace feng3d {
}
declare namespace feng3d {
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
Event.on(shortCut,<any>"run", function(e:Event):void
{
    trace("接受到命令：" + e.type);
});
     * </pre>
     */
    class ShortCut extends EventDispatcher {
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
         * 启动
         */
        enable: boolean;
        /**
         * 初始化快捷键模块
         */
        constructor();
        /**
         * 添加快捷键
         * @param shortcuts		快捷键列表
         */
        addShortCuts(shortcuts: {
            key: string;
            command?: string;
            stateCommand?: string;
            when?: string;
        }[]): void;
        /**
         * 删除快捷键
         * @param shortcuts		快捷键列表
         */
        removeShortCuts(shortcuts: {
            key: string;
            command?: string;
            stateCommand?: string;
            when?: string;
        }[]): void;
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
        getState(state: string): boolean;
        /**
         * 获取快捷键唯一字符串
         */
        private getShortcutUniqueKey(shortcut);
    }
}
declare namespace feng3d {
    /**
     * 加载类
     * @author feng 2016-12-14
     */
    var Loader: {
        loadText: (url: string, onCompleted?: (content: string) => void, onRequestProgress?: () => void, onError?: (e: any) => void) => void;
        loadBinary: (url: string, onCompleted?: (content: ArrayBuffer) => void, onRequestProgress?: () => void, onError?: (e: any) => void) => void;
        loadImage: (url: string, onCompleted?: (content: HTMLImageElement) => void, onRequestProgress?: () => void, onError?: (e: any) => void) => void;
    };
}
declare namespace feng3d {
}
declare namespace feng3d {
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
declare namespace feng3d {
    /**
     * 渲染模式
     * A GLenum specifying the type primitive to render. Possible values are:
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
     * @author feng 2016-09-28
     */
    enum RenderMode {
        /**
         * 点渲染
         * gl.POINTS: Draws a single dot.
         */
        POINTS = "POINTS",
        /**
         * gl.LINE_LOOP: Draws a straight line to the next vertex, and connects the last vertex back to the first.
         */
        LINE_LOOP = "LINE_LOOP",
        /**
         * gl.LINE_STRIP: Draws a straight line to the next vertex.
         */
        LINE_STRIP = "LINE_STRIP",
        /**
         * gl.LINES: Draws a line between a pair of vertices.
         */
        LINES = "LINES",
        /**
         * gl.TRIANGLES: Draws a triangle for a group of three vertices.
         */
        TRIANGLES = "TRIANGLES",
        /**
         * gl.TRIANGLE_STRIP
         * @see https://en.wikipedia.org/wiki/Triangle_strip
         */
        TRIANGLE_STRIP = "TRIANGLE_STRIP",
        /**
         * gl.TRIANGLE_FAN
         * @see https://en.wikipedia.org/wiki/Triangle_fan
         */
        TRIANGLE_FAN = "TRIANGLE_FAN",
    }
}
declare namespace feng3d {
    /**
     * 纹理类型
     * A GLenum specifying the binding point (target). Possible values:
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture
     */
    enum TextureType {
        /**
         * gl.TEXTURE_2D: A two-dimensional texture.
         */
        TEXTURE_2D = "TEXTURE_2D",
        /**
         * gl.TEXTURE_CUBE_MAP: A cube-mapped texture.
         */
        TEXTURE_CUBE_MAP = "TEXTURE_CUBE_MAP",
        /**
         * using a WebGL 2 context
         * gl.TEXTURE_3D: A three-dimensional texture.
         */
        TEXTURE_3D = "TEXTURE_3D",
        /**
         * using a WebGL 2 context
         * gl.TEXTURE_2D_ARRAY: A two-dimensional array texture.
         */
        TEXTURE_2D_ARRAY = "TEXTURE_2D_ARRAY",
    }
}
declare namespace feng3d {
    /**
     * 混合方法
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
     */
    enum BlendEquation {
        /**
         *  source + destination
         */
        FUNC_ADD = "FUNC_ADD",
        /**
         * source - destination
         */
        FUNC_SUBTRACT = "FUNC_SUBTRACT",
        /**
         * destination - source
         */
        FUNC_REVERSE_SUBTRACT = "FUNC_REVERSE_SUBTRACT",
    }
}
declare namespace feng3d {
    /**
     * 混合因子（R分量系数，G分量系数，B分量系数）
     */
    enum BlendFactor {
        /**
         * 0.0  0.0 0.0
         */
        ZERO = "ZERO",
        /**
         * 1.0  1.0 1.0
         */
        ONE = "ONE",
        /**
         * Rs   Gs  Bs
         */
        SRC_COLOR = "SRC_COLOR",
        /**
         * 1-Rs   1-Gs  1-Bs
         */
        ONE_MINUS_SRC_COLOR = "ONE_MINUS_SRC_COLOR",
        /**
         * Rd   Gd  Bd
         */
        DST_COLOR = "DST_COLOR",
        /**
         * 1-Rd   1-Gd  1-Bd
         */
        ONE_MINUS_DST_COLOR = "ONE_MINUS_DST_COLOR",
        /**
         * As   As  As
         */
        SRC_ALPHA = "SRC_ALPHA",
        /**
         * 1-As   1-As  1-As
         */
        ONE_MINUS_SRC_ALPHA = "ONE_MINUS_SRC_ALPHA",
        /**
         * Ad   Ad  Ad
         */
        DST_ALPHA = "DST_ALPHA",
        /**
         * 1-Ad   1-Ad  1-Ad
         */
        ONE_MINUS_DST_ALPHA = "ONE_MINUS_DST_ALPHA",
        /**
         * min(As-Ad)   min(As-Ad)  min(As-Ad)
         */
        SRC_ALPHA_SATURATE = "SRC_ALPHA_SATURATE",
    }
}
declare namespace feng3d {
    /**
     * 裁剪面枚举
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/cullFace
     */
    enum CullFace {
        /**
         * 关闭裁剪面
         */
        NONE = "NONE",
        /**
         * 正面
         */
        FRONT = "FRONT",
        /**
         * 背面
         */
        BACK = "BACK",
        /**
         * 正面与背面
         */
        FRONT_AND_BACK = "FRONT_AND_BACK",
    }
}
declare namespace feng3d {
    /**
     * 正面方向枚举
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/frontFace
     */
    enum FrontFace {
        /**
         * Clock-wise winding.
         */
        CW = "CW",
        /**
         *  Counter-clock-wise winding.
         */
        CCW = "CCW",
    }
}
declare namespace feng3d {
    /**
     * 纹理颜色格式
     * A GLint specifying the color components in the texture
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
     */
    enum TextureFormat {
        /**
         * Discards the red, green and blue components and reads the alpha component.
         */
        ALPHA = "ALPHA",
        /**
         *  Discards the alpha components and reads the red, green and blue components.
         */
        RGB = "RGB",
        /**
         * Red, green, blue and alpha components are read from the color buffer.
         */
        RGBA = "RGBA",
        /**
         * Each color component is a luminance component, alpha is 1.0.
         */
        LUMINANCE = "LUMINANCE",
        /**
         * Each component is a luminance/alpha component.
         */
        LUMINANCE_ALPHA = "LUMINANCE_ALPHA",
    }
}
declare namespace feng3d {
    /**
     * 纹理数据类型
     * A GLenum specifying the data type of the texel data
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
     */
    enum TextureDataType {
        /**
         * 8 bits per channel for gl.RGBA
         */
        UNSIGNED_BYTE = "UNSIGNED_BYTE",
        /**
         * 5 red bits, 6 green bits, 5 blue bits.
         */
        UNSIGNED_SHORT_5_6_5 = "UNSIGNED_SHORT_5_6_5",
        /**
         * 4 red bits, 4 green bits, 4 blue bits, 4 alpha bits.
         */
        UNSIGNED_SHORT_4_4_4_4 = "UNSIGNED_SHORT_4_4_4_4",
        /**
         * 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit.
         */
        UNSIGNED_SHORT_5_5_5_1 = "UNSIGNED_SHORT_5_5_5_1",
    }
}
declare namespace feng3d {
    /**
     * 纹理缩小过滤器
     * Texture minification filter
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    enum TextureMinFilter {
        LINEAR = "LINEAR",
        NEAREST = "NEAREST",
        NEAREST_MIPMAP_NEAREST = "NEAREST_MIPMAP_NEAREST",
        LINEAR_MIPMAP_NEAREST = "LINEAR_MIPMAP_NEAREST",
        /**
         *  (default value)
         */
        NEAREST_MIPMAP_LINEAR = "NEAREST_MIPMAP_LINEAR",
        LINEAR_MIPMAP_LINEAR = "LINEAR_MIPMAP_LINEAR",
    }
}
declare namespace feng3d {
    /**
     * 纹理放大滤波器
     * Texture magnification filter
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    enum TextureMagFilter {
        /**
         *  (default value)
         */
        LINEAR = "LINEAR",
        NEAREST = "NEAREST",
    }
}
declare namespace feng3d {
    /**
     * 纹理坐标s包装函数枚举
     * Wrapping function for texture coordinate s
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    enum TextureWrap {
        /**
         * (default value)
         */
        REPEAT = "REPEAT",
        CLAMP_TO_EDGE = "CLAMP_TO_EDGE",
        MIRRORED_REPEAT = "MIRRORED_REPEAT",
    }
}
declare namespace feng3d {
    /**
     * GL 数组数据类型
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
     */
    enum GLArrayType {
        /**
         * signed 8-bit integer, with values in [-128, 127]
         */
        BYTE = "BYTE",
        /**
         *  signed 16-bit integer, with values in [-32768, 32767]
         */
        SHORT = "SHORT",
        /**
         * unsigned 8-bit integer, with values in [0, 255]
         */
        UNSIGNED_BYTE = "UNSIGNED_BYTE",
        /**
         * unsigned 16-bit integer, with values in [0, 65535]
         */
        UNSIGNED_SHORT = "UNSIGNED_SHORT",
        /**
         * 32-bit floating point number
         */
        FLOAT = "FLOAT",
    }
}
declare namespace feng3d {
    /**
     * 深度检测方法枚举
     * A GLenum specifying the depth comparison function, which sets the conditions under which the pixel will be drawn. The default value is gl.LESS.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc
     */
    enum DepthFunc {
        /**
         * (never pass)
         */
        NEVER = "NEVER",
        /**
         *  (pass if the incoming value is less than the depth buffer value)
         */
        LESS = "LESS",
        /**
         *  (pass if the incoming value equals the the depth buffer value)
         */
        EQUAL = "EQUAL",
        /**
         *  (pass if the incoming value is less than or equal to the depth buffer value)
         */
        LEQUAL = "LEQUAL",
        /**
         * (pass if the incoming value is greater than the depth buffer value)
         */
        GREATER = "GREATER",
        /**
         * (pass if the incoming value is not equal to the depth buffer value)
         */
        NOTEQUAL = "NOTEQUAL",
        /**
         * (pass if the incoming value is greater than or equal to the depth buffer value)
         */
        GEQUAL = "GEQUAL",
        /**
         *  (always pass)
         */
        ALWAYS = "ALWAYS",
    }
}
interface HTMLCanvasElement {
    getContext(contextId: "webgl"): WebGLRenderingContext;
}
interface WebGLRenderingContext {
    getExtension(name: "ANGLE_instanced_arrays"): ANGLEInstancedArrays;
    getExtension(name: "EXT_blend_minmax"): EXTBlendMinMax;
    getExtension(name: "EXT_color_buffer_half_float"): EXTColorBufferHalfFloat;
    getExtension(name: "EXT_frag_depth"): EXTFragDepth;
    getExtension(name: "EXT_sRGB"): EXTsRGB;
    getExtension(name: "EXT_shader_texture_lod"): EXTShaderTextureLOD;
    getExtension(name: "EXT_texture_filter_anisotropic"): EXTTextureFilterAnisotropic;
    getExtension(name: "OES_element_index_uint"): OESElementIndexUint;
    getExtension(name: "OES_standard_derivatives"): OESStandardDerivatives;
    getExtension(name: "OES_texture_float"): OESTextureFloat;
    getExtension(name: "OES_texture_float_linear"): OESTextureFloatLinear;
    getExtension(name: "OES_texture_half_float"): OESTextureHalfFloat;
    getExtension(name: "OES_texture_half_float_linear"): OESTextureHalfFloatLinear;
    getExtension(name: "OES_vertex_array_object"): OESVertexArrayObject;
    getExtension(name: "WEBGL_color_buffer_float"): WebGLColorBufferFloat;
    getExtension(name: "WEBGL_compressed_texture_atc"): WebGLCompressedTextureATC;
    getExtension(name: "WEBGL_compressed_texture_etc1"): WebGLCompressedTextureETC1;
    getExtension(name: "WEBGL_compressed_texture_pvrtc"): WebGLCompressedTexturePVRTC;
    getExtension(name: "WEBGL_compressed_texture_s3tc"): WebGLCompressedTextureS3TC;
    getExtension(name: "WEBGL_debug_renderer_info"): WebGLDebugRendererInfo;
    getExtension(name: "WEBGL_debug_shaders"): WebGLDebugShaders;
    getExtension(name: "WEBGL_depth_texture"): WebGLDepthTexture;
    getExtension(name: "WEBGL_draw_buffers"): WebGLDrawBuffers;
    getExtension(name: "WEBGL_lose_context"): WebGLLoseContext;
    getExtension(name: "WEBKIT_EXT_texture_filter_anisotropic"): EXTTextureFilterAnisotropic;
    getExtension(name: "WEBKIT_WEBGL_compressed_texture_atc"): WebGLCompressedTextureATC;
    getExtension(name: "WEBKIT_WEBGL_compressed_texture_pvrtc"): WebGLCompressedTexturePVRTC;
    getExtension(name: "WEBKIT_WEBGL_compressed_texture_s3tc"): WebGLCompressedTextureS3TC;
    getExtension(name: "WEBKIT_WEBGL_depth_texture"): WebGLDepthTexture;
    getExtension(name: "WEBKIT_WEBGL_lose_context"): WebGLLoseContext;
    getExtension(name: "MOZ_WEBGL_compressed_texture_s3tc"): WebGLCompressedTextureS3TC;
    getExtension(name: "MOZ_WEBGL_depth_texture"): WebGLDepthTexture;
    getExtension(name: "MOZ_WEBGL_lose_context"): WebGLLoseContext;
}
interface ANGLEInstancedArrays {
    VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE: number;
    drawArraysInstancedANGLE(mode: number, first: number, count: number, primcount: number): void;
    drawElementsInstancedANGLE(mode: number, count: number, type: number, offset: number, primcount: number): void;
    vertexAttribDivisorANGLE(index: number, divisor: number): void;
}
interface EXTBlendMinMax {
    MIN_EXT: number;
    MAX_EXT: number;
}
interface EXTColorBufferHalfFloat {
    RGBA16F_EXT: number;
    RGB16F_EXT: number;
    FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT: number;
    UNSIGNED_NORMALIZED_EXT: number;
}
interface EXTFragDepth {
}
interface EXTsRGB {
    SRGB_EXT: number;
    SRGB_ALPHA_EXT: number;
    SRGB8_ALPHA8_EXT: number;
    FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT: number;
}
interface EXTShaderTextureLOD {
}
/**
 * 纹理各向异性过滤扩展
 */
interface EXTTextureFilterAnisotropic {
    TEXTURE_MAX_ANISOTROPY_EXT: number;
    MAX_TEXTURE_MAX_ANISOTROPY_EXT: number;
}
interface OESElementIndexUint {
}
interface OESStandardDerivatives {
    FRAGMENT_SHADER_DERIVATIVE_HINT_OES: number;
}
interface OESTextureFloat {
}
interface OESTextureFloatLinear {
}
interface OESTextureHalfFloat {
    HALF_FLOAT_OES: number;
}
interface OESTextureHalfFloatLinear {
}
interface WebGLVertexArrayObjectOES extends WebGLObject {
}
interface OESVertexArrayObject {
    VERTEX_ARRAY_BINDING_OES: number;
    createVertexArrayOES(): WebGLVertexArrayObjectOES | null;
    deleteVertexArrayOES(arrayObject: WebGLVertexArrayObjectOES | null): void;
    isVertexArrayOES(arrayObject: WebGLVertexArrayObjectOES | null): boolean;
    bindVertexArrayOES(arrayObject: WebGLVertexArrayObjectOES | null): void;
}
interface WebGLColorBufferFloat {
    RGBA32F_EXT: number;
    FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT: number;
    UNSIGNED_NORMALIZED_EXT: number;
}
interface WebGLCompressedTextureATC {
    COMPRESSED_RGB_ATC_WEBGL: number;
    COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL: number;
    COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL: number;
}
interface WebGLCompressedTextureETC1 {
    COMPRESSED_RGB_ETC1_WEBGL: number;
}
interface WebGLCompressedTexturePVRTC {
    COMPRESSED_RGB_PVRTC_4BPPV1_IMG: number;
    COMPRESSED_RGB_PVRTC_2BPPV1_IMG: number;
    COMPRESSED_RGBA_PVRTC_4BPPV1_IMG: number;
    COMPRESSED_RGBA_PVRTC_2BPPV1_IMG: number;
}
interface WebGLCompressedTextureS3TC {
    COMPRESSED_RGB_S3TC_DXT1_EXT: number;
    COMPRESSED_RGBA_S3TC_DXT1_EXT: number;
    COMPRESSED_RGBA_S3TC_DXT3_EXT: number;
    COMPRESSED_RGBA_S3TC_DXT5_EXT: number;
}
interface WebGLDebugRendererInfo {
    UNMASKED_VENDOR_WEBGL: number;
    UNMASKED_RENDERER_WEBGL: number;
}
interface WebGLDebugShaders {
    getTranslatedShaderSource(shader: WebGLShader): string;
}
interface WebGLDepthTexture {
    UNSIGNED_INT_24_8_WEBGL: number;
}
interface WebGLDrawBuffers {
    COLOR_ATTACHMENT0_WEBGL: number;
    COLOR_ATTACHMENT1_WEBGL: number;
    COLOR_ATTACHMENT2_WEBGL: number;
    COLOR_ATTACHMENT3_WEBGL: number;
    COLOR_ATTACHMENT4_WEBGL: number;
    COLOR_ATTACHMENT5_WEBGL: number;
    COLOR_ATTACHMENT6_WEBGL: number;
    COLOR_ATTACHMENT7_WEBGL: number;
    COLOR_ATTACHMENT8_WEBGL: number;
    COLOR_ATTACHMENT9_WEBGL: number;
    COLOR_ATTACHMENT10_WEBGL: number;
    COLOR_ATTACHMENT11_WEBGL: number;
    COLOR_ATTACHMENT12_WEBGL: number;
    COLOR_ATTACHMENT13_WEBGL: number;
    COLOR_ATTACHMENT14_WEBGL: number;
    COLOR_ATTACHMENT15_WEBGL: number;
    DRAW_BUFFER0_WEBGL: number;
    DRAW_BUFFER1_WEBGL: number;
    DRAW_BUFFER2_WEBGL: number;
    DRAW_BUFFER3_WEBGL: number;
    DRAW_BUFFER4_WEBGL: number;
    DRAW_BUFFER5_WEBGL: number;
    DRAW_BUFFER6_WEBGL: number;
    DRAW_BUFFER7_WEBGL: number;
    DRAW_BUFFER8_WEBGL: number;
    DRAW_BUFFER9_WEBGL: number;
    DRAW_BUFFER10_WEBGL: number;
    DRAW_BUFFER11_WEBGL: number;
    DRAW_BUFFER12_WEBGL: number;
    DRAW_BUFFER13_WEBGL: number;
    DRAW_BUFFER14_WEBGL: number;
    DRAW_BUFFER15_WEBGL: number;
    MAX_COLOR_ATTACHMENTS_WEBGL: number;
    MAX_DRAW_BUFFERS_WEBGL: number;
    drawBuffersWEBGL(buffers: number[]): void;
}
interface WebGLLoseContext {
    loseContext(): void;
    restoreContext(): void;
}
interface HTMLCanvasElement {
    getContext(contextId: "webgl2"): WebGL2RenderingContext;
}
declare type BufferDataSource = ArrayBufferView | ArrayBuffer;
declare type TexImageSource = ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
declare type DOMString = string;
declare type Float32List = Float32Array | number[];
declare type Int32List = Int32Array | number[];
declare type Uint32List = Int32Array | number[];
declare type GLuint64 = number;
declare type GLint64 = number;
interface WebGLQuery extends WebGLObject {
}
interface WebGLSampler extends WebGLObject {
}
interface WebGLSync extends WebGLObject {
}
interface WebGLTransformFeedback extends WebGLObject {
}
interface WebGLVertexArrayObject extends WebGLObject {
}
/**
 * webgl 2.0 API
 * @author feng 2017-01-10
 */
interface WebGL2RenderingContext extends WebGLRenderingContext {
    READ_BUFFER: number;
    UNPACK_ROW_LENGTH: number;
    UNPACK_SKIP_ROWS: number;
    UNPACK_SKIP_PIXELS: number;
    PACK_ROW_LENGTH: number;
    PACK_SKIP_ROWS: number;
    PACK_SKIP_PIXELS: number;
    COLOR: number;
    DEPTH: number;
    STENCIL: number;
    RED: number;
    RGB8: number;
    RGBA8: number;
    RGB10_A2: number;
    TEXTURE_BINDING_3D: number;
    UNPACK_SKIP_IMAGES: number;
    UNPACK_IMAGE_HEIGHT: number;
    TEXTURE_3D: number;
    TEXTURE_WRAP_R: number;
    MAX_3D_TEXTURE_SIZE: number;
    UNSIGNED_INT_2_10_10_10_REV: number;
    MAX_ELEMENTS_VERTICES: number;
    MAX_ELEMENTS_INDICES: number;
    TEXTURE_MIN_LOD: number;
    TEXTURE_MAX_LOD: number;
    TEXTURE_BASE_LEVEL: number;
    TEXTURE_MAX_LEVEL: number;
    MIN: number;
    MAX: number;
    DEPTH_COMPONENT24: number;
    MAX_TEXTURE_LOD_BIAS: number;
    TEXTURE_COMPARE_MODE: number;
    TEXTURE_COMPARE_FUNC: number;
    CURRENT_QUERY: number;
    QUERY_RESULT: number;
    QUERY_RESULT_AVAILABLE: number;
    STREAM_READ: number;
    STREAM_COPY: number;
    STATIC_READ: number;
    STATIC_COPY: number;
    DYNAMIC_READ: number;
    DYNAMIC_COPY: number;
    MAX_DRAW_BUFFERS: number;
    DRAW_BUFFER0: number;
    DRAW_BUFFER1: number;
    DRAW_BUFFER2: number;
    DRAW_BUFFER3: number;
    DRAW_BUFFER4: number;
    DRAW_BUFFER5: number;
    DRAW_BUFFER6: number;
    DRAW_BUFFER7: number;
    DRAW_BUFFER8: number;
    DRAW_BUFFER9: number;
    DRAW_BUFFER10: number;
    DRAW_BUFFER11: number;
    DRAW_BUFFER12: number;
    DRAW_BUFFER13: number;
    DRAW_BUFFER14: number;
    DRAW_BUFFER15: number;
    MAX_FRAGMENT_UNIFORM_COMPONENTS: number;
    MAX_VERTEX_UNIFORM_COMPONENTS: number;
    SAMPLER_3D: number;
    SAMPLER_2D_SHADOW: number;
    FRAGMENT_SHADER_DERIVATIVE_HINT: number;
    PIXEL_PACK_BUFFER: number;
    PIXEL_UNPACK_BUFFER: number;
    PIXEL_PACK_BUFFER_BINDING: number;
    PIXEL_UNPACK_BUFFER_BINDING: number;
    FLOAT_MAT2x3: number;
    FLOAT_MAT2x4: number;
    FLOAT_MAT3x2: number;
    FLOAT_MAT3x4: number;
    FLOAT_MAT4x2: number;
    FLOAT_MAT4x3: number;
    SRGB: number;
    SRGB8: number;
    SRGB8_ALPHA8: number;
    COMPARE_REF_TO_TEXTURE: number;
    RGBA32F: number;
    RGB32F: number;
    RGBA16F: number;
    RGB16F: number;
    VERTEX_ATTRIB_ARRAY_INTEGER: number;
    MAX_ARRAY_TEXTURE_LAYERS: number;
    MIN_PROGRAM_TEXEL_OFFSET: number;
    MAX_PROGRAM_TEXEL_OFFSET: number;
    MAX_VARYING_COMPONENTS: number;
    TEXTURE_2D_ARRAY: number;
    TEXTURE_BINDING_2D_ARRAY: number;
    R11F_G11F_B10F: number;
    UNSIGNED_INT_10F_11F_11F_REV: number;
    RGB9_E5: number;
    UNSIGNED_INT_5_9_9_9_REV: number;
    TRANSFORM_FEEDBACK_BUFFER_MODE: number;
    MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS: number;
    TRANSFORM_FEEDBACK_VARYINGS: number;
    TRANSFORM_FEEDBACK_BUFFER_START: number;
    TRANSFORM_FEEDBACK_BUFFER_SIZE: number;
    TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN: number;
    RASTERIZER_DISCARD: number;
    MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS: number;
    MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS: number;
    INTERLEAVED_ATTRIBS: number;
    SEPARATE_ATTRIBS: number;
    TRANSFORM_FEEDBACK_BUFFER: number;
    TRANSFORM_FEEDBACK_BUFFER_BINDING: number;
    RGBA32UI: number;
    RGB32UI: number;
    RGBA16UI: number;
    RGB16UI: number;
    RGBA8UI: number;
    RGB8UI: number;
    RGBA32I: number;
    RGB32I: number;
    RGBA16I: number;
    RGB16I: number;
    RGBA8I: number;
    RGB8I: number;
    RED_INTEGER: number;
    RGB_INTEGER: number;
    RGBA_INTEGER: number;
    SAMPLER_2D_ARRAY: number;
    SAMPLER_2D_ARRAY_SHADOW: number;
    SAMPLER_CUBE_SHADOW: number;
    UNSIGNED_INT_VEC2: number;
    UNSIGNED_INT_VEC3: number;
    UNSIGNED_INT_VEC4: number;
    INT_SAMPLER_2D: number;
    INT_SAMPLER_3D: number;
    INT_SAMPLER_CUBE: number;
    INT_SAMPLER_2D_ARRAY: number;
    UNSIGNED_INT_SAMPLER_2D: number;
    UNSIGNED_INT_SAMPLER_3D: number;
    UNSIGNED_INT_SAMPLER_CUBE: number;
    UNSIGNED_INT_SAMPLER_2D_ARRAY: number;
    DEPTH_COMPONENT32F: number;
    DEPTH32F_STENCIL8: number;
    FLOAT_32_UNSIGNED_INT_24_8_REV: number;
    FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING: number;
    FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE: number;
    FRAMEBUFFER_ATTACHMENT_RED_SIZE: number;
    FRAMEBUFFER_ATTACHMENT_GREEN_SIZE: number;
    FRAMEBUFFER_ATTACHMENT_BLUE_SIZE: number;
    FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE: number;
    FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE: number;
    FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE: number;
    FRAMEBUFFER_DEFAULT: number;
    DEPTH_STENCIL_ATTACHMENT: number;
    DEPTH_STENCIL: number;
    UNSIGNED_INT_24_8: number;
    DEPTH24_STENCIL8: number;
    UNSIGNED_NORMALIZED: number;
    DRAW_FRAMEBUFFER_BINDING: number;
    READ_FRAMEBUFFER: number;
    DRAW_FRAMEBUFFER: number;
    READ_FRAMEBUFFER_BINDING: number;
    RENDERBUFFER_SAMPLES: number;
    FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER: number;
    MAX_COLOR_ATTACHMENTS: number;
    COLOR_ATTACHMENT1: number;
    COLOR_ATTACHMENT2: number;
    COLOR_ATTACHMENT3: number;
    COLOR_ATTACHMENT4: number;
    COLOR_ATTACHMENT5: number;
    COLOR_ATTACHMENT6: number;
    COLOR_ATTACHMENT7: number;
    COLOR_ATTACHMENT8: number;
    COLOR_ATTACHMENT9: number;
    COLOR_ATTACHMENT10: number;
    COLOR_ATTACHMENT11: number;
    COLOR_ATTACHMENT12: number;
    COLOR_ATTACHMENT13: number;
    COLOR_ATTACHMENT14: number;
    COLOR_ATTACHMENT15: number;
    FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: number;
    MAX_SAMPLES: number;
    HALF_FLOAT: number;
    RG: number;
    RG_INTEGER: number;
    R8: number;
    RG8: number;
    R16F: number;
    R32F: number;
    RG16F: number;
    RG32F: number;
    R8I: number;
    R8UI: number;
    R16I: number;
    R16UI: number;
    R32I: number;
    R32UI: number;
    RG8I: number;
    RG8UI: number;
    RG16I: number;
    RG16UI: number;
    RG32I: number;
    RG32UI: number;
    VERTEX_ARRAY_BINDING: number;
    R8_SNORM: number;
    RG8_SNORM: number;
    RGB8_SNORM: number;
    RGBA8_SNORM: number;
    SIGNED_NORMALIZED: number;
    COPY_READ_BUFFER: number;
    COPY_WRITE_BUFFER: number;
    COPY_READ_BUFFER_BINDING: number;
    COPY_WRITE_BUFFER_BINDING: number;
    UNIFORM_BUFFER: number;
    UNIFORM_BUFFER_BINDING: number;
    UNIFORM_BUFFER_START: number;
    UNIFORM_BUFFER_SIZE: number;
    MAX_VERTEX_UNIFORM_BLOCKS: number;
    MAX_FRAGMENT_UNIFORM_BLOCKS: number;
    MAX_COMBINED_UNIFORM_BLOCKS: number;
    MAX_UNIFORM_BUFFER_BINDINGS: number;
    MAX_UNIFORM_BLOCK_SIZE: number;
    MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: number;
    MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: number;
    UNIFORM_BUFFER_OFFSET_ALIGNMENT: number;
    ACTIVE_UNIFORM_BLOCKS: number;
    UNIFORM_TYPE: number;
    UNIFORM_SIZE: number;
    UNIFORM_BLOCK_INDEX: number;
    UNIFORM_OFFSET: number;
    UNIFORM_ARRAY_STRIDE: number;
    UNIFORM_MATRIX_STRIDE: number;
    UNIFORM_IS_ROW_MAJOR: number;
    UNIFORM_BLOCK_BINDING: number;
    UNIFORM_BLOCK_DATA_SIZE: number;
    UNIFORM_BLOCK_ACTIVE_UNIFORMS: number;
    UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES: number;
    UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER: number;
    UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER: number;
    INVALID_INDEX: number;
    MAX_VERTEX_OUTPUT_COMPONENTS: number;
    MAX_FRAGMENT_INPUT_COMPONENTS: number;
    MAX_SERVER_WAIT_TIMEOUT: number;
    OBJECT_TYPE: number;
    SYNC_CONDITION: number;
    SYNC_STATUS: number;
    SYNC_FLAGS: number;
    SYNC_FENCE: number;
    SYNC_GPU_COMMANDS_COMPLETE: number;
    UNSIGNALED: number;
    SIGNALED: number;
    ALREADY_SIGNALED: number;
    TIMEOUT_EXPIRED: number;
    CONDITION_SATISFIED: number;
    WAIT_FAILED: number;
    SYNC_FLUSH_COMMANDS_BIT: number;
    VERTEX_ATTRIB_ARRAY_DIVISOR: number;
    ANY_SAMPLES_PASSED: number;
    ANY_SAMPLES_PASSED_CONSERVATIVE: number;
    SAMPLER_BINDING: number;
    RGB10_A2UI: number;
    INT_2_10_10_10_REV: number;
    TRANSFORM_FEEDBACK: number;
    TRANSFORM_FEEDBACK_PAUSED: number;
    TRANSFORM_FEEDBACK_ACTIVE: number;
    TRANSFORM_FEEDBACK_BINDING: number;
    TEXTURE_IMMUTABLE_FORMAT: number;
    MAX_ELEMENT_INDEX: number;
    TEXTURE_IMMUTABLE_LEVELS: number;
    TIMEOUT_IGNORED: number;
    MAX_CLIENT_WAIT_TIMEOUT_WEBGL: number;
    bufferData(target: GLenum, srcData: GLsizeiptr | ArrayBuffer | ArrayBufferView, usage: GLenum): any;
    bufferData(target: GLenum, size: GLsizeiptr, usage: GLenum): any;
    bufferData(target: GLenum, srcData: ArrayBuffer, usage: GLenum): any;
    bufferData(target: GLenum, srcData: ArrayBufferView, usage: GLenum): any;
    bufferSubData(target: GLenum, dstByteOffset: GLintptr, srcData: BufferDataSource): any;
    bufferData(target: GLenum, srcData: ArrayBufferView, usage: GLenum, srcOffset: GLuint, length?: GLuint): any;
    bufferSubData(target: GLenum, dstByteOffset: GLintptr, srcData: ArrayBufferView, srcOffset: GLuint, length?: GLuint): any;
    copyBufferSubData(readTarget: GLenum, writeTarget: GLenum, readOffset: GLintptr, writeOffset: GLintptr, size: GLsizeiptr): any;
    getBufferSubData(target: GLenum, srcByteOffset: GLintptr, dstBuffer: ArrayBufferView, dstOffset?: GLuint, length?: GLuint): any;
    blitFramebuffer(srcX0: GLint, srcY0: GLint, srcX1: GLint, srcY1: GLint, dstX0: GLint, dstY0: GLint, dstX1: GLint, dstY1: GLint, mask: GLbitfield, filter: GLenum): any;
    framebufferTextureLayer(target: GLenum, attachment: GLenum, texture: WebGLTexture, level: GLint, layer: GLint): any;
    invalidateFramebuffer(target: GLenum, attachments: GLenum[]): any;
    invalidateSubFramebuffer(target: GLenum, attachments: GLenum[], x: GLint, y: GLint, width: GLsizei, height: GLsizei): any;
    readBuffer(src: GLenum): any;
    getInternalformatParameter(target: GLenum, internalformat: GLenum, pname: GLenum): any;
    renderbufferStorageMultisample(target: GLenum, samples: GLsizei, internalformat: GLenum, width: GLsizei, height: GLsizei): any;
    texStorage2D(target: GLenum, levels: GLsizei, internalformat: GLenum, width: GLsizei, height: GLsizei): any;
    texStorage3D(target: GLenum, levels: GLsizei, internalformat: GLenum, width: GLsizei, height: GLsizei, depth: GLsizei): any;
    texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, pixels: ArrayBufferView): any;
    texImage2D(target: GLenum, level: GLint, internalformat: GLint, format: GLenum, type: GLenum, source: TexImageSource): any;
    texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, pixels: ArrayBufferView): any;
    texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, format: GLenum, type: GLenum, source: TexImageSource): any;
    texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, pboOffset: GLintptr): any;
    texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, source: TexImageSource): any;
    texImage2D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, border: GLint, format: GLenum, type: GLenum, srcData: ArrayBufferView, srcOffset: GLuint): any;
    texImage3D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, format: GLenum, type: GLenum, pboOffset: GLintptr): any;
    texImage3D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, format: GLenum, type: GLenum, source: TexImageSource): any;
    texImage3D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, format: GLenum, type: GLenum, srcData: ArrayBufferView): any;
    texImage3D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, format: GLenum, type: GLenum, srcData: ArrayBufferView, srcOffset: GLuint): any;
    texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, pboOffset: GLintptr): any;
    texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, source: TexImageSource): any;
    texSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, srcData: ArrayBufferView, srcOffset: GLuint): any;
    texSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, type: GLenum, pboOffset: GLintptr): any;
    texSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, type: GLenum, source: TexImageSource): any;
    texSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, type: GLenum, srcData: ArrayBufferView, srcOffset?: GLuint): any;
    copyTexSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, x: GLint, y: GLint, width: GLsizei, height: GLsizei): any;
    compressedTexImage2D(target: GLenum, level: GLint, internalformat: GLenum, width: GLsizei, height: GLsizei, border: GLint, imageSize: GLsizei, offset: GLintptr): any;
    compressedTexImage2D(target: GLenum, level: GLint, internalformat: GLenum, width: GLsizei, height: GLsizei, border: GLint, srcData: ArrayBufferView, srcOffset?: GLuint, srcLengthOverride?: GLuint): any;
    compressedTexImage3D(target: GLenum, level: GLint, internalformat: GLenum, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, imageSize: GLsizei, offset: GLintptr): any;
    compressedTexImage3D(target: GLenum, level: GLint, internalformat: GLenum, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, srcData: ArrayBufferView, srcOffset?: GLuint, srcLengthOverride?: GLuint): any;
    compressedTexSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, imageSize: GLsizei, offset: GLintptr): any;
    compressedTexSubImage2D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, width: GLsizei, height: GLsizei, format: GLenum, srcData: ArrayBufferView, srcOffset?: GLuint, srcLengthOverride?: GLuint): any;
    compressedTexSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, imageSize: GLsizei, offset: GLintptr): any;
    compressedTexSubImage3D(target: GLenum, level: GLint, xoffset: GLint, yoffset: GLint, zoffset: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, format: GLenum, srcData: ArrayBufferView, srcOffset?: GLuint, srcLengthOverride?: GLuint): any;
    getFragDataLocation(program: WebGLProgram, name: DOMString): number;
    uniform1ui(location: WebGLUniformLocation, v0: GLuint): any;
    uniform2ui(location: WebGLUniformLocation, v0: GLuint, v1: GLuint): any;
    uniform3ui(location: WebGLUniformLocation, v0: GLuint, v1: GLuint, v2: GLuint): any;
    uniform4ui(location: WebGLUniformLocation, v0: GLuint, v1: GLuint, v2: GLuint, v3: GLuint): any;
    uniform1fv(location: WebGLUniformLocation, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniform2fv(location: WebGLUniformLocation, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniform3fv(location: WebGLUniformLocation, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniform4fv(location: WebGLUniformLocation, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniform1iv(location: WebGLUniformLocation, data: Int32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniform2iv(location: WebGLUniformLocation, data: Int32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniform3iv(location: WebGLUniformLocation, data: Int32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniform4iv(location: WebGLUniformLocation, data: Int32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniform1uiv(location: WebGLUniformLocation, data: Uint32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniform2uiv(location: WebGLUniformLocation, data: Uint32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniform3uiv(location: WebGLUniformLocation, data: Uint32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniform4uiv(location: WebGLUniformLocation, data: Uint32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniformMatrix2fv(location: WebGLUniformLocation, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniformMatrix3x2fv(location: WebGLUniformLocation, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniformMatrix4x2fv(location: WebGLUniformLocation, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniformMatrix2x3fv(location: WebGLUniformLocation, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniformMatrix3fv(location: WebGLUniformLocation, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniformMatrix4x3fv(location: WebGLUniformLocation, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniformMatrix2x4fv(location: WebGLUniformLocation, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniformMatrix3x4fv(location: WebGLUniformLocation, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    uniformMatrix4fv(location: WebGLUniformLocation, transpose: GLboolean, data: Float32List, srcOffset?: GLuint, srcLength?: GLuint): any;
    vertexAttribI4i(index: GLuint, x: GLint, y: GLint, z: GLint, w: GLint): any;
    vertexAttribI4iv(index: GLuint, values: Int32List): any;
    vertexAttribI4ui(index: GLuint, x: GLuint, y: GLuint, z: GLuint, w: GLuint): any;
    vertexAttribI4uiv(index: GLuint, values: Uint32List): any;
    vertexAttribIPointer(index: GLuint, size: GLint, type: GLenum, stride: GLsizei, offset: GLintptr): any;
    vertexAttribDivisor(index: GLuint, divisor: GLuint): any;
    drawArraysInstanced(mode: GLenum, first: GLint, count: GLsizei, instanceCount: GLsizei): any;
    drawElementsInstanced(mode: GLenum, count: GLsizei, type: GLenum, offset: GLintptr, instanceCount: GLsizei): any;
    drawRangeElements(mode: GLenum, start: GLuint, end: GLuint, count: GLsizei, type: GLenum, offset: GLintptr): any;
    readPixels(x: GLint, y: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, dstData: ArrayBufferView): any;
    readPixels(x: GLint, y: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, offset: GLintptr): any;
    readPixels(x: GLint, y: GLint, width: GLsizei, height: GLsizei, format: GLenum, type: GLenum, dstData: ArrayBufferView, dstOffset: GLuint): any;
    drawBuffers(buffers: GLenum[]): any;
    clearBufferfv(buffer: GLenum, drawbuffer: GLint, values: Float32List, srcOffset?: GLuint): any;
    clearBufferiv(buffer: GLenum, drawbuffer: GLint, values: Int32List, srcOffset?: GLuint): any;
    clearBufferuiv(buffer: GLenum, drawbuffer: GLint, values: Uint32List, srcOffset?: GLuint): any;
    clearBufferfi(buffer: GLenum, drawbuffer: GLint, depth: GLfloat, stencil: GLint): any;
    createQuery(): WebGLQuery;
    deleteQuery(query: WebGLQuery): any;
    isQuery(query: WebGLQuery): GLboolean;
    beginQuery(target: GLenum, query: WebGLQuery): any;
    endQuery(target: GLenum): any;
    getQuery(target: GLenum, pname: GLenum): WebGLQuery;
    getQueryParameter(query: WebGLQuery, pname: GLenum): any;
    createSampler(): WebGLSampler;
    deleteSampler(sampler: WebGLSampler): any;
    isSampler(sampler: WebGLSampler): GLboolean;
    bindSampler(unit: GLuint, sampler: WebGLSampler): any;
    samplerParameteri(sampler: WebGLSampler, pname: GLenum, param: GLint): any;
    samplerParameterf(sampler: WebGLSampler, pname: GLenum, param: GLfloat): any;
    getSamplerParameter(sampler: WebGLSampler, pname: GLenum): any;
    fenceSync(condition: GLenum, flags: GLbitfield): WebGLSync;
    isSync(sync: WebGLSync): GLboolean;
    deleteSync(sync: WebGLSync): any;
    clientWaitSync(sync: WebGLSync, flags: GLbitfield, timeout: GLuint64): GLenum;
    waitSync(sync: WebGLSync, flags: GLbitfield, timeout: GLint64): any;
    getSyncParameter(sync: WebGLSync, pname: GLenum): any;
    createTransformFeedback(): WebGLTransformFeedback;
    deleteTransformFeedback(tf: WebGLTransformFeedback): any;
    isTransformFeedback(tf: WebGLTransformFeedback): GLboolean;
    bindTransformFeedback(target: GLenum, tf: WebGLTransformFeedback): any;
    beginTransformFeedback(primitiveMode: GLenum): any;
    endTransformFeedback(): any;
    transformFeedbackVaryings(program: WebGLProgram, varyings: DOMString[], bufferMode: GLenum): any;
    getTransformFeedbackVarying(program: WebGLProgram, index: GLuint): WebGLActiveInfo;
    pauseTransformFeedback(): any;
    resumeTransformFeedback(): any;
    bindBufferBase(target: GLenum, index: GLuint, buffer: WebGLBuffer): any;
    bindBufferRange(target: GLenum, index: GLuint, buffer: WebGLBuffer, offset: GLintptr, size: GLsizeiptr): any;
    getIndexedParameter(target: GLenum, index: GLuint): any;
    getUniformIndices(program: WebGLProgram, uniformNames: DOMString[]): GLuint[];
    getActiveUniforms(program: WebGLProgram, uniformIndices: GLuint[], pname: GLenum): any;
    getUniformBlockIndex(program: WebGLProgram, uniformBlockName: DOMString): GLuint;
    getActiveUniformBlockParameter(program: WebGLProgram, uniformBlockIndex: GLuint, pname: GLenum): any;
    getActiveUniformBlockName(program: WebGLProgram, uniformBlockIndex: GLuint): DOMString;
    uniformBlockBinding(program: WebGLProgram, uniformBlockIndex: GLuint, uniformBlockBinding: GLuint): any;
    createVertexArray(): WebGLVertexArrayObject;
    deleteVertexArray(vertexArray: WebGLVertexArrayObject): any;
    isVertexArray(vertexArray: WebGLVertexArrayObject): GLboolean;
    bindVertexArray(array: WebGLVertexArrayObject): any;
}
/**
 * webgl 2.0 API
 * @author feng 2017-01-10
 */
declare var WebGL2RenderingContext: {
    prototype: WebGL2RenderingContext;
    new (): WebGL2RenderingContext;
    isSupportIphone: boolean;
    readonly ACTIVE_ATTRIBUTES: number;
    readonly ACTIVE_TEXTURE: number;
    readonly ACTIVE_UNIFORMS: number;
    readonly ALIASED_LINE_WIDTH_RANGE: number;
    readonly ALIASED_POINT_SIZE_RANGE: number;
    readonly ALPHA: number;
    readonly ALPHA_BITS: number;
    readonly ALWAYS: number;
    readonly ARRAY_BUFFER: number;
    readonly ARRAY_BUFFER_BINDING: number;
    readonly ATTACHED_SHADERS: number;
    readonly BACK: number;
    readonly BLEND: number;
    readonly BLEND_COLOR: number;
    readonly BLEND_DST_ALPHA: number;
    readonly BLEND_DST_RGB: number;
    readonly BLEND_EQUATION: number;
    readonly BLEND_EQUATION_ALPHA: number;
    readonly BLEND_EQUATION_RGB: number;
    readonly BLEND_SRC_ALPHA: number;
    readonly BLEND_SRC_RGB: number;
    readonly BLUE_BITS: number;
    readonly BOOL: number;
    readonly BOOL_VEC2: number;
    readonly BOOL_VEC3: number;
    readonly BOOL_VEC4: number;
    readonly BROWSER_DEFAULT_WEBGL: number;
    readonly BUFFER_SIZE: number;
    readonly BUFFER_USAGE: number;
    readonly BYTE: number;
    readonly CCW: number;
    readonly CLAMP_TO_EDGE: number;
    readonly COLOR_ATTACHMENT0: number;
    readonly COLOR_BUFFER_BIT: number;
    readonly COLOR_CLEAR_VALUE: number;
    readonly COLOR_WRITEMASK: number;
    readonly COMPILE_STATUS: number;
    readonly COMPRESSED_TEXTURE_FORMATS: number;
    readonly CONSTANT_ALPHA: number;
    readonly CONSTANT_COLOR: number;
    readonly CONTEXT_LOST_WEBGL: number;
    readonly CULL_FACE: number;
    readonly CULL_FACE_MODE: number;
    readonly CURRENT_PROGRAM: number;
    readonly CURRENT_VERTEX_ATTRIB: number;
    readonly CW: number;
    readonly DECR: number;
    readonly DECR_WRAP: number;
    readonly DELETE_STATUS: number;
    readonly DEPTH_ATTACHMENT: number;
    readonly DEPTH_BITS: number;
    readonly DEPTH_BUFFER_BIT: number;
    readonly DEPTH_CLEAR_VALUE: number;
    readonly DEPTH_COMPONENT: number;
    readonly DEPTH_COMPONENT16: number;
    readonly DEPTH_FUNC: number;
    readonly DEPTH_RANGE: number;
    readonly DEPTH_STENCIL: number;
    readonly DEPTH_STENCIL_ATTACHMENT: number;
    readonly DEPTH_TEST: number;
    readonly DEPTH_WRITEMASK: number;
    readonly DITHER: number;
    readonly DONT_CARE: number;
    readonly DST_ALPHA: number;
    readonly DST_COLOR: number;
    readonly DYNAMIC_DRAW: number;
    readonly ELEMENT_ARRAY_BUFFER: number;
    readonly ELEMENT_ARRAY_BUFFER_BINDING: number;
    readonly EQUAL: number;
    readonly FASTEST: number;
    readonly FLOAT: number;
    readonly FLOAT_MAT2: number;
    readonly FLOAT_MAT3: number;
    readonly FLOAT_MAT4: number;
    readonly FLOAT_VEC2: number;
    readonly FLOAT_VEC3: number;
    readonly FLOAT_VEC4: number;
    readonly FRAGMENT_SHADER: number;
    readonly FRAMEBUFFER: number;
    readonly FRAMEBUFFER_ATTACHMENT_OBJECT_NAME: number;
    readonly FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE: number;
    readonly FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE: number;
    readonly FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL: number;
    readonly FRAMEBUFFER_BINDING: number;
    readonly FRAMEBUFFER_COMPLETE: number;
    readonly FRAMEBUFFER_INCOMPLETE_ATTACHMENT: number;
    readonly FRAMEBUFFER_INCOMPLETE_DIMENSIONS: number;
    readonly FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: number;
    readonly FRAMEBUFFER_UNSUPPORTED: number;
    readonly FRONT: number;
    readonly FRONT_AND_BACK: number;
    readonly FRONT_FACE: number;
    readonly FUNC_ADD: number;
    readonly FUNC_REVERSE_SUBTRACT: number;
    readonly FUNC_SUBTRACT: number;
    readonly GENERATE_MIPMAP_HINT: number;
    readonly GEQUAL: number;
    readonly GREATER: number;
    readonly GREEN_BITS: number;
    readonly HIGH_FLOAT: number;
    readonly HIGH_INT: number;
    readonly IMPLEMENTATION_COLOR_READ_FORMAT: number;
    readonly IMPLEMENTATION_COLOR_READ_TYPE: number;
    readonly INCR: number;
    readonly INCR_WRAP: number;
    readonly INT: number;
    readonly INT_VEC2: number;
    readonly INT_VEC3: number;
    readonly INT_VEC4: number;
    readonly INVALID_ENUM: number;
    readonly INVALID_FRAMEBUFFER_OPERATION: number;
    readonly INVALID_OPERATION: number;
    readonly INVALID_VALUE: number;
    readonly INVERT: number;
    readonly KEEP: number;
    readonly LEQUAL: number;
    readonly LESS: number;
    readonly LINEAR: number;
    readonly LINEAR_MIPMAP_LINEAR: number;
    readonly LINEAR_MIPMAP_NEAREST: number;
    readonly LINES: number;
    readonly LINE_LOOP: number;
    readonly LINE_STRIP: number;
    readonly LINE_WIDTH: number;
    readonly LINK_STATUS: number;
    readonly LOW_FLOAT: number;
    readonly LOW_INT: number;
    readonly LUMINANCE: number;
    readonly LUMINANCE_ALPHA: number;
    readonly MAX_COMBINED_TEXTURE_IMAGE_UNITS: number;
    readonly MAX_CUBE_MAP_TEXTURE_SIZE: number;
    readonly MAX_FRAGMENT_UNIFORM_VECTORS: number;
    readonly MAX_RENDERBUFFER_SIZE: number;
    readonly MAX_TEXTURE_IMAGE_UNITS: number;
    readonly MAX_TEXTURE_SIZE: number;
    readonly MAX_VARYING_VECTORS: number;
    readonly MAX_VERTEX_ATTRIBS: number;
    readonly MAX_VERTEX_TEXTURE_IMAGE_UNITS: number;
    readonly MAX_VERTEX_UNIFORM_VECTORS: number;
    readonly MAX_VIEWPORT_DIMS: number;
    readonly MEDIUM_FLOAT: number;
    readonly MEDIUM_INT: number;
    readonly MIRRORED_REPEAT: number;
    readonly NEAREST: number;
    readonly NEAREST_MIPMAP_LINEAR: number;
    readonly NEAREST_MIPMAP_NEAREST: number;
    readonly NEVER: number;
    readonly NICEST: number;
    readonly NONE: number;
    readonly NOTEQUAL: number;
    readonly NO_ERROR: number;
    readonly ONE: number;
    readonly ONE_MINUS_CONSTANT_ALPHA: number;
    readonly ONE_MINUS_CONSTANT_COLOR: number;
    readonly ONE_MINUS_DST_ALPHA: number;
    readonly ONE_MINUS_DST_COLOR: number;
    readonly ONE_MINUS_SRC_ALPHA: number;
    readonly ONE_MINUS_SRC_COLOR: number;
    readonly OUT_OF_MEMORY: number;
    readonly PACK_ALIGNMENT: number;
    readonly POINTS: number;
    readonly POLYGON_OFFSET_FACTOR: number;
    readonly POLYGON_OFFSET_FILL: number;
    readonly POLYGON_OFFSET_UNITS: number;
    readonly RED_BITS: number;
    readonly RENDERBUFFER: number;
    readonly RENDERBUFFER_ALPHA_SIZE: number;
    readonly RENDERBUFFER_BINDING: number;
    readonly RENDERBUFFER_BLUE_SIZE: number;
    readonly RENDERBUFFER_DEPTH_SIZE: number;
    readonly RENDERBUFFER_GREEN_SIZE: number;
    readonly RENDERBUFFER_HEIGHT: number;
    readonly RENDERBUFFER_INTERNAL_FORMAT: number;
    readonly RENDERBUFFER_RED_SIZE: number;
    readonly RENDERBUFFER_STENCIL_SIZE: number;
    readonly RENDERBUFFER_WIDTH: number;
    readonly RENDERER: number;
    readonly REPEAT: number;
    readonly REPLACE: number;
    readonly RGB: number;
    readonly RGB565: number;
    readonly RGB5_A1: number;
    readonly RGBA: number;
    readonly RGBA4: number;
    readonly SAMPLER_2D: number;
    readonly SAMPLER_CUBE: number;
    readonly SAMPLES: number;
    readonly SAMPLE_ALPHA_TO_COVERAGE: number;
    readonly SAMPLE_BUFFERS: number;
    readonly SAMPLE_COVERAGE: number;
    readonly SAMPLE_COVERAGE_INVERT: number;
    readonly SAMPLE_COVERAGE_VALUE: number;
    readonly SCISSOR_BOX: number;
    readonly SCISSOR_TEST: number;
    readonly SHADER_TYPE: number;
    readonly SHADING_LANGUAGE_VERSION: number;
    readonly SHORT: number;
    readonly SRC_ALPHA: number;
    readonly SRC_ALPHA_SATURATE: number;
    readonly SRC_COLOR: number;
    readonly STATIC_DRAW: number;
    readonly STENCIL_ATTACHMENT: number;
    readonly STENCIL_BACK_FAIL: number;
    readonly STENCIL_BACK_FUNC: number;
    readonly STENCIL_BACK_PASS_DEPTH_FAIL: number;
    readonly STENCIL_BACK_PASS_DEPTH_PASS: number;
    readonly STENCIL_BACK_REF: number;
    readonly STENCIL_BACK_VALUE_MASK: number;
    readonly STENCIL_BACK_WRITEMASK: number;
    readonly STENCIL_BITS: number;
    readonly STENCIL_BUFFER_BIT: number;
    readonly STENCIL_CLEAR_VALUE: number;
    readonly STENCIL_FAIL: number;
    readonly STENCIL_FUNC: number;
    readonly STENCIL_INDEX: number;
    readonly STENCIL_INDEX8: number;
    readonly STENCIL_PASS_DEPTH_FAIL: number;
    readonly STENCIL_PASS_DEPTH_PASS: number;
    readonly STENCIL_REF: number;
    readonly STENCIL_TEST: number;
    readonly STENCIL_VALUE_MASK: number;
    readonly STENCIL_WRITEMASK: number;
    readonly STREAM_DRAW: number;
    readonly SUBPIXEL_BITS: number;
    readonly TEXTURE: number;
    readonly TEXTURE0: number;
    readonly TEXTURE1: number;
    readonly TEXTURE10: number;
    readonly TEXTURE11: number;
    readonly TEXTURE12: number;
    readonly TEXTURE13: number;
    readonly TEXTURE14: number;
    readonly TEXTURE15: number;
    readonly TEXTURE16: number;
    readonly TEXTURE17: number;
    readonly TEXTURE18: number;
    readonly TEXTURE19: number;
    readonly TEXTURE2: number;
    readonly TEXTURE20: number;
    readonly TEXTURE21: number;
    readonly TEXTURE22: number;
    readonly TEXTURE23: number;
    readonly TEXTURE24: number;
    readonly TEXTURE25: number;
    readonly TEXTURE26: number;
    readonly TEXTURE27: number;
    readonly TEXTURE28: number;
    readonly TEXTURE29: number;
    readonly TEXTURE3: number;
    readonly TEXTURE30: number;
    readonly TEXTURE31: number;
    readonly TEXTURE4: number;
    readonly TEXTURE5: number;
    readonly TEXTURE6: number;
    readonly TEXTURE7: number;
    readonly TEXTURE8: number;
    readonly TEXTURE9: number;
    readonly TEXTURE_2D: number;
    readonly TEXTURE_BINDING_2D: number;
    readonly TEXTURE_BINDING_CUBE_MAP: number;
    readonly TEXTURE_CUBE_MAP: number;
    readonly TEXTURE_CUBE_MAP_NEGATIVE_X: number;
    readonly TEXTURE_CUBE_MAP_NEGATIVE_Y: number;
    readonly TEXTURE_CUBE_MAP_NEGATIVE_Z: number;
    readonly TEXTURE_CUBE_MAP_POSITIVE_X: number;
    readonly TEXTURE_CUBE_MAP_POSITIVE_Y: number;
    readonly TEXTURE_CUBE_MAP_POSITIVE_Z: number;
    readonly TEXTURE_MAG_FILTER: number;
    readonly TEXTURE_MIN_FILTER: number;
    readonly TEXTURE_WRAP_S: number;
    readonly TEXTURE_WRAP_T: number;
    readonly TRIANGLES: number;
    readonly TRIANGLE_FAN: number;
    readonly TRIANGLE_STRIP: number;
    readonly UNPACK_ALIGNMENT: number;
    readonly UNPACK_COLORSPACE_CONVERSION_WEBGL: number;
    readonly UNPACK_FLIP_Y_WEBGL: number;
    readonly UNPACK_PREMULTIPLY_ALPHA_WEBGL: number;
    readonly UNSIGNED_BYTE: number;
    readonly UNSIGNED_INT: number;
    readonly UNSIGNED_SHORT: number;
    readonly UNSIGNED_SHORT_4_4_4_4: number;
    readonly UNSIGNED_SHORT_5_5_5_1: number;
    readonly UNSIGNED_SHORT_5_6_5: number;
    readonly VALIDATE_STATUS: number;
    readonly VENDOR: number;
    readonly VERSION: number;
    readonly VERTEX_ATTRIB_ARRAY_BUFFER_BINDING: number;
    readonly VERTEX_ATTRIB_ARRAY_ENABLED: number;
    readonly VERTEX_ATTRIB_ARRAY_NORMALIZED: number;
    readonly VERTEX_ATTRIB_ARRAY_POINTER: number;
    readonly VERTEX_ATTRIB_ARRAY_SIZE: number;
    readonly VERTEX_ATTRIB_ARRAY_STRIDE: number;
    readonly VERTEX_ATTRIB_ARRAY_TYPE: number;
    readonly VERTEX_SHADER: number;
    readonly VIEWPORT: number;
    readonly ZERO: number;
    readonly READ_BUFFER: number;
    readonly UNPACK_ROW_LENGTH: number;
    readonly UNPACK_SKIP_ROWS: number;
    readonly UNPACK_SKIP_PIXELS: number;
    readonly PACK_ROW_LENGTH: number;
    readonly PACK_SKIP_ROWS: number;
    readonly PACK_SKIP_PIXELS: number;
    readonly COLOR: number;
    readonly DEPTH: number;
    readonly STENCIL: number;
    readonly RED: number;
    readonly RGB8: number;
    readonly RGBA8: number;
    readonly RGB10_A2: number;
    readonly TEXTURE_BINDING_3D: number;
    readonly UNPACK_SKIP_IMAGES: number;
    readonly UNPACK_IMAGE_HEIGHT: number;
    readonly TEXTURE_3D: number;
    readonly TEXTURE_WRAP_R: number;
    readonly MAX_3D_TEXTURE_SIZE: number;
    readonly UNSIGNED_INT_2_10_10_10_REV: number;
    readonly MAX_ELEMENTS_VERTICES: number;
    readonly MAX_ELEMENTS_INDICES: number;
    readonly TEXTURE_MIN_LOD: number;
    readonly TEXTURE_MAX_LOD: number;
    readonly TEXTURE_BASE_LEVEL: number;
    readonly TEXTURE_MAX_LEVEL: number;
    readonly MIN: number;
    readonly MAX: number;
    readonly DEPTH_COMPONENT24: number;
    readonly MAX_TEXTURE_LOD_BIAS: number;
    readonly TEXTURE_COMPARE_MODE: number;
    readonly TEXTURE_COMPARE_FUNC: number;
    readonly CURRENT_QUERY: number;
    readonly QUERY_RESULT: number;
    readonly QUERY_RESULT_AVAILABLE: number;
    readonly STREAM_READ: number;
    readonly STREAM_COPY: number;
    readonly STATIC_READ: number;
    readonly STATIC_COPY: number;
    readonly DYNAMIC_READ: number;
    readonly DYNAMIC_COPY: number;
    readonly MAX_DRAW_BUFFERS: number;
    readonly DRAW_BUFFER0: number;
    readonly DRAW_BUFFER1: number;
    readonly DRAW_BUFFER2: number;
    readonly DRAW_BUFFER3: number;
    readonly DRAW_BUFFER4: number;
    readonly DRAW_BUFFER5: number;
    readonly DRAW_BUFFER6: number;
    readonly DRAW_BUFFER7: number;
    readonly DRAW_BUFFER8: number;
    readonly DRAW_BUFFER9: number;
    readonly DRAW_BUFFER10: number;
    readonly DRAW_BUFFER11: number;
    readonly DRAW_BUFFER12: number;
    readonly DRAW_BUFFER13: number;
    readonly DRAW_BUFFER14: number;
    readonly DRAW_BUFFER15: number;
    readonly MAX_FRAGMENT_UNIFORM_COMPONENTS: number;
    readonly MAX_VERTEX_UNIFORM_COMPONENTS: number;
    readonly SAMPLER_3D: number;
    readonly SAMPLER_2D_SHADOW: number;
    readonly FRAGMENT_SHADER_DERIVATIVE_HINT: number;
    readonly PIXEL_PACK_BUFFER: number;
    readonly PIXEL_UNPACK_BUFFER: number;
    readonly PIXEL_PACK_BUFFER_BINDING: number;
    readonly PIXEL_UNPACK_BUFFER_BINDING: number;
    readonly FLOAT_MAT2x3: number;
    readonly FLOAT_MAT2x4: number;
    readonly FLOAT_MAT3x2: number;
    readonly FLOAT_MAT3x4: number;
    readonly FLOAT_MAT4x2: number;
    readonly FLOAT_MAT4x3: number;
    readonly SRGB: number;
    readonly SRGB8: number;
    readonly SRGB8_ALPHA8: number;
    readonly COMPARE_REF_TO_TEXTURE: number;
    readonly RGBA32F: number;
    readonly RGB32F: number;
    readonly RGBA16F: number;
    readonly RGB16F: number;
    readonly VERTEX_ATTRIB_ARRAY_INTEGER: number;
    readonly MAX_ARRAY_TEXTURE_LAYERS: number;
    readonly MIN_PROGRAM_TEXEL_OFFSET: number;
    readonly MAX_PROGRAM_TEXEL_OFFSET: number;
    readonly MAX_VARYING_COMPONENTS: number;
    readonly TEXTURE_2D_ARRAY: number;
    readonly TEXTURE_BINDING_2D_ARRAY: number;
    readonly R11F_G11F_B10F: number;
    readonly UNSIGNED_INT_10F_11F_11F_REV: number;
    readonly RGB9_E5: number;
    readonly UNSIGNED_INT_5_9_9_9_REV: number;
    readonly TRANSFORM_FEEDBACK_BUFFER_MODE: number;
    readonly MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS: number;
    readonly TRANSFORM_FEEDBACK_VARYINGS: number;
    readonly TRANSFORM_FEEDBACK_BUFFER_START: number;
    readonly TRANSFORM_FEEDBACK_BUFFER_SIZE: number;
    readonly TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN: number;
    readonly RASTERIZER_DISCARD: number;
    readonly MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS: number;
    readonly MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS: number;
    readonly INTERLEAVED_ATTRIBS: number;
    readonly SEPARATE_ATTRIBS: number;
    readonly TRANSFORM_FEEDBACK_BUFFER: number;
    readonly TRANSFORM_FEEDBACK_BUFFER_BINDING: number;
    readonly RGBA32UI: number;
    readonly RGB32UI: number;
    readonly RGBA16UI: number;
    readonly RGB16UI: number;
    readonly RGBA8UI: number;
    readonly RGB8UI: number;
    readonly RGBA32I: number;
    readonly RGB32I: number;
    readonly RGBA16I: number;
    readonly RGB16I: number;
    readonly RGBA8I: number;
    readonly RGB8I: number;
    readonly RED_INTEGER: number;
    readonly RGB_INTEGER: number;
    readonly RGBA_INTEGER: number;
    readonly SAMPLER_2D_ARRAY: number;
    readonly SAMPLER_2D_ARRAY_SHADOW: number;
    readonly SAMPLER_CUBE_SHADOW: number;
    readonly UNSIGNED_INT_VEC2: number;
    readonly UNSIGNED_INT_VEC3: number;
    readonly UNSIGNED_INT_VEC4: number;
    readonly INT_SAMPLER_2D: number;
    readonly INT_SAMPLER_3D: number;
    readonly INT_SAMPLER_CUBE: number;
    readonly INT_SAMPLER_2D_ARRAY: number;
    readonly UNSIGNED_INT_SAMPLER_2D: number;
    readonly UNSIGNED_INT_SAMPLER_3D: number;
    readonly UNSIGNED_INT_SAMPLER_CUBE: number;
    readonly UNSIGNED_INT_SAMPLER_2D_ARRAY: number;
    readonly DEPTH_COMPONENT32F: number;
    readonly DEPTH32F_STENCIL8: number;
    readonly FLOAT_32_UNSIGNED_INT_24_8_REV: number;
    readonly FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING: number;
    readonly FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE: number;
    readonly FRAMEBUFFER_ATTACHMENT_RED_SIZE: number;
    readonly FRAMEBUFFER_ATTACHMENT_GREEN_SIZE: number;
    readonly FRAMEBUFFER_ATTACHMENT_BLUE_SIZE: number;
    readonly FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE: number;
    readonly FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE: number;
    readonly FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE: number;
    readonly FRAMEBUFFER_DEFAULT: number;
    readonly UNSIGNED_INT_24_8: number;
    readonly DEPTH24_STENCIL8: number;
    readonly UNSIGNED_NORMALIZED: number;
    readonly DRAW_FRAMEBUFFER_BINDING: number;
    readonly READ_FRAMEBUFFER: number;
    readonly DRAW_FRAMEBUFFER: number;
    readonly READ_FRAMEBUFFER_BINDING: number;
    readonly RENDERBUFFER_SAMPLES: number;
    readonly FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER: number;
    readonly MAX_COLOR_ATTACHMENTS: number;
    readonly COLOR_ATTACHMENT1: number;
    readonly COLOR_ATTACHMENT2: number;
    readonly COLOR_ATTACHMENT3: number;
    readonly COLOR_ATTACHMENT4: number;
    readonly COLOR_ATTACHMENT5: number;
    readonly COLOR_ATTACHMENT6: number;
    readonly COLOR_ATTACHMENT7: number;
    readonly COLOR_ATTACHMENT8: number;
    readonly COLOR_ATTACHMENT9: number;
    readonly COLOR_ATTACHMENT10: number;
    readonly COLOR_ATTACHMENT11: number;
    readonly COLOR_ATTACHMENT12: number;
    readonly COLOR_ATTACHMENT15: number;
    readonly FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: number;
    readonly MAX_SAMPLES: number;
    readonly HALF_FLOAT: number;
    readonly RG: number;
    readonly RG_INTEGER: number;
    readonly R8: number;
    readonly RG8: number;
    readonly R16F: number;
    readonly R32F: number;
    readonly RG16F: number;
    readonly RG32F: number;
    readonly R8I: number;
    readonly R8UI: number;
    readonly R16I: number;
    readonly R16UI: number;
    readonly R32I: number;
    readonly R32UI: number;
    readonly RG8I: number;
    readonly RG8UI: number;
    readonly RG16I: number;
    readonly RG16UI: number;
    readonly RG32I: number;
    readonly RG32UI: number;
    readonly VERTEX_ARRAY_BINDING: number;
    readonly R8_SNORM: number;
    readonly RG8_SNORM: number;
    readonly RGB8_SNORM: number;
    readonly RGBA8_SNORM: number;
    readonly SIGNED_NORMALIZED: number;
    readonly COPY_READ_BUFFER: number;
    readonly COPY_WRITE_BUFFER: number;
    readonly COPY_READ_BUFFER_BINDING: number;
    readonly COPY_WRITE_BUFFER_BINDING: number;
    readonly UNIFORM_BUFFER: number;
    readonly UNIFORM_BUFFER_BINDING: number;
    readonly UNIFORM_BUFFER_START: number;
    readonly UNIFORM_BUFFER_SIZE: number;
    readonly MAX_VERTEX_UNIFORM_BLOCKS: number;
    readonly MAX_FRAGMENT_UNIFORM_BLOCKS: number;
    readonly MAX_COMBINED_UNIFORM_BLOCKS: number;
    readonly MAX_UNIFORM_BUFFER_BINDINGS: number;
    readonly MAX_UNIFORM_BLOCK_SIZE: number;
    readonly MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: number;
    readonly MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: number;
    readonly UNIFORM_BUFFER_OFFSET_ALIGNMENT: number;
    readonly ACTIVE_UNIFORM_BLOCKS: number;
    readonly UNIFORM_TYPE: number;
    readonly UNIFORM_SIZE: number;
    readonly UNIFORM_BLOCK_INDEX: number;
    readonly UNIFORM_OFFSET: number;
    readonly UNIFORM_ARRAY_STRIDE: number;
    readonly UNIFORM_MATRIX_STRIDE: number;
    readonly UNIFORM_IS_ROW_MAJOR: number;
    readonly UNIFORM_BLOCK_BINDING: number;
    readonly UNIFORM_BLOCK_DATA_SIZE: number;
    readonly UNIFORM_BLOCK_ACTIVE_UNIFORMS: number;
    readonly UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES: number;
    readonly UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER: number;
    readonly UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER: number;
    readonly INVALID_INDEX: number;
    readonly MAX_VERTEX_OUTPUT_COMPONENTS: number;
    readonly MAX_FRAGMENT_INPUT_COMPONENTS: number;
    readonly MAX_SERVER_WAIT_TIMEOUT: number;
    readonly OBJECT_TYPE: number;
    readonly SYNC_CONDITION: number;
    readonly SYNC_STATUS: number;
    readonly SYNC_FLAGS: number;
    readonly SYNC_FENCE: number;
    readonly SYNC_GPU_COMMANDS_COMPLETE: number;
    readonly UNSIGNALED: number;
    readonly SIGNALED: number;
    readonly ALREADY_SIGNALED: number;
    readonly TIMEOUT_EXPIRED: number;
    readonly CONDITION_SATISFIED: number;
    readonly WAIT_FAILED: number;
    readonly SYNC_FLUSH_COMMANDS_BIT: number;
    readonly VERTEX_ATTRIB_ARRAY_DIVISOR: number;
    readonly ANY_SAMPLES_PASSED: number;
    readonly ANY_SAMPLES_PASSED_CONSERVATIVE: number;
    readonly SAMPLER_BINDING: number;
    readonly RGB10_A2UI: number;
    readonly INT_2_10_10_10_REV: number;
    readonly TRANSFORM_FEEDBACK: number;
    readonly TRANSFORM_FEEDBACK_PAUSED: number;
    readonly TRANSFORM_FEEDBACK_ACTIVE: number;
    readonly TRANSFORM_FEEDBACK_BINDING: number;
    readonly TEXTURE_IMMUTABLE_FORMAT: number;
    readonly MAX_ELEMENT_INDEX: number;
    readonly TEXTURE_IMMUTABLE_LEVELS: number;
    readonly TIMEOUT_IGNORED: number;
    readonly MAX_CLIENT_WAIT_TIMEOUT_WEBGL: number;
};
/**
 * WebGL渲染程序
 */
interface WebGLProgram {
    /**
     * WebGL渲染上下文
     */
    gl: WebGLRenderingContext;
    /**
     * 顶点shader
     */
    vertexShader: WebGLShader;
    /**
     * 片段shader
     */
    fragmentShader: WebGLShader;
    /**
     * 属性信息列表
     */
    attributes: {
        [name: string]: WebGLActiveInfo;
    };
    /**
     * uniform信息列表
     */
    uniforms: {
        [name: string]: WebGLActiveInfo;
    };
    /**
     * 销毁
     */
    destroy(): any;
}
/**
 * WebGL渲染程序有效信息
 */
interface WebGLActiveInfo {
    /**
     * 属性地址
     */
    location: number;
    /**
     * uniform基础名称，例如 arr[10] 基础名称为 arr
     */
    uniformBaseName: string;
    /**
     * uniform地址
     */
    uniformLocation: WebGLUniformLocation | WebGLUniformLocation[];
    /**
     * texture索引
     */
    textureID: number;
}
interface WebGLRenderingContext {
    /**
     * Create the linked program object
     * @param gl GL context
     * @param vshader a vertex shader program (string)
     * @param fshader a fragment shader program (string)
     * @return created program object, or null if the creation has failed
     */
    createProgram(vshader: string, fshader: string): WebGLProgram;
}
declare namespace feng3d {
    interface GL extends WebGLRenderingContext {
        /**
         * 是否为 WebGL2
         */
        webgl2: boolean;
        /**
         * 上下文属性
         */
        contextAttributes: WebGLContextAttributes | undefined;
        /**
         * 上下文名称
         */
        contextId: string;
        /**
         * GL 扩展
         */
        extensions: GLExtension;
        /**
         * 渲染器
         */
        renderer: Renderer;
        /**
         * WebWG2.0 或者 扩展功能
         */
        advanced: GLAdvanced;
    }
    class GL {
        static glList: GL[];
        /**
         * 获取 GL 实例
         * @param canvas 画布
         * @param contextAttributes
         */
        static getGL(canvas: HTMLCanvasElement, contextAttributes?: WebGLContextAttributes): GL;
        private static _toolGL;
        static getToolGL(): GL;
    }
}
declare namespace feng3d {
    /**
     * WebWG2.0 或者 扩展功能
     */
    class GLAdvanced {
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawElementsInstanced
         */
        drawElementsInstanced: (mode: GLenum, count: GLsizei, type: GLenum, offset: GLintptr, instanceCount: GLsizei) => void;
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/vertexAttribDivisor
         */
        vertexAttribDivisor: (index: GLuint, divisor: GLuint) => void;
        /**
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawArraysInstanced
         */
        drawArraysInstanced: (mode: GLenum, first: GLint, count: GLsizei, instanceCount: GLsizei) => void;
        constructor(gl: GL);
    }
}
interface EXTTextureFilterAnisotropic {
    /**
     * 纹理各向异性过滤最大值
     */
    maxAnisotropy: number;
    /**
     * 设置纹理各向异性 值
     */
    texParameterf(textureType: number, anisotropy: number): void;
}
declare namespace feng3d {
    /**
     * GL扩展
     */
    class GLExtension {
        aNGLEInstancedArrays: ANGLEInstancedArrays;
        eXTBlendMinMax: EXTBlendMinMax;
        eXTColorBufferHalfFloat: EXTColorBufferHalfFloat;
        eXTFragDepth: EXTFragDepth;
        eXTsRGB: EXTsRGB;
        eXTShaderTextureLOD: EXTShaderTextureLOD;
        eXTTextureFilterAnisotropic: EXTTextureFilterAnisotropic;
        oESElementIndexUint: OESElementIndexUint;
        oESStandardDerivatives: OESStandardDerivatives;
        oESTextureFloat: OESTextureFloat;
        oESTextureFloatLinear: OESTextureFloatLinear;
        oESTextureHalfFloat: OESTextureHalfFloat;
        oESTextureHalfFloatLinear: OESTextureHalfFloatLinear;
        oESVertexArrayObject: OESVertexArrayObject;
        webGLColorBufferFloat: WebGLColorBufferFloat;
        webGLCompressedTextureATC: WebGLCompressedTextureATC;
        webGLCompressedTextureETC1: WebGLCompressedTextureETC1;
        webGLCompressedTexturePVRTC: WebGLCompressedTexturePVRTC;
        webGLCompressedTextureS3TC: WebGLCompressedTextureS3TC;
        webGLDebugRendererInfo: WebGLDebugRendererInfo;
        webGLDebugShaders: WebGLDebugShaders;
        webGLDepthTexture: WebGLDepthTexture;
        webGLDrawBuffers: WebGLDrawBuffers;
        webGLLoseContext: WebGLLoseContext;
        constructor(gl: GL);
        private initExtensions(gl);
        /**
         * 缓存GL查询
         * @param gl GL实例
         */
        private cacheGLQuery(gl);
    }
}
declare namespace feng3d {
    class GLProgramExtension {
        constructor(gl: GL);
    }
}
/**
 * @author mrdoob / http://mrdoob.com/
 */
declare namespace feng3d {
    /**
     * WEBGL 功能
     */
    class WebGLCapabilities {
        getMaxAnisotropy: () => any;
        getMaxPrecision: (precision: any) => "highp" | "mediump" | "lowp";
        precision: any;
        logarithmicDepthBuffer: boolean;
        maxTextures: any;
        maxVertexTextures: any;
        maxTextureSize: any;
        maxCubemapSize: any;
        maxAttributes: any;
        maxVertexUniforms: any;
        maxVaryings: any;
        maxFragmentUniforms: any;
        vertexTextures: boolean;
        floatFragmentTextures: boolean;
        floatVertexTextures: boolean;
        constructor(gl: any, extensions: any, parameters: any);
    }
}
declare namespace feng3d {
    type Lazy<T> = T | (() => T);
    var lazy: {
        getvalue: <T>(lazyItem: Lazy<T>) => T;
    };
    type LazyObject<T> = {
        [P in keyof T]: Lazy<T[P]>;
    };
    type LazyUniforms = LazyObject<Uniforms>;
    interface Uniforms {
        /**
         * 模型矩阵
         */
        u_modelMatrix: Matrix4x4;
        /**
         * （view矩阵）摄像机逆矩阵
         */
        u_viewMatrix: Matrix4x4;
        /**
         * 投影矩阵
         */
        u_projectionMatrix: Matrix4x4;
        /**
         * 摄像机矩阵
         */
        u_cameraMatrix: Matrix4x4;
        /**
         * 模型-摄像机 矩阵
         */
        u_mvMatrix: Matrix4x4;
        /**
         * 模型逆转置矩阵,用于计算全局法线
         * 参考：http://blog.csdn.net/christina123y/article/details/5963679
         */
        u_ITModelMatrix: Matrix4x4;
        /**
         * 模型-摄像机 逆转置矩阵，用于计算摄像机空间法线
         */
        u_ITMVMatrix: Matrix4x4;
        /**
         * 世界投影矩阵
         */
        u_viewProjection: Matrix4x4;
        u_diffuseInput: Color4;
        /**
         * 透明阈值，用于透明检测
         */
        u_alphaThreshold: number;
        /**
         * 漫反射贴图
         */
        s_texture: TextureInfo;
        /**
         * 漫反射贴图
         */
        s_diffuse: Texture2D;
        /**
         * 环境贴图
         */
        s_ambient: Texture2D;
        /**
         * 法线贴图
         */
        s_normal: Texture2D;
        /**
         * 镜面反射光泽图
         */
        s_specular: Texture2D;
        /**
         * 天空盒纹理
         */
        s_skyboxTexture: TextureCube;
        /**
         * 天空盒尺寸
         */
        u_skyBoxSize: number;
        /**
         * 地形混合贴图
         */
        s_blendTexture: Texture2D;
        /**
         * 地形块贴图1
         */
        s_splatTexture1: Texture2D;
        /**
         * 地形块贴图2
         */
        s_splatTexture2: Texture2D;
        /**
         * 地形块贴图3
         */
        s_splatTexture3: Texture2D;
        /**
         * 地形块混合贴图
         */
        s_splatMergeTexture: Texture2D;
        /**
         * 地形块重复次数
         */
        u_splatRepeats: Vector4;
        /**
         * 地形混合贴图尺寸
         */
        u_splatMergeTextureSize: Vector2;
        /**
         * 图片尺寸
         */
        u_imageSize: Vector2;
        /**
         * 地形块尺寸
         */
        u_tileSize: Vector2;
        /**
         * 地形块偏移
         */
        u_tileOffset: Vector4[];
        /**
         * 最大lod
         */
        u_maxLod: number;
        /**
         * uv与坐标比
         */
        u_uvPositionScale: number;
        /**
         * lod0时在贴图中的uv缩放偏移向量
         */
        u_lod0vec: Vector4;
        /******************************************************/
        /******************************************************/
        /**
         * 点光源位置数组
         */
        u_pointLightPositions: Vector3[];
        /**
         * 点光源颜色数组
         */
        u_pointLightColors: Color3[];
        /**
         * 点光源光照强度数组
         */
        u_pointLightIntensitys: number[];
        /**
         * 点光源光照范围数组
         */
        u_pointLightRanges: number[];
        /******************************************************/
        /******************************************************/
        /**
         * 方向光源方向数组
         */
        u_directionalLightDirections: Vector3[];
        /**
         * 方向光源颜色数组
         */
        u_directionalLightColors: Color3[];
        /**
         * 方向光源光照强度数组
         */
        u_directionalLightIntensitys: number[];
        /**
         * 场景环境光
         */
        u_sceneAmbientColor: Color4;
        /**
         * 基本颜色
         */
        u_diffuse: Color4;
        /**
         * 镜面反射颜色
         */
        u_specular: Color3;
        /**
         * 环境颜色
         */
        u_ambient: Color4;
        /**
         * 高光系数
         */
        u_glossiness: number;
        /**
         * 反射率
         */
        u_reflectance: number;
        /**
         * 粗糙度
         */
        u_roughness: number;
        /**
         * 金属度
         */
        u_metalic: number;
        /**
         * 粒子时间
         */
        u_particleTime: number;
        /**
         * 点大小
         */
        u_PointSize: number;
        /**
         * 骨骼全局矩阵
         */
        u_skeletonGlobalMatriices: Matrix4x4[];
        /**
         * 3D对象编号
         */
        u_objectID: number;
        /**
         * 雾颜色
         */
        u_fogColor: Color3;
        /**
         * 雾最近距离
         */
        u_fogMinDistance: number;
        /**
         * 雾最远距离
         */
        u_fogMaxDistance: number;
        /**
         * 雾浓度
         */
        u_fogDensity: number;
        /**
         * 雾模式
         */
        u_fogMode: number;
        /**
         * 环境反射纹理
         */
        s_envMap: TextureCube;
        /**
         * 反射率
         */
        u_reflectivity: number;
        /**
         * 单位深度映射到屏幕像素值
         */
        u_scaleByDepth: number;
        /**
         * 线框颜色
         */
        u_wireframeColor: Color4;
    }
}
declare namespace feng3d {
    /**
     * shader
     */
    class Shader {
        private vertex;
        private fragment;
        constructor(vertex: string, fragment: string);
        /**
         * 激活渲染程序
         */
        activeShaderProgram(gl: GL): WebGLProgram;
        /**
         * 纹理缓冲
         */
        protected _webGLProgramMap: Map<GL, WebGLProgram>;
        private clear();
    }
}
declare namespace feng3d {
    /**
     * 渲染参数
     * @author feng 2016-12-14
     */
    class RenderParams {
        /**
        * 渲染模式，默认RenderMode.TRIANGLES
        */
        renderMode: RenderMode;
        /**
         * 剔除面
         * 参考：http://www.jianshu.com/p/ee04165f2a02
         * 默认情况下，逆时针的顶点连接顺序被定义为三角形的正面。
         * 使用gl.frontFace(gl.CW);调整顺时针为正面
         */
        cullFace: CullFace;
        frontFace: FrontFace;
        /**
         * 是否开启混合
         * <混合后的颜色> = <源颜色>*sfactor + <目标颜色>*dfactor
         */
        enableBlend: boolean;
        /**
         * 混合方程，默认BlendEquation.FUNC_ADD
         */
        blendEquation: BlendEquation;
        /**
         * 源混合因子，默认BlendFactor.SRC_ALPHA
         */
        sfactor: BlendFactor;
        /**
         * 目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA
         */
        dfactor: BlendFactor;
        /**
         * 是否开启深度检查
         */
        depthtest: boolean;
        /**
         * 是否开启深度标记
         */
        depthMask: boolean;
        depthFunc: DepthFunc;
        /**
         * 绘制在画布上的区域
         */
        viewRect: Rectangle;
        /**
         * 是否使用 viewRect
         */
        useViewRect: boolean;
        constructor(raw?: Partial<RenderParams>);
    }
}
declare namespace feng3d {
    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     * @author feng 2016-06-20
     */
    class RenderAtomic {
        /**
         * 顶点索引缓冲
         */
        indexBuffer: Index;
        /**
         * 属性数据列表
         */
        attributes: Attributes;
        /**
         * Uniform渲染数据
         */
        uniforms: LazyUniforms;
        /**
         * 渲染实例数量
         */
        instanceCount: Lazy<number>;
        /**
         * 渲染程序
         */
        shader: Shader;
        /**
         * 渲染参数
         */
        renderParams: RenderParams;
        constructor();
    }
}
declare namespace feng3d {
    /**
     * 索引渲染数据
     * @author feng 2017-01-04
     */
    class Index {
        /**
         * 索引数据
         */
        indices: number[];
        private _indices;
        /**
         * 渲染数量
         */
        readonly count: number;
        /**
         * 数据类型，gl.UNSIGNED_BYTE、gl.UNSIGNED_SHORT
         */
        type: GLArrayType;
        /**
         * 索引偏移
         */
        offset: number;
        /**
         * 缓冲
         */
        private _indexBufferMap;
        /**
         * 是否失效
         */
        invalid: boolean;
        /**
         * 激活缓冲
         * @param gl
         */
        active(gl: GL): void;
        /**
         * 获取缓冲
         */
        private getBuffer(gl);
        /**
         * 清理缓冲
         */
        private clear();
    }
}
declare namespace feng3d {
    interface Attributes {
        /**
         * 坐标
         */
        a_position: Attribute;
        /**
         * 颜色
         */
        a_color: Attribute;
        /**
         * 法线
         */
        a_normal: Attribute;
        /**
         * 切线
         */
        a_tangent: Attribute;
        /**
         * uv（纹理坐标）
         */
        a_uv: Attribute;
        /**
         * 关节索引
         */
        a_jointindex0: Attribute;
        /**
         * 关节权重
         */
        a_jointweight0: Attribute;
        /**
         * 关节索引
         */
        a_jointindex1: Attribute;
        /**
         * 关节权重
         */
        a_jointweight1: Attribute;
    }
    /**
     * 属性渲染数据
     * @author feng 2014-8-14
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer}
     */
    class Attribute {
        name: string;
        /**
         * 属性数据
         */
        data: number[];
        /**
         * 数据尺寸
         *
         * A GLint specifying the number of components per vertex attribute. Must be 1, 2, 3, or 4.
         */
        size: number;
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
        type: GLArrayType;
        /**
         * A GLboolean specifying whether integer data values should be normalized when being casted to a float.
              -  If true, signed integers are normalized to [-1, 1].
              -  If true, unsigned integers are normalized to [0, 1].
              -  For types gl.FLOAT and gl.HALF_FLOAT, this parameter has no effect.
         */
        normalized: boolean;
        /**
         * A GLsizei specifying the offset in bytes between the beginning of consecutive vertex attributes. Cannot be larger than 255.
         */
        stride: number;
        /**
         * A GLintptr specifying an offset in bytes of the first component in the vertex attribute array. Must be a multiple of type.
         */
        offset: number;
        /**
         * drawElementsInstanced时将会用到的因子，表示divisor个geometry共用一个数据
         *
         * A GLuint specifying the number of instances that will pass between updates of the generic attribute.
         * @see https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays/vertexAttribDivisorANGLE
         */
        divisor: number;
        /**
         * 是否失效
         */
        invalid: boolean;
        /**
         * 顶点数据缓冲
         */
        private _indexBufferMap;
        constructor(name: string, data: number[], size?: number, divisor?: number);
        /**
         *
         * @param gl
         * @param location A GLuint specifying the index of the vertex attribute that is to be modified.
         */
        active(gl: GL, location: number): void;
        private invalidate();
        /**
         * 获取缓冲
         */
        private getBuffer(gl);
        /**
         * 清理缓冲
         */
        private clear();
    }
}
declare namespace feng3d {
    interface TextureInfoRaw {
        /**
         * 各向异性过滤。使用各向异性过滤能够使纹理的效果更好，但是会消耗更多的内存、CPU、GPU时间。默认为0。
         */
        anisotropy?: number;
        /**
         * 对图像进行Y轴反转。默认值为false
         */
        flipY?: boolean;
        /**
         * 格式
         */
        format?: TextureFormat;
        /**
         * 是否生成mipmap
         */
        generateMipmap?: boolean;
        magFilter?: TextureMagFilter;
        minFilter?: TextureMinFilter;
        premulAlpha?: boolean;
        type?: TextureDataType;
        /**
         * 表示x轴的纹理的回环方式，就是当纹理的宽度小于需要贴图的平面的宽度的时候，平面剩下的部分应该p以何种方式贴图的问题。
         */
        wrapS?: TextureWrap;
        /**
         * 表示y轴的纹理回环方式。 magFilter和minFilter表示过滤的方式，这是OpenGL的基本概念，我将在下面讲一下，目前你不用担心它的使用。当您不设置的时候，它会取默认值，所以，我们这里暂时不理睬他。
         */
        wrapT?: TextureWrap;
        /**
         * 当贴图数据未加载好等情况时代替使用
         */
        noPixels?: ImageData | ImageData[] | HTMLImageElement | HTMLImageElement[];
    }
    /**
     * 纹理信息
     * @author feng 2016-12-20
     */
    abstract class TextureInfo {
        /**
         * 纹理类型
         */
        protected _textureType: TextureType;
        /**
         * 格式
         */
        format: TextureFormat;
        /**
         * 数据类型
         */
        type: TextureDataType;
        /**
         * 是否生成mipmap
         */
        generateMipmap: boolean;
        /**
         * 对图像进行Y轴反转。默认值为false
         */
        flipY: boolean;
        /**
         * 将图像RGB颜色值得每一个分量乘以A。默认为false
         */
        premulAlpha: boolean;
        minFilter: TextureMinFilter;
        magFilter: TextureMagFilter;
        /**
         * 表示x轴的纹理的回环方式，就是当纹理的宽度小于需要贴图的平面的宽度的时候，平面剩下的部分应该p以何种方式贴图的问题。
         */
        wrapS: TextureWrap;
        /**
         * 表示y轴的纹理回环方式。 magFilter和minFilter表示过滤的方式，这是OpenGL的基本概念，我将在下面讲一下，目前你不用担心它的使用。当您不设置的时候，它会取默认值，所以，我们这里暂时不理睬他。
         */
        wrapT: TextureWrap;
        /**
         * 各向异性过滤。使用各向异性过滤能够使纹理的效果更好，但是会消耗更多的内存、CPU、GPU时间。默认为0。
         */
        anisotropy: number;
        /**
         * 需要使用的贴图数据
         */
        protected _pixels: ImageData | ImageData[] | HTMLImageElement | HTMLImageElement[];
        /**
         * 当贴图数据未加载好等情况时代替使用
         */
        noPixels: ImageData | ImageData[] | HTMLImageElement | HTMLImageElement[];
        /**
         * 当前使用的贴图数据
         */
        protected _activePixels: ImageData | ImageData[] | HTMLImageElement | HTMLImageElement[];
        /**
         * 纹理缓冲
         */
        protected _textureMap: Map<GL, WebGLTexture>;
        /**
         * 是否失效
         */
        private _invalid;
        /**
         * 是否为2的幂贴图
         */
        readonly isPowerOfTwo: boolean;
        constructor(raw?: TextureInfoRaw);
        /**
         * 判断数据是否满足渲染需求
         */
        checkRenderData(): boolean;
        /**
         * 使纹理失效
         */
        protected invalidate(): void;
        /**
         * 激活纹理
         * @param gl
         */
        active(gl: GL): void;
        /**
         * 获取顶点属性缓冲
         * @param data  数据
         */
        getTexture(gl: GL): WebGLTexture;
        /**
         * 初始化纹理
         */
        private initTexture(gl);
        /**
         * 清理纹理
         */
        private clear();
    }
}
declare namespace feng3d {
}
declare namespace feng3d {
}
declare namespace feng3d {
    /**
     * 渲染环境
     * @author feng 2017-01-04
     */
    class RenderContext extends EventDispatcher {
        NUM_POINTLIGHT: number;
        NUM_DIRECTIONALLIGHT: number;
        /**
         * 摄像机
         */
        camera: Camera;
        private _camera;
        /**
         * 场景
         */
        scene3d: Scene3D;
        /**
         * WebGL实例
         */
        gl: GL;
        preRender(renderAtomic: RenderAtomic): void;
    }
}
declare namespace feng3d {
    var shaderConfig: ShaderConfig;
    /**
     * shader 库
     */
    var shaderlib: ShaderLib;
    /**
     * 着色器库，由shader.ts初始化
     */
    interface ShaderConfig {
        shaders: {
            [shaderName: string]: {
                /**
                 * 从glsl读取的vertex shader
                 */
                vertex: string;
                /**
                 * 从glsl读取的fragment shader
                 */
                fragment: string;
                cls?: new (...arg) => any;
                /**
                 * 处理了 include 的 shader
                 */
                shader?: Shader;
            };
        };
        /**
         * shader 模块
         */
        modules: {
            [moduleName: string]: string;
        };
    }
    /**
     * 渲染代码库
     * @author feng 2016-12-16
     */
    class ShaderLib {
        shaderConfig: ShaderConfig;
        private _shaderConfig;
        constructor();
        /**
         * 获取shaderCode
         */
        getShader(shaderName: string): Shader;
        /**
         * 展开 include
         */
        private uninclude(shaderCode);
        private onShaderChanged();
        /**
         * 获取shader列表
         */
        getShaderNames(): string[];
    }
    class ShaderLib1 {
    }
}
declare namespace feng3d {
}
declare namespace feng3d {
    /**
     * Bit mask that controls object destruction, saving and visibility in inspectors.
     */
    enum HideFlags {
        /**
         * A normal, visible object. This is the default.
         */
        None = 0,
        /**
         * The object will not appear in the hierarchy.
         */
        HideInHierarchy = 1,
        /**
         * It is not possible to view it in the inspector.
         */
        HideInInspector = 2,
        /**
         * The object will not be saved to the scene in the editor.
         */
        DontSaveInEditor = 4,
        /**
         * The object is not be editable in the inspector.
         */
        NotEditable = 8,
        /**
         * The object will not be saved when building a player.
         */
        DontSaveInBuild = 16,
        /**
         * The object will not be unloaded by Resources.UnloadUnusedAssets.
         */
        DontUnloadUnusedAsset = 32,
        /**
         * The object will not be saved to the scene. It will not be destroyed when a new scene is loaded. It is a shortcut for HideFlags.DontSaveInBuild | HideFlags.DontSaveInEditor | HideFlags.DontUnloadUnusedAsset.
         */
        DontSave = 52,
        /**
         * A combination of not shown in the hierarchy, not saved to to scenes and not unloaded by The object will not be unloaded by Resources.UnloadUnusedAssets.
         */
        HideAndDontSave = 61,
    }
}
declare namespace feng3d {
    type Type<T extends Feng3dObject> = new () => T;
    /**
     * Base class for all objects feng3d can reference.
     *
     * Any variable you make that derives from Feng3dObject gets shown in the inspector as a drop target, allowing you to set the value from the GUI.
     */
    class Feng3dObject extends EventDispatcher {
        /**
         * Should the Feng3dObject be hidden, saved with the scene or modifiable by the user?
         */
        hideFlags: HideFlags;
        constructor();
        /**
         * Removes a gameobject, component or asset.
         * @param obj	The Feng3dObject to destroy.
         * @param t	    The optional amount of time to delay before destroying the Feng3dObject.
         */
        static destroy(obj: Feng3dObject, t?: number): void;
        /**
         * Destroys the Feng3dObject obj immediately.
         * @param obj	                    Feng3dObject to be destroyed.
         * @param allowDestroyingAssets	    Set to true to allow assets to be destoyed.
         */
        static destroyImmediate(obj: Feng3dObject, allowDestroyingAssets?: boolean): void;
        /**
         * Makes the Feng3dObject target not be destroyed automatically when loading a new scene.
         */
        static dontDestroyOnLoad(target: Feng3dObject): void;
        /**
         * Returns the first active loaded Feng3dObject of Type type.
         */
        static findObjectOfType<T extends Feng3dObject>(type: Type<T>): T | null;
        /**
         * Returns a list of all active loaded objects of Type type.
         */
        static findObjectsOfType<T extends Feng3dObject>(type: Type<T>): T[] | null;
        /**
         * Returns a copy of the Feng3dObject original.
         * @param original	An existing Feng3dObject that you want to make a copy of.
         * @param position	Position for the new Feng3dObject(default Vector3.zero).
         * @param rotation	Orientation of the new Feng3dObject(default Quaternion.identity).
         * @param parent	The transform the Feng3dObject will be parented to.
         * @param worldPositionStays	If when assigning the parent the original world position should be maintained.
         */
        static instantiate<T extends Feng3dObject>(original: T, position?: Vector3, rotation?: Quaternion, parent?: Transform, worldPositionStays?: boolean): T | null;
    }
}
declare namespace feng3d {
    type ValueOf<T> = T[keyof T];
    interface ComponentRawMap {
    }
    type ComponentRaw = ValueOf<ComponentRawMap>;
    /**
     * Base class for everything attached to GameObjects.
     *
     * Note that your code will never directly create a Component. Instead, you write script code, and attach the script to a GameObject. See Also: ScriptableObject as a way to create scripts that do not attach to any GameObject.
     */
    class Component extends Feng3dObject {
        /**
         * The game object this component is attached to. A component is always attached to a game object.
         */
        readonly gameObject: GameObject;
        /**
         * The tag of this game object.
         */
        tag: string;
        /**
         * The Transform attached to this GameObject (null if there is none attached).
         */
        readonly transform: Transform;
        /**
         * 是否唯一，同类型3D对象组件只允许一个
         */
        readonly single: boolean;
        /**
         * 是否序列化
         */
        serializable: boolean;
        /**
         * 是否显示在检查器中
         */
        showInInspector: boolean;
        /**
         * 创建一个组件容器
         */
        constructor();
        set(setfun: (space: this) => void): this;
        init(gameObject: GameObject): void;
        /**
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         * @param type				The type of Component to retrieve.
         * @return                  返回指定类型组件
         */
        getComponent<T extends Component>(type: ComponentConstructor<T>): T;
        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponents<T extends Component>(type?: ComponentConstructor<T>): T[];
        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInChildren<T extends Component>(type?: ComponentConstructor<T>, filter?: (compnent: T) => {
            findchildren: boolean;
            value: boolean;
        }, result?: T[]): T[];
        private _gameObject;
        private _tag;
        /**
         * 销毁
         */
        dispose(): void;
        preRender(renderAtomic: RenderAtomic): void;
    }
}
declare namespace feng3d {
    enum ScriptFlag {
        feng3d = 1,
        editor = 2,
        all = 255,
    }
    /**
     * Behaviours are Components that can be enabled or disabled.
     *
     * 行为
     *
     * 可以控制开关的组件
     */
    class Behaviour extends Component {
        /**
         * Enabled Behaviours are Updated, disabled Behaviours are not.
         */
        enabled: boolean;
        flag: ScriptFlag;
        /**
         * Has the Behaviour had enabled called.
         * 是否所在GameObject显示且该行为已启动。
         */
        readonly isVisibleAndEnabled: boolean;
        /**
         * 每帧执行
         */
        update(interval?: number): void;
    }
}
declare namespace feng3d {
    /**
     * 渲染器
     * 所有渲染都由该渲染器执行
     */
    class Renderer {
        /**
         * 绘制
         * @param renderAtomic  渲染原子
         */
        readonly draw: (renderAtomic: RenderAtomic) => void;
        constructor(gl: GL);
    }
}
declare namespace feng3d {
    /**
     * 前向渲染器
     * @author feng 2017-02-20
     */
    var forwardRenderer: {
        draw: (renderContext: RenderContext, renderObjectflag: GameObjectFlag) => {
            blenditems: {
                depth: number;
                item: MeshRenderer;
                enableBlend: boolean;
            }[];
            unblenditems: {
                depth: number;
                item: MeshRenderer;
                enableBlend: boolean;
            }[];
        };
    };
}
declare namespace feng3d {
    /**
     * 深度渲染器
     * @author  feng    2017-03-25
     */
    class DepthRenderer {
        constructor();
    }
}
declare namespace feng3d {
    /**
     * 鼠标拾取渲染器
     * @author feng 2017-02-06
     */
    class MouseRenderer extends EventDispatcher {
        private objects;
        /**
         * 渲染
         */
        draw(renderContext: RenderContext, viewRect: Rectangle): GameObject;
        protected drawRenderables(renderContext: RenderContext, meshRenderer: MeshRenderer): void;
        /**
         * 绘制3D对象
         */
        protected drawGameObject(gl: GL, renderAtomic: RenderAtomic): void;
    }
    var glMousePicker: MouseRenderer;
}
declare namespace feng3d {
    /**
     * 后处理渲染器
     * @author feng 2017-02-20
     */
    class PostProcessRenderer {
    }
}
declare namespace feng3d {
    /**
     * 阴影图渲染器
     * @author  feng    2017-03-25
     */
    var shadowRenderer: {
        draw: (renderContext: RenderContext) => void;
    };
}
declare namespace feng3d {
    /**
     * 轮廓渲染器
     */
    var outlineRenderer: {
        draw: (renderContext: RenderContext, unblenditems: {
            depth: number;
            item: MeshRenderer;
            enableBlend: boolean;
        }[]) => void;
    };
    class OutLineComponent extends Component {
        size: number;
        color: Color4;
        outlineMorphFactor: number;
        init(gameobject: GameObject): void;
        preRender(renderAtomic: RenderAtomic): void;
    }
    interface Uniforms {
        /**
         * 描边宽度
         */
        u_outlineSize: number;
        /**
         * 描边颜色
         */
        u_outlineColor: Color4;
        /**
         * 描边形态因子
         * (0.0，1.0):0.0表示延法线方向，1.0表示延顶点方向
         */
        u_outlineMorphFactor: number;
    }
}
declare namespace feng3d {
    /**
     * 线框渲染器
     */
    var wireframeRenderer: {
        draw: (renderContext: RenderContext, unblenditems: {
            depth: number;
            item: MeshRenderer;
            enableBlend: boolean;
        }[]) => void;
    };
    interface RenderAtomic {
        /**
         * 顶点索引缓冲
         */
        wireframeindexBuffer: Index;
    }
    /**
     * 线框组件，将会对拥有该组件的对象绘制线框
     */
    class WireframeComponent extends Component {
        serializable: boolean;
        showInInspector: boolean;
        color: Color4;
        init(gameobject: GameObject): void;
        preRender(renderAtomic: RenderAtomic): void;
    }
}
declare namespace feng3d {
    /**
     * 卡通渲染
     */
    var cartoonRenderer: {};
    /**
     * 参考
     */
    class CartoonComponent extends Component {
        outlineSize: number;
        outlineColor: Color4;
        outlineMorphFactor: number;
        /**
         * 半兰伯特值diff，分段值 4个(0.0,1.0)
         */
        diffuseSegment: Vector4;
        /**
         * 半兰伯特值diff，替换分段值 4个(0.0,1.0)
         */
        diffuseSegmentValue: Vector4;
        specularSegment: number;
        cartoon_Anti_aliasing: boolean;
        _cartoon_Anti_aliasing: boolean;
        init(gameObject: GameObject): void;
        preRender(renderAtomic: RenderAtomic): void;
    }
    interface Uniforms {
        u_diffuseSegment: Vector4;
        u_diffuseSegmentValue: Vector4;
        u_specularSegment: number;
    }
}
declare namespace feng3d {
    var skyboxRenderer: {
        draw: (gl: GL, scene3d: Scene3D, camera: Camera, renderObjectflag: GameObjectFlag) => void;
    };
    class SkyBox extends Component {
        texture: TextureCube;
        private _texture;
        constructor();
        init(gameObject: GameObject): void;
        preRender(renderAtomic: RenderAtomic): void;
    }
}
declare namespace feng3d {
    /**
     * 后处理效果
     * @author feng 2017-02-20
     */
    class PostEffect {
    }
}
declare namespace feng3d {
    /**
     * 快速近似抗锯齿（Fast Approximate Anti-Aliasing）后处理效果
     * @author feng 2017-02-20
     *
     * @see
     * https://github.com/BabylonJS/Babylon.js/blob/master/src/Shaders/fxaa.fragment.fx
     * https://github.com/playcanvas/engine/blob/master/extras/posteffects/posteffect-fxaa.js
     */
    class FXAAEffect {
    }
}
declare namespace feng3d {
    interface ComponentRawMap {
        TransformRaw: TransformRaw;
    }
    interface TransformRaw {
        __class__?: "feng3d.Transform";
        rx?: number;
        ry?: number;
        rz?: number;
        sx?: number;
        sy?: number;
        sz?: number;
        x?: number;
        y?: number;
        z?: number;
    }
    interface TransformEventMap {
        /**
         * 变换矩阵变化
         */
        transformChanged: any;
        /**
         *
         */
        updateLocalToWorldMatrix: any;
    }
    interface Transform {
        once<K extends keyof TransformEventMap>(type: K, listener: (event: Event<TransformEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof TransformEventMap>(type: K, data?: TransformEventMap[K], bubbles?: boolean): any;
        has<K extends keyof TransformEventMap>(type: K): boolean;
        on<K extends keyof TransformEventMap>(type: K, listener: (event: Event<TransformEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof TransformEventMap>(type?: K, listener?: (event: Event<TransformEventMap[K]>) => any, thisObject?: any): any;
    }
    /**
     * Position, rotation and scale of an object.
     *
     * Every object in a scene has a Transform. It's used to store and manipulate the position, rotation and scale of the object. Every Transform can have a parent, which allows you to apply position, rotation and scale hierarchically. This is the hierarchy seen in the Hierarchy pane.
     */
    class Transform extends Component {
        readonly single: boolean;
        /**
         * 创建一个实体，该类为虚类
         */
        constructor();
        init(gameObject: GameObject): void;
        readonly scenePosition: Vector3;
        readonly parent: Transform;
        /**
         * Matrix that transforms a point from local space into world space.
         */
        localToWorldMatrix: Matrix4x4;
        /**
         * 本地转世界逆转置矩阵
         */
        readonly ITlocalToWorldMatrix: Matrix4x4;
        /**
         * Matrix that transforms a point from world space into local space (Read Only).
         */
        readonly worldToLocalMatrix: Matrix4x4;
        readonly localToWorldRotationMatrix: Matrix4x4;
        /**
         * Transforms direction from local space to world space.
         */
        transformDirection(direction: Vector3): Vector3;
        /**
         * Transforms position from local space to world space.
         */
        transformPoint(position: Vector3): Vector3;
        /**
         * Transforms vector from local space to world space.
         */
        transformVector(vector: Vector3): Vector3;
        /**
         * Transforms a direction from world space to local space. The opposite of Transform.TransformDirection.
         */
        inverseTransformDirection(direction: Vector3): Vector3;
        /**
         * Transforms position from world space to local space.
         */
        inverseTransformPoint(position: Vector3): Vector3;
        /**
         * Transforms a vector from world space to local space. The opposite of Transform.TransformVector.
         */
        inverseTransformVector(vector: Vector3): Vector3;
        dispose(): void;
        protected updateLocalToWorldMatrix(): Matrix4x4;
        protected invalidateSceneTransform(): void;
        x: number;
        y: number;
        z: number;
        rx: number;
        ry: number;
        rz: number;
        sx: number;
        sy: number;
        sz: number;
        /**
         * @private
         */
        matrix3d: Matrix4x4;
        /**
         * 旋转矩阵
         */
        readonly rotationMatrix: Matrix4x4;
        /**
         * 返回保存位置数据的Vector3D对象
         */
        position: Vector3;
        rotation: Vector3;
        /**
         * 四元素旋转
         */
        orientation: Quaternion;
        scale: Vector3;
        readonly forwardVector: Vector3;
        readonly rightVector: Vector3;
        readonly upVector: Vector3;
        readonly backVector: Vector3;
        readonly leftVector: Vector3;
        readonly downVector: Vector3;
        moveForward(distance: number): void;
        moveBackward(distance: number): void;
        moveLeft(distance: number): void;
        moveRight(distance: number): void;
        moveUp(distance: number): void;
        moveDown(distance: number): void;
        translate(axis: Vector3, distance: number): void;
        translateLocal(axis: Vector3, distance: number): void;
        pitch(angle: number): void;
        yaw(angle: number): void;
        roll(angle: number): void;
        rotateTo(ax: number, ay: number, az: number): void;
        /**
         * 绕指定轴旋转，不受位移与缩放影响
         * @param    axis               旋转轴
         * @param    angle              旋转角度
         * @param    pivotPoint         旋转中心点
         *
         */
        rotate(axis: Vector3, angle: number, pivotPoint?: Vector3): void;
        lookAt(target: Vector3, upAxis?: Vector3): void;
        disposeAsset(): void;
        invalidateTransform(): void;
        protected updateMatrix3D(): void;
        private _position;
        private _rotation;
        private _orientation;
        private _scale;
        protected _smallestNumber: number;
        protected _x: number;
        protected _y: number;
        protected _z: number;
        protected _rx: number;
        protected _ry: number;
        protected _rz: number;
        protected _sx: number;
        protected _sy: number;
        protected _sz: number;
        protected _matrix3d: Matrix4x4;
        protected _rotationMatrix3d: Matrix4x4 | null;
        protected _localToWorldMatrix: Matrix4x4 | null;
        protected _ITlocalToWorldMatrix: Matrix4x4 | null;
        protected _worldToLocalMatrix: Matrix4x4 | null;
        protected _localToWorldRotationMatrix: Matrix4x4 | null;
        private invalidateRotation();
        private invalidateScale();
        private invalidatePosition();
    }
}
declare namespace feng3d {
    type ComponentConstructor<T> = (new () => T);
    interface Mouse3DEventMap {
        /**
         * 鼠标移出对象
         */
        mouseout: any;
        /**
         * 鼠标移入对象
         */
        mouseover: any;
        /**
         * 鼠标在对象上移动
         */
        mousemove: any;
        /**
         * 鼠标左键按下
         */
        mousedown: any;
        /**
         * 鼠标左键弹起
         */
        mouseup: any;
        /**
         * 单击
         */
        click: any;
        /**
         * 鼠标中键按下
         */
        middlemousedown: any;
        /**
         * 鼠标中键弹起
         */
        middlemouseup: any;
        /**
         * 鼠标中键单击
         */
        middleclick: any;
        /**
         * 鼠标右键按下
         */
        rightmousedown: any;
        /**
         * 鼠标右键弹起
         */
        rightmouseup: any;
        /**
         * 鼠标右键单击
         */
        rightclick: any;
        /**
         * 鼠标双击
         */
        dblclick: any;
    }
    interface GameObjectEventMap extends Mouse3DEventMap {
        /**
         * 添加子组件事件
         */
        addedComponent: Component;
        /**
         * 移除子组件事件
         */
        removedComponent: Component;
        /**
         * 添加了子对象，当child被添加到parent中时派发冒泡事件
         */
        added: GameObject;
        /**
         * 删除了子对象，当child被parent移除时派发冒泡事件
         */
        removed: GameObject;
        /**
         * 当GameObject的scene属性被设置是由Scene3D派发
         */
        addedToScene: GameObject;
        /**
         * 当GameObject的scene属性被清空时由Scene3D派发
         */
        removedFromScene: GameObject;
        /**
         * 场景变化
         */
        sceneChanged: GameObject;
        /**
         * 包围盒失效
         */
        boundsInvalid: Geometry;
        /**
         * 场景矩阵变化
         */
        scenetransformChanged: Transform;
    }
    interface GameObject {
        once<K extends keyof GameObjectEventMap>(type: K, listener: (event: Event<GameObjectEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof GameObjectEventMap>(type: K, data?: GameObjectEventMap[K], bubbles?: boolean): any;
        has<K extends keyof GameObjectEventMap>(type: K): boolean;
        on<K extends keyof GameObjectEventMap>(type: K, listener: (event: Event<GameObjectEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof GameObjectEventMap>(type?: K, listener?: (event: Event<GameObjectEventMap[K]>) => any, thisObject?: any): any;
    }
    /**
     * 鼠标拾取层级
     */
    var mouselayer: {
        editor: number;
    };
    enum GameObjectFlag {
        feng3d = 1,
        editor = 2,
    }
    interface GameObjectRaw {
        __class__?: "feng3d.GameObject";
        name?: string;
        children?: GameObjectRaw[];
        components?: ComponentRaw[];
    }
    /**
     * Base class for all entities in feng3d scenes.
     */
    class GameObject extends Feng3dObject {
        readonly renderAtomic: RenderAtomic;
        /**
         * 游戏对象池
         */
        static pool: Map<string, GameObject>;
        private guid;
        protected _children: GameObject[];
        protected _scene: Scene3D | null;
        protected _parent: GameObject | null;
        /**
         * 鼠标拾取层级（优先级），拾取过程优先考虑层级再考虑深度
         */
        mouselayer: number;
        /**
         * 是否可序列化
         */
        serializable: boolean;
        /**
         * 是否显示在层级界面
         */
        showinHierarchy: boolean;
        /**
         * The name of the Feng3dObject.
         * Components share the same name with the game object and all attached components.
         */
        name: string;
        /**
         * 是否显示
         */
        visible: boolean;
        /**
         * 自身以及子对象是否支持鼠标拾取
         */
        mouseEnabled: boolean;
        /**
         * 模型生成的导航网格类型
         */
        navigationArea: number;
        /**
         * 标记
         */
        flag: GameObjectFlag;
        /**
         * 用户自定义数据
         */
        userData: any;
        /**
         * The Transform attached to this GameObject. (null if there is none attached).
         */
        readonly transform: Transform;
        private _transform;
        readonly parent: GameObject | null;
        /**
         * 子对象
         */
        children: GameObject[];
        readonly numChildren: number;
        /**
         * 子组件个数
         */
        readonly numComponents: number;
        /**
         * 构建3D对象
         */
        constructor(raw: GameObjectRaw);
        find(name: string): GameObject | null;
        contains(child: GameObject): boolean;
        addChild(child: GameObject): GameObject;
        addChildren(...childarray: any[]): void;
        /**
         * 移除自身
         */
        remove(): void;
        removeChild(child: GameObject): void;
        removeChildAt(index: number): void;
        private _setParent(value);
        getChildAt(index: number): GameObject;
        readonly scene: Scene3D | null;
        private updateScene();
        /**
         * 获取子对象列表（备份）
         */
        getChildren(): GameObject[];
        private removeChildInternal(childIndex, child);
        /**
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        getComponentAt(index: number): Component;
        /**
         * 添加组件
         * Adds a component class named className to the game object.
         * @param param 被添加组件
         */
        addComponent<T extends Component>(param: ComponentConstructor<T>, callback?: (component: T) => void): T;
        /**
         * 添加脚本
         * @param script   脚本路径
         */
        addScript(script: string): string;
        /**
         * 判断是否拥有组件
         * @param com	被检测的组件
         * @return		true：拥有该组件；false：不拥有该组件。
         */
        private hasComponent(com);
        /**
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         * @param type				类定义
         * @return                  返回指定类型组件
         */
        getComponent<T extends Component>(type: ComponentConstructor<T>): T;
        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponents<T extends Component>(type?: ComponentConstructor<T>): T[];
        /**
         * Returns the component of Type type in the GameObject or any of its children using depth first search.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInChildren<T extends Component>(type?: ComponentConstructor<T>, filter?: (compnent: T) => {
            findchildren: boolean;
            value: boolean;
        }, result?: T[]): T[];
        /**
         * 设置子组件的位置
         * @param component				子组件
         * @param index				位置索引
         */
        setComponentIndex(component: Component, index: number): void;
        /**
         * 设置组件到指定位置
         * @param component		被设置的组件
         * @param index			索引
         */
        setComponentAt(component: Component, index: number): void;
        /**
         * 移除组件
         * @param component 被移除组件
         */
        removeComponent(component: Component): void;
        /**
         * 获取组件在容器的索引位置
         * @param component			查询的组件
         * @return				    组件在容器的索引位置
         */
        getComponentIndex(component: Component): number;
        /**
         * 移除组件
         * @param index		要删除的 Component 的子索引。
         */
        removeComponentAt(index: number): Component;
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
        swapComponents(a: Component, b: Component): void;
        /**
         * 移除指定类型组件
         * @param type 组件类型
         */
        removeComponentsByType<T extends Component>(type: ComponentConstructor<T>): T[];
        /**
         * Finds a game object by name and returns it.
         * @param name
         */
        static find(name: string): GameObject;
        static create(name?: string, raw?: GameObjectRaw): GameObject;
        /**
         * 组件列表
         */
        protected _components: Component[];
        components: Component[];
        /**
         * 添加组件到指定位置
         * @param component		被添加的组件
         * @param index			插入的位置
         */
        private addComponentAt(component, index);
        /**
         * 销毁
         */
        dispose(): void;
        disposeWithChildren(): void;
        preRender(renderAtomic: RenderAtomic): void;
    }
}
declare namespace feng3d {
    /**
     * 包围盒组件
     */
    class BoundingComponent extends Component {
        readonly single: boolean;
        showInInspector: boolean;
        serializable: boolean;
        private _selfLocalBounds;
        private _selfWorldBounds;
        init(gameObject: GameObject): void;
        /**
         * 自身局部包围盒
         */
        readonly selfLocalBounds: Box;
        /**
         * @inheritDoc
         */
        private invalidateSceneTransform();
        /**
          * 判断射线是否穿过对象
          * @param ray3D
          * @return
          */
        isIntersectingRay(ray3D: Ray3D): PickingCollisionVO;
        /**
         * 自身世界包围盒
         */
        readonly selfWorldBounds: Box;
        /**
         * 世界包围盒
         */
        readonly worldBounds: Box;
        /**
         * 更新世界边界
         */
        private updateWorldBounds();
        /**
         * 处理包围盒变换事件
         */
        private onBoundsChange();
        /**
         * @inheritDoc
         */
        private updateBounds();
    }
}
declare namespace feng3d {
}
interface HTMLCanvasElement {
    gl: feng3d.GL;
}
declare namespace feng3d {
    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    class Engine {
        canvas: HTMLCanvasElement;
        /**
         * 摄像机
         */
        camera: Camera;
        private _camera;
        /**
         * 3d场景
         */
        scene: Scene3D;
        /**
         * 根节点
         */
        readonly root: GameObject;
        readonly gl: GL;
        /**
         * 渲染对象标记，用于过滤渲染对象
         */
        renderObjectflag: GameObjectFlag;
        /**
         * 渲染环境
         */
        private renderContext;
        /**
         * 鼠标事件管理
         */
        mouse3DManager: Mouse3DManager;
        /**
         * 鼠标在3D视图中的位置
         */
        readonly mousePos: Vector2;
        readonly mouseinview: boolean;
        readonly viewRect: Rectangle;
        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        constructor(canvas?: HTMLCanvasElement, scene?: Scene3D, camera?: Camera);
        /**
         * 修改canvas尺寸
         * @param width 宽度
         * @param height 高度
         */
        setSize(width: number, height: number): void;
        start(): void;
        stop(): void;
        update(): void;
        /**
         * 绘制场景
         */
        render(): void;
    }
}
declare namespace feng3d {
    class HoldSizeComponent extends Component {
        /**
         * 保持缩放尺寸
         */
        holdSize: number;
        /**
         * 相对
         */
        camera: Camera;
        private _holdSize;
        private _camera;
        init(gameobject: GameObject): void;
        private invalidateSceneTransform();
        private updateLocalToWorldMatrix();
        private getDepthScale(camera);
        dispose(): void;
    }
}
declare namespace feng3d {
    class BillboardComponent extends Component {
        /**
         * 相对
         */
        camera: Camera;
        private _holdSize;
        private _camera;
        init(gameobject: GameObject): void;
        private invalidHoldSizeMatrix();
        private updateLocalToWorldMatrix();
        dispose(): void;
    }
}
declare namespace feng3d {
    interface ComponentRawMap {
        MeshRendererRaw: MeshRendererRaw;
    }
    interface MeshRendererRaw {
        __class__: "feng3d.MeshRenderer";
        geometry?: GeometryRaw;
        material?: MaterialRaw;
    }
    class MeshRenderer extends Behaviour {
        readonly single: boolean;
        /**
         * Returns the instantiated Mesh assigned to the mesh filter.
         */
        geometry: Geometry;
        private _geometry;
        /**
         * 材质
         * Returns the first instantiated Material assigned to the renderer.
         */
        material: Material;
        init(gameObject: GameObject): void;
        preRender(renderAtomic: RenderAtomic): void;
        /**
         * 销毁
         */
        dispose(): void;
        private onBoundsInvalid(event);
    }
}
declare namespace feng3d {
    /**
     * 3d对象脚本
     * @author feng 2017-03-11
     */
    class ScriptComponent extends Behaviour {
        /**
         * 脚本对象
         */
        private scriptInstance;
        scriptData: Object;
        /**
         * 脚本路径
         */
        script: string;
        private _script;
        init(gameObject: GameObject): void;
        private initScript();
        /**
         * 每帧执行
         */
        update(): void;
        /**
         * 销毁
         */
        dispose(): void;
    }
}
declare namespace feng3d {
    /**
     * 3d对象脚本
     */
    class Script {
        /**
         * The game object this component is attached to. A component is always attached to a game object.
         */
        readonly gameObject: GameObject;
        /**
         * The Transform attached to this GameObject (null if there is none attached).
         */
        readonly transform: Transform;
        /**
         * 宿主组件
         */
        readonly component: ScriptComponent;
        private _component;
        constructor(component?: ScriptComponent);
        /**
         * Use this for initialization
         */
        init(): void;
        /**
         * Update is called once per frame
         * 每帧执行一次
         */
        update(): void;
        /**
         * 销毁
         */
        dispose(): void;
    }
}
declare namespace feng3d {
    /**
     * 组件事件
     */
    interface Scene3DEventMap {
        addToScene: GameObject;
        removeFromScene: GameObject;
        addComponentToScene: Component;
        removeComponentFromScene: Component;
    }
    interface Scene3D {
        once<K extends keyof Scene3DEventMap>(type: K, listener: (event: Event<Scene3DEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof Scene3DEventMap>(type: K, data?: Scene3DEventMap[K], bubbles?: boolean): any;
        has<K extends keyof Scene3DEventMap>(type: K): boolean;
        on<K extends keyof Scene3DEventMap>(type: K, listener: (event: Event<Scene3DEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof Scene3DEventMap>(type?: K, listener?: (event: Event<Scene3DEventMap[K]>) => any, thisObject?: any): any;
    }
    /**
     * 3D场景
     * @author feng 2016-05-01
     */
    class Scene3D extends Component {
        /**
         * 是否编辑器模式
         */
        iseditor: boolean;
        /**W
         * 背景颜色
         */
        background: Color4;
        /**
         * 环境光强度
         */
        ambientColor: Color4;
        /**
         * 指定更新脚本标记，用于过滤需要调用update的脚本
         */
        updateScriptFlag: ScriptFlag;
        /**
         * 收集组件
         */
        collectComponents: {
            cameras: {
                cls: typeof Camera;
                list: Camera[];
            };
            pointLights: {
                cls: typeof PointLight;
                list: PointLight[];
            };
            directionalLights: {
                cls: typeof DirectionalLight;
                list: DirectionalLight[];
            };
            skyboxs: {
                cls: typeof SkyBox;
                list: SkyBox[];
            };
            animations: {
                cls: typeof Animation;
                list: Animation[];
            };
            scripts: {
                cls: typeof ScriptComponent;
                list: ScriptComponent[];
            };
            behaviours: {
                cls: typeof Behaviour;
                list: Behaviour[];
            };
        };
        _mouseCheckObjects: {
            layer: number;
            objects: GameObject[];
        }[];
        /**
         * 构造3D场景
         */
        init(gameObject: GameObject): void;
        dispose(): void;
        initCollectComponents(): void;
        private onEnterFrame(interval);
        update(): void;
        readonly mouseCheckObjects: {
            layer: number;
            objects: GameObject[];
        }[];
        _addGameObject(gameobject: GameObject): void;
        _removeGameObject(gameobject: GameObject): void;
        _addComponent(component: Component): void;
        _removeComponent(component: Component): void;
    }
}
declare namespace feng3d {
    type GeometryRaw = SegmentGeometryRaw | PlaneGeometryRaw | CubeGeometryRaw | SphereGeometryRaw | CapsuleGeometryRaw | CylinderGeometryRaw | ConeGeometryRaw | TorusGeometryRaw;
    interface GeometryEventMap {
        /**
         * 包围盒失效
         */
        boundsInvalid: Geometry;
    }
    interface Geometry {
        once<K extends keyof GeometryEventMap>(type: K, listener: (event: Event<GeometryEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof GeometryEventMap>(type: K, data?: GeometryEventMap[K], bubbles?: boolean): any;
        has<K extends keyof GeometryEventMap>(type: K): boolean;
        on<K extends keyof GeometryEventMap>(type: K, listener: (event: Event<GeometryEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof GeometryEventMap>(type?: K, listener?: (event: Event<GeometryEventMap[K]>) => any, thisObject?: any): any;
    }
    /**
     * 几何体
     * @author feng 2016-04-28
     */
    abstract class Geometry extends Feng3dObject {
        /**
         * 网格名称
         */
        name: string;
        /**
         * 顶点索引缓冲
         */
        protected _indices: number[];
        /**
         * 自动生成的顶点索引
         */
        protected _autoIndices: number[];
        /**
         * 属性数据列表
         */
        protected _attributes: {
            [name: string]: {
                data: number[];
                size: number;
            };
        };
        private _geometryInvalid;
        private _useFaceWeights;
        private _scaleU;
        private _scaleV;
        private _bounding;
        private _autoAttributeDatas;
        private _invalids;
        /**
         * 索引数据
         */
        /**
         * 更新顶点索引数据
         */
        indices: number[];
        /**
         * 坐标数据
         */
        positions: number[];
        /**
         * uv数据
         */
        uvs: number[];
        /**
         * 法线数据
         */
        normals: number[];
        /**
         * 切线数据
         */
        tangents: number[];
        /**
         * 创建一个几何体
         */
        constructor();
        /**
         * 几何体变脏
         */
        invalidateGeometry(): void;
        /**
         * 更新几何体
         */
        updateGrometry(): void;
        /**
         * 构建几何体
         */
        protected buildGeometry(): void;
        /**
         * 设置顶点属性数据
         * @param vaId                  顶点属性编号
         * @param data                  顶点属性数据
         * @param size                  顶点数据尺寸
         * @param autogenerate          是否自动生成数据
         */
        setVAData<K extends keyof Attributes>(vaId: K, data: number[], size: number): void;
        /**
         * 获取顶点属性数据
         * @param vaId 数据类型编号
         * @return 顶点属性数据
         */
        getVAData1(vaId: string): number[];
        /**
         * 顶点数量
         */
        readonly numVertex: number;
        /**
         * 添加几何体
         * @param geometry          被添加的几何体
         * @param transform         变换矩阵，把克隆被添加几何体的数据变换后再添加到该几何体中
         */
        addGeometry(geometry: Geometry, transform?: Matrix4x4): void;
        /**
         * 应用变换矩阵
         * @param transform 变换矩阵
         */
        applyTransformation(transform: Matrix4x4): void;
        /**
         * 纹理U缩放，默认为1。
         */
        readonly scaleU: number;
        /**
         * 纹理V缩放，默认为1。
         */
        readonly scaleV: number;
        /**
         * 缩放UV
         * @param scaleU 纹理U缩放，默认1。
         * @param scaleV 纹理V缩放，默认1。
         */
        scaleUV(scaleU?: number, scaleV?: number): void;
        /**
         * 包围盒失效
         */
        invalidateBounds(): void;
        readonly bounding: Box;
        /**
         * 射线投影几何体
         * @param ray                           射线
         * @param shortestCollisionDistance     当前最短碰撞距离
         * @param bothSides                     是否检测双面
         */
        raycast(ray: Ray3D, shortestCollisionDistance?: number, bothSides?: boolean): {
            rayEntryDistance: number;
            localPosition: Vector3;
            localNormal: Vector3;
            uv: Vector2;
            index: number;
        };
        /**
         * 克隆一个几何体
         */
        clone(): CustomGeometry;
        /**
         * 从一个几何体中克隆数据
         */
        cloneFrom(geometry: Geometry): void;
        preRender(renderAtomic: RenderAtomic): void;
    }
}
declare namespace feng3d {
    class CustomGeometry extends Geometry {
        /**
         * 顶点索引缓冲
         */
        indicesBase: number[];
        /**
         * 属性数据列表
         */
        attributes: {
            [name: string]: {
                data: number[];
                size: number;
            };
        };
    }
}
declare namespace feng3d {
    var GeometryUtils: {
        createIndices: (positions: number[]) => number[];
        createUVs: (positions: number[]) => number[];
        createVertexNormals: (indices: number[] | Uint16Array, positions: number[], useFaceWeights?: boolean) => number[];
        createVertexTangents: (indices: number[] | Uint16Array, positions: number[], uvs: number[], useFaceWeights?: boolean) => number[];
    };
}
declare namespace feng3d {
    /**
     * 点几何体
     * @author feng 2017-01-11
     */
    class PointGeometry extends Geometry {
        /**
         * 点数据列表
         * 修改数组内数据时需要手动调用 invalidateGeometry();
         */
        points: PointInfo[];
        /**
         * 构建几何体
         */
        buildGeometry(): void;
    }
    /**
     * 点信息
     * @author feng 2016-10-16
     */
    interface PointInfo {
        position?: Vector3;
        color?: Color4;
        normal?: Vector3;
        uv?: Vector2;
    }
}
declare namespace feng3d {
    interface SegmentGeometryRaw {
        __class__: "feng3d.SegmentGeometry";
    }
    /**
     * 线段组件
     * @author feng 2016-10-16
     */
    class SegmentGeometry extends Geometry {
        /**
         * 线段列表
         * 修改数组内数据时需要手动调用 invalidateGeometry();
         */
        segments: Segment[];
        constructor();
        /**
         * 更新几何体
         */
        protected buildGeometry(): void;
    }
    /**
     * 线段
     * @author feng 2016-10-16
     */
    interface Segment {
        /**
         * 起点坐标
         */
        start?: Vector3;
        /**
         * 终点坐标
         */
        end?: Vector3;
        /**
         * 起点颜色
         */
        startColor?: Color4;
        /**
         * 线段厚度
         */
        endColor?: Color4;
    }
}
declare namespace feng3d {
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
declare namespace feng3d {
    /**
     * 镜头事件
     */
    interface LensEventMap {
        matrixChanged: any;
    }
    interface LensBase {
        once<K extends keyof LensEventMap>(type: K, listener: (event: LensEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof LensEventMap>(type: K, data?: LensEventMap[K], bubbles?: boolean): any;
        has<K extends keyof LensEventMap>(type: K): boolean;
        on<K extends keyof LensEventMap>(type: K, listener: (event: LensEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof LensEventMap>(type?: K, listener?: (event: LensEventMap[K]) => any, thisObject?: any): any;
    }
    /**
     * 摄像机镜头
     * @author feng 2014-10-14
     */
    abstract class LensBase extends EventDispatcher {
        /**
         * 最近距离
         */
        private _near;
        near: number;
        /**
         * 最远距离
         */
        private _far;
        far: number;
        /**
         * 视窗缩放比例(width/height)，在渲染器中设置
         */
        private _aspectRatio;
        aspectRatio: number;
        protected _matrix: Matrix4x4 | null;
        protected _scissorRect: Rectangle;
        protected _viewPort: Rectangle;
        protected _frustumCorners: number[];
        private _unprojection;
        /**
         * 创建一个摄像机镜头
         */
        constructor();
        /**
         * Retrieves the corner points of the lens frustum.
         */
        frustumCorners: number[];
        /**
         * 投影矩阵
         */
        matrix: Matrix4x4;
        /**
         * 场景坐标投影到屏幕坐标
         * @param point3d 场景坐标
         * @param v 屏幕坐标（输出）
         * @return 屏幕坐标
         */
        project(point3d: Vector3, v?: Vector3): Vector3;
        /**
         * 投影逆矩阵
         */
        readonly unprojectionMatrix: Matrix4x4;
        /**
         * 屏幕坐标投影到摄像机空间坐标
         * @param nX 屏幕坐标X -1（左） -> 1（右）
         * @param nY 屏幕坐标Y -1（上） -> 1（下）
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        abstract unproject(nX: number, nY: number, sZ: number, v?: Vector3): Vector3;
        /**
         * 投影矩阵失效
         */
        protected invalidateMatrix(): void;
        /**
         * 更新投影矩阵
         */
        protected abstract updateMatrix(): Matrix4x4;
    }
}
declare namespace feng3d {
    /**
     *
     * @author feng 2015-5-28
     */
    class FreeMatrixLens extends LensBase {
        constructor();
        protected updateMatrix(): Matrix4x4;
        /**
         * 屏幕坐标投影到摄像机空间坐标
         * @param nX 屏幕坐标X -1（左） -> 1（右）
         * @param nY 屏幕坐标Y -1（上） -> 1（下）
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        unproject(nX: number, nY: number, sZ: number, v: Vector3): Vector3;
    }
}
declare namespace feng3d {
    /**
     * 透视摄像机镜头
     * @author feng 2014-10-14
     */
    class PerspectiveLens extends LensBase {
        /**
         * 视野
         */
        fieldOfView: number;
        /**
         * 坐标系类型
         */
        coordinateSystem: number;
        _focalLength: number;
        private _yMax;
        private _xMax;
        /**
         * 创建一个透视摄像机镜头
         * @param fieldOfView 视野
         * @param coordinateSystem 坐标系统类型
         */
        constructor(fieldOfView?: number, coordinateSystem?: number);
        private fieldOfViewChange();
        private coordinateSystemChange();
        /**
         * 焦距
         */
        focalLength: number;
        unproject(nX: number, nY: number, sZ: number, v?: Vector3): Vector3;
        protected updateMatrix(): Matrix4x4;
    }
}
declare namespace feng3d {
    /**
     * @author feng 2014-10-14
     */
    interface CameraEventMap {
        lensChanged: any;
    }
    interface Camera {
        once<K extends keyof CameraEventMap>(type: K, listener: (event: Event<CameraEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof CameraEventMap>(type: K, data?: CameraEventMap[K], bubbles?: boolean): any;
        has<K extends keyof CameraEventMap>(type: K): boolean;
        on<K extends keyof CameraEventMap>(type: K, listener: (event: Event<CameraEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof CameraEventMap>(type?: K, listener?: (event: Event<CameraEventMap[K]>) => any, thisObject?: any): any;
    }
    /**
     * 摄像机
     * @author feng 2016-08-16
     */
    class Camera extends Component {
        private _lens;
        private _viewProjection;
        private _viewProjectionDirty;
        private _frustum;
        private _frustumDirty;
        private _viewRect;
        /**
         * 视窗矩形
         */
        viewRect: Rectangle;
        readonly single: boolean;
        /**
         * 创建一个摄像机
         */
        init(gameObject: GameObject): void;
        /**
         * 处理镜头变化事件
         */
        private onLensMatrixChanged(event);
        /**
         * 镜头
         */
        lens: LensBase;
        /**
         * 场景投影矩阵，世界空间转投影空间
         */
        readonly viewProjection: Matrix4x4;
        /**
         * 处理场景变换改变事件
         */
        protected onScenetransformChanged(): void;
        /**
         * 获取鼠标射线（与鼠标重叠的摄像机射线）
         */
        getMouseRay3D(): Ray3D;
        /**
         * 获取与坐标重叠的射线
         * @param x view3D上的X坐标
         * @param y view3D上的X坐标
         * @return
         */
        getRay3D(x: number, y: number, ray3D?: Ray3D): Ray3D;
        /**
         * 投影坐标（世界坐标转换为3D视图坐标）
         * @param point3d 世界坐标
         * @return 屏幕的绝对坐标
         */
        project(point3d: Vector3): Vector3;
        /**
         * 屏幕坐标投影到场景坐标
         * @param nX 屏幕坐标X ([0-width])
         * @param nY 屏幕坐标Y ([0-height])
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        unproject(sX: number, sY: number, sZ: number, v?: Vector3): Vector3;
        /**
         * 屏幕坐标转GPU坐标
         * @param screenPos 屏幕坐标 (x:[0-width],y:[0-height])
         * @return GPU坐标 (x:[-1,1],y:[-1-1])
         */
        screenToGpuPosition(screenPos: Vector2): Vector2;
        /**
         * 获取单位像素在指定深度映射的大小
         * @param   depth   深度
         */
        getScaleByDepth(depth: number): number;
        /**
         * 视锥体
         */
        readonly frustum: Frustum;
        preRender(renderAtomic: RenderAtomic): void;
    }
}
declare namespace feng3d {
    /**
     * 平面几何体原始数据
     */
    interface PlaneGeometryRaw {
        __class__?: "feng3d.PlaneGeometry";
        /**
         * 宽度
         */
        width?: number;
        /**
         * 高度
         */
        height?: number;
        /**
         * 横向分割数
         */
        segmentsW?: number;
        /**
         * 纵向分割数
         */
        segmentsH?: number;
        /**
         * 是否朝上
         */
        yUp?: boolean;
    }
    /**
     * 平面几何体
     * @author feng 2016-09-12
     */
    class PlaneGeometry extends Geometry implements PlaneGeometryRaw {
        width: number;
        height: number;
        segmentsW: number;
        segmentsH: number;
        yUp: boolean;
        /**
         * 创建平面几何体
         */
        constructor(raw?: PlaneGeometryRaw);
        /**
         * 构建几何体数据
         */
        protected buildGeometry(): void;
        /**
         * 构建顶点坐标
         * @param this.width 宽度
         * @param this.height 高度
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildPosition();
        /**
         * 构建顶点法线
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildNormal();
        /**
         * 构建顶点切线
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildTangent();
        /**
         * 构建顶点索引
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildIndices();
        /**
         * 构建uv
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         */
        private buildUVs();
    }
}
declare namespace feng3d {
    /**
     * 立方体几何体原始数据
     */
    interface CubeGeometryRaw {
        __class__?: "feng3d.CubeGeometry";
        /**
         * 宽度
         */
        width?: number;
        /**
         * 高度
         */
        height?: number;
        /**
         * 深度
         */
        depth?: number;
        /**
         * 宽度方向分割数
         */
        segmentsW?: number;
        /**
         * 高度方向分割数
         */
        segmentsH?: number;
        /**
         * 深度方向分割数
         */
        segmentsD?: number;
        /**
         * 是否为6块贴图，默认true。
         */
        tile6?: boolean;
    }
    /**
     * 立方体几何体
     * @author feng 2016-09-12
     */
    class CubeGeometry extends Geometry implements CubeGeometryRaw {
        width: number;
        height: number;
        depth: number;
        segmentsW: number;
        segmentsH: number;
        segmentsD: number;
        tile6: boolean;
        /**
         * 创建立方几何体
         */
        constructor(raw?: CubeGeometryRaw);
        protected buildGeometry(): void;
        /**
         * 构建坐标
         * @param   width           宽度
         * @param   height          高度
         * @param   depth           深度
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        private buildPosition();
        /**
         * 构建法线
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        private buildNormal();
        /**
         * 构建切线
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        private buildTangent();
        /**
         * 构建索引
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        private buildIndices();
        /**
         * 构建uv
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         * @param   tile6           是否为6块贴图
         */
        private buildUVs();
    }
}
declare namespace feng3d {
    /**
     * 球体几何体原始数据
     */
    interface SphereGeometryRaw {
        __class__?: "feng3d.SphereGeometry";
        /**
         * 球体半径
         */
        radius?: number;
        /**
         * 横向分割数
         */
        segmentsW?: number;
        /**
         * 纵向分割数
         */
        segmentsH?: number;
        /**
         * 是否朝上
         */
        yUp?: boolean;
    }
    /**
     * 球体几何体
     * @author DawnKing 2016-09-12
     */
    class SphereGeometry extends Geometry implements SphereGeometryRaw {
        radius: number;
        segmentsW: number;
        segmentsH: number;
        yUp: boolean;
        /**
         * 创建球形几何体
         */
        constructor(raw?: SphereGeometryRaw);
        /**
         * 构建几何体数据
         * @param this.radius 球体半径
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        protected buildGeometry(): void;
        /**
         * 构建顶点索引
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildIndices();
        /**
         * 构建uv
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         */
        private buildUVs();
    }
}
declare namespace feng3d {
    /**
     * 胶囊体几何体原始数据
     */
    interface CapsuleGeometryRaw {
        __class__?: "feng3d.CapsuleGeometry";
        /**
         * 胶囊体半径
         */
        radius?: number;
        /**
         * 胶囊体高度
         */
        height?: number;
        /**
         * 横向分割数
         */
        segmentsH?: number;
        /**
         * 纵向分割数
         */
        segmentsW?: number;
        /**
         * 正面朝向 true:Y+ false:Z+
         */
        yUp?: boolean;
    }
    /**
     * 胶囊体几何体
     * @author DawnKing 2016-09-12
     */
    class CapsuleGeometry extends Geometry implements CapsuleGeometryRaw {
        radius: number;
        height: number;
        segmentsW: number;
        segmentsH: number;
        yUp: boolean;
        /**
         * 创建胶囊几何体
         * @param radius 胶囊体半径
         * @param height 胶囊体高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        constructor(raw?: CapsuleGeometryRaw);
        /**
         * 构建几何体数据
         * @param radius 胶囊体半径
         * @param height 胶囊体高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        protected buildGeometry(): void;
        /**
         * 构建顶点索引
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        private buildIndices();
        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        private buildUVs();
    }
}
declare namespace feng3d {
    /**
     * 圆柱体几何体原始数据
     */
    interface CylinderGeometryRaw {
        __class__?: "feng3d.CylinderGeometry";
        /**
         * 顶部半径
         */
        topRadius?: number;
        /**
         * 底部半径
         */
        bottomRadius?: number;
        /**
         * 高度
         */
        height?: number;
        /**
         * 横向分割数
         */
        segmentsW?: number;
        /**
         * 纵向分割数
         */
        segmentsH?: number;
        /**
         * 顶部是否封口
         */
        topClosed?: boolean;
        /**
         * 底部是否封口
         */
        bottomClosed?: boolean;
        /**
         * 侧面是否封口
         */
        surfaceClosed?: boolean;
        /**
         * 是否朝上
         */
        yUp?: boolean;
    }
    /**
     * 圆柱体几何体
     * @author DawnKing 2016-09-12
     */
    class CylinderGeometry extends Geometry implements CylinderGeometryRaw {
        topRadius: number;
        bottomRadius: number;
        height: number;
        segmentsW: number;
        segmentsH: number;
        topClosed: boolean;
        bottomClosed: boolean;
        surfaceClosed: boolean;
        yUp: boolean;
        /**
         * 创建圆柱体
         */
        constructor(raw?: CylinderGeometryRaw);
        /**
         * 构建几何体数据
         */
        protected buildGeometry(): void;
        /**
         * 构建顶点索引
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        private buildIndices();
        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        private buildUVs();
    }
}
declare namespace feng3d {
    /**
     * 圆锥体原始数据
     */
    interface ConeGeometryRaw {
        __class__?: "feng3d.ConeGeometry";
        /**
         * 底部半径
         */
        bottomRadius?: number;
        /**
         * 高度
         */
        height?: number;
        /**
         * 横向分割数
         */
        segmentsW?: number;
        /**
         * 纵向分割数
         */
        segmentsH?: number;
        /**
         * 底部是否封口
         */
        bottomClosed?: boolean;
        /**
         * 是否朝上
         */
        yUp?: boolean;
    }
    /**
     * 圆锥体
     * @author feng 2017-02-07
     */
    class ConeGeometry extends CylinderGeometry implements ConeGeometryRaw {
        topRadius: number;
        topClosed: boolean;
        surfaceClosed: boolean;
        /**
         * 创建圆锥体
         */
        constructor(raw?: ConeGeometryRaw);
    }
}
declare namespace feng3d {
    /**
     * 圆环几何体原始数据
     */
    interface TorusGeometryRaw {
        __class__?: "feng3d.TorusGeometry";
        /**
         * 半径
         */
        radius?: number;
        /**
         * 管道半径
         */
        tubeRadius?: number;
        /**
         * 半径方向分割数
         */
        segmentsR?: number;
        /**
         * 管道方向分割数
         */
        segmentsT?: number;
        /**
         * 是否朝上
         */
        yUp?: boolean;
    }
    /**
     * 圆环几何体
     */
    class TorusGeometry extends Geometry implements TorusGeometryRaw {
        radius: number;
        tubeRadius: number;
        segmentsR: number;
        segmentsT: number;
        yUp: boolean;
        /**
         * 创建<code>Torus</code>实例
         */
        constructor(raw?: TorusGeometryRaw);
        protected _vertexPositionData: number[];
        protected _vertexNormalData: number[];
        protected _vertexTangentData: number[];
        private _rawIndices;
        private _vertexIndex;
        private _currentTriangleIndex;
        private _numVertices;
        private _vertexPositionStride;
        private _vertexNormalStride;
        private _vertexTangentStride;
        /**
         * 添加顶点数据
         */
        private addVertex(vertexIndex, px, py, pz, nx, ny, nz, tx, ty, tz);
        /**
         * 添加三角形索引数据
         * @param currentTriangleIndex		当前三角形索引
         * @param cwVertexIndex0			索引0
         * @param cwVertexIndex1			索引1
         * @param cwVertexIndex2			索引2
         */
        private addTriangleClockWise(currentTriangleIndex, cwVertexIndex0, cwVertexIndex1, cwVertexIndex2);
        /**
         * @inheritDoc
         */
        protected buildGeometry(): void;
        /**
         * @inheritDoc
         */
        protected buildUVs(): void;
    }
}
declare namespace feng3d {
    interface Texture2DRaw extends TextureInfoRaw {
        __class__?: "feng3d.Texture2D";
        /**
         * 纹理路径
         */
        url?: string;
    }
    var imageDatas: {
        black: ImageData;
        white: ImageData;
        red: ImageData;
        green: ImageData;
        blue: ImageData;
        defaultNormal: ImageData;
    };
    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    class Texture2D extends TextureInfo {
        protected _pixels: HTMLImageElement;
        url: string;
        /**
         * 纹理尺寸
         */
        readonly size: Vector2;
        constructor(raw?: Texture2DRaw);
        /**
         * 判断数据是否满足渲染需求
         */
        checkRenderData(): boolean;
        private urlChanged();
        private onImageAssetsChanged(e);
    }
}
declare namespace feng3d {
    interface TextureCubeRaw extends TextureInfoRaw {
        __class__: "feng3d.TextureCube";
        negative_x_url?: string;
        negative_y_url?: string;
        negative_z_url?: string;
        positive_x_url?: string;
        positive_y_url?: string;
        positive_z_url?: string;
    }
    /**
     * 立方体纹理
     * @author feng 2016-12-28
     */
    class TextureCube extends TextureInfo {
        protected _pixels: HTMLImageElement[];
        positive_x_url: string;
        positive_y_url: string;
        positive_z_url: string;
        negative_x_url: string;
        negative_y_url: string;
        negative_z_url: string;
        constructor(images?: string[]);
        /**
         * 判断数据是否满足渲染需求
         */
        checkRenderData(): boolean;
        private urlChanged();
    }
}
declare namespace feng3d {
    class ImageDataTexture extends TextureInfo {
        pixels: ImageData;
        protected _pixels: ImageData;
        constructor();
        /**
         * 判断数据是否满足渲染需求
         */
        checkRenderData(): boolean;
    }
}
declare namespace feng3d {
}
declare namespace feng3d {
    interface MaterialRawMap {
    }
    type MaterialRaw = ValueOf<MaterialRawMap>;
    /**
     * 基础材质原始数据
     */
    interface MaterialBaseRaw {
        __class__?: "feng3d.Material";
        shaderName?: string;
        uniforms?: Object;
        renderParams?: Partial<RenderParams>;
    }
    /**
     * 材质工厂
     */
    class MaterialFactory {
    }
    var materialFactory: MaterialFactory;
    /**
     * 材质
     * @author feng 2016-05-02
     */
    class Material {
        /**
         * shader名称
         */
        shaderName: string;
        /**
         * Uniform数据
         */
        uniforms: StandardUniforms;
        /**
         * 渲染参数
         */
        renderParams: RenderParams;
        /**
         * 渲染程序
         */
        shader: Shader;
        constructor(raw?: MaterialRaw);
        preRender(renderAtomic: RenderAtomic): void;
        private onShaderChanged();
    }
}
declare namespace feng3d {
    /**
     * 颜色材质
     * @author feng 2017-01-11
     */
    type PointMaterial = Material & {
        uniforms: PointUniforms;
    };
    interface MaterialFactory {
        create(shader: "point", raw?: PointMaterialRaw): PointMaterial;
    }
    interface MaterialRawMap {
        point: PointMaterialRaw;
    }
    interface PointMaterialRaw extends MaterialBaseRaw {
        shaderName?: "point";
        uniforms?: PointUniformsRaw;
    }
    interface PointUniformsRaw {
        /**
         * 类全名
         */
        __class__?: "feng3d.SegmentUniforms";
        /**
         * 颜色
         */
        u_color?: Color4 | Color4Raw;
        /**
         * 点绘制时点的尺寸
         */
        u_PointSize?: number;
    }
    class PointUniforms {
        /**
         * 颜色
         */
        u_color: Color4;
        /**
         * 点绘制时点的尺寸
         */
        u_PointSize: number;
    }
}
declare namespace feng3d {
    /**
     * 颜色材质
     * @author feng 2016-05-02
     */
    type ColorMaterial = Material & {
        uniforms: ColorUniforms;
    };
    interface MaterialFactory {
        create(shader: "color", raw?: ColorMaterialRaw): ColorMaterial;
    }
    interface MaterialRawMap {
        color: ColorMaterialRaw;
    }
    interface ColorMaterialRaw extends MaterialBaseRaw {
        shaderName?: "color";
        uniforms?: ColorUniformsRaw;
    }
    interface ColorUniformsRaw {
        __class__?: "feng3d.ColorUniforms";
        u_diffuseInput?: Color4 | Color4Raw;
    }
    class ColorUniforms {
        /**
         * 颜色
         */
        u_diffuseInput: Color4;
    }
}
declare namespace feng3d {
    /**
     * 线段材质
     * 目前webgl不支持修改线条宽度，参考：https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth
     * @author feng 2016-10-15
     */
    type SegmentMaterial = Material & {
        uniforms: SegmentUniforms;
    };
    interface MaterialFactory {
        create(shader: "segment", raw?: SegmentMaterialRaw): SegmentMaterial;
    }
    interface MaterialRawMap {
        segment: SegmentMaterialRaw;
    }
    interface SegmentMaterialRaw extends MaterialBaseRaw {
        shaderName?: "segment";
        uniforms?: SegmentUniformsRaw;
    }
    interface SegmentUniformsRaw {
        /**
         * 类全名
         */
        __class__?: "feng3d.SegmentUniforms";
        /**
         * 颜色
         */
        u_segmentColor?: Color4 | Color4Raw;
    }
    class SegmentUniforms {
        /**
         * 颜色
         */
        u_segmentColor: Color4;
    }
}
declare namespace feng3d {
    /**
     * 纹理材质
     * @author feng 2016-12-23
     */
    type TextureMaterial = Material & {
        uniforms: TextureUniforms;
    };
    interface MaterialFactory {
        create(shader: "texture", raw?: TextureMaterialRaw): TextureMaterial;
    }
    interface MaterialRawMap {
        texture: TextureMaterialRaw;
    }
    interface TextureMaterialRaw extends MaterialBaseRaw {
        shaderName?: "texture";
        uniforms?: TextureUniformsRaw;
    }
    interface TextureUniformsRaw {
        __class__?: "feng3d.TextureUniforms";
        u_color?: Color4 | Color4Raw;
        s_texture?: Texture2D | Texture2DRaw;
    }
    class TextureUniforms {
        /**
         * 颜色
         */
        u_color: Color4;
        /**
         * 纹理数据
         */
        s_texture: Texture2D;
    }
}
declare namespace feng3d {
    type StandardMaterial = Material & {
        uniforms: StandardUniforms;
    };
    interface MaterialFactory {
        create(shader: "standard", raw?: StandardMaterialRaw): StandardMaterial;
    }
    interface MaterialRawMap {
        standard: StandardMaterialRaw;
    }
    interface StandardMaterialRaw extends MaterialBaseRaw {
        shaderName?: "standard";
        uniforms?: StandardUniformsRaw;
    }
    interface StandardUniformsRaw {
        __class__?: "feng3d.StandardUniforms";
        s_ambient?: Texture2DRaw;
        s_diffuse?: Texture2DRaw;
        s_envMap?: TextureCubeRaw;
        s_normal?: Texture2DRaw;
        s_specular?: Texture2DRaw;
        u_ambient?: Color3Raw;
        u_diffuse?: Color3Raw;
        u_reflectivity?: number;
        u_specular?: Color3Raw;
    }
    /**
     * 雾模式
     */
    enum FogMode {
        NONE = 0,
        EXP = 1,
        EXP2 = 2,
        LINEAR = 3,
    }
    class StandardUniforms {
        /**
         * 点绘制时点的尺寸
         */
        u_PointSize: number;
        /**
         * 漫反射纹理
         */
        s_diffuse: Texture2D;
        /**
         * 基本颜色
         */
        u_diffuse: Color4;
        /**
         * 透明阈值，透明度小于该值的像素被片段着色器丢弃
         */
        u_alphaThreshold: number;
        /**
         * 漫反射纹理
         */
        s_normal: Texture2D;
        /**
         * 镜面反射光泽图
         */
        s_specular: Texture2D;
        /**
         * 镜面反射颜色
         */
        u_specular: Color3;
        /**
         * 高光系数
         */
        u_glossiness: number;
        /**
         * 环境纹理
         */
        s_ambient: Texture2D;
        /**
         * 颜色
         */
        u_ambient: Color4;
        /**
         * 环境映射贴图
         */
        s_envMap: TextureCube;
        /**
         * 反射率
         */
        u_reflectivity: number;
        /**
         * 出现雾效果的最近距离
         */
        u_fogMinDistance: number;
        /**
         * 最远距离
         */
        u_fogMaxDistance: number;
        /**
         * 雾的颜色
         */
        u_fogColor: Color3;
        u_fogDensity: number;
        /**
         * 雾模式
         */
        u_fogMode: FogMode;
    }
}
declare namespace feng3d {
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
declare namespace feng3d {
    interface LightRaw {
        /**
         * 灯光类型
         */
        lightType?: LightType;
        /**
         * 颜色
         */
        color?: Color3 | Color3Raw;
        /**
         * 光照强度
         */
        intensity?: number;
        /**
         * 是否生成阴影（未实现）
         */
        castsShadows?: boolean;
    }
    /**
     * 灯光
     * @author feng 2016-12-12
     */
    class Light extends Behaviour {
        /**
         * 灯光类型
         */
        lightType: LightType;
        /**
         * 颜色
         */
        color: Color3;
        /**
         * 光照强度
         */
        intensity: number;
        /**
         * 是否生成阴影（未实现）
         */
        castsShadows: boolean;
        private _shadowMap;
        readonly shadowMap: Texture2D;
        init(gameObject: GameObject): void;
    }
}
declare namespace feng3d {
    interface ComponentRawMap {
        DirectionalLight: DirectionalLightRaw;
    }
    interface DirectionalLightRaw extends LightRaw {
        __class__?: "feng3d.DirectionalLight";
    }
    /**
     * 方向光源
     * @author feng 2016-12-13
     */
    class DirectionalLight extends Light {
        /**
         * 构建
         */
        init(gameObject: GameObject): void;
    }
}
declare namespace feng3d {
    interface ComponentRawMap {
        PointLight: PointLightRaw;
    }
    interface PointLightRaw extends LightRaw {
        __class__?: "feng3d.PointLight";
        /**
         * 光照范围
         */
        range?: number;
    }
    /**
     * 点光源
     * @author feng 2016-12-13
     */
    class PointLight extends Light {
        /**
         * 光照范围
         */
        range: number;
        /**
         * 构建
         */
        init(gameObject: GameObject): void;
    }
}
declare namespace feng3d {
    class ControllerBase {
        /**
         * 控制对象
         */
        protected _targetObject: GameObject | undefined;
        /**
         * 控制器基类，用于动态调整3D对象的属性
         */
        constructor(targetObject?: GameObject);
        /**
         * 手动应用更新到目标3D对象
         */
        update(interpolate?: boolean): void;
        targetObject: GameObject;
    }
}
declare namespace feng3d {
    class LookAtController extends ControllerBase {
        protected _lookAtPosition: Vector3;
        protected _lookAtObject: GameObject;
        protected _origin: Vector3;
        protected _upAxis: Vector3;
        protected _pos: Vector3;
        constructor(target?: GameObject, lookAtObject?: GameObject);
        upAxis: Vector3;
        lookAtPosition: Vector3;
        lookAtObject: GameObject;
        update(interpolate?: boolean): void;
    }
}
declare namespace feng3d {
    class HoverController extends LookAtController {
        _currentPanAngle: number;
        _currentTiltAngle: number;
        private _panAngle;
        private _tiltAngle;
        private _distance;
        private _minPanAngle;
        private _maxPanAngle;
        private _minTiltAngle;
        private _maxTiltAngle;
        private _steps;
        private _yFactor;
        private _wrapPanAngle;
        steps: number;
        panAngle: number;
        tiltAngle: number;
        distance: number;
        minPanAngle: number;
        maxPanAngle: number;
        minTiltAngle: number;
        maxTiltAngle: number;
        yFactor: number;
        wrapPanAngle: boolean;
        constructor(targetObject?: GameObject, lookAtObject?: GameObject, panAngle?: number, tiltAngle?: number, distance?: number, minTiltAngle?: number, maxTiltAngle?: number, minPanAngle?: number, maxPanAngle?: number, steps?: number, yFactor?: number, wrapPanAngle?: boolean);
        update(interpolate?: boolean): void;
    }
}
declare namespace feng3d {
    /**
     * FPS模式控制器
     * @author feng 2016-12-19
     */
    class FPSController extends Behaviour {
        /**
         * 加速度
         */
        acceleration: number;
        flag: ScriptFlag;
        /**
         * 按键记录
         */
        private keyDownDic;
        /**
         * 按键方向字典
         */
        private keyDirectionDic;
        /**
         * 速度
         */
        private velocity;
        /**
         * 上次鼠标位置
         */
        private preMousePoint;
        private ischange;
        private _auto;
        auto: boolean;
        init(gameobject: GameObject): void;
        onMousedown(): void;
        onMouseup(): void;
        /**
         * 销毁
         */
        dispose(): void;
        /**
         * 手动应用更新到目标3D对象
         */
        update(): void;
        private mousePoint;
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
declare namespace feng3d {
    /**
     * 射线投射拾取器
     * @author feng 2014-4-29
     */
    var raycaster: {
        pick(ray3D: Ray3D, entitys: GameObject[]): PickingCollisionVO;
        pickFromCamera(coords: {
            x: number;
            y: number;
        }, camera: Camera, entitys: GameObject[]): PickingCollisionVO;
    };
    /**
     * 拾取的碰撞数据
     */
    interface PickingCollisionVO {
        /**
         * 第一个穿过的物体
         */
        gameObject: GameObject;
        /**
         * 碰撞的uv坐标
         */
        uv?: Vector2;
        /**
         * 实体上碰撞本地坐标
         */
        localPosition?: Vector3;
        /**
         * 射线顶点到实体的距离
         */
        rayEntryDistance: number;
        /**
         * 本地坐标系射线
         */
        localRay: Ray3D;
        /**
         * 本地坐标碰撞法线
         */
        localNormal: Vector3;
        /**
         * 场景中碰撞射线
         */
        ray3D: Ray3D;
        /**
         * 射线坐标是否在边界内
         */
        rayOriginIsInsideBounds: boolean;
        /**
         * 碰撞三角形索引
         */
        index?: number;
        /**
         * 碰撞关联的渲染对象
         */
        geometry: Geometry;
    }
}
declare namespace feng3d {
    /**
     * 地形几何体原始数据
     */
    interface TerrainGeometryRaw {
        /**
         * 高度图路径
         */
        heightMapUrl?: string;
        /**
         * 地形宽度
         */
        width?: number;
        /**
         * 地形高度
         */
        height?: number;
        /**
         * 地形深度
         */
        depth?: number;
        /**
         * 横向网格段数
         */
        segmentsW?: number;
        /**
         * 纵向网格段数
         */
        segmentsH?: number;
        /**
         * 最大地形高度
         */
        maxElevation?: number;
        /**
         * 最小地形高度
         */
        minElevation?: number;
    }
    /**
     * 地形几何体
     * @author feng 2016-04-28
     */
    class TerrainGeometry extends Geometry implements TerrainGeometryRaw {
        heightMapUrl: string;
        width: number;
        height: number;
        depth: number;
        segmentsW: number;
        segmentsH: number;
        maxElevation: number;
        minElevation: number;
        private _heightMap;
        /**
         * 创建高度地形 拥有segmentsW*segmentsH个顶点
         */
        constructor(raw?: TerrainGeometryRaw);
        /**
         * 几何体变脏
         */
        invalidateGeometry(propertyKey?: string, oldValue?: any, newValue?: any): void;
        /**
         * 创建顶点坐标
         */
        protected buildGeometry(): void;
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
declare namespace feng3d {
    type TerrainMaterial = Material & {
        uniforms: TerrainUniforms;
    };
    interface MaterialFactory {
        create(shader: "terrain", raw?: TerrainMaterialRaw): TerrainMaterial;
    }
    interface MaterialRawMap {
        terrain: TerrainMaterialRaw;
    }
    interface TerrainMaterialRaw extends MaterialBaseRaw {
        shaderName?: "terrain";
        uniforms?: TerrainUniformsRaw;
    }
    interface TerrainUniformsRaw {
        __class__?: "feng3d.TerrainUniforms";
        s_ambient?: Texture2DRaw;
        s_diffuse?: Texture2DRaw;
        s_envMap?: TextureCubeRaw;
        s_normal?: Texture2DRaw;
        s_specular?: Texture2DRaw;
        u_ambient?: Color3Raw;
        u_diffuse?: Color3Raw;
        u_reflectivity?: number;
        u_specular?: Color3Raw;
        s_splatTexture1: Texture2D | Texture2DRaw;
        s_splatTexture2: Texture2D | Texture2DRaw;
        s_splatTexture3: Texture2D | Texture2DRaw;
        s_blendTexture: Texture2D | Texture2DRaw;
        u_splatRepeats: Vector4;
    }
    class TerrainUniforms extends StandardUniforms {
        s_splatTexture1: Texture2D;
        s_splatTexture2: Texture2D;
        s_splatTexture3: Texture2D;
        s_blendTexture: Texture2D;
        u_splatRepeats: Vector4;
    }
}
declare namespace feng3d {
    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    class TerrainMergeMethod extends EventDispatcher {
        splatMergeTexture: Texture2D;
        blendTexture: Texture2D;
        splatRepeats: Vector4;
        /**
         * 构建材质
         */
        constructor();
        preRender(renderAtomic: RenderAtomic): void;
    }
}
declare namespace feng3d {
    /**
     * The TerrainData class stores heightmaps, detail mesh positions, tree instances, and terrain texture alpha maps.
     *
     * The Terrain component links to the terrain data and renders it.
     */
    class TerrainData {
        /**
         * Width of the terrain in samples(Read Only).
         */
        readonly heightmapWidth: number;
        /**
         * Height of the terrain in samples(Read Only).
         */
        readonly heightmapHeight: number;
        /**
         * Resolution of the heightmap.
         */
        heightmapResolution: number;
        /**
         * The size of each heightmap sample.
         */
        readonly heightmapScale: Vector3;
        /**
         * The total size in world units of the terrain.
         */
        size: Vector3;
    }
}
declare namespace feng3d {
    /**
     * The Terrain component renders the terrain.
     */
    class Terrain extends MeshRenderer {
        /**
         * 地形资源
         */
        assign: TerrainData;
        /**
         * 地形几何体数据
         */
        geometry: TerrainGeometry;
        material: TerrainMaterial;
    }
}
declare namespace feng3d {
    /**
     * 粒子
     * 粒子系统会自动在shader中匹配一个"a_particle_${attribute}"顶点属性,并且属性值不为空时会自动添加 "#define D_a_particle_${attribute}"
     * 例如：position 对应 a_particle_position 与 #define D_a_particle_position
     * @author feng 2017-01-12
     */
    class Particle {
        /**
         * 索引
         */
        index: number;
        /**
         * 粒子总数量
         */
        total: number;
        /**
         * 出生时间
         */
        birthTime: number;
        /**
         * 寿命
         */
        lifetime: number;
        /**
         * 位移
         */
        position: Vector3;
        /**
         * 旋转
         */
        rotation: Vector3;
        /**
         * 缩放
         */
        scalenew: Vector3;
        /**
         * 速度
         */
        velocity: Vector3;
        /**
         * 加速度
         */
        acceleration: Vector3;
        /**
         * 颜色
         */
        color: Color4;
    }
}
declare namespace feng3d {
    /**
     * 粒子
     * 粒子系统会自动在shader中匹配一个"a_particle_${attribute}"顶点属性,并且属性值不为空时会自动添加 "#define D_a_particle_${attribute}"
     * 例如：position 对应 a_particle_position 与 #define D_a_particle_position
     * @author feng 2017-01-12
     */
    class ParticleGlobal {
        /**
         * 加速度
         */
        acceleration: Vector3;
        /**
         * 公告牌矩阵
         */
        billboardMatrix: Matrix4x4;
    }
}
declare namespace feng3d {
    /**
     * 粒子动画组件
     * @author feng 2017-01-09
     */
    class ParticleComponent {
        /**
         * 是否开启
         */
        enable: boolean;
        /**
         * 优先级
         */
        priority: number;
        /**
         * 数据是否变脏
         */
        isDirty: boolean;
        invalidate(): void;
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        generateParticle(particle: Particle): void;
        setRenderState(particleSystem: ParticleSystem): void;
    }
}
declare namespace feng3d {
    /**
     * 粒子发射器
     * @author feng 2017-01-09
     */
    class ParticleEmission extends ParticleComponent {
        /**
         * 发射率，每秒发射粒子数量
         */
        rate: number;
        /**
         * 爆发，在time时刻额外喷射particles粒子
         */
        bursts: {
            time: number;
            particles: number;
        }[];
        isDirty: boolean;
        private _numParticles;
        private _birthTimes;
        constructor();
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        generateParticle(particle: Particle): void;
        /**
         * 获取出生时间数组
         */
        private getBirthTimeArray(numParticles);
    }
}
declare namespace feng3d {
    /**
     * 粒子速度组件
     * @author feng 2017-01-09
     */
    class ParticlePosition extends ParticleComponent {
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        generateParticle(particle: Particle): void;
    }
}
declare namespace feng3d {
    /**
     * 粒子速度组件
     * @author feng 2017-01-09
     */
    class ParticleVelocity extends ParticleComponent {
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        generateParticle(particle: Particle): void;
    }
}
declare namespace feng3d {
    /**
     * 粒子颜色组件
     * @author feng 2017-03-14
     */
    class ParticleColor extends ParticleComponent {
        /**
         * 创建粒子属性
         * @param particle                  粒子
         */
        generateParticle(particle: Particle): void;
    }
}
declare namespace feng3d {
    class ParticleBillboard extends ParticleComponent {
        /**
         * 看向的摄像机
         */
        camera: Camera;
        /** 广告牌轴线 */
        billboardAxis: Vector3;
        setRenderState(particleSystem: ParticleSystem): void;
    }
}
declare namespace feng3d {
    /**
     * 粒子系统
     * @author feng 2017-01-09
     */
    class ParticleSystem extends MeshRenderer {
        geometry: Geometry;
        material: Material;
        /**
         * 是否正在播放
         */
        isPlaying: boolean;
        /**
         * 粒子时间
         */
        time: number;
        /**
         * 播放速度
         */
        playspeed: number;
        /**
         * 周期
         */
        cycle: number;
        /**
         * 生成粒子函数列表，优先级越高先执行
         */
        generateFunctions: ({
            generate: (particle: Particle) => void;
            priority: number;
        })[];
        /**
         * 属性数据列表
         */
        private _attributes;
        readonly animations: {
            emission: ParticleEmission;
            position: ParticlePosition;
            velocity: ParticleVelocity;
            color: ParticleColor;
            billboard: ParticleBillboard;
        };
        /**
         * 粒子全局属性
         */
        readonly particleGlobal: ParticleGlobal;
        /**
         * 粒子数量
         */
        numParticles: number;
        private _isDirty;
        readonly single: boolean;
        init(gameObject: GameObject): void;
        update(interval: number): void;
        private updateRenderState();
        invalidate(): void;
        /**
         * 生成粒子
         */
        private generateParticles();
        /**
         * 收集粒子数据
         * @param particle      粒子
         */
        private collectionParticle(particle);
        /**
         * 收集粒子属性数据
         * @param attributeID       属性编号
         * @param index             粒子编号
         * @param data              属性数据
         */
        private collectionParticleAttribute(attribute, particle);
        preRender(renderAtomic: RenderAtomic): void;
    }
}
declare namespace feng3d {
    type ParticleMaterial = Material & {
        uniforms: ParticleUniforms;
    };
    interface MaterialFactory {
        create(shader: "particle", raw?: ParticleMaterialRaw): ParticleMaterial;
    }
    interface MaterialRawMap {
        particle: ParticleMaterialRaw;
    }
    interface ParticleMaterialRaw extends MaterialBaseRaw {
        shaderName?: "particle";
        uniforms?: ParticleUniformsRaw;
    }
    interface ParticleUniformsRaw {
        __class__?: "feng3d.ParticleUniforms";
        s_ambient?: Texture2DRaw;
        s_diffuse?: Texture2DRaw;
        s_envMap?: TextureCubeRaw;
        s_normal?: Texture2DRaw;
        s_specular?: Texture2DRaw;
        u_ambient?: Color3Raw;
        u_diffuse?: Color3Raw;
        u_reflectivity?: number;
        u_specular?: Color3Raw;
    }
    class ParticleUniforms extends StandardUniforms {
    }
}
declare namespace feng3d {
    /**
     * 骨骼关节数据
     * @author feng 2014-5-20
     */
    class SkeletonJoint {
        /** 父关节索引 （-1说明本身是总父节点，这个序号其实就是行号了，譬如上面”origin“节点的序号就是0，无父节点； "body"节点序号是1，父节点序号是0，也就是说父节点是”origin“）*/
        parentIndex: number;
        /** 关节名字 */
        name: string;
        /** 骨骼全局矩阵 */
        matrix3D: Matrix4x4;
        children: number[];
        readonly invertMatrix3D: Matrix4x4;
        private _invertMatrix3D;
    }
}
declare namespace feng3d {
    class SkeletonComponent extends Component {
        /** 骨骼关节数据列表 */
        joints: SkeletonJoint[];
        private isInitJoints;
        /**
         * 当前骨骼姿势的全局矩阵
         * @see #globalPose
         */
        readonly globalMatrices: Matrix4x4[];
        private jointGameobjects;
        private jointGameObjectMap;
        private _globalPropertiesInvalid;
        private _jointsInvalid;
        private _globalMatrix3DsInvalid;
        private globalMatrix3Ds;
        private _globalMatrices;
        initSkeleton(): void;
        /**
         * 更新骨骼全局变换矩阵
         */
        private updateGlobalProperties();
        private invalidjoint(jointIndex);
        private createSkeletonGameObject();
    }
}
declare namespace feng3d {
    class SkinnedMeshRenderer extends MeshRenderer {
        readonly single: boolean;
        skinSkeleton: SkinSkeleton;
        material: SkeletonMaterial;
        private skeletonGlobalMatriices;
        /**
         * 缓存，通过寻找父节点获得
         */
        private cacheSkeletonComponent;
        initMatrix3d: Matrix4x4;
        /**
         * 创建一个骨骼动画类
         */
        init(gameObject: GameObject): void;
        private readonly u_modelMatrix;
        private readonly u_ITModelMatrix;
        private readonly u_skeletonGlobalMatriices;
        preRender(renderAtomic: RenderAtomic): void;
        /**
         * 销毁
         */
        dispose(): void;
    }
    class SkinSkeleton {
        /**
         * [在整个骨架中的编号，骨骼名称]
         */
        joints: [number, string][];
        /**
         * 当前模型包含骨骼数量
         */
        numJoint: number;
    }
    class SkinSkeletonTemp extends SkinSkeleton {
        /**
         * temp 解析时临时数据
         */
        cache_map: {
            [oldjointid: number]: number;
        };
        resetJointIndices(jointIndices: number[], skeleton: SkeletonComponent): void;
    }
}
declare namespace feng3d {
    type SkeletonMaterial = Material & {
        uniforms: SkeletonUniforms;
    };
    interface MaterialFactory {
        create(shader: "skeleton", raw?: SkeletonMaterialRaw): SkeletonMaterial;
    }
    interface MaterialRawMap {
        skeleton: SkeletonMaterialRaw;
    }
    interface SkeletonMaterialRaw extends MaterialBaseRaw {
        shaderName?: "skeleton";
        uniforms?: SkeletonUniformsRaw;
    }
    interface SkeletonUniformsRaw {
        __class__?: "feng3d.SkeletonUniforms";
        s_ambient?: Texture2DRaw;
        s_diffuse?: Texture2DRaw;
        s_envMap?: TextureCubeRaw;
        s_normal?: Texture2DRaw;
        s_specular?: Texture2DRaw;
        u_ambient?: Color3Raw;
        u_diffuse?: Color3Raw;
        u_reflectivity?: number;
        u_specular?: Color3Raw;
    }
    class SkeletonUniforms extends StandardUniforms {
    }
}
declare namespace feng3d {
    class Animation extends Component {
        animation: AnimationClip;
        private _animation;
        animations: AnimationClip[];
        /**
         * 动画事件，单位为ms
         */
        time: number;
        private _time;
        isplaying: boolean;
        /**
         * 播放速度
         */
        playspeed: number;
        update(interval: number): void;
        private num;
        private updateAni();
        private _objectCache;
        private getPropertyHost(propertyClip);
        dispose(): void;
    }
    class AnimationClip {
        name: string;
        /**
         * 动画时长，单位ms
         */
        length: number;
        loop: boolean;
        propertyClips: PropertyClip[];
    }
    class PropertyClip {
        /**
         * 属性路径
         */
        path: PropertyClipPath;
        propertyName: string;
        type: "Number" | "Vector3" | "Quaternion";
        propertyValues: [number, number[]][];
        cacheIndex: number;
    }
    /**
     * [time:number,value:number | Vector3 | Quaternion]
     */
    type ClipPropertyType = number | Vector3 | Quaternion;
    type PropertyClipPath = [PropertyClipPathItemType, string][];
    enum PropertyClipPathItemType {
        GameObject = 0,
        Component = 1,
    }
}
declare namespace feng3d {
    /**
     * 文件系统类型
     */
    enum FSType {
        http = "http",
        native = "native",
        indexedDB = "indexedDB",
    }
    /**
     * 资源系统
     */
    var assets: Assets;
    /**
     * 资源
     * 在可读文件系统上进行加工，比如把读取数据转换为图片或者文本
     */
    class Assets implements ReadFS {
        /**
         * 可读文件系统
         */
        readFS: ReadFS;
        readonly type: FSType;
        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readFile(path: string, callback: (err, data: ArrayBuffer) => void): void;
        /**
         * 加载图片
         * @param path 图片路径
         * @param callback 加载完成回调
         */
        loadImage(path: string, callback: (err: Error, img: HTMLImageElement) => void): void;
    }
    /**
     * 可读文件系统
     */
    interface ReadFS {
        /**
         * 文件系统类型
         */
        readonly type: FSType;
        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readFile(path: string, callback: (err, data: ArrayBuffer) => void): any;
    }
}
declare namespace feng3d {
    var httpAssets: HttpAssets;
    class HttpAssets implements ReadFS {
        readonly type: FSType;
        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readFile(path: string, callback: (err, data: ArrayBuffer) => void): void;
    }
}
interface IDBObjectStore {
    getAllKeys(): IDBRequest;
}
declare namespace feng3d {
    var storage: {
        support(): boolean;
        getDatabase(dbname: string, callback: (err: any, database: IDBDatabase) => void): void;
        deleteDatabase(dbname: string, callback?: (err: any) => void): void;
        hasObjectStore(dbname: string, objectStroreName: string, callback: (has: boolean) => void): void;
        getObjectStoreNames(dbname: string, callback: (err: Error, objectStoreNames: string[]) => void): void;
        createObjectStore(dbname: string, objectStroreName: string, callback?: (err: any) => void): void;
        deleteObjectStore(dbname: string, objectStroreName: string, callback?: (err: any) => void): void;
        getAllKeys(dbname: string, objectStroreName: string, callback?: (err: Error, keys: string[]) => void): void;
        get(dbname: string, objectStroreName: string, key: string | number, callback?: (err: Error, data: any) => void): void;
        set(dbname: string, objectStroreName: string, key: string | number, data: any, callback?: (err: Error) => void): void;
        delete(dbname: string, objectStroreName: string, key: string | number, callback?: (err?: Error) => void): void;
        clear(dbname: string, objectStroreName: string, callback?: (err?: Error) => void): void;
    };
}
declare namespace feng3d {
    /**
     * 索引数据资源
     */
    var indexedDBAssets: IndexedDBAssets;
    /**
     * 索引数据资源
     */
    class IndexedDBAssets implements ReadFS {
        readonly type: FSType;
        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readFile(path: string, callback: (err, data: ArrayBuffer) => void): void;
    }
    /**
     * 索引数据文件系统
     */
    var indexedDBfs: IndexedDBfs;
    /**
     * 索引数据文件系统
     */
    class IndexedDBfs implements FS {
        /**
         * 数据库名称
         */
        DBname: string;
        /**
         * 项目名称（表单名称）
         */
        projectname: string;
        hasProject(projectname: string, callback: (has: boolean) => void): void;
        getProjectList(callback: (err: Error | null, projects: string[] | null) => void): void;
        initproject(projectname1: string, callback: () => void): void;
        stat(path: string, callback: (err: Error | null, stats: FileInfo | null) => void): void;
        readdir(path: string, callback: (err: Error | null, files: string[] | null) => void): void;
        writeFile(path: string, data: ArrayBuffer, callback?: (err: Error | null) => void): void;
        /**
         * 读取文件为字符串
         */
        readFileAsString(path: string, callback: (err: Error | null, data: string | null) => void): void;
        /**
         * 读取文件为Buffer
         */
        readFile(path: string, callback: (err: Error | null, data: ArrayBuffer | undefined) => void): void;
        mkdir(path: string, callback: (err: Error | null) => void): void;
        rename(oldPath: string, newPath: string, callback: (err: Error | null) => void): void;
        move(src: string, dest: string, callback?: (err: Error | null) => void): void;
        remove(path: string, callback?: (err: Error | null) => void): void;
        /**
         * 获取文件绝对路径
         */
        getAbsolutePath(path: string, callback: (err: Error | null, absolutePath: string | null) => void): void;
        /**
         * 获取指定文件下所有文件路径列表
         */
        getAllfilepathInFolder(dirpath: string, callback: (err: Error | null, filepaths: string[] | null) => void): void;
    }
    type FileInfo = {
        path: string;
        birthtime: number;
        mtime: number;
        isDirectory: boolean;
        size: number;
    };
    interface FS {
        hasProject(projectname: string, callback: (has: boolean) => void): void;
        getProjectList(callback: (err: Error | null, projects: string[] | null) => void): void;
        initproject(projectname: string, callback: () => void): void;
        stat(path: string, callback: (err: Error | null, stats: FileInfo | null) => void): void;
        readdir(path: string, callback: (err: Error | null, files: string[] | null) => void): void;
        writeFile(path: string, data: ArrayBuffer, callback?: ((err: Error | null) => void) | undefined): void;
        /**
         * 读取文件为字符串
         */
        readFileAsString(path: string, callback: (err: Error | null, data: string | null) => void): void;
        /**
         * 读取文件为Buffer
         */
        readFile(path: string, callback: (err: Error | null, data: ArrayBuffer | undefined) => void): void;
        mkdir(path: string, callback: (err: Error | null) => void): void;
        rename(oldPath: string, newPath: string, callback: (err: Error | null) => void): void;
        move(src: string, dest: string, callback?: ((err: Error | null) => void) | undefined): void;
        remove(path: string, callback?: ((err: Error | null) => void) | undefined): void;
        /**
         * 获取文件绝对路径
         */
        getAbsolutePath(path: string, callback: (err: Error | null, absolutePath: string | null) => void): void;
        /**
         * 获取指定文件下所有文件路径列表
         */
        getAllfilepathInFolder(dirpath: string, callback: (err: Error | null, filepaths: string[] | null) => void): void;
    }
}
declare namespace feng3d {
    /**
     * Obj模型解析器
     * @author feng 2017-01-13
     */
    var OBJParser: {
        parser: (context: string) => OBJ_OBJData;
    };
    /**
     * 面数据
     */
    type OBJ_Face = {
        /** 顶点索引 */
        vertexIndices: number[];
        /** uv索引 */
        uvIndices?: number[];
        /** 法线索引 */
        normalIndices?: number[];
        /** 索引数据 */
        indexIds: string[];
    };
    /**
     * 子对象
     */
    type OBJ_SubOBJ = {
        /** 材质名称 */
        material?: string;
        /**  */
        g?: string;
        /** 面列表 */
        faces: OBJ_Face[];
    };
    /**
     * 对象
     */
    type OBJ_OBJ = {
        name: string;
        /** 子对象 */
        subObjs: OBJ_SubOBJ[];
    };
    /**
     * Obj模型数据
     */
    type OBJ_OBJData = {
        /** mtl文件路径 */
        mtl: string | null;
        /** 顶点坐标 */
        vertex: {
            x: number;
            y: number;
            z: number;
        }[];
        /** 顶点法线 */
        vn: {
            x: number;
            y: number;
            z: number;
        }[];
        /** 顶点uv */
        vt: {
            u: number;
            v: number;
            s: number;
        }[];
        /** 模型列表 */
        objs: OBJ_OBJ[];
    };
}
declare namespace feng3d {
    /**
     * Obj模型Mtl解析器
     */
    var MtlParser: {
        parser: (context: string) => Mtl_Mtl;
    };
    type Mtl_Material = {
        name: string;
        ka: number[];
        kd: number[];
        ks: number[];
        ns: number;
        ni: number;
        d: number;
        illum: number;
        map_Bump: string;
        map_Ka: string;
        map_Kd: string;
        map_Ks: string;
    };
    type Mtl_Mtl = {
        [name: string]: Mtl_Material;
    };
}
declare namespace feng3d {
    /**
     * MD5模型解析
     */
    var MD5MeshParser: {
        parse: (context: string) => MD5MeshData;
    };
    /**
     * 关节权重数据
     */
    type MD5_Weight = {
        /** weight 序号 */
        index: number;
        /** 对应的Joint的序号 */
        joint: number;
        /** 作用比例 */
        bias: number;
        /** 位置值 */
        pos: number[];
    };
    type MD5_Vertex = {
        /** 顶点索引 */
        index: number;
        /** 纹理坐标u */
        u: number;
        /** 纹理坐标v */
        v: number;
        /** weight的起始序号 */
        startWeight: number;
        /** weight总数 */
        countWeight: number;
    };
    type MD5_Mesh = {
        shader: string;
        numverts: number;
        verts: MD5_Vertex[];
        numtris: number;
        tris: number[];
        numweights: number;
        weights: MD5_Weight[];
    };
    type MD5_Joint = {
        name: string;
        parentIndex: number;
        position: number[];
        /** 旋转数据 */
        rotation: number[];
    };
    type MD5MeshData = {
        MD5Version: number;
        commandline: string;
        numJoints: number;
        numMeshes: number;
        joints: MD5_Joint[];
        meshs: MD5_Mesh[];
    };
}
declare namespace feng3d {
    var MD5AnimParser: {
        parse: (context: string) => MD5AnimData;
    };
    /**
     * 帧数据
     */
    type MD5_Frame = {
        index: number;
        components: number[];
    };
    /**
     * 基础帧数据
     */
    type MD5_BaseFrame = {
        /** 位置 */
        position: number[];
        /** 方向 */
        orientation: number[];
    };
    /**
     * 包围盒信息
     */
    type MD5_Bounds = {
        /** 最小坐标 */
        min: number[];
        /** 最大坐标 */
        max: number[];
    };
    /**
     * 层级数据
     */
    type MD5_HierarchyData = {
        /** Joint 名字 */
        name: string;
        /** 父节点序号 */
        parentIndex: number;
        /** flag */
        flags: number;
        /** 影响的帧数据起始索引 */
        startIndex: number;
    };
    type MD5AnimData = {
        MD5Version: number;
        commandline: string;
        numFrames: number;
        numJoints: number;
        frameRate: number;
        numAnimatedComponents: number;
        hierarchy: MD5_HierarchyData[];
        bounds: MD5_Bounds[];
        baseframe: MD5_BaseFrame[];
        frame: MD5_Frame[];
    };
}
declare namespace feng3d.war3 {
    /**
     * 透明度动画
     * @author warden_feng 2014-6-26
     */
    class AnimAlpha {
        constructor();
    }
    /**
     * 全局动作信息
     * @author warden_feng 2014-6-26
     */
    class AnimInfo {
        /** 动作名称 */
        name: string;
        /** 动作间隔 */
        interval: Interval;
        /** 最小范围 */
        MinimumExtent: Vector3;
        /** 最大范围 */
        MaximumExtent: Vector3;
        /** 半径范围 */
        BoundsRadius: number;
        /** 发生频率 */
        Rarity: number;
        /** 是否循环 */
        loop: boolean;
        /** 移动速度 */
        MoveSpeed: number;
    }
    /**
     * 几何体动作信息
     * @author warden_feng 2014-6-26
     */
    class AnimInfo1 {
        /** 最小范围 */
        MinimumExtent: Vector3;
        /** 最大范围 */
        MaximumExtent: Vector3;
        /** 半径范围 */
        BoundsRadius: number;
    }
    /**
     * 骨骼的角度信息
     */
    class BoneRotation {
        /** 类型 */
        type: string;
        /** */
        GlobalSeqId: number;
        rotations: Rotation[];
        getRotationItem(rotation: Rotation): Quaternion;
        getRotation(keyFrameTime: number): Quaternion;
    }
    /**
     * 骨骼信息(包含骨骼，helper等其他对象)
     * @author warden_feng 2014-6-26
     */
    class BoneObject {
        /** 骨骼类型 */
        type: string;
        /** 骨骼名称 */
        name: string;
        /** 对象编号 */
        ObjectId: number;
        /** 父对象 */
        Parent: number;
        /** 几何体编号 */
        GeosetId: string;
        /** 几何体动画 */
        GeosetAnimId: string;
        /** 是否为广告牌 */
        Billboarded: boolean;
        /** 骨骼位移动画 */
        Translation: BoneTranslation;
        /** 骨骼缩放动画 */
        Scaling: BoneScaling;
        /** 骨骼角度动画 */
        Rotation: BoneRotation;
        /** 中心位置 */
        pivotPoint: Vector3;
        /** 当前对象变换矩阵 */
        c_transformation: Matrix4x4;
        /** 当前全局变换矩阵 */
        c_globalTransformation: Matrix4x4;
        calculateTransformation(keyFrameTime: number): void;
        buildAnimationclip(animationclip: AnimationClip, __chache__: {
            [key: string]: PropertyClip;
        }, start: number, end: number): void;
        private getMatrix3D(time);
    }
    /**
     * 骨骼的位移信息
     */
    class BoneScaling {
        /** 类型 */
        type: String;
        /**  */
        GlobalSeqId: number;
        scalings: Scaling[];
        getScaling(keyFrameTime: number): Vector3;
    }
    /**
     * 骨骼的位移信息
     * @author warden_feng 2014-6-26
     */
    class BoneTranslation {
        /** 类型 */
        type: string;
        /**  */
        GlobalSeqId: number;
        translations: Translation[];
        getTranslation(keyFrameTime: number): Vector3;
    }
    /**
     * 纹理
     * @author warden_feng 2014-6-26
     */
    class FBitmap {
        /** 图片地址 */
        image: string;
        /** 可替换纹理id */
        ReplaceableId: number;
    }
    /**
     * 几何设置
     * @author warden_feng 2014-6-26
     */
    class Geoset {
        /** 顶点 */
        Vertices: number[];
        /** 法线 */
        Normals: number[];
        /** 纹理坐标 */
        TVertices: number[];
        /** 顶点分组 */
        VertexGroup: number[];
        /** 面（索引） */
        Faces: number[];
        /** 顶点分组 */
        Groups: number[][];
        /** 最小范围 */
        MinimumExtent: Vector3;
        /** 最大范围 */
        MaximumExtent: Vector3;
        /** 半径范围 */
        BoundsRadius: number;
        /** 动作信息 */
        Anims: AnimInfo1[];
        /** 材质编号 */
        MaterialID: number;
        /**  */
        SelectionGroup: number;
        /** 是否不可选 */
        Unselectable: boolean;
        /** 顶点对应的关节索引 */
        jointIndices: number[];
        /** 顶点对应的关节权重 */
        jointWeights: number[];
    }
    /**
     * 几何体动画
     * @author warden_feng 2014-6-26
     */
    class GeosetAnim {
        constructor();
    }
    /**
     * 全局序列
     * @author warden_feng 2014-6-26
     */
    class Globalsequences {
        /** 全局序列编号 */
        id: number;
        /** 持续时间 */
        durations: number[];
    }
    /**
     * 动作间隔
     * @author warden_feng 2014-6-26
     */
    class Interval {
        /** 开始时间 */
        start: number;
        /** 结束时间 */
        end: number;
    }
    /**
     * 材质层
     * @author warden_feng 2014-6-26
     */
    class Layer {
        /** 过滤模式 */
        FilterMode: string;
        /** 贴图ID */
        TextureID: number;
        /** 透明度 */
        Alpha: number;
        /** 是否有阴影 */
        Unshaded: boolean;
        /** 是否无雾化 */
        Unfogged: boolean;
        /** 是否双面 */
        TwoSided: boolean;
        /** 是否开启地图环境范围 */
        SphereEnvMap: boolean;
        /** 是否无深度测试 */
        NoDepthTest: boolean;
        /** 是否无深度设置 */
        NoDepthSet: boolean;
    }
    /**
     * 材质
     * @author warden_feng 2014-6-26
     */
    class Material {
        /** 材质层列表 */
        layers: Layer[];
    }
    /**
     * 模型信息
     * @author warden_feng 2014-6-26
     */
    class Model {
        /** 模型名称 */
        name: string;
        /** 混合时间 */
        BlendTime: number;
        /** 最小范围 */
        MinimumExtent: Vector3;
        /** 最大范围 */
        MaximumExtent: Vector3;
    }
    /**
     *
     * @author warden_feng 2014-6-26
     */
    class Rotation {
        /** 时间 */
        time: number;
        /**  */
        value: Quaternion;
        InTan: Quaternion;
        OutTan: Quaternion;
    }
    /**
 *
 * @author warden_feng 2014-6-26
 */
    class Scaling {
        /** 时间 */
        time: number;
        /**  */
        value: Vector3;
        InTan: Vector3;
        OutTan: Vector3;
    }
    /**
     *
     * @author warden_feng 2014-6-26
     */
    class Translation {
        /** 时间 */
        time: number;
        /**  */
        value: Vector3;
        InTan: Vector3;
        OutTan: Vector3;
    }
}
declare namespace feng3d.war3 {
    /**
     * war3模型数据
     * @author warden_feng 2014-6-28
     */
    class War3Model {
        /** 版本号 */
        _version: number;
        /** 模型数据统计结果 */
        model: Model;
        /** 动作序列 */
        sequences: AnimInfo[];
        /** 全局序列 */
        globalsequences: Globalsequences;
        /** 纹理列表 */
        textures: FBitmap[];
        /** 材质列表 */
        materials: Material[];
        /** 几何设置列表 */
        geosets: Geoset[];
        /** 几何动画列表 */
        geosetAnims: GeosetAnim[];
        /** 骨骼动画列表 */
        bones: BoneObject[];
        /** 骨骼轴心坐标 */
        pivotPoints: Vector3[];
        /** 顶点最大关节关联数 */
        _maxJointCount: number;
        root: string;
        private meshs;
        private skeletonComponent;
        getMesh(): GameObject;
        private getFBitmap(material);
    }
}
declare namespace feng3d.war3 {
    /**
     * war3的mdl文件解析
     * @author warden_feng 2014-6-14
     */
    var MdlParser: {
        parse: (data: string, onParseComplete?: (war3Model: War3Model) => void) => void;
    };
}
declare namespace feng3d {
    /**
     * Obj模型加载类
     * @author feng 2017-01-18
     */
    var ObjLoader: {
        load: (url: string, completed?: (gameObject: GameObject) => void) => void;
        parse: (content: string, completed?: (gameObject: GameObject) => void) => void;
    };
}
declare namespace feng3d {
    /**
     * MD5模型加载类
     * @author feng 2017-01-18
     */
    var MD5Loader: {
        load: (url: string, completed?: (gameObject: GameObject) => void) => void;
        loadAnim: (url: string, completed?: (animationClip: AnimationClip) => void) => void;
        parseMD5Mesh: (content: string, completed?: (gameObject: GameObject) => void) => void;
        parseMD5Anim: (content: string, completed?: (animationClip: AnimationClip) => void) => void;
    };
}
declare namespace feng3d {
    var mdlLoader: {
        load: (mdlurl: string, callback: (gameObject: GameObject) => void) => void;
    };
}
declare namespace feng3d {
    var gameObjectFactory: GameObjectFactory;
    class GameObjectFactory {
        create(name?: string): GameObject;
        createGameObject(name?: string): GameObject;
        createCube(name?: string): GameObject;
        createPlane(name?: string): GameObject;
        createCylinder(name?: string): GameObject;
        createCone(name?: string): GameObject;
        createTorus(name?: string): GameObject;
        createTerrain(name?: string): GameObject;
        createSphere(name?: string): GameObject;
        createCapsule(name?: string): GameObject;
        createCamera(name?: string): GameObject;
        createPointLight(name?: string): GameObject;
        createParticle(name?: string): GameObject;
    }
}
declare namespace feng3d {
    /**
     * 鼠标事件管理
     * @author feng 2014-4-29
     */
    class Mouse3DManager {
        draw: (scene3d: Scene3D, camera: Camera, viewRect: Rectangle) => void;
        catchMouseMove: (value: any) => void;
        getSelectedGameObject: () => GameObject;
        setEnable: (value: boolean) => void;
        getEnable: () => boolean;
        constructor(canvas: HTMLCanvasElement);
    }
}
declare namespace feng3d {
}
declare namespace feng3d {
    /**
     * 运行环境枚举
     */
    enum RunEnvironment {
        feng3d = 0,
        /**
         * 运行在编辑器中
         */
        editor = 1,
    }
    /**
     * feng3d的版本号
     * @author feng 2015-03-20
     */
    var revision: string;
    /**
     * 是否开启调试(主要用于断言)
     */
    var debuger: boolean;
    /**
     * 快捷键
     */
    var shortcut: ShortCut;
    /**
     * 运行环境
     */
    var runEnvironment: RunEnvironment;
    /**
     * 资源路径
     */
    var assetsRoot: string;
    var componentMap: {
        Transform: typeof Transform;
    };
}
