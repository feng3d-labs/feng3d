namespace feng3d
{
    export var functionwarp: FunctionWarp;

    /**
     * 函数经
     * 
     * 包装函数，以及对应的拆包
     */
    export class FunctionWarp
    {
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
        wrap<T, K extends keyof T, V extends T[K]>(space: T, funcName: K, pf?: V, nf?: V)
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

    functionwarp = new FunctionWarp();
}