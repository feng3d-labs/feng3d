namespace feng3d
{

    /**
     * 只针对Object的事件
     */
    export var objectevent: ObjectEventDispatcher<Object, ObjectEventType> = event;

    /**
     * Object 事件类型
     */
    export interface ObjectEventType
    {
        /**
         * 属性值变化
         */
        propertyValueChanged: { property: string, oldValue: any, newValue: any };
    }
}