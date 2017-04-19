module feng3d
{
	/**
	 * 漫反射函数
	 * @author feng 2017-03-22
	 */
    export class AmbientMethod extends RenderDataHolder
    {
        /**
         * 环境纹理
         */
        public ambientTexture: Texture2D = new Texture2D();

        /**
         * 颜色
         */
        public color = new Color(0.7, 0.7, 0.7, 1);

        /**
         * 构建
         */
        constructor()
        {
            super();
            this.ambientTexture.addEventListener(Event.LOADED, this.invalidateRenderData, this);
            Watcher.watch(this, ["color"], this.invalidateRenderData, this);
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            renderData.uniforms[RenderDataID.u_ambient] = this.color;

            if (this.ambientTexture.checkRenderData())
            {
                renderData.uniforms[RenderDataID.s_ambient] = this.ambientTexture;
                renderData.shaderMacro.boolMacros.HAS_AMBIENT_SAMPLER = true;
            } else
            {
                renderData.uniforms[RenderDataID.s_ambient] = null;
                renderData.shaderMacro.boolMacros.HAS_AMBIENT_SAMPLER = false;
            }
            //
            super.updateRenderData(renderContext, renderData);
        }
    }
}