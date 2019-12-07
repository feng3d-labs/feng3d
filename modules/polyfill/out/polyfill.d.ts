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
    getPropertyDescriptor(object: Object, property: string): PropertyDescriptor;
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
    assignDeep<T>(target: T, source: feng3d.gPartial<T>, handlers?: AssignDeepHandler | AssignDeepHandler[], deep?: number): T;
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
//# sourceMappingURL=polyfill.d.ts.map