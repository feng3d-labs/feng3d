import { Color4 } from '@feng3d/math';
import { oav } from '@feng3d/objectview';
import { decoratorRegisterClass } from '@feng3d/polyfill';
import { reactive } from '@feng3d/reactivity';
import { serialize } from '@feng3d/serialization';
import { textureFragmentWGSL } from '../shaders/texture.fragment.wgsl';
import { textureVertexWGSL } from '../shaders/texture.vertex.wgsl';
import { buildSampler, buildTextureView } from '../render/webgpu/MaterialPipeline';
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
 * 填充到 {@link Material.renderPipeline}，纹理通过 {@link Material.textureViews}
 * 与 {@link Material.samplers} 提供给 webgpu（由基类 beforeRender 自动合并）。
 */
@decoratorRegisterClass()
export class TextureMaterial extends Material
{
    readonly uniforms = { u_color: new Color4() };

    /** 纹理 */
    @oav()
    @serialize
    get s_texture() { return this._s_texture; }
    set s_texture(v) { this._s_texture = v; this._updateTextureBindings(); }
    private _s_texture = Texture2D.default;

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

        this._updateTextureBindings();
    }

    /**
     * 更新纹理相关的绑定（textureViews / samplers）。
     */
    private _updateTextureBindings()
    {
        this.textureViews.s_texture = buildTextureView(this._s_texture);
        this.samplers.s_textureSampler = buildSampler(this._s_texture);
    }

    /**
     * 是否加载完成
     */
    override get isLoaded()
    {
        return this._s_texture.isLoaded;
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
        this._s_texture.on('loadCompleted', callback);
    }
}
