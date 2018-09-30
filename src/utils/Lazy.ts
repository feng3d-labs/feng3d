namespace feng3d
{
    export type Lazy<T> = T | (() => T);

    export type LazyObject<T> = { [P in keyof T]: Lazy<T[P]>; };

    export var lazy = {
        getvalue: function <T>(lazyItem: Lazy<T>): T
        {
            if (typeof lazyItem == "function")
                return lazyItem();
            return lazyItem;
        }
    };
}
