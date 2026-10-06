import { getCopyDepthTextureWGSL } from './copyDepthTextureWGSL';

/** 两个入口各一个 module（TSL 生成两份文本；WebGPU 允许 vertex / fragment 用不同 module），按 device 懒缓存 */
let cachedModules: { vertex: GPUShaderModule; fragment: GPUShaderModule } | null = null;

/**
 * 拷贝 深度纹理到 普通纹理。
 *
 * @param device GPU设备。
 * @param sourceTexture 源纹理。
 * @param targetTexture 目标纹理。
 */
export function copyDepthTexture(device: GPUDevice, sourceTexture: GPUTexture, targetTexture: GPUTexture)
{
    if (sourceTexture.format.indexOf('depth') === -1)
    {
        console.error(`copyDepthTexture 只用于深度纹理到普通纹理的拷贝。`);

        return;
    }
    if (!cachedModules)
    {
        const shader = getCopyDepthTextureWGSL();

        cachedModules = {
            vertex: device.createShaderModule({ code: shader.vertex }),
            fragment: device.createShaderModule({ code: shader.fragment }),
        };
    }
    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            // TSL 的 sampler 展开是 texture@0 + sampler@1（与旧手写的 sampler@0 + texture@1 相反）
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'depth',
                },
            } as GPUBindGroupLayoutEntry,
            {
                binding: 1,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                sampler: {},
            } as GPUBindGroupLayoutEntry,
        ],
    } as GPUBindGroupLayoutDescriptor);
    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: sourceTexture.createView(),
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
    const pipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout],
        }),
        vertex: {
            module: cachedModules.vertex,
            entryPoint: 'vsmain',
        },
        fragment: {
            module: cachedModules.fragment,
            entryPoint: 'fsmain',
            targets: [{ format: targetTexture.format }],
        },
        primitive: { topology: 'triangle-strip' },
    });
    const commandEncoder = device.createCommandEncoder();
    const renderPassEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [
            {
                view: targetTexture.createView(),
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
}
