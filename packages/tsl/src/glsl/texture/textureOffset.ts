import { Sampler2D } from '../sampler/sampler2D';
import { IVec2 } from '../../types/vector/ivec2';
import { Vec2 } from '../../types/vector/vec2';
import { Vec4 } from '../../types/vector/vec4';

/**
 * textureOffset 函数，对纹理坐标应用整数像素偏移进行采样
 *
 * GLSL: textureOffset(sampler, coord, offset)
 * WGSL: textureSample(texture, sampler, coord, offset) - 注意：WGSL 中的 offset 必须是编译时常量
 *
 * @param sampler 2D 纹理采样器
 * @param coord 纹理坐标（vec2，0-1 范围）
 * @param offset 整数像素偏移（ivec2）- 必须是编译时常量
 * @returns 采样结果（vec4）
 */
export function textureOffset(sampler: Sampler2D, coord: Vec2, offset: IVec2): Vec4
{
    const result = new Vec4();

    // GLSL: textureOffset(sampler2D, vec2, ivec2) -> vec4
    result.toGLSL = () => `textureOffset(${sampler.uniform.name}, ${coord.toGLSL()}, ${offset.toGLSL()})`;

    // WGSL: textureSample(texture, sampler, coord, offset)
    // 注意：WGSL 的 offset 参数必须是编译时常量（const_expr）
    result.toWGSL = () => `textureSample(${sampler.uniform.name}_texture, ${sampler.uniform.name}, ${coord.toWGSL()}, ${offset.toWGSL()})`;

    result.dependencies = [sampler, coord, offset];

    return result;
}

