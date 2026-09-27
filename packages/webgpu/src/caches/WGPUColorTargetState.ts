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

                // 取原始对象上的值用于创建（不能传响应式代理，否则会破坏 WGPUBlendState 的缓存键）
                const blend = colorTargetState.blend;

                // 通过响应式代理读取以建立依赖；原始值与代理同源，非空判断与原实现等价
                if (r_colorTargetState.blend && blend)
                {
                    // WGPUBlendState.getInstance 仅在实参为空时返回 undefined（其内部有 `if (!blendState) return undefined`），此处实参已非空
                    gpuColorTargetState.blend = WGPUBlendState.getInstance(blend)!.gpuBlendState;
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