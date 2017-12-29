namespace feng3d
{

    /**
     * 渲染参数
     * @author feng 2016-12-14
     */
    export class RenderParams
    {
        /**
         * 渲染模式
         */
        renderMode: Lazy<RenderMode> = RenderMode.TRIANGLES;

        cullFace: Lazy<CullFace> = CullFace.BACK;

        frontFace: Lazy<FrontFace> = FrontFace.CCW;

        enableBlend: Lazy<boolean> = false;

        blendEquation: Lazy<BlendEquation> = BlendEquation.FUNC_ADD;

        sfactor: Lazy<BlendFactor> = BlendFactor.SRC_ALPHA;

        dfactor: Lazy<BlendFactor> = BlendFactor.ONE_MINUS_SRC_ALPHA;

        depthtest: Lazy<boolean> = true;

        depthMask: Lazy<boolean> = true;

        depthFunc: Lazy<DepthFunc> = DepthFunc.LESS;

        viewRect: Lazy<Rectangle> = new Rectangle(0, 0, 100, 100);

        useViewRect: Lazy<boolean> = false;
    }
}