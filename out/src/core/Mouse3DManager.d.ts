declare namespace feng3d {
    /**
     * 鼠标事件管理
     * @author feng 2014-4-29
     */
    class Mouse3DManager {
        mouseX: number;
        mouseY: number;
        /**
         * 鼠标拾取渲染器
         */
        private mouseRenderer;
        private selectedObject3D;
        private mouseEventTypes;
        /**
         * 鼠标按下时的对象，用于与鼠标弹起时对象做对比，如果相同触发click
         */
        private preMouseDownObject3D;
        /**
         * 统计处理click次数，判断是否达到dblclick
         */
        private Object3DClickNum;
        /** 射线采集器(采集射线穿过场景中物体的列表) */
        private _mousePicker;
        private _catchMouseMove;
        /**
         * 是否捕捉鼠标移动，默认false。
         */
        catchMouseMove: boolean;
        constructor();
        /**
         * 监听鼠标事件收集事件类型
         */
        private onMouseEvent(event);
        /**
         * 渲染
         */
        draw(scene3d: Scene3D, camera: Camera, viewRect: Rectangle): void;
        private pick(scene3d, camera);
        private glPick(renderContext, viewRect);
        private getMouseCheckObjects(scene3d);
        /**
         * 设置选中对象
         */
        private setSelectedObject3D(value);
    }
}
