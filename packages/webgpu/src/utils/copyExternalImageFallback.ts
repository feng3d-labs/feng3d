import { Texture } from '../data/Texture';
import { TextureFormat } from '../data/Texture';
import { TextureImageSource } from '../data/TextureImageSource';

/**
 * 支持 copyExternalImageToTexture 的纹理格式集合
 *
 * 根据 WebGPU 规范，只有以下格式支持从外部图像复制：
 * - rgba8unorm
 * - rgba8unorm-srgb
 * - bgra8unorm
 * - bgra8unorm-srgb
 * - rgb10a2unorm
 * - rgba16float
 */
const COPY_EXTERNAL_IMAGE_SUPPORTED_FORMATS: Set<TextureFormat> = new Set([
    'rgba8unorm',
    'rgba8unorm-srgb',
    'bgra8unorm',
    'bgra8unorm-srgb',
    'rgb10a2unorm',
    'rgba16float',
]);

/**
 * 检查纹理格式是否支持 copyExternalImageToTexture
 *
 * @param format 纹理格式
 * @returns 是否支持
 */
export function isCopyExternalImageSupported(format: TextureFormat): boolean
{
    return COPY_EXTERNAL_IMAGE_SUPPORTED_FORMATS.has(format);
}

/**
 * 将 32 位浮点数转换为 16 位半精度浮点数
 *
 * 使用 IEEE 754 半精度格式：1 位符号 + 5 位指数 + 10 位尾数
 *
 * @param value 32 位浮点数
 * @returns 16 位半精度浮点数（存储在 Uint16 中）
 */
function float32ToFloat16(value: number): number
{
    const floatView = new Float32Array(1);
    const int32View = new Int32Array(floatView.buffer);

    floatView[0] = value;
    const x = int32View[0];

    // 提取符号、指数和尾数
    const sign = (x >> 31) & 0x1;
    let exponent = (x >> 23) & 0xFF;
    let mantissa = x & 0x7FFFFF;

    // 处理特殊情况
    if (exponent === 255)
    {
        // Infinity 或 NaN
        return (sign << 15) | 0x7C00 | (mantissa ? 0x200 : 0);
    }
    if (exponent === 0)
    {
        // 零或非规格化数
        return sign << 15;
    }

    // 调整指数偏移（从 127 到 15）
    exponent = exponent - 127 + 15;

    if (exponent >= 31)
    {
        // 溢出，返回无穷大
        return (sign << 15) | 0x7C00;
    }
    if (exponent <= 0)
    {
        // 下溢，返回零
        return sign << 15;
    }

    // 截断尾数到 10 位
    mantissa = mantissa >> 13;

    return (sign << 15) | (exponent << 10) | mantissa;
}

/**
 * 从图像源提取像素数据
 *
 * 使用 Canvas 2D API 将图像绘制到画布上，然后提取像素数据。
 * 用于不支持 copyExternalImageToTexture 的纹理格式。
 *
 * @param image 图像源
 * @param flipY 是否翻转 Y 轴
 * @returns 提取的 RGBA 像素数据
 */
function extractPixelDataFromImage(image: TexImageSource, flipY?: boolean): Uint8Array
{
    // 获取图像尺寸
    const size = TextureImageSource.getTexImageSourceSize(image);
    const [width, height] = size;

    // 创建离屏画布
    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // 如果需要翻转 Y 轴
    if (flipY)
    {
        ctx.translate(0, height);
        ctx.scale(1, -1);
    }

    // 绘制图像到画布
    ctx.drawImage(image as CanvasImageSource, 0, 0);

    // 提取像素数据
    const imageData = ctx.getImageData(0, 0, width, height);

    return new Uint8Array(imageData.data.buffer);
}

/**
 * 将 RGBA8 像素数据转换为目标纹理格式
 *
 * @param rgba8Data 原始 RGBA8 像素数据
 * @param format 目标纹理格式
 * @param width 图像宽度
 * @param height 图像高度
 * @returns 转换后的像素数据
 */
function convertPixelData(
    rgba8Data: Uint8Array,
    format: TextureFormat,
    width: number,
    height: number,
): ArrayBufferView
{
    const pixelCount = width * height;

    switch (format)
    {
        // Float32 格式
        case 'rgba32float': {
            const result = new Float32Array(pixelCount * 4);

            for (let i = 0; i < pixelCount; i++)
            {
                result[i * 4 + 0] = rgba8Data[i * 4 + 0] / 255;
                result[i * 4 + 1] = rgba8Data[i * 4 + 1] / 255;
                result[i * 4 + 2] = rgba8Data[i * 4 + 2] / 255;
                result[i * 4 + 3] = rgba8Data[i * 4 + 3] / 255;
            }

            return result;
        }
        case 'rg32float': {
            const result = new Float32Array(pixelCount * 2);

            for (let i = 0; i < pixelCount; i++)
            {
                result[i * 2 + 0] = rgba8Data[i * 4 + 0] / 255;
                result[i * 2 + 1] = rgba8Data[i * 4 + 1] / 255;
            }

            return result;
        }
        case 'r32float': {
            const result = new Float32Array(pixelCount);

            for (let i = 0; i < pixelCount; i++)
            {
                result[i] = rgba8Data[i * 4 + 0] / 255;
            }

            return result;
        }

        // Float16 格式 (使用 Uint16Array 存储 half-float)
        case 'rg16float': {
            const result = new Uint16Array(pixelCount * 2);

            for (let i = 0; i < pixelCount; i++)
            {
                result[i * 2 + 0] = float32ToFloat16(rgba8Data[i * 4 + 0] / 255);
                result[i * 2 + 1] = float32ToFloat16(rgba8Data[i * 4 + 1] / 255);
            }

            return result;
        }
        case 'r16float': {
            const result = new Uint16Array(pixelCount);

            for (let i = 0; i < pixelCount; i++)
            {
                result[i] = float32ToFloat16(rgba8Data[i * 4 + 0] / 255);
            }

            return result;
        }

        // 整数格式
        case 'rgba8uint': {
            // 直接使用原始数据，因为格式相同
            return new Uint8Array(rgba8Data);
        }
        case 'rgba8sint': {
            const result = new Int8Array(pixelCount * 4);

            for (let i = 0; i < rgba8Data.length; i++)
            {
                // 将 0-255 映射到 -128 到 127
                result[i] = rgba8Data[i] - 128;
            }

            return result;
        }
        case 'rg8uint': {
            const result = new Uint8Array(pixelCount * 2);

            for (let i = 0; i < pixelCount; i++)
            {
                result[i * 2 + 0] = rgba8Data[i * 4 + 0];
                result[i * 2 + 1] = rgba8Data[i * 4 + 1];
            }

            return result;
        }
        case 'r8uint': {
            const result = new Uint8Array(pixelCount);

            for (let i = 0; i < pixelCount; i++)
            {
                result[i] = rgba8Data[i * 4 + 0];
            }

            return result;
        }

        // 16位整数格式
        case 'rgba16uint': {
            const result = new Uint16Array(pixelCount * 4);

            for (let i = 0; i < pixelCount; i++)
            {
                // 将 0-255 映射到 0-65535
                result[i * 4 + 0] = rgba8Data[i * 4 + 0] * 257;
                result[i * 4 + 1] = rgba8Data[i * 4 + 1] * 257;
                result[i * 4 + 2] = rgba8Data[i * 4 + 2] * 257;
                result[i * 4 + 3] = rgba8Data[i * 4 + 3] * 257;
            }

            return result;
        }

        // 32位整数格式
        case 'rgba32uint': {
            const result = new Uint32Array(pixelCount * 4);

            for (let i = 0; i < pixelCount; i++)
            {
                result[i * 4 + 0] = rgba8Data[i * 4 + 0];
                result[i * 4 + 1] = rgba8Data[i * 4 + 1];
                result[i * 4 + 2] = rgba8Data[i * 4 + 2];
                result[i * 4 + 3] = rgba8Data[i * 4 + 3];
            }

            return result;
        }

        default:
            console.warn(`[WebGPU] 不支持将图像数据转换为格式 '${format}'，使用原始 RGBA8 数据`);

            return rgba8Data;
    }
}

/**
 * 使用回退方案写入图像数据到不支持 copyExternalImageToTexture 的纹理格式
 *
 * 此方法通过以下步骤处理不支持的格式：
 * 1. 使用 Canvas 2D API 提取图像的 RGBA 像素数据
 * 2. 将像素数据转换为目标格式所需的类型
 * 3. 使用 writeTexture 将转换后的数据写入纹理
 *
 * @param device GPU设备实例
 * @param gpuTexture 目标GPU纹理
 * @param imageSource 图像源配置
 * @param copySize 复制尺寸
 */
export function writeImageWithFallback(
    device: GPUDevice,
    gpuTexture: GPUTexture,
    imageSource: TextureImageSource,
    copySize: readonly [number, number, number?],
): void
{
    const { image, flipY, mipLevel, textureOrigin, aspect } = imageSource;
    const format = gpuTexture.format as TextureFormat;

    // 发出警告
    console.warn(
        `[WebGPU] 纹理格式 '${format}' 不支持 copyExternalImageToTexture。`
        + ` 支持的格式：rgba8unorm, rgba8unorm-srgb, bgra8unorm, bgra8unorm-srgb, rgb10a2unorm, rgba16float。`
        + ` 已使用回退方案（Canvas 提取像素 + writeTexture），可能影响性能。`,
    );

    // 提取原始 RGBA8 像素数据
    const rgba8Data = extractPixelDataFromImage(image, flipY);

    // 将 RGBA8 数据转换为目标格式
    const targetData = convertPixelData(rgba8Data, format, copySize[0], copySize[1]);

    // 获取每个像素的字节数
    const bytesPerPixel = Texture.getTextureBytesPerPixel(format);

    // 设置纹理目标信息
    const gpuDestination: GPUTexelCopyTextureInfo = {
        mipLevel: mipLevel ?? 0,
        origin: textureOrigin,
        aspect,
        texture: gpuTexture,
    };

    // 设置数据布局
    const gpuDataLayout: GPUTexelCopyBufferLayout = {
        offset: 0,
        bytesPerRow: copySize[0] * bytesPerPixel,
        rowsPerImage: copySize[1],
    };

    // 将数据写入纹理
    device.queue.writeTexture(
        gpuDestination,
        targetData as BufferSource,
        gpuDataLayout,
        copySize,
    );
}

