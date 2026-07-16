import { Texture2D } from '../textures/Texture2D';
import { TextureView } from '@feng3d/webgpu';
import { Material, MaterialLogic } from './Material';
import { reactive, effect, registerLogic } from '@feng3d/reactivity';
import { textureVertexWGSL } from '../shaders/texture.vertex.wgsl';
import { debugShadowMapFragmentWGSL } from '../shaders/debugShadowMap.fragment.wgsl';
import { buildSampler } from '../render/webgpu/MaterialPipeline';

declare module './Material'
{
    export interface MaterialMap
    {
        DebugShadowMapMaterial: DebugShadowMapMaterial;
    }
}

/**
 * 阴影图调试材质 uniforms。
 */
export interface DebugShadowMapUniforms
{
    /** 阴影图纹理尺寸（像素） */
    readonly u_texSize: { x: number; y: number };
}

/**
 * 阴影图调试材质（纯数据接口）。
 *
 * 用 textureLoad 读取 depth 纹理（texture_depth_2d）可视化输出灰度。
 * 用于调试方向光阴影图是否正确写入。
 */
export interface DebugShadowMapMaterial extends Material
{
    readonly __type__: 'DebugShadowMapMaterial';
    readonly uniforms: DebugShadowMapUniforms;
    /** 深度纹理（depth24plus） */
    readonly s_texture: Texture2D;
}

/**
 * 创建 DebugShadowMapMaterial 实例。
 */
export function createDebugShadowMapMaterial(): DebugShadowMapMaterial
{
    return {
        __type__: 'DebugShadowMapMaterial',
        name: '',
        uniforms: { u_texSize: { x: 1024, y: 1024 } },
        samplers: {},
        textureViews: {},
        externalTextures: {},
        s_texture: Texture2D.default,
    };
}

registerLogic('DebugShadowMapMaterial', undefined, {
    name: '',
    uniforms: { u_texSize: { x: 1024, y: 1024 } },
    samplers: {},
    textureViews: {},
    externalTextures: {},
    s_texture: Texture2D.default,
});

/**
 * DebugShadowMapMaterial logic：填入调试着色器，监听 s_texture 变化重算绑定。
 */
export class DebugShadowMapMaterialLogic extends MaterialLogic
{
    constructor(material: DebugShadowMapMaterial)
    {
        super(material);
        reactive(this.renderPipeline.vertex).wgsl = textureVertexWGSL;
        reactive(this.renderPipeline.fragment).wgsl = debugShadowMapFragmentWGSL;
        reactive(this.renderPipeline.primitive).topology = 'triangle-list';
        // 不剔除：调试平面两面都要可见（BillboardComponent 旋转后法线可能翻转）
        reactive(this.renderPipeline.primitive).cullFace = 'none';
        reactive(this.renderPipeline.primitive).frontFace = 'cw';
        // 调试平面不需要深度写入/测试，始终覆盖
        reactive(this.renderPipeline.depthStencil).depthWriteEnabled = false;
        reactive(this.renderPipeline.depthStencil).depthCompare = 'always';

        const updateTexture = () =>
        {
            // depth 纹理（depth24plus）必须用 aspect='depth-only' 的 view，
            // 否则 textureLoad 读取返回 0（aspect='all' 对纯 depth 格式不正确）。
            material.textureViews.s_texture = TextureView.createDepth(material.s_texture as unknown as TextureView['texture']);
            material.samplers.s_textureSampler = buildSampler(material.s_texture);
        };
        effect(updateTexture);
    }

    get isLoaded() { return true; }

    onLoadCompleted(callback: () => void): void { callback(); }
}

registerLogic('DebugShadowMapMaterial', DebugShadowMapMaterialLogic);
