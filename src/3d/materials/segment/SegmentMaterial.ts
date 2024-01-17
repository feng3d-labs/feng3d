import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { shaderlib } from '@feng3d/renderer';
import { Serializable, SerializeProperty } from '@feng3d/serialization';
import { Material } from '../../../core/Material';
import segmentFragment from './segment.fragment.glsl';
import segmentVertex from './segment.vertex.glsl';

declare module '../../../core/Material'
{
    interface MaterialMap { SegmentMaterial: SegmentMaterial }
    interface UniformsMap { SegmentUniforms: SegmentUniforms }

    interface DefaultMaterialMap { 'Segment-Material': SegmentMaterial; }
}

@Serializable('SegmentMaterial')
export class SegmentMaterial extends Material
{
    declare __class: 'SegmentMaterial';

    uniforms = new SegmentUniforms();

    constructor()
    {
        super();
        this.shader.shaderName = 'segment';
        this.drawMode = 'LINES';
        this.renderParams.enableBlend = true;
    }
}

/**
 * 线段材质
 * 目前webgl不支持修改线条宽度，参考：https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth
 */
@Serializable('SegmentUniforms')
export class SegmentUniforms
{
    declare __class__: 'SegmentUniforms';

    /**
     * 颜色
     */
    @SerializeProperty()
    @oav()
    u_segmentColor = new Color4();
}

shaderlib.shaderConfig.shaders.segment = {
    vertex: segmentVertex,
    fragment: segmentFragment,
};

Material.setDefault('Segment-Material', () => new SegmentMaterial());
