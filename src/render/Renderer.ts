module feng3d {

    /**
     * 渲染器
     * @author feng 2016-05-01
     */
    export class Renderer {

        private renderData = new RenderAtomic();

        /**
		 * 渲染
		 */
        public render(context3D: WebGLRenderingContext, scene: Scene3D, camera: Camera3D) {
            context3D.clear(context3D.COLOR_BUFFER_BIT | context3D.DEPTH_BUFFER_BIT);

            //绘制对象
            camera.activate(this.renderData, camera);

            var renderables = scene.getRenderables();
            renderables.forEach(element => {
                this.drawObject3D(element, context3D, camera);
            });

            camera.deactivate(this.renderData);
        }

        /**
         * 绘制3D对象
         */
        private drawObject3D(object3D: Object3D, context3D: WebGLRenderingContext, camera: Camera3D) {

            object3D.activate(this.renderData, camera);
            this.renderData.draw(context3D);
            object3D.deactivate(this.renderData);
        }
    }
}