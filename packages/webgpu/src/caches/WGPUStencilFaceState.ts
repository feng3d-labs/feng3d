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

    static readonly map = new Map<StencilFaceState, WGPUStencilFaceState>();
    static readonly defaultGPUStencilFaceState: GPUStencilFaceState = {};
}