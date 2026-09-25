import { reactive } from '@feng3d/reactivity';
import { RenderObject } from '../../data/RenderObject';
import { WGPURenderPassEncoder } from '../../caches/WGPURenderPassEncoder';
import { WGPURenderPipeline } from '../../caches/WGPURenderPipeline';

export function runPipeline(renderObject: RenderObject, passEncoder: WGPURenderPassEncoder)
{
    const renderPassFormat = passEncoder.renderPassFormat;
    const device = passEncoder.device;

    const r_renderObject = reactive(renderObject);

    r_renderObject.pipeline;
    r_renderObject.vertices;
    r_renderObject.indices;

    const { pipeline, vertices, indices } = renderObject;
    //
    const indexFormat: GPUIndexFormat = indices ? (indices.BYTES_PER_ELEMENT === 4 ? 'uint32' : 'uint16') : undefined;

    //
    const wgpuRenderPipeline = WGPURenderPipeline.getInstance(device, pipeline, renderPassFormat, vertices, indexFormat);
    const gpuRenderPipeline = wgpuRenderPipeline.gpuRenderPipeline;

    passEncoder.setPipeline(gpuRenderPipeline);
}
