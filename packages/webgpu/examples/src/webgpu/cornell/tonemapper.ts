import { BindingResources, CanvasTexture, CommandEncoder, PassEncoder, Texture } from '@feng3d/webgpu';
import { ComputePipeline } from '@feng3d/webgpu';

import Common from './common';
import tonemapperWGSL from './tonemapper.wgsl';

/**
 * Tonemapper implements a tonemapper to convert a linear-light framebuffer to
 * a gamma-correct, tonemapped framebuffer used for presentation.
 */
export default class Tonemapper
{
    private readonly bindGroup: BindingResources;
    private readonly material: ComputePipeline;
    private readonly width: number;
    private readonly height: number;
    private readonly kWorkgroupSizeX = 16;
    private readonly kWorkgroupSizeY = 16;

    constructor(
        common: Common,
        input: Texture,
        output: CanvasTexture,
    )
    {
        const inputSize = input.descriptor.size;

        this.width = inputSize[0];
        this.height = inputSize[1];
        this.bindGroup = {
            input: { texture: input },
            output: { texture: output },
        };

        this.material = {
            label: 'Tonemap.pipeline',
            compute: {
                code: tonemapperWGSL.replace('{OUTPUT_FORMAT}', output.context.configuration.format),
                constants: {
                    WorkgroupSizeX: this.kWorkgroupSizeX,
                    WorkgroupSizeY: this.kWorkgroupSizeY,
                },
            },
        };

        //
        this.passEncoder = {
            __type__: 'ComputePass',
            computeObjects: [{
                pipeline: this.material,
                bindingResources: {
                    ...this.bindGroup,
                },
                workgroups: {
                    workgroupCountX: Math.ceil(this.width / this.kWorkgroupSizeX),
                    workgroupCountY: Math.ceil(this.height / this.kWorkgroupSizeY),
                },
            }],
        };
    }

    private passEncoder: PassEncoder;

    encode(commandEncoder: CommandEncoder)
    {
        commandEncoder.passEncoders.push(this.passEncoder);
    }
}
