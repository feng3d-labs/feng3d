namespace feng3d
{
    /**
     * 3D对象事件
     */
    export class Object3DEvent
    {
        public static VISIBLITY_UPDATED: "visiblityUpdated" = "visiblityUpdated";
        public static SCENETRANSFORM_CHANGED: string = "scenetransformChanged";
        public static SCENE_CHANGED: string = "sceneChanged";
        public static POSITION_CHANGED: string = "positionChanged";
        public static ROTATION_CHANGED: string = "rotationChanged";
        public static SCALE_CHANGED: string = "scaleChanged";

        /**
         * 添加了子对象，当child被添加到parent中时派发冒泡事件
         */
        static ADDED: string = "added";

        /**
         * 删除了子对象，当child被parent移除时派发冒泡事件
         */
        static REMOVED: string = "removed";

        /**
         * 事件数据
         */
        data: IObject3DEventData;

        public object: Object3D;
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