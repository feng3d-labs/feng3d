export class MathUtil
{
    /**
     * 角度转弧度因子
     */
    DEG2RAD = Math.PI / 180;

    /**
     * 弧度转角度因子
     */
    RAD2DEG = 180 / Math.PI;

    /**
     * 默认精度
     */
    PRECISION = 1e-6;

    /**
     * 获取唯一标识符
     * @see http://www.broofa.com/Tools/Math.uuid.htm
     */
    uuid = (function uuid(length = 36)
    {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
        const id = new Array(length);
        let rnd = 0; let
            r = 0;

        return function generateUUID()
        {
            for (let i = 0; i < length; i++)
            {
                if (i === 8 || i === 13 || i === 18 || i === 23)
                {
                    id[i] = '-';
                }
                else if (i === 14)
                {
                    id[i] = '4';
                }
                else
                {
                    if (rnd <= 0x02) rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
                    r = rnd & 0xf;
                    rnd = rnd >> 4;
                    id[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r];
                }
            }

            return id.join('');
        };
    })();

    /**
     * （夹紧）计算指定值到区间[edge0 ,edge1]最近的值
     *
     * @param value 指定值
     * @param lowerlimit 区间下界
     * @param upperlimit 区间上界
     */
    clamp(value: number, lowerlimit: number, upperlimit: number)
    {
        if ((value - lowerlimit) * (value - upperlimit) <= 0) return value;
        if (value < lowerlimit) return lowerlimit < upperlimit ? lowerlimit : upperlimit;

        return lowerlimit > upperlimit ? lowerlimit : upperlimit;
    }

    /**
     * 计算欧几里得模（整数模） ((n % m) + m) % m
     *
     * @param n 被除数
     * @param m 除数
     * @see https://en.wikipedia.org/wiki/Modulo_operation
     */
    uclideanModulo(n: number, m: number)
    {
        return ((n % m) + m) % m;
    }

    /**
     * 使 x 值从区间 <a1, a2> 线性映射到区间 <b1, b2>
     *
     * @param x 第一个区间中值
     * @param a1 第一个区间起始值
     * @param a2 第一个区间终止值
     * @param b1 第二个区间起始值
     * @param b2 第二个区间起始值
     */
    mapLinear(x: number, a1: number, a2: number, b1: number, b2: number)
    {
        return b1 + (x - a1) * (b2 - b1) / (a2 - a1);
    }

    /**
     * 线性插值
     *
     * @param start 起始值
     * @param end 终止值
     * @param t 插值系数 [0 ,1]
     *
     * @see https://en.wikipedia.org/wiki/Linear_interpolation
     */
    lerp(start: number, end: number, t: number)
    {
        return (1 - t) * start + t * end;
    }

    /**
     * 计算平滑值 3x^2 - 2x^3
     *
     * @param x
     * @param min 最小值
     * @param max 最大值
     *
     * @see http://en.wikipedia.org/wiki/Smoothstep
     */
    smoothstep(x: number, min: number, max: number)
    {
        if (x <= min) return 0;
        if (x >= max) return 1;

        x = (x - min) / (max - min);

        return x * x * (3 - 2 * x);
    }

    /**
     * 计算平滑值 6x^5 - 15x^4 + 10x^3
     *
     * @param x
     * @param min 最小值
     * @param max 最大值
     */
    smootherstep(x: number, min: number, max: number)
    {
        if (x <= min) return 0;
        if (x >= max) return 1;

        x = (x - min) / (max - min);

        return x * x * x * (x * (x * 6 - 15) + 10);
    }

    /**
     * 从<low, high>获取随机整数
     *
     * @param low 区间起始值
     * @param high 区间终止值
     */
    randInt(low: number, high: number)
    {
        return low + Math.floor(Math.random() * (high - low + 1));
    }

    /**
     * 从<low, high>获取随机浮点数
     *
     * @param low 区间起始值
     * @param high 区间终止值
     */
    randFloat(low: number, high: number)
    {
        return low + Math.random() * (high - low);
    }

    /**
     * 从<-range/2, range/2>获取随机浮点数
     *
     * @param range 范围
     */
    randFloatSpread(range: number)
    {
        return range * (0.5 - Math.random());
    }

    /**
     * 角度转换为弧度
     *
     * @param degrees 角度
     */
    degToRad(degrees: number)
    {
        return degrees * this.DEG2RAD;
    }

    /**
     * 弧度转换为角度
     *
     * @param radians 弧度
     */
    radToDeg(radians: number)
    {
        return radians * this.RAD2DEG;
    }

    /**
     * 判断指定整数是否为2的幂
     *
     * @param value 整数
     */
    isPowerOfTwo(value: number)
    {
        return (value & (value - 1)) === 0 && value !== 0;
    }

    /**
     * 获取离指定整数最近的2的幂
     *
     * @param value 整数
     */
    nearestPowerOfTwo(value: number)
    {
        return Math.pow(2, Math.round(Math.log(value) / Math.LN2));
    }

    /**
     * 获取指定大于等于整数最小2的幂，3->4,5->8,17->32,33->64
     *
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
    }

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
    }

    /**
     * 比较两个Number是否相等
     *
     * @param a 数字a
     * @param b 数字b
     * @param precision 进度
     */
    equals(a: number, b: number, precision?: number)
    {
        if (precision === undefined)
        { precision = this.PRECISION; }

        return Math.abs(a - b) < precision;
    }

    /**
     * 计算最大公约数
     *
     * @param a 整数a
     * @param b 整数b
     *
     * @see https://en.wikipedia.org/wiki/Greatest_common_divisor
     */
    gcd(a: number, b: number)
    {
        // eslint-disable-next-line no-empty
        if (b) while ((a %= b) && (b %= a)) { }

        return a + b;
    }

    /**
     * 计算最小公倍数
     * Least common multiple
     *
     * @param a 整数a
     * @param b 整数b
     *
     * @see https://en.wikipedia.org/wiki/Least_common_multiple
     */
    lcm(a: number, b: number)
    {
        return a * b / this.gcd(a, b);
    }
}

export const mathUtil = new MathUtil();
