import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { serialize } from '@feng3d/serialization';
import { segmentFragmentWGSL } from '../shaders/segment.fragment.wgsl';
import { segmentVertexWGSL } from '../shaders/segment.vertex.wgsl';
import { Material } from './Material';

declare global
{
    export interface MixinsDefaultMaterial
    {
        'Segment-Material': Material;
    }
}

/**
 * 线段材质 uniforms（保留供编辑器等旧代码做类型断言使用）。
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

/**
 * 线段材质。
 *
 * 使用 segment 着色器（顶点颜色 × 材质颜色），按线段列表（line-list）拓扑绘制，
 * 开启 alpha 混合。shader 与渲染状态在构造时填充到 {@link Material.renderPipeline}。
 */
@decoratorRegisterClass()
export class SegmentMaterial extends Material
{
    readonly uniforms: SegmentUniforms = new SegmentUniforms();

    constructor()
    {
        super();
        reactive(this.renderPipeline.vertex).wgsl = segmentVertexWGSL;
        reactive(this.renderPipeline.fragment).wgsl = segmentFragmentWGSL;
        reactive(this.renderPipeline.primitive).topology = 'line-list';
        reactive(this.renderPipeline.primitive).cullFace = 'none';
        // 开启 alpha 混合
        reactive(this.renderPipeline.fragment).targets = [{
            blend: {
                color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            },
        }];
    }
}

// 注册默认材质
Material.setDefault('Segment-Material', new SegmentMaterial());
