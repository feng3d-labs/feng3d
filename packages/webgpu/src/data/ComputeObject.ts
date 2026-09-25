import { BindingResources } from './BindingResources';
import { ComputePipeline } from './ComputePipeline';
import { Workgroups } from './Workgroups';

/**
 * WebGPU计算对象，包含GPU一次计算所有数据。
 *
 * {@link GPUComputePassEncoder.setPipeline}
 *
 * {@link GPUBindingCommandsMixin.setBindGroup}
 *
 * {@link GPUComputePassEncoder.dispatchWorkgroups}
 */
export interface ComputeObject
{
    /**
     * 计算管线。
     */
    readonly pipeline: ComputePipeline;

    /**
     * 绑定资源。包含数值、纹理、采样、外部纹理。
     */
    readonly bindingResources?: BindingResources;

    /**
     * {@link GPUComputePassEncoder.dispatchWorkgroups}
     *
     * 分配的工作组。
     */
    readonly workgroups?: Workgroups;
}
