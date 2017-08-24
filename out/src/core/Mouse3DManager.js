var feng3d;
(function (feng3d) {
    /**
     * 鼠标事件管理
     * @author feng 2014-4-29
     */
    var Mouse3DManager = (function () {
        function Mouse3DManager() {
            this.mouseX = 0;
            this.mouseY = 0;
            this.mouseEventTypes = [];
            /** 射线采集器(采集射线穿过场景中物体的列表) */
            this._mousePicker = new feng3d.RaycastPicker(false);
            this._catchMouseMove = false;
            this.mouseRenderer = new feng3d.MouseRenderer();
            //
            feng3d.input.on("click", this.onMouseEvent, this);
            feng3d.input.on("dblclick", this.onMouseEvent, this);
            feng3d.input.on("mousedown", this.onMouseEvent, this);
            feng3d.input.on("mouseup", this.onMouseEvent, this);
        }
        Object.defineProperty(Mouse3DManager.prototype, "catchMouseMove", {
            /**
             * 是否捕捉鼠标移动，默认false。
             */
            get: function () {
                return this._catchMouseMove;
            },
            set: function (value) {
                if (this._catchMouseMove == value)
                    return;
                if (this._catchMouseMove) {
                    feng3d.input.off("mousemove", this.onMouseEvent, this);
                }
                this._catchMouseMove = value;
                if (this._catchMouseMove) {
                    feng3d.input.on("mousemove", this.onMouseEvent, this);
                }
            },
            enumerable: true,
            configurable: true
        });
        /**
         * 监听鼠标事件收集事件类型
         */
        Mouse3DManager.prototype.onMouseEvent = function (event) {
            var inputEvent = event;
            if (this.mouseEventTypes.indexOf(inputEvent.type) == -1)
                this.mouseEventTypes.push(inputEvent.type);
            this.mouseX = inputEvent.clientX;
            this.mouseY = inputEvent.clientY;
        };
        /**
         * 渲染
         */
        Mouse3DManager.prototype.draw = function (scene3d, camera, viewRect) {
            if (!viewRect.contains(this.mouseX, this.mouseY))
                return;
            if (this.mouseEventTypes.length == 0)
                return;
            var mouseCollisionEntitys = this.getMouseCheckObjects(scene3d);
            if (mouseCollisionEntitys.length == 0)
                return;
            this.pick(scene3d, camera);
            // this.glPick(renderContext);
        };
        Mouse3DManager.prototype.pick = function (scene3d, camera) {
            var mouseCollisionEntitys = this.getMouseCheckObjects(scene3d);
            var mouseRay3D = camera.getMouseRay3D();
            //计算得到鼠标射线相交的物体
            var _collidingObject = this._mousePicker.getViewCollision(mouseRay3D, mouseCollisionEntitys);
            var object3D = _collidingObject && _collidingObject.firstEntity;
            if (object3D)
                this.setSelectedObject3D(object3D);
            else
                this.setSelectedObject3D(scene3d.gameObject);
        };
        Mouse3DManager.prototype.glPick = function (renderContext, viewRect) {
            var gl = renderContext.gl;
            var offsetX = -(this.mouseX - viewRect.x);
            var offsetY = -(viewRect.height - (this.mouseY - viewRect.y)); //y轴与window中坐标反向，所以需要 h = (maxHeight - h)
            gl.clearColor(0, 0, 0, 0);
            gl.clearDepth(1);
            gl.clear(feng3d.GL.COLOR_BUFFER_BIT | feng3d.GL.DEPTH_BUFFER_BIT);
            gl.viewport(offsetX, offsetY, viewRect.width, viewRect.height);
            this.mouseRenderer.draw(renderContext);
            var object3D = this.mouseRenderer.selectedObject3D;
            this.setSelectedObject3D(object3D);
        };
        Mouse3DManager.prototype.getMouseCheckObjects = function (scene3d) {
            var checkList = scene3d.gameObject.getChildren();
            var results = [];
            var i = 0;
            while (i < checkList.length) {
                var checkObject = checkList[i++];
                if (checkObject.mouseEnabled) {
                    if (checkObject.getComponents(feng3d.MeshFilter)) {
                        results.push(checkObject);
                    }
                    checkList = checkList.concat(checkObject.getChildren());
                }
            }
            return results;
        };
        /**
         * 设置选中对象
         */
        Mouse3DManager.prototype.setSelectedObject3D = function (value) {
            var _this = this;
            if (this.selectedObject3D != value) {
                if (this.selectedObject3D)
                    this.selectedObject3D.dispatch("mouseout", null, true);
                if (value)
                    value.dispatch("mouseover", null, true);
            }
            this.selectedObject3D = value;
            if (this.selectedObject3D) {
                this.mouseEventTypes.forEach(function (element) {
                    switch (element) {
                        case "mousedown":
                            if (_this.preMouseDownObject3D != _this.selectedObject3D) {
                                _this.Object3DClickNum = 0;
                                _this.preMouseDownObject3D = _this.selectedObject3D;
                            }
                            _this.selectedObject3D.dispatch(element, null, true);
                            break;
                        case "mouseup":
                            if (_this.selectedObject3D == _this.preMouseDownObject3D) {
                                _this.Object3DClickNum++;
                            }
                            else {
                                _this.Object3DClickNum = 0;
                                _this.preMouseDownObject3D = null;
                            }
                            _this.selectedObject3D.dispatch(element, null, true);
                            break;
                        case "mousemove":
                            _this.selectedObject3D.dispatch(element, null, true);
                            break;
                        case "click":
                            if (_this.Object3DClickNum > 0)
                                _this.selectedObject3D.dispatch(element, null, true);
                            break;
                        case "dblclick":
                            if (_this.Object3DClickNum > 1)
                                _this.selectedObject3D.dispatch(element, null, true);
                            break;
                    }
                });
            }
            else {
                this.Object3DClickNum = 0;
                this.preMouseDownObject3D = null;
            }
            this.mouseEventTypes.length = 0;
        };
        return Mouse3DManager;
    }());
    feng3d.Mouse3DManager = Mouse3DManager;
})(feng3d || (feng3d = {}));
//# sourceMappingURL=Mouse3DManager.js.map