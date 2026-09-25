import { CopyBufferToBuffer } from './CopyBufferToBuffer';
import { CopyTextureToTexture } from './CopyTextureToTexture';
import { RenderPass } from './RenderPass';
import { TransformFeedbackPass } from './TransformFeedbackPass';
import { ComputePass } from './ComputePass';

/**
 * 命令编码器。
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/GPUCommandEncoder
 */
export interface CommandEncoder
{
    /**
     * 通道编码器列表。
     *
     * 包括计算通道编码器、渲染通道编码器 以及 GPU中缓存与纹理之间拷贝。
     */
    passEncoders: PassEncoder[]
}

/**
 * 通道编码器。
 *
 * 如需扩展 IPassEncoder ，请在 PassEncoderMap 中进行添加。
 */
export type PassEncoder = PassEncoderMap[keyof PassEncoderMap];

/**
 * 如需扩展 IPassEncoder ，请在 PassEncoderMap 中进行添加。
 */
export interface PassEncoderMap
{
    /**
     * 渲染通道。
     */
    RenderPass: RenderPass;

    /**
     * 纹理之间拷贝。
     */
    CopyTextureToTexture: CopyTextureToTexture;

    CopyBufferToBuffer: CopyBufferToBuffer;

    /**
     * Transform Feedback 通道。
     */
    TransformFeedbackPass: TransformFeedbackPass;

    /**
     * GPU 计算通道。
     */
    GPUComputePass: ComputePass;
}
