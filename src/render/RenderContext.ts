module feng3d {

    /**
     * 渲染环境
     * @author feng 2017-01-04
     */
    export class RenderContext {

        protected renderData = new RenderData();

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
            this.renderData.shaderMacro.valueMacros.NUM_POINTLIGHT = this.lights.length;
            if (this.lights.length > 0) {
                this.renderData.shaderMacro.addMacros.A_NORMAL_NEED = 1;
                this.renderData.shaderMacro.addMacros.V_NORMAL_NEED = 1;
                this.renderData.shaderMacro.addMacros.V_GLOBAL_POSITION_NEED = 1;
            }
        }

        /**
		 * 激活
		 * @param renderData	渲染数据
		 */
        public activate(renderData: RenderAtomic) {

            RenderDataUtil.active(renderData, this.renderData);
            this.camera.activate(renderData);
        }

        /**
		 * 释放
		 * @param renderData	渲染数据
		 */
        public deactivate(renderData: RenderAtomic) {

            RenderDataUtil.deactivate(renderData, this.renderData);
            this.camera.deactivate(renderData);
        }

        /**
         * 清理
         */
        public clear() {

            this.camera = null;
            this.lights = [];
        }
    }
}