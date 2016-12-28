module feng3d {

    /**
     * 材质
     * @author feng 2016-05-02
     */
    export class Material extends RenderDataHolder {

        /**
        * 渲染模式
        */
        renderMode = RenderMode.TRIANGLES;

        /**
         * 构建材质
         */
        constructor() {

            super();
            this.renderData.shaderName = "default";
        }

        /**
		 * 激活
		 * @param renderData	渲染数据
		 */
        public activate(renderData: RenderAtomic, camera: Camera3D) {

            //
            super.activate(renderData, camera);
            //
            renderData.shaderMacro.DIFFUSE_INPUT_TYPE = 0;
            //
            renderData.shaderParams.renderMode = this.renderMode;
        }

        /**
		 * 释放
		 * @param renderData	渲染数据
		 */
        public deactivate(renderData: RenderAtomic) {

            renderData.shaderMacro.DIFFUSE_INPUT_TYPE = 0;
            //
            renderData.shaderParams.renderMode = RenderMode.DEFAULT;
            super.deactivate(renderData);
        }
    }
}