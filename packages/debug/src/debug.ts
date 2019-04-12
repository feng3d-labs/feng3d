namespace feng3d
{
    /**
     * 是否开启调试(主要用于断言)
     */
    export var debuger = true;

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



    var debugerFunc = () => { debugger; };
    wrapFunction(console, "log", debugerFunc);

    /**
     * 包装函数
     * 
     * 一般用于调试
     * 使用场景示例：
     * 1. 在函数执行前后记录时间来计算函数执行时间。
     * 1. 在console.error调用前使用 debugger 进行断点调试。
     * 
     * @param space 函数所属对象或者原型
     * @param funcName 函数名称
     * @param pf 在函数执行前执行的函数
     * @param nf 在函数执行后执行的函数
     */
    function wrapFunction<T, K extends keyof T, V extends T[K]>(space: T, funcName: K, pf?: V, nf?: V)
    {
        if (pf == undefined && nf == undefined) return;

        var oldlog: Function = <any>space[funcName];
        space[funcName] = <any>function ()
        {
            pf && (<any>pf)(this, arguments);
            oldlog.apply(this, arguments);
            nf && (<any>nf)(this, arguments);
        }
    }
}