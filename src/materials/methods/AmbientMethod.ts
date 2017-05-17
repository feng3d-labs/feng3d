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
        public get ambientTexture()
        {
            return this._ambientTexture;
        }
        public set ambientTexture(value)
        {
            if (this.ambientTexture)
                this.ambientTexture.removeEventListener(Event.LOADED, this.invalidateRenderData, this);
            this._ambientTexture = value;
            if (this.ambientTexture)
                this.ambientTexture.addEventListener(Event.LOADED, this.invalidateRenderData, this);
            this.invalidateRenderData();
        }
        private _ambientTexture: Texture2D;

        /**
         * 颜色
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
        private _color: Color;

        /**
         * 构建
         */
        constructor(ambientUrl = "", color: Color = null)
        {
            super();
            this.ambientTexture = new Texture2D(ambientUrl);
            this.color = color || new Color();
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            renderData.uniforms.u_ambient = this._color;

            if (this.ambientTexture.checkRenderData())
            {
                renderData.uniforms.s_ambient = this._ambientTexture;
                renderData.shaderMacro.boolMacros.HAS_AMBIENT_SAMPLER = true;
            } else
            {
                delete renderData.uniforms.s_ambient;
                renderData.shaderMacro.boolMacros.HAS_AMBIENT_SAMPLER = false;
            }
            //
            super.updateRenderData(renderContext, renderData);
        }
    }
}