import { getTextureInvertYPremultiplyAlphaWGSL } from './textureInvertYPremultiplyAlphaWGSL';

/** 两个入口各一个 module（TSL 生成两份文本），按 device 懒缓存 */
let cachedModules: { vertex: GPUShaderModule; fragment: GPUShaderModule } | null = null;

/**
 * 操作纹理进行Y轴翻转或进行预乘Alpha。
 *
 * @param texture 被操作的纹理。
 * @param invertY 是否Y轴翻转
 * @param premultiplyAlpha 是否预乘Alpha。
 */
export function textureInvertYPremultiplyAlpha(device: GPUDevice, texture: GPUTexture, options: { invertY?: boolean, premultiplyAlpha?: boolean })
{
    const { invertY, premultiplyAlpha } = options;

    if (!cachedModules)
    {
        const shader = getTextureInvertYPremultiplyAlphaWGSL();

        cachedModules = {
            vertex: device.createShaderModule({ code: shader.vertex }),
            fragment: device.createShaderModule({ code: shader.fragment }),
        };
    }
    // 同一个纹理不能 同时作为输入与输出，此处复制一份临时纹理作为输入。
    const tempTexture = device.createTexture({
        size: { width: texture.width, height: texture.height },
        format: texture.format,
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
    let commandEncoder = device.createCommandEncoder();

    commandEncoder.copyTextureToTexture({ texture }, { texture: tempTexture }, { width: texture.width, height: texture.height });
    device.queue.submit([commandEncoder.finish()]);

    //
    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: cachedModules.vertex,
            entryPoint: 'vsmain',
            constants: {
                invertY: invertY ? 1 : 0,
            },
        },
        fragment: {
            module: cachedModules.fragment,
            entryPoint: 'fsmain',
            constants: {
                premultiplyAlpha: premultiplyAlpha ? 1 : 0,
            },
            targets: [{ format: 'rgba8unorm' }],
        },
        primitive: { topology: 'triangle-strip' },
    });
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            // TSL 的 sampler 展开是 texture@0 + sampler@1（与旧手写的 sampler@0 + texture@1 相反）
            {
                binding: 0,
                resource: tempTexture.createView(),
            },
            {
                binding: 1,
                resource: device.createSampler({
                    magFilter: 'linear',
                    minFilter: 'linear',
                }),
            },
        ],
    });

    commandEncoder = device.createCommandEncoder();
    const renderPassEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [
            {
                view: texture.createView(),
                loadOp: 'load',
                storeOp: 'store',
            },
        ],
    });

    renderPassEncoder.setPipeline(pipeline);
    renderPassEncoder.setBindGroup(0, bindGroup);
    renderPassEncoder.draw(4);
    renderPassEncoder.end();
    device.queue.submit([commandEncoder.finish()]);

    // 销毁临时纹理
    tempTexture.destroy();
}
