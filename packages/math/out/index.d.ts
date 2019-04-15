declare module '@feng3d/math' {
    export = feng3d;
}
/// <reference types="@feng3d/polyfill" />
declare namespace feng3d {
    var FMath: {
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
    };
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
    /**
     * 颜色（包含透明度）
     */
    class Color4 {
        __class__: "feng3d.Color4";
        static WHITE: Color4;
        static BLACK: Color4;
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
        clone(): Color4;
    }
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
         * 乘以向量
         * @param a 向量
         */
        multiply(a: Vector2): this;
        /**
         * 乘以向量
         * @param a 向量
         * @param vout 输出向量
         */
        multiplyTo(a: Vector2, vout?: Vector2): Vector2;
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
         * 返回包含 x 和 y 坐标值的数组
         */
        toArray(): number[];
    }
}
declare namespace feng3d {
    /**
     * Vector3 类使用笛卡尔坐标 x、y 和 z 表示三维空间中的点或位置

     */
    class Vector3 {
        __class__: "feng3d.Vector3";
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
         * @param size 尺寸
         */
        static random(size?: number): Vector3;
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
         * 通过将最前面的三个元素（x、y、z）除以矢量的长度可将 Vector3 对象转换为单位矢量。
         */
        normalize(thickness?: number): this;
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
     * Orientation3D 类是用于表示 Matrix4x4 对象的方向样式的常量值枚举。方向的三个类型分别为欧拉角、轴角和四元数。Matrix4x4 对象的 decompose 和 recompose 方法采用其中的某一个枚举类型来标识矩阵的旋转组件。

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
        QUATERNION = "quaternion"
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
         * 中心点
         */
        readonly center: Vector2;
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
     *  ---                                   ---
     *  |   scaleX      0         0       0     |   x轴
     *  |     0       scaleY      0       0     |   y轴
     *  |     0         0       scaleZ    0     |   z轴
     *  |     tx        ty        tz      tw    |   平移
     *  ---                                   ---
     *
     *  ---                                   ---
     *  |     0         1         2        3    |   x轴
     *  |     4         5         6        7    |   y轴
     *  |     8         9         10       11   |   z轴
     *  |     12        13        14       15   |   平移
     *  ---                                   ---
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
         * 从顶点数据初始化三角形
         * @param positions 顶点数据
         */
        static fromPositions(positions: number[]): Triangle3D;
        /**
         * 随机三角形
         * @param size 尺寸
         */
        static random(size?: number): Triangle3D;
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
         * 从顶点数据初始化三角形
         * @param positions 顶点数据
         */
        fromPositions(positions: number[]): this;
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
         * @param p 点
         * @param precision 精度，如果距离小于精度则判定为在三角形上
         */
        onWithPoint(p: Vector3, precision?: number): boolean;
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
        intersection(box: Box): this;
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
        classifyPoint(p: Vector3): 0 | 1 | -1;
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
        classifySegment(segment: Segment3D): 0 | 2 | 1 | -1;
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
         * 颜色常量
         */
        Color = 0,
        /**
         * 颜色渐变
         */
        Gradient = 1,
        /**
         * 从最大最小常量颜色中随机
         */
        RandomBetweenTwoColors = 2,
        /**
         * 从最大最小颜色渐变值中随机
         */
        RandomBetweenTwoGradients = 3,
        /**
         * 从颜色渐变中进行随机
         */
        RandomColor = 4
    }
}
declare namespace feng3d {
    /**
     * 最大最小颜色渐变
     */
    class MinMaxGradient {
        /**
         * 模式
         */
        mode: MinMaxGradientMode;
        /**
         * 常量颜色值
         */
        color: Color4;
        /**
         * 常量颜色值，作用于 MinMaxGradientMode.RandomBetweenTwoColors
         */
        color1: Color4;
        gradient: Gradient;
        gradient1: Gradient;
        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number): Color4;
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
         * @returns {} {ts: 区间结点插值度列表,vs: 区间结点值列表}
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
    class AnimationCurveKeyframe {
        /**
         * 时间轴的位置 [0,1]
         */
        time: number;
        /**
         * 值 [0,1]
         */
        value: number;
        /**
         * 斜率
         */
        tangent: number;
        constructor(v: gPartial<AnimationCurveKeyframe>);
    }
}
declare namespace feng3d {
    /**
     * 动画曲线Wrap模式，处理超出范围情况
     */
    enum AnimationCurveWrapMode {
        /**
         * 循环; 0->1,0->1
         */
        Loop = 0,
        /**
         * 来回循环; 0->1,1->0
         */
        PingPong = 1,
        /**
         * 夹紧; 0>-<1
         */
        Clamp = 2
    }
}
declare namespace feng3d {
    /**
     * 动画曲线
     *
     * 基于时间轴的连续三阶Bézier曲线
     */
    class AnimationCurve {
        /**
         * 最大tan值，超出该值后将会变成分段
         */
        maxtan: number;
        /**
         * 关键帧
         *
         * 注： 该值已对时间排序，否则赋值前请使用 sort((a, b) => a.time - b.time) 进行排序
         */
        keys: AnimationCurveKeyframe[];
        /**
         * Wrap模式
         */
        wrapMode: AnimationCurveWrapMode;
        /**
         * 关键点数量
         */
        readonly numKeys: number;
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
         * @param precision 查找进度
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
         * 常量
         */
        Constant = 0,
        /**
         * 曲线
         */
        Curve = 1,
        /**
         * 两个常量间取随机值
         */
        RandomBetweenTwoConstants = 2,
        /**
         * 两个曲线中取随机值
         */
        RandomBetweenTwoCurves = 3
    }
}
declare namespace feng3d {
    /**
     * 最大最小曲线
     */
    class MinMaxCurve {
        /**
         * 模式
         */
        mode: MinMaxCurveMode;
        /**
         * 常量值
         */
        constant: number;
        /**
         * 常量值，用于 MinMaxCurveMode.RandomBetweenTwoConstants
         */
        constant1: number;
        /**
         * 曲线，用于 MinMaxCurveMode.RandomBetweenTwoCurves
         */
        curve: AnimationCurve;
        /**
         * 曲线1
         */
        curve1: any;
        /**
         * 曲线缩放比
         */
        curveMultiplier: number;
        /**
         * 是否只取 0-1 ，例如 lifetime 为非负，需要设置为true
         */
        between0And1: boolean;
        /**
         * 获取值
         * @param time 时间
         */
        getValue(time: number): number;
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
        getValue(time: number): Vector3;
    }
}
//# sourceMappingURL=index.d.ts.map