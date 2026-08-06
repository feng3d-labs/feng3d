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

    let perDeviceInfo = byDevice.get(device);

    if (!perDeviceInfo)
    {
        perDeviceInfo = {
            pipelineByFormatAndView: {},
            moduleByView: {},
        };
        byDevice.set(device, perDeviceInfo);
    }
    let {
        sampler,
    } = perDeviceInfo;
    const {
        pipelineByFormatAndView,
        moduleByView,
    } = perDeviceInfo;
    const view = getViewDimensionForTexture(texture);
    let module = moduleByView[view];

    if (!module)
    {
        const type = view === '2d'
            ? 'texture_2d<f32>'
            : 'texture_2d_array<f32>';
        const extraSampleParamsWGSL = view === '2d'
            ? ''
            : ', 0u';

        module = device.createShaderModule({
            label: `mip level generation for ${view}`,
            code: `
        struct VSOutput {
          @builtin(position) position: vec4f,
          @location(0) texcoord: vec2f,
        };

        @vertex fn vs(
          @builtin(vertex_index) vertexIndex : u32
        ) -> VSOutput {
          var pos = array<vec2f, 3>(
            vec2f(-1.0, -1.0),
            vec2f(-1.0,  3.0),
            vec2f( 3.0, -1.0),
          );

          var vsOutput: VSOutput;
          let xy = pos[vertexIndex];
          vsOutput.position = vec4f(xy, 0.0, 1.0);
          vsOutput.texcoord = xy * vec2f(0.5, -0.5) + vec2f(0.5);
          return vsOutput;
        }

        @group(0) @binding(0) var ourSampler: sampler;
        @group(0) @binding(1) var ourTexture: ${type};

        @fragment fn fs(fsInput: VSOutput) -> @location(0) vec4f {
          return textureSample(ourTexture, ourSampler, fsInput.texcoord${extraSampleParamsWGSL});
        }
      `,
        });
        moduleByView[view] = module;
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
                module,
                entryPoint: 'vs',
            },
            fragment: {
                module,
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
                    { binding: 0, resource: sampler },
                    {
                        binding: 1,
                        resource: texture.createView({
                            dimension,
                            baseMipLevel: baseMipLevel - 1,
                            mipLevelCount: 1,
                            baseArrayLayer,
                            arrayLayerCount: 1,
                        }),
                    },
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
const byDevice = new WeakMap();

// 3D 纹理 mipmap 生成的缓存（按格式分类）
const byDevice3D = new WeakMap<GPUDevice, {
    pipelineByFormat: Record<string, GPUComputePipeline>;
    sampler?: GPUSampler;
}>();

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

// 已警告的纹理集合，避免重复警告
const warned3DTextures = new WeakSet<GPUTexture>();

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
        if (!warned3DTextures.has(texture))
        {
            warned3DTextures.add(texture);
            console.warn(
                `[WebGPU] 3D 纹理格式 '${texture.format}' 不支持存储绑定，无法使用计算着色器生成 mipmap。`
                + ` 建议使用支持的格式（如 rgba8unorm）或手动生成 mipmap。`,
            );
        }

        return;
    }

    let perDeviceInfo = byDevice3D.get(device);

    if (!perDeviceInfo)
    {
        perDeviceInfo = {
            pipelineByFormat: {},
        };
        byDevice3D.set(device, perDeviceInfo);
    }

    const { pipelineByFormat } = perDeviceInfo;
    let { sampler } = perDeviceInfo;

    // 获取或创建对应格式的计算管线
    let pipeline = pipelineByFormat[texture.format];

    if (!pipeline)
    {
        const module = device.createShaderModule({
            label: `mip level generation for 3d texture (compute) - ${texture.format}`,
            code: `
@group(0) @binding(0) var inputTexture: texture_3d<f32>;
@group(0) @binding(1) var outputTexture: texture_storage_3d<${storageFormat}, write>;
@group(0) @binding(2) var textureSampler: sampler;

@compute @workgroup_size(4, 4, 4)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
    let outputSize = textureDimensions(outputTexture);
    
    // 检查是否超出输出纹理范围
    if (globalId.x >= outputSize.x || globalId.y >= outputSize.y || globalId.z >= outputSize.z) {
        return;
    }
    
    // 计算采样坐标（归一化到 0-1 范围，偏移半个像素以采样中心）
    let texCoord = (vec3<f32>(globalId) + vec3<f32>(0.5)) / vec3<f32>(outputSize);
    
    // 使用线性采样从上一级 mip level 读取（自动进行 2x2x2 平均）
    let color = textureSampleLevel(inputTexture, textureSampler, texCoord, 0.0);
    
    // 写入输出纹理
    textureStore(outputTexture, globalId, color);
}
            `,
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
                { binding: 0, resource: inputView },
                { binding: 1, resource: outputView },
                { binding: 2, resource: sampler },
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
