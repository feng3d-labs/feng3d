import { OcclusionQuery } from '../data/OcclusionQuery';
import { WGPURenderPassEncoder } from '../caches/WGPURenderPassEncoder';
import { runRenderObject } from './runRenderObject';

export function runOcclusionQuery(occlusionQuery: OcclusionQuery, passEncoder: WGPURenderPassEncoder)
{
    passEncoder.beginOcclusionQuery();

    occlusionQuery.renderObjects.forEach((renderObject) =>
    {
        runRenderObject(renderObject, passEncoder);
    });

    passEncoder.endOcclusionQuery();
}