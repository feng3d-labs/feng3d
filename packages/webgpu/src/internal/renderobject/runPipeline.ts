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
    // indices 可选：无索引时索引格式为 undefined（非索引绘制）
    const indexFormat: GPUIndexFormat | undefined = indices ? (indices.BYTES_PER_ELEMENT === 4 ? 'uint32' : 'uint16') : undefined;

    //
    // vertices 可选：WGPURenderPipeline 的消费方（WGPUVertexState）已按"未提供顶点属性"处理，
    // 这里用空表占位，不改变实际行为（属性查找结果本来就是未提供）
    // indexFormat 仅在 strip 图元下被消费（WGPUPrimitiveState 中 topology 为 strip 时才赋值 stripIndexFormat），
    // 而 strip 绘制必须带索引，故此时 indexFormat 必然有值
    const wgpuRenderPipeline = WGPURenderPipeline.getInstance(device, pipeline, renderPassFormat, vertices ?? {}, indexFormat!);
    const gpuRenderPipeline = wgpuRenderPipeline.gpuRenderPipeline;

    passEncoder.setPipeline(gpuRenderPipeline);
}
