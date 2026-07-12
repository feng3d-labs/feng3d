import type { Color4 } from '../core/Color4';
import { Texture2D } from '../textures/Texture2D';
import { Material, MaterialLogic } from './Material';
import { reactive, effect, registerLogic } from '@feng3d/reactivity';
import { textureFragmentWGSL } from '../shaders/texture.fragment.wgsl';
import { textureVertexWGSL } from '../shaders/texture.vertex.wgsl';
import { buildSampler, buildTextureView } from '../render/webgpu/MaterialPipeline';

declare module './Material'
{
    export interface MaterialMap
    {
        TextureMaterial: TextureMaterial;
    }
}

/**
 * 纹理材质 uniforms（颜色）。
 */
export interface TextureUniforms
{
    /** 颜色 */
    readonly u_color: Color4;
}

/**
 * 纹理材质（纯数据接口）。
 *
 * 使用 texture 着色器（采样纹理 × 材质颜色）。shader 与渲染状态由 materialLogic 在
 * 创建时填充到 renderPipeline，纹理 s_texture 通过 materialLogic 监听变化重算
 * textureViews / samplers。
 */
export interface TextureMaterial extends Material
{
    readonly __type__: 'TextureMaterial';
    readonly uniforms: TextureUniforms;
    /** 纹理 */
    readonly s_texture: Texture2D;
}

/**
 * 创建 TextureMaterial 实例。
 */
export function createTextureMaterial(): TextureMaterial
{
    return {
        __type__: 'TextureMaterial',
        name: '',
        uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
        samplers: {},
        textureViews: {},
        externalTextures: {},
        s_texture: Texture2D.default,
    };
}

// 注册默认值（缺失字段自动填充）
registerLogic('TextureMaterial', undefined, {
    name: '',
    uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
    samplers: {},
    textureViews: {},
    externalTextures: {},
    s_texture: Texture2D.default,
});

/**
 * TextureMaterial logic：填入 texture 着色器，监听 s_texture 变化重算绑定。
 */
export class TextureMaterialLogic extends MaterialLogic
{
    constructor(material: TextureMaterial)
    {
        super(material);
        reactive(this.renderPipeline.vertex).wgsl = textureVertexWGSL;
        reactive(this.renderPipeline.fragment).wgsl = textureFragmentWGSL;
        reactive(this.renderPipeline.primitive).topology = 'triangle-list';
        reactive(this.renderPipeline.primitive).cullFace = 'back';
        reactive(this.renderPipeline.primitive).frontFace = 'cw';
        reactive(this.renderPipeline.depthStencil).depthWriteEnabled = true;
        reactive(this.renderPipeline.depthStencil).depthCompare = 'less';

        const updateTexture = () =>
        {
            material.textureViews.s_texture = buildTextureView(material.s_texture);
            material.samplers.s_textureSampler = buildSampler(material.s_texture);
        };
        effect(updateTexture);
    }

    get isLoaded() { return (this._material as TextureMaterial).s_texture.isLoaded; }

    onLoadCompleted(callback: () => void): void
    {
        const texture = (this._material as TextureMaterial).s_texture;
        if (texture.isLoaded) { callback(); return; }
        texture.on('loadCompleted', callback);
    }
}

// 注册到 logic 分发表
registerLogic('TextureMaterial', TextureMaterialLogic);
