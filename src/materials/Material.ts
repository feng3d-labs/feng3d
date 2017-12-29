namespace feng3d
{

    /**
     * 材质
     * @author feng 2016-05-02
     */
    export class Material extends RenderDataHolder
    {
        /**
        * 渲染模式，默认RenderMode.TRIANGLES
        */
        @serialize(RenderMode.TRIANGLES)
        @oav()
        get renderMode()
        {
            return this._renderMode;
        }
        set renderMode(value)
        {
            this._renderMode = value;
            this.createBoolMacro("IS_POINTS_MODE", this.renderMode == RenderMode.POINTS);
            this.createShaderParam("renderMode", this.renderMode);
        }
        private _renderMode: number;

        get shaderName()
        {
            return this._shaderName;
        }
        set shaderName(value)
        {
            if (this._shaderName == value)
                return;
            this._shaderName = value;
            this.vertexCode = ShaderLib.getShaderCode(this._shaderName + ".vertex");
            this.fragmentCode = ShaderLib.getShaderCode(this._shaderName + ".fragment")
        }
        private _shaderName: string;

        /**
         * 顶点渲染程序代码
         */
        get vertexCode()
        {
            return this._vertexCode;
        }
        set vertexCode(value)
        {
            if (this._vertexCode == value)
                return;
            this._vertexCode = value;
            this.createvertexCode(this._vertexCode);
        }
        private _vertexCode: string;

        /**
         * 片段渲染程序代码
         */
        get fragmentCode()
        {
            return this._fragmentCode;
        }
        set fragmentCode(value)
        {
            if (this._fragmentCode == value)
                return;
            this._fragmentCode = value;
            this.createfragmentCode(this._fragmentCode);
        }
        private _fragmentCode: string;

        /**
         * 剔除面
         * 参考：http://www.jianshu.com/p/ee04165f2a02
         * 默认情况下，逆时针的顶点连接顺序被定义为三角形的正面。
         * 使用gl.frontFace(gl.CW);调整顺时针为正面
         */
        @serialize(CullFace.BACK)
        @oav()
        cullFace = CullFace.BACK;

        @serialize(FrontFace.CW)
        @oav()
        frontFace = FrontFace.CW;

        /**
         * 是否开启混合
         * <混合后的颜色> = <源颜色>*sfactor + <目标颜色>*dfactor
         */
        @serialize(false)
        @oav()
        get enableBlend()
        {
            return this._enableBlend;
        }

        set enableBlend(value: boolean)
        {
            this._enableBlend = value;
            this.depthMask = !value;
        }
        protected _enableBlend = false;

        /**
         * 点绘制时点的尺寸
         */
        @serialize(1)
        @oav()
        get pointSize()
        {
            return this._pointSize;
        }

        set pointSize(value)
        {
            this._pointSize = value;
            this.createUniformData("u_PointSize", this.pointSize);
        }
        protected _pointSize = 1;

        /**
         * 混合方程，默认BlendEquation.FUNC_ADD
         */
        @serialize(BlendEquation.FUNC_ADD)
        @oav()
        blendEquation = BlendEquation.FUNC_ADD;

        /**
         * 源混合因子，默认BlendFactor.SRC_ALPHA
         */
        @serialize(BlendFactor.SRC_ALPHA)
        @oav()
        sfactor = BlendFactor.SRC_ALPHA;

        /**
         * 目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA
         */
        @serialize(BlendFactor.ONE_MINUS_SRC_ALPHA)
        @oav()
        dfactor = BlendFactor.ONE_MINUS_SRC_ALPHA;

        /**
         * 是否开启深度检查
         */
        @serialize(true)
        @oav()
        depthtest = true;

        /**
         * 是否开启深度标记
         */
        @serialize(true)
        @oav()
        depthMask = true;

        /**
         * 绘制在画布上的区域
         */
        @oav()
        viewRect = new Rectangle(0, 0, 100, 100);

        /**
         * 是否使用 viewRect
         */
        @oav()
        useViewRect = false;

        constructor()
        {
            super();
            this.renderMode = RenderMode.TRIANGLES;

            this.createShaderParam("cullFace", () => this.cullFace);
            this.createShaderParam("frontFace", () => this.frontFace);
            this.createShaderParam("enableBlend", () => this.enableBlend);
            this.createShaderParam("blendEquation", () => this.blendEquation);
            this.createShaderParam("sfactor", () => this.sfactor);
            this.createShaderParam("dfactor", () => this.dfactor);
            this.createShaderParam("depthtest", () => this.depthtest);
            this.createShaderParam("depthMask", () => this.depthMask);
            
            this.createShaderParam("viewRect", () => this.viewRect);
            this.createShaderParam("useViewRect", () => this.useViewRect);
        }
    }
}
