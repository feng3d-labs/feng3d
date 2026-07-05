import { TextureCube } from '../textures/TextureCube';
import { Material } from './Material';
import { registerDefaults } from '../core/logic';

declare module './Material'
{
    export interface MaterialMap
    {
        SkyBoxMaterial: SkyBoxMaterial;
    }
}

/**
 * 天空盒材质（纯数据接口）。
 *
 * 使用 skybox 着色器（按方向采样立方体纹理），关闭深度写入、深度比较为 less-equal。
 * shader 与渲染状态由 materialLogic 在创建时填充到 renderPipeline，纹理 s_skyboxTexture
 * 通过 materialLogic 监听变化重算 textureViews / samplers。
 */
export interface SkyBoxMaterial extends Material
{
    /** 立方体纹理 */
    s_skyboxTexture: TextureCube;
}

/**
 * 创建 SkyBoxMaterial 实例。
 */
export function createSkyBoxMaterial(): SkyBoxMaterial
{
    return {
        __type__: 'SkyBoxMaterial',
        name: '',
        uniforms: {},
        samplers: {},
        textureViews: {},
        externalTextures: {},
        s_skyboxTexture: TextureCube.default,
    };
}

// 注册默认值（缺失字段自动填充）
registerDefaults('SkyBoxMaterial', {
    name: '',
    uniforms: {},
    samplers: {},
    textureViews: {},
    externalTextures: {},
    s_skyboxTexture: TextureCube.default,
});
