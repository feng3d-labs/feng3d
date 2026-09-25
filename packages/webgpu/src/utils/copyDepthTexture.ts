const wgsl = `
struct VarysStruct {
    @builtin( position ) Position: vec4<f32>,
    @location( 0 ) vUV : vec2<f32>
};

@vertex
fn vsmain(
    @builtin(vertex_index) VertexIndex: u32
) -> VarysStruct {
    var Varys : VarysStruct;

    var pos = array< vec2<f32>, 4 >(
        vec2<f32>( -1.0,  1.0 ),
        vec2<f32>(  1.0,  1.0 ),
        vec2<f32>( -1.0, -1.0 ),
        vec2<f32>(  1.0, -1.0 )
    );

    var tex = array< vec2<f32>, 4 >(
        vec2<f32>( 0.0, 0.0 ),
        vec2<f32>( 1.0, 0.0 ),
        vec2<f32>( 0.0, 1.0 ),
        vec2<f32>( 1.0, 1.0 )
    );

    Varys.vUV = tex[ VertexIndex ];
    Varys.Position = vec4<f32>( pos[ VertexIndex ], 0.0, 1.0 );

    return Varys;
}

struct FragmentOut {
    @location(0) color0: vec4<f32>
};

@group(0) @binding(0) var mySampler: sampler;
@group(0) @binding(1) var myTexture: texture_depth_2d;

@fragment
fn fsmain(Varys : VarysStruct) -> FragmentOut {

    var output: FragmentOut;

    var color = textureSample(myTexture, mySampler, Varys.vUV);

    output.color0 = vec4<f32>(color,color,color,1.0);

    return output;
}
`;

let wgslModel: GPUShaderModule;

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
            } as GPUBindGroupLayoutEntry,
            {
                binding: 1,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                texture: {
                    sampleType: 'depth',
                },
            } as GPUBindGroupLayoutEntry,
        ],
    } as GPUBindGroupLayoutDescriptor);
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
        ],
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
