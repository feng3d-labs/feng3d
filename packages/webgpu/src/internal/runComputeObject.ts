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
    const computeCode = computeObject.pipeline.compute.code;

    // 计算着色器代码在数据接口中是可选的，缺失时着色器反射得到的是空绑定表，
    // 会导致绑定组布局与实际资源对不上（表现为计算结果不对），故在此明确报错
    if (!computeCode) throw new Error('runComputeObject: 计算管线缺少着色器代码（compute.code）');

    // getPipelineLayout 的每条返回路径都会返回（缓存命中直接返回，否则必定新建并返回）布局描述符，不会返回 undefined
    const layout = WGPUPipelineLayout.getPipelineLayout({ compute: computeCode })!;

    // bindingResources 缺省时按空绑定表处理（WGPUBindGroup 按绑定组布局逐项取资源，缺项本来就按"未提供"处理）
    const bindingResources = computeObject.bindingResources ?? {};

    layout.bindGroupLayouts.forEach((bindGroupLayout, group) =>
    {
        const wgpuBindGroup = WGPUBindGroup.getInstance(device, bindGroupLayout, bindingResources);

        commandEncoder.setBindGroup(group, wgpuBindGroup.gpuBindGroup);
    });

    // workgroups 在数据接口中是可选的，但本函数是提交路径：缺失时无法推断分发规模
    const workgroups = computeObject.workgroups;

    if (!workgroups)
    {
        throw new Error('runComputeObject: ComputeObject 缺少 workgroups，无法确定 dispatchWorkgroups 的工作组数量');
    }

    commandEncoder.dispatchWorkgroups(workgroups.workgroupCountX, workgroups.workgroupCountY, workgroups.workgroupCountZ);
}