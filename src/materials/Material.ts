namespace feng3d
{

    /**
     * 材质
     * @author feng 2016-05-02
     */
    export class Material extends RenderDataHolder
    {
        protected _pointSize = 1;
        protected _enableBlend = false;

        /**
        * 渲染模式，默认RenderMode.TRIANGLES
        */
        public get renderMode()
        {
            return this._renderMode;
        }
        public set renderMode(value)
        {
            this._renderMode = value;
        }
        private _renderMode = RenderMode.TRIANGLES;

        /**
         * 顶点渲染程序代码
         */
        public get vertexCode()
        {
            return this._vertexCode;
        }
        public set vertexCode(value)
        {
            if (this._vertexCode == value)
                return;
            this._vertexCode = value;
        }
        private _vertexCode: string;

        /**
         * 片段渲染程序代码
         */
        public get fragmentCode()
        {
            return this._fragmentCode;
        }
        public set fragmentCode(value)
        {
            if (this._fragmentCode == value)
                return;
            this._fragmentCode = value;
        }
        private _fragmentCode: string;

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
         * 点绘制时点的尺寸
         */
        public get pointSize()
        {
            return this._pointSize;
        }

        public set pointSize(value)
        {
            this._pointSize = value;
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

        private _methods: RenderDataHolder[] = [];

        /**
         * 构建材质
         */
        constructor()
        {
            super();
            this.createShaderCode(() => { return { vertexCode: this.vertexCode, fragmentCode: this.fragmentCode } });
            this.createBoolMacro("IS_POINTS_MODE", () => this.renderMode == RenderMode.POINTS);
            this.createUniformData("u_PointSize", () => this.pointSize);
            this.createShaderParam("renderMode",() => this.renderMode);
        }

        /**
         * 设置渲染程序
         * @param shaderName 渲染程序名称
         */
        public setShader(shaderName: string)
        {
            this.vertexCode = ShaderLib.getShaderCode(shaderName + ".vertex");
            this.fragmentCode = ShaderLib.getShaderCode(shaderName + ".fragment")
        }

        /**
         * 添加方法
         */
        public addMethod(method: RenderDataHolder)
        {
            var index = this._methods.indexOf(method);
            if (index != -1)
                return;
            this._methods.push(method);
            this.addRenderDataHolder(method);
        }

        /**
         * 删除方法
         */
        public removeMethod(method: RenderDataHolder)
        {
            var index = this._methods.indexOf(method);
            if (index != -1)
            {
                this._methods.splice(index, 1);
                this.removeRenderDataHolder(method);
            }
        }
    }
}
