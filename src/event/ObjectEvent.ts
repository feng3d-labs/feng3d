namespace feng3d
{
    export interface ObjectEventType
    {
        propertyChanged
    }

    export interface ObjectEventType1
    {
        propertyChanged1: { a: number }
    }

    export interface FEvent
    {
        once<K extends keyof ObjectEventType1>(obj: Vector2, type: K, listener: (event: Event<ObjectEventType1[K]>) => void, thisObject?: any, priority?: number): void;
        dispatch<K extends keyof ObjectEventType1>(obj: Vector2, type: K, data?: ObjectEventType1[K], bubbles?: boolean): Event<ObjectEventType1[K]>;
        has<K extends keyof ObjectEventType1>(obj: Vector2, type: K): boolean;
        on<K extends keyof ObjectEventType1>(obj: Vector2, type: K, listener: (event: Event<ObjectEventType1[K]>) => void, thisObject?: any, priority?: number, once?: boolean): void;
        off<K extends keyof ObjectEventType1>(obj: Vector2, type?: K, listener?: (event: Event<ObjectEventType1[K]>) => void, thisObject?: any): void;
    }

    var obj = {};
    event.dispatch(obj, "propertyChanged1")

    var vec: Vector2;
    event.dispatch(vec, "propertyChanged1", { a: 1 })
}