namespace feng3d
{

    /**
     * 方程求解
     */
    export var equationSolving: EquationSolving;

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
    export class EquationSolving
    {
        /**
         * 获取数字的(正负)符号
         * @param n 数字
         */
        private getSign(n: number)
        {
            return n > 0 ? "+" : "-";
        }

        /**
         * 比较 a 与 b 是否相等
         * @param a 值a
         * @param b 值b
         * @param precision 比较精度
         */
        private equalNumber(a: number, b: number, precision = 0.0000001)
        {
            return Math.abs(a - b) < precision;
        }

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
        getDerivative(f: (x: number) => number, delta = 0.000000001)
        {
            return (x: number) =>
            {
                var d = (f(x + delta) - f(x)) / delta;
                return d;
            }
        }

        /**
         * 函数是否连续
         * @param f 函数
         */
        isContinuous(f: (x: number) => number)
        {
            return true;
        }

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
        hasSolution(f: (x: number) => number, a: number, b: number, errorcallback?: (err: Error) => void)
        {
            if (!this.isContinuous(f))
            {
                errorcallback && errorcallback(new Error(`函数 ${f} 在 [${a} ,${b}] 区间内不连续，无法为其求解！`));
                return false;
            }
            var fa = f(a);
            var fb = f(b);
            if (fa * fb > 0)
            {
                errorcallback && errorcallback(new Error(`f(a) * f(b) 值为 ${fa * fb}，不满足 f(a) * f(b) <= 0，无法为其求解！`));
                return false;
            }
            return true;
        }

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
        binary(f: (x: number) => number, a: number, b: number, precision = 0.0000001, errorcallback?: (err: Error) => void)
        {
            if (!this.hasSolution(f, a, b, errorcallback)) return undefined;

            var fa = f(a);
            var fb = f(b);
            if (this.equalNumber(fa, 0, precision))
            {
                return a;
            }
            if (this.equalNumber(fb, 0, precision))
            {
                return b;
            }
            do
            {
                var x = (a + b) / 2;
                var fr = f(x);
                if (fa * fr < 0)
                {
                    b = x;
                    fb = fr;
                } else
                {
                    a = x;
                    fa = fr;
                }
            } while (!this.equalNumber(fr, 0, precision));
            return x;
        }

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
        line(f: (x: number) => number, a: number, b: number, precision = 0.0000001, errorcallback?: (err: Error) => void)
        {
            if (!this.hasSolution(f, a, b, errorcallback)) return undefined;

            var fa = f(a);
            var fb = f(b);
            if (this.equalNumber(fa, 0, precision))
            {
                return a;
            }
            if (this.equalNumber(fb, 0, precision))
            {
                return b;
            }
            do
            {
                // 
                var x = a - fa * (b - a) / (fb - fa);
                var fr = f(x);
                if (fa * fr < 0)
                {
                    b = x;
                    fb = fr;
                } else
                {
                    a = x;
                    fa = fr;
                }
            } while (!this.equalNumber(fr, 0, precision));
            return x;
        }

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
        tangent(f: (x: number) => number, f1: (x: number) => number, f2: (x: number) => number, a: number, b: number, precision = 0.0000001, errorcallback?: (err: Error) => void)
        {
            if (!this.hasSolution(f, a, b, errorcallback)) return undefined;

            var fa = f(a);
            var fb = f(b);
            if (this.equalNumber(fa, 0, precision))
            {
                return a;
            }
            if (this.equalNumber(fb, 0, precision))
            {
                return b;
            }

            var f1Sign = fb - fa; // f'(x)在[a, b]上保持的定号
            var f1a = f1(a);
            var f1b = f1(b);

            // f'(x)在[a, b]上保持定号
            if (f1a * f1Sign <= 0)
            {
                errorcallback && errorcallback(new Error(`[${a}, ${b}] 上存在解，由于f'(${a}) = ${f1a} 在[a, b]上没有保持定号 ${this.getSign(f1Sign)} ，无法使用切线法求解`));
                return undefined;
            }
            if (f1b * f1Sign <= 0)
            {
                errorcallback && errorcallback(new Error(`[${a}, ${b}] 上存在解，由于f'(${b}) = ${f1b} 在[a, b]上没有保持定号 ${this.getSign(f1Sign)} ，无法使用切线法求解`));
                return undefined;
            }

            var f2Sign = fb - fa; // f''(x)在[a, b]上保持的定号
            var f2a = f2(a);
            var f2b = f2(b);
            // f''(x)在[a, b]上保持定号
            if (f2a * f2Sign <= 0) 
            {
                errorcallback && errorcallback(new Error(`[${a}, ${b}] 上存在解，由于f''(${a}) = ${f2a} 在[a, b]上没有保持定号 ${this.getSign(f2Sign)} ，无法使用切线法求解`));
                return undefined;
            }
            if (f2b * f2Sign <= 0) 
            {
                errorcallback && errorcallback(new Error(`[${a}, ${b}] 上存在解，由于f''(${b}) = ${f2b} 在[a, b]上没有保持定号 ${this.getSign(f2Sign)} ，无法使用切线法求解`));
                return undefined;
            }

            var x: number;
            if (f1Sign > 0)
            {
                if (f2Sign > 0)
                    x = b;
                else
                    x = a;
            } else
            {
                if (f2Sign > 0)
                    x = a;
                else
                    x = b;
            }

            do
            {
                var fx = f(x);
                var f1x = f1(x);
                var f2x = f2(x);
                // f'(x)在[a, b]上保持定号
                if (f1x * f1Sign <= 0)
                {
                    errorcallback && errorcallback(new Error(`[${a}, ${b}] 上存在解，由于f'(${x}) = ${f1x} 在[a, b]上没有保持定号 ${this.getSign(f1Sign)} ，无法使用切线法求解`));
                    return undefined;
                }
                // f''(x)在[a, b]上保持定号
                if (f2x * f2Sign <= 0) 
                {
                    errorcallback && errorcallback(new Error(`[${a}, ${b}] 上存在解，由于f''(${x}) = ${f2x} 在[a, b]上没有保持定号 ${this.getSign(f2Sign)} ，无法使用切线法求解`));
                    return undefined;
                }
                // 迭代 Xn+1 = Xn - f(Xn) / f'(Xn)
                x = x - fx / f1x;
            } while (!this.equalNumber(fx, 0, precision));
            return x;
        }

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
        secant(f: (x: number) => number, a: number, b: number, precision = 0.0000001, errorcallback?: (err: Error) => void)
        {
            if (!this.hasSolution(f, a, b, errorcallback)) return undefined;

            var fa = f(a);
            var fb = f(b);
            if (this.equalNumber(fa, 0, precision))
            {
                return a;
            }
            if (this.equalNumber(fb, 0, precision))
            {
                return b;
            }

            // 此处创建近似导函数以及二次导函数，其实割线法使用在计算f'(x)困难时的，但是 getDerivative 方法解决了这个困难。。。。
            var f1 = this.getDerivative(f, precision);
            var f2 = this.getDerivative(f1, precision);

            var f1Sign = fb - fa; // f'(x)在[a, b]上保持的定号
            // 
            var f1a = f1(a);
            var f1b = f1(b);

            // f'(x)在[a, b]上保持定号
            if (f1a * f1Sign <= 0)
            {
                errorcallback && errorcallback(new Error(`[${a}, ${b}] 上存在解，由于f'(${a}) = ${f1a} 在[a, b]上没有保持定号 ${this.getSign(f1Sign)} ，无法使用切线法求解`));
                return undefined;
            }
            if (f1b * f1Sign <= 0)
            {
                errorcallback && errorcallback(new Error(`[${a}, ${b}] 上存在解，由于f'(${b}) = ${f1b} 在[a, b]上没有保持定号 ${this.getSign(f1Sign)} ，无法使用切线法求解`));
                return undefined;
            }

            var f2Sign = fb - fa; // f''(x)在[a, b]上保持的定号
            var f2a = f2(a);
            var f2b = f2(b);
            // f''(x)在[a, b]上保持定号
            if (f2a * f2Sign <= 0) 
            {
                errorcallback && errorcallback(new Error(`[${a}, ${b}] 上存在解，由于f''(${a}) = ${f2a} 在[a, b]上没有保持定号 ${this.getSign(f2Sign)} ，无法使用切线法求解`));
                return undefined;
            }
            if (f2b * f2Sign <= 0) 
            {
                errorcallback && errorcallback(new Error(`[${a}, ${b}] 上存在解，由于f''(${b}) = ${f2b} 在[a, b]上没有保持定号 ${this.getSign(f2Sign)} ，无法使用切线法求解`));
                return undefined;
            }

            var x: number;
            if (f1Sign > 0)
            {
                if (f2Sign > 0)
                    x = b;
                else
                    x = a;
            } else
            {
                if (f2Sign > 0)
                    x = a;
                else
                    x = b;
            }

            // Xn-1
            var xn_1 = x;
            var fxn_1 = f(xn_1);
            // Xn
            var xn = xn_1 - precision * f2Sign / Math.abs(f2Sign);
            var fxn = f(xn);
            // 
            if (fxn * fxn_1 < 0)
            {
                return xn;
            }
            // Xn+1
            var xn$1: number;
            do
            {
                var f1xn = f1(xn);
                // f'(x)在[a, b]上保持定号
                if (f1xn * f1Sign <= 0)
                {
                    errorcallback && errorcallback(new Error(`[${a}, ${b}] 上存在解，由于f'(${xn}) = ${f1xn} 在[a, b]上没有保持定号 ${this.getSign(f1Sign)} ，无法使用切线法求解`));
                    return undefined;
                }
                var f2xn = f2(xn);
                // f''(x)在[a, b]上保持定号
                if (f2xn * f2Sign <= 0) 
                {
                    errorcallback && errorcallback(new Error(`[${a}, ${b}] 上存在解，由于f''(${xn}) = ${f2xn} 在[a, b]上没有保持定号 ${this.getSign(f2Sign)} ，无法使用切线法求解`));
                    return undefined;
                }
                // 迭代 Xn+1 = Xn - f(Xn) * (Xn - Xn-1) / (f(Xn) - f(Xn-1));
                xn$1 = xn - fxn * (xn - xn_1) / (fxn - fxn_1);
                //
                xn_1 = xn;
                fxn_1 = fxn;
                xn = xn$1;
                fxn = f(xn);
            } while (!this.equalNumber(fxn, 0, precision));
            return xn;
        }
    }

    equationSolving = new EquationSolving();

}
