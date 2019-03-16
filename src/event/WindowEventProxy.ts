namespace feng3d
{
    export interface WindowEventProxy
    {
        once<K extends keyof WindowEventMap>(type: K, listener: (event: WindowEventMap[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof WindowEventMap>(type: K, data?: WindowEventMap[K], bubbles?: boolean);
        has<K extends keyof WindowEventMap>(type: K): boolean;
        on<K extends keyof WindowEventMap>(type: K, listener: (event: WindowEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof WindowEventMap>(type?: K, listener?: (event: WindowEventMap[K]) => any, thisObject?: any): void;
    }

    export interface IEventProxy<T>
    {
        once<K extends keyof T>(type: K, listener: (event: T[K]) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof T>(type: K, data?: T[K], bubbles?: boolean);
        has<K extends keyof T>(type: K): boolean;
        on<K extends keyof T>(type: K, listener: (event: T[K]) => any, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof T>(type?: K, listener?: (event: T[K]) => any, thisObject?: any): void;
    }

    export class WindowEventProxy extends EventProxy { }

    declare var global;
    declare var window;
    /**
     * 键盘鼠标输入
     */
    // export var windowEventProxy: WindowEventProxy;
    export var windowEventProxy: IEventProxy<WindowEventMap> & EventProxy;

    if (typeof global != "undefined")
        windowEventProxy = new WindowEventProxy(global);
    else
        windowEventProxy = new WindowEventProxy(window);
}