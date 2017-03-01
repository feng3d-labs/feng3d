module feng3d
{

	/**
	 * 鼠标事件管理
	 * @author feng 2014-4-29
	 */
    export class Mouse3DManager
    {
        public viewRect: Rectangle = new Rectangle(0, 0, 100, 100);
        /**
         * 鼠标拾取渲染器
         */
        private mouseRenderer: MouseRenderer;
        private mouseX: number;
        private mouseY: number;

        private selectedObject3D: Object3D;
        private mouseEventTypes: string[] = [];

        /**
         * 鼠标按下时的对象，用于与鼠标弹起时对象做对比，如果相同触发click
         */
        private preMouseDownObject3D: Object3D;
        /**
         * 统计处理click次数，判断是否达到dblclick
         */
        private Object3DClickNum: number;

        constructor()
        {
            this.mouseRenderer = new MouseRenderer();
            //
            mouse3DEventMap[$mouseKeyType.click] = Mouse3DEvent.CLICK;
            mouse3DEventMap[$mouseKeyType.dblclick] = Mouse3DEvent.DOUBLE_CLICK;
            mouse3DEventMap[$mouseKeyType.mousedown] = Mouse3DEvent.MOUSE_DOWN;
            mouse3DEventMap[$mouseKeyType.mousemove] = Mouse3DEvent.MOUSE_MOVE;
            mouse3DEventMap[$mouseKeyType.mouseup] = Mouse3DEvent.MOUSE_UP;
            //
            $mouseKeyInput.addEventListener($mouseKeyType.mousemove, this.onMousemove, this);
            //
            $mouseKeyInput.addEventListener($mouseKeyType.click, this.onMouseEvent, this);
            $mouseKeyInput.addEventListener($mouseKeyType.dblclick, this.onMouseEvent, this);
            $mouseKeyInput.addEventListener($mouseKeyType.mousedown, this.onMouseEvent, this);
            $mouseKeyInput.addEventListener($mouseKeyType.mousemove, this.onMouseEvent, this);
            $mouseKeyInput.addEventListener($mouseKeyType.mouseup, this.onMouseEvent, this);
        }

        /**
         * 监听鼠标事件收集事件类型
         */
        private onMouseEvent(event: Event)
        {
            if (this.mouseEventTypes.indexOf(event.type) == -1)
                this.mouseEventTypes.push(event.type);
        }

        /**
         * 监听鼠标移动事件获取鼠标位置
         */
        private onMousemove(event: Event)
        {
            this.mouseX = event.data.clientX;
            this.mouseY = event.data.clientY;
        }

        /**
		 * 渲染
		 */
        public draw(context3D: Context3D, scene3D: Scene3D, camera: Camera3D)
        {
            if (!this.viewRect.contains(this.mouseX, this.mouseY))
                return;

            var offsetX = -(this.mouseX - this.viewRect.x);
            var offsetY = -(this.viewRect.height - (this.mouseY - this.viewRect.y));//y轴与window中坐标反向，所以需要 h = (maxHeight - h)

            context3D.clearColor(0, 0, 0, 0);
            context3D.clearDepth(1);
            context3D.clear(Context3D.COLOR_BUFFER_BIT | Context3D.DEPTH_BUFFER_BIT);
            context3D.viewport(offsetX, offsetY, this.viewRect.width, this.viewRect.height);
            this.mouseRenderer.draw(context3D, scene3D, camera);

            var object3D = this.mouseRenderer.selectedObject3D;
            this.setSelectedObject3D(object3D);
        }

        /**
         * 设置选中对象
         */
        private setSelectedObject3D(value: Object3D)
        {
            if (this.selectedObject3D != value)
            {
                if (this.selectedObject3D)
                    this.selectedObject3D.dispatchEvent(new Mouse3DEvent(Mouse3DEvent.MOUSE_OUT, null, true));
                if (value)
                    value.dispatchEvent(new Mouse3DEvent(Mouse3DEvent.MOUSE_OVER, null, true));
            }
            this.selectedObject3D = value;
            if (this.selectedObject3D)
            {
                this.mouseEventTypes.forEach(element =>
                {
                    switch (element)
                    {
                        case $mouseKeyType.mousedown:
                            if (this.preMouseDownObject3D != this.selectedObject3D)
                            {
                                this.Object3DClickNum = 0;
                                this.preMouseDownObject3D = this.selectedObject3D;
                            }
                            this.selectedObject3D.dispatchEvent(new Mouse3DEvent(mouse3DEventMap[element], null, true));
                            break;
                        case $mouseKeyType.mouseup:
                            if (this.selectedObject3D == this.preMouseDownObject3D)
                            {
                                this.Object3DClickNum++;
                            } else
                            {
                                this.Object3DClickNum = 0;
                                this.preMouseDownObject3D = null;
                            }
                            this.selectedObject3D.dispatchEvent(new Mouse3DEvent(mouse3DEventMap[element], null, true));
                            break;
                        case $mouseKeyType.mousemove:
                            this.selectedObject3D.dispatchEvent(new Mouse3DEvent(mouse3DEventMap[element], null, true));
                            break;
                        case $mouseKeyType.click:
                            if (this.Object3DClickNum > 0)
                                this.selectedObject3D.dispatchEvent(new Mouse3DEvent(mouse3DEventMap[element], null, true));
                            break;
                        case $mouseKeyType.dblclick:
                            if (this.Object3DClickNum > 1)
                                this.selectedObject3D.dispatchEvent(new Mouse3DEvent(mouse3DEventMap[element], null, true));
                            break;
                    }

                });
            } else
            {
                this.Object3DClickNum = 0;
                this.preMouseDownObject3D = null;
            }
            this.mouseEventTypes.length = 0;
        }
    }

    /**
     * 3D鼠标事件
     */
    export class Mouse3DEvent extends Event
    {

        /** 鼠标单击 */
        static CLICK = "click3D";
        /** 鼠标双击 */
        static DOUBLE_CLICK: "doubleClick3D";
        /** 鼠标按下 */
        static MOUSE_DOWN = "mousedown3d";
        /** 鼠标移动 */
        static MOUSE_MOVE = "mousemove3d";
        /** 鼠标移出 */
        static MOUSE_OUT = "mouseout3d";
        /** 鼠标移入 */
        static MOUSE_OVER = "mouseover3d";
        /** 鼠标弹起 */
        static MOUSE_UP = "mouseup3d";
    }

    /** 
     * 鼠标事件与3D鼠标事件类型映射
     */
    var mouse3DEventMap: { [mouseEventType: string]: string } = {};
}