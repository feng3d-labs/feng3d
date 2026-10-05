import { Sampler } from './sampler';
import { Uniform } from '../../variables/uniform';

/**
 * 比较采样器（阴影贴图用）。
 *
 * WGSL 里是 `texture_depth_2d` + `sampler_comparison` 的组合，配合 `textureSampleCompare`
 * 做硬件 PCF 深度比较；GLSL 里对应 `sampler2DShadow`。
 */
export class SamplerComparison extends Sampler
{
    protected getGLSLSamplerType(): string
    {
        return 'sampler2DShadow';
    }

    protected getWGSLTextureType(): string
    {
        return 'texture_depth_2d';
    }

    protected override getWGSLSamplerType(): string
    {
        return 'sampler_comparison';
    }

    override isDepthTexture(): boolean
    {
        return true;
    }
}

/**
 * 定义比较采样器变量（阴影贴图）
 *
 * @param uniform uniform 变量
 * @returns SamplerComparison 实例
 */
export function samplerComparison(uniform: Uniform): SamplerComparison
{
    return new SamplerComparison(uniform);
}
