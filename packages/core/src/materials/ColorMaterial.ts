import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { serialize } from '@feng3d/serialization';
import { colorFragmentWGSL } from '../shaders/color.fragment.wgsl';
import { colorVertexWGSL } from '../shaders/color.vertex.wgsl';
import { Material } from './Material';
import { RenderObject } from '@feng3d/webgpu';

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
    /**
     * 漫反射颜色。
     *
     * 修改该字段（如 `reactive(mat).u_diffuseInput = new Color4().fromUnit(...)`）
     * 会被响应式系统捕获，实时更新到 GPU。
     */
    @oav()
    @serialize
    u_diffuseInput = new Color4();

    constructor()
    {
        super();
        // color 着色器配置
        this.renderPipeline.vertex.wgsl = colorVertexWGSL;
        this.renderPipeline.fragment.wgsl = colorFragmentWGSL;
        this.renderPipeline.primitive.cullFace = 'back';
        this.renderPipeline.primitive.frontFace = 'cw';
        this.renderPipeline.depthStencil.depthWriteEnabled = true;
        this.renderPipeline.depthStencil.depthCompare = 'less';
    }

    /**
     * 重写 beforeRender：直接对 bindingResources 赋值，支持响应式更新。
     *
     * u_diffuseInput 写入 `bindingResources.material_uniforms.value`（对应 WGSL
     * `@group(0) @binding(3) var<uniform> material_uniforms`）。通过 reactive 代理赋值，
     * 使后续 `reactive(material).u_diffuseInput = ...` 的变化能被 WGPUBufferBinding 捕获。
     */
    beforeRender(renderObject: RenderObject)
    {
        super.beforeRender(renderObject);

        const ro = renderObject as any;
        const bindingResources = ro.bindingResources ||= {};
        const r_bindingResources = reactive(bindingResources);

        // u_diffuseInput → material_uniforms（WGSL var<uniform> material_uniforms）
        r_bindingResources.material_uniforms = { value: { u_diffuseInput: this.u_diffuseInput } };
    }
}
