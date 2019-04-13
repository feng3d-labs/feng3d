type gPartial<T> = {
    [P in keyof T]?: gPartial<T[P]>;
};