import { reactive } from '@feng3d/reactivity';
import { RenderObject } from '../../data/RenderObject';
import { WGPURenderPassEncoder } from '../../caches/WGPURenderPassEncoder';

export function runDraw(renderObject: RenderObject, passEncoder: WGPURenderPassEncoder)
{
    const r_renderObject = reactive(renderObject);
    const draw = r_renderObject.draw;

    //
    if (draw.__type__ === 'DrawVertex')
    {
        passEncoder.draw(draw.vertexCount, draw.instanceCount, draw.firstVertex, draw.firstInstance);
    }
    else
    {
        passEncoder.drawIndexed(draw.indexCount, draw.instanceCount, draw.firstIndex, draw.baseVertex, draw.firstInstance);
    }
}
