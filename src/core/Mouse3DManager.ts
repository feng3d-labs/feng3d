module feng3d {

	/**
	 * 鼠标事件管理
	 * @author feng 2014-4-29
	 */
    export class Mouse3DManager {
        /**
         * 鼠标拾取渲染器
         */
        private mouseRenderer: MouseRenderer;
        private mousePickTasks: { mouseX: number, mouseY: number, event: Event }[] = [];
        public viewRect: Rectangle = new Rectangle(0, 0, 100, 100);

        constructor() {

            this.mouseRenderer = new MouseRenderer();
            $mouseKeyInput.addEventListener("mousemove", this.onMousedown, this);
        }

        private onMousedown(event: Event) {

            var mouseX = event.data.clientX - this.viewRect.x;
            var mouseY = event.data.clientY - this.viewRect.y;

            this.mousePickTasks.push({ mouseX: mouseX, mouseY: mouseY, event: event });
        }

        /**
		 * 渲染
		 */
        public draw(context3D: Context3D, scene3D: Scene3D, camera: Camera3D) {

            if (this.mousePickTasks.length > 0) {
                var mousePickTasks = this.mousePickTasks.reverse();
                while (mousePickTasks.length > 0) {
                    var mousePickTask = mousePickTasks.pop();

                    context3D.clearColor(0, 0, 0, 0);
                    context3D.clearDepth(1);
                    context3D.clear(Context3D.COLOR_BUFFER_BIT | Context3D.DEPTH_BUFFER_BIT);
                    context3D.viewport(-mousePickTask.mouseX, -mousePickTask.mouseY, this.viewRect.width, this.viewRect.height);
                    this.mouseRenderer.draw(context3D, scene3D, camera);
                }
            }
        }
    }
}