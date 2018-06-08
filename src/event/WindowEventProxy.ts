namespace feng3d
{
    export interface WindowEventProxy
    {
        once<K extends keyof WindowEventMap>(type: K, listener: (event: WindowEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof WindowEventMap>(type: K, data?: WindowEventMap[K], bubbles?: boolean);
        has<K extends keyof WindowEventMap>(type: K): boolean;
        on<K extends keyof WindowEventMap>(type: K, listener: (event: WindowEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof WindowEventMap>(type?: K, listener?: (event: WindowEventMap[K]) => any, thisObject?: any);
    }

    export class WindowEventProxy extends EventProxy { }

    declare var global;
    declare var window;
    /**
     * 键盘鼠标输入
     */
    export var windowEventProxy: WindowEventProxy;

    if (typeof global != "undefined")
        windowEventProxy = new WindowEventProxy(global);
    else
        windowEventProxy = new WindowEventProxy(window);
}