declare namespace feng3d {
    /**
     * 事件
     */
    export var event: FEvent;
    /**
     * 用于适配不同对象对于的事件
     */
    export interface ObjectEventDispatcher<O, T> {
        once<K extends keyof T>(target: O, type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof T>(target: O, type: K, data?: T[K], bubbles?: boolean): Event<T[K]>;
        has<K extends keyof T>(target: O, type: K): boolean;
        on<K extends keyof T>(target: O, type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof T>(target: O, type?: K, listener?: (event: Event<T[K]>) => void, thisObject?: any): void;
    }
    /**
     * 事件
     */
    export class FEvent {
        private feventMap;
        private getBubbleTargets;
        /**
         * 监听一次事件后将会被移除
         * @param type						事件的类型。
         * @param listener					处理事件的监听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件监听器的优先级。数字越大，优先级越高。默认为0。
         */
        once(obj: Object, type: string, listener: (event: Event<any>) => void, thisObject?: any, priority?: number): void;
        /**
         * 派发事件
         *
         * 当事件重复流向一个对象时将不会被处理。
         *
         * @param e                 事件对象。
         * @returns                 返回事件是否被该对象处理。
         */
        dispatchEvent(obj: Object, e: Event<any>): boolean;
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        dispatch(obj: Object, type: string, data?: any, bubbles?: boolean): Event<any>;
        /**
         * 检查 被监听对象 是否为特定事件类型注册了任何监听器.
         *
         * @param obj                       被监听对象。
         * @param type		                事件的类型。
         * @return 			                如果指定类型的监听器已注册，则值为 true；否则，值为 false。
         */
        has(obj: Object, type: string): boolean;
        /**
         * 为监听对象新增指定类型的事件监听。
         *
         * @param obj                       被监听对象。
         * @param type						事件的类型。
         * @param listener					处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         * @param priority					事件监听器的优先级。数字越大，优先级越高。默认为0。
         * @param once                      值为true时在监听一次事件后该监听器将被移除。默认为false。
         */
        on(obj: Object, type: string, listener: (event: Event<any>) => any, thisObject?: any, priority?: number, once?: boolean): void;
        /**
         * 移除监听
         *
         * @param obj                       被监听对象。
         * @param type						事件的类型。可选。该值为空时所有被监听对象上的监听均将被移除。
         * @param listener					要删除的监听器对象。可选。该值为空时所有指定类型的监听均将被移除。
         * @param thisObject                监听器的上下文。可选。
         */
        off(obj: Object, type?: string, listener?: (event: Event<any>) => any, thisObject?: any): void;
        /**
         * 监听对象的任意事件，该对象的任意事件都将触发该监听器的调用。
         *
         * @param obj                       被监听对象。
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         * @param priority                  事件监听器的优先级。数字越大，优先级越高。默认为0。
         */
        onAny(obj: Object, listener: (event: Event<any>) => void, thisObject?: any, priority?: number): void;
        /**
         * 移除监听对象的任意事件。
         *
         * @param obj                       被监听对象。
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         */
        offAny(obj: Object, listener?: (event: any) => void, thisObject?: any): void;
        /**
         * 初始化事件对象
         *
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        makeEvent<T>(type: string, data: T, bubbles?: boolean): Event<T>;
        /**
         * 处理事件
         * @param e 事件
         */
        protected handleEvent(obj: Object, e: Event<any>): void;
        /**
         * 处理事件冒泡
         * @param e 事件
         */
        protected handelEventBubbles(obj: Object, e: Event<any>): void;
    }
    /**
     * 事件
     */
    export interface Event<T> {
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
        bubbles: boolean;
        /**
         * 事件目标。
         */
        target: any;
        /**
         * 当前正在使用某个事件监听器处理 Event 对象的对象。
         */
        currentTarget: any;
        /**
         * 是否停止处理事件监听器
         */
        isStop: boolean;
        /**
         * 是否停止冒泡
         */
        isStopBubbles: boolean;
        /**
         * 事件流过的对象列表，事件路径
         */
        targets: any[];
        /**
         * 处理列表
         */
        handles: ListenerVO[];
    }
    /**
     * 监听数据
     */
    interface ListenerVO {
        /**
         * 监听函数
         */
        listener: (event: Event<any>) => void;
        /**
         * 监听函数作用域
         */
        thisObject: any;
        /**
         * 优先级
         */
        priority: number;
        /**
         * 是否只监听一次
         */
        once: boolean;
    }
    export {};
}
declare namespace feng3d {
    interface IEventDispatcher<T> {
        once<K extends keyof T>(type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof T>(type: K, data?: T[K], bubbles?: boolean): Event<T[K]>;
        has<K extends keyof T>(type: K): boolean;
        on<K extends keyof T>(type: K, listener: (event: Event<T[K]>) => void, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof T>(type?: K, listener?: (event: Event<T[K]>) => void, thisObject?: any): void;
    }
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
        once(type: string, listener: (event: Event<any>) => void, thisObject?: any, priority?: number): void;
        /**
         * 派发事件
         *
         * 当事件重复流向一个对象时将不会被处理。
         *
         * @param e   事件对象
         * @returns 返回事件是否被该对象处理
         */
        dispatchEvent(e: Event<any>): boolean;
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        dispatch(type: string, data?: any, bubbles?: boolean): Event<any>;
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
        on(type: string, listener: (event: Event<any>) => void, thisObject?: any, priority?: number, once?: boolean): void;
        /**
         * 移除监听
         * @param dispatcher 派发器
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         */
        off(type?: string, listener?: (event: Event<any>) => void, thisObject?: any): void;
        /**
         * 监听对象的任意事件，该对象的任意事件都将触发该监听器的调用。
         *
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         * @param priority                  事件监听器的优先级。数字越大，优先级越高。默认为0。
         */
        onAny(listener: (event: Event<any>) => void, thisObject?: any, priority?: number): void;
        /**
         * 移除监听对象的任意事件。
         *
         * @param listener                  处理事件的监听器函数。
         * @param thisObject                监听器的上下文。可选。
         */
        offAny(listener?: (event: Event<any>) => void, thisObject?: any): void;
        /**
         * 处理事件
         * @param e 事件
         */
        protected handleEvent(e: Event<any>): void;
        /**
         * 处理事件冒泡
         * @param e 事件
         */
        protected handelEventBubbles(e: Event<any>): void;
    }
}
declare namespace feng3d {
    /**
     * 只针对Object的事件
     */
    var objectevent: ObjectEventDispatcher<Object, ObjectEventType>;
    /**
     * Object 事件类型
     */
    interface ObjectEventType {
        /**
         * 属性值变化
         */
        propertyValueChanged: {
            property: string;
            oldValue: any;
            newValue: any;
        };
    }
}
declare namespace feng3d {
    /**
     * 观察装饰器，观察被装饰属性的变化
     *
     * @param onChange 属性变化回调  例如参数为“onChange”时，回调将会调用this.onChange(property, oldValue, newValue)
     *
     * 使用@watch后会自动生成一个带"_"的属性，例如 属性"a"会生成"_a"
     *
     * 通过使用 eval 函数 生成出 与自己手动写的set get 一样的函数，性能已经接近 手动写的get set函数。
     *
     * 性能比Watcher.watch更加高效，但还是建议使用 Watcher.watch 替代 @watch ，由于 @watch 没有对onChange更好的约束 使用 时容易出现运行时报错。
     */
    function watch(onChange: string): (target: any, property: string) => void;
    var watcher: Watcher;
    class Watcher {
        /**
         * 监听对象属性的变化
         *
         * 注意：使用watch后获取该属性值的性能将会是原来的1/60，避免在运算密集处使用该函数。
         *
         * @param object 被监听对象
         * @param property 被监听属性
         * @param handler 变化回调函数 (object: T, property: string, oldValue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        watch<T, K extends PropertyNames<T>, V extends T[K]>(object: T, property: K, handler: (newValue: V, oldValue: V, object: T, property: string) => void, thisObject?: any): void;
        /**
         * 取消监听对象属性的变化
         *
         * @param object 被监听对象
         * @param property 被监听属性
         * @param handler 变化回调函数 (object: T, property: string, oldValue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        unwatch<T, K extends PropertyNames<T>, V extends T[K]>(object: T, property: K, handler?: (newValue: V, oldValue: V, object: T, property: string) => void, thisObject?: any): void;
        private _binds;
        /**
         * 绑定两个对象的指定属性，保存两个属性值同步。
         *
         * @param object0 第一个对象。
         * @param property0 第一个对象的属性名称。
         * @param object1 第二个对象。
         * @param property1 第二个对象的属性名称。
         */
        bind<T0, T1, K0 extends PropertyNames<T0>, K1 extends PropertyNames<T1>>(object0: T0, property0: K0, object1: T1, property1: K1): void;
        /**
         * 解除两个对象的指定属性的绑定。
         *
         * @param object0 第一个对象。
         * @param property0 第一个对象的属性名称。
         * @param object1 第二个对象。
         * @param property1 第二个对象的属性名称。
         */
        unbind<T0, T1, K0 extends PropertyNames<T0>, K1 extends PropertyNames<T1>>(object0: T0, property0: K0, object1: T1, property1: K1): void;
        /**
         * 监听对象属性链值变化
         *
         * @param object 被监听对象
         * @param property 被监听属性 例如："a.b"
         * @param handler 变化回调函数 (newValue: any, oldValue: any, object: any, property: string) => void
         * @param thisObject 变化回调函数 this值
         */
        watchchain(object: any, property: string, handler: (newValue: any, oldValue: any, object: any, property: string) => void, thisObject?: any): void;
        /**
         * 取消监听对象属性链值变化
         *
         * @param object 被监听对象
         * @param property 被监听属性 例如："a.b"
         * @param handler 变化回调函数 (object: T, property: string, oldValue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        unwatchchain(object: any, property: string, handler?: (newValue: any, oldValue: any, object: any, property: string) => void, thisObject?: any): void;
        /**
         * 监听对象属性链值变化
         *
         * @param object 被监听对象
         * @param property 被监听属性 例如：{a:{b:null,d:null}} 表示监听 object.a.b 与 object.a.d 值得变化，如果property == object时表示监听对象中所有叶子属性变化。
         * @param handler 变化回调函数 (object: T, property: string, oldValue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        watchobject<T>(object: T, property: gPartial<T>, handler: (object: any, property: string, oldValue: any) => void, thisObject?: any): void;
        /**
         * 取消监听对象属性链值变化
         *
         * @param object 被监听对象
         * @param property 被监听属性 例如：{a:{b:null,d:null}} 表示监听 object.a.b 与 object.a.d 值得变化，如果property == object时表示监听对象中所有叶子属性变化。
         * @param handler 变化回调函数 (object: T, property: string, oldValue: V) => void
         * @param thisObject 变化回调函数 this值
         */
        unwatchobject<T>(object: T, property: gPartial<T>, handler?: (object: any, property: string, oldValue: any) => void, thisObject?: any): void;
    }
    const __watchs__ = "__watchs__";
    const __watchchains__ = "__watchchains__";
}
declare namespace feng3d {
    /**
     * 让T中以及所有键值中的所有键都是可选的
     */
    type gPartial<T> = {
        [P in keyof T]?: gPartial<T[P]>;
    };
    /**
     * 获取T类型中除值为KT类型以外的所有键
     *
     * ```
     * class A
     * {
     *      a = 1;
     *      f(){}
     * }
     *
     * var a: NonTypePropertyNames<A, number>; //var a:"f"
     * var a1: NonTypePropertyNames<A, Function>; //var a:"a"
     *
     * ```
     */
    type NonTypePropertyNames<T, KT> = {
        [K in keyof T]: T[K] extends KT ? never : K;
    }[keyof T];
    /**
     * 剔除T类型中值为KT类型的键
     * ```
     *     class A
     *     {
     *         a = 1;
     *         f(){}
     *     }
     *
     *     var a: NonTypePropertys<A, number>; //var a: Pick<A, "f">
     *     var a1: NonTypePropertys<A, Function>; //var a1: Pick<A, "a">
     * ```
     */
    type NonTypePropertys<T, KT> = Pick<T, NonTypePropertyNames<T, KT>>;
    /**
     * 选取T类型中值为KT类型的所有键
     *
     * ```
     *     class A
     *     {
     *         a = 1;
     *         f(){}
     *     }
     *
     *     var a: TypePropertyNames<A, number>; //var a: "a"
     *     var a1: TypePropertyNames<A, Function>; //var a1: "f"
     * ```
     */
    type TypePropertyNames<T, KT> = {
        [K in keyof T]: T[K] extends KT ? K : never;
    }[keyof T];
    /**
     * 选取T类型中值为非函数类型的所有键
     */
    type PropertyNames<T> = NonTypePropertyNames<T, Function>;
    /**
     * 选取T类型中值为函数的所有键
     *
     * ```
     *     class A
     *     {
     *         a = 1;
     *         f(){}
     *     }
     *
     *     var a: FunctionPropertyNames<A>; //var a: "f"
     * ```
     */
    type FunctionPropertyNames<T> = TypePropertyNames<T, Function>;
    /**
     * 选取T类型中值为KT类型的键
     *
     * ```
     *     class A
     *     {
     *         a = 1;
     *         f() { }
     *     }
     *
     *     var a: TypePropertys<A, number>; //var a: Pick<A, "a">
     *     var a1: TypePropertys<A, Function>; //var a1: Pick<A, "f">
     * ```
     */
    type TypePropertys<T, KT> = Pick<T, TypePropertyNames<T, KT>>;
    type Lazy<T> = T | (() => T);
    type LazyObject<T> = {
        [P in keyof T]: Lazy<T[P]>;
    };
    var lazy: {
        getvalue: <T>(lazyItem: Lazy<T>) => T;
    };
    /**
     * 可销毁对象
     */
    interface IDisposable {
        /**
         * 是否已销毁
         */
        readonly disposed: boolean;
        /**
         * 销毁
         */
        dispose(): void;
    }
}
/**
 * Object.assignDeep 中 转换结果的函数定义
 */
interface AssignDeepHandler {
    /**
     *
     * @param target 目标对象
     * @param source 源数据
     * @param key 属性名称
     * @param replacers 转换函数
     * @param deep 当前深度
     */
    (target: any, source: any, key: string, replacers: AssignDeepHandler[], deep: number): boolean;
}
interface ObjectConstructor {
    /**
     * 从对象自身或者对象的原型中获取属性描述
     *
     * @param object 对象
     * @param property 属性名称
     */
    getPropertyDescriptor(object: Object, property: string): PropertyDescriptor | undefined;
    /**
     * 属性是否可写
     * @param obj 对象
     * @param property 属性名称
     */
    propertyIsWritable(obj: Object, property: string): boolean;
    /**
     * 判断是否为基础类型 undefined,null,boolean,string,number
     */
    isBaseType(object: any): boolean;
    /**
     * 判断是否为Object对象，构造函数是否为Object， 检测 object.constructor == Object
     *
     * @param object 用于判断的对象
     */
    isObject(object: any): boolean;
    /**
     * 获取对象对应属性上的值
     *
     * @param object 对象
     * @param property 属性名称，可以是 "a" 或者 "a.b" 或者 ["a","b"]
     */
    getPropertyValue(object: Object, property: string | string[]): any;
    /**
     * 获取对象上属性链列表
     *
     * 例如 object值为{ a: { b: { c: 1 }, d: 2 } }时则返回 ["a.b.c","a.d"]
     *
     * @param object 对象
     */
    getPropertyChains(object: Object): string[];
    /**
     * 浅赋值
     * 从源数据取所有可枚举属性值赋值给目标对象
     *
     * @param target 目标对象
     * @param source 源数据
     */
    assignShallow<T>(target: T, source: Partial<T>): T;
    /**
     * 深度赋值
     * 从源数据取所有子代可枚举属性值赋值给目标对象
     *
     * @param target 被赋值对象
     * @param source 源数据
     * @param handlers 处理函数列表，先于 Object.assignDeepDefaultHandlers 执行。函数返回值为true表示该属性赋值已完成跳过默认属性赋值操作，否则执行默认属性赋值操作。执行在 Object.DefaultAssignDeepReplacers 前。
     * @param deep 赋值深度，deep<1时直接返回。
     */
    assignDeep<T>(target: T, source: feng3d.gPartial<T>, handlers?: AssignDeepHandler[], deep?: number): T;
    /**
     * 深度比较两个对象子代可枚举属性值
     *
     * @param arr 用于比较的数组
     */
    equalDeep<T>(a: T, b: T): boolean;
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
    runFunc<T>(obj: T, func: (obj: T) => void): T;
    /**
     * Object.assignDeep 中 默认转换结果的函数列表
     */
    assignDeepDefaultHandlers: AssignDeepHandler[];
}
declare namespace feng3d {
    var CLASS_KEY: string;
    /**
     * 类工具
     */
    var classUtils: ClassUtils;
    /**
     * 类工具
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
        private defaultInstMap;
        /**
         * 获取默认实例
         *
         * @param name 类名称
         */
        getDefaultInstanceByName(name: string): any;
        /**
         * 获取实例
         *
         * @param name 类名称
         */
        getInstanceByName(name: string): any;
        /**
         * 新增反射对象所在的命名空间，使得getQualifiedClassName能够得到正确的结果
         */
        addClassNameSpace(namespace: string): void;
    }
}
interface MapConstructor {
    getKeys<K, V>(map: Map<K, V>): K[];
    getValues<K, V>(map: Map<K, V>): V[];
}
interface ArrayConstructor {
    /**
     * 使数组变得唯一，不存在两个相等的元素
     *
     * @param array 被操作数组
     * @param compare 比较函数
     */
    unique<T>(array: T[], compare?: (a: T, b: T) => boolean): T[];
    /**
     * 判断数组是否唯一
     *
     * @param array 被检查数组
     * @param compare 比较函数
     */
    isUnique<T>(array: T[], compare?: (a: T, b: T) => boolean): boolean;
    /**
     * 删除元素
     *
     * @param array 被操作数组
     * @param item 被删除元素
     * @returns 被删除元素在数组中的位置
     */
    delete<T>(array: T[], item: T): number;
    /**
     * 连接一个或多个数组到自身
     *
     * @param array 被操作数组
     * @param items 要添加到数组末尾的其他项。
     * @returns 返回自身
     */
    concatToSelf<T>(array: T[], ...items: (T | ConcatArray<T>)[]): T[];
    /**
     * 比较两个数组中元素是否相同
     *
     * @param array 被操作数组
     * @param arr 用于比较的数组
     */
    equal<T>(array: T[], arr: ArrayLike<T>): boolean;
    /**
     * 使用b元素替换数组中第一个a元素。
     *
     * @param array 被操作数组
     * @param a 被替换的元素
     * @param b 用于替换的元素
     * @param isAdd 当数组中没有找到a元素时，是否需要把b元素添加到数组尾部。默认值为true。
     */
    replace<T>(array: T[], a: T, b: T, isAdd?: boolean): T[];
    /**
     * 创建数组
     * @param length 长度
     * @param itemFunc 创建元素方法
     */
    create<T>(length: number, itemFunc: (index: number) => T): T[];
    /**
     * 二分查找,如果有多个则返回第一个
     * @param   array   数组
     * @param	target	寻找的目标
     * @param	compare	比较函数
     * @param   start   起始位置
     * @param   end     结束位置
     * @return          查找到目标时返回所在位置，否则返回-1
     */
    binarySearch<T>(array: T[], target: T, compare: (a: T, b: T) => number, start?: number, end?: number): number;
    /**
     * 二分查找插入位置,如果有多个则返回第一个
     * @param   array   数组
     * @param	target	寻找的目标
     * @param	compare	比较函数
     * @param   start   起始位置
     * @param   end     结束位置
     * @return          目标所在位置（如果该位置上不是目标对象，则该索引为该目标可插入的位置）
     */
    binarySearchInsert<T>(array: T[], target: T, compare: (a: T, b: T) => number, start?: number, end?: number): number;
}
interface Array<T> {
    /**
     * Determines whether an array includes a certain element, returning true or false as appropriate.
     * @param searchElement The element to search for.
     * @param fromIndex The position in this array at which to begin searching for searchElement.
     */
    includes(searchElement: T, fromIndex?: number): boolean;
}
interface Math {
    /**
     * 角度转弧度因子
     */
    DEG2RAD: number;
    /**
     * 弧度转角度因子
     */
    RAD2DEG: number;
    /**
     * 默认精度
     */
    PRECISION: number;
    /**
     * 获取唯一标识符
     * @see http://www.broofa.com/Tools/Math.uuid.htm
     */
    uuid: () => string;
    /**
     * （夹紧）计算指定值到区间[edge0 ,edge1]最近的值
     *
     * @param value 指定值
     * @param lowerlimit 区间下界
     * @param upperlimit 区间上界
     */
    clamp(value: number, lowerlimit: number, upperlimit: number): number;
    /**
     * 计算欧几里得模（整数模） ((n % m) + m) % m
     *
     * @param n 被除数
     * @param m 除数
     * @see https://en.wikipedia.org/wiki/Modulo_operation
     */
    euclideanModulo(n: number, m: number): number;
    /**
     * 使 x 值从区间 <a1, a2> 线性映射到区间 <b1, b2>
     *
     * @param x 第一个区间中值
     * @param a1 第一个区间起始值
     * @param a2 第一个区间终止值
     * @param b1 第二个区间起始值
     * @param b2 第二个区间起始值
     */
    mapLinear: (x: number, a1: number, a2: number, b1: number, b2: number) => number;
    /**
     * 线性插值
     *
     * @param start 起始值
     * @param end 终止值
     * @param t 插值系数 [0 ,1]
     *
     * @see https://en.wikipedia.org/wiki/Linear_interpolation
     */
    lerp(start: number, end: number, t: number): number;
    /**
     * 计算平滑值 3x^2 - 2x^3
     *
     * @param x
     * @param min 最小值
     * @param max 最大值
     *
     * @see http://en.wikipedia.org/wiki/Smoothstep
     */
    smoothstep(x: number, min: number, max: number): number;
    /**
     * 计算平滑值 6x^5 - 15x^4 + 10x^3
     *
     * @param x
     * @param min 最小值
     * @param max 最大值
     */
    smootherstep(x: number, min: number, max: number): number;
    /**
     * 从<low, high>获取随机整数
     *
     * @param low 区间起始值
     * @param high 区间终止值
     */
    randInt(low: number, high: number): number;
    /**
     * 从<low, high>获取随机浮点数
     *
     * @param low 区间起始值
     * @param high 区间终止值
     */
    randFloat(low: number, high: number): number;
    /**
     * 从<-range/2, range/2>获取随机浮点数
     *
     * @param range 范围
     */
    randFloatSpread(range: number): number;
    /**
     * 角度转换为弧度
     *
     * @param degrees 角度
     */
    degToRad(degrees: number): number;
    /**
     * 弧度转换为角度
     *
     * @param radians 弧度
     */
    radToDeg(radians: number): number;
    /**
     * 判断指定整数是否为2的幂
     *
     * @param value 整数
     */
    isPowerOfTwo(value: number): boolean;
    /**
     * 获取离指定整数最近的2的幂
     *
     * @param value 整数
     */
    nearestPowerOfTwo(value: number): number;
    /**
     * 获取指定大于等于整数最小2的幂，3->4,5->8,17->32,33->64
     *
     * @param value 整数
     */
    nextPowerOfTwo(value: number): number;
    /**
     * 获取目标最近的值
     *
     * source增加或者减少整数倍precision后得到离target最近的值
     *
     * ```
     * Math.toRound(71,0,5);//运算结果为1
     * ```
     *
     * @param source 初始值
     * @param target 目标值
     * @param precision 精度
     */
    toRound(source: number, target: number, precision?: number): number;
    /**
     * 比较两个Number是否相等
     *
     * @param a 数字a
     * @param b 数字b
     * @param precision 进度
     */
    equals(a: number, b: number, precision?: number): boolean;
    /**
     * 计算最大公约数
     *
     * @param a 整数a
     * @param b 整数b
     *
     * @see https://en.wikipedia.org/wiki/Greatest_common_divisor
     */
    gcd(a: number, b: number): number;
    /**
     * 计算最小公倍数
     * Least common multiple
     *
     * @param a 整数a
     * @param b 整数b
     *
     * @see https://en.wikipedia.org/wiki/Least_common_multiple
     */
    lcm(a: number, b: number): number;
}
declare namespace feng3d {
    /**
     * 默认序列化工具
     */
    export var serialization: Serialization;
    /**
     * 序列化装饰器
     *
     * 在属性定义前使用 @serialize 进行标记需要序列化
     *
     * @param {*} target                序列化原型
     * @param {string} propertyKey      序列化属性
     */
    export function serialize(target: any, propertyKey: string): void;
    /**
     * 序列化属性函数项
     */
    interface PropertyHandler<T extends HandlerParam> {
        /**
         * 序列化属性函数项
         *
         * @param target 序列化后的对象，存放序列化后属性值的对象。
         * @param source 被序列化的对象，提供序列化前属性值的对象。
         * @param property 序列化属性名称
         * @param param 参数列表
         *
         * @returns 返回true时结束该属性后续处理。
         */
        (target: any, source: any, property: string, param: T): boolean;
    }
    interface HandlerParam {
        handlers: PropertyHandler<HandlerParam>[];
        serialization: Serialization;
    }
    interface SerializeHandlerParam extends HandlerParam {
        /**
         * 已经被序列化的列表
         *
         * {key: 被序列化的对象，value：{target:序列化后数据所存储对象,property:序列化后数据所存在属性名称}}
         *
         * 用于处理序列化循环引用以及多次引用的对象
         */
        serializedMap: Map<Object, {
            target: any;
            property: string;
        }>;
        handlers: PropertyHandler<SerializeHandlerParam>[];
        root: object;
        autoRefID: number;
    }
    interface DeserializeHandlerParam extends HandlerParam {
        refs: {
            [refid: string]: {
                target: Object;
                property: string;
                refs: {
                    target: Object;
                    property: string;
                }[];
            };
        };
    }
    interface DifferentHandlerParam extends HandlerParam {
        handlers: PropertyHandler<DifferentHandlerParam>[];
        /**
         * 当前对象的不同数据
         */
        different: Object;
    }
    /**
     * 序列化
     */
    export class Serialization {
        /**
         * 是否忽略默认值
         */
        omitDefault: boolean;
        /**
         * 序列化函数列表
         */
        serializeHandlers: {
            priority: number;
            handler: PropertyHandler<SerializeHandlerParam>;
        }[];
        /**
         * 反序列化函数列表
         */
        deserializeHandlers: {
            priority: number;
            handler: PropertyHandler<DeserializeHandlerParam>;
        }[];
        /**
         * 比较差异函数列表
         */
        differentHandlers: {
            priority: number;
            handler: PropertyHandler<DifferentHandlerParam>;
        }[];
        /**
         * 设置函数列表
         */
        setValueHandlers: {
            priority: number;
            handler: PropertyHandler<HandlerParam>;
        }[];
        /**
         * 序列化对象
         *
         * 过程中使用 different与默认值作比较减少结果中的数据。
         *
         * @param target 被序列化的对象
         *
         * @returns 序列化后简单数据对象（由Object与Array组合可 JSON.stringify 的简单结构）
         */
        serialize<T>(target: T): gPartial<T>;
        /**
         * 删除 Json 对象中 CLASS_KEY 属性，防止被反序列化。
         *
         * @param obj
         */
        deleteCLASS_KEY(obj: Object): void;
        /**
         * 反序列化对象为基础对象数据（由Object与Array组合）
         *
         * @param object 换为Json的对象
         * @returns 反序列化后的数据
         */
        deserialize<T>(object: gPartial<T>): T;
        /**
         * 比较两个对象的不同，提取出不同的数据(可能会经过反序列化处理)
         *
         * @param target 用于检测不同的数据
         * @param source   模板（默认）数据
         * @param different 比较得出的不同（简单结构）数据
         *
         * @returns 比较得出的不同数据（由Object与Array组合可 JSON.stringify 的简单结构）
         */
        different<T>(target: T, source: T): gPartial<T>;
        /**
         * 从数据对象中提取数据给目标对象赋值（可能会经过序列化处理）
         *
         * @param target 目标对象
         * @param source 数据对象 可由Object与Array以及自定义类型组合
         */
        setValue<T>(target: T, source: gPartial<T>): T;
        /**
         * 克隆
         * @param target 被克隆对象
         */
        clone<T>(target: T): T;
    }
    export interface SerializationTempInfo {
        loadingNum?: number;
        onLoaded?: () => void;
    }
    export {};
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
    function ov<K extends keyof OVComponentParamMap>(param: {
        component?: K;
        componentParam?: OVComponentParamMap[K];
    }): (constructor: Function) => void;
    type OAVComponentParams = Partial<OAVComponentParamMap[keyof OAVComponentParamMap]> & {
        /**
         * 是否可编辑
         */
        editable?: boolean;
        /**
         * 所属块名称
         */
        block?: string;
        /**
         * 提示信息
         */
        tooltip?: string;
        /**
         * 优先级，数字越小，显示越靠前，默认为0
         */
        priority?: number;
        /**
         * 是否排除
         */
        exclude?: boolean;
    };
    /**
     * objectview属性装饰器
     * @param param 参数
     */
    function oav(param?: OAVComponentParams): (target: any, propertyKey: string) => void;
    /**
     * 对象界面
     */
    var objectview: ObjectView;
    /**
     * 对象界面
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
         * @param object 用于生成界面的对象
         * @param param 参数
         */
        getObjectView(object: Object, param?: GetObjectViewParam): IObjectView;
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
        addOAV(target: any, propertyKey: string, param?: OAVComponentParams): void;
        /**
         * 获取对象信息
         * @param object				对象
         * @param autocreate			当对象没有注册属性时是否自动创建属性信息
         * @param excludeAttrs			排除属性列表
         * @return
         */
        getObjectInfo(object: Object, autocreate?: boolean, excludeAttrs?: string[]): ObjectViewInfo;
    }
    /**
     * OAV 组件参数映射
     * {key: OAV组件名称,value：组件参数类定义}
     */
    interface OAVComponentParamMap {
        OAVEnum: OAVEnumParam;
    }
    /**
     * OAVEnum 组件参数
     */
    interface OAVEnumParam {
        component: "OAVEnum";
        componentParam: {
            /**
             * 枚举类型
             */
            enumClass: any;
        };
    }
    interface OBVComponentParamMap {
        块组件名称: "块组件参数";
        [component: string]: any;
    }
    interface OVComponentParamMap {
        类组件名称: "类组件参数";
        [component: string]: any;
    }
    /**
     * 定义属性
     */
    interface AttributeDefinition {
        /**
         * 属性名称
         */
        name: string;
        /**
         * 是否可编辑
         */
        editable?: boolean;
        /**
         * 所属块名称
         */
        block?: string;
        /**
         * 提示信息
         */
        tooltip?: string;
        /**
         * 组件
         */
        component?: string;
        /**
         * 组件参数
         */
        componentParam?: Object;
        /**
         * 优先级，数字越小，显示越靠前，默认为0
         */
        priority?: number;
        /**
         * 是否排除
         */
        exclude?: boolean;
    }
    /**
     * 定义特定属性类型默认界面
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
        editable: boolean;
        /**
         * 所属块名称
         */
        block?: string;
        /**
         * 提示信息
         */
        tooltip?: string;
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
        /**
         * 优先级，数字越小，显示越靠前，默认为0
         */
        priority?: number;
        /**
         * 是否排除
         */
        exclude?: boolean;
    }
    /**
     * 对象属性块
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
        /**
         * 是否可编辑
         */
        editable?: boolean;
    }
    type GetObjectViewParam = {
        /**
         * 当对象没有注册属性时是否自动创建属性信息
         */
        autocreate?: boolean;
        /**
         * 排除属性列表
         */
        excludeAttrs?: string[];
        /**
         * 是否可编辑
         */
        editable?: boolean;
    };
}
declare namespace feng3d {
    type CompareFunction<T> = (a: T, b: T) => number;
    /**
     * 比较器
     */
    class Comparator<T> {
        /**
         * 默认比较函数。只能处理 a和b 同为string或number的比较。
         *
         * @param a 比较值a
         * @param b 比较值b
         */
        static defaultCompareFunction(a: string | number, b: string | number): 1 | 0 | -1;
        private compare;
        /**
         * 构建比较器
         * @param compareFunction 比较函数
         */
        constructor(compareFunction?: CompareFunction<T>);
        /**
         * 检查 a 是否等于 b 。
         *
         * @param a 值a
         * @param b 值b
         */
        equal(a: T, b: T): boolean;
        /**
         * 检查 a 是否小于 b 。
         *
         * @param a 值a
         * @param b 值b
         */
        lessThan(a: T, b: T): boolean;
        /**
         * 检查 a 是否大于 b 。
         *
         * @param a 值a
         * @param b 值b
         */
        greaterThan(a: T, b: T): boolean;
        /**
         * 检查 a 是否小于等于 b 。
         *
         * @param a 值a
         * @param b 值b
         */
        lessThanOrEqual(a: T, b: T): boolean;
        /**
         * 检查 a 是否大于等于 b 。
         *
         * @param a 值a
         * @param b 值b
         */
        greaterThanOrEqual(a: T, b: T): boolean;
        /**
         * 反转比较函数。
         */
        reverse(): void;
    }
}
declare namespace feng3d {
    /**
     * 链表
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/linked-list/LinkedList.js
     */
    class LinkedList<T> {
        /**
         * 表头
         */
        private head;
        /**
         * 表尾
         */
        private tail;
        /**
         * 比较器
         */
        private compare;
        /**
         * 构建双向链表
         *
         * @param comparatorFunction 比较函数
         */
        constructor(comparatorFunction?: CompareFunction<T>);
        /**
         * 是否为空
         */
        isEmpty(): boolean;
        /**
         * 清空
         */
        empty(): void;
        /**
         * 获取表头值
         */
        getHeadValue(): T;
        /**
         * 添加新结点到表头
         *
         * @param value 结点数据
         */
        addHead(value: T): this;
        /**
         * 添加新结点到表尾
         *
         * @param value 结点数据
         */
        addTail(value: T): this;
        /**
         * 删除链表中第一个与指定值相等的结点
         *
         * @param value 结点值
         */
        delete(value: T): LinkedListNode<T>;
        /**
         * 删除链表中所有与指定值相等的结点
         *
         * @param value 结点值
         */
        deleteAll(value: T): LinkedListNode<T>;
        /**
         * 查找与结点值相等的结点
         *
         * @param value 结点值
         */
        find(value: T): LinkedListNode<T>;
        /**
         * 查找与结点值相等的结点
         *
         * @param callback 判断是否为查找的元素
         */
        findByFunc(callback: (value: T) => Boolean): LinkedListNode<T>;
        /**
         * 删除表头
         *
         * 删除链表前面的元素(链表的头)并返回元素值。如果队列为空，则返回null。
         */
        deleteHead(): T;
        /**
         * 删除表尾
         */
        deleteTail(): T;
        /**
         * 从数组中初始化链表
         *
         * @param values 结点值列表
         */
        fromArray(values: T[]): this;
        /**
         * 转换为数组
         */
        toArray(): T[];
        /**
         * 转换为字符串
         *
         * @param valueToString 值输出为字符串函数
         */
        toString(valueToString?: (value: T) => string): string;
        /**
         * 反转链表
         */
        reverse(): this;
        /**
         * 核查结构是否正确
         */
        checkStructure(): boolean;
    }
    /**
     * 链表结点
     */
    interface LinkedListNode<T> {
        /**
         * 值
         */
        value: T;
        /**
         * 下一个结点
         */
        next: LinkedListNode<T>;
    }
}
declare namespace feng3d {
    /**
     * 双向链表
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/doubly-linked-list/DoublyLinkedList.js
     */
    class DoublyLinkedList<T> {
        /**
         * 表头
         */
        private head;
        /**
         * 表尾
         */
        private tail;
        /**
         * 比较器
         */
        private compare;
        /**
         * 构建双向链表
         *
         * @param comparatorFunction 比较函数
         */
        constructor(comparatorFunction?: CompareFunction<T>);
        /**
         * 是否为空
         */
        isEmpty(): boolean;
        /**
         * 清空
         */
        empty(): void;
        /**
         * 添加新结点到表头
         *
         * @param value 结点数据
         */
        addHead(value: T): this;
        /**
         * 添加新结点到表尾
         *
         * @param value 结点数据
         */
        addTail(value: T): this;
        /**
         * 删除链表中第一个与指定值相等的结点
         *
         * @param value 结点值
         */
        delete(value: T): DoublyLinkedListNode<T>;
        /**
         * 删除链表中所有与指定值相等的结点
         *
         * @param value 结点值
         */
        deleteAll(value: T): DoublyLinkedListNode<T>;
        /**
         * 查找与结点值相等的结点
         *
         * @param value 结点值
         */
        find(value: T): DoublyLinkedListNode<T>;
        /**
         * 查找与结点值相等的结点
         *
         * @param callback 判断是否为查找的元素
         */
        findByFunc(callback: (value: T) => Boolean): DoublyLinkedListNode<T>;
        /**
         * 删除表头
         */
        deleteHead(): T;
        /**
         * 删除表尾
         */
        deleteTail(): T;
        /**
         * 从数组中初始化链表
         *
         * @param values 结点值列表
         */
        fromArray(values: T[]): this;
        /**
         * 转换为数组
         */
        toArray(): T[];
        /**
         * 转换为字符串
         * @param valueToString 值输出为字符串函数
         */
        toString(valueToString?: (value: T) => string): string;
        /**
         * 反转链表
         */
        reverse(): this;
        /**
         * 核查结构是否正确
         */
        checkStructure(): boolean;
    }
    /**
     * 双向链接结点
     */
    interface DoublyLinkedListNode<T> {
        /**
         * 值
         */
        value: T;
        /**
         * 上一个结点
         */
        previous: DoublyLinkedListNode<T>;
        /**
         * 下一个结点
         */
        next: DoublyLinkedListNode<T>;
    }
}
declare namespace feng3d {
    /**
     * 队列，只能从后面进，前面出
     * 使用单向链表实现
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/queue/Queue.js
     */
    class Queue<T> {
        private linkedList;
        /**
         * 构建队列
         *
         * @param comparatorFunction 比较函数
         */
        constructor();
        /**
         * 是否为空
         */
        isEmpty(): boolean;
        /**
         * 清空
         */
        empty(): void;
        /**
         * 读取队列前面的元素，但不删除它。
         */
        peek(): T;
        /**
         * 入队
         *
         * 在队列的末尾(链表的尾部)添加一个新元素。
         * 这个元素将在它前面的所有元素之后被处理。
         *
         * @param value 元素值
         */
        enqueue(value: T): this;
        /**
         * 出队
         *
         * 删除队列前面的元素(链表的头)。如果队列为空，则返回null。
         */
        dequeue(): T;
        /**
         * 转换为字符串
         *
         * @param valueToString 值输出为字符串函数
         */
        toString(valueToString?: (value: T) => string): string;
    }
}
declare namespace feng3d {
    /**
     * 栈
     *
     * 后进先出
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/stack/Stack.js
     */
    class Stack<T> {
        private linkedList;
        /**
         * 是否为空
         */
        isEmpty(): boolean;
        /**
         * 查看第一个元素值
         */
        peek(): T;
        /**
         * 入栈
         *
         * @param value 元素值
         */
        push(value: T): this;
        /**
         * 出栈
         */
        pop(): T;
        /**
         * 转换为数组
         */
        toArray(): T[];
        /**
         * 转换为字符串
         *
         * @param valueToString 值输出为字符串函数
         */
        toString(valueToString?: (value: T) => string): string;
    }
}
declare namespace feng3d {
    /**
     * 堆
     *
     * 最小和最大堆的父类。
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/heap/Heap.js
     */
    abstract class Heap<T> {
        /**
         * 堆的数组表示。
         */
        private heapContainer;
        /**
         * 比较器
         */
        protected compare: Comparator<T>;
        /**
         * 构建链表
         *
         * @param comparatorFunction 比较函数
         */
        constructor(comparatorFunction?: CompareFunction<T>);
        /**
         * 获取左边子结点索引
         *
         * @param parentIndex 父结点索引
         */
        getLeftChildIndex(parentIndex: number): number;
        /**
         * 获取右边子结点索引
         *
         * @param parentIndex 父结点索引
         */
        getRightChildIndex(parentIndex: number): number;
        /**
         * 获取父结点索引
         *
         * @param childIndex 子结点索引
         */
        getParentIndex(childIndex: number): number;
        /**
         * 是否有父结点
         *
         * @param childIndex 子结点索引
         */
        hasParent(childIndex: number): boolean;
        /**
         * 是否有左结点
         *
         * @param parentIndex 父结点索引
         */
        hasLeftChild(parentIndex: number): boolean;
        /**
         * 是否有右结点
         *
         * @param parentIndex 父结点索引
         */
        hasRightChild(parentIndex: number): boolean;
        /**
         * 获取左结点
         *
         * @param parentIndex 父结点索引
         */
        leftChild(parentIndex: number): T;
        /**
         * 获取右结点
         *
         * @param parentIndex 父结点索引
         */
        rightChild(parentIndex: number): T;
        /**
         * 获取父结点
         *
         * @param childIndex 子结点索引
         */
        parent(childIndex: number): T;
        /**
         * 交换两个结点数据
         *
         * @param index1 索引1
         * @param index2 索引2
         */
        swap(index1: number, index2: number): void;
        /**
         * 查看堆顶数据
         */
        peek(): T;
        /**
         * 出堆
         *
         * 取出堆顶元素
         */
        poll(): T;
        /**
         * 新增元素
         *
         * @param item 元素
         */
        add(item: T): this;
        /**
         * 移除所有指定元素
         *
         * @param item 元素
         * @param comparator 比较器
         */
        remove(item: T, comparator?: Comparator<T>): this;
        /**
         * 查找元素所在所有索引
         *
         * @param item 查找的元素
         * @param comparator 比较器
         */
        find(item: T, comparator?: Comparator<T>): number[];
        /**
         * 是否为空
         */
        isEmpty(): boolean;
        /**
         * 转换为字符串
         */
        toString(): string;
        /**
         * 堆冒泡
         *
         * @param startIndex 堆冒泡起始索引
         */
        heapifyUp(startIndex?: number): void;
        /**
         * 堆下沉
         *
         * @param startIndex 堆下沉起始索引
         */
        heapifyDown(startIndex?: number): void;
        /**
         * 检查堆元素对的顺序是否正确。
         * 对于MinHeap，第一个元素必须总是小于等于。
         * 对于MaxHeap，第一个元素必须总是大于或等于。
         *
         * @param firstElement 第一个元素
         * @param secondElement 第二个元素
         */
        abstract pairIsInCorrectOrder(firstElement: T, secondElement: T): boolean;
    }
}
declare namespace feng3d {
    /**
     * 最大堆
     *
     * 所有父结点都大于子结点
     */
    class MaxHeap<T> extends Heap<T> {
        /**
         * 检查堆元素对的顺序是否正确。
         * 对于MinHeap，第一个元素必须总是小于等于。
         * 对于MaxHeap，第一个元素必须总是大于或等于。
         *
         * @param firstElement 第一个元素
         * @param secondElement 第二个元素
         */
        pairIsInCorrectOrder(firstElement: T, secondElement: T): boolean;
    }
}
declare namespace feng3d {
    /**
     * 最小堆
     *
     * 所有父结点都小于子结点
     */
    class MinHeap<T> extends Heap<T> {
        /**
         * 检查堆元素对的顺序是否正确。
         * 对于MinHeap，第一个元素必须总是小于等于。
         * 对于MaxHeap，第一个元素必须总是大于或等于。
         *
         * @param firstElement 第一个元素
         * @param secondElement 第二个元素
         */
        pairIsInCorrectOrder(firstElement: T, secondElement: T): boolean;
    }
}
declare namespace feng3d {
    /**
     * 哈希表（散列表）
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/hash-table/HashTable.js
     */
    class HashTable {
        private keys;
        buckets: LinkedList<{
            key: string;
            value: any;
        }>[];
        /**
         * 构建哈希表
         * @param hashTableSize 哈希表尺寸
         */
        constructor(hashTableSize?: number);
        /**
         * 将字符串键转换为哈希数。
         *
         * @param key 字符串键
         */
        hash(key: string): number;
        /**
         * 设置值
         *
         * @param key 键
         * @param value 值
         */
        set(key: string, value: any): void;
        /**
         * 删除指定键以及对于值
         *
         * @param key 键
         */
        delete(key: string): LinkedListNode<{
            key: string;
            value: any;
        }>;
        /**
         * 获取与键对应的值
         *
         * @param key 键
         */
        get(key: string): any;
        /**
         * 是否拥有键
         *
         * @param key 键
         */
        has(key: string): any;
        /**
         * 获取键列表
         */
        getKeys(): string[];
    }
}
declare namespace feng3d {
    /**
     * 优先队列
     *
     * 所有元素按优先级排序
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/priority-queue/PriorityQueue.js
     */
    class PriorityQueue<T> {
        private items;
        /**
         * 队列长度
         */
        get length(): number;
        /**
         * 比较函数
         */
        get compare(): (a: T, b: T) => number;
        set compare(v: (a: T, b: T) => number);
        private _compare;
        /**
         * 构建优先数组
         * @param   compare     比较函数
         */
        constructor(compare: (a: T, b: T) => number);
        /**
         * 尾部添加元素（进队）
         * @param items 元素列表
         * @returns 长度
         */
        push(...items: T[]): number;
        /**
         * 头部移除元素（出队）
         */
        shift(): T;
        /**
         * 转换为数组
         */
        toArray(): T[];
        /**
         * 从数组初始化链表
         */
        fromArray(array: T[]): void;
    }
}
declare namespace feng3d {
    /**
     * 优先队列
     *
     * 与最小堆相同，只是与元素比较时不同
     * 我们考虑的不是元素的值，而是它的优先级。
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/priority-queue/PriorityQueue.js
     */
    class PriorityQueue1<T> extends MinHeap<T> {
        private priorities;
        constructor();
        /**
         * 新增元素
         *
         * @param item 元素
         * @param priority 优先级
         */
        add(item: T, priority?: number): this;
        /**
         * 移除元素
         *
         * @param item 元素
         * @param customFindingComparator 自定义查找比较器
         */
        remove(item: T, customFindingComparator?: Comparator<T>): this;
        /**
         * 改变元素优先级
         *
         * @param item 元素
         * @param priority 优先级
         */
        changePriority(item: T, priority: number): this;
        /**
         * 查找元素所在索引
         *
         * @param item 元素
         */
        findByValue(item: T): number[];
        /**
         * 是否拥有元素
         *
         * @param item 元素
         */
        hasValue(item: T): boolean;
        /**
         * 比较两个元素优先级
         *
         * @param a 元素a
         * @param b 元素b
         */
        comparePriority(a: T, b: T): 1 | 0 | -1;
        /**
         * 比较两个元素大小
         *
         * @param a 元素a
         * @param b 元素b
         */
        compareValue(a: T, b: T): 1 | 0 | -1;
    }
}
declare namespace feng3d {
    /**
     * 布隆过滤器 （ 在 JavaScript中 该类可由Object对象代替）
     *
     * 用于判断某元素是否可能插入
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/bloom-filter/BloomFilter.js
     * @see https://baike.baidu.com/item/%E5%B8%83%E9%9A%86%E8%BF%87%E6%BB%A4%E5%99%A8
     */
    class BloomFilter {
        private size;
        private storage;
        /**
         *
         * @param size 尺寸
         */
        constructor(size?: number);
        /**
         * 插入
         *
         * @param item 元素
         */
        insert(item: string): void;
        /**
         * 可能包含
         *
         * @param item 元素
         */
        mayContain(item: string): boolean;
        /**
         * 创建存储器
         * @param size 尺寸
         */
        createStore(size: number): {
            getValue(index: any): any;
            setValue(index: any): void;
        };
        /**
         * 计算哈希值1
         *
         * @param item 元素
         */
        hash1(item: string): number;
        /**
         * 计算哈希值2
         *
         * @param item 元素
         */
        hash2(item: string): number;
        /**
         * 计算哈希值3
         *
         * @param item 元素
         */
        hash3(item: string): number;
        /**
         * 获取3个哈希值组成的数组
         */
        getHashValues(item: string): number[];
    }
}
declare namespace feng3d {
    /**
     * 并查集
     *
     * 并查集是一种树型的数据结构，用于处理一些不交集（Disjoint Sets）的合并及查询问题。
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/disjoint-set/DisjointSet.js
     * @see https://en.wikipedia.org/wiki/Disjoint-set_data_structure
     * @see https://www.youtube.com/watch?v=wU6udHRIkcc&index=14&t=0s&list=PLLXdhg_r2hKA7DPDsunoDZ-Z769jWn4R8
     */
    class DisjointSet<T> {
        private items;
        /**
         * 计算键值函数
         */
        private keyCallback;
        /**
         * 构建 并查集
         * @param keyCallback 计算键值函数
         */
        constructor(keyCallback?: (value: T) => string);
        /**
         * 创建集合
         *
         * @param nodeValue 结点值
         */
        makeSet(nodeValue: T): this;
        /**
         * 查找给出值所在集合根结点键值
         *
         * @param nodeValue 结点值
         */
        find(nodeValue: T): string;
        /**
         * 合并两个值所在的集合
         *
         * @param valueA 值a
         * @param valueB 值b
         */
        union(valueA: T, valueB: T): this;
        /**
         * 判断两个值是否在相同集合中
         *
         * @param valueA 值A
         * @param valueB 值B
         */
        inSameSet(valueA: T, valueB: T): boolean;
    }
    /**
     * 并查集结点
     */
    class DisjointSetNode<T> {
        /**
         * 值
         */
        value: T;
        /**
         * 计算键值函数
         */
        keyCallback: (value: T) => string;
        /**
         * 父结点
         */
        parent: DisjointSetNode<T>;
        /**
         * 子结点
         */
        children: any;
        /**
         * 构建 并查集 项
         *
         * @param value 值
         * @param keyCallback 计算键值函数
         */
        constructor(value: T, keyCallback?: (value: T) => string);
        /**
         * 获取键值
         */
        getKey(): string;
        /**
         * 获取根结点
         */
        getRoot(): DisjointSetNode<T>;
        /**
         * 是否为根结点
         */
        isRoot(): boolean;
        /**
         * 获取所有子孙结点数量
         */
        getRank(): number;
        /**
         * 获取子结点列表
         */
        getChildren(): any[];
        /**
         * 设置父结点
         * @param parentNode 父结点
         */
        setParent(parentNode: DisjointSetNode<T>): this;
        /**
         * 添加子结点
         * @param childNode 子结点
         */
        addChild(childNode: DisjointSetNode<T>): this;
    }
}
declare namespace feng3d {
    /**
     * 图
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/graph/Graph.js
     * @see https://en.wikipedia.org/wiki/Graph_(abstract_data_type)
     * @see https://www.youtube.com/watch?v=gXgEDyodOJU&index=9&list=PLLXdhg_r2hKA7DPDsunoDZ-Z769jWn4R8
     * @see https://www.youtube.com/watch?v=k1wraWzqtvQ&index=10&list=PLLXdhg_r2hKA7DPDsunoDZ-Z769jWn4R8
     */
    class Graph<T> {
        /**
         * 顶点列表
         */
        vertices: {
            [key: string]: GraphVertex<T>;
        };
        /**
         * 边列表
         */
        edges: {
            [key: string]: GraphEdge<T>;
        };
        /**
         * 是否有向
         */
        isDirected: boolean;
        /**
         * 构建图
         *
         * @param isDirected 是否有向
         */
        constructor(isDirected?: boolean);
        /**
         * 新增顶点
         *
         * @param newVertex 新顶点
         */
        addVertex(newVertex: GraphVertex<T>): this;
        /**
         * 获取顶点
         *
         * @param vertexKey 顶点键值
         */
        getVertexByKey(vertexKey: string): GraphVertex<T>;
        /**
         * 获取相邻点
         *
         * @param vertex 顶点
         */
        getNeighbors(vertex: GraphVertex<T>): any;
        /**
         * 获取所有顶点
         */
        getAllVertices(): GraphVertex<T>[];
        /**
         * 获取所有边
         */
        getAllEdges(): GraphEdge<T>[];
        /**
         * 新增边
         *
         * @param edge 边
         */
        addEdge(edge: GraphEdge<T>): this;
        /**
         * 删除边
         *
         * @param edge 边
         */
        deleteEdge(edge: GraphEdge<T>): void;
        /**
         * 查找边
         *
         * @param startVertex 起始顶点
         * @param endVertex 结束顶点
         */
        findEdge(startVertex: GraphVertex<T>, endVertex: GraphVertex<T>): GraphEdge<T>;
        /**
         * 获取权重
         */
        getWeight(): number;
        /**
         * 反转
         */
        reverse(): this;
        /**
         * 获取所有顶点索引
         */
        getVerticesIndices(): {};
        /**
         * 获取邻接矩阵
         */
        getAdjacencyMatrix(): any[];
        /**
         * 转换为字符串
         */
        toString(): string;
    }
    /**
     * 图边
     */
    class GraphEdge<T> {
        /**
         * 起始顶点
         */
        startVertex: GraphVertex<T>;
        /**
         * 结束顶点
         */
        endVertex: GraphVertex<T>;
        /**
         * 权重
         */
        weight: number;
        /**
         * 构建图边
         * @param startVertex 起始顶点
         * @param endVertex 结束顶点
         * @param weight 权重
         */
        constructor(startVertex: GraphVertex<T>, endVertex: GraphVertex<T>, weight?: number);
        /**
         * 获取键值
         */
        getKey(): string;
        /**
         * 反转
         */
        reverse(): this;
        /**
         * 转换为字符串
         */
        toString(): string;
    }
    /**
     * 图顶点
     */
    class GraphVertex<T> {
        /**
         * 值
         */
        value: T;
        /**
         * 边列表
         */
        edges: LinkedList<GraphEdge<T>>;
        /**
         * 构建图顶点
         *
         * @param value 值
         */
        constructor(value: T);
        /**
         * 新增边
         *
         * @param edge 边
         */
        addEdge(edge: GraphEdge<T>): this;
        /**
         * 删除边
         *
         * @param edge 边
         */
        deleteEdge(edge: GraphEdge<T>): void;
        /**
         * 获取相邻顶点
         */
        getNeighbors(): any;
        /**
         * 获取边列表
         */
        getEdges(): GraphEdge<T>[];
        /**
         * 获取边的数量
         */
        getDegree(): number;
        /**
         * 是否存在指定边
         *
         * @param requiredEdge 边
         */
        hasEdge(requiredEdge: GraphEdge<T>): boolean;
        /**
         * 是否有相邻顶点
         *
         * @param vertex 顶点
         */
        hasNeighbor(vertex: GraphVertex<T>): boolean;
        /**
         * 查找边
         *
         * @param vertex 顶点
         */
        findEdge(vertex: GraphVertex<T>): GraphEdge<T>;
        /**
         * 获取键值
         */
        getKey(): string;
        /**
         * 删除所有边
         */
        deleteAllEdges(): this;
        /**
         * 转换为字符串
         *
         * @param callback 转换为字符串函数
         */
        toString(callback?: (value: T) => string): string;
    }
}
declare namespace feng3d {
    /**
     * 二叉树结点
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/tree/BinaryTreeNode.js
     */
    class BinaryTreeNode<T> {
        /**
         * 左结点
         */
        left: BinaryTreeNode<T>;
        /**
         * 右结点
         */
        right: BinaryTreeNode<T>;
        /**
         * 父结点
         */
        parent: BinaryTreeNode<T>;
        /**
         * 结点值
         */
        value: T;
        /**
         * 结点比较器
         */
        nodeComparator: Comparator<BinaryTreeNode<T>>;
        meta: HashTable;
        /**
         * 构建二叉树结点
         *
         * @param value 结点值
         */
        constructor(value?: T);
        /**
         * 左结点高度
         */
        get leftHeight(): any;
        /**
         * 右结点高度
         */
        get rightHeight(): any;
        /**
         * 高度
         */
        get height(): number;
        /**
         * 平衡系数
         */
        get balanceFactor(): number;
        /**
         * 获取叔伯结点
         */
        get uncle(): BinaryTreeNode<T>;
        /**
         * 设置结点值
         *
         * @param value 值
         */
        setValue(value: T): this;
        /**
         * 设置左结点
         *
         * @param node 结点
         */
        setLeft(node: BinaryTreeNode<T> | null): this;
        /**
         * 设置右结点
         *
         * @param node 结点
         */
        setRight(node: BinaryTreeNode<T> | null): this;
        /**
         * 移除子结点
         *
         * @param nodeToRemove 子结点
         */
        removeChild(nodeToRemove: BinaryTreeNode<T>): boolean;
        /**
         * 替换节点
         *
         * @param nodeToReplace 被替换的节点
         * @param replacementNode 替换后的节点
         */
        replaceChild(nodeToReplace: BinaryTreeNode<T>, replacementNode: BinaryTreeNode<T>): boolean;
        /**
         * 拷贝节点
         *
         * @param sourceNode 源节点
         * @param targetNode 目标节点
         */
        static copyNode<T>(sourceNode: BinaryTreeNode<T>, targetNode: BinaryTreeNode<T>): void;
        /**
         * 左序深度遍历
         */
        traverseInOrder(): any[];
        /**
         * 转换为字符串
         */
        toString(): string;
    }
}
declare namespace feng3d {
    /**
     * 二叉查找树结点
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/tree/binary-search-tree/BinarySearchTreeNode.js
     */
    class BinarySearchTreeNode<T> extends BinaryTreeNode<T> {
        /**
         * 左结点
         */
        left: BinarySearchTreeNode<T>;
        /**
         * 右结点
         */
        right: BinarySearchTreeNode<T>;
        /**
         * 父结点
         */
        parent: BinarySearchTreeNode<T>;
        /**
         * 比较函数
         */
        private compareFunction;
        /**
         * 结点值比较器
         */
        private nodeValueComparator;
        /**
         * 构建二叉查找树结点
         *
         * @param value 结点值
         * @param compareFunction 比较函数
         */
        constructor(value?: T, compareFunction?: CompareFunction<T>);
        /**
         * 插入值
         *
         * @param value 值
         */
        insert(value: T): any;
        /**
         * 查找结点
         *
         * @param value 值
         */
        find(value: T): BinarySearchTreeNode<T>;
        /**
         * 是否包含指定值
         *
         * @param value 结点值
         */
        contains(value: T): boolean;
        /**
         * 移除指定值
         *
         * @param value 结点值
         */
        remove(value: T): boolean;
        /**
         * 查找最小值
         */
        findMin(): BinarySearchTreeNode<T>;
    }
}
declare namespace feng3d {
    /**
     * 二叉查找树
     *
     * 二叉查找树（英语：Binary Search Tree），也称为二叉搜索树、有序二叉树（ordered binary tree）或排序二叉树（sorted binary tree），是指一棵空树或者具有下列性质的二叉树：
     *
     * 1. 若任意节点的左子树不空，则左子树上所有节点的值均小于它的根节点的值；
     * 1. 若任意节点的右子树不空，则右子树上所有节点的值均大于它的根节点的值；
     * 1. 任意节点的左、右子树也分别为二叉查找树；
     * 1. 没有键值相等的节点。
     *
     * @see https://github.com/trekhleb/javascript-algorithms/blob/master/src/data-structures/tree/binary-search-tree/BinarySearchTree.js
     * @see https://en.wikipedia.org/wiki/Binary_search_tree
     * @see https://www.youtube.com/watch?v=wcIRPqTR3Kc&list=PLLXdhg_r2hKA7DPDsunoDZ-Z769jWn4R8&index=9&t=0s
     */
    class BinarySearchTree<T> {
        /**
         * 根结点
         */
        root: BinarySearchTreeNode<T>;
        /**
         * 结点比较器
         */
        nodeComparator: Comparator<BinaryTreeNode<T>>;
        /**
         * 构建 二叉查找树
         *
         * @param nodeValueCompareFunction 结点值比较器
         */
        constructor(nodeValueCompareFunction?: CompareFunction<T>);
        /**
         * 插入值
         *
         * @param value 值
         */
        insert(value: T): any;
        /**
         * 是否包含指定值
         *
         * @param value 值
         */
        contains(value: T): boolean;
        /**
         * 移除指定值
         *
         * @param value 值
         */
        remove(value: T): boolean;
        /**
         * 转换为字符串
         */
        toString(): string;
    }
}
declare namespace feng3d {
    /**
     * 平衡二叉树
     *
     * AVL树（以发明者Adelson-Velsky和Landis 命名）是自平衡二叉搜索树。
     *
     * @see https://github.com/trekhleb/javascript-algorithms/tree/master/src/data-structures/tree/avl-tree
     * @see https://en.wikipedia.org/wiki/AVL_tree
     * @see https://www.tutorialspoint.com/data_structures_algorithms/avl_tree_algorithm.htm
     * @see http://btechsmartclass.com/data_structures/avl-trees.html
     */
    class AvlTree<T> extends BinarySearchTree<T> {
        /**
         * @param {*} value
         */
        insert(value: T): void;
        /**
         * @param {*} value
         * @return {boolean}
         */
        remove(value: T): boolean;
        /**
         * @param {BinarySearchTreeNode} node
         */
        balance(node: BinarySearchTreeNode<T>): void;
        /**
         * @param {BinarySearchTreeNode} rootNode
         */
        rotateLeftLeft(rootNode: BinarySearchTreeNode<T>): void;
        /**
         * @param {BinarySearchTreeNode} rootNode
         */
        rotateLeftRight(rootNode: BinarySearchTreeNode<T>): void;
        /**
         * @param {BinarySearchTreeNode} rootNode
         */
        rotateRightLeft(rootNode: BinarySearchTreeNode<T>): void;
        /**
         * @param {BinarySearchTreeNode} rootNode
         */
        rotateRightRight(rootNode: BinarySearchTreeNode<T>): void;
    }
}
declare namespace feng3d {
    /**
     * 方程求解
     */
    var equationSolving: EquationSolving;
    /**
     * 方程求解
     *
     * 求解方程 f(x) == 0 在[a, b]上的解
     *
     * 参考：高等数学 第七版上册 第三章第八节 方程的近似解
     * 当f(x)在区间 [a, b] 上连续，且f(a) * f(b) <= 0 时，f(x)在区间 [a, b] 上至少存在一个解使得 f(x) == 0
     *
     * 当f(x)在区间 [a, b] 上连续，且 (f(a) - y) * (f(b) - y) < 0 时，f(x)在区间 [a, b] 上至少存在一个解使得 f(x) == y
     *
     * @author feng / http://feng3d.com 05/06/2018
     */
    class EquationSolving {
        /**
         * 获取数字的(正负)符号
         * @param n 数字
         */
        private getSign;
        /**
         * 比较 a 与 b 是否相等
         * @param a 值a
         * @param b 值b
         * @param precision 比较精度
         */
        private equalNumber;
        /**
         * 获取近似导函数 f'(x)
         *
         * 导函数定义
         * f'(x) = (f(x + Δx) - f(x)) / Δx , Δx → 0
         *
         * 注：通过测试Δx不能太小，由于方程内存在x的n次方问题（比如0.000000000000001的10次方为0），过小会导致计算机计算进度不够反而导致求导不准确！
         *
         * 另外一种办法是还原一元多次函数，然后求出导函数。
         *
         * @param f 函数
         * @param delta Δx，进过测试该值太小或者过大都会导致求导准确率降低（个人猜测是计算机计算精度问题导致）
         */
        getDerivative(f: (x: number) => number, delta?: number): (x: number) => number;
        /**
         * 函数是否连续
         * @param f 函数
         */
        isContinuous(f: (x: number) => number): boolean;
        /**
         * 方程 f(x) == 0 在 [a, b] 区间内是否有解
         *
         * 当f(x)在区间 [a, b] 上连续，且f(a) * f(b) <= 0 时，f(x)在区间 [a, b] 上至少存在一个解使得 f(x) == 0
         *
         * @param f 函数f(x)
         * @param a 区间起点
         * @param b 区间终点
         * @param errorcallback  错误回调函数
         *
         * @returns 是否有解
         */
        hasSolution(f: (x: number) => number, a: number, b: number, errorcallback?: (err: Error) => void): boolean;
        /**
         * 二分法 求解 f(x) == 0
         *
         * 通过区间中点作为边界来逐步缩小求解区间，最终获得解
         *
         * @param f 函数f(x)
         * @param a 区间起点
         * @param b 区间终点
         * @param precision 求解精度
         * @param errorcallback  错误回调函数
         *
         * @returns 不存在解时返回 undefined ，存在时返回 解
         */
        binary(f: (x: number) => number, a: number, b: number, precision?: number, errorcallback?: (err: Error) => void): number;
        /**
         * 连线法 求解 f(x) == 0
         *
         * 连线法是我自己想的方法，自己取的名字，目前没有找到相应的资料（这方法大家都能够想得到。）
         *
         * 用曲线弧两端的连线来代替曲线弧与X轴交点作为边界来逐步缩小求解区间，最终获得解
         *
         * 通过 A，B两点连线与x轴交点来缩小求解区间最终获得解
         *
         * A，B两点直线方程 f(x) = f(a) + (f(b) - f(a)) / (b - a) * (x-a) ,求 f(x) == 0 解得 x = a - fa * (b - a)/ (fb - fa)
         *
         * @param f 函数f(x)
         * @param a 区间起点
         * @param b 区间终点
         * @param precision 求解精度
         * @param errorcallback  错误回调函数
         *
         * @returns 不存在解时返回 undefined ，存在时返回 解
         */
        line(f: (x: number) => number, a: number, b: number, precision?: number, errorcallback?: (err: Error) => void): number;
        /**
         * 切线法 求解 f(x) == 0
         *
         * 用曲线弧一端的切线来代替曲线弧，从而求出方程实根的近似解。
         *
         * 迭代公式： Xn+1 = Xn - f(Xn) / f'(Xn)
         *
         * #### 额外需求
         * 1. f(x)在[a, b]上具有一阶导数 f'(x)
         * 1. f'(x)在[a, b]上保持定号；意味着f(x)在[a, b]上单调
         * 1. f''(x)在[a, b]上保持定号；意味着f'(x)在[a, b]上单调
         *
         * 切记，当无法满足这些额外要求时，该函数将找不到[a, b]上的解！！！！！！！！！！！
         *
         * @param f 函数f(x)
         * @param f1 一阶导函数 f'(x)
         * @param f2 二阶导函数 f''(x)
         * @param a 区间起点
         * @param b 区间终点
         * @param precision 求解精度
         * @param errorcallback  错误回调函数
         *
         * @returns 不存在解与无法使用该函数求解时返回 undefined ，否则返回 解
         */
        tangent(f: (x: number) => number, f1: (x: number) => number, f2: (x: number) => number, a: number, b: number, precision?: number, errorcallback?: (err: Error) => void): number;
        /**
         * 割线法（弦截法） 求解 f(x) == 0
         *
         * 使用 (f(Xn) - f(Xn-1)) / (Xn - Xn-1) 代替切线法迭代公式 Xn+1 = Xn - f(Xn) / f'(Xn) 中的 f'(x)
         *
         * 迭代公式：Xn+1 = Xn - f(Xn) * (Xn - Xn-1) / (f(Xn) - f(Xn-1));
         *
         * 用过点(Xn-1,f(Xn-1))和点(Xn,f(Xn))的割线来近似代替(Xn,f(Xn))处的切线，将这条割线与X轴交点的横坐标作为新的近似解。
         *
         * #### 额外需求
         * 1. f(x)在[a, b]上具有一阶导数 f'(x)
         * 1. f'(x)在[a, b]上保持定号；意味着f(x)在[a, b]上单调
         * 1. f''(x)在[a, b]上保持定号；意味着f'(x)在[a, b]上单调
         *
         * 切记，当无法满足这些额外要求时，该函数将找不到[a, b]上的解！！！！！！！！！！！
         *
         * @param f 函数f(x)
         * @param a 区间起点
         * @param b 区间终点
         * @param precision 求解精度
         * @param errorcallback  错误回调函数
         *
         * @returns 不存在解与无法使用该函数求解时返回 undefined ，否则返回 解
         */
        secant(f: (x: number) => number, a: number, b: number, precision?: number, errorcallback?: (err: Error) => void): number;
    }
}
declare namespace feng3d {
    /**
     * 高次函数
     *
     * 处理N次函数定义，求值，方程求解问题
     *
     * n次函数定义
     * f(x) = a0 * pow(x, n) + a1 * pow(x, n - 1) +.....+ an_1 * pow(x, 1) + an
     *
     * 0次 f(x) = a0;
     * 1次 f(x) = a0 * x + a1;
     * 2次 f(x) = a0 * x * x + a1 * x + a2;
     * ......
     *
     */
    class HighFunction {
        private as;
        /**
         * 构建函数
         * @param as 函数系数 a0-an 数组
         */
        constructor(as: number[]);
        /**
         * 获取函数 f(x) 的值
         * @param x x坐标
         */
        getValue(x: number): number;
    }
}
declare namespace feng3d {
    /**
     * 坐标系统类型
     */
    enum CoordinateSystem {
        /**
         * 默认坐标系统，左手坐标系统
         */
        LEFT_HANDED = 0,
        /**
         * 右手坐标系统
         */
        RIGHT_HANDED = 1
    }
    /**
     * 引擎中使用的坐标系统，默认左手坐标系统。
     *
     * three.js 右手坐标系统。
     * playcanvas 右手坐标系统。
     * unity    左手坐标系统。
     */
    var coordinateSystem: CoordinateSystem;
}
declare namespace feng3d {
    /**
     * 用于表示欧拉角的旋转顺序
     *
     * 如果顺序为XYZ，则依次按 ZYZ 轴旋转。为什么循序与定义相反？因为three.js中都这么定义，他们为什么这么定义就不清楚了。
     */
    enum RotationOrder {
        /**
         * 依次按 ZYX 轴旋转。
         *
         * three.js默认旋转顺序。
         */
        XYZ = 0,
        /**
         * 依次按 YXZ 轴旋转。
         */
        ZXY = 1,
        /**
         * 依次按 XYZ 轴旋转。
         *
         * playcanvas默认旋转顺序。
         */
        ZYX = 2,
        /**
         * 依次按 ZXY 轴旋转。
         *
         * unity默认旋转顺序。
         */
        YXZ = 3,
        /**
         * 依次按 XZY 轴旋转。
         */
        YZX = 4,
        /**
         * 依次按 YZX 轴旋转。
         */
        XZY = 5
    }
    /**
     * 引擎中使用的旋转顺序。
     *
     * unity YXZ
     * playcanvas ZYX
     * three.js XYZ
     */
    var defaultRotationOrder: RotationOrder;
}
declare namespace feng3d {
    /**
     * 点与面的相对位置
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
        INTERSECT = 2
    }
}
declare namespace feng3d {
    /**
     * 颜色
     */
    class Color3 {
        __class__: "feng3d.Color3";
        static WHITE: Color3;
        static BLACK: Color3;
        static fromUnit(color: number): Color3;
        static fromColor4(color4: Color4): Color3;
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
        mix(color: Color3, rate: number): this;
        /**
         * 混合颜色
         * @param color 混入的颜色
         * @param rate  混入比例
         */
        mixTo(color: Color3, rate: number, vout?: Color3): Color3;
        /**
         * 按标量（大小）缩放当前的 Color3 对象。
         */
        scale(s: number): this;
        /**
         * 按标量（大小）缩放当前的 Color3 对象。
         */
        scaleTo(s: number, vout?: Color3): Color3;
        /**
         * 通过将当前 Color3 对象的 r、g 和 b 元素与指定的 Color3 对象的 r、g 和 b 元素进行比较，确定这两个对象是否相等。
         */
        equals(object: Color3, precision?: number): boolean;
        /**
         * 拷贝
         */
        copy(color: Color3): this;
        clone(): Color3;
        toVector3(vector3?: Vector3): Vector3;
        toColor4(color4?: Color4): Color4;
        /**
         * 输出字符串
         */
        toString(): string;
        /**
         * 转换为数组
         * @param array 数组
         * @param offset 偏移
         */
        toArray(array?: number[], offset?: number): number[];
        /**
         * [0,15]数值转为16进制字符串
         * param i  [0,15]数值
         */
        static ToHex(i: number): string;
    }
    var ColorKeywords: {
        aliceblue: number;
        antiquewhite: number;
        aqua: number;
        aquamarine: number;
        azure: number;
        beige: number;
        bisque: number;
        black: number;
        blanchedalmond: number;
        blue: number;
        blueviolet: number;
        brown: number;
        burlywood: number;
        cadetblue: number;
        chartreuse: number;
        chocolate: number;
        coral: number;
        cornflowerblue: number;
        cornsilk: number;
        crimson: number;
        cyan: number;
        darkblue: number;
        darkcyan: number;
        darkgoldenrod: number;
        darkgray: number;
        darkgreen: number;
        darkgrey: number;
        darkkhaki: number;
        darkmagenta: number;
        darkolivegreen: number;
        darkorange: number;
        darkorchid: number;
        darkred: number;
        darksalmon: number;
        darkseagreen: number;
        darkslateblue: number;
        darkslategray: number;
        darkslategrey: number;
        darkturquoise: number;
        darkviolet: number;
        deeppink: number;
        deepskyblue: number;
        dimgray: number;
        dimgrey: number;
        dodgerblue: number;
        firebrick: number;
        floralwhite: number;
        forestgreen: number;
        fuchsia: number;
        gainsboro: number;
        ghostwhite: number;
        gold: number;
        goldenrod: number;
        gray: number;
        green: number;
        greenyellow: number;
        grey: number;
        honeydew: number;
        hotpink: number;
        indianred: number;
        indigo: number;
        ivory: number;
        khaki: number;
        lavender: number;
        lavenderblush: number;
        lawngreen: number;
        lemonchiffon: number;
        lightblue: number;
        lightcoral: number;
        lightcyan: number;
        lightgoldenrodyellow: number;
        lightgray: number;
        lightgreen: number;
        lightgrey: number;
        lightpink: number;
        lightsalmon: number;
        lightseagreen: number;
        lightskyblue: number;
        lightslategray: number;
        lightslategrey: number;
        lightsteelblue: number;
        lightyellow: number;
        lime: number;
        limegreen: number;
        linen: number;
        magenta: number;
        maroon: number;
        mediumaquamarine: number;
        mediumblue: number;
        mediumorchid: number;
        mediumpurple: number;
        mediumseagreen: number;
        mediumslateblue: number;
        mediumspringgreen: number;
        mediumturquoise: number;
        mediumvioletred: number;
        midnightblue: number;
        mintcream: number;
        mistyrose: number;
        moccasin: number;
        navajowhite: number;
        navy: number;
        oldlace: number;
        olive: number;
        olivedrab: number;
        orange: number;
        orangered: number;
        orchid: number;
        palegoldenrod: number;
        palegreen: number;
        paleturquoise: number;
        palevioletred: number;
        papayawhip: number;
        peachpuff: number;
        peru: number;
        pink: number;
        plum: number;
        powderblue: number;
        purple: number;
        rebeccapurple: number;
        red: number;
        rosybrown: number;
        royalblue: number;
        saddlebrown: number;
        salmon: number;
        sandybrown: number;
        seagreen: number;
        seashell: number;
        sienna: number;
        silver: number;
        skyblue: number;
        slateblue: number;
        slategray: number;
        slategrey: number;
        snow: number;
        springgreen: number;
        steelblue: number;
        tan: number;
        teal: number;
        thistle: number;
        tomato: number;
        turquoise: number;
        violet: number;
        wheat: number;
        white: number;
        whitesmoke: number;
        yellow: number;
        yellowgreen: number;
    };
}
declare namespace feng3d {
    /**
     * 颜色（包含透明度）
     */
    class Color4 {
        __class__: "feng3d.Color4";
        static readonly WHITE: Readonly<Color4>;
        static readonly BLACK: Readonly<Color4>;
        static fromUnit(color: number): Color4;
        static fromUnit24(color: number, a?: number): Color4;
        static fromColor3(color3: Color3, a?: number): Color4;
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
         * 输出 RGBA 颜色值，例如 rgba(255,255,255,1)
         */
        toRGBA(): string;
        /**
         * 混合颜色
         * @param color 混入的颜色
         * @param rate  混入比例
         */
        mix(color: Color4, rate?: number): this;
        /**
         * 混合颜色
         * @param color 混入的颜色
         * @param rate  混入比例
         */
        mixTo(color: Color4, rate: number, vout?: Color4): Color4;
        /**
         * 乘以指定颜色
         * @param c 乘以的颜色
         * @return 返回自身
         */
        multiply(c: Color4): this;
        /**
         * 乘以指定颜色
         * @param v 乘以的颜色
         * @return 返回新颜色
         */
        multiplyTo(v: Color4, vout?: Color4): Color4;
        /**
         * 乘以指定常量
         *
         * @param scale 缩放常量
         * @return 返回自身
         */
        multiplyNumber(scale: number): this;
        /**
         * 通过将当前 Color3 对象的 r、g 和 b 元素与指定的 Color3 对象的 r、g 和 b 元素进行比较，确定这两个对象是否相等。
         */
        equals(object: Color4, precision?: number): boolean;
        /**
         * 拷贝
         */
        copy(color: Color4): this;
        /**
         * 输出字符串
         */
        toString(): string;
        toColor3(color?: Color3): Color3;
        toVector4(vector4?: Vector4): Vector4;
        /**
         * 转换为数组
         * @param array 数组
         * @param offset 偏移
         */
        toArray(array?: number[], offset?: number): number[];
        /**
         * 克隆
         */
        clone(): Color4;
    }
}
declare namespace feng3d {
    /**
     * 向量
     */
    interface Vector {
        /**
         * 将另一个点的坐标添加到此点的坐标。
         * @param v 要添加的点。
         */
        add(v: Vector): Vector;
        /**
         * 将另一个点的坐标添加到此点的坐标以创建一个新点。
         * @param v 要添加的点。
         * @param vout 用于接收计算结果。
         * @returns 新点。
         */
        addTo(v: Vector, vout?: Vector): Vector;
        /**
         * 从此点的坐标中减去另一个点的坐标。
         * @param v 要减去的点。
         */
        sub(v: Vector): Vector;
        /**
         * 从此点的坐标中减去另一个点的坐标以创建一个新点。
         * @param v 要减去的点。
         * @param vout 用于接收计算结果。
         * @returns 新点。
         */
        subTo(v: Vector, vout?: Vector): Vector;
        /**
         * 乘以向量
         * @param v 向量
         */
        multiply(v: Vector): this;
        /**
         * 乘以向量
         * @param v 向量
         * @param vout 输出向量
         */
        multiplyTo(v: Vector, vout?: Vector): Vector;
        /**
         * 除以向量
         * @param v 向量
         */
        divide(v: Vector): this;
        /**
         * 除以向量
         * @param v 向量
         * @param vout 输出向量
         */
        divideTo(v: Vector, vout?: Vector): Vector;
        /**
         * 确定两个向量是否相同。如果两个向量具有相同的分量值，则它们是相同的向量。
         * @param toCompare 要比较的向量。
         * @returns 如果该对象与此 向量 对象相同，则为 true 值，如果不相同，则为 false。
         */
        equals(toCompare: Vector, precision?: number): boolean;
        /**
         * 将源 Vector 对象中的所有点数据复制到调用方 Vector 对象中。
         * @param source 要从中复制数据的 Vector 对象。
         */
        copy(source: Vector): Vector;
        /**
         * 与目标点之间的距离
         * @param p 目标点
         */
        distance(p: Vector): number;
        /**
         * 与目标点之间的距离平方
         * @param p 目标点
         */
        distanceSquared(p: Vector): number;
        /**
         * 将 (0,0) 和当前点之间的线段缩放为设定的长度。
         *
         * @param thickness 缩放值。例如，如果当前点为 (0,5) 并且您将它规范化为 1，则返回的点位于 (0,1) 处。
         */
        normalize(thickness?: number): Vector;
    }
}
declare namespace feng3d {
    /**
     * Vector2 对象表示二维坐标系统中的某个位置，其中 x 表示水平轴，y 表示垂直轴。
     */
    class Vector2 implements Vector {
        __class__: "feng3d.Vector2";
        /**
         * 原点
         */
        static ZERO: Readonly<Vector2>;
        /**
         * 将一对极坐标转换为笛卡尔点坐标。
         * @param len 极坐标对的长度。
         * @param angle 极坐标对的角度（以弧度表示）。
         */
        static polar(len: number, angle: number): Vector2;
        /**
         * 创建一个 Vector2 对象.若不传入任何参数，将会创建一个位于（0，0）位置的点。
         *
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
        get length(): number;
        /**
         * 将 Vector2 的成员设置为指定值
         * @param x 该对象的x属性值
         * @param y 该对象的y属性值
         */
        set(x: number, y: number): Vector2;
        /**
         * 克隆点对象
         */
        clone(): Vector2;
        /**
         * 返回 pt1 和 pt2 之间的距离。
         * @param p1 第一个点
         * @param p2 第二个点
         * @returns 第一个点和第二个点之间的距离。
         */
        static distance(p1: Vector2, p2: Vector2): number;
        /**
         * 将另一个点的坐标添加到此点的坐标。
         * @param v 要添加的点。
         */
        add(v: Vector2): Vector2;
        /**
         * 将另一个点的坐标添加到此点的坐标以创建一个新点。
         * @param v 要添加的点。
         * @returns 新点。
         */
        addTo(v: Vector2, vout?: Vector2): Vector2;
        /**
         * 从此点的坐标中减去另一个点的坐标以创建一个新点。
         * @param v 要减去的点。
         * @returns 新点。
         */
        sub(v: Vector2): this;
        /**
         * 减去向量返回新向量
         * @param v 减去的向量
         * @return 返回的新向量
         */
        subTo(v: Vector2, vout?: Vector2): Vector2;
        /**
         * 乘以向量
         * @param v 向量
         */
        multiply(v: Vector2): this;
        /**
         * 乘以向量
         * @param v 向量
         * @param vout 输出向量
         */
        multiplyTo(v: Vector2, vout?: Vector2): Vector2;
        /**
         * 除以向量
         * @param v 向量
         */
        divide(v: Vector2): this;
        /**
         * 除以向量
         * @param v 向量
         * @param vout 输出向量
         */
        divideTo(v: Vector2, vout?: Vector2): Vector2;
        /**
         * 确定两个点是否相同。如果两个点具有相同的 x 和 y 值，则它们是相同的点。
         * @param toCompare 要比较的向量。
         * @returns 如果该对象与此 向量 对象相同，则为 true 值，如果不相同，则为 false。
         */
        equals(v: Vector2, precision?: number): boolean;
        /**
         * 将源 Vector2 对象中的所有点数据复制到调用方 Vector2 对象中。
         * @param source 要从中复制数据的 Vector2 对象。
         */
        copy(source: Vector2): this;
        /**
         * 返回与目标点之间的距离。
         * @param p 目标点
         * @returns 与目标点之间的距离。
         */
        distance(p: Vector2): number;
        /**
         * 与目标点之间的距离平方
         * @param p 目标点
         */
        distanceSquared(p: Vector3): number;
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
         * 倒数向量。
         * (x,y) -> (1/x,1/y)
         */
        reciprocal(): this;
        /**
         * 倒数向量。
         * (x,y) -> (1/x,1/y)
         */
        reciprocalTo(out?: Vector2): Vector2;
        /**
         * 按标量（大小）缩放当前的 Vector3 对象。
         */
        scaleNumber(s: number): Vector2;
        /**
         * 按标量（大小）缩放当前的 Vector2 对象。
         */
        scaleNumberTo(s: number, vout?: Vector2): Vector2;
        /**
         * 缩放
         * @param s 缩放量
         */
        scale(s: Vector2): this;
        /**
         * 缩放
         * @param s 缩放量
         */
        scaleTo(s: Vector2, vout?: Vector2): Vector2;
        /**
         * 按指定量偏移 Vector2 对象。dx 的值将添加到 x 的原始值中以创建新的 x 值。dy 的值将添加到 y 的原始值中以创建新的 y 值。
         * @param dx 水平坐标 x 的偏移量。
         * @param dy 水平坐标 y 的偏移量。
         */
        offset(dx: number, dy: number): Vector2;
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
         * 夹紧？
         * @param min 最小值
         * @param max 最大值
         */
        clamp(min: Vector2, max: Vector2): this;
        /**
         * 夹紧？
         * @param min 最小值
         * @param max 最大值
         */
        clampTo(min: Vector2, max: Vector2, vout?: Vector2): Vector2;
        /**
         * 取最小元素
         * @param v 向量
         */
        min(v: Vector2): this;
        /**
         * 取最大元素
         * @param v 向量
         */
        max(v: Vector2): this;
        /**
         * 各分量均取最近的整数
         */
        round(): this;
        /**
         * 返回包含 x 和 y 坐标的值的字符串。该字符串的格式为 "(x=x, y=y)"，因此为点 23,17 调用 toString() 方法将返回 "(x=23, y=17)"。
         * @returns 坐标的字符串表示形式。
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
     * Vector3 类使用笛卡尔坐标 x、y 和 z 表示三维空间中的点或位置
     */
    class Vector3 implements Vector {
        __class__: "feng3d.Vector3";
        /**
        * 定义为 Vector3 对象的 x 轴，坐标为 (1,0,0)。
        */
        static X_AXIS: Readonly<Vector3>;
        /**
        * 定义为 Vector3 对象的 y 轴，坐标为 (0,1,0)
        */
        static Y_AXIS: Readonly<Vector3>;
        /**
        * 定义为 Vector3 对象的 z 轴，坐标为 (0,0,1)
        */
        static Z_AXIS: Readonly<Vector3>;
        /**
         * 原点 Vector3(0,0,0)
         */
        static ZERO: Readonly<Vector3>;
        /**
         * Vector3(1, 1, 1)
         */
        static ONE: Readonly<Vector3>;
        /**
         * 从数组中初始化向量
         * @param array 数组
         * @param offset 偏移
         * @return 返回新向量
         */
        static fromArray(array: ArrayLike<number>, offset?: number): Vector3;
        /**
         * 随机三维向量
         *
         * @param size 尺寸
         * @param double 如果值为false，随机范围在[0,size],否则[-size,size]。默认为false。
         */
        static random(size?: number, double?: boolean): Vector3;
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
        get length(): number;
        /**
        * 当前 Vector3 对象长度的平方，它是使用 x、y 和 z 属性计算出来的。w 属性将被忽略。尽可能使用 lengthSquared() 方法，而不要使用 Vector3.length() 方法的 Math.sqrt() 方法调用，后者速度较慢。
        */
        get lengthSquared(): number;
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
        set(x: number, y: number, z: number): this;
        /**
         * 把所有分量都设为零
         */
        setZero(): void;
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
         * 加上指定向量
         * @param v 加向量
         */
        add(v: Vector3): this;
        /**
         * 加上指定向量得到新向量
         * @param v 加向量
         * @return 返回新向量
         */
        addTo(v: Vector3, vout?: Vector3): Vector3;
        /**
         * 减去向量
         * @param a 减去的向量
         * @return 返回新向量
         */
        sub(a: Vector3): this;
        /**
         * 减去向量返回新向量
         * @param v 减去的向量
         * @return 返回的新向量
         */
        subTo(v: Vector3, vout?: Vector3): Vector3;
        /**
         * 乘以向量
         * @param v 向量
         */
        multiply(v: Vector3): this;
        /**
         * 乘以向量
         * @param v 向量
         * @param vout 输出向量
         */
        multiplyTo(v: Vector3, vout?: Vector3): Vector3;
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
         * 通过将当前 Vector3 对象的 x、y 和 z 元素与指定的 Vector3 对象的 x、y 和 z 元素进行比较，确定这两个对象是否相等。
         */
        equals(v: Vector3, precision?: number): boolean;
        /**
         * 将源 Vector3 对象中的所有矢量数据复制到调用方 Vector3 对象中。
         * @return 要从中复制数据的 Vector3 对象。
         */
        copy(v: Vector3): this;
        /**
         * 与目标点之间的距离
         * @param p 目标点
         */
        distance(p: Vector3): number;
        /**
         * 与目标点之间的距离平方
         * @param p 目标点
         */
        distanceSquared(p: Vector3): number;
        /**
         * 通过将最前面的三个元素（x、y、z）除以矢量的长度可将 Vector3 对象转换为单位矢量。
         */
        normalize(thickness?: number): this;
        /**
         * Scale a vector and add it to this vector. Save the result in "this". (this = this + vector * scalar)
         * @param scalar
         * @param vector
         * @param  target The vector to save the result in.
         */
        addScaledVector(scalar: number, vector: Vector3): this;
        /**
         * Scale a vector and add it to this vector. Save the result in "target". (target = this + vector * scalar)
         * @param scalar
         * @param vector
         * @param  target The vector to save the result in.
         */
        addScaledVectorTo(scalar: number, vector: Vector3, target?: Vector3): Vector3;
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
         * 是否为零向量
         */
        isZero(): boolean;
        tangents(t1: Vector3, t2: Vector3): void;
        /**
         * 检查一个向量是否接近零
         *
         * @param precision
         */
        almostZero(precision?: number): boolean;
        /**
         * 检查这个向量是否与另一个向量反平行。
         *
         * @param  v
         * @param  precision 设置为零以进行精确比较
         */
        isAntiparallelTo(v: Vector3, precision?: number): boolean;
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
         * 负向量
         * (a,b,c)->(-a,-b,-c)
         */
        negate(): this;
        /**
         * 负向量
         * (a,b,c)->(-a,-b,-c)
         */
        negateTo(vout?: Vector3): Vector3;
        /**
         * 倒向量
         * (a,b,c)->(1/a,1/b,1/c)
         */
        inverse(): this;
        /**
         * 倒向量
         * (a,b,c)->(1/a,1/b,1/c)
         */
        inverseTo(vout?: Vector3): Vector3;
        /**
         * 得到这个向量长度为1
         */
        unit(target?: Vector3): Vector3;
        /**
         * 按标量（大小）缩放当前的 Vector3 对象。
         */
        scaleNumber(s: number): this;
        /**
         * 按标量（大小）缩放当前的 Vector3 对象。
         */
        scaleNumberTo(s: number, vout?: Vector3): Vector3;
        /**
         * 缩放
         * @param s 缩放量
         */
        scale(s: Vector3): this;
        /**
         * 缩放
         * @param s 缩放量
         */
        scaleTo(s: Vector3, vout?: Vector3): Vector3;
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
         * 夹紧？
         * @param min 最小值
         * @param max 最大值
         */
        clamp(min: Vector3, max: Vector3): this;
        /**
         * 夹紧？
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
        /**
         * 应用四元素
         * @param q 四元素
         */
        applyQuaternion(q: Quaternion): this;
        /**
         * 反射
         * @param normal
         */
        reflect(normal: Vector3): this;
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
         * 从向量中得到叉乘矩阵a_cross，使得a x b = a_cross * b = c
         * @see http://www8.cs.umu.se/kurser/TDBD24/VT06/lectures/Lecture6.pdf
         */
        crossmat(): Matrix3x3;
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
        __class__: "feng3d.Vector4";
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
        multiply(v: Vector4): this;
        /**
         * 乘以指定向量
         * @param v 乘以的向量
         * @return 返回新向量
         */
        multiplyTo(v: Vector4, vout?: Vector4): Vector4;
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
         * 如果当前 Vector4 对象和作为参数指定的 Vector4 对象均为单位顶点，此方法将返回这两个顶点之间所成角的余弦值。
         */
        dot(a: Vector4): number;
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
     * 矩形
     *
     * Rectangle 对象是按其位置（由它左上角的点 (x, y) 确定）以及宽度和高度定义的区域。<br/>
     * Rectangle 类的 x、y、width 和 height 属性相互独立；更改一个属性的值不会影响其他属性。
     * 但是，right 和 bottom 属性与这四个属性是整体相关的。例如，如果更改 right 属性的值，则 width
     * 属性的值将发生变化；如果更改 bottom 属性，则 height 属性的值将发生变化。
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
        get right(): number;
        set right(value: number);
        /**
         * y 和 height 属性的和。
         */
        get bottom(): number;
        set bottom(value: number);
        /**
         * 矩形左上角的 x 坐标。更改 Rectangle 对象的 left 属性对 y 和 height 属性没有影响。但是，它会影响 width 属性，而更改 x 值不会影响 width 属性。
         * left 属性的值等于 x 属性的值。
         */
        get left(): number;
        set left(value: number);
        /**
         * 矩形左上角的 y 坐标。更改 Rectangle 对象的 top 属性对 x 和 width 属性没有影响。但是，它会影响 height 属性，而更改 y 值不会影响 height 属性。<br/>
         * top 属性的值等于 y 属性的值。
         */
        get top(): number;
        set top(value: number);
        /**
         * 由该点的 x 和 y 坐标确定的 Rectangle 对象左上角的位置。
         */
        get topLeft(): Vector2;
        set topLeft(value: Vector2);
        /**
         * 由 right 和 bottom 属性的值确定的 Rectangle 对象的右下角的位置。
         */
        get bottomRight(): Vector2;
        set bottomRight(value: Vector2);
        /**
         * 中心点
         */
        get center(): Vector2;
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
        init(x: number, y: number, width: number, height: number): Rectangle;
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
         *
         * @param point 点
         * @param pout 输出点
         */
        clampPoint(point: Vector2, pout?: Vector2): Vector2;
        /**
         * The size of the Rectangle object, expressed as a Point object with the
         * values of the <code>width</code> and <code>height</code> properties.
         */
        get size(): Vector2;
    }
}
declare namespace feng3d {
    /**
     * Matrix3x3 类表示一个转换矩阵，该矩阵确定二维 (2D) 显示对象的位置和方向。
     * 该矩阵可以执行转换功能，包括平移（沿 x 和 y 轴重新定位）、旋转和缩放（调整大小）。
     * ```
     *  ---                                   ---
     *  |   scaleX      0         0    |   x轴
     *  |     0       scaleY      0    |   y轴
     *  |     tx        ty        1    |   平移
     *  ---                                   ---
     *
     *  ---                                   ---
     *  |     0         1         2    |   x轴
     *  |     3         4         5    |   y轴
     *  |     6         7         8    |   平移
     *  ---                                   ---
     * ```
     */
    class Matrix3x3 {
        /**
         * 长度为9的向量，包含所有的矩阵元素
         */
        elements: [number, number, number, number, number, number, number, number, number];
        /**
         * 构建3x3矩阵
         *
         * @param elements 九个元素的数组
         */
        constructor(elements?: [number, number, number, number, number, number, number, number, number]);
        /**
         * 设置矩阵为单位矩阵
         */
        identity(): this;
        /**
         * 将所有元素设置为0
         */
        setZero(): this;
        /**
         * 根据一个 Vector3 设置矩阵对角元素
         *
         * @param vec3
         */
        setTrace(vec3: Vector3): this;
        /**
         * 获取矩阵对角元素
         */
        getTrace(target?: Vector3): Vector3;
        /**
         * 矩阵向量乘法
         *
         * @param v 要乘以的向量
         * @param target 目标保存结果
         */
        vmult(v: Vector3, target?: Vector3): Vector3;
        /**
         * 矩阵标量乘法
         * @param s
         */
        smult(s: number): void;
        /**
         * 矩阵乘法
         * @param  m 要从左边乘的矩阵。
         */
        mmult(m: Matrix3x3, target?: Matrix3x3): Matrix3x3;
        /**
         * 缩放矩阵的每一列
         *
         * @param v
         */
        scale(v: Vector3, target?: Matrix3x3): Matrix3x3;
        /**
         * 解决Ax = b
         *
         * @param b 右手边
         * @param target 结果
         */
        solve(b: Vector3, target?: Vector3): Vector3;
        /**
         * 获取指定行列元素值
         *
         * @param row
         * @param column
         */
        getElement(row: number, column: number): number;
        /**
         * 设置指定行列元素值
         *
         * @param row
         * @param column
         * @param value
         */
        setElement(row: number, column: number, value: number): void;
        /**
         * 将另一个矩阵复制到这个矩阵对象中
         *
         * @param source
         */
        copy(source: Matrix3x3): this;
        /**
         * 返回矩阵的字符串表示形式
         */
        toString(): string;
        /**
         * 逆矩阵
         */
        reverse(): this;
        /**
         * 逆矩阵
         */
        reverseTo(target?: Matrix3x3): Matrix3x3;
        /**
         * 从四元数设置矩阵
         *
         * @param q
         */
        setRotationFromQuaternion(q: Quaternion): this;
        /**
         * 转置矩阵
         */
        transpose(): this;
        /**
         * 转置矩阵
         */
        transposeTo(target?: Matrix3x3): Matrix3x3;
        formMatrix4x4(matrix4x4: Matrix4x4): this;
        /**
         * 转换为数组
         * @param array 数组
         * @param offset 偏移
         */
        toArray(array?: number[], offset?: number): number[];
        /**
         * 转换为4x4矩阵
         *
         * @param out 4x4矩阵
         */
        toMatrix4x4(out?: Matrix4x4): Matrix4x4;
    }
}
declare namespace feng3d {
    /**
     * Matrix4x4 类表示一个转换矩阵，该矩阵确定三维 (3D) 显示对象的位置和方向。
     * 该矩阵可以执行转换功能，包括平移（沿 x、y 和 z 轴重新定位）、旋转和缩放（调整大小）。
     * Matrix4x4 类还可以执行透视投影，这会将 3D 坐标空间中的点映射到二维 (2D) 视图。
     * ```
     *  ---                                   ---
     *  |   scaleX      0         0       0     |   x轴
     *  |     0       scaleY      0       0     |   y轴
     *  |     0         0       scaleZ    0     |   z轴
     *  |     tx        ty        tz      1     |   平移
     *  ---                                   ---
     *
     *  ---                                   ---
     *  |     0         1         2        3    |   x轴
     *  |     4         5         6        7    |   y轴
     *  |     8         9         10       11   |   z轴
     *  |     12        13        14       15   |   平移
     *  ---                                   ---
     * ```
     *
     * @see https://help.adobe.com/zh_CN/FlashPlatform/reference/actionscript/3/flash/geom/Matrix3D.html
     * @see https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix4.js
     * @see https://docs.unity3d.com/ScriptReference/Matrix4x4.html
     */
    class Matrix4x4 {
        /**
         * 通过位移旋转缩放重组矩阵
         *
         * @param position 位移
         * @param rotation 旋转角度，按照指定旋转顺序旋转角度。
         * @param scale 缩放。
         * @param order 旋转顺序。
         */
        static fromTRS(position: Vector3, rotation: Vector3, scale: Vector3, order?: RotationOrder): Matrix4x4;
        /**
         * 从轴与旋转角度创建矩阵
         *
         * @param   axis            旋转轴
         * @param   degrees         角度
         */
        static fromAxisRotate(axis: Vector3, degrees: number): Matrix4x4;
        /**
         * 从欧拉角旋转角度初始化矩阵。
         *
         * @param   rx      用于沿 x 轴旋转对象的角度。
         * @param   ry      用于沿 y 轴旋转对象的角度。
         * @param   rz      用于沿 z 轴旋转对象的角度。
         * @param   order   绕轴旋转的顺序。
         */
        static fromRotation(rx: number, ry: number, rz: number, order?: RotationOrder): Matrix4x4;
        /**
         * 从四元素初始化矩阵。
         *
         * @param q 四元素
         */
        static fromQuaternion(q: Quaternion): Matrix4x4;
        /**
         * 创建缩放矩阵
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        static fromScale(xScale: number, yScale: number, zScale: number): Matrix4x4;
        /**
         * 创建位移矩阵
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        static fromPosition(x: number, y: number, z: number): Matrix4x4;
        /**
         * 一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        rawData: number[];
        /**
         * 获取位移
         *
         * @param value 用于存储位移信息的向量
         */
        getPosition(value?: Vector3): Vector3;
        /**
         * 设置位移
         *
         * @param value 位移
         */
        setPosition(value: Vector3): this;
        /**
         * 获取欧拉旋转角度。
         *
         * @param rotation 欧拉旋转角度。
         * @param order   绕轴旋转的顺序。
         */
        getRotation(rotation?: Vector3, order?: RotationOrder): Vector3;
        /**
         * 设置欧拉旋转角度。
         *
         * @param rotation 欧拉旋转角度。
         * @param order 绕轴旋转的顺序。
         */
        setRotation(rotation: Vector3, order?: RotationOrder): this;
        /**
         * 获取缩放值。
         *
         * @param scale 用于存储缩放值的向量。
         */
        getScale(scale?: Vector3): Vector3;
        /**
         * 获取缩放值。
         *
         * @param scale 缩放值。
         */
        setScale(scale: Vector3): this;
        /**
         * 一个用于确定矩阵是否可逆的数字。如果值为0则不可逆。
         */
        get determinant(): number;
        /**
         * 获取X轴向量
         *
         * @param out 保存X轴向量
         */
        getAxisX(out?: Vector3): Vector3;
        /**
         * 设置X轴向量
         *
         * @param vector X轴向量
         */
        setAxisX(vector?: Vector3): this;
        /**
         * 获取Y轴向量
         *
         * @param out 保存Y轴向量
         */
        getAxisY(out?: Vector3): Vector3;
        /**
         * 设置Y轴向量
         *
         * @param vector X轴向量
         */
        setAxisY(vector?: Vector3): this;
        /**
         * 获取Z轴向量
         *
         * @param out 保存Z轴向量
         */
        getAxisZ(out?: Vector3): Vector3;
        /**
         * 创建 Matrix4x4 对象。
         * @param   rawData    一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        constructor(rawData?: number[]);
        /**
         * 从欧拉角旋转角度初始化矩阵。
         *
         * @param   rx      用于沿 x 轴旋转对象的角度。
         * @param   ry      用于沿 y 轴旋转对象的角度。
         * @param   rz      用于沿 z 轴旋转对象的角度。
         * @param   order   绕轴旋转的顺序。
         */
        fromRotation(rx: number, ry: number, rz: number, order?: RotationOrder): this;
        /**
         * 从四元素初始化矩阵。
         *
         * @param q 四元素
         */
        fromQuaternion(q: Quaternion): this;
        /**
         * 从轴与旋转角度创建矩阵
         *
         * @param   axis            旋转轴
         * @param   degrees         角度
         */
        fromAxisRotate(axis: Vector3, degrees: number): this;
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
         * 将源 Matrix4x4 对象中的所有矩阵数据复制到调用方 Matrix4x4 对象中。
         * @param   source      要从中复制数据的 Matrix4x4 对象。
         */
        copy(source: Matrix4x4): this;
        /**
         * 从数组中初始化
         *
         * @param   array       包含矩阵数据的数组
         * @param   index       数组中的起始位置
         * @param   transpose   是否转置
         */
        fromArray(array: number[], index?: number, transpose?: boolean): this;
        /**
         * 将矩阵数据转换为数组
         *
         * @param   array       保存矩阵数据的数组
         * @param   index       数组中的起始位置
         * @param   transpose   是否转置
         */
        toArray(array?: number[] | Float32Array, index?: number, transpose?: boolean): number[] | Float32Array;
        /**
         * 通过位移旋转缩放重组矩阵
         *
         * @param position 位移
         * @param rotation 旋转角度，按照指定旋转顺序旋转角度。
         * @param scale 缩放。
         * @param order 旋转顺序。
         */
        fromTRS(position: Vector3, rotation: Vector3, scale: Vector3, order?: RotationOrder): this;
        /**
         * 把矩阵分解为位移旋转缩放。
         *
         * @param position 位移
         * @param rotation 旋转角度，按照指定旋转顺序旋转。
         * @param scale 缩放。
         * @param order 旋转顺序。
         */
        toTRS(position?: Vector3, rotation?: Vector3, scale?: Vector3, order?: RotationOrder): Vector3[];
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
        prependScale1(xScale: number, yScale: number, zScale: number): this;
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
         * 使用转换矩阵将 Vector3 对象从一个空间坐标转换到另一个空间坐标。
         * @param   vin   一个容纳要转换的坐标的 Vector3 对象。
         * @return  一个包含转换后的坐标的 Vector3 对象。
         */
        transformPoint3(vin: Vector3, vout?: Vector3): Vector3;
        /**
         * 变换Vector3向量
         *
         * 与变换点不同，并不会受到矩阵平移分量的影响。
         *
         * @param vin   被变换的向量
         * @param vout  变换后的向量
         */
        transformVector3(vin: Vector3, vout?: Vector3): Vector3;
        /**
         * 变换Vector4向量
         *
         * @param vin   被变换的向量
         * @param vout  变换后的向量
         */
        transformVector4(vin: Vector4, vout?: Vector4): Vector4;
        /**
         * 变换坐标数组数据
         *
         * @param   vin     被变换坐标数组数据
         * @param   vout    变换后的坐标数组数据
         */
        transformPoints(vin: number[], vout?: number[]): number[];
        /**
         * 变换旋转角度
         *
         * @param vin   被变换的旋转角度
         * @param vout  变换后的旋转角度
         */
        transformRotation(vin: Vector3, vout?: Vector3): Vector3;
        /**
         * 使用转换矩阵将 Ray3 对象从一个空间坐标转换到另一个空间坐标。
         *
         * @param inRay 被转换的Ray3。
         * @param outRay 转换后的Ray3。
         * @returns 转换后的Ray3。
         */
        transformRay(inRay: Ray3, outRay?: Ray3): Ray3;
        /**
         * 将当前 Matrix4x4 对象转换为一个矩阵，并将互换其中的行和列。
         */
        transpose(): this;
        /**
         * 比较矩阵是否相等
         */
        equals(matrix: Matrix4x4, precision?: number): boolean;
        /**
         * 看向目标位置
         * @param target    目标位置
         * @param upAxis    向上朝向
         */
        lookAt(target: Vector3, upAxis?: Vector3): this;
        /**
         * 获取XYZ轴中最大缩放值
         */
        getMaxScaleOnAxis(): number;
        /**
         * 初始化正射投影矩阵
         * @param left 可视空间左边界
         * @param right 可视空间右边界
         * @param top 可视空间上边界
         * @param bottom 可视空间下边界
         * @param near 可视空间近边界
         * @param far 可视空间远边界
         *
         * 可视空间的八个顶点分别被投影到立方体 [(-1, -1, -1), (1, 1, 1)] 八个顶点上
         *
         * 将长方体 [(left, bottom, near), (right, top, far)] 投影至立方体 [(-1, -1, -1), (1, 1, 1)] 中
         */
        setOrtho(left: number, right: number, top: number, bottom: number, near: number, far: number): this;
        /**
         * 初始化透视投影矩阵
         * @param fov 垂直视角，视锥体顶面和底面间的夹角，必须大于0 （角度）
         * @param aspect 近裁剪面的宽高比
         * @param near 视锥体近边界
         * @param far 视锥体远边界
         *
         * 视锥体的八个顶点分别被投影到立方体 [(-1, -1, -1), (1, 1, 1)] 八个顶点上
         */
        setPerspectiveFromFOV(fov: number, aspect: number, near: number, far: number): this;
        /**
         * 初始化透视投影矩阵
         * @param left 可视空间左边界
         * @param right 可视空间右边界
         * @param top 可视空间上边界
         * @param bottom 可视空间下边界
         * @param near 可视空间近边界
         * @param far 可视空间远边界
         *
         * 可视空间的八个顶点分别被投影到立方体 [(-1, -1, -1), (1, 1, 1)] 八个顶点上
         *
         * 将长方体 [(left, bottom, near), (right, top, far)] 投影至立方体 [(-1, -1, -1), (1, 1, 1)] 中
         */
        setPerspective(left: number, right: number, top: number, bottom: number, near: number, far: number): this;
        /**
         * 转换为3x3矩阵
         *
         * @param out 3x3矩阵
         */
        toMatrix3x3(out?: Matrix3x3): Matrix3x3;
        /**
         * 以字符串返回矩阵的值
         */
        toString(): string;
    }
}
declare namespace feng3d {
    /**
     * 可用于表示旋转的四元数对象
     */
    class Quaternion {
        static fromArray(array: ArrayLike<number>, offset?: number): Quaternion;
        /**
         * 随机四元数
         */
        static random(): Quaternion;
        /**
         * 虚基向量i的乘子
         */
        x: number;
        /**
         * 虚基向量j的乘子
         */
        y: number;
        /**
         * 虚基向量k的乘子
         */
        z: number;
        /**
         * 实部的乘数
         */
        w: number;
        /**
         * 四元数描述三维空间中的旋转。四元数的数学定义为Q = x*i + y*j + z*k + w，其中(i,j,k)为虚基向量。(x,y,z)可以看作是一个与旋转轴相关的向量，而实际的乘法器w与旋转量相关。
         *
         * @param x 虚基向量i的乘子
         * @param y 虚基向量j的乘子
         * @param z 虚基向量k的乘子
         * @param w 实部的乘数
         */
        constructor(x?: number, y?: number, z?: number, w?: number);
        /**
         * 返回四元数对象的大小
         */
        get magnitude(): number;
        /**
         * 设置四元数的值。
         *
         * @param x 虚基向量i的乘子
         * @param y 虚基向量j的乘子
         * @param z 虚基向量k的乘子
         * @param w 实部的乘数
         */
        set(x?: number, y?: number, z?: number, w?: number): this;
        fromArray(array: ArrayLike<number>, offset?: number): this;
        /**
         * 转换为数组
         *
         * @param array
         * @param offset
         */
        toArray(array?: number[], offset?: number): number[];
        /**
         * 四元数乘法
         *
         * @param q
         * @param this
         */
        mult(q: Quaternion): this;
        /**
         * 四元数乘法
         *
         * @param q
         * @param target
         */
        multTo(q: Quaternion, target?: Quaternion): Quaternion;
        /**
         * 获取逆四元数（共轭四元数）
         */
        inverse(): this;
        /**
         * 获取逆四元数（共轭四元数）
         *
         * @param target
         */
        inverseTo(target?: Quaternion): Quaternion;
        multiplyVector(vector: Vector3, target?: Quaternion): Quaternion;
        /**
         * 用表示给定绕向量旋转的值填充四元数对象。
         *
         * @param axis 要绕其旋转的轴
         * @param angle 以弧度为单位的旋转角度。
         */
        fromAxisAngle(axis: Vector3, angle: number): this;
        /**
         * 将四元数转换为轴/角表示形式
         *
         * @param targetAxis 要重用的向量对象，用于存储轴
         * @return 一个数组，第一个元素是轴，第二个元素是弧度
         */
        toAxisAngle(targetAxis?: Vector3): (number | Vector3)[];
        /**
         * 给定两个向量，设置四元数值。得到的旋转将是将u旋转到v所需要的旋转。
         *
         * @param u
         * @param v
         */
        setFromVectors(u: Vector3, v: Vector3): this;
        /**
         * 与目标四元数之间进行球面内插，提供了具有恒定角度变化率的旋转之间的内插。
         * @param qb 目标四元素
         * @param t 插值权值，一个介于0和1之间的值。
         */
        slerp(qb: Quaternion, t: number): this;
        /**
         * 与目标四元数之间进行球面内插，提供了具有恒定角度变化率的旋转之间的内插。
         * @param qb 目标四元素
         * @param t 插值权值，一个介于0和1之间的值。
         * @param out 保存插值结果
         */
        slerpTo(qb: Quaternion, t: number, out?: Quaternion): Quaternion;
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
        fromEulerAngles(ax: number, ay: number, az: number): this;
        /**
         * Fills a target Vector3 object with the Euler angles that form the rotation represented by this quaternion.
         * @param target An optional Vector3 object to contain the Euler angles. If not provided, a new object is created.
         * @return The Vector3 containing the Euler angles.
         */
        toEulerAngles(target?: Vector3): Vector3;
        /**
         * 四元数归一化
         */
        normalize(val?: number): this;
        /**
         * 四元数归一化的近似。当quat已经几乎标准化时，效果最好。
         *
         * @see http://jsperf.com/fast-quaternion-normalization
         * @author unphased, https://github.com/unphased
         */
        normalizeFast(): this;
        /**
         * 转换为可读格式
         */
        toString(): string;
        /**
         * 转换为矩阵
         *
         * @param target
         */
        toMatrix(target?: Matrix4x4): Matrix4x4;
        /**
         * 从矩阵初始化四元素
         *
         * @param matrix 矩阵
         */
        fromMatrix(matrix: Matrix4x4): this;
        /**
         * 克隆
         */
        clone(): Quaternion;
        /**
         * 旋转一个顶点
         *
         * @param point 被旋转的顶点
         * @param target 旋转结果
         */
        rotatePoint(point: Vector3, target?: Vector3): Vector3;
        /**
         * 旋转一个绝对方向四元数给定一个角速度和一个时间步长
         *
         * @param angularVelocity
         * @param dt
         * @param angularFactor
         */
        integrate(angularVelocity: Vector3, dt: number, angularFactor: Vector3): this;
        /**
         * 旋转一个绝对方向四元数给定一个角速度和一个时间步长
         *
         * @param angularVelocity
         * @param dt
         * @param angularFactor
         * @param  target
         */
        integrateTo(angularVelocity: Vector3, dt: number, angularFactor: Vector3, target?: Quaternion): Quaternion;
        /**
         * 将源的值复制到此四元数
         *
         * @param q 要复制的四元数
         */
        copy(q: Quaternion): this;
        /**
         * Multiply the quaternion by a vector
         * @param v
         * @param target Optional
         */
        vmult(v: Vector3, target?: Vector3): Vector3;
        /**
         * Convert the quaternion to euler angle representation. Order: YZX, as this page describes: http://www.euclideanspace.com/maths/standards/index.htm
         * @param target
         * @param order Three-character string e.g. "YZX", which also is default.
         */
        toEuler(target: Vector3, order?: string): void;
        /**
         * See http://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/content/SpinCalc.m
         * @param x
         * @param y
         * @param z
         * @param order The order to apply angles: 'XYZ' or 'YXZ' or any other combination
         */
        setFromEuler(x: number, y: number, z: number, order?: string): this;
    }
}
declare namespace feng3d {
    /**
     * 3d直线
     */
    class Line3 {
        /**
         * 根据直线上两点初始化直线
         * @param p0 Vector3
         * @param p1 Vector3
         */
        static fromPoints(p0: Vector3, p1: Vector3): Line3;
        /**
         * 根据直线某点与方向初始化直线
         * @param position 直线上某点
         * @param direction 直线的方向
         */
        static fromPosAndDir(position: Vector3, direction: Vector3): Line3;
        /**
         * 随机直线，比如用于单元测试
         */
        static random(): Line3;
        /**
         * 直线上某一点
         */
        origin: Vector3;
        /**
         * 直线方向(已标准化)
         */
        direction: Vector3;
        /**
         * 根据直线某点与方向创建直线
         * @param origin 直线上某点
         * @param direction 直线的方向
         */
        constructor(origin?: Vector3, direction?: Vector3);
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
        getPlane(plane?: Plane): Plane;
        /**
         * 获取直线上的一个点
         * @param length 与原点距离
         */
        getPoint(length?: number, vout?: Vector3): Vector3;
        /**
         * 获取指定z值的点
         * @param z z值
         * @param vout 目标点（输出）
         * @returns 目标点
         */
        getPointWithZ(z: number, vout?: Vector3): Vector3;
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
        intersectWithLine3D(line3D: Line3): Vector3 | Line3;
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
        equals(line: Line3, precision?: number): boolean;
        /**
         * 拷贝
         * @param line 直线
         */
        copy(line: Line3): this;
        /**
         * 克隆
         */
        clone(): Line3;
    }
}
declare namespace feng3d {
    /**
     * 3D线段
     */
    class Segment3 {
        /**
         * 初始化线段
         * @param p0
         * @param p1
         */
        static fromPoints(p0: Vector3, p1: Vector3): Segment3;
        /**
         * 随机线段
         */
        static random(): Segment3;
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
         * 线段长度
         */
        getLength(): number;
        /**
         * 线段长度的平方
         */
        getLengthSquared(): number;
        /**
         * 获取线段所在直线
         */
        getLine(line?: Line3): Line3;
        /**
         * 获取指定位置上的点，当position=0时返回p0，当position=1时返回p1
         * @param position 线段上的位置
         */
        getPoint(position: number, pout?: Vector3): Vector3;
        /**
         * 判定点是否在线段上
         * @param point
         */
        onWithPoint(point: Vector3, precision?: number): boolean;
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
        getPointDistanceSquare(point: Vector3): number;
        /**
         * 指定点到该线段距离，如果投影点不在线段上时，该距离为指定点到最近的线段端点的距离
         * @param point 指定点
         */
        getPointDistance(point: Vector3): number;
        /**
         * 与直线相交
         * @param line 直线
         */
        intersectionWithLine(line: Line3): Vector3 | Segment3;
        /**
         * 与线段相交
         * @param segment 直线
         */
        intersectionWithSegment(segment: Segment3): Vector3 | Segment3;
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
        equals(segment: Segment3): boolean;
        /**
         * 复制
         */
        copy(segment: Segment3): this;
        /**
         * 克隆
         */
        clone(): Segment3;
    }
}
declare namespace feng3d {
    /**
     * 3D射线
     */
    class Ray3 extends Line3 {
        constructor(origin?: Vector3, direction?: Vector3);
    }
}
declare namespace feng3d {
    /**
     * 三角形
     */
    class Triangle3 {
        /**
         * 通过3顶点定义一个三角形
         * @param p0		点0
         * @param p1		点1
         * @param p2		点2
         */
        static fromPoints(p0: Vector3, p1: Vector3, p2: Vector3): Triangle3;
        /**
         * 从顶点数据初始化三角形
         * @param positions 顶点数据
         */
        static fromPositions(positions: number[]): Triangle3;
        /**
         * 随机三角形
         * @param size 尺寸
         */
        static random(size?: number): Triangle3;
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
        /**
         * 构造三角形
         *
         * @param p0 三角形0号点
         * @param p1 三角形1号点
         * @param p2 三角形2号点
         */
        constructor(p0?: Vector3, p1?: Vector3, p2?: Vector3);
        /**
         * 三角形三个点
         */
        getPoints(): Vector3[];
        /**
         * 三边
         */
        getSegments(): Segment3[];
        /**
         * 三角形所在平面
         */
        getPlane3d(pout?: Plane): Plane;
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
         * 内心，内切圆心,三角形内心为三角形三条内角平分线的交点。
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
         * 从顶点数据初始化三角形
         * @param positions 顶点数据
         */
        fromPositions(positions: number[]): this;
        /**
         * 获取三角形内的点
         * @param p 三点的权重（重心坐标系坐标）
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
        intersectionWithLine(line: Line3): Vector3 | Segment3;
        /**
         * 获取与线段相交
         */
        intersectionWithSegment(segment: Segment3): Vector3 | Segment3;
        /**
         * 判定点是否在三角形上
         * @param p 点
         * @param precision 精度，如果距离小于精度则判定为在三角形上
         */
        onWithPoint(p: Vector3, precision?: number): boolean;
        /**
         * 求给出点的重心坐标系坐标
         *
         * @param p 点
         * @param bp 用于接收重心坐标系坐标
         *
         * @returns 重心坐标系坐标
         *
         * @see 3D数学基础：图形与游戏开发 P252 P249
         */
        getBarycentricCoordinates(p: Vector3, bp?: Vector3): Vector3;
        /**
         * 获取指定点分别占三个点的混合值
         */
        blendWithPoint(p: Vector3): Vector3;
        /**
         * 是否与盒子相交
         */
        intersectsBox(box: Box3): boolean;
        /**
         * 与指定点最近的点
         * @param point 点
         * @param vout 输出点
         */
        closestPointWithPoint(point: Vector3, vout?: Vector3): Vector3;
        /**
         * 与点最近距离
         * @param point 点
         */
        distanceWithPoint(point: Vector3): number;
        /**
         * 与点最近距离平方
         * @param point 点
         */
        distanceSquaredWithPoint(point: Vector3): number;
        /**
         * 用点分解（切割）三角形
         */
        decomposeWithPoint(p: Vector3): Triangle3[];
        /**
         * 用点分解（切割）三角形
         */
        decomposeWithPoints(ps: Vector3[]): Triangle3[];
        /**
         * 用线段分解（切割）三角形
         * @param segment 线段
         */
        decomposeWithSegment(segment: Segment3): Triangle3[];
        /**
         * 用直线分解（切割）三角形
         * @param line 直线
         */
        decomposeWithLine(line: Line3): Triangle3[];
        /**
         * 面积
         */
        area(): number;
        /**
         * 栅格化，点阵化为XYZ轴间距为1的点阵
         */
        rasterize(): number[];
        /**
         * 平移
         * @param v 向量
         */
        translateVector3(v: Vector3): this;
        /**
         * 缩放
         * @param v 缩放量
         */
        scaleVector3(v: Vector3): this;
        /**
         * 自定义栅格化为点阵
         * @param voxelSize 体素尺寸，点阵XYZ轴间距
         * @param origin 原点，点阵中的某点正处于原点上，因此可以用作体素范围内的偏移
         */
        rasterizeCustom(voxelSize?: Vector3, origin?: Vector3): {
            xi: number;
            yi: number;
            zi: number;
            xv: number;
            yv: number;
            zv: number;
        }[];
        /**
         * 复制
         * @param triangle 三角形
         */
        copy(triangle: Triangle3): this;
        /**
         * 克隆
         */
        clone(): Triangle3;
        /**
         * 判断指定点是否在三角形内
         *
         * @param p0 三角形0号点
         * @param p1 三角形1号点
         * @param p2 三角形2号点
         * @param p 指定点
         */
        static containsPoint(p0: Vector3, p1: Vector3, p2: Vector3, p: Vector3): boolean;
    }
}
declare namespace feng3d {
    /**
     * 轴向对称包围盒
     */
    class Box3 {
        /**
         * 从一组顶点初始化包围盒
         * @param positions 坐标数据列表
         */
        static formPositions(positions: number[]): Box3;
        /**
         * 从一组点初始化包围盒
         * @param ps 点列表
         */
        static fromPoints(ps: Vector3[]): Box3;
        /**
         * 随机包围盒
         */
        static random(): Box3;
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
         * 创建包围盒
         * @param min 最小点
         * @param max 最大点
         */
        constructor(min?: Vector3, max?: Vector3);
        /**
         * 初始化包围盒
         * @param min 最小值
         * @param max 最大值
         */
        init(min: Vector3, max: Vector3): this;
        /**
         * 缩放包围盒
         *
         * @param s 缩放系数
         */
        scale(s: Vector3): this;
        /**
         * 转换为包围盒八个角所在点列表
         */
        toPoints(points?: Vector3[]): Vector3[];
        /**
         * 从一组顶点初始化包围盒
         * @param positions 坐标数据列表
         */
        formPositions(positions: number[]): this;
        /**
         * 从一组点初始化包围盒
         * @param ps 点列表
         */
        fromPoints(ps: Vector3[]): this;
        /**
         * 包围盒内随机点
         */
        randomPoint(pout?: Vector3): Vector3;
        /**
         * 使用点扩张包围盒
         * @param point 点
         */
        expandByPoint(point: Vector3): this;
        /**
         * 应用矩阵
         * @param mat 矩阵
         *
         * @todo 优化
         * @see 3D数学基础：图形与游戏开发 P288 AABB::setToTransformedBox
         */
        applyMatrix(mat: Matrix4x4): this;
        /**
         * 应用矩阵
         * @param mat 矩阵
         */
        applyMatrixTo(mat: Matrix4x4, out?: Box3): Box3;
        /**
         *
         */
        clone(): Box3;
        /**
         * 是否包含指定点
         * @param p 点
         */
        containsPoint(p: Vector3): boolean;
        /**
         * 是否包含包围盒
         * @param aabb 包围盒
         */
        contains(aabb: Box3): boolean;
        /**
         * 拷贝
         * @param aabb 包围盒
         */
        copy(aabb: Box3): this;
        /**
         * 比较包围盒是否相等
         * @param aabb 包围盒
         */
        equals(aabb: Box3): boolean;
        /**
         * 平移
         *
         * @param offset 偏移量
         */
        translate(offset: Vector3): this;
        /**
         * 膨胀包围盒
         * @param dx x方向膨胀量
         * @param dy y方向膨胀量
         * @param dz z方向膨胀量
         */
        inflate(dx: number, dy: number, dz: number): void;
        /**
         * 膨胀包围盒
         * @param delta 膨胀量
         */
        inflatePoint(delta: Vector3): void;
        /**
         * 与包围盒相交
         * @param aabb 包围盒
         */
        intersection(aabb: Box3): this;
        /**
         * 与包围盒相交
         * @param aabb 包围盒
         */
        intersectionTo(aabb: Box3, out?: Box3): Box3;
        /**
         * 包围盒是否相交
         * @param aabb 包围盒
         */
        intersects(aabb: Box3): boolean;
        /**
         * 与射线相交
         * @param position 射线起点
         * @param direction 射线方向
         * @param targetNormal 相交处法线
         * @return 起点到包围盒距离
         *
         * @todo 可用以下方法优化？
         * @see 3D数学基础：图形与游戏开发 P290
         */
        rayIntersection(position: Vector3, direction: Vector3, targetNormal?: Vector3): number;
        /**
         * 获取包围盒上距离指定点最近的点
         *
         * @param point 指定点
         * @param target 存储最近的点
         */
        closestPointToPoint(point: Vector3, target?: Vector3): Vector3;
        /**
         * 清空包围盒
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
         * 联合包围盒
         * @param aabb 包围盒
         */
        union(aabb: Box3): this;
        /**
         * 是否与球相交
         * @param sphere 球
         */
        intersectsSphere(sphere: Sphere): boolean;
        /**
         * 夹紧？
         *
         * @param point 点
         * @param out 输出点
         */
        clampPoint(point: Vector3, out?: Vector3): Vector3;
        /**
         * 是否与平面相交
         * @param plane 平面
         */
        intersectsPlane(plane: Plane): boolean;
        /**
         * 是否与三角形相交
         * @param triangle 三角形
         */
        intersectsTriangle(triangle: Triangle3): boolean;
        /**
        * 是否与指定长方体相交
        *
        * @param box3 长方体
        */
        overlaps(box3: Box3): boolean;
        /**
         * 转换为三角形列表
         */
        toTriangles(triangles?: Triangle3[]): Triangle3[];
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
        intersectsBox(box: Box3): boolean;
        /**
         * 是否与平面相交
         * @param plane 平面
         */
        intersectsPlane(plane: Plane): boolean;
        /**
         *
         * @param point 点
         * @param pout 输出点
         */
        clampPoint(point: Vector3, pout?: Vector3): Vector3;
        /**
         * 获取包围盒
         */
        getBoundingBox(box?: Box3): Box3;
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
     * 平面
     *
     * ax+by+cz+d=0
     */
    class Plane {
        /**
         * 通过3顶点定义一个平面
         * @param p0		点0
         * @param p1		点1
         * @param p2		点2
         */
        static fromPoints(p0: Vector3, p1: Vector3, p2: Vector3): Plane;
        /**
         * 根据法线与点定义平面
         * @param normal		平面法线
         * @param point			平面上任意一点
         */
        static fromNormalAndPoint(normal: Vector3, point: Vector3): Plane;
        /**
         * 随机平面
         */
        static random(): Plane;
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
         * 设置
         *
         * @param a		A系数
         * @param b		B系数
         * @param c		C系数
         * @param d		D系数
         */
        set(a: number, b: number, c: number, d: number): this;
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
        onWithPoint(p: Vector3, precision?: number): boolean;
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
        parallelWithLine3D(line3D: Line3, precision?: number): boolean;
        /**
         * 判定与平面是否平行
         * @param plane3D
         */
        parallelWithPlane3D(plane3D: Plane, precision?: number): boolean;
        /**
         * 获取与直线交点
         *
         * @see 3D数学基础：图形与游戏开发 P269
         */
        intersectWithLine3(line: Line3): Vector3 | Line3;
        /**
         * 获取与平面相交直线
         * @param plane3D
         */
        intersectWithPlane3D(plane3D: Plane): Line3;
        /**
         * 标准化
         */
        normalize(): this;
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
         * 与其他两平面相交于一点
         *
         * @param plane0
         * @param plane1
         *
         * @see 3D数学基础：图形与游戏开发 P271
         */
        intersectWithTwoPlane3D(plane0: Plane, plane1: Plane): Vector3;
        /**
         * 与指定平面是否相等
         *
         * @param plane
         * @param precision
         */
        equals(plane: Plane, precision?: number): boolean;
        /**
         * 复制
         */
        copy(plane: Plane): this;
        /**
         * 克隆
         */
        clone(): Plane;
        /**
         * 输出字符串
         */
        toString(): string;
    }
}
declare namespace feng3d {
    /**
     * 截头锥体
     *
     * Frustums are used to determine what is inside the camera's field of view. They help speed up the rendering process.
     *
     * Frustums用于确定摄像机的视场范围。它们有助于加速渲染过程。
     *
     * @author mrdoob / http://mrdoob.com/
     * @author alteredq / http://alteredqualia.com/
     * @author bhouston / http://clara.io
     */
    class Frustum {
        planes: Plane[];
        /**
         * 初始化截头锥体
         *
         * @param p0
         * @param p1
         * @param p2
         * @param p3
         * @param p4
         * @param p5
         */
        constructor(p0?: Plane, p1?: Plane, p2?: Plane, p3?: Plane, p4?: Plane, p5?: Plane);
        set(p0: Plane, p1: Plane, p2: Plane, p3: Plane, p4: Plane, p5: Plane): this;
        clone(): Frustum;
        copy(frustum: Frustum): this;
        /**
         * 从矩阵初始化
         *
         * @param m 矩阵
         */
        fromMatrix(m: Matrix4x4): this;
        /**
         * 是否与球体相交
         *
         * @param sphere 球体
         */
        intersectsSphere(sphere: Sphere): boolean;
        /**
         * 是否与长方体相交
         *
         * @param box 长方体
         */
        intersectsBox(box: Box3): boolean;
        /**
         * 与点是否相交
         *
         * @param point
         */
        containsPoint(point: Vector3, precision?: number): boolean;
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
        static fromBox(box: Box3): TriangleGeometry;
        triangles: Triangle3[];
        constructor(triangles?: Triangle3[]);
        /**
         * 从盒子初始化
         * @param box 盒子
         */
        fromBox(box: Box3): this;
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
        getBox(box?: Box3): Box3;
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
        classifySegment(segment: Segment3): 1 | 0 | -1 | 2;
        /**
         * 给指定三角形分类
         * @param triangle 三角形
         * @return 三角形相对于几何体位置；0:在几何体表面上，1：在几何体外，-1：在几何体内
         */
        classifyTriangle(triangle: Triangle3): void;
        /**
         * 与直线碰撞
         * @param line3d 直线
         */
        intersectionWithLine(line3d: Line3): {
            segments: Segment3[];
            points: Vector3[];
        };
        /**
         * 与线段相交
         * @param segment 线段
         * @return 不相交时返回null，相交时返回 碰撞线段列表与碰撞点列表
         */
        intersectionWithSegment(segment: Segment3): {
            segments: Segment3[];
            points: Vector3[];
        };
        /**
         * 分解三角形
         * @param triangle 三角形
         */
        decomposeTriangle(triangle: Triangle3): void;
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
    /**
     * 渐变模式
     */
    enum GradientMode {
        /**
         * 混合
         */
        Blend = 0,
        /**
         * 阶梯
         */
        Fixed = 1
    }
}
declare namespace feng3d {
    /**
     * 渐变透明键
     */
    interface GradientAlphaKey {
        /**
         * 透明值
         */
        alpha: number;
        /**
         * 时间
         */
        time: number;
    }
}
declare namespace feng3d {
    /**
     * 渐变颜色键
     */
    interface GradientColorKey {
        /**
         * 颜色值
         */
        color: Color3;
        /**
         * 时间
         */
        time: number;
    }
}
declare namespace feng3d {
    /**
     * 颜色渐变
     */
    class Gradient {
        __class__: "feng3d.Gradient";
        /**
         * 渐变模式
         */
        mode: GradientMode;
        /**
         * 在渐变中定义的所有alpha键。
         *
         * 注： 该值已对时间排序，否则赋值前请使用 sort((a, b) => a.time - b.time) 进行排序
         */
        alphaKeys: GradientAlphaKey[];
        /**
         * 在渐变中定义的所有color键。
         *
         * 注： 该值已对时间排序，否则赋值前请使用 sort((a, b) => a.time - b.time) 进行排序
         */
        colorKeys: GradientColorKey[];
        /**
         * 从颜色列表初始化
         * @param colors 颜色列表
         * @param times
         */
        fromColors(colors: number[], times?: number[]): this;
        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number): Color4;
        /**
         * 获取透明度
         * @param time 时间
         */
        getAlpha(time: number): number;
        /**
         * 获取透明度
         * @param time 时间
         */
        getColor(time: number): Color3;
    }
}
declare namespace feng3d {
    /**
     * 最大最小颜色渐变模式
     */
    enum MinMaxGradientMode {
        /**
         * Use a single color for the MinMaxGradient.
         *
         * 使用单一颜色的。
         */
        Color = 0,
        /**
         * Use a single color gradient for the MinMaxGradient.
         *
         * 使用单一颜色渐变。
         */
        Gradient = 1,
        /**
         * Use a random value between 2 colors for the MinMaxGradient.
         *
         * 在两种颜色之间使用一个随机值。
         */
        TwoColors = 2,
        /**
         * Use a random value between 2 color gradients for the MinMaxGradient.
         *
         * 在两个颜色梯度之间使用一个随机值。
         */
        TwoGradients = 3,
        /**
         * Define a list of colors in the MinMaxGradient, to be chosen from at random.
         *
         * 在一个颜色列表中随机选择。
         */
        RandomColor = 4
    }
}
declare namespace feng3d {
    /**
     * 最大最小颜色渐变
     */
    class MinMaxGradient {
        __class__: "feng3d.MinMaxGradient";
        /**
         * Set the mode that the min-max gradient will use to evaluate colors.
         *
         * 设置最小-最大梯度将用于评估颜色的模式。
         */
        mode: MinMaxGradientMode;
        /**
         * Set a constant color.
         *
         * 常量颜色值
         */
        color: Color4;
        /**
         * Set a constant color for the lower bound.
         *
         * 为下界设置一个常量颜色。
         */
        colorMin: Color4;
        /**
         * Set a constant color for the upper bound.
         *
         * 为上界设置一个常量颜色。
         */
        colorMax: Color4;
        /**
         * Set the gradient.
         *
         * 设置渐变。
         */
        gradient: Gradient;
        /**
         * Set a gradient for the lower bound.
         *
         * 为下界设置一个渐变。
         */
        gradientMin: Gradient;
        /**
         * Set a gradient for the upper bound.
         *
         * 为上界设置一个渐变。
         */
        gradientMax: Gradient;
        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number, randomBetween?: number): Color4;
    }
}
declare namespace feng3d {
    /**
     * Bézier曲线
     */
    var bezierCurve: BezierCurve;
    /**
     * Bézier曲线
     * @see https://en.wikipedia.org/wiki/B%C3%A9zier_curve
     * @author feng / http://feng3d.com 03/06/2018
     */
    class BezierCurve {
        /**
         * 线性Bézier曲线
         * 给定不同的点P0和P1，线性Bézier曲线就是这两个点之间的直线。曲线由下式给出
         * ```
         * B(t) = p0 + t * (p1 - p0) = (1 - t) * p0 + t * p1 , 0 <= t && t <= 1
         * ```
         * 相当于线性插值
         *
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         */
        linear(t: number, p0: number, p1: number): number;
        /**
         * 线性Bézier曲线关于t的导数
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         */
        linearDerivative(t: number, p0: number, p1: number): number;
        /**
         * 线性Bézier曲线关于t的二阶导数
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         */
        linearSecondDerivative(t: number, p0: number, p1: number): number;
        /**
         * 二次Bézier曲线
         *
         * 二次Bézier曲线是由函数B（t）跟踪的路径，给定点P0，P1和P2，
         * ```
         * B(t) = (1 - t) * ((1 - t) * p0 + t * p1) + t * ((1 - t) * p1 + t * p2) , 0 <= t && t <= 1
         * ```
         * 这可以解释为分别从P0到P1和从P1到P2的线性Bézier曲线上相应点的线性插值。重新排列前面的等式得出：
         * ```
         * B(t) = (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2 , 0 <= t && t <= 1
         * ```
         * Bézier曲线关于t的导数是
         * ```
         * B'(t) = 2 * (1 - t) * (p1 - p0) + 2 * t * (p2 - p1)
         * ```
         * 从中可以得出结论：在P0和P2处曲线的切线在P 1处相交。随着t从0增加到1，曲线沿P1的方向从P0偏离，然后从P1的方向弯曲到P2。
         *
         * Bézier曲线关于t的二阶导数是
         * ```
         * B''(t) = 2 * (p2 - 2 * p1 + p0)
         * ```
         *
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         * @param p2 点2
         */
        quadratic(t: number, p0: number, p1: number, p2: number): number;
        /**
         * 二次Bézier曲线关于t的导数
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         * @param p2 点2
         */
        quadraticDerivative(t: number, p0: number, p1: number, p2: number): number;
        /**
         * 二次Bézier曲线关于t的二阶导数
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         * @param p2 点2
         */
        quadraticSecondDerivative(t: number, p0: number, p1: number, p2: number): number;
        /**
         * 立方Bézier曲线
         *
         * 平面中或高维空间中（其实一维也是成立的，这里就是使用一维计算）的四个点P0，P1，P2和P3定义了三次Bézier曲线。
         * 曲线开始于P0朝向P1并且从P2的方向到达P3。通常不会通过P1或P2; 这些点只是为了提供方向信息。
         * P1和P2之间的距离在转向P2之前确定曲线向P1移动的“多远”和“多快” 。
         *
         * 对于由点Pi，Pj和Pk定义的二次Bézier曲线，可以将Bpipjpk(t)写成三次Bézier曲线，它可以定义为两条二次Bézier曲线的仿射组合：
         * ```
         * B(t) = (1 - t) * Bp0p1p2(t) + t * Bp1p2p3(t) , 0 <= t && t <= 1
         * ```
         * 曲线的显式形式是：
         * ```
         * B(t) = (1 - t) * (1 - t) * (1 - t) * p0 + 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t * p3 , 0 <= t && t <= 1
         * ```
         * 对于P1和P2的一些选择，曲线可以相交，或者包含尖点。
         *
         * 三次Bézier曲线相对于t的导数是
         * ```
         * B'(t) = 3 * (1 - t) * (1 - t) * (p1 - p0) + 6 * (1 - t) * t * (p2 - p1) + 3 * t * t * (p3 - p2);
         * ```
         * 三次Bézier曲线关于t的二阶导数是
         * ```
         * 6 * (1 - t) * (p2 - 2 * p1 + p0) + 6 * t * (p3 - 2 * p2 + p1);
         * ```
         *
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         * @param p2 点2
         * @param p3 点3
         */
        cubic(t: number, p0: number, p1: number, p2: number, p3: number): number;
        /**
         * 三次Bézier曲线关于t的导数
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         * @param p2 点2
         * @param p3 点3
         */
        cubicDerivative(t: number, p0: number, p1: number, p2: number, p3: number): number;
        /**
         * 三次Bézier曲线关于t的二阶导数
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         * @param p2 点2
         */
        cubicSecondDerivative(t: number, p0: number, p1: number, p2: number, p3: number): number;
        /**
         * n次Bézier曲线
         *
         * 一般定义
         *
         * Bézier曲线可以定义为任意度n。
         *
         * @param t 插值度
         * @param ps 点列表 ps.length == n+1
         * @param processs 收集中间过程数据，可用作Bézier曲线动画数据
         */
        bn(t: number, ps: number[], processs?: number[][]): number;
        /**
         * n次Bézier曲线关于t的导数
         *
         * 一般定义
         *
         * Bézier曲线可以定义为任意度n。
         *
         * @param t 插值度
         * @param ps 点列表 ps.length == n+1
         */
        bnDerivative(t: number, ps: number[]): number;
        /**
         * n次Bézier曲线关于t的二阶导数
         *
         * 一般定义
         *
         * Bézier曲线可以定义为任意度n。
         *
         * @param t 插值度
         * @param ps 点列表 ps.length == n+1
         */
        bnSecondDerivative(t: number, ps: number[]): number;
        /**
         * n次Bézier曲线关于t的dn阶导数
         *
         * Bézier曲线可以定义为任意度n。
         *
         * @param t 插值度
         * @param dn 求导次数
         * @param ps 点列表     ps.length == n+1
         */
        bnND(t: number, dn: number, ps: number[]): number;
        /**
         * 获取曲线在指定插值度上的值
         * @param t 插值度
         * @param ps 点列表
         */
        getValue(t: number, ps: number[]): number;
        /**
         * 获取曲线在指定插值度上的导数(斜率)
         * @param t 插值度
         * @param ps 点列表
         */
        getDerivative(t: number, ps: number[]): number;
        /**
         * 获取曲线在指定插值度上的二阶导数
         * @param t 插值度
         * @param ps 点列表
         */
        getSecondDerivative(t: number, ps: number[]): number;
        /**
         * 查找区间内极值列表
         *
         * @param ps 点列表
         * @param numSamples 采样次数，用于分段查找极值
         * @param precision  查找精度
         *
         * @returns 极值列表 {} {ts: 极值插值度列表,vs: 极值值列表}
         */
        getExtremums(ps: number[], numSamples?: number, precision?: number): {
            ts: number[];
            vs: number[];
        };
        /**
         * 获取单调区间列表
         *
         * @param ps
         * @param numSamples
         * @param precision
         * @returns ts: 区间结点插值度列表,vs: 区间结点值列表
         */
        getMonotoneIntervals(ps: number[], numSamples?: number, precision?: number): {
            ts: number[];
            vs: number[];
        };
        /**
         * 获取目标值所在的插值度T
         *
         * @param targetV 目标值
         * @param ps 点列表
         * @param numSamples 分段数量，用于分段查找，用于解决寻找多个解、是否无解等问题；过少的分段可能会造成找不到存在的解决，过多的分段将会造成性能很差。
         * @param precision  查找精度
         *
         * @returns 返回解数组
         */
        getTFromValue(targetV: number, ps: number[], numSamples?: number, precision?: number): number[];
        /**
         * 分割曲线
         *
         * 在曲线插值度t位置分割为两条连接起来与原曲线完全重合的曲线
         *
         * @param t 分割位置（插值度）
         * @param ps 被分割曲线点列表
         * @returns 返回两条曲线组成的数组
         */
        split(t: number, ps: number[]): number[][];
        /**
         * 合并曲线
         *
         * 合并两条连接的曲线为一条曲线并且可以还原为分割前的曲线
         *
         * @param fps 第一条曲线点列表
         * @param sps 第二条曲线点列表
         * @param mergeType 合并方式。mergeType = 0时进行还原合并，还原拆分之前的曲线；mergeType = 1时进行拟合合并，合并后的曲线会经过两条曲线的连接点；
         */
        merge(fps: number[], sps: number[], mergeType?: number): number[];
        /**
         * 获取曲线样本数据
         *
         * 这些点可用于连线来拟合曲线。
         *
         * @param ps 点列表
         * @param num 采样次数 ，采样点分别为[0,1/num,2/num,....,(num-1)/num,1]
         */
        getSamples(ps: number[], num?: number): {
            t: number;
            v: number;
        }[];
    }
}
declare namespace feng3d {
    /**
     * 动画关键帧
     */
    interface AnimationCurveKeyframe {
        /**
         * The time of the keyframe.
         *
         * 关键帧的时间。
         */
        time: number;
        /**
         * 曲线在关键帧处的值。
         */
        value: number;
        /**
         * Describes the tangent when approaching this point from the previous point in the curve.
         *
         * 描述从曲线上的前一点接近该点时的切线。
         */
        inTangent: number;
        /**
         * Describes the tangent when leaving this point towards the next point in the curve.
         *
         * 描述从这个点到曲线上下一个点的切线。
         */
        outTangent: number;
    }
}
declare namespace feng3d {
    /**
     * 动画曲线Wrap模式，处理超出范围情况
     */
    enum WrapMode {
        /**
         * 夹紧; 0>-<1
         */
        Clamp = 1,
        /**
         * 循环; 0->1,0->1
         */
        Loop = 2,
        /**
         * 来回循环; 0->1,1->0
         */
        PingPong = 4,
        /**
         * When time reaches the end of the animation clip, the clip will automatically stop playing and time will be reset to beginning of the clip.
         */
        Once = 5,
        /**
         * Reads the default repeat mode set higher up.
         */
        Default = 6
    }
}
declare namespace feng3d {
    /**
     * 动画曲线
     *
     * 基于时间轴的连续三阶Bézier曲线
     */
    class AnimationCurve {
        __class__: "feng3d.AnimationCurve";
        /**
         * 最大tan值，超出该值后将会变成分段
         */
        maxtan: number;
        /**
         * The behaviour of the animation before the first keyframe.
         *
         * 在第一个关键帧之前的动画行为。
         */
        preWrapMode: WrapMode;
        /**
         * The behaviour of the animation after the last keyframe.
         *
         * 动画在最后一个关键帧之后的行为。
         */
        postWrapMode: WrapMode;
        /**
         * All keys defined in the animation curve.
         *
         * 动画曲线上所有关键字定义。
         *
         * 注： 该值已对时间排序，否则赋值前请使用 sort((a, b) => a.time - b.time) 进行排序
         */
        keys: AnimationCurveKeyframe[];
        /**
         * 关键点数量
         */
        get numKeys(): number;
        /**
         * 添加关键点
         *
         * 添加关键点后将会执行按t进行排序
         *
         * @param key 关键点
         */
        addKey(key: AnimationCurveKeyframe): void;
        /**
         * 关键点排序
         *
         * 当移动关键点或者新增关键点时需要再次排序
         */
        sort(): void;
        /**
         * 删除关键点
         * @param key 关键点
         */
        deleteKey(key: AnimationCurveKeyframe): void;
        /**
         * 获取关键点
         * @param index 索引
         */
        getKey(index: number): AnimationCurveKeyframe;
        /**
         * 获取关键点索引
         * @param key 关键点
         */
        indexOfKeys(key: AnimationCurveKeyframe): number;
        /**
         * 获取曲线上点信息
         * @param t 时间轴的位置 [0,1]
         */
        getPoint(t: number): AnimationCurveKeyframe;
        /**
         * 获取值
         * @param t 时间轴的位置 [0,1]
         */
        getValue(t: number): number;
        /**
         * 查找关键点
         * @param t 时间轴的位置 [0,1]
         * @param y 值
         * @param precision 查找精度
         */
        findKey(t: number, y: number, precision: number): AnimationCurveKeyframe;
        /**
         * 添加曲线上的关键点
         *
         * 如果该点在曲线上，则添加关键点
         *
         * @param time 时间轴的位置 [0,1]
         * @param value 值
         * @param precision 查找精度
         */
        addKeyAtCurve(time: number, value: number, precision: number): AnimationCurveKeyframe;
        /**
         * 获取曲线样本数据
         *
         * 这些点可用于连线来拟合曲线。
         *
         * @param num 采样次数 ，采样点分别为[0,1/num,2/num,....,(num-1)/num,1]
         */
        getSamples(num?: number): AnimationCurveKeyframe[];
    }
}
declare namespace feng3d {
    /**
     * 曲线模式
     */
    enum MinMaxCurveMode {
        /**
         * Use a single constant for the MinMaxCurve.
         *
         * 使用单个常数。
         */
        Constant = 0,
        /**
         * Use a single curve for the MinMaxCurve.
         *
         * 使用一条曲线
         */
        Curve = 1,
        /**
         * Use a random value between 2 constants for the MinMaxCurve.
         *
         * 在两个常量之间使用一个随机值
         */
        TwoConstants = 3,
        /**
         * Use a random value between 2 curves for the MinMaxCurve.
         *
         * 在两条曲线之间使用一个随机值。
         */
        TwoCurves = 2
    }
}
declare namespace feng3d {
    /**
     * 最大最小曲线
     */
    class MinMaxCurve {
        __class__: "feng3d.MinMaxCurve";
        /**
         * 模式
         */
        mode: MinMaxCurveMode;
        /**
         * Set the constant value.
         *
         * 设置常数值。
         */
        constant: number;
        /**
         * Set a constant for the lower bound.
         *
         * 为下界设置一个常数。
         */
        constantMin: number;
        /**
         * Set a constant for the upper bound.
         *
         * 为上界设置一个常数。
         */
        constantMax: number;
        /**
         * Set the curve.
         *
         * 设置曲线。
         */
        curve: AnimationCurve;
        /**
         * Set a curve for the lower bound.
         *
         * 为下界设置一条曲线。
         */
        curveMin: AnimationCurve;
        /**
         * Set a curve for the upper bound.
         *
         * 为上界设置一条曲线。
         */
        curveMax: AnimationCurve;
        /**
         * Set a multiplier to be applied to the curves.
         *
         * 设置一个乘数应用于曲线。
         */
        curveMultiplier: number;
        /**
         * 是否在编辑器中只显示Y轴 0-1 区域，例如 lifetime 为非负，需要设置为true
         */
        between0And1: boolean;
        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number, randomBetween?: number): number;
    }
}
declare namespace feng3d {
    class MinMaxCurveVector3 {
        /**
         * x 曲线
         */
        xCurve: MinMaxCurve;
        /**
         * y 曲线
         */
        yCurve: MinMaxCurve;
        /**
         * z 曲线
         */
        zCurve: MinMaxCurve;
        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number, randomBetween?: number): Vector3;
    }
}
/**
 * Port from https://github.com/mapbox/earcut (v2.2.2)
 */
declare namespace feng3d {
    class Earcut {
        /**
         * 三角化形状
         *
         * @param data 形状顶点数据
         * @param holeIndices 空洞的起始顶点索引列表
         * @param dim 相邻顶点数据之间的步长
         */
        static triangulate(data: number[], holeIndices: number[], dim?: number): number[];
    }
}
declare namespace feng3d {
    class ShapeUtils {
        /**
         * 计算多边形面积
         * @param contour 多边形轮廓，使用顶点数组表示。
         */
        static area(contour: Vector2[]): number;
        /**
         * 判断多边形是否为顺时针方向
         *
         * @param contour 多边形轮廓，使用顶点数组表示。
         */
        static isClockWise(contour: Vector2[]): boolean;
        /**
         * 三角化多边形
         *
         * @param contour 多边形轮廓，使用顶点数组表示。
         * @param holes 孔洞多边形数组，每个孔洞多边形使用顶点数组表示。
         */
        static triangulateShape(contour: Vector2[], holes: Vector2[][]): number[][];
    }
}
declare namespace feng3d {
    /**
     * Bezier Curves formulas obtained from
     * http://en.wikipedia.org/wiki/Bézier_curve
     */
    class Interpolations {
        static CatmullRom(t: number, p0: number, p1: number, p2: number, p3: number): number;
        static QuadraticBezier(t: number, p0: number, p1: number, p2: number): number;
        static CubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number;
    }
}
declare function QuadraticBezierP0(t: number, p: number): number;
declare function QuadraticBezierP1(t: number, p: number): number;
declare function QuadraticBezierP2(t: number, p: number): number;
declare function CubicBezierP0(t: number, p: number): number;
declare function CubicBezierP1(t: number, p: number): number;
declare function CubicBezierP2(t: number, p: number): number;
declare function CubicBezierP3(t: number, p: number): number;
declare namespace feng3d {
    /**
     * An extensible curve object which contains methods for interpolation
     */
    class Curve<T extends Vector> {
        /**
         * This value determines the amount of divisions when calculating the cumulative segment lengths of a curve via .getLengths.
         * To ensure precision when using methods like .getSpacedPoints, it is recommended to increase .arcLengthDivisions if the curve is very large.
         */
        arcLengthDivisions: number;
        needsUpdate: boolean;
        cacheArcLengths: number[];
        getResolution(divisions: number): number;
        /**
         * Virtual base class method to overwrite and implement in subclasses
         *
         * - t [0 .. 1]
         * Returns a vector for point t of the curve where t is between 0 and 1
         */
        getPoint(t?: number, optionalTarget?: T): T;
        /**
         * Get point at relative position in curve according to arc length
         * Returns a vector for point at relative position in curve according to arc length
         *
         * @param u [0 .. 1]
         * @param optionalTarget
         */
        getPointAt(u: number, optionalTarget?: T): T;
        /**
         * Get sequence of points using getPoint( t )
         */
        getPoints(divisions?: number): T[];
        /**
         * Get sequence of equi-spaced points using getPointAt( u )
         */
        getSpacedPoints(divisions: number): any[];
        /**
         * Get total curve arc length
         */
        getLength(): number;
        /**
         * Get list of cumulative segment lengths
         */
        getLengths(divisions?: number): number[];
        /**
         * Update the cumlative segment distance cache
         */
        updateArcLengths(): void;
        /**
         * Given u ( 0 .. 1 ), get a t to find p. This gives you points which are equi distance
         */
        getUtoTmapping(u: number, distance?: number): number;
        /**
         * Returns a unit vector tangent at t. If the subclassed curve do not implement its tangent derivation, 2 points a small delta apart will be used to find its gradient which seems to give a reasonable approximation
         * getTangent(t: number, optionalTarget?: T): T;
         */
        getTangent(t: number, optionalTarget: T): T;
        /**
         * Returns tangent at equidistance point u on the curve
         * getTangentAt(u: number, optionalTarget?: T): T;
         */
        getTangentAt(u: number, optionalTarget: T): T;
        computeFrenetFrames(segments: number, closed: boolean): {
            tangents: Vector3[];
            normals: Vector3[];
            binormals: Vector3[];
        };
    }
}
declare namespace feng3d {
    /**
     * Curved Path - a curve path is simply a array of connected
     * curves, but retains the api of a curve
     */
    class CurvePath<T extends Vector> extends Curve<T> {
        curves: Curve<T>[];
        autoClose: boolean;
        cacheLengths: number[];
        add(curve: Curve<T>): void;
        closePath(): void;
        getPoint(t: number): T;
        getLength(): number;
        updateArcLengths(): void;
        getCurveLengths(): number[];
        getSpacedPoints(divisions?: number): T[];
        getPoints(divisions?: number): T[];
    }
}
declare namespace feng3d {
    class Path2 extends CurvePath<Vector2> {
        currentPoint: Vector2;
        constructor(points?: Vector2[]);
        setFromPoints(points: Vector2[]): this;
        moveTo(x: number, y: number): this;
        lineTo(x: number, y: number): this;
        quadraticCurveTo(aCPx: number, aCPy: number, aX: number, aY: number): this;
        bezierCurveTo(aCP1x: number, aCP1y: number, aCP2x: number, aCP2y: number, aX: number, aY: number): this;
        splineThru(pts: Vector2[]): this;
        arc(aX?: number, aY?: number, aRadius?: number, aStartAngle?: number, aEndAngle?: number, aClockwise?: boolean): this;
        absarc(aX?: number, aY?: number, aRadius?: number, aStartAngle?: number, aEndAngle?: number, aClockwise?: boolean): this;
        ellipse(aX?: number, aY?: number, xRadius?: number, yRadius?: number, aStartAngle?: number, aEndAngle?: number, aClockwise?: boolean, aRotation?: number): this;
        absellipse(aX?: number, aY?: number, xRadius?: number, yRadius?: number, aStartAngle?: number, aEndAngle?: number, aClockwise?: boolean, aRotation?: number): this;
    }
}
declare namespace feng3d {
    class Shape2 extends Path2 {
        holes: Path2[];
        constructor(points?: Vector2[]);
        getPointsHoles(divisions: number): Vector2[][];
        extractPoints(divisions: number): {
            shape: Vector2[];
            holes: Vector2[][];
        };
    }
}
declare namespace feng3d {
    class ShapePath2 {
        color: Color4;
        subPaths: Path2[];
        currentPath: Path2;
        constructor();
        moveTo(x: number, y: number): this;
        lineTo(x: number, y: number): this;
        quadraticCurveTo(aCPx: number, aCPy: number, aX: number, aY: number): this;
        bezierCurveTo(aCP1x: number, aCP1y: number, aCP2x: number, aCP2y: number, aX: number, aY: number): this;
        splineThru(pts: Vector2[]): this;
        toShapes(isCCW?: boolean, noHoles?: boolean): any[];
    }
}
declare namespace feng3d {
    export class Font {
        data: FontData;
        constructor(data: FontData);
        generateShapes(text: string, size: number): ShapePath2[];
    }
    interface FontData {
        underlineThickness: number;
        resolution: number;
        boundingBox: {
            yMax: number;
            yMin: number;
        };
        familyName: string;
        glyphs: {
            [k: string]: {
                o: string;
                _cachedOutline: any;
                ha: number;
            };
        };
    }
    export {};
}
declare namespace feng3d {
    class LineCurve2 extends Curve<Vector2> {
        v1: Vector2;
        v2: Vector2;
        constructor(v1?: Vector2, v2?: Vector2);
        getResolution(divisions: number): number;
        getPoint(t: number, optionalTarget: Vector2): Vector2;
        getPointAt(u: number, optionalTarget: Vector2): Vector2;
        getTangent(t: number, optionalTarget?: Vector2): Vector2;
    }
}
declare namespace feng3d {
    class LineCurve3 extends Curve<Vector3> {
        v1: Vector3;
        v2: Vector3;
        constructor(v1?: Vector3, v2?: Vector3);
        getResolution(divisions: number): number;
        getPoint(t: number, optionalTarget?: Vector3): Vector3;
        getPointAt(u: number, optionalTarget?: Vector3): Vector3;
    }
}
declare namespace feng3d {
    class SplineCurve2 extends Curve<Vector2> {
        points: Vector2[];
        constructor(points?: Vector2[]);
        getResolution(divisions: number): number;
        getPoint(t: number, optionalTarget: Vector2): Vector2;
    }
}
declare namespace feng3d {
    class EllipseCurve2 extends Curve<Vector2> {
        aX: number;
        aY: number;
        xRadius: number;
        yRadius: number;
        aStartAngle: number;
        aEndAngle: number;
        aClockwise: boolean;
        aRotation: number;
        constructor(aX?: number, aY?: number, xRadius?: number, yRadius?: number, aStartAngle?: number, aEndAngle?: number, aClockwise?: boolean, aRotation?: number);
        getResolution(divisions: number): number;
        getPoint(t: number, optionalTarget?: Vector2): Vector2;
    }
}
declare namespace feng3d {
    class ArcCurve2 extends EllipseCurve2 {
        constructor(aX?: number, aY?: number, aRadius?: number, aStartAngle?: number, aEndAngle?: number, aClockwise?: boolean);
    }
}
declare namespace feng3d {
    /**
     * Centripetal CatmullRom Curve - which is useful for avoiding
     * cusps and self-intersections in non-uniform catmull rom curves.
     * http://www.cemyuksel.com/research/catmullrom_param/catmullrom.pdf
     *
     * curve.type accepts centripetal(default), chordal and catmullrom
     * curve.tension is used for catmullrom which defaults to 0.5
     */
    class CatmullRomCurve3 extends Curve<Vector3> {
        isCatmullRomCurve3: boolean;
        points: Vector3[];
        closed: boolean;
        curveType: string;
        tension: number;
        constructor(points?: Vector3[], closed?: boolean, curveType?: string, tension?: number);
        getPoint(t: number, optionalTarget?: Vector3): Vector3;
    }
}
declare namespace feng3d {
    class CubicBezierCurve2 extends Curve<Vector2> {
        v0: Vector2;
        v1: Vector2;
        v2: Vector2;
        v3: Vector2;
        constructor(v0?: Vector2, v1?: Vector2, v2?: Vector2, v3?: Vector2);
        getPoint(t: number, optionalTarget?: Vector2): Vector2;
    }
}
declare namespace feng3d {
    class CubicBezierCurve3 extends Curve<Vector3> {
        v0: Vector3;
        v1: Vector3;
        v2: Vector3;
        v3: Vector3;
        constructor(v0?: Vector3, v1?: Vector3, v2?: Vector3, v3?: Vector3);
        getPoint(t: number, optionalTarget?: Vector3): Vector3;
    }
}
declare namespace feng3d {
    class QuadraticBezierCurve2 extends Curve<Vector2> {
        v0: Vector2;
        v1: Vector2;
        v2: Vector2;
        constructor(v0?: Vector2, v1?: Vector2, v2?: Vector2);
        getPoint(t: number, optionalTarget?: Vector2): Vector2;
    }
}
declare namespace feng3d {
    class QuadraticBezierCurve3 extends Curve<Vector3> {
        v0: Vector3;
        v1: Vector3;
        v2: Vector3;
        constructor(v0?: Vector3, v1?: Vector3, v2?: Vector3);
        getPoint(t: number, optionalTarget?: Vector3): Vector3;
    }
}
declare namespace feng3d {
    /**
     * 噪音
     */
    var noise: Noise;
    /**
     * 柏林噪音
     *
     * 用于生产随机的噪音贴图
     *
     * @see http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf
     * @see https://mrl.nyu.edu/~perlin/noise/
     * @see https://gitee.com/feng3d_admin/noise
     */
    class Noise {
        /**
         * 构建柏林噪音
         *
         * @param seed 随机种子
         */
        constructor(seed?: number);
        /**
         * 1D 经典噪音
         *
         * @param x X轴数值
         */
        perlin1(x: number): number;
        /**
         * 2D 经典噪音
         *
         * @param x X轴数值
         * @param y Y轴数值
         */
        perlin2(x: number, y: number): number;
        /**
         * 3D 经典噪音
         *
         * @param x X轴数值
         * @param y Y轴数值
         * @param z Z轴数值
         */
        perlin3(x: number, y: number, z: number): number;
        /**
         * N阶经典噪音
         *
         * 如果是1D，2D，3D噪音，最好选用对于函数，perlinN中存在for循环因此效率比perlin3等性能差3到5（8）倍！
         *
         * 满足以下运算
         * perlinN(x) == perlin1(x)
         * perlinN(x,y) == perlin2(x,y)
         * perlinN(x,y,z) == perlin3(x,y,z)
         *
         * @param ps 每个轴的数值
         */
        perlinN(...ps: number[]): number;
        /**
         * This isn't a very good seeding function, but it works ok. It supports 2^16
         * different seed values. Write something better if you need more seeds.
         */
        get seed(): number;
        set seed(v: number);
        private _seed;
        private _p;
    }
    /**
     *
     * @param n
     *
     * len = 2^(n-1) * n
     */
    function createGrad(n: number): number[][];
    function getBits(n: number): number[][];
}
declare namespace feng3d {
    /**
     * 代理 EventTarget, 处理js事件中this关键字问题
     */
    class EventProxy extends EventDispatcher {
        pageX: number;
        pageY: number;
        clientX: number;
        clientY: number;
        /**
         * 是否右击
         */
        rightmouse: boolean;
        key: string;
        keyCode: number;
        deltaY: number;
        private listentypes;
        get target(): EventTarget;
        set target(v: EventTarget);
        private _target;
        constructor(target?: EventTarget);
        /**
         * 监听一次事件后将会被移除
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        once(type: string, listener: (event: any) => void, thisObject?: any, priority?: number): void;
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
        /**
         * 处理鼠标按下时同时出发 "mousemove" 事件bug
         */
        private handleMouseMoveBug;
        private mousedownposition;
        /**
         * 键盘按下事件
         */
        private onMouseKey;
        /**
         * 清理数据
         */
        private clear;
    }
}
declare namespace feng3d {
    interface WindowEventProxy {
        once<K extends keyof WindowEventMap>(type: K, listener: (event: WindowEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof WindowEventMap>(type: K, data?: WindowEventMap[K], bubbles?: boolean): any;
        has<K extends keyof WindowEventMap>(type: K): boolean;
        on<K extends keyof WindowEventMap>(type: K, listener: (event: WindowEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof WindowEventMap>(type?: K, listener?: (event: WindowEventMap[K]) => any, thisObject?: any): void;
    }
    interface IEventProxy<T> {
        once<K extends keyof T>(type: K, listener: (event: T[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof T>(type: K, data?: T[K], bubbles?: boolean): any;
        has<K extends keyof T>(type: K): boolean;
        on<K extends keyof T>(type: K, listener: (event: T[K]) => any, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof T>(type?: K, listener?: (event: T[K]) => any, thisObject?: any): void;
    }
    class WindowEventProxy extends EventProxy {
    }
    /**
     * 键盘鼠标输入
     */
    var windowEventProxy: IEventProxy<WindowEventMap> & EventProxy;
}
declare namespace feng3d {
    /**
     * 路径工具
     */
    var pathUtils: PathUtils;
    /**
     * 路径工具
     */
    class PathUtils {
        /**
         * 标准化文件夹路径
         * @param path
         */
        normalizeDir(path: string): string;
        /**
         * 是否为HTTP地址
         *
         * @param path 地址
         */
        isHttpURL(path: string): any;
        /**
         * 获取不带后缀名称
         * @param path 路径
         */
        getName(path: string): string;
        /**
         * 获取带后缀名称
         * @param path 路径
         */
        basename(path: string): string;
        /**
         * 获取后缀
         * @param path 路径
         */
        extname(path: string): string;
        /**
         * 父路径
         * @param path 路径
         */
        dirname(path: string): string;
        /**
         * 获取子文件（非文件夹）路径
         *
         * @param parentPath 父文件夹路径
         * @param childName 子文件名称
         */
        getChildFilePath(parentPath: string, childName: string): string;
        /**
         * 获取子文件夹路径
         *
         * @param parentPath 父文件夹路径
         * @param childFolderName 子文件夹名称
         */
        getChildFolderPath(parentPath: string, childFolderName: string): string;
        /**
         * 是否文件夹
         * @param path 路径
         */
        isDirectory(path: string): boolean;
        /**
         * 获取目录深度
         * @param path 路径
         */
        getDirDepth(path: string): number;
    }
}
declare namespace feng3d {
    /**
     * 加载类
     */
    var loader: Loader;
    /**
     * 加载类
     */
    class Loader {
        /**
         * 加载文本
         * @param url   路径
         */
        loadText(url: string, onCompleted?: (content: string) => void, onRequestProgress?: () => void, onError?: (e: Error) => void): void;
        /**
         * 加载二进制
         * @param url   路径
         */
        loadBinary(url: string, onCompleted?: (content: ArrayBuffer) => void, onRequestProgress?: () => void, onError?: (e: Error) => void): void;
        /**
         * 加载图片
         * @param url   路径
         */
        loadImage(url: string, onCompleted?: (content: HTMLImageElement) => void, onRequestProgress?: () => void, onError?: (e: Error) => void): void;
    }
}
declare namespace feng3d {
    /**
     * 加载数据类型
     */
    enum LoaderDataFormat {
        /**
         * 以原始二进制数据形式接收下载的数据。
         */
        BINARY = "binary",
        /**
         * 以文本形式接收已下载的数据。
         */
        TEXT = "text",
        /**
         * 图片数据
         */
        IMAGE = "image"
    }
}
declare namespace feng3d {
    /**
     *
     */
    var _indexedDB: _IndexedDB;
    /**
     *
     */
    class _IndexedDB {
        /**
         * 数据库状态
         */
        private _dbStatus;
        /**
         * 是否支持 indexedDB
         */
        support(): boolean;
        /**
         * 获取数据库，如果不存在则新建数据库
         *
         * @param dbname 数据库名称
         * @param callback 完成回调
         */
        getDatabase(dbname: string, callback: (err: any, database: IDBDatabase) => void): void;
        /**
         * 打开或者升级数据库
         *
         * @param dbname 数据库名称
         * @param callback 完成回调
         * @param upgrade 是否升级数据库
         * @param onupgrade 升级回调
         */
        private _open;
        /**
         * 删除数据库
         *
         * @param dbname 数据库名称
         * @param callback 完成回调
         */
        deleteDatabase(dbname: string, callback?: (err: any) => void): void;
        /**
         * 是否存在指定的对象存储
         *
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param callback 完成回调
         */
        hasObjectStore(dbname: string, objectStroreName: string, callback: (has: boolean) => void): void;
        /**
         * 获取对象存储名称列表
         *
         * @param dbname 数据库
         * @param callback 完成回调
         */
        getObjectStoreNames(dbname: string, callback: (err: Error | null, objectStoreNames: string[]) => void): void;
        /**
         * 创建对象存储
         *
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param callback 完成回调
         */
        createObjectStore(dbname: string, objectStroreName: string, callback?: (err: any) => void): void;
        /**
         * 删除对象存储
         *
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param callback 完成回调
         */
        deleteObjectStore(dbname: string, objectStroreName: string, callback?: (err: any) => void): void;
        /**
         * 获取对象存储中所有键列表
         *
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param callback 完成回调
         */
        getAllKeys(dbname: string, objectStroreName: string, callback?: (err: Error, keys: string[]) => void): void;
        /**
         * 获取对象存储中指定键对应的数据
         *
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param key 键
         * @param callback 完成回调
         */
        objectStoreGet(dbname: string, objectStroreName: string, key: string | number, callback?: (err: Error, data: any) => void): void;
        /**
         * 设置对象存储的键与值，如果不存在指定键则新增否则修改。
         *
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param key 键
         * @param data 数据
         * @param callback 完成回调
         */
        objectStorePut(dbname: string, objectStroreName: string, key: string | number, data: any, callback?: (err: Error) => void): void;
        /**
         * 删除对象存储中指定键以及对于数据
         *
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param key 键
         * @param callback 完成回调
         */
        objectStoreDelete(dbname: string, objectStroreName: string, key: string | number, callback?: (err?: Error) => void): void;
        /**
         * 清空对象存储中数据
         *
         * @param dbname 数据库名称
         * @param objectStroreName 对象存储名称
         * @param callback 完成回调
         */
        objectStoreClear(dbname: string, objectStroreName: string, callback?: (err?: Error) => void): void;
    }
}
declare namespace feng3d {
    /**
     * 文件系统类型
     */
    enum FSType {
        http = "http",
        native = "native",
        indexedDB = "indexedDB"
    }
}
declare namespace feng3d {
    /**
     * 可读文件系统
     */
    interface IReadFS {
        /**
         * 文件系统类型
         */
        type: FSType;
        /**
         * 读取文件为ArrayBuffer
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readArrayBuffer(path: string, callback: (err: Error, arraybuffer: ArrayBuffer) => void): void;
        /**
         * 读取文件为字符串
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readString(path: string, callback: (err: Error, str: string) => void): void;
        /**
         * 读取文件为Object
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readObject(path: string, callback: (err: Error, object: Object) => void): void;
        /**
         * 加载图片
         * @param path 图片路径
         * @param callback 加载完成回调
         */
        readImage(path: string, callback: (err: Error, img: HTMLImageElement) => void): void;
        /**
         * 获取文件绝对路径
         * @param path （相对）路径
         */
        getAbsolutePath(path: string): string;
    }
    /**
     * 默认基础文件系统
     */
    var basefs: IReadFS;
}
declare namespace feng3d {
    /**
     * 默认文件系统
     */
    var fs: ReadFS;
    /**
     * 可读文件系统
     */
    class ReadFS {
        /**
         * 基础文件系统
         */
        get fs(): IReadFS;
        set fs(v: IReadFS);
        private _fs;
        /**
         * 文件系统类型
         */
        get type(): FSType;
        constructor(fs?: IReadFS);
        /**
         * 读取文件为ArrayBuffer
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readArrayBuffer(path: string, callback: (err: Error, arraybuffer: ArrayBuffer) => void): void;
        /**
         * 读取文件为字符串
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readString(path: string, callback: (err: Error, str: string) => void): void;
        /**
         * 读取文件为Object
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readObject(path: string, callback: (err: Error, object: Object) => void): void;
        /**
         * 加载图片
         * @param path 图片路径
         * @param callback 加载完成回调
         */
        readImage(path: string, callback: (err: Error, img: HTMLImageElement) => void): void;
        /**
         * 获取文件绝对路径
         * @param path （相对）路径
         */
        getAbsolutePath(path: string): string;
        /**
         * 读取文件列表为字符串列表
         *
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readStrings(paths: string[], callback: (strs: (string | Error)[]) => void): void;
        protected _images: {
            [path: string]: HTMLImageElement;
        };
        private _state;
    }
}
declare namespace feng3d {
    /**
     * 可读写文件系统
     *
     * 扩展基础可读写文件系统
     */
    interface IReadWriteFS extends IReadFS {
        /**
         * 项目名称（表单名称）
         */
        projectname: string;
        /**
         * 文件是否存在
         * @param path 文件路径
         * @param callback 回调函数
         */
        exists(path: string, callback: (exists: boolean) => void): void;
        /**
         * 读取文件夹中文件列表
         * @param path 路径
         * @param callback 回调函数
         */
        readdir(path: string, callback: (err: Error, files: string[]) => void): void;
        /**
         * 新建文件夹
         * @param path 文件夹路径
         * @param callback 回调函数
         */
        mkdir(path: string, callback?: (err: Error) => void): void;
        /**
         * 删除文件
         * @param path 文件路径
         * @param callback 回调函数
         */
        deleteFile(path: string, callback?: (err: Error) => void): void;
        /**
         * 写ArrayBuffer(新建)文件
         * @param path 文件路径
         * @param arraybuffer 文件数据
         * @param callback 回调函数
         */
        writeArrayBuffer(path: string, arraybuffer: ArrayBuffer, callback?: (err: Error) => void): void;
        /**
         * 写字符串到(新建)文件
         * @param path 文件路径
         * @param str 文件数据
         * @param callback 回调函数
         */
        writeString(path: string, str: string, callback?: (err: Error) => void): void;
        /**
         * 写Object到(新建)文件
         * @param path 文件路径
         * @param object 文件数据
         * @param callback 回调函数
         */
        writeObject(path: string, object: Object, callback?: (err: Error) => void): void;
        /**
         * 写图片
         * @param path 图片路径
         * @param image 图片
         * @param callback 回调函数
         */
        writeImage(path: string, image: HTMLImageElement, callback?: (err: Error) => void): void;
        /**
         * 复制文件
         * @param src    源路径
         * @param dest    目标路径
         * @param callback 回调函数
         */
        copyFile(src: string, dest: string, callback?: (err: Error) => void): void;
        /**
         * 是否为文件夹
         *
         * @param path 文件路径
         * @param callback 完成回调
         */
        isDirectory(path: string, callback: (result: boolean) => void): void;
        /**
         * 初始化项目
         * @param projectname 项目名称
         * @param callback 回调函数
         */
        initproject(projectname: string, callback: (err: Error) => void): void;
        /**
         * 是否存在指定项目
         * @param projectname 项目名称
         * @param callback 回调函数
         */
        hasProject(projectname: string, callback: (has: boolean) => void): void;
    }
}
declare namespace feng3d {
    /**
     * 可读写文件系统
     *
     * 扩展基础可读写文件系统
     */
    class ReadWriteFS extends ReadFS {
        /**
         * 项目名称（表单名称）
         */
        projectname: string;
        fs: IReadWriteFS;
        constructor(fs?: IReadWriteFS);
        /**
         * 文件是否存在
         * @param path 文件路径
         * @param callback 回调函数
         */
        exists(path: string, callback: (exists: boolean) => void): void;
        /**
         * 读取文件夹中文件列表
         * @param path 路径
         * @param callback 回调函数
         */
        readdir(path: string, callback: (err: Error, files: string[]) => void): void;
        /**
         * 新建文件夹
         * @param path 文件夹路径
         * @param callback 回调函数
         */
        mkdir(path: string, callback?: (err: Error) => void): void;
        /**
         * 删除文件
         * @param path 文件路径
         * @param callback 回调函数
         */
        deleteFile(path: string, callback?: (err: Error) => void): void;
        /**
         * 写(新建)文件
         * 自动根据文件类型保存为对应结构
         *
         * @param path 文件路径
         * @param arraybuffer 文件数据
         * @param callback 回调函数
         */
        writeFile(path: string, arraybuffer: ArrayBuffer, callback?: (err: Error) => void): void;
        /**
         * 写ArrayBuffer(新建)文件
         * @param path 文件路径
         * @param arraybuffer 文件数据
         * @param callback 回调函数
         */
        writeArrayBuffer(path: string, arraybuffer: ArrayBuffer, callback?: (err: Error) => void): void;
        /**
         * 写字符串到(新建)文件
         * @param path 文件路径
         * @param str 文件数据
         * @param callback 回调函数
         */
        writeString(path: string, str: string, callback?: (err: Error) => void): void;
        /**
         * 写Object到(新建)文件
         * @param path 文件路径
         * @param object 文件数据
         * @param callback 回调函数
         */
        writeObject(path: string, object: Object, callback?: (err: Error) => void): void;
        /**
         * 写图片
         * @param path 图片路径
         * @param image 图片
         * @param callback 回调函数
         */
        writeImage(path: string, image: HTMLImageElement, callback?: (err: Error) => void): void;
        /**
         * 复制文件
         * @param src    源路径
         * @param dest    目标路径
         * @param callback 回调函数
         */
        copyFile(src: string, dest: string, callback?: (err: Error) => void): void;
        /**
         * 是否为文件夹
         *
         * @param path 文件路径
         * @param callback 完成回调
         */
        isDirectory(path: string, callback: (result: boolean) => void): void;
        /**
         * 初始化项目
         * @param projectname 项目名称
         * @param callback 回调函数
         */
        initproject(projectname: string, callback: (err: Error) => void): void;
        /**
         * 是否存在指定项目
         * @param projectname 项目名称
         * @param callback 回调函数
         */
        hasProject(projectname: string, callback: (has: boolean) => void): void;
        /**
         * 获取指定文件下所有文件路径列表
         */
        getAllPathsInFolder(dirpath: string, callback: (err: Error, filepaths: string[]) => void): void;
        /**
         * 移动文件
         * @param src 源路径
         * @param dest 目标路径
         * @param callback 回调函数
         */
        moveFile(src: string, dest: string, callback?: (err: Error) => void): void;
        /**
         * 重命名文件
         * @param oldPath 老路径
         * @param newPath 新路径
         * @param callback 回调函数
         */
        renameFile(oldPath: string, newPath: string, callback?: (err: Error) => void): void;
        /**
         * 移动一组文件
         * @param movelists 移动列表
         * @param callback 回调函数
         */
        moveFiles(movelists: [string, string][], callback?: (err: Error) => void): void;
        /**
         * 复制一组文件
         * @param copylists 复制列表
         * @param callback 回调函数
         */
        copyFiles(copylists: [string, string][], callback?: (err: Error) => void): void;
        /**
         * 删除一组文件
         * @param deletelists 删除列表
         * @param callback 回调函数
         */
        deleteFiles(deletelists: string[], callback?: (err: Error) => void): void;
        /**
         * 重命名文件(夹)
         * @param oldPath 老路径
         * @param newPath 新路径
         * @param callback 回调函数
         */
        rename(oldPath: string, newPath: string, callback?: (err: Error) => void): void;
        /**
         * 移动文件(夹)
         *
         * @param src 源路径
         * @param dest 目标路径
         * @param callback 回调函数
         */
        move(src: string, dest: string, callback?: (err?: Error) => void): void;
        /**
         * 删除文件(夹)
         * @param path 路径
         * @param callback 回调函数
         */
        delete(path: string, callback?: (err: Error) => void): void;
    }
}
declare namespace feng3d {
    /**
     * 索引数据文件系统
     */
    var indexedDBFS: IndexedDBFS;
    /**
     * 索引数据文件系统
     */
    class IndexedDBFS implements IReadWriteFS {
        get type(): FSType;
        /**
         * 数据库名称
         */
        DBname: string;
        /**
         * 项目名称（表单名称）
         */
        projectname: string;
        constructor(DBname?: string, projectname?: string);
        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readArrayBuffer(path: string, callback: (err: Error, data: ArrayBuffer) => void): void;
        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readString(path: string, callback: (err: Error, data: string) => void): void;
        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readObject(path: string, callback: (err: Error, data: object) => void): void;
        /**
         * 加载图片
         * @param path 图片路径
         * @param callback 加载完成回调
         */
        readImage(path: string, callback: (err: Error, img: HTMLImageElement) => void): void;
        /**
         * 获取文件绝对路径
         * @param path （相对）路径
         * @param callback 回调函数
         */
        getAbsolutePath(path: string): string;
        /**
         * 是否为文件夹
         *
         * @param path 文件路径
         * @param callback 完成回调
         */
        isDirectory(path: string, callback: (result: boolean) => void): void;
        /**
         * 文件是否存在
         * @param path 文件路径
         * @param callback 回调函数
         */
        exists(path: string, callback: (exists: boolean) => void): void;
        /**
         * 读取文件夹中文件列表
         * @param path 路径
         * @param callback 回调函数
         */
        readdir(path: string, callback: (err: Error, files: string[]) => void): void;
        /**
         * 新建文件夹
         * @param path 文件夹路径
         * @param callback 回调函数
         */
        mkdir(path: string, callback?: (err: Error) => void): void;
        /**
         * 删除文件
         * @param path 文件路径
         * @param callback 回调函数
         */
        deleteFile(path: string, callback: (err: Error) => void): void;
        /**
         * 写文件
         * @param path 文件路径
         * @param data 文件数据
         * @param callback 回调函数
         */
        writeArrayBuffer(path: string, data: ArrayBuffer, callback?: (err: Error) => void): void;
        /**
         * 写文件
         * @param path 文件路径
         * @param data 文件数据
         * @param callback 回调函数
         */
        writeString(path: string, data: string, callback?: (err: Error) => void): void;
        /**
         * 写文件
         * @param path 文件路径
         * @param object 文件数据
         * @param callback 回调函数
         */
        writeObject(path: string, object: Object, callback?: (err: Error) => void): void;
        /**
         * 写图片
         * @param path 图片路径
         * @param image 图片
         * @param callback 回调函数
         */
        writeImage(path: string, image: HTMLImageElement, callback?: (err: Error) => void): void;
        /**
         * 复制文件
         * @param src    源路径
         * @param dest    目标路径
         * @param callback 回调函数
         */
        copyFile(src: string, dest: string, callback?: (err: Error) => void): void;
        /**
         * 是否存在指定项目
         * @param projectname 项目名称
         * @param callback 回调函数
         */
        hasProject(projectname: string, callback: (has: boolean) => void): void;
        /**
         * 初始化项目
         * @param projectname 项目名称
         * @param callback 回调函数
         */
        initproject(projectname: string, callback: (err: Error) => void): void;
    }
}
declare namespace feng3d {
    /**
     * Http可读文件系统
     */
    class HttpFS implements IReadFS {
        /**
         * 根路径
         */
        rootPath: string;
        type: FSType;
        constructor(rootPath?: string);
        /**
         * 读取文件
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readArrayBuffer(path: string, callback: (err: Error, data: ArrayBuffer) => void): void;
        /**
         * 读取文件为字符串
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readString(path: string, callback: (err: Error, data: string) => void): void;
        /**
         * 读取文件为Object
         * @param path 路径
         * @param callback 读取完成回调 当err不为null时表示读取失败
         */
        readObject(path: string, callback: (err: Error, data: Object) => void): void;
        /**
         * 加载图片
         * @param path 图片路径
         * @param callback 加载完成回调
         */
        readImage(path: string, callback: (err: Error, img: HTMLImageElement) => void): void;
        /**
         * 获取文件绝对路径
         * @param path （相对）路径
         * @param callback 回调函数
         */
        getAbsolutePath(path: string): string;
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
        private onMouseOnce;
        /**
         * 鼠标事件
         */
        private onMousewheel;
        /**
         * 键盘按下事件
         */
        private onKeydown;
        /**
         * 键盘弹起事件
         */
        private onKeyup;
    }
}
declare namespace feng3d {
    /**
     * 按键状态

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
        private init;
        /**
         * 处理捕获事件
         */
        private onCapture;
        /**
         * 派发命令
         */
        private dispatchCommands;
        /**
         * 执行状态命令
         */
        private executeStateCommands;
        /**
         * 检测快捷键是否处于活跃状态
         */
        private checkActivityStates;
        /**
         * 获取是否处于指定状态中（支持一个！取反）
         * @param state 状态名称
         */
        private getState;
        /**
         * 检测是否按下给出的键
         * @param keys 按键数组
         */
        private checkActivityKeys;
        /**
         * 获取按键状态（true：按下状态，false：弹起状态）
         */
        private getKeyValue;
        /**
         * 获取状态列表
         * @param when		状态字符串
         */
        private getStates;
        /**
         * 获取键列表
         * @param key		快捷键
         */
        private getKeys;
        /**
         * 获取命令列表
         * @param command	命令
         */
        private getCommands;
        /**
         * 获取状态命令列表
         * @param stateCommand	状态命令
         */
        private getStateCommand;
        /**
         * 销毁
         */
        destroy(): void;
    }
}
declare namespace feng3d {
}
declare namespace feng3d {
    /**
     * 快捷键
     */
    var shortcut: ShortCut;
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
        private getShortcutUniqueKey;
    }
}
declare namespace feng3d {
    /**
     * 渲染模式
     * A GLenum specifying the type primitive to render. Possible values are:
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
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
        TRIANGLE_FAN = "TRIANGLE_FAN"
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
        TEXTURE_CUBE_MAP = "TEXTURE_CUBE_MAP"
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
        FUNC_REVERSE_SUBTRACT = "FUNC_REVERSE_SUBTRACT"
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
        SRC_ALPHA_SATURATE = "SRC_ALPHA_SATURATE"
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
        FRONT_AND_BACK = "FRONT_AND_BACK"
    }
}
declare namespace feng3d {
    /**
     * 决定给WebGLRenderingContext.colorMask何种参数。
     */
    enum ColorMask {
        NONE = 0,
        R = 1,
        G = 2,
        B = 4,
        A = 8,
        RGB = 7,
        /**
         *
         */
        RGBA = 15
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
        CCW = "CCW"
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
        LUMINANCE_ALPHA = "LUMINANCE_ALPHA"
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
        UNSIGNED_SHORT_5_5_5_1 = "UNSIGNED_SHORT_5_5_5_1"
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
        LINEAR_MIPMAP_LINEAR = "LINEAR_MIPMAP_LINEAR"
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
        NEAREST = "NEAREST"
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
        MIRRORED_REPEAT = "MIRRORED_REPEAT"
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
        FLOAT = "FLOAT"
    }
}
declare namespace feng3d {
    /**
     * A GLenum specifying the intended usage pattern of the data store for optimization purposes.
     *
     * 指定数据存储区的使用方法。
     *
     * @see https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/bufferData
     */
    enum AttributeUsage {
        /**
         * The contents are intended to be specified once by the application, and used many times as the source for WebGL drawing and image specification commands.
         *
         * 内容由应用程序指定一次，并多次用作WebGL绘图和图像规范命令的源。
         *
         * 缓冲区的内容可能经常使用，而不会经常更改。内容被写入缓冲区，但不被读取。
         */
        STATIC_DRAW = "STATIC_DRAW",
        /**
         * The contents are intended to be respecified repeatedly by the application, and used many times as the source for WebGL drawing and image specification commands.
         *
         * 这些内容将由应用程序反复重新指定，并多次用作WebGL绘图和图像规范命令的源。
         */
        DYNAMIC_DRAW = "DYNAMIC_DRAW",
        /**
         * The contents are intended to be specified once by the application, and used at most a few times as the source for WebGL drawing and image specification commands.
         *
         * 内容由应用程序指定一次，最多几次用作WebGL绘图和图像规范命令的源。
         */
        STREAM_DRAW = "STREAM_DRAW"
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
        ALWAYS = "ALWAYS"
    }
}
declare namespace feng3d {
    /**
     * 扩展（封装，包装）WebGL
     */
    interface GL extends WebGLRenderingContext {
        /**
         * The WebGL2RenderingContext.vertexAttribDivisor() method of the WebGL 2 API modifies the rate at which generic vertex attributes advance when rendering multiple instances of primitives with gl.drawArraysInstanced() and gl.drawElementsInstanced().
         *
         * WebGL2 API的WebGL2RenderingContext.vertexAttribDivisor()方法在使用gl. drawarraysinstated()和gl. drawelementsinstated()呈现多个原语实例时，修改了通用顶点属性的提升速度。
         *
         * @param index A GLuint specifying the index of the generic vertex attributes. 指定一般顶点属性的索引的GLuint。
         * @param divisor 指定将在通用属性的更新之间传递的实例数的GLuint。
         *
         * @see WebGL2RenderingContextBase.vertexAttribDivisor
         * @see ANGLE_instanced_arrays.vertexAttribDivisorANGLE
         * @see https://developer.mozilla.org/zh-CN/docs/Web/API/WebGL2RenderingContext/vertexAttribDivisor
         */
        vertexAttribDivisor(index: GLuint, divisor: GLuint): void;
        /**
         * The WebGL2RenderingContext.drawElementsInstanced() method of the WebGL 2 API renders primitives from array data like the gl.drawElements() method. In addition, it can execute multiple instances of a set of elements.
         *
         * WebGL2 API的webgl2renderingcontext . drawelementsinstance()方法呈现来自数组数据的原语，如gl.drawElements()方法。此外，它可以执行一组元素的多个实例。
         *
         * @param mode A GLenum specifying the type primitive to render. 指定要呈现的类型基元的GLenum。
         * @param count A GLsizei specifying the number of elements to be rendered. 指定要呈现的元素数量的GLsizei。
         * @param type A GLenum specifying the type of the values in the element array buffer. 指定元素数组缓冲区中值的类型的GLenum。
         * @param offset A GLintptr specifying an offset in the element array buffer. Must be a valid multiple of the size of the given type. 指定元素数组缓冲区中的偏移量的GLintptr。必须是给定类型大小的有效倍数。
         * @param instanceCount A GLsizei specifying the number of instances of the set of elements to execute. 指定要执行的元素集的实例数的GLsizei。
         *
         * @see WebGL2RenderingContextBase.drawElementsInstanced
         */
        drawElementsInstanced(mode: GLenum, count: GLsizei, type: GLenum, offset: GLintptr, instanceCount: GLsizei): void;
        /**
         * The WebGL2RenderingContext.drawArraysInstanced() method of the WebGL 2 API renders primitives from array data like the gl.drawArrays() method. In addition, it can execute multiple instances of the range of elements.
         *
         * WebGL2 API的webgl2renderingcontext . drawarraysinstance()方法呈现来自数组数据的原语，比如gl.drawArrays()方法。此外，它可以执行元素范围的多个实例。
         *
         * @param mode A GLenum specifying the type primitive to render. 指定要呈现的类型基元的GLenum。
         * @param first A GLint specifying the starting index in the array of vector points. 在向量点数组中指定起始索引的位置。
         * @param count A GLsizei specifying the number of indices to be rendered. 指定要呈现的索引数量的GLsizei。
         * @param instanceCount A GLsizei specifying the number of instances of the range of elements to execute. 指定要执行的元素集的实例数的GLsizei。
         */
        drawArraysInstanced(mode: GLenum, first: GLint, count: GLsizei, instanceCount: GLsizei): void;
        /**
         * 设置纹理最大向异性。 (相当于texParameterf(textureType, ext.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);)
         *
         * @param target A GLenum specifying the binding point (target).  GLenum 指定绑定点(目标)
         * @param param Maximum anisotropy for a texture. 纹理最大向异性值
         *
         * @see WebGLRenderingContextBase.texParameterf
         * @see https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/texParameter
         */
        texParameterfAnisotropy(target: GLenum, anisotropy: GLfloat): void;
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
         * 渲染
         *
         * @param renderAtomic 渲染数据
         */
        render(renderAtomic: RenderAtomic): void;
        /**
         * WEBGL 支持能力
         */
        capabilities: GLCapabilities;
        /**
         * 缓存
         */
        cache: GLCache;
    }
    class GL {
        static glList: GL[];
        /**
         * 获取 GL 实例
         * @param canvas 画布
         * @param contextAttributes
         */
        static getGL(canvas: HTMLCanvasElement, contextAttributes?: WebGLContextAttributes): GL;
    }
}
declare namespace feng3d {
    /**
     * GL 缓存
     */
    class GLCache {
        compileShaderResults: {
            [key: string]: CompileShaderResult;
        };
        private _gl;
        /**
         * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
         */
        textures: Map<Texture, WebGLTexture>;
        /**
         * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
         */
        attributes: Map<Attribute, WebGLBuffer>;
        /**
         * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
         */
        indices: Map<Index, WebGLBuffer>;
        /**
         * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
         */
        renderBuffers: Map<RenderBuffer, WebGLBuffer>;
        /**
         * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
         */
        frameBuffers: Map<FrameBuffer, WebGLFramebuffer>;
        constructor(gl: GL);
    }
}
declare namespace feng3d {
    /**
     * GL扩展
     */
    class GLExtension {
        ANGLE_instanced_arrays: ANGLE_instanced_arrays;
        EXT_blend_minmax: EXT_blend_minmax;
        EXT_color_buffer_half_float: any;
        EXT_frag_depth: EXT_frag_depth;
        EXT_sRGB: EXT_sRGB;
        EXT_shader_texture_lod: EXT_shader_texture_lod;
        EXT_texture_filter_anisotropic: EXT_texture_filter_anisotropic;
        OES_element_index_uint: OES_element_index_uint;
        OES_standard_derivatives: OES_standard_derivatives;
        OES_texture_float: OES_texture_float;
        OES_texture_float_linear: OES_texture_float_linear;
        OES_texture_half_float: OES_texture_half_float;
        OES_texture_half_float_linear: OES_texture_half_float_linear;
        OES_vertex_array_object: OES_vertex_array_object;
        WEBGL_color_buffer_float: WEBGL_color_buffer_float;
        WEBGL_compressed_texture_atc: any;
        WEBGL_compressed_texture_etc1: any;
        WEBGL_compressed_texture_pvrtc: any;
        WEBGL_compressed_texture_s3tc: WEBGL_compressed_texture_s3tc;
        WEBGL_debug_renderer_info: WEBGL_debug_renderer_info;
        WEBGL_debug_shaders: WEBGL_debug_shaders;
        WEBGL_depth_texture: WEBGL_depth_texture;
        WEBGL_draw_buffers: WEBGL_draw_buffers;
        WEBGL_lose_context: any;
        constructor(gl: GL);
        private initExtensions;
        /**
         * 缓存GL查询
         * @param gl GL实例
         */
        private cacheGLQuery;
        private wrap;
    }
}
declare namespace feng3d {
    /**
     * WEBGL 支持功能
     *
     * @see https://webglreport.com
     * @see http://html5test.com
     */
    class GLCapabilities {
        /**
         * 是否为 WebGL2
         */
        isWebGL2: boolean;
        /**
         * 纹理各向异性过滤最大值
         */
        maxAnisotropy: number;
        /**
         * 支持最大纹理数量
         */
        maxTextures: number;
        /**
         * 支持最大顶点纹理数量
         */
        maxVertexTextures: number;
        /**
         * 支持最大纹理尺寸
         */
        maxTextureSize: number;
        /**
         * 支持最大立方体贴图尺寸
         */
        maxCubemapSize: number;
        /**
         * 支持属性数量
         */
        maxAttributes: number;
        /**
         * 顶点着色器支持最大 Uniform 数量
         */
        maxVertexUniforms: number;
        /**
         * 支持最大shader之间传递的变量数
         */
        maxVaryings: number;
        /**
         * 片段着色器支持最大 Uniform 数量
         */
        maxFragmentUniforms: number;
        /**
         * 是否支持顶点纹理
         */
        vertexTextures: boolean;
        /**
         * 是否支持浮点类型片段着色器纹理
         */
        floatFragmentTextures: boolean;
        /**
         * 是否支持浮点类型顶点着色器纹理
         */
        floatVertexTextures: boolean;
        /**
         * Shader中支持浮点类型的最高精度
         */
        maxPrecision: "highp" | "mediump" | "lowp";
        /**
         *
         */
        maxSamples: number;
        constructor(gl: GL);
    }
}
declare namespace feng3d {
    type LazyUniforms = LazyObject<Uniforms>;
    interface Uniforms {
    }
}
declare namespace feng3d {
    /**
     * shader
     */
    class Shader {
        /**
         * shader 中的 宏
         */
        shaderMacro: ShaderMacro;
        constructor(shaderName?: string);
        setShader(vertex: string, fragment: string): void;
        /**
         * 激活渲染程序
         */
        activeShaderProgram(gl: GL): CompileShaderResult;
        /**
         * 着色器名称
         */
        private shaderName;
        /**
         * 顶点着色器代码
         */
        private vertex;
        /**
         * 片段着色器代码
         */
        private fragment;
        /**
         * 更新渲染代码
         */
        private updateShaderCode;
        /**
         * 编译着色器代码
         * @param gl GL上下文
         * @param type 着色器类型
         * @param code 着色器代码
         * @return 编译后的着色器对象
         */
        private compileShaderCode;
        private createLinkProgram;
        private compileShaderProgram;
        private getMacroCode;
    }
    interface CompileShaderResult {
        program: WebGLProgram;
        vertex: WebGLShader;
        fragment: WebGLShader;
        /**
         * 属性信息列表
         */
        attributes: {
            [name: string]: AttributeInfo;
        };
        /**
         * uniform信息列表
         */
        uniforms: {
            [name: string]: UniformInfo;
        };
    }
    /**
     * WebGL渲染程序有效信息
     */
    interface UniformInfo {
        /**
         * uniform名称
         */
        name: string;
        size: number;
        type: number;
        /**
         * uniform地址
         */
        location: WebGLUniformLocation;
        /**
         * texture索引
         */
        textureID: number;
        /**
         * Uniform数组索引，当Uniform数据为数组数据时生效
         */
        paths: string[];
    }
    interface AttributeInfo {
        /**
         * 名称
         */
        name: string;
        size: number;
        type: number;
        /**
         * 属性地址
         */
        location: number;
    }
}
declare namespace feng3d {
    /**
     * 渲染参数
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
         * 混合方式，默认BlendEquation.FUNC_ADD
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
        depthFunc: DepthFunc;
        /**
         * 是否开启深度标记
         */
        depthMask: boolean;
        /**
         * 控制那些颜色分量是否可以被写入到帧缓冲器。
         *
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/colorMask
         */
        colorMask: ColorMask;
        /**
         * 绘制在画布上的区域
         */
        viewRect: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        /**
         * 是否使用 viewRect
         */
        useViewRect: boolean;
        /**
         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/polygonOffset
         *
         * The WebGLRenderingContext.polygonOffset() method of the WebGL API specifies the scale factors and units to calculate depth values.
         *
         * The offset is added before the depth test is performed and before the value is written into the depth buffer.
         */
        usePolygonOffset: boolean;
        /**
         * A GLfloat which sets the scale factor for the variable depth offset for each polygon. The default value is 0.
         */
        polygonOffsetFactor: number;
        /**
         * A GLfloat which sets the multiplier by which an implementation-specific value is multiplied with to create a constant depth offset. The default value is 0.
         */
        polygonOffsetUnits: number;
        constructor(raw?: Partial<RenderParams>);
    }
    interface RenderParams {
        viewRect: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    }
}
declare namespace feng3d {
    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     */
    class RenderAtomic {
        /**
         * 下一个结点
         */
        next: RenderAtomic;
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
         * shader 中的 宏
         */
        shaderMacro: ShaderMacro;
        /**
         * 渲染参数
         */
        renderParams: Partial<RenderParams>;
        getIndexBuffer(): Index;
        getAttributes(attributes?: Attributes): Attributes;
        getAttributeByKey(key: string): Attribute;
        getUniforms(uniforms?: LazyUniforms): LazyObject<Uniforms>;
        getUniformByKey(key: string): Uniforms;
        getInstanceCount(): number;
        getShader(): Shader;
        getRenderParams(renderParams?: RenderParams): RenderParams;
        getShaderMacro(shaderMacro?: ShaderMacro): ShaderMacro;
    }
    interface RenderAtomicData {
        shader: Shader;
        attributes: {
            [name: string]: Attribute;
        };
        uniforms: {
            [name: string]: Uniforms;
        };
        renderParams: RenderParams;
        indexBuffer: Index;
        instanceCount: number;
    }
}
declare namespace feng3d {
    /**
     * 索引渲染数据

     */
    class Index {
        /**
         * 索引数据
         */
        indices: number[];
        constructor(indices?: number[]);
        invalidate(): void;
        /**
         * 渲染数量
         */
        get count(): number;
        /**
         * 数据类型，gl.UNSIGNED_BYTE、gl.UNSIGNED_SHORT
         */
        type: GLArrayType;
        /**
         * 索引偏移
         */
        offset: number;
        /**
         * 是否失效
         */
        private _invalid;
        /**
         * 激活缓冲
         * @param gl
         */
        static active(gl: GL, index: Index): void;
        /**
         * 获取缓冲
         */
        static getBuffer(gl: GL, index: Index): WebGLBuffer;
        /**
         * 清理缓冲
         */
        static clear(index: Index): void;
    }
}
declare namespace feng3d {
    /**
     * 属性渲染数据
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
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
        constructor(name: string, data: number[], size?: number, divisor?: number);
        /**
         * 使数据失效
         */
        invalidate(): void;
        /**
         *
         * @param gl
         * @param location A GLuint specifying the index of the vertex attribute that is to be modified.
         */
        static active(gl: GL, location: number, attribute: Attribute): void;
        /**
         * 获取缓冲
         */
        static getBuffer(gl: GL, attribute: Attribute): WebGLBuffer;
        /**
         * 清理缓冲
         */
        static clear(attribute: Attribute): void;
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
        a_skinIndices: Attribute;
        /**
         * 关节权重
         */
        a_skinWeights: Attribute;
        /**
         * 关节索引
         */
        a_skinIndices1: Attribute;
        /**
         * 关节权重
         */
        a_skinWeights1: Attribute;
    }
}
declare namespace feng3d {
    interface Texture {
        /**
         * 纹理类型
         */
        textureType: TextureType;
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
         * 当前使用的贴图数据
         */
        activePixels: TexImageSource | TexImageSource[];
        /**
         * 是否为渲染目标纹理
         */
        isRenderTarget: boolean;
        OFFSCREEN_WIDTH: number;
        OFFSCREEN_HEIGHT: number;
        /**
         * 是否失效，值为true时重新创建 WebGLTexture
         */
        invalid: boolean;
    }
    class Texture {
        static active(gl: GL, data: Texture): WebGLTexture;
        /**
         * 获取顶点属性缓冲
         * @param data  数据
         */
        static getTexture(gl: GL, data: Texture): WebGLTexture;
        /**
         * 清除纹理
         *
         * @param data
         */
        static clear(data: Texture): void;
    }
}
declare namespace feng3d {
    class FrameBuffer {
        /**
         * 是否失效
         */
        private _invalid;
        static active(gl: GL, frameBuffer: FrameBuffer): WebGLFramebuffer;
        /**
         * 清理缓存
         */
        static clear(frameBuffer: FrameBuffer): void;
    }
}
declare namespace feng3d {
    class RenderBuffer {
        OFFSCREEN_WIDTH: number;
        OFFSCREEN_HEIGHT: number;
        /**
         * 是否失效
         */
        private _invalid;
        /**
         * 使失效
         */
        protected invalidate(): void;
        /**
         * 激活
         * @param gl
         */
        static active(gl: GL, renderBuffer: RenderBuffer): WebGLBuffer;
        /**
         * 清理纹理
         */
        static clear(renderBuffer: RenderBuffer): void;
    }
}
declare namespace feng3d {
    /**
     * 着色器代码宏工具
     */
    var shaderMacroUtils: ShaderMacroUtils;
    class ShaderMacroUtils {
        /**
         * 从着色器代码中获取宏变量列表
         * @param vertex
         * @param fragment
         */
        getMacroVariablesFromShaderCode(vertex: string, fragment: string): string[];
        /**
         * 从着色器代码中获取宏变量列表
         * @param code
         */
        getMacroVariablesFromCode(code: string): string[];
    }
}
declare namespace feng3d {
    /**
     * 着色器宏定义
     */
    interface ShaderMacro {
        /**
         * UV中的U缩放
         */
        SCALEU: number;
        /**
         * UV中的V放
         */
        SCALEV: number;
        /**
         * 光源数量
         */
        NUM_LIGHT: number;
        /**
         * 点光源数量
         */
        NUM_POINTLIGHT: number;
        /**
         * 方向光源数量
         */
        NUM_DIRECTIONALLIGHT: number;
        /**
         * 生成投影的方向光源数量
         */
        NUM_DIRECTIONALLIGHT_CASTSHADOW: number;
        /**
         * 生成投影的点光源数量
         */
        NUM_POINTLIGHT_CASTSHADOW: number;
        /**
         * 聚光灯光源数量
         */
        NUM_SPOT_LIGHTS: number;
        /**
         * 生成投影的聚光灯光源数量
         */
        NUM_SPOT_LIGHTS_CASTSHADOW: number;
        /**
         * 骨骼关节数量
         */
        NUM_SKELETONJOINT: number;
        /**
         *
         */
        RotationOrder: number;
        /**
         * 是否有漫反射贴图
         */
        HAS_DIFFUSE_SAMPLER: boolean;
        /**
         * 是否有法线贴图
         */
        HAS_NORMAL_SAMPLER: boolean;
        /**
         * 是否有镜面反射光泽图
         */
        HAS_SPECULAR_SAMPLER: boolean;
        /**
         * 是否有环境贴图
         */
        HAS_AMBIENT_SAMPLER: boolean;
        /**
         * 是否有骨骼动画
         */
        HAS_SKELETON_ANIMATION: boolean;
        /**
         * 是否有粒子动画
         */
        HAS_PARTICLE_ANIMATOR: boolean;
        /**
         * 是否为点渲染模式
         */
        IS_POINTS_MODE: boolean;
        /**
         * 是否有地形方法
         */
        HAS_TERRAIN_METHOD: boolean;
        /**
         * 使用合并地形贴图
         */
        USE_TERRAIN_MERGE: boolean;
        /**
         * 环境映射函数
         */
        HAS_ENV_METHOD: boolean;
        /**
         * 是否卡通渲染
         */
        IS_CARTOON: Boolean;
        /**
         * 是否抗锯齿
         */
        cartoon_Anti_aliasing: Boolean;
        /**
         * 是否启用粒子系统纹理表动画模块
         */
        ENABLED_PARTICLE_SYSTEM_textureSheetAnimation: Boolean;
        /**
         * 是否有颜色顶点数据
         */
        HAS_a_color: Boolean;
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
                cls?: new (...arg: any[]) => any;
                renderParams?: Partial<RenderParams>;
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

     */
    class ShaderLib {
        get shaderConfig(): ShaderConfig;
        set shaderConfig(v: ShaderConfig);
        private _shaderConfig;
        private _shaderCache;
        /**
         * 获取shaderCode
         */
        getShader(shaderName: string): {
            vertex: string;
            fragment: string;
            vertexMacroVariables: string[];
            fragmentMacroVariables: string[];
        };
        /**
         * 展开 include
         */
        uninclude(shaderCode: string): string;
        /**
         * 获取shader列表
         */
        getShaderNames(): string[];
        /**
         * 清除缓存
         */
        clearCache(): void;
    }
}
declare namespace feng3d {
    /**
     * WEBGL 渲染器
     *
     * 所有渲染都由该渲染器执行
     */
    class WebGLRenderer {
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
     * 添加组件菜单
     *
     * 在组件类上新增 @feng3d.AddComponentMenu("UI/Text") 可以把该组件添加到组件菜单上。
     *
     * @param path 组件菜单中路径
     * @param componentOrder 组件菜单中组件的顺序(从低到高)。
     */
    function AddComponentMenu(path: string, componentOrder?: number): (target: Constructor<Components>) => void;
    /**
     * 菜单配置
     */
    const menuConfig: MenuConfig;
    /**
     * 菜单配置
     */
    interface MenuConfig {
        /**
         * 组件菜单
         */
        component?: ComponentMenu[];
    }
    /**
     * 组件菜单
     */
    interface ComponentMenu {
        /**
         * 组件菜单中路径
         */
        path: string;
        /**
         * 组件菜单中组件的顺序(从低到高)。
         */
        order: number;
        /**
         * 组件类定义
         */
        type: ComponentNames;
    }
}
declare namespace feng3d {
    /**
     * 全局事件
     */
    var globalDispatcher: IEventDispatcher<GlobalEvents>;
    /**
     * 事件列表
     */
    interface GlobalEvents {
        /**
         * shader资源发生变化
         */
        "asset.shaderChanged": any;
        /**
         * 脚本发生变化
         */
        "asset.scriptChanged": any;
        /**
         * 图片资源发生变化
         */
        "asset.imageAssetChanged": {
            url: string;
        };
        /**
         * 解析出资源
         */
        "asset.parsed": any;
        /**
         * 删除文件
         */
        "fs.delete": string;
        /**
         * 写文件
         */
        "fs.write": string;
    }
}
declare namespace feng3d {
}
declare namespace feng3d {
    /**
     * 函数经
     *
     * 包装函数，以及对应的拆包
     */
    class FunctionWrap {
        /**
         * 扩展继承函数
         *
         * 可用于扩展原型中原有API中的实现
         *
         * ```
        class A
        {
            a = "a";

            f(p: string = "p", p1: string = "")
            {
                return p + p1;
            }

            extendF: (p?: string, p1?: string) => string;
            oldf: (p?: string, p1?: string) => string;
        }

        var a = new A();
        a.oldf = a.f;
        a.extendF = function (p: string = "p", p1: string = "")
        {
            return ["polyfill", this.a, this.oldf()].join("-")
        }
        feng3d.functionwrap.extendFunction(a, "f", function (r)
        {
            return ["polyfill", this.a, r].join("-");
        });
        // 验证 被扩展的a.f方法是否等价于 a.extendF
        assert.ok(a.f() == a.extendF()); //true
        
         * ```
         *
         * @param object 被扩展函数所属对象或者原型
         * @param funcName 被扩展函数名称
         * @param extendFunc 在函数执行后执行的扩展函数
         */
        extendFunction<T, K extends FunctionPropertyNames<T>, V extends T[K]>(object: T, funcName: K, extendFunc: (this: T, r: ReturnType<V>, ...ps: Parameters<V>) => ReturnType<V>): void;
        /**
         * 包装函数
         *
         * 一般用于调试
         * 使用场景示例：
         * 1. 在函数执行前后记录时间来计算函数执行时间。
         * 1. 在console.error调用前使用 debugger 进行断点调试。
         *
         * @param object 函数所属对象或者原型
         * @param funcName 函数名称
         * @param beforeFunc 在函数执行前执行的函数
         * @param afterFunc 在函数执行后执行的函数
         */
        wrap<T, K extends FunctionPropertyNames<T>, F extends T[K]>(object: T, funcName: K, beforeFunc?: F, afterFunc?: F): void;
        /**
         * 取消包装函数
         *
         * 与wrap函数对应
         *
         * @param object 函数所属对象或者原型
         * @param funcName 函数名称
         * @param wrapFunc 在函数执行前执行的函数
         * @param before 运行在原函数之前
         */
        unwrap<T, K extends FunctionPropertyNames<T>, V extends T[K]>(object: T, funcName: K, wrapFunc?: V): void;
        /**
         * 包装一个异步函数，使其避免重复执行
         *
         * 使用场景示例：同时加载同一资源时，使其只加载一次，完成后调用所有相关回调函数。
         *
         * @param funcHost 函数所属对象
         * @param func 函数
         * @param params 函数除callback外的参数列表
         * @param callback 完成回调函数
         */
        wrapAsyncFunc(funcHost: Object, func: Function, params: any[], callback: (...args: any[]) => void): void;
        private _wrapFResult;
        private _state;
    }
    const __functionwrap__ = "__functionwrap__";
    const functionwrap: FunctionWrap;
}
declare namespace feng3d {
    /**
     * 通用唯一标识符（Universally Unique Identifier）
     *
     * 用于给所有对象分配一个通用唯一标识符
     */
    class Uuid {
        /**
         * 获取数组 通用唯一标识符
         *
         * @param arr 数组
         * @param separator 分割符
         */
        getArrayUuid(arr: any[], separator?: string): string;
        /**
         * 获取对象 通用唯一标识符
         *
         * 当参数object非Object对象时强制转换为字符串返回
         *
         * @param object 对象
         */
        getObjectUuid(object: Object): any;
        objectUuid: WeakMap<Object, string>;
    }
    const __uuid__ = "__uuid__";
    const uuid: Uuid;
}
declare namespace feng3d {
    /**
     * 调试工具
     */
    var debug: Debug;
    /**
     * 是否开启调试
     */
    var debuger: boolean;
    /**
     * 调试工具
     */
    class Debug {
        constructor();
        /**
         * 测试代码运行时间
         * @param fn 被测试的方法
         * @param labal 标签
         */
        time(fn: Function, labal?: string): void;
    }
}
declare namespace feng3d {
    interface OAVComponentParamMap {
        OAVDefault: OAVDefaultParam;
        OAVArray: OAVArrayParam;
        OAVPick: OAVPickParam;
        OAVEnum: OAVEnumParam;
        OAVCubeMap: {
            component: "OAVCubeMap";
            componentParam: Object;
        };
        OAVImage: {
            component: "OAVImage";
            componentParam: Object;
        };
        OAVObjectView: {
            component: "OAVObjectView";
            componentParam: Object;
        };
        OAVParticleComponentList: {
            component: "OAVParticleComponentList";
            componentParam: Object;
        };
        OAVComponentList: {
            component: "OAVComponentList";
            componentParam: Object;
        };
        OAVGameObjectName: {
            component: "OAVGameObjectName";
            componentParam: Object;
        };
        OAVMaterialName: {
            component: "OAVMaterialName";
            componentParam: Object;
        };
        OAVMultiText: {
            component: "OAVMultiText";
            componentParam: Object;
        };
        OAVFeng3dPreView: {
            component: "OAVFeng3dPreView";
            componentParam: Object;
        };
        OAVAccordionObjectView: {
            component: "OAVAccordionObjectView";
            componentParam: Object;
        };
        OAVVector3: OAVVector3Param;
    }
    /**
     * OAVVector3 组件参数
     */
    interface OAVVector3Param {
        component: "OAVVector3";
        componentParam: {
            label?: string;
            /**
             * 步长，精度
             */
            step?: number;
            /**
             * 按下上下方向键时增加的步长数量
             */
            stepDownup?: number;
            /**
             * 移动一个像素时增加的步长数量
             */
            stepScale?: number;
            /**
             * 最小值
             */
            minValue?: number;
            /**
             * 最小值
             */
            maxValue?: number;
            editable?: boolean;
        };
    }
    /**
     * OAVDefault 组件参数
     */
    interface OAVDefaultParam {
        component: "OAVDefault";
        componentParam: {
            /**
             * 拾取参数
             */
            dragparam?: {
                /**
                 * 可接受数据类型
                 */
                accepttype: string;
                /**
                 * 提供数据类型
                 */
                datatype?: string;
            };
        };
    }
    /**
     * OAVArray 组件参数
     */
    interface OAVArrayParam {
        component: "OAVArray";
        componentParam: {
            /**
             * 拾取参数
             */
            dragparam?: {
                /**
                 * 可接受数据类型
                 */
                accepttype: string;
                /**
                 * 提供数据类型
                 */
                datatype?: string;
            };
            /**
             * 添加item时默认数据，赋值 ()=>any
             */
            defaultItem: any;
        };
    }
    /**
     * OAVPick 组件参数
     */
    interface OAVPickParam {
        component: "OAVPick";
        componentParam: {
            /**
             * 可接受数据类型
             */
            accepttype: string;
            /**
             * 提供数据类型
             */
            datatype?: string;
        };
    }
    /**
     * OAVEnum 组件参数
     */
    interface OAVEnumParam {
        component: "OAVEnum";
        componentParam: {
            /**
             * 枚举类型
             */
            enumClass: any;
        };
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
         * 下一帧执行方法
         * @param func  执行方法
         * @param thisObject    方法this指针
         * @param priority      执行优先级
         */
        nextframe(func: (interval: number) => void, thisObject?: Object, priority?: number): this;
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
        private runfunc;
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
        arrayBufferToBlob(arrayBuffer: ArrayBuffer): Blob;
        /**
         * ArrayBuffer to Uint8
         * Uint8数组可以直观的看到ArrayBuffer中每个字节（1字节 == 8位）的值。一般我们要将ArrayBuffer转成Uint类型数组后才能对其中的字节进行存取操作。
         */
        arrayBufferToUint8(arrayBuffer: ArrayBuffer): Uint8Array;
        /**
         * Uint8 to ArrayBuffer
         * 我们Uint8数组可以直观的看到ArrayBuffer中每个字节（1字节 == 8位）的值。一般我们要将ArrayBuffer转成Uint类型数组后才能对其中的字节进行存取操作。
         */
        uint8ToArrayBuffer(uint8Array: Uint8Array): ArrayBuffer;
        /**
         * Array to ArrayBuffer
         * @param array 例如：[0x15, 0xFF, 0x01, 0x00, 0x34, 0xAB, 0x11];
         */
        arrayToArrayBuffer(array: number[]): ArrayBuffer;
        /**
         * TypeArray to Array
         */
        uint8ArrayToArray(u8a: Uint8Array): number[];
        /**
         * canvas转换为dataURL
         */
        canvasToDataURL(canvas: HTMLCanvasElement, type?: "png" | "jpeg", quality?: number): string;
        /**
         * canvas转换为图片
         */
        canvasToImage(canvas: HTMLCanvasElement, type: "png" | "jpeg", quality: number, callback: (img: HTMLImageElement) => void): void;
        /**
         * File、Blob对象转换为dataURL
         * File对象也是一个Blob对象，二者的处理相同。
         */
        blobToDataURL(blob: Blob, callback: (dataurl: string) => void): void;
        /**
         * dataURL转换为Blob对象
         */
        dataURLtoBlob(dataurl: string): Blob;
        /**
         * dataURL图片数据转换为HTMLImageElement
         * dataURL图片数据绘制到canvas
         * 先构造Image对象，src为dataURL，图片onload之后绘制到canvas
         */
        dataURLDrawCanvas(dataurl: string, canvas: HTMLCanvasElement, callback: (img: HTMLImageElement) => void): void;
        dataURLToArrayBuffer(dataurl: string, callback: (arraybuffer: ArrayBuffer) => void): void;
        arrayBufferToDataURL(arrayBuffer: ArrayBuffer, callback: (dataurl: string) => void): void;
        dataURLToImage(dataurl: string, callback: (img: HTMLImageElement) => void): void;
        imageToDataURL(img: HTMLImageElement, quality?: number): string;
        imageToCanvas(img: HTMLImageElement): HTMLCanvasElement;
        imageToArrayBuffer(img: HTMLImageElement, callback: (arraybuffer: ArrayBuffer) => void): void;
        imageDataToDataURL(imageData: ImageData, quality?: number): string;
        imageDataToCanvas(imageData: ImageData): HTMLCanvasElement;
        imagedataToImage(imageData: ImageData, quality: number, callback: (img: HTMLImageElement) => void): void;
        arrayBufferToImage(arrayBuffer: ArrayBuffer, callback: (img: HTMLImageElement) => void): void;
        blobToText(blob: Blob, callback: (content: string) => void): void;
        stringToArrayBuffer(str: string): ArrayBuffer;
        arrayBufferToString(arrayBuffer: ArrayBuffer, callback: (content: string) => void): void;
        /**
         * ArrayBuffer 转换为 对象
         *
         * @param arrayBuffer
         * @param callback
         */
        arrayBufferToObject(arrayBuffer: ArrayBuffer, callback: (object: Object) => void): void;
        stringToUint8Array(str: string): Uint8Array;
        uint8ArrayToString(arr: Uint8Array, callback: (str: string) => void): void;
    }
}
declare namespace feng3d {
    /**
     * 图片相关工具
     */
    class ImageUtil {
        imageData: ImageData;
        /**
         * 获取图片数据
         * @param image 加载完成的图片元素
         */
        static fromImage(image: HTMLImageElement): ImageUtil;
        /**
         * 创建ImageData
         * @param width 数据宽度
         * @param height 数据高度
         * @param fillcolor 填充颜色
         */
        constructor(width?: number, height?: number, fillcolor?: Color4);
        /**
         * 初始化
         * @param width 宽度
         * @param height 高度
         * @param fillcolor 填充颜色
         */
        init(width?: number, height?: number, fillcolor?: Color4): void;
        /**
         * 获取图片数据
         * @param image 加载完成的图片元素
         */
        fromImage(image: HTMLImageElement): this;
        /**
         * 绘制图片数据指定位置颜色
         * @param x 图片数据x坐标
         * @param y 图片数据y坐标
         * @param color 颜色值
         */
        drawPixel(x: number, y: number, color: Color4): this;
        /**
         * 获取图片指定位置颜色值
         * @param x 图片数据x坐标
         * @param y 图片数据y坐标
         */
        getPixel(x: number, y: number): Color4;
        /**
         * 设置指定位置颜色值
         * @param imageData 图片数据
         * @param x 图片数据x坐标
         * @param y 图片数据y坐标
         * @param color 颜色值
         */
        setPixel(x: number, y: number, color: Color4): this;
        /**
         * 清理图片数据
         * @param clearColor 清理时填充颜色
         */
        clear(clearColor?: Color4): void;
        /**
         * 填充矩形
         * @param rect 填充的矩形
         * @param fillcolor 填充颜色
         */
        fillRect(rect: Rectangle, fillcolor?: Color4): void;
        /**
         * 绘制线条
         * @param start 起始坐标
         * @param end 终止坐标
         * @param color 线条颜色
         */
        drawLine(start: Vector2, end: Vector2, color: Color4): this;
        /**
         * 绘制点
         * @param x x坐标
         * @param y y坐标
         * @param color 颜色
         * @param size 尺寸
         */
        drawPoint(x: number, y: number, color: Color4, size?: number): this;
        /**
         * 绘制图片数据
         * @param imageData 图片数据
         * @param x x坐标
         * @param y y坐标
         */
        drawImageData(imageData: ImageData, x: number, y: number): this;
        /**
         * 转换为DataUrl字符串数据
         */
        toDataURL(): string;
        /**
         * 创建默认粒子贴图
         * @param size 尺寸
         */
        drawDefaultParticle(size?: number): this;
        /**
         * 创建颜色拾取矩形
         * @param color 基色
         * @param width 宽度
         * @param height 高度
         */
        drawColorPickerRect(color: number): this;
        drawColorRect(color: Color4): this;
        /**
         *
         * @param gradient
         * @param dirw true为横向条带，否则纵向条带
         */
        drawMinMaxGradient(gradient: Gradient, dirw?: boolean): this;
        /**
         * 绘制曲线
         * @param curve 曲线
         * @param between0And1 是否显示值在[0,1]区间，否则[-1,1]区间
         * @param color 曲线颜色
         */
        drawCurve(curve: AnimationCurve, between0And1: boolean, color: Color4, rect?: any): this;
        /**
         * 绘制双曲线
         * @param curve 曲线
         * @param curve1 曲线
         * @param between0And1  是否显示值在[0,1]区间，否则[-1,1]区间
         * @param curveColor 颜色
         */
        drawBetweenTwoCurves(curve: AnimationCurve, curve1: AnimationCurve, between0And1: boolean, curveColor?: Color4, fillcolor?: Color4, rect?: any): this;
        /**
         * 清理背景颜色，目前仅用于特定的抠图，例如 editor\resource\assets\3d\terrain\terrain_brushes.png
         * @param backColor 背景颜色
         */
        clearBackColor(backColor: Color4): void;
    }
}
/**
 * @author mrdoob / http://mrdoob.com/
 */
interface Performance {
    memory: any;
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
    /**
     * 路径
     *
     * 从nodeJs的path移植
     *
     * @see http://nodejs.cn/api/path.html
     * @see https://github.com/nodejs/node/blob/master/lib/path.js
     */
    var path: Path;
    /**
     * 路径
     */
    interface Path {
        /**
         * 规范化字符串路径，减少'.'和'.'的部分。当发现多个斜杠时，它们被单个斜杠替换;当路径包含尾部斜杠时，它将被保留。在Windows上使用反斜杠。
         *
         * @param p 要规范化的字符串路径。
         */
        normalize(p: string): string;
        /**
         * 将所有参数连接在一起，并规范化生成的路径。参数必须是字符串。在v0.8中，非字符串参数被悄悄地忽略。在v0.10及以上版本中，会抛出异常。
         *
         * @param paths 用于连接的路径列表
         */
        join(...paths: string[]): string;
        /**
         * 最右边的参数被认为是{to}。其他参数被认为是{from}的数组。
         *
         * 从最左边的{from}参数开始，将{to}解析为一个绝对路径。
         *
         * 如果{to}还不是绝对的，则{from}参数将按从右到左的顺序预先设置，直到找到绝对路径为止。如果在使用所有{from}路径之后仍然没有找到绝对路径，则还将使用当前工作目录。得到的路径是规范化的，除非路径被解析到根目录，否则尾部斜杠将被删除。
         *
         * @param pathSegments 要连接的字符串路径。非字符串参数将被忽略。
         */
        resolve(...pathSegments: string[]): string;
        /**
         * 确定{path}是否是一个绝对路径。无论工作目录如何，绝对路径总是解析到相同的位置。
         *
         * @param path 用于测试的路径。
         */
        isAbsolute(path: string): boolean;
        /**
         * 解决从{from}到{to}的相对路径。有时我们有两条绝对路径，我们需要推导出一条到另一条的相对路径。这实际上是path.resolve的逆变换。
         *
         * @param from 起始路径
         * @param to 目标路径
         */
        relative(from: string, to: string): string;
        /**
         * 返回路径的目录名。类似于Unix的dirname命令。
         *
         * @param p 求值的路径。
         */
        dirname(p: string): string;
        /**
         * 返回路径的最后一部分。类似于Unix basename命令。通常用于从完全限定的路径中提取文件名。
         *
         * @param p 求值的路径。
         * @param ext 可选地，从结果中删除的扩展。
         */
        basename(p: string, ext?: string): string;
        /**
         * 返回路径的扩展名，在路径的最后一部分从最后一个'.'到字符串末尾。如果在路径的最后部分没有'.'或者最后一个字符时'.'则返回一个空字符串。
         *
         * @param p 求值的路径。
         */
        extname(p: string): string;
        /**
         * 特定平台的文件分隔符。'\\'或'/'。
         */
        sep: '\\' | '/';
        /**
         * 特定平台的文件分隔符。 ';' 或者 ':'.
         */
        delimiter: ';' | ':';
        /**
         * 从路径字符串返回一个对象 —— 与format()相反。
         *
         * @param pathString 路径字符串。
         */
        parse(pathString: string): ParsedPath;
        /**
         * 从对象返回路径字符串——与parse()相反。
         *
         * @param pathObject 路径对象。
         */
        format(pathObject: FormatInputPathObject): string;
        win32: Path;
        posix: Path;
    }
    /**
     * 由path.parse()生成或由path.format()使用的已解析路径对象。
     */
    interface ParsedPath {
        /**
         * 路径的根，如'/'或'c:\'
         */
        root: string;
        /**
         * 完整的目录路径，如'/home/user/dir'或'c:\path\dir'
         */
        dir: string;
        /**
         * 包含扩展名(如有)的文件名，如'index.html'
         */
        base: string;
        /**
         * 文件扩展名(如果有)，如'.html'
         */
        ext: string;
        /**
         * 没有扩展名(如果有)的文件名，如'index'
         */
        name: string;
    }
    interface FormatInputPathObject {
        /**
         * 路径的根，如'/'或'c:\'
         */
        root?: string;
        /**
         * 完整的目录路径，如'/home/user/dir'或'c:\path\dir'
         */
        dir?: string;
        /**
         * 包含扩展名(如有)的文件名，如'index.html'
         */
        base?: string;
        /**
         * 文件扩展名(如果有)，如'.html'
         */
        ext?: string;
        /**
         * 没有扩展名(如果有)的文件名，如'index'
         */
        name?: string;
    }
}
declare namespace feng3d {
    /**
     * 常用正则表示式
     */
    var regExps: RegExps;
    /**
     * 常用正则表示式
     */
    class RegExps {
        /**
         * json文件
         */
        json: RegExp;
        /**
         * 图片
         */
        image: RegExp;
        /**
         * 声音
         */
        audio: RegExp;
        /**
         * 命名空间
         */
        namespace: RegExp;
        /**
         * 类
         */
        classReg: RegExp;
    }
}
declare namespace feng3d {
    /**
     * 对象池
     *
     * 对象池并不能带来性能的提升，反而会严重影响性能。但是在管理内存时可以考虑使用。
     *
     * js虚拟机会在对象没有被引用时自动释放内存，谨慎使用对象池。
     *
     */
    class Pool<T> {
        private _objects;
        private _type;
        constructor(type: Constructor<T>);
        /**
         * 获取对象
         */
        get(): T;
        /**
         * 释放对象
         *
         * @param args 被释放对象列表
         */
        release(...args: T[]): void;
        /**
         * 获取指定数量的对象
         *
         * @param num 数量
         */
        getArray(num: number): T[];
        /**
         * 释放对象
         *
         * @param objects 被释放对象列表
         */
        releaseArray(objects: T[]): void;
    }
}
declare namespace feng3d {
    /**
     * 任务，用于处理任务之间依赖
     */
    export var task: Task;
    /**
     * 任务函数
     */
    export interface TaskFunction {
        /**
         * 函数自身名称
         */
        readonly name?: string;
        /**
         * 函数自身
         */
        (callback: () => void): void;
    }
    /**
     * 任务
     *
     * 处理 异步任务(函数)串联并联执行功能
     */
    class Task {
        /**
         * 并联多个异步函数为一个函数
         *
         * 这些异步函数同时执行
         *
         * @param fns 一组异步函数
         */
        parallel(fns: TaskFunction[]): TaskFunction;
        /**
         * 串联多个异步函数为一个函数
         *
         * 这些异步函数按顺序依次执行，等待前一个异步函数执行完调用回调后才执行下一个异步函数。
         *
         * @param fns 一组异步函数
         */
        series(fns: TaskFunction[]): TaskFunction;
        /**
         * 创建一组并行同类任务，例如同时加载一组资源，并在回调中返回结果数组
         *
         * @param ps 一组参数
         * @param fn 单一任务函数
         * @param done 完成回调
         */
        parallelResults<P, R>(ps: P[], fn: (p: P, callback: (r: R) => void) => void, done: (rs: R[]) => void): void;
        /**
         * 创建一组串联同类任务，例如排序加载一组资源
         *
         * @param ps 一组参数
         * @param fn 单一任务函数
         * @param done 完成回调
         */
        seriesResults<P, R>(ps: P[], fn: (p: P, callback: (r: R) => void) => void, done: (rs: R[]) => void): void;
    }
    export {};
}
declare namespace feng3d {
    /**
     * 所有feng3d对象的基类
     */
    class Feng3dObject extends EventDispatcher implements IDisposable {
        /**
         * 隐藏标记，用于控制是否在层级界面、检查器显示，是否保存
         */
        hideFlags: HideFlags;
        /**
         * 通用唯一标识符（Universally Unique Identifier）
         */
        readonly uuid: string;
        /**
         * 是否已销毁
         */
        readonly disposed: boolean;
        /**
         * 构建
         *
         * 新增不可修改属性 guid
         */
        constructor();
        /**
         * 销毁
         */
        dispose(): void;
        /**
         * 获取对象
         *
         * @param uuid 通用唯一标识符
         */
        static getObject(uuid: string): Feng3dObject;
        /**
         * 获取对象
         *
         * @param type
         */
        static getObjects<T extends Feng3dObject>(type?: Constructor<T>): T[];
        /**
         * 对象库
         */
        private static objectLib;
    }
}
declare namespace feng3d {
    /**
     * 资源数据
     *
     * 该对象可由资源文件中读取，或者保存为资源
     */
    class AssetData extends Feng3dObject {
        /**
         * 资源名称
         */
        get name(): string;
        set name(v: string);
        private _name;
        /**
         * 资源编号
         */
        get assetId(): string;
        set assetId(v: string);
        private _assetId;
        /**
         * 资源类型，由具体对象类型决定
         */
        assetType: AssetType;
        /**
         * 新增资源数据
         *
         * @param assetId 资源编号
         * @param data 资源数据
         */
        static addAssetData<T extends AssetData>(assetId: string, data: T): T;
        /**
         * 删除资源数据
         *
         * @param data 资源数据
         */
        static deleteAssetData(data: AssetData): void;
        static deleteAssetDataById(assetId: string): void;
        private static _delete;
        /**
         * 判断是否为资源数据
         *
         * @param asset 可能的资源数据
         */
        static isAssetData(asset: any): asset is AssetData;
        /**
         * 资源属性标记名称
         */
        private static assetPropertySign;
        /**
         * 序列化
         *
         * @param asset 资源数据
         */
        static serialize(asset: AssetData): any;
        /**
         * 反序列化
         *
         * @param object 资源对象
         */
        static deserialize(object: any): AssetData;
        /**
         * 获取已加载的资源数据
         *
         * @param assetId 资源编号
         */
        static getLoadedAssetData(assetId: string): AssetData;
        /**
         * 获取所有已加载资源数据
         */
        static getAllLoadedAssetDatas(): AssetData[];
        /**
         * 资源与编号对应表
         */
        static assetMap: Map<AssetData, string>;
        /**
         * 编号与资源对应表
         */
        static idAssetMap: Map<string, AssetData>;
    }
}
declare namespace feng3d {
    /**
     * 资源元标签
     */
    interface AssetMeta {
        /**
         * 资源编号
         */
        guid: string;
        /**
         * 修改时间（单位为ms）
         */
        mtimeMs: number;
        /**
         * 创建时间（单位为ms）
         */
        birthtimeMs: number;
        /**
         * 资源类型，由具体对象类型决定；AssetExtension.folder 时为文件夹
         */
        assetType: AssetType;
    }
}
declare namespace feng3d {
    /**
     * 资源扩展名
     */
    enum AssetType {
        /**
         * 文件夹
         */
        folder = "folder",
        /**
         * 音频
         */
        audio = "audio",
        /**
         * ts文件
         */
        ts = "ts",
        /**
         * js文件
         */
        js = "js",
        /**
         * 文本文件
         */
        txt = "txt",
        /**
         * json文件
         */
        json = "json",
        /**
         * OBJ模型资源附带的材质文件
         */
        mtl = "mtl",
        /**
         * OBJ模型文件
         */
        obj = "obj",
        /**
         * MD5模型文件
         */
        md5mesh = "md5mesh",
        /**
         * MD5动画
         */
        md5anim = "md5anim",
        /**
         * 魔兽MDL模型
         */
        mdl = "mdl",
        /**
         * 纹理
         */
        texture = "texture",
        /**
         * 立方体纹理
         */
        texturecube = "texturecube",
        /**
         * 材质
         */
        material = "material",
        /**
         * 几何体
         */
        geometry = "geometry",
        /**
         * 游戏对象
         */
        gameobject = "gameobject",
        /**
         * 场景
         */
        scene = "scene",
        /**
         * 动画
         */
        anim = "anim",
        /**
         * 着色器
         */
        shader = "shader",
        /**
         * 脚本
         */
        script = "script"
    }
}
declare namespace feng3d {
    /**
     * feng3d资源
     */
    abstract class FileAsset {
        /**
         * 资源路径
         */
        assetPath: string;
        /**
         * 资源编号
         */
        assetId: string;
        /**
         * 资源元标签，该对象也用来判断资源是否被加载，值为null表示未加载，否则已加载。
         *
         * 并且该对象还会用于存储主文件无法存储的数据，比如 TextureAsset 中存储了 Texture2D 信息
         */
        meta: AssetMeta;
        /**
         * 资源系统
         *
         * 加载或者创建该资源的资源系统
         */
        rs: ReadWriteRS;
        /**
         * 资源类型，由具体对象类型决定
         */
        assetType: AssetType;
        /**
         * 是否已加载
         */
        isLoaded: boolean;
        /**
         * 是否正在加载中
         */
        isLoading: boolean;
        /**
         * 文件后缀
         */
        get extenson(): string;
        /**
         * 父资源
         */
        get parentAsset(): FolderAsset;
        /**
         * 文件名称
         *
         * 不包含后缀
         */
        get fileName(): string;
        /**
         * 资源对象
         */
        data: AssetData;
        /**
         * 初始化资源
         */
        initAsset(): void;
        /**
         * 获取资源数据
         *
         * @param callback 完成回调，当资源已加载时会立即调用回调，否则在资源加载完成后调用。
         */
        getAssetData(callback?: (result: feng3d.AssetData) => void): AssetData;
        /**
         * 资源已加载时获取资源数据，内部使用
         */
        protected _getAssetData(): AssetData;
        /**
         * 读取资源
         *
         * @param callback 完成回调
         */
        read(callback: (err?: Error) => void): void;
        /**
         * 写入资源
         *
         * @param callback 完成回调
         */
        write(callback?: (err: Error) => void): void;
        /**
         * 删除资源
         *
         * @param callback 完成回调
         */
        delete(callback?: (err?: Error) => void): void;
        /**
         * 读取资源预览图标
         *
         * @param callback 完成回调
         */
        readPreview(callback: (err: Error, image: HTMLImageElement) => void): void;
        /**
         * 读取资源预览图标
         *
         * @param image 预览图
         * @param callback 完成回调
         */
        writePreview(image: HTMLImageElement, callback?: (err: Error) => void): void;
        /**
         * 删除资源预览图标
         *
         * @param callback 完成回调
         */
        deletePreview(callback?: (err: Error) => void): void;
        /**
         * 读取文件
         *
         * @param callback 完成回调
         */
        abstract readFile(callback?: (err: Error) => void): void;
        /**
         * 保存文件
         *
         * @param callback 完成回调
         */
        abstract saveFile(callback?: (err: Error) => void): void;
        /**
         * 删除文件
         *
         * @param callback 完成回调
         */
        protected deleteFile(callback?: (err: Error) => void): void;
        /**
         * 元标签路径
         */
        protected get metaPath(): string;
        /**
         * 读取元标签
         *
         * @param callback 完成回调
         */
        protected readMeta(callback?: (err?: Error) => void): void;
        /**
         * 写元标签
         *
         * @param callback 完成回调
         */
        protected writeMeta(callback?: (err: Error) => void): void;
        /**
         * 删除元标签
         *
         * @param callback 完成回调
         */
        protected deleteMeta(callback?: (err: Error) => void): void;
        /**
         * 预览图
         */
        private _preview;
        /**
         * 预览图路径
         */
        private get previewPath();
    }
}
declare namespace feng3d {
    /**
     * 默认资源系统
     */
    var rs: ReadRS;
    /**
     * 可读资源系统
     */
    class ReadRS {
        /**
         * 文件系统
         */
        get fs(): ReadFS;
        private _fs;
        /**
         * 根资源路径
         */
        get rootPath(): string;
        private _rootPath;
        /**
         * 根资源
         */
        get root(): FolderAsset;
        /**
         * 资源编号映射
         */
        protected _idMap: {
            [id: string]: FileAsset;
        };
        /**
         * 资源路径映射
         */
        protected _pathMap: {
            [path: string]: FileAsset;
        };
        /**
         * 资源树保存路径
         */
        protected resources: string;
        /**
         * 构建可读资源系统
         *
         * @param fs 可读文件系统
         */
        constructor(fs?: ReadFS);
        /**
         * 初始化
         *
         * @param callback 完成回调
         */
        init(callback?: () => void): void;
        /**
         * 新建资源
         *
         * @param cls 资源类定义
         * @param fileName 文件名称
         * @param value 初始数据
         * @param parent 所在文件夹，如果值为null时默认添加到根文件夹中
         * @param callback 完成回调函数
         */
        createAsset<T extends FileAsset>(cls: new () => T, fileName?: string, value?: gPartial<T>, parent?: FolderAsset, callback?: (err: Error, asset: T) => void): void;
        /**
         * 获取有效子文件名称
         *
         * @param parent 父文件夹
         * @param fileName 文件名称
         */
        getValidChildName(parent: FolderAsset, fileName: string): string;
        /**
         * 读取文件为资源对象
         * @param id 资源编号
         * @param callback 读取完成回调
         */
        readAsset(id: string, callback: (err: Error, asset: FileAsset) => void): void;
        /**
         * 读取资源数据
         *
         * @param id 资源编号
         * @param callback 完成回调
         */
        readAssetData(id: string, callback: (err: Error, data: AssetData) => void): void;
        /**
         * 读取资源数据列表
         *
         * @param assetids 资源编号列表
         * @param callback 完成回调
         */
        readAssetDatas(assetids: string[], callback: (err: Error, data: AssetData[]) => void): void;
        /**
         * 获取指定类型资源
         *
         * @param type 资源类型
         */
        getAssetsByType<T extends FileAsset>(type: Constructor<T>): T[];
        /**
         * 获取指定类型资源数据
         *
         * @param type 资源类型
         */
        getLoadedAssetDatasByType<T extends AssetData>(type: Constructor<T>): T[];
        /**
         * 获取指定编号资源
         *
         * @param id 资源编号
         */
        getAssetById(id: string): FileAsset;
        /**
         * 获取指定路径资源
         *
         * @param path 资源路径
         */
        getAssetByPath(path: string): FileAsset;
        /**
         * 获取文件夹内子文件路径列表
         *
         * @param path 路径
         */
        getChildrenPathsByPath(path: string): string[];
        /**
         * 获取文件夹内子文件列表
         *
         * @param path 文件夹路径
         */
        getChildrenAssetByPath(path: string): FileAsset[];
        /**
         * 新增资源
         *
         * @param asset 资源
         */
        addAsset(asset: FileAsset): void;
        /**
         * 获取所有资源编号列表
         */
        getAllIds(): string[];
        /**
         * 获取所有资源路径列表
         */
        getAllPaths(): string[];
        /**
         * 获取所有资源
         */
        getAllAssets(): FileAsset[];
        /**
         * 删除指定编号的资源
         *
         * @param id 资源编号
         */
        deleteAssetById(id: string): void;
        /**
         * 删除指定路径的资源
         *
         * @param path 资源路径
         */
        deleteAssetByPath(path: string): void;
        /**
         * 删除资源
         *
         * @param asset 资源
         */
        deleteAsset0(asset: FileAsset): void;
        /**
         * 获取需要反序列化对象中的资源id列表
         */
        getAssetsWithObject(object: any, assetids?: string[]): string[];
        /**
         * 反序列化包含资源的对象
         *
         * @param object 反序列化的对象
         * @param callback 完成回调
         */
        deserializeWithAssets(object: any, callback: (result: any) => void): void;
    }
}
declare namespace feng3d {
    /**
     * 可读写资源系统
     */
    class ReadWriteRS extends ReadRS {
        /**
         * 文件系统
         */
        fs: ReadWriteFS;
        /**
         * 延迟保存执行函数
         */
        private laterSaveFunc;
        /**
         * 延迟保存，避免多次操作时频繁调用保存
         */
        private laterSave;
        /**
         * 构建可读写资源系统
         *
         * @param fs 可读写文件系统
         */
        constructor(fs?: ReadWriteFS);
        /**
         * 在更改资源结构（新增，移动，删除）时会自动保存
         *
         * @param callback 完成回调
         */
        private save;
        /**
         * 新建资源
         *
         * @param cls 资源类定义
         * @param fileName 文件名称
         * @param value 初始数据
         * @param parent 所在文件夹，如果值为null时默认添加到根文件夹中
         * @param callback 完成回调函数
         */
        createAsset<T extends FileAsset>(cls: new () => T, fileName?: string, value?: gPartial<T>, parent?: FolderAsset, callback?: (err: Error, asset: T) => void): void;
        /**
         * 写（保存）资源
         *
         * @param asset 资源对象
         * @param callback 完成回调
         */
        writeAsset(asset: FileAsset, callback?: (err: Error) => void): void;
        /**
         * 移动资源到指定文件夹
         *
         * @param asset 被移动资源
         * @param folder 目标文件夹
         * @param callback 完成回调
         */
        moveAsset(asset: FileAsset, folder: FolderAsset, callback?: (err: Error) => void): void;
        /**
         * 删除资源
         *
         * @param asset 资源
         * @param callback 完成回调
         */
        deleteAsset(asset: FileAsset, callback?: (err: Error) => void): void;
    }
}
declare namespace feng3d {
    interface Uniforms {
        /**
         * t(单位秒) 是自该初始化开始所经过的时间，4个分量分别是 (t/20, t, t*2, t*3)
         */
        _Time: Vector4;
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
         * 摄像机位置
         */
        u_cameraPos: Vector3;
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
        s_texture: Texture2D;
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
        /**
         * 点光源
         */
        u_pointLights: PointLight[];
        /**
         * 生成投影的点光源
         */
        u_castShadowPointLights: PointLight[];
        /**
         * 点光源阴影图
         */
        u_pointShadowMaps: Texture2D[];
        /**
         * 聚光灯光源
         */
        u_spotLights: SpotLight[];
        /**
         * 生成投影的聚光灯光源
         */
        u_castShadowSpotLights: SpotLight[];
        u_spotShadowMatrix: Matrix4x4[];
        /**
         * 点光源阴影图
         */
        u_spotShadowMaps: Texture2D[];
        /**
         * 方向光源数组
         */
        u_directionalLights: DirectionalLight[];
        /**
         * 生成投影的方向光源
         */
        u_castShadowDirectionalLights: DirectionalLight[];
        /**
         * 方向光源投影矩阵列表
         */
        u_directionalShadowMatrixs: Matrix4x4[];
        /**
         * 方向光源阴影图
         */
        u_directionalShadowMaps: Texture2D[];
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
         * 粒子公告牌矩阵
         */
        u_particle_billboardMatrix: Matrix3x3;
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
        u_lightType: LightType;
        u_lightPosition: Vector3;
        u_shadowCameraNear: number;
        u_shadowCameraFar: number;
    }
}
declare namespace feng3d {
    /**
     * 纹理信息
     */
    abstract class TextureInfo extends AssetData implements Texture {
        /**
         * 纹理类型
         */
        textureType: TextureType;
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
        get wrapS(): TextureWrap.REPEAT | TextureWrap;
        set wrapS(v: TextureWrap);
        private _wrapS;
        /**
         * 表示y轴的纹理回环方式。 magFilter和minFilter表示过滤的方式，这是OpenGL的基本概念，我将在下面讲一下，目前你不用担心它的使用。当您不设置的时候，它会取默认值，所以，我们这里暂时不理睬他。
         */
        get wrapT(): TextureWrap.REPEAT | TextureWrap;
        set wrapT(v: TextureWrap);
        private _wrapT;
        /**
         * 各向异性过滤。使用各向异性过滤能够使纹理的效果更好，但是会消耗更多的内存、CPU、GPU时间。默认为0。
         */
        anisotropy: number;
        invalid: boolean;
        /**
         * 需要使用的贴图数据
         */
        protected _pixels: TexImageSource | TexImageSource[];
        /**
         * 当贴图数据未加载好等情况时代替使用
         */
        noPixels: string | string[];
        /**
         * 当前使用的贴图数据
         */
        protected _activePixels: TexImageSource | TexImageSource[];
        /**
         * 是否为渲染目标纹理
         */
        isRenderTarget: boolean;
        OFFSCREEN_WIDTH: number;
        OFFSCREEN_HEIGHT: number;
        /**
         * 是否为2的幂贴图
         */
        get isPowerOfTwo(): boolean;
        /**
         * 纹理尺寸
         */
        getSize(): Vector2;
        /**
         * 判断数据是否满足渲染需求
         */
        private checkRenderData;
        /**
         * 使纹理失效
         */
        invalidate(): void;
        get activePixels(): HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | ImageBitmap | OffscreenCanvas | ImageData | TexImageSource[];
        /**
         *
         */
        get dataURL(): string;
        private _dataURL;
        private updateActivePixels;
    }
}
declare namespace feng3d {
}
declare namespace feng3d {
    /**
     * 帧缓冲对象
     */
    class FrameBufferObject {
        OFFSCREEN_WIDTH: number;
        OFFSCREEN_HEIGHT: number;
        frameBuffer: FrameBuffer;
        texture: RenderTargetTexture2D;
        depthBuffer: RenderBuffer;
        constructor(width?: number, height?: number);
        static active(gl: GL, frameBufferObject: FrameBufferObject): {
            framebuffer: WebGLFramebuffer;
            texture: WebGLTexture;
            depthBuffer: WebGLRenderbuffer;
        };
        deactive(gl: GL): void;
        /**
         * 是否失效
         */
        private _invalid;
        /**
         * 使失效
         */
        protected invalidate(): void;
        private invalidateSize;
        static clear(frameBufferObject: FrameBufferObject): void;
    }
    interface GLCache {
        /**
         * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
         */
        frameBufferObjects: Map<FrameBufferObject, {
            framebuffer: WebGLFramebuffer;
            texture: WebGLTexture;
            depthBuffer: WebGLRenderbuffer;
        }>;
    }
}
declare namespace feng3d {
    /**
     * 前向渲染器

     */
    var forwardRenderer: ForwardRenderer;
    /**
     * 前向渲染器

     */
    class ForwardRenderer {
        /**
         * 渲染
         */
        draw(gl: GL, scene: Scene, camera: Camera): void;
    }
}
declare namespace feng3d {
    /**
     * 深度渲染器
     */
    class DepthRenderer {
        /**
         * 渲染
         */
        draw(gl: GL, scene: Scene, camera: Camera): void;
    }
}
declare namespace feng3d {
    var mouseRenderer: MouseRenderer;
    /**
     * 鼠标拾取渲染器

     */
    class MouseRenderer extends EventDispatcher {
        private objects;
        /**
         * 渲染
         */
        draw(gl: GL, viewRect: Rectangle): GameObject;
        protected drawRenderables(gl: GL, renderable: Renderable): void;
        /**
         * 绘制3D对象
         */
        protected drawGameObject(gl: GL, renderAtomic: RenderAtomic): void;
    }
}
declare namespace feng3d {
    /**
     * 阴影图渲染器
     */
    var shadowRenderer: ShadowRenderer;
    class ShadowRenderer {
        private renderAtomic;
        /**
         * 渲染
         */
        draw(gl: GL, scene: Scene, camera: Camera): void;
        private drawForSpotLight;
        private drawForPointLight;
        private drawForDirectionalLight;
        /**
         * 绘制3D对象
         */
        private drawGameObject;
    }
    interface RenderAtomic {
        shadowShader: Shader;
    }
}
declare namespace feng3d {
    /**
     * 轮廓渲染器
     */
    var outlineRenderer: OutlineRenderer;
    /**
     * 轮廓渲染器
     */
    class OutlineRenderer {
        renderAtomic: RenderAtomic;
        init(): void;
        draw(gl: GL, scene: Scene, camera: Camera): void;
    }
}
declare namespace feng3d {
    /**
     * 线框渲染器
     */
    var wireframeRenderer: WireframeRenderer;
    class WireframeRenderer {
        private renderAtomic;
        init(): void;
        /**
         * 渲染
         */
        draw(gl: GL, scene: Scene, camera: Camera): void;
        /**
         * 绘制3D对象
         */
        drawGameObject(gl: GL, renderable: Renderable, scene: Scene, camera: Camera, wireframeColor?: Color4): void;
    }
    interface RenderAtomic {
        /**
         * 顶点索引缓冲
         */
        wireframeindexBuffer: Index;
        wireframeShader: Shader;
    }
}
declare namespace feng3d {
    /**
     * 组件名称与类定义映射，由 @RegisterComponent 装饰器进行填充。
     */
    const componentMap: ComponentMap;
    /**
     * 注册组件
     *
     * 使用 @RegisterComponent 在组件类定义上注册组件，配合扩展 ComponentMap 接口后可使用 GameObject.getComponent 等方法。
     *
     * @param component 组件名称，默认使用类名称
     */
    function RegisterComponent(component?: string): (constructor: Function) => void;
    /**
     * 组件名称与类定义映射，新建组件一般都需扩展该接口。
     */
    interface ComponentMap {
        Component: Component;
    }
    type ComponentNames = keyof ComponentMap;
    type Components = ComponentMap[ComponentNames];
    interface Component {
        once<K extends keyof GameObjectEventMap>(type: K, listener: (event: Event<GameObjectEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof GameObjectEventMap>(type: K, data?: GameObjectEventMap[K], bubbles?: boolean): Event<GameObjectEventMap[K]>;
        has<K extends keyof GameObjectEventMap>(type: K): boolean;
        on<K extends keyof GameObjectEventMap>(type: K, listener: (event: Event<GameObjectEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof GameObjectEventMap>(type?: K, listener?: (event: Event<GameObjectEventMap[K]>) => any, thisObject?: any): void;
    }
    /**
     * 组件
     *
     * 所有附加到GameObjects的基类。
     *
     * 注意，您的代码永远不会直接创建组件。相反，你可以编写脚本代码，并将脚本附加到GameObject(游戏物体)上。
     */
    class Component extends Feng3dObject implements IDisposable {
        /**
         * 此组件附加到的游戏对象。组件总是附加到游戏对象上。
         */
        get gameObject(): GameObject;
        /**
         * 标签
         */
        tag: string;
        /**
         * The Transform attached to this GameObject (null if there is none attached).
         */
        get transform(): Transform;
        /**
         * 是否唯一，同类型3D对象组件只允许一个
         */
        get single(): boolean;
        /**
         * 是否已销毁
         */
        get disposed(): boolean;
        private _disposed;
        /**
         * 创建一个组件
         */
        constructor();
        /**
         * 初始化组件
         *
         * 在添加到GameObject时立即被调用。
         */
        init(): void;
        /**
         * Returns the component of Type type if the game object has one attached, null if it doesn't.
         * @param type				The type of Component to retrieve.
         * @return                  返回指定类型组件
         */
        getComponent<T extends ComponentNames>(type: T): ComponentMap[T];
        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponents<T extends ComponentNames>(type?: T): ComponentMap[T][];
        /**
         * Returns all components of Type type in the GameObject.
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInChildren<T extends ComponentNames>(type?: T, filter?: (compnent: ComponentMap[T]) => {
            findchildren: boolean;
            value: boolean;
        }, result?: ComponentMap[T][]): ComponentMap[T][];
        /**
         * 从父类中获取组件
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInParents<T extends ComponentNames>(type?: T, result?: ComponentMap[T][]): ComponentMap[T][];
        /**
         * 销毁
         */
        dispose(): void;
        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera): void;
        /**
         * 监听对象的所有事件并且传播到所有组件中
         */
        private _onAnyListener;
        /**
         * 该方法仅在GameObject中使用
         * @private
         *
         * @param gameObject 游戏对象
         */
        setGameObject(gameObject: GameObject): void;
        protected _gameObject: GameObject;
    }
}
declare namespace feng3d {
    /**
     * Graphics 类包含一组可用来创建矢量形状的方法。
     */
    class Graphics extends Component {
        __class__: "feng3d.Graphics";
        private image;
        private context2D;
        private canvas;
        private width;
        private height;
        constructor();
        draw(width: number, height: number, callback: (context2D: CanvasRenderingContext2D) => void): this;
    }
    function watchContext2D(context2D: CanvasRenderingContext2D, watchFuncs?: string[]): void;
}
declare namespace feng3d {
    interface ComponentMap {
        Behaviour: Behaviour;
    }
    /**
     * 行为
     *
     * 可以控制开关的组件
     */
    class Behaviour extends Component {
        /**
         * 是否启用update方法
         */
        enabled: boolean;
        /**
         * 可运行环境
         */
        runEnvironment: RunEnvironment;
        /**
         * Has the Behaviour had enabled called.
         * 是否所在GameObject显示且该行为已启动。
         */
        get isVisibleAndEnabled(): boolean;
        /**
         * 每帧执行
         */
        update(interval?: number): void;
        dispose(): void;
    }
}
declare namespace feng3d {
    interface ComponentMap {
        SkyBox: SkyBox;
    }
    /**
     * 天空盒组件
     */
    class SkyBox extends Component {
        __class__: "feng3d.SkyBox";
        s_skyboxTexture: TextureCube;
        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera): void;
    }
}
declare namespace feng3d {
    /**
     * 天空盒渲染器
     */
    var skyboxRenderer: SkyBoxRenderer;
    /**
     * 天空盒渲染器
     */
    class SkyBoxRenderer {
        private renderAtomic;
        init(): void;
        /**
         * 绘制场景中天空盒
         * @param gl
         * @param scene 场景
         * @param camera 摄像机
         */
        draw(gl: GL, scene: Scene, camera: Camera): void;
        /**
         * 绘制天空盒
         * @param gl
         * @param skybox 天空盒
         * @param camera 摄像机
         */
        drawSkyBox(gl: GL, skybox: SkyBox, scene: Scene, camera: Camera): void;
    }
}
declare namespace feng3d {
    /**
     * 在检查器中控制对象销毁、保存和可见性的位掩码。
     */
    enum HideFlags {
        /**
         * 一个正常的,可见对象。这是默认的。
         */
        None = 0,
        /**
         * 不会出现在层次界面中。
         */
        HideInHierarchy = 1,
        /**
         * 不会出现在检查器界面中。
         */
        HideInInspector = 2,
        /**
         * 不会保存到编辑器中的场景中。
         */
        DontSaveInEditor = 4,
        /**
         * 在检查器中不可编辑。
         */
        NotEditable = 8,
        /**
         * 在构建播放器时对象不会被保存。
         */
        DontSaveInBuild = 16,
        /**
         * 对象不会被Resources.UnloadUnusedAssets卸载。
         */
        DontUnloadUnusedAsset = 32,
        /**
         * 不能被变换
         */
        DontTransform = 64,
        /**
         * 隐藏
         */
        Hide = 3,
        /**
         * 对象不会保存到场景中。加载新场景时不会被销毁。相当于DontSaveInBuild | HideFlags。DontSaveInEditor | HideFlags.DontUnloadUnusedAsset
         */
        DontSave = 20,
        /**
         * 不显示在层次界面中，不保存到场景中，加载新场景时不会被销毁。
         */
        HideAndDontSave = 61
    }
}
declare namespace feng3d {
    /**
     * 运行环境枚举
     */
    enum RunEnvironment {
        /**
         * 在feng3d模式下运行
         */
        feng3d = 1,
        /**
         * 运行在编辑器中
         */
        editor = 2,
        /**
         * 在所有环境中运行
         */
        all = 255
    }
}
declare namespace feng3d {
    interface GameObjectEventMap {
        /**
         * 变换矩阵变化
         */
        transformChanged: Transform;
        /**
         *
         */
        updateLocalToWorldMatrix: Transform;
        /**
         * 场景矩阵变化
         */
        scenetransformChanged: Transform;
    }
    interface ComponentMap {
        Transform: Transform;
    }
    /**
     * 变换
     *
     * 物体的位置、旋转和比例。
     *
     * 场景中的每个对象都有一个变换。它用于存储和操作对象的位置、旋转和缩放。每个转换都可以有一个父元素，它允许您分层应用位置、旋转和缩放
     */
    class Transform extends Component {
        __class__: "feng3d.Transform";
        get single(): boolean;
        /**
         * 创建一个实体，该类为虚类
         */
        constructor();
        /**
         * 世界坐标
         */
        get worldPosition(): Vector3;
        get parent(): Transform;
        /**
         * X轴坐标。
         */
        get x(): number;
        set x(v: number);
        /**
         * Y轴坐标。
         */
        get y(): number;
        set y(v: number);
        /**
         * Z轴坐标。
         */
        get z(): number;
        set z(v: number);
        /**
         * X轴旋转角度。
         */
        get rx(): number;
        set rx(v: number);
        /**
         * Y轴旋转角度。
         */
        get ry(): number;
        set ry(v: number);
        /**
         * Z轴旋转角度。
         */
        get rz(): number;
        set rz(v: number);
        /**
         * X轴缩放。
         */
        get sx(): number;
        set sx(v: number);
        /**
         * Y轴缩放。
         */
        get sy(): number;
        set sy(v: number);
        /**
         * Z轴缩放。
         */
        get sz(): number;
        set sz(v: number);
        /**
         * 本地位移
         */
        get position(): Vector3;
        set position(v: Vector3);
        /**
         * 本地旋转
         */
        get rotation(): Vector3;
        set rotation(v: Vector3);
        /**
         * 本地四元素旋转
         */
        get orientation(): Quaternion;
        set orientation(value: Quaternion);
        /**
         * 本地缩放
         */
        get scale(): Vector3;
        set scale(v: Vector3);
        /**
         * 本地变换矩阵
         */
        get matrix(): Matrix4x4;
        set matrix(v: Matrix4x4);
        /**
         * 本地旋转矩阵
         */
        get rotationMatrix(): Matrix4x4;
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
        /**
         * 看向目标位置
         *
         * @param target    目标位置
         * @param upAxis    向上朝向
         */
        lookAt(target: Vector3, upAxis?: Vector3): void;
        /**
         * 将一个点从局部空间变换到世界空间的矩阵。
         */
        get localToWorldMatrix(): Matrix4x4;
        set localToWorldMatrix(value: Matrix4x4);
        /**
         * 本地转世界逆转置矩阵
         */
        get ITlocalToWorldMatrix(): Matrix4x4;
        /**
         * 将一个点从世界空间转换为局部空间的矩阵。
         */
        get worldToLocalMatrix(): Matrix4x4;
        get localToWorldRotationMatrix(): Matrix4x4;
        get worldToLocalRotationMatrix(): Matrix4x4;
        /**
         * 将方向从局部空间转换到世界空间。
         *
         * @param direction 局部空间方向
         */
        transformDirection(direction: Vector3): Vector3;
        /**
         * 将方向从局部空间转换到世界空间。
         *
         * @param direction 局部空间方向
         */
        localToWolrdDirection(direction: Vector3): Vector3;
        /**
         * 将包围盒从局部空间转换到世界空间
         *
         * @param box 变换前的包围盒
         * @param out 变换之后的包围盒
         *
         * @returns 变换之后的包围盒
         */
        localToWolrdBox(box: Box3, out?: Box3): Box3;
        /**
         * 将位置从局部空间转换为世界空间。
         *
         * @param position 局部空间位置
         */
        transformPoint(position: Vector3): Vector3;
        /**
         * 将位置从局部空间转换为世界空间。
         *
         * @param position 局部空间位置
         */
        localToWorldPoint(position: Vector3): Vector3;
        /**
         * 将向量从局部空间变换到世界空间。
         *
         * @param vector 局部空间向量
         */
        transformVector(vector: Vector3): Vector3;
        /**
         * 将向量从局部空间变换到世界空间。
         *
         * @param vector 局部空间位置
         */
        localToWorldVector(vector: Vector3): Vector3;
        /**
         * Transforms a direction from world space to local space. The opposite of Transform.TransformDirection.
         *
         * 将一个方向从世界空间转换到局部空间。
         */
        inverseTransformDirection(direction: Vector3): Vector3;
        /**
         * 将一个方向从世界空间转换到局部空间。
         */
        worldToLocalDirection(direction: Vector3): Vector3;
        /**
         * 将位置从世界空间转换为局部空间。
         *
         * @param position 世界坐标系中位置
         */
        worldToLocalPoint(position: Vector3, out?: Vector3): Vector3;
        /**
         * 将向量从世界空间转换为局部空间
         *
         * @param vector 世界坐标系中向量
         */
        worldToLocalVector(vector: Vector3): Vector3;
        /**
         * 将 Ray3 从世界空间转换为局部空间。
         *
         * @param worldRay 世界空间射线。
         * @param localRay 局部空间射线。
         */
        rayWorldToLocal(worldRay: Ray3, localRay?: Ray3): Ray3;
        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera): void;
        private readonly _position;
        private readonly _rotation;
        private readonly _orientation;
        private readonly _scale;
        protected readonly _matrix: Matrix4x4;
        protected _matrixInvalid: boolean;
        protected readonly _rotationMatrix: Matrix4x4;
        protected _rotationMatrixInvalid: boolean;
        protected readonly _localToWorldMatrix: Matrix4x4;
        protected _localToWorldMatrixInvalid: boolean;
        protected readonly _ITlocalToWorldMatrix: Matrix4x4;
        protected _ITlocalToWorldMatrixInvalid: boolean;
        protected readonly _worldToLocalMatrix: Matrix4x4;
        protected _worldToLocalMatrixInvalid: boolean;
        protected readonly _localToWorldRotationMatrix: Matrix4x4;
        protected _localToWorldRotationMatrixInvalid: boolean;
        private _renderAtomic;
        private _positionChanged;
        private _rotationChanged;
        private _scaleChanged;
        private _invalidateTransform;
        private _invalidateSceneTransform;
        private _updateMatrix;
        private _updateLocalToWorldMatrix;
    }
}
declare namespace feng3d {
    interface GameObjectEventMap {
        /**
         * 尺寸变化事件
         */
        sizeChanged: TransformLayout;
        /**
         * 中心点变化事件
         */
        pivotChanged: TransformLayout;
    }
    interface ComponentMap {
        TransformLayout: TransformLayout;
    }
    /**
     * 变换布局
     *
     * 提供了比Transform更加适用于2D元素的API
     *
     * 通过修改Transform的数值实现
     */
    class TransformLayout extends Component {
        get single(): boolean;
        /**
         * 创建一个实体，该类为虚类
         */
        constructor();
        private _onAdded;
        private _onRemoved;
        /**
         * 位移
         */
        get position(): Vector3;
        set position(v: Vector3);
        private readonly _position;
        /**
         * 尺寸，宽高。
         */
        get size(): Vector3;
        set size(v: Vector3);
        private _size;
        /**
         * 与最小最大锚点形成的边框的left、right、top、bottom距离。当 anchorMin.x != anchorMax.x 时对 layout.x layout.y 赋值生效，当 anchorMin.y != anchorMax.y 时对 layout.z layout.w 赋值生效，否则赋值无效，自动被覆盖。
         */
        get leftTop(): Vector3;
        set leftTop(v: Vector3);
        private _leftTop;
        /**
         * 与最小最大锚点形成的边框的left、right、top、bottom距离。当 anchorMin.x != anchorMax.x 时对 layout.x layout.y 赋值生效，当 anchorMin.y != anchorMax.y 时对 layout.z layout.w 赋值生效，否则赋值无效，自动被覆盖。
         */
        get rightBottom(): Vector3;
        set rightBottom(v: Vector3);
        private _rightBottom;
        /**
         * 最小锚点，父Transform2D中左上角锚定的规范化位置。
         */
        anchorMin: Vector3;
        /**
         * 最大锚点，父Transform2D中左上角锚定的规范化位置。
         */
        anchorMax: Vector3;
        /**
         * The normalized position in this RectTransform that it rotates around.
         */
        pivot: Vector3;
        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera): void;
        private _updateLayout;
        /**
         * 布局是否失效
         */
        private _layoutInvalid;
        private _invalidateLayout;
        private _invalidateSize;
        private _invalidatePivot;
    }
}
declare namespace feng3d {
    interface GameObjectEventMap {
        /**
         * 获取自身包围盒
         */
        getSelfBounds: {
            bounds: Box3[];
        };
        /**
         * 自身包围盒发生变化
         */
        selfBoundsChanged: Component;
    }
    interface ComponentMap {
        BoundingBox: BoundingBox;
    }
    /**
     * 轴对称包围盒
     *
     * 用于优化计算射线碰撞检测以及视锥剔除等。
     */
    class BoundingBox extends Component {
        protected _selfBounds: Box3;
        protected _selfWorldBounds: Box3;
        protected _worldBounds: Box3;
        protected _selfBoundsInvalid: boolean;
        protected _selfWorldBoundsInvalid: boolean;
        protected _worldBoundsInvalid: boolean;
        init(): void;
        /**
         * 自身包围盒通常有Renderable组件提供
         */
        get selfBounds(): Box3;
        /**
         * 自身世界空间的包围盒
         */
        get selfWorldBounds(): Box3;
        /**
         * 世界包围盒
         */
        get worldBounds(): Box3;
        /**
         * 更新自身包围盒
         *
         * 自身包围盒通常有Renderable组件提供
         */
        protected _updateSelfBounds(): void;
        /**
         * 更新自身世界包围盒
         */
        protected _updateSelfWorldBounds(): void;
        /**
         * 更新世界包围盒
         */
        protected _updateWorldBounds(): void;
        /**
         * 使自身包围盒失效
         */
        protected _invalidateSelfLocalBounds(): void;
        /**
         * 使自身世界包围盒失效
         */
        protected _invalidateSelfWorldBounds(): void;
        /**
         * 使世界包围盒失效
         */
        protected _invalidateWorldBounds(): void;
    }
}
declare namespace feng3d {
    type Constructor<T> = (new (...args: any[]) => T);
    interface GameObjectEventMap extends MouseEventMap {
        /**
         * 添加子组件事件
         */
        addComponent: {
            gameobject: GameObject;
            component: Component;
        };
        /**
         * 移除子组件事件
         */
        removeComponent: {
            gameobject: GameObject;
            component: Component;
        };
        /**
         * 添加了子对象，当child被添加到parent中时派发冒泡事件
         */
        addChild: {
            parent: GameObject;
            child: GameObject;
        };
        /**
         * 删除了子对象，当child被parent移除时派发冒泡事件
         */
        removeChild: {
            parent: GameObject;
            child: GameObject;
        };
        /**
         * 自身被添加到父对象中事件
         */
        added: {
            parent: GameObject;
        };
        /**
         * 自身从父对象中移除事件
         */
        removed: {
            parent: GameObject;
        };
        /**
         * 当GameObject的scene属性被设置是由Scene派发
         */
        addedToScene: GameObject;
        /**
         * 当GameObject的scene属性被清空时由Scene派发
         */
        removedFromScene: GameObject;
        /**
         * 包围盒失效
         */
        boundsInvalid: Geometry;
        /**
         * 刷新界面
         */
        refreshView: any;
    }
    interface GameObject {
        once<K extends keyof GameObjectEventMap>(type: K, listener: (event: Event<GameObjectEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof GameObjectEventMap>(type: K, data?: GameObjectEventMap[K], bubbles?: boolean): Event<GameObjectEventMap[K]>;
        has<K extends keyof GameObjectEventMap>(type: K): boolean;
        on<K extends keyof GameObjectEventMap>(type: K, listener: (event: Event<GameObjectEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof GameObjectEventMap>(type?: K, listener?: (event: Event<GameObjectEventMap[K]>) => any, thisObject?: any): void;
    }
    /**
     * 游戏对象，场景唯一存在的对象类型
     */
    class GameObject extends AssetData implements IDisposable {
        __class__: "feng3d.GameObject";
        assetType: AssetType;
        /**
         * 预设资源编号
         */
        prefabId: string;
        /**
         * 资源编号
         */
        assetId: string;
        /**
         * 名称
         */
        name: string;
        /**
         * 是否显示
         */
        get visible(): boolean;
        set visible(v: boolean);
        private _visible;
        /**
         * 自身以及子对象是否支持鼠标拾取
         */
        mouseEnabled: boolean;
        /**
         * 变换
         */
        get transform(): Transform;
        private _transform;
        /**
         * 轴对称包围盒
         */
        get boundingBox(): BoundingBox;
        private _boundingBox;
        get parent(): GameObject;
        /**
         * 子对象
         */
        get children(): GameObject[];
        set children(value: GameObject[]);
        get numChildren(): number;
        /**
         * 子组件个数
         */
        get numComponents(): number;
        /**
         * 全局是否可见
         */
        get globalVisible(): boolean;
        get scene(): Scene;
        get components(): Components[];
        set components(value: Components[]);
        /**
         * 构建3D对象
         */
        constructor();
        /**
         * 根据名称查找对象
         *
         * @param name 对象名称
         */
        find(name: string): GameObject;
        /**
         * 是否包含指定对象
         *
         * @param child 可能的子孙对象
         */
        contains(child: GameObject): boolean;
        /**
         * 添加子对象
         *
         * @param child 子对象
         */
        addChild(child: GameObject): GameObject;
        /**
         * 添加子对象
         *
         * @param childarray 子对象
         */
        addChildren(...childarray: GameObject[]): void;
        /**
         * 移除自身
         */
        remove(): void;
        /**
         * 移除所有子对象
         */
        removeChildren(): void;
        /**
         * 移除子对象
         *
         * @param child 子对象
         */
        removeChild(child: GameObject): void;
        /**
         * 删除指定位置的子对象
         *
         * @param index 需要删除子对象的所有
         */
        removeChildAt(index: number): void;
        /**
         * 获取指定位置的子对象
         *
         * @param index
         */
        getChildAt(index: number): GameObject;
        /**
         * 获取子对象列表（备份）
         */
        getChildren(): GameObject[];
        /**
         * 获取指定位置索引的子组件
         * @param index			位置索引
         * @return				子组件
         */
        getComponentAt(index: number): Component;
        /**
         * 添加指定组件类型到游戏对象
         *
         * @type type 被添加组件
         */
        addComponent<T extends ComponentNames>(type: T, callback?: (component: ComponentMap[T]) => void): ComponentMap[T];
        /**
         * 添加脚本
         * @param script   脚本路径
         */
        addScript(scriptName: string): ScriptComponent;
        /**
         * 获取游戏对象上第一个指定类型的组件，不存在时返回null
         *
         * @param type				类定义
         * @return                  返回指定类型组件
         */
        getComponent<T extends ComponentNames>(type: T): ComponentMap[T];
        /**
         * 获取游戏对象上所有指定类型的组件数组
         *
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponents<T extends ComponentNames>(type: T): ComponentMap[T][];
        /**
         * 从自身与子代（孩子，孩子的孩子，...）游戏对象中获取所有指定类型的组件
         *
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInChildren<T extends ComponentNames>(type?: T, filter?: (compnent: ComponentMap[T]) => {
            findchildren: boolean;
            value: boolean;
        }, result?: ComponentMap[T][]): ComponentMap[T][];
        /**
         * 从父代（父亲，父亲的父亲，...）中获取组件
         *
         * @param type		类定义
         * @return			返回与给出类定义一致的组件
         */
        getComponentsInParents<T extends ComponentNames>(type?: T, result?: ComponentMap[T][]): ComponentMap[T][];
        /**
         * 设置子组件的位置
         * @param component				子组件
         * @param index				位置索引
         */
        setComponentIndex(component: Components, index: number): void;
        /**
         * 设置组件到指定位置
         * @param component		被设置的组件
         * @param index			索引
         */
        setComponentAt(component: Components, index: number): void;
        /**
         * 移除组件
         * @param component 被移除组件
         */
        removeComponent(component: Components): void;
        /**
         * 获取组件在容器的索引位置
         * @param component			查询的组件
         * @return				    组件在容器的索引位置
         */
        getComponentIndex(component: Components): number;
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
        swapComponents(a: Components, b: Components): void;
        /**
         * 移除指定类型组件
         * @param type 组件类型
         */
        removeComponentsByType<T extends Components>(type: Constructor<T>): T[];
        /**
         * 世界包围盒
         */
        get worldBounds(): Box3;
        /**
         * 监听对象的所有事件并且传播到所有组件中
         */
        private _onAnyListener;
        /**
         * 销毁
         */
        dispose(): void;
        disposeWithChildren(): void;
        /**
         * 是否加载完成
         */
        get isSelfLoaded(): boolean;
        /**
         * 已加载完成或者加载完成时立即调用
         * @param callback 完成回调
         */
        onSelfLoadCompleted(callback: () => void): void;
        /**
         * 是否加载完成
         */
        get isLoaded(): boolean;
        /**
         * 已加载完成或者加载完成时立即调用
         * @param callback 完成回调
         */
        onLoadCompleted(callback: () => void): void;
        /**
         * 查找指定名称的游戏对象
         *
         * @param name
         */
        static find(name: string): GameObject;
        /**
         * 组件列表
         */
        protected _components: Components[];
        protected _children: GameObject[];
        protected _scene: Scene;
        protected _parent: GameObject;
        protected _globalVisible: boolean;
        protected _globalVisibleInvalid: boolean;
        protected _updateGlobalVisible(): void;
        protected _invalidateGlobalVisible(): void;
        private _setParent;
        private updateScene;
        private updateChildrenScene;
        private removeChildInternal;
        /**
         * 判断是否拥有组件
         * @param com	被检测的组件
         * @return		true：拥有该组件；false：不拥有该组件。
         */
        private hasComponent;
        /**
         * 添加组件到指定位置
         * @param component		被添加的组件
         * @param index			插入的位置
         */
        private addComponentAt;
        /**
         * 创建指定类型的游戏对象。
         *
         * @param type 游戏对象类型。
         * @param param 游戏对象参数。
         */
        static createPrimitive<K extends keyof PrimitiveGameObject>(type: K, param?: gPartial<GameObject>): GameObject;
        /**
         * 注册原始游戏对象，被注册后可以使用 GameObject.createPrimitive 进行创建。
         *
         * @param type 原始游戏对象类型。
         * @param handler 构建原始游戏对象的函数。
         */
        static registerPrimitive<K extends keyof PrimitiveGameObject>(type: K, handler: (gameObject: GameObject) => void): void;
        static _registerPrimitives: {
            [type: string]: (gameObject: GameObject) => void;
        };
    }
    /**
     * 原始游戏对象，可以通过GameObject.createPrimitive进行创建。
     */
    interface PrimitiveGameObject {
    }
}
interface HTMLCanvasElement {
    gl: feng3d.GL;
}
declare namespace feng3d {
    /**
     * 视图
     */
    class View extends Feng3dObject {
        canvas: HTMLCanvasElement;
        private _contextAttributes;
        /**
         * 摄像机
         */
        get camera(): Camera;
        set camera(v: Camera);
        private _camera;
        /**
         * 3d场景
         */
        scene: Scene;
        /**
         * 根结点
         */
        get root(): GameObject;
        get gl(): GL;
        /**
         * 鼠标在3D视图中的位置
         */
        mousePos: Vector2;
        viewRect: Rectangle;
        /**
         * 鼠标事件管理
         */
        mouse3DManager: Mouse3DManager;
        protected contextLost: boolean;
        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        constructor(canvas?: HTMLCanvasElement, scene?: Scene, camera?: Camera, contextAttributes?: WebGLContextAttributes);
        /**
         * 修改canvas尺寸
         * @param width 宽度
         * @param height 高度
         */
        setSize(width: number, height: number): void;
        start(): void;
        stop(): void;
        update(interval?: number): void;
        /**
         * 绘制场景
         */
        render(interval?: number): void;
        /**
         * 屏幕坐标转GPU坐标
         * @param screenPos 屏幕坐标 (x: [0-width], y: [0 - height])
         * @return GPU坐标 (x: [-1, 1], y: [-1, 1])
         */
        screenToGpuPosition(screenPos: Vector2): Vector2;
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
         * 获取单位像素在指定深度映射的大小
         * @param   depth   深度
         */
        getScaleByDepth(depth: number, dir?: Vector2): number;
        /**
         * 获取鼠标射线（与鼠标重叠的摄像机射线）
         */
        mouseRay3D: Ray3;
        private calcMouseRay3D;
        /**
         * 获取屏幕区域内所有游戏对象
         * @param start 起点
         * @param end 终点
         */
        getObjectsInGlobalArea(start: feng3d.Vector2, end: feng3d.Vector2): GameObject[];
        protected selectedObject: GameObject;
        static createNewScene(): Scene;
    }
}
declare namespace feng3d {
    interface ComponentMap {
        HoldSizeComponent: HoldSizeComponent;
    }
    class HoldSizeComponent extends Component {
        __class__: "feng3d.HoldSizeComponent";
        /**
         * 保持缩放尺寸
         */
        holdSize: number;
        /**
         * 相机
         */
        camera: Camera;
        init(): void;
        dispose(): void;
        private _onCameraChanged;
        private _invalidateSceneTransform;
        private _onUpdateLocalToWorldMatrix;
        private _getDepthScale;
    }
}
declare namespace feng3d {
    interface ComponentMap {
        BillboardComponent: BillboardComponent;
    }
    class BillboardComponent extends Component {
        __class__: "feng3d.BillboardComponent";
        /**
         * 相机
         */
        camera: Camera;
        init(): void;
        private _onCameraChanged;
        private _invalidHoldSizeMatrix;
        private _onUpdateLocalToWorldMatrix;
        dispose(): void;
    }
}
declare namespace feng3d {
    interface ComponentMap {
        WireframeComponent: WireframeComponent;
    }
    /**
     * 线框组件，将会对拥有该组件的对象绘制线框
     */
    class WireframeComponent extends Component {
        __class__: "feng3d.WireframeComponent";
        color: Color4;
    }
}
declare namespace feng3d {
    interface ComponentMap {
        CartoonComponent: CartoonComponent;
    }
    /**
     * 参考
     */
    class CartoonComponent extends Component {
        __class__: "feng3d.CartoonComponent";
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
        get cartoon_Anti_aliasing(): boolean;
        set cartoon_Anti_aliasing(value: boolean);
        _cartoon_Anti_aliasing: boolean;
        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera): void;
    }
    interface Uniforms {
        u_diffuseSegment: Vector4;
        u_diffuseSegmentValue: Vector4;
        u_specularSegment: number;
    }
}
declare namespace feng3d {
    interface ComponentMap {
        OutLineComponent: OutLineComponent;
    }
    class OutLineComponent extends Component {
        __class__: "feng3d.OutLineComponent";
        size: number;
        color: Color4;
        outlineMorphFactor: number;
        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera): void;
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
    interface ComponentMap {
        RayCastable: RayCastable;
    }
    /**
     * 可射线捕获
     */
    class RayCastable extends Behaviour {
        protected _selfLocalBounds: Box3;
        protected _selfWorldBounds: Box3;
        /**
         * 自身局部包围盒
         */
        get selfLocalBounds(): Box3;
        /**
         * 自身世界包围盒
         */
        get selfWorldBounds(): Box3;
        /**
         * 与世界空间射线相交
         *
         * @param worldRay 世界空间射线
         *
         * @return 相交信息
         */
        worldRayIntersection(worldRay: Ray3): PickingCollisionVO;
        protected _onScenetransformChanged(): void;
        /**
         * 更新世界边界
         */
        protected _updateWorldBounds(): void;
        /**
         * 处理包围盒变换事件
         */
        protected _onBoundsInvalid(): void;
        protected _updateBounds(): void;
    }
}
declare namespace feng3d {
    interface ComponentMap {
        Renderable: Renderable;
    }
    /**
     * 可渲染组件
     *
     * General functionality for all renderers.
     *
     * A renderer is what makes an object appear on the screen. Use this class to access the renderer of any object, mesh or Particle System. Renderers can be disabled to make objects invisible (see enabled), and the materials can be accessed and modified through them (see material).
     *
     * See Also: Renderer components for meshes, particles, lines and trails.
     */
    class Renderable extends RayCastable {
        get single(): boolean;
        readonly renderAtomic: RenderAtomic;
        /**
         * 几何体
         */
        geometry: GeometryLike;
        /**
         * 材质
         */
        material: Material;
        castShadows: boolean;
        receiveShadows: boolean;
        constructor();
        init(): void;
        /**
         * 渲染前执行函数
         *
         * 可用于渲染前收集渲染数据，或者更新显示效果等
         *
         * @param renderAtomic
         * @param scene
         * @param camera
         */
        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera): void;
        /**
         * 与世界空间射线相交
         *
         * @param worldRay 世界空间射线
         *
         * @return 相交信息
         */
        worldRayIntersection(worldRay: Ray3): PickingCollisionVO;
        /**
         * 与局部空间射线相交
         *
         * @param ray3D 局部空间射线
         *
         * @return 相交信息
         */
        localRayIntersection(localRay: Ray3): PickingCollisionVO;
        /**
         * 是否加载完成
         */
        get isLoaded(): boolean;
        /**
         * 已加载完成或者加载完成时立即调用
         * @param callback 完成回调
         */
        onLoadCompleted(callback: () => void): void;
        /**
         * 销毁
         */
        dispose(): void;
        private _lightPicker;
        private _onGeometryChanged;
        private _onMaterialChanged;
        protected _updateBounds(): void;
        protected _onGetSelfBounds(event: Event<{
            bounds: Box3[];
        }>): void;
    }
}
declare namespace feng3d {
    interface ComponentMap {
        MeshRenderer: MeshRenderer;
    }
    /**
     * 网格渲染器
     */
    class MeshRenderer extends Renderable {
        __class__: "feng3d.MeshRenderer";
    }
}
declare namespace feng3d {
    interface ComponentMap {
        ScriptComponent: ScriptComponent;
    }
    /**
     * 3d对象脚本
     */
    class ScriptComponent extends Behaviour {
        runEnvironment: RunEnvironment;
        scriptName: string;
        /**
         * 脚本对象
         */
        get scriptInstance(): Script;
        private _scriptInstance;
        private _invalid;
        private scriptInit;
        init(): void;
        private _updateScriptInstance;
        private _invalidateScriptInstance;
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
        get gameObject(): GameObject;
        /**
         * The Transform attached to this GameObject (null if there is none attached).
         */
        get transform(): Transform;
        /**
         * 宿主组件
         */
        component: ScriptComponent;
        constructor();
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
    interface GameObjectEventMap {
        addToScene: GameObject;
        removeFromScene: GameObject;
        addComponentToScene: Component;
    }
    interface ComponentMap {
        Scene: Scene;
    }
    /**
     * 3D场景
     */
    class Scene extends Component {
        __class__: "feng3d.Scene";
        /**
         * 背景颜色
         */
        background: Color4;
        /**
         * 环境光强度
         */
        ambientColor: Color4;
        /**
         * 指定所运行环境
         *
         * 控制运行符合指定环境场景中所有 Behaviour.update 方法
         *
         * 用于处理某些脚本只在在feng3d引擎或者编辑器中运行的问题。例如 FPSController 默认只在feng3d中运行，在编辑器模式下不会运行。
         */
        runEnvironment: RunEnvironment;
        /**
         * 鼠标射线，在渲染时被设置
         */
        mouseRay3D: Ray3;
        /**
         * 上次渲染时用的摄像机
         */
        camera: Camera;
        init(): void;
        update(interval?: number): void;
        /**
         * 所有 Model
         */
        get models(): Renderable[];
        /**
         * 所有 可见且开启的 Model
         */
        get visibleAndEnabledModels(): Renderable[];
        /**
         * 所有 SkyBox
         */
        get skyBoxs(): SkyBox[];
        get activeSkyBoxs(): SkyBox[];
        get directionalLights(): DirectionalLight[];
        get activeDirectionalLights(): DirectionalLight[];
        get pointLights(): PointLight[];
        get activePointLights(): PointLight[];
        get spotLights(): SpotLight[];
        get activeSpotLights(): SpotLight[];
        get animations(): Animation[];
        get activeAnimations(): Animation[];
        get behaviours(): Behaviour[];
        get activeBehaviours(): Behaviour[];
        get mouseCheckObjects(): GameObject[];
        /**
         * 获取拾取缓存
         * @param camera
         */
        getPickCache(camera: Camera): ScenePickCache;
        /**
         * 获取接收光照渲染对象列表
         * @param light
         */
        getPickByDirectionalLight(light: DirectionalLight): Renderable[];
        /**
         * 获取 可被摄像机看见的 Model 列表
         * @param camera
         */
        getModelsByCamera(camera: Camera): Renderable[];
        private _mouseCheckObjects;
        private _models;
        private _visibleAndEnabledModels;
        private _skyBoxs;
        private _activeSkyBoxs;
        private _directionalLights;
        private _activeDirectionalLights;
        private _pointLights;
        private _activePointLights;
        private _spotLights;
        private _activeSpotLights;
        private _animations;
        private _activeAnimations;
        private _behaviours;
        private _activeBehaviours;
        private _pickMap;
    }
}
declare namespace feng3d {
    /**
     * 场景拾取缓存
     */
    class ScenePickCache {
        private scene;
        private camera;
        private _activeModels;
        private _blenditems;
        private _unblenditems;
        constructor(scene: Scene, camera: Camera);
        /**
         * 获取需要渲染的对象
         *
         * #### 渲染需求条件
         * 1. visible == true
         * 1. 在摄像机视锥内
         * 1. model.enabled == true
         *
         * @param gameObject
         * @param camera
         */
        get activeModels(): Renderable[];
        /**
         * 半透明渲染对象
         */
        get blenditems(): Renderable[];
        /**
         * 半透明渲染对象
         */
        get unblenditems(): Renderable[];
        clear(): void;
    }
}
declare namespace feng3d {
    /**
     * 用于处理从场景中获取特定数据
     */
    class SceneUtil {
        /**
         * 获取场景中可视需要混合的渲染对象
         *
         * @param scene 场景
         * @param camera 摄像机
         */
        getBlenditems(scene: Scene, camera: Camera): void;
        /**
         * 获取需要渲染的对象
         *
         * #### 渲染需求条件
         * 1. visible == true
         * 1. 在摄像机视锥内
         * 1. model.enabled == true
         *
         * @param gameObject
         * @param camera
         */
        getActiveRenderers(scene: Scene, camera: Camera): Renderable[];
    }
    var sceneUtil: SceneUtil;
}
declare namespace feng3d {
    interface GeometryTypes {
    }
    type GeometryLike = GeometryTypes[keyof GeometryTypes];
    interface GeometryEventMap {
        /**
         * 包围盒失效
         */
        boundsInvalid: Geometry;
    }
    interface Geometry {
        once<K extends keyof GeometryEventMap>(type: K, listener: (event: Event<GeometryEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof GeometryEventMap>(type: K, data?: GeometryEventMap[K], bubbles?: boolean): Event<GeometryEventMap[K]>;
        has<K extends keyof GeometryEventMap>(type: K): boolean;
        on<K extends keyof GeometryEventMap>(type: K, listener: (event: Event<GeometryEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof GeometryEventMap>(type?: K, listener?: (event: Event<GeometryEventMap[K]>) => any, thisObject?: any): void;
    }
    /**
     * 几何体
     */
    class Geometry extends AssetData {
        private preview;
        name: string;
        /**
         * 资源编号
         */
        assetId: string;
        assetType: AssetType;
        /**
         * 几何体信息
         */
        get geometryInfo(): string;
        /**
         * 索引数据
         */
        get indices(): number[];
        /**
         * 更新顶点索引数据
         */
        set indices(value: number[]);
        /**
         * 坐标数据
         */
        get positions(): number[];
        set positions(value: number[]);
        /**
         * 颜色数据
         */
        get colors(): number[];
        set colors(value: number[]);
        /**
         * uv数据
         */
        get uvs(): number[];
        set uvs(value: number[]);
        /**
         * 法线数据
         */
        get normals(): number[];
        set normals(value: number[]);
        /**
         * 切线数据
         */
        get tangents(): number[];
        set tangents(value: number[]);
        /**
         * 蒙皮索引，顶点关联的关节索引
         */
        get skinIndices(): number[];
        set skinIndices(value: number[]);
        /**
         * 蒙皮权重，顶点关联的关节权重
         */
        get skinWeights(): number[];
        set skinWeights(value: number[]);
        /**
         * 蒙皮索引，顶点关联的关节索引
         */
        get skinIndices1(): number[];
        set skinIndices1(value: number[]);
        /**
         * 蒙皮权重，顶点关联的关节权重
         */
        get skinWeights1(): number[];
        set skinWeights1(value: number[]);
        /**
         * 创建一个几何体
         */
        constructor();
        /**
         * 标记需要更新几何体，在更改几何体数据后需要调用该函数。
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
         * 顶点数量
         */
        get numVertex(): number;
        /**
         * 三角形数量
         */
        get numTriangles(): number;
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
        scaleU: number;
        /**
         * 纹理V缩放，默认为1。
         */
        scaleV: number;
        /**
         * 包围盒失效
         */
        invalidateBounds(): void;
        get bounding(): Box3;
        /**
         * 射线投影几何体
         * @param ray                           射线
         * @param shortestCollisionDistance     当前最短碰撞距离
         * @param cullFace                      裁剪面枚举
         */
        raycast(ray: Ray3, shortestCollisionDistance?: number, cullFace?: CullFace): {
            rayEntryDistance: number;
            localPosition: Vector3;
            localNormal: Vector3;
            uv: Vector2;
            index: number;
        };
        /**
         * 获取顶点列表
         *
         * @param result
         */
        getVertices(result?: feng3d.Vector3[]): Vector3[];
        getFaces(result?: number[][]): number[][];
        /**
         * 克隆一个几何体
         */
        clone(): CustomGeometry;
        /**
         * 从一个几何体中克隆数据
         */
        cloneFrom(geometry: Geometry): void;
        beforeRender(renderAtomic: RenderAtomic): void;
        /**
         * 顶点索引缓冲
         */
        private _indexBuffer;
        /**
         * 属性数据列表
         */
        protected _attributes: Attributes;
        /**
         * 清理数据
         */
        clear(): void;
        private _geometryInvalid;
        private _useFaceWeights;
        private _bounding;
        /**
         * 设置默认几何体
         *
         * @param name 默认几何体名称
         * @param geometry 默认几何体
         */
        static setDefault<K extends keyof DefaultGeometry>(name: K, geometry: DefaultGeometry[K], param?: gPartial<DefaultGeometry[K]>): void;
        /**
         * 获取默认几何体
         *
         * @param name 默认几何体名称
         */
        static getDefault<K extends keyof DefaultGeometry>(name: K): DefaultGeometry[K];
        private static _defaultGeometry;
    }
    /**
     * 默认几何体
     */
    interface DefaultGeometry {
    }
}
declare namespace feng3d {
    interface GeometryTypes {
        CustomGeometry: CustomGeometry;
    }
    class CustomGeometry extends Geometry {
        __class__: "feng3d.CustomGeometry";
        /**
         * 顶点索引缓冲
         */
        indices: number[];
        /**
         * 属性数据列表
         */
        get attributes(): Attributes;
        set attributes(v: Attributes);
    }
}
declare namespace feng3d {
    var geometryUtils: GeometryUtils;
    class GeometryUtils {
        /**
         * 根据顶点数量按顺序创建顶点索引
         * @param positions 顶点数据
         */
        createIndices(positions: number[]): number[];
        /**
         * 创建循环uv数据
         * @param positions 顶点数据
         */
        createUVs(positions: number[]): number[];
        /**
         * 计算顶点法线数据
         * @param indices 顶点索引
         * @param positions 顶点数据
         * @param useFaceWeights 是否使用面权重计算法线
         */
        createVertexNormals(indices: number[], positions: number[], useFaceWeights?: boolean): number[];
        /**
         * 计算顶点切线数据
         * @param indices 顶点索引
         * @param positions 顶点数据
         * @param uvs uv数据
         * @param useFaceWeights 是否使用面权重计算切线数据
         */
        createVertexTangents(indices: number[], positions: number[], uvs: number[], useFaceWeights?: boolean): number[];
        /**
         * 计算面切线数据
         * @param indices 顶点索引数据
         * @param positions 顶点数据
         * @param uvs uv数据
         * @param useFaceWeights 是否计算面权重
         */
        createFaceTangents(indices: number[], positions: number[], uvs: number[], useFaceWeights?: boolean): {
            faceTangents: number[];
            faceWeights: number[];
        };
        /**
         * 计算面法线数据
         * @param indices 顶点索引数据
         * @param positions 顶点数据
         * @param useFaceWeights 是否计算面权重
         */
        createFaceNormals(indices: number[], positions: number[], useFaceWeights?: boolean): {
            faceNormals: number[];
            faceWeights: number[];
        };
        /**
         * 应用变换矩阵
         * @param transform 变换矩阵
         * @param positions 顶点数据
         * @param normals 顶点法线数据
         * @param tangents 顶点切线数据
         */
        applyTransformation(transform: Matrix4x4, positions: number[], normals?: number[], tangents?: number[]): void;
        /**
         * 合并几何体
         * @param geometrys 几何体列表
         */
        mergeGeometry(geometrys: {
            indices: number[];
            positions: number[];
            uvs?: number[];
            normals?: number[];
            tangents?: number[];
        }[]): {
            indices: number[];
            positions: number[];
            uvs?: number[];
            normals?: number[];
            tangents?: number[];
        };
        /**
         * 射线投影几何体
         * @param ray                           射线
         * @param shortestCollisionDistance     当前最短碰撞距离
         * @param cullFace                      裁剪面枚举
         *
         * @todo
         * @see 3D数学基础：图形与游戏开发 P278 是否可用该内容优化运算效率？
         *
         * @see 优化参考 three.js Ray.intersectTriangle
         */
        raycast(ray: Ray3, indices: number[], positions: number[], uvs: number[], shortestCollisionDistance?: number, cullFace?: CullFace): {
            rayEntryDistance: number;
            localPosition: Vector3;
            localNormal: Vector3;
            uv: Vector2;
            index: number;
        };
        /**
         * 获取包围盒
         * @param positions 顶点数据
         */
        getAABB(positions: number[]): Box3;
    }
}
declare namespace feng3d {
    interface GeometryTypes {
        PointGeometry: PointGeometry;
    }
    /**
     * 点几何体
     */
    class PointGeometry extends Geometry {
        __class__: "feng3d.PointGeometry";
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
     */
    interface PointInfo {
        position?: Vector3;
        color?: Color4;
        normal?: Vector3;
        uv?: Vector2;
    }
}
declare namespace feng3d {
    interface GeometryTypes {
        SegmentGeometry: SegmentGeometry;
    }
    /**
     * 线段组件
     */
    class SegmentGeometry extends Geometry {
        __class__: "feng3d.SegmentGeometry";
        name: string;
        /**
         * 线段列表
         * 修改数组内数据时需要手动调用 invalidateGeometry();
         */
        segments: Segment[];
        /**
         * 添加线段
         *
         * @param segment 线段
         */
        addSegment(segment: Partial<Segment>): void;
        constructor();
        /**
         * 更新几何体
         */
        protected buildGeometry(): void;
    }
    /**
     * 线段
     */
    class Segment {
        /**
         * 起点坐标
         */
        start: Vector3;
        /**
         * 终点坐标
         */
        end: Vector3;
        /**
         * 起点颜色
         */
        startColor: Color4;
        /**
         * 终点颜色
         */
        endColor: Color4;
    }
    interface PrimitiveGameObject {
        Segment: GameObject;
    }
}
declare namespace feng3d {
    /**
     * 摄像机镜头
     *
     * 镜头主要作用是投影以及逆投影。
     * 投影指的是从摄像机空间可视区域内的坐标投影至GPU空间可视区域内的坐标。
     *
     * 摄像机可视区域：由近、远，上，下，左，右组成的四棱柱
     * GPU空间可视区域：立方体 [(-1, -1, -1), (1, 1, 1)]
     *
     */
    abstract class LensBase extends Feng3dObject {
        /**
         * 摄像机投影类型
         */
        get projectionType(): Projection;
        protected _projectionType: Projection;
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
        aspect: number;
        /**
         * 创建一个摄像机镜头
         */
        constructor(aspectRatio?: number, near?: number, far?: number);
        /**
         * 投影矩阵
         */
        get matrix(): Matrix4x4;
        /**
         * 逆矩阵
         */
        get inverseMatrix(): Matrix4x4;
        /**
         * 摄像机空间坐标投影到GPU空间坐标
         * @param point3d 摄像机空间坐标
         * @param v GPU空间坐标
         * @return GPU空间坐标
         */
        project(point3d: Vector3, v?: Vector3): Vector3;
        /**
         * GPU空间坐标投影到摄像机空间坐标
         * @param point3d GPU空间坐标
         * @param v 摄像机空间坐标（输出）
         * @returns 摄像机空间坐标
         */
        unproject(point3d: Vector3, v?: Vector3): Vector3;
        /**
         * 逆投影求射线
         *
         * 通过GPU空间坐标x与y值求出摄像机空间坐标的射线
         *
         * @param x GPU空间坐标x值
         * @param y GPU空间坐标y值
         */
        unprojectRay(x: number, y: number, ray?: Ray3): Ray3;
        /**
         * 指定深度逆投影
         *
         * 获取投影在指定GPU坐标且摄像机前方（深度）sZ处的点的3D坐标
         *
         * @param nX GPU空间坐标X
         * @param nY GPU空间坐标Y
         * @param sZ 到摄像机的距离
         * @param v 摄像机空间坐标（输出）
         * @return 摄像机空间坐标
         */
        unprojectWithDepth(nX: number, nY: number, sZ: number, v?: Vector3): Vector3;
        private _inverseMatrix;
        private _invertMatrixInvalid;
        protected _matrix: Matrix4x4;
        private _matrixInvalid;
        /**
         * 投影矩阵失效
         */
        protected invalidate(): void;
        private _updateInverseMatrix;
        /**
         * 更新投影矩阵
         */
        protected abstract _updateMatrix(): void;
        /**
         * 克隆
         */
        abstract clone(): LensBase;
    }
}
declare namespace feng3d {
    /**
     * 正射投影镜头
     */
    class OrthographicLens extends LensBase {
        /**
         * 尺寸
         */
        size: number;
        /**
         * 构建正射投影镜头
         * @param size 尺寸
         */
        constructor(size?: number, aspect?: number, near?: number, far?: number);
        protected _updateMatrix(): void;
        clone(): OrthographicLens;
    }
}
declare namespace feng3d {
    /**
     * 透视摄像机镜头
     */
    class PerspectiveLens extends LensBase {
        /**
         * 垂直视角，视锥体顶面和底面间的夹角；单位为角度，取值范围 [1,179]
         */
        fov: number;
        /**
         * 创建一个透视摄像机镜头
         * @param fov 垂直视角，视锥体顶面和底面间的夹角；单位为角度，取值范围 [1,179]
         *
         */
        constructor(fov?: number, aspect?: number, near?: number, far?: number);
        /**
         * 焦距
         */
        get focalLength(): number;
        set focalLength(value: number);
        /**
         * 投影
         *
         * 摄像机空间坐标投影到GPU空间坐标
         *
         * @param point3d 摄像机空间坐标
         * @param v GPU空间坐标
         * @return GPU空间坐标
         */
        project(point3d: Vector3, v?: Vector3): Vector3;
        /**
         * 逆投影
         *
         * GPU空间坐标投影到摄像机空间坐标
         *
         * @param point3d GPU空间坐标
         * @param v 摄像机空间坐标（输出）
         * @returns 摄像机空间坐标
         */
        unproject(point3d: Vector3, v?: Vector3): Vector3;
        protected _updateMatrix(): void;
        clone(): PerspectiveLens;
    }
}
declare namespace feng3d {
    /**
     * 摄像机投影类型
     */
    enum Projection {
        /**
         * 透视投影
         */
        Perspective = 0,
        /**
         * 正交投影
         */
        Orthographic = 1
    }
}
declare namespace feng3d {
    interface GameObjectEventMap {
        lensChanged: any;
    }
    interface ComponentMap {
        Camera: Camera;
    }
    /**
     * 摄像机
     */
    class Camera extends Component {
        __class__: "feng3d.Camera";
        get single(): boolean;
        get projection(): Projection;
        set projection(v: Projection);
        /**
         * 镜头
         */
        get lens(): LensBase;
        set lens(v: LensBase);
        private _lens;
        /**
         * 场景投影矩阵，世界空间转投影空间
         */
        get viewProjection(): Matrix4x4;
        /**
         * 获取摄像机的截头锥体
         */
        get frustum(): Frustum;
        /**
         * 创建一个摄像机
         */
        init(): void;
        /**
         * 获取与坐标重叠的射线
         * @param x view3D上的X坐标
         * @param y view3D上的X坐标
         * @return
         */
        getRay3D(x: number, y: number, ray3D?: Ray3): Ray3;
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
         * 获取摄像机能够在指定深度处的视野；镜头在指定深度的尺寸。
         *
         * @param   depth   深度
         */
        getScaleByDepth(depth: number, dir?: Vector2): number;
        /**
         * 处理场景变换改变事件
         */
        protected invalidateViewProjection(): void;
        private _viewProjection;
        private _viewProjectionInvalid;
        private _backups;
        private _frustum;
        private _frustumInvalid;
    }
    interface PrimitiveGameObject {
        Camera: GameObject;
    }
}
declare namespace feng3d {
    interface GeometryTypes {
        QuadGeometry: QuadGeometry;
    }
    /**
     * 四边形面皮几何体
     */
    class QuadGeometry extends Geometry {
        __class__: "feng3d.QuadGeometry";
        constructor();
    }
    interface DefaultGeometry {
        Quad: QuadGeometry;
    }
    interface PrimitiveGameObject {
        Quad: GameObject;
    }
}
declare namespace feng3d {
    interface GeometryTypes {
        PlaneGeometry: PlaneGeometry;
    }
    /**
     * 平面几何体
     */
    class PlaneGeometry extends Geometry {
        __class__: "feng3d.PlaneGeometry";
        /**
         * 宽度
         */
        width: number;
        /**
         * 高度
         */
        height: number;
        /**
         * 横向分割数
         */
        segmentsW: number;
        /**
         * 纵向分割数
         */
        segmentsH: number;
        /**
         * 是否朝上
         */
        yUp: boolean;
        name: string;
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
        private buildPosition;
        /**
         * 构建顶点法线
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildNormal;
        /**
         * 构建顶点切线
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildTangent;
        /**
         * 构建顶点索引
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         * @param this.yUp 正面朝向 true:Y+ false:Z+
         */
        private buildIndices;
        /**
         * 构建uv
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         */
        private buildUVs;
    }
    interface DefaultGeometry {
        Plane: PlaneGeometry;
    }
    interface PrimitiveGameObject {
        Plane: GameObject;
    }
}
declare namespace feng3d {
    interface GeometryTypes {
        CubeGeometry: CubeGeometry;
    }
    /**
     * 立（长）方体几何体
     */
    class CubeGeometry extends Geometry {
        __class__: "feng3d.CubeGeometry";
        name: string;
        /**
         * 宽度
         */
        width: number;
        /**
         * 高度
         */
        height: number;
        /**
         * 深度
         */
        depth: number;
        /**
         * 宽度方向分割数
         */
        segmentsW: number;
        /**
         * 高度方向分割数
         */
        segmentsH: number;
        /**
         * 深度方向分割数
         */
        segmentsD: number;
        /**
         * 是否为6块贴图，默认true。
         */
        tile6: boolean;
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
        private buildPosition;
        /**
         * 构建法线
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        private buildNormal;
        /**
         * 构建切线
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        private buildTangent;
        /**
         * 构建索引
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         */
        private buildIndices;
        /**
         * 构建uv
         * @param   segmentsW       宽度方向分割
         * @param   segmentsH       高度方向分割
         * @param   segmentsD       深度方向分割
         * @param   tile6           是否为6块贴图
         */
        private buildUVs;
    }
    interface DefaultGeometry {
        Cube: CubeGeometry;
    }
    interface PrimitiveGameObject {
        Cube: GameObject;
    }
}
declare namespace feng3d {
    interface GeometryTypes {
        SphereGeometry: SphereGeometry;
    }
    /**
     * 球体几何体
     * @author DawnKing 2016-09-12
     */
    class SphereGeometry extends Geometry {
        __class__: "feng3d.SphereGeometry";
        /**
         * 球体半径
         */
        radius: number;
        /**
         * 横向分割数
         */
        segmentsW: number;
        /**
         * 纵向分割数
         */
        segmentsH: number;
        /**
         * 是否朝上
         */
        yUp: boolean;
        name: string;
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
        private buildIndices;
        /**
         * 构建uv
         * @param this.segmentsW 横向分割数
         * @param this.segmentsH 纵向分割数
         */
        private buildUVs;
    }
    interface DefaultGeometry {
        Sphere: SphereGeometry;
    }
    interface PrimitiveGameObject {
        Sphere: GameObject;
    }
}
declare namespace feng3d {
    interface GeometryTypes {
        CapsuleGeometry: CapsuleGeometry;
    }
    /**
     * 胶囊体几何体
     */
    class CapsuleGeometry extends Geometry {
        __class__: "feng3d.CapsuleGeometry";
        /**
         * 胶囊体半径
         */
        radius: number;
        /**
         * 胶囊体高度
         */
        height: number;
        /**
         * 横向分割数
         */
        segmentsW: number;
        /**
         * 纵向分割数
         */
        segmentsH: number;
        /**
         * 正面朝向 true:Y+ false:Z+
         */
        yUp: boolean;
        name: string;
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
        private buildIndices;
        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        private buildUVs;
    }
    interface DefaultGeometry {
        Capsule: CapsuleGeometry;
    }
    interface PrimitiveGameObject {
        Capsule: GameObject;
    }
}
declare namespace feng3d {
    interface GeometryTypes {
        CylinderGeometry: CylinderGeometry;
    }
    /**
     * 圆柱体几何体
     * @author DawnKing 2016-09-12
     */
    class CylinderGeometry extends Geometry {
        __class__: "feng3d.CylinderGeometry" | "feng3d.ConeGeometry";
        /**
         * 顶部半径
         */
        topRadius: number;
        /**
         * 底部半径
         */
        bottomRadius: number;
        /**
         * 高度
         */
        height: number;
        /**
         * 横向分割数
         */
        segmentsW: number;
        /**
         * 纵向分割数
         */
        segmentsH: number;
        /**
         * 顶部是否封口
         */
        topClosed: boolean;
        /**
         * 底部是否封口
         */
        bottomClosed: boolean;
        /**
         * 侧面是否封口
         */
        surfaceClosed: boolean;
        /**
         * 是否朝上
         */
        yUp: boolean;
        name: string;
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
        private buildIndices;
        /**
         * 构建uv
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         */
        private buildUVs;
    }
    interface DefaultGeometry {
        Cylinder: CylinderGeometry;
    }
    interface PrimitiveGameObject {
        Cylinder: GameObject;
    }
}
declare namespace feng3d {
    /**
     * 圆锥体

     */
    class ConeGeometry extends CylinderGeometry {
        __class__: "feng3d.ConeGeometry";
        name: string;
        /**
         * 底部半径 private
         */
        topRadius: number;
        /**
         * 顶部是否封口 private
         */
        topClosed: boolean;
        /**
         * 侧面是否封口 private
         */
        surfaceClosed: boolean;
    }
    interface DefaultGeometry {
        Cone: ConeGeometry;
    }
    interface PrimitiveGameObject {
        Cone: GameObject;
    }
}
declare namespace feng3d {
    interface GeometryTypes {
        TorusGeometry: TorusGeometry;
    }
    /**
     * 圆环几何体
     */
    class TorusGeometry extends Geometry {
        __class__: "feng3d.TorusGeometry";
        /**
         * 半径
         */
        radius: number;
        /**
         * 管道半径
         */
        tubeRadius: number;
        /**
         * 半径方向分割数
         */
        segmentsR: number;
        /**
         * 管道方向分割数
         */
        segmentsT: number;
        /**
         * 是否朝上
         */
        yUp: boolean;
        name: string;
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
        private addVertex;
        /**
         * 添加三角形索引数据
         * @param currentTriangleIndex		当前三角形索引
         * @param cwVertexIndex0			索引0
         * @param cwVertexIndex1			索引1
         * @param cwVertexIndex2			索引2
         */
        private addTriangleClockWise;
        /**
         * @inheritDoc
         */
        protected buildGeometry(): void;
        /**
         * @inheritDoc
         */
        protected buildUVs(): void;
    }
    interface DefaultGeometry {
        Torus: TorusGeometry;
    }
    interface PrimitiveGameObject {
        Torus: GameObject;
    }
}
declare namespace feng3d {
    interface GeometryTypes {
        ParametricGeometry: ParametricGeometry;
    }
    class ParametricGeometry extends Geometry {
        /**
         * @author zz85 / https://github.com/zz85
         * Parametric Surfaces Geometry
         * based on the brilliant article by @prideout http://prideout.net/blog/?p=44
         *
         * new ParametricGeometry( parametricFunction, uSegments, ySegements );
         *
         */
        constructor(func: (u: number, v: number) => Vector3, slices?: number, stacks?: number, doubleside?: boolean);
        /**
         * 构建几何体
         */
        protected buildGeometry(): void;
    }
}
declare namespace feng3d {
    enum ImageDatas {
        black = "black",
        white = "white",
        red = "red",
        green = "green",
        blue = "blue",
        defaultNormal = "defaultNormal",
        defaultParticle = "defaultParticle"
    }
    var imageDatas: {
        black: ImageData;
        white: ImageData;
        red: ImageData;
        green: ImageData;
        blue: ImageData;
        defaultNormal: ImageData;
        defaultParticle: ImageData;
    };
    interface Texture2DEventMap {
        /**
         * 加载完成
         */
        loadCompleted: any;
    }
    interface Texture2D {
        once<K extends keyof Texture2DEventMap>(type: K, listener: (event: Event<Texture2DEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof Texture2DEventMap>(type: K, data?: Texture2DEventMap[K], bubbles?: boolean): Event<Texture2DEventMap[K]>;
        has<K extends keyof Texture2DEventMap>(type: K): boolean;
        on<K extends keyof Texture2DEventMap>(type: K, listener: (event: Event<Texture2DEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof Texture2DEventMap>(type?: K, listener?: (event: Event<Texture2DEventMap[K]>) => any, thisObject?: any): void;
    }
    /**
     * 2D纹理
     */
    class Texture2D extends TextureInfo {
        __class__: "feng3d.Texture2D";
        /**
         * 纹理类型
         */
        textureType: TextureType;
        assetType: AssetType;
        /**
         * 当贴图数据未加载好等情况时代替使用
         */
        noPixels: ImageDatas;
        /**
         * 是否已加载
         */
        get isLoaded(): boolean;
        private _loadings;
        get image(): HTMLImageElement;
        /**
         * 用于表示初始化纹理的数据来源
         */
        get source(): {
            url: string;
        };
        set source(v: {
            url: string;
        });
        constructor();
        private onItemLoadCompleted;
        /**
         * 已加载完成或者加载完成时立即调用
         * @param callback 完成回调
         */
        onLoadCompleted(callback: () => void): void;
        private _source;
        /**
         * 默认贴图
         */
        static white: Texture2D;
        /**
         * 默认贴图
         */
        static default: Texture2D;
        /**
         * 默认法线贴图
         */
        static defaultNormal: Texture2D;
        /**
         * 默认粒子贴图
         */
        static defaultParticle: Texture2D;
        /**
         * 从url初始化纹理
         *
         * @param url 路径
         */
        static fromUrl(url: string): Texture2D;
    }
}
declare namespace feng3d {
    /**
     * 2D纹理
     */
    class ImageTexture2D extends Texture2D {
        image: HTMLImageElement;
        private _imageChanged;
    }
}
declare namespace feng3d {
    class ImageDataTexture2D extends Texture2D {
        imageData: ImageData;
        private _imageDataChanged;
    }
}
declare namespace feng3d {
    class CanvasTexture2D extends Texture2D {
        canvas: HTMLCanvasElement;
        private _canvasChanged;
    }
}
declare namespace feng3d {
    class VideoTexture2D extends Texture2D {
        video: HTMLVideoElement;
        private _videoChanged;
    }
}
declare namespace feng3d {
    /**
     * 渲染目标纹理
     */
    class RenderTargetTexture2D extends Texture2D {
        OFFSCREEN_WIDTH: number;
        OFFSCREEN_HEIGHT: number;
        format: TextureFormat;
        minFilter: TextureMinFilter;
        magFilter: TextureMagFilter;
        isRenderTarget: boolean;
    }
}
declare namespace feng3d {
    interface TextureCubeEventMap {
        /**
         * 加载完成
         */
        loadCompleted: any;
    }
    interface TextureCube {
        once<K extends keyof TextureCubeEventMap>(type: K, listener: (event: Event<TextureCubeEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof TextureCubeEventMap>(type: K, data?: TextureCubeEventMap[K], bubbles?: boolean): Event<TextureCubeEventMap[K]>;
        has<K extends keyof TextureCubeEventMap>(type: K): boolean;
        on<K extends keyof TextureCubeEventMap>(type: K, listener: (event: Event<TextureCubeEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof TextureCubeEventMap>(type?: K, listener?: (event: Event<TextureCubeEventMap[K]>) => any, thisObject?: any): void;
    }
    type TextureCubeImageName = "positive_x_url" | "positive_y_url" | "positive_z_url" | "negative_x_url" | "negative_y_url" | "negative_z_url";
    /**
     * 立方体纹理
     */
    class TextureCube extends TextureInfo {
        __class__: "feng3d.TextureCube";
        textureType: TextureType;
        assetType: AssetType;
        static ImageNames: TextureCubeImageName[];
        OAVCubeMap: string;
        /**
         * 原始数据
         */
        rawData: {
            type: "texture";
            textures: Texture2D[];
        } | {
            type: "path";
            paths: string[];
        };
        noPixels: ImageDatas[];
        protected _pixels: any[];
        /**
         * 是否加载完成
         */
        get isLoaded(): boolean;
        private _loading;
        setTexture2D(pos: TextureCubeImageName, texture: Texture2D): void;
        setTexture2DPath(pos: TextureCubeImageName, path: string): void;
        getTextureImage(pos: TextureCubeImageName, callback: (img?: HTMLImageElement) => void): void;
        private _rawDataChanged;
        /**
         * 加载单个贴图
         *
         * @param texture 贴图
         * @param index 索引
         */
        private _loadItemTexture;
        /**
         * 加载单个图片
         *
         * @param imagepath 图片路径
         * @param index 索引
         */
        private _loadItemImagePath;
        private _onItemLoadCompleted;
        /**
         * 已加载完成或者加载完成时立即调用
         * @param callback 完成回调
         */
        onLoadCompleted(callback: () => void): void;
        static default: TextureCube;
    }
}
declare namespace feng3d {
    interface UniformsTypes {
    }
    type ShaderNames = keyof UniformsTypes;
    type UniformsLike = UniformsTypes[keyof UniformsTypes];
    /**
     * 材质
     */
    class Material extends AssetData {
        __class__: "feng3d.Material";
        static create<K extends keyof UniformsTypes>(shaderName: K, uniforms?: gPartial<UniformsTypes[K]>, renderParams?: gPartial<RenderParams>): Material;
        init<K extends keyof UniformsTypes>(shaderName: K, uniforms?: gPartial<UniformsTypes[K]>, renderParams?: gPartial<RenderParams>): this;
        private renderAtomic;
        private preview;
        /**
         * shader名称
         */
        shaderName: ShaderNames;
        name: string;
        /**
         * Uniform数据
         */
        uniforms: UniformsLike;
        /**
         * 渲染参数
         */
        renderParams: RenderParams;
        constructor();
        beforeRender(renderAtomic: RenderAtomic): void;
        /**
         * 是否加载完成
         */
        get isLoaded(): boolean;
        /**
         * 已加载完成或者加载完成时立即调用
         * @param callback 完成回调
         */
        onLoadCompleted(callback: () => void): void;
        private _onShaderChanged;
        private _onUniformsChanged;
        private _onRenderParamsChanged;
        /**
         * 设置默认材质
         *
         * 资源名称与材质名称相同，且无法在检查器界面中编辑。
         *
         * @param name 材质名称
         * @param material 材质数据
         */
        static setDefault<K extends keyof DefaultMaterial>(name: K, material: gPartial<Material>): void;
        /**
         * 获取材质
         *
         * @param name 材质名称
         */
        static getDefault<K extends keyof DefaultMaterial>(name: K): DefaultMaterial[K];
        private static _defaultMaterials;
    }
    /**
     * 默认材质
     */
    interface DefaultMaterial {
    }
}
declare namespace feng3d {
    /**
     * 雾模式
     */
    enum FogMode {
        NONE = 0,
        EXP = 1,
        EXP2 = 2,
        LINEAR = 3
    }
    interface UniformsTypes {
        standard: StandardUniforms;
    }
    class StandardUniforms {
        __class__: "feng3d.StandardUniforms" | "feng3d.TerrainUniforms" | "feng3d.ParticleUniforms";
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
         * 法线纹理
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
         * 环境光颜色
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
        /**
         * 雾的密度
         */
        u_fogDensity: number;
        /**
         * 雾模式
         */
        u_fogMode: FogMode;
    }
    interface DefaultMaterial {
        "Default-Material": Material;
    }
}
declare namespace feng3d {
    interface UniformsTypes {
        point: PointUniforms;
    }
    class PointUniforms {
        __class__: "feng3d.PointUniforms";
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
    interface UniformsTypes {
        color: ColorUniforms;
    }
    class ColorUniforms {
        __class__: "feng3d.ColorUniforms";
        /**
         * 颜色
         */
        u_diffuseInput: Color4;
    }
}
declare namespace feng3d {
    interface UniformsTypes {
        texture: TextureUniforms;
    }
    class TextureUniforms {
        __class__: "feng3d.TextureUniforms";
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
    interface UniformsTypes {
        segment: SegmentUniforms;
    }
    /**
     * 线段材质
     * 目前webgl不支持修改线条宽度，参考：https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth
     */
    class SegmentUniforms {
        __class__: "feng3d.SegmentUniforms";
        /**
         * 颜色
         */
        u_segmentColor: Color4;
    }
    interface DefaultMaterial {
        "Segment-Material": Material;
    }
}
declare namespace feng3d {
    /**
     * 阴影类型
     */
    enum ShadowType {
        /**
         * 没有阴影
         */
        No_Shadows = 0,
        /**
         * 硬阴影
         */
        Hard_Shadows = 1,
        /**
         * PCF 阴影
         */
        PCF_Shadows = 2,
        /**
         * PCF 软阴影
         */
        PCF_Soft_Shadows = 3
    }
}
declare namespace feng3d {
    /**
     * 灯光类型

     */
    enum LightType {
        /**
         * 方向光
         */
        Directional = 0,
        /**
         * 点光
         */
        Point = 1,
        /**
         * 聚光灯
         */
        Spot = 2
    }
}
declare namespace feng3d {
    /**
     * 灯光
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
         * 阴影类型
         */
        shadowType: ShadowType;
        /**
         * 光源位置
         */
        get position(): Vector3;
        /**
         * 光照方向
         */
        get direction(): Vector3;
        /**
         * 阴影偏差，用来解决判断是否为阴影时精度问题
         */
        shadowBias: number;
        /**
         * 阴影半径，边缘宽度
         */
        shadowRadius: number;
        /**
         * 阴影近平面距离
         */
        get shadowCameraNear(): number;
        /**
         * 阴影近平面距离
         */
        get shadowCameraFar(): number;
        /**
         * 投影摄像机
         */
        shadowCamera: Camera;
        /**
         * 阴影图尺寸
         */
        get shadowMapSize(): Vector2;
        get shadowMap(): RenderTargetTexture2D;
        /**
         * 帧缓冲对象，用于处理光照阴影贴图渲染
         */
        frameBufferObject: FrameBufferObject;
        debugShadowMap: boolean;
        private debugShadowMapObject;
        constructor();
        updateDebugShadowMap(scene: Scene, viewCamera: Camera): void;
    }
}
declare namespace feng3d {
    interface ComponentMap {
        DirectionalLight: DirectionalLight;
    }
    /**
     * 方向光源
     */
    class DirectionalLight extends Light {
        __class__: "feng3d.DirectionalLight";
        lightType: LightType;
        private orthographicLens;
        /**
         * 光源位置
         */
        get position(): Vector3;
        constructor();
        /**
         * 通过视窗摄像机进行更新
         * @param viewCamera 视窗摄像机
         */
        updateShadowByCamera(scene: Scene, viewCamera: Camera, models: Renderable[]): void;
    }
    interface PrimitiveGameObject {
        "Directional light": GameObject;
    }
}
declare namespace feng3d {
    interface ComponentMap {
        PointLight: PointLight;
    }
    /**
     * 点光源
     */
    class PointLight extends Light {
        __class__: "feng3d.PointLight";
        lightType: LightType;
        /**
         * 光照范围
         */
        get range(): number;
        set range(v: number);
        private _range;
        /**
         * 阴影图尺寸
         */
        get shadowMapSize(): Vector2;
        constructor();
        private invalidRange;
    }
    interface PrimitiveGameObject {
        "Point light": GameObject;
    }
}
declare namespace feng3d {
    interface ComponentMap {
        SpotLight: SpotLight;
    }
    /**
     * 聚光灯光源
     */
    class SpotLight extends Light {
        lightType: LightType;
        /**
         * 光照范围
         */
        range: number;
        /**
         *
         */
        angle: number;
        /**
         * 半影.
         */
        penumbra: number;
        /**
         * 椎体cos值
         */
        get coneCos(): number;
        get penumbraCos(): number;
        private perspectiveLens;
        constructor();
        private _invalidRange;
        private _invalidAngle;
    }
    interface PrimitiveGameObject {
        "Spot light": GameObject;
    }
}
declare namespace feng3d {
    class LightPicker {
        private _model;
        constructor(model: Renderable);
        beforeRender(renderAtomic: RenderAtomic): void;
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
        get targetObject(): GameObject;
        set targetObject(val: GameObject);
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
        get upAxis(): Vector3;
        set upAxis(upAxis: Vector3);
        get lookAtPosition(): Vector3;
        set lookAtPosition(val: Vector3);
        get lookAtObject(): GameObject;
        set lookAtObject(value: GameObject);
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
        get steps(): number;
        set steps(val: number);
        get panAngle(): number;
        set panAngle(val: number);
        get tiltAngle(): number;
        set tiltAngle(val: number);
        get distance(): number;
        set distance(val: number);
        get minPanAngle(): number;
        set minPanAngle(val: number);
        get maxPanAngle(): number;
        set maxPanAngle(val: number);
        get minTiltAngle(): number;
        set minTiltAngle(val: number);
        get maxTiltAngle(): number;
        set maxTiltAngle(val: number);
        get yFactor(): number;
        set yFactor(val: number);
        get wrapPanAngle(): boolean;
        set wrapPanAngle(val: boolean);
        constructor(targetObject?: GameObject, lookAtObject?: GameObject, panAngle?: number, tiltAngle?: number, distance?: number, minTiltAngle?: number, maxTiltAngle?: number, minPanAngle?: number, maxPanAngle?: number, steps?: number, yFactor?: number, wrapPanAngle?: boolean);
        update(interpolate?: boolean): void;
    }
}
declare namespace feng3d {
    interface ComponentMap {
        FPSController: FPSController;
    }
    /**
     * FPS模式控制器
     */
    class FPSController extends Behaviour {
        /**
         * 加速度
         */
        acceleration: number;
        runEnvironment: RunEnvironment;
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
        get auto(): boolean;
        set auto(value: boolean);
        init(): void;
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
        private onMouseMove;
        /**
         * 键盘按下事件
         */
        private onKeydown;
        /**
         * 键盘弹起事件
         */
        private onKeyup;
        /**
         * 停止xyz方向运动
         * @param direction     停止运动的方向
         */
        private stopDirectionVelocity;
    }
}
declare namespace feng3d {
    /**
     * 射线投射拾取器
     */
    var raycaster: Raycaster;
    /**
     * 射线投射拾取器
     */
    class Raycaster {
        /**
         * 获取射线穿过的实体
         * @param ray3D 射线
         * @param gameObjects 实体列表
         * @return
         */
        pick(ray3D: Ray3, gameObjects: GameObject[]): PickingCollisionVO;
        /**
         * 获取射线穿过的实体
         * @param ray3D 射线
         * @param gameObjects 实体列表
         * @return
         */
        pickAll(ray3D: Ray3, gameObjects: GameObject[]): PickingCollisionVO[];
    }
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
        localRay: Ray3;
        /**
         * 本地坐标碰撞法线
         */
        localNormal: Vector3;
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
        /**
         * 剔除面
         */
        cullFace: CullFace;
    }
}
declare namespace feng3d {
    var audioCtx: AudioContext;
    var globalGain: GainNode;
    interface ComponentMap {
        AudioListener: AudioListener;
    }
    /**
     * 声音监听器
     */
    class AudioListener extends Behaviour {
        gain: GainNode;
        enabled: boolean;
        /**
         * 音量
         */
        get volume(): number;
        set volume(v: number);
        private _volume;
        constructor();
        init(): void;
        private _onScenetransformChanged;
        private _enabledChanged;
        dispose(): void;
    }
}
declare namespace feng3d {
    /**
     * 音量与距离算法
     * @see https://developer.mozilla.org/en-US/docs/Web/API/PannerNode/distanceModel
     * @see https://mdn.github.io/webaudio-examples/panner-node/
     * @see https://github.com/mdn/webaudio-examples
     */
    enum DistanceModelType {
        /**
         * 1 - rolloffFactor * (distance - refDistance) / (maxDistance - refDistance)
         */
        linear = "linear",
        /**
         * refDistance / (refDistance + rolloffFactor * (distance - refDistance))
         */
        inverse = "inverse",
        /**
         * pow(distance / refDistance, -rolloffFactor)
         */
        exponential = "exponential"
    }
    interface ComponentMap {
        AudioSource: AudioSource;
    }
    /**
     * 声源
     * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
     */
    class AudioSource extends Behaviour {
        private panner;
        private source;
        private buffer;
        private gain;
        enabled: boolean;
        /**
         * 声音文件路径
         */
        url: string;
        /**
         * 是否循环播放
         */
        get loop(): boolean;
        set loop(v: boolean);
        private _loop;
        /**
         * 音量
         */
        get volume(): number;
        set volume(v: number);
        private _volume;
        /**
         * 是否启用位置影响声音
         */
        get enablePosition(): boolean;
        set enablePosition(v: boolean);
        private _enablePosition;
        get coneInnerAngle(): number;
        set coneInnerAngle(v: number);
        private _coneInnerAngle;
        get coneOuterAngle(): number;
        set coneOuterAngle(v: number);
        private _coneOuterAngle;
        get coneOuterGain(): number;
        set coneOuterGain(v: number);
        private _coneOuterGain;
        /**
         * 该接口的distanceModel属性PannerNode是一个枚举值，用于确定在音频源离开收听者时用于减少音频源音量的算法。
         *
         * 可能的值是：
         * * linear：根据以下公式计算由距离引起的增益的线性距离模型：
         *      1 - rolloffFactor * (distance - refDistance) / (maxDistance - refDistance)
         * * inverse：根据以下公式计算由距离引起的增益的反距离模型：
         *      refDistance / (refDistance + rolloffFactor * (distance - refDistance))
         * * exponential：按照下式计算由距离引起的增益的指数距离模型
         *      pow(distance / refDistance, -rolloffFactor)。
         *
         * inverse是的默认值distanceModel。
         */
        get distanceModel(): DistanceModelType;
        set distanceModel(v: DistanceModelType);
        private _distanceModel;
        /**
         * 表示音频源和收听者之间的最大距离，之后音量不会再降低。该值仅由linear距离模型使用。默认值是10000。
         */
        get maxDistance(): number;
        set maxDistance(v: number);
        private _maxDistance;
        get panningModel(): PanningModelType;
        set panningModel(v: PanningModelType);
        private _panningModel;
        /**
         * 表示随着音频源远离收听者而减小音量的参考距离。此值由所有距离模型使用。默认值是1。
         */
        get refDistance(): number;
        set refDistance(v: number);
        private _refDistance;
        /**
         * 描述了音源离开收听者音量降低的速度。此值由所有距离模型使用。默认值是1。
         */
        get rolloffFactor(): number;
        set rolloffFactor(v: number);
        private _rolloffFactor;
        constructor();
        init(): void;
        play(): void;
        stop(): void;
        private _onScenetransformChanged;
        private _onUrlChanged;
        private _connect;
        private _disconnect;
        private _getAudioNodes;
        private _enabledChanged;
        dispose(): void;
    }
}
declare function createPanner(): PannerNode;
declare namespace feng3d {
    interface ComponentMap {
        Water: Water;
    }
    /**
     * The Water component renders the terrain.
     */
    class Water extends Renderable {
        __class__: "feng3d.Water";
        geometry: PlaneGeometry;
        material: Material;
        /**
         * 帧缓冲对象，用于处理水面反射
         */
        private frameBufferObject;
        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera): void;
    }
    interface PrimitiveGameObject {
        Water: GameObject;
    }
}
declare namespace feng3d {
    interface UniformsTypes {
        water: WaterUniforms;
    }
    class WaterUniforms {
        __class__: "feng3d.WaterUniforms";
        u_alpha: number;
        /**
         * 水体运动时间，默认自动递增
         */
        u_time: number;
        u_size: number;
        u_distortionScale: number;
        u_waterColor: Color3;
        s_normalSampler: Texture2D;
        /**
         * 镜面反射贴图
         */
        s_mirrorSampler: Texture2D;
        u_textureMatrix: Matrix4x4;
        u_sunColor: Color3;
        u_sunDirection: Vector3;
    }
    interface DefaultMaterial {
        "Water-Material": Material;
    }
}
declare namespace feng3d {
    interface GeometryTypes {
        TerrainGeometry: TerrainGeometry;
    }
    /**
     * 地形几何体
     */
    class TerrainGeometry extends Geometry {
        /**
         * 高度图路径
         */
        heightMap: Texture2D;
        /**
         * 地形宽度
         */
        width: number;
        /**
         * 地形高度
         */
        height: number;
        /**
         * 地形深度
         */
        depth: number;
        /**
         * 横向网格段数
         */
        segmentsW: number;
        /**
         * 纵向网格段数
         */
        segmentsH: number;
        /**
         * 最大地形高度
         */
        maxElevation: number;
        /**
         * 最小地形高度
         */
        minElevation: number;
        private _heightImageData;
        /**
         * 创建高度地形 拥有segmentsW*segmentsH个顶点
         */
        constructor(raw?: gPartial<TerrainGeometry>);
        private _onHeightMapChanged;
        /**
         * 创建顶点坐标
         */
        protected buildGeometry(): void;
        /**
         * 创建uv坐标
         */
        private buildUVs;
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
        private getPixel;
    }
    interface DefaultGeometry {
        "Terrain-Geometry": TerrainGeometry;
    }
}
declare namespace feng3d {
    interface UniformsTypes {
        terrain: TerrainUniforms;
    }
    class TerrainUniforms extends StandardUniforms {
        __class__: "feng3d.TerrainUniforms";
        s_splatTexture1: Texture2D;
        s_splatTexture2: Texture2D;
        s_splatTexture3: Texture2D;
        s_blendTexture: Texture2D;
        u_splatRepeats: Vector4;
    }
    interface DefaultMaterial {
        "Terrain-Material": Material;
    }
}
declare namespace feng3d {
    /**
     * 地形材质
     */
    class TerrainMergeMethod extends EventDispatcher {
        splatMergeTexture: Texture2D;
        blendTexture: Texture2D;
        splatRepeats: Vector4;
        /**
         * 构建材质
         */
        constructor();
        beforeRender(renderAtomic: RenderAtomic): void;
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
        get heightmapWidth(): number;
        /**
         * Height of the terrain in samples(Read Only).
         */
        get heightmapHeight(): number;
        /**
         * Resolution of the heightmap.
         */
        heightmapResolution: number;
        /**
         * The size of each heightmap sample.
         */
        get heightmapScale(): Vector3;
        /**
         * The total size in world units of the terrain.
         */
        size: Vector3;
    }
}
declare namespace feng3d {
    interface ComponentMap {
        Terrain: Terrain;
    }
    /**
     * The Terrain component renders the terrain.
     */
    class Terrain extends Renderable {
        __class__: "feng3d.Terrain";
        /**
         * 地形资源
         */
        assign: TerrainData;
        geometry: TerrainGeometry;
        material: Material;
    }
    interface PrimitiveGameObject {
        Terrain: GameObject;
    }
}
declare namespace feng3d {
    /**
     * 骨骼关节数据

     */
    class SkeletonJoint {
        /** 父关节索引 （-1说明本身是总父结点，这个序号其实就是行号了，譬如上面”origin“结点的序号就是0，无父结点； "body"结点序号是1，父结点序号是0，也就是说父结点是”origin“）*/
        parentIndex: number;
        /** 关节名字 */
        name: string;
        /** 骨骼全局矩阵 */
        matrix: Matrix4x4;
        children: number[];
        get invertMatrix(): Matrix4x4;
        private _invertMatrix;
    }
}
declare namespace feng3d {
    interface ComponentMap {
        SkeletonComponent: SkeletonComponent;
    }
    class SkeletonComponent extends Component {
        __class__: "feng3d.SkeletonComponent";
        /** 骨骼关节数据列表 */
        joints: SkeletonJoint[];
        /**
         * 当前骨骼姿势的全局矩阵
         * @see #globalPose
         */
        get globalMatrices(): Matrix4x4[];
        private isInitJoints;
        private jointGameobjects;
        private jointGameObjectMap;
        private _globalPropertiesInvalid;
        private _jointsInvalid;
        private _globalMatrixsInvalid;
        private globalMatrixs;
        private _globalMatrices;
        initSkeleton(): void;
        /**
         * 更新骨骼全局变换矩阵
         */
        private updateGlobalProperties;
        private invalidjoint;
        private createSkeletonGameObject;
    }
}
declare namespace feng3d {
    interface ComponentMap {
        SkinnedMeshRenderer: SkinnedMeshRenderer;
    }
    class SkinnedMeshRenderer extends Renderable {
        __class__: "feng3d.SkinnedMeshRenderer";
        get single(): boolean;
        skinSkeleton: SkinSkeleton;
        initMatrix: Matrix4x4;
        /**
         * 创建一个骨骼动画类
         */
        init(): void;
        beforeRender(renderAtomic: RenderAtomic, scene: Scene, camera: Camera): void;
        /**
         * 销毁
         */
        dispose(): void;
        /**
         * 缓存，通过寻找父结点获得
         */
        private cacheSkeletonComponent;
        private cacheU_skeletonGlobalMatriices;
        private get u_modelMatrix();
        private get u_ITModelMatrix();
        private get u_skeletonGlobalMatriices();
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
    class PropertyClip {
        /**
         * 属性路径
         */
        path: PropertyClipPath;
        propertyName: string;
        type: "Number" | "Vector3" | "Quaternion";
        propertyValues: [number, number[]][];
        private _cacheValues;
        private _propertyValues;
        getValue(cliptime: number, fps: number): any;
        private interpolation;
        private getpropertyValue;
        cacheIndex: number;
    }
    /**
     * [time:number,value:number | Vector3 | Quaternion]
     */
    type ClipPropertyType = number | Vector3 | Quaternion;
    type PropertyClipPath = [PropertyClipPathItemType, string][];
    enum PropertyClipPathItemType {
        GameObject = 0,
        Component = 1
    }
}
declare namespace feng3d {
    class AnimationClip extends AssetData {
        readonly assetType = AssetType.anim;
        name: string;
        /**
         * 动画时长，单位ms
         */
        length: number;
        loop: boolean;
        propertyClips: PropertyClip[];
    }
}
declare namespace feng3d {
    interface ComponentMap {
        Animation: Animation;
    }
    class Animation extends Behaviour {
        animation: AnimationClip;
        animations: AnimationClip[];
        /**
         * 动画事件，单位为ms
         */
        time: number;
        isplaying: boolean;
        /**
         * 播放速度
         */
        playspeed: number;
        /**
         * 动作名称
         */
        get clipName(): string;
        get frame(): number;
        update(interval: number): void;
        dispose(): void;
        private num;
        private _fps;
        private _objectCache;
        private _updateAni;
        private getPropertyHost;
        private _onAnimationChanged;
        private _onTimeChanged;
    }
}
declare namespace feng3d {
    /**
     * 文件夹资源
     */
    class FolderAsset extends FileAsset {
        static extenson: string;
        assetType: AssetType;
        /**
         * 子资源列表
         */
        get childrenAssets(): FileAsset[];
        initAsset(): void;
        /**
         * 删除资源
         *
         * @param callback 完成回调
         */
        delete(callback?: (err: Error) => void): void;
        /**
         * 保存文件
         * @param callback 完成回调
         */
        saveFile(callback?: (err: Error) => void): void;
        /**
         * 读取文件
         * @param callback 完成回调
         */
        readFile(callback?: (err: Error) => void): void;
    }
}
declare namespace feng3d {
    /**
     * 二进制 资源
     */
    class ArrayBufferAsset extends FileAsset {
        /**
         * 文件数据
         */
        arraybuffer: ArrayBuffer;
        /**
         * 保存文件
         *
         * @param callback 完成回调
         */
        saveFile(callback?: (err: Error) => void): void;
        /**
         * 读取文件
         *
         * @param callback 完成回调
         */
        readFile(callback?: (err: Error) => void): void;
    }
}
declare namespace feng3d {
    /**
     * 字符串 资源
     */
    abstract class StringAsset extends FileAsset {
        textContent: string;
        saveFile(callback?: (err: Error) => void): void;
        /**
         * 读取文件
         *
         * @param callback 完成回调
         */
        readFile(callback?: (err: Error) => void): void;
    }
}
declare namespace feng3d {
    /**
     * 对象资源
     */
    abstract class ObjectAsset extends FileAsset {
        /**
         * 资源对象
         */
        data: AssetData;
        saveFile(callback?: (err: Error) => void): void;
        /**
         * 读取文件
         *
         * @param callback 完成回调
         */
        readFile(callback?: (err: Error) => void): void;
        private _dataChanged;
        private _onDataChanged;
    }
}
declare namespace feng3d {
    /**
     * 脚本资源
     */
    class ScriptAsset extends StringAsset {
        static extenson: string;
        assetType: AssetType;
        textContent: string;
        /**
         * 脚本父类名称
         */
        get parentScriptName(): string;
        private _parentScriptName;
        /**
         * 脚本类定义
         */
        get scriptName(): string;
        private _scriptName;
        private _invalid;
        initAsset(): void;
        private _invalidate;
        private _update;
    }
}
declare namespace feng3d {
    /**
     * 着色器 资源
     */
    class ShaderAsset extends ScriptAsset {
        static extenson: string;
        assetType: AssetType;
    }
}
declare namespace feng3d {
    /**
     * JS资源
     */
    class JSAsset extends StringAsset {
        static extenson: string;
        assetType: AssetType;
        textContent: string;
        initAsset(): void;
    }
}
declare namespace feng3d {
    /**
     * JSON 资源
     */
    class JsonAsset extends StringAsset {
        static extenson: string;
        assetType: AssetType;
        textContent: string;
        initAsset(): void;
    }
}
declare namespace feng3d {
    class TextAsset extends StringAsset {
        static extenson: string;
        assetType: AssetType;
        textContent: string;
        initAsset(): void;
    }
}
declare namespace feng3d {
    /**
     * 音效资源
     */
    class AudioAsset extends ArrayBufferAsset {
        readonly assetType = AssetType.audio;
    }
}
declare namespace feng3d {
    /**
     * 纹理文件
     */
    class TextureAsset extends FileAsset {
        static extenson: ".jpg" | ".png" | ".jpeg" | ".gif";
        /**
         * 材质
         */
        data: Texture2D;
        /**
         * 图片
         */
        get image(): HTMLImageElement;
        set image(v: HTMLImageElement);
        meta: TextureAssetMeta;
        assetType: AssetType;
        initAsset(): void;
        saveFile(callback?: (err: Error) => void): void;
        /**
         * 读取文件
         *
         * @param callback 完成回调
         */
        readFile(callback?: (err: Error) => void): void;
        /**
         * 读取元标签
         *
         * @param callback 完成回调
         */
        protected readMeta(callback?: (err?: Error) => void): void;
        /**
         * 写元标签
         *
         * @param callback 完成回调
         */
        protected writeMeta(callback?: (err: Error) => void): void;
    }
    interface TextureAssetMeta extends AssetMeta {
        texture: gPartial<Texture2D>;
    }
}
declare namespace feng3d {
    /**
     * 立方体纹理资源
     */
    class TextureCubeAsset extends ObjectAsset {
        static extenson: string;
        /**
         * 材质
         */
        data: TextureCube;
        assetType: AssetType;
        initAsset(): void;
    }
}
declare namespace feng3d {
    /**
     * 几何体资源
     */
    class GeometryAsset extends ObjectAsset {
        static extenson: string;
        /**
         * 几何体
         */
        data: Geometry;
        assetType: AssetType;
        initAsset(): void;
    }
}
declare namespace feng3d {
    /**
     * 材质资源
     */
    class MaterialAsset extends ObjectAsset {
        static extenson: string;
        /**
         * 材质
         */
        data: Material;
        assetType: AssetType;
        initAsset(): void;
    }
}
declare namespace feng3d {
    interface GameObjectAsset {
        getAssetData(callback?: (result: GameObject) => void): GameObject;
    }
    /**
     * 游戏对象资源
     */
    class GameObjectAsset extends ObjectAsset {
        /**
         * 材质
         */
        data: GameObject;
        assetType: AssetType;
        static extenson: string;
        initAsset(): void;
        protected _getAssetData(): GameObject;
    }
}
declare namespace feng3d {
    /**
     * OBJ模型解析器
     */
    var objParser: OBJParser;
    /**
     * OBJ模型解析器
     */
    class OBJParser {
        /**
         * 解析
         * @param context
         */
        parser(context: string): OBJ_OBJData;
    }
    /**
     * 面数据
     */
    type OBJ_Face = {
        /** 顶点索引 */
        vertexIndices: string[];
        /** uv索引 */
        uvIndices?: string[];
        /** 法线索引 */
        normalIndices?: string[];
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
        /**
         * 模型名称
         */
        name?: string;
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
     * OBJ模型MTL材质解析器
     */
    var mtlParser: MTLParser;
    /**
     * OBJ模型MTL材质解析器
     */
    class MTLParser {
        /**
         * 解析
         * @param context
         */
        parser(context: string): Mtl_Mtl;
    }
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
     * MD5模型解析器
     */
    var md5MeshParser: MD5MeshParser;
    /**
     * MD5模型解析器
     */
    class MD5MeshParser {
        /**
         * 解析
         * @param context
         */
        parse(context: string): MD5MeshData;
    }
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
        name?: string;
        MD5Version: number;
        commandline: string;
        numJoints: number;
        numMeshes: number;
        joints: MD5_Joint[];
        meshs: MD5_Mesh[];
    };
}
declare namespace feng3d {
    /**
     * MD5动画解析器
     */
    var md5AnimParser: MD5AnimParser;
    /**
     * MD5动画解析器
     */
    class MD5AnimParser {
        /**
         * 解析
         * @param context
         */
        parse(context: string): MD5AnimData;
    }
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
        /** 父结点序号 */
        parentIndex: number;
        /** flag */
        flags: number;
        /** 影响的帧数据起始索引 */
        startIndex: number;
    };
    type MD5AnimData = {
        name?: string;
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
     */
    class AnimAlpha {
        constructor();
    }
    /**
     * 全局动作信息
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
        private getMatrix;
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
     */
    class FBitmap {
        /** 图片地址 */
        image: string;
        /** 可替换纹理id */
        ReplaceableId: number;
    }
    /**
     * 几何设置
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
     */
    class GeosetAnim {
        constructor();
    }
    /**
     * 全局序列
     */
    class Globalsequences {
        /** 全局序列编号 */
        id: number;
        /** 持续时间 */
        durations: number[];
    }
    /**
     * 动作间隔
     */
    class Interval {
        /** 开始时间 */
        start: number;
        /** 结束时间 */
        end: number;
    }
    /**
     * 材质层
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
     */
    class Material {
        /** 材质层列表 */
        layers: Layer[];
        /**
         * created 材质
         */
        material: feng3d.Material;
    }
    /**
     * 模型信息
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
        private meshs;
        private skeletonComponent;
        getMesh(): GameObject;
        private getFBitmap;
    }
}
declare namespace feng3d.war3 {
    /**
     * war3的mdl文件解析器
     */
    var mdlParser: MDLParser;
    /**
     * war3的mdl文件解析器
     */
    class MDLParser {
        /**
         * 解析war3的mdl文件
         * @param data MDL模型数据
         * @param completed 完成回调
         */
        parse(data: string, completed?: (war3Model: War3Model) => void): void;
    }
}
declare namespace feng3d {
    /**
     * OBJ模型MTL材质转换器
     */
    var mtlConverter: MTLConverter;
    /**
     * OBJ模型MTL材质转换器
     */
    class MTLConverter {
        /**
         * OBJ模型MTL材质原始数据转换引擎中材质对象
         * @param mtl MTL材质原始数据
         */
        convert(mtl: Mtl_Mtl, completed?: (err: Error, materials: {
            [name: string]: Material;
        }) => void): void;
    }
}
declare namespace feng3d {
    /**
     * OBJ模型转换器
     */
    var objConverter: OBJConverter;
    /**
     * OBJ模型转换器
     */
    class OBJConverter {
        /**
         * OBJ模型数据转换为游戏对象
         * @param objData OBJ模型数据
         * @param materials 材质列表
         * @param completed 转换完成回调
         */
        convert(objData: OBJ_OBJData, materials: {
            [name: string]: Material;
        }, completed: (gameObject: GameObject) => void): void;
    }
}
declare namespace feng3d {
    /**
     * MD5模型转换器
     */
    var md5MeshConverter: MD5MeshConverter;
    /**
     * MD5模型转换器
     */
    class MD5MeshConverter {
        /**
         * MD5模型数据转换为游戏对象
         * @param md5MeshData MD5模型数据
         * @param completed 转换完成回调
         */
        convert(md5MeshData: MD5MeshData, completed?: (gameObject: GameObject) => void): void;
        /**
         * 计算最大关节数量
         */
        private calculateMaxJointCount;
        /**
         * 计算0权重关节数量
         * @param vertex 顶点数据
         * @param weights 关节权重数组
         * @return
         */
        private countZeroWeightJoints;
        private createSkeleton;
        private createSkeletonJoint;
        private createGeometry;
    }
}
declare namespace feng3d {
    /**
     * MD5动画转换器
     */
    var md5AnimConverter: MD5AnimConverter;
    /**
     * MD5动画转换器
     */
    class MD5AnimConverter {
        /**
         * MD5动画数据转换为引擎动画数据
         * @param md5AnimData MD5动画数据
         * @param completed 转换完成回调
         */
        convert(md5AnimData: MD5AnimData, completed?: (animationClip: AnimationClip) => void): void;
    }
}
declare namespace feng3d {
    /**
     * OBJ模型MTL材质加载器
     */
    var mtlLoader: MTLLoader;
    /**
     * OBJ模型MTL材质加载器
     */
    class MTLLoader {
        /**
         * 加载MTL材质
         * @param path MTL材质文件路径
         * @param completed 加载完成回调
         */
        load(path: string, completed?: (err: Error, materials: {
            [name: string]: Material;
        }) => void): void;
    }
}
declare namespace feng3d {
    /**
     * Obj模型加载类
     */
    var objLoader: ObjLoader;
    /**
     * Obj模型加载类
     */
    class ObjLoader {
        /**
         * 加载资源
         * @param url   路径
         */
        load(url: string, completed?: (gameObject: GameObject) => void): void;
    }
}
declare namespace feng3d {
    /**
     * MD5模型加载类
     */
    var md5Loader: MD5Loader;
    /**
     * MD5模型加载类
     */
    class MD5Loader {
        /**
         * 加载资源
         * @param url   路径
         * @param completed 加载完成回调
         */
        load(url: string, completed?: (gameObject: GameObject) => void): void;
        /**
         * 加载MD5模型动画
         * @param url MD5模型动画资源路径
         * @param completed 加载完成回调
         */
        loadAnim(url: string, completed?: (animationClip: AnimationClip) => void): void;
    }
}
declare namespace feng3d {
    /**
     * MDL模型加载器
     */
    var mdlLoader: MDLLoader;
    /**
     * MDL模型加载器
     */
    class MDLLoader {
        /**
         * 加载MDL模型
         * @param mdlurl MDL模型路径
         * @param callback 加载完成回调
         */
        load(mdlurl: string, callback?: (gameObject: GameObject) => void): void;
    }
}
declare namespace feng3d {
    /**
     * 鼠标事件管理
     */
    class Mouse3DManager {
        mouseInput: MouseInput;
        get selectedGameObject(): GameObject;
        set selectedGameObject(v: GameObject);
        /**
         * 视窗，鼠标在该矩形内时为有效事件
         */
        viewport: Lazy<Rectangle>;
        /**
         * 拾取
         * @param scene 场景
         * @param camera 摄像机
         */
        pick(view: View, scene: Scene, camera: Camera): GameObject;
        constructor(mouseInput: MouseInput, viewport?: Lazy<Rectangle>);
        private _selectedGameObject;
        private _mouseEventTypes;
        /**
         * 鼠标按下时的对象，用于与鼠标弹起时对象做对比，如果相同触发click
         */
        private preMouseDownGameObject;
        /**
         * 统计处理click次数，判断是否达到dblclick
         */
        private gameObjectClickNum;
        private _mouseInputChanged;
        private dispatch;
        /**
         * 监听鼠标事件收集事件类型
         */
        private onMouseEvent;
        /**
         * 设置选中对象
         */
        private setSelectedGameObject;
    }
    interface MouseInput {
        once<K extends keyof MouseEventMap>(type: K, listener: (event: Event<MouseEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        has<K extends keyof MouseEventMap>(type: K): boolean;
        on<K extends keyof MouseEventMap>(type: K, listener: (event: Event<MouseEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof MouseEventMap>(type?: K, listener?: (event: Event<MouseEventMap[K]>) => any, thisObject?: any): void;
    }
    /**
     * 鼠标事件输入
     */
    class MouseInput extends EventDispatcher {
        /**
         * 是否启动
         */
        enable: boolean;
        /**
         * 是否捕获鼠标移动
         */
        catchMouseMove: boolean;
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        dispatch(type: string, data?: any, bubbles?: boolean): Event<any>;
        /**
         * 派发事件
         * @param event   事件对象
         */
        dispatchEvent(event: Event<any>): boolean;
    }
    /**
     * Window鼠标事件输入
     */
    class WindowMouseInput extends MouseInput {
        constructor();
        /**
         * 监听鼠标事件收集事件类型
         */
        private onMouseEvent;
    }
    interface MouseEventMap {
        /**
         * 鼠标移出对象
         */
        mouseout: {
            clientX: number;
            clientY: number;
        };
        /**
         * 鼠标移入对象
         */
        mouseover: {
            clientX: number;
            clientY: number;
        };
        /**
         * 鼠标在对象上移动
         */
        mousemove: {
            clientX: number;
            clientY: number;
        };
        /**
         * 鼠标左键按下
         */
        mousedown: {
            clientX: number;
            clientY: number;
        };
        /**
         * 鼠标左键弹起
         */
        mouseup: {
            clientX: number;
            clientY: number;
        };
        /**
         * 单击
         */
        click: {
            clientX: number;
            clientY: number;
        };
        /**
         * 鼠标中键按下
         */
        middlemousedown: {
            clientX: number;
            clientY: number;
        };
        /**
         * 鼠标中键弹起
         */
        middlemouseup: {
            clientX: number;
            clientY: number;
        };
        /**
         * 鼠标中键单击
         */
        middleclick: {
            clientX: number;
            clientY: number;
        };
        /**
         * 鼠标右键按下
         */
        rightmousedown: {
            clientX: number;
            clientY: number;
        };
        /**
         * 鼠标右键弹起
         */
        rightmouseup: {
            clientX: number;
            clientY: number;
        };
        /**
         * 鼠标右键单击
         */
        rightclick: {
            clientX: number;
            clientY: number;
        };
        /**
         * 鼠标双击
         */
        dblclick: {
            clientX: number;
            clientY: number;
        };
    }
}
declare namespace feng3d {
    /**
     * 版本号
     */
    var version: string;
}
//# sourceMappingURL=feng3d.d.ts.map