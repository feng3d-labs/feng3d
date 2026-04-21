import { TextureView } from './TextureView';

/**
 * 渲染通道颜色附件。
 *
 * {@link GPURenderPassColorAttachment}
 */
export interface RenderPassColorAttachment
{
    /**
     * 颜色附件视图。
     *
     * 如果没有设置，默认为画布；否则使用 纹理视图。
     *
     * 注：引擎运行中该属性可能是 IGLRenderbuffer 类型，用于处理多重采样。
     */
    readonly view?: TextureView;

    /**
     * 清除后填充值。
     *
     * 默认为 [0,0,0,0]。
     *
     * Indicates the value to clear {@link GPURenderPassColorAttachment#view} to prior to executing the
     * render pass. If not map/exist|provided, defaults to `{r: 0, g: 0, b: 0, a: 0}`. Ignored
     * if {@link GPURenderPassColorAttachment#loadOp} is not {@link GPULoadOp#"clear"}.
     * The components of {@link GPURenderPassColorAttachment#clearValue} are all double values.
     * They are converted [$to a texel value of texture format$] matching the render attachment.
     * If conversion fails, a validation error is generated.
     */
    readonly clearValue?: Color;

    /**
     * 是否清除颜色附件。
     *
     * 默认 `"clear"` 。
     *
     * Indicates the load operation to perform on {@link GPURenderPassColorAttachment#view} prior to
     * executing the render pass.
     * Note: It is recommended to prefer clearing; see {@link GPULoadOp#"clear"} for details.
     */
    readonly loadOp?: LoadOp;

    /**
     * The store operation to perform on {@link GPURenderPassColorAttachment#view}
     * after executing the render pass.
     *
     * 默认 `"store"` 。
     */
    readonly storeOp?: GPUStoreOp;

    /**
     * Indicates the depth slice index of {@link GPUTextureViewDimension#"3d"} {@link GPURenderPassColorAttachment#view}
     * that will be output to for this color attachment.
     */
    readonly depthSlice?: GPUIntegerCoordinate;
}

export type Color = [red: number, green: number, blue: number, alpha: number];

export type LoadOp = 'load' | 'clear';

/**
 * 默认渲染通道颜色附件。
 */
export const defaultRenderPassColorAttachment: RenderPassColorAttachment = {
    view: undefined,
    clearValue: [0, 0, 0, 0],
    loadOp: 'clear',
    storeOp: 'store',
    depthSlice: undefined,
}
