import { Computed, computed, reactive } from '@feng3d/reactivity';
import { ChainMap } from '../utils/ChainMap';
import { Texture } from '../data/Texture';
import { TextureDataSource } from '../data/TextureDataSource';
import { TextureDimension } from '../types/TextureDimension';
import { TextureFormat } from '../types/TextureFormat';
import { TextureImageSource } from '../data/TextureImageSource';
import { TextureSource } from '../types/TextureSource';
import { ReactiveObject } from '../ReactiveObject';
import { isCopyExternalImageSupported, writeImageWithFallback } from '../utils/copyExternalImageFallback';
import { generateMipmap } from '../utils/generate-mipmap';

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
export class WGPUTexture extends ReactiveObject
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
        super();

        // 设置纹理创建和更新逻辑
        this._onCreate(device, texture);

        //
        WGPUTexture.map.set([device, texture], this);
        this.destroyCall(() =>
        {
            WGPUTexture.map.delete([device, texture]);
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
        const r_this = reactive(this);
        const r_texture = reactive(texture);

        let gpuTexture: GPUTexture;

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
                    ? (1 + Math.log2(Math.max(size[0], size[1], is3DTexture ? size[2] : 1)) | 0)
                    : 1
            );

            // 生成纹理标签
            const label = descriptor.label ?? `GPUTexture ${WGPUTexture._autoIndex++}`;
            // 映射纹理维度
            const dimension = WGPUTexture._dimensionMap[descriptor.dimension];

            // 创建GPU纹理描述符
            const gpuTextureDescriptor: GPUTextureDescriptor = {
                label,
                size,
                mipLevelCount,
                sampleCount,
                dimension,
                format: format as GPUTextureFormat,
                usage,
                viewFormats: viewFormats as Iterable<GPUTextureFormat> | undefined,
            };

            // 检查bgra8unorm格式的设备支持
            if (descriptor.format === 'bgra8unorm')
            {
                console.assert(device.features.has('bgra8unorm-storage'), `当前设备不支持 bgra8unorm 格式！请使用其他格式或者添加 "bgra8unorm-storage" 特性！`);
            }

            // 创建GPU纹理
            gpuTexture?.destroy();
            gpuTexture = device.createTexture(gpuTextureDescriptor);

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

        // 注册清理回调，在对象销毁时清理纹理
        this.destroyCall(() =>
        {
            gpuTexture?.destroy();
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

            // 清空写入数据，避免重复处理
            r_texture.writeTextures = null;
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

    private static readonly map = new ChainMap<[GPUDevice, Texture], WGPUTexture>();

    /**
     * 写入纹理数据
     *
     * 将纹理数据从各种数据源上传到GPU纹理中。
     * 支持图片数据源和缓冲区数据源两种类型。
     *
     * @param device GPU设备实例
     * @param gpuTexture 目标WebGPU纹理
     * @param textureSources 纹理数据源数组
     */
    static _writeTextures(device: GPUDevice, gpuTexture: GPUTexture, textureSources: readonly TextureSource[])
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

                // 设置图片源信息
                const gpuSource: GPUCopyExternalImageSourceInfo = {
                    source: image,
                    origin: imageOrigin,
                    flipY,
                };

                // 设置纹理目标信息
                const gpuDestination: GPUCopyExternalImageDestInfo = {
                    colorSpace,
                    premultipliedAlpha,
                    mipLevel,
                    origin: textureOrigin,
                    aspect,
                    texture: gpuTexture,
                };

                // 将图片数据复制到纹理
                device.queue.copyExternalImageToTexture(
                    gpuSource,
                    gpuDestination,
                    copySize,
                );

                return;
            }

            // 处理缓冲区数据源
            const bufferSource = v as TextureDataSource;
            const { data, dataLayout, dataImageOrigin, size, mipLevel, textureOrigin, aspect } = bufferSource;

            // 设置纹理目标信息
            const gpuDestination: GPUTexelCopyTextureInfo = {
                mipLevel,
                origin: textureOrigin,
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

            // 获取每个像素的字节数
            const bytesPerPixel = Texture.getTextureBytesPerPixel(gpuTexture.format);

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
                data as any,
                gpuDataLayout,
                size,
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
}
