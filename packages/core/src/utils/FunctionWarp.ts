import { event } from '@feng3d/event';
import { deleteItem, FunctionPropertyNames } from '@feng3d/polyfill';
import { uuid } from './Uuid';

type Wraps<T, K extends keyof T> = {
    [P in K]: { space: T, funcName: K, oldPropertyDescriptor: PropertyDescriptor, original: (...args: any[]) => any, funcs: ((...args: any[]) => any)[] };
};

/**
 * 函数经
 *
 * 包装函数，以及对应的拆包
 */
export class FunctionWrap
{
    /**
     * 扩展继承函数
     *
     * 可用于扩展原型中原有API中的实现
     *
     * ```
    class A
    {
        a = "a";

        f(p: string = "p", p1: string = "")
        {
            return p + p1;
        }

        extendF: (p?: string, p1?: string) => string;
        oldf: (p?: string, p1?: string) => string;
    }

    var a = new A();
    a.oldf = a.f;
    a.extendF = function (p: string = "p", p1: string = "")
    {
        return ["polyfill", this.a, this.oldf()].join("-")
    }
    functionwrap.extendFunction(a, "f", function (r)
    {
        return ["polyfill", this.a, r].join("-");
    });
    // 验证 被扩展的a.f方法是否等价于 a.extendF
    assert.ok(a.f() === a.extendF()); //true

     * ```
     *
     * @param object 被扩展函数所属对象或者原型
     * @param funcName 被扩展函数名称
     * @param extendFunc 在函数执行后执行的扩展函数
     */
    extendFunction<T, K extends FunctionPropertyNames<T>, V extends(T[K] & ((...arg: any) => any))>(object: T, funcName: K, extendFunc: (this: T, r: ReturnType<V>, ...ps: Parameters<V>) => ReturnType<V>)
    {
        const oldFun = object[funcName];
        object[funcName] = (function (...args: Parameters<V>)
        {
            let r = (oldFun as any).apply(this, args);
            const args1 = args.concat();
            args1.unshift(r);
            r = extendFunc.apply(this, args1);

            return r;
        }) as any;
    }

    /**
     * 包装函数
     *
     * 一般用于调试
     * 使用场景示例：
     * 1. 在函数执行前后记录时间来计算函数执行时间。
     * 1. 在console.error调用前使用 debugger 进行断点调试。
     *
     * @param object 函数所属对象或者原型
     * @param funcName 函数名称
     * @param beforeFunc 在函数执行前执行的函数
     * @param afterFunc 在函数执行后执行的函数
     */
    wrap<T, K extends FunctionPropertyNames<T>, F extends(T[K] & ((...arg: any) => any))>(object: T, funcName: K, beforeFunc?: F, afterFunc?: F)
    {
        if (!beforeFunc && !afterFunc) return;

        if (!Object.getOwnPropertyDescriptor(object, __functionwrap__))
        {
            Object.defineProperty(object, __functionwrap__, { value: {}, configurable: true, enumerable: false, writable: false });
        }

        const functionwraps: Wraps<T, K> = object[__functionwrap__];
        let info = functionwraps[funcName];
        if (!info)
        {
            const oldPropertyDescriptor = Object.getOwnPropertyDescriptor(object, funcName);
            const original: any = object[funcName];
            functionwraps[funcName] = info = { space: object, funcName, oldPropertyDescriptor, original, funcs: [original] };
            //
            object[funcName] = function ()
            {
                // eslint-disable-next-line prefer-rest-params
                const args = arguments;
                info.funcs.forEach((f) =>
                {
                    f.apply(this, args);
                });
            } as any;
        }
        const funcs = info.funcs;
        if (beforeFunc)
        {
            deleteItem(funcs, beforeFunc);
            funcs.unshift(beforeFunc);
        }
        if (afterFunc)
        {
            deleteItem(funcs, afterFunc);
            funcs.push(afterFunc);
        }
    }

    /**
     * 取消包装函数
     *
     * 与wrap函数对应
     *
     * @param object 函数所属对象或者原型
     * @param funcName 函数名称
     * @param wrapFunc 在函数执行前执行的函数
     */
    unwrap<T, K extends FunctionPropertyNames<T>, V extends T[K]>(object: T, funcName: K, wrapFunc?: V)
    {
        const functionwraps: Wraps<T, K> = object[__functionwrap__];
        const info = functionwraps[funcName];
        if (!info) return;
        if (wrapFunc === undefined)
        {
            info.funcs = [info.original];
        }
        else
        {
            deleteItem(info.funcs, wrapFunc as any);
        }
        if (info.funcs.length === 1)
        {
            delete object[funcName];
            if (info.oldPropertyDescriptor)
            { Object.defineProperty(object, funcName, info.oldPropertyDescriptor); }
            delete functionwraps[funcName];

            if (Object.keys(functionwraps).length === 0)
            {
                delete object[__functionwrap__];
            }
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
    wrapAsyncFunc(funcHost: any, func: (...args: any[]) => any, params: any[], callback: (...args: any[]) => void)
    {
        // 获取唯一编号
        const cuuid = uuid.getArrayUuid([func].concat(params));
        // 检查是否执行过
        const result = this._wrapFResult[cuuid];
        if (result)
        {
            // eslint-disable-next-line prefer-spread
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
            event.emit(this, cuuid);
        }));
    }

    private _wrapFResult: { [cuuid: string]: any } = {};
    private _state: { [uuid: string]: boolean } = {};
}

export const __functionwrap__ = '__functionwrap__';
export const functionwrap = new FunctionWrap();
