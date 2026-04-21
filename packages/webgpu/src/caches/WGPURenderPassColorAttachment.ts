import { computed, Computed, reactive } from '@feng3d/reactivity';
import { CanvasContext } from '../data/CanvasContext';
import { ChainMap } from '../utils/ChainMap';
import { defaultRenderPassColorAttachment, RenderPassColorAttachment } from '../data/RenderPassColorAttachment';
import { RenderPassDescriptor } from '../data/RenderPassDescriptor';
import { Texture } from '../data/Texture';
import { unreadonly } from '../utils/unreadonly';
import { ReactiveObject } from '../ReactiveObject';
import { WGPUTexture } from './WGPUTexture';
import { WGPUTextureLike } from './WGPUTextureLike';
import { WGPUTextureView } from './WGPUTextureView';

/**
 * WebGPU渲染通道颜色附件缓存管理器
 *
 * 负责管理WebGPU渲染通道颜色附件的完整生命周期，包括：
 * - 颜色附件的创建和配置
 * - 响应式监听颜色附件参数变化
 * - 自动重新创建颜色附件当依赖变化时
 * - 多重采样纹理的自动生成和管理
 * - 颜色附件实例的缓存和复用
 * - 资源清理和内存管理
 *
 * 主要功能：
 * 1. **颜色附件管理** - 自动创建和配置GPU颜色附件
 * 2. **多重采样支持** - 自动生成多重采样纹理和解析目标，直接管理纹理生命周期
 * 3. **响应式更新** - 监听颜色附件参数变化，自动重新创建
 * 4. **实例缓存** - 使用WeakMap缓存颜色附件实例，避免重复创建
 * 5. **资源管理** - 自动处理颜色附件和多重采样纹理的清理
 * 6. **尺寸同步** - 自动同步纹理尺寸到渲染通道描述符
 * 7. **生命周期管理** - 统一管理多重采样纹理的创建和销毁
 *
 * 使用场景：
 * - 渲染管线中的颜色输出
 * - 多重采样抗锯齿渲染
 * - 离屏渲染和后期处理
 * - 多渲染目标(MRT)渲染
 * - 渲染通道的配置管理
 */
export class WGPURenderPassColorAttachment extends ReactiveObject
{
    /**
     * WebGPU渲染通道颜色附件对象
     *
     * 这是实际的GPU颜色附件实例，用于在渲染通道中指定颜色输出目标。
     * 当颜色附件配置发生变化时，此对象会自动重新创建。
     */
    get gpuRenderPassColorAttachment()
    {
        return this._computedGpuRenderPassColorAttachment.value;
    }

    private _computedGpuRenderPassColorAttachment: Computed<GPURenderPassColorAttachment>;

    /**
     * 构造函数
     *
     * 创建颜色附件管理器实例，并设置响应式监听。
     *
     * @param device GPU设备实例，用于创建颜色附件
     * @param colorAttachment 颜色附件配置对象，包含视图和操作参数
     * @param descriptor 渲染通道描述符，用于获取采样数等参数
     */
    constructor(device: GPUDevice, colorAttachment: RenderPassColorAttachment, descriptor: RenderPassDescriptor, canvasContext?: CanvasContext)
    {
        super();

        // 设置颜色附件创建和更新逻辑
        this._onCreate(device, colorAttachment, descriptor, canvasContext);
        //
        WGPURenderPassColorAttachment.map.set([device, colorAttachment, descriptor, canvasContext], this);
        this.destroyCall(() =>
        {
            WGPURenderPassColorAttachment.map.delete([device, colorAttachment, descriptor, canvasContext]);
        })
    }

    /**
     * 设置颜色附件创建和更新逻辑
     *
     * 使用响应式系统监听颜色附件配置变化，自动重新创建颜色附件。
     * 当颜色附件参数或渲染通道描述符发生变化时，会触发颜色附件的重新创建。
     * 支持多重采样渲染，自动生成多重采样纹理和解析目标。
     * 直接管理多重采样纹理的生命周期，确保资源正确清理。
     *
     * @param device GPU设备实例
     * @param colorAttachment 颜色附件配置对象
     * @param descriptor 渲染通道描述符
     * @param canvasContext 画布上下文，当view缺省时使用
     */
    private _onCreate(device: GPUDevice, colorAttachment: RenderPassColorAttachment, descriptor: RenderPassDescriptor, canvasContext?: CanvasContext)
    {
        const r_colorAttachment = reactive(colorAttachment);
        const r_descriptor = reactive(descriptor);

        const gpuRenderPassColorAttachment: GPURenderPassColorAttachment = {} as any;

        const computedLoadOp = computed(() =>
        {
            r_colorAttachment.loadOp;

            gpuRenderPassColorAttachment.loadOp = colorAttachment.loadOp ?? defaultRenderPassColorAttachment.loadOp;
        });

        const computedClearValue = computed(() =>
        {
            r_colorAttachment.clearValue;

            gpuRenderPassColorAttachment.clearValue = colorAttachment.clearValue ?? defaultRenderPassColorAttachment.clearValue;
        });

        const computedStoreOp = computed(() =>
        {
            r_colorAttachment.storeOp;

            gpuRenderPassColorAttachment.storeOp = colorAttachment.storeOp ?? defaultRenderPassColorAttachment.storeOp;
        });

        const computedDepthSlice = computed(() =>
        {
            if (r_colorAttachment.depthSlice)
            {
                gpuRenderPassColorAttachment.depthSlice = colorAttachment.depthSlice;
            }
            else
            {
                delete gpuRenderPassColorAttachment.depthSlice;
            }
        });

        const computedView = computed(() =>
        {
            r_colorAttachment.view;

            // 如果view缺省，使用canvasContext创建view
            const view = colorAttachment.view || (canvasContext ? { texture: { context: canvasContext } } : undefined);

            if (!view) return;

            // 标记为颜色附件
            unreadonly(view).isUsedAsColorAttachment = true;

            // 获取纹理视图实例
            const wGPUTextureView = WGPUTextureView.getInstance(device, view);
            const textureView = wGPUTextureView?.textureView;

            if (!textureView) return;

            const sampleCount = r_descriptor.sampleCount;

            if (sampleCount)
            {
                gpuRenderPassColorAttachment.resolveTarget = textureView;
            }
            else
            {
                gpuRenderPassColorAttachment.view = textureView;
            }
        });

        // 多重采样纹理实例，用于管理多重采样纹理的生命周期
        let multisampleGPUTexture: WGPUTexture;
        let multisampleTextureKey: string;
        const computedMultisampleTexture = computed(() =>
        {
            // 检查是否需要多重采样
            const sampleCount = r_descriptor.sampleCount;

            if (!sampleCount)
            {
                gpuRenderPassColorAttachment.resolveTarget = undefined;

                return;
            }

            // 获取原始纹理信息
            const view = colorAttachment.view || (canvasContext ? { texture: { context: canvasContext } } : undefined);

            if (!view?.texture) return;

            const wgpuTexture = WGPUTextureLike.getInstance(device, view.texture);
            const gpuTexture = wgpuTexture.gpuTexture;

            const key = [gpuTexture.width, gpuTexture.height, gpuTexture.depthOrArrayLayers, gpuTexture.format, sampleCount].join(',');

            if (multisampleTextureKey === key) return;
            multisampleTextureKey = key;

            // 创建多重采样纹理配置
            const multisampleTexture: Texture = {
                descriptor: {
                    label: '自动生成多重采样的纹理 ' + key,
                    sampleCount,
                    size: [gpuTexture.width, gpuTexture.height, gpuTexture.depthOrArrayLayers],
                    format: gpuTexture.format,
                },
            };

            // 创建多重采样纹理实例，直接管理其生命周期
            multisampleGPUTexture?.destroy();
            multisampleGPUTexture = WGPUTexture.getInstance(device, multisampleTexture);
            // 直接从GPU纹理创建视图，避免额外的纹理视图缓存
            const multisampleTextureView = multisampleGPUTexture.gpuTexture.createView();

            // 设置多重采样配置
            gpuRenderPassColorAttachment.view = multisampleTextureView;        // 多重采样纹理作为渲染目标
        });

        // 监听颜色附件配置变化，自动重新创建颜色附件
        this._computedGpuRenderPassColorAttachment = computed(() =>
        {
            computedLoadOp.value;
            computedClearValue.value;
            computedStoreOp.value;
            computedDepthSlice.value;
            computedView.value;
            computedMultisampleTexture.value;

            // 更新颜色附件引用
            return gpuRenderPassColorAttachment;
        });

        // 注册销毁回调，确保在对象销毁时清理多重采样纹理
        this.destroyCall(() =>
        {
            multisampleGPUTexture?.destroy();
        });
    }

    /**
     * 获取或创建颜色附件实例
     *
     * 使用单例模式管理颜色附件实例，避免重复创建相同的颜色附件。
     * 如果缓存中已存在对应的实例，则直接返回；否则创建新实例并缓存。
     *
     * @param device GPU设备实例
     * @param colorAttachment 颜色附件配置对象
     * @param descriptor 渲染通道描述符
     * @returns 颜色附件实例
     */
    static getInstance(device: GPUDevice, colorAttachment: RenderPassColorAttachment, descriptor: RenderPassDescriptor, canvasContext?: CanvasContext)
    {
        // 尝试从缓存中获取现有实例，如果不存在则创建新实例
        return this.map.get([device, colorAttachment, descriptor, canvasContext]) || new WGPURenderPassColorAttachment(device, colorAttachment, descriptor, canvasContext);
    }

    private static readonly map = new ChainMap<[GPUDevice, RenderPassColorAttachment, RenderPassDescriptor, CanvasContext], WGPURenderPassColorAttachment>();
}
