import { computed, Computed, reactive } from '@feng3d/reactivity';
import { ChainMap } from '../utils/ChainMap';
import { PrimitiveState } from '../data/PrimitiveState';
import { ReactiveObject } from '../ReactiveObject';

export class WGPUPrimitiveState extends ReactiveObject
{
    get gpuPrimitiveState()
    {
        return this._computedGpuPrimitiveState.value;
    }

    private _computedGpuPrimitiveState: Computed<GPUPrimitiveState>;

    constructor(primitive: PrimitiveState, indexFormat: GPUIndexFormat)
    {
        super();

        this._onCreate(primitive, indexFormat);
        //
        WGPUPrimitiveState.map.set([primitive, indexFormat], this);
        this.destroyCall(() =>
        {
            WGPUPrimitiveState.map.delete([primitive, indexFormat]);
        });
    }

    private _onCreate(primitive: PrimitiveState, indexFormat: GPUIndexFormat)
    {

        this._computedGpuPrimitiveState = computed(() =>
        {
            if (!primitive)
            {
                return WGPUPrimitiveState.defaultGPUPrimitiveState;
            }
            const r_primitive = reactive(primitive);

            // 监听
            r_primitive.topology;
            r_primitive.cullFace;
            r_primitive.frontFace;
            r_primitive.unclippedDepth;

            // 计算
            const { topology, cullFace, frontFace, unclippedDepth } = primitive;
            const gpuPrimitive: GPUPrimitiveState = {
                topology: topology ?? 'triangle-list' as any,
                stripIndexFormat: (topology === 'triangle-strip' || topology === 'line-strip') ? indexFormat : undefined,
                frontFace: frontFace ?? 'ccw',
                cullMode: cullFace ?? 'none' as any,
                unclippedDepth: unclippedDepth ?? false,
            };

            return gpuPrimitive;
        });
    }

    static getInstance(primitive: PrimitiveState, indexFormat: GPUIndexFormat)
    {
        return this.map.get([primitive, indexFormat]) || new WGPUPrimitiveState(primitive, indexFormat);
    }

    private static readonly map = new ChainMap<[PrimitiveState, GPUIndexFormat], WGPUPrimitiveState>();
    private static readonly defaultGPUPrimitiveState: GPUPrimitiveState = { topology: 'triangle-list', cullMode: 'none', frontFace: 'ccw' };
}