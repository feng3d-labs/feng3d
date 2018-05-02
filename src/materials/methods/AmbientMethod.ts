namespace feng3d
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
        @serialize()
        @oav()
        get ambientTexture()
        {
            return this._ambientTexture;
        }
        set ambientTexture(value)
        {
            if (this._ambientTexture == value)
                return;
            if (this._ambientTexture)
                this._ambientTexture.off("loaded", this.onTextureChanged, this);
            this._ambientTexture = value;
            if (this._ambientTexture)
                this._ambientTexture.on("loaded", this.onTextureChanged, this);
            this.onTextureChanged();
        }
        private _ambientTexture: Texture2D;

        /**
         * 颜色
         */
        @serialize()
        @oav()
        get color()
        {
            return this._color;
        }
        set color(value)
        {
            this._color = value;
        }
        private _color: Color;

        /**
         * 构建
         */
        constructor(ambientUrl = "", color?: Color)
        {
            super();
            this.ambientTexture = new Texture2D(ambientUrl);
            this.color = color || new Color();
            //
            this.createUniformData("u_ambient", () => this._color);
            this.createUniformData("s_ambient", () => this._ambientTexture);
        }

        private onTextureChanged()
        {
            this.createBoolMacro("B_HAS_AMBIENT_SAMPLER", this._ambientTexture && this._ambientTexture.checkRenderData());
        }
    }
}