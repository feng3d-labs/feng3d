import { SamplerComparison } from '../sampler/samplerComparison';
import { Float } from '../../types/scalar/float';
import { Vec2 } from '../../types/vector/vec2';

/**
 * `textureSampleCompare`：用比较采样器对深度纹理做硬件深度比较（阴影贴图）。
 *
 * - WGSL：`textureSampleCompare(texture_depth_2d, sampler_comparison, coord, depthRef)`，
 *   返回 0（被遮挡）或 1（照亮）；
 * - GLSL：`texture(sampler2DShadow, vec3(coord, depthRef))`。
 *
 * @param sampler 比较采样器
 * @param coord 纹理坐标（vec2）
 * @param depthRef 参考深度
 * @returns 比较结果（0 或 1）
 */
export function textureSampleCompare(sampler: SamplerComparison, coord: Vec2, depthRef: Float): Float
{
    const result = new Float();
    result.toGLSL = () => `texture(${sampler.uniform.name}, vec3(${coord.toGLSL()}, ${depthRef.toGLSL()}))`;
    result.toWGSL = () => `textureSampleCompare(${sampler.uniform.name}_texture, ${sampler.uniform.name}, ${coord.toWGSL()}, ${depthRef.toWGSL()})`;
    result.dependencies = [sampler, coord, depthRef];

    return result;
}
