module me.feng3d {

    /**
     * 3D容器事件
     */
    export class Container3DEvent extends Event {

        /**
         * 添加了子对象
         * data={parent: Object3D, child: Object3D}
         */
        static ADDED: string = "added";

        /**
         * 删除了子对象
         * data={parent: Object3D, child: Object3D}
         */
        static REMOVED: string = "removed";

        /**
         * 事件数据
         */
        data: { parent: Object3D, child: Object3D };
    }
}