const wgsl = `
override invertY = false;
override premultiplyAlpha = false;

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
    if(invertY)
    {
        Varys.vUV.y = 1.0 - Varys.vUV.y;
    }
    Varys.Position = vec4<f32>( pos[ VertexIndex ], 0.0, 1.0 );

    return Varys;
}

struct FragmentOut {
    @location(0) color0: vec4<f32>
};

@group(0) @binding(0) var mySampler: sampler;
@group(0) @binding(1) var myTexture: texture_2d<f32>;

@fragment
fn fsmain(Varys : VarysStruct) -> FragmentOut {

    var output: FragmentOut;

    var color = textureSample(myTexture, mySampler, Varys.vUV);
    if(premultiplyAlpha)
    {
        color = vec4<f32>(color.rgb * color.a, color.a);
    }

    output.color0 = color;

    return output;
}
`;

let wgslModel: GPUShaderModule;

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

    if (!wgslModel)
    {
        wgslModel = device.createShaderModule({ code: wgsl });
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
            module: wgslModel,
            entryPoint: 'vsmain',
            constants: {
                invertY: invertY ? 1 : 0,
            },
        },
        fragment: {
            module: wgslModel,
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
            {
                binding: 0,
                resource: device.createSampler({
                    magFilter: 'linear',
                    minFilter: 'linear',
                }),
            },
            {
                binding: 1,
                resource: tempTexture.createView(),
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
