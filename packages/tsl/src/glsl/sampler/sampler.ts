import { IElement } from '../../core/IElement';
import { Uniform } from '../../variables/uniform';

/**
 * Sampler 抽象基类，表示纹理采样器
 * @internal 库外部不应直接使用，应使用具体子类 Sampler2D、Sampler2DArray 或 DepthSampler
 */
export abstract class Sampler implements IElement
{
    dependencies: IElement[] = [];

    readonly uniform: Uniform;

    constructor(uniform: Uniform)
    {
        this.uniform = uniform;
    }

    /**
     * 检查是否是深度纹理
     */
    isDepthTexture(): boolean
    {
        return false;
    }

    /**
     * 获取 GLSL 中的 sampler 类型名称
     */
    protected abstract getGLSLSamplerType(): string;

    /**
     * 获取 WGSL 中的 texture 类型名称
     */
    protected abstract getWGSLTextureType(): string;

    /**
     * 转换为 GLSL 代码
     */
    toGLSL(): string
    {
        return `uniform ${this.getGLSLSamplerType()} ${this.uniform.name};`;
    }

    /**
     * 转换为 WGSL 代码
     * 在 WGSL 中，texture 和 sampler 是分离的，需要分别声明
     */
    toWGSL(): string
    {
        const effectiveBinding = this.uniform.getEffectiveBinding() ?? 0;
        const effectiveGroup = this.uniform.getEffectiveGroup();
        // 在 WGSL 中，texture 和 sampler 需要分别声明
        // texture 在 binding，sampler 在 binding+1
        const textureBinding = `@binding(${effectiveBinding}) @group(${effectiveGroup})`;
        const samplerBinding = `@binding(${effectiveBinding + 1}) @group(${effectiveGroup})`;

        return `${textureBinding} var ${this.uniform.name}_texture: ${this.getWGSLTextureType()};\n${samplerBinding} var ${this.uniform.name}: sampler;`;
    }
}
