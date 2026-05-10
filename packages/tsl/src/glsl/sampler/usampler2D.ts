import { Sampler } from './sampler';
import { Uniform } from '../../variables/uniform';

/**
 * USampler2D 类，表示无符号整数 2D 纹理采样器
 * 用于采样 rgba8uint 等无符号整数格式的纹理
 */
export class USampler2D extends Sampler
{
    protected getGLSLSamplerType(): string
    {
        return 'usampler2D';
    }

    protected getWGSLTextureType(): string
    {
        return 'texture_2d<u32>';
    }

    /**
     * 检查是否是无符号整数纹理
     */
    isUintTexture(): boolean
    {
        return true;
    }
}

/**
 * 定义 usampler2D 变量（无符号整数 2D 纹理采样器）
 * @param uniform uniform 变量
 * @returns USampler2D 实例
 */
export function usampler2D(uniform: Uniform): USampler2D
{
    return new USampler2D(uniform);
}

