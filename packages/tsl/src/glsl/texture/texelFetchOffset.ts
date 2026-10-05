import { Sampler2D } from '../sampler/sampler2D';
import { IVec2 } from '../../types/vector/ivec2';
import { Int } from '../../types/scalar/int';
import { Vec4 } from '../../types/vector/vec4';

/**
 * texelFetchOffset 函数，通过整数像素坐标和偏移直接获取纹理中的单个纹素
 *
 * GLSL: texelFetchOffset(sampler, coord, lod, offset)
 * WGSL: textureLoad(texture, coord + offset, lod) - 需要手动计算偏移
 *
 * @param sampler 2D 纹理采样器
 * @param coord 整数像素坐标（ivec2）
 * @param lod mip 级别（Int 或数字常量）
 * @param offset 整数像素偏移（ivec2）
 * @returns 纹素颜色（vec4）
 */
export function texelFetchOffset(sampler: Sampler2D, coord: IVec2, lod: Int | number, offset: IVec2): Vec4
{
    const result = new Vec4();

    const lodGLSL = typeof lod === 'number' ? lod.toString() : lod.toGLSL();
    const lodWGSL = typeof lod === 'number' ? `${lod}u` : `u32(${lod.toWGSL()})`;

    // GLSL: texelFetchOffset(sampler2D, ivec2, int, ivec2) -> vec4
    result.toGLSL = () => `texelFetchOffset(${sampler.uniform.name}, ${coord.toGLSL()}, ${lodGLSL}, ${offset.toGLSL()})`;

    // WGSL: textureLoad(texture, coord + offset, lod)
    // WGSL 的 textureLoad 没有 offset 参数，需要手动将偏移添加到坐标
    result.toWGSL = () => `textureLoad(${sampler.uniform.name}_texture, ${coord.toWGSL()} + ${offset.toWGSL()}, ${lodWGSL})`;

    result.dependencies = typeof lod === 'number' ? [sampler, coord, offset] : [sampler, coord, lod, offset];

    return result;
}

