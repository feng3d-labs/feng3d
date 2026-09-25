import { reactive } from '@feng3d/reactivity';
import { RenderObject } from '../../data/RenderObject';
import { WGPURenderPassEncoder } from '../../caches/WGPURenderPassEncoder';

export function runScissorRect(renderObject: RenderObject, passEncoder: WGPURenderPassEncoder)
{
    const attachmentSize = passEncoder.attachmentSize;

    const r_renderObject = reactive(renderObject);
    const scissorRect = r_renderObject.scissorRect;

    if (scissorRect)
    {
        const isYup = scissorRect.isYup ?? true;
        const x = scissorRect.x ?? 0;
        let y = scissorRect.y ?? 0;
        const width = scissorRect.width;
        const height = scissorRect.height;

        if (isYup)
        {
            y = attachmentSize.height - y - height;
        }

        passEncoder.setScissorRect(x, y, width, height);
    }
    else
    {
        passEncoder.setScissorRect(0, 0, attachmentSize.width, attachmentSize.height);
    }
}