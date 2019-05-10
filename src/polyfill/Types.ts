namespace feng3d
{
    /**
     * 让T中以及所有属性中的所有属性都是可选的
     */
    export type gPartial<T> = {
        [P in keyof T]?: gPartial<T[P]>;
    };

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
