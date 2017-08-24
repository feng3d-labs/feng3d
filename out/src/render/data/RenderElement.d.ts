declare namespace feng3d {
    interface RenderElementEventMap {
        change: any;
    }
    interface RenderElement extends IEvent<RenderElementEventMap> {
        once<K extends keyof RenderElementEventMap>(type: K, listener: (event: EventVO<RenderElementEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof RenderElementEventMap>(type: K, data?: RenderElementEventMap[K], bubbles?: boolean): any;
        has<K extends keyof RenderElementEventMap>(type: K): boolean;
        on<K extends keyof RenderElementEventMap>(type: K, listener: (event: EventVO<RenderElementEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean): any;
        off<K extends keyof RenderElementEventMap>(type?: K, listener?: (event: EventVO<RenderElementEventMap[K]>) => any, thisObject?: any): any;
    }
    class RenderElement extends Event {
        invalidate(): void;
    }
}
