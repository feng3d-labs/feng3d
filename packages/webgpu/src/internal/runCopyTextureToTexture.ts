import { CanvasContext } from '../data/CanvasContext';
import { CopyTextureToTexture } from '../data/CopyTextureToTexture';
import { WGPUTextureLike } from '../caches/WGPUTextureLike';

export function runCopyTextureToTexture(device: GPUDevice, commandEncoder: GPUCommandEncoder, copyTextureToTexture: CopyTextureToTexture, canvasContext?: CanvasContext)
{
    let sTexture = copyTextureToTexture.source.texture;

    if (!sTexture && canvasContext)
    {
        sTexture = { context: canvasContext };
    }

    const sourceTexture = WGPUTextureLike.getInstance(device, sTexture);
    const gpuSourceTexture = sourceTexture.gpuTexture;

    let dTexture = copyTextureToTexture.destination.texture;

    if (!dTexture && canvasContext)
    {
        dTexture = { context: canvasContext };
    }
    const destinationTexture = WGPUTextureLike.getInstance(device, dTexture);
    const gpuDestinationTexture = destinationTexture.gpuTexture;

    const source: GPUTexelCopyTextureInfo = {
        ...copyTextureToTexture.source,
        texture: gpuSourceTexture,
    };

    const destination: GPUTexelCopyTextureInfo = {
        ...copyTextureToTexture.destination,
        texture: gpuDestinationTexture,
    };

    commandEncoder.copyTextureToTexture(source, destination, copyTextureToTexture.copySize);
}