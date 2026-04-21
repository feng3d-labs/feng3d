import { WGPURenderBundle } from '../caches/WGPURenderBundle';
import { WGPURenderPassEncoder } from '../caches/WGPURenderPassEncoder';
import { RenderBundle } from '../data/RenderBundle';

export function runRenderBundle(renderBundle: RenderBundle, passEncoder: WGPURenderPassEncoder)
{
    const device = passEncoder.device;
    const renderPassFormat = passEncoder.renderPassFormat;
    const attachmentSize = passEncoder.attachmentSize;

    const wgpuRenderBundle = WGPURenderBundle.getInstance(device, renderBundle, renderPassFormat, attachmentSize);
    const gpuRenderBundle = wgpuRenderBundle.gpuRenderBundle;

    passEncoder.executeBundles([gpuRenderBundle]);
}
