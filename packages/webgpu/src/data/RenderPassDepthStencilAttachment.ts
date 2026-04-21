import { TextureView } from './TextureView';

/**
 * 深度模板附件。
 *
 * {@link GPURenderPassDepthStencilAttachment}
 */
export interface RenderPassDepthStencilAttachment
{
    /**
     * 深度附件视图。
     *
     * 如果没有设置，默认为画布；否则使用 纹理视图。
     *
     * 当值为空时，将自动从颜色附件中获取尺寸来创建深度纹理。
     */
    readonly view?: TextureView;

    /**
     * 清除后填充深度值。
     *
     * 默认为 1。
     */
    readonly depthClearValue?: number;

    /**
     * 是否清除深度值。
     *
     * 默认为 "load"。
     */
    readonly depthLoadOp?: 'load' | 'clear';

    /**
     * The store operation to perform on {@link GPURenderPassDepthStencilAttachment#view}'s
     * depth component after executing the render pass.
     *
     * 默认 `"store"` 。
     */
    readonly depthStoreOp?: GPUStoreOp;

    /**
     * Indicates that the depth component of {@link GPURenderPassDepthStencilAttachment#view}
     * is read only.
     *
     * 默认 `false` 。
     */
    readonly depthReadOnly?: boolean;

    /**
     * 清除后填充模板值。
     *
     * 默认为 0。
     */
    readonly stencilClearValue?: number;

    /**
     * 是否清除模板值。
     *
     * 默认为 "load"。
     */
    readonly stencilLoadOp?: 'load' | 'clear';

    /**
     * The store operation to perform on {@link GPURenderPassDepthStencilAttachment#view}'s
     * stencil component after executing the render pass.
     *
     * 默认 `"store"` 。
     */
    readonly stencilStoreOp?: GPUStoreOp;

    /**
     * Indicates that the stencil component of {@link GPURenderPassDepthStencilAttachment#view}
     * is read only.
     *
     * 默认 `false` 。
     */
    readonly stencilReadOnly?: boolean;
}
