namespace feng3d
{
    /**
     * 鼠标事件管理
     */
    export class Mouse3DManager
    {
        @watch("mouseInputChanged")
        mouseInput: MouseInput;

        get selectedGameObject()
        {
            return this._selectedGameObject;
        }
        set selectedGameObject(v)
        {
            this.setSelectedGameObject(v);
        }

        /**
         * 视窗，鼠标在该矩形内时为有效事件
         */
        viewport: Lazy<Rectangle>;

        /**
         * 拾取
         * @param scene3d 场景
         * @param camera 摄像机
         */
        pick(scene3d: Scene3D, camera: Camera)
        {
            if (this._mouseEventTypes.length == 0) return;

            //计算得到鼠标射线相交的物体
            var pickingCollisionVO = raycaster.pick(camera.getMouseRay3D(), scene3d.mouseCheckObjects);

            var gameobject = pickingCollisionVO && pickingCollisionVO.gameObject;
            return gameobject;
        }

        constructor(mouseInput: MouseInput, viewport?: Lazy<Rectangle>)
        {
            //
            this.mouseInput = mouseInput;
            this.viewport = viewport;
        }

        private _selectedGameObject: GameObject;
        private _mouseEventTypes: string[] = [];

        /**
         * 鼠标按下时的对象，用于与鼠标弹起时对象做对比，如果相同触发click
         */
        private preMouseDownGameObject: GameObject | null;
        /**
         * 统计处理click次数，判断是否达到dblclick
         */
        private gameObjectClickNum: number;

        private mouseInputChanged(property, oldValue: MouseInput, newValue: MouseInput)
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
        private setSelectedGameObject(value: GameObject)
        {
            if (this._selectedGameObject != value)
            {
                if (this._selectedGameObject)
                    this._selectedGameObject.dispatch("mouseout", null, true);
                if (value)
                    value.dispatch("mouseover", null, true);
            }
            this._selectedGameObject = value;
            this._mouseEventTypes.forEach(element =>
            {
                switch (element)
                {
                    case "mousedown":
                        if (this.preMouseDownGameObject != this._selectedGameObject)
                        {
                            this.gameObjectClickNum = 0;
                            this.preMouseDownGameObject = this._selectedGameObject;
                        }
                        this._selectedGameObject && this._selectedGameObject.dispatch(element, null, true);
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
                        this._selectedGameObject && this._selectedGameObject.dispatch(element, null, true);
                        break;
                    case "mousemove":
                        this._selectedGameObject && this._selectedGameObject.dispatch(element, null, true);
                        break;
                    case "click":
                        if (this.gameObjectClickNum > 0)
                            this._selectedGameObject && this._selectedGameObject.dispatch(element, null, true);
                        break;
                    case "dblclick":
                        if (this.gameObjectClickNum > 1)
                        {
                            this._selectedGameObject && this._selectedGameObject.dispatch(element, null, true);
                            this.gameObjectClickNum = 0;
                        }
                        break;
                }
            });
            this._mouseEventTypes.length = 0;
        }
    }

    export interface MouseInput
    {
        once<K extends keyof MouseEventMap>(type: K, listener: (event: Event<MouseEventMap[K]>) => void, thisObject?: any, priority?: number): void;

        has<K extends keyof MouseEventMap>(type: K): boolean;
        on<K extends keyof MouseEventMap>(type: K, listener: (event: Event<MouseEventMap[K]>) => any, thisObject?: any, priority?: number, once?: boolean);
        off<K extends keyof MouseEventMap>(type?: K, listener?: (event: Event<MouseEventMap[K]>) => any, thisObject?: any);
    }

    /**
     * 鼠标事件输入
     */
    export class MouseInput extends EventDispatcher
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
        dispatch(type: string, data?: any, bubbles = false)
        {
            if (!this.enable)
                return null;
            if (!this.catchMouseMove && type == "mousemove")
                return null;
            return fevent.dispatch(this, type, data, bubbles);
        }

        /**
         * 派发事件
         * @param event   事件对象
         */
        dispatchEvent(event: Event<any>)
        {
            if (!this.enable)
                return false;
            if (!this.catchMouseMove && event.type == "mousemove")
                return false;
            return super.dispatchEvent(event);
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
        private onMouseEvent(event: MouseEvent)
        {
            var type = event.type;
            // 处理鼠标中键与右键
            if (event instanceof MouseEvent)
            {
                if (["click", "mousedown", "mouseup"].indexOf(event.type) != -1)
                {
                    type = ["", "middle", "right"][event.button] + event.type;
                }
            }

            this.dispatch(<any>type, { mouseX: event.clientX, mouseY: event.clientY });
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