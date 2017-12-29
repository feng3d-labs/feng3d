namespace feng3d
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
        @serialize()
        @oav()
        get normalTexture()
        {
            return this._normalTexture;
        }
        set normalTexture(value)
        {
            if (this._normalTexture == value)
                return;
            if (this._normalTexture)
                this._normalTexture.off("loaded", this.onTextureChanged, this);
            this._normalTexture = value;
            if (this._normalTexture)
                this._normalTexture.on("loaded", this.onTextureChanged, this);
            this.onTextureChanged();
        }
        private _normalTexture: Texture2D;

        /**
         * 构建
         */
        constructor(normalUrl: string = "")
        {
            super();
            this.normalTexture = new Texture2D(normalUrl);
            //
            this.createUniformData("s_normal", () => this.normalTexture);
        }

        private onTextureChanged()
        {
            this.createBoolMacro("HAS_NORMAL_SAMPLER", this.normalTexture.checkRenderData());
        }
    }
}