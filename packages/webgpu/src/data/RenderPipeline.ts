import { DepthStencilState } from './DepthStencilState';
import { FragmentState } from './FragmentState';
import { MultisampleState } from './MultisampleState';
import { PrimitiveState } from './PrimitiveState';
import { VertexState } from './VertexState';

/**
 * 渲染管线。
 *
 * 对应WebGPU的Pipeline。
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/createRenderPipeline
 */
export interface RenderPipeline
{
    /**
     * 标签。
     *
     * 用于调试。
     */
    readonly label?: string;

    /**
     * 顶点着色器阶段描述。
     */
    readonly vertex: VertexState;

    /**
     * 片段着色器阶段描述。
     */
    readonly fragment?: FragmentState;

    /**
     * Describes the primitive-related properties of the pipeline.
     *
     * 图元拓扑结构。
     */
    readonly primitive?: PrimitiveState;

    /**
     * 深度模板阶段描述。
     */
    readonly depthStencil?: DepthStencilState;

    /**
     * 多重采样阶段描述。
     */
    readonly multisample?: MultisampleState;

    _version?: number;
}

/**
 * WebGPU dual-source-blending 扩展的混合因子类型。
 *
 * 定义了 WebGPU 特有的混合因子 "src1" | "one-minus-src1" | "src1-alpha" | "one-minus-src1-alpha"，
 * 这些因子需要开启扩展 `dual-source-blending` 才能使用。
 *
 * @see https://www.w3.org/TR/webgpu/#dictdef-gpublendfactor
 */
export interface IDualSourceBlendFactor
{
    'src1': 'src1';
    'one-minus-src1': 'one-minus-src1';
    'src1-alpha': 'src1-alpha';
    'one-minus-src1-alpha': 'one-minus-src1-alpha';
}
