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
        public difuseTexture: Texture2D = new Texture2D();

        /**
         * 基本颜色
         */
        public baseColor = new Color(1, 1, 1, 1);

        /**
         * 构建
         */
        constructor()
        {
            super();
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {

            renderData.uniforms[RenderDataID.u_baseColor] = this.baseColor;
            //
            super.updateRenderData(renderContext, renderData);
        }
    }
}