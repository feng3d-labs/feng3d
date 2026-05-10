import { formatNumber } from '../../core/formatNumber';
import { Float } from '../../types/scalar/float';
import { Vec2 } from '../../types/vector/vec2';
import { Vec4 } from '../../types/vector/vec4';
import { Sampler2D } from '../sampler/sampler2D';

/**
 * textureLod 函数，使用显式 LOD 进行纹理查找
 * GLSL: textureLod(sampler, coord, lod)
 * WGSL: textureSampleLevel(texture, sampler, coord, lod)
 *
 * @param sampler 纹理采样器
 * @param coord 纹理坐标（vec2）
 * @param lod 显式 mipmap 级别
 * @returns 采样结果（vec4）
 */
export function textureLod(sampler: Sampler2D, coord: Vec2, lod: Float): Vec4;
export function textureLod(sampler: Sampler2D, coord: Vec2, lod: number): Vec4;
export function textureLod(sampler: Sampler2D, coord: Vec2, lod: Float | number): Vec4
{
    const result = new Vec4();

    const lodGLSL = typeof lod === 'number' ? formatNumber(lod) : lod.toGLSL();
    const lodWGSL = typeof lod === 'number' ? formatNumber(lod) : lod.toWGSL();

    result.toGLSL = () => `textureLod(${sampler.uniform.name}, ${coord.toGLSL()}, ${lodGLSL})`;

    // 在 WGSL 中，需要分别引用 texture 和 sampler
    // textureSampleLevel(texture, sampler, coord, lod)
    result.toWGSL = () => `textureSampleLevel(${sampler.uniform.name}_texture, ${sampler.uniform.name}, ${coord.toWGSL()}, ${lodWGSL})`;

    result.dependencies = typeof lod === 'number' ? [sampler, coord] : [sampler, coord, lod];

    return result;
}

