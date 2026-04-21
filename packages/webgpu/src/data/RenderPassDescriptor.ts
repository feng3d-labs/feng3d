import { RenderPassColorAttachment } from './RenderPassColorAttachment';
import { RenderPassDepthStencilAttachment } from './RenderPassDepthStencilAttachment';
import { TimestampQuery } from './TimestampQuery';

/**
 * 渲染通道描述。
 *
 * {@link GPURenderPassDescriptor}
 */
export interface RenderPassDescriptor
{
    /**
     * 标签。
     *
     * 用于调试。
     */
    readonly label?: string;

    /**
     * 颜色附件
     */
    readonly colorAttachments?: readonly RenderPassColorAttachment[];

    /**
     * 深度模板附件。
     *
     * 当使用深度附件时，必须设置。
     */
    readonly depthStencilAttachment?: RenderPassDepthStencilAttachment;

    /**
     * 采用次数。
     */
    readonly sampleCount?: 4;

    /**
     * 附件尺寸。
     *
     * 默认从第一个有效附件纹理中获取尺寸。
     *
     * 该值被修改后将会改变所有附件的尺寸，并释放附件上过时的GPU纹理资源。
     */
    readonly attachmentSize?: { readonly width: number, readonly height: number };

    /**
     * The maximum number of draw calls that will be done in the render pass. Used by some
     * implementations to size work injected before the render pass. Keeping the default value
     * is a good default, unless it is known that more draw calls will be done.
     */
    readonly maxDrawCount?: GPUSize64;

    /**
     * 查询通道运行消耗时长（单位为纳秒）。
     *
     * 如果需要查询通道运行消耗时长，需要为该属性赋值，如 `pass.timestampQuery = {};`。WebGPU渲染完成后引擎自动填充结果到属性`elapsedNs`。
     */
    readonly timestampQuery?: TimestampQuery;
}
