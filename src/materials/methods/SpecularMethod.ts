namespace feng3d
{
	/**
	 * 法线函数
	 * @author feng 2017-03-22
	 */
    export class SpecularMethod extends EventDispatcher
    {
        /**
         * 镜面反射光泽图
         */
        @serialize()
        get specularTexture()
        {
            return this._specularTexture;
        }
        set specularTexture(value)
        {
            if (this._specularTexture == value)
                return;
            if (this._specularTexture)
                this._specularTexture.off("loaded", this.onTextureChanged, this);
            this._specularTexture = value;
            if (this._specularTexture)
                this._specularTexture.on("loaded", this.onTextureChanged, this);
            this.onTextureChanged();
        }
        private _specularTexture: Texture2D;
        /**
         * 镜面反射颜色
         */
        @serialize()
        specularColor = new Color();
        /**
		 * 镜面反射光反射强度
		 */
        get specular()
        {
            return this.specularColor.a;
        }
        set specular(value)
        {
            this.specularColor.a = value;
        }
        /**
         * 高光系数
         */
        @serialize(50)
        glossiness = 50;

        /**
         * 构建
         */
        constructor(specularUrl = "")
        {
            super();
            this.specularTexture = new Texture2D(specularUrl);
        }

        private onTextureChanged()
        {
        }

        preRender(renderAtomic: RenderAtomic)
        {
            //
            renderAtomic.uniforms.s_specular = () => this.specularTexture;
            renderAtomic.uniforms.u_specular = () => this.specularColor;
            renderAtomic.uniforms.u_glossiness = () => this.glossiness;

            renderAtomic.shaderMacro.HAS_SPECULAR_SAMPLER = this.specularTexture.checkRenderData();
        }
    }
}