import type { Color4 } from '../core/Color4';
import { Texture2D } from '../textures/Texture2D';
import { TextureCube } from '../textures/TextureCube';
import { Material, MaterialLogic, registerDefaultMaterialFactory } from './Material';
import { reactive, effect, registerLogic } from '@feng3d/reactivity';
import { standardFragmentWGSL } from '../shaders/standard.fragment.wgsl';
import { standardVertexWGSL } from '../shaders/standard.vertex.wgsl';
import { buildSampler, buildTextureView } from '../render/webgpu/MaterialPipeline';

declare module './Material'
{
    export interface MaterialMap
    {
        StandardMaterial: StandardMaterial;
    }
}

/**
 * 雾模式
 */
export enum FogMode
{
    NONE = 0,
    EXP = 1,
    EXP2 = 2,
    LINEAR = 3
}

/**
 * StandardMaterial uniforms。
 */
export interface StandardUniforms
{
    /** 漫反射颜色 */
    readonly u_diffuse: Color4;
    /** 透明度阈值（alpha 测试） */
    readonly u_alphaThreshold: number;
    /** 镜面反射颜色 */
    readonly u_specular: Color4;
    /** 光泽度 */
    readonly u_glossiness: number;
    /** 环境光颜色 */
    readonly u_ambient: Color4;
    /** 反射率 */
    readonly u_reflectivity: number;
    /** 雾起始距离 */
    readonly u_fogMinDistance: number;
    /** 雾结束距离 */
    readonly u_fogMaxDistance: number;
    /** 雾颜色 */
    readonly u_fogColor: Color4;
    /** 雾密度 */
    readonly u_fogDensity: number;
    /** 雾模式 */
    readonly u_fogMode: FogMode;
    /** 是否启用 splat 纹理混合（地形） */
    readonly u_splatEnabled: number;
}

/**
 * 标准材质（纯数据接口）。
 *
 * 使用 standard 着色器（漫反射纹理 + 环境光）。uniform 数据通过 {@link uniforms} 自动传递，
 * 纹理（s_diffuse / s_normal / s_specular / s_ambient / s_envMap）通过 {@link textureViews}
 * 与 {@link samplers} 自动传递（由 materialLogic 监听纹理变化重算绑定）。
 */
export interface StandardMaterial extends Material
{
    readonly __type__: 'StandardMaterial';
    readonly uniforms?: StandardUniforms;
    /** 漫反射纹理 */
    readonly s_diffuse?: Texture2D;
    /** 法线纹理 */
    readonly s_normal?: Texture2D;
    /** 镜面反射光泽图 */
    readonly s_specular?: Texture2D;
    /** 环境纹理 */
    readonly s_ambient?: Texture2D;
    /** 环境映射贴图（立方体） */
    readonly s_envMap?: TextureCube;
    /** 地形混合权重图 */
    readonly s_blendTexture?: Texture2D;
    /** 地形层 1（沙滩） */
    readonly s_splatTexture1?: Texture2D;
    /** 地形层 2（草地） */
    readonly s_splatTexture2?: Texture2D;
    /** 地形层 3（岩石） */
    readonly s_splatTexture3?: Texture2D;
}

/**
 * 创建 StandardMaterial 实例。
 */
export function createStandardMaterial(): StandardMaterial
{
    return {
        __type__: 'StandardMaterial',
        name: '',
        uniforms: {
            u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
            u_alphaThreshold: 0,
            u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
            u_glossiness: 50,
            u_ambient: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
            u_reflectivity: 0,
            u_fogMinDistance: 0,
            u_fogMaxDistance: 100,
            u_fogColor: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
            u_fogDensity: 0.1,
            u_fogMode: FogMode.NONE,
            u_splatEnabled: 0,
        },
        samplers: {},
        textureViews: {},
        externalTextures: {},
        s_diffuse: Texture2D.white,
        s_normal: Texture2D.defaultNormal,
        s_specular: Texture2D.white,
        s_ambient: Texture2D.white,
        s_envMap: TextureCube.default,
        s_blendTexture: Texture2D.white,
        s_splatTexture1: Texture2D.white,
        s_splatTexture2: Texture2D.white,
        s_splatTexture3: Texture2D.white,
    };
}

// 注册默认值（缺失字段自动填充）
registerLogic('StandardMaterial', undefined, {
    name: '',
    uniforms: {
        u_diffuse: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        u_alphaThreshold: 0,
        u_specular: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
        u_glossiness: 50,
        u_ambient: { __type__: 'Color4', r: 1, g: 1, b: 1, a: 1 },
        u_reflectivity: 1,
        u_fogMinDistance: 0,
        u_fogMaxDistance: 100,
        u_fogColor: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
        u_fogDensity: 0.1,
        u_fogMode: FogMode.NONE,
        u_splatEnabled: 0,
    },
    samplers: {},
    textureViews: {},
    externalTextures: {},
    s_diffuse: Texture2D.white,
    s_normal: Texture2D.defaultNormal,
    s_specular: Texture2D.white,
    s_ambient: Texture2D.white,
    s_envMap: TextureCube.default,
    s_blendTexture: Texture2D.white,
    s_splatTexture1: Texture2D.white,
    s_splatTexture2: Texture2D.white,
    s_splatTexture3: Texture2D.white,
});

/**
 * StandardMaterial logic：填入 standard 着色器，监听 5 个纹理变化重算绑定。
 */
export class StandardMaterialLogic extends MaterialLogic
{
    constructor(material: StandardMaterial)
    {
        super(material);

        // standard 着色器配置（一层替换，保留 reactive 可写性）
        const r_pipeline = reactive(this.renderPipeline);
        r_pipeline.vertex = { wgsl: standardVertexWGSL };
        r_pipeline.fragment = { wgsl: standardFragmentWGSL, targets: [{}] };
        r_pipeline.primitive = { topology: 'triangle-list', cullFace: 'back', frontFace: 'cw' };
        r_pipeline.depthStencil = { depthWriteEnabled: true, depthCompare: 'less' };

        const updateTexture = (key: string) =>
        {
            const texture = (material as any)[key];
            material.textureViews[key] = buildTextureView(texture);
            material.samplers[`${key}Sampler`] = buildSampler(texture);
        };

        // 初始化与响应式更新纹理绑定（监听纹理字段变化）
        const keys = ['s_diffuse', 's_normal', 's_specular', 's_ambient', 's_envMap',
            's_blendTexture', 's_splatTexture1', 's_splatTexture2', 's_splatTexture3'];
        for (const key of keys)
        {
            effect(() => updateTexture(key));
        }
    }

    get isLoaded()
    {
        const material = this._material as StandardMaterial;

        return [material.s_diffuse, material.s_normal, material.s_specular, material.s_ambient, material.s_envMap].every(t => t.isLoaded);
    }

    onLoadCompleted(callback: () => void): void
    {
        const material = this._material as StandardMaterial;
        const list = [material.s_diffuse, material.s_normal, material.s_specular, material.s_ambient, material.s_envMap];
        let loadingNum = 0;
        for (const texture of list)
        {
            if (!texture.isLoaded)
            {
                loadingNum++;
                texture.on('loadCompleted', () =>
                {
                    loadingNum--;
                    if (loadingNum === 0) callback();
                });
            }
        }
        if (loadingNum === 0) callback();
    }
}

// 注册到 logic 分发表
registerLogic('StandardMaterial', StandardMaterialLogic);

// 注册默认材质工厂（由 Material.ts 的 ensureDefaultMaterials 惰性调用）
// Default-Material 与 Water-Material（仓库无 water.wgsl，暂用 StandardMaterial 占位）均使用 StandardMaterial。
registerDefaultMaterialFactory('Default-Material', createStandardMaterial);
registerDefaultMaterialFactory('Water-Material', createStandardMaterial);
