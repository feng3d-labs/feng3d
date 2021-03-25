namespace feng3d
{
    /**
     * 鼠标事件管理
     */
    export class Mouse3DManager
    {
        @watch("_mouseInputChanged")
        mouseInput: MouseInput;

        get selectedTransform()
        {
            return this._selectedTransform;
        }
        set selectedTransform(v)
        {
            this.setSelectedNode3D(v);
        }

        /**
         * 视窗，鼠标在该矩形内时为有效事件
         */
        viewport: Lazy<Rectangle>;

        /**
         * 拾取
         * @param scene 场景
         * @param camera 摄像机
         */
        pick(view: View, scene: Scene, camera: Camera)
        {
            if (this._mouseEventTypes.length == 0) return;
            //计算得到鼠标射线相交的物体
            var pickingCollisionVO = raycaster.pick(view.mouseRay3D, scene.mouseCheckObjects);

            var node3d = pickingCollisionVO?.node3d;
            return node3d;
        }

        constructor(mouseInput: MouseInput, viewport?: Lazy<Rectangle>)
        {
            //
            this.mouseInput = mouseInput;
            this.viewport = viewport;
        }

        private _selectedTransform: Node3D;
        private _mouseEventTypes: string[] = [];

        /**
         * 鼠标按下时的对象，用于与鼠标弹起时对象做对比，如果相同触发click
         */
        private preMouseDownNode3D: Node3D;
        /**
         * 统计处理click次数，判断是否达到dblclick
         */
        private node3DClickNum: number;

        private _mouseInputChanged(property: string, oldValue: MouseInput, newValue: MouseInput)
        {
            if (oldValue)
            {
                mouseEventTypes.forEach(element =>
                {
                    oldValue.off(element, this.onMouseEvent, this);
                });
            }
            if (newValue)
            {
                mouseEventTypes.forEach(element =>
                {
                    newValue.on(element, this.onMouseEvent, this);
                });
            }
        }

        private dispatch(type)
        {
            if (this.viewport)
            {
                var bound = lazy.getvalue(this.viewport);
                if (!bound.contains(windowEventProxy.clientX, windowEventProxy.clientY))
                    return;
            }

            if (this._mouseEventTypes.indexOf(type) == -1)
                this._mouseEventTypes.push(type);
        }

        /**
         * 监听鼠标事件收集事件类型
         */
        private onMouseEvent(event: Event<any>)
        {
            this.dispatch(event.type);
        }

        /**
         * 设置选中对象
         */
        private setSelectedNode3D(value: Node3D)
        {
            if (this._selectedTransform != value)
            {
                if (this._selectedTransform)
                    this._selectedTransform.emit("mouseout", null, true);
                if (value)
                    value.emit("mouseover", null, true);
            }
            this._selectedTransform = value;
            this._mouseEventTypes.forEach(element =>
            {
                switch (element)
                {
                    case "mousedown":
                        if (this.preMouseDownNode3D != this._selectedTransform)
                        {
                            this.node3DClickNum = 0;
                            this.preMouseDownNode3D = this._selectedTransform;
                        }
                        this._selectedTransform && this._selectedTransform.emit(element, null, true);
                        break;
                    case "mouseup":
                        if (this._selectedTransform == this.preMouseDownNode3D)
                        {
                            this.node3DClickNum++;
                        } else
                        {
                            this.node3DClickNum = 0;
                            this.preMouseDownNode3D = null;
                        }
                        this._selectedTransform && this._selectedTransform.emit(element, null, true);
                        break;
                    case "mousemove":
                        this._selectedTransform && this._selectedTransform.emit(element, null, true);
                        break;
                    case "click":
                        if (this.node3DClickNum > 0)
                            this._selectedTransform && this._selectedTransform.emit(element, null, true);
                        break;
                    case "dblclick":
                        if (this.node3DClickNum > 1)
                        {
                            this._selectedTransform && this._selectedTransform.emit(element, null, true);
                            this.node3DClickNum = 0;
                        }
                        break;
                }
            });
            this._mouseEventTypes.length = 0;
        }
    }

    /**
     * 鼠标事件输入
     */
    export class MouseInput<T = MouseEventMap> extends EventEmitter<T>
    {
        /**
         * 是否启动
         */
        enable = true;

        /**
         * 是否捕获鼠标移动
         */
        catchMouseMove = false;

        /**
         * 将事件调度到事件流中. 事件目标是对其调用 dispatchEvent() 方法的 IEvent 对象。
         * @param type                      事件的类型。类型区分大小写。
         * @param data                      事件携带的自定义数据。
         * @param bubbles                   表示事件是否为冒泡事件。如果事件可以冒泡，则此值为 true；否则为 false。
         */
        emit<K extends keyof T & string>(type: K, data?: T[K], bubbles = false)
        {
            if (!this.enable)
                return null;
            if (!this.catchMouseMove && type == "mousemove")
                return null;
            return super.emit(type, data, bubbles);
        }

        /**
         * 派发事件
         * @param event   事件对象
         */
        emitEvent<K extends keyof T & string>(event: Event<T[K]>)
        {
            if (!this.enable)
                return false;
            if (!this.catchMouseMove && event.type == "mousemove")
                return false;
            return super.emitEvent(event);
        }
    }

    /**
     * 鼠标事件列表
     */
    var mouseEventTypes: (keyof MouseEventMap)[] =
        [
            "mouseout",
            "mouseover",
            "mousemove",
            "mousedown",
            "mouseup",
            "click",
            "middlemousedown",
            "middlemouseup",
            "middleclick",
            "rightmousedown",
            "rightmouseup",
            "rightclick",
            "dblclick",
        ];

    /**
     * Window鼠标事件输入
     */
    export class WindowMouseInput extends MouseInput
    {
        constructor()
        {
            super();
            windowEventProxy.on("click", this.onMouseEvent, this);
            windowEventProxy.on("dblclick", this.onMouseEvent, this);
            windowEventProxy.on("mousedown", this.onMouseEvent, this);
            windowEventProxy.on("mouseup", this.onMouseEvent, this);
            windowEventProxy.on("mousemove", this.onMouseEvent, this);
        }

        /**
         * 监听鼠标事件收集事件类型
         */
        private onMouseEvent(event: Event<MouseEvent>)
        {
            var type = event.type;
            // 处理鼠标中键与右键
            if (event.data instanceof MouseEvent)
            {
                if (["click", "mousedown", "mouseup"].indexOf(event.type) != -1)
                {
                    type = ["", "middle", "right"][event.data.button] + event.type;
                }
            }

            this.emit(<any>type, { mouseX: event.data.clientX, mouseY: event.data.clientY });
        }
    }

    export interface MouseEventMap
    {
        /**
         * 鼠标移出对象
         */
        mouseout: { clientX: number, clientY: number }
        /**
         * 鼠标移入对象
         */
        mouseover: { clientX: number, clientY: number }
        /**
         * 鼠标在对象上移动
         */
        mousemove: { clientX: number, clientY: number }
        /**
         * 鼠标左键按下
         */
        mousedown: { clientX: number, clientY: number }
        /**
         * 鼠标左键弹起
         */
        mouseup: { clientX: number, clientY: number }
        /**
         * 单击
         */
        click: { clientX: number, clientY: number }
        /**
         * 鼠标中键按下
         */
        middlemousedown: { clientX: number, clientY: number }
        /**
         * 鼠标中键弹起
         */
        middlemouseup: { clientX: number, clientY: number }
        /**
         * 鼠标中键单击
         */
        middleclick: { clientX: number, clientY: number }
        /**
         * 鼠标右键按下
         */
        rightmousedown: { clientX: number, clientY: number }
        /**
         * 鼠标右键弹起
         */
        rightmouseup: { clientX: number, clientY: number }
        /**
         * 鼠标右键单击
         */
        rightclick: { clientX: number, clientY: number }
        /**
         * 鼠标双击
         */
        dblclick: { clientX: number, clientY: number }
    }
}