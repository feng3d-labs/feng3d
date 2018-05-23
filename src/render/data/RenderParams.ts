namespace feng3d
{

    /**
     * 渲染参数
     * @author feng 2016-12-14
     */
    export class RenderParams
    {
        /**
        * 渲染模式，默认RenderMode.TRIANGLES
        */
        @serialize
        @oav({ component: "OAVEnum", componentParam: { enumClass: RenderMode } })
        renderMode = RenderMode.TRIANGLES;

        /**
         * 剔除面
         * 参考：http://www.jianshu.com/p/ee04165f2a02
         * 默认情况下，逆时针的顶点连接顺序被定义为三角形的正面。
         * 使用gl.frontFace(gl.CW);调整顺时针为正面
         */
        @serialize
        @oav({ component: "OAVEnum", componentParam: { enumClass: CullFace } })
        cullFace = CullFace.BACK;

        @serialize
        @oav({ component: "OAVEnum", componentParam: { enumClass: FrontFace } })
        frontFace = FrontFace.CW;

        /**
         * 是否开启混合
         * <混合后的颜色> = <源颜色>*sfactor + <目标颜色>*dfactor
         */
        @serialize
        @oav()
        enableBlend = false;

        /**
         * 混合方程，默认BlendEquation.FUNC_ADD
         */
        @serialize
        @oav({ component: "OAVEnum", componentParam: { enumClass: BlendEquation } })
        blendEquation = BlendEquation.FUNC_ADD;

        /**
         * 源混合因子，默认BlendFactor.SRC_ALPHA
         */
        @serialize
        @oav({ component: "OAVEnum", componentParam: { enumClass: BlendFactor } })
        sfactor = BlendFactor.SRC_ALPHA;

        /**
         * 目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA
         */
        @serialize
        @oav({ component: "OAVEnum", componentParam: { enumClass: BlendFactor } })
        dfactor = BlendFactor.ONE_MINUS_SRC_ALPHA;

        /**
         * 是否开启深度检查
         */
        @serialize
        @oav()
        depthtest = true;

        /**
         * 是否开启深度标记
         */
        @serialize
        @oav()
        depthMask = true;

        depthFunc = DepthFunc.LESS;

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

        constructor(raw?: gPartial<RenderParams>)
        {
            if (raw)
                serialization.setValue(this, raw);
        }
    }
}