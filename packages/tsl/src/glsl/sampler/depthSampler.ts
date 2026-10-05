import { Sampler } from './sampler';
import { Uniform } from '../../variables/uniform';

/**
 * DepthSampler 类，表示深度纹理采样器
 * 深度纹理在 WGSL 中使用 texture_depth_2d 类型
 */
export class DepthSampler extends Sampler
{
    protected getGLSLSamplerType(): string
    {
        // 深度纹理在 GLSL 中也使用 sampler2D（WebGL2 支持深度纹理采样）
        return 'sampler2D';
    }

    protected getWGSLTextureType(): string
    {
        return 'texture_depth_2d';
    }

    /**
     * 检查是否是深度纹理
     */
    override isDepthTexture(): boolean
    {
        return true;
    }
}

/**
 * 定义深度纹理 sampler 变量
 * 深度纹理在 WGSL 中使用 texture_depth_2d 类型，需要使用 textureLoad 读取
 * @param uniform uniform 变量
 * @returns DepthSampler 实例
 */
export function depthSampler(uniform: Uniform): DepthSampler
{
    return new DepthSampler(uniform);
}
