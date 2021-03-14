namespace feng3d
{
    /**
     * 构造函数
     */
    export type Constructor<T> = (new (...args: any[]) => T);

    /**
     * 让T中以及所有键值中的所有键都是可选的
     */
    export type gPartial<T> = {
        [P in keyof T]?: gPartial<T[P]>;
    };

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
     * var a: NonTypePropertyNames<A, number>; //var a:"f"
     * var a1: NonTypePropertyNames<A, Function>; //var a:"a"
     * 
     * ```
     */
    export type NonTypePropertyNames<T, KT> = { [K in keyof T]: T[K] extends KT ? never : K }[keyof T];

    /**
     * 剔除T类型中值为KT类型的键
     * ```
     *     class A
     *     {
     *         a = 1;
     *         f(){}
     *     }
     * 
     *     var a: NonTypePropertys<A, number>; //var a: Pick<A, "f">
     *     var a1: NonTypePropertys<A, Function>; //var a1: Pick<A, "a">
     * ```
     */
    export type NonTypePropertys<T, KT> = Pick<T, NonTypePropertyNames<T, KT>>;

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
     *     var a: TypePropertyNames<A, number>; //var a: "a"
     *     var a1: TypePropertyNames<A, Function>; //var a1: "f"
     * ```
     */
    export type TypePropertyNames<T, KT> = { [K in keyof T]: T[K] extends KT ? K : never }[keyof T];

    /**
     * 选取T类型中值为非函数类型的所有键
     */
    export type PropertyNames<T> = NonTypePropertyNames<T, Function>;

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
     *     var a: FunctionPropertyNames<A>; //var a: "f"
     * ```
     */
    export type FunctionPropertyNames<T> = TypePropertyNames<T, Function>;

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
     *     var a: TypePropertys<A, number>; //var a: Pick<A, "a">
     *     var a1: TypePropertys<A, Function>; //var a1: Pick<A, "f">
     * ```
     */
    export type TypePropertys<T, KT> = Pick<T, TypePropertyNames<T, KT>>;

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
