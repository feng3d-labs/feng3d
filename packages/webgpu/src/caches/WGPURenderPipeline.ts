import { computed, Computed, reactive } from '@feng3d/reactivity';
import { ChainMap } from '../utils/ChainMap';
import { RenderPipeline } from '../data/RenderPipeline';
import { VertexAttributes } from '../data/VertexAttributes';

import { RenderPassFormat } from '../internal/RenderPassFormat';
import { ReactiveObject } from '../ReactiveObject';
import { WGPUDepthStencilState } from './WGPUDepthStencilState';
import { WGPUFragmentState } from './WGPUFragmentState';
import { WGPUMultisampleState } from './WGPUMultisampleState';
import { WGPUPipelineLayout } from './WGPUPipelineLayout';
import { WGPUPrimitiveState } from './WGPUPrimitiveState';
import { WGPUVertexState } from './WGPUVertexState';

/**
 * WebGPU渲染管线封装类
 *
 * 该类负责将引擎中的RenderPipeline转换为WebGPU所需的GPURenderPipeline对象，
 * 并提供缓存机制避免重复创建相同的渲染管线对象。
 *
 * 渲染管线定义了GPU如何执行图形渲染操作，包括：
 * - 顶点着色器和片段着色器
 * - 顶点数据布局
 * - 图元装配方式
 * - 深度和模板测试
 * - 多重采样设置
 */
export class WGPURenderPipeline extends ReactiveObject
{
    /**
     * 对应的WebGPU渲染管线对象
     * 只读属性，当相关参数发生变化时会自动重新创建
     */
    get gpuRenderPipeline()
    {
        return this._computedGpuRenderPipeline.value;
    }

    private _computedGpuRenderPipeline: Computed<GPURenderPipeline>;

    /**
     * 构造函数
     * @param device GPU设备对象
     * @param renderPipeline 原始渲染管线配置
     * @param renderPassFormat 渲染通道格式
     * @param vertices 顶点属性
     * @param indexFormat 索引格式
     */
    constructor(device: GPUDevice, renderPipeline: RenderPipeline, renderPassFormat: RenderPassFormat, vertices: VertexAttributes, indexFormat: GPUIndexFormat)
    {
        super();
        this._onCreate(device, renderPipeline, renderPassFormat, vertices, indexFormat);

        WGPURenderPipeline.map.set([device, renderPipeline, renderPassFormat, vertices, indexFormat], this);
        this.destroyCall(() =>
        {
            WGPURenderPipeline.map.delete([device, renderPipeline, renderPassFormat, vertices, indexFormat]);
        });
    }

    /**
     * 创建并监听渲染管线变化
     *
     * 当renderPipeline中的任何属性发生变化时，会重新创建GPURenderPipeline对象。
     * 使用响应式系统监听变化，确保渲染管线始终与配置保持同步。
     *
     * @param device GPU设备对象
     * @param renderPipeline 原始渲染管线配置
     * @param renderPassFormat 渲染通道格式
     * @param vertices 顶点属性
     * @param indexFormat 索引格式
     */
    private _onCreate(device: GPUDevice, renderPipeline: RenderPipeline, renderPassFormat: RenderPassFormat, vertices: VertexAttributes, indexFormat: GPUIndexFormat)
    {
        const r_renderPipeline = reactive(renderPipeline);

        this._computedGpuRenderPipeline = computed(() =>
        {
            // 监听渲染管线属性变化
            const label = r_renderPipeline.label;

            // 计算
            const { colorFormats, depthStencilFormat, sampleCount } = renderPassFormat;

            const vertexCode = r_renderPipeline.vertex.wgsl || r_renderPipeline.vertex.code;
            const fragmentCode = r_renderPipeline.fragment?.wgsl || r_renderPipeline.fragment?.code;
            // 创建管线布局
            const layout = WGPUPipelineLayout.getGPUPipelineLayout(device, { vertex: vertexCode, fragment: fragmentCode });

            // 创建顶点状态
            r_renderPipeline.vertex;
            const wgpuVertexState = WGPUVertexState.getInstance(device, renderPipeline.vertex, vertices);
            const gpuVertexState = wgpuVertexState.gpuVertexState;

            // 构建渲染管线描述符
            const gpuRenderPipelineDescriptor: GPURenderPipelineDescriptor = {
                label,
                layout,
                vertex: gpuVertexState,
            };

            // 创建片段状态
            if (r_renderPipeline.fragment)
            {
                const wgpuFragmentState = WGPUFragmentState.getInstance(device, renderPipeline.fragment, colorFormats);

                gpuRenderPipelineDescriptor.fragment = wgpuFragmentState.gpuFragmentState;
            }

            if (r_renderPipeline.primitive)
            {
                // 创建图元状态
                const wgpuPrimitiveState = WGPUPrimitiveState.getInstance(renderPipeline.primitive, indexFormat);

                gpuRenderPipelineDescriptor.primitive = wgpuPrimitiveState.gpuPrimitiveState;
            }

            if (r_renderPipeline.depthStencil || depthStencilFormat)
            {
                // 创建深度模板状态
                const wgpuDepthStencilState = WGPUDepthStencilState.getInstance(renderPipeline.depthStencil, depthStencilFormat);

                gpuRenderPipelineDescriptor.depthStencil = wgpuDepthStencilState?.gpuDepthStencilState;
            }

            // 创建多重采样状态
            if (r_renderPipeline.multisample || sampleCount)
            {
                const wgpuMultisampleState = WGPUMultisampleState.getInstance(renderPipeline.multisample);

                gpuRenderPipelineDescriptor.multisample = wgpuMultisampleState.gpuMultisampleState;
            }

            // 创建WebGPU渲染管线
            const gpuRenderPipeline = device.createRenderPipeline(gpuRenderPipelineDescriptor);

            return gpuRenderPipeline;
        });
    }

    /**
     * 获取渲染管线实例
     *
     * 根据给定的参数获取对应的WGPURenderPipeline实例，如果不存在则创建新实例。
     *
     * @param device GPU设备对象
     * @param renderPipeline 原始渲染管线配置
     * @param renderPassFormat 渲染通道格式
     * @param vertices 顶点属性
     * @param indexFormat 索引格式
     * @returns 对应的WGPURenderPipeline实例
     */
    static getInstance(device: GPUDevice, renderPipeline: RenderPipeline, renderPassFormat: RenderPassFormat, vertices: VertexAttributes, indexFormat: GPUIndexFormat)
    {
        return this.map.get([device, renderPipeline, renderPassFormat, vertices, indexFormat]) || new WGPURenderPipeline(device, renderPipeline, renderPassFormat, vertices, indexFormat);
    }

    private static readonly map = new ChainMap<[GPUDevice, RenderPipeline, RenderPassFormat, VertexAttributes, GPUIndexFormat], WGPURenderPipeline>();
}
