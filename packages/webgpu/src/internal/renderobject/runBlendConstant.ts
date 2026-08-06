import { reactive } from '@feng3d/reactivity';
import { BlendState } from '../../data/BlendState';
import { RenderObject } from '../../data/RenderObject';
import { WGPURenderPassEncoder } from '../../caches/WGPURenderPassEncoder';

export function runBlendConstant(renderObject: RenderObject, passEncoder: WGPURenderPassEncoder)
{
    const r_renderObject = reactive(renderObject);
    const blendConstantColor = BlendState.getBlendConstantColor(r_renderObject.pipeline.fragment?.targets?.[0]?.blend);

    passEncoder.setBlendConstant(blendConstantColor);
}