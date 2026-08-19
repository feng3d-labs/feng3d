import { reactive } from '@feng3d/reactivity';
import { RenderObject } from '../../data/RenderObject';
import { Buffer } from '../../data/Buffer';
import { WGPURenderPassEncoder } from '../../caches/WGPURenderPassEncoder';
import { WGPUBuffer } from '../../caches/WGPUBuffer';
import type { DrawVertex } from '../../data/DrawVertex';
import type { DrawIndexed } from '../../data/DrawIndexed';
import type { DrawIndexedIndirect } from '../../data/DrawIndexedIndirect';
import type { DrawIndirect } from '../../data/DrawIndirect';

export function runDraw(renderObject: RenderObject, passEncoder: WGPURenderPassEncoder)
{
    const r_renderObject = reactive(renderObject);
    const draw = r_renderObject.draw;

    if (!draw) return;

    //
    if (draw.__type__ === 'DrawVertex')
    {
        const dv = draw as DrawVertex;

        passEncoder.draw(dv.vertexCount, dv.instanceCount, dv.firstVertex, dv.firstInstance);
    }
    else if (draw.__type__ === 'DrawIndexed')
    {
        const di = draw as DrawIndexed;

        passEncoder.drawIndexed(di.indexCount, di.instanceCount, di.firstIndex, di.baseVertex, di.firstInstance);
    }
    else if (draw.__type__ === 'DrawIndexedIndirect')
    {
        const dii = renderObject.draw as DrawIndexedIndirect;
        const gpuBuffer = WGPUBuffer.getInstance(passEncoder.device, dii.buffer as Buffer).gpuBuffer;

        passEncoder.drawIndexedIndirect(gpuBuffer, dii.offset || 0);
    }
    else if (draw.__type__ === 'DrawIndirect')
    {
        const di = renderObject.draw as DrawIndirect;
        const gpuBuffer = WGPUBuffer.getInstance(passEncoder.device, di.buffer as Buffer).gpuBuffer;

        passEncoder.drawIndirect(gpuBuffer, di.offset || 0);
    }
}
