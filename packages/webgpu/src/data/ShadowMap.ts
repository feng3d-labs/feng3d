import type { RenderTarget } from './RenderTarget';

/**
 * 阴影贴图描述
 */
export interface ShadowMapDescriptor
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
     * 阴影贴图类型
     */
    shadowType?: 'point' | 'directional' | 'spot';

    /**
     * 标签
     */
    label?: string;
}

/**
 * 阴影贴图
 *
 * 用于阴影渲染的渲染目标。
 */
export interface ShadowMap
{
    /**
     * 阴影贴图描述
     */
    descriptor: ShadowMapDescriptor;

    /**
     * 渲染目标
     */
    renderTarget?: RenderTarget;

    /**
     * 纹理视图
     */
    textureView?: GPUTextureView;

    /**
     * GPU 纹理
     */
    _gpuTexture?: GPUTexture;

    /**
     * 灯光 ID
     */
    lightId?: string;
}

/**
 * 阴影贴图类
 */
export class ShadowMap
{
    /**
     * 创建阴影贴图描述
     */
    static createDescriptor(options: {
        width: number;
        height: number;
        shadowType?: 'point' | 'directional' | 'spot';
        label?: string;
    }): ShadowMapDescriptor
    {
        return {
            width: options.width,
            height: options.height,
            shadowType: options.shadowType || 'directional',
            label: options.label,
        };
    }

    /**
     * 获取宽度
     */
    static getWidth(shadowMap: ShadowMap): number
    {
        return shadowMap.descriptor.width;
    }

    /**
     * 获取高度
     */
    static getHeight(shadowMap: ShadowMap): number
    {
        return shadowMap.descriptor.height;
    }

    /**
     * 获取尺寸
     */
    static getSize(shadowMap: ShadowMap): [number, number]
    {
        return [shadowMap.descriptor.width, shadowMap.descriptor.height];
    }

    /**
     * 销毁阴影贴图
     */
    static destroy(shadowMap: ShadowMap): void
    {
        if (shadowMap._gpuTexture)
        {
            shadowMap._gpuTexture.destroy();
            shadowMap._gpuTexture = undefined;
        }
        if (shadowMap.renderTarget)
        {
            if (shadowMap.renderTarget._gpuColorTexture)
            {
                shadowMap.renderTarget._gpuColorTexture.destroy();
                shadowMap.renderTarget._gpuColorTexture = undefined;
            }
            if (shadowMap.renderTarget._gpuDepthTexture)
            {
                shadowMap.renderTarget._gpuDepthTexture.destroy();
                shadowMap.renderTarget._gpuDepthTexture = undefined;
            }
        }
    }
}