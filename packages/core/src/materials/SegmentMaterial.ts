import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { serialize } from '@feng3d/serialization';
import { Material } from './Material';
import { StandardMaterial } from './StandardMaterial';

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

// TODO: SegmentMaterial 尚未重构为 Material 子类，暂用 StandardMaterial 占位注册
Material.setDefault('Segment-Material', new StandardMaterial());
