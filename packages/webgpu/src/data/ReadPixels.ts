import { TextureFormat } from './Texture';
import { TextureView } from './TextureView';

/**
 * 读取渲染缓冲区或者纹理视图中的像素值。
 */
export interface ReadPixels
{
    /**
     * 纹理视图
     *
     * 当 textureView 为 undefined 时，表示从当前画布纹理读取。
     *
     * 支持从纹理数组的特定层读取，通过设置 textureView.baseArrayLayer 指定层索引。
     *
     * @default undefined
     */
    textureView?: TextureView,

    /**
     * 读取位置。
     */
    origin: [x: number, y: number],

    /**
     * 读取尺寸
     */
    copySize: [width: number, height: number]

    /**
     * 用于保存最后结果。
     */
    result?: ArrayBufferView;

    /**
     * 纹理数据格式。
     *
     * 由 readPixels 方法设置，表示返回数据的格式（例如 'rgba8unorm' 或 'bgra8unorm'）。
     * 调用者可以根据此格式正确处理颜色通道顺序。
     */
    format?: TextureFormat;
}
