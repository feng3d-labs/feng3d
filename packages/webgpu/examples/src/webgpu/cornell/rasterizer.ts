import { BindingResources, CommandEncoder, RenderPass, RenderPassDescriptor, RenderPipeline, Texture } from '@feng3d/webgpu';

import Common from './common';
import Radiosity from './radiosity';
import rasterizerWGSL from './rasterizer.wgsl';
import Scene from './scene';

/**
 * Rasterizer renders the scene using a regular raserization graphics pipeline.
 */
export default class Rasterizer
{
    private readonly common: Common;
    private readonly scene: Scene;
    private readonly renderPassDescriptor: RenderPassDescriptor;
    private readonly pipeline: RenderPipeline;
    private readonly bindGroup: BindingResources;

    constructor(
        common: Common,
        scene: Scene,
        radiosity: Radiosity,
        framebuffer: Texture,
    )
    {
        this.common = common;
        this.scene = scene;

        const framebufferSize = framebuffer.descriptor.size;

        const depthTexture: Texture = {
            descriptor: {
                label: 'RasterizerRenderer.depthTexture',
                size: [framebufferSize[0], framebufferSize[1]],
                format: 'depth24plus',
            },
        };

        this.renderPassDescriptor = {
            label: 'RasterizerRenderer.renderPassDescriptor',
            colorAttachments: [
                {
                    view: { texture: framebuffer },
                    clearValue: [0.1, 0.2, 0.3, 1],
                },
            ],
            depthStencilAttachment: {
                view: { texture: depthTexture },

                depthClearValue: 1,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        };

        this.bindGroup = {
            lightmap: { texture: radiosity.lightmap },
            smpl: {
                addressModeU: 'clamp-to-edge',
                addressModeV: 'clamp-to-edge',
                magFilter: 'linear',
                minFilter: 'linear',
            },
        };

        this.pipeline = {
            label: 'RasterizerRenderer.pipeline',
            vertex: {
                code: rasterizerWGSL + common.wgsl,
            },
            fragment: {
                code: rasterizerWGSL + common.wgsl,
            },
            primitive: {
                cullFace: 'back',
            },
        };

        //
        this.renderPassEncoder = {
            descriptor: this.renderPassDescriptor,
            renderPassObjects: [{
                pipeline: this.pipeline,
                bindingResources: {
                    ...this.common.uniforms.bindGroup,
                    ...this.bindGroup,
                },
                vertices: this.scene.vertexAttributes,
                indices: this.scene.indices,
                draw: { __type__: 'DrawIndexed', indexCount: this.scene.indexCount },
            }],
        };
    }

    private renderPassEncoder: RenderPass;

    encode(commandEncoder: CommandEncoder)
    {
        commandEncoder.passEncoders.push(this.renderPassEncoder);
    }
}
