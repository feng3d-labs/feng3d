/**
 * 视频纹理，WebGPU外部纹理。
 *
 * @see GPUExternalTexture
 * @see GPUExternalTextureDescriptor
 * @see GPUDevice.importExternalTexture
 */
export interface VideoTexture
{
    /**
     * The initial value of {@link GPUObjectBase#label|GPUObjectBase.label}.
     */
    readonly label?: string;

    /**
     * The video source to import the external texture from. Source size is determined as described
     * by the external source dimensions table.
     */
    readonly source: HTMLVideoElement | VideoFrame;

    /**
     * The color space the image contents of {@link GPUExternalTextureDescriptor#source} will be
     * converted into when reading.
     */
    readonly colorSpace?: PredefinedColorSpace;
}
