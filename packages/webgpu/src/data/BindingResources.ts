import { BufferBinding } from './BufferBinding';
import { Sampler } from './Sampler';
import type { TextureLike } from './Texture';
import { TextureView } from './TextureView';

/**
 * 绑定资源。
 *
 * 与着色器中名称对应的绑定资源（纹理、采样器、统一数据、存储数据等）。
 */
export interface BindingResources
{
    // 允许 undefined：feng3d 侧用声明合并往这里挂"可选"绑定（如 material_uniforms?），
    // 索引签名若不含 undefined，那些可选属性会触发 TS2411（strictNullChecks 下）。
    readonly [key: string]: BindingResource | undefined;
}

/**
 * 绑定资源 类型
 */
export type BindingResource = BindingResourceTypeMap[keyof BindingResourceTypeMap];

export interface BindingResourceTypeMap
{
    /**
     * 缓冲区绑定。
     */
    BufferBinding: BufferBinding;

    /**
     * 采样器。
     */
    Sampler: Sampler;

    /**
     * 纹理视图。
     */
    TextureView: TextureView;

    /**
     * 外部纹理（用于视频纹理）。
     */
    ExternalTexture: GPUExternalTexture;

    /**
     * 简单纹理对象（包含 texture 属性）。
     *
     * 用于简化的纹理绑定语法。
     */
    SimpleTextureBinding: SimpleTextureBinding;
}

/**
 * 简单纹理绑定对象类型。
 *
 * 支持以下语法：
 * - `{ texture: TextureLike }`
 * - `{ source: HTMLVideoElement }`（用于视频纹理）
 */
export interface SimpleTextureBinding
{
    texture?: TextureLike;
    source?: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | OffscreenCanvas | ImageBitmap | VideoFrame;
}
