import { oav } from '@feng3d/objectview';
import { serialize } from '@feng3d/serialization';
import { BlendEquation, BlendFactor, ColorMask, CullFace, DepthFunc, FrontFace, RenderMode } from './enums';

/**
 * 渲染参数。
 *
 * 描述一次绘制的光栅化状态（图元、剔除、混合、深度、模板、视口等）。
 * 是可序列化、可 OAV 编辑的数据类。
 *
 * 在 WebGPU 渲染路径下，由 {@link render/webgpu/MaterialPipeline} 的
 * `renderParamsToPrimitiveState` / `renderParamsToDepthStencilState` /
 * `renderParamsToBlendState` 转换为 webgpu 的各 State。
 *
 * 原属 @feng3d/renderer，已删除 `updateRenderParams(gl)` 方法（WebGL 专用）。
 */
export class RenderParams
{
    /**
     * 渲染模式，默认 TRIANGLES。
     */
    @serialize
    @oav({ component: 'OAVEnum', tooltip: '渲染模式，默认RenderMode.TRIANGLES', componentParam: { enumClass: RenderMode } })
    renderMode: 'POINTS' | 'LINE_LOOP' | 'LINE_STRIP' | 'LINES' | 'TRIANGLES' | 'TRIANGLE_STRIP' | 'TRIANGLE_FAN' = RenderMode.TRIANGLES;

    /**
     * 剔除面，默认 BACK。
     */
    @serialize
    @oav({ component: 'OAVEnum', tooltip: '剔除面', componentParam: { enumClass: CullFace } })
    cullFace: 'NONE' | 'FRONT' | 'BACK' | 'FRONT_AND_BACK' = CullFace.BACK;

    /**
     * 正向方向，默认 CW（顺时针为正面）。
     */
    @serialize
    @oav({ component: 'OAVEnum', tooltip: '正面方向，默认FrontFace.CW 顺时针为正面', componentParam: { enumClass: FrontFace } })
    frontFace: 'CW' | 'CCW' = FrontFace.CW;

    /**
     * 是否开启混合，默认 false。
     */
    @serialize
    @oav({ tooltip: '是否开启混合' })
    enableBlend = false;

    /**
     * 混合方式，默认 FUNC_ADD。
     */
    @serialize
    @oav({ component: 'OAVEnum', tooltip: '混合方式，默认BlendEquation.FUNC_ADD', componentParam: { enumClass: BlendEquation } })
    blendEquation: 'FUNC_ADD' | 'FUNC_SUBTRACT' | 'FUNC_REVERSE_SUBTRACT' = BlendEquation.FUNC_ADD;

    /**
     * 源混合因子，默认 SRC_ALPHA。
     */
    @serialize
    @oav({ component: 'OAVEnum', tooltip: '源混合因子，默认BlendFactor.SRC_ALPHA', componentParam: { enumClass: BlendFactor } })
    sfactor: 'ZERO' | 'ONE' | 'SRC_COLOR' | 'ONE_MINUS_SRC_COLOR' | 'DST_COLOR' | 'ONE_MINUS_DST_COLOR' | 'SRC_ALPHA' | 'ONE_MINUS_SRC_ALPHA' | 'DST_ALPHA' | 'ONE_MINUS_DST_ALPHA' | 'SRC_ALPHA_SATURATE' = BlendFactor.SRC_ALPHA;

    /**
     * 目标混合因子，默认 ONE_MINUS_SRC_ALPHA。
     */
    @serialize
    @oav({ component: 'OAVEnum', tooltip: '目标混合因子，默认BlendFactor.ONE_MINUS_SRC_ALPHA', componentParam: { enumClass: BlendFactor } })
    dfactor: 'ZERO' | 'ONE' | 'SRC_COLOR' | 'ONE_MINUS_SRC_COLOR' | 'DST_COLOR' | 'ONE_MINUS_DST_COLOR' | 'SRC_ALPHA' | 'ONE_MINUS_SRC_ALPHA' | 'DST_ALPHA' | 'ONE_MINUS_DST_ALPHA' | 'SRC_ALPHA_SATURATE' = BlendFactor.ONE_MINUS_SRC_ALPHA;

    /**
     * 是否开启深度检查，默认 true。
     */
    @serialize
    @oav({ tooltip: '是否开启深度检查' })
    depthtest = true;

    /**
     * 深度比较函数，默认 LESS。
     */
    @serialize
    @oav({ component: 'OAVEnum', tooltip: '深度检测方法', componentParam: { enumClass: DepthFunc } })
    depthFunc: 'NEVER' | 'LESS' | 'EQUAL' | 'LEQUAL' | 'GREATER' | 'NOTEQUAL' | 'GEQUAL' | 'ALWAYS' = DepthFunc.LESS;

    /**
     * 是否开启深度标记。
     */
    @serialize
    @oav({ tooltip: '是否开启深度标记' })
    depthMask = true;

    /**
     * 控制哪些颜色分量可写入。
     */
    @serialize
    @oav({ component: 'OAVEnum', tooltip: '深度检测方法', componentParam: { enumClass: ColorMask } })
    colorMask = ColorMask.RGBA;

    /**
     * 是否使用 viewport，默认不使用。
     */
    @oav({ tooltip: '是否使用 viewRect' })
    @serialize
    useViewPort = false;

    /**
     * 视口区域。
     */
    @oav({ tooltip: '绘制在画布上的区域' })
    @serialize
    viewPort: { x: number, y: number, width: number, height: number } = { x: 0, y: 0, width: 100, height: 100 };

    /**
     * 是否开启剪刀裁剪，默认不开启。
     */
    @oav({ tooltip: '是否开启剪刀裁剪' })
    @serialize
    useScissor = false;

    /**
     * 剪刀盒。
     */
    @oav({ tooltip: '剪刀盒' })
    @serialize
    scissor: { x: number, y: number, width: number, height: number } = { x: 0, y: 0, width: 100, height: 100 };

    /**
     * 是否开启多边形深度偏移。
     */
    @oav({ tooltip: '是否开启多边形深度偏移' })
    @serialize
    usePolygonOffset = false;

    /**
     * 多边形深度偏移比例因子。
     */
    @oav({ tooltip: '多边形深度偏移比例因子' })
    @serialize
    polygonOffsetFactor = 0;

    /**
     * 多边形深度偏移单位。
     */
    @oav({ tooltip: '多边形深度偏移单位' })
    @serialize
    polygonOffsetUnits = 0;

    /**
     * 是否开启模板测试。
     */
    @oav({ tooltip: '是否开启模板测试' })
    @serialize
    useStencil = false;

    /**
     * 模板测试函数，默认 ALWAYS。
     */
    @oav({ tooltip: '模板测试函数' })
    @serialize
    stencilFunc: 'NEVER' | 'LESS' | 'EQUAL' | 'LEQUAL' | 'GREATER' | 'NOTEQUAL' | 'GEQUAL' | 'ALWAYS' = 'ALWAYS';

    /**
     * 模板测试参考值。
     */
    @oav({ tooltip: '模板测试参考值' })
    @serialize
    stencilFuncRef = 0;

    /**
     * 模板测试 mask。
     */
    @oav({ tooltip: '模板测试 mask' })
    @serialize
    stencilFuncMask = 1;

    /**
     * 模板测试失败操作。
     */
    @oav({ tooltip: '模板测试失败操作' })
    @serialize
    stencilOpFail: 'KEEP' | 'ZERO' | 'REPLACE' | 'INCR' | 'INCR_WRAP' | 'DECR' | 'DECR_WRAP' | 'INVERT' = 'KEEP';

    /**
     * 模板测试通过但深度测试失败操作。
     */
    @oav({ tooltip: '模板测试通过但深度测试失败操作' })
    @serialize
    stencilOpZFail: 'KEEP' | 'ZERO' | 'REPLACE' | 'INCR' | 'INCR_WRAP' | 'DECR' | 'DECR_WRAP' | 'INVERT' = 'KEEP';

    /**
     * 模板测试与深度测试都通过操作。
     */
    @oav({ tooltip: '模板测试与深度测试都通过操作' })
    @serialize
    stencilOpZPass: 'KEEP' | 'ZERO' | 'REPLACE' | 'INCR' | 'INCR_WRAP' | 'DECR' | 'DECR_WRAP' | 'INVERT' = 'KEEP';

    /**
     * 模板掩码。
     */
    @oav({ tooltip: '模板掩码' })
    @serialize
    stencilMask = 1;

    constructor(raw?: Partial<RenderParams>)
    {
        Object.assign(this, raw);
    }
}
