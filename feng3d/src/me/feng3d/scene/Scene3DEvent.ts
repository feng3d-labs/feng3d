module feng3d {

    /**
     * 3D场景事件
     * author feng 2016-05-01
     */
    export class Scene3DEvent extends Event {

        /**
         * 添加3D场景节点
         */
        static ADDED = "scene3D_added";

        /**
         * 删除3D场景节点
         */
        static REMOVED = "scene3D_removed";

        /**
         * 数据
         */
        data: Scene3DNode;

        /**
         * 构建3D场景事件
         * @param type 事件的类型，可以作为 Event.type 访问。
         * @param data 携带数据
         * @param bubbles 确定 Event 对象是否参与事件流的冒泡阶段。默认值为 false。
         */
        constructor(type: string, data: Scene3DNode = null, bubbles = false) {
            super(type, data, bubbles);
        }
    }
}