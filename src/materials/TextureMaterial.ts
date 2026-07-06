import type { Color4 } from '../core/Color4';
import { Texture2D } from '../textures/Texture2D';
import { Material } from './Material';
import { registerDefaults } from '../core/logic';

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
registerDefaults('TextureMaterial', {
    name: '',
    uniforms: { u_color: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 } },
    samplers: {},
    textureViews: {},
    externalTextures: {},
    s_texture: Texture2D.default,
});
