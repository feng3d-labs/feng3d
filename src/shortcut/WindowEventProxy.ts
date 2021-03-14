namespace feng3d
{
    /**
     * 键盘鼠标输入
     */
    export var windowEventProxy: EventProxy<WindowEventMap>;

    if (typeof self != "undefined")
        windowEventProxy = new EventProxy(self);
}