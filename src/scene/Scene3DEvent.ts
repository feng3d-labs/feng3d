namespace feng3d
{
    /**
     * 3D场景事件
     * @author feng 2016-01-03
     */
    export class Scene3DEvent
    {
        /**
         * 当Object3D的scene属性被设置是由Scene3D派发
         */
        static ADDED_TO_SCENE: string = "addedToScene";

        /**
         * 当Object3D的scene属性被清空时由Scene3D派发
         */
        static REMOVED_FROM_SCENE: string = "removedFromScene";
    }
}