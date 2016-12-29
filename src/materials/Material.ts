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
		 * 更新渲染数据
		 */
        public updateRenderData(camera: Camera3D) {
            super.updateRenderData(camera);
            //
            this.renderData.shaderParams.renderMode = this.renderMode;
            //
            this.renderData.shaderMacro.valueMacros.DIFFUSE_INPUT_TYPE = 0;
        }
    }
}