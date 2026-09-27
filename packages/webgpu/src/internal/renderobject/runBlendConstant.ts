import { reactive } from '@feng3d/reactivity';
import { BlendState } from '../../data/BlendState';
import { RenderObject } from '../../data/RenderObject';
import { WGPURenderPassEncoder } from '../../caches/WGPURenderPassEncoder';

export function runBlendConstant(renderObject: RenderObject, passEncoder: WGPURenderPassEncoder)
{
    const r_renderObject = reactive(renderObject);
    // blend 可选：getBlendConstantColor 内部已按 falsy 提前返回 undefined（不设置混合常量），
    // 这里用空混合状态占位，与传入 undefined 的行为完全一致
    const blendConstantColor = BlendState.getBlendConstantColor(r_renderObject.pipeline.fragment?.targets?.[0]?.blend ?? {});

    passEncoder.setBlendConstant(blendConstantColor);
}