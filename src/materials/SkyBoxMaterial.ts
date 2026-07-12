import { TextureCube } from '../textures/TextureCube';
import { Material, MaterialLogic } from './Material';
import { reactive, effect, registerLogic } from '@feng3d/reactivity';
import { skyboxFragmentWGSL } from '../shaders/skybox.fragment.wgsl';
import { skyboxVertexWGSL } from '../shaders/skybox.vertex.wgsl';
import { buildSampler, buildTextureView } from '../render/webgpu/MaterialPipeline';

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
    readonly __type__: 'SkyBoxMaterial';
    /** 立方体纹理 */
    readonly s_skyboxTexture: TextureCube;
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
registerLogic('SkyBoxMaterial', undefined, {
    name: '',
    uniforms: {},
    samplers: {},
    textureViews: {},
    externalTextures: {},
    s_skyboxTexture: TextureCube.default,
});

/**
 * SkyBoxMaterial logic：填入 skybox 着色器，不剔除、关闭深度写入、深度比较 less-equal。
 */
export class SkyBoxMaterialLogic extends MaterialLogic
{
    constructor(material: SkyBoxMaterial)
    {
        super(material);
        reactive(this.renderPipeline.vertex).wgsl = skyboxVertexWGSL;
        reactive(this.renderPipeline.fragment).wgsl = skyboxFragmentWGSL;
        reactive(this.renderPipeline.primitive).cullFace = 'none';
        reactive(this.renderPipeline.depthStencil).depthWriteEnabled = false;
        reactive(this.renderPipeline.depthStencil).depthCompare = 'less-equal';

        const updateTexture = () =>
        {
            material.textureViews.s_skyboxTexture = buildTextureView(material.s_skyboxTexture);
            material.samplers.s_skyboxTextureSampler = buildSampler(material.s_skyboxTexture);
        };
        effect(updateTexture);
    }

    get isLoaded() { return (this._material as SkyBoxMaterial).s_skyboxTexture.isLoaded; }

    onLoadCompleted(callback: () => void): void
    {
        const texture = (this._material as SkyBoxMaterial).s_skyboxTexture;
        if (texture.isLoaded) { callback(); return; }
        texture.on('loadCompleted', callback);
    }
}

// 注册到 logic 分发表
registerLogic('SkyBoxMaterial', SkyBoxMaterialLogic);
