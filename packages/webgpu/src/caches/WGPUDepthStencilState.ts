import { computed, Computed, reactive } from '@feng3d/reactivity';
import { ChainMap } from '../utils/ChainMap';
import { DepthStencilState } from '../data/DepthStencilState';
import { ReactiveObject } from '../ReactiveObject';
import { WGPUStencilFaceState } from './WGPUStencilFaceState';

export class WGPUDepthStencilState extends ReactiveObject
{
    get gpuDepthStencilState()
    {
        return this._computedGpuDepthStencilState.value;
    }

    private _computedGpuDepthStencilState: Computed<GPUDepthStencilState>;

    constructor(depthStencil: DepthStencilState, depthStencilFormat: GPUTextureFormat)
    {
        super();

        this._onCreate(depthStencil, depthStencilFormat);

        //
        WGPUDepthStencilState.map.set([depthStencil, depthStencilFormat], this);
        this.destroyCall(() =>
        {
            WGPUDepthStencilState.map.delete([depthStencil, depthStencilFormat]);
        });
    }

    private _onCreate(depthStencil: DepthStencilState, depthStencilFormat: GPUTextureFormat)
    {
        this._computedGpuDepthStencilState = computed(() =>
        {
            if (depthStencil)
            {
                // 监听
                const r_depthStencil = reactive(depthStencil);

                r_depthStencil.depthWriteEnabled;
                r_depthStencil.depthCompare;
                r_depthStencil.stencilFront;
                r_depthStencil.stencilBack;
                r_depthStencil.stencilReadMask;
                r_depthStencil.stencilWriteMask;
                r_depthStencil.depthBias;
                r_depthStencil.depthBiasSlopeScale;
                r_depthStencil.depthBiasClamp;

                // 计算
                const { depthWriteEnabled,
                    depthCompare,
                    stencilFront,
                    stencilBack,
                    stencilReadMask,
                    stencilWriteMask,
                    depthBias,
                    depthBiasSlopeScale,
                    depthBiasClamp,
                } = depthStencil;

                //
                const wgpuStencilFront = WGPUStencilFaceState.getInstance(stencilFront);
                const gpuStencilFront = wgpuStencilFront.gpuStencilFaceState;

                //
                const wgpuStencilBack = WGPUStencilFaceState.getInstance(stencilBack);
                const gpuStencilBack = wgpuStencilBack.gpuStencilFaceState;

                //
                const gpuDepthStencilState: GPUDepthStencilState = {
                    format: depthStencilFormat,
                    depthWriteEnabled: depthWriteEnabled ?? true,
                    depthCompare: depthCompare ?? 'less',
                    stencilFront: gpuStencilFront,
                    stencilBack: gpuStencilBack,
                    stencilReadMask: stencilReadMask ?? 0xFFFFFFFF,
                    stencilWriteMask: stencilWriteMask ?? 0xFFFFFFFF,
                    depthBias: depthBias ?? 0,
                    depthBiasSlopeScale: depthBiasSlopeScale ?? 0,
                    depthBiasClamp: depthBiasClamp ?? 0,
                };

                return gpuDepthStencilState;
            }

            return WGPUDepthStencilState.getDefaultGPUDepthStencilState(depthStencilFormat);
        });
    }

    /**
     * 获取片段阶段完整描述。
     *
     * @param fragment 片段阶段描述。
     */
    private static getDefaultGPUDepthStencilState(depthStencilFormat: GPUTextureFormat)
    {
        let result = WGPUDepthStencilState.defaultGPUDepthStencilStates[depthStencilFormat];

        if (result) return result;

        result = WGPUDepthStencilState.defaultGPUDepthStencilStates[depthStencilFormat] = {
            format: depthStencilFormat,
            depthWriteEnabled: true,
            depthCompare: 'less',
            stencilFront: {},
            stencilBack: {},
            stencilReadMask: 0xFFFFFFFF,
            stencilWriteMask: 0xFFFFFFFF,
            depthBias: 0,
            depthBiasSlopeScale: 0,
            depthBiasClamp: 0,
        };

        return result;
    }

    static getInstance(depthStencil: DepthStencilState, depthStencilFormat: GPUTextureFormat)
    {
        if (!depthStencilFormat) return undefined;

        return WGPUDepthStencilState.map.get([depthStencil, depthStencilFormat]) || new WGPUDepthStencilState(depthStencil, depthStencilFormat);
    }

    static readonly map = new ChainMap<[DepthStencilState, GPUTextureFormat], WGPUDepthStencilState>();
    private static readonly defaultGPUDepthStencilStates: Record<GPUTextureFormat, GPUDepthStencilState> = {} as any;
}