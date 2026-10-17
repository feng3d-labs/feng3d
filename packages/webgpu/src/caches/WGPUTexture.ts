import { Computed, computed, reactive, toRaw } from '@feng3d/reactivity';
import { ChainMap } from '../utils/ChainMap';
import { Texture, TextureDimension, TextureFormat, TextureSize, TextureSource } from '../data/Texture';
import { TextureDataSource } from '../data/TextureDataSource';
import { TextureImageSource } from '../data/TextureImageSource';
import { RefCountedReactiveObject } from '../utils/GpuResourceRef';
import { isCopyExternalImageSupported, writeImageWithFallback } from '../utils/copyExternalImageFallback';
import { generateMipmap } from '../utils/generate-mipmap';
import { trackCreate, trackFree, addMemory } from '../utils/GPUDeviceStats';
import { trackGpuResource } from '../utils/GpuResourceReleaser';
import { createResourcePool, ResourcePool, ResourcePoolStats } from '../utils/ResourcePool';

/**
 * WebGPU纹理缓存管理器
 *
 * 负责管理WebGPU纹理的完整生命周期，包括：
 * - 纹理的创建和配置
 * - 响应式监听纹理参数变化
 * - 自动重新创建纹理当依赖变化时
 * - 纹理数据的上传和更新
 * - 多级纹理(mipmap)的自动生成
 * - 纹理实例的缓存和复用
 * - 资源清理和内存管理
 *
 * 主要功能：
 * 1. **响应式更新** - 监听纹理配置变化，自动重新创建纹理
 * 2. **数据上传** - 支持从图片、缓冲区等多种数据源上传纹理数据
 * 3. **Mipmap生成** - 自动生成多级纹理，提高渲染质量
 * 4. **实例缓存** - 使用WeakMap缓存纹理实例，避免重复创建
 * 5. **资源管理** - 自动处理纹理的创建和销毁
 * 6. **格式支持** - 智能处理不同纹理格式的使用标志
 *
 * 使用场景：
 * - 渲染管线中的纹理采样
 * - 计算着色器中的纹理访问
 * - 渲染目标纹理(Render Target)
 * - 深度和模板纹理
 * - 立方体贴图和纹理数组
 */
export class WGPUTexture extends RefCountedReactiveObject
{
    /**
     * WebGPU纹理对象
     *
     * 这是实际的GPU纹理实例，用于在渲染管线中存储和访问纹理数据。
     * 当纹理配置发生变化时，此对象会自动重新创建。
     */
    get gpuTexture()
    {
        return this._computedGpuTexture.value;
    }

    private _computedGpuTexture: Computed<GPUTexture>;

    /** 关联的 device（销毁时减统计用） */
    private _device: GPUDevice;

    /**
     * 构造函数
     *
     * 创建纹理管理器实例，并设置响应式监听。
     *
     * @param device GPU设备实例，用于创建纹理
     * @param texture 纹理配置对象，包含纹理参数和数据源
     */
    constructor(device: GPUDevice, texture: Texture)
    {
        super(device);
        this._device = device;

        // 设置纹理创建和更新逻辑
        this._onCreate(device, texture);

        //
        WGPUTexture.map.set([device, texture], this);
        // 归零即摘缓存（issue #89）：归零到提交之间有窗口，getInstance 不能再取到待销毁实例
        this.setZeroRefCall(() => WGPUTexture.map.delete([device, texture]));
        trackCreate(device, 'texture');
        // 数据侧键登记（设计 7.2）：evictTexture / destroyGpuResourcesOf(texture)
        // 经 GpuResourceReleaser 索引确定性销毁本实例（GPUTexture.destroy + 统计 + 缓存移除）
        const untrack = trackGpuResource(texture, this);

        this.destroyCall(() =>
        {
            untrack();
            WGPUTexture.map.delete([device, texture]);
            // 释放时从统计中扣除数量；显存在 _onCreate 的归还路径里扣（池化开启时入池不扣）
            trackFree(device, 'texture');
        });
    }

    /**
     * 设置纹理创建和更新逻辑
     *
     * 使用响应式系统监听纹理配置变化，自动重新创建纹理。
     * 当纹理参数或数据源发生变化时，会触发纹理的重新创建。
     *
     * @param device GPU设备实例
     * @param texture 纹理配置对象
     */
    private _onCreate(device: GPUDevice, texture: Texture)
    {
        const r_texture = reactive(texture);

        let gpuTexture: GPUTexture;
        /** 当前 GPU 纹理对应的池键（归还时按它入池；占位纹理与池化关闭时为 null） */
        let gpuTextureKey: string | null = null;

        // 监听纹理配置变化，自动重新创建纹理
        this._computedGpuTexture = computed(() =>
        {
            // 触发响应式依赖，监听纹理描述符的所有属性
            const r_descriptor = r_texture.descriptor;

            if (r_descriptor)
            {
                r_descriptor.label;
                r_descriptor.size[0];
                r_descriptor.size[1];
                r_descriptor.size[2];
                r_descriptor.format;
                r_descriptor.dimension;
                r_descriptor.viewFormats;
                r_descriptor.generateMipmap;
                r_descriptor.mipLevelCount;
                r_descriptor.sampleCount;
            }
            // 监听纹理数据源变化
            r_texture.sources;

            // 获取纹理描述符
            const descriptor = texture.descriptor;

            // 描述符可能尚未设置（纹理仍在加载中），使用 1x1 默认占位纹理
            if (!descriptor)
            {
                // 创建最小占位 GPU 纹理（1x1 rgba8unorm）
                if (!gpuTexture || gpuTexture.label !== '__placeholder__')
                {
                    // 归还旧纹理：原实现在这条路径上直接覆盖 gpuTexture、不销毁旧的（descriptor 被移除时泄漏一次）
                    if (gpuTexture) WGPUTexture._disposeGpuTexture(device, gpuTextureKey, gpuTexture);
                    gpuTexture = device.createTexture({
                        size: [1, 1],
                        format: 'rgba8unorm',
                        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
                    });
                    gpuTexture.label = '__placeholder__';
                    gpuTextureKey = null;
                    // 占位纹理：1×1×4 字节
                    addMemory(device, 'textureMemory', WGPUTexture._gpuTextureBytes(gpuTexture));
                }

                return gpuTexture;
            }

            // 提取纹理属性
            const { size, viewFormats, sampleCount } = descriptor;
            const format = descriptor.format || 'rgba8unorm';

            // 验证纹理尺寸必须存在
            console.assert(!!size, `无法从纹理中获取到正确的尺寸！size必须设置！`, texture);

            // 根据格式和采样数确定使用标志
            const usage = WGPUTexture._getGPUTextureUsageFlags(format as GPUTextureFormat, sampleCount);

            // 计算mip级别数量
            // 注意：3D 纹理使用计算着色器生成 mipmap，需要考虑深度维度
            const is3DTexture = descriptor.dimension === '3d';
            const mipLevelCount = descriptor.mipLevelCount ?? (
                descriptor.generateMipmap
                    ? (1 + Math.log2(Math.max(size[0], size[1], is3DTexture ? size[2]! : 1)) | 0)
                    : 1
            );

            // 生成纹理标签
            const label = descriptor.label ?? `GPUTexture ${WGPUTexture._autoIndex++}`;
            // 映射纹理维度
            // dimension 缺省时原实现取到 undefined 并交给 WebGPU（由它套用默认 '2d'），断言不改该行为
            const dimension = WGPUTexture._dimensionMap[descriptor.dimension!];

            // 创建GPU纹理描述符
            const gpuTextureDescriptor: GPUTextureDescriptor = {
                label,
                size: [...size] as unknown as GPUExtent3D,
                mipLevelCount,
                sampleCount,
                dimension,
                format: format as GPUTextureFormat,
                usage,
                // viewFormats 可能包含引擎内部扩展格式（eac-*），收敛为 GPUTextureFormat[] 用于描述符
                ...(viewFormats && { viewFormats: [...viewFormats] as GPUTextureFormat[] }),
            };

            // 检查bgra8unorm格式的设备支持
            if (descriptor.format === 'bgra8unorm')
            {
                console.assert(device.features.has('bgra8unorm-storage'), `当前设备不支持 bgra8unorm 格式！请使用其他格式或者添加 "bgra8unorm-storage" 特性！`);
            }

            // 归还旧纹理：池化开启时入池复用，否则按原行为销毁并扣减显存
            if (gpuTexture)
            {
                WGPUTexture._disposeGpuTexture(device, gpuTextureKey, gpuTexture);
            }
            gpuTextureKey = null;

            const poolKey = WGPUTexture._texturePoolKey(gpuTextureDescriptor);
            const pool = WGPUTexture._pool;
            // 池化复用前提（见 _canReuseGpuTexture）：mip 链只有一层、生成 mipmap 关闭、
            // 且 sources 完整覆盖整个纹理——复用后 _writeTextures 会把内容整体重写，不留旧数据
            const reusable = pool && WGPUTexture._canReuseGpuTexture(texture, mipLevelCount)
                ? pool.take(device, poolKey)
                : undefined;

            if (reusable)
            {
                gpuTexture = reusable;
                gpuTexture.label = label;
                gpuTextureKey = poolKey;
            }
            else
            {
                // 创建GPU纹理
                gpuTexture = device.createTexture(gpuTextureDescriptor);
                gpuTextureKey = poolKey;

                // 统计显存：width × height × depthOrArrayLayers × sampleCount × bytesPerPixel × mipFactor
                // - mipFactor：无 mipmap 为 1；有 mipmap 时各级面积几何级数和 ≈ 4/3
                // - 压缩格式（bc/etc/eac）bytesPerPixel 取不到，按 0 记录（数量仍统计）
                // 只有真正新建才计一次；池中驻留的早在新建时已计入，复用不重复计
                addMemory(device, 'textureMemory', WGPUTexture._gpuTextureBytes(gpuTexture));
            }

            // 上传初始纹理数据
            WGPUTexture._writeTextures(device, gpuTexture, texture.sources);

            // 如果需要，自动生成多级纹理
            if (descriptor.generateMipmap)
            {
                generateMipmap(device, gpuTexture);
            }

            // 设置纹理数据写入监听
            this._onWriteTextures(device, gpuTexture, texture);

            return gpuTexture;
        });

        // 注册清理回调，在对象销毁时清理纹理（池化开启时归还入池）
        this.destroyCall(() =>
        {
            if (gpuTexture) WGPUTexture._disposeGpuTexture(device, gpuTextureKey, gpuTexture);
            gpuTextureKey = null;
        });
    }

    /**
     * 设置纹理数据写入监听
     *
     * 监听writeTextures变化，自动将数据写入GPU纹理。
     * 支持动态更新纹理数据，无需重新创建整个纹理。
     *
     * @param device GPU设备实例
     * @param texture 纹理配置对象
     */
    private _onWriteTextures(device: GPUDevice, gpuTexture: GPUTexture, texture: Texture)
    {
        const r_texture = reactive(texture);

        // 监听纹理数据写入请求
        computed(() =>
        {
            // 触发响应式依赖，监听writeTextures数组变化
            r_texture.writeTextures;

            // 将数据写入GPU纹理
            WGPUTexture._writeTextures(device, gpuTexture, texture.writeTextures);

            // 清空写入数据，避免重复处理（用 undefined 而不是 null：writeTextures 在纯数据接口里是可选字段，
            // 读取点都是真值判断，undefined 与原来的 null 行为一致）
            r_texture.writeTextures = undefined;
        }).value;
    }

    /**
     * 获取或创建纹理实例
     *
     * 使用单例模式管理纹理实例，避免重复创建相同的纹理。
     * 如果缓存中已存在对应的实例，则直接返回；否则创建新实例并缓存。
     *
     * @param device GPU设备实例
     * @param texture 纹理配置对象
     * @returns 纹理实例
     */
    static getInstance(device: GPUDevice, texture: Texture)
    {
        // 尝试从缓存中获取现有实例，如果不存在则创建新实例
        return this.map.get([device, texture]) || new WGPUTexture(device, texture);
    }

    /**
     * 实例缓存的存储（R2，issue #614：缓存一律 lazy-init，不在 import 时分配）。
     */
    private static _map: ChainMap<[GPUDevice, Texture], WGPUTexture> | null = null;

    /** 实例缓存（首次访问时创建） */
    private static get map(): ChainMap<[GPUDevice, Texture], WGPUTexture>
    {
        if (!WGPUTexture._map) WGPUTexture._map = new ChainMap();

        return WGPUTexture._map;
    }

    /**
     * 写入纹理数据
     *
     * 将纹理数据从各种数据源上传到GPU纹理中。
     * 支持图片数据源和缓冲区数据源两种类型。
     *
     * @param device GPU设备实例
     * @param gpuTexture 目标WebGPU纹理
     * @param textureSources 纹理数据源数组（可为空——调用方在无数据源时不传，方法体内本就是可选链遍历）
     */
    /**
     * 归还 GPU 纹理：池化开启且拿到池键时入池复用，否则立即销毁并扣减显存。
     *
     * 显存读数只在**真正销毁**时扣减（池中驻留仍占显存），新建时已加过。
     */
    private static _disposeGpuTexture(device: GPUDevice, key: string | null, gpuTexture: GPUTexture): void
    {
        if (WGPUTexture._pool && key)
        {
            WGPUTexture._pool.put(device, key, gpuTexture);

            return;
        }

        gpuTexture.destroy();
        addMemory(device, 'textureMemory', -WGPUTexture._gpuTextureBytes(gpuTexture));
    }

    /**
     * GPU 纹理占用的字节数（与创建时的统计口径一致）。
     *
     * width × height × depthOrArrayLayers × sampleCount × bytesPerPixel × mipFactor；
     * mipFactor：无 mipmap 为 1、有 mipmap 时各级面积几何级数和 ≈ 4/3；
     * 压缩格式（bc/etc/eac）bytesPerPixel 取不到，按 0 记录（数量仍统计）。
     */
    static _gpuTextureBytes(gpuTexture: GPUTexture): number
    {
        const bytesPerPixel = Texture.getTextureBytesPerPixel(gpuTexture.format as TextureFormat) || 0;
        const mipFactor = gpuTexture.mipLevelCount > 1 ? 4 / 3 : 1;

        return gpuTexture.width * gpuTexture.height * gpuTexture.depthOrArrayLayers
            * gpuTexture.sampleCount * bytesPerPixel * mipFactor;
    }

    /** 池化键：描述符里影响 GPU 纹理规格的全部字段 */
    private static _texturePoolKey(descriptor: GPUTextureDescriptor): string
    {
        const size = descriptor.size;
        const sizeText = Array.isArray(size) ? size.join('x') : String(size);
        const viewFormats = descriptor.viewFormats ? [...descriptor.viewFormats].join(',') : '';

        return [
            sizeText,
            descriptor.format,
            descriptor.dimension,
            descriptor.mipLevelCount,
            descriptor.sampleCount,
            descriptor.usage,
            viewFormats,
        ].join('|');
    }

    /**
     * 复用前提：mip 链只有一层、不生成 mipmap、且 sources 完整覆盖整个纹理。
     *
     * 三者缺一都不复用——复用的安全性完全建立在「_writeTextures 会把整张纹理重写」上，
     * 有任何一块没被覆盖，复用就会把上一份内容泄漏到新纹理里。
     */
    private static _canReuseGpuTexture(texture: Texture, mipLevelCount: number): boolean
    {
        const descriptor = texture.descriptor;
        const sources = texture.sources;

        if (!descriptor || descriptor.generateMipmap || mipLevelCount !== 1) return false;
        if (!sources || sources.length !== 1) return false;

        return WGPUTexture._isFullCoverageSource(sources[0], descriptor.size);
    }

    /** 单个纹理源是否从 (0,0,0) 开始、完整覆盖整张纹理的 mip 0 */
    private static _isFullCoverageSource(source: TextureSource, size: TextureSize): boolean
    {
        if ((source.mipLevel ?? 0) !== 0) return false;

        const origin = source.textureOrigin;

        if (origin && (origin[0] !== 0 || origin[1] !== 0 || (origin[2] !== undefined && origin[2] !== 0))) return false;

        const imageSource = source as TextureImageSource;

        if (imageSource.image)
        {
            const imageOrigin = imageSource.imageOrigin;

            if (imageOrigin && (imageOrigin[0] !== 0 || imageOrigin[1] !== 0)) return false;

            return WGPUTexture._coversTexture(imageSource.size ?? TextureImageSource.getTexImageSourceSize(imageSource.image), size);
        }

        const dataSource = source as TextureDataSource;

        if (!dataSource.size) return false;

        const dataOrigin = dataSource.dataImageOrigin;

        if (dataOrigin && (dataOrigin[0] !== 0 || dataOrigin[1] !== 0 || (dataOrigin[2] !== undefined && dataOrigin[2] !== 0))) return false;

        return WGPUTexture._coversTexture(dataSource.size, size);
    }

    /** 拷贝尺寸是否覆盖整张纹理（第三维缺省按 1 比较） */
    private static _coversTexture(copySize: TextureSize, size: TextureSize): boolean
    {
        return copySize[0] === size[0]
            && copySize[1] === size[1]
            && (copySize[2] ?? 1) === (size[2] ?? 1);
    }

    static _writeTextures(device: GPUDevice, gpuTexture: GPUTexture, textureSources: readonly TextureSource[] | undefined)
    {
        textureSources?.forEach((v) =>
        {
            // 处理图片纹理数据源
            const imageSource = v as TextureImageSource;

            if (imageSource.image)
            {
                const { image, flipY, colorSpace, premultipliedAlpha, mipLevel, textureOrigin, aspect } = imageSource;

                // 获取图片实际尺寸
                const imageSize = TextureImageSource.getTexImageSourceSize(imageSource.image);
                const copySize = imageSource.size || imageSize;

                // 检查格式是否支持 copyExternalImageToTexture
                const format = gpuTexture.format as TextureFormat;

                if (!isCopyExternalImageSupported(format))
                {
                    // 使用回退方案：提取像素数据后使用 writeTexture
                    writeImageWithFallback(device, gpuTexture, imageSource, copySize);

                    return;
                }

                let imageOrigin = imageSource.imageOrigin;

                // 处理Y轴翻转，WebGPU的Y轴原点在底部
                if (flipY)
                {
                    const x = imageOrigin?.[0] ?? 0;
                    let y = imageOrigin?.[1] ?? 0;

                    // 计算翻转后的Y坐标
                    y = imageSize[1] - y - copySize[1];

                    imageOrigin = [x, y];
                }

                // 设置图片源信息（toRaw 还原 DOM 元素，避免 reactive 代理被 WebGPU 拒绝）
                const gpuSource: GPUCopyExternalImageSourceInfo = {
                    source: toRaw(image) as GPUCopyExternalImageSourceInfo['source'],
                    origin: imageOrigin ? [imageOrigin[0], imageOrigin[1]] : [0, 0],
                    flipY,
                };

                // 设置纹理目标信息
                const gpuDestination: GPUCopyExternalImageDestInfo = {
                    colorSpace,
                    premultipliedAlpha,
                    mipLevel,
                    origin: textureOrigin ? [textureOrigin[0], textureOrigin[1], textureOrigin[2]] as GPUOrigin3D : undefined,
                    aspect,
                    texture: gpuTexture,
                };

                // 将图片数据复制到纹理
                device.queue.copyExternalImageToTexture(
                    gpuSource,
                    gpuDestination,
                    // TextureSize 是只读元组且元素可能含 undefined，直接传不满足 GPUExtent3DStrict；
                    // 展开成可变数组（与上面 createTexture 的 size 处理一致），运行时值不变
                    [...copySize] as unknown as GPUExtent3D,
                );

                return;
            }

            // 处理缓冲区数据源
            const bufferSource = v as TextureDataSource;
            const { data, dataLayout, dataImageOrigin, size, mipLevel, textureOrigin, aspect } = bufferSource;

            // 缓冲区数据源必须带 size：下面的偏移计算与 writeTexture 都要用它；
            // 原实现在缺省时会把 NaN 一路算下去再交给 WebGPU（必然失败），这里改成明确跳过并告警
            if (!size)
            {
                console.warn(`纹理缓冲区数据源缺少 size，已跳过本次写入`);

                return;
            }

            // 设置纹理目标信息
            const gpuDestination: GPUTexelCopyTextureInfo = {
                mipLevel,
                origin: textureOrigin ? [textureOrigin[0], textureOrigin[1], textureOrigin[2]] as GPUOrigin3D : undefined,
                aspect,
                texture: gpuTexture,
            };

            // 计算数据布局参数
            const offset = dataLayout?.offset || 0;
            const width = dataLayout?.width || size[0];
            const height = dataLayout?.height || size[1];
            const x = dataImageOrigin?.[0] || 0;
            const y = dataImageOrigin?.[1] || 0;
            const depthOrArrayLayers = dataImageOrigin?.[2] || 0;

            // 获取每个像素的字节数（压缩格式取不到，与上面的显存统计一样按 0 处理）
            const bytesPerPixel = Texture.getTextureBytesPerPixel(gpuTexture.format) || 0;

            // 计算GPU缓冲区中的偏移量
            const gpuOffset
                = (offset || 0) // 数据偏移
                + (depthOrArrayLayers || 0) * (width * height * bytesPerPixel) // 数组层偏移
                + (x + (y * width)) * bytesPerPixel // 像素偏移
                ;

            // 设置数据布局
            const gpuDataLayout: GPUTexelCopyBufferLayout = {
                offset: gpuOffset,
                bytesPerRow: width * bytesPerPixel,
                rowsPerImage: height,
            };

            // 将缓冲区数据写入纹理
            device.queue.writeTexture(
                gpuDestination,
                // TS 5.7 起 ArrayBufferView 带 ArrayBufferLike 泛型，与 GPUAllowSharedBufferSource 要求的
                // ArrayBufferView<ArrayBuffer> 对不上；运行时值不变，属 AGENTS §10 的边界转换
                data as unknown as GPUAllowSharedBufferSource,
                gpuDataLayout,
                // 同 copySize：TextureSize 是只读元组，不满足 GPUExtent3DStrict 的可迭代约束
                size as unknown as GPUExtent3D,
            );
        });
    }

    /**
     * 根据纹理格式和采样数确定纹理的使用标志
     *
     * 智能分析纹理格式和采样数，返回合适的使用标志组合。
     * 某些特殊格式（如深度纹理、多重采样纹理）不支持存储绑定。
     *
     * @param format 纹理格式
     * @param sampleCount 采样数（多重采样时使用）
     * @returns 纹理使用标志组合
     */
    static _getGPUTextureUsageFlags(format: GPUTextureFormat, sampleCount?: 4): GPUTextureUsageFlags
    {
        let usage: GPUTextureUsageFlags;

        // 深度纹理、多重采样纹理和某些特定格式不支持存储绑定
        if (format.indexOf('depth') !== -1 // 深度纹理
            || format.indexOf('-srgb') !== -1 // sRGB 格式不支持存储绑定
            || sampleCount // 多重采样纹理
            || format === 'r8unorm'
            || format === 'bgra8unorm' // 需要设备支持 "bgra8unorm-storage" 特性
        )
        {
            // 基础使用标志（不包含存储绑定）
            usage = (0
                | GPUTextureUsage.COPY_SRC        // 复制源
                | GPUTextureUsage.COPY_DST        // 复制目标
                | GPUTextureUsage.TEXTURE_BINDING // 纹理绑定
                | GPUTextureUsage.RENDER_ATTACHMENT); // 渲染附件
        }
        else
        {
            // 完整使用标志（包含存储绑定）
            usage = (0
                | GPUTextureUsage.COPY_SRC        // 复制源
                | GPUTextureUsage.COPY_DST        // 复制目标
                | GPUTextureUsage.TEXTURE_BINDING // 纹理绑定
                | GPUTextureUsage.STORAGE_BINDING // 存储绑定
                | GPUTextureUsage.RENDER_ATTACHMENT); // 渲染附件
        }

        return usage;
    }

    /**
     * 纹理维度映射表
     *
     * 将抽象纹理维度映射到WebGPU的具体维度类型。
     * 立方体贴图在WebGPU中使用2D维度，立方体贴图数组使用3D维度。
     */
    private static readonly _dimensionMap: Record<TextureDimension, GPUTextureDimension> = {
        '1d': '1d',           // 一维纹理
        '2d': '2d',           // 二维纹理
        '2d-array': '2d',     // 二维纹理数组
        cube: '2d',           // 立方体贴图
        'cube-array': '3d',   // 立方体贴图数组
        '3d': '3d',           // 三维纹理
    };

    /**
     * 自动索引计数器
     *
     * 用于为没有指定标签的纹理生成唯一的标签名称。
     * 每次创建新纹理时自动递增。
     */
    private static _autoIndex = 0;

    /**
     * GPU 纹理池（issue #98 阶段 2）。
     *
     * **默认关闭**（null）：关闭时每个归还点都直接 destroy，运行时行为与池化前一致。
     * 池化会改变「显存驻留」与「销毁时机」，未在有 GPU 的真机上看过画面前不应默认开启。
     */
    static _pool: ResourcePool<GPUTexture> | null = null;
}

/**
 * 打开 / 关闭 GPU 纹理池化（issue #98 阶段 2）。
 *
 * 默认关闭。开启后 `WGPUTexture` 的 GPU 纹理在归还点进入池，按描述符规格
 * （尺寸 / 格式 / 维度 / mip 数 / 采样数 / usage / viewFormats）复用。
 *
 * 复用前提是「sources 完整覆盖整个纹理」——复用后会把内容整体重写，不留旧数据；
 * 无 sources（render target）、生成 mipmap、source 只覆盖局部 的纹理一律不复用。
 *
 * @param enabled 是否开启
 * @param maxIdleTotal 每个 device 允许闲置的纹理条数上限（默认 16；置 0 等价于关闭）
 */
export function setGpuTexturePoolEnabled(enabled: boolean, maxIdleTotal = 16): void
{
    if (!enabled || maxIdleTotal <= 0)
    {
        WGPUTexture._pool = null;

        return;
    }

    WGPUTexture._pool = createResourcePool<GPUTexture>({
        maxIdleTotal,
        onDestroy: (device, gpuTexture) =>
        {
            gpuTexture.destroy();
            // 池中驻留同样占显存：只有真正销毁才扣减
            addMemory(device, 'textureMemory', -WGPUTexture._gpuTextureBytes(gpuTexture));
        },
    });
}

/** 当前是否开启 GPU 纹理池化 */
export function isGpuTexturePoolEnabled(): boolean
{
    return WGPUTexture._pool !== null;
}

/** 取 GPU 纹理池读数（未开启时返回全 0） */
export function getGpuTexturePoolStats(device: GPUDevice): ResourcePoolStats
{
    return WGPUTexture._pool ? WGPUTexture._pool.getStats(device) : { reused: 0, released: 0, destroyed: 0, idle: 0 };
}

/** 清空 GPU 纹理池（销毁全部闲置纹理；测试与设备丢失时用） */
export function clearGpuTexturePool(device: GPUDevice): void
{
    WGPUTexture._pool?.clear(device);
}