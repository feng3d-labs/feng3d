namespace feng3d
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
        @serialize()
        @oav()
        get difuseTexture()
        {
            return this._difuseTexture;
        }
        set difuseTexture(value)
        {
            if (this._difuseTexture == value)
                return;
            if (this._difuseTexture)
                this._difuseTexture.off("loaded", this.ontextureChanged, this)
            this._difuseTexture = value;
            if (this._difuseTexture)
                this._difuseTexture.on("loaded", this.ontextureChanged, this)
            this.ontextureChanged();
        }
        private _difuseTexture: Texture2D;

        /**
         * 基本颜色
         */
        @serialize()
        @oav()
        color = new Color(1, 1, 1, 1);

        /**
         * 透明阈值，透明度小于该值的像素被片段着色器丢弃
         */
        @serialize(0)
        @oav()
        alphaThreshold = 0;

        /**
         * 构建
         */
        constructor(diffuseUrl: string = "")
        {
            super();
            this.difuseTexture = new Texture2D(diffuseUrl);
            this.color = new Color(1, 1, 1, 1);
            //
            this.createUniformData("u_diffuse", () => this.color);
            this.createUniformData("s_diffuse", () => this.difuseTexture);
            this.createUniformData("u_alphaThreshold", () => this.alphaThreshold);
        }

        private ontextureChanged()
        {
            this.createBoolMacro("HAS_DIFFUSE_SAMPLER", this.difuseTexture.checkRenderData());
        }
    }
}