import { reactive } from '@feng3d/reactivity';
import { RenderObject } from '../../data/RenderObject';
import { WGPUBindGroup } from '../../caches/WGPUBindGroup';
import { WGPUPipelineLayout } from '../../caches/WGPUPipelineLayout';
import { WGPURenderPassEncoder } from '../../caches/WGPURenderPassEncoder';

export function runBindGroup(renderObject: RenderObject, passEncoder: WGPURenderPassEncoder)
{
    const device = passEncoder.device;

    const r_renderObject = reactive(renderObject);

    // 执行
    r_renderObject.bindingResources;
    const bindingResources = renderObject.bindingResources;

    const vertexCode = r_renderObject.pipeline.vertex.wgsl || r_renderObject.pipeline.vertex.code;
    const fragmentCode = r_renderObject.pipeline.fragment?.wgsl || r_renderObject.pipeline.fragment?.code;
    //
    const layout = WGPUPipelineLayout.getPipelineLayout({ vertex: vertexCode, fragment: fragmentCode });

    layout.bindGroupLayouts.forEach((bindGroupLayout, index) =>
    {
        const wgpuBindGroup = WGPUBindGroup.getInstance(device, bindGroupLayout, bindingResources);

        passEncoder.setBindGroup(index, wgpuBindGroup.gpuBindGroup);
    });
}