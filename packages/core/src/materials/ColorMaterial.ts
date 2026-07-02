import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { serialize } from '@feng3d/serialization';
import { colorFragmentWGSL } from '../shaders/color.fragment.wgsl';
import { colorVertexWGSL } from '../shaders/color.vertex.wgsl';
import { Material } from './Material';
import { BindingResources, BufferBinding, RenderObject } from '@feng3d/webgpu';

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
        // color 着色器配置：通过 reactive 代理一层替换各子状态（renderPipeline 字段在接口中为
        // readonly，属编译期约束；reactive 返回的代理顶层可写，故一层替换合法且能触发响应式更新）。
        const r_pipeline = reactive(this.renderPipeline);
        r_pipeline.vertex = { wgsl: colorVertexWGSL };
        r_pipeline.fragment = { wgsl: colorFragmentWGSL, targets: [{}] };
        r_pipeline.primitive = { cullFace: 'back', frontFace: 'cw' };
        r_pipeline.depthStencil = { depthWriteEnabled: true, depthCompare: 'less' };
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

        const r_material_uniforms = reactive((renderObject.bindingResources.material_uniforms as BufferBinding<{ u_diffuseInput: Color4 }>).value);

        r_material_uniforms.u_diffuseInput = this.u_diffuseInput;
    }
}
