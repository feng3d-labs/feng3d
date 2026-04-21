import { CanvasContext } from '../data/CanvasContext';
import { RenderPass } from '../data/RenderPass';
import { RenderPassDescriptor } from '../data/RenderPassDescriptor';
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

    renderPassDescriptor.timestampWrites?.resolve(commandEncoder);
    renderPassDescriptor.occlusionQuerySet?.resolve(commandEncoder);
}
