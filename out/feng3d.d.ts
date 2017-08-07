declare namespace feng3d {
    /**
     * 事件
     */
    interface EventVO<T> {
        /**
         * 事件的类型。类型区分大小写。
         */
        type?: string;
        /**
         * 事件携带的自定义数据
         */
        data?: T;
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
    interface IEvent<T> {
        once<K extends keyof T>(type: K, listener: (event: T[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof T>(type: K, data?: T[K], bubbles?: boolean): any;
        has<K extends keyof T>(type: K): boolean;
        on<K extends keyof T>(type: K, listener: (event: T[K]) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof T>(type?: K, listener?: (event: T[K]) => any, thisObject?: any): any;
    }
    /**
     * 事件适配器
     */
    class Event {
        /**
         * 监听一次事件后将会被移除
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        once(type: string, listener: (event: any) => void, thisObject?: any, priority?: number): void;
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
        static getBubbleTargets(target: any): any[];
        private static listenermap;
        /**
         * 监听一次事件后将会被移除
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        private static once(target, type, listener, thisObject, priority?);
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
         * @param target                    事件主体
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        private static dispatch(target, type, data?, bubbles?);
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
         * @param target                    事件主体
         * @param event						调度到事件流中的 Event 对象。
         */
        private static _dispatch(target, event);
        /**
         * 检查 Event 对象是否为特定事件类型注册了任何侦听器.
         *
         * @param type		事件的类型。
         * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        private static has(target, type);
        /**
         * 添加监听
         * @param dispatcher 派发器
         * @param target                    事件主体
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        private static on(target, type, listener, thisObject?, priority?, once?);
        /**
         * 移除监听
         * @param dispatcher 派发器
         * @param target                    事件主体
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        private static off(target, type, listener, thisObject?);
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
        }) => any;
    };
}
declare namespace feng3d {
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
        static getQualifiedClassName(value: any): string;
        /**
         * 获取父类定义
         */
        static getSuperClass(value: any): any;
        /**
         * 返回 value 参数指定的对象的基类的完全限定类名。
         * @param value 需要取得父类的对象，可以将任何 JavaScript 值传递给此方法，包括所有可用的 JavaScript 类型、对象实例、原始类型（如number）和类对象
         * @returns 完全限定的基类名称，或 null（如果不存在基类名称）。
         */
        static getQualifiedSuperclassName(value: any): string;
        /**
         * 返回 name 参数指定的类的类对象引用。
         * @param name 类的名称。
         */
        static getDefinitionByName(name: string): any;
        /**
         * 为一个类定义注册完全限定类名
         * @param classDefinition 类定义
         * @param className 完全限定类名
         */
        static registerClass(classDefinition: any, className: string): void;
        /**
         * 新增反射对象所在的命名空间，使得getQualifiedClassName能够得到正确的结果
         */
        static addClassNameSpace(namespace: string): void;
    }
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
        static deepClone<T>(source: T): T;
        /**
         * 获取实例
         * @param source 实例对象
         */
        static getInstance<T>(source: T): T;
        /**
         * （浅）克隆
         * @param source        源数据
         * @returns             克隆数据
         */
        static clone<T>(source: T): T;
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
    /**
     * 构建Map类代替Dictionary
     * @author feng 2017-01-03
     */
    class Map<K extends {
        uuid: string;
    }, V extends {
        uuid: string;
    }> {
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
declare namespace feng3d {
    /**
     * 观察装饰器，观察被装饰属性的变化
     *
     * *对使用watch修饰的属性赋值比未使用的性能差距100倍左右*
     * @param onChange 属性变化回调
     */
    function watch(onChange: string): (target: any, propertyKey: string) => void;
}
declare namespace feng3d {
    /**
     * 序列化装饰器，被装饰属性将被序列化
     * @param {*} target                序列化原型
     * @param {string} propertyKey      序列化属性
     */
    function serialize(target: any, propertyKey: string): void;
}
declare namespace feng3d {
    var serialization: {
        serialize: (target: any) => any;
        deserialize: (object: any, target?: any) => any;
    };
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
        private static instance;
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
        addItemEventListener(type: string, listener: (event: EventVO<any>) => void, thisObject: any, priority?: number): void;
        /**
         * 移除项事件
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        removeItemEventListener(type: string, listener: (event: EventVO<any>) => void, thisObject: any): void;
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
        addItemEventListener(type: string, listener: (event: EventVO<any>) => void, thisObject: any, priority?: number): void;
        /**
         * 移除项事件
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        removeItemEventListener(type: string, listener: (event: EventVO<any>) => void, thisObject: any): void;
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
        static RAW_DATA_CONTAINER: Float32Array;
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
        constructor(datas?: Float32Array | number[]);
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
         * @param   degrees         角度
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
        copyRawDataFrom(vector: Float32Array, index?: number, transpose?: boolean): this;
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
        transpose(): void;
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
        fromMatrix(matrix: Matrix3D): void;
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
    class Color extends Vector3D {
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
         * 通过
         * @param color
         * @param hasAlpha
         */
        fromUnit(color: number, hasAlpha?: boolean): void;
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
    interface TickerEventMap {
        /**
         * [广播事件] 进入新的一帧,监听此事件将会在下一帧开始时触发一次回调。这是一个广播事件，可以在任何一个显示对象上监听，无论它是否在显示列表中。
         */
        enterFrame: any;
    }
    interface SystemTicker {
        once<K extends keyof TickerEventMap>(type: K, listener: (event: EventVO<TickerEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof TickerEventMap>(type: K, data?: TickerEventMap[K], bubbles?: boolean): any;
        has<K extends keyof TickerEventMap>(type: K): boolean;
        on<K extends keyof TickerEventMap>(type: K, listener: (event: EventVO<TickerEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof TickerEventMap>(type?: K, listener?: (event: EventVO<TickerEventMap[K]>) => any, thisObject?: any): any;
    }
    /**
     * 心跳计时器
     */
    class SystemTicker extends Event {
        private _startTime;
        /**
         * 启动时间
         */
        readonly startTime: number;
        /**
         * @private
         */
        constructor();
        private init();
        /**
         * @private
         * 执行一次刷新
         */
        update(): void;
    }
    /**
     * 心跳计时器单例
     */
    var ticker: SystemTicker;
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
    class Timer extends Event {
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
        once<K extends keyof TimerEventMap>(type: K, listener: (event: EventVO<TimerEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof TimerEventMap>(type: K, data?: TimerEventMap[K], bubbles?: boolean): any;
        has<K extends keyof TimerEventMap>(type: K): boolean;
        on<K extends keyof TimerEventMap>(type: K, listener: (event: EventVO<TimerEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof TimerEventMap>(type?: K, listener?: (event: EventVO<TimerEventMap[K]>) => any, thisObject?: any): any;
    }
}
declare namespace feng3d {
    interface InputEventMap {
        /** 鼠标双击 */
        dblclick: InputEvent;
        /** 鼠标单击 */
        click: InputEvent;
        /** 鼠标按下 */
        mousedown: InputEvent;
        /** 鼠标弹起 */
        mouseup: InputEvent;
        /** 鼠标中键单击 */
        middleclick: InputEvent;
        /** 鼠标中键按下 */
        middlemousedown: InputEvent;
        /** 鼠标中键弹起 */
        middlemouseup: InputEvent;
        /** 鼠标右键单击 */
        rightclick: InputEvent;
        /** 鼠标右键按下 */
        rightmousedown: InputEvent;
        /** 鼠标右键弹起 */
        rightmouseup: InputEvent;
        /** 鼠标移动 */
        mousemove: InputEvent;
        /** 鼠标移出 */
        mouseout: InputEvent;
        /** 鼠标移入 */
        mouseover: InputEvent;
        /** 鼠标滚动滚轮 */
        mousewheel: InputEvent;
        /** 键盘按下 */
        keydown: InputEvent;
        /** 键盘按着 */
        keypress: InputEvent;
        /** 键盘弹起 */
        keyup: InputEvent;
    }
    interface Input {
        /**
         * 监听一次事件后将会被移除
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        once<K extends keyof InputEventMap>(type: K, listener: (event: EventVO<InputEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        dispatch<K extends keyof InputEventMap>(type: K, data?: InputEventMap[K], bubbles?: boolean): any;
        /**
         * 检查 Event 对象是否为特定事件类型注册了任何侦听器.
         *
         * @param type		事件的类型。
         * @return 			如果指定类型的侦听器已注册，则值为 true；否则，值为 false。
         */
        has<K extends keyof InputEventMap>(type: K): boolean;
        /**
         * 添加监听
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        on<K extends keyof InputEventMap>(type: K, listener: (event: EventVO<InputEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        /**
         * 移除监听
         * @param dispatcher 派发器
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         */
        off<K extends keyof InputEventMap>(type?: K, listener?: (event: EventVO<InputEventMap[K]>) => any, thisObject?: any): any;
    }
    /**
     * 鼠标键盘输入，处理js事件中this关键字问题
     * @author feng 2016-12-19
     */
    class Input extends Event {
        clientX: number;
        clientY: number;
        constructor();
        /**
         * 键盘按下事件
         */
        private onMouseKey(event);
    }
    class InputEvent {
        clientX: number;
        clientY: number;
        keyCode: number;
        wheelDelta: number;
        type: keyof InputEventMap;
        constructor(event: WheelEvent | MouseEvent | KeyboardEvent);
    }
    /**
     * 键盘鼠标输入
     */
    var input: Input;
}
declare namespace feng3d {
    /**
     * 按键捕获
     * @author feng 2016-4-26
     */
    class KeyCapture {
        /**
         * 键盘按键字典 （补充常量，a-z以及鼠标按键不必再次列出）
         * 例如 boardKeyDic[17] = "ctrl";
         */
        private _boardKeyDic;
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
declare namespace feng3d {
    /**
     * 按键状态
     * @author feng 2016-4-26
     */
    class KeyState extends Event {
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
        pressKey(key: string, data: InputEvent): void;
        /**
         * 释放键
         * @param key	键名称
         * @param data	携带数据
         */
        releaseKey(key: string, data: InputEvent): void;
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
    class ShortCut extends Event {
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
         * 初始化快捷键模块
         */
        constructor();
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
        loadText: (url: string, onCompleted?: (content: string) => void, onRequestProgress?: () => void, onError?: () => void) => void;
        loadBinary: (url: string, onCompleted?: (content: string) => void, onRequestProgress?: () => void, onError?: () => void) => void;
        loadImage: (url: string, onCompleted?: (content: HTMLImageElement) => void, onRequestProgress?: () => void, onError?: () => void) => void;
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
interface WebGLTexture {
    /**
     * 唯一标识符
     */
    uuid: string;
}
interface WebGLBuffer {
    /**
     * 唯一标识符
     */
    uuid: string;
}
/**
 * WebGL渲染程序
 */
interface WebGLProgram {
    /**
     * 版本号
     */
    version: number;
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
    attributes: WebGLActiveInfo[];
    /**
     * uniform信息列表
     */
    uniforms: WebGLActiveInfo[];
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
    programs: {
        [uuid: string]: WebGLProgram;
    };
    /**
     * 获取纹理各向异性过滤扩展
     */
    anisotropicExt: EXTTextureFilterAnisotropic;
    /**
     * 纹理各向异性过滤最大值
     */
    maxAnisotropy: number;
}
declare namespace feng3d {
    var GL: {
        new (): WebGLRenderingContext;
        prototype: WebGLRenderingContext;
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
        readonly LINE_LOOP: number;
        readonly LINE_STRIP: number;
        readonly LINE_WIDTH: number;
        readonly LINEAR: number;
        readonly LINEAR_MIPMAP_LINEAR: number;
        readonly LINEAR_MIPMAP_NEAREST: number;
        readonly LINES: number;
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
        readonly NO_ERROR: number;
        readonly NONE: number;
        readonly NOTEQUAL: number;
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
        readonly RGB5_A1: number;
        readonly RGB565: number;
        readonly RGBA: number;
        readonly RGBA4: number;
        readonly SAMPLE_ALPHA_TO_COVERAGE: number;
        readonly SAMPLE_BUFFERS: number;
        readonly SAMPLE_COVERAGE: number;
        readonly SAMPLE_COVERAGE_INVERT: number;
        readonly SAMPLE_COVERAGE_VALUE: number;
        readonly SAMPLER_2D: number;
        readonly SAMPLER_CUBE: number;
        readonly SAMPLES: number;
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
        readonly TRIANGLE_FAN: number;
        readonly TRIANGLE_STRIP: number;
        readonly TRIANGLES: number;
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
    };
    interface GL extends WebGLRenderingContext {
        /**
         * 唯一标识符
         */
        uuid: string;
        webgl2: boolean;
        drawElementsInstanced(mode: GLenum, count: GLsizei, type: GLenum, offset: GLintptr, instanceCount: GLsizei): any;
        vertexAttribDivisor(index: GLuint, divisor: GLuint): any;
        drawArraysInstanced(mode: GLenum, first: GLint, count: GLsizei, instanceCount: GLsizei): any;
    }
    function getGL(canvas: HTMLCanvasElement, options?: any): GL;
    /**
     * 渲染模式
     * @author feng 2016-09-28
     */
    class RenderMode {
        /**
         * 点渲染
         */
        static POINTS: number;
        static LINE_LOOP: number;
        static LINE_STRIP: number;
        static LINES: number;
        static TRIANGLES: number;
        static TRIANGLE_STRIP: number;
        static TRIANGLE_FAN: number;
    }
    /**
     * 纹理类型
     */
    class TextureType {
        static TEXTURE_2D: number;
        static TEXTURE_CUBE_MAP: number;
    }
    /**
     * 混合方法
     */
    class BlendEquation {
        /**
         *  source + destination
         */
        static FUNC_ADD: number;
        /**
         * source - destination
         */
        static FUNC_SUBTRACT: number;
        /**
         * destination - source
         */
        static FUNC_REVERSE_SUBTRACT: number;
    }
    /**
     * 混合因子（R分量系数，G分量系数，B分量系数）
     */
    class BlendFactor {
        /**
         * 0.0  0.0 0.0
         */
        static ZERO: number;
        /**
         * 1.0  1.0 1.0
         */
        static ONE: number;
        /**
         * Rs   Gs  Bs
         */
        static SRC_COLOR: number;
        /**
         * 1-Rs   1-Gs  1-Bs
         */
        static ONE_MINUS_SRC_COLOR: number;
        /**
         * Rd   Gd  Bd
         */
        static DST_COLOR: number;
        /**
         * 1-Rd   1-Gd  1-Bd
         */
        static ONE_MINUS_DST_COLOR: number;
        /**
         * As   As  As
         */
        static SRC_ALPHA: number;
        /**
         * 1-As   1-As  1-As
         */
        static ONE_MINUS_SRC_ALPHA: number;
        /**
         * Ad   Ad  Ad
         */
        static DST_ALPHA: number;
        /**
         * 1-Ad   1-Ad  1-Ad
         */
        static ONE_MINUS_DST_ALPHA: number;
        /**
         * min(As-Ad)   min(As-Ad)  min(As-Ad)
         */
        static SRC_ALPHA_SATURATE: number;
    }
}
declare namespace feng3d {
    /**
     * GL扩展
     */
    class GLExtension {
        constructor(gl: GL);
        /**
         * 扩展GL
         * @param gl GL实例
         */
        private extensionWebGL(gl);
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
declare namespace feng3d {
    interface RenderElementEventMap {
        change: any;
    }
    interface RenderElement extends IEvent<RenderElementEventMap> {
        once<K extends keyof RenderElementEventMap>(type: K, listener: (event: EventVO<RenderElementEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof RenderElementEventMap>(type: K, data?: RenderElementEventMap[K], bubbles?: boolean): any;
        has<K extends keyof RenderElementEventMap>(type: K): boolean;
        on<K extends keyof RenderElementEventMap>(type: K, listener: (event: EventVO<RenderElementEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof RenderElementEventMap>(type?: K, listener?: (event: EventVO<RenderElementEventMap[K]>) => any, thisObject?: any): any;
    }
    class RenderElement extends Event {
        invalidate(): void;
    }
}
declare namespace feng3d {
    class UniformData extends RenderElement {
        name: string;
        data: any;
        constructor(name: string, data: any);
    }
    class RenderInstanceCount extends RenderElement {
        name: string;
        data: number | (() => number);
        constructor();
    }
}
declare namespace feng3d {
    type Lazy<T> = T | (() => T);
    interface UniformRenderData {
        /**
         * 模型矩阵
         */
        u_modelMatrix: Lazy<Matrix3D>;
        /**
         * 世界投影矩阵
         */
        u_viewProjection: Matrix3D | (() => Matrix3D);
        /**
         * 摄像机矩阵
         */
        u_cameraMatrix: Matrix3D | (() => Matrix3D);
        u_diffuseInput: Vector3D | (() => Vector3D);
        /**
         * 透明阈值，用于透明检测
         */
        u_alphaThreshold: number | (() => number);
        /**
         * 漫反射贴图
         */
        s_texture: Texture2D | (() => Texture2D);
        /**
         * 漫反射贴图
         */
        s_diffuse: Texture2D | (() => Texture2D);
        /**
         * 环境贴图
         */
        s_ambient: Texture2D | (() => Texture2D);
        /**
         * 法线贴图
         */
        s_normal: Texture2D | (() => Texture2D);
        /**
         * 镜面反射光泽图
         */
        s_specular: Texture2D | (() => Texture2D);
        /**
         * 天空盒纹理
         */
        s_skyboxTexture: TextureCube | (() => TextureCube);
        /**
         * 天空盒尺寸
         */
        u_skyBoxSize: number | (() => number);
        /**
         * 地形混合贴图
         */
        s_blendTexture: Texture2D | (() => Texture2D);
        /**
         * 地形块贴图1
         */
        s_splatTexture1: Texture2D | (() => Texture2D);
        /**
         * 地形块贴图2
         */
        s_splatTexture2: Texture2D | (() => Texture2D);
        /**
         * 地形块贴图3
         */
        s_splatTexture3: Texture2D | (() => Texture2D);
        /**
         * 地形块混合贴图
         */
        s_splatMergeTexture: Texture2D | (() => Texture2D);
        /**
         * 地形块重复次数
         */
        u_splatRepeats: Vector3D | (() => Vector3D);
        /**
         * 地形混合贴图尺寸
         */
        u_splatMergeTextureSize: Point | (() => Point);
        /**
         * 图片尺寸
         */
        u_imageSize: Point | (() => Point);
        /**
         * 地形块尺寸
         */
        u_tileSize: Point | (() => Point);
        /**
         * 地形块偏移
         */
        u_tileOffset: Vector3D[] | (() => Vector3D[]);
        /**
         * 最大lod
         */
        u_maxLod: number | (() => number);
        /**
         * uv与坐标比
         */
        u_uvPositionScale: number | (() => number);
        /**
         * lod0时在贴图中的uv缩放偏移向量
         */
        u_lod0vec: Vector3D | (() => Vector3D);
        /******************************************************/
        /******************************************************/
        /**
         * 点光源位置数组
         */
        u_pointLightPositions: Vector3D[] | (() => Vector3D[]);
        /**
         * 点光源颜色数组
         */
        u_pointLightColors: Vector3D[] | (() => Vector3D[]);
        /**
         * 点光源光照强度数组
         */
        u_pointLightIntensitys: number[] | (() => number[]);
        /**
         * 点光源光照范围数组
         */
        u_pointLightRanges: number[] | (() => number[]);
        /******************************************************/
        /******************************************************/
        /**
         * 方向光源方向数组
         */
        u_directionalLightDirections: Vector3D[] | (() => Vector3D[]);
        /**
         * 方向光源颜色数组
         */
        u_directionalLightColors: Vector3D[] | (() => Vector3D[]);
        /**
         * 方向光源光照强度数组
         */
        u_directionalLightIntensitys: number[] | (() => number[]);
        /**
         * 场景环境光
         */
        u_sceneAmbientColor: Color | (() => Color);
        /**
         * 基本颜色
         */
        u_diffuse: Color | (() => Color);
        /**
         * 镜面反射颜色
         */
        u_specular: Color | (() => Color);
        /**
         * 环境颜色
         */
        u_ambient: Color | (() => Color);
        /**
         * 高光系数
         */
        u_glossiness: number | (() => number);
        /**
         * 反射率
         */
        u_reflectance: number | (() => number);
        /**
         * 粗糙度
         */
        u_roughness: number | (() => number);
        /**
         * 金属度
         */
        u_metalic: number | (() => number);
        /**
         * 粒子时间
         */
        u_particleTime: number | (() => number);
        /**
         * 点大小
         */
        u_PointSize: number | (() => number);
        /**
         * 骨骼全局矩阵
         */
        u_skeletonGlobalMatriices: Matrix3D[] | (() => Matrix3D[]);
        /**
         * 3D对象编号
         */
        u_objectID: number | (() => number);
        /**
         * 雾颜色
         */
        u_fogColor: Color | (() => Color);
        /**
         * 雾最近距离
         */
        u_fogMinDistance: number | (() => number);
        /**
         * 雾最远距离
         */
        u_fogMaxDistance: number | (() => number);
        /**
         * 雾浓度
         */
        u_fogDensity: number | (() => number);
        /**
         * 雾模式
         */
        u_fogMode: number | (() => number);
        /**
         * 环境反射纹理
         */
        s_envMap: TextureCube | (() => TextureCube);
        /**
         * 反射率
         */
        u_reflectivity: number | (() => number);
        /**
         * 单位深度映射到屏幕像素值
         */
        u_scaleByDepth: number | (() => number);
    }
}
declare namespace feng3d {
    class ShaderCode extends RenderElement {
        /**
         * 渲染程序代码
         */
        code: {
            vertexCode: string;
            fragmentCode: string;
        } | (() => {
            vertexCode: string;
            fragmentCode: string;
        });
        private _code;
        constructor(code: {
            vertexCode: string;
            fragmentCode: string;
        } | (() => {
            vertexCode: string;
            fragmentCode: string;
        }));
    }
    enum MacroType {
        value = 0,
        bool = 1,
        add = 2,
    }
    class Macro extends RenderElement {
        type: MacroType;
        name: string;
        value: number | boolean | (() => boolean) | (() => number);
    }
    class ValueMacro extends Macro {
        name: string;
        value: number | (() => number);
        constructor(name: string, value: number | (() => number));
    }
    class BoolMacro extends Macro {
        name: string;
        value: boolean | (() => boolean);
        constructor(name: string, value: boolean | (() => boolean));
    }
    class AddMacro extends Macro {
        name: string;
        value: number | (() => number);
        constructor(name: string, value: number | (() => number));
    }
    class ShaderParam extends RenderElement {
        value: any;
        name: string;
        constructor(name: string);
    }
    class ShaderRenderData {
        uuid: string;
        version: number;
        private _invalid;
        private _resultVertexCode;
        private _resultFragmentCode;
        setShaderCode(shaderCode: ShaderCode): void;
        private shaderCode;
        /**
         * 渲染参数
         */
        shaderParams: ShaderParams;
        addMacro(macro: Macro): void;
        removeMacro(macro: Macro): void;
        private macros;
        constructor();
        /**
         * 激活渲染程序
         */
        activeShaderProgram(gl: GL): WebGLProgram;
        invalidate(): void;
        private getMacroCode(macros);
    }
}
declare namespace feng3d {
    /**
     * 渲染参数
     * @author feng 2016-12-14
     */
    interface ShaderParams {
        /**
         * 渲染模式
         */
        renderMode: number | (() => number);
    }
}
declare namespace feng3d {
    /**
     * 渲染原子（该对象会收集一切渲染所需数据以及参数）
     * @author feng 2016-06-20
     */
    class RenderAtomic {
        addRenderElement(element: RenderElement | RenderElement[]): void;
        removeRenderElement(element: RenderElement | RenderElement[]): void;
        private onElementChange(event);
        addUniform(uniformData: UniformData): void;
        removeUniform(uniformData: UniformData): void;
        addAttribute(attributeData: AttributeRenderData): void;
        removeAttribute(attributeData: AttributeRenderData): void;
        /**
         * 顶点索引缓冲
         */
        private indexBuffer;
        /**
         * 渲染程序
         */
        shader: ShaderRenderData;
        /**
         * 属性数据列表
         */
        private attributes;
        /**
         * Uniform渲染数据
         */
        private uniforms;
        /**
         * 渲染实例数量
         */
        private instanceCount;
        constructor();
        invalidateShader(): void;
        /**
         * 激活属性
         */
        activeAttributes(gl: GL, attributeInfos: WebGLActiveInfo[]): void;
        /**
         * 激活常量
         */
        activeUniforms(gl: GL, uniformInfos: WebGLActiveInfo[]): void;
        /**
         * 设置环境Uniform数据
         */
        private setContext3DUniform(gl, activeInfo, data);
        /**
         */
        dodraw(gl: GL): void;
    }
}
declare namespace feng3d {
    /**
     * 索引渲染数据
     * @author feng 2017-01-04
     */
    class IndexRenderData extends RenderElement {
        /**
         * 索引数据
         */
        indices: Uint16Array;
        private _indices;
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
        /**
         * 缓冲
         */
        private _indexBufferMap;
        /**
         * 是否失效
         */
        private _invalid;
        constructor();
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
        /**
         * 克隆
         */
        clone(): this;
    }
}
declare namespace feng3d {
    interface AttributeRenderDataStuct {
        /**
         * 坐标
         */
        a_position: AttributeRenderData;
        /**
         * 颜色
         */
        a_color: AttributeRenderData;
        /**
         * 法线
         */
        a_normal: AttributeRenderData;
        /**
         * 切线
         */
        a_tangent: AttributeRenderData;
        /**
         * uv（纹理坐标）
         */
        a_uv: AttributeRenderData;
        /**
         * 关节索引
         */
        a_jointindex0: AttributeRenderData;
        /**
         * 关节权重
         */
        a_jointweight0: AttributeRenderData;
        /**
         * 关节索引
         */
        a_jointindex1: AttributeRenderData;
        /**
         * 关节权重
         */
        a_jointweight1: AttributeRenderData;
    }
    /**
     * 属性渲染数据
     * @author feng 2014-8-14
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer}
     */
    class AttributeRenderData extends RenderElement {
        name: string;
        /**
         * 属性数据
         */
        data: Float32Array;
        private _data;
        /**
         * 数据尺寸
         *
         * A GLint specifying the number of components per vertex attribute. Must be 1, 2, 3, or 4.
         */
        size: number;
        private _size;
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
        type: number;
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
        _divisor: number;
        updateGrometry: Function;
        /**
         * 顶点数据缓冲
         */
        private _indexBufferMap;
        /**
         * 是否失效
         */
        private _invalid;
        constructor(name: string, data?: Float32Array, size?: number, divisor?: number);
        /**
         * 使数据缓冲失效
         */
        invalidate(): void;
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
        /**
         * 克隆
         */
        clone(): this;
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
        NUM_LIGHT: ValueMacro;
        /**
         * 点光源数量
         */
        NUM_POINTLIGHT: ValueMacro;
        /**
         * 方向光源数量
         */
        NUM_DIRECTIONALLIGHT: ValueMacro;
        /**
         * 骨骼关节数量
         */
        NUM_SKELETONJOINT: ValueMacro;
    }
    /**
     * Boolean类型宏
     * 没有默认值
     */
    interface BoolMacros {
        /**
         * 是否有漫反射贴图
         */
        HAS_DIFFUSE_SAMPLER: BoolMacro;
        /**
         * 是否有法线贴图
         */
        HAS_NORMAL_SAMPLER: BoolMacro;
        /**
         * 是否有镜面反射光泽图
         */
        HAS_SPECULAR_SAMPLER: BoolMacro;
        /**
         * 是否有环境贴图
         */
        HAS_AMBIENT_SAMPLER: BoolMacro;
        /**
         * 是否有骨骼动画
         */
        HAS_SKELETON_ANIMATION: BoolMacro;
        /**
         * 是否有粒子动画
         */
        HAS_PARTICLE_ANIMATOR: BoolMacro;
        /**
         * 是否为点渲染模式
         */
        IS_POINTS_MODE: BoolMacro;
        /**
         * 是否有地形方法
         */
        HAS_TERRAIN_METHOD: BoolMacro;
        /**
         * 使用合并地形贴图
         */
        USE_TERRAIN_MERGE: BoolMacro;
        /**
         * 雾函数
         */
        HAS_FOG_METHOD: BoolMacro;
        /**
         * 环境映射函数
         */
        HAS_ENV_METHOD: BoolMacro;
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
    abstract class TextureInfo {
        /**
         * 纹理类型
         */
        textureType: number;
        protected _textureType: number;
        /**
         * 图片数据
         */
        pixels: HTMLCanvasElement | ImageData | HTMLImageElement | HTMLVideoElement | ImageData[] | HTMLVideoElement[] | HTMLImageElement[] | HTMLCanvasElement[];
        protected _pixels: ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageData[] | HTMLVideoElement[] | HTMLImageElement[] | HTMLCanvasElement[];
        /**
         * 纹理宽度
         */
        width: any;
        protected _width: number;
        /**
         * 纹理高度
         */
        height: any;
        protected _height: number;
        /**
         * 纹理尺寸
         */
        size: Point;
        protected _size: Point;
        /**
         * 格式
         */
        format: number;
        protected _format: number;
        /**
         * 数据类型
         */
        type: number;
        _type: number;
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
        minFilter: number;
        magFilter: number;
        /**
         * 表示x轴的纹理的回环方式，就是当纹理的宽度小于需要贴图的平面的宽度的时候，平面剩下的部分应该p以何种方式贴图的问题。
         */
        wrapS: number;
        /**
         * 表示y轴的纹理回环方式。 magFilter和minFilter表示过滤的方式，这是OpenGL的基本概念，我将在下面讲一下，目前你不用担心它的使用。当您不设置的时候，它会取默认值，所以，我们这里暂时不理睬他。
         */
        wrapT: number;
        /**
         * 各向异性过滤。使用各向异性过滤能够使纹理的效果更好，但是会消耗更多的内存、CPU、GPU时间。默认为0。
         */
        anisotropy: number;
        /**
         * 纹理缓冲
         */
        protected _textureMap: Map<GL, WebGLTexture>;
        /**
         * 是否失效
         */
        private _invalid;
        /**
         * 构建纹理
         */
        constructor();
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
        private initTexture2D(gl);
        /**
         * 初始化纹理
         */
        private initTextureCube(gl);
        /**
         * 清理纹理
         */
        private clear();
    }
}
declare namespace feng3d {
    class RenderData extends Event {
        private _elementMap;
        readonly elements: RenderElement[];
        private _elements;
        createIndexBuffer(indices: Uint16Array): IndexRenderData;
        createUniformData<K extends keyof UniformRenderData>(name: K, data: UniformRenderData[K]): UniformData;
        createAttributeRenderData<K extends keyof AttributeRenderDataStuct>(name: K, data?: Float32Array, size?: number, divisor?: number): AttributeRenderData;
        createShaderCode(code: {
            vertexCode: string;
            fragmentCode: string;
        } | (() => {
            vertexCode: string;
            fragmentCode: string;
        })): ShaderCode;
        createValueMacro<K extends keyof ValueMacros>(name: K, value: number | (() => number)): ValueMacro;
        createBoolMacro<K extends keyof BoolMacros>(name: K, value: boolean | (() => boolean)): BoolMacro;
        createAddMacro<K extends keyof IAddMacros>(name: K, value: number): AddMacro;
        createInstanceCount(value: number | (() => number)): RenderInstanceCount;
        createShaderParam<K extends keyof ShaderParams>(name: K, value: ShaderParams[K]): ShaderParam;
        addRenderElement(element: RenderElement | RenderElement[]): void;
        removeRenderElement(element: RenderElement | RenderElement[]): void;
    }
}
declare namespace feng3d {
    interface RenderDataHolderEventMap {
        /**
         * 添加渲染元素
         */
        addRenderElement: any;
        /**
         * 移除渲染元素
         */
        removeRenderElement: any;
        /**
         * 添加渲染数据拥有者
         */
        addRenderHolder: any;
        /**
         * 移除渲染数据拥有者
         */
        removeRenderHolder: any;
        /**
         * 渲染数据拥有者数据失效
         */
        invalidateRenderHolder: any;
    }
    interface RenderDataHolder {
        once<K extends keyof RenderDataHolderEventMap>(type: K, listener: (event: RenderDataHolderEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof RenderDataHolderEventMap>(type: K, data?: RenderDataHolderEventMap[K], bubbles?: boolean): any;
        has<K extends keyof RenderDataHolderEventMap>(type: K): boolean;
        on<K extends keyof RenderDataHolderEventMap>(type: K, listener: (event: RenderDataHolderEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof RenderDataHolderEventMap>(type?: K, listener?: (event: RenderDataHolderEventMap[K]) => any, thisObject?: any): any;
    }
    /**
     * 渲染数据拥有者
     * @author feng 2016-6-7
     */
    class RenderDataHolder extends RenderData {
        /**
         * 是否每次必须更新
         */
        readonly updateEverytime: boolean;
        protected _updateEverytime: boolean;
        childrenRenderDataHolder: RenderDataHolder[];
        /**
         * 创建GL数据缓冲
         */
        constructor();
        /**
         * 收集渲染数据拥有者
         * @param renderAtomic 渲染原子
         */
        collectRenderDataHolder(renderAtomic?: Object3DRenderAtomic): void;
        addRenderDataHolder(renderDataHolder: RenderDataHolder): void;
        removeRenderDataHolder(renderDataHolder: RenderDataHolder): void;
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext, renderData: RenderAtomic): void;
        invalidateRenderHolder(): void;
    }
}
declare namespace feng3d {
    class Object3DRenderAtomic extends RenderAtomic {
        private _invalidateRenderDataHolderList;
        renderHolderInvalid: boolean;
        private onInvalidate(event);
        private onAddElement(event);
        private onRemoveElement(event);
        private onInvalidateShader(event);
        private onAddRenderHolder(event);
        private onRemoveRenderHolder(event);
        private addInvalidateHolders(renderDataHolder);
        private addInvalidateShader(renderDataHolder);
        private renderDataHolders;
        private updateEverytimeList;
        addRenderDataHolder(renderDataHolder: RenderDataHolder | RenderDataHolder[]): void;
        removeRenderDataHolder(renderDataHolder: RenderDataHolder | RenderDataHolder[]): void;
        update(renderContext: RenderContext): void;
        clear(): void;
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
         * 3D视窗
         */
        view3D: Engine;
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
    interface Feng3dObjectVO {
        uuid: string;
        class: string;
    }
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
        /**
         * Returns the instance id of the Feng3dObject.
         */
        uuid: string;
        constructor();
        static get(uuid: any): Feng3dObject;
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
        static findObjectOfType<T extends Feng3dObject>(type: Type<T>): T;
        /**
         * Returns a list of all active loaded objects of Type type.
         */
        static findObjectsOfType<T extends Feng3dObject>(type: Type<T>): T[];
        /**
         * Returns a copy of the Feng3dObject original.
         * @param original	An existing Feng3dObject that you want to make a copy of.
         * @param position	Position for the new Feng3dObject(default Vector3.zero).
         * @param rotation	Orientation of the new Feng3dObject(default Quaternion.identity).
         * @param parent	The transform the Feng3dObject will be parented to.
         * @param worldPositionStays	If when assigning the parent the original world position should be maintained.
         */
        static instantiate<T extends Feng3dObject>(original: T, position?: Vector3D, rotation?: Quaternion, parent?: Transform, worldPositionStays?: boolean): T;
    }
}
declare namespace feng3d {
    /**
     * 组件事件
     */
    interface ComponentEventMap extends RenderDataHolderEventMap {
        /**
         * 添加子组件事件
         */
        addedComponent: {
            container: GameObject;
            child: Component;
        };
        /**
         * 移除子组件事件
         */
        removedComponent: any;
    }
    interface Component {
        once<K extends keyof ComponentEventMap>(type: K, listener: (event: ComponentEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof ComponentEventMap>(type: K, data?: ComponentEventMap[K], bubbles?: boolean): any;
        has<K extends keyof ComponentEventMap>(type: K): boolean;
        on<K extends keyof ComponentEventMap>(type: K, listener: (event: ComponentEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof ComponentEventMap>(type?: K, listener?: (event: ComponentEventMap[K]) => any, thisObject?: any): any;
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
         * 创建一个组件容器
         */
        constructor(gameObject: GameObject);
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
        getComponentsInChildren<T extends Component>(type?: ComponentConstructor<T>): T[];
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
     * @author feng 2016-05-01
     */
    class Renderer extends Component {
        /**
         * 材质
         * Returns the first instantiated Material assigned to the renderer.
         */
        material: Material;
        private _material;
        /**
         * Makes the rendered 3D object visible if enabled.
         */
        readonly enabled: boolean;
        enable: any;
        private _enabled;
        /**
         * Is this renderer visible in any camera? (Read Only)
         */
        readonly isVisible: boolean;
        constructor(gameObject: GameObject);
        drawRenderables(renderContext: RenderContext): void;
        /**
         * 绘制3D对象
         */
        protected drawObject3D(gl: GL, renderAtomic: RenderAtomic, shader?: ShaderRenderData): void;
        /**
         * 销毁
         */
        dispose(): void;
    }
}
declare namespace feng3d {
    /**
     * 前向渲染器
     * @author feng 2017-02-20
     */
    class ForwardRenderer {
        /**
         * 渲染
         */
        draw(renderContext: RenderContext, viewRect: Rectangle): void;
    }
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
        private _shaderName;
        selectedObject3D: GameObject;
        private objects;
        constructor();
        /**
         * 渲染
         */
        draw(renderContext: RenderContext): void;
        protected drawRenderables(renderContext: RenderContext, meshRenderer: MeshRenderer): void;
        /**
         * 绘制3D对象
         */
        protected drawObject3D(gl: GL, renderAtomic: RenderAtomic, shader?: ShaderRenderData): void;
    }
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
    class ShadowRenderer {
        constructor();
        /**
         * 渲染
         */
        draw(renderContext: RenderContext): void;
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
    /**
     * A class to access the Mesh of the mesh filter.
     * Use this with a procedural mesh interface. See Also: Mesh class.
     */
    class MeshFilter extends Component {
        /**
         * Returns the instantiated Mesh assigned to the mesh filter.
         */
        mesh: Geometry;
        private _mesh;
        constructor(gameObject: GameObject);
        /**
         * 销毁
         */
        dispose(): void;
    }
}
declare namespace feng3d {
    /**
     * Position, rotation and scale of an object.
     */
    class Object3D extends Component {
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
         * 是否显示
         */
        visible: boolean;
        /**
         * 自身以及子对象是否支持鼠标拾取
         */
        mouseEnabled: boolean;
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
        scale: Vector3D;
        readonly forwardVector: Vector3D;
        readonly rightVector: Vector3D;
        readonly upVector: Vector3D;
        readonly backVector: Vector3D;
        readonly leftVector: Vector3D;
        readonly downVector: Vector3D;
        protected constructor(gameObject: GameObject);
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
        protected _position: Vector3D;
        protected _rotation: Vector3D;
        protected _scale: Vector3D;
        protected _matrix3d: Matrix3D;
        protected _rotationMatrix3d: Matrix3D;
        protected _localToWorldMatrix: Matrix3D;
        protected _worldToLocalMatrix: Matrix3D;
        protected _localToWorldRotationMatrix: Matrix3D;
        private invalidateRotation();
        private invalidateScale();
        private invalidatePosition();
    }
}
declare namespace feng3d {
    class ObjectContainer3D extends Object3D {
        readonly scenePosition: Vector3D;
        readonly minX: number;
        readonly minY: number;
        readonly minZ: number;
        readonly maxX: number;
        readonly maxY: number;
        readonly maxZ: number;
        readonly parent: Transform;
        /**
         * Matrix that transforms a point from local space into world space.
         */
        localToWorldMatrix: Matrix3D;
        /**
         * Matrix that transforms a point from world space into local space (Read Only).
         */
        readonly worldToLocalMatrix: Matrix3D;
        readonly localToWorldRotationMatrix: Matrix3D;
        protected constructor(gameObject: GameObject);
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
        lookAt(target: Vector3D, upAxis?: Vector3D): void;
        translateLocal(axis: Vector3D, distance: number): void;
        dispose(): void;
        rotate(axis: Vector3D, angle: number, pivotPoint?: Vector3D): void;
        invalidateTransform(): void;
        protected updateLocalToWorldMatrix(): void;
        protected invalidateSceneTransform(): void;
    }
}
declare namespace feng3d {
    interface TransformEventMap extends ComponentEventMap {
        /**
         * 显示变化
         */
        visiblityUpdated: any;
        /**
         * 场景矩阵变化
         */
        scenetransformChanged: any;
        /**
         * 位置变化
         */
        positionChanged: any;
        /**
         * 旋转变化
         */
        rotationChanged: any;
        /**
         * 缩放变化
         */
        scaleChanged: any;
        /**
         * 变换矩阵变化
         */
        transformChanged: any;
        /**
         *
         */
        updateLocalToWorldMatrix: any;
    }
    interface Object3D {
        once<K extends keyof TransformEventMap>(type: K, listener: (event: EventVO<TransformEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof TransformEventMap>(type: K, data?: TransformEventMap[K], bubbles?: boolean): any;
        has<K extends keyof TransformEventMap>(type: K): boolean;
        on<K extends keyof TransformEventMap>(type: K, listener: (event: EventVO<TransformEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof TransformEventMap>(type?: K, listener?: (event: EventVO<TransformEventMap[K]>) => any, thisObject?: any): any;
    }
    /**
     * Position, rotation and scale of an object.
     *
     * Every object in a scene has a Transform. It's used to store and manipulate the position, rotation and scale of the object. Every Transform can have a parent, which allows you to apply position, rotation and scale hierarchically. This is the hierarchy seen in the Hierarchy pane.
     */
    class Transform extends ObjectContainer3D {
        protected _bounds: BoundingVolumeBase;
        protected _boundsInvalid: boolean;
        _pickingCollisionVO: PickingCollisionVO;
        private _worldBounds;
        private _worldBoundsInvalid;
        /**
         * 创建一个实体，该类为虚类
         */
        constructor(gameObject: GameObject);
        /**
         * @inheritDoc
         */
        readonly minX: number;
        /**
         * @inheritDoc
         */
        readonly minY: number;
        /**
         * @inheritDoc
         */
        readonly minZ: number;
        /**
         * @inheritDoc
         */
        readonly maxX: number;
        /**
         * @inheritDoc
         */
        readonly maxY: number;
        /**
         * @inheritDoc
         */
        readonly maxZ: number;
        /**
         * 边界
         */
        readonly bounds: BoundingVolumeBase;
        /**
         * @inheritDoc
         */
        invalidateSceneTransform(): void;
        /**
         * 边界失效
         */
        protected invalidateBounds(): void;
        /**
         * 获取默认边界（默认盒子边界）
         * @return
         */
        protected getDefaultBoundingVolume(): BoundingVolumeBase;
        /**
         * 获取碰撞数据
         */
        readonly pickingCollisionVO: PickingCollisionVO;
        /**
          * 判断射线是否穿过对象
          * @param ray3D
          * @return
          */
        isIntersectingRay(ray3D: Ray3D): boolean;
        /**
         * 世界边界
         */
        readonly worldBounds: BoundingVolumeBase;
        /**
         * 更新世界边界
         */
        private updateWorldBounds();
        /**
         * 处理包围盒变换事件
         */
        protected onBoundsChange(): void;
        /**
         * @inheritDoc
         */
        protected updateBounds(): void;
        /**
         * 碰撞前设置碰撞状态
         * @param shortestCollisionDistance 最短碰撞距离
         * @param findClosest 是否寻找最优碰撞
         * @return
         */
        collidesBefore(pickingCollider: AS3PickingCollider, shortestCollisionDistance: number, findClosest: boolean): boolean;
    }
}
declare namespace feng3d {
    type ComponentConstructor<T> = (new (gameObject: GameObject) => T);
    interface ComponentMap {
        camera: new () => Camera;
    }
    interface Mouse3DEventMap {
        mouseout: any;
        mouseover: any;
        mousedown: any;
        mouseup: any;
        mousemove: any;
        click: any;
        dblclick: any;
    }
    interface GameObjectEventMap extends Mouse3DEventMap, RenderDataHolderEventMap {
        addedComponent: any;
        removedComponent: any;
        /**
         * 添加了子对象，当child被添加到parent中时派发冒泡事件
         */
        added: any;
        /**
         * 删除了子对象，当child被parent移除时派发冒泡事件
         */
        removed: any;
        /**
         * 当Object3D的scene属性被设置是由Scene3D派发
         */
        addedToScene: GameObject;
        /**
         * 当Object3D的scene属性被清空时由Scene3D派发
         */
        removedFromScene: GameObject;
        /**
         * 场景变化
         */
        sceneChanged: GameObject;
    }
    interface GameObject {
        once<K extends keyof GameObjectEventMap>(type: K, listener: (event: EventVO<GameObjectEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof GameObjectEventMap>(type: K, data?: GameObjectEventMap[K], bubbles?: boolean): any;
        has<K extends keyof GameObjectEventMap>(type: K): boolean;
        on<K extends keyof GameObjectEventMap>(type: K, listener: (event: EventVO<GameObjectEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof GameObjectEventMap>(type?: K, listener?: (event: EventVO<GameObjectEventMap[K]>) => any, thisObject?: any): any;
    }
    /**
     * Base class for all entities in feng3d scenes.
     */
    class GameObject extends Feng3dObject {
        protected _children: GameObject[];
        protected _scene: Scene3D;
        protected _parent: GameObject;
        /**
         * 是否可序列化
         */
        serializable: boolean;
        /**
         * The name of the Feng3dObject.
         * Components share the same name with the game object and all attached components.
         */
        name: string;
        /**
         * The Transform attached to this GameObject. (null if there is none attached).
         */
        readonly transform: Transform;
        private _transform;
        /**
         * @private
         */
        readonly renderData: Object3DRenderAtomic;
        readonly parent: GameObject;
        /**
         * 子对象
         */
        children: GameObject[];
        readonly numChildren: number;
        /**
         * 子组件个数
         */
        readonly numComponents: number;
        updateRender(renderContext: RenderContext): void;
        /**
         * 构建3D对象
         */
        private constructor();
        contains(child: GameObject): boolean;
        addChild(child: GameObject): GameObject;
        addChildren(...childarray: any[]): void;
        setChildAt(child: GameObject, index: number): void;
        removeChild(child: GameObject): void;
        removeChildAt(index: number): void;
        private _setParent(value);
        getChildAt(index: number): GameObject;
        readonly scene: Scene3D;
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
        getComponentsInChildren<T extends Component>(type?: ComponentConstructor<T>, result?: T[]): T[];
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
        private static _gameObjects;
        /**
         * Finds a game object by name and returns it.
         * @param name
         */
        static find(name: string): GameObject;
        static create(name?: string): GameObject;
        /**
         * 组件列表
         */
        protected components: Component[];
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
        deserialize(object: any): void;
    }
}
declare namespace feng3d {
    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    class Engine {
        gl: GL;
        /**
         * 摄像机
         */
        camera: Camera;
        /**
         * 3d场景
         */
        scene: Scene3D;
        canvas: HTMLCanvasElement;
        /**
         * 默认渲染器
         */
        private defaultRenderer;
        /**
         * 鼠标事件管理器
         */
        private mouse3DManager;
        /**
         * 阴影图渲染器
         */
        private shadowRenderer;
        /**
         * 渲染环境
         */
        private renderContext;
        /**
         * 鼠标在3D视图中的位置
         */
        readonly mousePos: Point;
        viewRect: Rectangle;
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
        static get(canvas?: HTMLCanvasElement): Engine;
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
        constructor(gameobject: GameObject);
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
        constructor(gameobject: GameObject);
        private invalidHoldSizeMatrix();
        private updateLocalToWorldMatrix();
        dispose(): void;
    }
}
declare namespace feng3d {
    /**
     * Renders meshes inserted by the MeshFilter or TextMesh.
     */
    class MeshRenderer extends Renderer {
        readonly single: boolean;
        /**
         * 构建
         */
        constructor(gameObject: GameObject);
        drawRenderables(renderContext: RenderContext): void;
    }
}
declare namespace feng3d {
    /**
     * 3d对象脚本
     * @author feng 2017-03-11
     */
    class Script extends Component {
        /**
         * 脚本路径
         */
        url: string;
        private _enabled;
        constructor(gameObject: GameObject);
        /**
         * Enabled Behaviours are Updated, disabled Behaviours are not.
         */
        enabled: boolean;
        /**
         * 初始化
         */
        init(): void;
        /**
         * 更新
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
     * 3D场景
     * @author feng 2016-05-01
     */
    class Scene3D extends Component {
        /**
         * 背景颜色
         */
        background: Color;
        /**
         * 环境光强度
         */
        ambientColor: Color;
        /**
         * 构造3D场景
         */
        constructor(gameObject: GameObject);
    }
}
declare namespace feng3d {
    interface GeometryEventMap extends RenderDataHolderEventMap {
        /**
         * 获取几何体顶点数据
         */
        getVAData: any;
        /**
         * 改变几何体顶点数据事件
         */
        changedVAData: any;
        /**
         * 改变顶点索引数据事件
         */
        changedIndexData: any;
        /**
         * 包围盒失效
         */
        boundsInvalid: any;
    }
    interface Geometry {
        once<K extends keyof GeometryEventMap>(type: K, listener: (event: GeometryEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof GeometryEventMap>(type: K, data?: GeometryEventMap[K], bubbles?: boolean): any;
        has<K extends keyof GeometryEventMap>(type: K): boolean;
        on<K extends keyof GeometryEventMap>(type: K, listener: (event: GeometryEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof GeometryEventMap>(type?: K, listener?: (event: GeometryEventMap[K]) => any, thisObject?: any): any;
    }
    /**
     * 几何体
     * @author feng 2016-04-28
     */
    class Geometry extends Feng3dObject {
        /**
         * 顶点索引缓冲
         */
        private _indexBuffer;
        /**
         * 属性数据列表
         */
        private _attributes;
        private _geometryInvalid;
        private _useFaceWeights;
        private _scaleU;
        private _scaleV;
        /**
         * 坐标数据
         */
        positions: Float32Array;
        /**
         * uv数据
         */
        uvs: Float32Array;
        /**
         * 法线数据
         */
        normals: Float32Array;
        /**
         * 切线数据
         */
        tangents: Float32Array;
        /**
         * 创建一个几何体
         */
        constructor();
        /**
         * 更新渲染数据
         */
        updateRenderData(renderContext: RenderContext, renderData: RenderAtomic): void;
        /**
         * 几何体变脏
         */
        protected invalidateGeometry(): void;
        /**
         * 更新几何体
         */
        protected updateGrometry(): void;
        /**
         * 构建几何体
         */
        protected buildGeometry(): void;
        /**
         * 索引数据
         */
        readonly indices: Uint16Array;
        /**
         * 更新顶点索引数据
         */
        setIndices(indices: Uint16Array): void;
        /**
         * 获取顶点数据
         */
        getIndexData(): IndexRenderData;
        /**
         * 设置顶点属性数据
         * @param vaId          顶点属性编号
         * @param data          顶点属性数据
         * @param size          顶点数据尺寸
         */
        setVAData<K extends keyof AttributeRenderDataStuct>(vaId: K, data: Float32Array, size: number): void;
        /**
         * 获取顶点属性数据
         * @param vaId 数据类型编号
         * @return 顶点属性数据
         */
        getVAData(vaId: string): AttributeRenderData;
        /**
         * 获取顶点属性数据
         * @param vaId 数据类型编号
         * @return 顶点属性数据
         */
        getVAData1(vaId: string): Float32Array;
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
        /**
         * 创建顶点法线
         */
        createVertexNormals(): void;
        /**
         * 创建顶点切线
         */
        createVertexTangents(): void;
        /**
         * 克隆一个几何体
         */
        clone(): Geometry;
        /**
         * 从一个几何体中克隆数据
         */
        cloneFrom(geometry: Geometry): void;
    }
}
declare namespace feng3d {
    var GeometryUtils: {
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
        /**
         * 几何体是否变脏
         */
        private geometryDirty;
        private _points;
        constructor();
        /**
         * 添加点
         * @param point		点数据
         */
        addPoint(point: PointInfo, needUpdateGeometry?: boolean): void;
        /**
         * 更新几何体
         */
        updateGeometry(): void;
        /**
         * 获取线段数据
         * @param index 		线段索引
         * @return				线段数据
         */
        getPoint(index: number): PointInfo;
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
        normal: Vector3D;
        uv: Point;
        /**
         * 创建点
         * @param position 坐标
         */
        constructor(position?: Vector3D, uv?: Point, normal?: Vector3D);
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
        constructor(start: Vector3D, end: Vector3D, colorStart?: number, colorEnd?: number);
        /**
         * 坐标数据
         */
        readonly positionData: number[];
        /**
         * 颜色数据
         */
        readonly colorData: number[];
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
    abstract class LensBase extends Event {
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
        protected _matrix: Matrix3D;
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
declare namespace feng3d {
    /**
     *
     * @author feng 2015-5-28
     */
    class FreeMatrixLens extends LensBase {
        constructor();
        protected updateMatrix(): void;
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
        protected updateMatrix(): void;
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
        once<K extends keyof CameraEventMap>(type: K, listener: (event: CameraEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof CameraEventMap>(type: K, data?: CameraEventMap[K], bubbles?: boolean): any;
        has<K extends keyof CameraEventMap>(type: K): boolean;
        on<K extends keyof CameraEventMap>(type: K, listener: (event: CameraEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof CameraEventMap>(type?: K, listener?: (event: CameraEventMap[K]) => any, thisObject?: any): any;
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
        constructor(gameObject: GameObject);
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
    interface BoundingVolumeBaseEventMap {
        change: any;
    }
    interface BoundingVolumeBase extends IEvent<BoundingVolumeBaseEventMap> {
        once<K extends keyof BoundingVolumeBaseEventMap>(type: K, listener: (event: BoundingVolumeBaseEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof BoundingVolumeBaseEventMap>(type: K, data?: BoundingVolumeBaseEventMap[K], bubbles?: boolean): any;
        has<K extends keyof BoundingVolumeBaseEventMap>(type: K): boolean;
        on<K extends keyof BoundingVolumeBaseEventMap>(type: K, listener: (event: BoundingVolumeBaseEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof BoundingVolumeBaseEventMap>(type?: K, listener?: (event: BoundingVolumeBaseEventMap[K]) => any, thisObject?: any): any;
    }
    /**
     * 包围盒基类
     * @author feng 2014-4-27
     */
    abstract class BoundingVolumeBase extends Event {
        /** 最小坐标 */
        protected _min: Vector3D;
        /** 最大坐标 */
        protected _max: Vector3D;
        protected _aabbPointsDirty: boolean;
        private _geometry;
        /**
         * 用于生产包围盒的几何体
         */
        geometry: Geometry;
        /**
         * The maximum extreme of the bounds
         */
        readonly max: Vector3D;
        /**
         * The minimum extreme of the bounds
         */
        readonly min: Vector3D;
        /**
         * 创建包围盒
         */
        constructor();
        /**
         * 处理几何体包围盒失效
         */
        protected onGeometryBoundsInvalid(): void;
        /**
         * 根据几何结构更新边界
         */
        fromGeometry(geometry: Geometry): void;
        /**
         * 根据所给极值设置边界
         * @param minX 边界最小X坐标
         * @param minY 边界最小Y坐标
         * @param minZ 边界最小Z坐标
         * @param maxX 边界最大X坐标
         * @param maxY 边界最大Y坐标
         * @param maxZ 边界最大Z坐标
         */
        fromExtremes(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): void;
        /**
         * 检测射线是否与边界交叉
         * @param ray3D						射线
         * @param targetNormal				交叉点法线值
         * @return							射线起点到交点距离
         */
        rayIntersection(ray3D: Ray3D, targetNormal: Vector3D): number;
        /**
         * 检测是否包含指定点
         * @param position 		被检测点
         * @return				true：包含指定点
         */
        containsPoint(position: Vector3D): boolean;
        /**
         * 测试是否出现在摄像机视锥体内
         * @param planes 		视锥体面向量
         * @param numPlanes		面数
         * @return 				true：出现在视锥体内
         */
        abstract isInFrustum(planes: Plane3D[], numPlanes: number): boolean;
        /**
         * 对包围盒进行变换
         * @param bounds		包围盒
         * @param matrix		变换矩阵
         */
        abstract transformFrom(bounds: BoundingVolumeBase, matrix: Matrix3D): any;
        /**
         * 从给出的球体设置边界
         * @param center 		球心坐标
         * @param radius 		球体半径
         */
        fromSphere(center: Vector3D, radius: number): void;
    }
}
declare namespace feng3d {
    /**
     * 轴对其包围盒
     * @author feng 2014-4-27
     */
    class AxisAlignedBoundingBox extends BoundingVolumeBase {
        private _centerX;
        private _centerY;
        private _centerZ;
        private _halfExtentsX;
        private _halfExtentsY;
        private _halfExtentsZ;
        /**
         * 创建轴对其包围盒
         */
        constructor();
        /**
         * 测试轴对其包围盒是否出现在摄像机视锥体内
         * @param planes 		视锥体面向量
         * @return 				true：出现在视锥体内
         * @see me.feng3d.cameras.Camera3D.updateFrustum()
         */
        isInFrustum(planes: Plane3D[], numPlanes: number): boolean;
        /**
         * @inheritDoc
         */
        fromExtremes(minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number): void;
        /**
         * @inheritDoc
         */
        rayIntersection(ray3D: Ray3D, targetNormal: Vector3D): number;
        /**
         * @inheritDoc
         */
        containsPoint(position: Vector3D): boolean;
        /**
         * 对包围盒进行变换
         * @param bounds		包围盒
         * @param matrix		变换矩阵
         * @see http://www.cppblog.com/lovedday/archive/2008/02/23/43122.html
         */
        transformFrom(bounds: BoundingVolumeBase, matrix: Matrix3D): void;
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
         * @param   width           宽度，默认为100。
         * @param   height          高度，默认为100。
         * @param   depth           深度，默认为100。
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
        private _topRadius;
        bottomRadius: number;
        private _bottomRadius;
        height: number;
        private _height;
        segmentsW: number;
        private _segmentsW;
        segmentsH: number;
        private _segmentsH;
        topClosed: boolean;
        private _topClosed;
        bottomClosed: boolean;
        private _bottomClosed;
        surfaceClosed: boolean;
        private _surfaceClosed;
        yUp: boolean;
        private _yUp;
        /**
         * 创建圆柱体
         */
        constructor(topRadius?: number, bottomRadius?: number, height?: number, segmentsW?: number, segmentsH?: number, topClosed?: boolean, bottomClosed?: boolean, surfaceClosed?: boolean, yUp?: boolean);
        /**
         * 计算几何体顶点数
         */
        private getNumVertices();
        /**
         * 计算几何体三角形数量
         */
        private getNumTriangles();
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
        protected _vertexPositionData: Float32Array;
        protected _vertexNormalData: Float32Array;
        protected _vertexTangentData: Float32Array;
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
    /**
     * 天空盒几何体
     * @author feng 2016-09-12
     */
    class SkyBoxGeometry extends Geometry {
        /**
         * 创建天空盒
         */
        constructor();
    }
}
declare namespace feng3d {
    /**
     * 2D纹理
     * @author feng 2016-12-20
     */
    class Texture2D extends TextureInfo {
        protected _pixels: HTMLImageElement;
        url: string;
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
        constructor(images: string[]);
        /**
         * 判断数据是否满足渲染需求
         */
        checkRenderData(): boolean;
    }
}
declare namespace feng3d {
    /**
     * 渲染目标纹理
     */
    class RenderTargetTexture extends TextureInfo {
    }
}
declare namespace feng3d {
    /**
     * 材质
     * @author feng 2016-05-02
     */
    class Material extends RenderDataHolder {
        protected _pointSize: number;
        protected _enableBlend: boolean;
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
         * 是否渲染双面
         */
        bothSides: boolean;
        /**
         * 是否开启混合
         * <混合后的颜色> = <源颜色>*sfactor + <目标颜色>*dfactor
         */
        enableBlend: boolean;
        /**
         * 点绘制时点的尺寸
         */
        pointSize: number;
        /**
         * 混合方程，默认BlendEquation.FUNC_ADD
         */
        blendEquation: number;
        /**
         * 源混合因子，默认BlendFactor.SRC_ALPHA
         */
        sfactor: number;
        /**
         * 目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA
         */
        dfactor: number;
        private _methods;
        methods: RenderDataHolder[];
        /**
         * 构建材质
         */
        constructor();
        /**
         * 添加方法
         */
        addMethod(method: RenderDataHolder): void;
        /**
         * 删除方法
         */
        removeMethod(method: RenderDataHolder): void;
    }
}
declare namespace feng3d {
    /**
     * 颜色材质
     * @author feng 2017-01-11
     */
    class PointMaterial extends Material {
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
    interface UniformRenderData {
        u_segmentColor: Lazy<Color>;
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
        readonly color: Color;
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
        texture: Texture2D;
        private _texture;
        constructor();
    }
}
declare namespace feng3d {
    /**
     * 天空盒材质
     * @author feng 2016-12-20
     */
    class SkyBoxMaterial extends Material {
        texture: TextureCube;
        private _texture;
        constructor(images?: string[]);
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
        private _diffuseMethod;
        /**
         * 法线函数
         */
        normalMethod: NormalMethod;
        private _normalMethod;
        /**
         * 镜面反射函数
         */
        specularMethod: SpecularMethod;
        private _specularMethod;
        /**
         * 环境反射函数
         */
        ambientMethod: AmbientMethod;
        private _ambientMethod;
        /**
         * 是否开启混合
         */
        enableBlend: boolean;
        /**
         * 构建
         */
        constructor(diffuseUrl?: string, normalUrl?: string, specularUrl?: string, ambientUrl?: string);
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
    }
}
declare namespace feng3d {
    class FogMethod extends RenderDataHolder {
        /**
         * 出现雾效果的最近距离
         */
        minDistance: number;
        private _minDistance;
        /**
         * 最远距离
         */
        maxDistance: number;
        private _maxDistance;
        /**
         * 雾的颜色
         */
        fogColor: Color;
        private _fogColor;
        density: number;
        private _density;
        /**
         * 雾模式
         */
        mode: FogMode;
        private _mode;
        /**
         * @param fogColor      雾颜色
         * @param minDistance   雾近距离
         * @param maxDistance   雾远距离
         * @param density       雾浓度
         */
        constructor(fogColor?: Color, minDistance?: number, maxDistance?: number, density?: number, mode?: FogMode);
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
        private _cubeTexture;
        private _reflectivity;
        /**
         * 创建EnvMapMethod实例
         * @param envMap		        环境映射贴图
         * @param reflectivity			反射率
         */
        constructor(envMap: TextureCube, reflectivity?: number);
        /**
         * 环境映射贴图
         */
        envMap: TextureCube;
        /**
         * 反射率
         */
        reflectivity: number;
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
        static readonly lights: Light[];
        private static _lights;
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
        constructor(gameObject: GameObject);
    }
}
declare namespace feng3d {
    /**
     * 方向光源
     * @author feng 2016-12-13
     */
    class DirectionalLight extends Light {
        static readonly directionalLights: DirectionalLight[];
        private static _directionalLights;
        private _direction;
        private _sceneDirection;
        /**
         * 构建
         */
        constructor(gameObject: GameObject);
        readonly sceneDirection: Vector3D;
        /**
         * 光照方向
         */
        direction: Vector3D;
        /**
         * 处理被添加组件事件
         */
        protected onBeAddedComponent(event: EventVO<any>): void;
        /**
         * 处理被移除组件事件
         */
        protected onBeRemovedComponent(event: EventVO<any>): void;
        protected onScenetransformChanged(): void;
    }
}
declare namespace feng3d {
    /**
     * 点光源
     * @author feng 2016-12-13
     */
    class PointLight extends Light {
        static readonly pointLights: PointLight[];
        private static _pointLights;
        /**
         * 光照范围
         */
        range: number;
        /**
         * 灯光位置
         */
        readonly position: Vector3D;
        /**
         * 构建
         */
        constructor(gameObject: GameObject);
    }
}
declare namespace feng3d {
    class ControllerBase {
        /**
         * 控制对象
         */
        protected _targetObject: GameObject;
        /**
         * 控制器基类，用于动态调整3D对象的属性
         */
        constructor(targetObject: GameObject);
        /**
         * 手动应用更新到目标3D对象
         */
        update(interpolate?: boolean): void;
        targetObject: GameObject;
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
        private ischange;
        private _auto;
        auto: boolean;
        constructor(gameobject: GameObject);
        onMousedown(): void;
        onMouseup(): void;
        /**
         * 初始化
         */
        init(): void;
        /**
         * 销毁
         */
        dispose(): void;
        /**
         * 手动应用更新到目标3D对象
         */
        update(): void;
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
    class PickingCollisionVO {
        /**
         * 第一个穿过的物体
         */
        firstEntity: GameObject;
        /**
         * 碰撞的uv坐标
         */
        uv: Point;
        /**
         * 实体上碰撞本地坐标
         */
        localPosition: Vector3D;
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
        index: number;
        /**
         * 碰撞关联的渲染对象
         */
        renderable: Geometry;
        /**
         * 创建射线拾取碰撞数据
         * @param entity
         */
        constructor(entity: GameObject);
        /**
         * 实体上碰撞世界坐标
         */
        readonly scenePosition: Vector3D;
    }
}
declare namespace feng3d {
    /**
     * 使用纯计算与实体相交
     */
    class AS3PickingCollider {
        protected ray3D: Ray3D;
        /** 是否查找最短距离碰撞 */
        private _findClosestCollision;
        /**
         * 创建一个AS碰撞检测器
         * @param findClosestCollision 是否查找最短距离碰撞
         */
        constructor(findClosestCollision?: boolean);
        testSubMeshCollision(geometry: Geometry, pickingCollisionVO: PickingCollisionVO, shortestCollisionDistance?: number, bothSides?: boolean): boolean;
        /**
         * 获取碰撞法线
         * @param indexData 顶点索引数据
         * @param vertexData 顶点数据
         * @param triangleIndex 三角形索引
         * @param normal 碰撞法线
         * @return 碰撞法线
         *
         */
        protected getCollisionNormal(indexData: number[], vertexData: number[], triangleIndex?: number, normal?: Vector3D): Vector3D;
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
        protected getCollisionUV(indexData: Uint16Array, uvData: Float32Array, triangleIndex: number, v: number, w: number, u: number, uvOffset: number, uvStride: number, uv?: Point): Point;
        /**
         * 设置碰撞射线
         */
        setLocalRay(ray3D: Ray3D): void;
    }
}
declare namespace feng3d {
    /**
     * 射线投射拾取器
     * @author feng 2014-4-29
     */
    class RaycastPicker {
        /** 是否需要寻找最接近的 */
        private _findClosestCollision;
        protected _entities: GameObject[];
        private static pickingCollider;
        /**
         *
         * @param findClosestCollision 是否需要寻找最接近的
         */
        constructor(findClosestCollision: boolean);
        /**
         * 获取射线穿过的实体
         * @param ray3D 射线
         * @param entitys 实体列表
         * @return
         */
        getViewCollision(ray3D: Ray3D, entitys: GameObject[]): PickingCollisionVO;
        /**
         *获取射线穿过的实体
         */
        private getPickingCollisionVO();
        /**
         * 按与射线原点距离排序
         */
        private sortOnNearT(entity1, entity2);
        /**
         * 更新碰撞本地坐标
         * @param pickingCollisionVO
         */
        private updateLocalPosition(pickingCollisionVO);
    }
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
        constructor(blendUrl?: string, splatUrls?: string[], splatRepeats?: Vector3D);
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
     * 动画状态基类
     * @author feng 2015-9-18
     */
    class AnimationStateBase {
        protected _animationNode: AnimationNodeBase;
        protected _rootDelta: Vector3D;
        protected _positionDeltaDirty: boolean;
        protected _time: number;
        protected _startTime: number;
        protected _animator: AnimatorBase;
        /**
         * @inheritDoc
         */
        readonly positionDelta: Vector3D;
        /**
         * 创建动画状态基类
         * @param animator				动画
         * @param animationNode			动画节点
         */
        constructor(animator: AnimatorBase, animationNode: AnimationNodeBase);
        /**
         * @inheritDoc
         */
        offset(startTime: number): void;
        /**
         * @inheritDoc
         */
        update(time: number): void;
        /**
         * @inheritDoc
         */
        phase(value: number): void;
        /**
         * 更新时间
         * @param time		当前时间
         */
        protected updateTime(time: number): void;
        /**
         * 位置偏移
         */
        protected updatePositionDelta(): void;
    }
}
declare namespace feng3d {
    /**
     * 动画剪辑状态
     * @author feng 2015-9-18
     */
    class AnimationClipState extends AnimationStateBase {
        private _animationClipNode;
        protected _blendWeight: number;
        protected _currentFrame: number;
        protected _nextFrame: number;
        protected _oldFrame: number;
        protected _timeDir: number;
        protected _framesDirty: boolean;
        /**
         * 混合权重	(0[当前帧],1[下一帧])
         * @see #currentFrame
         * @see #nextFrame
         */
        readonly blendWeight: number;
        /**
         * 当前帧
         */
        readonly currentFrame: number;
        /**
         * 下一帧
         */
        readonly nextFrame: number;
        /**
         * 创建一个帧动画状态
         * @param animator				动画
         * @param animationClipNode		帧动画节点
         */
        constructor(animator: AnimatorBase, animationClipNode: AnimationClipNodeBase);
        /**
         * @inheritDoc
         */
        update(time: number): void;
        /**
         * @inheritDoc
         */
        phase(value: number): void;
        /**
         * @inheritDoc
         */
        protected updateTime(time: number): void;
        /**
         * 更新帧，计算当前帧、下一帧与混合权重
         *
         * @see #currentFrame
         * @see #nextFrame
         * @see #blendWeight
         */
        protected updateFrames(): void;
        /**
         * 通知播放完成
         */
        private notifyPlaybackComplete();
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
    interface ParticleGlobal {
        /**
         * 加速度
         */
        acceleration: Vector3D | (() => Vector3D);
        /**
         * 公告牌矩阵
         */
        billboardMatrix: Matrix3D | (() => Matrix3D);
    }
}
declare namespace feng3d {
    /**
     * 粒子动画组件
     * @author feng 2017-01-09
     */
    class ParticleComponent extends RenderDataHolder {
        /**
         * 优先级
         */
        priority: number;
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
        private _camera;
        private _matrix;
        /** 广告牌轴线 */
        private _billboardAxis;
        /**
         * 创建一个广告牌节点
         * @param billboardAxis
         */
        constructor(camera: Camera, billboardAxis?: Vector3D);
        setRenderState(particleAnimator: ParticleAnimator): void;
        /**
         * 广告牌轴线
         */
        billboardAxis: Vector3D;
    }
}
declare namespace feng3d {
    class ParticleAnimationSet extends RenderDataHolder {
        /**
         * 属性数据列表
         */
        private _attributes;
        private _animations;
        /**
         * 生成粒子函数列表，优先级越高先执行
         */
        generateFunctions: ({
            generate: (particle: Particle) => void;
            priority: number;
        })[];
        private particleGlobal;
        /**
         * 粒子数量
         */
        numParticles: number;
        private _isDirty;
        constructor();
        /**
         * 粒子全局属性，作用于所有粒子元素
         */
        setGlobal<K extends keyof ParticleGlobal>(property: K, value: ParticleGlobal[K]): void;
        addAnimation(animation: ParticleComponent): void;
        update(particleAnimator: ParticleAnimator): void;
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
     * 粒子动画
     * @author feng 2017-01-09
     */
    class ParticleAnimator extends Component {
        /**
         * 是否正在播放
         */
        isPlaying: boolean;
        /**
         * 粒子时间
         */
        time: number;
        /**
         * 起始时间
         */
        startTime: number;
        /**
         * 播放速度
         */
        playbackSpeed: number;
        /**
         * 周期
         */
        cycle: number;
        animatorSet: ParticleAnimationSet;
        private _animatorSet;
        readonly single: boolean;
        constructor(gameObject: GameObject);
        play(): void;
        private update();
        /**
         * 收集渲染数据拥有者
         * @param renderAtomic 渲染原子
         */
        collectRenderDataHolder(renderAtomic?: Object3DRenderAtomic): void;
    }
}
declare namespace feng3d {
    /**
     * Dispatched to notify changes in an animation state's state.
     */
    class AnimationStateEvent {
        animator: AnimatorBase;
        animationState: AnimationStateBase;
        animationNode: AnimationNodeBase;
        /**
         * Create a new <code>AnimatonStateEvent</code>
         *
         * @param type The event type.
         * @param animator The animation state object that is the subject of this event.
         * @param animationNode The animation node inside the animation state from which the event originated.
         */
        constructor(animator: AnimatorBase, animationState: AnimationStateBase, animationNode: AnimationNodeBase);
    }
}
declare namespace feng3d {
}
declare namespace feng3d {
    /**
     * 动画节点基类
     * @author feng 2014-5-20
     */
    class AnimationNodeBase extends Event {
        protected _stateClass: any;
        /**
         * 状态类
         */
        readonly stateClass: any;
    }
}
declare namespace feng3d {
    interface AnimatorBaseEventMap extends ComponentEventMap {
        /** 开始播放动画 */
        start: any;
        /** 继续播放动画 */
        play: any;
        /** 停止播放动画 */
        stop: any;
    }
    interface AnimatorBase {
        once<K extends keyof AnimatorBaseEventMap>(type: K, listener: (event: AnimatorBaseEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof AnimatorBaseEventMap>(type: K, data?: AnimatorBaseEventMap[K], bubbles?: boolean): any;
        has<K extends keyof AnimatorBaseEventMap>(type: K): boolean;
        on<K extends keyof AnimatorBaseEventMap>(type: K, listener: (event: AnimatorBaseEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof AnimatorBaseEventMap>(type?: K, listener?: (event: AnimatorBaseEventMap[K]) => any, thisObject?: any): any;
    }
    /**
     * 动画基类
     * @author feng 2014-5-27
     */
    abstract class AnimatorBase extends Component {
        /** 是否正在播放动画 */
        private _isPlaying;
        private _autoUpdate;
        private _time;
        /** 播放速度 */
        private _playbackSpeed;
        protected _activeNode: AnimationNodeBase;
        protected _activeState: AnimationStateBase;
        /** 当前动画时间 */
        protected _absoluteTime: number;
        private _animationStates;
        /**
         * 是否更新位置
         */
        updatePosition: boolean;
        /**
         * 创建一个动画基类
         */
        constructor(gameObject: GameObject);
        /**
         * 获取动画状态
         * @param node		动画节点
         * @return			动画状态
         */
        getAnimationState(node: AnimationNodeBase): AnimationStateBase;
        /**
         * 动画时间
         */
        time: number;
        /**
         * 播放速度
         * <p>默认为1，表示正常速度</p>
         */
        playbackSpeed: number;
        /**
         * 开始动画，当自动更新为true时有效
         */
        start(): void;
        /**
         * 暂停播放动画
         * @see #time
         * @see #update()
         */
        stop(): void;
        /**
         * 更新动画
         * @param time			动画时间
         */
        update(time: number): void;
        /**
         * 更新偏移时间
         * @private
         */
        protected updateDeltaTime(dt: number): void;
        /**
         * 自动更新动画时帧更新事件
         */
        private onEnterFrame(event?);
        /**
         * 应用位置偏移量
         */
        private applyPositionDelta();
    }
}
declare namespace feng3d {
    /**
     * 动画播放器
     * @author feng 2017-01-04
     */
    class AnimationPlayer {
        private _time;
        private preTime;
        private _isPlaying;
        /**
         * 播放速度
         */
        playbackSpeed: number;
        /**
         * 动画时间
         */
        time: number;
        /**
         * 开始
         */
        start(): void;
        /**
         * 停止
         */
        stop(): void;
        /**
         * 继续
         */
        continue(): void;
        /**
         * 暂停
         */
        pause(): void;
        /**
         * 自动更新动画时帧更新事件
         */
        private onEnterFrame(event);
    }
}
declare namespace feng3d {
    /**
     * 帧动画播放器
     * @author feng 2017-01-04
     */
    class AnimationClipPlayer extends AnimationPlayer {
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
        /** 位移 */
        translation: Vector3D;
        /** 旋转 */
        orientation: Quaternion;
        private _matrix3D;
        private _invertMatrix3D;
        readonly matrix3D: Matrix3D;
        readonly invertMatrix3D: Matrix3D;
        readonly inverseBindPose: Float32Array;
        invalid(): void;
    }
}
declare namespace feng3d {
    /**
     * 骨骼数据
     * @author feng 2014-5-20
     */
    class Skeleton {
        /** 骨骼关节数据列表 */
        joints: SkeletonJoint[];
        constructor();
        readonly numJoints: number;
    }
}
declare namespace feng3d {
    /**
     * 关节pose
     * @author feng 2014-5-20
     */
    class JointPose {
        /** Joint 名字 */
        name: string;
        /** 父节点序号 */
        parentIndex: number;
        /** 旋转信息 */
        orientation: Quaternion;
        /** 位移信息 */
        translation: Vector3D;
        private _matrix3D;
        private _invertMatrix3D;
        matrix3D: Matrix3D;
        readonly invertMatrix3D: Matrix3D;
        invalid(): void;
    }
}
declare namespace feng3d {
    /**
     * 骨骼pose
     * @author feng 2014-5-20
     */
    class SkeletonPose {
        /** 关节pose列表 */
        jointPoses: JointPose[];
        private _globalMatrix3Ds;
        readonly numJointPoses: number;
        constructor();
        readonly globalMatrix3Ds: Matrix3D[];
        invalid(): void;
    }
}
declare namespace feng3d {
    interface AnimationStateEventMap {
        /**
         * Dispatched when a non-looping clip node inside an animation state reaches the end of its timeline.
         */
        playbackComplete: AnimationStateEvent;
        transitionComplete: AnimationStateEvent;
    }
    interface AnimationClipNodeBase {
        once<K extends keyof AnimationStateEventMap>(type: K, listener: (event: AnimationStateEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof AnimationStateEventMap>(type: K, data?: AnimationStateEventMap[K], bubbles?: boolean): any;
        has<K extends keyof AnimationStateEventMap>(type: K): boolean;
        on<K extends keyof AnimationStateEventMap>(type: K, listener: (event: AnimationStateEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof AnimationStateEventMap>(type?: K, listener?: (event: AnimationStateEventMap[K]) => any, thisObject?: any): any;
    }
    /**
     * 动画剪辑节点基类(用于控制动画播放，包含每帧持续时间，是否循环播放等)
     * @author feng 2014-5-20
     */
    class AnimationClipNodeBase extends AnimationNodeBase {
        protected _looping: boolean;
        protected _totalDuration: number;
        protected _lastFrame: number;
        protected _stitchDirty: boolean;
        protected _stitchFinalFrame: boolean;
        protected _numFrames: number;
        protected _durations: number[];
        protected _totalDelta: Vector3D;
        /** 是否稳定帧率 */
        fixedFrameRate: boolean;
        /**
         * 持续时间列表（ms）
         */
        readonly durations: number[];
        /**
         * 总坐标偏移量
         */
        readonly totalDelta: Vector3D;
        /**
         * 是否循环播放
         */
        looping: boolean;
        /**
         * 是否过渡结束帧
         */
        stitchFinalFrame: boolean;
        /**
         * 总持续时间
         */
        readonly totalDuration: number;
        /**
         * 最后帧数
         */
        readonly lastFrame: number;
        /**
         * 更新动画播放控制状态
         */
        protected updateStitch(): void;
    }
}
declare namespace feng3d {
    /**
     * 骨骼动画节点（一般用于一个动画的帧列表）
     * 包含基于时间的动画数据作为单独的骨架构成。
     * @author feng 2014-5-20
     */
    class SkeletonClipNode extends AnimationClipNodeBase {
        name: string;
        private _frames;
        /**
         * 创建骨骼动画节点
         */
        constructor();
        /**
         * 骨骼姿势动画帧列表
         */
        readonly frames: SkeletonPose[];
        /**
         * 添加帧到动画
         * @param skeletonPose 骨骼姿势
         * @param duration 持续时间
         */
        addFrame(skeletonPose: SkeletonPose, duration: number): void;
        /**
         * @inheritDoc
         */
        protected updateStitch(): void;
    }
}
declare namespace feng3d {
    /**
     * 骨骼剪辑状态
     * @author feng 2015-9-18
     */
    class SkeletonClipState extends AnimationClipState {
        private _rootPos;
        private _frames;
        private _skeletonClipNode;
        private _skeletonPose;
        private _skeletonPoseDirty;
        private _currentPose;
        private _nextPose;
        /**
         * 当前骨骼姿势
         */
        readonly currentPose: SkeletonPose;
        /**
         * 下个姿势
         */
        readonly nextPose: SkeletonPose;
        /**
         * 创建骨骼剪辑状态实例
         * @param animator				动画
         * @param skeletonClipNode		骨骼剪辑节点
         */
        constructor(animator: AnimatorBase, skeletonClipNode: SkeletonClipNode);
        /**
         * @inheritDoc
         */
        getSkeletonPose(): SkeletonPose;
        /**
         * @inheritDoc
         */
        protected updateTime(time: number): void;
        /**
         * @inheritDoc
         */
        protected updateFrames(): void;
        /**
         * 更新骨骼姿势
         * @param skeleton 骨骼
         */
        private updateSkeletonPose();
        /**
         * @inheritDoc
         */
        protected updatePositionDelta(): void;
    }
}
declare namespace feng3d {
    class SkeletonAnimationSet {
    }
}
declare namespace feng3d {
    /**
     * 骨骼动画
     * @author feng 2014-5-27
     */
    class SkeletonAnimator extends AnimatorBase {
        /** 动画节点列表 */
        animations: AnimationNodeBase[];
        /**
         * 骨骼
         */
        skeleton: Skeleton;
        private _skeleton;
        private _globalMatrices;
        private _globalPropertiesDirty;
        private _activeSkeletonState;
        /**
         * 当前骨骼姿势的全局矩阵
         * @see #globalPose
         */
        readonly globalMatrices: Matrix3D[];
        /**
         * 创建一个骨骼动画类
         */
        constructor(gameObject: GameObject);
        /**
         * 播放动画
         * @param name 动作名称
         */
        play(): void;
        /**
         * @inheritDoc
         */
        protected updateDeltaTime(dt: number): void;
        /**
         * 更新骨骼全局变换矩阵
         */
        private updateGlobalProperties();
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
        /** 子对象 */
        subObjs: OBJ_SubOBJ[];
    };
    /**
     * Obj模型数据
     */
    type OBJ_OBJData = {
        /** mtl文件路径 */
        mtl: string;
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
declare namespace feng3d {
    /**
     * Obj模型加载类
     * @author feng 2017-01-18
     */
    var ObjLoader: {
        load: (url: string, material: Material, completed?: (object3D: GameObject) => void) => void;
    };
}
declare namespace feng3d {
    /**
     * MD5模型加载类
     * @author feng 2017-01-18
     */
    var MD5Loader: {
        load: (url: string, completed?: (object3D: GameObject, skeletonAnimator: SkeletonAnimator) => void) => void;
        loadAnim: (url: string, completed?: (object3D: SkeletonClipNode) => void) => void;
    };
}
declare namespace feng3d {
    /**
     * 坐标系，三叉戟
     * @author feng 2017-02-06
     */
    class Trident extends Component {
        constructor(gameObject: GameObject);
        private buildTrident(length);
    }
}
declare namespace feng3d {
    var GameObjectFactory: {
        create: (name?: string) => GameObject;
        createCube: (name?: string) => GameObject;
        createPlane: (name?: string) => GameObject;
        createCylinder: (name?: string) => GameObject;
        createSphere: (name?: string) => GameObject;
        createCapsule: (name?: string) => GameObject;
    };
}
declare namespace feng3d {
    var GameObjectUtil: {
        addScript: (gameObject: GameObject, scriptPath: string) => void;
        removeScript: (gameObject: GameObject, script: string | Script) => void;
        reloadJS: (scriptPath: any) => void;
        loadJs: (scriptPath: any, onload?: (resultScript: {
            className: string;
            script: HTMLScriptElement;
        }) => void) => void;
    };
}
declare namespace feng3d {
    /**
     * 鼠标事件管理
     * @author feng 2014-4-29
     */
    class Mouse3DManager {
        mouseX: number;
        mouseY: number;
        /**
         * 鼠标拾取渲染器
         */
        private mouseRenderer;
        private selectedObject3D;
        private mouseEventTypes;
        /**
         * 鼠标按下时的对象，用于与鼠标弹起时对象做对比，如果相同触发click
         */
        private preMouseDownObject3D;
        /**
         * 统计处理click次数，判断是否达到dblclick
         */
        private Object3DClickNum;
        /** 射线采集器(采集射线穿过场景中物体的列表) */
        private _mousePicker;
        private _catchMouseMove;
        /**
         * 是否捕捉鼠标移动，默认false。
         */
        catchMouseMove: boolean;
        constructor();
        /**
         * 监听鼠标事件收集事件类型
         */
        private onMouseEvent(event);
        /**
         * 渲染
         */
        draw(renderContext: RenderContext, viewRect: Rectangle): void;
        private pick(renderContext);
        private glPick(renderContext, viewRect);
        private getMouseCheckObjects(renderContext);
        /**
         * 设置选中对象
         */
        private setSelectedObject3D(value);
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
}
declare namespace feng3d.war3 {
    /**
     * war3关节pose
     * @author warden_feng 2014-6-28
     */
    class JointPoseWar3 extends JointPose {
        transformation: Matrix3D;
        constructor();
    }
}
declare namespace feng3d.war3 {
    /**
     *
     * @author warden_feng 2014-6-28
     */
    class SkeletonPoseWar3 extends SkeletonPose {
        constructor();
    }
}
declare namespace feng3d.war3 {
    /**
     *
     * @author warden_feng 2014-6-28
     */
    class SkeletonClipNodeWar3 extends SkeletonClipNode {
        constructor();
        protected updateStitch(): void;
    }
}
declare namespace feng3d.war3 {
    /**
     * 骨骼动画
     * @author warden_feng 2014-5-27
     */
    class SkeletonAnimatorWar3 extends SkeletonAnimator {
        /**
         * 创建一个骨骼动画类
         * @param animationSet 动画集合
         * @param skeleton 骨骼
         * @param forceCPU 是否强行使用cpu
         */
        constructor(gameObject: GameObject);
        /**
         * 本地转换到全局姿势
         * @param sourcePose 原姿势
         * @param targetPose 目标姿势
         * @param skeleton 骨骼
         */
        protected localToGlobalPose(sourcePose: SkeletonPose, targetPose: SkeletonPose, skeleton: Skeleton): void;
    }
}
declare namespace feng3d.war3 {
    /**
     * 透明度动画
     * @author warden_feng 2014-6-26
     */
    class AnimAlpha {
        constructor();
    }
}
declare namespace feng3d.war3 {
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
}
declare namespace feng3d.war3 {
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
}
declare namespace feng3d.war3 {
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
    }
}
declare namespace feng3d.war3 {
    /**
     * 骨骼的角度信息
     */
    class BoneRotation {
        /** 类型 */
        type: string;
        /** */
        GlobalSeqId: number;
        rotations: Rotation[];
        rotationDic: {};
        getRotation(keyFrameTime: number): Quaternion;
    }
}
declare namespace feng3d.war3 {
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
        translationDic: {};
        getTranslation(keyFrameTime: number): Vector3D;
    }
}
declare namespace feng3d.war3 {
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
}
declare namespace feng3d.war3 {
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
}
declare namespace feng3d.war3 {
    /**
     * 几何体动画
     * @author warden_feng 2014-6-26
     */
    class GeosetAnim {
        constructor();
    }
}
declare namespace feng3d.war3 {
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
}
declare namespace feng3d.war3 {
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
}
declare namespace feng3d.war3 {
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
}
declare namespace feng3d.war3 {
    /**
     * 材质
     * @author warden_feng 2014-6-26
     */
    class Material {
        /** 材质层列表 */
        layers: Layer[];
    }
}
declare namespace feng3d.war3 {
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
}
declare namespace feng3d.war3 {
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
}
declare namespace feng3d.war3 {
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
}
declare namespace feng3d {
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
        constructor();
        private meshs;
        private container;
        getMesh(): GameObject;
        /**
         * 获取某时间的网格信息
         * @param time
         * @return
         */
        updateAnim(m_animTime: number): GameObject[];
        private getFBitmap(material);
        private BuildAnimatedMesh(m_animTime, geoset);
        private UpdateAllNodeMatrix(m_animTime);
        private BuildMatrix(bone, m_animTime);
    }
}
declare namespace feng3d.war3 {
    /**
     * war3的mdl文件解析
     * @author warden_feng 2014-6-14
     */
    class MdlParser {
        /** 字符串数据 */
        private _textData;
        private static VERSION_TOKEN;
        private static COMMENT_TOKEN;
        private static MODEL;
        private static SEQUENCES;
        private static GLOBALSEQUENCES;
        private static TEXTURES;
        private static MATERIALS;
        private static GEOSET;
        private static GEOSETANIM;
        private static BONE;
        private static HELPER;
        /** 当前解析位置 */
        private _parseIndex;
        /** 是否文件尾 */
        private _reachedEOF;
        /** 当前解析行号 */
        private _line;
        /** 当前行的字符位置 */
        private _charLineIndex;
        constructor();
        proceedParsing(_textData: string, onParseComplete?: (war3Model: War3Model) => void): void;
        /**
         * 获取骨骼深度
         * @param bone
         * @param bones
         * @return
         */
        private getBoneDepth(bone, bones);
        /**
         * 解析版本号
         */
        private parseVersion();
        /**
         * 解析模型数据统计结果
         */
        private parseModel();
        /**
         * 解析动作序列
         */
        private parseSequences();
        /**
         * 解析全局序列
         */
        private parseGlobalsequences();
        /**
         * 解析纹理列表
         */
        private parseTextures();
        /**
         * 解析材质
         */
        private parseMaterials();
        private parseGeoset();
        /**
         * 解析骨骼动画
         */
        private parseBone();
        /**
         * 解析骨骼动画
         */
        private parseHelper();
        /**
         * 解析骨骼角度
         */
        private parseBoneScaling(boneScaling);
        /**
         * 解析骨骼角度
         */
        private parseBoneTranslation(boneTranslation);
        /**
         * 解析骨骼角度
         */
        private parseBoneRotation(boneRotation);
        /**
         * 解析多边形动画
         */
        private parseGeosetanim();
        /**
         * 解析顶点
         */
        private parseVertices();
        /**
         * 解析法线
         */
        private parseNormals();
        /**
         * 解析纹理坐标
         */
        private parseTVertices();
        /**
         * 解析顶点分组
         */
        private parseVertexGroup();
        /**
         * 解析面
         */
        private parseFaces();
        /**
         * 解顶点分组
         */
        private parseGroups();
        /**
         * 解析纹理
         */
        private parseBitmap();
        /**
         * 解析材质
         */
        private parseMaterial();
        /**
         * 解析材质层
         */
        private parseLayer();
        /**
         * 解析动作信息
         */
        private parseAnim();
        /**
         * 解析几何体动作信息
         */
        private parseAnim1();
        /**
         * 解析骨骼轴心坐标
         */
        private parsePivotPoints();
        /**
         * 解析3d向量
         */
        private parseVector3D();
        /**
         * 解析四元素
         */
        private parseVector3D4();
        /**
         * 解析2d坐标
         */
        private parsePoint();
        /**
         * 解析间隔
         */
        private parseInterval();
        /**
         * 解析带双引号的字符串
         */
        private parseLiteralString();
        /**
         * 读取下个Number
         */
        private getNextNumber();
        /**
         * 读取下个字符
         */
        private getNextChar();
        /**
         * 读取下个int
         */
        private getNextInt();
        /**
         * 获取下个关键字
         */
        private getNextToken();
        /**
         * 跳过块
         * @return 跳过的内容
         */
        private jumpChunk();
        /**
         * 返回到上个字符位置
         */
        private putBack();
        /**
         * 跳过空白
         */
        private skipWhiteSpace();
        /**
         * 忽略该行
         */
        private ignoreLine();
        private check(key);
        /**
         * 抛出一个文件尾过早结束文件时遇到错误
         */
        private sendEOFError();
        /**
         * 遇到了一个意想不到的令牌时将抛出一个错误。
         * @param expected 发生错误的标记
         */
        private sendParseError(expected);
        /**
         * 发生未知关键字错误
         */
        private sendUnknownKeywordError(keyword);
    }
}
declare namespace feng3d.war3 {
    /**
     *
     * @author warden_feng 2014-6-28
     */
    class War3Utils {
        /**
         * 本函数用下面的公式计算变换矩阵：Mout = (Msc)-1 * (Msr)-1 * Ms * Msr * Msc * (Mrc)-1 * Mr * Mrc * Mt
         * 参考地址：http://blog.csdn.net/caimouse/article/details/132051;http://msdn.microsoft.com/en-us/library/windows/desktop/bb205365(v=vs.85).aspx
         * @param pScalingCenter	指向D3DXVECTOR3 结构的缩放中心点向量。如果为NULL，Msc 矩阵就是单位矩阵。
         * @param pScalingRotation	指向D3DXQUATERNION 结构的缩放和旋转的四元组。如果参数为NULL，Msr 矩阵就是单位矩阵。
         * @param pScaling			指向D3DXVECTOR3 结构的缩放向量。如果参数为NULL，Ms 矩阵就是单位矩阵。
         * @param pRotationCenter	指向D3DXVECTOR3 结构的旋转中心向量。如果参数为NULL，Mrc 矩阵是单位矩阵。
         * @param pRotation			指向D3DXQUATERNION 结构的旋转的四元组。如果参数为NULL，Mr 矩阵就是单位矩阵。
         * @param pTranslation		指向D3DXVECTOR3 结构的平移向量。如果参数是NULL，Mt 矩阵就是单位矩阵。
         * @return 指向D3DXMATRIX 结构的操作结果矩阵。
         */
        static D3DXMatrixTransformation(pScalingCenter: Vector3D, pScalingRotation: Quaternion, pScaling: Vector3D, pRotationCenter: Vector3D, pRotation: Quaternion, pTranslation: Vector3D): Matrix3D;
    }
}
declare namespace feng3d.war3 {
    /**
     * 骨骼的位移信息
     */
    class BoneScaling {
        /** 类型 */
        type: String;
        /**  */
        GlobalSeqId: number;
        scalings: Scaling[];
        scalingDic: {};
        getScaling(keyFrameTime: number): Vector3D;
    }
}
declare module feng3d {
    class ClassUtilsTest {
        constructor();
        init(): void;
        testGetQualifiedClassName(): void;
        testGetQualifiedSuperclassName(): void;
    }
    class SuperClassTest {
    }
    class ChildClassTest extends SuperClassTest {
    }
}
declare namespace feng3d {
    class EulerTest {
        constructor();
        test(): void;
    }
}
declare namespace feng3d {
    class ArrayListTest {
        constructor();
        /**
         * 此集合中的项目数。
         */
        testLength(): void;
        /**
         * 向列表末尾添加指定项目。
         */
        testAddItem(): void;
        /**
         * 在指定的索引处添加项目。
         */
        testAddItemAt(): void;
        /**
         * 获取指定索引处的项目。
         */
        testGetItemAt(): void;
        /**
         * 如果项目位于列表中（这样的话 getItemAt(index) == item），则返回该项目的索引。
         */
        testGetItemIndex(): void;
        /**
         * 删除列表中的所有项目。
         */
        testRemoveAll(): void;
        /**
         * 删除指定项目。
         */
        testRemoveItem(): void;
        /**
         * 删除指定索引处的项目并返回该项目。
         */
        testRemoveItemAt(): void;
        /**
         * 在指定的索引处放置项目。
         */
        testSetItemAt(): void;
        /**
         * 返回与 IList 实现的填充顺序相同的 Array。
         */
        testToArray(): void;
        /**
         * 添加项事件
         * @param type						事件的类型。
         * @param listener					处理事件的侦听器函数。
         * @param thisObject                listener函数作用域
         * @param priority					事件侦听器的优先级。数字越大，优先级越高。默认优先级为 0。
         */
        testAddItemEventListener(): void;
        /**
         * 移除项事件
         * @param type						事件的类型。
         * @param listener					要删除的侦听器对象。
         * @param thisObject                listener函数作用域
         */
        testRemoveItemEventListener(): void;
    }
}
declare namespace feng3d {
    class ObjectBase {
        id: number;
    }
    class C extends ObjectBase {
        a: number;
        c: number;
        change(): void;
    }
    class SerializationTest {
        constructor();
    }
}
declare namespace feng3d {
    class UnitTest {
        constructor();
        test(): void;
        testClass<T extends (new (...param) => {})>(cls: T | T[]): void;
    }
}
