import wgsl from './copyDepthTexture.wgsl';

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

    if (!wgslModel)
    {
        wgslModel = device.createShaderModule({ code: wgsl });
    }

    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                sampler: {},
            },
            {
                binding: 1,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'depth',
                },
            },
        ] as GPUBindGroupLayoutEntry[],
    });

    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: device.createSampler({
                    magFilter: 'linear',
                    minFilter: 'linear',
                }),
            },
            {
                binding: 1,
                resource: sourceTexture.createView(),
            },
        ] as GPUBindGroupEntry[],
    });

    const pipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout],
        }),
        vertex: {
            module: wgslModel,
            entryPoint: 'vsmain',
        },
        fragment: {
            module: wgslModel,
            entryPoint: 'fsmain',
            targets: [{ format: targetTexture.format }] as GPUColorTargetState[],
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
            } as GPURenderPassColorAttachment,
        ],
    });

    renderPassEncoder.setPipeline(pipeline);
    renderPassEncoder.setBindGroup(0, bindGroup);
    renderPassEncoder.draw(4);
    renderPassEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
}

let wgslModel: GPUShaderModule;
