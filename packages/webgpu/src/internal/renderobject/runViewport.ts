import { reactive } from '@feng3d/reactivity';
import { RenderObject } from '../../data/RenderObject';
import { WGPURenderPassEncoder } from '../../caches/WGPURenderPassEncoder';

export function runViewport(renderObject: RenderObject, passEncoder: WGPURenderPassEncoder)
{
    const r_renderObject = reactive(renderObject);
    const viewport = r_renderObject.viewport;

    const attachmentSize = passEncoder.attachmentSize;

    if (viewport)
    {
        const isYup = viewport.isYup ?? true;
        const x = viewport.x ?? 0;
        let y = viewport.y ?? 0;
        const width = viewport.width;
        const height = viewport.height;
        const minDepth = viewport.minDepth ?? 0;
        const maxDepth = viewport.maxDepth ?? 1;

        if (isYup)
        {
            y = attachmentSize.height - y - height;
        }

        passEncoder.setViewport(x, y, width, height, minDepth, maxDepth);
    }
    else
    {
        passEncoder.setViewport(0, 0, attachmentSize.width, attachmentSize.height, 0, 1);
    }
}