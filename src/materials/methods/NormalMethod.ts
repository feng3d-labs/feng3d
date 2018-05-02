namespace feng3d
{
	/**
	 * 法线函数
	 * @author feng 2017-03-22
	 */
    export class NormalMethod extends EventDispatcher
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
            this._normalTexture = value;
        }
        private _normalTexture: Texture2D;

        /**
         * 构建
         */
        constructor(normalUrl: string = "")
        {
            super();
            this.normalTexture = new Texture2D(normalUrl);
        }

        preRender(renderAtomic: RenderAtomic)
        {
            //
            renderAtomic.uniforms.s_normal = () => this.normalTexture;
        }
    }
}