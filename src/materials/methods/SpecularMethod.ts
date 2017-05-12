module feng3d
{
	/**
	 * 法线函数
	 * @author feng 2017-03-22
	 */
    export class SpecularMethod extends RenderDataHolder
    {
        /**
         * 镜面反射光泽图
         */
        public get specularTexture ()
        {
            return this._specularTexture;
        }
        public set specularTexture (value)
        {
            if(this._specularTexture)
                this._specularTexture.removeEventListener(Event.LOADED, this.invalidateRenderData, this);
            this._specularTexture = value;
            if(this._specularTexture)
                this._specularTexture.addEventListener(Event.LOADED, this.invalidateRenderData, this);
            this.invalidateRenderData();
        }
        private _specularTexture: Texture2D;
        /**
         * 镜面反射颜色
         */
        public specularColor = new Color();
        /**
		 * 镜面反射光反射强度
		 */
        public get specular(){
            return this.specularColor.a;
        }
        public set specular(value){
            this.specularColor.a = value;
        }
        /**
         * 高光系数
         */
        public glossiness = 50;

        /**
         * 构建
         */
        constructor(specularUrl = "")
        {
            super();
            this.specularTexture = new Texture2D(specularUrl);
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            if (this.specularTexture.checkRenderData())
            {
                renderData.uniforms[RenderDataID.s_specular] = this.specularTexture;
                renderData.shaderMacro.boolMacros.HAS_SPECULAR_SAMPLER = true;
            } else
            {
                renderData.uniforms[RenderDataID.s_specular] = null;
                renderData.shaderMacro.boolMacros.HAS_SPECULAR_SAMPLER = false;
            }
            renderData.uniforms[RenderDataID.u_specular] = this.specularColor;
            renderData.uniforms[RenderDataID.u_glossiness] = this.glossiness;

            //
            super.updateRenderData(renderContext, renderData);
        }
    }
}