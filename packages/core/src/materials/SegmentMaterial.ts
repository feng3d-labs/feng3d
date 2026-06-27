import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
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
 * 线段材质 uniforms
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

// shader 注册（WGSL + uniforms 工厂 + 渲染状态）由 ShaderRegistry 集中管理。
Material.setDefault('Segment-Material', { shaderName: 'segment' });
