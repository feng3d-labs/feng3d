import { computed, Computed, reactive } from '@feng3d/reactivity';
import { ChainMap } from '../utils/ChainMap';
import { ColorTargetState } from '../data/ColorTargetState';
import { ReactiveObject } from '../ReactiveObject';
import { WGPUBlendState } from './WGPUBlendState';

export class WGPUColorTargetState extends ReactiveObject
{
    get gpuColorTargetState()
    {
        return this._computedGpuColorTargetState.value;
    }

    private _computedGpuColorTargetState: Computed<GPUColorTargetState>;

    constructor(colorTargetState: ColorTargetState, format: GPUTextureFormat)
    {
        super();

        this._onCreate(colorTargetState, format);
        //
        WGPUColorTargetState.map.set([colorTargetState, format], this);
        this.destroyCall(() =>
        {
            WGPUColorTargetState.map.delete([colorTargetState, format]);
        });
    }

    private _onCreate(colorTargetState: ColorTargetState, format: GPUTextureFormat)
    {
        this._computedGpuColorTargetState = computed(() =>
        {
            // 计算
            const gpuColorTargetState: GPUColorTargetState = { format };

            if (colorTargetState)
            {
                const r_colorTargetState = reactive(colorTargetState);

                if (r_colorTargetState.blend)
                {
                    const wgpuBlendState = WGPUBlendState.getInstance(colorTargetState.blend);

                    gpuColorTargetState.blend = wgpuBlendState.gpuBlendState;
                }

                if (r_colorTargetState.writeMask)
                {
                    //
                    const red: boolean = r_colorTargetState.writeMask?.[0] ?? true;
                    const green: boolean = r_colorTargetState.writeMask?.[1] ?? true;
                    const blue: boolean = r_colorTargetState.writeMask?.[2] ?? true;
                    const alpha: boolean = r_colorTargetState.writeMask?.[3] ?? true;

                    gpuColorTargetState.writeMask = (red ? 1 : 0) + (green ? 2 : 0) + (blue ? 4 : 0) + (alpha ? 8 : 0);
                }
            }

            return gpuColorTargetState;
        });
    }

    static getInstance(colorTargetState: ColorTargetState, format: GPUTextureFormat)
    {
        return this.map.get([colorTargetState, format]) || new WGPUColorTargetState(colorTargetState, format);
    }

    static readonly map = new ChainMap<[ColorTargetState, GPUTextureFormat], WGPUColorTargetState>();
}