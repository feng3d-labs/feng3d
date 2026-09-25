import { WGPUBindGroup } from '../caches/WGPUBindGroup';
import { WGPUComputePipeline } from '../caches/WGPUComputePipeline';
import { WGPUPipelineLayout } from '../caches/WGPUPipelineLayout';
import { ComputeObject } from '../data/ComputeObject';

export function runComputeObject(computeObject: ComputeObject, device: GPUDevice, commandEncoder: GPUComputePassEncoder)
{
    const wGPUComputePipeline = WGPUComputePipeline.getInstance(device, computeObject.pipeline);
    const computePipeline = wGPUComputePipeline.gpuComputePipeline;

    commandEncoder.setPipeline(computePipeline);

    // 计算 bindGroups
    const layout = WGPUPipelineLayout.getPipelineLayout({ compute: computeObject.pipeline.compute.code });

    layout.bindGroupLayouts.forEach((bindGroupLayout, group) =>
    {
        const wgpuBindGroup = WGPUBindGroup.getInstance(device, bindGroupLayout, computeObject.bindingResources);

        commandEncoder.setBindGroup(group, wgpuBindGroup.gpuBindGroup);
    });

    commandEncoder.dispatchWorkgroups(computeObject.workgroups.workgroupCountX, computeObject.workgroups.workgroupCountY, computeObject.workgroups.workgroupCountZ);
}