namespace feng3d
{
    /**
     * 鼠标事件管理
     * @author feng 2014-4-29
     */
    export class Mouse3DManager
    {
        draw: (scene3d: Scene3D, camera: Camera, viewRect: Rectangle) => void;
        catchMouseMove: (value: any) => void;
        getSelectedGameObject: () => GameObject;

        constructor(canvas: HTMLCanvasElement)
        {
            //
            windowEventProxy.on("click", onMouseEvent, null);
            windowEventProxy.on("dblclick", onMouseEvent, null);
            windowEventProxy.on("mousedown", onMouseEvent, null);
            windowEventProxy.on("mouseup", onMouseEvent, null);

            var mouseX = 0;
            var mouseY = 0;

            var selectedGameObject: GameObject;
            var mouseEventTypes: string[] = [];

            /**
             * 鼠标按下时的对象，用于与鼠标弹起时对象做对比，如果相同触发click
             */
            var preMouseDownGameObject: GameObject | null;
            /**
             * 统计处理click次数，判断是否达到dblclick
             */
            var gameObjectClickNum: number;

            var _catchMouseMove = false;

            this.draw = draw;
            this.catchMouseMove = catchMouseMove;
            this.getSelectedGameObject = getSelectedGameObject;

            /**
             * 是否捕捉鼠标移动，默认false。
             */
            function catchMouseMove(value)
            {
                if (_catchMouseMove == value)
                    return;
                if (_catchMouseMove)
                {
                    windowEventProxy.off("mousemove", onMouseEvent, null);
                }
                _catchMouseMove = value;
                if (_catchMouseMove)
                {
                    windowEventProxy.on("mousemove", onMouseEvent, null);
                }
            }

            /**
             * 监听鼠标事件收集事件类型
             */
            function onMouseEvent(event: MouseEvent)
            {
                var canvasRect = canvas.getBoundingClientRect();
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

                if (mouseEventTypes.indexOf(type) == -1)
                    mouseEventTypes.push(type);
                mouseX = event.clientX;
                mouseY = event.clientY;
            }

            /**
             * 渲染
             */
            function draw(scene3d: Scene3D, camera: Camera, viewRect: Rectangle)
            {
                if (!viewRect.contains(mouseX, mouseY))
                    return;
                if (mouseEventTypes.length == 0)
                    return;
                var mouseCollisionEntitys = scene3d.mouseCheckObjects;
                if (mouseCollisionEntitys.length == 0)
                    return;

                pick(scene3d, camera);
            }

            function pick(scene3d: Scene3D, camera: Camera)
            {
                var mouseRay3D = camera.getMouseRay3D();
                //计算得到鼠标射线相交的物体
                var mouseCollisionEntitys = scene3d.mouseCheckObjects;

                var pickingCollisionVO: PickingCollisionVO | null = null;
                for (var i = 0; i < mouseCollisionEntitys.length; i++)
                {
                    var entitys = mouseCollisionEntitys[i].objects;
                    pickingCollisionVO = raycastPicker.pick(mouseRay3D, entitys);
                    if (pickingCollisionVO)
                        break;
                }

                var gameobject = pickingCollisionVO && pickingCollisionVO.gameObject;

                if (gameobject)
                    setSelectedGameObject(gameobject);
                else
                    setSelectedGameObject(scene3d.gameObject);
            }

            /**
             * 设置选中对象
             */
            function setSelectedGameObject(value: GameObject)
            {
                if (selectedGameObject != value)
                {
                    if (selectedGameObject)
                        selectedGameObject.dispatch("mouseout", null, true);
                    if (value)
                        value.dispatch("mouseover", null, true);
                }
                selectedGameObject = value;
                if (selectedGameObject)
                {
                    mouseEventTypes.forEach(element =>
                    {
                        switch (element)
                        {
                            case "mousedown":
                                if (preMouseDownGameObject != selectedGameObject)
                                {
                                    gameObjectClickNum = 0;
                                    preMouseDownGameObject = selectedGameObject;
                                }
                                selectedGameObject.dispatch(element, null, true);
                                break;
                            case "mouseup":
                                if (selectedGameObject == preMouseDownGameObject)
                                {
                                    gameObjectClickNum++;
                                } else
                                {
                                    gameObjectClickNum = 0;
                                    preMouseDownGameObject = null;
                                }
                                selectedGameObject.dispatch(element, null, true);
                                break;
                            case "mousemove":
                                selectedGameObject.dispatch(element, null, true);
                                break;
                            case "click":
                                if (gameObjectClickNum > 0)
                                    selectedGameObject.dispatch(element, null, true);
                                break;
                            case "dblclick":
                                if (gameObjectClickNum > 1)
                                    selectedGameObject.dispatch(element, null, true);
                                break;
                        }
                    });
                } else
                {
                    gameObjectClickNum = 0;
                    preMouseDownGameObject = null;
                }
                mouseEventTypes.length = 0;
            }

            function getSelectedGameObject()
            {
                return selectedGameObject;
            }
        }
    }
}