import { ComputeStage } from './ComputeStage';

/**
 * WebGPU计算管线。
 *
 * {@link GPUDevice.createComputePipeline}
 * {@link GPUComputePipelineDescriptor}
 */
export interface ComputePipeline
{
    /**
     * The initial value of {@link GPUObjectBase#label|GPUObjectBase.label}.
     */
    readonly label?: string;

    /**
     * 计算程序。
     */
    readonly compute: ComputeStage;
}