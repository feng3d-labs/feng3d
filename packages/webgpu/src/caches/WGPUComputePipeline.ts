import { computed, Computed, reactive } from '@feng3d/reactivity';
import { ChainMap } from '../utils/ChainMap';
import { ComputePipeline } from '../data/ComputePipeline';
import { ReactiveObject } from '../ReactiveObject';
import { WGPUPipelineLayout } from './WGPUPipelineLayout';
import { WGPUShaderModule } from './WGPUShaderModule';
import { WGPUShaderReflect } from './WGPUShaderReflect';

/**
 * WebGPU计算管线缓存管理器
 *
 * 负责管理WebGPU计算管线的完整生命周期，包括：
 * - 计算管线的创建和配置
 * - 响应式监听计算管线参数变化
 * - 自动重新创建计算管线当依赖变化时
 * - 着色器模块和管线布局的自动管理
 * - 计算管线实例的缓存和复用
 * - 资源清理和内存管理
 *
 * 主要功能：
 * 1. **计算管线管理** - 自动创建和配置GPU计算管线
 * 2. **着色器管理** - 自动处理着色器模块的创建和编译
 * 3. **管线布局管理** - 自动生成和管理管线布局
 * 4. **入口点检测** - 自动检测着色器入口点
 * 5. **响应式更新** - 监听计算管线参数变化，自动重新创建
 * 6. **实例缓存** - 使用WeakMap缓存计算管线实例，避免重复创建
 * 7. **资源管理** - 自动处理计算管线相关资源的清理
 *
 * 使用场景：
 * - 计算着色器执行
 * - 通用GPU计算任务
 * - 数据并行处理
 * - 图像处理和变换
 * - 物理模拟和计算
 */
export class WGPUComputePipeline extends ReactiveObject
{
    /**
     * WebGPU计算管线对象
     *
     * 这是实际的GPU计算管线实例，用于执行计算着色器。
     * 当计算管线配置发生变化时，此对象会自动重新创建。
     */
    get gpuComputePipeline()
    {
        return this._computedGpuComputePipeline.value;
    }

    private _computedGpuComputePipeline: Computed<GPUComputePipeline>;

    /**
     * 构造函数
     *
     * 创建计算管线管理器实例，并设置响应式监听。
     *
     * @param device GPU设备实例，用于创建计算管线
     * @param computePipeline 计算管线配置对象，包含着色器代码和参数
     */
    constructor(device: GPUDevice, computePipeline: ComputePipeline)
    {
        super();

        // 设置计算管线创建和更新逻辑
        this._onCreate(device, computePipeline);

        //
        WGPUComputePipeline.map.set([device, computePipeline], this);
        this.destroyCall(() =>
        {
            WGPUComputePipeline.map.delete([device, computePipeline]);
        });
    }

    /**
     * 设置计算管线创建和更新逻辑
     *
     * 使用响应式系统监听计算管线配置变化，自动重新创建计算管线。
     * 当计算管线参数发生变化时，会触发计算管线的重新创建。
     * 自动处理着色器模块、管线布局和入口点的管理。
     *
     * @param device GPU设备实例
     * @param computePipeline 计算管线配置对象
     */
    private _onCreate(device: GPUDevice, computePipeline: ComputePipeline)
    {
        const r_computePipeline = reactive(computePipeline);

        // 监听计算管线配置变化，自动重新创建计算管线
        this._computedGpuComputePipeline = computed(() =>
        {
            // 触发响应式依赖，监听计算管线的所有属性
            r_computePipeline.label;
            r_computePipeline.compute.code;
            r_computePipeline.compute.entryPoint;
            r_computePipeline.compute.constants;

            // 获取计算阶段配置
            const computeStage = computePipeline.compute;
            const code = computeStage.code;
            const constants = computeStage.constants;
            let entryPoint = computeStage.entryPoint;

            // 获取或创建管线布局
            const gpuPipelineLayout = WGPUPipelineLayout.getGPUPipelineLayout(device, { compute: code });

            // 获取或创建着色器模块
            const module = WGPUShaderModule.getGPUShaderModule(device, code);

            // 如果没有指定入口点，自动检测
            if (!entryPoint)
            {
                const reflect = WGPUShaderReflect.getWGSLReflectInfo(code);

                entryPoint = reflect.entry.compute[0].name;
            }

            // 创建计算阶段配置
            const gpuComputeStage: GPUProgrammableStage = {
                entryPoint,
                constants,
                module,
            };

            // 创建计算管线
            const gpuComputePipeline = device.createComputePipeline({
                layout: gpuPipelineLayout,
                compute: gpuComputeStage,
            });

            // 更新计算管线引用
            return gpuComputePipeline;
        });
    }

    /**
     * 获取或创建计算管线实例
     *
     * 使用单例模式管理计算管线实例，避免重复创建相同的计算管线。
     * 如果缓存中已存在对应的实例，则直接返回；否则创建新实例并缓存。
     *
     * @param device GPU设备实例
     * @param computePipeline 计算管线配置对象
     * @returns 计算管线实例
     */
    static getInstance(device: GPUDevice, computePipeline: ComputePipeline)
    {
        // 尝试从缓存中获取现有实例，如果不存在则创建新实例
        return WGPUComputePipeline.map.get([device, computePipeline]) || new WGPUComputePipeline(device, computePipeline);
    }

    private static readonly map = new ChainMap<[GPUDevice, ComputePipeline], WGPUComputePipeline>();
}