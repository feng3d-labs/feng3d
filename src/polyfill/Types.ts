namespace feng3d
{
    /**
     * 让T中以及所有键值中的所有键都是可选的
     */
    export type gPartial<T> = {
        [P in keyof T]?: gPartial<T[P]>;
    };

    /**
     * 任意函数
     */
    export type AnyFunction = (...args: any) => any;

    type ExcludeTypeTemp<T, KT, K> = K extends keyof T ? (T[K] extends KT ? never : K) : never;
    /**
     * 获取T类型中除值为KT类型以外的所有键
     * 
     * ```
     * class A
     * {
     *      a = 1;
     *      f(){}
     * }
     * 
     * var a: ExcludeTypeKeys<A, number>; //var a:"f"
     * var a1: ExcludeTypeKeys<A, AnyFunction>; //var a:"a"
     * 
     * ```
     */
    export type ExcludeTypeKeys<T, KT> = ExcludeTypeTemp<T, KT, keyof T>;
    /**
     * 剔除T类型中值为KT类型的键
     * ```
     *     class A
     *     {
     *         a = 1;
     *         f(){}
     *     }
     * 
     *     var a: ExcludeType<A, number>; //var a: Pick<A, "f">
     *     var a1: ExcludeType<A, AnyFunction>; //var a1: Pick<A, "a">
     * ```
     */
    export type ExcludeType<T, KT> = Pick<T, ExcludeTypeKeys<T, KT>>;

    type ExtractTypeTemp<T, KT, K> = K extends keyof T ? (T[K] extends KT ? K : never) : never;
    /**
     * 选取T类型中值为KT类型的所有键
     * 
     * ```
     *     class A
     *     {
     *         a = 1;
     *         f(){}
     *     }
     * 
     *     var a: ExtractTypeKeys<A, number>; //var a: "a"
     *     var a1: ExtractTypeKeys<A, AnyFunction>; //var a1: "f"
     * ```
     */
    export type ExtractTypeKeys<T, KT> = ExtractTypeTemp<T, KT, keyof T>;

    /**
     * 选取T类型中值为函数的所有键
     * 
     * ```
     *     class A
     *     {
     *         a = 1;
     *         f(){}
     *     }
     * 
     *     var a: ExtractFunctionKeys<A>; //var a: "f"
     * ```
     */
    export type ExtractFunctionKeys<T> = ExtractTypeTemp<T, AnyFunction, keyof T>;

    /**
     * 选取T类型中值为KT类型的键
     * 
     * ```
     *     class A
     *     {
     *         a = 1;
     *         f() { }
     *     }
     * 
     *     var a: ExtractType<A, number>; //var a: Pick<A, "a">
     *     var a1: ExtractType<A, AnyFunction>; //var a1: Pick<A, "f">
     * ```
     */
    export type ExtractType<T, KT> = Pick<T, ExtractTypeKeys<T, KT>>;



    export type Lazy<T> = T | (() => T);

    export type LazyObject<T> = { [P in keyof T]: Lazy<T[P]>; };

    export var lazy = {
        getvalue: function <T>(lazyItem: Lazy<T>): T
        {
            if (typeof lazyItem == "function")
                return (<any>lazyItem)();
            return lazyItem;
        }
    };

    /**
     * 可销毁对象
     */
    export interface IDisposable
    {
        /**
         * 是否已销毁
         */
        readonly disposed: boolean;

        /**
         * 销毁
         */
        dispose(): void;
    }
}
