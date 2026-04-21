import { Computed, computed, reactive } from '@feng3d/reactivity';
import { ChainMap } from '../utils/ChainMap';
import { RenderBundle } from '../data/RenderBundle';
import { RenderPassFormat } from '../internal/RenderPassFormat';
import { runRenderObject } from '../internal/runRenderObject';
import { WGPURenderBundleEncoder } from './WGPURenderPassEncoder';
import { ReactiveObject } from '../ReactiveObject';

export class WGPURenderBundle extends ReactiveObject
{
    get gpuRenderBundle()
    {
        return this._computedGpuRenderBundle.value;
    }

    private _computedGpuRenderBundle: Computed<GPURenderBundle>;

    constructor(device: GPUDevice, renderBundle: RenderBundle, renderPassFormat: RenderPassFormat, attachmentSize: { readonly width: number, readonly height: number })
    {
        super();
        this._onCreate(device, renderBundle, renderPassFormat, attachmentSize);

        //
        WGPURenderBundle.map.set([device, renderBundle, renderPassFormat, attachmentSize], this);
        this.destroyCall(() =>
        {
            WGPURenderBundle.map.delete([device, renderBundle, renderPassFormat, attachmentSize]);
        });
    }

    private _onCreate(device: GPUDevice, renderBundle: RenderBundle, renderPassFormat: RenderPassFormat, attachmentSize: { readonly width: number, readonly height: number })
    {
        const r_renderBundle = reactive(renderBundle);
        const r_renderPassFormat = reactive(renderPassFormat);

        this._computedGpuRenderBundle = computed(() =>
        {
            // 执行
            r_renderPassFormat.colorFormats.concat();
            const descriptor: GPURenderBundleEncoderDescriptor = { colorFormats: renderPassFormat.colorFormats };

            if (r_renderPassFormat.depthStencilFormat)
            {
                descriptor.depthStencilFormat = renderPassFormat.depthStencilFormat;
            }
            if (r_renderPassFormat.sampleCount)
            {
                descriptor.sampleCount = renderPassFormat.sampleCount;
            }
            if (r_renderBundle.descriptor?.depthReadOnly)
            {
                descriptor.depthReadOnly = true;
            }
            if (r_renderBundle.descriptor?.stencilReadOnly)
            {
                descriptor.stencilReadOnly = true;
            }
            //
            const renderBundleEncoder = device.createRenderBundleEncoder(descriptor);

            //
            const bundleEncoder = new WGPURenderBundleEncoder(device, renderPassFormat, attachmentSize);

            r_renderBundle.renderObjects.concat();
            renderBundle.renderObjects.forEach((renderObject) =>
            {
                runRenderObject(renderObject, bundleEncoder);
            });

            bundleEncoder.runCommands(renderBundleEncoder);

            const gpuRenderBundle = renderBundleEncoder.finish();

            return gpuRenderBundle;
        });
    }

    static getInstance(device: GPUDevice, renderBundle: RenderBundle, renderPassFormat: RenderPassFormat, attachmentSize: { readonly width: number, readonly height: number })
    {
        return this.map.get([device, renderBundle, renderPassFormat, attachmentSize]) || new WGPURenderBundle(device, renderBundle, renderPassFormat, attachmentSize);
    }

    private static readonly map = new ChainMap<[GPUDevice, RenderBundle, RenderPassFormat, { readonly width: number, readonly height: number }], WGPURenderBundle>();
}