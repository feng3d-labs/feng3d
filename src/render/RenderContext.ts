module feng3d {

    /**
     * 渲染环境
     * @author feng 2017-01-04
     */
    export class RenderContext {

        /**
         * 摄像机
         */
        public camera: Camera3D;

        /**
         * 灯光
         */
        public lights: Light[] = [];

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(object3D: Object3D) {

            this.camera.updateRenderData(this);
            for (var i = 0; i < this.lights.length; i++) {
                this.lights[i].updateRenderData(this);
            }
        }

        /**
		 * 激活
		 * @param renderData	渲染数据
		 */
        public activate(renderData: RenderAtomic) {

            this.camera.activate(renderData);
        }

        /**
		 * 释放
		 * @param renderData	渲染数据
		 */
        public deactivate(renderData: RenderAtomic) {

            this.camera.deactivate(renderData);
        }

        /**
         * 清理
         */
        public clear() {

            this.camera = null;
            this.lights.length = 0;
        }
    }
}