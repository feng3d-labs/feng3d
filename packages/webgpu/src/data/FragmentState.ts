import { ColorTargetState } from './ColorTargetState';

/**
 * 片段着色器阶段描述。
 *
 * {@link GPUFragmentState}
 */
export interface FragmentState
{
    /**
     * 着色器代码。
     */
    readonly code?: string;

    /**
     * WGSL着色器代码。适用于WebGPU。
     */
    readonly wgsl?: string;

    /**
     * 入口函数名称。
     */
    readonly entryPoint?: string;

    /**
     * Specifies the values of pipeline-overridable constants in the shader module.
     */
    readonly constants?: Readonly<Record<string, GPUPipelineConstantValue>>;

    /**
     * A list of {@link GPUColorTargetState} defining the formats and behaviors of the color targets
     * this pipeline writes to.
     *
     * 定义了该管道写入的颜色目标的格式和行为。
     */
    readonly targets?: readonly ColorTargetState[];
}
