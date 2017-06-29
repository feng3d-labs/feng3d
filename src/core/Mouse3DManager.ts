namespace feng3d
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
        public mouseX: number = 0;
        public mouseY: number = 0;

        private selectedObject3D: Transform;
        private mouseEventTypes: string[] = [];

        /**
         * 鼠标按下时的对象，用于与鼠标弹起时对象做对比，如果相同触发click
         */
        private preMouseDownObject3D: Transform;
        /**
         * 统计处理click次数，判断是否达到dblclick
         */
        private Object3DClickNum: number;

        /** 射线采集器(采集射线穿过场景中物体的列表) */
        private _mousePicker: RaycastPicker = new RaycastPicker(false);

        private _catchMouseMove = false;
        /**
         * 是否捕捉鼠标移动，默认false。
         */
        public get catchMouseMove()
        {
            return this._catchMouseMove;
        }
        public set catchMouseMove(value)
        {
            if (this._catchMouseMove == value)
                return;
            if (this._catchMouseMove)
            {
                Event.off(input, <any>inputType.MOUSE_MOVE, this.onMouseEvent, this);
            }
            this._catchMouseMove = value;
            if (this._catchMouseMove)
            {
                Event.on(input, <any>inputType.MOUSE_MOVE, this.onMouseEvent, this);
            }
        }

        constructor()
        {
            this.mouseRenderer = new MouseRenderer();
            //
            mouse3DEventMap[inputType.CLICK] = Mouse3DEvent.CLICK;
            mouse3DEventMap[inputType.DOUBLE_CLICK] = Mouse3DEvent.DOUBLE_CLICK;
            mouse3DEventMap[inputType.MOUSE_DOWN] = Mouse3DEvent.MOUSE_DOWN;
            mouse3DEventMap[inputType.MOUSE_MOVE] = Mouse3DEvent.MOUSE_MOVE;
            mouse3DEventMap[inputType.MOUSE_UP] = Mouse3DEvent.MOUSE_UP;

            //
            Event.on(input, <any>inputType.CLICK, this.onMouseEvent, this);
            Event.on(input, <any>inputType.DOUBLE_CLICK, this.onMouseEvent, this);
            Event.on(input, <any>inputType.MOUSE_DOWN, this.onMouseEvent, this);
            Event.on(input, <any>inputType.MOUSE_UP, this.onMouseEvent, this);
        }

        /**
         * 监听鼠标事件收集事件类型
         */
        private onMouseEvent(event: EventVO<any>)
        {
            var inputEvent: InputEvent = event.data;
            if (this.mouseEventTypes.indexOf(inputEvent.type) == -1)
                this.mouseEventTypes.push(inputEvent.type);
            this.mouseX = inputEvent.clientX;
            this.mouseY = inputEvent.clientY;
        }

        /**
		 * 渲染
		 */
        public draw(renderContext: RenderContext)
        {
            if (!this.viewRect.contains(this.mouseX, this.mouseY))
                return;
            if (this.mouseEventTypes.length == 0)
                return;
            var mouseCollisionEntitys = this.getMouseCheckObjects(renderContext);
            if (mouseCollisionEntitys.length == 0)
                return;

            this.pick(renderContext);

            // this.glPick(renderContext);
        }

        private pick(renderContext: RenderContext)
        {
            var mouseCollisionEntitys = this.getMouseCheckObjects(renderContext);
            var mouseRay3D = renderContext.view3D.getMouseRay3D();
            //计算得到鼠标射线相交的物体
            var _collidingObject = this._mousePicker.getViewCollision(mouseRay3D, mouseCollisionEntitys);

            var object3D = _collidingObject && _collidingObject.firstEntity;

            this.setSelectedObject3D(object3D ? object3D.transform : null);
        }

        private glPick(renderContext: RenderContext)
        {
            var gl = renderContext.gl;

            var offsetX = -(this.mouseX - this.viewRect.x);
            var offsetY = -(this.viewRect.height - (this.mouseY - this.viewRect.y));//y轴与window中坐标反向，所以需要 h = (maxHeight - h)

            gl.clearColor(0, 0, 0, 0);
            gl.clearDepth(1);
            gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
            gl.viewport(offsetX, offsetY, this.viewRect.width, this.viewRect.height);
            this.mouseRenderer.draw(renderContext);

            var object3D = this.mouseRenderer.selectedObject3D;
            this.setSelectedObject3D(object3D.transform);
        }

        private getMouseCheckObjects(renderContext: RenderContext)
        {
            var scene3d = renderContext.scene3d;
            var checkList = scene3d.transform.getChildren();
            var results: GameObject[] = [];
            var i = 0;
            while (i < checkList.length)
            {
                var checkObject = checkList[i++];
                if (checkObject.mouseEnabled && checkObject.getComponents(MeshFilter))
                {
                    results.push(checkObject.gameObject as GameObject);
                }
                if (checkObject.mouseChildren)
                {
                    checkList = checkList.concat(checkObject.getChildren());
                }
            }
            return results;
        }

        /**
         * 设置选中对象
         */
        private setSelectedObject3D(value: Transform)
        {
            if (this.selectedObject3D != value)
            {
                if (this.selectedObject3D)
                    Event.dispatch(this.selectedObject3D, <any>Mouse3DEvent.MOUSE_OUT, null, true);
                if (value)
                    Event.dispatch(value, <any>Mouse3DEvent.MOUSE_OVER, null, true);
            }
            this.selectedObject3D = value;
            if (this.selectedObject3D)
            {
                this.mouseEventTypes.forEach(element =>
                {
                    switch (element)
                    {
                        case inputType.MOUSE_DOWN:
                            if (this.preMouseDownObject3D != this.selectedObject3D)
                            {
                                this.Object3DClickNum = 0;
                                this.preMouseDownObject3D = this.selectedObject3D;
                            }
                            Event.dispatch(this.selectedObject3D, <any>mouse3DEventMap[element], null, true);
                            break;
                        case inputType.MOUSE_UP:
                            if (this.selectedObject3D == this.preMouseDownObject3D)
                            {
                                this.Object3DClickNum++;
                            } else
                            {
                                this.Object3DClickNum = 0;
                                this.preMouseDownObject3D = null;
                            }
                            Event.dispatch(this.selectedObject3D, <any>mouse3DEventMap[element], null, true);
                            break;
                        case inputType.MOUSE_MOVE:
                            Event.dispatch(this.selectedObject3D, <any>mouse3DEventMap[element], null, true);
                            break;
                        case inputType.CLICK:
                            if (this.Object3DClickNum > 0)
                                Event.dispatch(this.selectedObject3D, <any>mouse3DEventMap[element], null, true);
                            break;
                        case inputType.DOUBLE_CLICK:
                            if (this.Object3DClickNum > 1)
                                Event.dispatch(this.selectedObject3D, <any>mouse3DEventMap[element], null, true);
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

    export interface EventType
    {
        /** 鼠标单击 */
        click: any;
        /** 鼠标双击 */
        doubleClick: "doubleClick";
        /** 鼠标按下 */
        mousedown: "mousedown";
        /** 鼠标移动 */
        mousemove: "mousemove";
        /** 鼠标移出 */
        mouseout: "mouseout";
        /** 鼠标移入 */
        mouseover: "mouseover";
        /** 鼠标弹起 */
        mouseup: "mouseup";
    }

    /**
     * 3D鼠标事件
     */
    export var Mouse3DEvent = {
        /** 鼠标单击 */
        CLICK: "click",
        /** 鼠标双击 */
        DOUBLE_CLICK: "doubleClick",
        /** 鼠标按下 */
        MOUSE_DOWN: "mousedown",
        /** 鼠标移动 */
        MOUSE_MOVE: "mousemove",
        /** 鼠标移出 */
        MOUSE_OUT: "mouseout",
        /** 鼠标移入 */
        MOUSE_OVER: "mouseover",
        /** 鼠标弹起 */
        MOUSE_UP: "mouseup",
    }

    /** 
     * 鼠标事件与3D鼠标事件类型映射
     */
    var mouse3DEventMap: { [mouseEventType: string]: string } = {};
}