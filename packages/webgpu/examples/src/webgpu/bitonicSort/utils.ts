import { BindingResources, CommandEncoder, RenderPass, RenderPassDescriptor, RenderPipeline } from '@feng3d/webgpu';
import { getFullscreenTexturedQuadWGSL } from '../../shaders-tsl/fullscreenTexturedQuad';

export abstract class Base2DRendererClass
{
    abstract switchBindGroup(name: string): void;
    abstract startRun(
        commandEncoder: CommandEncoder,
        ...args: unknown[]
    ): void;

    renderPassDescriptor!: RenderPassDescriptor;
    pipeline!: RenderPipeline;
    bindGroupMap!: Record<string, GPUBindGroup>;
    currentBindGroupName!: string;

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
                code: getFullscreenTexturedQuadWGSL(),
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
