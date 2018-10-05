namespace feng3d
{

    /**
     * 渲染参数
     */
    export class RenderParams
    {
        /**
        * 渲染模式，默认RenderMode.TRIANGLES
        */
        @serialize
        @oav({ component: "OAVEnum", tooltip: "渲染模式，默认RenderMode.TRIANGLES", componentParam: { enumClass: RenderMode } })
        renderMode = RenderMode.TRIANGLES;

        /**
         * 剔除面
         * 参考：http://www.jianshu.com/p/ee04165f2a02
         * 默认情况下，逆时针的顶点连接顺序被定义为三角形的正面。
         * 使用gl.frontFace(gl.CW);调整顺时针为正面
         */
        @serialize
        @oav({ component: "OAVEnum", tooltip: "剔除面", componentParam: { enumClass: CullFace } })
        cullFace = CullFace.BACK;

        @serialize
        @oav({ component: "OAVEnum",tooltip:"正面方向，默认FrontFace.CW 顺时针为正面", componentParam: { enumClass: FrontFace } })
        frontFace = FrontFace.CW;

        /**
         * 是否开启混合
         * <混合后的颜色> = <源颜色>*sfactor + <目标颜色>*dfactor
         */
        @serialize
        @oav({ tooltip: "是否开启混合" })
        enableBlend = false;

        /**
         * 混合方式，默认BlendEquation.FUNC_ADD
         */
        @serialize
        @oav({ component: "OAVEnum", tooltip: "混合方式，默认BlendEquation.FUNC_ADD", componentParam: { enumClass: BlendEquation } })
        blendEquation = BlendEquation.FUNC_ADD;

        /**
         * 源混合因子，默认BlendFactor.SRC_ALPHA
         */
        @serialize
        @oav({ component: "OAVEnum", tooltip: "源混合因子，默认BlendFactor.SRC_ALPHA", componentParam: { enumClass: BlendFactor } })
        sfactor = BlendFactor.SRC_ALPHA;

        /**
         * 目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA
         */
        @serialize
        @oav({ component: "OAVEnum", tooltip: "目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA", componentParam: { enumClass: BlendFactor } })
        dfactor = BlendFactor.ONE_MINUS_SRC_ALPHA;

        /**
         * 是否开启深度检查
         */
        @serialize
        @oav({ tooltip: "是否开启深度检查" })
        depthtest = true;
        
        @serialize
        @oav({ component: "OAVEnum", tooltip: "深度检测方法", componentParam: { enumClass: DepthFunc } })
        depthFunc = DepthFunc.LESS;

        /**
         * 是否开启深度标记
         */
        @serialize
        @oav({ tooltip: "是否开启深度标记" })
        depthMask = true;

        /**
         * 绘制在画布上的区域
         */
        @oav({ tooltip: "绘制在画布上的区域" })
        viewRect = new Rectangle(0, 0, 100, 100);

        /**
         * 是否使用 viewRect
         */
        @oav({ tooltip: "是否使用 viewRect" })
        useViewRect = false;

        constructor(raw?: gPartial<RenderParams>)
        {
            if (raw)
                serialization.setValue(this, raw);
        }
    }
}