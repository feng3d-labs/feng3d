import { Sampler } from './sampler';
import { Uniform } from '../../variables/uniform';

/**
 * Sampler2DArray 类，表示 2D 纹理数组采样器
 */
export class Sampler2DArray extends Sampler
{
    protected getGLSLSamplerType(): string
    {
        return 'sampler2DArray';
    }

    protected getWGSLTextureType(): string
    {
        return 'texture_2d_array<f32>';
    }
}

/**
 * 定义 sampler2DArray 变量（2D 纹理数组采样器）
 * @param uniform uniform 变量
 * @returns Sampler2DArray 实例
 */
export function sampler2DArray(uniform: Uniform): Sampler2DArray
{
    return new Sampler2DArray(uniform);
}
