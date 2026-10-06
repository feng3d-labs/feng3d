import { Sampler } from './sampler';
import { Uniform } from '../../variables/uniform';

/**
 * **带 sampler 的深度纹理**（WGSL：`texture_depth_2d` + `sampler`，成对声明）。
 *
 * 与 {@link DepthSampler} 的区别：
 * - `depthSampler` 是**裸深度纹理**（只声明 texture，配 `texelFetch` / `textureLoad` 直接取 texel）；
 * - 本类 texture 与 sampler **成对声明**，配 `texture(...)` 生成 `textureSample(texture, sampler, uv)`
 *   ——做**过滤采样**，与手写的
 *   `var myTexture: texture_depth_2d; var mySampler: sampler;` 完全一致。
 *
 * （`packages/webgpu` 的 `copyDepthTexture` 就是这种形态：深度纹理经采样器线性过滤后拷到普通纹理。）
 */
export class SampledDepthTexture extends Sampler
{
    protected getGLSLSamplerType(): string
    {
        return 'sampler2D';
    }

    protected getWGSLTextureType(): string
    {
        return 'texture_depth_2d';
    }

    /**
     * 仍是深度纹理（影响 GLSL 类型等），但**用 sampler 采样**——
     * `texture()` 依此决定走 textureSample 而不是 textureLoad。
     */
    override isDepthTexture(): boolean
    {
        return true;
    }

    /** 标记：本采样器用 sampler 过滤采样（而非 textureLoad） */
    get sampledBySampler(): boolean
    {
        return true;
    }
}

/**
 * 创建带 sampler 的深度纹理（成对声明 texture_depth_2d + sampler）。
 *
 * @param uniform 绑定点宿主
 * @returns SampledDepthTexture
 */
export function sampledDepthTexture(uniform: Uniform): SampledDepthTexture
{
    return new SampledDepthTexture(uniform);
}
