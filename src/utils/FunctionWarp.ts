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

        /**
         * 包装一个异步函数，使其避免重复执行
         * 
         * 使用场景示例：同时加载同一资源时，使其只加载一次，完成后调用所有相关回调函数。
         * 
         * @param funcHost 函数所属对象
         * @param func 函数
         * @param params 函数除callback外的参数列表
         * @param callback 完成回调函数
         */
        wrapAsyncFunc(funcHost: Object, func: Function, params: any[], callback: (...args: any[]) => void)
        {
            // 获取唯一编号
            var cuuid = uuid.getArrayUuid([func].concat(params));
            // 检查是否执行过
            var result = this._wrapFResult[cuuid];
            if (result)
            {
                callback.apply(null, result);
                return;
            }
            // 监听执行完成事件
            event.once(this, cuuid, () =>
            {
                // 完成时重新执行函数
                this.wrapAsyncFunc(funcHost, func, params, callback);
            });
            // 正在执行时直接返回等待完成事件
            if (this._state[cuuid]) return;
            // 标记正在执行中
            this._state[cuuid] = true;

            // 执行函数
            func.apply(funcHost, params.concat((...args: any[]) =>
            {
                // 清理执行标记
                delete this._state[cuuid];
                // 保存执行结果
                this._wrapFResult[cuuid] = args;
                // 通知执行完成
                event.dispatch(this, cuuid);
            }));
        }

        private _wrapFResult: { [cuuid: string]: any } = {};
        private _state: { [uuid: string]: boolean } = {};
    }

    export const __functionwarp__ = "__functionwarp__";
    export const functionwarp = new FunctionWarp();
}