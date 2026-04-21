import { Computed, computed, reactive } from '@feng3d/reactivity';
import { CanvasContext } from '../data/CanvasContext';
import { ChainMap } from '../utils/ChainMap';
import { watcher } from '@feng3d/watcher';

import '../data/CanvasContext';
import { ReactiveObject } from '../ReactiveObject';

/**
 * WebGPU画布上下文缓存管理器
 *
 * 负责管理WebGPU画布上下文的完整生命周期，包括：
 * - 画布元素的获取和绑定
 * - GPU画布上下文的创建和配置
 * - 画布尺寸变化的响应式监听
 * - 画布配置的自动更新
 * - 画布上下文实例的缓存和复用
 * - 资源清理和内存管理
 *
 * 主要功能：
 * 1. **画布管理** - 支持HTMLCanvasElement和OffscreenCanvas两种画布类型
 * 2. **配置管理** - 自动配置GPU画布上下文，包括格式、用途等参数
 * 3. **尺寸同步** - 响应式监听画布尺寸变化，自动同步到配置对象
 * 4. **实例缓存** - 使用WeakMap缓存画布上下文实例，避免重复创建
 * 5. **版本控制** - 提供版本号机制，跟踪画布上下文的变化
 * 6. **资源管理** - 自动处理画布相关资源的清理
 *
 * 使用场景：
 * - 渲染管线中的渲染目标
 * - 离屏渲染和合成
 * - 多画布应用管理
 * - 画布尺寸动态调整
 * - 画布配置热更新
 */
export class WGPUCanvasContext extends ReactiveObject
{
    /**
     * 画布元素
     *
     * 可以是HTMLCanvasElement（用于DOM渲染）或OffscreenCanvas（用于离屏渲染）。
     * 当canvasId变化时，此元素会自动更新。
     */
    get canvas()
    {
        return this._computedCanvas.value;
    }

    private _computedCanvas: Computed<HTMLCanvasElement | OffscreenCanvas>;

    /**
     * WebGPU画布上下文
     *
     * 用于与GPU进行交互的画布上下文对象，提供纹理获取和渲染功能。
     * 当画布元素变化时，此上下文会自动重新创建。
     */
    get gpuCanvasContext()
    {
        return this._computedGpuCanvasContext.value;
    }

    private _computedGpuCanvasContext: Computed<GPUCanvasContext>;

    /**
     * 画布上下文版本号
     *
     * 当画布上下文配置发生变化时，版本号会自动递增。
     * 可用于检测画布上下文是否需要重新获取纹理。
     */
    get version()
    {
        return this._computedVersion.value;
    }

    private _computedVersion: Computed<number>;

    /**
     * 构造函数
     *
     * 创建画布上下文管理器实例，并设置响应式监听。
     *
     * @param device GPU设备实例，用于配置画布上下文
     * @param context 画布上下文配置对象，包含画布ID和配置参数
     */
    constructor(device: GPUDevice, context: CanvasContext)
    {
        super();

        // 设置画布元素和GPU上下文创建逻辑
        this._onCreate(device, context);

        //
        WGPUCanvasContext.map.set([device, context], this);
        this.destroyCall(() =>
        {
            WGPUCanvasContext.map.delete([device, context]);
        });
    }

    /**
     * 设置画布元素和GPU上下文创建逻辑
     *
     * 监听canvasId变化，自动获取对应的画布元素并创建GPU画布上下文。
     * 支持字符串ID（通过document.getElementById获取）和直接传入画布元素两种方式。
     *
     * @param context 画布上下文配置对象
     */
    private _onCreate(device: GPUDevice, context: CanvasContext)
    {
        const r_context = reactive(context);

        this._computedCanvas = computed(() =>
        {
            // 触发响应式依赖，监听canvasId变化
            r_context.canvasId;

            const canvasId = context.canvasId;

            // 根据canvasId类型获取画布元素
            const canvas = typeof canvasId === 'string'
                ? document.getElementById(canvasId) as HTMLCanvasElement
                : canvasId;

            return canvas;
        });

        let offCanvasSizeChanged: () => void;

        const versionObject = { version: 0 };
        const r_versionObject = reactive(versionObject);

        // 监听画布ID变化，自动创建画布元素和GPU上下文
        this._computedGpuCanvasContext = computed(() =>
        {
            const canvas = this._computedCanvas.value
            const gpuCanvasContext = canvas?.getContext('webgpu') as GPUCanvasContext;

            // 设置画布配置监听
            this._onConfiguration(device, gpuCanvasContext, context, versionObject);

            // 设置画布变化监听
            offCanvasSizeChanged?.();
            offCanvasSizeChanged = this._onCanvasSizeChanged(canvas, versionObject);

            return gpuCanvasContext;
        });

        this._computedVersion = computed(() =>
        {
            return r_versionObject.version;
        });

        this.destroyCall(() =>
        {
            offCanvasSizeChanged?.();
        });
    }

    /**
     * 设置画布配置监听
     *
     * 监听画布配置变化，自动重新配置GPU画布上下文。
     * 当配置参数发生变化时，会触发画布上下文的重新配置和版本号递增。
     *
     * @param device GPU设备实例
     * @param context 画布上下文配置对象
     */
    private _onConfiguration(device: GPUDevice, gpuCanvasContext: GPUCanvasContext, context: CanvasContext, versionObject: { version: number })
    {
        const r_context = reactive(context);
        const r_versionObject = reactive(versionObject);

        // 监听画布配置变化，自动重新配置GPU画布上下文
        computed(() =>
        {
            // 触发响应式依赖，监听配置的各个属性变化
            const r_configuration = r_context.configuration;

            if (r_configuration)
            {
                r_configuration.format;
                r_configuration.usage;
                r_configuration.viewFormats?.concat();
                r_configuration.colorSpace;
                r_configuration.toneMapping?.mode;
                r_configuration.alphaMode;
            }

            // 获取当前配置
            const configuration = context.configuration;

            // 获取纹理格式，默认使用设备首选格式
            const format = configuration?.format ?? navigator.gpu.getPreferredCanvasFormat();

            // 构建纹理用途标志，确保包含所有必要的用途
            const usage = (configuration?.usage ?? 0)
                | GPUTextureUsage.COPY_SRC        // 复制源
                | GPUTextureUsage.COPY_DST        // 复制目标
                | GPUTextureUsage.TEXTURE_BINDING // 纹理绑定
                | GPUTextureUsage.STORAGE_BINDING // 存储绑定
                | GPUTextureUsage.RENDER_ATTACHMENT; // 渲染附件

            // 创建GPU画布配置对象
            const gpuCanvasConfiguration: GPUCanvasConfiguration = {
                ...configuration,
                device: device,
                usage,
                format,
            };

            // 配置GPU画布上下文
            gpuCanvasContext.configure(gpuCanvasConfiguration);

            //
            r_versionObject.version = versionObject.version + 1;
        }).value;
    }

    /**
     * 设置画布变化监听
     *
     * 监听画布元素变化，自动注册和取消画布尺寸变化的监听器。
     * 当画布尺寸发生变化时，会自动同步到配置对象中。
     *
     * @param context 画布上下文配置对象
     */
    private _onCanvasSizeChanged(canvas: HTMLCanvasElement | OffscreenCanvas, versionObject: { version: number })
    {
        const r_versionObject = reactive(versionObject);

        const _onChanged = () =>
        {
            r_versionObject.version = versionObject.version + 1;
        }

        watcher.watch(canvas, 'width', _onChanged);
        watcher.watch(canvas, 'height', _onChanged);

        return () =>
        {
            watcher.unwatch(canvas, 'width', _onChanged);
            watcher.unwatch(canvas, 'height', _onChanged);
        }
    }

    /**
     * 获取或创建画布上下文实例
     *
     * 使用单例模式管理画布上下文实例，避免重复创建相同的画布上下文。
     * 如果缓存中已存在对应的实例，则直接返回；否则创建新实例并缓存。
     *
     * @param device GPU设备实例
     * @param context 画布上下文配置对象
     * @returns 画布上下文实例
     */
    static getInstance(device: GPUDevice, context: CanvasContext)
    {
        // 尝试从缓存中获取现有实例，如果不存在则创建新实例
        return this.map.get([device, context]) || new WGPUCanvasContext(device, context);
    }

    private static readonly map = new ChainMap<[GPUDevice, CanvasContext], WGPUCanvasContext>();
}
