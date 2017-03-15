module feng3d
{

    /**
     * 材质
     * @author feng 2016-05-02
     */
    export class Material extends RenderDataHolder
    {

        /**
        * 渲染模式
        */
        public renderMode = RenderMode.TRIANGLES;

        /**
         * 着色器名称
         */
        protected shaderName: string;

        /**
         * 构建材质
         */
        constructor()
        {
            super();
            this._single = true;
            this._type = Material;
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            //
            this._renderData.shaderParams.renderMode = this.renderMode;
            //
            if (this.shaderName)
            {
                this._renderData.vertexCode = ShaderLib.getShaderCode(this.shaderName + ".vertex");
                this._renderData.fragmentCode = ShaderLib.getShaderCode(this.shaderName + ".fragment");
            }
            super.updateRenderData(renderContext, renderData);
        }
    }
}
