import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/serialization';
import { shaderlib } from '@feng3d/renderer';
import { serialize } from '@feng3d/serialization';
import { Material } from '../Material';
import segmentFragment from './segment_fragment_glsl';
import segmentVertex from './segment_vertex_glsl';

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
    vertex: segmentVertex,
    fragment: segmentFragment,
    cls: SegmentUniforms,
    renderParams: { renderMode: 'LINES', enableBlend: true }
};

Material.setDefault('Segment-Material', { shaderName: 'segment' as any });
