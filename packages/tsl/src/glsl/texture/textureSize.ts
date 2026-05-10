import { Sampler2D } from '../sampler/sampler2D';
import { Sampler2DArray } from '../sampler/sampler2DArray';
import { Sampler3D } from '../sampler/sampler3D';
import { USampler2D } from '../sampler/usampler2D';
import { DepthSampler } from '../sampler/depthSampler';
import { IVec2 } from '../../types/vector/ivec2';
import { Int } from '../../types/scalar/int';

/**
 * textureSize 函数，获取 2D 纹理的尺寸
 * @param sampler 2D 纹理采样器
 * @returns 纹理尺寸（ivec2）
 */
export function textureSize(sampler: Sampler2D): IVec2;
/**
 * textureSize 函数，获取 2D 纹理的尺寸
 * @param sampler 2D 纹理采样器
 * @param lod mip 级别（Int 类型）
 * @returns 纹理尺寸（ivec2）
 */
export function textureSize(sampler: Sampler2D, lod: Int): IVec2;
/**
 * textureSize 函数，获取 2D 纹理的尺寸
 * @param sampler 2D 纹理采样器
 * @param lod mip 级别（数字常量）
 * @returns 纹理尺寸（ivec2）
 */
export function textureSize(sampler: Sampler2D, lod: number): IVec2;
/**
 * textureSize 函数，获取无符号整数纹理的尺寸
 * @param sampler 无符号整数纹理采样器
 * @returns 纹理尺寸（ivec2）
 */
export function textureSize(sampler: USampler2D): IVec2;
/**
 * textureSize 函数，获取无符号整数纹理的尺寸
 * @param sampler 无符号整数纹理采样器
 * @param lod mip 级别（Int 类型）
 * @returns 纹理尺寸（ivec2）
 */
export function textureSize(sampler: USampler2D, lod: Int): IVec2;
/**
 * textureSize 函数，获取无符号整数纹理的尺寸
 * @param sampler 无符号整数纹理采样器
 * @param lod mip 级别（数字常量）
 * @returns 纹理尺寸（ivec2）
 */
export function textureSize(sampler: USampler2D, lod: number): IVec2;
/**
 * textureSize 函数，获取深度纹理的尺寸
 * @param sampler 深度纹理采样器
 * @returns 纹理尺寸（ivec2）
 */
export function textureSize(sampler: DepthSampler): IVec2;
/**
 * textureSize 函数，获取深度纹理的尺寸
 * @param sampler 深度纹理采样器
 * @param lod mip 级别（Int 类型）
 * @returns 纹理尺寸（ivec2）
 */
export function textureSize(sampler: DepthSampler, lod: Int): IVec2;
/**
 * textureSize 函数，获取深度纹理的尺寸
 * @param sampler 深度纹理采样器
 * @param lod mip 级别（数字常量）
 * @returns 纹理尺寸（ivec2）
 */
export function textureSize(sampler: DepthSampler, lod: number): IVec2;
/**
 * textureSize 函数，获取纹理数组的尺寸
 * @param sampler 纹理数组采样器
 * @returns 纹理尺寸（ivec2）
 */
export function textureSize(sampler: Sampler2DArray): IVec2;
/**
 * textureSize 函数，获取纹理数组的尺寸
 * @param sampler 纹理数组采样器
 * @param lod mip 级别（Int 类型）
 * @returns 纹理尺寸（ivec2）
 */
export function textureSize(sampler: Sampler2DArray, lod: Int): IVec2;
/**
 * textureSize 函数，获取纹理数组的尺寸
 * @param sampler 纹理数组采样器
 * @param lod mip 级别（数字常量）
 * @returns 纹理尺寸（ivec2）
 */
export function textureSize(sampler: Sampler2DArray, lod: number): IVec2;
/**
 * textureSize 函数，获取 3D 纹理的尺寸
 * @param sampler 3D 纹理采样器
 * @returns 纹理尺寸（ivec2）
 */
export function textureSize(sampler: Sampler3D): IVec2;
/**
 * textureSize 函数，获取 3D 纹理的尺寸
 * @param sampler 3D 纹理采样器
 * @param lod mip 级别（Int 类型）
 * @returns 纹理尺寸（ivec2）
 */
export function textureSize(sampler: Sampler3D, lod: Int): IVec2;
/**
 * textureSize 函数，获取 3D 纹理的尺寸
 * @param sampler 3D 纹理采样器
 * @param lod mip 级别（数字常量）
 * @returns 纹理尺寸（ivec2）
 */
export function textureSize(sampler: Sampler3D, lod: number): IVec2;
export function textureSize(
    sampler: Sampler2D | Sampler2DArray | Sampler3D | USampler2D | DepthSampler,
    lod?: Int | number,
): IVec2
{
    const result = new (IVec2 as any)();

    const lodValue = lod ?? 0;
    const lodGLSL = typeof lodValue === 'number' ? lodValue.toString() : lodValue.toGLSL();
    // WGSL 的 textureDimensions 返回 vec2<u32>，需要转换为 vec2<i32>
    const lodWGSL = typeof lodValue === 'number' ? lodValue.toString() : lodValue.toWGSL();

    result.toGLSL = () => `textureSize(${sampler.uniform.name}, ${lodGLSL})`;
    result.toWGSL = () => `vec2<i32>(textureDimensions(${sampler.uniform.name}_texture, ${lodWGSL}))`;
    result.dependencies = typeof lodValue === 'number' ? [sampler] : [sampler, lodValue];

    return result;
}
