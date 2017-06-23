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
        public get difuseTexture()
        {
            return this._difuseTexture;
        }
        public set difuseTexture(value)
        {
            this._difuseTexture = value;
        }
        private _difuseTexture: Texture2D;

        /**
         * 基本颜色
         */
        public color = new Color(1, 1, 1, 1);

        /**
         * 透明阈值，透明度小于该值的像素被片段着色器丢弃
         */
        public alphaThreshold = 0;

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
            this.createBoolMacro("HAS_DIFFUSE_SAMPLER", () => this.difuseTexture.checkRenderData());
        }
    }
}