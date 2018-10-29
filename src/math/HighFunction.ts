namespace feng3d
{
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
    export class HighFunction
    {
        private as: number[];

        /**
         * 构建函数
         * @param as 函数系数 a0-an 数组
         */
        constructor(as: number[])
        {
            this.as = as;
        }

        /**
         * 获取函数 f(x) 的值
         * @param x x坐标
         */
        getValue(x: number)
        {
            var v = 0;
            var as = this.as;
            for (let i = 0, n = as.length; i < n; i++)
            {
                v = v * x + as[i];
            }
            return v;
        }
    }
}