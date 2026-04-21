import { computed, Computed, reactive } from '@feng3d/reactivity';
import { ChainMap } from '../utils/ChainMap';
import { RenderPassDescriptor } from '../data/RenderPassDescriptor';
import { Texture } from '../data/Texture';
import { ReactiveObject } from '../ReactiveObject';
import { WGPUTexture } from './WGPUTexture';
import { WGPUTextureView } from './WGPUTextureView';

import '../data/RenderPassDepthStencilAttachment';

/**
 * WebGPU渲染通道深度模板附件缓存管理器
 *
 * 负责管理WebGPU渲染通道深度模板附件的完整生命周期，包括：
 * - 深度模板附件的创建和配置
 * - 响应式监听深度模板附件参数变化
 * - 自动重新创建深度模板附件当依赖变化时
 * - 自动生成深度纹理的管理
 * - 深度模板附件实例的缓存和复用
 * - 资源清理和内存管理
 *
 * 主要功能：
 * 1. **深度模板附件管理** - 自动创建和配置GPU深度模板附件
 * 2. **自动深度纹理生成** - 当未提供深度纹理时自动生成
 * 3. **响应式更新** - 监听深度模板附件参数变化，自动重新创建
 * 4. **实例缓存** - 使用WeakMap缓存深度模板附件实例，避免重复创建
 * 5. **资源管理** - 自动处理深度模板附件和自动生成纹理的清理
 * 6. **尺寸同步** - 自动同步纹理尺寸到渲染通道描述符
 * 7. **生命周期管理** - 统一管理自动生成深度纹理的创建和销毁
 *
 * 使用场景：
 * - 渲染管线中的深度测试
 * - 模板测试和模板写入
 * - 深度预渲染和深度缓冲
 * - 阴影映射和深度图生成
 * - 渲染通道的深度配置管理
 */
export class WGPURenderPassDepthStencilAttachment extends ReactiveObject
{
    /**
     * WebGPU渲染通道深度模板附件对象
     *
     * 这是实际的GPU深度模板附件实例，用于在渲染通道中指定深度和模板测试目标。
     * 当深度模板附件配置发生变化时，此对象会自动重新创建。
     */
    get gpuRenderPassDepthStencilAttachment()
    {
        return this._computedGpuRenderPassDepthStencilAttachment.value;
    }

    private _computedGpuRenderPassDepthStencilAttachment: Computed<GPURenderPassDepthStencilAttachment>;

    /**
     * 构造函数
     *
     * 创建深度模板附件管理器实例，并设置响应式监听。
     *
     * @param device GPU设备实例，用于创建深度模板附件
     * @param depthStencilAttachment 深度模板附件配置对象，包含视图和操作参数
     * @param descriptor 渲染通道描述符，用于获取附件尺寸等参数
     */
    constructor(device: GPUDevice, descriptor: RenderPassDescriptor)
    {
        super();

        // 设置深度模板附件创建和更新逻辑
        this._onCreate(device, descriptor);
        //
        WGPURenderPassDepthStencilAttachment.map.set([device, descriptor], this);
        this.destroyCall(() =>
        {
            WGPURenderPassDepthStencilAttachment.map.delete([device, descriptor]);
        })
    }

    /**
     * 设置深度模板附件创建和更新逻辑
     *
     * 使用响应式系统监听深度模板附件配置变化，自动重新创建深度模板附件。
     * 当深度模板附件参数或渲染通道描述符发生变化时，会触发深度模板附件的重新创建。
     * 支持自动生成深度纹理，当未提供深度纹理时自动创建。
     * 直接管理自动生成深度纹理的生命周期，确保资源正确清理。
     *
     * @param device GPU设备实例
     * @param depthStencilAttachment 深度模板附件配置对象
     * @param descriptor 渲染通道描述符
     */
    private _onCreate(device: GPUDevice, descriptor: RenderPassDescriptor)
    {
        const r_descriptor = reactive(descriptor);

        // 自动生成的深度纹理实例，用于管理深度纹理的生命周期
        let autoCreateDepthTexture: WGPUTexture;

        // 监听深度模板附件配置变化，自动重新创建深度模板附件
        this._computedGpuRenderPassDepthStencilAttachment = computed(() =>
        {
            //
            const r_depthStencilAttachment = r_descriptor.depthStencilAttachment;

            if (!r_depthStencilAttachment)
            {
                return null;
            }

            const depthStencilAttachment = descriptor.depthStencilAttachment;

            let textureView: GPUTextureView;

            // 如果提供了深度纹理视图，使用现有的纹理视图
            if (r_depthStencilAttachment.view)
            {
                // 获取深度纹理视图实例
                const wGPUTextureView = WGPUTextureView.getInstance(device, descriptor.depthStencilAttachment.view);

                textureView = wGPUTextureView.textureView;
            }
            // 如果没有提供深度纹理视图，自动生成一个
            else
            {
                // 监听渲染通道描述符的附件尺寸变化
                r_descriptor.attachmentSize.width;
                r_descriptor.attachmentSize.height;
                r_descriptor.sampleCount;

                // 创建自动生成的深度纹理配置
                const autoDepthTexture: Texture = {
                    descriptor: {
                        label: '自动生成的深度纹理',
                        size: [descriptor.attachmentSize.width, descriptor.attachmentSize.height],
                        format: 'depth24plus',
                        sampleCount: descriptor.sampleCount,
                    },
                };

                // 删除旧的深度纹理
                autoCreateDepthTexture?.destroy();
                // 创建自动生成的深度纹理实例，直接管理其生命周期
                autoCreateDepthTexture = WGPUTexture.getInstance(device, autoDepthTexture);
                // 直接从GPU纹理创建视图，避免额外的纹理视图缓存
                textureView = autoCreateDepthTexture.gpuTexture.createView();
            }

            // 创建深度模板附件配置
            const gpuRenderPassDepthStencilAttachment: GPURenderPassDepthStencilAttachment = {
                view: textureView,
            };

            gpuRenderPassDepthStencilAttachment.depthClearValue = r_depthStencilAttachment.depthClearValue ?? 1;
            gpuRenderPassDepthStencilAttachment.depthLoadOp = r_depthStencilAttachment.depthLoadOp ?? 'clear';
            gpuRenderPassDepthStencilAttachment.depthStoreOp = r_depthStencilAttachment.depthStoreOp ?? 'store';
            gpuRenderPassDepthStencilAttachment.depthReadOnly = r_depthStencilAttachment.depthReadOnly ?? false;

            if (r_depthStencilAttachment.stencilClearValue)
            {
                gpuRenderPassDepthStencilAttachment.stencilClearValue = depthStencilAttachment.stencilClearValue;
            }

            if (r_depthStencilAttachment.stencilLoadOp)
            {
                gpuRenderPassDepthStencilAttachment.stencilLoadOp = depthStencilAttachment.stencilLoadOp;
            }

            if (r_depthStencilAttachment.stencilStoreOp)
            {
                gpuRenderPassDepthStencilAttachment.stencilStoreOp = depthStencilAttachment.stencilStoreOp;
            }

            if (r_depthStencilAttachment.stencilReadOnly)
            {
                gpuRenderPassDepthStencilAttachment.stencilReadOnly = depthStencilAttachment.stencilReadOnly;
            }

            // 更新深度模板附件引用
            return gpuRenderPassDepthStencilAttachment;
        });

        // 注册销毁回调，确保在对象销毁时清理自动生成的深度纹理
        this.destroyCall(() =>
        {
            // 销毁自动生成的深度纹理
            autoCreateDepthTexture?.destroy();
        });
    }

    /**
     * 获取或创建深度模板附件实例
     *
     * 使用单例模式管理深度模板附件实例，避免重复创建相同的深度模板附件。
     * 如果缓存中已存在对应的实例，则直接返回；否则创建新实例并缓存。
     *
     * @param device GPU设备实例
     * @param depthStencilAttachment 深度模板附件配置对象
     * @param descriptor 渲染通道描述符
     * @returns 深度模板附件实例
     */
    static getInstance(device: GPUDevice, descriptor: RenderPassDescriptor)
    {
        // 尝试从缓存中获取现有实例，如果不存在则创建新实例
        return this.map.get([device, descriptor]) || new WGPURenderPassDepthStencilAttachment(device, descriptor);
    }

    private static readonly map = new ChainMap<[GPUDevice, RenderPassDescriptor], WGPURenderPassDepthStencilAttachment>();
}
