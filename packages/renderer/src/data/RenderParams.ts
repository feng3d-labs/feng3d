import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';

/**
 * 渲染参数
 */
export class RenderParams
{
    /**
     * 渲染模式，默认 TRIANGLES，每三个顶点绘制一个三角形。
     *
     * * POINTS 绘制单个点。
     * * LINE_LOOP 绘制循环连线。
     * * LINE_STRIP 绘制连线
     * * LINES 每两个顶点绘制一条线段。
     * * TRIANGLES 每三个顶点绘制一个三角形。
     * * TRIANGLE_STRIP 绘制三角形条带。
     * * TRIANGLE_FAN  绘制三角扇形。
     *
     * A GLenum specifying the type primitive to render. Possible values are:
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
     */
    @serialize
    @oav({ component: 'OAVEnum', tooltip: '渲染模式，默认RenderMode.TRIANGLES', componentParam: { enumClass: ['POINTS', 'LINE_LOOP', 'LINE_STRIP', 'LINES', 'TRIANGLES', 'TRIANGLE_STRIP', 'TRIANGLE_FAN'] } })
    renderMode: RenderMode = 'TRIANGLES';

    /**
     * 剔除面，默认 BACK，剔除背面。
     *
     * 默认情况下，逆时针的顶点连接顺序被定义为三角形的正面。
     * 使用gl.frontFace(gl.CW);调整顺时针为正面
     *
     * * NONE 关闭裁剪面
     * * FRONT 正面
     * * BACK 背面
     * * FRONT_AND_BACK 正面与背面
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/cullFace
     */
    @serialize
    @oav({ component: 'OAVEnum', tooltip: '剔除面', componentParam: { enumClass: ['NONE', 'FRONT', 'BACK', 'FRONT_AND_BACK'] } })
    cullFace: CullFace = 'BACK';

    /**
     * 正向方向，默认 CW。三角形顺时针方向为正面。
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/frontFace
     */
    @serialize
    @oav({ component: 'OAVEnum', tooltip: '正面方向，默认FrontFace.CW 顺时针为正面', componentParam: { enumClass: ['CW', 'CCW'] } })
    frontFace: FrontFace = 'CW';

    /**
     * 是否开启混合，默认 false，不开启混合。
     *
     * <混合后的颜色> = <源颜色>*sfactor + <目标颜色>*dfactor
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
     */
    @serialize
    @oav({ tooltip: '是否开启混合' })
    enableBlend = false;

    /**
     * 混合方式，默认 FUNC_ADD，源 + 目标。
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
     */
    @serialize
    @oav({ component: 'OAVEnum', tooltip: '混合方式，默认BlendEquation.FUNC_ADD', componentParam: { enumClass: ['FUNC_ADD', 'FUNC_SUBTRACT', 'FUNC_REVERSE_SUBTRACT', 'MIN', 'MAX'] } })
    blendEquation: BlendEquation = 'FUNC_ADD';

    /**
     * 源混合因子，默认 SRC_ALPHA，将所有颜色乘以源alpha值。
     *
     * @see BlendFactor
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc
     */
    @serialize
    @oav({ component: 'OAVEnum', tooltip: '源混合因子，默认BlendFactor.SRC_ALPHA', componentParam: { enumClass: ['ZERO', 'ONE', 'SRC_COLOR', 'ONE_MINUS_SRC_COLOR', 'DST_COLOR', 'ONE_MINUS_DST_COLOR', 'SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA', 'DST_ALPHA', 'ONE_MINUS_DST_ALPHA', 'SRC_ALPHA_SATURATE'] } })
    sfactor: BlendFactor = 'SRC_ALPHA';

    /**
     * 目标混合因子，默认 ONE_MINUS_SRC_ALPHA，将所有颜色乘以1减去源alpha值。
     *
     * @see BlendFactor
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc
     */
    @serialize
    @oav({ component: 'OAVEnum', tooltip: '目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA', componentParam: { enumClass: ['ZERO', 'ONE', 'SRC_COLOR', 'ONE_MINUS_SRC_COLOR', 'DST_COLOR', 'ONE_MINUS_DST_COLOR', 'SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA', 'DST_ALPHA', 'ONE_MINUS_DST_ALPHA', 'SRC_ALPHA_SATURATE'] } })
    dfactor: BlendFactor = 'ONE_MINUS_SRC_ALPHA';

    /**
     * 是否开启深度检查，默认 true，开启深度检测。
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc
     */
    @serialize
    @oav({ tooltip: '是否开启深度检查' })
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
    @oav({ component: 'OAVEnum', tooltip: '深度检测方法', componentParam: { enumClass: ['NEVER', 'LESS', 'EQUAL', 'LEQUAL', 'GREATER', 'NOTEQUAL', 'GEQUAL', 'ALWAYS'] } })
    depthFunc: DepthFunc = 'LESS';

    /**
     * 是否开启深度标记
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthMask
     */
    @serialize
    @oav({ tooltip: '是否开启深度标记' })
    depthMask = true;

    /**
     * 控制那些颜色分量是否可以被写入到帧缓冲器。
     *
     * [red, green, blue, alpha]
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/colorMask
     */
    @serialize
    @oav({ tooltip: '深度检测方法' })
    colorMask: [boolean, boolean, boolean, boolean] = [true, true, true, true];

    /**
     * 是否使用 viewport，默认不使用，不使用时viewport为画布区域。
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/viewport
     */
    @oav({ tooltip: '是否使用 viewRect' })
    @serialize
    useViewPort = false;

    /**
     * 通过WebGL API的WebGLRenderingContext.viewport()方法设置了viewport，指定了x和y从标准化设备坐标到窗口坐标的仿射变换。
     *
     * The WebGLRenderingContext.viewport() method of the WebGL API sets the viewport, which specifies the affine transformation of x and y from normalized device coordinates to window coordinates.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/viewport
     */
    @oav({ tooltip: '绘制在画布上的区域' })
    @serialize
    viewPort: { x: number, y: number, width: number, height: number } = { x: 0, y: 0, width: 100, height: 100 };

    /**
     * 是否开启剪刀裁剪，默认不开启。
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor
     */
    @oav({ tooltip: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor' })
    @serialize
    useScissor = false;

    /**
     * WebGL API的WebGLRenderingContext.scissor()方法设置了一个剪刀盒，它将绘图限制为一个指定的矩形。
     *
     * The WebGLRenderingContext.scissor() method of the WebGL API sets a scissor box, which limits the drawing to a specified rectangle.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor
     */
    @oav({ tooltip: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/scissor' })
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
    @oav({ tooltip: 'The WebGLRenderingContext.polygonOffset() method of the WebGL API specifies the scale factors and units to calculate depth values.' })
    @serialize
    usePolygonOffset = false;

    /**
     * 为每个多边形设置可变深度偏移的比例因子。缺省值为0。
     *
     * A GLfloat which sets the scale factor for the variable depth offset for each polygon. The default value is 0.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/polygonOffset
     */
    @oav({ tooltip: 'A GLfloat which sets the scale factor for the variable depth offset for each polygon. The default value is 0.' })
    @serialize
    polygonOffsetFactor = 0;

    /**
     * 它设置特定于实现的值乘以的乘数，以创建恒定的深度偏移量。缺省值为0。
     *
     * A GLfloat which sets the multiplier by which an implementation-specific value is multiplied with to create a constant depth offset. The default value is 0.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/polygonOffset
     */
    @oav({ tooltip: 'A GLfloat which sets the multiplier by which an implementation-specific value is multiplied with to create a constant depth offset. The default value is 0.' })
    @serialize
    polygonOffsetUnits = 0;

    /**
     * 是否开启模板测试与更新模板缓冲。
     *
     * Activates stencil testing and updates to the stencil buffer.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
     */
    @oav({ tooltip: 'Activates stencil testing and updates to the stencil buffer. See WebGLRenderingContext.stencilFunc().' })
    @serialize
    useStencil = false;

    /**
     * 描述模板测试的方法。默认ALWAYS，总是通过。
     *
     * A GLenum specifying the test function. The default function is gl.ALWAYS.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
     */
    @oav({ tooltip: 'A GLenum specifying the test function. The default function is gl.ALWAYS. ', component: 'OAVEnum', componentParam: { enumClass: ['NEVER', 'LESS', 'EQUAL', 'LEQUAL', 'GREATER', 'NOTEQUAL', 'GEQUAL', 'ALWAYS'] } })
    @serialize
    stencilFunc: StencilFunc = 'ALWAYS';

    /**
     * 一个为模板测试指定参考值。这个值被限制在0到2^n -1的范围内，其中n是模板缓冲区中的位数。默认0。
     *
     * A GLint specifying the reference value for the stencil test. This value is clamped to the range 0 to 2^n -1 where n is the number of bitplanes in the stencil buffer. The default value is 0.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
     */
    @oav({ tooltip: 'A GLint specifying the reference value for the stencil test. This value is clamped to the range 0 to 2^n -1 where n is the number of bitplanes in the stencil buffer. The default value is 0. ' })
    @serialize
    stencilFuncRef = 0;

    /**
     * 模板测试时使用的mask值，默认1。
     *
     * A GLuint specifying a bit-wise mask that is used to AND the reference value and the stored stencil value when the test is done. The default value is all 1.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
     */
    @oav({ tooltip: 'A GLuint specifying a bit-wise mask that is used to AND the reference value and the stored stencil value when the test is done. The default value is all 1.' })
    @serialize
    stencilFuncMask = 1;

    /**
     * 指定模板测试失败时使用的函数的枚举。默认KEEP，保持当前值。
     *
     * A GLenum specifying the function to use when the stencil test fails. The default value is gl.KEEP.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMask
     */
    @oav({ tooltip: 'A GLenum specifying the function to use when the stencil test fails. The default value is gl.KEEP.', component: 'OAVEnum', componentParam: { enumClass: ['KEEP', 'ZERO', 'REPLACE', 'INCR', 'INCR_WRAP', 'DECR', 'DECR_WRAP', 'INVERT'] } })
    @serialize
    stencilOpFail: StencilOp = 'KEEP';

    /**
     * 指定在模板测试通过但深度测试失败时使用的函数枚举。默认KEEP，保持当前值。
     *
     * A GLenum specifying the function to use when the stencil test passes, but the depth test fails. The default value is gl.KEEP.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMask
     */
    @oav({ tooltip: 'A GLenum specifying the function to use when the stencil test passes, but the depth test fails. The default value is gl.KEEP.', component: 'OAVEnum', componentParam: { enumClass: ['KEEP', 'ZERO', 'REPLACE', 'INCR', 'INCR_WRAP', 'DECR', 'DECR_WRAP', 'INVERT'] } })
    @serialize
    stencilOpZFail: StencilOp = 'KEEP';

    /**
     * 指定在模板测试和深度测试通过时使用的函数枚举，或在模板测试通过且没有深度缓冲或禁用深度测试时使用的函数枚举。默认KEEP，保持当前值。
     *
     * A GLenum specifying the function to use when both the stencil test and the depth test pass, or when the stencil test passes and there is no depth buffer or depth testing is disabled. The default value is gl.KEEP.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMask
     */
    @oav({ tooltip: 'A GLenum specifying the function to use when both the stencil test and the depth test pass, or when the stencil test passes and there is no depth buffer or depth testing is disabled. The default value is gl.KEEP.', component: 'OAVEnum', componentParam: { enumClass: ['KEEP', 'ZERO', 'REPLACE', 'INCR', 'INCR_WRAP', 'DECR', 'DECR_WRAP', 'INVERT'] } })
    @serialize
    stencilOpZPass: StencilOp = 'KEEP';

    /**
     * 指定位掩码以启用或禁用在模板平面中写入单个位的正整数。默认1。
     *
     * A GLuint specifying a bit mask to enable or disable writing of individual bits in the stencil planes. By default, the mask is all 1.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilMask
     */
    @oav({ tooltip: 'A GLuint specifying a bit mask to enable or disable writing of individual bits in the stencil planes. By default, the mask is all 1.' })
    @serialize
    stencilMask = 1;

    constructor(raw?: Partial<RenderParams>)
    {
        Object.assign(this, raw);
    }
}

/**
 * 剔除面，默认 BACK，剔除背面。
 *
 * 默认情况下，逆时针的顶点连接顺序被定义为三角形的正面。
 * 使用gl.frontFace(gl.CW);调整顺时针为正面
 *
 * * NONE 关闭裁剪面
 * * FRONT 正面
 * * BACK 背面
 * * FRONT_AND_BACK 正面与背面
 *
 * @see http://www.jianshu.com/p/ee04165f2a02
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/cullFace
 */
export type CullFace = 'NONE' | 'FRONT' | 'BACK' | 'FRONT_AND_BACK';

/**
 * 渲染模式，默认 TRIANGLES，每三个顶点绘制一个三角形。
 *
 * * POINTS 绘制单个点。
 * * LINE_LOOP 绘制循环连线。
 * * LINE_STRIP 绘制连线
 * * LINES 每两个顶点绘制一条线段。
 * * TRIANGLES 每三个顶点绘制一个三角形。
 * * TRIANGLE_STRIP 绘制三角形条带。
 * * TRIANGLE_FAN  绘制三角扇形。
 *
 * A GLenum specifying the type primitive to render. Possible values are:
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
 */
export type RenderMode = 'POINTS' | 'LINE_LOOP' | 'LINE_STRIP' | 'LINES' | 'TRIANGLES' | 'TRIANGLE_STRIP' | 'TRIANGLE_FAN';

/**
 * 正面方向枚举
 *
 * * CW 顺时钟方向
 * * CCW 逆时钟方向
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/frontFace
 */
export type FrontFace = 'CW' | 'CCW';

/**
 * 混合方法
 *
 * * FUNC_ADD 源 + 目标
 * * FUNC_SUBTRACT 源 - 目标
 * * FUNC_REVERSE_SUBTRACT 目标 - 源
 * * MIN 源与目标的最小值，在 WebGL 2 中可使用。在 WebGL 1 时，自动使用 EXT_blend_minmax 扩展中 MIN_EXT 值。
 * * MAX 源与目标的最大值，在 WebGL 2 中可使用。在 WebGL 1 时，自动使用 EXT_blend_minmax 扩展中 MAX_EXT 值。
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
 */
export type BlendEquation = 'FUNC_ADD' | 'FUNC_SUBTRACT' | 'FUNC_REVERSE_SUBTRACT' | 'MIN' | 'MAX';

/**
 * 混合因子（R分量系数，G分量系数，B分量系数）
 *
 * 混合颜色的公式可以这样描述：color(RGBA) = (sourceColor * sfactor) + (destinationColor * dfactor)。这里的 RGBA 值均在0与1之间。
 *
 * The formula for the blending color can be described like this: color(RGBA) = (sourceColor * sfactor) + (destinationColor * dfactor). The RBGA values are between 0 and 1.
 *
 * * `ZERO` Factor: (0,0,0,0); 把所有颜色都乘以0。
 * * `ONE` Factor: (1,1,1,1); 把所有颜色都乘以1。
 * * `SRC_COLOR` Factor: (Rs, Gs, Bs, As); 将所有颜色乘以源颜色。
 * * `ONE_MINUS_SRC_COLOR` Factor: (1-Rs, 1-Gs, 1-Bs, 1-As); 将所有颜色乘以1减去每个源颜色。
 * * `DST_COLOR` Factor: (Rd, Gd, Bd, Ad); 将所有颜色乘以目标颜色。
 * * `ONE_MINUS_DST_COLOR` Factor: (1-Rd, 1-Gd, 1-Bd, 1-Ad); 将所有颜色乘以1减去每个目标颜色。
 * * `SRC_ALPHA` Factor: (As, As, As, As); 将所有颜色乘以源alpha值。
 * * `ONE_MINUS_SRC_ALPHA` Factor: (1-As, 1-As, 1-As, 1-As); 将所有颜色乘以1减去源alpha值。
 * * `DST_ALPHA` Factor: (Ad, Ad, Ad, Ad); 将所有颜色乘以目标alpha值。
 * * `ONE_MINUS_DST_ALPHA` Factor: (1-Ad, 1-Ad, 1-Ad, 1-Ad); 将所有颜色乘以1减去目标alpha值。
 * * `CONSTANT_COLOR` Factor: (Rc, Gc, Bc, Ac); 将所有颜色乘以一个常数颜色。
 * * `ONE_MINUS_CONSTANT_COLOR` Factor: (1-Rc, 1-Gc, 1-Bc, 1-Ac); 所有颜色乘以1减去一个常数颜色。
 * * `CONSTANT_ALPHA` Factor: (Ac, Ac, Ac, Ac); 将所有颜色乘以一个常量alpha值。
 * * `ONE_MINUS_CONSTANT_ALPHA` Factor: (1-Ac, 1-Ac, 1-Ac, 1-Ac); 将所有颜色乘以1减去一个常数alpha值。
 * * `SRC_ALPHA_SATURATE` Factor: (min(As, 1 - Ad), min(As, 1 - Ad), min(As, 1 - Ad), 1); 将RGB颜色乘以源alpha值与1减去目标alpha值的较小值。alpha值乘以1。
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendFunc
 */
export type BlendFactor = 'ZERO' | 'ONE' | 'SRC_COLOR' | 'ONE_MINUS_SRC_COLOR' | 'DST_COLOR' | 'ONE_MINUS_DST_COLOR' | 'SRC_ALPHA' | 'ONE_MINUS_SRC_ALPHA' | 'DST_ALPHA' | 'ONE_MINUS_DST_ALPHA' | 'SRC_ALPHA_SATURATE';

/**
 * 指定深度比较函数的枚举，该函数设置绘制像素的条件，默认 LESS，如果传入值小于深度缓冲区值则通过。
 *
 * A GLenum specifying the depth comparison function, which sets the conditions under which the pixel will be drawn. The default value is gl.LESS.
 *
 * * `NEVER` 总是不通过。
 * * `LESS` 如果传入值小于深度缓冲区值则通过。
 * * `EQUAL` 如果传入值等于深度缓冲区值则通过。
 * * `LEQUAL` 如果传入值小于或等于深度缓冲区值则通过。
 * * `GREATER` 如果传入值大于深度缓冲区值则通过。
 * * `NOTEQUAL` 如果传入值不等于深度缓冲区值则通过。
 * * `GEQUAL` 如果传入值大于或等于深度缓冲区值则通过。
 * * `ALWAYS` 总是通过。
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc
 */
export type DepthFunc = 'NEVER' | 'LESS' | 'EQUAL' | 'LEQUAL' | 'GREATER' | 'NOTEQUAL' | 'GEQUAL' | 'ALWAYS';

/**
 * A GLenum specifying the test function. The default function is gl.ALWAYS.
 *
 * * `NEVER` 总是不通过。
 * * `LESS` 如果 (ref & mask) <  (stencil & mask) 则通过。
 * * `EQUAL` 如果 (ref & mask) = (stencil & mask) 则通过。
 * * `LEQUAL` 如果 (ref & mask) <= (stencil & mask) 则通过。
 * * `GREATER` 如果 (ref & mask) > (stencil & mask) 则通过。
 * * `NOTEQUAL` 如果 (ref & mask) != (stencil & mask) 则通过。
 * * `GEQUAL` 如果 (ref & mask) >= (stencil & mask) 则通过。
 * * `ALWAYS` 总是通过。
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
 */
export type StencilFunc = 'NEVER' | 'LESS' | 'EQUAL' | 'LEQUAL' | 'GREATER' | 'NOTEQUAL' | 'GEQUAL' | 'ALWAYS';

/**
 * The WebGLRenderingContext.stencilOp() method of the WebGL API sets both the front and back-facing stencil test actions.
 *
 * * `KEEP` 保持当前值。
 * * `ZERO` 设置模板缓冲值为0
 * * `REPLACE` 将模板缓冲区的值设置为WebGLRenderingContext.stencilFunc()指定的参考值。
 * * `INCR` 增加当前模板缓冲区的值。最大到可表示的无符号值的最大值。
 * * `INCR_WRAP` 增加当前模板缓冲区的值。当增加最大的可表示无符号值时，将模板缓冲区值包装为零。
 * * `DECR` 递减当前模板缓冲区的值。最小为0。
 * * `DECR_WRAP` 递减当前模板缓冲区的值。当模板缓冲区值减为0时，将模板缓冲区值包装为可表示的最大无符号值。
 * * `INVERT` 按位反转当前模板缓冲区值。
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOp
 */
export type StencilOp = 'KEEP' | 'ZERO' | 'REPLACE' | 'INCR' | 'INCR_WRAP' | 'DECR' | 'DECR_WRAP' | 'INVERT';
