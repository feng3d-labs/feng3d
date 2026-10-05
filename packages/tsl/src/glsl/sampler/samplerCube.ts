import { Sampler } from './sampler';
import { Uniform } from '../../variables/uniform';

/**
 * SamplerCube 类，表示立方体贴图采样器（天空盒、环境反射）
 */
export class SamplerCube extends Sampler
{
    protected getGLSLSamplerType(): string
    {
        return 'samplerCube';
    }

    protected getWGSLTextureType(): string
    {
        return 'texture_cube<f32>';
    }
}

/**
 * 定义 samplerCube 变量（立方体贴图采样器）
 *
 * @param uniform uniform 变量
 * @returns SamplerCube 实例
 */
export function samplerCube(uniform: Uniform): SamplerCube
{
    return new SamplerCube(uniform);
}
