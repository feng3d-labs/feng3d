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
     * @author feng 2016-3-10
     */
    var objectview: ObjectView;
    interface ObjectView {
        getObjectView: (object: Object) => any;
        getAttributeView: (attributeViewInfo: AttributeViewInfo) => any;
        getBlockView: (blockViewInfo: BlockViewInfo) => any;
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
        defaultTypeAttributeView: {
            [attributeType: string]: AttributeTypeDefinition;
        };
        OAVComponent: {};
        OBVComponent: {};
        OVComponent: {};
        addOAV<K extends keyof OAVComponentParam>(target: any, propertyKey: string, param?: {
            block?: string;
            component?: K;
            componentParam?: OAVComponentParam[K];
        }): any;
        getObjectInfo(object: Object): ObjectViewInfo;
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
         * 更新界面
         */
        updateView(): void;
        /**
         * 块名称
         */
        blockName: string;
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
        once(type: string, listener: (event: any) => void, thisObject?: null, priority?: number): void;
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
    }
    /**
     * 键盘鼠标输入
     */
    var windowEventProxy: EventProxy<WindowEventMap>;
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
            bundleId?: string | undefined;
            success?: (() => void) | undefined;
            error?: ((pathsNotFound?: string[] | undefined) => void) | undefined;
            async?: boolean | undefined;
            numRetries?: number | undefined;
            before?: ((path: {
                url: string;
                type: string;
            }, e: any) => boolean) | undefined;
            onitemload?: ((url: string, content: string) => void) | undefined;
        }) => void;
        ready: (params: {
            depends: string | string[];
            success?: (() => void) | undefined;
            error?: ((pathsNotFound?: string[] | undefined) => void) | undefined;
        }) => void;
    };
}
declare namespace feng3d {
    var watcher: {
        watch: <T extends Object>(host: T, property: keyof T, handler: (host: any, property: string, oldvalue: any) => void, thisObject?: any) => void;
        unwatch: <T extends Object>(host: T, property: keyof T, handler?: ((host: any, property: string, oldvalue: any) => void) | undefined, thisObject?: any) => void;
    };
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
    var dataTransform: {
        blobToArrayBuffer(blob: Blob, callback: (arrayBuffer: ArrayBuffer) => void): void;
        arrayBufferToBlob(arrayBuffer: ArrayBuffer, callback: (blob: Blob) => void): void;
        arrayBufferToUint8(arrayBuffer: ArrayBuffer, callback: (uint8Array: Uint8Array) => void): void;
        uint8ToArrayBuffer(uint8Array: Uint8Array, callback: (arrayBuffer: ArrayBuffer) => void): void;
        arrayToArrayBuffer(array: number[], callback: (arrayBuffer: ArrayBuffer) => void): void;
        uint8ArrayToArray(u8a: Uint8Array): number[];
        canvasToDataURL(canvas: HTMLCanvasElement, type: "png" | "jpeg", callback: (dataurl: string) => void): void;
        blobToDataURL(blob: Blob, callback: (dataurl: string) => void): void;
        dataURLtoBlob(dataurl: string, callback: (blob: Blob) => void): void;
        dataURLDrawCanvas(dataurl: string, canvas: HTMLCanvasElement, callback: (img: HTMLImageElement) => void): void;
        arrayBufferToDataURL(arrayBuffer: ArrayBuffer, callback: (dataurl: string) => void): void;
        blobToText(blob: Blob, callback: (content: string) => void): void;
        arrayBufferToText(arrayBuffer: ArrayBuffer, callback: (content: string) => void): void;
        stringToUint8Array(str: string, callback: (uint8Array: Uint8Array) => void): void;
        uint8ArrayToString(arr: Uint8Array, callback: (str: string) => void): void;
    };
}
declare namespace feng3d {
    /**
     * 类工具
     * @author feng 2017-02-15
     */
    var ClassUtils: {
        getQualifiedClassName: (value: any) => string;
        getDefinitionByName: (name: string) => any;
        addClassNameSpace: (namespace: string) => void;
    };
}
declare namespace feng3d {
    /**
     * 对象工具
     * @author feng 2017-02-15
     */
    class ObjectUtils {
        /**
         * 深克隆
         * @param source        源数据
         * @returns             克隆数据
         */
        static deepClone<T extends Object>(source: T): T;
        /**
         * 获取实例
         * @param source 实例对象
         */
        static getInstance<T extends Object>(source: T): T;
        /**
         * （浅）克隆
         * @param source        源数据
         * @returns             克隆数据
         */
        static clone<T extends Object>(source: T): T;
        /**
         * （浅）拷贝数据
         */
        static copy(target: Object, source: Object): void;
        /**
         * 深拷贝数据
         */
        static deepCopy(target: Object, source: Object): void;
        /**
         * 合并数据
         * @param source        源数据
         * @param mergeData     合并数据
         * @param createNew     是否合并为新对象，默认为false
         * @returns             如果createNew为true时返回新对象，否则返回源数据
         */
        static merge<T>(source: T, mergeData: Object, createNew?: boolean): T;
    }
}
declare namespace feng3d {
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
declare namespace feng3d {
    var numberutils: {
        fixed: {
            (a: number, fractionDigits?: any): number;
            <T extends ArrayLike<number>>(source: T, fractionDigits?: any): T;
            <T extends ArrayLike<number>>(source: ArrayLike<number>, fractionDigits?: any, target?: T | undefined): T;
        };
        toArray: <T extends ArrayLike<number>>(source: T, target?: number[] | undefined) => number[];
    };
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
declare namespace feng3d {
    /**
     * @description Basically a very large random number (128-bit) which means the probability of creating two that clash is vanishingly small.
     * GUIDs are used as the unique identifiers for Entities.
     * @see https://github.com/playcanvas/engine/blob/master/src/core/guid.js
     */
    var guid: {
        create: () => string;
    };
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
}
declare namespace feng3d {
    class RawData {
        createGameObject(raw: GameObjectRaw): GameObject;
        create(raw: GameObjectRaw): GameObject;
    }
    var rawData: RawData;
    interface GameObjectRaw {
        __class__: "feng3d.GameObject";
        name?: string;
        children?: GameObjectRaw[];
        components?: ComponentRaw[];
    }
    type GeometryRaw = SegmentGeometryRaw | PlaneGeometryRaw | CubeGeometryRaw | SphereGeometryRaw | CapsuleGeometryRaw | CylinderGeometryRaw | ConeGeometryRaw | TorusGeometryRaw;
    interface TransformRaw {
        __class__: "feng3d.Transform";
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
    interface MeshRendererRaw {
        __class__: "feng3d.MeshRenderer";
        geometry?: GeometryRaw;
        material?: MaterialRaw;
    }
    interface SegmentGeometryRaw {
        __class__: "feng3d.SegmentGeometry";
    }
    interface CubeGeometryRaw {
        __class__: "feng3d.CubeGeometry";
        depth?: number;
        height?: number;
        segmentsD?: number;
        segmentsH?: number;
        segmentsW?: number;
        tile6?: boolean;
        width?: number;
    }
    interface PlaneGeometryRaw {
        __class__: "feng3d.PlaneGeometry";
        height?: number;
        segmentsH?: number;
        segmentsW?: number;
        width?: number;
        yUp?: boolean;
    }
    interface SphereGeometryRaw {
        __class__: "feng3d.SphereGeometry";
        radius?: number;
        segmentsH?: number;
        segmentsW?: number;
        yUp?: boolean;
    }
    interface CapsuleGeometryRaw {
        __class__: "feng3d.CapsuleGeometry";
        height?: number;
        radius?: number;
        segmentsH?: number;
        segmentsW?: number;
        yUp?: boolean;
    }
    interface CylinderGeometryRaw {
        __class__: "feng3d.CylinderGeometry";
        bottomClosed?: boolean;
        bottomRadius?: number;
        height?: number;
        segmentsH?: number;
        segmentsW?: number;
        surfaceClosed?: boolean;
        topClosed?: boolean;
        topRadius?: number;
        yUp?: boolean;
    }
    interface ConeGeometryRaw {
        __class__: "feng3d.ConeGeometry";
        bottomClosed?: boolean;
        bottomRadius?: number;
        height?: number;
        segmentsH?: number;
        segmentsW?: number;
        surfaceClosed?: boolean;
        topClosed?: boolean;
        topRadius?: number;
        yUp?: boolean;
    }
    interface TorusGeometryRaw {
        "__class__": "feng3d.TorusGeometry";
        radius?: 50;
        segmentsR?: 16;
        segmentsT?: 8;
        tubeRadius?: 10;
        yUp?: true;
    }
    interface MaterialBaseRaw {
        blendEquation?: BlendEquation;
        cullFace?: CullFace;
        depthMask?: boolean;
        depthtest?: boolean;
        dfactor?: BlendFactor;
        enableBlend?: boolean;
        frontFace?: FrontFace;
        pointSize?: number;
        renderMode?: RenderMode;
        sfactor?: BlendFactor;
    }
    interface SegmentMaterialRaw extends MaterialBaseRaw {
        __class__: "feng3d.SegmentMaterial";
    }
    interface ColorRaw {
        __class__: "feng3d.Color";
        a?: number;
        b?: number;
        g?: number;
        r?: number;
    }
    interface Vector3DRaw {
        __class__: "feng3d.Vector3D";
        x?: number;
        y?: number;
        z?: number;
        w?: number;
    }
    interface TextureInfoRaw {
        anisotropy?: number;
        flipY?: boolean;
        format?: TextureFormat;
        generateMipmap?: boolean;
        magFilter?: TextureMagFilter;
        minFilter?: TextureMinFilter;
        premulAlpha?: boolean;
        type?: TextureDataType;
        wrapS?: TextureWrap;
        wrapT?: TextureWrap;
    }
    interface Texture2DRaw extends TextureInfoRaw {
        "__class__": "feng3d.Texture2D";
        url?: "";
    }
    interface DiffuseMethodRaw {
        __class__: "feng3d.DiffuseMethod";
        alphaThreshold?: number;
        color?: ColorRaw;
        difuseTexture?: Texture2DRaw;
    }
    interface NormalMethodRaw {
        __class__: "feng3d.NormalMethod";
        normalTexture?: Texture2DRaw;
    }
    interface SpecularMethodRaw {
        __class__: "feng3d.SpecularMethod";
        glossiness?: number;
        specularColor?: ColorRaw;
        specularTexture?: Texture2DRaw;
    }
    interface AmbientMethodRaw {
        __class__: "feng3d.AmbientMethod";
        color?: ColorRaw;
        ambientTexture?: Texture2DRaw;
    }
    interface FogMethodRaw {
        __class__: "feng3d.FogMethod";
        minDistance?: number;
        maxDistance?: number;
        fogColor?: ColorRaw;
        density?: number;
        mode?: FogMode;
    }
    interface TerrainMethodRaw {
        __class__: "feng3d.TerrainMethod";
        splatRepeats?: Vector3D;
        splatTexture1: Texture2DRaw;
        splatTexture2: Texture2DRaw;
        splatTexture3: Texture2DRaw;
    }
    interface TextureCubeRaw extends TextureInfoRaw {
        __class__: "feng3d.TextureCube";
        negative_x_url?: string;
        negative_y_url?: string;
        negative_z_url?: string;
        positive_x_url?: string;
        positive_y_url?: string;
        positive_z_url?: string;
    }
    interface EnvMapMethodRaw {
        __class__: "feng3d.EnvMapMethod";
        enable?: boolean;
        cubeTexture?: TextureCubeRaw;
        reflectivity?: number;
    }
    interface StandardMaterialRaw extends MaterialBaseRaw {
        __class__: "feng3d.StandardMaterial";
        diffuseMethod?: DiffuseMethodRaw;
        normalMethod?: NormalMethodRaw;
        specularMethod?: SpecularMethodRaw;
        ambientMethod?: AmbientMethodRaw;
        envMapMethod?: EnvMapMethodRaw;
        fogMethod?: FogMethodRaw;
        terrainMethod?: TerrainMethodRaw;
    }
    type ValueOf<T> = T[keyof T];
    type MaterialRaw = ValueOf<MaterialRawMap>;
    interface MaterialRawMap {
        SegmentMaterialRaw: SegmentMaterialRaw;
        StandardMaterialRaw: StandardMaterialRaw;
    }
    interface ComponentRawMap {
        TransformRaw: TransformRaw;
        MeshRendererRaw: MeshRendererRaw;
    }
    type ComponentRaw = ValueOf<ComponentRawMap>;
}
declare namespace feng3d {
    /**
     * 序列化装饰器，被装饰属性将被序列化
     * @param {*} target                序列化原型
     * @param {string} propertyKey      序列化属性
     */
    function serialize(defaultvalue?: any): (target: any, propertyKey: string) => void;
}
declare var SERIALIZE_KEY: string;
declare namespace feng3d {
    var serialization: {
        defaultvaluedontsave: boolean;
        compress: boolean;
        serialize: (target: any) => SerializeVO;
        deserialize: (result: any) => any;
        getSerializableMembers: (object: Object, serializableMembers?: {
            [propertyname: string]: any;
        } | undefined) => {
            [propertyname: string]: any;
        };
        clone: (target: any) => any;
    };
    interface SerializeVO {
        defaultvaluedontsave: boolean;
        compress: boolean;
        strings: string[];
        value: any;
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
    /**
     * 按顺序组织的项目的集合。提供基于索引的访问和处理方法。
     */
    interface IList<T> {
        /**
         * 此集合中的项目数。
         */
        readonly length: number;
        /**
         * 向列表末尾添加指定项目。
         */
        addItem(item: T): void;
        /**
         * 在指定的索引处添加项目。
         */
        addItemAt(item: T, index: number): void;
        /**
         * 获取指定索引处的项目。
         */
        getItemAt(index: number): T;
        /**
         * 如果项目位于列表中（这样的话 getItemAt(index) == item），则返回该项目的索引。
         */
        getItemIndex(item: T): number;
        /**
         * 删除列表中的所有项目。
         */
        removeAll(): void;
        /**
         * 删除指定项目。
         */
        removeItem(item: T): void;
        /**
         * 删除指定索引处的项目并返回该项目。
         */
        removeItemAt(index: number): T;
        /**
         * 在指定的索引处放置项目。
         */
        setItemAt(item: T, index: number): T;
        /**
         * 返回与 IList 实现的填充顺序相同的 Array。
         */
        toArray(): T[];
        /**
         * 添加项事件
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        addItemEventListener(type: string, listener: (event: Event<any>) => void, thisObject: any, priority?: number): void;
        /**
         * 移除项事件
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        removeItemEventListener(type: string, listener: (event: Event<any>) => void, thisObject: any): void;
    }
}
declare namespace feng3d {
    class ArrayList<T> implements IList<T> {
        private readonly _source;
        private readonly _eventDispatcher;
        /**
         * 此集合中的项目数。
         */
        readonly length: number;
        constructor(source?: T[]);
        /**
         * 向列表末尾添加指定项目。
         */
        addItem(item: T | T[]): void;
        /**
         * 在指定的索引处添加项目。
         */
        addItemAt(item: T | T[], index: number): void;
        /**
         * 获取指定索引处的项目。
         */
        getItemAt(index: number): T;
        /**
         * 如果项目位于列表中（这样的话 getItemAt(index) == item），则返回该项目的索引。
         */
        getItemIndex(item: T): number;
        /**
         * 删除列表中的所有项目。
         */
        removeAll(): void;
        /**
         * 删除指定项目。
         */
        removeItem(item: T | T[]): void;
        /**
         * 删除指定索引处的项目并返回该项目。
         */
        removeItemAt(index: number): T;
        /**
         * 在指定的索引处放置项目。
         */
        setItemAt(item: T, index: number): T;
        /**
         * 返回与 IList 实现的填充顺序相同的 Array。
         */
        toArray(): T[];
        /**
         * 添加项事件
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        addItemEventListener(type: string, listener: (event: Event<any>) => void, thisObject: any, priority?: number): void;
        /**
         * 移除项事件
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        removeItemEventListener(type: string, listener: (event: Event<any>) => void, thisObject: any): void;
    }
}
declare namespace feng3d {
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
     * http://www.broofa.com/Tools/Math.uuid.htm
     */
    generateUUID(): any;
    clamp(value: any, min: any, max: any): any;
    /**
     * compute euclidian modulo of m % n
     * https://en.wikipedia.org/wiki/Modulo_operation
     */
    euclideanModulo(n: any, m: any): any;
    /**
     * Linear mapping from range <a1, a2> to range <b1, b2>
     */
    mapLinear(x: any, a1: any, a2: any, b1: any, b2: any): any;
    /**
     * https://en.wikipedia.org/wiki/Linear_interpolation
     */
    lerp(x: any, y: any, t: any): any;
    /**
     * http://en.wikipedia.org/wiki/Smoothstep
     */
    smoothstep(x: any, min: any, max: any): any;
    smootherstep(x: any, min: any, max: any): any;
    /**
     * Random integer from <low, high> interval
     */
    randInt(low: any, high: any): any;
    /**
     * Random float from <low, high> interval
     */
    randFloat(low: any, high: any): any;
    /**
     * Random float from <-range/2, range/2> interval
     */
    randFloatSpread(range: any): any;
    degToRad(degrees: any): any;
    radToDeg(radians: any): any;
    isPowerOfTwo(value: any): any;
    nearestPowerOfTwo(value: any): any;
    nextPowerOfTwo(value: any): any;
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
    toRound(source: number, target: number, precision: number): any;
}
declare namespace feng3d {
    /**
     * Orientation3D 类是用于表示 Matrix3D 对象的方向样式的常量值枚举。方向的三个类型分别为欧拉角、轴角和四元数。Matrix3D 对象的 decompose 和 recompose 方法采用其中的某一个枚举类型来标识矩阵的旋转组件。
     * @author feng 2016-3-21
     */
    class Orientation3D {
        /**
        * 轴角方向结合使用轴和角度来确定方向。
        */
        static AXIS_ANGLE: string;
        /**
        * 欧拉角（decompose() 和 recompose() 方法的默认方向）通过三个不同的对应于每个轴的旋转角来定义方向。
        */
        static EULER_ANGLES: string;
        /**
        * 四元数方向使用复数。
        */
        static QUATERNION: string;
    }
}
declare namespace feng3d {
    /**
     * Point 对象表示二维坐标系统中的某个位置，其中 x 表示水平轴，y 表示垂直轴。
     */
    class Point {
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
        setTo(x: number, y: number): Point;
        /**
         * 克隆点对象
         */
        clone(): Point;
        /**
         * 确定两个点是否相同。如果两个点具有相同的 x 和 y 值，则它们是相同的点。
         * @param toCompare 要比较的点。
         * @returns 如果该对象与此 Point 对象相同，则为 true 值，如果不相同，则为 false。
         */
        equals(toCompare: Point): boolean;
        /**
         * 返回 pt1 和 pt2 之间的距离。
         * @param p1 第一个点
         * @param p2 第二个点
         * @returns 第一个点和第二个点之间的距离。
         */
        static distance(p1: Point, p2: Point): number;
        /**
         * 将源 Point 对象中的所有点数据复制到调用方 Point 对象中。
         * @param sourcePoint 要从中复制数据的 Point 对象。
         */
        copyFrom(sourcePoint: Point): void;
        /**
         * 将另一个点的坐标添加到此点的坐标以创建一个新点。
         * @param v 要添加的点。
         * @returns 新点。
         */
        add(v: Point): Point;
        /**
         * 确定两个指定点之间的点。
         * 参数 f 确定新的内插点相对于参数 pt1 和 pt2 指定的两个端点所处的位置。参数 f 的值越接近 1.0，则内插点就越接近第一个点（参数 pt1）。参数 f 的值越接近 0，则内插点就越接近第二个点（参数 pt2）。
         * @param pt1 第一个点。
         * @param pt2 第二个点。
         * @param f 两个点之间的内插级别。表示新点将位于 pt1 和 pt2 连成的直线上的什么位置。如果 f=1，则返回 pt1；如果 f=0，则返回 pt2。
         * @returns 新的内插点。
         */
        static interpolate(pt1: Point, pt2: Point, f: number): Point;
        /**
         * 将 (0,0) 和当前点之间的线段缩放为设定的长度。
         * @param thickness 缩放值。例如，如果当前点为 (0,5) 并且您将它规范化为 1，则返回的点位于 (0,1) 处。
         */
        normalize(thickness: number): void;
        /**
         * 按指定量偏移 Point 对象。dx 的值将添加到 x 的原始值中以创建新的 x 值。dy 的值将添加到 y 的原始值中以创建新的 y 值。
         * @param dx 水平坐标 x 的偏移量。
         * @param dy 水平坐标 y 的偏移量。
         */
        offset(dx: number, dy: number): void;
        /**
         * 将一对极坐标转换为笛卡尔点坐标。
         * @param len 极坐标对的长度。
         * @param angle 极坐标对的角度（以弧度表示）。
         */
        static polar(len: number, angle: number): Point;
        /**
         * 从此点的坐标中减去另一个点的坐标以创建一个新点。
         * @param v 要减去的点。
         * @returns 新点。
         */
        subtract(v: Point): Point;
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
        topLeft: Point;
        /**
         * 由 right 和 bottom 属性的值确定的 Rectangle 对象的右下角的位置。
         */
        bottomRight: Point;
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
         * @private
         */
        $intersectInPlace(clipRect: Rectangle): Rectangle;
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
        containsPoint(point: Point): boolean;
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
        inflatePoint(point: Point): void;
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
        offsetPoint(point: Point): void;
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
    }
}
declare namespace feng3d {
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
        static fromArray(array: ArrayLike<number>, offset?: number): Vector3D;
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
        fromArray(array: ArrayLike<number>, offset?: number): this;
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
         * 通过将当前 Vector3D 对象的 x、y 和 z 元素乘以指定的 Vector3D 对象的 x、y 和 z 元素得到新对象。
         */
        multiply(a: Vector3D): Vector3D;
        /**
         * 通过将当前 Vector3D 对象的 x、y 和 z 元素除以指定的 Vector3D 对象的 x、y 和 z 元素得到新对象。
         */
        divide(a: Vector3D): Vector3D;
        /**
         * 如果当前 Vector3D 对象和作为参数指定的 Vector3D 对象均为单位顶点，此方法将返回这两个顶点之间所成角的余弦值。
         */
        dotProduct(a: Vector3D): number;
        /**
         * 通过将当前 Vector3D 对象的 x、y 和 z 元素与指定的 Vector3D 对象的 x、y 和 z 元素进行比较，确定这两个对象是否相等。
         */
        equals(object: Vector3D, allFour?: boolean, precision?: number): boolean;
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
        scaleBy(s: number): this;
        /**
         * 将 Vector3D 的成员设置为指定值
         */
        setTo(x: number, y: number, z: number, w?: number): this;
        /**
         * 从另一个 Vector3D 对象的 x、y 和 z 元素的值中减去当前 Vector3D 对象的 x、y 和 z 元素的值。
         */
        subtract(a: Vector3D): Vector3D;
        /**
         * 返回当前 Vector3D 对象的字符串表示形式。
         */
        toString(): string;
        /**
         * 返回当前 Vector3D 对象4个元素的数组
         */
        toArray(num?: 3 | 4): number[];
    }
}
declare namespace feng3d {
    /**
     * Matrix3D 类表示一个转换矩阵，该矩阵确定三维 (3D) 显示对象的位置和方向。
     * 该矩阵可以执行转换功能，包括平移（沿 x、y 和 z 轴重新定位）、旋转和缩放（调整大小）。
     * Matrix3D 类还可以执行透视投影，这会将 3D 坐标空间中的点映射到二维 (2D) 视图。
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
    class Matrix3D {
        /**
         * 用于运算临时变量
         */
        static RAW_DATA_CONTAINER: number[];
        /**
         * 一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        rawData: number[];
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
         * 后方（-z轴方向）
         */
        readonly back: Vector3D;
        /**
         * 下方（-y轴方向）
         */
        readonly down: Vector3D;
        /**
         * 左方（-x轴方向）
         */
        readonly left: Vector3D;
        /**
         * 创建 Matrix3D 对象。
         * @param   datas    一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        constructor(datas?: number[]);
        /**
         * 创建旋转矩阵
         * @param   axis            旋转轴
         * @param   degrees         角度
         */
        static fromAxisRotate(axis: Vector3D, degrees: number): Matrix3D;
        /**
         * 创建旋转矩阵
         * @param   rx      用于沿 x 轴旋转对象的角度。
         * @param   ry      用于沿 y 轴旋转对象的角度。
         * @param   rz      用于沿 z 轴旋转对象的角度。
         */
        static fromRotation(rx: number, ry: number, rz: number): Matrix3D;
        /**
         * 创建旋转矩阵
         * @param   euler         角度（角度值）
         */
        static fromRotation(euler: {
            x: number;
            y: number;
            z: number;
        }): Matrix3D;
        /**
         * 创建缩放矩阵
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        static fromScale(xScale: number, yScale: number, zScale: number): Matrix3D;
        /**
         * 创建缩放矩阵
         * @param   scale       缩放值
         */
        static fromScale(scale: Vector3D): Matrix3D;
        /**
         * 创建位移矩阵
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        static fromPosition(x: number, y: number, z: number): Matrix3D;
        /**
         * 创建位移矩阵
         * @param   position        位置
         */
        static fromPosition(position: Vector3D): Matrix3D;
        /**
         * 通过将另一个 Matrix3D 对象与当前 Matrix3D 对象相乘来后置一个矩阵。
         */
        append(lhs: Matrix3D): this;
        /**
         * 在 Matrix3D 对象上后置一个增量旋转。
         * @param   axis            旋转轴
         * @param   degrees         角度
         * @param   pivotPoint      旋转中心点
         */
        appendRotation(axis: Vector3D, degrees: number, pivotPoint?: Vector3D): this;
        /**
         * 在 Matrix3D 对象上后置一个增量缩放，沿 x、y 和 z 轴改变位置。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        appendScale(xScale: number, yScale: number, zScale: number): this;
        /**
         * 在 Matrix3D 对象上后置一个增量平移，沿 x、y 和 z 轴重新定位。
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        appendTranslation(x: number, y: number, z: number): this;
        /**
         * 返回一个新 Matrix3D 对象，它是与当前 Matrix3D 对象完全相同的副本。
         */
        clone(): Matrix3D;
        /**
         * 将 Vector3D 对象复制到调用方 Matrix3D 对象的特定列中。
         * @param   column      副本的目标列。
         * @param   vector3D    要从中复制数据的 Vector3D 对象。
         */
        copyColumnFrom(column: number, vector3D: Vector3D): this;
        /**
         * 将调用方 Matrix3D 对象的特定列复制到 Vector3D 对象中。
         * @param   column       要从中复制数据的列。
         * @param   vector3D     副本的目标 Vector3D 对象。
         */
        copyColumnTo(column: number, vector3D: Vector3D): this;
        /**
         * 将源 Matrix3D 对象中的所有矩阵数据复制到调用方 Matrix3D 对象中。
         * @param   sourceMatrix3D      要从中复制数据的 Matrix3D 对象。
         */
        copyFrom(sourceMatrix3D: Matrix3D): this;
        /**
         * 将源 Vector 对象中的所有矢量数据复制到调用方 Matrix3D 对象中。利用可选索引参数，您可以选择矢量中的任何起始文字插槽。
         * @param   vector      要从中复制数据的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        copyRawDataFrom(vector: number[], index?: number, transpose?: boolean): this;
        /**
         * 将调用方 Matrix3D 对象中的所有矩阵数据复制到提供的矢量中。
         * @param   vector      要将数据复制到的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        copyRawDataTo(vector: number[] | Float32Array, index?: number, transpose?: boolean): this;
        /**
         * 将 Vector3D 对象复制到调用方 Matrix3D 对象的特定行中。
         * @param   row         要将数据复制到的行。
         * @param   vector3D    要从中复制数据的 Vector3D 对象。
         */
        copyRowFrom(row: number, vector3D: Vector3D): this;
        /**
         * 将调用方 Matrix3D 对象的特定行复制到 Vector3D 对象中。
         * @param   row         要从中复制数据的行。
         * @param   vector3D    将作为数据复制目的地的 Vector3D 对象。
         */
        copyRowTo(row: number, vector3D: Vector3D): this;
        /**
         * 拷贝当前矩阵
         * @param   dest    目标矩阵
         */
        copyToMatrix3D(dest: Matrix3D): this;
        /**
         * 将转换矩阵的平移、旋转和缩放设置作为由三个 Vector3D 对象组成的矢量返回。
         * @return      一个由三个 Vector3D 对象组成的矢量，其中，每个对象分别容纳平移、旋转和缩放设置。
         */
        decompose(orientationStyle?: string, result?: Vector3D[]): Vector3D[];
        /**
         * 使用不含平移元素的转换矩阵将 Vector3D 对象从一个空间坐标转换到另一个空间坐标。
         * @param   v   一个容纳要转换的坐标的 Vector3D 对象。
         * @return  一个包含转换后的坐标的 Vector3D 对象。
         */
        deltaTransformVector(v: Vector3D, vout?: Vector3D): Vector3D;
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
         * 通过将当前 Matrix3D 对象与另一个 Matrix3D 对象相乘来前置一个矩阵。得到的结果将合并两个矩阵转换。
         * @param   rhs     个右侧矩阵，它与当前 Matrix3D 对象相乘。
         */
        prepend(rhs: Matrix3D): this;
        /**
         * 在 Matrix3D 对象上前置一个增量旋转。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行旋转，然后再执行其他转换。
         * @param   axis        旋转的轴或方向。常见的轴为 X_AXIS (Vector3D(1,0,0))、Y_AXIS (Vector3D(0,1,0)) 和 Z_AXIS (Vector3D(0,0,1))。此矢量的长度应为 1。
         * @param   degrees     旋转的角度。
         * @param   pivotPoint  一个用于确定旋转中心的点。对象的默认轴点为该对象的注册点。
         */
        prependRotation(axis: Vector3D, degrees: number, pivotPoint?: Vector3D): this;
        /**
         * 在 Matrix3D 对象上前置一个增量缩放，沿 x、y 和 z 轴改变位置。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行缩放更改，然后再执行其他转换。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        prependScale(xScale: number, yScale: number, zScale: number): this;
        /**
         * 在 Matrix3D 对象上前置一个增量平移，沿 x、y 和 z 轴重新定位。在将 Matrix3D 对象应用于显示对象时，矩阵会在 Matrix3D 对象中先执行平移更改，然后再执行其他转换。
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
         * @param   components      一个由三个 Vector3D 对象组成的矢量，这些对象将替代 Matrix3D 对象的平移、旋转和缩放元素。
         */
        recompose(components: Vector3D[]): this;
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
        transformRotation(vin: Vector3D, vout?: Vector3D): Vector3D;
        /**
         * 将当前 Matrix3D 对象转换为一个矩阵，并将互换其中的行和列。
         */
        transpose(): this;
        /**
         * 比较矩阵是否相等
         */
        equals(matrix3D: Matrix3D, precision?: number): boolean;
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
        multiplyVector(vector: Vector3D, target?: Quaternion): Quaternion;
        /**
         * Fills the quaternion object with values representing the given rotation around a vector.
         *
         * @param    axis    The axis around which to rotate
         * @param    angle    The angle in radians of the rotation.
         */
        fromAxisAngle(axis: Vector3D, angle: number): void;
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
         * Fills a target Vector3D object with the Euler angles that form the rotation represented by this quaternion.
         * @param target An optional Vector3D object to contain the Euler angles. If not provided, a new object is created.
         * @return The Vector3D containing the Euler angles.
         */
        toEulerAngles(target?: Vector3D): Vector3D;
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
         * Converts the quaternion to a Matrix3D object representing an equivalent rotation.
         * @param target An optional Matrix3D container to store the transformation in. If not provided, a new object is created.
         * @return A Matrix3D object representing an equivalent rotation.
         */
        toMatrix3D(target?: Matrix3D): Matrix3D;
        /**
         * Extracts a quaternion rotation matrix out of a given Matrix3D object.
         * @param matrix The Matrix3D out of which the rotation will be extracted.
         */
        fromMatrix(matrix: Matrix3D): this;
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
         * @param vector The Vector3D object to be rotated.
         * @param target An optional Vector3D object that will contain the rotated coordinates. If not provided, a new object will be created.
         * @return A Vector3D object containing the rotated point.
         */
        rotatePoint(vector: Vector3D, target?: Vector3D): Vector3D;
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
        /** 直线上某一点 */
        position: Vector3D;
        /** 直线方向 */
        direction: Vector3D;
        /**
         * 根据直线某点与方向创建直线
         * @param position 直线上某点
         * @param direction 直线的方向
         */
        constructor(position?: Vector3D, direction?: Vector3D);
        /**
         * 根据直线上两点初始化直线
         * @param p0 Vector3D
         * @param p1 Vector3D
         */
        fromPoints(p0: Vector3D, p1: Vector3D): void;
        /**
         * 根据直线某点与方向初始化直线
         * @param position 直线上某点
         * @param direction 直线的方向
         */
        fromPosAndDir(position: Vector3D, direction: Vector3D): void;
        /**
         * 获取直线上的一个点
         * @param length 与原点距离
         */
        getPoint(length?: number): Vector3D;
    }
}
declare namespace feng3d {
    /**
     * 3D射线
     * @author feng 2013-6-13
     */
    class Ray3D extends Line3D {
        constructor(position?: Vector3D, direction?: Vector3D);
    }
}
declare namespace feng3d {
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
         * 法线
         */
        readonly normal: Vector3D;
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
         * 获取与直线交点
         */
        lineCross(line3D: Line3D): Vector3D;
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
declare namespace feng3d {
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
        setTo(r: number, g: number, b: number, a?: number): this;
        /**
         * 通过
         * @param color
         * @param hasAlpha
         */
        fromUnit(color: number, hasAlpha?: boolean): this;
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
        mix(color: Color, rate?: number): this;
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
declare namespace feng3d {
    /**
     * 心跳计时器
     */
    var ticker: {
        frameRate: number;
        onframe: (func: () => void, thisObject?: Object | undefined, priority?: number) => any;
        onceframe: (func: () => void, thisObject?: Object | undefined, priority?: number) => any;
        offframe: (func: () => void, thisObject?: Object | undefined) => any;
        on: (interval: Lazy<number>, func: () => void, thisObject?: Object | undefined, priority?: number) => any;
        once: (interval: Lazy<number>, func: () => void, thisObject?: Object | undefined, priority?: number) => any;
        off: (interval: Lazy<number>, func: () => void, thisObject?: Object | undefined) => any;
        repeat: (interval: Lazy<number>, repeatCount: number, func: () => void, thisObject?: Object | undefined, priority?: number) => {
            currentCount: number;
            delay: Lazy<number>;
            repeatCount: number;
            start: () => any;
            stop: () => any;
            reset: () => any;
        } | undefined;
    };
}
declare namespace feng3d {
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
    class Timer extends EventDispatcher {
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
        constructor(delay: number, repeatCount?: number);
        /**
         * @private
         */
        private _delay;
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
        delay: number;
        /**
         * The total number of times the timer is set to run. If the repeat count is set to 0, the timer continues indefinitely,
         * until the stop() method is invoked or the program stops. If the repeat count is nonzero, the timer runs the specified
         * number of times. If repeatCount is set to a total that is the same or less then currentCount the timer stops and will not fire again.
         * @version Egret 2.4
         * @platform Web,Native
         * @language en_US
         */
        /**
         * 设置的计时器运行总次数。如果重复计数设置为 0，则计时器将持续不断运行，或直至调用了 stop() 方法或节目停止。
         * 如果重复计数不为 0，则将运行计时器，运行次数为指定的次数。如果设置的 repeatCount 总数等于或小于 currentCount，则计时器将停止并且不会再次触发。
         * @version Egret 2.4
         * @platform Web,Native
         * @language zh_CN
         */
        repeatCount: number;
        /**
         * @private
         */
        private _currentCount;
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
        readonly currentCount: number;
        /**
         * @private
         */
        private _running;
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
        readonly running: boolean;
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
        reset(): void;
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
        start(): void;
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
        stop(): void;
        /**
         * @private
         */
        private updateInterval;
        /**
         * @private
         */
        private lastCount;
        /**
         * @private
         */
        private lastTimeStamp;
        /**
         * @private
         * Ticker以60FPS频率刷新此方法
         */
        $update(): boolean;
    }
    interface TimerEventMap {
        timer: any;
        timerComplete: any;
    }
    interface Timer {
        once<K extends keyof TimerEventMap>(type: K, listener: (event: Event<TimerEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof TimerEventMap>(type: K, data?: TimerEventMap[K], bubbles?: boolean): any;
        has<K extends keyof TimerEventMap>(type: K): boolean;
        on<K extends keyof TimerEventMap>(type: K, listener: (event: Event<TimerEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof TimerEventMap>(type?: K, listener?: (event: Event<TimerEventMap[K]>) => any, thisObject?: any): any;
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
        addShortCuts(shortcuts: ShortCutItem[]): void;
        /**
         * 删除快捷键
         * @param shortcuts		快捷键列表
         */
        removeShortCuts(shortcuts: ShortCutItem[]): void;
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
    type ShortCutItem = {
        key: string;
        command?: string;
        stateCommand?: string;
        when?: string;
    };
}
declare namespace feng3d {
    /**
     * 加载类
     * @author feng 2016-12-14
     */
    var Loader: {
        loadText: (url: string, onCompleted?: ((content: string) => void) | undefined, onRequestProgress?: (() => void) | undefined, onError?: ((e: any) => void) | undefined) => void;
        loadBinary: (url: string, onCompleted?: ((content: ArrayBuffer) => void) | undefined, onRequestProgress?: (() => void) | undefined, onError?: ((e: any) => void) | undefined) => void;
        loadImage: (url: string, onCompleted?: ((content: HTMLImageElement) => void) | undefined, onRequestProgress?: (() => void) | undefined, onError?: ((e: any) => void) | undefined) => void;
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
        POINTS = 0,
        /**
         * gl.LINE_LOOP: Draws a straight line to the next vertex, and connects the last vertex back to the first.
         */
        LINE_LOOP = 1,
        /**
         * gl.LINE_STRIP: Draws a straight line to the next vertex.
         */
        LINE_STRIP = 2,
        /**
         * gl.LINES: Draws a line between a pair of vertices.
         */
        LINES = 3,
        /**
         * gl.TRIANGLES: Draws a triangle for a group of three vertices.
         */
        TRIANGLES = 4,
        /**
         * gl.TRIANGLE_STRIP
         * @see https://en.wikipedia.org/wiki/Triangle_strip
         */
        TRIANGLE_STRIP = 5,
        /**
         * gl.TRIANGLE_FAN
         * @see https://en.wikipedia.org/wiki/Triangle_fan
         */
        TRIANGLE_FAN = 6,
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
        TEXTURE_2D = 0,
        /**
         * gl.TEXTURE_CUBE_MAP: A cube-mapped texture.
         */
        TEXTURE_CUBE_MAP = 1,
        /**
         * using a WebGL 2 context
         * gl.TEXTURE_3D: A three-dimensional texture.
         */
        TEXTURE_3D = 2,
        /**
         * using a WebGL 2 context
         * gl.TEXTURE_2D_ARRAY: A two-dimensional array texture.
         */
        TEXTURE_2D_ARRAY = 3,
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
        FUNC_ADD = 0,
        /**
         * source - destination
         */
        FUNC_SUBTRACT = 1,
        /**
         * destination - source
         */
        FUNC_REVERSE_SUBTRACT = 2,
        /**
         * When using the EXT_blend_minmax extension:
         * Minimum of source and destination
         */
        MIN_EXT = 3,
        /**
         * When using the EXT_blend_minmax extension:
         * Maximum of source and destination.
         */
        MAX_EXT = 4,
        /**
         * using a WebGL 2 context
         * Minimum of source and destination
         */
        MIN = 5,
        /**
         * using a WebGL 2 context
         * Maximum of source and destination.
         */
        MAX = 6,
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
        ZERO = 0,
        /**
         * 1.0  1.0 1.0
         */
        ONE = 1,
        /**
         * Rs   Gs  Bs
         */
        SRC_COLOR = 2,
        /**
         * 1-Rs   1-Gs  1-Bs
         */
        ONE_MINUS_SRC_COLOR = 3,
        /**
         * Rd   Gd  Bd
         */
        DST_COLOR = 4,
        /**
         * 1-Rd   1-Gd  1-Bd
         */
        ONE_MINUS_DST_COLOR = 5,
        /**
         * As   As  As
         */
        SRC_ALPHA = 6,
        /**
         * 1-As   1-As  1-As
         */
        ONE_MINUS_SRC_ALPHA = 7,
        /**
         * Ad   Ad  Ad
         */
        DST_ALPHA = 8,
        /**
         * 1-Ad   1-Ad  1-Ad
         */
        ONE_MINUS_DST_ALPHA = 9,
        /**
         * min(As-Ad)   min(As-Ad)  min(As-Ad)
         */
        SRC_ALPHA_SATURATE = 10,
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
        NONE = 0,
        /**
         * 正面
         */
        FRONT = 1,
        /**
         * 背面
         */
        BACK = 2,
        /**
         * 正面与背面
         */
        FRONT_AND_BACK = 3,
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
        CW = 0,
        /**
         *  Counter-clock-wise winding.
         */
        CCW = 1,
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
        ALPHA = 0,
        /**
         *  Discards the alpha components and reads the red, green and blue components.
         */
        RGB = 1,
        /**
         * Red, green, blue and alpha components are read from the color buffer.
         */
        RGBA = 2,
        /**
         * Each color component is a luminance component, alpha is 1.0.
         */
        LUMINANCE = 3,
        /**
         * Each component is a luminance/alpha component.
         */
        LUMINANCE_ALPHA = 4,
        /**
         * When using the WEBGL_depth_texture extension:
         */
        DEPTH_COMPONENT = 5,
        /**
         * When using the WEBGL_depth_texture extension:
         */
        DEPTH_STENCIL = 6,
        /**
         * When using the EXT_sRGB extension:
         */
        SRGB_EXT = 7,
        /**
         * When using the EXT_sRGB extension:
         */
        SRGB_ALPHA_EXT = 8,
        /**
         * using a WebGL 2 context
         */
        R8 = 9,
        /**
         * using a WebGL 2 context
         */
        R16F = 10,
        /**
         * using a WebGL 2 context
         */
        R32F = 11,
        /**
         * using a WebGL 2 context
         */
        R8UI = 12,
        /**
         * using a WebGL 2 context
         */
        RG8 = 13,
        /**
         * using a WebGL 2 context
         */
        RG16F = 14,
        /**
         * using a WebGL 2 context
         */
        RG32F = 15,
        /**
         * using a WebGL 2 context
         */
        RG8UI = 16,
        /**
         * using a WebGL 2 context
         */
        RG16UI = 17,
        /**
         * using a WebGL 2 context
         */
        RG32UI = 18,
        /**
         * using a WebGL 2 context
         */
        RGB8 = 19,
        /**
         * using a WebGL 2 context
         */
        SRGB8 = 20,
        /**
         * using a WebGL 2 context
         */
        RGB565 = 21,
        /**
         * using a WebGL 2 context
         */
        R11F_G11F_B10F = 22,
        /**
         * using a WebGL 2 context
         */
        RGB9_E5 = 23,
        /**
         * using a WebGL 2 context
         */
        RGB16F = 24,
        /**
         * using a WebGL 2 context
         */
        RGB32F = 25,
        /**
         * using a WebGL 2 context
         */
        RGB8UI = 26,
        /**
         * using a WebGL 2 context
         */
        RGBA8 = 27,
        /**
         * using a WebGL 2 context
         */
        /**
         * using a WebGL 2 context
         */
        RGB5_A1 = 28,
        /**
         * using a WebGL 2 context
         */
        RGB10_A2 = 29,
        /**
         * using a WebGL 2 context
         */
        RGBA4 = 30,
        /**
         * using a WebGL 2 context
         */
        RGBA16F = 31,
        /**
         * using a WebGL 2 context
         */
        RGBA32F = 32,
        /**
         * using a WebGL 2 context
         */
        RGBA8UI = 33,
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
        UNSIGNED_BYTE = 0,
        /**
         * 5 red bits, 6 green bits, 5 blue bits.
         */
        UNSIGNED_SHORT_5_6_5 = 1,
        /**
         * 4 red bits, 4 green bits, 4 blue bits, 4 alpha bits.
         */
        UNSIGNED_SHORT_4_4_4_4 = 2,
        /**
         * 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit.
         */
        UNSIGNED_SHORT_5_5_5_1 = 3,
        /**
         * When using the WEBGL_depth_texture extension:
         */
        UNSIGNED_SHORT = 4,
        /**
         * When using the WEBGL_depth_texture extension:
         */
        UNSIGNED_INT = 5,
        /**
         * When using the WEBGL_depth_texture extension:
         *  (constant provided by the extension)
         */
        UNSIGNED_INT_24_8_WEBGL = 6,
        /**
         * When using the OES_texture_float extension:
         */
        FLOAT = 7,
        /**
         * When using the OES_texture_half_float extension:
         *  (constant provided by the extension)
         */
        HALF_FLOAT_OES = 8,
        /**
         * using a WebGL 2 context
         */
        BYTE = 9,
        /**
         * using a WebGL 2 context
         */
        SHORT = 10,
        /**
         * using a WebGL 2 context
         */
        INT = 11,
        /**
         * using a WebGL 2 context
         */
        HALF_FLOAT = 12,
        /**
         * using a WebGL 2 context
         */
        UNSIGNED_INT_2_10_10_10_REV = 13,
        /**
         * using a WebGL 2 context
         */
        UNSIGNED_INT_10F_11F_11F_REV = 14,
        /**
         * using a WebGL 2 context
         */
        UNSIGNED_INT_5_9_9_9_REV = 15,
        /**
         * using a WebGL 2 context
         */
        UNSIGNED_INT_24_8 = 16,
        /**
         * using a WebGL 2 context
         *  (pixels must be null)
         */
        FLOAT_32_UNSIGNED_INT_24_8_REV = 17,
    }
}
declare namespace feng3d {
    /**
     * 纹理缩小过滤器
     * Texture minification filter
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    enum TextureMinFilter {
        LINEAR = 0,
        NEAREST = 1,
        NEAREST_MIPMAP_NEAREST = 2,
        LINEAR_MIPMAP_NEAREST = 3,
        /**
         *  (default value)
         */
        NEAREST_MIPMAP_LINEAR = 4,
        LINEAR_MIPMAP_LINEAR = 5,
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
        LINEAR = 0,
        NEAREST = 1,
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
        REPEAT = 0,
        CLAMP_TO_EDGE = 1,
        MIRRORED_REPEAT = 2,
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
        BYTE = 0,
        /**
         *  signed 16-bit integer, with values in [-32768, 32767]
         */
        SHORT = 1,
        /**
         * unsigned 8-bit integer, with values in [0, 255]
         */
        UNSIGNED_BYTE = 2,
        /**
         * unsigned 16-bit integer, with values in [0, 65535]
         */
        UNSIGNED_SHORT = 3,
        /**
         * 32-bit floating point number
         */
        FLOAT = 4,
        /**
         * using a WebGL 2 context
         * 16-bit floating point number
         */
        HALF_FLOAT = 5,
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
        NEVER = 0,
        /**
         *  (pass if the incoming value is less than the depth buffer value)
         */
        LESS = 1,
        /**
         *  (pass if the incoming value equals the the depth buffer value)
         */
        EQUAL = 2,
        /**
         *  (pass if the incoming value is less than or equal to the depth buffer value)
         */
        LEQUAL = 3,
        /**
         * (pass if the incoming value is greater than the depth buffer value)
         */
        GREATER = 4,
        /**
         * (pass if the incoming value is not equal to the depth buffer value)
         */
        NOTEQUAL = 5,
        /**
         * (pass if the incoming value is greater than or equal to the depth buffer value)
         */
        GEQUAL = 6,
        /**
         *  (always pass)
         */
        ALWAYS = 7,
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
    vertexCode: string;
    fragmentCode: string;
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
         * GL 枚举
         */
        enums: GLEnum;
        /**
         * WebWG2.0 或者 扩展功能
         */
        advanced: GLAdvanced;
    }
    class GL {
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
    /**
     * @private
     */
    var enums: {
        getBlendEquationValue: (gl: GL) => (blendEquation: BlendEquation) => number;
        getBlendFactorValue: (gl: GL) => (blendFactor: BlendFactor) => number;
        getRenderModeValue: (gl: GL) => (renderMode: RenderMode) => number;
        getTextureTypeValue: (gl: GL) => (textureType: TextureType) => number;
        getCullFaceValue: (gl: GL) => (cullFace: CullFace) => number;
        getFrontFaceValue: (gl: GL) => (frontFace: FrontFace) => number;
        getTextureFormatValue: (gl: GL) => (textureFormat: TextureFormat) => number;
        getTextureDataTypeValue: (gl: GL) => (textureDataType: TextureDataType) => number;
        getTextureMinFilterValue: (gl: GL) => (textureMinFilter: TextureMinFilter) => number;
        getTextureMagFilterValue: (gl: GL) => (textureMagFilter: TextureMagFilter) => number;
        getTextureWrapValue: (gl: GL) => (textureWrapS: TextureWrap) => number;
        getGLArrayTypeValue: (gl: GL) => (glArrayType: GLArrayType) => number;
        getdDepthFuncValue: (gl: GL) => (depthFunc: DepthFunc) => number;
    };
    /**
     * GL枚举
     */
    class GLEnum {
        /**
         * 根据渲染模式枚举获取真实值
         * @param renderMode 渲染模式枚举
         */
        readonly getRenderModeValue: (renderMode: RenderMode) => number;
        /**
         * 根据纹理类型枚举获取真实值
         * @param textureType   纹理类型枚举
         */
        readonly getTextureTypeValue: (textureType: TextureType) => number;
        /**
         * 根据混合方法枚举获取真实值
         * @param blendEquation    混合方法枚举
         */
        readonly getBlendEquationValue: (blendEquation: BlendEquation) => number;
        /**
         * 根据混合因子枚举获取真实值
         * @param blendFactor    混合因子枚举
         */
        readonly getBlendFactorValue: (blendFactor: BlendFactor) => number;
        /**
         * 根据裁剪面枚举获取真实值
         * @param cullFace  裁剪面枚举
         */
        readonly getCullFaceValue: (cullFace: CullFace) => number;
        /**
         * 根据正面方向枚举获取真实值
         * @param frontFace  正面方向枚举
         */
        readonly getFrontFaceValue: (frontFace: FrontFace) => number;
        /**
         * 根据纹理颜色格式枚举获取真实值
         * @param textureFormat  纹理颜色格式枚举
         */
        readonly getTextureFormatValue: (textureFormat: TextureFormat) => number;
        /**
         * 根据纹理数据类型枚举获取真实值
         * @param textureDataType  纹理数据类型枚举
         */
        readonly getTextureDataTypeValue: (textureDataType: TextureDataType) => number;
        /**
         * 根据纹理缩小过滤器枚举获取真实值
         * @param textureMinFilter  纹理缩小过滤器枚举
         */
        readonly getTextureMinFilterValue: (textureMinFilter: TextureMinFilter) => number;
        /**
         * 根据纹理放大滤波器枚举获取真实值
         * @param textureMagFilter  纹理放大滤波器枚举
         */
        readonly getTextureMagFilterValue: (textureMagFilter: TextureMagFilter) => number;
        /**
         * 根据纹理坐标包装函数枚举获取真实值
         * @param textureWrapS  纹理坐标s包装函数枚举
         */
        readonly getTextureWrapValue: (textureWrapS: TextureWrap) => number;
        /**
         * 根据纹理坐标包装函数枚举获取真实值
         * @param glArrayType  纹理坐标s包装函数枚举
         */
        readonly getGLArrayTypeValue: (glArrayType: GLArrayType) => number;
        /**
         * 根据深度检测方法枚举获取真实值
         * @param depthFunc  深度检测方法枚举
         */
        readonly getdDepthFuncValue: (depthFunc: DepthFunc) => number;
        constructor(gl: GL);
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
        u_modelMatrix: Matrix3D;
        /**
         * （view矩阵）摄像机逆矩阵
         */
        u_viewMatrix: Matrix3D;
        /**
         * 投影矩阵
         */
        u_projectionMatrix: Matrix3D;
        /**
         * 摄像机矩阵
         */
        u_cameraMatrix: Matrix3D;
        /**
         * 模型-摄像机 矩阵
         */
        u_mvMatrix: Matrix3D;
        /**
         * 模型逆转置矩阵,用于计算全局法线
         * 参考：http://blog.csdn.net/christina123y/article/details/5963679
         */
        u_ITModelMatrix: Matrix3D;
        /**
         * 模型-摄像机 逆转置矩阵，用于计算摄像机空间法线
         */
        u_ITMVMatrix: Matrix3D;
        /**
         * 世界投影矩阵
         */
        u_viewProjection: Matrix3D;
        u_diffuseInput: Color;
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
        u_splatRepeats: Vector3D;
        /**
         * 地形混合贴图尺寸
         */
        u_splatMergeTextureSize: Point;
        /**
         * 图片尺寸
         */
        u_imageSize: Point;
        /**
         * 地形块尺寸
         */
        u_tileSize: Point;
        /**
         * 地形块偏移
         */
        u_tileOffset: Vector3D[];
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
        u_lod0vec: Vector3D;
        /******************************************************/
        /******************************************************/
        /**
         * 点光源位置数组
         */
        u_pointLightPositions: Vector3D[];
        /**
         * 点光源颜色数组
         */
        u_pointLightColors: Color[];
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
        u_directionalLightDirections: Vector3D[];
        /**
         * 方向光源颜色数组
         */
        u_directionalLightColors: Color[];
        /**
         * 方向光源光照强度数组
         */
        u_directionalLightIntensitys: number[];
        /**
         * 场景环境光
         */
        u_sceneAmbientColor: Color;
        /**
         * 基本颜色
         */
        u_diffuse: Color;
        /**
         * 镜面反射颜色
         */
        u_specular: Color;
        /**
         * 环境颜色
         */
        u_ambient: Color;
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
        u_skeletonGlobalMatriices: Matrix3D[];
        /**
         * 3D对象编号
         */
        u_objectID: number;
        /**
         * 雾颜色
         */
        u_fogColor: Color;
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
        u_wireframeColor: Color;
    }
}
declare namespace feng3d {
    class Shader {
        private _invalid;
        private _resultVertexCode;
        private _resultFragmentCode;
        vertexCode: string | null;
        fragmentCode: string | null;
        macro: {
            boolMacros: BoolMacros;
            valueMacros: ValueMacros;
            addMacros: IAddMacros;
        };
        private _macro;
        /**
         * 激活渲染程序
         */
        activeShaderProgram(gl: GL): WebGLProgram | null;
        /**
         * 纹理缓冲
         */
        protected _webGLProgramMap: Map<GL, WebGLProgram>;
        invalidate(): void;
        private getMacroCode(macro);
    }
}
declare namespace feng3d {
    /**
     * 渲染参数
     * @author feng 2016-12-14
     */
    class RenderParams {
        /**
         * 渲染模式
         */
        renderMode: Lazy<RenderMode>;
        cullFace: Lazy<CullFace>;
        frontFace: Lazy<FrontFace>;
        enableBlend: Lazy<boolean>;
        blendEquation: Lazy<BlendEquation>;
        sfactor: Lazy<BlendFactor>;
        dfactor: Lazy<BlendFactor>;
        depthtest: Lazy<boolean>;
        depthMask: Lazy<boolean>;
        depthFunc: Lazy<DepthFunc>;
        viewRect: Lazy<Rectangle>;
        useViewRect: Lazy<boolean>;
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
         * 渲染参数
         */
        renderParams: RenderParams;
        /**
         * 渲染程序
         */
        shader: Shader;
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
         * 可渲染条件，当所有条件值均为true是可以渲染
         */
        renderableCondition: RenderableCondition;
        constructor();
    }
    interface RenderableCondition {
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
        indices: Lazy<number[]>;
        private _indices;
        private _value;
        /**
         * 渲染数量
         */
        count: number;
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
        data: Lazy<number[] | Float32Array>;
        private _data;
        private _value;
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
        constructor(name: string, data: Lazy<AttributeDataType>, size?: number, divisor?: number);
        /**
         *
         * @param gl
         * @param location A GLuint specifying the index of the vertex attribute that is to be modified.
         */
        active(gl: GL, location: number): void;
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
    /**
     * 着色器宏定义
     * @author feng 2016-12-17
     */
    interface ShaderMacro extends ValueMacros, BoolMacros, IAddMacros {
    }
    /**
     * 值类型宏
     * 没有默认值
     */
    interface ValueMacros {
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
         * 骨骼关节数量
         */
        NUM_SKELETONJOINT: number;
    }
    /**
     * Boolean类型宏
     * 没有默认值
     */
    interface BoolMacros {
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
         * 雾函数
         */
        HAS_FOG_METHOD: boolean;
        /**
         * 环境映射函数
         */
        HAS_ENV_METHOD: boolean;
        OUTLINE: boolean;
    }
    /**
     * 递增类型宏
     * 所有默认值为0
     */
    interface IAddMacros {
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
        U_CAMERAMATRIX_NEED: number;
    }
}
declare namespace feng3d {
    /**
     * 纹理信息
     * @author feng 2016-12-20
     */
    abstract class TextureInfo extends EventDispatcher {
        /**
         * 纹理类型
         */
        protected _textureType: TextureType;
        /**
         * 格式
         */
        format: TextureFormat;
        protected _format: TextureFormat;
        /**
         * 数据类型
         */
        type: TextureDataType;
        private _type;
        /**
         * 是否生成mipmap
         */
        generateMipmap: boolean;
        private _generateMipmap;
        /**
         * 对图像进行Y轴反转。默认值为false
         */
        flipY: boolean;
        private _flipY;
        /**
         * 将图像RGB颜色值得每一个分量乘以A。默认为false
         */
        premulAlpha: boolean;
        private _premulAlpha;
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
        protected _pixels: ImageData | HTMLImageElement | HTMLImageElement[];
        /**
         * 纹理缓冲
         */
        protected _textureMap: Map<GL, WebGLTexture>;
        /**
         * 是否失效
         */
        private _invalid;
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
    var renderdatacollector: {
        collectRenderDataHolder: (renderDataHolder: RenderDataHolder, renderAtomic: RenderAtomic) => void;
        clearRenderDataHolder: (renderDataHolder: RenderDataHolder, renderAtomic: RenderAtomic) => void;
        getsetRenderDataFuncs: (renderDataHolder: RenderDataHolder) => updaterenderDataFunc[];
        getclearRenderDataFuncs: (renderDataHolder: RenderDataHolder) => updaterenderDataFunc[];
        collectRenderDataHolderFuncs: (renderDataHolder: RenderDataHolder) => updaterenderDataFunc[];
        clearRenderDataHolderFuncs: (renderDataHolder: RenderDataHolder) => updaterenderDataFunc[];
    };
}
declare namespace feng3d {
    type updaterenderDataFunc = (renderData: RenderAtomic) => void;
    interface RenderDataHolderEventMap {
        /**
         * 渲染数据发生变化
         */
        renderdataChange: updaterenderDataFunc | updaterenderDataFunc[];
    }
    interface RenderDataHolder {
        once<K extends keyof RenderDataHolderEventMap>(type: K, listener: (event: Event<RenderDataHolderEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof RenderDataHolderEventMap>(type: K, data?: RenderDataHolderEventMap[K], bubbles?: boolean): any;
        has<K extends keyof RenderDataHolderEventMap>(type: K): boolean;
        on<K extends keyof RenderDataHolderEventMap>(type: K, listener: (event: Event<RenderDataHolderEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof RenderDataHolderEventMap>(type?: K, listener?: (event: Event<RenderDataHolderEventMap[K]>) => any, thisObject?: any): any;
    }
    /**
     * 渲染数据拥有者
     * @author feng 2016-6-7
     */
    class RenderDataHolder extends EventDispatcher {
        readonly childrenRenderDataHolder: RenderDataHolder[];
        private _childrenRenderDataHolder;
        /**
         * 创建GL数据缓冲
         */
        constructor();
        addRenderDataHolder(renderDataHolder: RenderDataHolder): void;
        removeRenderDataHolder(renderDataHolder: RenderDataHolder): void;
        private dispatchrenderdataChange(event);
        renderDatamap: {
            [key: string]: {
                setfunc: (renderData: RenderAtomic) => void;
                clearfunc: (renderData: RenderAtomic) => void;
            };
        };
        /**
         *
         * @param name          数据名称
         * @param setfunc       设置数据回调
         * @param clearfunc     清理数据回调
         */
        private renderdataChange(name, setfunc, clearfunc);
        createIndexBuffer(indices: Lazy<number[]>): void;
        createUniformData<K extends keyof LazyUniforms>(name: K, data: LazyUniforms[K]): void;
        createAttributeRenderData<K extends keyof Attributes>(name: K, data: Lazy<AttributeDataType>, size?: number, divisor?: number): void;
        createvertexCode(vertexCode: string): void;
        createfragmentCode(fragmentCode: string): void;
        createValueMacro<K extends keyof ValueMacros>(name: K, value: number): void;
        createBoolMacro<K extends keyof BoolMacros>(name: K, value: boolean): void;
        createAddMacro<K extends keyof IAddMacros>(name: K, value: number): void;
        createInstanceCount(value: number | (() => number)): void;
        createShaderParam<K extends keyof RenderParams>(name: K, value: RenderParams[K]): void;
    }
}
declare namespace feng3d {
    /**
     * 渲染环境
     * @author feng 2017-01-04
     */
    class RenderContext extends RenderDataHolder {
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
        /**
         * 更新渲染数据
         */
        updateRenderData1(): void;
    }
}
declare namespace feng3d {
    /**
     * 着色器库，由shader.ts初始化
     */
    var shaderFileMap: {
        [filePath: string]: string;
    };
    /**
     * 渲染代码库
     * @author feng 2016-12-16
     */
    class ShaderLib {
        static getShaderContentByName(shaderName: string): string;
        /**
         * 获取shaderCode
         */
        static getShaderCode(shaderName: string): string;
    }
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
    class Feng3dObject extends RenderDataHolder {
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
        static instantiate<T extends Feng3dObject>(original: T, position?: Vector3D, rotation?: Quaternion, parent?: Transform, worldPositionStays?: boolean): T | null;
    }
}
declare namespace feng3d {
    /**
     * 组件事件
     */
    interface ComponentEventMap extends RenderDataHolderEventMap {
    }
    interface Component {
        once<K extends keyof ComponentEventMap>(type: K, listener: (event: Event<ComponentEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof ComponentEventMap>(type: K, data?: ComponentEventMap[K], bubbles?: boolean): any;
        has<K extends keyof ComponentEventMap>(type: K): boolean;
        on<K extends keyof ComponentEventMap>(type: K, listener: (event: Event<ComponentEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof ComponentEventMap>(type?: K, listener?: (event: Event<ComponentEventMap[K]>) => any, thisObject?: any): any;
    }
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
    class MouseRenderer extends RenderDataHolder {
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
        color: Color;
        outlineMorphFactor: number;
        init(gameobject: GameObject): void;
    }
    interface Uniforms {
        /**
         * 描边宽度
         */
        u_outlineSize: number;
        /**
         * 描边颜色
         */
        u_outlineColor: Color;
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
        color: Color;
        init(gameobject: GameObject): void;
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
        outlineColor: Color;
        outlineMorphFactor: number;
        /**
         * 半兰伯特值diff，分段值 4个(0.0,1.0)
         */
        diffuseSegment: Vector3D;
        /**
         * 半兰伯特值diff，替换分段值 4个(0.0,1.0)
         */
        diffuseSegmentValue: Vector3D;
        specularSegment: number;
        cartoon_Anti_aliasing: boolean;
        _cartoon_Anti_aliasing: boolean;
        init(gameObject: GameObject): void;
    }
    interface Uniforms {
        u_diffuseSegment: Vector3D;
        u_diffuseSegmentValue: Vector3D;
        u_specularSegment: number;
    }
    /**
     * Boolean类型宏
     * 没有默认值
     */
    interface BoolMacros {
        /**
         * 是否卡通渲染
         */
        IS_CARTOON: Boolean;
        /**
         * 是否抗锯齿
         */
        cartoon_Anti_aliasing: Boolean;
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
    interface TransformEventMap extends ComponentEventMap {
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
        /**
         * 创建一个实体，该类为虚类
         */
        constructor();
        init(gameObject: GameObject): void;
        readonly scenePosition: Vector3D;
        readonly parent: Transform | null;
        /**
         * Matrix that transforms a point from local space into world space.
         */
        localToWorldMatrix: Matrix3D;
        /**
         * 本地转世界逆转置矩阵
         */
        readonly ITlocalToWorldMatrix: Matrix3D;
        /**
         * Matrix that transforms a point from world space into local space (Read Only).
         */
        readonly worldToLocalMatrix: Matrix3D;
        readonly localToWorldRotationMatrix: Matrix3D;
        /**
         * Transforms direction from local space to world space.
         */
        transformDirection(direction: Vector3D): Vector3D;
        /**
         * Transforms position from local space to world space.
         */
        transformPoint(position: Vector3D): Vector3D;
        /**
         * Transforms vector from local space to world space.
         */
        transformVector(vector: Vector3D): Vector3D;
        /**
         * Transforms a direction from world space to local space. The opposite of Transform.TransformDirection.
         */
        inverseTransformDirection(direction: Vector3D): Vector3D;
        /**
         * Transforms position from world space to local space.
         */
        inverseTransformPoint(position: Vector3D): Vector3D;
        /**
         * Transforms a vector from world space to local space. The opposite of Transform.TransformVector.
         */
        inverseTransformVector(vector: Vector3D): Vector3D;
        dispose(): void;
        protected updateLocalToWorldMatrix(): Matrix3D;
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
        matrix3d: Matrix3D;
        /**
         * 旋转矩阵
         */
        readonly rotationMatrix: Matrix3D;
        /**
         * 返回保存位置数据的Vector3D对象
         */
        position: Vector3D;
        rotation: Vector3D;
        /**
         * 四元素旋转
         */
        orientation: Quaternion;
        scale: Vector3D;
        readonly forwardVector: Vector3D;
        readonly rightVector: Vector3D;
        readonly upVector: Vector3D;
        readonly backVector: Vector3D;
        readonly leftVector: Vector3D;
        readonly downVector: Vector3D;
        moveForward(distance: number): void;
        moveBackward(distance: number): void;
        moveLeft(distance: number): void;
        moveRight(distance: number): void;
        moveUp(distance: number): void;
        moveDown(distance: number): void;
        translate(axis: Vector3D, distance: number): void;
        translateLocal(axis: Vector3D, distance: number): void;
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
        rotate(axis: Vector3D, angle: number, pivotPoint?: Vector3D): void;
        lookAt(target: Vector3D, upAxis?: Vector3D): void;
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
        protected _matrix3d: Matrix3D;
        protected _rotationMatrix3d: Matrix3D | null;
        protected _localToWorldMatrix: Matrix3D | null;
        protected _ITlocalToWorldMatrix: Matrix3D | null;
        protected _worldToLocalMatrix: Matrix3D | null;
        protected _localToWorldRotationMatrix: Matrix3D | null;
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
    interface GameObjectEventMap extends Mouse3DEventMap, RenderDataHolderEventMap {
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
    /**
     * Base class for all entities in feng3d scenes.
     */
    class GameObject extends Feng3dObject {
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
         * 标记
         */
        flag: GameObjectFlag;
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
        private constructor();
        find(name: string): GameObject | null;
        contains(child: GameObject): boolean;
        addChild(child: GameObject): GameObject | undefined;
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
        addComponent<T extends Component>(param: ComponentConstructor<T>): T;
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
        static find(name: string): null;
        static create(name?: string): GameObject;
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
    }
}
declare namespace feng3d {
    class BoundingComponent extends Component {
        showInInspector: boolean;
        serializable: boolean;
        private _bounds;
        private _worldBounds;
        init(gameObject: GameObject): void;
        /**
         * 边界
         */
        readonly bounds: IBounding | null;
        /**
         * @inheritDoc
         */
        private invalidateSceneTransform();
        /**
          * 判断射线是否穿过对象
          * @param ray3D
          * @return
          */
        isIntersectingRay(ray3D: Ray3D): PickingCollisionVO | null;
        /**
         * 世界边界
         */
        readonly worldBounds: IBounding | null;
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
    class RenderAtomicComponent extends Component {
        showInInspector: boolean;
        serializable: boolean;
        readonly renderAtomic: RenderAtomic;
        init(gameObject: GameObject): void;
        update(): void;
        private onrenderdataChange(event);
        private changefuncs;
    }
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
        readonly mousePos: Point;
        readonly mouseinview: boolean;
        readonly viewRect: Rectangle;
        /**
         * 构建3D视图
         * @param canvas    画布
         * @param scene     3D场景
         * @param camera    摄像机
         */
        constructor(canvas?: HTMLCanvasElement, scene?: Scene3D, camera?: Camera);
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
        camera: Camera | null;
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
        camera: Camera | null;
        private _holdSize;
        private _camera;
        init(gameobject: GameObject): void;
        private invalidHoldSizeMatrix();
        private updateLocalToWorldMatrix();
        dispose(): void;
    }
}
declare namespace feng3d {
    class MeshRenderer extends Component {
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
        private _material;
        init(gameObject: GameObject): void;
        /**
         * 销毁
         */
        dispose(): void;
        private onBoundsInvalid(event);
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
        readonly globalMatrices: Matrix3D[];
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
        private _skinSkeleton;
        private skeletonGlobalMatriices;
        /**
         * 缓存，通过寻找父节点获得
         */
        private cacheSkeletonComponent;
        initMatrix3d: Matrix3D;
        /**
         * 创建一个骨骼动画类
         */
        init(gameObject: GameObject): void;
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
    enum ScriptFlag {
        feng3d = 1,
        editor = 2,
    }
    /**
     * 3d对象脚本
     * @author feng 2017-03-11
     */
    class Script extends Component {
        flag: ScriptFlag;
        /**
         * 脚本路径
         */
        url: string;
        private _url;
        private _enabled;
        init(gameObject: GameObject): void;
        /**
         * 初始化时调用
         */
        start(): void;
        /**
         * Enabled Behaviours are Updated, disabled Behaviours are not.
         */
        enabled: boolean;
        /**
         * 更新
         */
        update(): void;
        /**
         * 销毁时调用
         */
        end(): void;
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
    interface Scene3DEventMap extends ComponentEventMap {
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
        /**
         * 背景颜色
         */
        background: Color;
        /**
         * 环境光强度
         */
        ambientColor: Color;
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
                cls: typeof Script;
                list: Script[];
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
        private onEnterFrame();
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
    interface GeometryEventMap extends RenderDataHolderEventMap {
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
    type AttributeDataType = number[] | Float32Array;
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
                data: AttributeDataType;
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
        positions: number[] | Float32Array;
        /**
         * uv数据
         */
        uvs: number[] | Float32Array;
        /**
         * 法线数据
         */
        normals: number[] | Float32Array;
        /**
         * 切线数据
         */
        tangents: number[] | Float32Array;
        /**
         * 创建一个几何体
         */
        constructor();
        private createAttribute<K>(vaId, size);
        /**
         * 几何体变脏
         */
        protected invalidateGeometry(): void;
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
        setVAData<K extends keyof Attributes>(vaId: K, data: number[] | Float32Array, size: number): void;
        /**
         * 获取顶点属性数据
         * @param vaId 数据类型编号
         * @return 顶点属性数据
         */
        getVAData1(vaId: string): number[] | Float32Array;
        /**
         * 顶点数量
         */
        readonly numVertex: number;
        /**
         * 添加几何体
         * @param geometry          被添加的几何体
         * @param transform         变换矩阵，把克隆被添加几何体的数据变换后再添加到该几何体中
         */
        addGeometry(geometry: Geometry, transform?: Matrix3D): void;
        /**
         * 应用变换矩阵
         * @param transform 变换矩阵
         */
        applyTransformation(transform: Matrix3D): void;
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
        readonly bounding: IBounding | null;
        /**
         * 克隆一个几何体
         */
        clone(): CustomGeometry;
        /**
         * 从一个几何体中克隆数据
         */
        cloneFrom(geometry: Geometry): void;
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
                data: number[] | Float32Array;
                size: number;
            };
        };
    }
}
declare namespace feng3d {
    var GeometryUtils: {
        createIndices: (positions: number[] | Float32Array) => number[];
        createUVs: (positions: number[] | Float32Array) => number[];
        createVertexNormals: (indices: number[] | Uint16Array, positions: number[] | Float32Array, useFaceWeights?: boolean) => number[];
        createVertexTangents: (indices: number[] | Uint16Array, positions: number[] | Float32Array, uvs: number[] | Float32Array, useFaceWeights?: boolean) => number[];
    };
}
declare namespace feng3d {
    /**
     * 点几何体
     * @author feng 2017-01-11
     */
    class PointGeometry extends Geometry {
        private _points;
        constructor();
        /**
         * 添加点
         * @param point		点数据
         */
        addPoint(point: PointInfo, needUpdateGeometry?: boolean): void;
        /**
         * 构建几何体
         */
        buildGeometry(): void;
        /**
         * 获取线段数据
         * @param index 		线段索引
         * @return				线段数据
         */
        getPoint(index: number): PointInfo | null;
        /**
         * 移除所有线段
         */
        removeAllPoints(): void;
        /**
         * 线段列表
         */
        readonly points: PointInfo[];
    }
    /**
     * 点信息
     * @author feng 2016-10-16
     */
    class PointInfo {
        position: Vector3D;
        color: Color;
        normal: Vector3D;
        uv: Point;
        /**
         * 创建点
         * @param position 坐标
         */
        constructor(position?: Vector3D, color?: Color, uv?: Point, normal?: Vector3D);
    }
}
declare namespace feng3d {
    /**
     * 线段组件
     * @author feng 2016-10-16
     */
    class SegmentGeometry extends Geometry {
        private segments_;
        constructor();
        /**
         * 添加线段
         * @param segment		            线段数据
         */
        addSegment(segment: Segment): void;
        /**
         * 设置线段
         * @param segment		            线段数据
         * @param index		                线段索引
         */
        setSegmentAt(segment: Segment, index: number): void;
        /**
         * 更新几何体
         */
        protected buildGeometry(): void;
        /**
         * 获取线段数据
         * @param index 		线段索引
         * @return				线段数据
         */
        getSegment(index: number): Segment | null;
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
        start: Vector3D;
        end: Vector3D;
        startColor: Color;
        endColor: Color;
        /**
         * 创建线段
         * @param start 起点坐标
         * @param end 终点坐标
         * @param colorStart 起点颜色
         * @param colorEnd 终点颜色
         * @param thickness 线段厚度
         */
        constructor(start: Vector3D, end: Vector3D, colorStart?: Color, colorEnd?: Color);
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
        protected _matrix: Matrix3D | null;
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
        matrix: Matrix3D;
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
        abstract unproject(nX: number, nY: number, sZ: number, v?: Vector3D): Vector3D;
        /**
         * 投影矩阵失效
         */
        protected invalidateMatrix(): void;
        /**
         * 更新投影矩阵
         */
        protected abstract updateMatrix(): Matrix3D;
    }
}
declare namespace feng3d {
    /**
     *
     * @author feng 2015-5-28
     */
    class FreeMatrixLens extends LensBase {
        constructor();
        protected updateMatrix(): Matrix3D;
        /**
         * 屏幕坐标投影到摄像机空间坐标
         * @param nX 屏幕坐标X -1（左） -> 1（右）
         * @param nY 屏幕坐标Y -1（上） -> 1（下）
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        unproject(nX: number, nY: number, sZ: number, v: Vector3D): Vector3D;
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
        unproject(nX: number, nY: number, sZ: number, v?: Vector3D): Vector3D;
        protected updateMatrix(): Matrix3D;
    }
}
declare namespace feng3d {
    /**
     * @author feng 2014-10-14
     */
    interface CameraEventMap extends ComponentEventMap {
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
        private _frustumPlanes;
        private _frustumPlanesDirty;
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
        readonly viewProjection: Matrix3D;
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
        project(point3d: Vector3D): Vector3D;
        /**
         * 屏幕坐标投影到场景坐标
         * @param nX 屏幕坐标X ([0-width])
         * @param nY 屏幕坐标Y ([0-height])
         * @param sZ 到屏幕的距离
         * @param v 场景坐标（输出）
         * @return 场景坐标
         */
        unproject(sX: number, sY: number, sZ: number, v?: Vector3D): Vector3D;
        /**
         * 屏幕坐标转GPU坐标
         * @param screenPos 屏幕坐标 (x:[0-width],y:[0-height])
         * @return GPU坐标 (x:[-1,1],y:[-1-1])
         */
        screenToGpuPosition(screenPos: Point): Point;
        /**
         * 获取单位像素在指定深度映射的大小
         * @param   depth   深度
         */
        getScaleByDepth(depth: number): number;
        /**
         * 视锥体面
         */
        readonly frustumPlanes: Plane3D[];
        /**
         * 更新视锥体6个面，平面均朝向视锥体内部
         * @see http://www.linuxgraphics.cn/graphics/opengl_view_frustum_culling.html
         */
        private updateFrustum();
    }
}
declare namespace feng3d {
    var bounding: {
        getboundingpoints: (bounding: IBounding) => Vector3D[];
        transform: (bounding: IBounding, matrix: Matrix3D, outbounding?: IBounding | undefined) => IBounding;
        containsPoint: (bounding: IBounding, position: Vector3D) => boolean;
        isInFrustum: (bounding: IBounding, planes: Plane3D[], numPlanes: number) => boolean;
        rayIntersection: (bounding: IBounding, ray3D: Ray3D, targetNormal: Vector3D) => number;
    };
    interface IBounding {
        min: Vector3D;
        max: Vector3D;
    }
}
declare namespace feng3d {
    /**
     * 立方体几何体
     * @author feng 2016-09-12
     */
    class PlaneGeometry extends Geometry {
        width: number;
        private _width;
        height: number;
        private _height;
        segmentsW: number;
        private _segmentsW;
        segmentsH: number;
        private _segmentsH;
        yUp: boolean;
        private _yUp;
        /**
         * 创建平面几何体
         * @param width 宽度
         * @param height 高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        constructor(width?: number, height?: number, segmentsW?: number, segmentsH?: number, yUp?: boolean);
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
     * 立方体几何体
     * @author feng 2016-09-12
     */
    class CubeGeometry extends Geometry {
        width: number;
        private _width;
        height: number;
        private _height;
        depth: number;
        private _depth;
        segmentsW: number;
        private _segmentsW;
        segmentsH: number;
        private _segmentsH;
        segmentsD: number;
        private _segmentsD;
        tile6: boolean;
        private _tile6;
        /**
         * 创建立方几何体
         * @param   width           宽度，默认为1。
         * @param   height          高度，默认为1。
         * @param   depth           深度，默认为1。
         * @param   segmentsW       宽度方向分割，默认为1。
         * @param   segmentsH       高度方向分割，默认为1。
         * @param   segmentsD       深度方向分割，默认为1。
         * @param   tile6           是否为6块贴图，默认true。
         */
        constructor(width?: number, height?: number, depth?: number, segmentsW?: number, segmentsH?: number, segmentsD?: number, tile6?: boolean);
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
     * 球体几何体
     * @author DawnKing 2016-09-12
     */
    class SphereGeometry extends Geometry {
        radius: number;
        private _radius;
        segmentsW: number;
        private _segmentsW;
        segmentsH: number;
        private _segmentsH;
        yUp: boolean;
        private _yUp;
        /**
         * 创建球形几何体
         * @param radius 球体半径
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        constructor(radius?: number, segmentsW?: number, segmentsH?: number, yUp?: boolean);
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
     * 胶囊体几何体
     * @author DawnKing 2016-09-12
     */
    class CapsuleGeometry extends Geometry {
        radius: number;
        private _radius;
        height: number;
        private _height;
        segmentsW: number;
        private _segmentsW;
        segmentsH: number;
        private _segmentsH;
        yUp: boolean;
        private _yUp;
        /**
         * 创建胶囊几何体
         * @param radius 胶囊体半径
         * @param height 胶囊体高度
         * @param segmentsW 横向分割数
         * @param segmentsH 纵向分割数
         * @param yUp 正面朝向 true:Y+ false:Z+
         */
        constructor(radius?: number, height?: number, segmentsW?: number, segmentsH?: number, yUp?: boolean);
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
     * 圆柱体几何体
     * @author DawnKing 2016-09-12
     */
    class CylinderGeometry extends Geometry {
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
        constructor(topRadius?: number, bottomRadius?: number, height?: number, segmentsW?: number, segmentsH?: number, topClosed?: boolean, bottomClosed?: boolean, surfaceClosed?: boolean, yUp?: boolean);
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
     * 圆锥体
     * @author feng 2017-02-07
     */
    class ConeGeometry extends CylinderGeometry {
        /**
         * 创建圆锥体
         * @param radius 底部半径
         * @param height 高度
         * @param segmentsW
         * @param segmentsH
         * @param yUp
         */
        constructor(radius?: number, height?: number, segmentsW?: number, segmentsH?: number, closed?: boolean, yUp?: boolean);
    }
}
declare namespace feng3d {
    /**
     * 圆环几何体
     */
    class TorusGeometry extends Geometry {
        radius: number;
        private _radius;
        tubeRadius: number;
        private _tubeRadius;
        readonly segmentsR: number;
        segmentR: any;
        private _segmentsR;
        segmentsT: number;
        private _segmentsT;
        yUp: boolean;
        private _yUp;
        /**
         * 创建<code>Torus</code>实例
         * @param radius						圆环半径
         * @param tubeRadius					管道半径
         * @param segmentsR						横向段数
         * @param segmentsT						纵向段数
         * @param yUp							Y轴是否朝上
         */
        constructor(radius?: number, tubeRadius?: number, segmentsR?: number, segmentsT?: number, yUp?: boolean);
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
    interface Texture2DVO {
        url: string;
    }
    interface Texture2DEventMap {
        /**
         * 纹理加载完成
         */
        loaded: any;
    }
    interface Texture2D {
        once<K extends keyof Texture2DEventMap>(type: K, listener: (event: Event<Texture2DEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof Texture2DEventMap>(type: K, data?: Texture2DEventMap[K], bubbles?: boolean): any;
        has<K extends keyof Texture2DEventMap>(type: K): boolean;
        on<K extends keyof Texture2DEventMap>(type: K, listener: (event: Event<Texture2DEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof Texture2DEventMap>(type?: K, listener?: (event: Event<Texture2DEventMap[K]>) => any, thisObject?: any): any;
    }
    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    class Texture2D extends TextureInfo {
        protected _pixels: HTMLImageElement;
        url: string;
        private _url;
        /**
         * 纹理尺寸
         */
        readonly size: Point;
        constructor(url?: string);
        /**
         * 处理加载完成
         */
        protected onLoad(): void;
        /**
         * 判断数据是否满足渲染需求
         */
        checkRenderData(): boolean;
    }
}
declare namespace feng3d {
    /**
     * 立方体纹理
     * @author feng 2016-12-28
     */
    class TextureCube extends TextureInfo {
        protected _pixels: HTMLImageElement[];
        positive_x_url: string;
        private _positive_x_url;
        positive_y_url: string;
        private _positive_y_url;
        positive_z_url: string;
        private _positive_z_url;
        negative_x_url: string;
        private _negative_x_url;
        negative_y_url: string;
        private _negative_y_url;
        negative_z_url: string;
        private _negative_z_url;
        constructor(images: string[]);
        /**
         * 判断数据是否满足渲染需求
         */
        checkRenderData(): boolean;
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
    /**
     * 材质
     * @author feng 2016-05-02
     */
    class Material extends RenderDataHolder {
        /**
        * 渲染模式，默认RenderMode.TRIANGLES
        */
        renderMode: number;
        private _renderMode;
        shaderName: string;
        private _shaderName;
        /**
         * 顶点渲染程序代码
         */
        vertexCode: string;
        private _vertexCode;
        /**
         * 片段渲染程序代码
         */
        fragmentCode: string;
        private _fragmentCode;
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
        protected _enableBlend: boolean;
        /**
         * 点绘制时点的尺寸
         */
        pointSize: number;
        protected _pointSize: number;
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
        /**
         * 绘制在画布上的区域
         */
        viewRect: Rectangle;
        /**
         * 是否使用 viewRect
         */
        useViewRect: boolean;
        constructor();
    }
}
declare namespace feng3d {
    /**
     * 颜色材质
     * @author feng 2017-01-11
     */
    class PointMaterial extends Material {
        color: Color;
        /**
         * 构建颜色材质
         */
        constructor();
    }
}
declare namespace feng3d {
    /**
     * 颜色材质
     * @author feng 2016-05-02
     */
    class ColorMaterial extends Material {
        /**
         * 颜色
         */
        color: Color;
        private _color;
        /**
         * 构建颜色材质
         * @param color 颜色
         * @param alpha 透明的
         */
        constructor(color?: Color);
    }
}
declare namespace feng3d {
    interface Uniforms {
        u_segmentColor: Color;
    }
    /**
     * 线段材质
     * 目前webgl不支持修改线条宽度，参考：https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth
     * @author feng 2016-10-15
     */
    class SegmentMaterial extends Material {
        /**
         * 线段颜色
         */
        color: Color;
        private _color;
        /**
         * 构建线段材质
         */
        constructor();
    }
}
declare namespace feng3d {
    /**
     * 纹理材质
     * @author feng 2016-12-23
     */
    class TextureMaterial extends Material {
        /**
         * 纹理数据
         */
        texture: Texture2D | ImageDataTexture;
        private _texture;
        color: Color;
        constructor();
    }
    interface Uniforms {
        /**
         *
         */
        u_color: Color;
    }
}
declare namespace feng3d {
    /**
     * 标准材质
     * @author feng 2016-05-02
     */
    class StandardMaterial extends Material {
        /**
         * 漫反射函数
         */
        diffuseMethod: DiffuseMethod;
        /**
         * 法线函数
         */
        normalMethod: NormalMethod;
        /**
         * 镜面反射函数
         */
        specularMethod: SpecularMethod;
        /**
         * 环境反射函数
         */
        ambientMethod: AmbientMethod;
        envMapMethod: EnvMapMethod;
        fogMethod: FogMethod;
        terrainMethod: TerrainMethod;
        /**
         * 是否开启混合
         */
        enableBlend: boolean;
        /**
         * 构建
         */
        constructor(diffuseUrl?: string, normalUrl?: string, specularUrl?: string, ambientUrl?: string);
        private onmethodchange(property, oldvalue, newvalue);
    }
}
declare namespace feng3d {
    /**
     * 漫反射函数
     * @author feng 2017-03-22
     */
    class DiffuseMethod extends RenderDataHolder {
        /**
         * 漫反射纹理
         */
        difuseTexture: Texture2D;
        private _difuseTexture;
        /**
         * 基本颜色
         */
        color: Color;
        /**
         * 透明阈值，透明度小于该值的像素被片段着色器丢弃
         */
        alphaThreshold: number;
        /**
         * 构建
         */
        constructor(diffuseUrl?: string);
        private ontextureChanged();
    }
}
declare namespace feng3d {
    /**
     * 法线函数
     * @author feng 2017-03-22
     */
    class NormalMethod extends RenderDataHolder {
        /**
         * 漫反射纹理
         */
        normalTexture: Texture2D;
        private _normalTexture;
        /**
         * 构建
         */
        constructor(normalUrl?: string);
        private onTextureChanged();
    }
}
declare namespace feng3d {
    /**
     * 法线函数
     * @author feng 2017-03-22
     */
    class SpecularMethod extends RenderDataHolder {
        /**
         * 镜面反射光泽图
         */
        specularTexture: Texture2D;
        private _specularTexture;
        /**
         * 镜面反射颜色
         */
        specularColor: Color;
        /**
         * 镜面反射光反射强度
         */
        specular: number;
        /**
         * 高光系数
         */
        glossiness: number;
        /**
         * 构建
         */
        constructor(specularUrl?: string);
        private onTextureChanged();
    }
}
declare namespace feng3d {
    /**
     * 漫反射函数
     * @author feng 2017-03-22
     */
    class AmbientMethod extends RenderDataHolder {
        /**
         * 环境纹理
         */
        ambientTexture: Texture2D;
        private _ambientTexture;
        /**
         * 颜色
         */
        color: Color;
        private _color;
        /**
         * 构建
         */
        constructor(ambientUrl?: string, color?: Color);
        private onTextureChanged();
    }
}
declare namespace feng3d {
    class FogMethod extends RenderDataHolder {
        /**
         * 是否生效
         */
        enable: boolean;
        /**
         * 出现雾效果的最近距离
         */
        minDistance: number;
        /**
         * 最远距离
         */
        maxDistance: number;
        /**
         * 雾的颜色
         */
        fogColor: Color;
        density: number;
        /**
         * 雾模式
         */
        mode: FogMode;
        /**
         * @param fogColor      雾颜色
         * @param minDistance   雾近距离
         * @param maxDistance   雾远距离
         * @param density       雾浓度
         */
        constructor(fogColor?: Color, minDistance?: number, maxDistance?: number, density?: number, mode?: FogMode);
        private enableChanged();
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
}
declare namespace feng3d {
    /**
     * 环境映射函数
     */
    class EnvMapMethod extends RenderDataHolder {
        /**
         * 环境映射贴图
         */
        cubeTexture: TextureCube;
        /**
         * 反射率
         */
        reflectivity: number;
        /**
         * 创建EnvMapMethod实例
         * @param envMap		        环境映射贴图
         * @param reflectivity			反射率
         */
        constructor();
        private enableChanged();
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
    /**
     * 灯光
     * @author feng 2016-12-12
     */
    class Light extends Component {
        /**
         * 灯光类型
         */
        lightType: LightType;
        /**
         * 颜色
         */
        color: Color;
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
        targetObject: GameObject | undefined;
    }
}
declare namespace feng3d {
    class LookAtController extends ControllerBase {
        protected _lookAtPosition: Vector3D;
        protected _lookAtObject: GameObject;
        protected _origin: Vector3D;
        protected _upAxis: Vector3D;
        protected _pos: Vector3D;
        constructor(target?: GameObject, lookAtObject?: GameObject);
        upAxis: Vector3D;
        lookAtPosition: Vector3D;
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
    class FPSController extends Script {
        /**
         * 加速度
         */
        acceleration: number;
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
        uv?: Point;
        /**
         * 实体上碰撞本地坐标
         */
        localPosition?: Vector3D;
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
        localNormal: Vector3D;
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
     * 使用纯计算与实体相交
     */
    var as3PickingCollider: {
        testSubMeshCollision: (geometry: Geometry, localRay: Ray3D, shortestCollisionDistance?: number, bothSides?: boolean, findClosest?: boolean) => {
            rayEntryDistance: number;
            localPosition: Vector3D;
            localNormal: Vector3D;
            uv: Point;
            index: number;
        } | null;
    };
}
declare namespace feng3d {
    /**
     * 射线投射拾取器
     * @author feng 2014-4-29
     */
    var raycastPicker: {
        pick: (ray3D: Ray3D, entitys: GameObject[], findClosest?: boolean) => PickingCollisionVO | null;
    };
}
declare namespace feng3d {
    /**
     * 地形几何体
     * @author feng 2016-04-28
     */
    class TerrainGeometry extends Geometry {
        heightMapUrl: string;
        width: number;
        private _width;
        height: number;
        private _height;
        depth: number;
        private _depth;
        segmentsW: number;
        private _segmentsW;
        segmentsH: number;
        private _segmentsH;
        maxElevation: number;
        private _maxElevation;
        minElevation: number;
        private _minElevation;
        private _heightMap;
        private _heightImage;
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
        constructor(heightMapUrl: string, width?: number, height?: number, depth?: number, segmentsW?: number, segmentsH?: number, maxElevation?: number, minElevation?: number);
        /**
         * 高度图加载完成
         */
        private onHeightMapLoad();
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
    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    class TerrainMethod extends RenderDataHolder {
        splatTexture1: Texture2D;
        private _splatTexture1;
        splatTexture2: Texture2D;
        private _splatTexture2;
        splatTexture3: Texture2D;
        private _splatTexture3;
        blendTexture: Texture2D;
        private _blendTexture;
        splatRepeats: Vector3D;
        private _splatRepeats;
        /**
         * 构建材质
         */
        constructor();
        private ontextureChanged();
    }
}
declare namespace feng3d {
    /**
     * 地形材质
     * @author feng 2016-04-28
     */
    class TerrainMergeMethod extends RenderDataHolder {
        splatMergeTexture: Texture2D;
        private _splatMergeTexture;
        blendTexture: Texture2D;
        private _blendTexture;
        splatRepeats: Vector3D;
        private _splatRepeats;
        /**
         * 构建材质
         */
        constructor(blendUrl?: string, splatMergeUrl?: string, splatRepeats?: Vector3D);
    }
}
declare namespace feng3d {
    /**
     * 粒子
     * 粒子系统会自动在shader中匹配一个"a_particle_${attribute}"顶点属性,并且属性值不为空时会自动添加 "#define D_a_particle_${attribute}"
     * 例如：position 对应 a_particle_position 与 #define D_a_particle_position
     * @author feng 2017-01-12
     */
    interface Particle {
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
         * 速度
         */
        velocity: Vector3D;
        /**
         * 加速度
         */
        acceleration: Vector3D;
        /**
         * 颜色
         */
        color: Color;
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
        acceleration: Vector3D;
        /**
         * 公告牌矩阵
         */
        billboardMatrix: Matrix3D;
    }
}
declare namespace feng3d {
    /**
     * 粒子动画组件
     * @author feng 2017-01-09
     */
    class ParticleComponent extends RenderDataHolder {
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
        setRenderState(particleAnimator: ParticleAnimator): void;
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
        billboardAxis: Vector3D;
        setRenderState(particleAnimator: ParticleAnimator): void;
    }
}
declare namespace feng3d {
    /**
     * 粒子动画
     * @author feng 2017-01-09
     */
    class ParticleAnimator extends Component {
        /**
         * 是否正在播放
         */
        isPlaying: boolean;
        private _isPlaying;
        /**
         * 粒子时间
         */
        time: number;
        /**
         * 起始时间
         */
        preTime: number;
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
        private update();
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
        matrix3D: Matrix3D;
        children: number[];
        readonly invertMatrix3D: Matrix3D;
        private _invertMatrix3D;
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
        private _isplaying;
        /**
         * 播放速度
         */
        playspeed: number;
        private _preTime;
        update(): void;
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
        type: "Number" | "Vector3D" | "Quaternion";
        propertyValues: [number, number[]][];
        cacheIndex: number;
    }
    /**
     * [time:number,value:number | Vector3D | Quaternion]
     */
    type ClipPropertyType = number | Vector3D | Quaternion;
    type PropertyClipPath = [PropertyClipPathItemType, string][];
    enum PropertyClipPathItemType {
        GameObject = 0,
        Component = 1,
    }
}
declare namespace feng3d {
    var assets: {};
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
interface IDBObjectStore {
    getAllKeys(): IDBRequest;
}
declare namespace feng3d {
    var storage: {
        support(): boolean;
        getDatabase(dbname: string, callback: (err: any, database: IDBDatabase) => void): void;
        deleteDatabase(dbname: string, callback?: ((err: any) => void) | undefined): void;
        hasObjectStore(dbname: string, objectStroreName: string, callback: (has: boolean) => void): void;
        getObjectStoreNames(dbname: string, callback: (err: Error | null, objectStoreNames: string[]) => void): void;
        createObjectStore(dbname: string, objectStroreName: string, callback?: ((err: any) => void) | undefined): void;
        deleteObjectStore(dbname: string, objectStroreName: string, callback?: ((err: any) => void) | undefined): void;
        getAllKeys(dbname: string, objectStroreName: string, callback?: ((err: Error | null, keys: string[] | null) => void) | undefined): void;
        get(dbname: string, objectStroreName: string, key: string | number, callback?: ((err: Error | null, data: any) => void) | undefined): void;
        set(dbname: string, objectStroreName: string, key: string | number, data: any, callback?: ((err: Error | null) => void) | undefined): void;
        delete(dbname: string, objectStroreName: string, key: string | number, callback?: ((err?: Error | undefined) => void) | undefined): void;
        clear(dbname: string, objectStroreName: string, callback?: ((err?: Error | undefined) => void) | undefined): void;
    };
}
declare namespace feng3d {
    var indexedDBfs: FS;
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
     * @author feng 2017-01-13
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
        MinimumExtent: Vector3D;
        /** 最大范围 */
        MaximumExtent: Vector3D;
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
        MinimumExtent: Vector3D;
        /** 最大范围 */
        MaximumExtent: Vector3D;
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
        pivotPoint: Vector3D;
        /** 当前对象变换矩阵 */
        c_transformation: Matrix3D;
        /** 当前全局变换矩阵 */
        c_globalTransformation: Matrix3D;
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
        getScaling(keyFrameTime: number): Vector3D;
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
        getTranslation(keyFrameTime: number): Vector3D;
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
        MinimumExtent: Vector3D;
        /** 最大范围 */
        MaximumExtent: Vector3D;
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
        MinimumExtent: Vector3D;
        /** 最大范围 */
        MaximumExtent: Vector3D;
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
        value: Vector3D;
        InTan: Vector3D;
        OutTan: Vector3D;
    }
    /**
     *
     * @author warden_feng 2014-6-26
     */
    class Translation {
        /** 时间 */
        time: number;
        /**  */
        value: Vector3D;
        InTan: Vector3D;
        OutTan: Vector3D;
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
        pivotPoints: Vector3D[];
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
        parse: (data: string, onParseComplete?: ((war3Model: War3Model) => void) | undefined) => void;
    };
}
declare namespace feng3d {
    /**
     * Obj模型加载类
     * @author feng 2017-01-18
     */
    var ObjLoader: {
        load: (url: string, completed?: ((gameObject: GameObject) => void) | undefined) => void;
        parse: (content: string, completed?: ((gameObject: GameObject) => void) | undefined) => void;
    };
}
declare namespace feng3d {
    /**
     * MD5模型加载类
     * @author feng 2017-01-18
     */
    var MD5Loader: {
        load: (url: string, completed?: ((gameObject: GameObject) => void) | undefined) => void;
        loadAnim: (url: string, completed?: ((animationClip: AnimationClip) => void) | undefined) => void;
        parseMD5Mesh: (content: string, completed?: ((gameObject: GameObject) => void) | undefined) => void;
        parseMD5Anim: (content: string, completed?: ((animationClip: AnimationClip) => void) | undefined) => void;
    };
}
declare namespace feng3d {
    var mdlLoader: {
        load: (mdlurl: string, callback: (gameObject: GameObject) => void) => void;
    };
}
declare namespace feng3d {
    /**
     * 坐标系，三叉戟
     * @author feng 2017-02-06
     */
    class Trident extends Component {
        lineLength: number;
        arrowradius: number;
        arrowHeight: number;
        tridentObject: GameObject;
        init(gameObject: GameObject): void;
        private buildTrident();
    }
}
declare namespace feng3d {
    var GameObjectFactory: {
        create: (name?: string) => GameObject;
        createGameObject: (name?: string) => GameObject;
        createCube: (name?: string) => GameObject;
        createPlane: (name?: string) => GameObject;
        createCylinder: (name?: string) => GameObject;
        createSphere: (name?: string) => GameObject;
        createCapsule: (name?: string) => GameObject;
        createCone: (name?: string) => GameObject;
        createTorus: (name?: string) => GameObject;
        createParticle: (name?: string) => GameObject;
        createCamera: (name?: string) => GameObject;
        createPointLight: (name?: string) => GameObject;
    };
}
declare namespace feng3d {
    var GameObjectUtil: {
        addScript: (gameObject: GameObject, scriptPath: string, callback?: ((scriptcomponent: Component) => void) | undefined) => void;
        removeScript: (gameObject: GameObject, script: string | Script) => void;
        reloadJS: (scriptPath: any) => void;
        loadJs: (scriptPath: any, onload?: ((resultScript: {
            className: string;
            script: HTMLScriptElement;
        }) => void) | undefined) => void;
    };
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
        constructor(canvas: HTMLCanvasElement);
    }
}
declare namespace feng3d {
}
declare namespace feng3d {
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
     * 资源路径
     */
    var assetsRoot: string;
    var componentMap: {
        Transform: typeof Transform;
    };
}
