import { Sampler } from './sampler';
import { Uniform } from '../../variables/uniform';

/**
 * Sampler3D 类，表示 3D 纹理采样器
 */
export class Sampler3D extends Sampler
{
    protected getGLSLSamplerType(): string
    {
        return 'sampler3D';
    }

    protected getWGSLTextureType(): string
    {
        return 'texture_3d<f32>';
    }
}

/**
 * 定义 sampler3D 变量（3D 纹理采样器）
 * @param uniform uniform 变量
 * @returns Sampler3D 实例
 */
export function sampler3D(uniform: Uniform): Sampler3D
{
    return new Sampler3D(uniform);
}

