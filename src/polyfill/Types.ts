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
}
