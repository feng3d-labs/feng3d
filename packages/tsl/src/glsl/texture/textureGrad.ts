import { Sampler } from '../sampler/sampler';
import { Vec2 } from '../../types/vector/vec2';
import { Vec4 } from '../../types/vector/vec4';

/**
 * textureGrad 函数，使用显式梯度进行纹理查找
 * GLSL: textureGrad(sampler, coord, dPdx, dPdy)
 * WGSL: textureSampleGrad(texture, sampler, coord, dPdx, dPdy)
 *
 * @param sampler 纹理采样器
 * @param coord 纹理坐标（vec2）
 * @param dPdx 纹理坐标相对于屏幕空间 x 方向的导数
 * @param dPdy 纹理坐标相对于屏幕空间 y 方向的导数
 * @returns 采样结果（vec4）
 */
export function textureGrad(sampler: Sampler, coord: Vec2, dPdx: Vec2, dPdy: Vec2): Vec4
{
    const result = new Vec4();

    result.toGLSL = () => `textureGrad(${sampler.uniform.name}, ${coord.toGLSL()}, ${dPdx.toGLSL()}, ${dPdy.toGLSL()})`;

    // 在 WGSL 中，需要分别引用 texture 和 sampler
    // textureSampleGrad(texture, sampler, coord, dPdx, dPdy)
    result.toWGSL = () => `textureSampleGrad(${sampler.uniform.name}_texture, ${sampler.uniform.name}, ${coord.toWGSL()}, ${dPdx.toWGSL()}, ${dPdy.toWGSL()})`;

    result.dependencies = [sampler, coord, dPdx, dPdy];

    return result;
}

