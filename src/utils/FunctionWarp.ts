namespace feng3d
{
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
         * @param warpFunc 在函数执行前执行的函数
         * @param before 运行在原函数之前
         */
        wrap<T, K extends keyof T, V extends T[K] & Function>(space: T, funcName: K, warpFunc: V, before = true)
        {
            if (warpFunc == undefined) return;

            if (!Object.getOwnPropertyDescriptor(space, __functionwarp__))
            {
                Object.defineProperty(space, __functionwarp__, { value: {}, configurable: true });
            }

            var info: { space: T, funcName: K, original: Function, funcs: Function[] } = space[__functionwarp__][funcName];
            if (!info)
            {
                var original: Function = <any>space[funcName];
                space[__functionwarp__][funcName] = info = { space: space, funcName: funcName, original: original, funcs: [original] };
            }
            var funcs = info.funcs;

            if (before) funcs.unshift(warpFunc);
            else funcs.push(warpFunc);

            space[funcName] = <any>function ()
            {
                var args = arguments;
                info.funcs.forEach(f =>
                {
                    f.apply(this, args);
                });
            }
        }
    }

    export const __functionwarp__ = "__functionwarp__";
    export const functionwarp = new FunctionWarp();
}