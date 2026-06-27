import type { Texture } from './Texture';

/**
 * 渲染目标描述
 */
export interface RenderTargetDescriptor
{
    /**
     * 宽度
     */
    width: number;

    /**
     * 高度
     */
    height: number;

    /**
     * 颜色纹理格式
     */
    colorFormat?: GPUTextureFormat;

    /**
     * 深度纹理格式
     */
    depthFormat?: GPUTextureFormat;

    /**
     * 采样数
     */
    sampleCount?: 1 | 4;

    /**
     * 标签
     */
    label?: string;
}

/**
 * 渲染目标
 *
 * 用于渲染到纹理的场景，例如阴影贴图、反射贴图、后处理等。
 */
export interface RenderTarget
{
    /**
     * 渲染目标描述
     */
    descriptor: RenderTargetDescriptor;

    /**
     * 颜色纹理
     */
    colorTexture?: Texture;

    /**
     * 深度纹理
     */
    depthTexture?: Texture;

    /**
     * 颜色纹理视图
     */
    colorTextureView?: GPUTextureView;

    /**
     * 深度纹理视图
     */
    depthTextureView?: GPUTextureView;

    /**
     * GPU 纹理
     */
    _gpuColorTexture?: GPUTexture;

    /**
     * GPU 深度纹理
     */
    _gpuDepthTexture?: GPUTexture;
}

/**
 * 渲染目标类
 */
export class RenderTarget
{
    /**
     * 创建渲染目标描述
     */
    static createDescriptor(options: {
        width: number;
        height: number;
        colorFormat?: GPUTextureFormat;
        depthFormat?: GPUTextureFormat;
        sampleCount?: 1 | 4;
        label?: string;
    }): RenderTargetDescriptor
    {
        return {
            width: options.width,
            height: options.height,
            colorFormat: options.colorFormat || 'rgba8unorm',
            depthFormat: options.depthFormat || 'depth24plus-stencil8',
            sampleCount: options.sampleCount || 1,
            label: options.label,
        };
    }

    /**
     * 获取宽度
     */
    static getWidth(renderTarget: RenderTarget): number
    {
        return renderTarget.descriptor.width;
    }

    /**
     * 获取高度
     */
    static getHeight(renderTarget: RenderTarget): number
    {
        return renderTarget.descriptor.height;
    }

    /**
     * 获取尺寸
     */
    static getSize(renderTarget: RenderTarget): [number, number]
    {
        return [renderTarget.descriptor.width, renderTarget.descriptor.height];
    }

    /**
     * 销毁渲染目标
     */
    static destroy(renderTarget: RenderTarget): void
    {
        if (renderTarget._gpuColorTexture)
        {
            renderTarget._gpuColorTexture.destroy();
            renderTarget._gpuColorTexture = undefined;
        }
        if (renderTarget._gpuDepthTexture)
        {
            renderTarget._gpuDepthTexture.destroy();
            renderTarget._gpuDepthTexture = undefined;
        }
    }
}