type gPartial<T> = {
    [P in keyof T]?: gPartial<T[P]>;
};

namespace feng3d
{
    /**
     * feng3d的版本号
     */
    export var revision: string = "2018.08.22";

    /**
     * 是否开启调试(主要用于断言)
     */
    export var debuger = true;

    log(`feng3d version ${revision}`)
}