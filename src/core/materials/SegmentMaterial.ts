import segmentFragment from '../shaders/segment.fragment.glsl';
import segmentVertex from '../shaders/segment.vertex.glsl';
import { Material } from './Material';

declare global
{
    export interface MixinsUniformsTypes
    {
        segment: SegmentUniforms
    }

    export interface MixinsDefaultMaterial
    {
        'Segment-Material': Material;
    }
}

/**
 * 线段材质
 * 目前webgl不支持修改线条宽度，参考：https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth
 */
@decoratorRegisterClass()
export class SegmentUniforms
{
    __class__: 'SegmentUniforms';

    /**
     * 颜色
     */
    @serialize
    @oav()
    u_segmentColor = new Color4();
}

shaderlib.shaderConfig.shaders.segment = {
    fragment: segmentFragment, vertex: segmentVertex, cls: SegmentUniforms,
    renderParams: { renderMode: RenderMode.LINES, enableBlend: true }
};

Material.setDefault('Segment-Material', { shaderName: 'segment' });
