namespace feng3d
{

    /**
     * 材质
     * @author feng 2016-05-02
     */
    @ov({ component: "OVMaterial" })
    export class Material extends RenderDataHolder
    {
        /**
        * 渲染模式，默认RenderMode.TRIANGLES
        */
        @serialize(RenderMode.TRIANGLES)
        @oav({ component: "OAVEnum", componentParam: { enumClass: RenderMode } })
        get renderMode()
        {
            return this._renderMode;
        }
        set renderMode(value)
        {
            this._renderMode = value;
            this.createBoolMacro("IS_POINTS_MODE", this.renderMode == RenderMode.POINTS);

            this.renderParams.renderMode = this.renderMode;
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

            this.createvertexCode(this._shaderName);
        }
        private _shaderName: string;

        /**
         * 剔除面
         * 参考：http://www.jianshu.com/p/ee04165f2a02
         * 默认情况下，逆时针的顶点连接顺序被定义为三角形的正面。
         * 使用gl.frontFace(gl.CW);调整顺时针为正面
         */
        @serialize(CullFace.BACK)
        @oav({ component: "OAVEnum", componentParam: { enumClass: CullFace } })
        cullFace = CullFace.BACK;

        @serialize(FrontFace.CW)
        @oav({ component: "OAVEnum", componentParam: { enumClass: FrontFace } })
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
        }
        protected _pointSize = 1;

        /**
         * 混合方程，默认BlendEquation.FUNC_ADD
         */
        @serialize(BlendEquation.FUNC_ADD)
        @oav({ component: "OAVEnum", componentParam: { enumClass: BlendEquation } })
        blendEquation = BlendEquation.FUNC_ADD;

        /**
         * 源混合因子，默认BlendFactor.SRC_ALPHA
         */
        @serialize(BlendFactor.SRC_ALPHA)
        @oav({ component: "OAVEnum", componentParam: { enumClass: BlendFactor } })
        sfactor = BlendFactor.SRC_ALPHA;

        /**
         * 目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA
         */
        @serialize(BlendFactor.ONE_MINUS_SRC_ALPHA)
        @oav({ component: "OAVEnum", componentParam: { enumClass: BlendFactor } })
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

        /**
         * 渲染参数
         */
        renderParams = new RenderParams();

        /**
         * 渲染程序
         */
        shader: Shader;

        constructor()
        {
            super();
            this.renderMode = RenderMode.TRIANGLES;

            this.renderParams.cullFace = this.cullFace;
            this.renderParams.frontFace = this.frontFace;
            this.renderParams.enableBlend = () => this.enableBlend;
            this.renderParams.blendEquation = this.blendEquation;
            this.renderParams.sfactor = this.sfactor;
            this.renderParams.dfactor = this.dfactor;
            this.renderParams.depthtest = this.depthtest;
            this.renderParams.depthMask = this.depthMask;
            this.renderParams.viewRect = this.viewRect;
            this.renderParams.useViewRect = this.useViewRect;

            this.createUniformData("u_PointSize", () => this.pointSize);
        }
    }
}
