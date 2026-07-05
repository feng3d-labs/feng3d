import { Color3, Color4 } from '@feng3d/math';
import { Texture2D } from '../textures/Texture2D';
import { TextureCube } from '../textures/TextureCube';
import { Material } from './Material';
import { registerDefaults } from '../core/logic';

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
    u_diffuse: Color4;
    /** 透明度阈值（alpha 测试） */
    u_alphaThreshold: number;
    /** 镜面反射颜色 */
    u_specular: Color3;
    /** 光泽度 */
    u_glossiness: number;
    /** 环境光颜色 */
    u_ambient: Color4;
    /** 反射率 */
    u_reflectivity: number;
    /** 雾起始距离 */
    u_fogMinDistance: number;
    /** 雾结束距离 */
    u_fogMaxDistance: number;
    /** 雾颜色 */
    u_fogColor: Color3;
    /** 雾密度 */
    u_fogDensity: number;
    /** 雾模式 */
    u_fogMode: FogMode;
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
    readonly uniforms: StandardUniforms;
    /** 漫反射纹理 */
    s_diffuse: Texture2D;
    /** 法线纹理 */
    s_normal: Texture2D;
    /** 镜面反射光泽图 */
    s_specular: Texture2D;
    /** 环境纹理 */
    s_ambient: Texture2D;
    /** 环境映射贴图（立方体） */
    s_envMap: TextureCube;
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
            u_diffuse: new Color4(1, 1, 1, 1),
            u_alphaThreshold: 0,
            u_specular: new Color3(),
            u_glossiness: 50,
            u_ambient: new Color4(),
            u_reflectivity: 1,
            u_fogMinDistance: 0,
            u_fogMaxDistance: 100,
            u_fogColor: new Color3(),
            u_fogDensity: 0.1,
            u_fogMode: FogMode.NONE,
        },
        samplers: {},
        textureViews: {},
        externalTextures: {},
        s_diffuse: Texture2D.default,
        s_normal: Texture2D.defaultNormal,
        s_specular: Texture2D.default,
        s_ambient: Texture2D.default,
        s_envMap: TextureCube.default,
    };
}

// 注册默认值（缺失字段自动填充）
registerDefaults('StandardMaterial', {
    name: '',
    uniforms: {
        u_diffuse: new Color4(1, 1, 1, 1),
        u_alphaThreshold: 0,
        u_specular: new Color3(),
        u_glossiness: 50,
        u_ambient: new Color4(),
        u_reflectivity: 1,
        u_fogMinDistance: 0,
        u_fogMaxDistance: 100,
        u_fogColor: new Color3(),
        u_fogDensity: 0.1,
        u_fogMode: FogMode.NONE,
    },
    samplers: {},
    textureViews: {},
    externalTextures: {},
    s_diffuse: Texture2D.default,
    s_normal: Texture2D.defaultNormal,
    s_specular: Texture2D.default,
    s_ambient: Texture2D.default,
    s_envMap: TextureCube.default,
});
