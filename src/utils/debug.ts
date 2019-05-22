namespace feng3d
{
    /**
     * 调试工具
     */
    export var debug: Debug;

    /**
     * 是否开启调试
     */
    export var debuger = true;

    /**
     * 调试工具
     */
    export class Debug
    {

        constructor()
        {
            // 断言失败前进入断点调试
            functionwrap.wrap(console, "assert", (test: boolean) => { if (!test) debugger; });
            // 输出错误前进入断点调试
            functionwrap.wrap(console, "error", () => { debugger; });
            functionwrap.wrap(console, "warn", () => { debugger; });
        }

        /**
         * 测试代码运行时间
         * @param fn 被测试的方法
         * @param labal 标签
         */
        time(fn: Function, labal?: string)
        {
            labal = labal || fn["name"] || "Anonymous function " + Math.random();
            console.time(labal);
            fn();
            console.timeEnd(labal);
        }
    }
    debug = new Debug();
}