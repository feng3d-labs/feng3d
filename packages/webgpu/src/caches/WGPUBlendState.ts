import { computed, Computed, reactive } from '@feng3d/reactivity';
import { BlendComponent, defaultBlendComponent } from '../data/BlendComponent';
import { BlendState } from '../data/BlendState';
import { ChainMap } from '../utils/ChainMap';
import { ReactiveObject } from '../ReactiveObject';

/**
 * WebGPU混合状态封装类
 *
 * 该类负责将引擎中的BlendState转换为WebGPU所需的GPUBlendState格式，
 * 并提供缓存机制避免重复创建相同的混合状态对象
 */
export class WGPUBlendState extends ReactiveObject
{
    /**
     * 对应的WebGPU混合状态对象
     * 只读属性，当原始BlendState发生变化时会自动更新
     */
    get gpuBlendState()
    {
        return this._computedGpuBlendState.value;
    }

    private _computedGpuBlendState: Computed<GPUBlendState>;

    /**
     * 构造函数
     * @param blendState 原始混合状态对象
     */
    constructor(blendState: BlendState)
    {
        super();

        this._onCreate(blendState);
        //
        WGPUBlendState.map.set([blendState], this);
        this.destroyCall(() =>
        {
            WGPUBlendState.map.delete([blendState]);
        });
    }

    /**
     * 创建并监听混合状态变化
     * @param blendState 原始混合状态对象
     */
    private _onCreate(blendState: BlendState)
    {
        const r_blend = reactive(blendState);

        this._computedGpuBlendState = computed(() =>
        {
            const color = WGPUBlendState.getGPUBlendComponent(r_blend.color);
            // alpha 继承 color 的设置
            const alpha = WGPUBlendState.getGPUBlendComponent(r_blend.alpha, color);

            // 构建WebGPU混合状态对象
            const gpuBlend: GPUBlendState = {
                color: color,
                alpha: alpha,
            };

            return gpuBlend;
        });
    }

    /**
     * 将BlendComponent转换为GPUBlendComponent
     * @param blendComponent 原始混合组件
     * @param fallback 当属性未设置时的后备值（用于 alpha 继承 color 的设置）
     * @returns 对应的WebGPU混合组件
     */
    private static getGPUBlendComponent(blendComponent?: BlendComponent, fallback?: GPUBlendComponent): GPUBlendComponent
    {
        // 如果没有指定混合组件，则使用后备值或默认值
        if (!blendComponent)
        {
            return fallback ?? {
                operation: defaultBlendComponent.operation,
                srcFactor: defaultBlendComponent.srcFactor,
                dstFactor: defaultBlendComponent.dstFactor,
            };
        }

        // 解构混合组件属性
        const { operation, srcFactor, dstFactor } = blendComponent;
        // 后备值的各属性
        const fallbackOperation = fallback?.operation ?? defaultBlendComponent.operation;
        const fallbackSrcFactor = fallback?.srcFactor ?? defaultBlendComponent.srcFactor;
        const fallbackDstFactor = fallback?.dstFactor ?? defaultBlendComponent.dstFactor;
        // 当 operation 为 max 或 min 时，srcFactor 和 dstFactor 必须为 one。
        const gpuBlendComponent: GPUBlendComponent = {
            operation: operation ?? fallbackOperation,
            srcFactor: (operation === 'max' || operation === 'min') ? 'one' : (srcFactor ?? fallbackSrcFactor),
            dstFactor: (operation === 'max' || operation === 'min') ? 'one' : (dstFactor ?? fallbackDstFactor),
        };

        return gpuBlendComponent;
    }

    /**
     * 获取BlendState对应的WGPUBlendState实例
     * @param blendState 原始混合状态对象
     * @returns 对应的WGPUBlendState实例，如果传入为空则返回undefined
     */
    static getInstance(blendState: BlendState)
    {
        if (!blendState) return undefined;

        return this.map.get([blendState]) || new WGPUBlendState(blendState);
    }

    /**
     * BlendState到WGPUBlendState的缓存映射表
     * 使用WeakMap避免内存泄漏
     */
    static readonly map = new ChainMap<[BlendState], WGPUBlendState>();
}