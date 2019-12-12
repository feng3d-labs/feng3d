var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var feng3d;
(function (feng3d) {
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
    var EquationSolving = /** @class */ (function () {
        function EquationSolving() {
        }
        /**
         * 获取数字的(正负)符号
         * @param n 数字
         */
        EquationSolving.prototype.getSign = function (n) {
            return n > 0 ? "+" : "-";
        };
        /**
         * 比较 a 与 b 是否相等
         * @param a 值a
         * @param b 值b
         * @param precision 比较精度
         */
        EquationSolving.prototype.equalNumber = function (a, b, precision) {
            if (precision === void 0) { precision = 0.0000001; }
            return Math.abs(a - b) < precision;
        };
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
        EquationSolving.prototype.getDerivative = function (f, delta) {
            if (delta === void 0) { delta = 0.000000001; }
            return function (x) {
                var d = (f(x + delta) - f(x)) / delta;
                return d;
            };
        };
        /**
         * 函数是否连续
         * @param f 函数
         */
        EquationSolving.prototype.isContinuous = function (f) {
            return true;
        };
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
        EquationSolving.prototype.hasSolution = function (f, a, b, errorcallback) {
            if (!this.isContinuous(f)) {
                errorcallback && errorcallback(new Error("\u51FD\u6570 " + f + " \u5728 [" + a + " ," + b + "] \u533A\u95F4\u5185\u4E0D\u8FDE\u7EED\uFF0C\u65E0\u6CD5\u4E3A\u5176\u6C42\u89E3\uFF01"));
                return false;
            }
            var fa = f(a);
            var fb = f(b);
            if (fa * fb > 0) {
                errorcallback && errorcallback(new Error("f(a) * f(b) \u503C\u4E3A " + fa * fb + "\uFF0C\u4E0D\u6EE1\u8DB3 f(a) * f(b) <= 0\uFF0C\u65E0\u6CD5\u4E3A\u5176\u6C42\u89E3\uFF01"));
                return false;
            }
            return true;
        };
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
        EquationSolving.prototype.binary = function (f, a, b, precision, errorcallback) {
            if (precision === void 0) { precision = 0.0000001; }
            if (!this.hasSolution(f, a, b, errorcallback))
                return undefined;
            var fa = f(a);
            var fb = f(b);
            if (this.equalNumber(fa, 0, precision)) {
                return a;
            }
            if (this.equalNumber(fb, 0, precision)) {
                return b;
            }
            do {
                var x = (a + b) / 2;
                var fr = f(x);
                if (fa * fr < 0) {
                    b = x;
                    fb = fr;
                }
                else {
                    a = x;
                    fa = fr;
                }
            } while (!this.equalNumber(fr, 0, precision));
            return x;
        };
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
        EquationSolving.prototype.line = function (f, a, b, precision, errorcallback) {
            if (precision === void 0) { precision = 0.0000001; }
            if (!this.hasSolution(f, a, b, errorcallback))
                return undefined;
            var fa = f(a);
            var fb = f(b);
            if (this.equalNumber(fa, 0, precision)) {
                return a;
            }
            if (this.equalNumber(fb, 0, precision)) {
                return b;
            }
            do {
                // 
                var x = a - fa * (b - a) / (fb - fa);
                var fr = f(x);
                if (fa * fr < 0) {
                    b = x;
                    fb = fr;
                }
                else {
                    a = x;
                    fa = fr;
                }
            } while (!this.equalNumber(fr, 0, precision));
            return x;
        };
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
        EquationSolving.prototype.tangent = function (f, f1, f2, a, b, precision, errorcallback) {
            if (precision === void 0) { precision = 0.0000001; }
            if (!this.hasSolution(f, a, b, errorcallback))
                return undefined;
            var fa = f(a);
            var fb = f(b);
            if (this.equalNumber(fa, 0, precision)) {
                return a;
            }
            if (this.equalNumber(fb, 0, precision)) {
                return b;
            }
            var f1Sign = fb - fa; // f'(x)在[a, b]上保持的定号
            var f1a = f1(a);
            var f1b = f1(b);
            // f'(x)在[a, b]上保持定号
            if (f1a * f1Sign <= 0) {
                errorcallback && errorcallback(new Error("[" + a + ", " + b + "] \u4E0A\u5B58\u5728\u89E3\uFF0C\u7531\u4E8Ef'(" + a + ") = " + f1a + " \u5728[a, b]\u4E0A\u6CA1\u6709\u4FDD\u6301\u5B9A\u53F7 " + this.getSign(f1Sign) + " \uFF0C\u65E0\u6CD5\u4F7F\u7528\u5207\u7EBF\u6CD5\u6C42\u89E3"));
                return undefined;
            }
            if (f1b * f1Sign <= 0) {
                errorcallback && errorcallback(new Error("[" + a + ", " + b + "] \u4E0A\u5B58\u5728\u89E3\uFF0C\u7531\u4E8Ef'(" + b + ") = " + f1b + " \u5728[a, b]\u4E0A\u6CA1\u6709\u4FDD\u6301\u5B9A\u53F7 " + this.getSign(f1Sign) + " \uFF0C\u65E0\u6CD5\u4F7F\u7528\u5207\u7EBF\u6CD5\u6C42\u89E3"));
                return undefined;
            }
            var f2Sign = fb - fa; // f''(x)在[a, b]上保持的定号
            var f2a = f2(a);
            var f2b = f2(b);
            // f''(x)在[a, b]上保持定号
            if (f2a * f2Sign <= 0) {
                errorcallback && errorcallback(new Error("[" + a + ", " + b + "] \u4E0A\u5B58\u5728\u89E3\uFF0C\u7531\u4E8Ef''(" + a + ") = " + f2a + " \u5728[a, b]\u4E0A\u6CA1\u6709\u4FDD\u6301\u5B9A\u53F7 " + this.getSign(f2Sign) + " \uFF0C\u65E0\u6CD5\u4F7F\u7528\u5207\u7EBF\u6CD5\u6C42\u89E3"));
                return undefined;
            }
            if (f2b * f2Sign <= 0) {
                errorcallback && errorcallback(new Error("[" + a + ", " + b + "] \u4E0A\u5B58\u5728\u89E3\uFF0C\u7531\u4E8Ef''(" + b + ") = " + f2b + " \u5728[a, b]\u4E0A\u6CA1\u6709\u4FDD\u6301\u5B9A\u53F7 " + this.getSign(f2Sign) + " \uFF0C\u65E0\u6CD5\u4F7F\u7528\u5207\u7EBF\u6CD5\u6C42\u89E3"));
                return undefined;
            }
            var x;
            if (f1Sign > 0) {
                if (f2Sign > 0)
                    x = b;
                else
                    x = a;
            }
            else {
                if (f2Sign > 0)
                    x = a;
                else
                    x = b;
            }
            do {
                var fx = f(x);
                var f1x = f1(x);
                var f2x = f2(x);
                // f'(x)在[a, b]上保持定号
                if (f1x * f1Sign <= 0) {
                    errorcallback && errorcallback(new Error("[" + a + ", " + b + "] \u4E0A\u5B58\u5728\u89E3\uFF0C\u7531\u4E8Ef'(" + x + ") = " + f1x + " \u5728[a, b]\u4E0A\u6CA1\u6709\u4FDD\u6301\u5B9A\u53F7 " + this.getSign(f1Sign) + " \uFF0C\u65E0\u6CD5\u4F7F\u7528\u5207\u7EBF\u6CD5\u6C42\u89E3"));
                    return undefined;
                }
                // f''(x)在[a, b]上保持定号
                if (f2x * f2Sign <= 0) {
                    errorcallback && errorcallback(new Error("[" + a + ", " + b + "] \u4E0A\u5B58\u5728\u89E3\uFF0C\u7531\u4E8Ef''(" + x + ") = " + f2x + " \u5728[a, b]\u4E0A\u6CA1\u6709\u4FDD\u6301\u5B9A\u53F7 " + this.getSign(f2Sign) + " \uFF0C\u65E0\u6CD5\u4F7F\u7528\u5207\u7EBF\u6CD5\u6C42\u89E3"));
                    return undefined;
                }
                // 迭代 Xn+1 = Xn - f(Xn) / f'(Xn)
                x = x - fx / f1x;
            } while (!this.equalNumber(fx, 0, precision));
            return x;
        };
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
        EquationSolving.prototype.secant = function (f, a, b, precision, errorcallback) {
            if (precision === void 0) { precision = 0.0000001; }
            if (!this.hasSolution(f, a, b, errorcallback))
                return undefined;
            var fa = f(a);
            var fb = f(b);
            if (this.equalNumber(fa, 0, precision)) {
                return a;
            }
            if (this.equalNumber(fb, 0, precision)) {
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
            if (f1a * f1Sign <= 0) {
                errorcallback && errorcallback(new Error("[" + a + ", " + b + "] \u4E0A\u5B58\u5728\u89E3\uFF0C\u7531\u4E8Ef'(" + a + ") = " + f1a + " \u5728[a, b]\u4E0A\u6CA1\u6709\u4FDD\u6301\u5B9A\u53F7 " + this.getSign(f1Sign) + " \uFF0C\u65E0\u6CD5\u4F7F\u7528\u5207\u7EBF\u6CD5\u6C42\u89E3"));
                return undefined;
            }
            if (f1b * f1Sign <= 0) {
                errorcallback && errorcallback(new Error("[" + a + ", " + b + "] \u4E0A\u5B58\u5728\u89E3\uFF0C\u7531\u4E8Ef'(" + b + ") = " + f1b + " \u5728[a, b]\u4E0A\u6CA1\u6709\u4FDD\u6301\u5B9A\u53F7 " + this.getSign(f1Sign) + " \uFF0C\u65E0\u6CD5\u4F7F\u7528\u5207\u7EBF\u6CD5\u6C42\u89E3"));
                return undefined;
            }
            var f2Sign = fb - fa; // f''(x)在[a, b]上保持的定号
            var f2a = f2(a);
            var f2b = f2(b);
            // f''(x)在[a, b]上保持定号
            if (f2a * f2Sign <= 0) {
                errorcallback && errorcallback(new Error("[" + a + ", " + b + "] \u4E0A\u5B58\u5728\u89E3\uFF0C\u7531\u4E8Ef''(" + a + ") = " + f2a + " \u5728[a, b]\u4E0A\u6CA1\u6709\u4FDD\u6301\u5B9A\u53F7 " + this.getSign(f2Sign) + " \uFF0C\u65E0\u6CD5\u4F7F\u7528\u5207\u7EBF\u6CD5\u6C42\u89E3"));
                return undefined;
            }
            if (f2b * f2Sign <= 0) {
                errorcallback && errorcallback(new Error("[" + a + ", " + b + "] \u4E0A\u5B58\u5728\u89E3\uFF0C\u7531\u4E8Ef''(" + b + ") = " + f2b + " \u5728[a, b]\u4E0A\u6CA1\u6709\u4FDD\u6301\u5B9A\u53F7 " + this.getSign(f2Sign) + " \uFF0C\u65E0\u6CD5\u4F7F\u7528\u5207\u7EBF\u6CD5\u6C42\u89E3"));
                return undefined;
            }
            var x;
            if (f1Sign > 0) {
                if (f2Sign > 0)
                    x = b;
                else
                    x = a;
            }
            else {
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
            if (fxn * fxn_1 < 0) {
                return xn;
            }
            // Xn+1
            var xn$1;
            do {
                var f1xn = f1(xn);
                // f'(x)在[a, b]上保持定号
                if (f1xn * f1Sign <= 0) {
                    errorcallback && errorcallback(new Error("[" + a + ", " + b + "] \u4E0A\u5B58\u5728\u89E3\uFF0C\u7531\u4E8Ef'(" + xn + ") = " + f1xn + " \u5728[a, b]\u4E0A\u6CA1\u6709\u4FDD\u6301\u5B9A\u53F7 " + this.getSign(f1Sign) + " \uFF0C\u65E0\u6CD5\u4F7F\u7528\u5207\u7EBF\u6CD5\u6C42\u89E3"));
                    return undefined;
                }
                var f2xn = f2(xn);
                // f''(x)在[a, b]上保持定号
                if (f2xn * f2Sign <= 0) {
                    errorcallback && errorcallback(new Error("[" + a + ", " + b + "] \u4E0A\u5B58\u5728\u89E3\uFF0C\u7531\u4E8Ef''(" + xn + ") = " + f2xn + " \u5728[a, b]\u4E0A\u6CA1\u6709\u4FDD\u6301\u5B9A\u53F7 " + this.getSign(f2Sign) + " \uFF0C\u65E0\u6CD5\u4F7F\u7528\u5207\u7EBF\u6CD5\u6C42\u89E3"));
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
        };
        return EquationSolving;
    }());
    feng3d.EquationSolving = EquationSolving;
    feng3d.equationSolving = new EquationSolving();
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
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
    var HighFunction = /** @class */ (function () {
        /**
         * 构建函数
         * @param as 函数系数 a0-an 数组
         */
        function HighFunction(as) {
            this.as = as;
        }
        /**
         * 获取函数 f(x) 的值
         * @param x x坐标
         */
        HighFunction.prototype.getValue = function (x) {
            var v = 0;
            var as = this.as;
            for (var i = 0, n = as.length; i < n; i++) {
                v = v * x + as[i];
            }
            return v;
        };
        return HighFunction;
    }());
    feng3d.HighFunction = HighFunction;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 坐标系统类型
     */
    var CoordinateSystem;
    (function (CoordinateSystem) {
        /**
         * 默认坐标系统，左手坐标系统
         */
        CoordinateSystem[CoordinateSystem["LEFT_HANDED"] = 0] = "LEFT_HANDED";
        /**
         * 右手坐标系统
         */
        CoordinateSystem[CoordinateSystem["RIGHT_HANDED"] = 1] = "RIGHT_HANDED";
    })(CoordinateSystem = feng3d.CoordinateSystem || (feng3d.CoordinateSystem = {}));
    /**
     * 引擎中使用的坐标系统，默认左手坐标系统。
     *
     * three.js 右手坐标系统。
     * playcanvas 右手坐标系统。
     * unity    左手坐标系统。
     */
    feng3d.coordinateSystem = CoordinateSystem.LEFT_HANDED;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 用于表示欧拉角的旋转顺序
     *
     * 如果顺序为XYZ，则依次按 ZYZ 轴旋转。为什么循序与定义相反？因为three.js中都这么定义，他们为什么这么定义就不清楚了。
     */
    var RotationOrder;
    (function (RotationOrder) {
        /**
         * 依次按 ZYX 轴旋转。
         *
         * three.js默认旋转顺序。
         */
        RotationOrder[RotationOrder["XYZ"] = 0] = "XYZ";
        /**
         * 依次按 YXZ 轴旋转。
         */
        RotationOrder[RotationOrder["ZXY"] = 1] = "ZXY";
        /**
         * 依次按 XYZ 轴旋转。
         *
         * playcanvas默认旋转顺序。
         */
        RotationOrder[RotationOrder["ZYX"] = 2] = "ZYX";
        /**
         * 依次按 ZXY 轴旋转。
         *
         * unity默认旋转顺序。
         */
        RotationOrder[RotationOrder["YXZ"] = 3] = "YXZ";
        /**
         * 依次按 XZY 轴旋转。
         */
        RotationOrder[RotationOrder["YZX"] = 4] = "YZX";
        /**
         * 依次按 YZX 轴旋转。
         */
        RotationOrder[RotationOrder["XZY"] = 5] = "XZY";
    })(RotationOrder = feng3d.RotationOrder || (feng3d.RotationOrder = {}));
    /**
     * 引擎中使用的旋转顺序。
     *
     * unity YXZ
     * playcanvas ZYX
     * three.js XYZ
     */
    feng3d.defaultRotationOrder = RotationOrder.YXZ;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 颜色
     */
    var Color3 = /** @class */ (function () {
        /**
         * 构建颜色
         * @param r     红[0,1]
         * @param g     绿[0,1]
         * @param b     蓝[0,1]
         */
        function Color3(r, g, b) {
            if (r === void 0) { r = 1; }
            if (g === void 0) { g = 1; }
            if (b === void 0) { b = 1; }
            /**
             * 红[0,1]
             */
            this.r = 1;
            /**
             * 绿[0,1]
             */
            this.g = 1;
            /**
             * 蓝[0,1]
             */
            this.b = 1;
            this.r = r;
            this.g = g;
            this.b = b;
        }
        Color3.fromUnit = function (color) {
            return new Color3().fromUnit(color);
        };
        Color3.fromColor4 = function (color4) {
            return new Color3(color4.r, color4.g, color4.b);
        };
        Color3.prototype.setTo = function (r, g, b) {
            this.r = r;
            this.g = g;
            this.b = b;
            return this;
        };
        /**
         * 通过
         * @param color
         */
        Color3.prototype.fromUnit = function (color) {
            this.r = ((color >> 16) & 0xff) / 0xff;
            this.g = ((color >> 8) & 0xff) / 0xff;
            this.b = (color & 0xff) / 0xff;
            return this;
        };
        Color3.prototype.toInt = function () {
            var value = ((this.r * 0xff) << 16) + ((this.g * 0xff) << 8) + (this.b * 0xff);
            return value;
        };
        /**
         * 输出16进制字符串
         */
        Color3.prototype.toHexString = function () {
            var intR = (this.r * 0xff) | 0;
            var intG = (this.g * 0xff) | 0;
            var intB = (this.b * 0xff) | 0;
            return "#" + Color3.ToHex(intR) + Color3.ToHex(intG) + Color3.ToHex(intB);
        };
        /**
         * 混合颜色
         * @param color 混入的颜色
         * @param rate  混入比例
         */
        Color3.prototype.mix = function (color, rate) {
            this.r = this.r * (1 - rate) + color.r * rate;
            this.g = this.g * (1 - rate) + color.g * rate;
            this.b = this.b * (1 - rate) + color.b * rate;
            return this;
        };
        /**
         * 混合颜色
         * @param color 混入的颜色
         * @param rate  混入比例
         */
        Color3.prototype.mixTo = function (color, rate, vout) {
            if (vout === void 0) { vout = new Color3(); }
            return vout.copy(this).mix(color, rate);
        };
        /**
         * 按标量（大小）缩放当前的 Color3 对象。
         */
        Color3.prototype.scale = function (s) {
            this.r *= s;
            this.g *= s;
            this.b *= s;
            return this;
        };
        /**
         * 按标量（大小）缩放当前的 Color3 对象。
         */
        Color3.prototype.scaleTo = function (s, vout) {
            if (vout === void 0) { vout = new Color3(); }
            return vout.copy(this).scale(s);
        };
        /**
         * 通过将当前 Color3 对象的 r、g 和 b 元素与指定的 Color3 对象的 r、g 和 b 元素进行比较，确定这两个对象是否相等。
         */
        Color3.prototype.equals = function (object, precision) {
            if (precision === void 0) { precision = Math.PRECISION; }
            if (!Math.equals(this.r - object.r, 0, precision))
                return false;
            if (!Math.equals(this.g - object.g, 0, precision))
                return false;
            if (!Math.equals(this.b - object.b, 0, precision))
                return false;
            return true;
        };
        /**
         * 拷贝
         */
        Color3.prototype.copy = function (color) {
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;
            return this;
        };
        Color3.prototype.clone = function () {
            return new Color3(this.r, this.g, this.b);
        };
        Color3.prototype.toVector3 = function (vector3) {
            if (vector3 === void 0) { vector3 = new feng3d.Vector3(); }
            vector3.x = this.r;
            vector3.y = this.g;
            vector3.z = this.b;
            return vector3;
        };
        Color3.prototype.toColor4 = function (color4) {
            if (color4 === void 0) { color4 = new feng3d.Color4(); }
            color4.r = this.r;
            color4.g = this.g;
            color4.b = this.b;
            return color4;
        };
        /**
         * 输出字符串
         */
        Color3.prototype.toString = function () {
            return "{R: " + this.r + " G:" + this.g + " B:" + this.b + "}";
        };
        /**
         * 转换为数组
         * @param array 数组
         * @param offset 偏移
         */
        Color3.prototype.toArray = function (array, offset) {
            if (array === void 0) { array = []; }
            if (offset === void 0) { offset = 0; }
            array[offset] = this.r;
            array[offset + 1] = this.g;
            array[offset + 2] = this.b;
            return array;
        };
        /**
         * [0,15]数值转为16进制字符串
         * param i  [0,15]数值
         */
        Color3.ToHex = function (i) {
            var str = i.toString(16);
            if (i <= 0xf) {
                return ("0" + str).toUpperCase();
            }
            return str.toUpperCase();
        };
        Color3.WHITE = new Color3();
        Color3.BLACK = new Color3(0, 0, 0);
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], Color3.prototype, "r", void 0);
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], Color3.prototype, "g", void 0);
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], Color3.prototype, "b", void 0);
        return Color3;
    }());
    feng3d.Color3 = Color3;
    feng3d.ColorKeywords = {
        'aliceblue': 0xF0F8FF, 'antiquewhite': 0xFAEBD7, 'aqua': 0x00FFFF, 'aquamarine': 0x7FFFD4, 'azure': 0xF0FFFF,
        'beige': 0xF5F5DC, 'bisque': 0xFFE4C4, 'black': 0x000000, 'blanchedalmond': 0xFFEBCD, 'blue': 0x0000FF, 'blueviolet': 0x8A2BE2,
        'brown': 0xA52A2A, 'burlywood': 0xDEB887, 'cadetblue': 0x5F9EA0, 'chartreuse': 0x7FFF00, 'chocolate': 0xD2691E, 'coral': 0xFF7F50,
        'cornflowerblue': 0x6495ED, 'cornsilk': 0xFFF8DC, 'crimson': 0xDC143C, 'cyan': 0x00FFFF, 'darkblue': 0x00008B, 'darkcyan': 0x008B8B,
        'darkgoldenrod': 0xB8860B, 'darkgray': 0xA9A9A9, 'darkgreen': 0x006400, 'darkgrey': 0xA9A9A9, 'darkkhaki': 0xBDB76B, 'darkmagenta': 0x8B008B,
        'darkolivegreen': 0x556B2F, 'darkorange': 0xFF8C00, 'darkorchid': 0x9932CC, 'darkred': 0x8B0000, 'darksalmon': 0xE9967A, 'darkseagreen': 0x8FBC8F,
        'darkslateblue': 0x483D8B, 'darkslategray': 0x2F4F4F, 'darkslategrey': 0x2F4F4F, 'darkturquoise': 0x00CED1, 'darkviolet': 0x9400D3,
        'deeppink': 0xFF1493, 'deepskyblue': 0x00BFFF, 'dimgray': 0x696969, 'dimgrey': 0x696969, 'dodgerblue': 0x1E90FF, 'firebrick': 0xB22222,
        'floralwhite': 0xFFFAF0, 'forestgreen': 0x228B22, 'fuchsia': 0xFF00FF, 'gainsboro': 0xDCDCDC, 'ghostwhite': 0xF8F8FF, 'gold': 0xFFD700,
        'goldenrod': 0xDAA520, 'gray': 0x808080, 'green': 0x008000, 'greenyellow': 0xADFF2F, 'grey': 0x808080, 'honeydew': 0xF0FFF0, 'hotpink': 0xFF69B4,
        'indianred': 0xCD5C5C, 'indigo': 0x4B0082, 'ivory': 0xFFFFF0, 'khaki': 0xF0E68C, 'lavender': 0xE6E6FA, 'lavenderblush': 0xFFF0F5, 'lawngreen': 0x7CFC00,
        'lemonchiffon': 0xFFFACD, 'lightblue': 0xADD8E6, 'lightcoral': 0xF08080, 'lightcyan': 0xE0FFFF, 'lightgoldenrodyellow': 0xFAFAD2, 'lightgray': 0xD3D3D3,
        'lightgreen': 0x90EE90, 'lightgrey': 0xD3D3D3, 'lightpink': 0xFFB6C1, 'lightsalmon': 0xFFA07A, 'lightseagreen': 0x20B2AA, 'lightskyblue': 0x87CEFA,
        'lightslategray': 0x778899, 'lightslategrey': 0x778899, 'lightsteelblue': 0xB0C4DE, 'lightyellow': 0xFFFFE0, 'lime': 0x00FF00, 'limegreen': 0x32CD32,
        'linen': 0xFAF0E6, 'magenta': 0xFF00FF, 'maroon': 0x800000, 'mediumaquamarine': 0x66CDAA, 'mediumblue': 0x0000CD, 'mediumorchid': 0xBA55D3,
        'mediumpurple': 0x9370DB, 'mediumseagreen': 0x3CB371, 'mediumslateblue': 0x7B68EE, 'mediumspringgreen': 0x00FA9A, 'mediumturquoise': 0x48D1CC,
        'mediumvioletred': 0xC71585, 'midnightblue': 0x191970, 'mintcream': 0xF5FFFA, 'mistyrose': 0xFFE4E1, 'moccasin': 0xFFE4B5, 'navajowhite': 0xFFDEAD,
        'navy': 0x000080, 'oldlace': 0xFDF5E6, 'olive': 0x808000, 'olivedrab': 0x6B8E23, 'orange': 0xFFA500, 'orangered': 0xFF4500, 'orchid': 0xDA70D6,
        'palegoldenrod': 0xEEE8AA, 'palegreen': 0x98FB98, 'paleturquoise': 0xAFEEEE, 'palevioletred': 0xDB7093, 'papayawhip': 0xFFEFD5, 'peachpuff': 0xFFDAB9,
        'peru': 0xCD853F, 'pink': 0xFFC0CB, 'plum': 0xDDA0DD, 'powderblue': 0xB0E0E6, 'purple': 0x800080, 'rebeccapurple': 0x663399, 'red': 0xFF0000, 'rosybrown': 0xBC8F8F,
        'royalblue': 0x4169E1, 'saddlebrown': 0x8B4513, 'salmon': 0xFA8072, 'sandybrown': 0xF4A460, 'seagreen': 0x2E8B57, 'seashell': 0xFFF5EE,
        'sienna': 0xA0522D, 'silver': 0xC0C0C0, 'skyblue': 0x87CEEB, 'slateblue': 0x6A5ACD, 'slategray': 0x708090, 'slategrey': 0x708090, 'snow': 0xFFFAFA,
        'springgreen': 0x00FF7F, 'steelblue': 0x4682B4, 'tan': 0xD2B48C, 'teal': 0x008080, 'thistle': 0xD8BFD8, 'tomato': 0xFF6347, 'turquoise': 0x40E0D0,
        'violet': 0xEE82EE, 'wheat': 0xF5DEB3, 'white': 0xFFFFFF, 'whitesmoke': 0xF5F5F5, 'yellow': 0xFFFF00, 'yellowgreen': 0x9ACD32
    };
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 颜色（包含透明度）
     */
    var Color4 = /** @class */ (function () {
        /**
         * 构建颜色
         * @param r     红[0,1]
         * @param g     绿[0,1]
         * @param b     蓝[0,1]
         * @param a     透明度[0,1]
         */
        function Color4(r, g, b, a) {
            if (r === void 0) { r = 1; }
            if (g === void 0) { g = 1; }
            if (b === void 0) { b = 1; }
            if (a === void 0) { a = 1; }
            /**
             * 红[0,1]
             */
            this.r = 1;
            /**
             * 绿[0,1]
             */
            this.g = 1;
            /**
             * 蓝[0,1]
             */
            this.b = 1;
            /**
             * 透明度[0,1]
             */
            this.a = 1;
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }
        Color4.fromUnit = function (color) {
            return new Color4().fromUnit(color);
        };
        Color4.fromUnit24 = function (color, a) {
            if (a === void 0) { a = 1; }
            return Color4.fromColor3(feng3d.Color3.fromUnit(color), a);
        };
        Color4.fromColor3 = function (color3, a) {
            if (a === void 0) { a = 1; }
            return new Color4(color3.r, color3.g, color3.b, a);
        };
        Color4.prototype.setTo = function (r, g, b, a) {
            if (a === void 0) { a = 1; }
            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
            return this;
        };
        /**
         * 通过
         * @param color
         */
        Color4.prototype.fromUnit = function (color) {
            this.a = ((color >> 24) & 0xff) / 0xff;
            this.r = ((color >> 16) & 0xff) / 0xff;
            this.g = ((color >> 8) & 0xff) / 0xff;
            this.b = (color & 0xff) / 0xff;
            return this;
        };
        Color4.prototype.toInt = function () {
            var value = ((this.a * 0xff) << 24) + ((this.r * 0xff) << 16) + ((this.g * 0xff) << 8) + (this.b * 0xff);
            return value;
        };
        /**
         * 输出16进制字符串
         */
        Color4.prototype.toHexString = function () {
            var intR = (this.r * 0xff) | 0;
            var intG = (this.g * 0xff) | 0;
            var intB = (this.b * 0xff) | 0;
            var intA = (this.a * 0xff) | 0;
            return "#" + feng3d.Color3.ToHex(intA) + feng3d.Color3.ToHex(intR) + feng3d.Color3.ToHex(intG) + feng3d.Color3.ToHex(intB);
        };
        /**
         * 混合颜色
         * @param color 混入的颜色
         * @param rate  混入比例
         */
        Color4.prototype.mix = function (color, rate) {
            if (rate === void 0) { rate = 0.5; }
            this.r = this.r * (1 - rate) + color.r * rate;
            this.g = this.g * (1 - rate) + color.g * rate;
            this.b = this.b * (1 - rate) + color.b * rate;
            this.a = this.a * (1 - rate) + color.a * rate;
            return this;
        };
        /**
         * 混合颜色
         * @param color 混入的颜色
         * @param rate  混入比例
         */
        Color4.prototype.mixTo = function (color, rate, vout) {
            if (vout === void 0) { vout = new Color4(); }
            return vout.copy(this).mix(color, rate);
        };
        /**
         * 乘以指定颜色
         * @param c 乘以的颜色
         * @return 返回自身
         */
        Color4.prototype.multiply = function (c) {
            this.r *= c.r;
            this.g *= c.g;
            this.b *= c.b;
            this.a *= c.a;
            return this;
        };
        /**
         * 乘以指定颜色
         * @param v 乘以的颜色
         * @return 返回新颜色
         */
        Color4.prototype.multiplyTo = function (v, vout) {
            if (vout === void 0) { vout = new Color4(); }
            return vout.copy(this).multiply(v);
        };
        /**
         * 乘以指定常量
         *
         * @param scale 缩放常量
         * @return 返回自身
         */
        Color4.prototype.multiplyNumber = function (scale) {
            this.r *= scale;
            this.g *= scale;
            this.b *= scale;
            this.a *= scale;
            return this;
        };
        /**
         * 通过将当前 Color3 对象的 r、g 和 b 元素与指定的 Color3 对象的 r、g 和 b 元素进行比较，确定这两个对象是否相等。
         */
        Color4.prototype.equals = function (object, precision) {
            if (precision === void 0) { precision = Math.PRECISION; }
            if (!Math.equals(this.r - object.r, 0, precision))
                return false;
            if (!Math.equals(this.g - object.g, 0, precision))
                return false;
            if (!Math.equals(this.b - object.b, 0, precision))
                return false;
            if (!Math.equals(this.a - object.a, 0, precision))
                return false;
            return true;
        };
        /**
         * 拷贝
         */
        Color4.prototype.copy = function (color) {
            this.r = color.r;
            this.g = color.g;
            this.b = color.b;
            this.a = color.a;
            return this;
        };
        /**
         * 输出字符串
         */
        Color4.prototype.toString = function () {
            return "{R: " + this.r + " G:" + this.g + " B:" + this.b + " A:" + this.a + "}";
        };
        Color4.prototype.toColor3 = function (color) {
            if (color === void 0) { color = new feng3d.Color3(); }
            color.r = this.r;
            color.g = this.g;
            color.b = this.b;
            return color;
        };
        Color4.prototype.toVector4 = function (vector4) {
            if (vector4 === void 0) { vector4 = new feng3d.Vector4(); }
            vector4.x = this.r;
            vector4.y = this.g;
            vector4.z = this.b;
            vector4.w = this.a;
            return vector4;
        };
        /**
         * 转换为数组
         * @param array 数组
         * @param offset 偏移
         */
        Color4.prototype.toArray = function (array, offset) {
            if (array === void 0) { array = []; }
            if (offset === void 0) { offset = 0; }
            array[offset] = this.r;
            array[offset + 1] = this.g;
            array[offset + 2] = this.b;
            array[offset + 3] = this.a;
            return array;
        };
        /**
         * 克隆
         */
        Color4.prototype.clone = function () {
            return new Color4(this.r, this.g, this.b, this.a);
        };
        Color4.WHITE = new Color4();
        Color4.BLACK = new Color4(0, 0, 0);
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], Color4.prototype, "r", void 0);
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], Color4.prototype, "g", void 0);
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], Color4.prototype, "b", void 0);
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], Color4.prototype, "a", void 0);
        return Color4;
    }());
    feng3d.Color4 = Color4;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var DEG_TO_RAD = Math.PI / 180;
    /**
     * Point 对象表示二维坐标系统中的某个位置，其中 x 表示水平轴，y 表示垂直轴。
     */
    var Vector2 = /** @class */ (function () {
        /**
         * 创建一个 Vector2 对象.若不传入任何参数，将会创建一个位于（0，0）位置的点。
         *
         * @param x 该对象的x属性值，默认为0
         * @param y 该对象的y属性值，默认为0
         */
        function Vector2(x, y) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            this.x = x;
            this.y = y;
        }
        /**
         * 将一对极坐标转换为笛卡尔点坐标。
         * @param len 极坐标对的长度。
         * @param angle 极坐标对的角度（以弧度表示）。
         */
        Vector2.polar = function (len, angle) {
            return new Vector2(len * Math.cos(angle / DEG_TO_RAD), len * Math.sin(angle / DEG_TO_RAD));
        };
        Object.defineProperty(Vector2.prototype, "length", {
            /**
             * 从 (0,0) 到此点的线段长度。
             */
            get: function () {
                return Math.sqrt(this.x * this.x + this.y * this.y);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 将 Point 的成员设置为指定值
         * @param x 该对象的x属性值
         * @param y 该对象的y属性值
         */
        Vector2.prototype.init = function (x, y) {
            this.x = x;
            this.y = y;
            return this;
        };
        /**
         * 克隆点对象
         */
        Vector2.prototype.clone = function () {
            return new Vector2(this.x, this.y);
        };
        /**
         * 确定两个点是否相同。如果两个点具有相同的 x 和 y 值，则它们是相同的点。
         * @param toCompare 要比较的点。
         * @returns 如果该对象与此 Point 对象相同，则为 true 值，如果不相同，则为 false。
         */
        Vector2.prototype.equals = function (toCompare) {
            return this.x == toCompare.x && this.y == toCompare.y;
        };
        /**
         * 返回 pt1 和 pt2 之间的距离。
         * @param p1 第一个点
         * @param p2 第二个点
         * @returns 第一个点和第二个点之间的距离。
         */
        Vector2.distance = function (p1, p2) {
            return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
        };
        /**
         * 将源 Point 对象中的所有点数据复制到调用方 Point 对象中。
         * @param sourcePoint 要从中复制数据的 Point 对象。
         */
        Vector2.prototype.copy = function (sourcePoint) {
            this.x = sourcePoint.x;
            this.y = sourcePoint.y;
            return this;
        };
        /**
         * 将另一个点的坐标添加到此点的坐标以创建一个新点。
         * @param v 要添加的点。
         * @returns 新点。
         */
        Vector2.prototype.addTo = function (v, vout) {
            if (vout === void 0) { vout = new Vector2(); }
            return vout.init(this.x + v.x, this.y + v.y);
        };
        /**
         * 将 (0,0) 和当前点之间的线段缩放为设定的长度。
         * @param thickness 缩放值。例如，如果当前点为 (0,5) 并且您将它规范化为 1，则返回的点位于 (0,1) 处。
         */
        Vector2.prototype.normalize = function (thickness) {
            if (thickness === void 0) { thickness = 1; }
            if (this.x != 0 || this.y != 0) {
                var relativeThickness = thickness / this.length;
                this.x *= relativeThickness;
                this.y *= relativeThickness;
            }
            return this;
        };
        /**
         * 负向量
         */
        Vector2.prototype.negate = function () {
            this.x *= -1;
            this.y *= -1;
            return this;
        };
        /**
         * 倒数向量。
         * (x,y) -> (1/x,1/y)
         */
        Vector2.prototype.reciprocal = function () {
            this.x = 1 / this.x;
            this.y = 1 / this.y;
            return this;
        };
        /**
         * 倒数向量。
         * (x,y) -> (1/x,1/y)
         */
        Vector2.prototype.reciprocalTo = function (out) {
            if (out === void 0) { out = new Vector2(); }
            out.copy(this).reciprocal();
            return out;
        };
        /**
         * 按标量（大小）缩放当前的 Vector3 对象。
         */
        Vector2.prototype.scaleNumber = function (s) {
            this.x *= s;
            this.y *= s;
            return this;
        };
        /**
         * 按标量（大小）缩放当前的 Vector2 对象。
         */
        Vector2.prototype.scaleNumberTo = function (s, vout) {
            if (vout === void 0) { vout = new Vector2(); }
            return vout.copy(this).scaleNumber(s);
        };
        /**
         * 缩放
         * @param s 缩放量
         */
        Vector2.prototype.scale = function (s) {
            this.x *= s.x;
            this.y *= s.y;
            return this;
        };
        /**
         * 缩放
         * @param s 缩放量
         */
        Vector2.prototype.scaleTo = function (s, vout) {
            if (vout === void 0) { vout = new Vector2(); }
            if (s == vout)
                s = s.clone();
            return vout.copy(this).scale(s);
        };
        /**
         * 按指定量偏移 Point 对象。dx 的值将添加到 x 的原始值中以创建新的 x 值。dy 的值将添加到 y 的原始值中以创建新的 y 值。
         * @param dx 水平坐标 x 的偏移量。
         * @param dy 水平坐标 y 的偏移量。
         */
        Vector2.prototype.offset = function (dx, dy) {
            this.x += dx;
            this.y += dy;
            return this;
        };
        /**
         * 从此点的坐标中减去另一个点的坐标以创建一个新点。
         * @param v 要减去的点。
         * @returns 新点。
         */
        Vector2.prototype.sub = function (v) {
            this.x -= v.x;
            this.y -= v.y;
            return this;
        };
        /**
         * 从此点的坐标中减去另一个点的坐标以创建一个新点。
         * @param v 要减去的点。
         * @returns 新点。
         */
        Vector2.prototype.subTo = function (v, vout) {
            if (vout === void 0) { vout = new Vector2(); }
            return vout.init(this.x - v.x, this.y - v.y);
        };
        /**
         * 乘以向量
         * @param a 向量
         */
        Vector2.prototype.multiply = function (a) {
            this.x *= a.x;
            this.y *= a.y;
            return this;
        };
        /**
         * 乘以向量
         * @param a 向量
         * @param vout 输出向量
         */
        Vector2.prototype.multiplyTo = function (a, vout) {
            if (vout === void 0) { vout = new Vector2(); }
            return vout.copy(this).multiply(a);
        };
        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        Vector2.prototype.lerp = function (p, alpha) {
            this.x += (p.x - this.x) * alpha.x;
            this.y += (p.y - this.y) * alpha.y;
            return this;
        };
        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回新向量
         */
        Vector2.prototype.lerpTo = function (v, alpha, vout) {
            if (vout === void 0) { vout = new Vector2(); }
            return vout.copy(this).lerp(v, alpha);
        };
        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        Vector2.prototype.lerpNumber = function (v, alpha) {
            this.x += (v.x - this.x) * alpha;
            this.y += (v.y - this.y) * alpha;
            return this;
        };
        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        Vector2.prototype.lerpNumberTo = function (v, alpha, vout) {
            if (vout === void 0) { vout = new Vector2(); }
            return vout.copy(this).lerpNumber(v, alpha);
        };
        /**
         * 夹紧？
         * @param min 最小值
         * @param max 最大值
         */
        Vector2.prototype.clamp = function (min, max) {
            this.x = Math.clamp(this.x, min.x, max.x);
            this.y = Math.clamp(this.y, min.y, max.y);
            return this;
        };
        /**
         * 夹紧？
         * @param min 最小值
         * @param max 最大值
         */
        Vector2.prototype.clampTo = function (min, max, vout) {
            if (vout === void 0) { vout = new Vector2(); }
            return vout.copy(this).clamp(min, max);
        };
        /**
         * 取最小元素
         * @param v 向量
         */
        Vector2.prototype.min = function (v) {
            this.x = Math.min(this.x, v.x);
            this.y = Math.min(this.y, v.y);
            return this;
        };
        /**
         * 取最大元素
         * @param v 向量
         */
        Vector2.prototype.max = function (v) {
            this.x = Math.max(this.x, v.x);
            this.y = Math.max(this.y, v.y);
            return this;
        };
        /**
         * 各分量均取最近的整数
         */
        Vector2.prototype.round = function () {
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);
            return this;
        };
        /**
         * 返回包含 x 和 y 坐标的值的字符串。该字符串的格式为 "(x=x, y=y)"，因此为点 23,17 调用 toString() 方法将返回 "(x=23, y=17)"。
         * @returns 坐标的字符串表示形式。
         */
        Vector2.prototype.toString = function () {
            return "(x=" + this.x + ", y=" + this.y + ")";
        };
        /**
         * 转换为数组
         * @param array 数组
         * @param offset 偏移
         * @return 返回数组
         */
        Vector2.prototype.toArray = function (array, offset) {
            if (array === void 0) { array = []; }
            if (offset === void 0) { offset = 0; }
            array[offset] = this.x;
            array[offset + 1] = this.y;
            return array;
        };
        /**
         * 原点
         */
        Vector2.ZERO = new Vector2();
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], Vector2.prototype, "x", void 0);
        __decorate([
            feng3d.oav(),
            feng3d.serialize
        ], Vector2.prototype, "y", void 0);
        return Vector2;
    }());
    feng3d.Vector2 = Vector2;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Vector3 类使用笛卡尔坐标 x、y 和 z 表示三维空间中的点或位置
     */
    var Vector3 = /** @class */ (function () {
        /**
         * 创建 Vector3 对象的实例。如果未指定构造函数的参数，则将使用元素 (0,0,0,0) 创建 Vector3 对象。
         * @param x 第一个元素，例如 x 坐标。
         * @param y 第二个元素，例如 y 坐标。
         * @param z 第三个元素，例如 z 坐标。
         */
        function Vector3(x, y, z) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (z === void 0) { z = 0; }
            /**
            * Vector3 对象中的第一个元素，例如，三维空间中某个点的 x 坐标。默认值为 0
            */
            this.x = 0;
            /**
             * Vector3 对象中的第二个元素，例如，三维空间中某个点的 y 坐标。默认值为 0
             */
            this.y = 0;
            /**
             * Vector3 对象中的第三个元素，例如，三维空间中某个点的 z 坐标。默认值为 0
             */
            this.z = 0;
            this.x = x;
            this.y = y;
            this.z = z;
        }
        /**
         * 从数组中初始化向量
         * @param array 数组
         * @param offset 偏移
         * @return 返回新向量
         */
        Vector3.fromArray = function (array, offset) {
            if (offset === void 0) { offset = 0; }
            return new Vector3().fromArray(array, offset);
        };
        /**
         * 随机三维向量
         *
         * @param size 尺寸
         * @param double 如果值为false，随机范围在[0,size],否则[-size,size]。默认为false。
         */
        Vector3.random = function (size, double) {
            if (size === void 0) { size = 1; }
            if (double === void 0) { double = false; }
            var v = new Vector3(Math.random(), Math.random(), Math.random());
            if (double)
                v.scaleNumber(2).subNumber(1);
            v.scaleNumber(size);
            return v;
        };
        /**
         * 从Vector2初始化
         */
        Vector3.fromVector2 = function (vector, z) {
            if (z === void 0) { z = 0; }
            return new Vector3().fromVector2(vector, z);
        };
        Object.defineProperty(Vector3.prototype, "length", {
            /**
            * 当前 Vector3 对象的长度（大小），即从原点 (0,0,0) 到该对象的 x、y 和 z 坐标的距离。w 属性将被忽略。单位矢量具有的长度或大小为一。
            */
            get: function () {
                return Math.sqrt(this.lengthSquared);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Vector3.prototype, "lengthSquared", {
            /**
            * 当前 Vector3 对象长度的平方，它是使用 x、y 和 z 属性计算出来的。w 属性将被忽略。尽可能使用 lengthSquared() 方法，而不要使用 Vector3.length() 方法的 Math.sqrt() 方法调用，后者速度较慢。
            */
            get: function () {
                return this.x * this.x + this.y * this.y + this.z * this.z;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 将 Vector3 的成员设置为指定值
         */
        Vector3.prototype.set = function (x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        };
        /**
         * 把所有分量都设为零
         */
        Vector3.prototype.setZero = function () {
            this.x = this.y = this.z = 0;
        };
        /**
         * 从Vector2初始化
         */
        Vector3.prototype.fromVector2 = function (vector, z) {
            if (z === void 0) { z = 0; }
            this.x = vector.x;
            this.y = vector.y;
            this.z = z;
            return this;
        };
        Vector3.prototype.fromArray = function (array, offset) {
            if (offset === void 0) { offset = 0; }
            this.x = array[offset];
            this.y = array[offset + 1];
            this.z = array[offset + 2];
            return this;
        };
        /**
         * 转换为Vector2
         */
        Vector3.prototype.toVector2 = function (vector) {
            if (vector === void 0) { vector = new feng3d.Vector2(); }
            return vector.init(this.x, this.y);
        };
        /**
         * 转换为Vector4
         */
        Vector3.prototype.toVector4 = function (vector4) {
            if (vector4 === void 0) { vector4 = new feng3d.Vector4(); }
            vector4.x = this.x;
            vector4.y = this.y;
            vector4.z = this.z;
            return vector4;
        };
        /**
         * 加上指定向量得到新向量
         * @param v 加向量
         * @return 返回新向量
         */
        Vector3.prototype.add = function (a) {
            this.x += a.x;
            this.y += a.y;
            this.z += a.z;
            return this;
        };
        /**
         * 加上指定向量得到新向量
         * @param v 加向量
         * @return 返回新向量
         */
        Vector3.prototype.addTo = function (a, vout) {
            if (vout === void 0) { vout = new Vector3(); }
            vout.x = this.x + a.x;
            vout.y = this.y + a.y;
            vout.z = this.z + a.z;
            return vout;
        };
        /**
         * Scale a vector and add it to this vector. Save the result in "this". (this = this + vector * scalar)
         * @param scalar
         * @param vector
         * @param  target The vector to save the result in.
         */
        Vector3.prototype.addScaledVector = function (scalar, vector) {
            this.x = this.x + scalar * vector.x;
            this.y = this.y + scalar * vector.y;
            this.z = this.z + scalar * vector.z;
            return this;
        };
        /**
         * Scale a vector and add it to this vector. Save the result in "target". (target = this + vector * scalar)
         * @param scalar
         * @param vector
         * @param  target The vector to save the result in.
         */
        Vector3.prototype.addScaledVectorTo = function (scalar, vector, target) {
            if (target === void 0) { target = new Vector3(); }
            target.x = this.x + scalar * vector.x;
            target.y = this.y + scalar * vector.y;
            target.z = this.z + scalar * vector.z;
            return target;
        };
        /**
         * 乘以向量
         * @param a 向量
         */
        Vector3.prototype.multiply = function (a) {
            this.x *= a.x;
            this.y *= a.y;
            this.z *= a.z;
            return this;
        };
        /**
         * 乘以向量
         * @param a 向量
         * @param vout 输出向量
         */
        Vector3.prototype.multiplyTo = function (a, vout) {
            if (vout === void 0) { vout = new Vector3(); }
            vout.x = this.x * a.x;
            vout.y = this.y * a.y;
            vout.z = this.z * a.z;
            return vout;
        };
        /**
         * 除以向量
         * @param a 向量
         */
        Vector3.prototype.divide = function (a) {
            this.x /= a.x;
            this.y /= a.y;
            this.z /= a.z;
            return this;
        };
        /**
         * 除以向量
         * @param a 向量
         * @param vout 输出向量
         */
        Vector3.prototype.divideTo = function (a, vout) {
            if (vout === void 0) { vout = new Vector3(); }
            vout.x = this.x / a.x;
            vout.y = this.y / a.y;
            vout.z = this.z / a.z;
            return vout;
        };
        /**
         * 叉乘向量
         * @param a 向量
         */
        Vector3.prototype.cross = function (a) {
            return this.set(this.y * a.z - this.z * a.y, this.z * a.x - this.x * a.z, this.x * a.y - this.y * a.x);
        };
        /**
         * 叉乘向量
         * @param a 向量
         * @param vout 输出向量
         */
        Vector3.prototype.crossTo = function (a, vout) {
            if (vout === void 0) { vout = new Vector3(); }
            vout.set(this.y * a.z - this.z * a.y, this.z * a.x - this.x * a.z, this.x * a.y - this.y * a.x);
            return vout;
        };
        /**
         * 如果当前 Vector3 对象和作为参数指定的 Vector3 对象均为单位顶点，此方法将返回这两个顶点之间所成角的余弦值。
         */
        Vector3.prototype.dot = function (a) {
            return this.x * a.x + this.y * a.y + this.z * a.z;
        };
        /**
         * 是否为零向量
         */
        Vector3.prototype.isZero = function () {
            return this.x === 0 && this.y === 0 && this.z === 0;
        };
        Vector3.prototype.tangents = function (t1, t2) {
            var norm = this.length;
            if (norm > 0.0) {
                var n = new Vector3();
                var inorm = 1 / norm;
                n.set(this.x * inorm, this.y * inorm, this.z * inorm);
                var randVec = new Vector3();
                if (Math.abs(n.x) < 0.9) {
                    randVec.set(1, 0, 0);
                    n.crossTo(randVec, t1);
                }
                else {
                    randVec.set(0, 1, 0);
                    n.crossTo(randVec, t1);
                }
                n.crossTo(t1, t2);
            }
            else {
                // The normal length is zero, make something up
                t1.set(1, 0, 0);
                t2.set(0, 1, 0);
            }
        };
        /**
         * 检查一个向量是否接近零
         *
         * @param precision
         */
        Vector3.prototype.almostZero = function (precision) {
            if (precision === void 0) { precision = Math.PRECISION; }
            if (Math.abs(this.x) > precision ||
                Math.abs(this.y) > precision ||
                Math.abs(this.z) > precision) {
                return false;
            }
            return true;
        };
        /**
         * 检查这个向量是否与另一个向量反平行。
         *
         * @param  v
         * @param  precision 设置为零以进行精确比较
         */
        Vector3.prototype.isAntiparallelTo = function (v, precision) {
            if (precision === void 0) { precision = Math.PRECISION; }
            var t = new Vector3();
            this.negateTo(t);
            return t.equals(v, precision);
        };
        /**
         * 加上标量
         * @param n 标量
         */
        Vector3.prototype.addNumber = function (n) {
            this.x += n;
            this.y += n;
            this.z += n;
            return this;
        };
        /**
         * 增加标量
         * @param n 标量
         */
        Vector3.prototype.addNumberTo = function (n, vout) {
            if (vout === void 0) { vout = new Vector3(); }
            vout.x = this.x + n;
            vout.y = this.y + n;
            vout.z = this.z + n;
            return vout;
        };
        /**
         * 减去标量
         * @param n 标量
         */
        Vector3.prototype.subNumber = function (n) {
            this.x -= n;
            this.y -= n;
            this.z -= n;
            return this;
        };
        /**
         * 减去标量
         * @param n 标量
         */
        Vector3.prototype.subNumberTo = function (n, vout) {
            if (vout === void 0) { vout = new Vector3(); }
            vout.x = this.x - n;
            vout.y = this.y - n;
            vout.z = this.z - n;
            return vout;
        };
        /**
         * 乘以标量
         * @param n 标量
         */
        Vector3.prototype.multiplyNumber = function (n) {
            this.x *= n;
            this.y *= n;
            this.z *= n;
            return this;
        };
        /**
         * 乘以标量
         * @param n 标量
         * @param vout 输出向量
         */
        Vector3.prototype.multiplyNumberTo = function (n, vout) {
            if (vout === void 0) { vout = new Vector3(); }
            vout.x = this.x * n;
            vout.y = this.y * n;
            vout.z = this.z * n;
            return vout;
        };
        /**
         * 除以标量
         * @param n 标量
         */
        Vector3.prototype.divideNumber = function (n) {
            this.x /= n;
            this.y /= n;
            this.z /= n;
            return this;
        };
        /**
         * 除以标量
         * @param n 标量
         * @param vout 输出向量
         */
        Vector3.prototype.divideNumberTo = function (n, vout) {
            if (vout === void 0) { vout = new Vector3(); }
            vout.x = this.x / n;
            vout.y = this.y / n;
            vout.z = this.z / n;
            return vout;
        };
        /**
         * 返回一个新 Vector3 对象，它是与当前 Vector3 对象完全相同的副本。
         * @return 一个新 Vector3 对象，它是当前 Vector3 对象的副本。
         */
        Vector3.prototype.clone = function () {
            return new Vector3(this.x, this.y, this.z);
        };
        /**
         * 将源 Vector3 对象中的所有矢量数据复制到调用方 Vector3 对象中。
         * @return 要从中复制数据的 Vector3 对象。
         */
        Vector3.prototype.copy = function (v) {
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
            return this;
        };
        /**
         * 通过将当前 Vector3 对象的 x、y 和 z 元素与指定的 Vector3 对象的 x、y 和 z 元素进行比较，确定这两个对象是否相等。
         */
        Vector3.prototype.equals = function (v, precision) {
            if (precision === void 0) { precision = Math.PRECISION; }
            if (!Math.equals(this.x - v.x, 0, precision))
                return false;
            if (!Math.equals(this.y - v.y, 0, precision))
                return false;
            if (!Math.equals(this.z - v.z, 0, precision))
                return false;
            return true;
        };
        /**
         * 负向量
         * (a,b,c)->(-a,-b,-c)
         */
        Vector3.prototype.negate = function () {
            this.x = -this.x;
            this.y = -this.y;
            this.z = -this.z;
            return this;
        };
        /**
         * 负向量
         * (a,b,c)->(-a,-b,-c)
         */
        Vector3.prototype.negateTo = function (vout) {
            if (vout === void 0) { vout = new Vector3(); }
            vout.x = -this.x;
            vout.y = -this.y;
            vout.z = -this.z;
            return vout;
        };
        /**
         * 倒向量
         * (a,b,c)->(1/a,1/b,1/c)
         */
        Vector3.prototype.inverse = function () {
            this.x = 1 / this.x;
            this.y = 1 / this.y;
            this.z = 1 / this.z;
            return this;
        };
        /**
         * 倒向量
         * (a,b,c)->(1/a,1/b,1/c)
         */
        Vector3.prototype.inverseTo = function (vout) {
            if (vout === void 0) { vout = new Vector3(); }
            vout.x = 1 / this.x;
            vout.y = 1 / this.y;
            vout.z = 1 / this.z;
            return vout;
        };
        /**
         * 通过将最前面的三个元素（x、y、z）除以矢量的长度可将 Vector3 对象转换为单位矢量。
         */
        Vector3.prototype.normalize = function (thickness) {
            if (thickness === void 0) { thickness = 1; }
            var length = this.lengthSquared;
            if (length > 0) {
                length = Math.sqrt(length);
                var invLength = thickness / length;
                this.x *= invLength;
                this.y *= invLength;
                this.z *= invLength;
            }
            else {
                // Make something up
                this.x = 0;
                this.y = 0;
                this.z = 0;
            }
            return this;
        };
        /**
         * 得到这个向量长度为1
         */
        Vector3.prototype.unit = function (target) {
            if (target === void 0) { target = new Vector3(); }
            var x = this.x, y = this.y, z = this.z;
            var ninv = x * x + y * y + z * z;
            if (ninv > 0.0) {
                var ninv = Math.sqrt(ninv);
                ninv = 1.0 / ninv;
                target.x = x * ninv;
                target.y = y * ninv;
                target.z = z * ninv;
            }
            else {
                target.x = 1;
                target.y = 0;
                target.z = 0;
            }
            return target;
        };
        /**
         * 按标量（大小）缩放当前的 Vector3 对象。
         */
        Vector3.prototype.scaleNumber = function (s) {
            this.x *= s;
            this.y *= s;
            this.z *= s;
            return this;
        };
        /**
         * 按标量（大小）缩放当前的 Vector3 对象。
         */
        Vector3.prototype.scaleNumberTo = function (s, vout) {
            if (vout === void 0) { vout = new Vector3(); }
            vout.x = this.x * s;
            vout.y = this.y * s;
            vout.z = this.z * s;
            return vout;
        };
        /**
         * 缩放
         * @param s 缩放量
         */
        Vector3.prototype.scale = function (s) {
            this.x *= s.x;
            this.y *= s.y;
            this.z *= s.z;
            return this;
        };
        /**
         * 缩放
         * @param s 缩放量
         */
        Vector3.prototype.scaleTo = function (s, vout) {
            if (vout === void 0) { vout = new Vector3(); }
            vout.x = this.x * s.x;
            vout.y = this.y * s.y;
            vout.z = this.z * s.z;
            return vout;
        };
        /**
         * 减去向量
         * @param a 减去的向量
         * @return 返回新向量
         */
        Vector3.prototype.sub = function (a) {
            this.x -= a.x;
            this.y -= a.y;
            this.z -= a.z;
            return this;
        };
        /**
         * 减去向量
         * @param a 减去的向量
         * @return 返回新向量
         */
        Vector3.prototype.subTo = function (a, vout) {
            if (vout === void 0) { vout = new Vector3(); }
            vout.x = this.x - a.x;
            vout.y = this.y - a.y;
            vout.z = this.z - a.z;
            return vout;
        };
        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        Vector3.prototype.lerp = function (v, alpha) {
            this.x += (v.x - this.x) * alpha.x;
            this.y += (v.y - this.y) * alpha.y;
            this.z += (v.z - this.z) * alpha.z;
            return this;
        };
        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        Vector3.prototype.lerpTo = function (v, alpha, vout) {
            if (vout === void 0) { vout = new Vector3(); }
            vout.x = this.x + (v.x - this.x) * alpha.x;
            vout.y = this.y + (v.y - this.y) * alpha.y;
            vout.z = this.z + (v.z - this.z) * alpha.z;
            return vout;
        };
        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        Vector3.prototype.lerpNumber = function (v, alpha) {
            this.x += (v.x - this.x) * alpha;
            this.y += (v.y - this.y) * alpha;
            this.z += (v.z - this.z) * alpha;
            return this;
        };
        /**
         * 插值到指定向量
         * @param v 目标向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        Vector3.prototype.lerpNumberTo = function (v, alpha, vout) {
            if (vout === void 0) { vout = new Vector3(); }
            vout.x = this.x + (v.x - this.x) * alpha;
            vout.y = this.y + (v.y - this.y) * alpha;
            vout.z = this.z + (v.z - this.z) * alpha;
            return vout;
        };
        /**
         * 小于指定点
         * @param p 点
         */
        Vector3.prototype.less = function (p) {
            return this.x < p.x && this.y < p.y && this.z < p.z;
        };
        /**
         * 小于等于指定点
         * @param p 点
         */
        Vector3.prototype.lessequal = function (p) {
            return this.x <= p.x && this.y <= p.y && this.z <= p.z;
        };
        /**
         * 大于指定点
         * @param p 点
         */
        Vector3.prototype.greater = function (p) {
            return this.x > p.x && this.y > p.y && this.z > p.z;
        };
        /**
         * 大于等于指定点
         * @param p 点
         */
        Vector3.prototype.greaterequal = function (p) {
            return this.x >= p.x && this.y >= p.y && this.z >= p.z;
        };
        /**
         * 夹紧？
         * @param min 最小值
         * @param max 最大值
         */
        Vector3.prototype.clamp = function (min, max) {
            this.x = Math.clamp(this.x, min.x, max.x);
            this.y = Math.clamp(this.y, min.y, max.y);
            this.z = Math.clamp(this.z, min.z, max.z);
            return this;
        };
        /**
         * 夹紧？
         * @param min 最小值
         * @param max 最大值
         */
        Vector3.prototype.clampTo = function (min, max, vout) {
            if (vout === void 0) { vout = new Vector3(); }
            return vout.copy(this).clamp(min, max);
        };
        /**
         * 取最小元素
         * @param v 向量
         */
        Vector3.prototype.min = function (v) {
            this.x = Math.min(this.x, v.x);
            this.y = Math.min(this.y, v.y);
            this.z = Math.min(this.z, v.z);
            return this;
        };
        /**
         * 取最大元素
         * @param v 向量
         */
        Vector3.prototype.max = function (v) {
            this.x = Math.max(this.x, v.x);
            this.y = Math.max(this.y, v.y);
            this.z = Math.max(this.z, v.z);
            return this;
        };
        /**
         * 应用矩阵
         * @param mat 矩阵
         */
        Vector3.prototype.applyMatrix4x4 = function (mat) {
            mat.transformVector(this, this);
            return this;
        };
        /**
         * 应用四元素
         * @param q 四元素
         */
        Vector3.prototype.applyQuaternion = function (q) {
            var x = this.x, y = this.y, z = this.z;
            var qx = q.x, qy = q.y, qz = q.z, qw = q.w;
            // calculate quat * vector
            var ix = qw * x + qy * z - qz * y;
            var iy = qw * y + qz * x - qx * z;
            var iz = qw * z + qx * y - qy * x;
            var iw = -qx * x - qy * y - qz * z;
            // calculate result * inverse quat
            this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
            return this;
        };
        /**
         * 与点之间的距离平方
         * @param v 点
         */
        Vector3.prototype.distanceSquared = function (v) {
            var dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;
            return dx * dx + dy * dy + dz * dz;
        };
        /**
         * 与点之间的距离平方
         * @param v 点
         */
        Vector3.prototype.distance = function (v) {
            return Math.sqrt(this.distanceSquared(v));
        };
        /**
         * 反射
         * @param normal
         */
        Vector3.prototype.reflect = function (normal) {
            return this.sub(normal.multiplyNumberTo(2 * this.dot(normal)));
        };
        /**
         * 向下取整
         */
        Vector3.prototype.floor = function () {
            this.x = Math.floor(this.x);
            this.y = Math.floor(this.y);
            this.z = Math.floor(this.z);
            return this;
        };
        /**
         * 向上取整
         */
        Vector3.prototype.ceil = function () {
            this.x = Math.ceil(this.x);
            this.y = Math.ceil(this.y);
            this.z = Math.ceil(this.z);
            return this;
        };
        /**
         * 四舍五入
         */
        Vector3.prototype.round = function () {
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);
            this.z = Math.round(this.z);
            return this;
        };
        /**
         * 向0取整
         */
        Vector3.prototype.roundToZero = function () {
            this.x = (this.x < 0) ? Math.ceil(this.x) : Math.floor(this.x);
            this.y = (this.y < 0) ? Math.ceil(this.y) : Math.floor(this.y);
            this.z = (this.z < 0) ? Math.ceil(this.z) : Math.floor(this.z);
            return this;
        };
        /**
         * 与指定向量是否平行
         * @param v 向量
         */
        Vector3.prototype.isParallel = function (v, precision) {
            if (precision === void 0) { precision = Math.PRECISION; }
            return Math.equals(Math.abs(this.clone().normalize().dot(v.clone().normalize())), 1, precision);
        };
        /**
         * 从向量中得到叉乘矩阵a_cross，使得a x b = a_cross * b = c
         * @see http://www8.cs.umu.se/kurser/TDBD24/VT06/lectures/Lecture6.pdf
         */
        Vector3.prototype.crossmat = function () {
            return new feng3d.Matrix3x3([0, -this.z, this.y,
                this.z, 0, -this.x,
                -this.y, this.x, 0]);
        };
        /**
         * 返回当前 Vector3 对象的字符串表示形式。
         */
        Vector3.prototype.toString = function () {
            return "<" + this.x + ", " + this.y + ", " + this.z + ">";
        };
        /**
         * 转换为数组
         * @param array 数组
         * @param offset 偏移
         * @return 返回数组
         */
        Vector3.prototype.toArray = function (array, offset) {
            if (array === void 0) { array = []; }
            if (offset === void 0) { offset = 0; }
            array[offset] = this.x;
            array[offset + 1] = this.y;
            array[offset + 2] = this.z;
            return array;
        };
        /**
        * 定义为 Vector3 对象的 x 轴，坐标为 (1,0,0)。
        */
        Vector3.X_AXIS = Object.freeze(new Vector3(1, 0, 0));
        /**
        * 定义为 Vector3 对象的 y 轴，坐标为 (0,1,0)
        */
        Vector3.Y_AXIS = Object.freeze(new Vector3(0, 1, 0));
        /**
        * 定义为 Vector3 对象的 z 轴，坐标为 (0,0,1)
        */
        Vector3.Z_AXIS = Object.freeze(new Vector3(0, 0, 1));
        /**
         * 原点 Vector3(0,0,0)
         */
        Vector3.ZERO = Object.freeze(new Vector3());
        /**
         * Vector3(1, 1, 1)
         */
        Vector3.ONE = Object.freeze(new Vector3(1, 1, 1));
        __decorate([
            feng3d.serialize,
            feng3d.oav()
        ], Vector3.prototype, "x", void 0);
        __decorate([
            feng3d.serialize,
            feng3d.oav()
        ], Vector3.prototype, "y", void 0);
        __decorate([
            feng3d.serialize,
            feng3d.oav()
        ], Vector3.prototype, "z", void 0);
        return Vector3;
    }());
    feng3d.Vector3 = Vector3;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 四维向量
     */
    var Vector4 = /** @class */ (function () {
        /**
         * 创建 Vector4 对象的实例。如果未指定构造函数的参数，则将使用元素 (0,0,0,0) 创建 Vector4 对象。
         * @param x 第一个元素
         * @param y 第二个元素
         * @param z 第三个元素
         * @param w 第四个元素
         */
        function Vector4(x, y, z, w) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (z === void 0) { z = 0; }
            if (w === void 0) { w = 0; }
            /**
            * Vector4 对象中的第一个元素。默认值为 0
            */
            this.x = 0;
            /**
             * Vector4 对象中的第二个元素。默认值为 0
             */
            this.y = 0;
            /**
             * Vector4 对象中的第三个元素。默认值为 0
             */
            this.z = 0;
            /**
             * Vector4 对象的第四个元素。默认值为 0
             */
            this.w = 0;
            this.init(x, y, z, w);
        }
        Vector4.fromArray = function (array, offset) {
            if (offset === void 0) { offset = 0; }
            return new Vector4().fromArray(array, offset);
        };
        Vector4.fromVector3 = function (vector3, w) {
            if (w === void 0) { w = 0; }
            return new Vector4().fromVector3(vector3, w);
        };
        Vector4.random = function () {
            return new Vector4(Math.random(), Math.random(), Math.random(), Math.random());
        };
        /**
         * 初始化向量
         * @param x 第一个元素
         * @param y 第二个元素
         * @param z 第三个元素
         * @param w 第四个元素
         * @return 返回自身
         */
        Vector4.prototype.init = function (x, y, z, w) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
            return this;
        };
        /**
         * 从数组初始化
         * @param array 提供数据的数组
         * @param offset 数组中起始位置
         * @return 返回自身
         */
        Vector4.prototype.fromArray = function (array, offset) {
            if (offset === void 0) { offset = 0; }
            this.x = array[offset];
            this.y = array[offset + 1];
            this.z = array[offset + 2];
            this.w = array[offset + 3];
            return this;
        };
        /**
         * 从三维向量初始化
         * @param vector3 三维向量
         * @param w 向量第四个值
         * @return 返回自身
         */
        Vector4.prototype.fromVector3 = function (vector3, w) {
            if (w === void 0) { w = 0; }
            this.x = vector3.x;
            this.y = vector3.y;
            this.z = vector3.z;
            this.w = w;
            return this;
        };
        /**
         * 转换为三维向量
         * @param v3 三维向量
         */
        Vector4.prototype.toVector3 = function (v3) {
            if (v3 === void 0) { v3 = new feng3d.Vector3(); }
            v3.set(this.x, this.y, this.z);
            return v3;
        };
        /**
         * 转换为数组
         * @param array 数组
         * @param offset 偏移
         */
        Vector4.prototype.toArray = function (array, offset) {
            if (array === void 0) { array = []; }
            if (offset === void 0) { offset = 0; }
            array[offset] = this.x;
            array[offset + 1] = this.y;
            array[offset + 2] = this.z;
            array[offset + 3] = this.w;
            return array;
        };
        /**
         * 加上指定向量得到新向量
         * @param v 加向量
         * @return 返回新向量
         */
        Vector4.prototype.add = function (v) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
            this.w += v.w;
            return this;
        };
        /**
         * 加上指定向量得到新向量
         * @param v 加向量
         * @return 返回新向量
         */
        Vector4.prototype.addTo = function (v, vout) {
            if (vout === void 0) { vout = new Vector4(); }
            return vout.copy(this).add(v);
        };
        /**
         * 克隆一个向量
         * @return 返回一个拷贝向量
         */
        Vector4.prototype.clone = function () {
            return new Vector4(this.x, this.y, this.z, this.w);
        };
        /**
         * 从指定向量拷贝数据
         * @param v 被拷贝向量
         * @return 返回自身
         */
        Vector4.prototype.copy = function (v) {
            this.x = v.x;
            this.y = v.y;
            this.z = v.z;
            this.w = v.w;
            return this;
        };
        /**
         * 减去指定向量
         * @param v 减去的向量
         * @return 返回自身
         */
        Vector4.prototype.sub = function (v) {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
            this.w -= v.w;
            return this;
        };
        /**
         * 减去指定向量
         * @param v 减去的向量
         * @return 返回新向量
         */
        Vector4.prototype.subTo = function (v, vout) {
            if (vout === void 0) { vout = new Vector4(); }
            return vout.copy(this).sub(v);
        };
        /**
         * 乘以指定向量
         * @param v 乘以的向量
         * @return 返回自身
         */
        Vector4.prototype.multiply = function (v) {
            this.x *= v.x;
            this.y *= v.y;
            this.z *= v.z;
            this.w *= v.w;
            return this;
        };
        /**
         * 乘以指定向量
         * @param v 乘以的向量
         * @return 返回新向量
         */
        Vector4.prototype.multiplyTo = function (v, vout) {
            if (vout === void 0) { vout = new Vector4(); }
            return vout.copy(this).multiply(v);
        };
        /**
         * 除以指定向量
         * @param v 除以的向量
         * @return 返回自身
         */
        Vector4.prototype.div = function (v) {
            this.x /= v.x;
            this.y /= v.y;
            this.z /= v.z;
            this.w /= v.w;
            return this;
        };
        /**
         * 除以指定向量
         * @param v 除以的向量
         * @return 返回新向量
         */
        Vector4.prototype.divTo = function (v, vout) {
            if (vout === void 0) { vout = new Vector4(); }
            return vout.copy(this).div(v);
        };
        /**
         * 与指定向量比较是否相等
         * @param v 比较的向量
         * @param precision 允许误差
         * @return 相等返回true，否则false
         */
        Vector4.prototype.equals = function (v, precision) {
            if (precision === void 0) { precision = Math.PRECISION; }
            if (!Math.equals(this.x - v.x, 0, precision))
                return false;
            if (!Math.equals(this.y - v.y, 0, precision))
                return false;
            if (!Math.equals(this.z - v.z, 0, precision))
                return false;
            if (!Math.equals(this.w - v.w, 0, precision))
                return false;
            return true;
        };
        /**
         * 负向量
         * @return 返回自身
         */
        Vector4.prototype.negate = function () {
            this.x = -this.x;
            this.y = -this.y;
            this.z = -this.z;
            this.w = -this.w;
            return this;
        };
        /**
         * 负向量
         * @return 返回新向量
         */
        Vector4.prototype.negateTo = function (vout) {
            if (vout === void 0) { vout = new Vector4(); }
            return vout.copy(this).negate();
        };
        /**
         * 缩放指定系数
         * @param s 缩放系数
         * @return 返回自身
         */
        Vector4.prototype.scale = function (s) {
            this.x *= s;
            this.y *= s;
            this.z *= s;
            this.w *= s;
            return this;
        };
        /**
         * 缩放指定系数
         * @param s 缩放系数
         * @return 返回新向量
         */
        Vector4.prototype.scaleTo = function (s) {
            return this.clone().scale(s);
        };
        /**
         * 如果当前 Vector4 对象和作为参数指定的 Vector4 对象均为单位顶点，此方法将返回这两个顶点之间所成角的余弦值。
         */
        Vector4.prototype.dot = function (a) {
            return this.x * a.x + this.y * a.y + this.z * a.z + this.w * a.w;
        };
        /**
         * 获取到指定向量的插值
         * @param v 终点插值向量
         * @param alpha 插值系数
         * @return 返回自身
         */
        Vector4.prototype.lerp = function (v, alpha) {
            this.x += (v.x - this.x) * alpha;
            this.y += (v.y - this.y) * alpha;
            this.z += (v.z - this.z) * alpha;
            this.w += (v.w - this.w) * alpha;
            return this;
        };
        /**
         * 获取到指定向量的插值
         * @param v 终点插值向量
         * @param alpha 插值系数
         * @return 返回新向量
         */
        Vector4.prototype.lerpTo = function (v, alpha, vout) {
            if (vout === void 0) { vout = new Vector4(); }
            return vout.copy(this).lerp(v, alpha);
        };
        /**
         * 应用矩阵
         * @param mat 矩阵
         */
        Vector4.prototype.applyMatrix4x4 = function (mat) {
            mat.transformVector4(this, this);
            return this;
        };
        /**
         * 返回当前 Vector4 对象的字符串表示形式。
         */
        Vector4.prototype.toString = function () {
            return "<" + this.x + ", " + this.y + ", " + this.z + ", " + this.w + ">";
        };
        __decorate([
            feng3d.serialize,
            feng3d.oav()
        ], Vector4.prototype, "x", void 0);
        __decorate([
            feng3d.serialize,
            feng3d.oav()
        ], Vector4.prototype, "y", void 0);
        __decorate([
            feng3d.serialize,
            feng3d.oav()
        ], Vector4.prototype, "z", void 0);
        __decorate([
            feng3d.serialize,
            feng3d.oav()
        ], Vector4.prototype, "w", void 0);
        return Vector4;
    }());
    feng3d.Vector4 = Vector4;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 矩形
     *
     * Rectangle 对象是按其位置（由它左上角的点 (x, y) 确定）以及宽度和高度定义的区域。<br/>
     * Rectangle 类的 x、y、width 和 height 属性相互独立；更改一个属性的值不会影响其他属性。
     * 但是，right 和 bottom 属性与这四个属性是整体相关的。例如，如果更改 right 属性的值，则 width
     * 属性的值将发生变化；如果更改 bottom 属性，则 height 属性的值将发生变化。
     */
    var Rectangle = /** @class */ (function () {
        /**
         * 创建一个新 Rectangle 对象，其左上角由 x 和 y 参数指定，并具有指定的 width 和 height 参数。
         * @param x 矩形左上角的 x 坐标。
         * @param y 矩形左上角的 y 坐标。
         * @param width 矩形的宽度（以像素为单位）。
         * @param height 矩形的高度（以像素为单位）。
         */
        function Rectangle(x, y, width, height) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (width === void 0) { width = 0; }
            if (height === void 0) { height = 0; }
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        }
        Object.defineProperty(Rectangle.prototype, "right", {
            /**
             * x 和 width 属性的和。
             */
            get: function () {
                return this.x + this.width;
            },
            set: function (value) {
                this.width = value - this.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "bottom", {
            /**
             * y 和 height 属性的和。
             */
            get: function () {
                return this.y + this.height;
            },
            set: function (value) {
                this.height = value - this.y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "left", {
            /**
             * 矩形左上角的 x 坐标。更改 Rectangle 对象的 left 属性对 y 和 height 属性没有影响。但是，它会影响 width 属性，而更改 x 值不会影响 width 属性。
             * left 属性的值等于 x 属性的值。
             */
            get: function () {
                return this.x;
            },
            set: function (value) {
                this.width += this.x - value;
                this.x = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "top", {
            /**
             * 矩形左上角的 y 坐标。更改 Rectangle 对象的 top 属性对 x 和 width 属性没有影响。但是，它会影响 height 属性，而更改 y 值不会影响 height 属性。<br/>
             * top 属性的值等于 y 属性的值。
             */
            get: function () {
                return this.y;
            },
            set: function (value) {
                this.height += this.y - value;
                this.y = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "topLeft", {
            /**
             * 由该点的 x 和 y 坐标确定的 Rectangle 对象左上角的位置。
             */
            get: function () {
                return new feng3d.Vector2(this.left, this.top);
            },
            set: function (value) {
                this.top = value.y;
                this.left = value.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "bottomRight", {
            /**
             * 由 right 和 bottom 属性的值确定的 Rectangle 对象的右下角的位置。
             */
            get: function () {
                return new feng3d.Vector2(this.right, this.bottom);
            },
            set: function (value) {
                this.bottom = value.y;
                this.right = value.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Rectangle.prototype, "center", {
            /**
             * 中心点
             */
            get: function () {
                return new feng3d.Vector2(this.x + this.width / 2, this.y + this.height / 2);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 将源 Rectangle 对象中的所有矩形数据复制到调用方 Rectangle 对象中。
         * @param sourceRect 要从中复制数据的 Rectangle 对象。
         */
        Rectangle.prototype.copyFrom = function (sourceRect) {
            this.x = sourceRect.x;
            this.y = sourceRect.y;
            this.width = sourceRect.width;
            this.height = sourceRect.height;
            return this;
        };
        /**
         * 将 Rectangle 的成员设置为指定值
         * @param x 矩形左上角的 x 坐标。
         * @param y 矩形左上角的 y 坐标。
         * @param width 矩形的宽度（以像素为单位）。
         * @param height 矩形的高度（以像素为单位）。
         */
        Rectangle.prototype.init = function (x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            return this;
        };
        /**
         * 确定由此 Rectangle 对象定义的矩形区域内是否包含指定的点。
         * @param x 检测点的x轴
         * @param y 检测点的y轴
         * @returns 如果检测点位于矩形内，返回true，否则，返回false
         */
        Rectangle.prototype.contains = function (x, y) {
            return this.x <= x &&
                this.x + this.width >= x &&
                this.y <= y &&
                this.y + this.height >= y;
        };
        /**
         * 如果在 toIntersect 参数中指定的 Rectangle 对象与此 Rectangle 对象相交，则返回交集区域作为 Rectangle 对象。如果矩形不相交，
         * 则此方法返回一个空的 Rectangle 对象，其属性设置为 0。
         * @param toIntersect 要对照比较以查看其是否与此 Rectangle 对象相交的 Rectangle 对象。
         * @returns 等于交集区域的 Rectangle 对象。如果该矩形不相交，则此方法返回一个空的 Rectangle 对象；即，其 x、y、width 和
         * height 属性均设置为 0 的矩形。
         */
        Rectangle.prototype.intersection = function (toIntersect) {
            if (!this.intersects(toIntersect))
                return new Rectangle();
            var i = new Rectangle();
            if (this.x > toIntersect.x) {
                i.x = this.x;
                i.width = toIntersect.x - this.x + toIntersect.width;
                if (i.width > this.width)
                    i.width = this.width;
            }
            else {
                i.x = toIntersect.x;
                i.width = this.x - toIntersect.x + this.width;
                if (i.width > toIntersect.width)
                    i.width = toIntersect.width;
            }
            if (this.y > toIntersect.y) {
                i.y = this.y;
                i.height = toIntersect.y - this.y + toIntersect.height;
                if (i.height > this.height)
                    i.height = this.height;
            }
            else {
                i.y = toIntersect.y;
                i.height = this.y - toIntersect.y + this.height;
                if (i.height > toIntersect.height)
                    i.height = toIntersect.height;
            }
            return i;
        };
        /**
         * 按指定量增加 Rectangle 对象的大小（以像素为单位）
         * 保持 Rectangle 对象的中心点不变，使用 dx 值横向增加它的大小，使用 dy 值纵向增加它的大小。
         * @param dx Rectangle 对象横向增加的值。
         * @param dy Rectangle 对象纵向增加的值。
         */
        Rectangle.prototype.inflate = function (dx, dy) {
            this.x -= dx;
            this.width += 2 * dx;
            this.y -= dy;
            this.height += 2 * dy;
        };
        /**
         * 确定在 toIntersect 参数中指定的对象是否与此 Rectangle 对象相交。此方法检查指定的 Rectangle
         * 对象的 x、y、width 和 height 属性，以查看它是否与此 Rectangle 对象相交。
         * @param toIntersect 要与此 Rectangle 对象比较的 Rectangle 对象。
         * @returns 如果两个矩形相交，返回true，否则返回false
         */
        Rectangle.prototype.intersects = function (toIntersect) {
            return Math.max(this.x, toIntersect.x) <= Math.min(this.right, toIntersect.right)
                && Math.max(this.y, toIntersect.y) <= Math.min(this.bottom, toIntersect.bottom);
        };
        /**
         * 确定此 Rectangle 对象是否为空。
         * @returns 如果 Rectangle 对象的宽度或高度小于等于 0，则返回 true 值，否则返回 false。
         */
        Rectangle.prototype.isEmpty = function () {
            return this.width <= 0 || this.height <= 0;
        };
        /**
         * 将 Rectangle 对象的所有属性设置为 0。
         */
        Rectangle.prototype.setEmpty = function () {
            this.x = 0;
            this.y = 0;
            this.width = 0;
            this.height = 0;
        };
        /**
         * 返回一个新的 Rectangle 对象，其 x、y、width 和 height 属性的值与原始 Rectangle 对象的对应值相同。
         * @returns 新的 Rectangle 对象，其 x、y、width 和 height 属性的值与原始 Rectangle 对象的对应值相同。
         */
        Rectangle.prototype.clone = function () {
            return new Rectangle(this.x, this.y, this.width, this.height);
        };
        /**
         * 确定由此 Rectangle 对象定义的矩形区域内是否包含指定的点。
         * 此方法与 Rectangle.contains() 方法类似，只不过它采用 Point 对象作为参数。
         * @param point 包含点对象
         * @returns 如果包含，返回true，否则返回false
         */
        Rectangle.prototype.containsPoint = function (point) {
            if (this.x < point.x
                && this.x + this.width > point.x
                && this.y < point.y
                && this.y + this.height > point.y) {
                return true;
            }
            return false;
        };
        /**
         * 确定此 Rectangle 对象内是否包含由 rect 参数指定的 Rectangle 对象。
         * 如果一个 Rectangle 对象完全在另一个 Rectangle 的边界内，我们说第二个 Rectangle 包含第一个 Rectangle。
         * @param rect 所检查的 Rectangle 对象
         * @returns 如果此 Rectangle 对象包含您指定的 Rectangle 对象，则返回 true 值，否则返回 false。
         */
        Rectangle.prototype.containsRect = function (rect) {
            var r1 = rect.x + rect.width;
            var b1 = rect.y + rect.height;
            var r2 = this.x + this.width;
            var b2 = this.y + this.height;
            return (rect.x >= this.x) && (rect.x < r2) && (rect.y >= this.y) && (rect.y < b2) && (r1 > this.x) && (r1 <= r2) && (b1 > this.y) && (b1 <= b2);
        };
        /**
         * 确定在 toCompare 参数中指定的对象是否等于此 Rectangle 对象。
         * 此方法将某个对象的 x、y、width 和 height 属性与此 Rectangle 对象所对应的相同属性进行比较。
         * @param toCompare 要与此 Rectangle 对象进行比较的矩形。
         * @returns 如果对象具有与此 Rectangle 对象完全相同的 x、y、width 和 height 属性值，则返回 true 值，否则返回 false。
         */
        Rectangle.prototype.equals = function (toCompare) {
            if (this === toCompare) {
                return true;
            }
            return this.x === toCompare.x && this.y === toCompare.y
                && this.width === toCompare.width && this.height === toCompare.height;
        };
        /**
         * 增加 Rectangle 对象的大小。此方法与 Rectangle.inflate() 方法类似，只不过它采用 Point 对象作为参数。
         */
        Rectangle.prototype.inflatePoint = function (point) {
            this.inflate(point.x, point.y);
        };
        /**
         * 按指定量调整 Rectangle 对象的位置（由其左上角确定）。
         * @param dx 将 Rectangle 对象的 x 值移动此数量。
         * @param dy 将 Rectangle 对象的 t 值移动此数量。
         */
        Rectangle.prototype.offset = function (dx, dy) {
            this.x += dx;
            this.y += dy;
        };
        /**
         * 将 Point 对象用作参数来调整 Rectangle 对象的位置。此方法与 Rectangle.offset() 方法类似，只不过它采用 Point 对象作为参数。
         * @param point 要用于偏移此 Rectangle 对象的 Point 对象。
         */
        Rectangle.prototype.offsetPoint = function (point) {
            this.offset(point.x, point.y);
        };
        /**
         * 生成并返回一个字符串，该字符串列出 Rectangle 对象的水平位置和垂直位置以及高度和宽度。
         * @returns 一个字符串，它列出了 Rectangle 对象的下列各个属性的值：x、y、width 和 height。
         */
        Rectangle.prototype.toString = function () {
            return "(x=" + this.x + ", y=" + this.y + ", width=" + this.width + ", height=" + this.height + ")";
        };
        /**
         * 通过填充两个矩形之间的水平和垂直空间，将这两个矩形组合在一起以创建一个新的 Rectangle 对象。
         * @param toUnion 要添加到此 Rectangle 对象的 Rectangle 对象。
         * @returns 充当两个矩形的联合的新 Rectangle 对象。
         */
        Rectangle.prototype.union = function (toUnion) {
            var result = this.clone();
            if (toUnion.isEmpty()) {
                return result;
            }
            if (result.isEmpty()) {
                result.copyFrom(toUnion);
                return result;
            }
            var l = Math.min(result.x, toUnion.x);
            var t = Math.min(result.y, toUnion.y);
            result.init(l, t, Math.max(result.right, toUnion.right) - l, Math.max(result.bottom, toUnion.bottom) - t);
            return result;
        };
        /**
         *
         * @param point 点
         * @param pout 输出点
         */
        Rectangle.prototype.clampPoint = function (point, pout) {
            if (pout === void 0) { pout = new feng3d.Vector2(); }
            return pout.copy(point).clamp(this.topLeft, this.bottomRight);
        };
        Object.defineProperty(Rectangle.prototype, "size", {
            /**
             * The size of the Rectangle object, expressed as a Point object with the
             * values of the <code>width</code> and <code>height</code> properties.
             */
            get: function () {
                return new feng3d.Vector2(this.width, this.height);
            },
            enumerable: true,
            configurable: true
        });
        return Rectangle;
    }());
    feng3d.Rectangle = Rectangle;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var Matrix3x3 = /** @class */ (function () {
        /**
         * 构建3x3矩阵
         *
         * @param elements 九个元素的数组
         */
        function Matrix3x3(elements) {
            if (elements === void 0) { elements = [1, 0, 0, 0, 1, 0, 0, 0, 1]; }
            this.elements = elements;
        }
        /**
         * 设置矩阵为单位矩阵
         */
        Matrix3x3.prototype.identity = function () {
            var e = this.elements;
            e[0] = 1;
            e[1] = 0;
            e[2] = 0;
            e[3] = 0;
            e[4] = 1;
            e[5] = 0;
            e[6] = 0;
            e[7] = 0;
            e[8] = 1;
            return this;
        };
        /**
         * 将所有元素设置为0
         */
        Matrix3x3.prototype.setZero = function () {
            var e = this.elements;
            e[0] = 0;
            e[1] = 0;
            e[2] = 0;
            e[3] = 0;
            e[4] = 0;
            e[5] = 0;
            e[6] = 0;
            e[7] = 0;
            e[8] = 0;
            return this;
        };
        /**
         * 根据一个 Vector3 设置矩阵对角元素
         *
         * @param vec3
         */
        Matrix3x3.prototype.setTrace = function (vec3) {
            var e = this.elements;
            e[0] = vec3.x;
            e[4] = vec3.y;
            e[8] = vec3.z;
            return this;
        };
        /**
         * 获取矩阵对角元素
         */
        Matrix3x3.prototype.getTrace = function (target) {
            if (target === void 0) { target = new feng3d.Vector3(); }
            var e = this.elements;
            target.x = e[0];
            target.y = e[4];
            target.z = e[8];
            return target;
        };
        /**
         * 矩阵向量乘法
         *
         * @param v 要乘以的向量
         * @param target 目标保存结果
         */
        Matrix3x3.prototype.vmult = function (v, target) {
            if (target === void 0) { target = new feng3d.Vector3(); }
            var e = this.elements, x = v.x, y = v.y, z = v.z;
            target.x = e[0] * x + e[1] * y + e[2] * z;
            target.y = e[3] * x + e[4] * y + e[5] * z;
            target.z = e[6] * x + e[7] * y + e[8] * z;
            return target;
        };
        /**
         * 矩阵标量乘法
         * @param s
         */
        Matrix3x3.prototype.smult = function (s) {
            for (var i = 0; i < this.elements.length; i++) {
                this.elements[i] *= s;
            }
        };
        /**
         * 矩阵乘法
         * @param  m 要从左边乘的矩阵。
         */
        Matrix3x3.prototype.mmult = function (m, target) {
            if (target === void 0) { target = new Matrix3x3(); }
            for (var i = 0; i < 3; i++) {
                for (var j = 0; j < 3; j++) {
                    var sum = 0.0;
                    for (var k = 0; k < 3; k++) {
                        sum += m.elements[i + k * 3] * this.elements[k + j * 3];
                    }
                    target.elements[i + j * 3] = sum;
                }
            }
            return target;
        };
        /**
         * 缩放矩阵的每一列
         *
         * @param v
         */
        Matrix3x3.prototype.scale = function (v, target) {
            if (target === void 0) { target = new Matrix3x3(); }
            var e = this.elements, t = target.elements;
            for (var i = 0; i !== 3; i++) {
                t[3 * i + 0] = v.x * e[3 * i + 0];
                t[3 * i + 1] = v.y * e[3 * i + 1];
                t[3 * i + 2] = v.z * e[3 * i + 2];
            }
            return target;
        };
        /**
         * 解决Ax = b
         *
         * @param b 右手边
         * @param target 结果
         */
        Matrix3x3.prototype.solve = function (b, target) {
            if (target === void 0) { target = new feng3d.Vector3(); }
            // Construct equations
            var nr = 3; // num rows
            var nc = 4; // num cols
            var eqns = [];
            for (var i = 0; i < nr * nc; i++) {
                eqns.push(0);
            }
            var i, j;
            for (i = 0; i < 3; i++) {
                for (j = 0; j < 3; j++) {
                    eqns[i + nc * j] = this.elements[i + 3 * j];
                }
            }
            eqns[3 + 4 * 0] = b.x;
            eqns[3 + 4 * 1] = b.y;
            eqns[3 + 4 * 2] = b.z;
            // 计算矩阵的右上三角型——高斯消去法
            var n = 3, k = n, np;
            var kp = 4; // num rows
            var p;
            do {
                i = k - n;
                if (eqns[i + nc * i] === 0) {
                    // the pivot is null, swap lines
                    for (j = i + 1; j < k; j++) {
                        if (eqns[i + nc * j] !== 0) {
                            np = kp;
                            do { // do ligne( i ) = ligne( i ) + ligne( k )
                                p = kp - np;
                                eqns[p + nc * i] += eqns[p + nc * j];
                            } while (--np);
                            break;
                        }
                    }
                }
                if (eqns[i + nc * i] !== 0) {
                    for (j = i + 1; j < k; j++) {
                        var multiplier = eqns[i + nc * j] / eqns[i + nc * i];
                        np = kp;
                        do { // do ligne( k ) = ligne( k ) - multiplier * ligne( i )
                            p = kp - np;
                            eqns[p + nc * j] = p <= i ? 0 : eqns[p + nc * j] - eqns[p + nc * i] * multiplier;
                        } while (--np);
                    }
                }
            } while (--n);
            // Get the solution
            target.z = eqns[2 * nc + 3] / eqns[2 * nc + 2];
            target.y = (eqns[1 * nc + 3] - eqns[1 * nc + 2] * target.z) / eqns[1 * nc + 1];
            target.x = (eqns[0 * nc + 3] - eqns[0 * nc + 2] * target.z - eqns[0 * nc + 1] * target.y) / eqns[0 * nc + 0];
            if (isNaN(target.x) || isNaN(target.y) || isNaN(target.z) || target.x === Infinity || target.y === Infinity || target.z === Infinity) {
                throw "Could not solve equation! Got x=[" + target.toString() + "], b=[" + b.toString() + "], A=[" + this.toString() + "]";
            }
            return target;
        };
        /**
         * 获取指定行列元素值
         *
         * @param row
         * @param column
         */
        Matrix3x3.prototype.getElement = function (row, column) {
            return this.elements[column + 3 * row];
        };
        /**
         * 设置指定行列元素值
         *
         * @param row
         * @param column
         * @param value
         */
        Matrix3x3.prototype.setElement = function (row, column, value) {
            this.elements[column + 3 * row] = value;
        };
        /**
         * 将另一个矩阵复制到这个矩阵对象中
         *
         * @param source
         */
        Matrix3x3.prototype.copy = function (source) {
            for (var i = 0; i < source.elements.length; i++) {
                this.elements[i] = source.elements[i];
            }
            return this;
        };
        /**
         * 返回矩阵的字符串表示形式
         */
        Matrix3x3.prototype.toString = function () {
            var r = "";
            var sep = ",";
            for (var i = 0; i < 9; i++) {
                r += this.elements[i] + sep;
            }
            return r;
        };
        /**
         * 逆矩阵
         */
        Matrix3x3.prototype.reverse = function () {
            // Construct equations
            var nr = 3; // num rows
            var nc = 6; // num cols
            var eqns = [];
            for (var i = 0; i < nr * nc; i++) {
                eqns.push(0);
            }
            var i, j;
            for (i = 0; i < 3; i++) {
                for (j = 0; j < 3; j++) {
                    eqns[i + nc * j] = this.elements[i + 3 * j];
                }
            }
            eqns[3 + 6 * 0] = 1;
            eqns[3 + 6 * 1] = 0;
            eqns[3 + 6 * 2] = 0;
            eqns[4 + 6 * 0] = 0;
            eqns[4 + 6 * 1] = 1;
            eqns[4 + 6 * 2] = 0;
            eqns[5 + 6 * 0] = 0;
            eqns[5 + 6 * 1] = 0;
            eqns[5 + 6 * 2] = 1;
            // Compute right upper triangular version of the matrix - Gauss elimination
            var n = 3, k = n, np;
            var kp = nc; // num rows
            var p;
            do {
                i = k - n;
                if (eqns[i + nc * i] === 0) {
                    // the pivot is null, swap lines
                    for (j = i + 1; j < k; j++) {
                        if (eqns[i + nc * j] !== 0) {
                            np = kp;
                            do { // do line( i ) = line( i ) + line( k )
                                p = kp - np;
                                eqns[p + nc * i] += eqns[p + nc * j];
                            } while (--np);
                            break;
                        }
                    }
                }
                if (eqns[i + nc * i] !== 0) {
                    for (j = i + 1; j < k; j++) {
                        var multiplier = eqns[i + nc * j] / eqns[i + nc * i];
                        np = kp;
                        do { // do line( k ) = line( k ) - multiplier * line( i )
                            p = kp - np;
                            eqns[p + nc * j] = p <= i ? 0 : eqns[p + nc * j] - eqns[p + nc * i] * multiplier;
                        } while (--np);
                    }
                }
            } while (--n);
            // eliminate the upper left triangle of the matrix
            i = 2;
            do {
                j = i - 1;
                do {
                    var multiplier = eqns[i + nc * j] / eqns[i + nc * i];
                    np = nc;
                    do {
                        p = nc - np;
                        eqns[p + nc * j] = eqns[p + nc * j] - eqns[p + nc * i] * multiplier;
                    } while (--np);
                } while (j--);
            } while (--i);
            // operations on the diagonal
            i = 2;
            do {
                var multiplier = 1 / eqns[i + nc * i];
                np = nc;
                do {
                    p = nc - np;
                    eqns[p + nc * i] = eqns[p + nc * i] * multiplier;
                } while (--np);
            } while (i--);
            i = 2;
            do {
                j = 2;
                do {
                    p = eqns[nr + j + nc * i];
                    if (isNaN(p) || p === Infinity) {
                        throw "Could not reverse! A=[" + this.toString() + "]";
                    }
                    this.setElement(i, j, p);
                } while (j--);
            } while (i--);
            return this;
        };
        /**
         * 逆矩阵
         */
        Matrix3x3.prototype.reverseTo = function (target) {
            if (target === void 0) { target = new Matrix3x3(); }
            return target.copy(this).reverse();
        };
        /**
         * 从四元数设置矩阵
         *
         * @param q
         */
        Matrix3x3.prototype.setRotationFromQuaternion = function (q) {
            var x = q.x, y = q.y, z = q.z, w = q.w, x2 = x + x, y2 = y + y, z2 = z + z, xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2, e = this.elements;
            e[3 * 0 + 0] = 1 - (yy + zz);
            e[3 * 0 + 1] = xy - wz;
            e[3 * 0 + 2] = xz + wy;
            e[3 * 1 + 0] = xy + wz;
            e[3 * 1 + 1] = 1 - (xx + zz);
            e[3 * 1 + 2] = yz - wx;
            e[3 * 2 + 0] = xz - wy;
            e[3 * 2 + 1] = yz + wx;
            e[3 * 2 + 2] = 1 - (xx + yy);
            return this;
        };
        /**
         * 转置矩阵
         */
        Matrix3x3.prototype.transpose = function () {
            var Mt = this.elements, M = this.elements.concat();
            for (var i = 0; i !== 3; i++) {
                for (var j = 0; j !== 3; j++) {
                    Mt[3 * i + j] = M[3 * j + i];
                }
            }
            return this;
        };
        /**
         * 转置矩阵
         */
        Matrix3x3.prototype.transposeTo = function (target) {
            if (target === void 0) { target = new Matrix3x3(); }
            return target.copy(this).transpose();
        };
        Matrix3x3.prototype.formMatrix4x4 = function (matrix4x4) {
            var arr4 = matrix4x4.rawData;
            var arr3 = this.elements;
            arr3[0] = arr4[0];
            arr3[1] = arr4[1];
            arr3[2] = arr4[2];
            arr3[3] = arr4[4];
            arr3[4] = arr4[5];
            arr3[5] = arr4[6];
            arr3[6] = arr4[8];
            arr3[7] = arr4[9];
            arr3[8] = arr4[10];
            return this;
        };
        /**
         * 转换为数组
         * @param array 数组
         * @param offset 偏移
         */
        Matrix3x3.prototype.toArray = function (array, offset) {
            if (array === void 0) { array = []; }
            if (offset === void 0) { offset = 0; }
            this.elements.forEach(function (v, i) {
                array[offset + i] = v;
            });
            return array;
        };
        return Matrix3x3;
    }());
    feng3d.Matrix3x3 = Matrix3x3;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
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
     *
     * @see https://github.com/mrdoob/three.js/blob/dev/src/math/Matrix4.js
     */
    var Matrix4x4 = /** @class */ (function () {
        /**
         * 创建 Matrix4x4 对象。
         * @param   datas    一个由 16 个数字组成的矢量，其中，每四个元素可以是 4x4 矩阵的一列。
         */
        function Matrix4x4(datas) {
            if (datas)
                this.rawData = datas;
            else {
                this.rawData = [];
                this.identity();
            }
        }
        /**
         * 通过位移旋转缩放重组矩阵
         *
         * @param position 位移
         * @param rotation 旋转，按照指定旋转顺序旋转。
         * @param scale 缩放。
         * @param order 旋转顺序。
         */
        Matrix4x4.recompose = function (position, rotation, scale, order) {
            if (order === void 0) { order = feng3d.defaultRotationOrder; }
            return new Matrix4x4().recompose(position, rotation, scale, order);
        };
        /**
         * 获取位移
         *
         * @param value 用于存储位移信息的向量
         */
        Matrix4x4.prototype.getPosition = function (value) {
            if (value === void 0) { value = new feng3d.Vector3(); }
            value.x = this.rawData[12];
            value.y = this.rawData[13];
            value.z = this.rawData[14];
            return value;
        };
        /**
         * 设置位移
         *
         * @param value 位移
         */
        Matrix4x4.prototype.setPosition = function (value) {
            this.rawData[12] = value.x;
            this.rawData[13] = value.y;
            this.rawData[14] = value.z;
            return this;
        };
        /**
         * 获取欧拉旋转角度。
         *
         * @param rotation 欧拉旋转角度。
         * @param order   绕轴旋转的顺序。
         */
        Matrix4x4.prototype.getRotation = function (rotation, order) {
            if (rotation === void 0) { rotation = new feng3d.Vector3(); }
            if (order === void 0) { order = feng3d.defaultRotationOrder; }
            this.decompose(new feng3d.Vector3(), rotation, new feng3d.Vector3(), order);
            return rotation;
        };
        /**
         * 设置欧拉旋转角度。
         *
         * @param rotation 欧拉旋转角度。
         * @param order 绕轴旋转的顺序。
         */
        Matrix4x4.prototype.setRotation = function (rotation, order) {
            if (order === void 0) { order = feng3d.defaultRotationOrder; }
            var p = new feng3d.Vector3();
            var r = new feng3d.Vector3();
            var s = new feng3d.Vector3();
            this.decompose(p, r, s, order);
            r.copy(rotation);
            this.recompose(p, r, s);
            return this;
        };
        /**
         * 获取缩放值。
         *
         * @param scale 用于存储缩放值的向量。
         */
        Matrix4x4.prototype.getScale = function (scale) {
            if (scale === void 0) { scale = new feng3d.Vector3; }
            var rawData = this.rawData;
            var v = new feng3d.Vector3();
            scale.x = v.set(rawData[0], rawData[1], rawData[2]).length;
            scale.y = v.set(rawData[4], rawData[5], rawData[6]).length;
            scale.z = v.set(rawData[8], rawData[9], rawData[10]).length;
            return scale;
        };
        /**
         * 获取缩放值。
         *
         * @param scale 缩放值。
         */
        Matrix4x4.prototype.setScale = function (scale) {
            var oldS = this.getScale();
            var te = this.rawData;
            var sx = scale.x / oldS.x;
            var sy = scale.y / oldS.y;
            var sz = scale.z / oldS.z;
            te[0] *= sx;
            te[1] *= sx;
            te[2] *= sx;
            te[4] *= sy;
            te[5] *= sy;
            te[6] *= sy;
            te[8] *= sz;
            te[9] *= sz;
            te[10] *= sz;
            return this;
        };
        Object.defineProperty(Matrix4x4.prototype, "determinant", {
            /**
             * 一个用于确定矩阵是否可逆的数字。如果值为0则不可逆。
             */
            get: function () {
                return ( //
                (this.rawData[0] * this.rawData[5] - this.rawData[4] * this.rawData[1]) * (this.rawData[10] * this.rawData[15] - this.rawData[14] * this.rawData[11]) //
                    - (this.rawData[0] * this.rawData[9] - this.rawData[8] * this.rawData[1]) * (this.rawData[6] * this.rawData[15] - this.rawData[14] * this.rawData[7]) //
                    + (this.rawData[0] * this.rawData[13] - this.rawData[12] * this.rawData[1]) * (this.rawData[6] * this.rawData[11] - this.rawData[10] * this.rawData[7]) //
                    + (this.rawData[4] * this.rawData[9] - this.rawData[8] * this.rawData[5]) * (this.rawData[2] * this.rawData[15] - this.rawData[14] * this.rawData[3]) //
                    - (this.rawData[4] * this.rawData[13] - this.rawData[12] * this.rawData[5]) * (this.rawData[2] * this.rawData[11] - this.rawData[10] * this.rawData[3]) //
                    + (this.rawData[8] * this.rawData[13] - this.rawData[12] * this.rawData[9]) * (this.rawData[2] * this.rawData[7] - this.rawData[6] * this.rawData[3]) //
                );
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix4x4.prototype, "forward", {
            /**
             * 前方（+Z轴方向）
             */
            get: function () {
                return this.copyColumnToVector3(2).normalize();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix4x4.prototype, "up", {
            /**
             * 上方（+y轴方向）
             */
            get: function () {
                return this.copyColumnToVector3(1).normalize();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix4x4.prototype, "right", {
            /**
             * 右方（+x轴方向）
             */
            get: function () {
                return this.copyColumnToVector3(0).normalize();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix4x4.prototype, "back", {
            /**
             * 后方（-z轴方向）
             */
            get: function () {
                return this.copyColumnToVector3(2).normalize().negate();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix4x4.prototype, "down", {
            /**
             * 下方（-y轴方向）
             */
            get: function () {
                return this.copyColumnToVector3(1).normalize().negate();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Matrix4x4.prototype, "left", {
            /**
             * 左方（-x轴方向）
             */
            get: function () {
                return this.copyColumnToVector3(0).normalize().negate();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 创建旋转矩阵
         * @param   axis            旋转轴
         * @param   degrees         角度
         */
        Matrix4x4.fromAxisRotate = function (axis, degrees) {
            var n = axis.clone();
            n.normalize();
            var q = degrees * Math.PI / 180;
            var sinq = Math.sin(q);
            var cosq = Math.cos(q);
            var lcosq = 1 - cosq;
            var rotationMat = new Matrix4x4([
                n.x * n.x * lcosq + cosq, n.x * n.y * lcosq + n.z * sinq, n.x * n.z * lcosq - n.y * sinq, 0,
                n.x * n.y * lcosq - n.z * sinq, n.y * n.y * lcosq + cosq, n.y * n.z * lcosq + n.x * sinq, 0,
                n.x * n.z * lcosq + n.y * sinq, n.y * n.z * lcosq - n.x * sinq, n.z * n.z * lcosq + cosq, 0,
                0, 0, 0, 1 //
            ]);
            return rotationMat;
        };
        /**
         * 从欧拉角旋转角度初始化矩阵。
         *
         * @param   rx      用于沿 x 轴旋转对象的角度。
         * @param   ry      用于沿 y 轴旋转对象的角度。
         * @param   rz      用于沿 z 轴旋转对象的角度。
         * @param   order   绕轴旋转的顺序。
         */
        Matrix4x4.fromRotation = function (rx, ry, rz, order) {
            if (order === void 0) { order = feng3d.defaultRotationOrder; }
            return new Matrix4x4().fromRotation(rx, ry, rz, order);
        };
        /**
         * 从四元素初始化矩阵。
         *
         * @param q 四元素
         */
        Matrix4x4.fromQuaternion = function (q) {
            return new Matrix4x4().fromQuaternion(q);
        };
        /**
         * 从欧拉角旋转角度初始化矩阵。
         *
         * @param   rx      用于沿 x 轴旋转对象的角度。
         * @param   ry      用于沿 y 轴旋转对象的角度。
         * @param   rz      用于沿 z 轴旋转对象的角度。
         * @param   order   绕轴旋转的顺序。
         */
        Matrix4x4.prototype.fromRotation = function (rx, ry, rz, order) {
            if (order === void 0) { order = feng3d.defaultRotationOrder; }
            this.recompose(new feng3d.Vector3(), new feng3d.Vector3(rx, ry, rz), new feng3d.Vector3(1, 1, 1), order);
            return this;
        };
        /**
         * 从四元素初始化矩阵。
         *
         * @param q 四元素
         */
        Matrix4x4.prototype.fromQuaternion = function (q) {
            q.toMatrix3D(this);
            return this;
        };
        /**
         * 创建缩放矩阵
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        Matrix4x4.fromScale = function (xScale, yScale, zScale) {
            var rotationMat = new Matrix4x4([
                xScale, 0.0000, 0.0000, 0,
                0.0000, yScale, 0.0000, 0,
                0.0000, 0.0000, zScale, 0,
                0.0000, 0.0000, 0.0000, 1 //
            ]);
            return rotationMat;
        };
        /**
         * 创建位移矩阵
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        Matrix4x4.fromPosition = function (x, y, z) {
            var rotationMat = new Matrix4x4([
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                x, y, z, 1 //
            ]);
            return rotationMat;
        };
        /**
         * 通过将另一个 Matrix4x4 对象与当前 Matrix4x4 对象相乘来后置一个矩阵。
         */
        Matrix4x4.prototype.append = function (lhs) {
            var //
            m111 = this.rawData[0], m121 = this.rawData[4], m131 = this.rawData[8], m141 = this.rawData[12], //
            m112 = this.rawData[1], m122 = this.rawData[5], m132 = this.rawData[9], m142 = this.rawData[13], //
            m113 = this.rawData[2], m123 = this.rawData[6], m133 = this.rawData[10], m143 = this.rawData[14], //
            m114 = this.rawData[3], m124 = this.rawData[7], m134 = this.rawData[11], m144 = this.rawData[15], //
            m211 = lhs.rawData[0], m221 = lhs.rawData[4], m231 = lhs.rawData[8], m241 = lhs.rawData[12], //
            m212 = lhs.rawData[1], m222 = lhs.rawData[5], m232 = lhs.rawData[9], m242 = lhs.rawData[13], //
            m213 = lhs.rawData[2], m223 = lhs.rawData[6], m233 = lhs.rawData[10], m243 = lhs.rawData[14], //
            m214 = lhs.rawData[3], m224 = lhs.rawData[7], m234 = lhs.rawData[11], m244 = lhs.rawData[15];
            this.rawData[0] = m111 * m211 + m112 * m221 + m113 * m231 + m114 * m241;
            this.rawData[1] = m111 * m212 + m112 * m222 + m113 * m232 + m114 * m242;
            this.rawData[2] = m111 * m213 + m112 * m223 + m113 * m233 + m114 * m243;
            this.rawData[3] = m111 * m214 + m112 * m224 + m113 * m234 + m114 * m244;
            this.rawData[4] = m121 * m211 + m122 * m221 + m123 * m231 + m124 * m241;
            this.rawData[5] = m121 * m212 + m122 * m222 + m123 * m232 + m124 * m242;
            this.rawData[6] = m121 * m213 + m122 * m223 + m123 * m233 + m124 * m243;
            this.rawData[7] = m121 * m214 + m122 * m224 + m123 * m234 + m124 * m244;
            this.rawData[8] = m131 * m211 + m132 * m221 + m133 * m231 + m134 * m241;
            this.rawData[9] = m131 * m212 + m132 * m222 + m133 * m232 + m134 * m242;
            this.rawData[10] = m131 * m213 + m132 * m223 + m133 * m233 + m134 * m243;
            this.rawData[11] = m131 * m214 + m132 * m224 + m133 * m234 + m134 * m244;
            this.rawData[12] = m141 * m211 + m142 * m221 + m143 * m231 + m144 * m241;
            this.rawData[13] = m141 * m212 + m142 * m222 + m143 * m232 + m144 * m242;
            this.rawData[14] = m141 * m213 + m142 * m223 + m143 * m233 + m144 * m243;
            this.rawData[15] = m141 * m214 + m142 * m224 + m143 * m234 + m144 * m244;
            console.assert(this.rawData[0] !== NaN && this.rawData[4] !== NaN && this.rawData[8] !== NaN && this.rawData[12] !== NaN);
            return this;
        };
        /**
         * 在 Matrix4x4 对象上后置一个增量旋转。
         * @param   axis            旋转轴
         * @param   degrees         角度
         * @param   pivotPoint      旋转中心点
         */
        Matrix4x4.prototype.appendRotation = function (axis, degrees, pivotPoint) {
            var rotationMat = Matrix4x4.fromAxisRotate(axis, degrees);
            if (pivotPoint != null) {
                this.appendTranslation(-pivotPoint.x, -pivotPoint.y, -pivotPoint.z);
            }
            this.append(rotationMat);
            if (pivotPoint != null) {
                this.appendTranslation(pivotPoint.x, pivotPoint.y, pivotPoint.z);
            }
            return this;
        };
        /**
         * 在 Matrix4x4 对象上后置一个增量缩放，沿 x、y 和 z 轴改变位置。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        Matrix4x4.prototype.appendScale = function (xScale, yScale, zScale) {
            var scaleMat = Matrix4x4.fromScale(xScale, yScale, zScale);
            this.append(scaleMat);
            return this;
        };
        /**
         * 在 Matrix4x4 对象上后置一个增量平移，沿 x、y 和 z 轴重新定位。
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        Matrix4x4.prototype.appendTranslation = function (x, y, z) {
            this.rawData[12] += x;
            this.rawData[13] += y;
            this.rawData[14] += z;
            return this;
        };
        /**
         * 返回一个新 Matrix4x4 对象，它是与当前 Matrix4x4 对象完全相同的副本。
         */
        Matrix4x4.prototype.clone = function () {
            var ret = new Matrix4x4();
            ret.copyFrom(this);
            return ret;
        };
        /**
         * 将 Vector3 对象复制到调用方 Matrix4x4 对象的特定列中。
         * @param   column      副本的目标列。
         * @param   vector3D    要从中复制数据的 Vector3 对象。
         */
        Matrix4x4.prototype.copyColumnFrom = function (column, vector3D) {
            this.rawData[column * 4 + 0] = vector3D.x;
            this.rawData[column * 4 + 1] = vector3D.y;
            this.rawData[column * 4 + 2] = vector3D.z;
            this.rawData[column * 4 + 3] = vector3D.w;
            return this;
        };
        /**
         * 将调用方 Matrix4x4 对象的特定列复制到 Vector3 对象中。
         * @param   column       要从中复制数据的列。
         * @param   vector3D     副本的目标 Vector3 对象。
         */
        Matrix4x4.prototype.copyColumnToVector3 = function (column, vector3D) {
            if (vector3D === void 0) { vector3D = new feng3d.Vector3(); }
            this.copyColumnToVector4(column, feng3d.Vector4.fromVector3(vector3D)).toVector3(vector3D);
            return vector3D;
        };
        /**
         * 将调用方 Matrix4x4 对象的特定列复制到 Vector3 对象中。
         * @param   column       要从中复制数据的列。
         * @param   vector3D     副本的目标 Vector3 对象。
         */
        Matrix4x4.prototype.copyColumnToVector4 = function (column, vector3D) {
            if (vector3D === void 0) { vector3D = new feng3d.Vector4(); }
            vector3D.x = this.rawData[column * 4 + 0];
            vector3D.y = this.rawData[column * 4 + 1];
            vector3D.z = this.rawData[column * 4 + 2];
            vector3D.w = this.rawData[column * 4 + 3];
            return vector3D;
        };
        /**
         * 将源 Matrix4x4 对象中的所有矩阵数据复制到调用方 Matrix4x4 对象中。
         * @param   sourceMatrix3D      要从中复制数据的 Matrix4x4 对象。
         */
        Matrix4x4.prototype.copyFrom = function (sourceMatrix3D) {
            for (var i = 0; i < 16; i++) {
                this.rawData[i] = sourceMatrix3D.rawData[i];
            }
            return this;
        };
        /**
         * 将源 Vector 对象中的所有矢量数据复制到调用方 Matrix4x4 对象中。利用可选索引参数，您可以选择矢量中的任何起始文字插槽。
         * @param   vector      要从中复制数据的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        Matrix4x4.prototype.copyRawDataFrom = function (vector, index, transpose) {
            if (index === void 0) { index = 0; }
            if (transpose === void 0) { transpose = false; }
            if (vector.length - index < 16) {
                throw new Error("vector参数数据长度不够！");
            }
            if (transpose) {
                this.transpose();
            }
            for (var i = 0; i < 16; i++) {
                this.rawData[i] = vector[index + i];
            }
            if (transpose) {
                this.transpose();
            }
            return this;
        };
        /**
         * 将调用方 Matrix4x4 对象中的所有矩阵数据复制到提供的矢量中。
         * @param   vector      要将数据复制到的 Vector 对象。
         * @param   index       vector中的起始位置
         * @param   transpose   是否转置当前矩阵
         */
        Matrix4x4.prototype.copyRawDataTo = function (vector, index, transpose) {
            if (index === void 0) { index = 0; }
            if (transpose === void 0) { transpose = false; }
            if (transpose) {
                this.transpose();
            }
            for (var i = 0; i < 16; i++) {
                vector[i + index] = this.rawData[i];
            }
            if (transpose) {
                this.transpose();
            }
            return this;
        };
        /**
         * 将 Vector3 对象复制到调用方 Matrix4x4 对象的特定行中。
         * @param   row         要将数据复制到的行。
         * @param   vector3D    要从中复制数据的 Vector3 对象。
         */
        Matrix4x4.prototype.copyRowFrom = function (row, vector3D) {
            this.rawData[row + 4 * 0] = vector3D.x;
            this.rawData[row + 4 * 1] = vector3D.y;
            this.rawData[row + 4 * 2] = vector3D.z;
            this.rawData[row + 4 * 3] = vector3D.w;
            return this;
        };
        /**
         * 将调用方 Matrix4x4 对象的特定行复制到 Vector3 对象中。
         * @param   row         要从中复制数据的行。
         * @param   vector3D    将作为数据复制目的地的 Vector3 对象。
         */
        Matrix4x4.prototype.copyRowTo = function (row, vector3D) {
            vector3D.x = this.rawData[row + 4 * 0];
            vector3D.y = this.rawData[row + 4 * 1];
            vector3D.z = this.rawData[row + 4 * 2];
            vector3D.w = this.rawData[row + 4 * 3];
            return this;
        };
        /**
         * 拷贝当前矩阵
         * @param   dest    目标矩阵
         */
        Matrix4x4.prototype.copyToMatrix3D = function (dest) {
            dest.rawData = this.rawData.concat();
            return this;
        };
        /**
         * 通过位移旋转缩放重组矩阵
         *
         * @param position 位移
         * @param rotation 旋转角度，按照指定旋转顺序旋转。
         * @param scale 缩放。
         * @param order 旋转顺序。
         */
        Matrix4x4.prototype.recompose = function (position, rotation, scale, order) {
            if (order === void 0) { order = feng3d.defaultRotationOrder; }
            this.identity();
            var te = this.rawData;
            //
            rotation = rotation.scaleNumberTo(Math.DEG2RAD);
            var px = position.x;
            var py = position.y;
            var pz = position.z;
            var rx = rotation.x;
            var ry = rotation.y;
            var rz = rotation.z;
            var sx = scale.x;
            var sy = scale.y;
            var sz = scale.z;
            //
            te[12] = px;
            te[13] = py;
            te[14] = pz;
            //
            var cosX = Math.cos(rx), sinX = Math.sin(rx);
            var cosY = Math.cos(ry), sinY = Math.sin(ry);
            var cosZ = Math.cos(rz), sinZ = Math.sin(rz);
            if (order === feng3d.RotationOrder.XYZ) {
                var ae = cosX * cosZ, af = cosX * sinZ, be = sinX * cosZ, bf = sinX * sinZ;
                te[0] = cosY * cosZ;
                te[4] = -cosY * sinZ;
                te[8] = sinY;
                te[1] = af + be * sinY;
                te[5] = ae - bf * sinY;
                te[9] = -sinX * cosY;
                te[2] = bf - ae * sinY;
                te[6] = be + af * sinY;
                te[10] = cosX * cosY;
            }
            else if (order === feng3d.RotationOrder.YXZ) {
                var ce = cosY * cosZ, cf = cosY * sinZ, de = sinY * cosZ, df = sinY * sinZ;
                te[0] = ce + df * sinX;
                te[4] = de * sinX - cf;
                te[8] = cosX * sinY;
                te[1] = cosX * sinZ;
                te[5] = cosX * cosZ;
                te[9] = -sinX;
                te[2] = cf * sinX - de;
                te[6] = df + ce * sinX;
                te[10] = cosX * cosY;
            }
            else if (order === feng3d.RotationOrder.ZXY) {
                var ce = cosY * cosZ, cf = cosY * sinZ, de = sinY * cosZ, df = sinY * sinZ;
                te[0] = ce - df * sinX;
                te[4] = -cosX * sinZ;
                te[8] = de + cf * sinX;
                te[1] = cf + de * sinX;
                te[5] = cosX * cosZ;
                te[9] = df - ce * sinX;
                te[2] = -cosX * sinY;
                te[6] = sinX;
                te[10] = cosX * cosY;
            }
            else if (order === feng3d.RotationOrder.ZYX) {
                var ae = cosX * cosZ, af = cosX * sinZ, be = sinX * cosZ, bf = sinX * sinZ;
                te[0] = cosY * cosZ;
                te[4] = be * sinY - af;
                te[8] = ae * sinY + bf;
                te[1] = cosY * sinZ;
                te[5] = bf * sinY + ae;
                te[9] = af * sinY - be;
                te[2] = -sinY;
                te[6] = sinX * cosY;
                te[10] = cosX * cosY;
            }
            else if (order === feng3d.RotationOrder.YZX) {
                var ac = cosX * cosY, ad = cosX * sinY, bc = sinX * cosY, bd = sinX * sinY;
                te[0] = cosY * cosZ;
                te[4] = bd - ac * sinZ;
                te[8] = bc * sinZ + ad;
                te[1] = sinZ;
                te[5] = cosX * cosZ;
                te[9] = -sinX * cosZ;
                te[2] = -sinY * cosZ;
                te[6] = ad * sinZ + bc;
                te[10] = ac - bd * sinZ;
            }
            else if (order === feng3d.RotationOrder.XZY) {
                var ac = cosX * cosY, ad = cosX * sinY, bc = sinX * cosY, bd = sinX * sinY;
                te[0] = cosY * cosZ;
                te[4] = -sinZ;
                te[8] = sinY * cosZ;
                te[1] = ac * sinZ + bd;
                te[5] = cosX * cosZ;
                te[9] = ad * sinZ - bc;
                te[2] = bc * sinZ - ad;
                te[6] = sinX * cosZ;
                te[10] = bd * sinZ + ac;
            }
            else {
                console.error("\u521D\u59CB\u5316\u77E9\u9635\u65F6\u9519\u8BEF\u65CB\u8F6C\u987A\u5E8F " + order);
            }
            //
            te[0] *= sx;
            te[1] *= sx;
            te[2] *= sx;
            te[4] *= sy;
            te[5] *= sy;
            te[6] *= sy;
            te[8] *= sz;
            te[9] *= sz;
            te[10] *= sz;
            return this;
        };
        /**
         * 把矩阵分解为位移旋转缩放。
         *
         * @param position 位移
         * @param rotation 旋转角度，按照指定旋转顺序旋转。
         * @param scale 缩放。
         * @param order 旋转顺序。
         */
        Matrix4x4.prototype.decompose = function (position, rotation, scale, order) {
            if (position === void 0) { position = new feng3d.Vector3(); }
            if (rotation === void 0) { rotation = new feng3d.Vector3(); }
            if (scale === void 0) { scale = new feng3d.Vector3(); }
            if (order === void 0) { order = feng3d.defaultRotationOrder; }
            var clamp = Math.clamp;
            //
            var rawData = this.rawData;
            var m11 = rawData[0], m12 = rawData[4], m13 = rawData[8];
            var m21 = rawData[1], m22 = rawData[5], m23 = rawData[9];
            var m31 = rawData[2], m32 = rawData[6], m33 = rawData[10];
            //
            position.x = rawData[12];
            position.y = rawData[13];
            position.z = rawData[14];
            //
            scale.x = Math.sqrt(m11 * m11 + m21 * m21 + m31 * m31);
            m11 /= scale.x;
            m21 /= scale.x;
            m31 /= scale.x;
            scale.y = Math.sqrt(m12 * m12 + m22 * m22 + m32 * m32);
            m12 /= scale.y;
            m22 /= scale.y;
            m32 /= scale.y;
            scale.z = Math.sqrt(m13 * m13 + m23 * m23 + m33 * m33);
            m13 /= scale.z;
            m23 /= scale.z;
            m33 /= scale.z;
            //
            if (order === feng3d.RotationOrder.XYZ) {
                rotation.y = Math.asin(clamp(m13, -1, 1));
                if (Math.abs(m13) < 0.9999999) {
                    rotation.x = Math.atan2(-m23, m33);
                    rotation.z = Math.atan2(-m12, m11);
                }
                else {
                    rotation.x = Math.atan2(m32, m22);
                    rotation.z = 0;
                }
            }
            else if (order === feng3d.RotationOrder.YXZ) {
                rotation.x = Math.asin(-clamp(m23, -1, 1));
                if (Math.abs(m23) < 0.9999999) {
                    rotation.y = Math.atan2(m13, m33);
                    rotation.z = Math.atan2(m21, m22);
                }
                else {
                    rotation.y = Math.atan2(-m31, m11);
                    rotation.z = 0;
                }
            }
            else if (order === feng3d.RotationOrder.ZXY) {
                rotation.x = Math.asin(clamp(m32, -1, 1));
                if (Math.abs(m32) < 0.9999999) {
                    rotation.y = Math.atan2(-m31, m33);
                    rotation.z = Math.atan2(-m12, m22);
                }
                else {
                    rotation.y = 0;
                    rotation.z = Math.atan2(m21, m11);
                }
            }
            else if (order === feng3d.RotationOrder.ZYX) {
                rotation.y = Math.asin(-clamp(m31, -1, 1));
                if (Math.abs(m31) < 0.9999999) {
                    rotation.x = Math.atan2(m32, m33);
                    rotation.z = Math.atan2(m21, m11);
                }
                else {
                    rotation.x = 0;
                    rotation.z = Math.atan2(-m12, m22);
                }
            }
            else if (order === feng3d.RotationOrder.YZX) {
                rotation.z = Math.asin(clamp(m21, -1, 1));
                if (Math.abs(m21) < 0.9999999) {
                    rotation.x = Math.atan2(-m23, m22);
                    rotation.y = Math.atan2(-m31, m11);
                }
                else {
                    rotation.x = 0;
                    rotation.y = Math.atan2(m13, m33);
                }
            }
            else if (order === feng3d.RotationOrder.XZY) {
                rotation.z = Math.asin(-clamp(m12, -1, 1));
                if (Math.abs(m12) < 0.9999999) {
                    rotation.x = Math.atan2(m32, m22);
                    rotation.y = Math.atan2(m13, m11);
                }
                else {
                    rotation.x = Math.atan2(-m23, m33);
                    rotation.y = 0;
                }
            }
            else {
                console.error("\u521D\u59CB\u5316\u77E9\u9635\u65F6\u9519\u8BEF\u65CB\u8F6C\u987A\u5E8F " + order);
            }
            rotation.scaleNumber(Math.RAD2DEG);
            return [position, rotation, scale];
        };
        /**
         * 使用不含平移元素的转换矩阵将 Vector3 对象从一个空间坐标转换到另一个空间坐标。
         * @param   v   一个容纳要转换的坐标的 Vector3 对象。
         * @return  一个包含转换后的坐标的 Vector3 对象。
         */
        Matrix4x4.prototype.deltaTransformVector = function (v, vout) {
            if (vout === void 0) { vout = new feng3d.Vector3(); }
            var v4 = feng3d.Vector4.fromVector3(v, 0);
            //
            this.transformVector4(v4, v4);
            //
            v4.toVector3(vout);
            return vout;
        };
        /**
         * 将当前矩阵转换为恒等或单位矩阵。
         */
        Matrix4x4.prototype.identity = function () {
            var r = this.rawData;
            r[1] = 0;
            r[2] = 0;
            r[3] = 0;
            r[4] = 0;
            r[6] = 0;
            r[7] = 0;
            r[8] = 0;
            r[9] = 0;
            r[11] = 0;
            r[12] = 0;
            r[13] = 0;
            r[14] = 0;
            r[0] = 1;
            r[5] = 1;
            r[10] = 1;
            r[15] = 1;
            return this;
        };
        /**
         * 反转当前矩阵。逆矩阵
         * @return      如果成功反转矩阵，则返回 该矩阵。
         */
        Matrix4x4.prototype.invert = function () {
            var d = this.determinant;
            if (d == 0) {
                console.error("无法获取逆矩阵");
                return this;
            }
            d = 1 / d;
            var r = this.rawData;
            var m11 = r[0];
            var m21 = r[4];
            var m31 = r[8];
            var m41 = r[12];
            var m12 = r[1];
            var m22 = r[5];
            var m32 = r[9];
            var m42 = r[13];
            var m13 = r[2];
            var m23 = r[6];
            var m33 = r[10];
            var m43 = r[14];
            var m14 = r[3];
            var m24 = r[7];
            var m34 = r[11];
            var m44 = r[15];
            r[0] = d * (m22 * (m33 * m44 - m43 * m34) - m32 * (m23 * m44 - m43 * m24) + m42 * (m23 * m34 - m33 * m24));
            r[1] = -d * (m12 * (m33 * m44 - m43 * m34) - m32 * (m13 * m44 - m43 * m14) + m42 * (m13 * m34 - m33 * m14));
            r[2] = d * (m12 * (m23 * m44 - m43 * m24) - m22 * (m13 * m44 - m43 * m14) + m42 * (m13 * m24 - m23 * m14));
            r[3] = -d * (m12 * (m23 * m34 - m33 * m24) - m22 * (m13 * m34 - m33 * m14) + m32 * (m13 * m24 - m23 * m14));
            r[4] = -d * (m21 * (m33 * m44 - m43 * m34) - m31 * (m23 * m44 - m43 * m24) + m41 * (m23 * m34 - m33 * m24));
            r[5] = d * (m11 * (m33 * m44 - m43 * m34) - m31 * (m13 * m44 - m43 * m14) + m41 * (m13 * m34 - m33 * m14));
            r[6] = -d * (m11 * (m23 * m44 - m43 * m24) - m21 * (m13 * m44 - m43 * m14) + m41 * (m13 * m24 - m23 * m14));
            r[7] = d * (m11 * (m23 * m34 - m33 * m24) - m21 * (m13 * m34 - m33 * m14) + m31 * (m13 * m24 - m23 * m14));
            r[8] = d * (m21 * (m32 * m44 - m42 * m34) - m31 * (m22 * m44 - m42 * m24) + m41 * (m22 * m34 - m32 * m24));
            r[9] = -d * (m11 * (m32 * m44 - m42 * m34) - m31 * (m12 * m44 - m42 * m14) + m41 * (m12 * m34 - m32 * m14));
            r[10] = d * (m11 * (m22 * m44 - m42 * m24) - m21 * (m12 * m44 - m42 * m14) + m41 * (m12 * m24 - m22 * m14));
            r[11] = -d * (m11 * (m22 * m34 - m32 * m24) - m21 * (m12 * m34 - m32 * m14) + m31 * (m12 * m24 - m22 * m14));
            r[12] = -d * (m21 * (m32 * m43 - m42 * m33) - m31 * (m22 * m43 - m42 * m23) + m41 * (m22 * m33 - m32 * m23));
            r[13] = d * (m11 * (m32 * m43 - m42 * m33) - m31 * (m12 * m43 - m42 * m13) + m41 * (m12 * m33 - m32 * m13));
            r[14] = -d * (m11 * (m22 * m43 - m42 * m23) - m21 * (m12 * m43 - m42 * m13) + m41 * (m12 * m23 - m22 * m13));
            r[15] = d * (m11 * (m22 * m33 - m32 * m23) - m21 * (m12 * m33 - m32 * m13) + m31 * (m12 * m23 - m22 * m13));
            return this;
        };
        /**
         * 通过将当前 Matrix4x4 对象与另一个 Matrix4x4 对象相乘来前置一个矩阵。得到的结果将合并两个矩阵转换。
         * @param   rhs     个右侧矩阵，它与当前 Matrix4x4 对象相乘。
         */
        Matrix4x4.prototype.prepend = function (rhs) {
            var mat = this.clone();
            this.copyFrom(rhs);
            this.append(mat);
            return this;
        };
        /**
         * 在 Matrix4x4 对象上前置一个增量旋转。在将 Matrix4x4 对象应用于显示对象时，矩阵会在 Matrix4x4 对象中先执行旋转，然后再执行其他转换。
         * @param   axis        旋转的轴或方向。常见的轴为 X_AXIS (Vector3(1,0,0))、Y_AXIS (Vector3(0,1,0)) 和 Z_AXIS (Vector3(0,0,1))。此矢量的长度应为 1。
         * @param   degrees     旋转的角度。
         * @param   pivotPoint  一个用于确定旋转中心的点。对象的默认轴点为该对象的注册点。
         */
        Matrix4x4.prototype.prependRotation = function (axis, degrees, pivotPoint) {
            if (pivotPoint === void 0) { pivotPoint = new feng3d.Vector3(); }
            var rotationMat = Matrix4x4.fromAxisRotate(axis, degrees);
            this.prepend(rotationMat);
            return this;
        };
        /**
         * 在 Matrix4x4 对象上前置一个增量缩放，沿 x、y 和 z 轴改变位置。在将 Matrix4x4 对象应用于显示对象时，矩阵会在 Matrix4x4 对象中先执行缩放更改，然后再执行其他转换。
         * @param   xScale      用于沿 x 轴缩放对象的乘数。
         * @param   yScale      用于沿 y 轴缩放对象的乘数。
         * @param   zScale      用于沿 z 轴缩放对象的乘数。
         */
        Matrix4x4.prototype.prependScale = function (xScale, yScale, zScale) {
            var scaleMat = Matrix4x4.fromScale(xScale, yScale, zScale);
            this.prepend(scaleMat);
            return this;
        };
        Matrix4x4.prototype.prependScale1 = function (xScale, yScale, zScale) {
            var rawData = this.rawData;
            rawData[0] *= xScale;
            rawData[1] *= xScale;
            rawData[2] *= xScale;
            rawData[4] *= yScale;
            rawData[5] *= yScale;
            rawData[6] *= yScale;
            rawData[8] *= zScale;
            rawData[9] *= zScale;
            rawData[10] *= zScale;
            return this;
        };
        /**
         * 在 Matrix4x4 对象上前置一个增量平移，沿 x、y 和 z 轴重新定位。在将 Matrix4x4 对象应用于显示对象时，矩阵会在 Matrix4x4 对象中先执行平移更改，然后再执行其他转换。
         * @param   x   沿 x 轴的增量平移。
         * @param   y   沿 y 轴的增量平移。
         * @param   z   沿 z 轴的增量平移。
         */
        Matrix4x4.prototype.prependTranslation = function (x, y, z) {
            var translationMat = Matrix4x4.fromPosition(x, y, z);
            this.prepend(translationMat);
            return this;
        };
        /**
         * X轴方向移动
         * @param distance  移动距离
         */
        Matrix4x4.prototype.moveRight = function (distance) {
            var direction = this.right;
            direction.scaleNumber(distance);
            this.setPosition(this.getPosition().addTo(direction));
            return this;
        };
        /**
         * Y轴方向移动
         * @param distance  移动距离
         */
        Matrix4x4.prototype.moveUp = function (distance) {
            var direction = this.up;
            direction.scaleNumber(distance);
            this.setPosition(this.getPosition().addTo(direction));
            return this;
        };
        /**
         * Z轴方向移动
         * @param distance  移动距离
         */
        Matrix4x4.prototype.moveForward = function (distance) {
            var direction = this.forward;
            direction.scaleNumber(distance);
            this.setPosition(this.getPosition().addTo(direction));
            return this;
        };
        /**
         * 使用转换矩阵将 Vector3 对象从一个空间坐标转换到另一个空间坐标。
         * @param   vin   一个容纳要转换的坐标的 Vector3 对象。
         * @return  一个包含转换后的坐标的 Vector3 对象。
         */
        Matrix4x4.prototype.transformVector = function (vin, vout) {
            if (vout === void 0) { vout = new feng3d.Vector3(); }
            this.transformVector4(feng3d.Vector4.fromVector3(vin, 1)).toVector3(vout);
            return vout;
        };
        /**
         * 使用转换矩阵将 Vector3 对象从一个空间坐标转换到另一个空间坐标。
         * @param   vin   一个容纳要转换的坐标的 Vector3 对象。
         * @return  一个包含转换后的坐标的 Vector3 对象。
         */
        Matrix4x4.prototype.transformVector4 = function (vin, vout) {
            if (vout === void 0) { vout = new feng3d.Vector4(); }
            var x = vin.x;
            var y = vin.y;
            var z = vin.z;
            var w = vin.w;
            vout.x = x * this.rawData[0] + y * this.rawData[4] + z * this.rawData[8] + w * this.rawData[12];
            vout.y = x * this.rawData[1] + y * this.rawData[5] + z * this.rawData[9] + w * this.rawData[13];
            vout.z = x * this.rawData[2] + y * this.rawData[6] + z * this.rawData[10] + w * this.rawData[14];
            vout.w = x * this.rawData[3] + y * this.rawData[7] + z * this.rawData[11] + w * this.rawData[15];
            return vout;
        };
        /**
         * 使用转换矩阵将由数字构成的矢量从一个空间坐标转换到另一个空间坐标。
         * @param   vin     一个由多个数字组成的矢量，其中每三个数字构成一个要转换的 3D 坐标 (x,y,z)。
         * @param   vout    一个由多个数字组成的矢量，其中每三个数字构成一个已转换的 3D 坐标 (x,y,z)。
         */
        Matrix4x4.prototype.transformVectors = function (vin, vout) {
            var vec = new feng3d.Vector3();
            for (var i = 0; i < vin.length; i += 3) {
                vec.set(vin[i], vin[i + 1], vin[i + 2]);
                vec = this.transformVector(vec);
                vout[i] = vec.x;
                vout[i + 1] = vec.y;
                vout[i + 2] = vec.z;
            }
        };
        Matrix4x4.prototype.transformRotation = function (vin, vout) {
            //转换旋转
            var rotationMatrix3d = Matrix4x4.fromRotation(vin.x, vin.y, vin.z);
            rotationMatrix3d.append(this);
            var newrotation = rotationMatrix3d.decompose()[1];
            var v = Math.round((newrotation.x - vin.x) / 180);
            if (v % 2 != 0) {
                newrotation.x += 180;
                newrotation.y = 180 - newrotation.y;
                newrotation.z += 180;
            }
            //
            var toRound = function (a, b, c) {
                if (c === void 0) { c = 360; }
                return Math.round((b - a) / c) * c + a;
            };
            newrotation.x = toRound(newrotation.x, vin.x);
            newrotation.y = toRound(newrotation.y, vin.y);
            newrotation.z = toRound(newrotation.z, vin.z);
            //
            vout = vout || new feng3d.Vector3();
            vout.x = newrotation.x;
            vout.y = newrotation.y;
            vout.z = newrotation.z;
            return vout;
        };
        /**
         * 将当前 Matrix4x4 对象转换为一个矩阵，并将互换其中的行和列。
         */
        Matrix4x4.prototype.transpose = function () {
            var swap;
            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < i; j++) {
                    swap = this.rawData[i * 4 + j];
                    this.rawData[i * 4 + j] = this.rawData[j * 4 + i];
                    this.rawData[j * 4 + i] = swap;
                }
            }
            return this;
        };
        /**
         * 比较矩阵是否相等
         */
        Matrix4x4.prototype.equals = function (matrix3D, precision) {
            if (precision === void 0) { precision = Math.PRECISION; }
            var r2 = matrix3D.rawData;
            for (var i = 0; i < 16; ++i) {
                if (!Math.equals(this.rawData[i] - r2[i], 0, precision))
                    return false;
            }
            return true;
        };
        /**
         * 看向目标位置
         * @param target    目标位置
         * @param upAxis    向上朝向
         */
        Matrix4x4.prototype.lookAt = function (target, upAxis) {
            //获取位移，缩放，在变换过程位移与缩放不变
            var vec = this.decompose();
            var position = vec[0];
            var scale = vec[2];
            //
            var xAxis = new feng3d.Vector3();
            var yAxis = new feng3d.Vector3();
            var zAxis = new feng3d.Vector3();
            upAxis = upAxis || feng3d.Vector3.Y_AXIS;
            zAxis.x = target.x - position.x;
            zAxis.y = target.y - position.y;
            zAxis.z = target.z - position.z;
            zAxis.normalize();
            xAxis.x = upAxis.y * zAxis.z - upAxis.z * zAxis.y;
            xAxis.y = upAxis.z * zAxis.x - upAxis.x * zAxis.z;
            xAxis.z = upAxis.x * zAxis.y - upAxis.y * zAxis.x;
            xAxis.normalize();
            if (xAxis.lengthSquared < .005) {
                xAxis.x = upAxis.y;
                xAxis.y = upAxis.x;
                xAxis.z = 0;
                xAxis.normalize();
            }
            yAxis.x = zAxis.y * xAxis.z - zAxis.z * xAxis.y;
            yAxis.y = zAxis.z * xAxis.x - zAxis.x * xAxis.z;
            yAxis.z = zAxis.x * xAxis.y - zAxis.y * xAxis.x;
            this.rawData[0] = scale.x * xAxis.x;
            this.rawData[1] = scale.x * xAxis.y;
            this.rawData[2] = scale.x * xAxis.z;
            this.rawData[3] = 0;
            this.rawData[4] = scale.y * yAxis.x;
            this.rawData[5] = scale.y * yAxis.y;
            this.rawData[6] = scale.y * yAxis.z;
            this.rawData[7] = 0;
            this.rawData[8] = scale.z * zAxis.x;
            this.rawData[9] = scale.z * zAxis.y;
            this.rawData[10] = scale.z * zAxis.z;
            this.rawData[11] = 0;
            this.rawData[12] = position.x;
            this.rawData[13] = position.y;
            this.rawData[14] = position.z;
            this.rawData[15] = 1;
            return this;
        };
        /**
         * 获取XYZ轴中最大缩放值
         */
        Matrix4x4.prototype.getMaxScaleOnAxis = function () {
            var te = this.rawData;
            var scaleXSq = te[0] * te[0] + te[1] * te[1] + te[2] * te[2];
            var scaleYSq = te[4] * te[4] + te[5] * te[5] + te[6] * te[6];
            var scaleZSq = te[8] * te[8] + te[9] * te[9] + te[10] * te[10];
            return Math.sqrt(Math.max(scaleXSq, scaleYSq, scaleZSq));
        };
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
        Matrix4x4.prototype.setOrtho = function (left, right, top, bottom, near, far) {
            var r = this.rawData;
            r[0] = 2 / (right - left);
            r[4] = 0; /**/
            r[8] = 0; /**/
            r[12] = -(right + left) / (right - left); // 
            r[1] = 0; /**/
            r[5] = 2 / (top - bottom);
            r[9] = 0; /**/
            r[13] = -(top + bottom) / (top - bottom); // 
            r[2] = 0; /**/
            r[6] = 0; /**/
            r[10] = 2 / (far - near);
            r[14] = -(far + near) / (far - near); //
            r[3] = 0; /**/
            r[7] = 0; /**/
            r[11] = 0; /**/
            r[15] = 1; //
            return this;
        };
        /**
         * 初始化透视投影矩阵
         * @param fov 垂直视角，视锥体顶面和底面间的夹角，必须大于0 （角度）
         * @param aspect 近裁剪面的宽高比
         * @param near 视锥体近边界
         * @param far 视锥体远边界
         *
         * 视锥体的八个顶点分别被投影到立方体 [(-1, -1, -1), (1, 1, 1)] 八个顶点上
         */
        Matrix4x4.prototype.setPerspectiveFromFOV = function (fov, aspect, near, far) {
            var r = this.rawData;
            var tanfov2 = Math.tan(fov * Math.PI / 360);
            r[0] = 1 / (aspect * tanfov2);
            r[4] = 0; /**/
            r[8] = 0; /**/
            r[12] = 0; // 
            r[1] = 0; /**/
            r[5] = 1 / tanfov2;
            r[9] = 0; /**/
            r[13] = 0; // 
            r[2] = 0; /**/
            r[6] = 0; /**/
            r[10] = (far + near) / (far - near);
            r[14] = -2 * (far * near) / (far - near); //
            r[3] = 0; /**/
            r[7] = 0; /**/
            r[11] = 1; /**/
            r[15] = 0; //
            return this;
        };
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
        Matrix4x4.prototype.setPerspective = function (left, right, top, bottom, near, far) {
            var r = this.rawData;
            r[0] = 2 * near / (right - left);
            r[4] = 0; /**/
            r[8] = 0; /**/
            r[12] = 0; // 
            r[1] = 0; /**/
            r[5] = 2 * near / (top - bottom);
            r[9] = 0; /**/
            r[13] = 0; // 
            r[2] = 0; /**/
            r[6] = 0; /**/
            r[10] = (far + near) / (far - near);
            r[14] = -2 * (far * near) / (far - near); //
            r[3] = 0; /**/
            r[7] = 0; /**/
            r[11] = 1; /**/
            r[15] = 0; //
            return this;
        };
        /**
         * 转换为数组
         * @param array 数组
         * @param offset 偏移
         */
        Matrix4x4.prototype.toArray = function (array, offset) {
            if (array === void 0) { array = []; }
            if (offset === void 0) { offset = 0; }
            this.rawData.forEach(function (v, i) {
                array[offset + i] = v;
            });
            return array;
        };
        /**
         * 以字符串返回矩阵的值
         */
        Matrix4x4.prototype.toString = function () {
            return "Matrix4x4 [" + this.rawData.toString() + "]";
        };
        /**
         * 用于运算临时变量
         */
        Matrix4x4.RAW_DATA_CONTAINER = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1 //
        ];
        __decorate([
            feng3d.serialize
        ], Matrix4x4.prototype, "rawData", void 0);
        return Matrix4x4;
    }());
    feng3d.Matrix4x4 = Matrix4x4;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 可用于表示旋转的四元数对象
     */
    var Quaternion = /** @class */ (function () {
        /**
         * 四元数描述三维空间中的旋转。四元数的数学定义为Q = x*i + y*j + z*k + w，其中(i,j,k)为虚基向量。(x,y,z)可以看作是一个与旋转轴相关的向量，而实际的乘法器w与旋转量相关。
         *
         * @param x 虚基向量i的乘子
         * @param y 虚基向量j的乘子
         * @param z 虚基向量k的乘子
         * @param w 实部的乘数
         */
        function Quaternion(x, y, z, w) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (z === void 0) { z = 0; }
            if (w === void 0) { w = 1; }
            /**
             * 虚基向量i的乘子
             */
            this.x = 0;
            /**
             * 虚基向量j的乘子
             */
            this.y = 0;
            /**
             * 虚基向量k的乘子
             */
            this.z = 0;
            /**
             * 实部的乘数
             */
            this.w = 1;
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
        }
        Quaternion.fromArray = function (array, offset) {
            if (offset === void 0) { offset = 0; }
            return new Quaternion().fromArray(array, offset);
        };
        /**
         * 随机四元数
         */
        Quaternion.random = function () {
            return new Quaternion().fromEulerAngles(Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random());
        };
        Object.defineProperty(Quaternion.prototype, "magnitude", {
            /**
             * 返回四元数对象的大小
             */
            get: function () {
                return Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 设置四元数的值。
         *
         * @param x 虚基向量i的乘子
         * @param y 虚基向量j的乘子
         * @param z 虚基向量k的乘子
         * @param w 实部的乘数
         */
        Quaternion.prototype.set = function (x, y, z, w) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            if (z === void 0) { z = 0; }
            if (w === void 0) { w = 1; }
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
            return this;
        };
        Quaternion.prototype.fromArray = function (array, offset) {
            if (offset === void 0) { offset = 0; }
            this.x = array[offset];
            this.y = array[offset + 1];
            this.z = array[offset + 2];
            this.w = array[offset + 3];
            return this;
        };
        /**
         * 转换为数组
         *
         * @param array
         * @param offset
         */
        Quaternion.prototype.toArray = function (array, offset) {
            if (offset === void 0) { offset = 0; }
            array = array || [];
            array[offset] = this.x;
            array[offset + 1] = this.y;
            array[offset + 2] = this.z;
            array[offset + 3] = this.w;
            return array;
        };
        /**
         * 四元数乘法
         *
         * @param q
         * @param this
         */
        Quaternion.prototype.mult = function (q) {
            var ax = this.x, ay = this.y, az = this.z, aw = this.w, bx = q.x, by = q.y, bz = q.z, bw = q.w;
            this.x = ax * bw + aw * bx + ay * bz - az * by;
            this.y = ay * bw + aw * by + az * bx - ax * bz;
            this.z = az * bw + aw * bz + ax * by - ay * bx;
            this.w = aw * bw - ax * bx - ay * by - az * bz;
            return this;
        };
        /**
         * 四元数乘法
         *
         * @param q
         * @param target
         */
        Quaternion.prototype.multTo = function (q, target) {
            if (target === void 0) { target = new Quaternion(); }
            return target.copy(this).mult(q);
        };
        /**
         * 获取逆四元数（共轭四元数）
         */
        Quaternion.prototype.inverse = function () {
            this.x = -this.x;
            this.y = -this.y;
            this.z = -this.z;
            return this;
        };
        /**
         * 获取逆四元数（共轭四元数）
         *
         * @param target
         */
        Quaternion.prototype.inverseTo = function (target) {
            if (target === void 0) { target = new Quaternion(); }
            return target.copy(this).inverse();
        };
        Quaternion.prototype.multiplyVector = function (vector, target) {
            if (target === void 0) { target = new Quaternion(); }
            var x2 = vector.x;
            var y2 = vector.y;
            var z2 = vector.z;
            target.w = -this.x * x2 - this.y * y2 - this.z * z2;
            target.x = this.w * x2 + this.y * z2 - this.z * y2;
            target.y = this.w * y2 - this.x * z2 + this.z * x2;
            target.z = this.w * z2 + this.x * y2 - this.y * x2;
            return target;
        };
        /**
         * 用表示给定绕向量旋转的值填充四元数对象。
         *
         * @param axis 要绕其旋转的轴
         * @param angle 以弧度为单位的旋转角度。
         */
        Quaternion.prototype.fromAxisAngle = function (axis, angle) {
            var sin_a = Math.sin(angle / 2);
            var cos_a = Math.cos(angle / 2);
            this.x = axis.x * sin_a;
            this.y = axis.y * sin_a;
            this.z = axis.z * sin_a;
            this.w = cos_a;
            this.normalize();
            return this;
        };
        /**
         * 将四元数转换为轴/角表示形式
         *
         * @param targetAxis 要重用的向量对象，用于存储轴
         * @return 一个数组，第一个元素是轴，第二个元素是弧度
         */
        Quaternion.prototype.toAxisAngle = function (targetAxis) {
            if (targetAxis === void 0) { targetAxis = new feng3d.Vector3(); }
            this.normalize(); // 如果w>1 acos和sqrt会产生错误，那么如果四元数被标准化，就不会发生这种情况
            var angle = 2 * Math.acos(this.w);
            var s = Math.sqrt(1 - this.w * this.w); // 假设四元数归一化了，那么w小于1，所以项总是正的。
            if (s < 0.001) { // 为了避免除以零，s总是正的，因为是根号
                // 如果s接近于零，那么轴的方向就不重要了
                targetAxis.x = this.x; // 如果轴归一化很重要，则用x=1替换;y = z = 0;
                targetAxis.y = this.y;
                targetAxis.z = this.z;
            }
            else {
                targetAxis.x = this.x / s; // 法线轴
                targetAxis.y = this.y / s;
                targetAxis.z = this.z / s;
            }
            return [targetAxis, angle];
        };
        /**
         * 给定两个向量，设置四元数值。得到的旋转将是将u旋转到v所需要的旋转。
         *
         * @param u
         * @param v
         */
        Quaternion.prototype.setFromVectors = function (u, v) {
            if (u.isAntiparallelTo(v)) {
                var t1 = new feng3d.Vector3();
                var t2 = new feng3d.Vector3();
                u.tangents(t1, t2);
                this.fromAxisAngle(t1, Math.PI);
            }
            else {
                var a = u.crossTo(v);
                this.x = a.x;
                this.y = a.y;
                this.z = a.z;
                this.w = Math.sqrt(Math.pow(u.length, 2) * Math.pow(v.length, 2)) + u.dot(v);
                this.normalize();
            }
            return this;
        };
        /**
         * 与目标四元数之间进行球面内插，提供了具有恒定角度变化率的旋转之间的内插。
         * @param qb 目标四元素
         * @param t 插值权值，一个介于0和1之间的值。
         */
        Quaternion.prototype.slerp = function (qb, t) {
            if (t === 0)
                return this;
            if (t === 1)
                return this.copy(qb);
            var x = this.x, y = this.y, z = this.z, w = this.w;
            // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/
            var cosHalfTheta = w * qb.w + x * qb.x + y * qb.y + z * qb.z;
            if (cosHalfTheta < 0) {
                this.w = -qb.w;
                this.x = -qb.x;
                this.y = -qb.y;
                this.z = -qb.z;
                cosHalfTheta = -cosHalfTheta;
            }
            else {
                this.copy(qb);
            }
            if (cosHalfTheta >= 1.0) {
                this.w = w;
                this.x = x;
                this.y = y;
                this.z = z;
                return this;
            }
            var sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;
            if (sqrSinHalfTheta <= Number.EPSILON) {
                var s = 1 - t;
                this.w = s * w + t * this.w;
                this.x = s * x + t * this.x;
                this.y = s * y + t * this.y;
                this.z = s * z + t * this.z;
                this.normalize();
                return this;
            }
            var sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
            var halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
            var ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta, ratioB = Math.sin(t * halfTheta) / sinHalfTheta;
            this.w = (w * ratioA + this.w * ratioB);
            this.x = (x * ratioA + this.x * ratioB);
            this.y = (y * ratioA + this.y * ratioB);
            this.z = (z * ratioA + this.z * ratioB);
            return this;
        };
        /**
         * 与目标四元数之间进行球面内插，提供了具有恒定角度变化率的旋转之间的内插。
         * @param qb 目标四元素
         * @param t 插值权值，一个介于0和1之间的值。
         * @param out 保存插值结果
         */
        Quaternion.prototype.slerpTo = function (qb, t, out) {
            if (out === void 0) { out = new Quaternion(); }
            if (qb == out)
                qb = qb.clone();
            return out.copy(this).slerp(qb, t);
        };
        /**
         * 线性求插值
         * @param qa 第一个四元素
         * @param qb 第二个四元素
         * @param t 权重
         */
        Quaternion.prototype.lerp = function (qa, qb, t) {
            var w1 = qa.w, x1 = qa.x, y1 = qa.y, z1 = qa.z;
            var w2 = qb.w, x2 = qb.x, y2 = qb.y, z2 = qb.z;
            var len;
            // shortest direction
            if (w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2 < 0) {
                w2 = -w2;
                x2 = -x2;
                y2 = -y2;
                z2 = -z2;
            }
            this.w = w1 + t * (w2 - w1);
            this.x = x1 + t * (x2 - x1);
            this.y = y1 + t * (y2 - y1);
            this.z = z1 + t * (z2 - z1);
            len = 1.0 / Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
            this.w *= len;
            this.x *= len;
            this.y *= len;
            this.z *= len;
        };
        /**
         * Fills the quaternion object with values representing the given euler rotation.
         *
         * @param    ax        The angle in radians of the rotation around the ax axis.
         * @param    ay        The angle in radians of the rotation around the ay axis.
         * @param    az        The angle in radians of the rotation around the az axis.
         */
        Quaternion.prototype.fromEulerAngles = function (ax, ay, az) {
            var halfX = ax * .5, halfY = ay * .5, halfZ = az * .5;
            var cosX = Math.cos(halfX), sinX = Math.sin(halfX);
            var cosY = Math.cos(halfY), sinY = Math.sin(halfY);
            var cosZ = Math.cos(halfZ), sinZ = Math.sin(halfZ);
            this.w = cosX * cosY * cosZ + sinX * sinY * sinZ;
            this.x = sinX * cosY * cosZ - cosX * sinY * sinZ;
            this.y = cosX * sinY * cosZ + sinX * cosY * sinZ;
            this.z = cosX * cosY * sinZ - sinX * sinY * cosZ;
            return this;
        };
        /**
         * Fills a target Vector3 object with the Euler angles that form the rotation represented by this quaternion.
         * @param target An optional Vector3 object to contain the Euler angles. If not provided, a new object is created.
         * @return The Vector3 containing the Euler angles.
         */
        Quaternion.prototype.toEulerAngles = function (target) {
            target = target || new feng3d.Vector3();
            target.x = Math.atan2(2 * (this.w * this.x + this.y * this.z), 1 - 2 * (this.x * this.x + this.y * this.y));
            var asinvalue = 2 * (this.w * this.y - this.z * this.x);
            //防止超出范围，获取NaN值
            asinvalue = Math.max(-1, Math.min(asinvalue, 1));
            target.y = Math.asin(asinvalue);
            target.z = Math.atan2(2 * (this.w * this.z + this.x * this.y), 1 - 2 * (this.y * this.y + this.z * this.z));
            return target;
        };
        /**
         * 四元数归一化
         */
        Quaternion.prototype.normalize = function (val) {
            if (val === void 0) { val = 1; }
            var l = this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
            if (l === 0) {
                this.x = 0;
                this.y = 0;
                this.z = 0;
                this.w = 1;
            }
            else {
                l = Math.sqrt(l);
                l = 1 / l;
                this.x *= l;
                this.y *= l;
                this.z *= l;
                this.w *= l;
            }
            return this;
        };
        /**
         * 四元数归一化的近似。当quat已经几乎标准化时，效果最好。
         *
         * @see http://jsperf.com/fast-quaternion-normalization
         * @author unphased, https://github.com/unphased
         */
        Quaternion.prototype.normalizeFast = function () {
            var f = (3.0 - (this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w)) / 2.0;
            if (f === 0) {
                this.x = 0;
                this.y = 0;
                this.z = 0;
                this.w = 0;
            }
            else {
                this.x *= f;
                this.y *= f;
                this.z *= f;
                this.w *= f;
            }
            return this;
        };
        /**
         * 转换为可读格式
         */
        Quaternion.prototype.toString = function () {
            return "{this.x:" + this.x + " this.y:" + this.y + " this.z:" + this.z + " this.w:" + this.w + "}";
        };
        /**
         * 转换为矩阵
         *
         * @param target
         */
        Quaternion.prototype.toMatrix3D = function (target) {
            if (target === void 0) { target = new feng3d.Matrix4x4(); }
            var rawData = target.rawData;
            var xy2 = 2.0 * this.x * this.y, xz2 = 2.0 * this.x * this.z, xw2 = 2.0 * this.x * this.w;
            var yz2 = 2.0 * this.y * this.z, yw2 = 2.0 * this.y * this.w, zw2 = 2.0 * this.z * this.w;
            var xx = this.x * this.x, yy = this.y * this.y, zz = this.z * this.z, ww = this.w * this.w;
            rawData[0] = xx - yy - zz + ww;
            rawData[4] = xy2 - zw2;
            rawData[8] = xz2 + yw2;
            rawData[12] = 0;
            rawData[1] = xy2 + zw2;
            rawData[5] = -xx + yy - zz + ww;
            rawData[9] = yz2 - xw2;
            rawData[13] = 0;
            rawData[2] = xz2 - yw2;
            rawData[6] = yz2 + xw2;
            rawData[10] = -xx - yy + zz + ww;
            rawData[14] = 0;
            rawData[3] = 0.0;
            rawData[7] = 0.0;
            rawData[11] = 0;
            rawData[15] = 1;
            return target;
        };
        /**
         * 从矩阵初始化四元素
         *
         * @param matrix 矩阵
         */
        Quaternion.prototype.fromMatrix = function (matrix) {
            var v = matrix.decompose()[1];
            v.scaleNumber(Math.RAD2DEG);
            this.fromEulerAngles(v.x, v.y, v.z);
            return this;
        };
        /**
         * 克隆
         */
        Quaternion.prototype.clone = function () {
            return new Quaternion(this.x, this.y, this.z, this.w);
        };
        /**
         * 旋转一个顶点
         *
         * @param point 被旋转的顶点
         * @param target 旋转结果
         */
        Quaternion.prototype.rotatePoint = function (point, target) {
            if (target === void 0) { target = new feng3d.Vector3(); }
            var x2 = point.x, y2 = point.y, z2 = point.z;
            // p*q'
            var w1 = -this.x * x2 - this.y * y2 - this.z * z2;
            var x1 = this.w * x2 + this.y * z2 - this.z * y2;
            var y1 = this.w * y2 - this.x * z2 + this.z * x2;
            var z1 = this.w * z2 + this.x * y2 - this.y * x2;
            target.x = -w1 * this.x + x1 * this.w - y1 * this.z + z1 * this.y;
            target.y = -w1 * this.y + x1 * this.z + y1 * this.w - z1 * this.x;
            target.z = -w1 * this.z - x1 * this.y + y1 * this.x + z1 * this.w;
            return target;
        };
        /**
         * 旋转一个绝对方向四元数给定一个角速度和一个时间步长
         *
         * @param angularVelocity
         * @param dt
         * @param angularFactor
         */
        Quaternion.prototype.integrate = function (angularVelocity, dt, angularFactor) {
            var ax = angularVelocity.x * angularFactor.x, ay = angularVelocity.y * angularFactor.y, az = angularVelocity.z * angularFactor.z, bx = this.x, by = this.y, bz = this.z, bw = this.w;
            var half_dt = dt * 0.5;
            this.x += half_dt * (ax * bw + ay * bz - az * by);
            this.y += half_dt * (ay * bw + az * bx - ax * bz);
            this.z += half_dt * (az * bw + ax * by - ay * bx);
            this.w += half_dt * (-ax * bx - ay * by - az * bz);
            return this;
        };
        /**
         * 旋转一个绝对方向四元数给定一个角速度和一个时间步长
         *
         * @param angularVelocity
         * @param dt
         * @param angularFactor
         * @param  target
         */
        Quaternion.prototype.integrateTo = function (angularVelocity, dt, angularFactor, target) {
            if (target === void 0) { target = new Quaternion(); }
            return target.copy(this).integrate(angularVelocity, dt, angularFactor);
        };
        /**
         * 将源的值复制到此四元数
         *
         * @param q 要复制的四元数
         */
        Quaternion.prototype.copy = function (q) {
            this.x = q.x;
            this.y = q.y;
            this.z = q.z;
            this.w = q.w;
            return this;
        };
        /**
         * Multiply the quaternion by a vector
         * @param v
         * @param target Optional
         */
        Quaternion.prototype.vmult = function (v, target) {
            if (target === void 0) { target = new feng3d.Vector3(); }
            var x = v.x, y = v.y, z = v.z;
            var qx = this.x, qy = this.y, qz = this.z, qw = this.w;
            // q*v
            var ix = qw * x + qy * z - qz * y, iy = qw * y + qz * x - qx * z, iz = qw * z + qx * y - qy * x, iw = -qx * x - qy * y - qz * z;
            target.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            target.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            target.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
            return target;
        };
        /**
         * Convert the quaternion to euler angle representation. Order: YZX, as this page describes: http://www.euclideanspace.com/maths/standards/index.htm
         * @param target
         * @param order Three-character string e.g. "YZX", which also is default.
         */
        Quaternion.prototype.toEuler = function (target, order) {
            if (order === void 0) { order = "YZX"; }
            var heading, attitude, bank;
            var x = this.x, y = this.y, z = this.z, w = this.w;
            switch (order) {
                case "YZX":
                    var test = x * y + z * w;
                    if (test > 0.499) { // singularity at north pole
                        heading = 2 * Math.atan2(x, w);
                        attitude = Math.PI / 2;
                        bank = 0;
                    }
                    if (test < -0.499) { // singularity at south pole
                        heading = -2 * Math.atan2(x, w);
                        attitude = -Math.PI / 2;
                        bank = 0;
                    }
                    if (isNaN(heading)) {
                        var sqx = x * x;
                        var sqy = y * y;
                        var sqz = z * z;
                        heading = Math.atan2(2 * y * w - 2 * x * z, 1 - 2 * sqy - 2 * sqz); // Heading
                        attitude = Math.asin(2 * test); // attitude
                        bank = Math.atan2(2 * x * w - 2 * y * z, 1 - 2 * sqx - 2 * sqz); // bank
                    }
                    break;
                default:
                    throw new Error("Euler order " + order + " not supported yet.");
            }
            target.y = heading;
            target.z = attitude;
            target.x = bank;
        };
        /**
         * See http://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/content/SpinCalc.m
         * @param x
         * @param y
         * @param z
         * @param order The order to apply angles: 'XYZ' or 'YXZ' or any other combination
         */
        Quaternion.prototype.setFromEuler = function (x, y, z, order) {
            if (order === void 0) { order = "XYZ"; }
            var c1 = Math.cos(x / 2);
            var c2 = Math.cos(y / 2);
            var c3 = Math.cos(z / 2);
            var s1 = Math.sin(x / 2);
            var s2 = Math.sin(y / 2);
            var s3 = Math.sin(z / 2);
            if (order === 'XYZ') {
                this.x = s1 * c2 * c3 + c1 * s2 * s3;
                this.y = c1 * s2 * c3 - s1 * c2 * s3;
                this.z = c1 * c2 * s3 + s1 * s2 * c3;
                this.w = c1 * c2 * c3 - s1 * s2 * s3;
            }
            else if (order === 'YXZ') {
                this.x = s1 * c2 * c3 + c1 * s2 * s3;
                this.y = c1 * s2 * c3 - s1 * c2 * s3;
                this.z = c1 * c2 * s3 - s1 * s2 * c3;
                this.w = c1 * c2 * c3 + s1 * s2 * s3;
            }
            else if (order === 'ZXY') {
                this.x = s1 * c2 * c3 - c1 * s2 * s3;
                this.y = c1 * s2 * c3 + s1 * c2 * s3;
                this.z = c1 * c2 * s3 + s1 * s2 * c3;
                this.w = c1 * c2 * c3 - s1 * s2 * s3;
            }
            else if (order === 'ZYX') {
                this.x = s1 * c2 * c3 - c1 * s2 * s3;
                this.y = c1 * s2 * c3 + s1 * c2 * s3;
                this.z = c1 * c2 * s3 - s1 * s2 * c3;
                this.w = c1 * c2 * c3 + s1 * s2 * s3;
            }
            else if (order === 'YZX') {
                this.x = s1 * c2 * c3 + c1 * s2 * s3;
                this.y = c1 * s2 * c3 + s1 * c2 * s3;
                this.z = c1 * c2 * s3 - s1 * s2 * c3;
                this.w = c1 * c2 * c3 - s1 * s2 * s3;
            }
            else if (order === 'XZY') {
                this.x = s1 * c2 * c3 - c1 * s2 * s3;
                this.y = c1 * s2 * c3 - s1 * c2 * s3;
                this.z = c1 * c2 * s3 + s1 * s2 * c3;
                this.w = c1 * c2 * c3 + s1 * s2 * s3;
            }
            return this;
        };
        __decorate([
            feng3d.serialize
        ], Quaternion.prototype, "x", void 0);
        __decorate([
            feng3d.serialize
        ], Quaternion.prototype, "y", void 0);
        __decorate([
            feng3d.serialize
        ], Quaternion.prototype, "z", void 0);
        __decorate([
            feng3d.serialize
        ], Quaternion.prototype, "w", void 0);
        return Quaternion;
    }());
    feng3d.Quaternion = Quaternion;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3d直线

     */
    var Line3D = /** @class */ (function () {
        /**
         * 根据直线某点与方向创建直线
         * @param position 直线上某点
         * @param direction 直线的方向
         */
        function Line3D(position, direction) {
            this.position = position ? position : new feng3d.Vector3();
            this.direction = (direction ? direction : new feng3d.Vector3(0, 0, 1)).normalize();
        }
        /**
         * 根据直线上两点初始化直线
         * @param p0 Vector3
         * @param p1 Vector3
         */
        Line3D.fromPoints = function (p0, p1) {
            return new Line3D().fromPoints(p0, p1);
        };
        /**
         * 根据直线某点与方向初始化直线
         * @param position 直线上某点
         * @param direction 直线的方向
         */
        Line3D.fromPosAndDir = function (position, direction) {
            return new Line3D().fromPosAndDir(position, direction);
        };
        /**
         * 随机直线，比如用于单元测试
         */
        Line3D.random = function () {
            return new Line3D(feng3d.Vector3.random(), feng3d.Vector3.random());
        };
        /**
         * 根据直线上两点初始化直线
         * @param p0 Vector3
         * @param p1 Vector3
         */
        Line3D.prototype.fromPoints = function (p0, p1) {
            this.position = p0;
            this.direction = p1.subTo(p0).normalize();
            return this;
        };
        /**
         * 根据直线某点与方向初始化直线
         * @param position 直线上某点
         * @param direction 直线的方向
         */
        Line3D.prototype.fromPosAndDir = function (position, direction) {
            this.position = position;
            this.direction = direction.normalize();
            return this;
        };
        /**
         * 获取经过该直线的平面
         */
        Line3D.prototype.getPlane = function (plane) {
            if (plane === void 0) { plane = new feng3d.Plane3D(); }
            return plane.fromNormalAndPoint(feng3d.Vector3.random().cross(this.direction), this.position);
        };
        /**
         * 获取直线上的一个点
         * @param length 与原点距离
         */
        Line3D.prototype.getPoint = function (length, vout) {
            if (length === void 0) { length = 0; }
            if (vout === void 0) { vout = new feng3d.Vector3(); }
            return vout.copy(this.direction).scaleNumber(length).add(this.position);
        };
        /**
         * 获取指定z值的点
         * @param z z值
         * @param vout 目标点（输出）
         * @returns 目标点
         */
        Line3D.prototype.getPointWithZ = function (z, vout) {
            if (vout === void 0) { vout = new feng3d.Vector3(); }
            return this.getPoint((z - this.position.z) / this.direction.z, vout);
        };
        /**
         * 指定点到该直线距离
         * @param point 指定点
         */
        Line3D.prototype.distanceWithPoint = function (point) {
            return this.closestPointWithPoint(point).sub(point).length;
        };
        /**
         * 与指定点最近点的系数
         * @param point 点
         */
        Line3D.prototype.closestPointParameterWithPoint = function (point) {
            return point.subTo(this.position).dot(this.direction);
        };
        /**
         * 与指定点最近的点
         * @param point 点
         * @param vout 输出点
         */
        Line3D.prototype.closestPointWithPoint = function (point, vout) {
            if (vout === void 0) { vout = new feng3d.Vector3(); }
            var t = this.closestPointParameterWithPoint(point);
            return this.getPoint(t, vout);
        };
        /**
         * 判定点是否在直线上
         * @param point 点
         * @param precision 精度
         */
        Line3D.prototype.onWithPoint = function (point, precision) {
            if (precision === void 0) { precision = Math.PRECISION; }
            if (Math.equals(this.distanceWithPoint(point), 0, precision))
                return true;
            return false;
        };
        /**
         * 与直线相交
         * @param line3D 直线
         */
        Line3D.prototype.intersectWithLine3D = function (line3D) {
            // 处理相等
            if (this.equals(line3D))
                return this.clone();
            // 处理平行
            if (this.direction.isParallel(line3D.direction))
                return null;
            var plane = this.getPlane();
            var point = plane.intersectWithLine3D(line3D);
            if (this.onWithPoint(point))
                return point;
            return null;
        };
        /**
         * 应用矩阵
         * @param mat 矩阵
         */
        Line3D.prototype.applyMatri4x4 = function (mat) {
            mat.transformVector(this.position, this.position);
            mat.deltaTransformVector(this.direction, this.direction);
            return this;
        };
        /**
         * 与指定向量比较是否相等
         * @param v 比较的向量
         * @param precision 允许误差
         * @return 相等返回true，否则false
         */
        Line3D.prototype.equals = function (line, precision) {
            if (precision === void 0) { precision = Math.PRECISION; }
            if (!this.onWithPoint(line.position))
                return false;
            if (!this.onWithPoint(line.position.addTo(line.direction)))
                return false;
            return true;
        };
        /**
         * 拷贝
         * @param line 直线
         */
        Line3D.prototype.copy = function (line) {
            this.position.copy(line.position);
            this.direction.copy(line.direction);
            return this;
        };
        /**
         * 克隆
         */
        Line3D.prototype.clone = function () {
            return new Line3D().copy(this);
        };
        return Line3D;
    }());
    feng3d.Line3D = Line3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D线段
     */
    var Segment3D = /** @class */ (function () {
        function Segment3D(p0, p1) {
            if (p0 === void 0) { p0 = new feng3d.Vector3(); }
            if (p1 === void 0) { p1 = new feng3d.Vector3(); }
            this.p0 = p0;
            this.p1 = p1;
        }
        /**
         * 初始化线段
         * @param p0
         * @param p1
         */
        Segment3D.fromPoints = function (p0, p1) {
            return new Segment3D(p0, p1);
        };
        /**
         * 随机线段
         */
        Segment3D.random = function () {
            return new Segment3D(feng3d.Vector3.random(), feng3d.Vector3.random());
        };
        /**
         * 获取线段所在直线
         */
        Segment3D.prototype.getLine = function (line) {
            if (line === void 0) { line = new feng3d.Line3D(); }
            return line.fromPoints(this.p0.clone(), this.p1.clone());
        };
        /**
         * 获取指定位置上的点，当position=0时返回p0，当position=1时返回p1
         * @param position 线段上的位置
         */
        Segment3D.prototype.getPoint = function (position, pout) {
            if (pout === void 0) { pout = new feng3d.Vector3(); }
            var newPoint = pout.copy(this.p0).add(this.p1.subTo(this.p0).scaleNumber(position));
            return newPoint;
        };
        /**
         * 判定点是否在线段上
         * @param point
         */
        Segment3D.prototype.onWithPoint = function (point, precision) {
            if (precision === void 0) { precision = Math.PRECISION; }
            return Math.equals(this.getPointDistance(point), 0, precision);
        };
        /**
         * 判定点是否投影在线段上
         * @param point
         */
        Segment3D.prototype.projectOnWithPoint = function (point) {
            var position = this.getPositionByPoint(point);
            position = Number(position.toFixed(6));
            return 0 <= position && position <= 1;
        };
        /**
         * 获取点在线段上的位置，当点投影在线段上p0位置时返回0，当点投影在线段p1上时返回1
         * @param point 点
         */
        Segment3D.prototype.getPositionByPoint = function (point) {
            var vec = this.p1.subTo(this.p0);
            var position = point.subTo(this.p0).dot(vec) / vec.lengthSquared;
            return position;
        };
        /**
         * 获取直线到点的法线（线段到点垂直方向）
         * @param point 点
         */
        Segment3D.prototype.getNormalWithPoint = function (point) {
            var direction = this.p1.subTo(this.p0);
            var l1 = point.subTo(this.p0);
            var n = direction.crossTo(l1).crossTo(direction).normalize();
            return n;
        };
        /**
         * 指定点到该线段距离，如果投影点不在线段上时，该距离为指定点到最近的线段端点的距离
         * @param point 指定点
         */
        Segment3D.prototype.getPointDistanceSquare = function (point) {
            var position = this.getPositionByPoint(point);
            if (position <= 0) {
                lengthSquared = point.subTo(this.p0).lengthSquared;
            }
            else if (position >= 1) {
                lengthSquared = point.subTo(this.p1).lengthSquared;
            }
            else {
                var s0 = point.subTo(this.p0).lengthSquared;
                var s1 = position * position * this.p1.subTo(this.p0).lengthSquared;
                var lengthSquared = Math.abs(s0 - s1);
            }
            return lengthSquared;
        };
        /**
         * 指定点到该线段距离，如果投影点不在线段上时，该距离为指定点到最近的线段端点的距离
         * @param point 指定点
         */
        Segment3D.prototype.getPointDistance = function (point) {
            var v = this.getPointDistanceSquare(point);
            v = Math.sqrt(v);
            return v;
        };
        /**
         * 与直线相交
         * @param line 直线
         */
        Segment3D.prototype.intersectionWithLine = function (line) {
            var l = this.getLine();
            var r = l.intersectWithLine3D(line);
            if (!r)
                return null;
            if (r instanceof feng3d.Line3D)
                return this.clone();
            if (this.onWithPoint(r))
                return r;
            return null;
        };
        /**
         * 与线段相交
         * @param segment 直线
         */
        Segment3D.prototype.intersectionWithSegment = function (segment) {
            var r = this.intersectionWithLine(segment.getLine());
            if (!r)
                return null;
            if (r instanceof Segment3D) {
                var ps = [this.p0, this.p1].map(function (p) {
                    return segment.clampPoint(p);
                });
                if (this.onWithPoint(ps[0]))
                    return Segment3D.fromPoints(ps[0], ps[1]);
                return null;
            }
            if (this.onWithPoint(r))
                return r;
            return null;
        };
        /**
         * 与指定点最近的点
         * @param point 点
         * @param vout 输出点
         */
        Segment3D.prototype.closestPointWithPoint = function (point, vout) {
            if (vout === void 0) { vout = new feng3d.Vector3(); }
            this.getLine().closestPointWithPoint(point, vout);
            if (this.onWithPoint(vout))
                return vout;
            if (point.distanceSquared(this.p0) < point.distanceSquared(this.p1))
                return vout.copy(this.p0);
            return vout.copy(this.p1);
        };
        /**
         * 把点压缩到线段内
         */
        Segment3D.prototype.clampPoint = function (point, pout) {
            if (pout === void 0) { pout = new feng3d.Vector3(); }
            return this.getPoint(Math.clamp(this.getPositionByPoint(point), 0, 1), pout);
        };
        /**
         * 判定线段是否相等
         */
        Segment3D.prototype.equals = function (segment) {
            return (this.p0.equals(segment.p0) && this.p1.equals(segment.p1)) || (this.p0.equals(segment.p1) && this.p1.equals(segment.p0));
        };
        /**
         * 复制
         */
        Segment3D.prototype.copy = function (segment) {
            this.p0.copy(segment.p0);
            this.p1.copy(segment.p1);
            return this;
        };
        /**
         * 克隆
         */
        Segment3D.prototype.clone = function () {
            return new Segment3D().copy(this);
        };
        return Segment3D;
    }());
    feng3d.Segment3D = Segment3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3D射线

     */
    var Ray3D = /** @class */ (function (_super) {
        __extends(Ray3D, _super);
        function Ray3D(position, direction) {
            return _super.call(this, position, direction) || this;
        }
        return Ray3D;
    }(feng3d.Line3D));
    feng3d.Ray3D = Ray3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 三角形
     */
    var Triangle3D = /** @class */ (function () {
        function Triangle3D(p0, p1, p2) {
            if (p0 === void 0) { p0 = new feng3d.Vector3(); }
            if (p1 === void 0) { p1 = new feng3d.Vector3(); }
            if (p2 === void 0) { p2 = new feng3d.Vector3(); }
            this.p0 = p0;
            this.p1 = p1;
            this.p2 = p2;
        }
        /**
         * 通过3顶点定义一个三角形
         * @param p0		点0
         * @param p1		点1
         * @param p2		点2
         */
        Triangle3D.fromPoints = function (p0, p1, p2) {
            return new Triangle3D().fromPoints(p0, p1, p2);
        };
        /**
         * 从顶点数据初始化三角形
         * @param positions 顶点数据
         */
        Triangle3D.fromPositions = function (positions) {
            return new Triangle3D().fromPositions(positions);
        };
        /**
         * 随机三角形
         * @param size 尺寸
         */
        Triangle3D.random = function (size) {
            if (size === void 0) { size = 1; }
            return new Triangle3D(feng3d.Vector3.random(size), feng3d.Vector3.random(size), feng3d.Vector3.random(size));
        };
        /**
         * 三角形三个点
         */
        Triangle3D.prototype.getPoints = function () {
            return [this.p0, this.p1, this.p2];
        };
        /**
         * 三边
         */
        Triangle3D.prototype.getSegments = function () {
            return [feng3d.Segment3D.fromPoints(this.p0, this.p1), feng3d.Segment3D.fromPoints(this.p1, this.p2), feng3d.Segment3D.fromPoints(this.p2, this.p0)];
        };
        /**
         * 三角形所在平面
         */
        Triangle3D.prototype.getPlane3d = function (pout) {
            if (pout === void 0) { pout = new feng3d.Plane3D(); }
            return pout.fromPoints(this.p0, this.p1, this.p2);
        };
        /**
         * 获取法线
         */
        Triangle3D.prototype.getNormal = function (vout) {
            if (vout === void 0) { vout = new feng3d.Vector3(); }
            return vout.copy(this.p1).sub(this.p0).cross(this.p2.subTo(this.p1)).normalize();
        };
        /**
         * 重心,三条中线相交的点叫做重心。
         */
        Triangle3D.prototype.getBarycenter = function (pout) {
            if (pout === void 0) { pout = new feng3d.Vector3(); }
            return pout.copy(this.p0).add(this.p1).add(this.p2).scaleNumber(1 / 3);
        };
        /**
         * 外心，外切圆心,三角形三边的垂直平分线的交点，称为三角形外心。
         * @see https://baike.baidu.com/item/%E4%B8%89%E8%A7%92%E5%BD%A2%E4%BA%94%E5%BF%83/218867
         */
        Triangle3D.prototype.getCircumcenter = function (pout) {
            if (pout === void 0) { pout = new feng3d.Vector3(); }
            var a = this.p2.subTo(this.p1);
            var b = this.p0.subTo(this.p2);
            var c = this.p1.subTo(this.p0);
            var d = 2 * c.crossTo(a).lengthSquared;
            var a0 = -a.dot(a) * c.dot(b) / d;
            var b0 = -b.dot(b) * c.dot(a) / d;
            var c0 = -c.dot(c) * b.dot(a) / d;
            return pout.copy(this.p0).scaleNumber(a0).add(this.p1.scaleNumberTo(b0)).add(this.p2.scaleNumberTo(c0));
        };
        /**
         * 外心，内切圆心,三角形内心为三角形三条内角平分线的交点。
         * @see https://baike.baidu.com/item/%E4%B8%89%E8%A7%92%E5%BD%A2%E4%BA%94%E5%BF%83/218867
         */
        Triangle3D.prototype.getInnercenter = function (pout) {
            if (pout === void 0) { pout = new feng3d.Vector3(); }
            var a = this.p2.subTo(this.p1).length;
            var b = this.p0.subTo(this.p2).length;
            var c = this.p1.subTo(this.p0).length;
            return pout.copy(this.p0).scaleNumber(a).add(this.p1.scaleNumberTo(b)).add(this.p2.scaleNumberTo(c)).scaleNumber(1 / (a + b + c));
        };
        /**
         * 垂心，三角形三边上的三条高或其延长线交于一点，称为三角形垂心。
         * @see https://baike.baidu.com/item/%E4%B8%89%E8%A7%92%E5%BD%A2%E4%BA%94%E5%BF%83/218867
         */
        Triangle3D.prototype.getOrthocenter = function (pout) {
            if (pout === void 0) { pout = new feng3d.Vector3(); }
            var a = this.p2.subTo(this.p1);
            var b = this.p0.subTo(this.p2);
            var c = this.p1.subTo(this.p0);
            var a0 = a.dot(b) * a.dot(c);
            var b0 = b.dot(c) * b.dot(a);
            var c0 = c.dot(a) * c.dot(b);
            return pout.copy(this.p0).scaleNumber(a0).add(this.p1.scaleNumberTo(b0)).add(this.p2.scaleNumberTo(c0)).scaleNumber(1 / (a0 + b0 + c0));
        };
        /**
         * 通过3顶点定义一个三角形
         * @param p0		点0
         * @param p1		点1
         * @param p2		点2
         */
        Triangle3D.prototype.fromPoints = function (p0, p1, p2) {
            this.p0 = p0;
            this.p1 = p1;
            this.p2 = p2;
            return this;
        };
        /**
         * 从顶点数据初始化三角形
         * @param positions 顶点数据
         */
        Triangle3D.prototype.fromPositions = function (positions) {
            this.p0.set(positions[0], positions[1], positions[2]);
            this.p1.set(positions[3], positions[4], positions[5]);
            this.p2.set(positions[6], positions[7], positions[8]);
            return this;
        };
        /**
         * 获取三角形内的点
         * @param p 三点的权重
         * @param pout 输出点
         */
        Triangle3D.prototype.getPoint = function (p, pout) {
            if (pout === void 0) { pout = new feng3d.Vector3(); }
            return pout.copy(this.p0).scaleNumber(p.x).add(this.p1.scaleNumberTo(p.y)).add(this.p2.scaleNumberTo(p.z));
        };
        /**
         * 获取三角形内随机点
         * @param pout 输出点
         */
        Triangle3D.prototype.randomPoint = function (pout) {
            if (pout === void 0) { pout = new feng3d.Vector3(); }
            var a = Math.random();
            var b = Math.random() * (1 - a);
            var c = 1 - a - b;
            return this.getPoint(new feng3d.Vector3(a, b, c), pout);
        };
        /**
         * 获取与直线相交，当直线与三角形不相交时返回null
         */
        Triangle3D.prototype.intersectionWithLine = function (line) {
            var plane3d = this.getPlane3d();
            var normal = plane3d.getNormal();
            var cross = plane3d.intersectWithLine3D(line);
            if (!cross)
                return null;
            if (cross instanceof feng3d.Vector3) {
                if (this.onWithPoint(cross))
                    return cross;
                return null;
            }
            // 直线分别于三边相交
            var crossSegment = null;
            var ps = this.getSegments().reduce(function (v, segment) {
                var r = segment.intersectionWithLine(line);
                if (!r)
                    return v;
                if (r instanceof feng3d.Segment3D) {
                    crossSegment = r;
                    return v;
                }
                v.push(r);
                return v;
            }, []);
            if (crossSegment)
                return crossSegment;
            if (ps.length == 0)
                return null;
            if (ps.length == 1)
                return ps[0];
            if (ps[0].equals(ps[1])) {
                return ps[0];
            }
            return feng3d.Segment3D.fromPoints(ps[0], ps[1]);
        };
        /**
         * 获取与线段相交
         */
        Triangle3D.prototype.intersectionWithSegment = function (segment) {
            var r = this.intersectionWithLine(segment.getLine());
            if (!r)
                return null;
            if (r instanceof feng3d.Vector3) {
                if (segment.onWithPoint(r))
                    return r;
                return null;
            }
            var p0 = segment.clampPoint(r.p0);
            var p1 = segment.clampPoint(r.p1);
            if (!r.onWithPoint(p0))
                return null;
            if (p0.equals(p1))
                return p0;
            return feng3d.Segment3D.fromPoints(p0, p1);
        };
        /**
         * 判定点是否在三角形上
         * @param p 点
         * @param precision 精度，如果距离小于精度则判定为在三角形上
         */
        Triangle3D.prototype.onWithPoint = function (p, precision) {
            if (precision === void 0) { precision = Math.PRECISION; }
            var plane3d = this.getPlane3d();
            if (plane3d.classifyPoint(p, precision) != feng3d.PlaneClassification.INTERSECT)
                return false;
            if (feng3d.Segment3D.fromPoints(this.p0, this.p1).onWithPoint(p, precision))
                return true;
            if (feng3d.Segment3D.fromPoints(this.p1, this.p2).onWithPoint(p, precision))
                return true;
            if (feng3d.Segment3D.fromPoints(this.p2, this.p0).onWithPoint(p, precision))
                return true;
            var n = this.getNormal();
            if (new Triangle3D(this.p0, this.p1, p).getNormal().dot(n) < 0)
                return false;
            if (new Triangle3D(this.p1, this.p2, p).getNormal().dot(n) < 0)
                return false;
            if (new Triangle3D(this.p2, this.p0, p).getNormal().dot(n) < 0)
                return false;
            return true;
        };
        /**
         * 获取指定点分别占三个点的混合值
         */
        Triangle3D.prototype.blendWithPoint = function (p) {
            var n = this.p1.subTo(this.p0).crossTo(this.p2.subTo(this.p1));
            var area = n.length;
            n.normalize();
            //
            var n0 = this.p1.subTo(p).crossTo(this.p2.subTo(this.p1));
            var area0 = n0.length;
            n0.normalize();
            var b0 = area0 / area * n.dot(n0);
            //
            var n1 = this.p2.subTo(p).crossTo(this.p0.subTo(this.p2));
            var area1 = n1.length;
            n1.normalize();
            var b1 = area1 / area * n.dot(n1);
            //
            var n2 = this.p0.subTo(p).crossTo(this.p1.subTo(this.p0));
            var area2 = n2.length;
            n2.normalize();
            var b2 = area2 / area * n.dot(n2);
            return new feng3d.Vector3(b0, b1, b2);
        };
        /**
         * 是否与盒子相交
         */
        Triangle3D.prototype.intersectsBox = function (box) {
            return box.intersectsTriangle(this);
        };
        /**
         * 与指定点最近的点
         * @param point 点
         * @param vout 输出点
         */
        Triangle3D.prototype.closestPointWithPoint = function (point, vout) {
            if (vout === void 0) { vout = new feng3d.Vector3(); }
            this.getPlane3d().closestPointWithPoint(point, vout);
            if (this.onWithPoint(vout))
                return vout;
            var p = this.getSegments().map(function (s) { var p = s.closestPointWithPoint(point); return { point: p, d: point.distanceSquared(p) }; }).sort(function (a, b) { return a.d - b.d; })[0].point;
            return vout.copy(p);
        };
        /**
         * 与点最近距离
         * @param point 点
         */
        Triangle3D.prototype.distanceWithPoint = function (point) {
            return this.closestPointWithPoint(point).distance(point);
        };
        /**
         * 与点最近距离平方
         * @param point 点
         */
        Triangle3D.prototype.distanceSquaredWithPoint = function (point) {
            return this.closestPointWithPoint(point).distanceSquared(point);
        };
        /**
         * 用点分解（切割）三角形
         */
        Triangle3D.prototype.decomposeWithPoint = function (p) {
            if (!this.onWithPoint(p))
                return [this];
            if (this.p0.equals(p) || this.p1.equals(p) || this.p2.equals(p))
                return [this];
            if (feng3d.Segment3D.fromPoints(this.p0, this.p1).onWithPoint(p))
                return [Triangle3D.fromPoints(this.p0, p, this.p2), Triangle3D.fromPoints(p, this.p1, this.p2)];
            if (feng3d.Segment3D.fromPoints(this.p1, this.p2).onWithPoint(p))
                return [Triangle3D.fromPoints(this.p1, p, this.p0), Triangle3D.fromPoints(p, this.p2, this.p0)];
            if (feng3d.Segment3D.fromPoints(this.p2, this.p0).onWithPoint(p))
                return [Triangle3D.fromPoints(this.p2, p, this.p1), Triangle3D.fromPoints(p, this.p0, this.p1)];
            return [Triangle3D.fromPoints(p, this.p0, this.p1), Triangle3D.fromPoints(p, this.p1, this.p2), Triangle3D.fromPoints(p, this.p2, this.p0)];
        };
        /**
         * 用点分解（切割）三角形
         */
        Triangle3D.prototype.decomposeWithPoints = function (ps) {
            // 遍历顶点分割三角形
            var ts = ps.reduce(function (v, p) {
                // 使用点分割所有三角形
                v = v.reduce(function (v0, t) {
                    return v0.concat(t.decomposeWithPoint(p));
                }, []);
                return v;
            }, [this]);
            return ts;
        };
        /**
         * 用线段分解（切割）三角形
         * @param segment 线段
         */
        Triangle3D.prototype.decomposeWithSegment = function (segment) {
            var r = this.intersectionWithSegment(segment);
            if (!r)
                return [this];
            if (r instanceof feng3d.Vector3) {
                return this.decomposeWithPoint(r);
            }
            var ts = this.decomposeWithPoints([r.p0, r.p1]);
            return ts;
        };
        /**
         * 用直线分解（切割）三角形
         * @param line 直线
         */
        Triangle3D.prototype.decomposeWithLine = function (line) {
            var r = this.intersectionWithLine(line);
            if (!r)
                return [this];
            if (r instanceof feng3d.Vector3) {
                return this.decomposeWithPoint(r);
            }
            var ts = this.decomposeWithPoints([r.p0, r.p1]);
            return ts;
        };
        /**
         * 面积
         */
        Triangle3D.prototype.area = function () {
            return this.p1.subTo(this.p0).crossTo(this.p2.subTo(this.p1)).length * 0.5;
        };
        /**
         * 栅格化，点阵化为XYZ轴间距为1的点阵
         */
        Triangle3D.prototype.rasterize = function () {
            var aabb = feng3d.AABB.fromPoints([this.p0, this.p1, this.p2]);
            aabb.min.round();
            aabb.max.round();
            var point = new feng3d.Vector3();
            var result = [];
            for (var x = aabb.min.x; x <= aabb.max.x; x++) {
                for (var y = aabb.min.y; y <= aabb.max.y; y++) {
                    for (var z = aabb.min.z; z <= aabb.max.z; z++) {
                        // 判定是否在三角形上
                        var onTri = this.onWithPoint(point.set(x, y, z), 0.5);
                        if (onTri) {
                            result.push(x, y, z);
                        }
                    }
                }
            }
            return result;
        };
        /**
         * 平移
         * @param v 向量
         */
        Triangle3D.prototype.translateVector3 = function (v) {
            this.p0.add(v);
            this.p1.add(v);
            this.p2.add(v);
            return this;
        };
        /**
         * 缩放
         * @param v 缩放量
         */
        Triangle3D.prototype.scaleVector3 = function (v) {
            this.p0.scale(v);
            this.p1.scale(v);
            this.p2.scale(v);
            return this;
        };
        /**
         * 自定义栅格化为点阵
         * @param voxelSize 体素尺寸，点阵XYZ轴间距
         * @param origin 原点，点阵中的某点正处于原点上，因此可以用作体素范围内的偏移
         */
        Triangle3D.prototype.rasterizeCustom = function (voxelSize, origin) {
            if (voxelSize === void 0) { voxelSize = new feng3d.Vector3(1, 1, 1); }
            if (origin === void 0) { origin = new feng3d.Vector3(); }
            var tri = this.clone().translateVector3(origin.negateTo()).scaleVector3(voxelSize.inverseTo());
            var ps = tri.rasterize();
            var vec = new feng3d.Vector3();
            var result = [];
            ps.forEach(function (v, i) {
                if (i % 3 == 0) {
                    vec.set(ps[i], ps[i + 1], ps[i + 2]).scale(voxelSize).add(origin);
                    result.push({ xi: ps[i], yi: ps[i + 1], zi: ps[i + 2], xv: vec.x, yv: vec.y, zv: vec.z });
                }
            });
            return result;
        };
        /**
         * 复制
         * @param triangle 三角形
         */
        Triangle3D.prototype.copy = function (triangle) {
            this.p0.copy(triangle.p0);
            this.p1.copy(triangle.p1);
            this.p2.copy(triangle.p2);
            return this;
        };
        /**
         * 克隆
         */
        Triangle3D.prototype.clone = function () {
            return new Triangle3D().copy(this);
        };
        return Triangle3D;
    }());
    feng3d.Triangle3D = Triangle3D;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 轴向对称包围盒
     */
    var AABB = /** @class */ (function () {
        /**
         * 创建包围盒
         * @param min 最小点
         * @param max 最大点
         */
        function AABB(min, max) {
            if (min === void 0) { min = new feng3d.Vector3(); }
            if (max === void 0) { max = new feng3d.Vector3(); }
            this.min = min.clone();
            this.max = max.clone();
        }
        /**
         * 从一组顶点初始化包围盒
         * @param positions 坐标数据列表
         */
        AABB.formPositions = function (positions) {
            return new AABB().formPositions(positions);
        };
        /**
         * 从一组点初始化包围盒
         * @param ps 点列表
         */
        AABB.fromPoints = function (ps) {
            return new AABB().fromPoints(ps);
        };
        /**
         * 随机包围盒
         */
        AABB.random = function () {
            var min = feng3d.Vector3.random();
            var max = feng3d.Vector3.random().add(min);
            return new AABB(min, max);
        };
        /**
         * 获取中心点
         * @param vout 输出向量
         */
        AABB.prototype.getCenter = function (vout) {
            if (vout === void 0) { vout = new feng3d.Vector3(); }
            return vout.copy(this.min).add(this.max).scaleNumber(0.5);
        };
        /**
         * 尺寸
         */
        AABB.prototype.getSize = function (vout) {
            if (vout === void 0) { vout = new feng3d.Vector3(); }
            return vout.copy(this.max).sub(this.min);
        };
        /**
         * 初始化包围盒
         * @param min 最小值
         * @param max 最大值
         */
        AABB.prototype.init = function (min, max) {
            this.min = min.clone();
            this.max = max.clone();
            return this;
        };
        /**
         * 转换为包围盒八个角所在点列表
         */
        AABB.prototype.toPoints = function () {
            var min = this.min;
            var max = this.max;
            return [
                new feng3d.Vector3(min.x, min.y, min.z),
                new feng3d.Vector3(max.x, min.y, min.z),
                new feng3d.Vector3(min.x, max.y, min.z),
                new feng3d.Vector3(min.x, min.y, max.z),
                new feng3d.Vector3(min.x, max.y, max.z),
                new feng3d.Vector3(max.x, min.y, max.z),
                new feng3d.Vector3(max.x, max.y, min.z),
                new feng3d.Vector3(max.x, max.y, max.z),
            ];
        };
        /**
         * 从一组顶点初始化包围盒
         * @param positions 坐标数据列表
         */
        AABB.prototype.formPositions = function (positions) {
            var minX = +Infinity;
            var minY = +Infinity;
            var minZ = +Infinity;
            var maxX = -Infinity;
            var maxY = -Infinity;
            var maxZ = -Infinity;
            for (var i = 0, l = positions.length; i < l; i += 3) {
                var x = positions[i];
                var y = positions[i + 1];
                var z = positions[i + 2];
                if (x < minX)
                    minX = x;
                if (y < minY)
                    minY = y;
                if (z < minZ)
                    minZ = z;
                if (x > maxX)
                    maxX = x;
                if (y > maxY)
                    maxY = y;
                if (z > maxZ)
                    maxZ = z;
            }
            this.min.set(minX, minY, minZ);
            this.max.set(maxX, maxY, maxZ);
            return this;
        };
        /**
         * 从一组点初始化包围盒
         * @param ps 点列表
         */
        AABB.prototype.fromPoints = function (ps) {
            var _this = this;
            this.empty();
            ps.forEach(function (element) {
                _this.expandByPoint(element);
            });
            return this;
        };
        /**
         * 包围盒内随机点
         */
        AABB.prototype.randomPoint = function (pout) {
            if (pout === void 0) { pout = new feng3d.Vector3(); }
            return pout.copy(this.min).lerp(this.max, feng3d.Vector3.random());
        };
        /**
         * 使用点扩张包围盒
         * @param point 点
         */
        AABB.prototype.expandByPoint = function (point) {
            this.min.min(point);
            this.max.max(point);
            return this;
        };
        /**
         * 应用矩阵
         * @param mat 矩阵
         */
        AABB.prototype.applyMatrix3D = function (mat) {
            this.fromPoints(this.toPoints().map(function (v) {
                return v.applyMatrix4x4(mat);
            }));
            return this;
        };
        /**
         * 应用矩阵
         * @param mat 矩阵
         */
        AABB.prototype.applyMatrix3DTo = function (mat, out) {
            if (out === void 0) { out = new AABB(); }
            return out.copy(this).applyMatrix3D(mat);
        };
        /**
         *
         */
        AABB.prototype.clone = function () {
            return new AABB(this.min.clone(), this.max.clone());
        };
        /**
         * 是否包含指定点
         * @param p 点
         */
        AABB.prototype.containsPoint = function (p) {
            return this.min.lessequal(p) && this.max.greaterequal(p);
        };
        /**
         * 是否包含包围盒
         * @param aabb 包围盒
         */
        AABB.prototype.contains = function (aabb) {
            return this.min.lessequal(aabb.min) && this.max.greaterequal(aabb.max);
        };
        /**
         * 拷贝
         * @param aabb 包围盒
         */
        AABB.prototype.copy = function (aabb) {
            this.min.copy(aabb.min);
            this.max.copy(aabb.max);
            return this;
        };
        /**
         * 比较包围盒是否相等
         * @param aabb 包围盒
         */
        AABB.prototype.equals = function (aabb) {
            return this.min.equals(aabb.min) && this.max.equals(aabb.max);
        };
        /**
         * 膨胀包围盒
         * @param dx x方向膨胀量
         * @param dy y方向膨胀量
         * @param dz z方向膨胀量
         */
        AABB.prototype.inflate = function (dx, dy, dz) {
            this.min.x -= dx / 2;
            this.min.y -= dy / 2;
            this.min.z -= dz / 2;
            this.max.x += dx / 2;
            this.max.y += dy / 2;
            this.max.z += dz / 2;
        };
        /**
         * 膨胀包围盒
         * @param delta 膨胀量
         */
        AABB.prototype.inflatePoint = function (delta) {
            delta = delta.scaleNumberTo(0.5);
            this.min.sub(delta);
            this.max.add(delta);
        };
        /**
         * 与包围盒相交
         * @param aabb 包围盒
         */
        AABB.prototype.intersection = function (aabb) {
            this.min.clamp(aabb.min, aabb.max);
            this.max.clamp(aabb.min, aabb.max);
            return this;
        };
        /**
         * 与包围盒相交
         * @param aabb 包围盒
         */
        AABB.prototype.intersectionTo = function (aabb, out) {
            if (out === void 0) { out = new AABB(); }
            return out.copy(this).intersection(aabb);
        };
        /**
         * 包围盒是否相交
         * @param aabb 包围盒
         */
        AABB.prototype.intersects = function (aabb) {
            var b = this.intersectionTo(aabb);
            var c = b.getCenter();
            return this.containsPoint(c) && aabb.containsPoint(c);
        };
        /**
         * 与射线相交
         * @param position 射线起点
         * @param direction 射线方向
         * @param targetNormal 相交处法线
         * @return 起点到包围盒距离
         */
        AABB.prototype.rayIntersection = function (position, direction, targetNormal) {
            if (this.containsPoint(position))
                return 0;
            var halfExtentsX = (this.max.x - this.min.x) / 2;
            var halfExtentsY = (this.max.y - this.min.y) / 2;
            var halfExtentsZ = (this.max.z - this.min.z) / 2;
            var centerX = this.min.x + halfExtentsX;
            var centerY = this.min.y + halfExtentsY;
            var centerZ = this.min.z + halfExtentsZ;
            var px = position.x - centerX;
            var py = position.y - centerY;
            var pz = position.z - centerZ;
            var vx = direction.x;
            var vy = direction.y;
            var vz = direction.z;
            var ix;
            var iy;
            var iz;
            var rayEntryDistance = -1;
            // 射线与平面相交测试
            var intersects = false;
            if (vx < 0) {
                rayEntryDistance = (halfExtentsX - px) / vx;
                if (rayEntryDistance > 0) {
                    iy = py + rayEntryDistance * vy;
                    iz = pz + rayEntryDistance * vz;
                    if (iy > -halfExtentsY && iy < halfExtentsY && iz > -halfExtentsZ && iz < halfExtentsZ) {
                        if (targetNormal) {
                            targetNormal.x = 1;
                            targetNormal.y = 0;
                            targetNormal.z = 0;
                        }
                        intersects = true;
                    }
                }
            }
            if (!intersects && vx > 0) {
                rayEntryDistance = (-halfExtentsX - px) / vx;
                if (rayEntryDistance > 0) {
                    iy = py + rayEntryDistance * vy;
                    iz = pz + rayEntryDistance * vz;
                    if (iy > -halfExtentsY && iy < halfExtentsY && iz > -halfExtentsZ && iz < halfExtentsZ) {
                        if (targetNormal) {
                            targetNormal.x = -1;
                            targetNormal.y = 0;
                            targetNormal.z = 0;
                        }
                        intersects = true;
                    }
                }
            }
            if (!intersects && vy < 0) {
                rayEntryDistance = (halfExtentsY - py) / vy;
                if (rayEntryDistance > 0) {
                    ix = px + rayEntryDistance * vx;
                    iz = pz + rayEntryDistance * vz;
                    if (ix > -halfExtentsX && ix < halfExtentsX && iz > -halfExtentsZ && iz < halfExtentsZ) {
                        if (targetNormal) {
                            targetNormal.x = 0;
                            targetNormal.y = 1;
                            targetNormal.z = 0;
                        }
                        intersects = true;
                    }
                }
            }
            if (!intersects && vy > 0) {
                rayEntryDistance = (-halfExtentsY - py) / vy;
                if (rayEntryDistance > 0) {
                    ix = px + rayEntryDistance * vx;
                    iz = pz + rayEntryDistance * vz;
                    if (ix > -halfExtentsX && ix < halfExtentsX && iz > -halfExtentsZ && iz < halfExtentsZ) {
                        if (targetNormal) {
                            targetNormal.x = 0;
                            targetNormal.y = -1;
                            targetNormal.z = 0;
                        }
                        intersects = true;
                    }
                }
            }
            if (!intersects && vz < 0) {
                rayEntryDistance = (halfExtentsZ - pz) / vz;
                if (rayEntryDistance > 0) {
                    ix = px + rayEntryDistance * vx;
                    iy = py + rayEntryDistance * vy;
                    if (iy > -halfExtentsY && iy < halfExtentsY && ix > -halfExtentsX && ix < halfExtentsX) {
                        if (targetNormal) {
                            targetNormal.x = 0;
                            targetNormal.y = 0;
                            targetNormal.z = 1;
                        }
                        intersects = true;
                    }
                }
            }
            if (!intersects && vz > 0) {
                rayEntryDistance = (-halfExtentsZ - pz) / vz;
                if (rayEntryDistance > 0) {
                    ix = px + rayEntryDistance * vx;
                    iy = py + rayEntryDistance * vy;
                    if (iy > -halfExtentsY && iy < halfExtentsY && ix > -halfExtentsX && ix < halfExtentsX) {
                        if (targetNormal) {
                            targetNormal.x = 0;
                            targetNormal.y = 0;
                            targetNormal.z = -1;
                        }
                        intersects = true;
                    }
                }
            }
            return intersects ? rayEntryDistance : -1;
        };
        /**
         * 获取包围盒上距离指定点最近的点
         *
         * @param point 指定点
         * @param target 存储最近的点
         */
        AABB.prototype.closestPointToPoint = function (point, target) {
            if (target === void 0) { target = new feng3d.Vector3(); }
            return this.clampPoint(point, target);
        };
        /**
         * 清空包围盒
         */
        AABB.prototype.empty = function () {
            this.min.x = this.min.y = this.min.z = +Infinity;
            this.max.x = this.max.y = this.max.z = -Infinity;
            return this;
        };
        /**
         * 是否为空
         * 当体积为0时为空
         */
        AABB.prototype.isEmpty = function () {
            return (this.max.x <= this.min.x) || (this.max.y <= this.min.y) || (this.max.z <= this.min.z);
        };
        /**
         * 偏移
         * @param dx x轴偏移
         * @param dy y轴偏移
         * @param dz z轴偏移
         */
        AABB.prototype.offset = function (dx, dy, dz) {
            return this.offsetPosition(new feng3d.Vector3(dx, dy, dz));
        };
        /**
         * 偏移
         * @param position 偏移量
         */
        AABB.prototype.offsetPosition = function (position) {
            this.min.add(position);
            this.max.add(position);
            return this;
        };
        AABB.prototype.toString = function () {
            return "[AABB] (min=" + this.min.toString() + ", max=" + this.max.toString() + ")";
        };
        /**
         * 联合包围盒
         * @param aabb 包围盒
         */
        AABB.prototype.union = function (aabb) {
            this.min.min(aabb.min);
            this.max.max(aabb.max);
            return this;
        };
        /**
         * 是否与球相交
         * @param sphere 球
         */
        AABB.prototype.intersectsSphere = function (sphere) {
            var closestPoint = new feng3d.Vector3();
            this.clampPoint(sphere.center, closestPoint);
            return closestPoint.distanceSquared(sphere.center) <= (sphere.radius * sphere.radius);
        };
        /**
         * 夹紧？
         *
         * @param point 点
         * @param out 输出点
         */
        AABB.prototype.clampPoint = function (point, out) {
            if (out === void 0) { out = new feng3d.Vector3(); }
            return out.copy(point).clamp(this.min, this.max);
        };
        /**
         * 是否与平面相交
         * @param plane 平面
         */
        AABB.prototype.intersectsPlane = function (plane) {
            var min = Infinity;
            var max = -Infinity;
            this.toPoints().forEach(function (p) {
                var d = plane.distanceWithPoint(p);
                min = d < min ? d : min;
                max = d > min ? d : min;
            });
            return min < 0 && max > 0;
        };
        /**
         * 是否与三角形相交
         * @param triangle 三角形
         */
        AABB.prototype.intersectsTriangle = function (triangle) {
            if (this.isEmpty()) {
                return false;
            }
            // 计算包围盒中心和区段
            var center = this.getCenter();
            var extents = this.max.subTo(center);
            // 把三角形顶点转换包围盒空间
            var v0 = triangle.p0.subTo(center);
            var v1 = triangle.p1.subTo(center);
            var v2 = triangle.p2.subTo(center);
            // 计算三边向量
            var f0 = v1.subTo(v0);
            var f1 = v2.subTo(v1);
            var f2 = v0.subTo(v2);
            // 测试三边向量分别所在三个轴面上的法线
            var axes = [
                0, -f0.z, f0.y, 0, -f1.z, f1.y, 0, -f2.z, f2.y,
                f0.z, 0, -f0.x, f1.z, 0, -f1.x, f2.z, 0, -f2.x,
                -f0.y, f0.x, 0, -f1.y, f1.x, 0, -f2.y, f2.x, 0
            ];
            if (!satForAxes(axes, v0, v1, v2, extents)) {
                return false;
            }
            // 测试三个面法线
            axes = [1, 0, 0, 0, 1, 0, 0, 0, 1];
            if (!satForAxes(axes, v0, v1, v2, extents)) {
                return false;
            }
            // 检测三角形面法线
            var triangleNormal = f0.crossTo(f1);
            axes = [triangleNormal.x, triangleNormal.y, triangleNormal.z];
            return satForAxes(axes, v0, v1, v2, extents);
        };
        /**
         * 转换为三角形列表
         */
        AABB.prototype.toTriangles = function (triangles) {
            if (triangles === void 0) { triangles = []; }
            var min = this.min;
            var max = this.max;
            triangles.push(
            // 前
            feng3d.Triangle3D.fromPoints(new feng3d.Vector3(min.x, min.y, min.z), new feng3d.Vector3(min.x, max.y, min.z), new feng3d.Vector3(max.x, max.y, min.z)), feng3d.Triangle3D.fromPoints(new feng3d.Vector3(min.x, min.y, min.z), new feng3d.Vector3(max.x, max.y, min.z), new feng3d.Vector3(max.x, min.y, min.z)), 
            // 后
            feng3d.Triangle3D.fromPoints(new feng3d.Vector3(min.x, min.y, max.z), new feng3d.Vector3(max.x, min.y, max.z), new feng3d.Vector3(min.x, max.y, max.z)), feng3d.Triangle3D.fromPoints(new feng3d.Vector3(max.x, min.y, max.z), new feng3d.Vector3(max.x, max.y, max.z), new feng3d.Vector3(min.x, max.y, max.z)), 
            // 右
            feng3d.Triangle3D.fromPoints(new feng3d.Vector3(max.x, min.y, min.z), new feng3d.Vector3(max.x, max.y, min.z), new feng3d.Vector3(max.x, max.y, max.z)), feng3d.Triangle3D.fromPoints(new feng3d.Vector3(max.x, min.y, min.z), new feng3d.Vector3(max.x, max.y, max.z), new feng3d.Vector3(max.x, min.y, max.z)), 
            // 左
            feng3d.Triangle3D.fromPoints(new feng3d.Vector3(min.x, min.y, max.z), new feng3d.Vector3(min.x, max.y, min.z), new feng3d.Vector3(min.x, min.y, min.z)), feng3d.Triangle3D.fromPoints(new feng3d.Vector3(min.x, min.y, max.z), new feng3d.Vector3(min.x, max.y, max.z), new feng3d.Vector3(min.x, max.y, min.z)), 
            // 上
            feng3d.Triangle3D.fromPoints(new feng3d.Vector3(min.x, max.y, min.z), new feng3d.Vector3(max.x, max.y, max.z), new feng3d.Vector3(max.x, max.y, min.z)), feng3d.Triangle3D.fromPoints(new feng3d.Vector3(min.x, max.y, min.z), new feng3d.Vector3(min.x, max.y, max.z), new feng3d.Vector3(max.x, max.y, max.z)), 
            // 下
            feng3d.Triangle3D.fromPoints(new feng3d.Vector3(min.x, min.y, min.z), new feng3d.Vector3(max.x, min.y, min.z), new feng3d.Vector3(min.x, min.y, max.z)), feng3d.Triangle3D.fromPoints(new feng3d.Vector3(max.x, min.y, min.z), new feng3d.Vector3(max.x, min.y, max.z), new feng3d.Vector3(min.x, min.y, max.z)));
            return triangles;
        };
        return AABB;
    }());
    feng3d.AABB = AABB;
    /**
     * 判断三角形三个点是否可能与包围盒在指定轴（列表）上投影相交
     *
     * @param axes
     * @param v0
     * @param v1
     * @param v2
     * @param extents
     */
    function satForAxes(axes, v0, v1, v2, extents) {
        for (var i = 0, j = axes.length - 3; i <= j; i += 3) {
            var testAxis = feng3d.Vector3.fromArray(axes, i);
            // 投影包围盒到指定轴的长度
            var r = extents.x * Math.abs(testAxis.x) + extents.y * Math.abs(testAxis.y) + extents.z * Math.abs(testAxis.z);
            // 投影三角形的三个点到指定轴
            var p0 = v0.dot(testAxis);
            var p1 = v1.dot(testAxis);
            var p2 = v2.dot(testAxis);
            // 三个点在包围盒投影外同侧
            if (Math.min(p0, p1, p2) > r || Math.max(p0, p1, p2) < -r) {
                return false;
            }
        }
        return true;
    }
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 球
     */
    var Sphere = /** @class */ (function () {
        /**
         * Create a Sphere with ABCD coefficients
         */
        function Sphere(center, radius) {
            if (center === void 0) { center = new feng3d.Vector3(); }
            if (radius === void 0) { radius = 0; }
            this.center = center;
            this.radius = radius;
        }
        /**
         * 从一组点初始化球
         * @param points 点列表
         */
        Sphere.fromPoints = function (points) {
            return new Sphere().fromPoints(points);
        };
        /**
         * 从一组顶点初始化球
         * @param positions 坐标数据列表
         */
        Sphere.fromPositions = function (positions) {
            return new Sphere().fromPositions(positions);
        };
        /**
         * 与射线相交
         * @param position 射线起点
         * @param direction 射线方向
         * @param targetNormal 目标法线
         * @return 射线起点到交点的距离
         */
        Sphere.prototype.rayIntersection = function (position, direction, targetNormal) {
            if (this.containsPoint(position))
                return 0;
            var px = position.x - this.center.x, py = position.y - this.center.y, pz = position.z - this.center.z;
            var vx = direction.x, vy = direction.y, vz = direction.z;
            var rayEntryDistance;
            var a = vx * vx + vy * vy + vz * vz;
            var b = 2 * (px * vx + py * vy + pz * vz);
            var c = px * px + py * py + pz * pz - this.radius * this.radius;
            var det = b * b - 4 * a * c;
            if (det >= 0) { // ray goes through sphere
                var sqrtDet = Math.sqrt(det);
                rayEntryDistance = (-b - sqrtDet) / (2 * a);
                if (rayEntryDistance >= 0) {
                    targetNormal.x = px + rayEntryDistance * vx;
                    targetNormal.y = py + rayEntryDistance * vy;
                    targetNormal.z = pz + rayEntryDistance * vz;
                    targetNormal.normalize();
                    return rayEntryDistance;
                }
            }
            // ray misses sphere
            return -1;
        };
        /**
         * 是否包含指定点
         * @param position 点
         */
        Sphere.prototype.containsPoint = function (position) {
            return position.subTo(this.center).lengthSquared <= this.radius * this.radius;
        };
        /**
         * 从一组点初始化球
         * @param points 点列表
         */
        Sphere.prototype.fromPoints = function (points) {
            var box = new feng3d.AABB();
            var center = this.center;
            box.fromPoints(points).getCenter(center);
            var maxRadiusSq = 0;
            for (var i = 0, n = points.length; i < n; i++) {
                maxRadiusSq = Math.max(maxRadiusSq, center.distanceSquared(points[i]));
            }
            this.radius = Math.sqrt(maxRadiusSq);
            return this;
        };
        /**
         * 从一组顶点初始化球
         * @param positions 坐标数据列表
         */
        Sphere.prototype.fromPositions = function (positions) {
            var box = new feng3d.AABB();
            var v = new feng3d.Vector3();
            var center = this.center;
            box.formPositions(positions).getCenter(center);
            var maxRadiusSq = 0;
            for (var i = 0, n = positions.length; i < n; i += 3) {
                maxRadiusSq = Math.max(maxRadiusSq, center.distanceSquared(v.set(positions[i], positions[i + 1], positions[i + 2])));
            }
            this.radius = Math.sqrt(maxRadiusSq);
            return this;
        };
        /**
         * 拷贝
         */
        Sphere.prototype.copy = function (sphere) {
            this.center.copy(sphere.center);
            this.radius = sphere.radius;
            return this;
        };
        /**
         * 克隆
         */
        Sphere.prototype.clone = function () {
            return new Sphere().copy(this);
        };
        /**
         * 是否为空
         */
        Sphere.prototype.isEmpty = function () {
            return this.radius <= 0;
        };
        /**
         * 点到球的距离
         * @param point 点
         */
        Sphere.prototype.distanceToPoint = function (point) {
            return point.distance(this.center) - this.radius;
        };
        /**
         * 与指定球是否相交
         */
        Sphere.prototype.intersectsSphere = function (sphere) {
            var radiusSum = this.radius + sphere.radius;
            return sphere.center.distanceSquared(this.center) <= radiusSum * radiusSum;
        };
        /**
         * 是否与盒子相交
         * @param box 盒子
         */
        Sphere.prototype.intersectsBox = function (box) {
            return box.intersectsSphere(this);
        };
        /**
         * 是否与平面相交
         * @param plane 平面
         */
        Sphere.prototype.intersectsPlane = function (plane) {
            return Math.abs(plane.distanceWithPoint(this.center)) <= this.radius;
        };
        /**
         *
         * @param point 点
         * @param pout 输出点
         */
        Sphere.prototype.clampPoint = function (point, pout) {
            if (pout === void 0) { pout = new feng3d.Vector3(); }
            var deltaLengthSq = this.center.distanceSquared(point);
            pout.copy(point);
            if (deltaLengthSq > (this.radius * this.radius)) {
                pout.sub(this.center).normalize();
                pout.scaleNumber(this.radius).add(this.center);
            }
            return pout;
        };
        /**
         * 获取包围盒
         */
        Sphere.prototype.getBoundingBox = function (box) {
            if (box === void 0) { box = new feng3d.AABB(); }
            box.init(this.center.subNumberTo(this.radius), this.center.addNumberTo(this.radius));
            return box;
        };
        /**
         * 应用矩阵
         * @param matrix 矩阵
         */
        Sphere.prototype.applyMatrix4 = function (matrix) {
            this.center.applyMatrix4x4(matrix);
            this.radius = this.radius * matrix.getMaxScaleOnAxis();
            return this;
        };
        /**
         * 平移
         * @param offset 偏移量
         */
        Sphere.prototype.translate = function (offset) {
            this.center.add(offset);
            return this;
        };
        /**
         * 是否相等
         * @param sphere 球
         */
        Sphere.prototype.equals = function (sphere) {
            return sphere.center.equals(this.center) && (sphere.radius === this.radius);
        };
        Sphere.prototype.toString = function () {
            return "Sphere [center:" + this.center.toString() + ", radius:" + this.radius + "]";
        };
        return Sphere;
    }());
    feng3d.Sphere = Sphere;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 3d面
     * ax+by+cz+d=0
     */
    var Plane3D = /** @class */ (function () {
        /**
         * 创建一个平面
         * @param a		A系数
         * @param b		B系数
         * @param c		C系数
         * @param d		D系数
         */
        function Plane3D(a, b, c, d) {
            if (a === void 0) { a = 0; }
            if (b === void 0) { b = 1; }
            if (c === void 0) { c = 0; }
            if (d === void 0) { d = 0; }
            this.a = a;
            this.b = b;
            this.c = c;
            this.d = d;
        }
        /**
         * 通过3顶点定义一个平面
         * @param p0		点0
         * @param p1		点1
         * @param p2		点2
         */
        Plane3D.fromPoints = function (p0, p1, p2) {
            return new Plane3D().fromPoints(p0, p1, p2);
        };
        /**
         * 根据法线与点定义平面
         * @param normal		平面法线
         * @param point			平面上任意一点
         */
        Plane3D.fromNormalAndPoint = function (normal, point) {
            return new Plane3D().fromNormalAndPoint(normal, point);
        };
        /**
         * 随机平面
         */
        Plane3D.random = function () {
            var normal = feng3d.Vector3.random().normalize();
            return new Plane3D(normal.x, normal.y, normal.z, Math.random());
        };
        /**
         * 原点在平面上的投影
         * @param vout 输出点
         */
        Plane3D.prototype.getOrigin = function (vout) {
            if (vout === void 0) { vout = new feng3d.Vector3(); }
            return this.projectPoint(new feng3d.Vector3(), vout);
        };
        /**
         * 平面上随机点
         * @param vout 输出点
         */
        Plane3D.prototype.randomPoint = function (vout) {
            if (vout === void 0) { vout = new feng3d.Vector3(); }
            return this.getOrigin(vout).add(this.getNormal().cross(feng3d.Vector3.random()));
        };
        /**
         * 法线
         */
        Plane3D.prototype.getNormal = function (vout) {
            if (vout === void 0) { vout = new feng3d.Vector3(); }
            return vout.set(this.a, this.b, this.c);
        };
        /**
         * 通过3顶点定义一个平面
         * @param p0		点0
         * @param p1		点1
         * @param p2		点2
         */
        Plane3D.prototype.fromPoints = function (p0, p1, p2) {
            // p1.subTo(p0, v0);
            // p2.subTo(p1, v1);
            // var normal = v0.crossTo(v1).normalize();
            var normal = p1.subTo(p0).crossTo(p2.subTo(p1)).normalize();
            this.a = normal.x;
            this.b = normal.y;
            this.c = normal.z;
            this.d = -normal.dot(p0);
            return this;
        };
        /**
         * 根据法线与点定义平面
         * @param normal		平面法线
         * @param point			平面上任意一点
         */
        Plane3D.prototype.fromNormalAndPoint = function (normal, point) {
            normal = normal.clone().normalize();
            this.a = normal.x;
            this.b = normal.y;
            this.c = normal.z;
            this.d = -normal.dot(point);
            return this;
        };
        /**
         * 计算点与平面的距离
         * @param p		点
         * @returns		距离
         */
        Plane3D.prototype.distanceWithPoint = function (p) {
            return this.a * p.x + this.b * p.y + this.c * p.z + this.d;
        };
        /**
         * 点是否在平面上
         * @param p 点
         */
        Plane3D.prototype.onWithPoint = function (p) {
            return Math.equals(this.distanceWithPoint(p), 0);
        };
        /**
         * 顶点分类
         * <p>把顶点分为后面、前面、相交三类</p>
         * @param p			顶点
         * @return			顶点类型 PlaneClassification.BACK,PlaneClassification.FRONT,PlaneClassification.INTERSECT
         */
        Plane3D.prototype.classifyPoint = function (p, precision) {
            if (precision === void 0) { precision = Math.PRECISION; }
            var len = this.distanceWithPoint(p);
            if (Math.equals(len, 0, precision))
                return feng3d.PlaneClassification.INTERSECT;
            if (len < 0)
                return feng3d.PlaneClassification.BACK;
            return feng3d.PlaneClassification.FRONT;
        };
        /**
         * 判定与直线是否平行
         * @param line3D
         */
        Plane3D.prototype.parallelWithLine3D = function (line3D, precision) {
            if (precision === void 0) { precision = Math.PRECISION; }
            if (Math.equals(line3D.direction.dot(this.getNormal()), 0, precision))
                return true;
            return false;
        };
        /**
         * 判定与平面是否平行
         * @param plane3D
         */
        Plane3D.prototype.parallelWithPlane3D = function (plane3D, precision) {
            if (precision === void 0) { precision = Math.PRECISION; }
            if (plane3D.getNormal().isParallel(this.getNormal(), precision))
                return true;
            return false;
        };
        /**
         * 获取与直线交点
         */
        Plane3D.prototype.intersectWithLine3D = function (line3D) {
            //处理平行
            if (this.parallelWithLine3D(line3D)) {
                // 处理直线在平面内
                if (this.onWithPoint(line3D.position))
                    return line3D.clone();
                return null;
            }
            var lineDir = line3D.direction.clone();
            lineDir.normalize();
            var cosAngle = lineDir.dot(this.getNormal());
            var distance = this.distanceWithPoint(line3D.position);
            var addVec = lineDir.clone();
            addVec.scaleNumber(-distance / cosAngle);
            var crossPos = line3D.position.addTo(addVec);
            return crossPos;
        };
        /**
         * 获取与平面相交直线
         * @param plane3D
         */
        Plane3D.prototype.intersectWithPlane3D = function (plane3D) {
            if (this.parallelWithPlane3D(plane3D))
                return null;
            var direction = this.getNormal().crossTo(plane3D.getNormal());
            var a0 = this.a, b0 = this.b, c0 = this.c, d0 = this.d, a1 = plane3D.a, b1 = plane3D.b, c1 = plane3D.c, d1 = plane3D.d;
            var x, y, z;
            // 解 方程组 a0*x+b0*y+c0*z+d0=0;a1*x+b1*y+c1*z+d1=0;
            if (b1 * c0 - b0 * c1 != 0) {
                x = 0;
                y = (-c0 * d1 + c1 * d0 + (a0 * c1 - a1 * c0) * x) / (b1 * c0 - b0 * c1);
                z = (-b1 * d0 + b0 * d1 + (a1 * b0 - a0 * b1) * x) / (b1 * c0 - b0 * c1);
            }
            else if (a0 * c1 - a1 * c0 != 0) {
                y = 0;
                x = (-c1 * d0 + c0 * d1 + (b1 * c0 - b0 * c1) * y) / (a0 * c1 - a1 * c0);
                z = (-a0 * d1 + a1 * d0 + (a1 * b0 - a0 * b1) * y) / (a0 * c1 - a1 * c0);
            }
            else if (a1 * b0 - a0 * b1 != 0) {
                z = 0;
                x = (-b0 * d1 + b1 * d0 + (b1 * c0 - b0 * c1) * z) / (a1 * b0 - a0 * b1);
                y = (-a1 * d0 + a0 * d1 + (a0 * c1 - a1 * c0) * z) / (a1 * b0 - a0 * b1);
            }
            else {
                throw "无法计算平面相交结果";
            }
            return new feng3d.Line3D(new feng3d.Vector3(x, y, z), direction);
        };
        /**
         * 翻转平面
         */
        Plane3D.prototype.negate = function () {
            this.a = -this.a;
            this.b = -this.b;
            this.c = -this.c;
            this.d = -this.d;
            return this;
        };
        /**
         * 点到平面的投影
         * @param point
         */
        Plane3D.prototype.projectPoint = function (point, vout) {
            if (vout === void 0) { vout = new feng3d.Vector3(); }
            return this.getNormal(vout).scaleNumber(-this.distanceWithPoint(point)).add(point);
        };
        /**
         * 与指定点最近的点
         * @param point 点
         * @param vout 输出点
         */
        Plane3D.prototype.closestPointWithPoint = function (point, vout) {
            if (vout === void 0) { vout = new feng3d.Vector3(); }
            return this.projectPoint(point, vout);
        };
        /**
         * 复制
         */
        Plane3D.prototype.copy = function (plane) {
            this.a = plane.a;
            this.b = plane.b;
            this.c = plane.c;
            this.d = plane.d;
            return this;
        };
        /**
         * 克隆
         */
        Plane3D.prototype.clone = function () {
            return new Plane3D().copy(this);
        };
        /**
         * 输出字符串
         */
        Plane3D.prototype.toString = function () {
            return "Plane3D [this.a:" + this.a + ", this.b:" + this.b + ", this.c:" + this.c + ", this.d:" + this.d + "]";
        };
        return Plane3D;
    }());
    feng3d.Plane3D = Plane3D;
    // var v0 = new Vector3();
    // var v1 = new Vector3();
    // var v2 = new Vector3();
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 点与面的相对位置

     */
    var PlaneClassification;
    (function (PlaneClassification) {
        /**
         * 在平面后面
         */
        PlaneClassification[PlaneClassification["BACK"] = 0] = "BACK";
        /**
         * 在平面前面
         */
        PlaneClassification[PlaneClassification["FRONT"] = 1] = "FRONT";
        /**
         * 与平面相交
         */
        PlaneClassification[PlaneClassification["INTERSECT"] = 2] = "INTERSECT";
    })(PlaneClassification = feng3d.PlaneClassification || (feng3d.PlaneClassification = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 由三角形构成的几何体
     * ### 限定：
     *  * 只包含三角形，不存在四边形等其他多边形
     *  *
     */
    var TriangleGeometry = /** @class */ (function () {
        function TriangleGeometry(triangles) {
            if (triangles === void 0) { triangles = []; }
            this.triangles = triangles;
        }
        /**
         * 从盒子初始化
         * @param box 盒子
         */
        TriangleGeometry.fromBox = function (box) {
            return new TriangleGeometry().fromBox(box);
        };
        /**
         * 从盒子初始化
         * @param box 盒子
         */
        TriangleGeometry.prototype.fromBox = function (box) {
            this.triangles.length = 0;
            box.toTriangles(this.triangles);
            return this;
        };
        /**
         * 获取所有顶点，去除重复顶点
         */
        TriangleGeometry.prototype.getPoints = function () {
            var ps = this.triangles.reduce(function (v, t) { return v.concat(t.getPoints()); }, []);
            Array.unique(ps, function (a, b) { return a.equals(b); });
            return ps;
        };
        /**
         * 是否闭合
         * 方案：获取所有三角形的线段，当每条线段（a,b）都存在且仅有一条与之相对于的线段（b，a）时几何体闭合
         */
        TriangleGeometry.prototype.isClosed = function () {
            // 获取所有线段
            var ss = this.triangles.reduce(function (ss, t) { return ss.concat(t.getSegments()); }, []);
            // 当每条线段（a,b）都存在与之相对于的线段（b，a）时几何体闭合
            var r = ss.every(function (s) { return ss.filter(function (s0) { return s.p0.equals(s0.p1) && s.p1.equals(s0.p0); }).length == 1; });
            return r;
        };
        /**
         * 包围盒
         */
        TriangleGeometry.prototype.getBox = function (box) {
            if (box === void 0) { box = new feng3d.AABB(); }
            return box.fromPoints(this.getPoints());
        };
        /**
         * 与指定点最近的点
         * @param point 点
         * @param vout 输出点
         */
        TriangleGeometry.prototype.closestPointWithPoint = function (point, vout) {
            if (vout === void 0) { vout = new feng3d.Vector3(); }
            // 计算指定点到所有平面的距离，并按距离排序
            var r = this.triangles.map(function (t) { var p = t.closestPointWithPoint(point); return { p: p, d: point.distanceSquared(p) }; }).sort(function (a, b) { return a.d - b.d; });
            return vout.copy(r[0].p);
        };
        /**
         * 给指定点分类
         * @param p 点
         * @return 点相对于几何体位置；0:在几何体表面上，1：在几何体外，-1：在几何体内
         * 方案：当指定点不在几何体上时，在几何体上找到距离指定点最近点，最近点到给定点形成的向量与最近点所在面（当最近点在多个面上时取点乘摸最大的面）法线点乘大于0时给定点在几何体内，否则在几何体外。
         */
        TriangleGeometry.prototype.classifyPoint = function (p) {
            if (!this.isClosed())
                return 1;
            // 是否在表面
            var onface = this.triangles.reduce(function (v, t) {
                return v || t.onWithPoint(p);
            }, false);
            if (onface)
                return 0;
            // 最近点
            var cp = this.closestPointWithPoint(p);
            // 到最近点的向量
            var cpv = cp.subTo(p);
            // 最近点所在平面
            var cts = this.triangles.filter(function (t) { return t.onWithPoint(cp); });
            // 最近点向量与所在平面方向相同则点在几何体内
            var v = cts.map(function (t) { return t.getNormal().dot(cpv); }).sort(function (a, b) { return Math.abs(b) - Math.abs(a); })[0];
            if (v > 0)
                return -1;
            return 1;
        };
        /**
         * 是否包含指定点
         * @param p 点
         */
        TriangleGeometry.prototype.containsPoint = function (p) {
            return this.classifyPoint(p) <= 0;
        };
        /**
         * 给指定线段分类
         * @param segment 线段
         * @return 线段相对于几何体位置；0:在几何体表面上，1：在几何体外，-1：在几何体内，2：横跨几何体
         */
        TriangleGeometry.prototype.classifySegment = function (segment) {
            var _this = this;
            // 线段与几何体不相交时
            var r = this.intersectionWithSegment(segment);
            if (!r) {
                if (this.classifyPoint(segment.p0) > 0)
                    return 1;
                return -1;
            }
            // 相交多条线段时 横跨
            if (r.segments.length > 1)
                return 2;
            if (r.segments.length == 1) {
                // 相交线段相对 几何体的位置
                var pc = [r.segments[0].p0, r.segments[0].p1].map(function (p) { return _this.classifyPoint(p); });
                if (pc[0] * pc[1] < 0)
                    return 2;
                if (pc[0] + pc[1] == 0)
                    return 0;
                if (pc[0] + pc[1] < 0)
                    return -1;
                return 1;
            }
            // 相交于点
            if (r.points.length) {
            }
        };
        /**
         * 给指定三角形分类
         * @param triangle 三角形
         * @return 三角形相对于几何体位置；0:在几何体表面上，1：在几何体外，-1：在几何体内
         */
        TriangleGeometry.prototype.classifyTriangle = function (triangle) {
        };
        /**
         * 与直线碰撞
         * @param line3d 直线
         */
        TriangleGeometry.prototype.intersectionWithLine = function (line3d) {
            // 线段与三角形碰撞
            var ss = [];
            var ps = [];
            this.triangles.forEach(function (t) {
                var r = t.intersectionWithLine(line3d);
                if (!r)
                    return;
                if (r instanceof feng3d.Segment3D) {
                    ss.push(r);
                    return;
                }
                ps.push(r);
            });
            // 清除相同的线段
            Array.unique(ss, function (a, b) { return a.equals(b); });
            // 删除在相交线段上的交点
            ps = ps.filter(function (p) { return ss.every(function (s) { return !s.onWithPoint(p); }); });
            // 清除相同点
            Array.unique(ps, function (a, b) { return a.equals(b); });
            if (ss.length + ps.length == 0)
                return null;
            return { segments: ss, points: ps };
        };
        /**
         * 与线段相交
         * @param segment 线段
         * @return 不相交时返回null，相交时返回 碰撞线段列表与碰撞点列表
         */
        TriangleGeometry.prototype.intersectionWithSegment = function (segment) {
            var line = segment.getLine();
            var r = this.intersectionWithLine(line);
            if (!r)
                return null;
            var ps = r.points = r.points.filter(function (p) { return segment.onWithPoint(p); });
            r.segments = r.segments.reduce(function (v, s) {
                var p0 = segment.clampPoint(s.p0);
                var p1 = segment.clampPoint(s.p1);
                if (!s.onWithPoint(p0))
                    return v;
                if (p0.equals(p1)) {
                    ps.push(p0);
                    return v;
                }
                v.push(feng3d.Segment3D.fromPoints(p0, p1));
                return v;
            }, []);
            if (r.segments.length + r.points.length == 0)
                return null;
            return r;
        };
        /**
         * 分解三角形
         * @param triangle 三角形
         */
        TriangleGeometry.prototype.decomposeTriangle = function (triangle) {
        };
        /**
         * 拷贝
         */
        TriangleGeometry.prototype.copy = function (triangleGeometry) {
            this.triangles = triangleGeometry.triangles.map(function (t) { return t.clone(); });
            return this;
        };
        /**
         * 克隆
         */
        TriangleGeometry.prototype.clone = function () {
            return new TriangleGeometry().copy(this);
        };
        return TriangleGeometry;
    }());
    feng3d.TriangleGeometry = TriangleGeometry;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 渐变模式
     */
    var GradientMode;
    (function (GradientMode) {
        /**
         * 混合
         */
        GradientMode[GradientMode["Blend"] = 0] = "Blend";
        /**
         * 阶梯
         */
        GradientMode[GradientMode["Fixed"] = 1] = "Fixed";
    })(GradientMode = feng3d.GradientMode || (feng3d.GradientMode = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 颜色渐变
     */
    var Gradient = /** @class */ (function () {
        function Gradient() {
            /**
             * 渐变模式
             */
            this.mode = feng3d.GradientMode.Blend;
            /**
             * 在渐变中定义的所有alpha键。
             *
             * 注： 该值已对时间排序，否则赋值前请使用 sort((a, b) => a.time - b.time) 进行排序
             */
            this.alphaKeys = [{ alpha: 1, time: 0 }, { alpha: 1, time: 1 }];
            /**
             * 在渐变中定义的所有color键。
             *
             * 注： 该值已对时间排序，否则赋值前请使用 sort((a, b) => a.time - b.time) 进行排序
             */
            this.colorKeys = [{ color: new feng3d.Color3(1, 1, 1), time: 0 }, { color: new feng3d.Color3(1, 1, 1), time: 1 }];
        }
        /**
         * 从颜色列表初始化
         * @param colors 颜色列表
         * @param times
         */
        Gradient.prototype.fromColors = function (colors, times) {
            if (!times) {
                times = [];
                for (var i = 0; i < colors.length; i++) {
                    times[i] = i / (colors.length - 1);
                }
            }
            var colors1 = colors.map(function (v) { return new feng3d.Color3().fromUnit(v); });
            for (var i = 0; i < colors1.length; i++) {
                this.colorKeys[i] = { color: colors1[i], time: times[i] };
            }
            return this;
        };
        /**
         * 获取值
         * @param time 时间
         */
        Gradient.prototype.getValue = function (time) {
            var alpha = this.getAlpha(time);
            var color = this.getColor(time);
            return new feng3d.Color4(color.r, color.g, color.b, alpha);
        };
        /**
         * 获取透明度
         * @param time 时间
         */
        Gradient.prototype.getAlpha = function (time) {
            var alphaKeys = this.alphaKeys;
            if (alphaKeys.length == 1)
                return alphaKeys[0].alpha;
            if (time <= alphaKeys[0].time)
                return alphaKeys[0].alpha;
            if (time >= alphaKeys[alphaKeys.length - 1].time)
                return alphaKeys[alphaKeys.length - 1].alpha;
            for (var i = 0, n = alphaKeys.length - 1; i < n; i++) {
                var t = alphaKeys[i].time, v = alphaKeys[i].alpha, nt = alphaKeys[i + 1].time, nv = alphaKeys[i + 1].alpha;
                if (time == t)
                    return v;
                if (time == nt)
                    return nv;
                if (t < time && time < nt) {
                    if (this.mode == feng3d.GradientMode.Fixed)
                        return nv;
                    return Math.mapLinear(time, t, nt, v, nv);
                }
            }
            return 1;
        };
        /**
         * 获取透明度
         * @param time 时间
         */
        Gradient.prototype.getColor = function (time) {
            var colorKeys = this.colorKeys;
            if (colorKeys.length == 1)
                return colorKeys[0].color;
            if (time <= colorKeys[0].time)
                return colorKeys[0].color;
            if (time >= colorKeys[colorKeys.length - 1].time)
                return colorKeys[colorKeys.length - 1].color;
            for (var i = 0, n = colorKeys.length - 1; i < n; i++) {
                var t = colorKeys[i].time, v = colorKeys[i].color, nt = colorKeys[i + 1].time, nv = colorKeys[i + 1].color;
                if (time == t)
                    return v;
                if (time == nt)
                    return nv;
                if (t < time && time < nt) {
                    if (this.mode == feng3d.GradientMode.Fixed)
                        return nv;
                    return v.mixTo(nv, (time - t) / (nt - t));
                }
            }
            return new feng3d.Color3();
        };
        __decorate([
            feng3d.serialize
        ], Gradient.prototype, "mode", void 0);
        __decorate([
            feng3d.serialize
        ], Gradient.prototype, "alphaKeys", void 0);
        __decorate([
            feng3d.serialize
        ], Gradient.prototype, "colorKeys", void 0);
        return Gradient;
    }());
    feng3d.Gradient = Gradient;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 最大最小颜色渐变模式
     */
    var MinMaxGradientMode;
    (function (MinMaxGradientMode) {
        /**
         * Use a single color for the MinMaxGradient.
         *
         * 使用单一颜色的。
         */
        MinMaxGradientMode[MinMaxGradientMode["Color"] = 0] = "Color";
        /**
         * Use a single color gradient for the MinMaxGradient.
         *
         * 使用单一颜色渐变。
         */
        MinMaxGradientMode[MinMaxGradientMode["Gradient"] = 1] = "Gradient";
        /**
         * Use a random value between 2 colors for the MinMaxGradient.
         *
         * 在两种颜色之间使用一个随机值。
         */
        MinMaxGradientMode[MinMaxGradientMode["TwoColors"] = 2] = "TwoColors";
        /**
         * Use a random value between 2 color gradients for the MinMaxGradient.
         *
         * 在两个颜色梯度之间使用一个随机值。
         */
        MinMaxGradientMode[MinMaxGradientMode["TwoGradients"] = 3] = "TwoGradients";
        /**
         * Define a list of colors in the MinMaxGradient, to be chosen from at random.
         *
         * 在一个颜色列表中随机选择。
         */
        MinMaxGradientMode[MinMaxGradientMode["RandomColor"] = 4] = "RandomColor";
    })(MinMaxGradientMode = feng3d.MinMaxGradientMode || (feng3d.MinMaxGradientMode = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 最大最小颜色渐变
     */
    var MinMaxGradient = /** @class */ (function () {
        function MinMaxGradient() {
            /**
             * Set the mode that the min-max gradient will use to evaluate colors.
             *
             * 设置最小-最大梯度将用于评估颜色的模式。
             */
            this.mode = feng3d.MinMaxGradientMode.Color;
            /**
             * Set a constant color.
             *
             * 常量颜色值
             */
            this.color = new feng3d.Color4();
            /**
             * Set a constant color for the lower bound.
             *
             * 为下界设置一个常量颜色。
             */
            this.colorMin = new feng3d.Color4();
            /**
             * Set a constant color for the upper bound.
             *
             * 为上界设置一个常量颜色。
             */
            this.colorMax = new feng3d.Color4();
            /**
             * Set the gradient.
             *
             * 设置渐变。
             */
            this.gradient = new feng3d.Gradient();
            /**
             * Set a gradient for the lower bound.
             *
             * 为下界设置一个渐变。
             */
            this.gradientMin = new feng3d.Gradient();
            /**
             * Set a gradient for the upper bound.
             *
             * 为上界设置一个渐变。
             */
            this.gradientMax = new feng3d.Gradient();
        }
        /**
         * 获取值
         * @param time 时间
         */
        MinMaxGradient.prototype.getValue = function (time, randomBetween) {
            if (randomBetween === void 0) { randomBetween = Math.random(); }
            switch (this.mode) {
                case feng3d.MinMaxGradientMode.Color:
                    return this.color;
                case feng3d.MinMaxGradientMode.Gradient:
                    return this.gradient.getValue(time);
                case feng3d.MinMaxGradientMode.TwoColors:
                    return this.colorMin.mixTo(this.colorMax, randomBetween);
                case feng3d.MinMaxGradientMode.TwoGradients:
                    var min = this.gradientMin.getValue(time);
                    var max = this.gradientMax.getValue(time);
                    var v = min.mixTo(max, randomBetween);
                    return v;
                case feng3d.MinMaxGradientMode.RandomColor:
                    var v = this.gradient.getValue(randomBetween);
                    return v;
            }
            return this.color;
        };
        __decorate([
            feng3d.serialize
        ], MinMaxGradient.prototype, "mode", void 0);
        __decorate([
            feng3d.serialize
        ], MinMaxGradient.prototype, "color", void 0);
        __decorate([
            feng3d.serialize
        ], MinMaxGradient.prototype, "colorMin", void 0);
        __decorate([
            feng3d.serialize
        ], MinMaxGradient.prototype, "colorMax", void 0);
        __decorate([
            feng3d.serialize
        ], MinMaxGradient.prototype, "gradient", void 0);
        __decorate([
            feng3d.serialize
        ], MinMaxGradient.prototype, "gradientMin", void 0);
        __decorate([
            feng3d.serialize
        ], MinMaxGradient.prototype, "gradientMax", void 0);
        return MinMaxGradient;
    }());
    feng3d.MinMaxGradient = MinMaxGradient;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Bézier曲线
     * @see https://en.wikipedia.org/wiki/B%C3%A9zier_curve
     * @author feng / http://feng3d.com 03/06/2018
     */
    var BezierCurve = /** @class */ (function () {
        function BezierCurve() {
        }
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
        BezierCurve.prototype.linear = function (t, p0, p1) {
            return p0 + t * (p1 - p0);
            // return (1 - t) * p0 + t * p1;
        };
        /**
         * 线性Bézier曲线关于t的导数
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         */
        BezierCurve.prototype.linearDerivative = function (t, p0, p1) {
            return p1 - p0;
        };
        /**
         * 线性Bézier曲线关于t的二阶导数
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         */
        BezierCurve.prototype.linearSecondDerivative = function (t, p0, p1) {
            return 0;
        };
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
        BezierCurve.prototype.quadratic = function (t, p0, p1, p2) {
            // return this.linear(t, this.linear(t, p0, p1), this.linear(t, p1, p2));
            // return (1 - t) * ((1 - t) * p0 + t * p1) + t * ((1 - t) * p1 + t * p2);
            return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
        };
        /**
         * 二次Bézier曲线关于t的导数
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         * @param p2 点2
         */
        BezierCurve.prototype.quadraticDerivative = function (t, p0, p1, p2) {
            // return 2 * this.linear(t, this.linearDerivative(t, p0, p1), this.linearDerivative(t, p1, p2));
            return 2 * (1 - t) * (p1 - p0) + 2 * t * (p2 - p1);
        };
        /**
         * 二次Bézier曲线关于t的二阶导数
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         * @param p2 点2
         */
        BezierCurve.prototype.quadraticSecondDerivative = function (t, p0, p1, p2) {
            // return 1 * 2 * this.linearDerivative(t, p1 - p0, p2 - p1)
            // return 1 * 2 * ((p2 - p1) - (p1 - p0));
            return 2 * (p2 - 2 * p1 + p0);
        };
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
        BezierCurve.prototype.cubic = function (t, p0, p1, p2, p3) {
            // return this.linear(t, this.quadratic(t, p0, p1, p2), this.quadratic(t, p1, p2, p3));
            return (1 - t) * (1 - t) * (1 - t) * p0 + 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t * p3;
        };
        /**
         * 三次Bézier曲线关于t的导数
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         * @param p2 点2
         * @param p3 点3
         */
        BezierCurve.prototype.cubicDerivative = function (t, p0, p1, p2, p3) {
            // return 3 * this.linear(t, this.quadraticDerivative(t, p0, p1, p2), this.quadraticDerivative(t, p1, p2, p3));
            return 3 * (1 - t) * (1 - t) * (p1 - p0) + 6 * (1 - t) * t * (p2 - p1) + 3 * t * t * (p3 - p2);
        };
        /**
         * 三次Bézier曲线关于t的二阶导数
         * @param t 插值度
         * @param p0 点0
         * @param p1 点1
         * @param p2 点2
         */
        BezierCurve.prototype.cubicSecondDerivative = function (t, p0, p1, p2, p3) {
            // return 3 * this.linear(t, this.quadraticSecondDerivative(t, p0, p1, p2), this.quadraticSecondDerivative(t, p1, p2, p3));
            return 6 * (1 - t) * (p2 - 2 * p1 + p0) + 6 * t * (p3 - 2 * p2 + p1);
        };
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
        BezierCurve.prototype.bn = function (t, ps, processs) {
            if (processs === void 0) { processs = null; }
            ps = ps.concat();
            if (processs)
                processs.push(ps.concat());
            // n次Bézier递推
            for (var i = ps.length - 1; i > 0; i--) {
                for (var j = 0; j < i; j++) {
                    ps[j] = (1 - t) * ps[j] + t * ps[j + 1];
                }
                if (processs) {
                    ps.length = ps.length - 1;
                    processs.push(ps.concat());
                }
            }
            return ps[0];
        };
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
        BezierCurve.prototype.bnDerivative = function (t, ps) {
            if (ps.length < 2)
                return 0;
            ps = ps.concat();
            // 进行
            for (var i = 0, n = ps.length - 1; i < n; i++) {
                ps[i] = ps[i + 1] - ps[i];
            }
            //
            ps.length = ps.length - 1;
            var v = ps.length * this.bn(t, ps);
            return v;
        };
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
        BezierCurve.prototype.bnSecondDerivative = function (t, ps) {
            if (ps.length < 3)
                return 0;
            ps = ps.concat();
            // 进行
            for (var i = 0, n = ps.length - 1; i < n; i++) {
                ps[i] = ps[i + 1] - ps[i];
            }
            //
            ps.length = ps.length - 1;
            var v = ps.length * this.bnDerivative(t, ps);
            return v;
        };
        /**
         * n次Bézier曲线关于t的dn阶导数
         *
         * Bézier曲线可以定义为任意度n。
         *
         * @param t 插值度
         * @param dn 求导次数
         * @param ps 点列表     ps.length == n+1
         */
        BezierCurve.prototype.bnND = function (t, dn, ps) {
            if (ps.length < dn + 1)
                return 0;
            var factorial = 1;
            ps = ps.concat();
            for (var j = 0; j < dn; j++) {
                // 进行
                for (var i = 0, n = ps.length - 1; i < n; i++) {
                    ps[i] = ps[i + 1] - ps[i];
                }
                //
                ps.length = ps.length - 1;
                factorial *= ps.length;
            }
            var v = factorial * this.bn(t, ps);
            return v;
        };
        /**
         * 获取曲线在指定插值度上的值
         * @param t 插值度
         * @param ps 点列表
         */
        BezierCurve.prototype.getValue = function (t, ps) {
            if (ps.length == 2) {
                return this.linear(t, ps[0], ps[1]);
            }
            if (ps.length == 3) {
                return this.quadratic(t, ps[0], ps[1], ps[2]);
            }
            if (ps.length == 4) {
                return this.cubic(t, ps[0], ps[1], ps[2], ps[3]);
            }
            return this.bn(t, ps);
            // var t1 = 1 - t;
            // return t1 * t1 * t1 * ps[0] + 3 * t1 * t1 * t * ps[1] + 3 * t1 * t * t * ps[2] + t * t * t * ps[3];
        };
        /**
         * 获取曲线在指定插值度上的导数(斜率)
         * @param t 插值度
         * @param ps 点列表
         */
        BezierCurve.prototype.getDerivative = function (t, ps) {
            if (ps.length == 2) {
                return this.linearDerivative(t, ps[0], ps[1]);
            }
            if (ps.length == 3) {
                return this.quadraticDerivative(t, ps[0], ps[1], ps[2]);
            }
            if (ps.length == 4) {
                return this.cubicDerivative(t, ps[0], ps[1], ps[2], ps[3]);
            }
            return this.bnDerivative(t, ps);
            // return 3 * (1 - t) * (1 - t) * (ps[1] - ps[0]) + 6 * (1 - t) * t * (ps[2] - ps[1]) + 3 * t * t * (ps[3] - ps[2]);
        };
        /**
         * 获取曲线在指定插值度上的二阶导数
         * @param t 插值度
         * @param ps 点列表
         */
        BezierCurve.prototype.getSecondDerivative = function (t, ps) {
            if (ps.length == 2) {
                return this.linearSecondDerivative(t, ps[0], ps[1]);
            }
            if (ps.length == 3) {
                return this.quadraticSecondDerivative(t, ps[0], ps[1], ps[2]);
            }
            if (ps.length == 4) {
                return this.cubicSecondDerivative(t, ps[0], ps[1], ps[2], ps[3]);
            }
            return this.bnSecondDerivative(t, ps);
            // return 3 * (1 - t) * (1 - t) * (ps[1] - ps[0]) + 6 * (1 - t) * t * (ps[2] - ps[1]) + 3 * t * t * (ps[3] - ps[2]);
        };
        /**
         * 查找区间内极值列表
         *
         * @param ps 点列表
         * @param numSamples 采样次数，用于分段查找极值
         * @param precision  查找精度
         *
         * @returns 极值列表 {} {ts: 极值插值度列表,vs: 极值值列表}
         */
        BezierCurve.prototype.getExtremums = function (ps, numSamples, precision) {
            var _this = this;
            if (numSamples === void 0) { numSamples = 10; }
            if (precision === void 0) { precision = 0.0000001; }
            var samples = [];
            for (var i = 0; i <= numSamples; i++) {
                samples.push(this.getDerivative(i / numSamples, ps));
            }
            // 查找存在解的分段
            //
            var resultTs = [];
            var resultVs = [];
            for (var i = 0, n = numSamples; i < n; i++) {
                if (samples[i] * samples[i + 1] < 0) {
                    var guessT = feng3d.equationSolving.line(function (x) { return _this.getDerivative(x, ps); }, i / numSamples, (i + 1) / numSamples, precision);
                    resultTs.push(guessT);
                    resultVs.push(this.getValue(guessT, ps));
                }
            }
            return { ts: resultTs, vs: resultVs };
        };
        /**
         * 获取单调区间列表
         *
         * @param ps
         * @param numSamples
         * @param precision
         * @returns ts: 区间结点插值度列表,vs: 区间结点值列表
         */
        BezierCurve.prototype.getMonotoneIntervals = function (ps, numSamples, precision) {
            if (numSamples === void 0) { numSamples = 10; }
            if (precision === void 0) { precision = 0.0000001; }
            // 区间内的单调区间
            var monotoneIntervalTs = [0, 1];
            var monotoneIntervalVs = [ps[0], ps[ps.length - 1]];
            // 预先计算好极值
            var extremums = this.getExtremums(ps, numSamples, precision);
            for (var i = 0; i < extremums.ts.length; i++) {
                // 增加单调区间
                monotoneIntervalTs.splice(i + 1, 0, extremums.ts[i]);
                monotoneIntervalVs.splice(i + 1, 0, extremums.vs[i]);
            }
            return { ts: monotoneIntervalTs, vs: monotoneIntervalVs };
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
        BezierCurve.prototype.getTFromValue = function (targetV, ps, numSamples, precision) {
            var _this = this;
            if (numSamples === void 0) { numSamples = 10; }
            if (precision === void 0) { precision = 0.0000001; }
            // 获取单调区间
            var monotoneIntervals = this.getMonotoneIntervals(ps, numSamples, precision);
            var monotoneIntervalTs = monotoneIntervals.ts;
            var monotoneIntervalVs = monotoneIntervals.vs;
            // 存在解的单调区间
            var results = [];
            // 遍历单调区间
            for (var i = 0, n = monotoneIntervalVs.length - 1; i < n; i++) {
                if ((monotoneIntervalVs[i] - targetV) * (monotoneIntervalVs[i + 1] - targetV) <= 0) {
                    var fx = function (x) { return _this.getValue(x, ps) - targetV; };
                    // 连线法
                    var result = feng3d.equationSolving.line(fx, monotoneIntervalTs[i], monotoneIntervalTs[i + 1], precision);
                    results.push(result);
                }
            }
            return results;
        };
        /**
         * 分割曲线
         *
         * 在曲线插值度t位置分割为两条连接起来与原曲线完全重合的曲线
         *
         * @param t 分割位置（插值度）
         * @param ps 被分割曲线点列表
         * @returns 返回两条曲线组成的数组
         */
        BezierCurve.prototype.split = function (t, ps) {
            // 获取曲线的动画过程
            var processs = [];
            feng3d.bezierCurve.bn(t, ps, processs);
            // 第一条曲线
            var fps = [];
            // 第二条曲线
            var sps = [];
            // 使用当前t值进行分割曲线
            for (var i = processs.length - 1; i >= 0; i--) {
                if (i == processs.length - 1) {
                    // 添加关键点
                    fps.push(processs[i][0]);
                    fps.push(processs[i][0]);
                }
                else {
                    // 添加左右控制点
                    fps.unshift(processs[i][0]);
                    sps.push(processs[i].pop());
                }
            }
            return [fps, sps];
        };
        /**
         * 合并曲线
         *
         * 合并两条连接的曲线为一条曲线并且可以还原为分割前的曲线
         *
         * @param fps 第一条曲线点列表
         * @param sps 第二条曲线点列表
         * @param mergeType 合并方式。mergeType = 0时进行还原合并，还原拆分之前的曲线；mergeType = 1时进行拟合合并，合并后的曲线会经过两条曲线的连接点；
         */
        BezierCurve.prototype.merge = function (fps, sps, mergeType) {
            if (mergeType === void 0) { mergeType = 0; }
            fps = fps.concat();
            sps = sps.concat();
            var processs = [];
            var t;
            // 上条曲线
            var pps;
            // 当前曲线
            var ps;
            for (var i = 0, n = fps.length; i < n; i++) {
                ps = processs[i] = [];
                if (i == 0) {
                    processs[i][0] = fps.pop();
                    sps.shift();
                }
                else if (i == 1) {
                    // 计算t值
                    processs[i][0] = fps.pop();
                    processs[i][1] = sps.shift();
                    t = (processs[i - 1][0] - processs[i][0]) / (processs[i][1] - processs[i][0]);
                }
                else {
                    pps = processs[i - 1];
                    // 前面增加点
                    var nfp = fps.pop();
                    // 后面增加点
                    var nsp = sps.shift();
                    // 从前往后计算
                    var ps0 = [];
                    ps0[0] = nfp;
                    for (var j = 0, n_1 = pps.length; j < n_1; j++) {
                        ps0[j + 1] = ps0[j] + (pps[j] - ps0[j]) / t;
                    }
                    // 从后往前计算
                    var ps1 = [];
                    ps1[pps.length] = nsp;
                    for (var j = pps.length - 1; j >= 0; j--) {
                        ps1[j] = ps1[j + 1] - (ps1[j + 1] - pps[j]) / (1 - t);
                    }
                    // 拟合合并,合并前后两个方向的计算
                    if (mergeType == 1) {
                        for (var j = 0, n_2 = ps0.length - 1; j <= n_2; j++) {
                            ps[j] = (ps0[j] * (n_2 - j) + ps1[j] * j) / n_2;
                        }
                    }
                    else if (mergeType == 0) {
                        // 还原合并，前半段使用从前往后计算，后半段使用从后往前计算
                        for (var j = 0, n_3 = ps0.length - 1; j <= n_3; j++) {
                            if (j < n_3 / 2) {
                                ps[j] = ps0[j];
                            }
                            else if (j > n_3 / 2) {
                                ps[j] = ps1[j];
                            }
                            else {
                                ps[j] = (ps0[j] + ps1[j]) / 2;
                            }
                        }
                    }
                    else {
                        console.error("\u5408\u5E76\u7C7B\u578B mergeType " + mergeType + " \u9519\u8BEF!");
                    }
                }
            }
            return processs.pop();
        };
        /**
         * 获取曲线样本数据
         *
         * 这些点可用于连线来拟合曲线。
         *
         * @param ps 点列表
         * @param num 采样次数 ，采样点分别为[0,1/num,2/num,....,(num-1)/num,1]
         */
        BezierCurve.prototype.getSamples = function (ps, num) {
            if (num === void 0) { num = 100; }
            var results = [];
            for (var i = 0; i <= num; i++) {
                var t = i / num;
                var p = this.getValue(t, ps);
                results.push({ t: t, v: p });
            }
            return results;
        };
        return BezierCurve;
    }());
    feng3d.BezierCurve = BezierCurve;
    feng3d.bezierCurve = new BezierCurve();
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 动画曲线Wrap模式，处理超出范围情况
     */
    var AnimationCurveWrapMode;
    (function (AnimationCurveWrapMode) {
        /**
         * 夹紧; 0>-<1
         */
        AnimationCurveWrapMode[AnimationCurveWrapMode["Clamp"] = 1] = "Clamp";
        /**
         * 循环; 0->1,0->1
         */
        AnimationCurveWrapMode[AnimationCurveWrapMode["Loop"] = 2] = "Loop";
        /**
         * 来回循环; 0->1,1->0
         */
        AnimationCurveWrapMode[AnimationCurveWrapMode["PingPong"] = 4] = "PingPong";
    })(AnimationCurveWrapMode = feng3d.AnimationCurveWrapMode || (feng3d.AnimationCurveWrapMode = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 动画曲线
     *
     * 基于时间轴的连续三阶Bézier曲线
     */
    var AnimationCurve = /** @class */ (function () {
        function AnimationCurve() {
            /**
             * 最大tan值，超出该值后将会变成分段
             */
            this.maxtan = 1000;
            /**
             * The behaviour of the animation before the first keyframe.
             *
             * 在第一个关键帧之前的动画行为。
             */
            this.preWrapMode = feng3d.AnimationCurveWrapMode.Clamp;
            /**
             * The behaviour of the animation after the last keyframe.
             *
             * 动画在最后一个关键帧之后的行为。
             */
            this.postWrapMode = feng3d.AnimationCurveWrapMode.Clamp;
            /**
             * All keys defined in the animation curve.
             *
             * 动画曲线上所有关键字定义。
             *
             * 注： 该值已对时间排序，否则赋值前请使用 sort((a, b) => a.time - b.time) 进行排序
             */
            this.keys = [{ time: 0, value: 1, inTangent: 0, outTangent: 0 }, { time: 1, value: 1, inTangent: 0, outTangent: 0 }];
        }
        Object.defineProperty(AnimationCurve.prototype, "numKeys", {
            /**
             * 关键点数量
             */
            get: function () {
                return this.keys.length;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 添加关键点
         *
         * 添加关键点后将会执行按t进行排序
         *
         * @param key 关键点
         */
        AnimationCurve.prototype.addKey = function (key) {
            this.keys.push(key);
            this.sort();
        };
        /**
         * 关键点排序
         *
         * 当移动关键点或者新增关键点时需要再次排序
         */
        AnimationCurve.prototype.sort = function () {
            this.keys.sort(function (a, b) { return a.time - b.time; });
        };
        /**
         * 删除关键点
         * @param key 关键点
         */
        AnimationCurve.prototype.deleteKey = function (key) {
            var index = this.keys.indexOf(key);
            if (index != -1)
                this.keys.splice(index, 1);
        };
        /**
         * 获取关键点
         * @param index 索引
         */
        AnimationCurve.prototype.getKey = function (index) {
            return this.keys[index];
        };
        /**
         * 获取关键点索引
         * @param key 关键点
         */
        AnimationCurve.prototype.indexOfKeys = function (key) {
            return this.keys.indexOf(key);
        };
        /**
         * 获取曲线上点信息
         * @param t 时间轴的位置 [0,1]
         */
        AnimationCurve.prototype.getPoint = function (t) {
            var wrapMode = feng3d.AnimationCurveWrapMode.Clamp;
            if (t < 0)
                wrapMode = this.preWrapMode;
            else if (t > 1)
                wrapMode = this.postWrapMode;
            switch (wrapMode) {
                case feng3d.AnimationCurveWrapMode.Clamp:
                    t = Math.clamp(t, 0, 1);
                    break;
                case feng3d.AnimationCurveWrapMode.Loop:
                    t = Math.clamp(t - Math.floor(t), 0, 1);
                    break;
                case feng3d.AnimationCurveWrapMode.PingPong:
                    t = Math.clamp(t - Math.floor(t), 0, 1);
                    if (Math.floor(t) % 2 == 1)
                        t = 1 - t;
                    break;
            }
            var keys = this.keys;
            var maxtan = this.maxtan;
            var value = 0, tangent = 0, isfind = false;
            ;
            for (var i = 0, n = keys.length; i < n; i++) {
                // 使用 bezierCurve 进行采样曲线点
                var key = keys[i];
                var prekey = keys[i - 1];
                if (i > 0 && prekey.time <= t && t <= key.time) {
                    var xstart = prekey.time;
                    var ystart = prekey.value;
                    var tanstart = prekey.outTangent;
                    var xend = key.time;
                    var yend = key.value;
                    var tanend = key.inTangent;
                    if (maxtan > Math.abs(tanstart) && maxtan > Math.abs(tanend)) {
                        var ct = (t - prekey.time) / (key.time - prekey.time);
                        var sys = [ystart, ystart + tanstart * (xend - xstart) / 3, yend - tanend * (xend - xstart) / 3, yend];
                        var fy = feng3d.bezierCurve.getValue(ct, sys);
                        isfind = true;
                        value = fy;
                        tangent = feng3d.bezierCurve.getDerivative(ct, sys) / (xend - xstart);
                        break;
                    }
                    else {
                        isfind = true;
                        value = prekey.value;
                        tangent = 0;
                        break;
                    }
                }
                if (i == 0 && t <= key.time) {
                    isfind = true;
                    value = key.value;
                    tangent = 0;
                    break;
                }
                if (i == n - 1 && t >= key.time) {
                    isfind = true;
                    value = key.value;
                    tangent = 0;
                    break;
                }
            }
            if (keys.length == 0)
                return { time: t, value: 0, inTangent: 0, outTangent: 0 };
            console.assert(isfind);
            return { time: t, value: value, inTangent: tangent, outTangent: tangent };
        };
        /**
         * 获取值
         * @param t 时间轴的位置 [0,1]
         */
        AnimationCurve.prototype.getValue = function (t) {
            var point = this.getPoint(t);
            if (!point)
                return 0;
            return point.value;
        };
        /**
         * 查找关键点
         * @param t 时间轴的位置 [0,1]
         * @param y 值
         * @param precision 查找精度
         */
        AnimationCurve.prototype.findKey = function (t, y, precision) {
            var keys = this.keys;
            for (var i = 0; i < keys.length; i++) {
                if (Math.abs(keys[i].time - t) < precision && Math.abs(keys[i].value - y) < precision) {
                    return keys[i];
                }
            }
            return null;
        };
        /**
         * 添加曲线上的关键点
         *
         * 如果该点在曲线上，则添加关键点
         *
         * @param time 时间轴的位置 [0,1]
         * @param value 值
         * @param precision 查找进度
         */
        AnimationCurve.prototype.addKeyAtCurve = function (time, value, precision) {
            var point = this.getPoint(time);
            if (Math.abs(value - point.value) < precision) {
                this.keys.push(point);
                this.keys.sort(function (a, b) { return a.time - b.time; });
                return point;
            }
            return null;
        };
        /**
         * 获取曲线样本数据
         *
         * 这些点可用于连线来拟合曲线。
         *
         * @param num 采样次数 ，采样点分别为[0,1/num,2/num,....,(num-1)/num,1]
         */
        AnimationCurve.prototype.getSamples = function (num) {
            if (num === void 0) { num = 100; }
            var results = [];
            for (var i = 0; i <= num; i++) {
                var p = this.getPoint(i / num);
                results.push(p);
            }
            return results;
        };
        __decorate([
            feng3d.serialize
        ], AnimationCurve.prototype, "preWrapMode", void 0);
        __decorate([
            feng3d.serialize
        ], AnimationCurve.prototype, "postWrapMode", void 0);
        __decorate([
            feng3d.serialize
        ], AnimationCurve.prototype, "keys", void 0);
        return AnimationCurve;
    }());
    feng3d.AnimationCurve = AnimationCurve;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 曲线模式
     */
    var MinMaxCurveMode;
    (function (MinMaxCurveMode) {
        /**
         * Use a single constant for the MinMaxCurve.
         *
         * 使用单个常数。
         */
        MinMaxCurveMode[MinMaxCurveMode["Constant"] = 0] = "Constant";
        /**
         * Use a single curve for the MinMaxCurve.
         *
         * 使用一条曲线
         */
        MinMaxCurveMode[MinMaxCurveMode["Curve"] = 1] = "Curve";
        /**
         * Use a random value between 2 constants for the MinMaxCurve.
         *
         * 在两个常量之间使用一个随机值
         */
        MinMaxCurveMode[MinMaxCurveMode["TwoConstants"] = 3] = "TwoConstants";
        /**
         * Use a random value between 2 curves for the MinMaxCurve.
         *
         * 在两条曲线之间使用一个随机值。
         */
        MinMaxCurveMode[MinMaxCurveMode["TwoCurves"] = 2] = "TwoCurves";
    })(MinMaxCurveMode = feng3d.MinMaxCurveMode || (feng3d.MinMaxCurveMode = {}));
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * 最大最小曲线
     */
    var MinMaxCurve = /** @class */ (function () {
        function MinMaxCurve() {
            /**
             * 模式
             */
            this.mode = feng3d.MinMaxCurveMode.Constant;
            /**
             * Set the constant value.
             *
             * 设置常数值。
             */
            this.constant = 0;
            /**
             * Set a constant for the lower bound.
             *
             * 为下界设置一个常数。
             */
            this.constantMin = 0;
            /**
             * Set a constant for the upper bound.
             *
             * 为上界设置一个常数。
             */
            this.constantMax = 0;
            /**
             * Set the curve.
             *
             * 设置曲线。
             */
            this.curve = new feng3d.AnimationCurve();
            /**
             * Set a curve for the lower bound.
             *
             * 为下界设置一条曲线。
             */
            this.curveMin = new feng3d.AnimationCurve();
            /**
             * Set a curve for the upper bound.
             *
             * 为上界设置一条曲线。
             */
            this.curveMax = new feng3d.AnimationCurve();
            /**
             * Set a multiplier to be applied to the curves.
             *
             * 设置一个乘数应用于曲线。
             */
            this.curveMultiplier = 1;
            /**
             * 是否在编辑器中只显示Y轴 0-1 区域，例如 lifetime 为非负，需要设置为true
             */
            this.between0And1 = false;
        }
        /**
         * 获取值
         * @param time 时间
         */
        MinMaxCurve.prototype.getValue = function (time, randomBetween) {
            if (randomBetween === void 0) { randomBetween = Math.random(); }
            switch (this.mode) {
                case feng3d.MinMaxCurveMode.Constant:
                    return this.constant;
                case feng3d.MinMaxCurveMode.Curve:
                    return this.curve.getValue(time) * this.curveMultiplier;
                case feng3d.MinMaxCurveMode.TwoConstants:
                    return Math.lerp(this.constantMin, this.constantMax, randomBetween);
                case feng3d.MinMaxCurveMode.TwoCurves:
                    return Math.lerp(this.curveMin.getValue(time), this.curveMax.getValue(time), randomBetween) * this.curveMultiplier;
            }
            return this.constant;
        };
        __decorate([
            feng3d.serialize
        ], MinMaxCurve.prototype, "mode", void 0);
        __decorate([
            feng3d.serialize
        ], MinMaxCurve.prototype, "constant", void 0);
        __decorate([
            feng3d.serialize
        ], MinMaxCurve.prototype, "constantMin", void 0);
        __decorate([
            feng3d.serialize
        ], MinMaxCurve.prototype, "constantMax", void 0);
        __decorate([
            feng3d.serialize
        ], MinMaxCurve.prototype, "curve", void 0);
        __decorate([
            feng3d.serialize
        ], MinMaxCurve.prototype, "curveMin", void 0);
        __decorate([
            feng3d.serialize
        ], MinMaxCurve.prototype, "curveMax", void 0);
        __decorate([
            feng3d.serialize
        ], MinMaxCurve.prototype, "curveMultiplier", void 0);
        __decorate([
            feng3d.serialize
        ], MinMaxCurve.prototype, "between0And1", void 0);
        return MinMaxCurve;
    }());
    feng3d.MinMaxCurve = MinMaxCurve;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    var MinMaxCurveVector3 = /** @class */ (function () {
        function MinMaxCurveVector3() {
            /**
             * x 曲线
             */
            this.xCurve = new feng3d.MinMaxCurve();
            /**
             * y 曲线
             */
            this.yCurve = new feng3d.MinMaxCurve();
            /**
             * z 曲线
             */
            this.zCurve = new feng3d.MinMaxCurve();
        }
        /**
         * 获取值
         * @param time 时间
         */
        MinMaxCurveVector3.prototype.getValue = function (time, randomBetween) {
            if (randomBetween === void 0) { randomBetween = Math.random(); }
            return new feng3d.Vector3(this.xCurve.getValue(time, randomBetween), this.yCurve.getValue(time, randomBetween), this.zCurve.getValue(time, randomBetween));
        };
        __decorate([
            feng3d.serialize
        ], MinMaxCurveVector3.prototype, "xCurve", void 0);
        __decorate([
            feng3d.serialize
        ], MinMaxCurveVector3.prototype, "yCurve", void 0);
        __decorate([
            feng3d.serialize
        ], MinMaxCurveVector3.prototype, "zCurve", void 0);
        return MinMaxCurveVector3;
    }());
    feng3d.MinMaxCurveVector3 = MinMaxCurveVector3;
})(feng3d || (feng3d = {}));
var feng3d;
(function (feng3d) {
    /**
     * Ported from Stefan Gustavson's java implementation
     * http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf
     * Read Stefan's excellent paper for details on how this code works.
     *
     * Sean McCullough banksean@gmail.com
     *
     * Added 4D noise
     * Joshua Koo zz85nus@gmail.com
     *
     * @see https://github.com/mrdoob/three.js/blob/dev/examples/js/math/SimplexNoise.js
     *
     * 另外参考 https://github.com/WardBenjamin/SimplexNoise    https://github.com/sarveshsvaran/Procedural-Volumetric-Particles-from-3d-4d-noise/blob/master/Assets/Noise.cs
     */
    var SimplexNoise = /** @class */ (function () {
        /**
         * You can pass in a random number generator object if you like.
         * It is assumed to have a random() method.
         */
        function SimplexNoise(r) {
            if (r == undefined)
                r = Math;
            this._grad3 = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
                [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
                [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];
            this._grad4 = [[0, 1, 1, 1], [0, 1, 1, -1], [0, 1, -1, 1], [0, 1, -1, -1],
                [0, -1, 1, 1], [0, -1, 1, -1], [0, -1, -1, 1], [0, -1, -1, -1],
                [1, 0, 1, 1], [1, 0, 1, -1], [1, 0, -1, 1], [1, 0, -1, -1],
                [-1, 0, 1, 1], [-1, 0, 1, -1], [-1, 0, -1, 1], [-1, 0, -1, -1],
                [1, 1, 0, 1], [1, 1, 0, -1], [1, -1, 0, 1], [1, -1, 0, -1],
                [-1, 1, 0, 1], [-1, 1, 0, -1], [-1, -1, 0, 1], [-1, -1, 0, -1],
                [1, 1, 1, 0], [1, 1, -1, 0], [1, -1, 1, 0], [1, -1, -1, 0],
                [-1, 1, 1, 0], [-1, 1, -1, 0], [-1, -1, 1, 0], [-1, -1, -1, 0]];
            this._p = [];
            for (var i = 0; i < 256; i++) {
                this._p[i] = Math.floor(r.random() * 256);
            }
            // To remove the need for index wrapping, double the permutation table length
            this._perm = [];
            for (var i = 0; i < 512; i++) {
                this._perm[i] = this._p[i & 255];
            }
            // A lookup table to traverse the simplex around a given point in 4D.
            // Details can be found where this table is used, in the 4D noise method.
            this._simplex = [
                [0, 1, 2, 3], [0, 1, 3, 2], [0, 0, 0, 0], [0, 2, 3, 1], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [1, 2, 3, 0],
                [0, 2, 1, 3], [0, 0, 0, 0], [0, 3, 1, 2], [0, 3, 2, 1], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [1, 3, 2, 0],
                [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
                [1, 2, 0, 3], [0, 0, 0, 0], [1, 3, 0, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [2, 3, 0, 1], [2, 3, 1, 0],
                [1, 0, 2, 3], [1, 0, 3, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [2, 0, 3, 1], [0, 0, 0, 0], [2, 1, 3, 0],
                [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
                [2, 0, 1, 3], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [3, 0, 1, 2], [3, 0, 2, 1], [0, 0, 0, 0], [3, 1, 2, 0],
                [2, 1, 0, 3], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [3, 1, 0, 2], [0, 0, 0, 0], [3, 2, 0, 1], [3, 2, 1, 0]
            ];
        }
        SimplexNoise.prototype._dot = function (g, x, y) {
            return g[0] * x + g[1] * y;
        };
        SimplexNoise.prototype._dot3 = function (g, x, y, z) {
            return g[0] * x + g[1] * y + g[2] * z;
        };
        SimplexNoise.prototype._dot4 = function (g, x, y, z, w) {
            return g[0] * x + g[1] * y + g[2] * z + g[3] * w;
        };
        /**
         *
         * @param xin
         * @param yin
         */
        SimplexNoise.prototype.noise = function (xin, yin) {
            var n0, n1, n2; // Noise contributions from the three corners
            // Skew the input space to determine which simplex cell we're in
            var F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
            var s = (xin + yin) * F2; // Hairy factor for 2D
            var i = Math.floor(xin + s);
            var j = Math.floor(yin + s);
            var G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
            var t = (i + j) * G2;
            var X0 = i - t; // Unskew the cell origin back to (x,y) space
            var Y0 = j - t;
            var x0 = xin - X0; // The x,y distances from the cell origin
            var y0 = yin - Y0;
            // For the 2D case, the simplex shape is an equilateral triangle.
            // Determine which simplex we are in.
            var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
            if (x0 > y0) {
                i1 = 1;
                j1 = 0;
                // lower triangle, XY order: (0,0)->(1,0)->(1,1)
            }
            else {
                i1 = 0;
                j1 = 1;
            }
            // upper triangle, YX order: (0,0)->(0,1)->(1,1)
            // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
            // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
            // c = (3-sqrt(3))/6
            var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
            var y1 = y0 - j1 + G2;
            var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
            var y2 = y0 - 1.0 + 2.0 * G2;
            // Work out the hashed gradient indices of the three simplex corners
            var ii = i & 255;
            var jj = j & 255;
            var gi0 = this._perm[ii + this._perm[jj]] % 12;
            var gi1 = this._perm[ii + i1 + this._perm[jj + j1]] % 12;
            var gi2 = this._perm[ii + 1 + this._perm[jj + 1]] % 12;
            // Calculate the contribution from the three corners
            var t0 = 0.5 - x0 * x0 - y0 * y0;
            if (t0 < 0)
                n0 = 0.0;
            else {
                t0 *= t0;
                n0 = t0 * t0 * this._dot(this._grad3[gi0], x0, y0); // (x,y) of grad3 used for 2D gradient
            }
            var t1 = 0.5 - x1 * x1 - y1 * y1;
            if (t1 < 0)
                n1 = 0.0;
            else {
                t1 *= t1;
                n1 = t1 * t1 * this._dot(this._grad3[gi1], x1, y1);
            }
            var t2 = 0.5 - x2 * x2 - y2 * y2;
            if (t2 < 0)
                n2 = 0.0;
            else {
                t2 *= t2;
                n2 = t2 * t2 * this._dot(this._grad3[gi2], x2, y2);
            }
            // Add contributions from each corner to get the final noise value.
            // The result is scaled to return values in the interval [-1,1].
            return 70.0 * (n0 + n1 + n2);
        };
        /**
         * 3D simplex noise
         *
         * @param xin
         * @param yin
         * @param zin
         */
        SimplexNoise.prototype.noise3d = function (xin, yin, zin) {
            var n0, n1, n2, n3; // Noise contributions from the four corners
            // Skew the input space to determine which simplex cell we're in
            var F3 = 1.0 / 3.0;
            var s = (xin + yin + zin) * F3; // Very nice and simple skew factor for 3D
            var i = Math.floor(xin + s);
            var j = Math.floor(yin + s);
            var k = Math.floor(zin + s);
            var G3 = 1.0 / 6.0; // Very nice and simple unskew factor, too
            var t = (i + j + k) * G3;
            var X0 = i - t; // Unskew the cell origin back to (x,y,z) space
            var Y0 = j - t;
            var Z0 = k - t;
            var x0 = xin - X0; // The x,y,z distances from the cell origin
            var y0 = yin - Y0;
            var z0 = zin - Z0;
            // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
            // Determine which simplex we are in.
            var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
            var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
            if (x0 >= y0) {
                if (y0 >= z0) {
                    i1 = 1;
                    j1 = 0;
                    k1 = 0;
                    i2 = 1;
                    j2 = 1;
                    k2 = 0;
                    // X Y Z order
                }
                else if (x0 >= z0) {
                    i1 = 1;
                    j1 = 0;
                    k1 = 0;
                    i2 = 1;
                    j2 = 0;
                    k2 = 1;
                    // X Z Y order
                }
                else {
                    i1 = 0;
                    j1 = 0;
                    k1 = 1;
                    i2 = 1;
                    j2 = 0;
                    k2 = 1;
                } // Z X Y order
            }
            else { // x0<y0
                if (y0 < z0) {
                    i1 = 0;
                    j1 = 0;
                    k1 = 1;
                    i2 = 0;
                    j2 = 1;
                    k2 = 1;
                    // Z Y X order
                }
                else if (x0 < z0) {
                    i1 = 0;
                    j1 = 1;
                    k1 = 0;
                    i2 = 0;
                    j2 = 1;
                    k2 = 1;
                    // Y Z X order
                }
                else {
                    i1 = 0;
                    j1 = 1;
                    k1 = 0;
                    i2 = 1;
                    j2 = 1;
                    k2 = 0;
                } // Y X Z order
            }
            // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
            // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
            // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
            // c = 1/6.
            var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
            var y1 = y0 - j1 + G3;
            var z1 = z0 - k1 + G3;
            var x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
            var y2 = y0 - j2 + 2.0 * G3;
            var z2 = z0 - k2 + 2.0 * G3;
            var x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
            var y3 = y0 - 1.0 + 3.0 * G3;
            var z3 = z0 - 1.0 + 3.0 * G3;
            // Work out the hashed gradient indices of the four simplex corners
            var ii = i & 255;
            var jj = j & 255;
            var kk = k & 255;
            var gi0 = this._perm[ii + this._perm[jj + this._perm[kk]]] % 12;
            var gi1 = this._perm[ii + i1 + this._perm[jj + j1 + this._perm[kk + k1]]] % 12;
            var gi2 = this._perm[ii + i2 + this._perm[jj + j2 + this._perm[kk + k2]]] % 12;
            var gi3 = this._perm[ii + 1 + this._perm[jj + 1 + this._perm[kk + 1]]] % 12;
            // Calculate the contribution from the four corners
            var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
            if (t0 < 0)
                n0 = 0.0;
            else {
                t0 *= t0;
                n0 = t0 * t0 * this._dot3(this._grad3[gi0], x0, y0, z0);
            }
            var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
            if (t1 < 0)
                n1 = 0.0;
            else {
                t1 *= t1;
                n1 = t1 * t1 * this._dot3(this._grad3[gi1], x1, y1, z1);
            }
            var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
            if (t2 < 0)
                n2 = 0.0;
            else {
                t2 *= t2;
                n2 = t2 * t2 * this._dot3(this._grad3[gi2], x2, y2, z2);
            }
            var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
            if (t3 < 0)
                n3 = 0.0;
            else {
                t3 *= t3;
                n3 = t3 * t3 * this._dot3(this._grad3[gi3], x3, y3, z3);
            }
            // Add contributions from each corner to get the final noise value.
            // The result is scaled to stay just inside [-1,1]
            return 32.0 * (n0 + n1 + n2 + n3);
        };
        /**
         * 4D simplex noise
         *
         * @param x
         * @param y
         * @param z
         * @param w
         */
        SimplexNoise.prototype.noise4d = function (x, y, z, w) {
            // For faster and easier lookups
            var grad4 = this._grad4;
            var simplex = this._simplex;
            var perm = this._perm;
            // The skewing and unskewing factors are hairy again for the 4D case
            var F4 = (Math.sqrt(5.0) - 1.0) / 4.0;
            var G4 = (5.0 - Math.sqrt(5.0)) / 20.0;
            var n0, n1, n2, n3, n4; // Noise contributions from the five corners
            // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
            var s = (x + y + z + w) * F4; // Factor for 4D skewing
            var i = Math.floor(x + s);
            var j = Math.floor(y + s);
            var k = Math.floor(z + s);
            var l = Math.floor(w + s);
            var t = (i + j + k + l) * G4; // Factor for 4D unskewing
            var X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
            var Y0 = j - t;
            var Z0 = k - t;
            var W0 = l - t;
            var x0 = x - X0; // The x,y,z,w distances from the cell origin
            var y0 = y - Y0;
            var z0 = z - Z0;
            var w0 = w - W0;
            // For the 4D case, the simplex is a 4D shape I won't even try to describe.
            // To find out which of the 24 possible simplices we're in, we need to
            // determine the magnitude ordering of x0, y0, z0 and w0.
            // The method below is a good way of finding the ordering of x,y,z,w and
            // then find the correct traversal order for the simplex we’re in.
            // First, six pair-wise comparisons are performed between each possible pair
            // of the four coordinates, and the results are used to add up binary bits
            // for an integer index.
            var c1 = (x0 > y0) ? 32 : 0;
            var c2 = (x0 > z0) ? 16 : 0;
            var c3 = (y0 > z0) ? 8 : 0;
            var c4 = (x0 > w0) ? 4 : 0;
            var c5 = (y0 > w0) ? 2 : 0;
            var c6 = (z0 > w0) ? 1 : 0;
            var c = c1 + c2 + c3 + c4 + c5 + c6;
            var i1, j1, k1, l1; // The integer offsets for the second simplex corner
            var i2, j2, k2, l2; // The integer offsets for the third simplex corner
            var i3, j3, k3, l3; // The integer offsets for the fourth simplex corner
            // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
            // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
            // impossible. Only the 24 indices which have non-zero entries make any sense.
            // We use a thresholding to set the coordinates in turn from the largest magnitude.
            // The number 3 in the "simplex" array is at the position of the largest coordinate.
            i1 = simplex[c][0] >= 3 ? 1 : 0;
            j1 = simplex[c][1] >= 3 ? 1 : 0;
            k1 = simplex[c][2] >= 3 ? 1 : 0;
            l1 = simplex[c][3] >= 3 ? 1 : 0;
            // The number 2 in the "simplex" array is at the second largest coordinate.
            i2 = simplex[c][0] >= 2 ? 1 : 0;
            j2 = simplex[c][1] >= 2 ? 1 : 0;
            k2 = simplex[c][2] >= 2 ? 1 : 0;
            l2 = simplex[c][3] >= 2 ? 1 : 0;
            // The number 1 in the "simplex" array is at the second smallest coordinate.
            i3 = simplex[c][0] >= 1 ? 1 : 0;
            j3 = simplex[c][1] >= 1 ? 1 : 0;
            k3 = simplex[c][2] >= 1 ? 1 : 0;
            l3 = simplex[c][3] >= 1 ? 1 : 0;
            // The fifth corner has all coordinate offsets = 1, so no need to look that up.
            var x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
            var y1 = y0 - j1 + G4;
            var z1 = z0 - k1 + G4;
            var w1 = w0 - l1 + G4;
            var x2 = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
            var y2 = y0 - j2 + 2.0 * G4;
            var z2 = z0 - k2 + 2.0 * G4;
            var w2 = w0 - l2 + 2.0 * G4;
            var x3 = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
            var y3 = y0 - j3 + 3.0 * G4;
            var z3 = z0 - k3 + 3.0 * G4;
            var w3 = w0 - l3 + 3.0 * G4;
            var x4 = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
            var y4 = y0 - 1.0 + 4.0 * G4;
            var z4 = z0 - 1.0 + 4.0 * G4;
            var w4 = w0 - 1.0 + 4.0 * G4;
            // Work out the hashed gradient indices of the five simplex corners
            var ii = i & 255;
            var jj = j & 255;
            var kk = k & 255;
            var ll = l & 255;
            var gi0 = perm[ii + perm[jj + perm[kk + perm[ll]]]] % 32;
            var gi1 = perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]] % 32;
            var gi2 = perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]] % 32;
            var gi3 = perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]] % 32;
            var gi4 = perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]] % 32;
            // Calculate the contribution from the five corners
            var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
            if (t0 < 0)
                n0 = 0.0;
            else {
                t0 *= t0;
                n0 = t0 * t0 * this._dot4(grad4[gi0], x0, y0, z0, w0);
            }
            var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
            if (t1 < 0)
                n1 = 0.0;
            else {
                t1 *= t1;
                n1 = t1 * t1 * this._dot4(grad4[gi1], x1, y1, z1, w1);
            }
            var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
            if (t2 < 0)
                n2 = 0.0;
            else {
                t2 *= t2;
                n2 = t2 * t2 * this._dot4(grad4[gi2], x2, y2, z2, w2);
            }
            var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
            if (t3 < 0)
                n3 = 0.0;
            else {
                t3 *= t3;
                n3 = t3 * t3 * this._dot4(grad4[gi3], x3, y3, z3, w3);
            }
            var t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
            if (t4 < 0)
                n4 = 0.0;
            else {
                t4 *= t4;
                n4 = t4 * t4 * this._dot4(grad4[gi4], x4, y4, z4, w4);
            }
            // Sum up and scale the result to cover the range [-1,1]
            return 27.0 * (n0 + n1 + n2 + n3 + n4);
        };
        return SimplexNoise;
    }());
    feng3d.SimplexNoise = SimplexNoise;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=math.js.map