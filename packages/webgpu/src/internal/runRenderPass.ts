import { CanvasContext } from '../data/CanvasContext';
import { RenderPass } from '../data/RenderPass';
import { WGPUQuerySet } from '../caches/WGPUQuerySet';
import { WGPURenderPass } from '../caches/WGPURenderPass';
import { WGPURenderPassDescriptor } from '../caches/WGPURenderPassDescriptor';

export function runRenderPass(device: GPUDevice, commandEncoder: GPUCommandEncoder, renderPass: RenderPass, canvasContext?: CanvasContext)
{
    const wgpuRenderPassDescriptor = WGPURenderPassDescriptor.getInstance(device, renderPass.descriptor, canvasContext);
    const renderPassDescriptor = wgpuRenderPassDescriptor.gpuRenderPassDescriptor;

    //
    const wgpuQuerySet = WGPUQuerySet.getInstance(device, renderPass);

    if (wgpuQuerySet.gpuQuerySet)
    {
        renderPassDescriptor.occlusionQuerySet = wgpuQuerySet.gpuQuerySet;
    }

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    const state = WGPURenderPass.getInstance(device, renderPass, canvasContext);

    state.commands.runCommands(passEncoder);

    passEncoder.end();

    // timestampWrites 在描述符构造时按 timestampQuery 设置（可能未设置，故此处判空）；
    // resolve 是引擎扩展的可选方法（未设置时不解析）
    renderPassDescriptor.timestampWrites?.resolve?.(commandEncoder);
    renderPassDescriptor.occlusionQuerySet?.resolve(commandEncoder);
}
