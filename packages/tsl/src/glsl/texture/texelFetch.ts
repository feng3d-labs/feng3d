import { Sampler2D } from '../sampler/sampler2D';
import { USampler2D } from '../sampler/usampler2D';
import { IVec2 } from '../../types/vector/ivec2';
import { Int } from '../../types/scalar/int';
import { Uvec4 } from '../../types/vector/uvec4';
import { Vec4 } from '../../types/vector/vec4';

/**
 * texelFetch 函数，通过整数像素坐标直接获取无符号整数纹理中的单个纹素
 * @param sampler 无符号整数纹理采样器
 * @param coord 整数像素坐标 (ivec2)
 * @returns 纹素颜色（uvec4）
 */
export function texelFetch(sampler: USampler2D, coord: IVec2): Uvec4;
/**
 * texelFetch 函数，通过整数像素坐标直接获取无符号整数纹理中的单个纹素
 * @param sampler 无符号整数纹理采样器
 * @param coord 整数像素坐标 (ivec2)
 * @param lod mip 级别（Int 类型）
 * @returns 纹素颜色（uvec4）
 */
export function texelFetch(sampler: USampler2D, coord: IVec2, lod: Int): Uvec4;
/**
 * texelFetch 函数，通过整数像素坐标直接获取无符号整数纹理中的单个纹素
 * @param sampler 无符号整数纹理采样器
 * @param coord 整数像素坐标 (ivec2)
 * @param lod mip 级别（数字常量）
 * @returns 纹素颜色（uvec4）
 */
export function texelFetch(sampler: USampler2D, coord: IVec2, lod: number): Uvec4;
/**
 * texelFetch 函数，通过整数像素坐标直接获取纹理中的单个纹素
 * @param sampler 2D 纹理采样器
 * @param coord 整数像素坐标 (ivec2)
 * @returns 纹素颜色（vec4）
 */
export function texelFetch(sampler: Sampler2D, coord: IVec2): Vec4;
/**
 * texelFetch 函数，通过整数像素坐标直接获取纹理中的单个纹素
 * @param sampler 2D 纹理采样器
 * @param coord 整数像素坐标 (ivec2)
 * @param lod mip 级别（Int 类型）
 * @returns 纹素颜色（vec4）
 */
export function texelFetch(sampler: Sampler2D, coord: IVec2, lod: Int): Vec4;
/**
 * texelFetch 函数，通过整数像素坐标直接获取纹理中的单个纹素
 * @param sampler 2D 纹理采样器
 * @param coord 整数像素坐标 (ivec2)
 * @param lod mip 级别（数字常量）
 * @returns 纹素颜色（vec4）
 */
export function texelFetch(sampler: Sampler2D, coord: IVec2, lod: number): Vec4;
export function texelFetch(
    sampler: Sampler2D | USampler2D,
    coord: IVec2,
    lod?: Int | number,
): Vec4 | Uvec4
{
    const isUintTexture = sampler instanceof USampler2D;
    const result = isUintTexture ? new Uvec4() : new Vec4();

    const lodValue = lod ?? 0;
    const lodGLSL = typeof lodValue === 'number' ? lodValue.toString() : lodValue.toGLSL();
    const lodWGSL = typeof lodValue === 'number' ? `${lodValue}u` : `u32(${lodValue.toWGSL()})`;

    // GLSL: texelFetch(sampler2D/usampler2D, ivec2, int) -> vec4/uvec4
    // WGSL: textureLoad(texture, vec2<i32>, u32) -> vec4<f32>/vec4<u32>
    result.toGLSL = () => `texelFetch(${sampler.uniform.name}, ${coord.toGLSL()}, ${lodGLSL})`;
    result.toWGSL = () => `textureLoad(${sampler.uniform.name}_texture, ${coord.toWGSL()}, ${lodWGSL})`;
    result.dependencies = typeof lodValue === 'number' ? [sampler, coord] : [sampler, coord, lodValue];

    return result;
}
