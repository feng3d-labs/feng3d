namespace feng3d
{
	/**
	 * 鼠标事件管理
	 * @author feng 2014-4-29
	 */
    export class Mouse3DManager
    {
        mouseX = 0;
        mouseY = 0;

        /**
         * 鼠标拾取渲染器
         */
        private mouseRenderer: MouseRenderer;
        private selectedObject3D: GameObject;
        private mouseEventTypes: string[] = [];

        /**
         * 鼠标按下时的对象，用于与鼠标弹起时对象做对比，如果相同触发click
         */
        private preMouseDownObject3D: GameObject;
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
        get catchMouseMove()
        {
            return this._catchMouseMove;
        }
        set catchMouseMove(value)
        {
            if (this._catchMouseMove == value)
                return;
            if (this._catchMouseMove)
            {
                input.off("mousemove", this.onMouseEvent, this);
            }
            this._catchMouseMove = value;
            if (this._catchMouseMove)
            {
                input.on("mousemove", this.onMouseEvent, this);
            }
        }

        constructor()
        {
            this.mouseRenderer = new MouseRenderer();

            //
            input.on("click", this.onMouseEvent, this);
            input.on("dblclick", this.onMouseEvent, this);
            input.on("mousedown", this.onMouseEvent, this);
            input.on("mouseup", this.onMouseEvent, this);
        }

        /**
         * 监听鼠标事件收集事件类型
         */
        private onMouseEvent(event: InputEvent)
        {
            var inputEvent: InputEvent = event;
            if (this.mouseEventTypes.indexOf(inputEvent.type) == -1)
                this.mouseEventTypes.push(inputEvent.type);
            this.mouseX = inputEvent.clientX;
            this.mouseY = inputEvent.clientY;
        }

        /**
		 * 渲染
		 */
        draw(renderContext: RenderContext, viewRect: Rectangle)
        {
            if (!viewRect.contains(this.mouseX, this.mouseY))
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
            var mouseRay3D = renderContext.camera.getMouseRay3D();
            //计算得到鼠标射线相交的物体
            var _collidingObject = this._mousePicker.getViewCollision(mouseRay3D, mouseCollisionEntitys);

            var object3D = _collidingObject && _collidingObject.firstEntity;

            this.setSelectedObject3D(object3D);
        }

        private glPick(renderContext: RenderContext, viewRect: Rectangle)
        {
            var gl = renderContext.gl;

            var offsetX = -(this.mouseX - viewRect.x);
            var offsetY = -(viewRect.height - (this.mouseY - viewRect.y));//y轴与window中坐标反向，所以需要 h = (maxHeight - h)

            gl.clearColor(0, 0, 0, 0);
            gl.clearDepth(1);
            gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
            gl.viewport(offsetX, offsetY, viewRect.width, viewRect.height);
            this.mouseRenderer.draw(renderContext);

            var object3D = this.mouseRenderer.selectedObject3D;
            this.setSelectedObject3D(object3D);
        }

        private getMouseCheckObjects(renderContext: RenderContext)
        {
            var scene3d = renderContext.scene3d;
            var checkList = scene3d.gameObject.getChildren();
            var results: GameObject[] = [];
            var i = 0;
            while (i < checkList.length)
            {
                var checkObject = checkList[i++];
                if (checkObject.transform.mouseEnabled)
                {
                    if (checkObject.getComponents(MeshFilter))
                    {
                        results.push(checkObject as GameObject);
                    }
                    checkList = checkList.concat(checkObject.getChildren());
                }
            }
            return results;
        }

        /**
         * 设置选中对象
         */
        private setSelectedObject3D(value: GameObject)
        {
            if (this.selectedObject3D != value)
            {
                if (this.selectedObject3D)
                    this.selectedObject3D.dispatch("mouseout", null, true);
                if (value)
                    value.dispatch("mouseover", null, true);
            }
            this.selectedObject3D = value;
            if (this.selectedObject3D)
            {
                this.mouseEventTypes.forEach(element =>
                {
                    switch (element)
                    {
                        case "mousedown":
                            if (this.preMouseDownObject3D != this.selectedObject3D)
                            {
                                this.Object3DClickNum = 0;
                                this.preMouseDownObject3D = this.selectedObject3D;
                            }
                            this.selectedObject3D.dispatch(element, null, true);
                            break;
                        case "mouseup":
                            if (this.selectedObject3D == this.preMouseDownObject3D)
                            {
                                this.Object3DClickNum++;
                            } else
                            {
                                this.Object3DClickNum = 0;
                                this.preMouseDownObject3D = null;
                            }
                            this.selectedObject3D.dispatch(element, null, true);
                            break;
                        case "mousemove":
                            this.selectedObject3D.dispatch(element, null, true);
                            break;
                        case "click":
                            if (this.Object3DClickNum > 0)
                                this.selectedObject3D.dispatch(element, null, true);
                            break;
                        case "dblclick":
                            if (this.Object3DClickNum > 1)
                                this.selectedObject3D.dispatch(element, null, true);
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
}