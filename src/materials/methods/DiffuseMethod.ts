namespace feng3d
{
	/**
	 * 漫反射函数
	 * @author feng 2017-03-22
	 */
    export class DiffuseMethod extends EventDispatcher
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
            this._difuseTexture = value;
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
        }

        preRender(renderAtomic: RenderAtomic)
        {
            renderAtomic.shaderMacro.B_HAS_DIFFUSE_SAMPLER = this.difuseTexture && this.difuseTexture.checkRenderData();

            //
            renderAtomic.uniforms.u_diffuse = () => this.color;
            renderAtomic.uniforms.s_diffuse = () => this.difuseTexture;
            renderAtomic.uniforms.u_alphaThreshold = () => this.alphaThreshold;
        }
    }
}