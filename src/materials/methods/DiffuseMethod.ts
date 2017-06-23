module feng3d
{
	/**
	 * 漫反射函数
	 * @author feng 2017-03-22
	 */
    export class DiffuseMethod extends RenderDataHolder
    {
        /**
         * 漫反射纹理
         */
        public get difuseTexture()
        {
            return this._difuseTexture;
        }
        public set difuseTexture(value)
        {
            if (this._difuseTexture)
                this.difuseTexture.removeEventListener(Event.LOADED, this.invalidateRenderData, this);
            this._difuseTexture = value;
            if (this._difuseTexture)
                this.difuseTexture.addEventListener(Event.LOADED, this.invalidateRenderData, this);
            this.invalidateRenderData();
        }
        private _difuseTexture: Texture2D;

        /**
         * 基本颜色
         */
        public get color()
        {
            return this._color;
        }
        public set color(value)
        {
            this._color = value;
            this.invalidateRenderData();
        }
        private _color = new Color(1, 1, 1, 1);

        /**
         * 透明阈值，透明度小于该值的像素被片段着色器丢弃
         */
        public get alphaThreshold()
        {
            return this._alphaThreshold;
        }
        public set alphaThreshold(value)
        {
            this._alphaThreshold = value;
            this.invalidateRenderData();
        }
        private _alphaThreshold = 0;

        /**
         * 构建
         */
        constructor(diffuseUrl: string = "")
        {
            super();
            this.difuseTexture = new Texture2D(diffuseUrl);
            this.color = new Color(1, 1, 1, 1);
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            renderData.uniforms.u_diffuse = this.color;

            if (this.difuseTexture.checkRenderData())
            {
                renderData.uniforms.s_diffuse = this.difuseTexture;
                renderData.shaderMacro.boolMacros.HAS_DIFFUSE_SAMPLER = true;
            } else
            {
                delete renderData.uniforms.s_diffuse;
                renderData.shaderMacro.boolMacros.HAS_DIFFUSE_SAMPLER = false;
            }
            renderData.uniforms.u_alphaThreshold = this.alphaThreshold;

            //
            super.updateRenderData(renderContext, renderData);
        }
    }
}