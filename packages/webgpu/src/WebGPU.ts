import { reactive } from '@feng3d/reactivity';
import { Buffer } from './data/Buffer';
import { CanvasContext } from './data/CanvasContext';
import { ReadPixels } from './data/ReadPixels';
import { Submit } from './data/Submit';
import { TextureLike } from './data/Texture';
import { TypedArray } from './types/TypedArray';

import { renderState } from './utils/renderState';
import { WGPUBuffer } from './caches/WGPUBuffer';
import { WGPUTextureLike } from './caches/WGPUTextureLike';
import './data/RenderObject';
import './data/RenderPass';
import { runSubmit } from './internal/runSubmit';
import { copyDepthTexture } from './utils/copyDepthTexture';
import { getGPUDevice } from './utils/getGPUDevice';
import { readPixels } from './utils/readPixels';
import { textureInvertYPremultiplyAlpha } from './utils/textureInvertYPremultiplyAlpha';

/**
 * WebGPU 初始化选项
 */
export interface WebGPUOptions extends CanvasContext
{
}

/**
 * WebGPU
 */
export class WebGPU
{
    /**
     * 初始化 WebGPU 获取 GPUDevice 。
     */
    async init(options?: GPURequestAdapterOptions, descriptor?: GPUDeviceDescriptor)
    {
        const r_this = reactive(this);

        r_this.device = await getGPUDevice(options, descriptor);
        //
        this.device?.lost.then(async (info) =>
        {
            console.error(`WebGPU device was lost: ${info.message}`);

            // 'reason' will be 'destroyed' if we intentionally destroy the device.
            if (info.reason !== 'destroyed')
            {
                // try again
                r_this.device = await getGPUDevice(options, descriptor);
            }
        });

        return this;
    }

    readonly device: GPUDevice;

    private _canvasContext: CanvasContext;
    private _canvasTextureView: any;

    constructor(options?: WebGPUOptions)
    {
        renderState.isRunWebGPU = true;
        //
        this._canvasContext = options;
        this._canvasTextureView = {
            texture: {
                context: this._canvasContext,
            },
        };
    }

    destroy()
    {
        const r_this = reactive(this);

        r_this.device = null;
    }

    submit(submit: Submit)
    {
        const device = this.device;

        runSubmit(device, submit, this._canvasContext);
    }

    destoryTexture(texture: TextureLike)
    {
        WGPUTextureLike.getInstance(this.device, texture).destroy();
    }

    textureInvertYPremultiplyAlpha(texture: TextureLike, options: { invertY?: boolean, premultiplyAlpha?: boolean })
    {
        const device = this.device;
        const gpuTexture = WGPUTextureLike.getInstance(this.device, texture);

        textureInvertYPremultiplyAlpha(device, gpuTexture.gpuTexture, options);
    }

    copyDepthTexture(sourceTexture: TextureLike, targetTexture: TextureLike)
    {
        const device = this.device;
        const gpuSourceTexture = WGPUTextureLike.getInstance(this.device, sourceTexture);
        const gpuTargetTexture = WGPUTextureLike.getInstance(this.device, targetTexture);

        copyDepthTexture(device, gpuSourceTexture.gpuTexture, gpuTargetTexture.gpuTexture);
    }

    async readPixels(gpuReadPixels: ReadPixels)
    {
        const device = this.device;

        // 如果没有指定纹理视图，使用当前画布纹理
        if (!gpuReadPixels.textureView && this._canvasContext)
        {
            gpuReadPixels.textureView = {
                texture: {
                    context: this._canvasContext,
                },
            };
        }

        if (!gpuReadPixels.textureView)
        {
            throw new Error('readPixels: textureView is required');
        }

        const textureView = gpuReadPixels.textureView;
        const gpuTexture = WGPUTextureLike.getInstance(this.device, textureView.texture);

        const result = await readPixels(device, {
            texture: gpuTexture.gpuTexture,
            origin: gpuReadPixels.origin,
            copySize: gpuReadPixels.copySize,
            mipLevel: textureView.baseMipLevel ?? 0,
            arrayLayer: textureView.baseArrayLayer ?? 0,
        });

        // 设置纹理格式信息
        gpuReadPixels.format = gpuTexture.gpuTexture.format as any;
        gpuReadPixels.result = result;

        return result;
    }

    async readBuffer(buffer: TypedArray, byteOffset?: GPUSize64, byteLength?: GPUSize64)
    {
        const buffer0 = Buffer.getBuffer(buffer.buffer);

        const commandEncoder = this.device.createCommandEncoder();

        const source = WGPUBuffer.getInstance(this.device, buffer0).gpuBuffer;

        // 创建临时缓冲区，用于读取GPU缓冲区数据
        const destination = this.device.createBuffer({ size: byteLength, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });

        byteOffset = byteOffset ?? buffer.byteOffset;
        byteLength = byteLength ?? buffer.byteLength;

        commandEncoder.copyBufferToBuffer(source, byteOffset, destination, 0, byteLength);

        this.device.queue.submit([commandEncoder.finish()]);

        await destination.mapAsync(GPUMapMode.READ);

        const result = destination.getMappedRange().slice(0);

        destination.unmap();

        // 销毁临时缓冲区
        destination.destroy();

        return result;
    }
}
