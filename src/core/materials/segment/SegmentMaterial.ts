import { Color4 } from '../../../math/Color4';
import { oav } from '../../../objectview/ObjectView';
import { shaderlib } from '../../../renderer/shader/ShaderLib';
import { Serializable } from '../../../serialization/Serializable';
import { SerializeProperty } from '../../../serialization/SerializeProperty';
import { Material } from '../Material';
import segmentFragment from './segment_fragment_glsl';
import segmentVertex from './segment_vertex_glsl';

declare global
{
    export interface MixinsMaterialMap
    {
        segment: SegmentMaterial
    }

    export interface MixinsDefaultMaterial
    {
        'Segment-Material': SegmentMaterial;
    }
}

@Serializable()
export class SegmentMaterial extends Material
{
    uniforms = new SegmentUniforms();

    constructor()
    {
        super();
        this.shader.shaderName = 'segment';
        this.renderParams.renderMode = 'LINES';
        this.renderParams.enableBlend = true;
    }
}

/**
 * 线段材质
 * 目前webgl不支持修改线条宽度，参考：https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/lineWidth
 */
@Serializable()
export class SegmentUniforms
{
    __class__: 'SegmentUniforms';

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
    cls: SegmentUniforms,
    renderParams: { renderMode: 'LINES', enableBlend: true }
};

Material.setDefault('Segment-Material', new SegmentMaterial());
