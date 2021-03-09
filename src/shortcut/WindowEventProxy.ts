namespace feng3d
{
    export interface WindowEventProxy
    {
        once<K extends keyof WindowEventMap>(type: K, listener: (event: WindowEventMap[K]) => void, thisObject?: any, priority?: number): this;
        emit<K extends keyof WindowEventMap>(type: K, data?: WindowEventMap[K], bubbles?: boolean);
        has<K extends keyof WindowEventMap>(type: K): boolean;
        on<K extends keyof WindowEventMap>(type: K, listener: (event: WindowEventMap[K]) => any, thisObject?: any, priority?: number, once?: boolean): this;
        off<K extends keyof WindowEventMap>(type?: K, listener?: (event: WindowEventMap[K]) => any, thisObject?: any): this;
    }

    export interface IEventProxy<T>
    {
        once<K extends keyof T>(type: K, listener: (event: T[K]) => void, thisObject?: any, priority?: number): this;
        emit<K extends keyof T>(type: K, data?: T[K], bubbles?: boolean);
        has<K extends keyof T>(type: K): boolean;
        on<K extends keyof T>(type: K, listener: (event: T[K]) => any, thisObject?: any, priority?: number, once?: boolean): this;
        off<K extends keyof T>(type?: K, listener?: (event: T[K]) => any, thisObject?: any): this;
    }

    export class WindowEventProxy extends EventProxy { }

    declare var global;
    declare var window;
    /**
     * 键盘鼠标输入
     */
    // export var windowEventProxy: WindowEventProxy;
    export var windowEventProxy: IEventProxy<WindowEventMap> & EventProxy;

    if (typeof window != "undefined")
        windowEventProxy = new WindowEventProxy(window);
}