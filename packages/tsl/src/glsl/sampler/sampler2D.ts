import { Sampler } from './sampler';
import { Uniform } from '../../variables/uniform';

/**
 * Sampler2D 类，表示 2D 纹理采样器
 */
export class Sampler2D extends Sampler
{
    protected getGLSLSamplerType(): string
    {
        return 'sampler2D';
    }

    protected getWGSLTextureType(): string
    {
        return 'texture_2d<f32>';
    }
}

/**
 * 定义 sampler2D 变量（2D 纹理采样器）
 * @param uniform uniform 变量
 * @returns Sampler2D 实例
 */
export function sampler2D(uniform: Uniform): Sampler2D
{
    return new Sampler2D(uniform);
}
