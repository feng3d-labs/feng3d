module feng3d
{

    /**
     * 材质
     * @author feng 2016-05-02
     */
    export class Material extends RenderDataHolder
    {
        protected _enableBlend = false;

        /**
        * 渲染模式，默认RenderMode.TRIANGLES
        */
        public renderMode = RenderMode.TRIANGLES;

        /**
         * 着色器名称
         */
        protected shaderName: string;

        /**
         * 是否渲染双面
         */
        public bothSides = true;

        /**
         * 是否开启混合
         * <混合后的颜色> = <源颜色>*sfactor + <目标颜色>*dfactor
         */
        public get enableBlend()
        {
            return this._enableBlend;
        }

        public set enableBlend(value: boolean)
        {
            this._enableBlend = value;
        }

        /**
         * 混合方程，默认BlendEquation.FUNC_ADD
         */
        public blendEquation = BlendEquation.FUNC_ADD;

        /**
         * 源混合因子，默认BlendFactor.SRC_ALPHA
         */
        public sfactor = BlendFactor.SRC_ALPHA;

        /**
         * 目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA
         */
        public dfactor = BlendFactor.ONE_MINUS_SRC_ALPHA;

        /**
         * 构建材质
         */
        constructor()
        {
            super();
            this._single = true;
            this._type = Material;

            Watcher.watch(this, ["shaderName"], this.invalidateRenderData, this);
            Watcher.watch(this, ["renderMode"], this.invalidateRenderData, this);
        }

        /**
		 * 更新渲染数据
		 */
        public updateRenderData(renderContext: RenderContext, renderData: RenderAtomic)
        {
            //
            renderData.shaderParams.renderMode = this.renderMode;
            //
            if (this.shaderName)
            {
                renderData.vertexCode = ShaderLib.getShaderCode(this.shaderName + ".vertex");
                renderData.fragmentCode = ShaderLib.getShaderCode(this.shaderName + ".fragment");
            } else
            {
                renderData.vertexCode = null;
                renderData.fragmentCode = null;
            }

            super.updateRenderData(renderContext, renderData);
        }
    }
}
