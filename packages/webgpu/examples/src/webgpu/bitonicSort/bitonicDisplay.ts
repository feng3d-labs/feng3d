import { reactive } from '@feng3d/reactivity';
import { BindingResources, CommandEncoder, RenderPassDescriptor } from '@feng3d/webgpu';

import bitonicDisplay from './bitonicDisplay.frag.wgsl';
import { Base2DRendererClass } from './utils';

interface BitonicDisplayRenderArgs
{
    highlight: number;
}

export default class BitonicDisplayRenderer extends Base2DRendererClass
{
    switchBindGroup: (name: string) => void;
    setArguments: (args: BitonicDisplayRenderArgs) => void;
    computeBGDescript: BindingResources;

    constructor(
        renderPassDescriptor: RenderPassDescriptor,
        computeBGDescript: BindingResources,
        label: string,
    )
    {
        super();
        this.renderPassDescriptor = renderPassDescriptor;
        this.computeBGDescript = computeBGDescript;

        const fragment_uniforms = {
            value: { highlight: undefined },
        };

        reactive(computeBGDescript).fragment_uniforms = fragment_uniforms;

        this.pipeline = super.create2DRenderPipeline(
            label,
            bitonicDisplay,
        );

        this.setArguments = (args: BitonicDisplayRenderArgs) =>
        {
            reactive(fragment_uniforms.value).highlight = args.highlight;
        };
    }

    startRun(commandEncoder: CommandEncoder, args: BitonicDisplayRenderArgs)
    {
        this.setArguments(args);
        super.executeRun(commandEncoder, this.renderPassDescriptor, this.pipeline, this.computeBGDescript);
    }
}
