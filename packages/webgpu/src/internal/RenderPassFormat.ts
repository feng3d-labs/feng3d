/**
 * 渲染通道格式。
 *
 * @private
 */
export interface RenderPassFormat
{
    readonly colorFormats: readonly GPUTextureFormat[],
    readonly depthStencilFormat?: GPUTextureFormat,
    readonly sampleCount?: 4
}
