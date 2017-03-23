module feng3d
{
	/**
	 * 法线函数
	 * @author feng 2017-03-22
	 */
    export class NormalMethod extends RenderDataHolder
    {
        /**
         * 漫反射纹理
         */
        public normalTexture: Texture2D = new Texture2D();

        /**
         * 构建
         */
        constructor()
        {
            super();
            this.normalTexture.addEventListener(Event.LOADED, this.invalidateRenderData, this);
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            if (this.normalTexture.checkRenderData())
            {
                renderData.uniforms[RenderDataID.s_normal] = this.normalTexture;
                renderData.shaderMacro.boolMacros.HAS_NORMAL_SAMPLER = true;
            } else
            {
                renderData.uniforms[RenderDataID.s_normal] = null;
                renderData.shaderMacro.boolMacros.HAS_NORMAL_SAMPLER = false;
            }

            //
            super.updateRenderData(renderContext, renderData);
        }
    }
}