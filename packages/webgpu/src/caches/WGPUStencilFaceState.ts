import { computed, Computed, reactive } from '@feng3d/reactivity';
import { StencilFaceState } from '../data/StencilFaceState';
import { ReactiveObject } from '../ReactiveObject';

export class WGPUStencilFaceState extends ReactiveObject
{
    get gpuStencilFaceState()
    {
        return this._computedGpuStencilFaceState.value;
    }

    private _computedGpuStencilFaceState: Computed<GPUStencilFaceState>;

    constructor(stencilFaceState: StencilFaceState)
    {
        super();

        this._onCreate(stencilFaceState);
        //
        WGPUStencilFaceState.map.set(stencilFaceState, this);
        this.destroyCall(() =>
        {
            WGPUStencilFaceState.map.delete(stencilFaceState);
        });
    }

    private _onCreate(stencilFaceState: StencilFaceState)
    {
        const r_stencilFaceState = reactive(stencilFaceState);

        this._computedGpuStencilFaceState = computed(() =>
        {
            if (!stencilFaceState) return WGPUStencilFaceState.defaultGPUStencilFaceState;

            // 监听
            r_stencilFaceState.compare;
            r_stencilFaceState.failOp;
            r_stencilFaceState.depthFailOp;
            r_stencilFaceState.passOp;

            // 计算
            const { compare, failOp, depthFailOp, passOp } = stencilFaceState;
            const gpuStencilFaceState: GPUStencilFaceState = {
                compare: compare ?? 'always',
                failOp: failOp ?? 'keep',
                depthFailOp: depthFailOp ?? 'keep',
                passOp: passOp ?? 'keep',
            };

            //
            return gpuStencilFaceState;
        });
    }

    static getInstance(stencilFaceState: StencilFaceState)
    {
        return this.map.get(stencilFaceState) || new WGPUStencilFaceState(stencilFaceState);
    }

    /**
     * 实例缓存的存储（R2，issue #614：缓存一律 lazy-init，不在 import 时分配）。
     */
    private static _map: Map<StencilFaceState, WGPUStencilFaceState> | null = null;

    /** 实例缓存（首次访问时创建） */
    static get map(): Map<StencilFaceState, WGPUStencilFaceState>
    {
        if (!WGPUStencilFaceState._map) WGPUStencilFaceState._map = new Map();

        return WGPUStencilFaceState._map;
    }

    static readonly defaultGPUStencilFaceState: GPUStencilFaceState = {};
}