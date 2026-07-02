import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { serialize } from '@feng3d/serialization';
import { pointFragmentWGSL } from '../shaders/point.fragment.wgsl';
import { pointVertexWGSL } from '../shaders/point.vertex.wgsl';
import { Material } from './Material';

/**
 * 点材质 uniforms（保留供编辑器等旧代码做类型断言使用）。
 */
@decoratorRegisterClass()
export class PointUniforms
{
    __class__: 'PointUniforms';
    /**
     * 颜色
     */
    @serialize
    @oav()
    u_color = new Color4();
}

/**
 * 点材质。
 *
 * 使用 point 着色器（顶点颜色 × 材质颜色），按点列表（point-list）拓扑绘制。
 * shader 与渲染状态在构造时填充到 {@link Material.renderPipeline}。
 */
@decoratorRegisterClass()
export class PointMaterial extends Material
{
    readonly uniforms: PointUniforms = new PointUniforms();

    constructor()
    {
        super();
        reactive(this.renderPipeline.vertex).wgsl = pointVertexWGSL;
        reactive(this.renderPipeline.fragment).wgsl = pointFragmentWGSL;
        reactive(this.renderPipeline.primitive).topology = 'point-list';
        reactive(this.renderPipeline.primitive).cullFace = 'none';
    }
}
