import { computed, Computed, reactive } from '@feng3d/reactivity';
import { MultisampleState } from '../data/MultisampleState';
import { ReactiveObject } from '../ReactiveObject';

export class WGPUMultisampleState extends ReactiveObject
{
    get gpuMultisampleState()
    {
        return this._computedGpuMultisampleState.value;
    }

    private _computedGpuMultisampleState: Computed<GPUMultisampleState>;

    constructor(multisampleState: MultisampleState)
    {
        super();

        this._onCreate(multisampleState);
        //
        WGPUMultisampleState.map.set(multisampleState, this);
        this.destroyCall(() =>
        {
            WGPUMultisampleState.map.delete(multisampleState);
        });
    }

    private _onCreate(multisampleState: MultisampleState)
    {
        this._computedGpuMultisampleState = computed(() =>
        {
            if (!multisampleState)
            {
                return WGPUMultisampleState.defaultGPUMultisampleState;
            }

            const r_multisampleState = reactive(multisampleState);

            // 监听
            r_multisampleState.mask;
            r_multisampleState.alphaToCoverageEnabled;

            // 计算
            const { mask, alphaToCoverageEnabled } = multisampleState;
            const gpuMultisampleState: GPUMultisampleState = {
                count: 4,
                mask: mask ?? 0xFFFFFFFF,
                alphaToCoverageEnabled: alphaToCoverageEnabled ?? false,
            };

            return gpuMultisampleState;
        });
    }

    static getInstance(multisampleState: MultisampleState)
    {
        return this.map.get(multisampleState) || new WGPUMultisampleState(multisampleState);
    }

    private static readonly map = new Map<MultisampleState, WGPUMultisampleState>();
    static readonly defaultGPUMultisampleState: GPUMultisampleState = { count: 4, mask: 0xFFFFFFFF, alphaToCoverageEnabled: false };
}
