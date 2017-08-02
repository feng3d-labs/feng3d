namespace feng3d
{
    /**
     * 3D对象事件
     */
    export class Object3DEvent
    {
        /**
         * 事件数据
         */
        data: IObject3DEventData;

        object: Object3D;
    }

    /**
     * 3D对象事件数据
     */
    export interface IObject3DEventData
    {
        /**
         * 父容器
         */
        parent?: GameObject;
        /**
         * 子对象
         */
        child?: GameObject;
    }
}