namespace feng3d
{
    /**
     * 渲染参数
     */
    export class RenderParams
    {
        /**
         * 渲染模式，默认 TRIANGLES，每三个顶点绘制一个三角形。
         * 
         * A GLenum specifying the type primitive to render. Possible values are:
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
         */
        @serialize
        @oav({ component: "OAVEnum", tooltip: "渲染模式，默认RenderMode.TRIANGLES", componentParam: { enumClass: RenderMode } })
        renderMode: "POINTS" | "LINE_LOOP" | "LINE_STRIP" | "LINES" | "TRIANGLES" | "TRIANGLE_STRIP" | "TRIANGLE_FAN" = RenderMode.TRIANGLES;

        /**
         * 剔除面，默认 BACK，剔除背面。
         * 
         * 默认情况下，逆时针的顶点连接顺序被定义为三角形的正面。
         * 使用gl.frontFace(gl.CW);调整顺时针为正面
         * 
         * @see http://www.jianshu.com/p/ee04165f2a02
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/cullFace
         */
        @serialize
        @oav({ component: "OAVEnum", tooltip: "剔除面", componentParam: { enumClass: CullFace } })
        cullFace: "NONE" | "FRONT" | "BACK" | "FRONT_AND_BACK" = CullFace.BACK;

        /**
         * 正向方向，默认 CW。三角形顺时针方向为正面。
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/frontFace
         */
        @serialize
        @oav({ component: "OAVEnum", tooltip: "正面方向，默认FrontFace.CW 顺时针为正面", componentParam: { enumClass: FrontFace } })
        frontFace: "CW" | "CCW" = FrontFace.CW;

        /**
         * 是否开启混合，默认 false，不开启混合。
         * 
         * <混合后的颜色> = <源颜色>*sfactor + <目标颜色>*dfactor
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
         */
        @serialize
        @oav({ tooltip: "是否开启混合" })
        enableBlend = false;

        /**
         * 混合方式，默认 FUNC_ADD，源 + 目标。
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
         */
        @serialize
        @oav({ component: "OAVEnum", tooltip: "混合方式，默认BlendEquation.FUNC_ADD", componentParam: { enumClass: BlendEquation } })
        blendEquation: "FUNC_ADD" | "FUNC_SUBTRACT" | "FUNC_REVERSE_SUBTRACT" = BlendEquation.FUNC_ADD;

        /**
         * 源混合因子，默认 SRC_ALPHA，将所有颜色乘以源alpha值。
         * 
         * @see BlendFactor
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc
         */
        @serialize
        @oav({ component: "OAVEnum", tooltip: "源混合因子，默认BlendFactor.SRC_ALPHA", componentParam: { enumClass: BlendFactor } })
        sfactor: "ZERO" | "ONE" | "SRC_COLOR" | "ONE_MINUS_SRC_COLOR" | "DST_COLOR" | "ONE_MINUS_DST_COLOR" | "SRC_ALPHA" | "ONE_MINUS_SRC_ALPHA" | "DST_ALPHA" | "ONE_MINUS_DST_ALPHA" | "SRC_ALPHA_SATURATE" = BlendFactor.SRC_ALPHA;

        /**
         * 目标混合因子，默认 ONE_MINUS_SRC_ALPHA，将所有颜色乘以1减去源alpha值。
         * 
         * @see BlendFactor
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc
         */
        @serialize
        @oav({ component: "OAVEnum", tooltip: "目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA", componentParam: { enumClass: BlendFactor } })
        dfactor: "ZERO" | "ONE" | "SRC_COLOR" | "ONE_MINUS_SRC_COLOR" | "DST_COLOR" | "ONE_MINUS_DST_COLOR" | "SRC_ALPHA" | "ONE_MINUS_SRC_ALPHA" | "DST_ALPHA" | "ONE_MINUS_DST_ALPHA" | "SRC_ALPHA_SATURATE" = BlendFactor.ONE_MINUS_SRC_ALPHA;

        /**
         * 是否开启深度检查，默认 true，开启深度检测。
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc
         */
        @serialize
        @oav({ tooltip: "是否开启深度检查" })
        depthtest = true;

        /**
         * 指定深度比较函数的枚举，该函数设置绘制像素的条件，默认 LESS，如果传入值小于深度缓冲区值则通过。
         * 
         * A GLenum specifying the depth comparison function, which sets the conditions under which the pixel will be drawn. The default value is gl.LESS. 
         * 
         * @see DepthFunc
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc
         */
        @serialize
        @oav({ component: "OAVEnum", tooltip: "深度检测方法", componentParam: { enumClass: DepthFunc } })
        depthFunc: "NEVER" | "LESS" | "EQUAL" | "LEQUAL" | "GREATER" | "NOTEQUAL" | "GEQUAL" | "ALWAYS" = DepthFunc.LESS;

        /**
         * 是否开启深度标记
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthMask
         */
        @serialize
        @oav({ tooltip: "是否开启深度标记" })
        depthMask = true;

        /**
         * 控制那些颜色分量是否可以被写入到帧缓冲器。
         * 
         * [red, green, blue, alpha]
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/colorMask
         */
        @serialize
        @oav({ component: "OAVEnum", tooltip: "深度检测方法", componentParam: { enumClass: ColorMask } })
        colorMask = ColorMask.RGBA;

        /**
         * 是否使用 viewport，默认不使用，不使用时viewport为画布区域。
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/viewport
         */
        @oav({ tooltip: "是否使用 viewRect" })
        @serialize
        useViewPort = false;

        /**
         * 通过WebGL API的WebGLRenderingContext.viewport()方法设置了viewport，指定了x和y从标准化设备坐标到窗口坐标的仿射变换。
         * 
         * The WebGLRenderingContext.viewport() method of the WebGL API sets the viewport, which specifies the affine transformation of x and y from normalized device coordinates to window coordinates.
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/viewport
         */
        @oav({ tooltip: "绘制在画布上的区域" })
        @serialize
        viewPort: { x: number, y: number, width: number, height: number } = { x: 0, y: 0, width: 100, height: 100 };

        /**
         * 是否开启剪刀裁剪，默认不开启。
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor
         */
        @oav({ tooltip: "https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor" })
        @serialize
        useScissor = false;

        /**
         * WebGL API的WebGLRenderingContext.scissor()方法设置了一个剪刀盒，它将绘图限制为一个指定的矩形。
         * 
         * The WebGLRenderingContext.scissor() method of the WebGL API sets a scissor box, which limits the drawing to a specified rectangle.
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor
         */
        @oav({ tooltip: "https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor" })
        @serialize
        scissor: { x: number, y: number, width: number, height: number } = { x: 0, y: 0, width: 100, height: 100 };

        /**
         * 是否开启 gl.POLYGON_OFFSET_FILL，默认不开启。
         * 
         * WebGL API的WebGLRenderingContext.polygonOffset()方法指定了计算深度值的比例因子和单位。
         * 在执行深度测试和将值写入深度缓冲区之前添加偏移量。
         * 
         * The WebGLRenderingContext.polygonOffset() method of the WebGL API specifies the scale factors and units to calculate depth values.
         * The offset is added before the depth test is performed and before the value is written into the depth buffer.
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/polygonOffset
         */
        @oav({ tooltip: "The WebGLRenderingContext.polygonOffset() method of the WebGL API specifies the scale factors and units to calculate depth values." })
        @serialize
        usePolygonOffset = false;

        /**
         * 为每个多边形设置可变深度偏移的比例因子。缺省值为0。
         * 
         * A GLfloat which sets the scale factor for the variable depth offset for each polygon. The default value is 0.
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/polygonOffset
         */
        @oav({ tooltip: "A GLfloat which sets the scale factor for the variable depth offset for each polygon. The default value is 0." })
        @serialize
        polygonOffsetFactor = 0;

        /**
         * 它设置特定于实现的值乘以的乘数，以创建恒定的深度偏移量。缺省值为0。
         * 
         * A GLfloat which sets the multiplier by which an implementation-specific value is multiplied with to create a constant depth offset. The default value is 0.
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/polygonOffset
         */
        @oav({ tooltip: "A GLfloat which sets the multiplier by which an implementation-specific value is multiplied with to create a constant depth offset. The default value is 0." })
        @serialize
        polygonOffsetUnits = 0;

        /**
         * 是否开启模板测试与更新模板缓冲。
         * 
         * Activates stencil testing and updates to the stencil buffer. 
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
         */
        @oav({ tooltip: "Activates stencil testing and updates to the stencil buffer. See WebGLRenderingContext.stencilFunc()." })
        @serialize
        useStencil = false;

        /**
         * 描述模板测试的方法。默认ALWAYS，总是通过。
         * 
         * A GLenum specifying the test function. The default function is gl.ALWAYS. 
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
         */
        @oav({ tooltip: "A GLenum specifying the test function. The default function is gl.ALWAYS. ", component: "OAVEnum", componentParam: { enumClass: StencilFunc } })
        @serialize
        stencilFunc: "NEVER" | "LESS" | "EQUAL" | "LEQUAL" | "GREATER" | "NOTEQUAL" | "GEQUAL" | "ALWAYS" = StencilFunc.ALWAYS;

        /**
         * 一个为模板测试指定参考值。这个值被限制在0到2^n -1的范围内，其中n是模板缓冲区中的位数。默认0。
         * 
         * A GLint specifying the reference value for the stencil test. This value is clamped to the range 0 to 2^n -1 where n is the number of bitplanes in the stencil buffer. The default value is 0.
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
         */
        @oav({ tooltip: "A GLint specifying the reference value for the stencil test. This value is clamped to the range 0 to 2^n -1 where n is the number of bitplanes in the stencil buffer. The default value is 0. " })
        @serialize
        stencilFuncRef = 0;

        /**
         * 模板测试时使用的mask值，默认1。
         * 
         * A GLuint specifying a bit-wise mask that is used to AND the reference value and the stored stencil value when the test is done. The default value is all 1.
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
         */
        @oav({ tooltip: "A GLuint specifying a bit-wise mask that is used to AND the reference value and the stored stencil value when the test is done. The default value is all 1." })
        @serialize
        stencilFuncMask = 1;

        /**
         * 指定模板测试失败时使用的函数的枚举。默认KEEP，保持当前值。
         * 
         * A GLenum specifying the function to use when the stencil test fails. The default value is gl.KEEP.
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMask
         */
        @oav({ tooltip: "A GLenum specifying the function to use when the stencil test fails. The default value is gl.KEEP.", component: "OAVEnum", componentParam: { enumClass: StencilOp } })
        @serialize
        stencilOpFail: "KEEP" | "ZERO" | "REPLACE" | "INCR" | "INCR_WRAP" | "DECR" | "DECR_WRAP" | "INVERT" = StencilOp.KEEP;

        /**
         * 指定在模板测试通过但深度测试失败时使用的函数枚举。默认KEEP，保持当前值。
         * 
         * A GLenum specifying the function to use when the stencil test passes, but the depth test fails. The default value is gl.KEEP.
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMask
         */
        @oav({ tooltip: "A GLenum specifying the function to use when the stencil test passes, but the depth test fails. The default value is gl.KEEP.", component: "OAVEnum", componentParam: { enumClass: StencilOp } })
        @serialize
        stencilOpZFail: "KEEP" | "ZERO" | "REPLACE" | "INCR" | "INCR_WRAP" | "DECR" | "DECR_WRAP" | "INVERT" = StencilOp.KEEP;

        /**
         * 指定在模板测试和深度测试通过时使用的函数枚举，或在模板测试通过且没有深度缓冲或禁用深度测试时使用的函数枚举。默认KEEP，保持当前值。
         * 
         * A GLenum specifying the function to use when both the stencil test and the depth test pass, or when the stencil test passes and there is no depth buffer or depth testing is disabled. The default value is gl.KEEP.
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMask
         */
        @oav({ tooltip: "A GLenum specifying the function to use when both the stencil test and the depth test pass, or when the stencil test passes and there is no depth buffer or depth testing is disabled. The default value is gl.KEEP.", component: "OAVEnum", componentParam: { enumClass: StencilOp } })
        @serialize
        stencilOpZPass: "KEEP" | "ZERO" | "REPLACE" | "INCR" | "INCR_WRAP" | "DECR" | "DECR_WRAP" | "INVERT" = StencilOp.KEEP;

        /**
         * 指定位掩码以启用或禁用在模板平面中写入单个位的正整数。默认1。
         * 
         * A GLuint specifying a bit mask to enable or disable writing of individual bits in the stencil planes. By default, the mask is all 1.
         * 
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMask
         */
        @oav({ tooltip: "A GLuint specifying a bit mask to enable or disable writing of individual bits in the stencil planes. By default, the mask is all 1." })
        @serialize
        stencilMask = 1;

        constructor(raw?: Partial<RenderParams>)
        {
            Object.assign(this, raw);
        }

        /**
         * 更新渲染参数
         * 
         * @param gl WebGL渲染上下文
         */
        updateRenderParams(gl: GL)
        {
            var cullfaceEnum = this.cullFace;
            var blendEquation = gl[this.blendEquation];
            var sfactor = gl[this.sfactor];
            var dfactor = gl[this.dfactor];
            var cullFace = gl[this.cullFace];
            var frontFace = gl[this.frontFace];
            var enableBlend = this.enableBlend;
            var depthtest = this.depthtest;
            var depthMask = this.depthMask;
            var depthFunc = gl[this.depthFunc];
            var viewPort = this.viewPort;
            var useViewPort = this.useViewPort;
            var useScissor = this.useScissor;
            var scissor = this.scissor;
            var colorMask = this.colorMask;
            var colorMaskB = [ColorMask.R, ColorMask.G, ColorMask.B, ColorMask.A].map(v => !!(colorMask & v));

            var usePolygonOffset = this.usePolygonOffset;
            var polygonOffsetFactor = this.polygonOffsetFactor;
            var polygonOffsetUnits = this.polygonOffsetUnits;

            const useStencil = this.useStencil;
            const stencilFunc = gl[this.stencilFunc];
            const stencilFuncRef = this.stencilFuncRef;
            const stencilFuncMask = this.stencilFuncMask;
            const stencilOpFail = gl[this.stencilOpFail];
            const stencilOpZFail = gl[this.stencilOpZFail];
            const stencilOpZPass = gl[this.stencilOpZPass];
            const stencilMask = this.stencilMask;

            if (!useViewPort)
            {
                viewPort = { x: 0, y: 0, width: gl.canvas.width, height: gl.canvas.height };
            }

            if (cullfaceEnum != CullFace.NONE)
            {
                gl.enable(gl.CULL_FACE);
                gl.cullFace(cullFace);
                gl.frontFace(frontFace);
            } else
            {
                gl.disable(gl.CULL_FACE);
            }

            if (enableBlend)
            {
                //
                gl.enable(gl.BLEND);
                gl.blendEquation(blendEquation);
                gl.blendFunc(sfactor, dfactor);
            } else
            {
                gl.disable(gl.BLEND);
            }

            if (depthtest)
            {
                gl.enable(gl.DEPTH_TEST);
                gl.depthFunc(depthFunc);
            }
            else
            {
                gl.disable(gl.DEPTH_TEST);
            }
            gl.depthMask(depthMask);

            gl.colorMask(colorMaskB[0], colorMaskB[1], colorMaskB[2], colorMaskB[3]);

            gl.viewport(viewPort.x, viewPort.y, viewPort.width, viewPort.height);

            if (usePolygonOffset)
            {
                gl.enable(gl.POLYGON_OFFSET_FILL);
                gl.polygonOffset(polygonOffsetFactor, polygonOffsetUnits);
            }
            else
            {
                gl.disable(gl.POLYGON_OFFSET_FILL);
            }

            if (useScissor)
            {
                gl.enable(gl.SCISSOR_TEST);
                gl.scissor(scissor.x, scissor.y, scissor.width, scissor.height);
            } else
            {
                gl.disable(gl.SCISSOR_TEST);
            }

            if (useStencil)
            {
                if (gl.capabilities.stencilBits === 0)
                {
                    console.warn(`${gl} 不支持 stencil，参考 https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext WebGL context attributes: stencil`);
                }
                gl.enable(gl.STENCIL_TEST);
                gl.stencilFunc(stencilFunc, stencilFuncRef, stencilFuncMask);
                gl.stencilOp(stencilOpFail, stencilOpZFail, stencilOpZPass);
                gl.stencilMask(stencilMask);
            } else
            {
                gl.disable(gl.STENCIL_TEST);
            }
        }
    }
}