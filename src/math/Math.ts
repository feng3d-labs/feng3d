namespace feng3d
{
    export var FMath = {
        /**
         * 角度转弧度因子
         */
        DEG2RAD: Math.PI / 180,
        /**
         * 弧度转角度因子
         */
        RAD2DEG: 180 / Math.PI,
        /**
         * 默认精度
         */
        PRECISION: 0.000001,
        /**
         * 获取唯一标识符
         * @see http://www.broofa.com/Tools/Math.uuid.htm
         */
        uuid: function ()
        {
            var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
            var id = new Array(36);
            var rnd = 0, r;
            return function generateUUID()
            {
                for (var i = 0; i < 36; i++)
                {
                    if (i === 8 || i === 13 || i === 18 || i === 23)
                    {
                        id[i] = '-';
                    } else if (i === 14)
                    {
                        id[i] = '4';
                    } else
                    {
                        if (rnd <= 0x02) rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
                        r = rnd & 0xf;
                        rnd = rnd >> 4;
                        id[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
                    }
                }
                return id.join('');
            };
        }(),
        /**
         * 计算指定值与区间[edge0,edge1]最近的值 
         * @param value 指定值
         * @param edge0 区间边界0
         * @param edge1 区间边界1
         */
        clamp(value: number, edge0: number, edge1: number)
        {
            if ((value - edge0) * (value - edge1) <= 0) return value;
            if (value < edge0) return edge0 < edge1 ? edge0 : edge1;
            return edge0 > edge1 ? edge0 : edge1;
        },
        /**
         * compute euclidian modulo of m % n
         * https://en.wikipedia.org/wiki/Modulo_operation
         */
        euclideanModulo: function (n, m)
        {
            return ((n % m) + m) % m;
        },

        /**
         * Linear mapping from range <a1, a2> to range <b1, b2>
         */
        mapLinear: function (x, a1, a2, b1, b2)
        {
            return b1 + (x - a1) * (b2 - b1) / (a2 - a1);
        },

        /**
         * https://en.wikipedia.org/wiki/Linear_interpolation
         */
        /**
         * 线性插值
         * @param start 起始值
         * @param end 终止值
         * @param t 插值系数
         */
        lerp(start: number, end: number, t: number)
        {
            return (1 - t) * start + t * end;
        },

        /**
         * http://en.wikipedia.org/wiki/Smoothstep
         */
        smoothstep: function (x, min, max)
        {
            if (x <= min) return 0;
            if (x >= max) return 1;

            x = (x - min) / (max - min);

            return x * x * (3 - 2 * x);
        },

        smootherstep: function (x, min, max)
        {
            if (x <= min) return 0;
            if (x >= max) return 1;

            x = (x - min) / (max - min);

            return x * x * x * (x * (x * 6 - 15) + 10);
        },
        /**
         * 从<low, high>获取随机整数
         * @param low 区间起始值
         * @param high 区间终止值
         */
        randInt(low: number, high: number)
        {
            return low + Math.floor(Math.random() * (high - low + 1));
        },
        /**
         * 从<low, high>获取随机浮点数
         * @param low 区间起始值
         * @param high 区间终止值
         */
        randFloat(low: number, high: number)
        {
            return low + Math.random() * (high - low);
        },
        /**
         * 从<-range/2, range/2>获取随机浮点数
         * @param range 范围
         */
        randFloatSpread(range: number)
        {
            return range * (0.5 - Math.random());
        },
        /**
         * 角度转换为弧度
         * @param degrees 角度
         */
        degToRad(degrees: number)
        {
            return degrees * this.DEG2RAD;
        },
        /**
         * 弧度转换为角度
         * @param radians 弧度
         */
        radToDeg(radians: number)
        {
            return radians * this.RAD2DEG;
        },
        /**
         * 判断指定整数是否为2的幂
         * @param value 整数
         */
        isPowerOfTwo(value: number)
        {
            return (value & (value - 1)) === 0 && value !== 0;
        },
        /**
         * 获取离指定整数最近的2的幂
         * @param value 整数
         */
        nearestPowerOfTwo(value: number)
        {
            return Math.pow(2, Math.round(Math.log(value) / Math.LN2));
        },
        /**
         * 获取指定大于等于整数最小2的幂，3->4,5->8,17->32,33->64
         * @param value 整数
         */
        nextPowerOfTwo(value: number)
        {
            value--;
            value |= value >> 1;
            value |= value >> 2;
            value |= value >> 4;
            value |= value >> 8;
            value |= value >> 16;
            value++;
            return value;
        },
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
        toRound(source: number, target: number, precision = 360) 
        {
            return source + Math.round((target - source) / precision) * precision;
        },
        /**
         * 比较两个Number是否相等
         * @param a 数字a
         * @param b 数字b
         * @param precision 进度
         */
        equals(a: number, b: number, precision?: number)
        {
            if (precision == undefined)
                precision = this.PRECISION;
            return Math.abs(a - b) < precision;
        },
        /**
         * 计算最大公约数
         * @param a 整数a
         * @param b 整数b
         * @see https://en.wikipedia.org/wiki/Greatest_common_divisor
         */
        gcd(a: number, b: number)
        {
            if (b) while ((a %= b) && (b %= a));
            return a + b;
        },
    };
}