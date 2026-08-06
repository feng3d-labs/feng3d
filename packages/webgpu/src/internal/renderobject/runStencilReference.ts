import { reactive } from '@feng3d/reactivity';
import { RenderObject } from '../../data/RenderObject';
import { getStencilReference } from '../../data/DepthStencilState';
import { WGPURenderPassEncoder } from '../../caches/WGPURenderPassEncoder';

export function runStencilReference(renderObject: RenderObject, passEncoder: WGPURenderPassEncoder)
{
    const r_renderObject = reactive(renderObject);
    const stencilReference = getStencilReference(r_renderObject.pipeline.depthStencil);

    passEncoder.setStencilReference(stencilReference);
}
