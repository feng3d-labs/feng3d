import { Color3, Matrix4x4, Vector3 } from '@feng3d/math';
import { Texture2D } from '../textures/Texture2D';

/**
 * Water 材质 uniforms（纯数据接口）。
 *
 * Water-Material 目前仍由 StandardMaterial 占位注册（仓库无 water.wgsl 着色器源码），
 * 但 WaterUniforms 作为 waterLogic 写入 uniforms 的契约保留。
 */
export interface WaterUniforms
{
    /** 透明度 */
    u_alpha: number;
    /** 水体运动时间，waterLogic 自动递增 */
    u_time: number;
    /** 水体展现的尺寸 */
    u_size: number;
    u_distortionScale: number;
    /** 水体颜色 */
    u_waterColor: Color3;
    /** 水体法线图 */
    s_normalSampler: Texture2D;
    /** 镜面反射贴图 */
    s_mirrorSampler: Texture2D;
    u_textureMatrix: Matrix4x4;
    /** 太阳颜色 */
    u_sunColor: Color3;
    /** 太阳方向 */
    u_sunDirection: Vector3;
}

/**
 * 创建默认 WaterUniforms 数据对象。
 */
export function createWaterUniforms(): WaterUniforms
{
    return {
        u_alpha: 1.0,
        u_time: 0.0,
        u_size: 10.0,
        u_distortionScale: 20.0,
        u_waterColor: new Color3().fromUnit(0x555555),
        s_normalSampler: Texture2D.default,
        s_mirrorSampler: Texture2D.default,
        u_textureMatrix: new Matrix4x4(),
        u_sunColor: new Color3().fromUnit(0x7F7F7F),
        u_sunDirection: new Vector3(0.70707, 0.70707, 0),
    };
}

// Water-Material 默认注册统一在 materialLogic.ts 中（暂用 StandardMaterial 占位）
import '../materials/Material';
