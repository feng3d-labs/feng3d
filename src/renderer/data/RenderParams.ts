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
        @oav({ component: "OAVEnum", tooltip: "正面方向，默认FrontFace.CW 顺时针为正面", componentParam: { enumClass: FrontFace } })
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
         * 控制那些颜色分量是否可以被写入到帧缓冲器。
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/colorMask
         */
        @serialize
        @oav({ component: "OAVEnum", tooltip: "深度检测方法", componentParam: { enumClass: ColorMask } })
        colorMask = ColorMask.RGBA;

        /**
         * 是否使用 viewRect
         */
        @oav({ tooltip: "是否使用 viewRect" })
        @serialize
        useViewPort = false;

        /**
         * 绘制在画布上的区域
         */
        @oav({ tooltip: "绘制在画布上的区域" })
        @serialize
        viewPort: { x: number, y: number, width: number, height: number } = { x: 0, y: 0, width: 100, height: 100 };

        /**
         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor
         */
        @oav({ tooltip: "https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor" })
        @serialize
        useScissor = false;

        /**
         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor
         */
        @oav({ tooltip: "https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor" })
        @serialize
        scissor: { x: number, y: number, width: number, height: number } = { x: 0, y: 0, width: 100, height: 100 };

        /**
         * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/polygonOffset
         * 
         * The WebGLRenderingContext.polygonOffset() method of the WebGL API specifies the scale factors and units to calculate depth values.
         * 
         * The offset is added before the depth test is performed and before the value is written into the depth buffer.
         */
        @oav({ tooltip: "The WebGLRenderingContext.polygonOffset() method of the WebGL API specifies the scale factors and units to calculate depth values." })
        @serialize
        usePolygonOffset = false;

        /**
         * A GLfloat which sets the scale factor for the variable depth offset for each polygon. The default value is 0.
         */
        @oav({ tooltip: "A GLfloat which sets the scale factor for the variable depth offset for each polygon. The default value is 0." })
        @serialize
        polygonOffsetFactor = 0;

        /**
         * A GLfloat which sets the multiplier by which an implementation-specific value is multiplied with to create a constant depth offset. The default value is 0.
         */
        @oav({ tooltip: "A GLfloat which sets the multiplier by which an implementation-specific value is multiplied with to create a constant depth offset. The default value is 0." })
        @serialize
        polygonOffsetUnits = 0;

        /**
         * Activates stencil testing and updates to the stencil buffer. See WebGLRenderingContext.stencilFunc().
         */
        @oav({ tooltip: "Activates stencil testing and updates to the stencil buffer. See WebGLRenderingContext.stencilFunc()." })
        @serialize
        useStencil = false;

        /**
         * A GLenum specifying the test function. The default function is gl.ALWAYS. 
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
         */
        @oav({ tooltip: "A GLenum specifying the test function. The default function is gl.ALWAYS. ", component: "OAVEnum", componentParam: { enumClass: StencilFunc } })
        @serialize
        stencilFunc = StencilFunc.ALWAYS;

        /**
         * A GLint specifying the reference value for the stencil test. This value is clamped to the range 0 to 2^n -1 where n is the number of bitplanes in the stencil buffer. The default value is 0.
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
         */
        @oav({ tooltip: "A GLint specifying the reference value for the stencil test. This value is clamped to the range 0 to 2^n -1 where n is the number of bitplanes in the stencil buffer. The default value is 0. " })
        @serialize
        stencilFuncRef = 0;

        /**
         * A GLuint specifying a bit-wise mask that is used to AND the reference value and the stored stencil value when the test is done. The default value is all 1.
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
         */
        @oav({ tooltip: "A GLuint specifying a bit-wise mask that is used to AND the reference value and the stored stencil value when the test is done. The default value is all 1." })
        @serialize
        stencilFuncMask = 1;

        /**
         * A GLenum specifying the function to use when the stencil test fails. The default value is gl.KEEP.
         */
        @oav({ tooltip: "A GLenum specifying the function to use when the stencil test fails. The default value is gl.KEEP.", component: "OAVEnum", componentParam: { enumClass: StencilOp } })
        @serialize
        stencilOpFail = StencilOp.KEEP;

        /**
         * A GLenum specifying the function to use when the stencil test passes, but the depth test fails. The default value is gl.KEEP.
         */
        @oav({ tooltip: "A GLenum specifying the function to use when the stencil test passes, but the depth test fails. The default value is gl.KEEP.", component: "OAVEnum", componentParam: { enumClass: StencilOp } })
        @serialize
        stencilOpZFail = StencilOp.KEEP;

        /**
         * A GLenum specifying the function to use when both the stencil test and the depth test pass, or when the stencil test passes and there is no depth buffer or depth testing is disabled. The default value is gl.KEEP.
         */
        @oav({ tooltip: "A GLenum specifying the function to use when both the stencil test and the depth test pass, or when the stencil test passes and there is no depth buffer or depth testing is disabled. The default value is gl.KEEP.", component: "OAVEnum", componentParam: { enumClass: StencilOp } })
        @serialize
        stencilOpZPass = StencilOp.KEEP;

        /**
         * A GLuint specifying a bit mask to enable or disable writing of individual bits in the stencil planes. By default, the mask is all 1.
         */
        @oav({ tooltip: "A GLuint specifying a bit mask to enable or disable writing of individual bits in the stencil planes. By default, the mask is all 1." })
        @serialize
        stencilMask = 1;

        constructor(raw?: Partial<RenderParams>)
        {
            Object.assign(this, raw);
        }
    }
}