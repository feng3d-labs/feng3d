import { RenderObject } from '../data/RenderObject';
import { runBindGroup } from './renderobject/runBindGroup';
import { runBlendConstant } from './renderobject/runBlendConstant';
import { runDraw } from './renderobject/runDraw';
import { runIndexBuffer } from './renderobject/runIndexBuffer';
import { runPipeline } from './renderobject/runPipeline';
import { runScissorRect } from './renderobject/runScissorRect';
import { runStencilReference } from './renderobject/runStencilReference';
import { runVertexBuffer } from './renderobject/runVertexBuffer';
import { runViewport } from './renderobject/runViewport';
import { WGPURenderPassEncoder } from '../caches/WGPURenderPassEncoder';

export function runRenderObject(renderObject: RenderObject, passEncoder: WGPURenderPassEncoder)
{
    runViewport(renderObject, passEncoder);

    runScissorRect(renderObject, passEncoder);

    runBlendConstant(renderObject, passEncoder);

    runStencilReference(renderObject, passEncoder);

    runPipeline(renderObject, passEncoder);

    runBindGroup(renderObject, passEncoder);

    runVertexBuffer(renderObject, passEncoder);

    runIndexBuffer(renderObject, passEncoder);

    runDraw(renderObject, passEncoder);
}