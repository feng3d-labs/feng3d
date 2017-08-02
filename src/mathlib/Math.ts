interface Math
{
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
    generateUUID();
    clamp(value, min, max);
    /**
     * compute euclidian modulo of m % n
     * https://en.wikipedia.org/wiki/Modulo_operation
     */
    euclideanModulo(n, m);
    /**
     * Linear mapping from range <a1, a2> to range <b1, b2>
     */
    mapLinear(x, a1, a2, b1, b2);
    /**
     * https://en.wikipedia.org/wiki/Linear_interpolation
     */
    lerp(x, y, t);
    /**
     * http://en.wikipedia.org/wiki/Smoothstep
     */
    smoothstep(x, min, max);

    smootherstep(x, min, max);
    /**
     * Random integer from <low, high> interval
     */
    randInt(low, high);

    /**
     * Random float from <low, high> interval
     */
    randFloat(low, high);

    /**
     * Random float from <-range/2, range/2> interval
     */
    randFloatSpread(range);

    degToRad(degrees);

    radToDeg(radians);

    isPowerOfTwo(value);

    nearestPowerOfTwo(value);

    nextPowerOfTwo(value);

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
    toRound(source: number, target: number, precision: number);
}
Math.DEG2RAD = Math.PI / 180;
Math.RAD2DEG = 180 / Math.PI;

Math.generateUUID = function ()
{
    // http://www.broofa.com/Tools/Math.uuid.htm
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = new Array(36);
    var rnd = 0, r;
    return function generateUUID()
    {
        for (var i = 0; i < 36; i++)
        {
            if (i === 8 || i === 13 || i === 18 || i === 23)
            {
                uuid[i] = '-';
            } else if (i === 14)
            {
                uuid[i] = '4';
            } else
            {
                if (rnd <= 0x02) rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
                r = rnd & 0xf;
                rnd = rnd >> 4;
                uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
            }
        }
        return uuid.join('');
    };
}();

Math.clamp = function (value, min, max)
{
    return Math.max(min, Math.min(max, value));
};

Math.euclideanModulo = function (n, m)
{
    return ((n % m) + m) % m;
};

Math.mapLinear = function (x, a1, a2, b1, b2)
{
    return b1 + (x - a1) * (b2 - b1) / (a2 - a1);
};

Math.lerp = function (x, y, t)
{
    return (1 - t) * x + t * y;
};

Math.smoothstep = function (x, min, max)
{
    if (x <= min) return 0;
    if (x >= max) return 1;

    x = (x - min) / (max - min);

    return x * x * (3 - 2 * x);
};

Math.smootherstep = function (x, min, max)
{
    if (x <= min) return 0;
    if (x >= max) return 1;

    x = (x - min) / (max - min);

    return x * x * x * (x * (x * 6 - 15) + 10);
};

Math.randInt = function (low, high)
{
    return low + Math.floor(Math.random() * (high - low + 1));
};

Math.randFloat = function (low, high)
{
    return low + Math.random() * (high - low);
};

Math.randFloatSpread = function (range)
{
    return range * (0.5 - Math.random());
};

Math.degToRad = function (degrees)
{
    return degrees * Math.DEG2RAD;
};

Math.radToDeg = function (radians)
{
    return radians * Math.RAD2DEG;
};

Math.isPowerOfTwo = function (value)
{
    return (value & (value - 1)) === 0 && value !== 0;
};

Math.nearestPowerOfTwo = function (value)
{
    return Math.pow(2, Math.round(Math.log(value) / Math.LN2));
};

Math.nextPowerOfTwo = function (value)
{
    value--;
    value |= value >> 1;
    value |= value >> 2;
    value |= value >> 4;
    value |= value >> 8;
    value |= value >> 16;
    value++;
    return value;
}

Math.toRound = function (source: number, target: number, precision = 360) 
{
    return source + Math.round((target - source) / precision) * precision;
}