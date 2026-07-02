import { Color4 } from '@feng3d/math';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { colorFragmentWGSL } from '../shaders/color.fragment.wgsl';
import { colorVertexWGSL } from '../shaders/color.vertex.wgsl';
import { Material } from './Material';

interface ColorUniforms
{
    /**
     * 漫反射颜色。
     *
     * 修改该字段（如 `reactive(mat).u_diffuseInput = new Color4().fromUnit(...)`）
     * 会被响应式系统捕获，实时更新到 GPU。
     */
    readonly u_diffuseInput: Color4
}

/**
 * 颜色材质。
 *
 * 使用 color 着色器（顶点颜色 × 漫反射颜色）。
 * shader 与渲染状态在构造时填充到 {@link Material.renderPipeline}。
 * 漫反射颜色直接作为实例字段 {@link u_diffuseInput}。
 */
@decoratorRegisterClass()
export class ColorMaterial extends Material
{
    readonly uniforms: ColorUniforms = { u_diffuseInput: new Color4() };

    constructor()
    {
        super();
        reactive(this.renderPipeline.vertex).wgsl = colorVertexWGSL;
        reactive(this.renderPipeline.fragment).wgsl = colorFragmentWGSL;
    }
}
