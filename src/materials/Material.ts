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
         * 着色器名称
         */
        protected shaderName: string;

        /**
         * 构建材质
         */
        constructor() {

            super();
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext) {
            super.updateRenderData(renderContext);
            //
            this.renderData.shaderParams.renderMode = this.renderMode;
            //
            if (this.shaderName) {
                this.renderData.vertexCode = ShaderLib.getShaderCode(this.shaderName + ".vertex");
                this.renderData.fragmentCode = ShaderLib.getShaderCode(this.shaderName + ".fragment");
            }
        }
    }
}
