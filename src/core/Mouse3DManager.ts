module feng3d
{
    /**
     * 鼠标事件管理
     * @author feng 2014-4-29
     */
    export var mouse3DManager = {
        draw: draw,
        catchMouseMove: catchMouseMove,
        getSelectedObject3D: getSelectedObject3D,
    };

    //
    input.on("click", onMouseEvent, null);
    input.on("dblclick", onMouseEvent, null);
    input.on("mousedown", onMouseEvent, null);
    input.on("mouseup", onMouseEvent, null);

    var mouseX = 0;
    var mouseY = 0;

    var selectedObject3D: GameObject;
    var mouseEventTypes: string[] = [];

    /**
     * 鼠标按下时的对象，用于与鼠标弹起时对象做对比，如果相同触发click
     */
    var preMouseDownObject3D: GameObject | null;
    /**
     * 统计处理click次数，判断是否达到dblclick
     */
    var Object3DClickNum: number;

    var _catchMouseMove = false;
    /**
     * 是否捕捉鼠标移动，默认false。
     */
    function catchMouseMove(value)
    {
        if (_catchMouseMove == value)
            return;
        if (_catchMouseMove)
        {
            input.off("mousemove", onMouseEvent, null);
        }
        _catchMouseMove = value;
        if (_catchMouseMove)
        {
            input.on("mousemove", onMouseEvent, null);
        }
    }

    /**
     * 监听鼠标事件收集事件类型
     */
    function onMouseEvent(event: EventVO<InputEvent>)
    {
        var inputEvent: InputEvent = event.data;
        if (mouseEventTypes.indexOf(inputEvent.type) == -1)
            mouseEventTypes.push(inputEvent.type);
        mouseX = inputEvent.clientX;
        mouseY = inputEvent.clientY;
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

        var object3D = pickingCollisionVO && pickingCollisionVO.gameObject;

        if (object3D)
            setSelectedObject3D(object3D);
        else
            setSelectedObject3D(scene3d.gameObject);
    }

    /**
     * 设置选中对象
     */
    function setSelectedObject3D(value: GameObject)
    {
        if (selectedObject3D != value)
        {
            if (selectedObject3D)
                selectedObject3D.dispatch("mouseout", null, true);
            if (value)
                value.dispatch("mouseover", null, true);
        }
        selectedObject3D = value;
        if (selectedObject3D)
        {
            mouseEventTypes.forEach(element =>
            {
                switch (element)
                {
                    case "mousedown":
                        if (preMouseDownObject3D != selectedObject3D)
                        {
                            Object3DClickNum = 0;
                            preMouseDownObject3D = selectedObject3D;
                        }
                        selectedObject3D.dispatch(element, null, true);
                        break;
                    case "mouseup":
                        if (selectedObject3D == preMouseDownObject3D)
                        {
                            Object3DClickNum++;
                        } else
                        {
                            Object3DClickNum = 0;
                            preMouseDownObject3D = null;
                        }
                        selectedObject3D.dispatch(element, null, true);
                        break;
                    case "mousemove":
                        selectedObject3D.dispatch(element, null, true);
                        break;
                    case "click":
                        if (Object3DClickNum > 0)
                            selectedObject3D.dispatch(element, null, true);
                        break;
                    case "dblclick":
                        if (Object3DClickNum > 1)
                            selectedObject3D.dispatch(element, null, true);
                        break;
                }

            });
        } else
        {
            Object3DClickNum = 0;
            preMouseDownObject3D = null;
        }
        mouseEventTypes.length = 0;
    }

    function getSelectedObject3D()
    {
        return selectedObject3D;
    }
}