import type { Color4 } from '../core/Color4';
import { Texture2D } from '../textures/Texture2D';
import { TextureCube } from '../textures/TextureCube';
import { Material } from './Material';
import { registerLogic } from '@feng3d/reactivity';

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
    readonly uniforms: StandardUniforms;
    /** 漫反射纹理 */
    readonly s_diffuse: Texture2D;
    /** 法线纹理 */
    readonly s_normal: Texture2D;
    /** 镜面反射光泽图 */
    readonly s_specular: Texture2D;
    /** 环境纹理 */
    readonly s_ambient: Texture2D;
    /** 环境映射贴图（立方体） */
    readonly s_envMap: TextureCube;
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
            u_reflectivity: 1,
            u_fogMinDistance: 0,
            u_fogMaxDistance: 100,
            u_fogColor: { __type__: 'Color4', r: 0, g: 0, b: 0, a: 1 },
            u_fogDensity: 0.1,
            u_fogMode: FogMode.NONE,
        },
        samplers: {},
        textureViews: {},
        externalTextures: {},
        s_diffuse: Texture2D.white,
        s_normal: Texture2D.defaultNormal,
        s_specular: Texture2D.white,
        s_ambient: Texture2D.white,
        s_envMap: TextureCube.default,
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
    },
    samplers: {},
    textureViews: {},
    externalTextures: {},
    s_diffuse: Texture2D.white,
    s_normal: Texture2D.defaultNormal,
    s_specular: Texture2D.white,
    s_ambient: Texture2D.white,
    s_envMap: TextureCube.default,
});
