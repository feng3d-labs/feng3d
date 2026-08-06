import { reactive } from '@feng3d/reactivity';
import { Buffer } from '../../data/Buffer';
import { RenderObject } from '../../data/RenderObject';
import { WGPUBuffer } from '../../caches/WGPUBuffer';
import { WGPURenderPassEncoder } from '../../caches/WGPURenderPassEncoder';

export function runIndexBuffer(renderObject: RenderObject, passEncoder: WGPURenderPassEncoder)
{
    //
    const r_renderObject = reactive(renderObject);

    r_renderObject.indices;

    const { indices } = renderObject;

    if (indices)
    {
        const device = passEncoder.device;

        const buffer = Buffer.getBuffer(indices.buffer);

        if (!buffer.label)
        {
            reactive(buffer).label = (`顶点索引 ${autoIndex++}`);
        }

        const gBuffer = WGPUBuffer.getInstance(device, buffer);

        passEncoder.setIndexBuffer(gBuffer.gpuBuffer, indices.BYTES_PER_ELEMENT === 4 ? 'uint32' : 'uint16', indices.byteOffset, indices.byteLength);
    }
}
let autoIndex = 0;
