import { CanvasContext } from '../data/CanvasContext';
import { CopyTextureToTexture } from '../data/CopyTextureToTexture';
import { WGPUTextureLike } from '../caches/WGPUTextureLike';
import { toGPUExtent3D } from '../utils/TypeConvert';

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
        origin: copyTextureToTexture.source.origin ? [...copyTextureToTexture.source.origin] as GPUTexelCopyTextureInfo['origin'] : undefined,
    };

    const destination: GPUTexelCopyTextureInfo = {
        ...copyTextureToTexture.destination,
        texture: gpuDestinationTexture,
        origin: copyTextureToTexture.destination.origin ? [...copyTextureToTexture.destination.origin] as GPUTexelCopyTextureInfo['origin'] : undefined,
    };

    // copySize 是 readonly 元组（第三项可选），需按 WebGPU readonly 边界约定转换为 GPUExtent3D：运行时值不变，只做类型转换
    commandEncoder.copyTextureToTexture(source, destination, toGPUExtent3D(copyTextureToTexture.copySize));
}