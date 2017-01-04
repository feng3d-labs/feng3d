module feng3d {

    /**
     * 材质
     * @author feng 2016-05-02
     */
    export class Material extends RenderDataHolder {

        /**
        * 渲染模式
        */
        protected renderMode = RenderMode.TRIANGLES;
        /**
         * 渲染程序名称
         */
        protected shaderName = "default";

        /**
         * 构建材质
         */
        constructor() {

            super();
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
            //
            this.renderData.vertexCode = ShaderLib.getShaderCode(this.shaderName + ".vertex");
            this.renderData.fragmentCode = ShaderLib.getShaderCode(this.shaderName + ".fragment");
        }
    }
}
