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
