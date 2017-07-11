namespace feng3d
{
    /**
     * 3D对象事件
     */
    export class Object3DEvent
    {
        /**
         * 显示变化
         */
        static VISIBLITY_UPDATED: "visiblityUpdated" = "visiblityUpdated";
        /**
         * 场景矩阵变化
         */
        static SCENETRANSFORM_CHANGED: string = "scenetransformChanged";
        /**
         * 场景变化
         */
        static SCENE_CHANGED: string = "sceneChanged";
        /**
         * 位置变化
         */
        static POSITION_CHANGED: string = "positionChanged";
        /**
         * 旋转变化
         */
        static ROTATION_CHANGED: string = "rotationChanged";
        /**
         * 缩放变化
         */
        static SCALE_CHANGED: string = "scaleChanged";
        /**
         * 变换矩阵变化
         */
        static TRANSFORM_CHANGED: string = "transformChanged";
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