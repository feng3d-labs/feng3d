import { reactive } from '@feng3d/reactivity';
import { RenderObject } from '../../data/RenderObject';
import { WGPURenderPassEncoder } from '../../caches/WGPURenderPassEncoder';
import type { DrawVertex } from '../../data/DrawVertex';
import type { DrawIndexed } from '../../data/DrawIndexed';
import type { DrawIndexedIndirect } from '../../data/DrawIndexedIndirect';

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
        const dii = draw as DrawIndexedIndirect;
        passEncoder.drawIndexedIndirect(dii.buffer, dii.offset);
    }
}
