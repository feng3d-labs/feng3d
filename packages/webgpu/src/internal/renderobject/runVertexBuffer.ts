import { reactive } from '@feng3d/reactivity';
import { Buffer } from '../../data/Buffer';
import { RenderObject } from '../../data/RenderObject';
import { WGPUBuffer } from '../../caches/WGPUBuffer';
import { WGPURenderPassEncoder } from '../../caches/WGPURenderPassEncoder';
import { WGPUVertexBufferLayout } from '../../caches/WGPUVertexBufferLayout';

export function runVertexBuffer(renderObject: RenderObject, passEncoder: WGPURenderPassEncoder)
{
    const device = passEncoder.device;

    //
    const r_renderObject = reactive(renderObject);

    r_renderObject.vertices;
    r_renderObject.pipeline.vertex;

    const wgpuVertexBufferLayout = WGPUVertexBufferLayout.getInstance(renderObject.pipeline.vertex, renderObject.vertices);
    const vertexDatas = wgpuVertexBufferLayout.vertexDatas;

    vertexDatas?.forEach((data, index) =>
    {
        // 执行
        const offset = data.byteOffset;
        const size = data.byteLength;
        const buffer = Buffer.getBuffer(data.buffer);

        if (!buffer.label)
        {
            reactive(buffer).label = (`顶点数据 ${autoVertexIndex++}`);
        }

        const wgpuBuffer = WGPUBuffer.getInstance(device, buffer);
        const gpuBuffer = wgpuBuffer.gpuBuffer;

        passEncoder.setVertexBuffer(index, gpuBuffer, offset, size);
    });
}
let autoVertexIndex = 0;