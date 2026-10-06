import { getGenerateMipmap3DWGSL, getGenerateMipmapWGSL } from './generateMipmapWGSL';

/**
 * Generates mip levels from level 0 to the last mip for an existing texture
 *
 * The texture must have been created with TEXTURE_BINDING and
 * RENDER_ATTACHMENT and been created with mip levels
 *
 * @param device
 * @param texture
 */
export function generateMipmap(device: GPUDevice, texture: GPUTexture)
{
    // 3D 纹理不支持作为 RENDER_ATTACHMENT，使用计算着色器生成 mipmap
    if (texture.dimension === '3d')
    {
        generateMipmap3D(device, texture);

        return;
    }

    let perDeviceInfo = getByDevice().get(device);

    if (!perDeviceInfo)
    {
        perDeviceInfo = {
            pipelineByFormatAndView: {},
            moduleByView: {},
        };
        getByDevice().set(device, perDeviceInfo);
    }
    let {
        sampler,
    } = perDeviceInfo;
    const {
        pipelineByFormatAndView,
        moduleByView,
    } = perDeviceInfo;
    const view = getViewDimensionForTexture(texture);
    let modules = moduleByView[view];

    if (!modules)
    {
        // TSL 生成两份文本（顶点 / 片元），用两个 shader module
        const shader = getGenerateMipmapWGSL(view === '2d-array');

        modules = {
            vertex: device.createShaderModule({ label: `mip level generation for ${view} (vs)`, code: shader.vertex }),
            fragment: device.createShaderModule({ label: `mip level generation for ${view} (fs)`, code: shader.fragment }),
        };
        moduleByView[view] = modules;
    }

    if (!sampler)
    {
        sampler = device.createSampler({
            minFilter: 'linear',
        });
        perDeviceInfo.sampler = sampler;
    }

    const id = `${texture.format}.${view}`;

    if (!pipelineByFormatAndView[id])
    {
        pipelineByFormatAndView[id] = device.createRenderPipeline({
            label: `mip level generator pipeline for ${view}`,
            layout: 'auto',
            vertex: {
                module: modules.vertex,
                entryPoint: 'vs',
            },
            fragment: {
                module: modules.fragment,
                entryPoint: 'fs',
                targets: [{ format: texture.format }],
            },
        });
    }
    const pipeline = pipelineByFormatAndView[id];

    const encoder = device.createCommandEncoder({
        label: 'mip gen encoder',
    });

    const dimension = getViewDimensionForTexture(texture);

    for (let baseMipLevel = 1; baseMipLevel < texture.mipLevelCount; ++baseMipLevel)
    {
        for (let baseArrayLayer = 0; baseArrayLayer < texture.depthOrArrayLayers; ++baseArrayLayer)
        {
            const bindGroup = device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    // TSL 的 sampler 展开是 texture@0 + sampler@1（原手写是 sampler@0 + texture@1）
                    {
                        binding: 0,
                        resource: texture.createView({
                            dimension,
                            baseMipLevel: baseMipLevel - 1,
                            mipLevelCount: 1,
                            baseArrayLayer,
                            arrayLayerCount: 1,
                        }),
                    },
                    { binding: 1, resource: sampler },
                ],
            });

            const renderPassDescriptor: GPURenderPassDescriptor = {
                label: 'mip gen renderPass',
                colorAttachments: [
          {
              view: texture.createView({
                  dimension,
                  baseMipLevel,
                  mipLevelCount: 1,
                  baseArrayLayer,
                  arrayLayerCount: 1,
              }),
              loadOp: 'clear',
              storeOp: 'store',
          } as GPURenderPassColorAttachment,
                ],
            };

            const pass = encoder.beginRenderPass(renderPassDescriptor);

            pass.setPipeline(pipeline);
            pass.setBindGroup(0, bindGroup);
            pass.draw(3);
            pass.end();
        }
    }

    const commandBuffer = encoder.finish();

    device.queue.submit([commandBuffer]);
}

function getViewDimensionForTexture(texture: GPUTexture): GPUTextureViewDimension
{
    switch (texture.dimension)
    {
        case '1d':
            return '1d';
        case '3d':
            return '3d';
        default: // to shut up TS
        case '2d':
            return texture.depthOrArrayLayers > 1 ? '2d-array' : '2d';
    }
}

// Use a WeakMap so the device can be destroyed and/or lost
// 缓存一律 lazy-init：模块级 `new WeakMap()` 属「import 即执行」（R2，issue #88）
function createByDevice()
{
    return new WeakMap();
}
let byDevice: ReturnType<typeof createByDevice> | null = null;

function getByDevice()
{
    if (!byDevice)
    {
        byDevice = createByDevice();
    }

    return byDevice;
}

// 3D 纹理 mipmap 生成的缓存（按格式分类）；同样 lazy-init（R2，issue #88）
let byDevice3D: WeakMap<GPUDevice, {
    pipelineByFormat: Record<string, GPUComputePipeline>;
    sampler?: GPUSampler;
}> | null = null;

function getByDevice3D()
{
    if (!byDevice3D)
    {
        byDevice3D = new WeakMap();
    }

    return byDevice3D;
}

// 支持存储绑定的格式映射到 WGSL 存储类型
const storageFormatMap: Record<string, string> = {
    rgba8unorm: 'rgba8unorm',
    rgba8snorm: 'rgba8snorm',
    rgba8uint: 'rgba8uint',
    rgba8sint: 'rgba8sint',
    rgba16uint: 'rgba16uint',
    rgba16sint: 'rgba16sint',
    rgba16float: 'rgba16float',
    r32uint: 'r32uint',
    r32sint: 'r32sint',
    r32float: 'r32float',
    rg32uint: 'rg32uint',
    rg32sint: 'rg32sint',
    rg32float: 'rg32float',
    rgba32uint: 'rgba32uint',
    rgba32sint: 'rgba32sint',
    rgba32float: 'rgba32float',
};

// 已警告的纹理集合，避免重复警告；同样 lazy-init（R2，issue #606）
let warned3DTextures: WeakSet<GPUTexture> | null = null;

function getWarned3DTextures(): WeakSet<GPUTexture>
{
    if (!warned3DTextures) warned3DTextures = new WeakSet();

    return warned3DTextures;
}

/**
 * 使用计算着色器为 3D 纹理生成 mipmap
 * 因为 3D 纹理不能作为 RENDER_ATTACHMENT，必须使用计算着色器
 */
function generateMipmap3D(device: GPUDevice, texture: GPUTexture)
{
    const storageFormat = storageFormatMap[texture.format];

    // 检查格式是否支持存储绑定
    if (!storageFormat)
    {
        const warned = getWarned3DTextures();

        if (!warned.has(texture))
        {
            warned.add(texture);
            console.warn(
                `[WebGPU] 3D 纹理格式 '${texture.format}' 不支持存储绑定，无法使用计算着色器生成 mipmap。`
                + ` 建议使用支持的格式（如 rgba8unorm）或手动生成 mipmap。`,
            );
        }

        return;
    }

    let perDeviceInfo = getByDevice3D().get(device);

    if (!perDeviceInfo)
    {
        perDeviceInfo = {
            pipelineByFormat: {},
        };
        getByDevice3D().set(device, perDeviceInfo);
    }

    const { pipelineByFormat } = perDeviceInfo;
    let { sampler } = perDeviceInfo;

    // 获取或创建对应格式的计算管线
    let pipeline = pipelineByFormat[texture.format];

    if (!pipeline)
    {
        const module = device.createShaderModule({
            label: `mip level generation for 3d texture (compute) - ${texture.format}`,
            code: getGenerateMipmap3DWGSL(storageFormat),
        });

        pipeline = device.createComputePipeline({
            label: `mip level generator pipeline for 3d texture - ${texture.format}`,
            layout: 'auto',
            compute: {
                module,
                entryPoint: 'main',
            },
        });

        pipelineByFormat[texture.format] = pipeline;
    }

    // 创建采样器
    if (!sampler)
    {
        sampler = device.createSampler({
            minFilter: 'linear',
            magFilter: 'linear',
        });
        perDeviceInfo.sampler = sampler;
    }

    const encoder = device.createCommandEncoder({
        label: 'mip gen encoder for 3d texture',
    });

    // 为每个 mip level 生成
    for (let mipLevel = 1; mipLevel < texture.mipLevelCount; ++mipLevel)
    {
        // 计算当前 mip level 的尺寸
        const mipWidth = Math.max(1, texture.width >> mipLevel);
        const mipHeight = Math.max(1, texture.height >> mipLevel);
        const mipDepth = Math.max(1, texture.depthOrArrayLayers >> mipLevel);

        // 创建输入视图（上一级 mip level）
        const inputView = texture.createView({
            dimension: '3d',
            baseMipLevel: mipLevel - 1,
            mipLevelCount: 1,
        });

        // 创建输出视图（当前 mip level，作为存储纹理）
        const outputView = texture.createView({
            dimension: '3d',
            baseMipLevel: mipLevel,
            mipLevelCount: 1,
        });

        // 创建绑定组
        const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                // TSL 的展开：inputTexture@0（纹理）+ 采样器@1 + outputTexture@2
                { binding: 0, resource: inputView },
                { binding: 1, resource: sampler },
                { binding: 2, resource: outputView },
            ],
        });

        const pass = encoder.beginComputePass({
            label: `mip gen compute pass for level ${mipLevel}`,
        });

        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);

        // 计算工作组数量（向上取整）
        const workgroupsX = Math.ceil(mipWidth / 4);
        const workgroupsY = Math.ceil(mipHeight / 4);
        const workgroupsZ = Math.ceil(mipDepth / 4);

        pass.dispatchWorkgroups(workgroupsX, workgroupsY, workgroupsZ);
        pass.end();
    }

    const commandBuffer = encoder.finish();

    device.queue.submit([commandBuffer]);
}
