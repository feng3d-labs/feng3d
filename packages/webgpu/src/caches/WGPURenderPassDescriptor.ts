import { computed, Computed, reactive } from '@feng3d/reactivity';
import { CanvasContext } from '../data/CanvasContext';
import { ChainMap } from '../utils/ChainMap';
import { RenderPassColorAttachment } from '../data/RenderPassColorAttachment';
import { RenderPassDescriptor } from '../data/RenderPassDescriptor';
import { RenderPassFormat } from '../internal/RenderPassFormat';
import { ReactiveObject } from '../ReactiveObject';
import { WGPURenderPassColorAttachment } from './WGPURenderPassColorAttachment';
import { WGPURenderPassDepthStencilAttachment } from './WGPURenderPassDepthStencilAttachment';
import { WGPUTextureLike } from './WGPUTextureLike';
import { WGPUTimestampQuery } from './WGPUTimestampQuery';

export class WGPURenderPassDescriptor extends ReactiveObject
{
    get gpuRenderPassDescriptor()
    {
        return this._computedGpuRenderPassDescriptor.value;
    }

    private _computedGpuRenderPassDescriptor: Computed<GPURenderPassDescriptor>;

    get renderPassFormat()
    {
        return this._computedRenderPassFormat.value;
    }

    private _computedRenderPassFormat: Computed<RenderPassFormat>;

    constructor(device: GPUDevice, descriptor: RenderPassDescriptor, canvasContext?: CanvasContext)
    {
        super();

        this._onCreate(device, descriptor, canvasContext)
        //
        WGPURenderPassDescriptor.map.set([device, descriptor, canvasContext], this);
        this.destroyCall(() =>
        {
            WGPURenderPassDescriptor.map.delete([device, descriptor, canvasContext]);
        });
    }

    private _onCreate(device: GPUDevice, descriptor: RenderPassDescriptor, canvasContext?: CanvasContext)
    {
        const r_descriptor = reactive(descriptor);

        // 如果渲染通道描述符没有设置附件尺寸，自动从纹理中获取
        if (!descriptor.attachmentSize)
        {
            for (const colorAttachment of descriptor.colorAttachments)
            {
                const view = colorAttachment.view || (canvasContext && descriptor.colorAttachments[0] === colorAttachment ? { texture: { context: canvasContext } } : undefined);

                if (view?.texture)
                {
                    const gpuTextureLike = WGPUTextureLike.getInstance(device, view.texture);
                    const gpuTexture = gpuTextureLike.gpuTexture;

                    r_descriptor.attachmentSize = { width: gpuTexture.width, height: gpuTexture.height };
                    break;
                }
            }
            if (!descriptor.attachmentSize && descriptor.depthStencilAttachment?.view?.texture)
            {
                const gpuTextureLike = WGPUTextureLike.getInstance(device, descriptor.depthStencilAttachment.view.texture);
                const gpuTexture = gpuTextureLike.gpuTexture;

                r_descriptor.attachmentSize = { width: gpuTexture.width, height: gpuTexture.height };
            }
        }

        this._computedGpuRenderPassDescriptor = computed(() =>
        {
            //
            const label = r_descriptor.label;

            //
            r_descriptor.colorAttachments?.concat();
            const gpuColorAttachments = descriptor.colorAttachments.reduce((pre: GPURenderPassColorAttachment[], v, index) =>
            {
                if (!v) return pre;

                // 如果第一个颜色附件的view缺省，使用canvasContext
                const isFirstAttachment = index === 0;
                const attachmentCanvasContext = (isFirstAttachment && !v.view && canvasContext) ? canvasContext : undefined;
                const wgpuRenderPassColorAttachment = WGPURenderPassColorAttachment.getInstance(device, v, descriptor, attachmentCanvasContext);
                const attachment = wgpuRenderPassColorAttachment.gpuRenderPassColorAttachment;

                pre.push(attachment);

                return pre;
            }, []);

            //
            const gpuRenderPassDescriptor: GPURenderPassDescriptor = {
                label: label,
                colorAttachments: gpuColorAttachments,
            };

            r_descriptor.timestampQuery;
            if (descriptor.timestampQuery)
            {
                const wGPUTimestampQuery = WGPUTimestampQuery.getInstance(device, descriptor.timestampQuery);

                gpuRenderPassDescriptor.timestampWrites = wGPUTimestampQuery?.gpuPassTimestampWrites;
            }

            //
            const wGPURenderPassDepthStencilAttachment = WGPURenderPassDepthStencilAttachment.getInstance(device, descriptor);

            if (wGPURenderPassDepthStencilAttachment.gpuRenderPassDepthStencilAttachment)
            {
                gpuRenderPassDescriptor.depthStencilAttachment = wGPURenderPassDepthStencilAttachment.gpuRenderPassDepthStencilAttachment;
            }

            //
            r_descriptor.maxDrawCount;
            if (r_descriptor.maxDrawCount !== undefined)
            {
                gpuRenderPassDescriptor.maxDrawCount = descriptor.maxDrawCount;
            }

            //
            return gpuRenderPassDescriptor;
        });

        const getAttachmentFormat = (attachment: RenderPassColorAttachment, index: number) =>
        {
            const r_attachment = reactive(attachment);

            return computed(() =>
            {
                r_attachment.view;
                // 如果第一个颜色附件的view缺省，使用canvasContext
                const view = attachment.view || (index === 0 && canvasContext ? { texture: { context: canvasContext } } : undefined);

                if (!view?.texture) return undefined;

                const texture = view.texture;

                const wGPUTextureLike = WGPUTextureLike.getInstance(device, texture);
                const gpuTexture = wGPUTextureLike.gpuTexture;

                return gpuTexture.format;
            }).value;
        }

        this._computedRenderPassFormat = computed(() =>
        {
            let sampleCount: number = r_descriptor.sampleCount;
            const gpuRenderPassDescriptor = this._computedGpuRenderPassDescriptor.value;

            const colorFormats: GPUTextureFormat[] = [];

            r_descriptor.colorAttachments?.concat();
            const colorAttachments = descriptor.colorAttachments;

            for (let i = 0; i < colorAttachments.length; i++)
            {
                const format = getAttachmentFormat(colorAttachments[i], i);

                if (format) colorFormats.push(format);
            }

            const depthStencilFormat: GPUTextureFormat = gpuRenderPassDescriptor.depthStencilAttachment?.view?.texture.format;

            // 构建渲染通道格式对象
            let renderPassFormat: RenderPassFormat

            const renderPassFormatKey = [...colorFormats, depthStencilFormat, sampleCount].join(',');

            if (renderPassFormatCache[renderPassFormatKey])
            {
                renderPassFormat = renderPassFormatCache[renderPassFormatKey];
            }
            else
            {
                renderPassFormat = {
                    colorFormats: colorFormats,
                    depthStencilFormat: depthStencilFormat,
                    sampleCount: sampleCount as 4,
                };
                renderPassFormatCache[renderPassFormatKey] = renderPassFormat;
            }

            return renderPassFormat;
        });
    }

    static getInstance(device: GPUDevice, descriptor: RenderPassDescriptor, canvasContext?: CanvasContext)
    {
        return this.map.get([device, descriptor, canvasContext]) || new WGPURenderPassDescriptor(device, descriptor, canvasContext);
    }

    private static readonly map = new ChainMap<[GPUDevice, RenderPassDescriptor, CanvasContext], WGPURenderPassDescriptor>();
}

const renderPassFormatCache: { [key: string]: RenderPassFormat } = {}