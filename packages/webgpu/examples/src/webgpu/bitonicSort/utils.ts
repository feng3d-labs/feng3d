import { BindingResources, CommandEncoder, RenderPass, RenderPassDescriptor, RenderPipeline } from '@feng3d/webgpu';

const fullscreenTexturedQuad
    = `
struct VertexOutput {
  @builtin(position) Position: vec4<f32>,
  @location(0) fragUV: vec2<f32>,
}

@vertex
fn vert_main(@builtin(vertex_index) VertexIndex: u32) -> VertexOutput {
    const pos = array<vec2<f32>, 6>(
        vec2(1.0, 1.0),
        vec2(1.0, -1.0),
        vec2(-1.0, -1.0),
        vec2(1.0, 1.0),
        vec2(-1.0, -1.0),
        vec2(-1.0, 1.0),
    );

    const uv = array<vec2<f32>, 6>(
        vec2(1.0, 0.0),
        vec2(1.0, 1.0),
        vec2(0.0, 1.0),
        vec2(1.0, 0.0),
        vec2(0.0, 1.0),
        vec2(0.0, 0.0),
    );

    var output: VertexOutput;
    output.Position = vec4(pos[VertexIndex], 0.0, 1.0);
    output.fragUV = uv[VertexIndex];
    return output;
}

`;

export abstract class Base2DRendererClass
{
    abstract switchBindGroup(name: string): void;
    abstract startRun(
        commandEncoder: CommandEncoder,
        ...args: unknown[]
    ): void;

    renderPassDescriptor: RenderPassDescriptor;
    pipeline: RenderPipeline;
    bindGroupMap: Record<string, GPUBindGroup>;
    currentBindGroupName: string;

    executeRun(
        commandEncoder: CommandEncoder,
        renderPassDescriptor: RenderPassDescriptor,
        pipeline: RenderPipeline,
        bindingResources?: BindingResources,
    )
    {
        const passEncoder: RenderPass = {
            descriptor: renderPassDescriptor,
            renderPassObjects: [{
                pipeline: pipeline,
                bindingResources: bindingResources,
                draw: { __type__: 'DrawVertex', vertexCount: 6, instanceCount: 1 },
            }],
        };

        commandEncoder.passEncoders.push(passEncoder);
    }

    create2DRenderPipeline(
        label: string,
        code: string,
    )
    {
        const renderPipeline: RenderPipeline = {
            label: `${label}.pipeline`,
            vertex: {
                code: fullscreenTexturedQuad,
            },
            fragment: {
                code,
            },
            primitive: {
                topology: 'triangle-list',
                cullFace: 'none',
            },
        };

        return renderPipeline;
    }
}
