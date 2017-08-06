namespace feng3d
{
    export interface RenderElementEventMap
    {
        change
    }
    export interface RenderElement extends IEvent<RenderElementEventMap>
    {
        once<K extends keyof RenderElementEventMap>(type: K, listener: (event: EventVO<RenderElementEventMap[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof RenderElementEventMap>(type: K, data?: RenderElementEventMap[K], bubbles?: boolean);
        has<K extends keyof RenderElementEventMap>(type: K): boolean;
        on<K extends keyof RenderElementEventMap>(type: K, listener: (event: EventVO<RenderElementEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof RenderElementEventMap>(type?: K, listener?: (event: EventVO<RenderElementEventMap[K]>) => any, thisObject?: any);
    }

    export class RenderElement extends Event
    {
        invalidate()
        {
            this.dispatch("change");
        }
    }
}