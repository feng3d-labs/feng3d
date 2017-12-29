namespace feng3d
{
    /**
     * 测试代码运行时间
     * @param fn 被测试的方法
     * @param labal 标签
     */
    export function time(fn: Function, labal?: string)
    {
        labal = labal || fn["name"] || "Anonymous function " + Math.random();
        console.time(labal);
        fn();
        console.timeEnd(labal);
    }

    /**
     * 断言，测试不通过时报错
     * @param test 测试项
     * @param message 测试失败时提示信息
     * @param optionalParams 
     */
    export function assert(test?: boolean, message?: string, ...optionalParams: any[])
    {
        if (!test)
            debugger;
        console.assert.apply(null, arguments);
    }

    /**
     * 输出错误
     * @param message 错误信息
     * @param optionalParams 
     */
    export function error(message?: any, ...optionalParams: any[])
    {
        debugger;
        console.error.apply(null, arguments);
    }

    /**
     * 记录日志信息
     * @param message 日志信息
     * @param optionalParams 
     */
    export function log(message?: any, ...optionalParams: any[])
    {
        console.log.apply(null, arguments);
    }

    /**
     * 警告
     * @param message 警告信息
     * @param optionalParams 
     */
    export function warn(message?: any, ...optionalParams: any[])
    {
        console.warn.apply(null, arguments);
    }
}