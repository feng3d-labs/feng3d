namespace feng3d
{
    /**
     * 鼠标事件管理
     * @author feng 2014-4-29
     */
    export class Mouse3DManager
    {
        //
        private mouseX = 0;
        private mouseY = 0;

        get selectedGameObject()
        {
            return this._selectedGameObject;
        }
        private _selectedGameObject: GameObject;
        private mouseEventTypes: string[] = [];

        /**
         * 鼠标按下时的对象，用于与鼠标弹起时对象做对比，如果相同触发click
         */
        private preMouseDownGameObject: GameObject | null;
        /**
         * 统计处理click次数，判断是否达到dblclick
         */
        private gameObjectClickNum: number;

        private _catchMouseMove = false;

        get enable()
        {
            return this._enable;
        }
        set enable(value: boolean)
        {
            if (this._enable)
            {
                windowEventProxy.off("click", this.onMouseEvent, this);
                windowEventProxy.off("dblclick", this.onMouseEvent, this);
                windowEventProxy.off("mousedown", this.onMouseEvent, this);
                windowEventProxy.off("mouseup", this.onMouseEvent, this);
            }
            this._enable = value;
            if (this._enable)
            {
                windowEventProxy.on("click", this.onMouseEvent, this);
                windowEventProxy.on("dblclick", this.onMouseEvent, this);
                windowEventProxy.on("mousedown", this.onMouseEvent, this);
                windowEventProxy.on("mouseup", this.onMouseEvent, this);
            }
        }
        private _enable = false;
        private canvas: HTMLCanvasElement

        /**
         * 渲染
         */
        draw(scene3d: Scene3D, camera: Camera, viewRect: Rectangle)
        {
            if (!viewRect.contains(this.mouseX, this.mouseY))
                return;
            if (this.mouseEventTypes.length == 0)
                return;
            var mouseCollisionEntitys = scene3d.mouseCheckObjects;
            if (mouseCollisionEntitys.length == 0)
                return;

            this.pick(scene3d, camera);
        }

        /**
         * 是否捕捉鼠标移动，默认false。
         */
        private catchMouseMove(value)
        {
            if (this._catchMouseMove == value)
                return;
            if (this._catchMouseMove)
            {
                windowEventProxy.off("mousemove", this.onMouseEvent, this);
            }
            this._catchMouseMove = value;
            if (this._catchMouseMove)
            {
                windowEventProxy.on("mousemove", this.onMouseEvent, this);
            }
        }

        constructor(canvas: HTMLCanvasElement)
        {
            //
            this.enable = true;
            this.canvas = canvas;
        }

        /**
         * 监听鼠标事件收集事件类型
         */
        private onMouseEvent(event: MouseEvent)
        {
            var canvasRect = this.canvas.getBoundingClientRect();
            var bound = new Rectangle(canvasRect.left, canvasRect.top, canvasRect.width, canvasRect.height);
            if (!bound.contains(windowEventProxy.clientX, windowEventProxy.clientY))
                return;

            var type = event.type;
            // 处理鼠标中键与右键
            if (event instanceof MouseEvent)
            {
                if (["click", "mousedown", "mouseup"].indexOf(event.type) != -1)
                {
                    type = ["", "middle", "right"][event.button] + event.type;
                }
            }

            if (this.mouseEventTypes.indexOf(type) == -1)
                this.mouseEventTypes.push(type);
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        }

        pick(scene3d: Scene3D, camera: Camera)
        {
            var mouseRay3D = camera.getMouseRay3D();
            //计算得到鼠标射线相交的物体
            var mouseCollisionEntitys = scene3d.mouseCheckObjects;

            var pickingCollisionVO: PickingCollisionVO | null = null;
            for (var i = 0; i < mouseCollisionEntitys.length; i++)
            {
                var entitys = mouseCollisionEntitys[i].objects;
                pickingCollisionVO = raycaster.pick(mouseRay3D, entitys);
                if (pickingCollisionVO)
                    break;
            }

            var gameobject = pickingCollisionVO && pickingCollisionVO.gameObject;

            if (gameobject)
                this.setSelectedGameObject(gameobject);
            else
                this.setSelectedGameObject(scene3d.gameObject);
        }

        /**
         * 设置选中对象
         */
        setSelectedGameObject(value: GameObject)
        {
            if (this._selectedGameObject != value)
            {
                if (this._selectedGameObject)
                    this._selectedGameObject.dispatch("mouseout", null, true);
                if (value)
                    value.dispatch("mouseover", null, true);
            }
            this._selectedGameObject = value;
            if (this._selectedGameObject)
            {
                this.mouseEventTypes.forEach(element =>
                {
                    switch (element)
                    {
                        case "mousedown":
                            if (this.preMouseDownGameObject != this._selectedGameObject)
                            {
                                this.gameObjectClickNum = 0;
                                this.preMouseDownGameObject = this._selectedGameObject;
                            }
                            this._selectedGameObject.dispatch(element, null, true);
                            break;
                        case "mouseup":
                            if (this._selectedGameObject == this.preMouseDownGameObject)
                            {
                                this.gameObjectClickNum++;
                            } else
                            {
                                this.gameObjectClickNum = 0;
                                this.preMouseDownGameObject = null;
                            }
                            this._selectedGameObject.dispatch(element, null, true);
                            break;
                        case "mousemove":
                            this._selectedGameObject.dispatch(element, null, true);
                            break;
                        case "click":
                            if (this.gameObjectClickNum > 0)
                                this._selectedGameObject.dispatch(element, null, true);
                            break;
                        case "dblclick":
                            if (this.gameObjectClickNum > 1)
                                this._selectedGameObject.dispatch(element, null, true);
                            break;
                    }
                });
            } else
            {
                this.gameObjectClickNum = 0;
                this.preMouseDownGameObject = null;
            }
            this.mouseEventTypes.length = 0;
        }
    }

    export interface GameObjectEventMap
    {
        /**
         * 鼠标移出对象
         */
        mouseout
        /**
         * 鼠标移入对象
         */
        mouseover
        /**
         * 鼠标在对象上移动
         */
        mousemove
        /**
         * 鼠标左键按下
         */
        mousedown
        /**
         * 鼠标左键弹起
         */
        mouseup
        /**
         * 单击
         */
        click
        /**
         * 鼠标中键按下
         */
        middlemousedown
        /**
         * 鼠标中键弹起
         */
        middlemouseup
        /**
         * 鼠标中键单击
         */
        middleclick
        /**
         * 鼠标右键按下
         */
        rightmousedown
        /**
         * 鼠标右键弹起
         */
        rightmouseup
        /**
         * 鼠标右键单击
         */
        rightclick
        /**
         * 鼠标双击
         */
        dblclick
    }
}