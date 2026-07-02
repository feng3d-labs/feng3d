import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { serialize } from '@feng3d/serialization';
import { RenderObject } from '@feng3d/webgpu';
import { buildTextureSampler } from '../render/webgpu/MaterialPipeline';
import { textureFragmentWGSL } from '../shaders/texture.fragment.wgsl';
import { textureVertexWGSL } from '../shaders/texture.vertex.wgsl';
import { Texture2D } from '../textures/Texture2D';
import { Material } from './Material';

/**
 * 纹理材质 uniforms（保留供编辑器等旧代码做类型断言使用）。
 */
@decoratorRegisterClass()
export class TextureUniforms
{
    __class__: 'TextureUniforms';
    /**
     * 颜色
     */
    @serialize
    @oav()
    u_color = new Color4();

    /**
     * 纹理数据
     */
    @oav()
    @serialize
    s_texture = Texture2D.default;
}

/**
 * 纹理材质。
 *
 * 使用 texture 着色器（采样纹理 × 材质颜色）。shader 与渲染状态在构造时
 * 填充到 {@link Material.renderPipeline}，纹理字段直接作为实例属性。
 */
@decoratorRegisterClass()
export class TextureMaterial extends Material
{
    readonly uniforms: TextureUniforms = new TextureUniforms();

    constructor()
    {
        super();
        reactive(this.renderPipeline.vertex).wgsl = textureVertexWGSL;
        reactive(this.renderPipeline.fragment).wgsl = textureFragmentWGSL;
        reactive(this.renderPipeline.primitive).topology = 'triangle-list';
        reactive(this.renderPipeline.primitive).cullFace = 'back';
        reactive(this.renderPipeline.primitive).frontFace = 'cw';
        reactive(this.renderPipeline.depthStencil).depthWriteEnabled = true;
        reactive(this.renderPipeline.depthStencil).depthCompare = 'less';
    }

    beforeRender(renderObject: RenderObject)
    {
        super.beforeRender(renderObject);

        const ro = renderObject as any;
        const bindingResources = ro.bindingResources ||= {};
        const r_bindingResources = reactive(bindingResources);

        r_bindingResources.material_uniforms = {
            value: {
                u_color: this.uniforms.u_color,
            },
        };
        r_bindingResources.s_texture = buildTextureSampler(this.uniforms.s_texture);
    }

    /**
     * 是否加载完成
     */
    override get isLoaded()
    {
        return this.uniforms.s_texture.isLoaded;
    }

    /**
     * 已加载完成或者加载完成时立即调用
     */
    override onLoadCompleted(callback: () => void)
    {
        if (this.isLoaded)
        {
            callback();

            return;
        }
        this.uniforms.s_texture.on('loadCompleted', callback);
    }
}
