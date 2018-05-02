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
        set normalTexture(v)
        {
            this._normalTexture.url = v.url;
        }
        _normalTexture = new Texture2D();

        /**
         * 构建
         */
        constructor(normalUrl: string = "")
        {
            super();
            // this.normalTexture.url = normalUrl;
            this.normalTexture.noPixels = imageDatas.defaultNormal;
        }

        preRender(renderAtomic: RenderAtomic)
        {
            //
            renderAtomic.uniforms.s_normal = () => this.normalTexture;
        }
    }
}