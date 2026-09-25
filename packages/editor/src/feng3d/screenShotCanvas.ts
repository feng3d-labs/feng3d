import type { TextureFormat } from '@feng3d/webgpu';

/** 立方体贴图旧数据（六面像素，`TextureCube` 已从主仓移除） */
export interface LegacyTextureCubeData
{
    readonly _pixels?: readonly (CanvasImageSource | undefined)[];
}

/** 创建指定尺寸的 2D 画布并取上下文（失败即抛，不留空实现） */
function create2DCanvas(width: number, height: number): CanvasRenderingContext2D
{
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context2D = canvas.getContext('2d');
    if (!context2D) throw new Error('[Feng3dScreenShot] 无法创建 2D 画布上下文');

    return context2D;
}

/**
 * GPU 读回像素 → 2D 画布 → PNG DataURL。
 *
 * 画布纹理格式通常为 `bgra8unorm`（`navigator.gpu.getPreferredCanvasFormat()`），
 * 读回的是 BGRA 字节序，写入 `ImageData`（RGBA）前需交换 R/B 通道。
 *
 * @param pixels 读回的像素字节（RGBA/BGRA，每像素 4 字节）
 * @param format 读回像素的纹理格式
 * @param width 像素宽度
 * @param height 像素高度
 * @param scaleToWidth 可选：把结果缩放到该宽度（高度按比例）。主视图截帧要给 AI 看时，
 *   原尺寸 PNG 的 base64 常达数百 KB，缩小后仍足以判断画面内容
 * @returns PNG DataURL
 */
export function pixelsToDataURL(
    pixels: Uint8Array,
    format: TextureFormat | undefined,
    width: number,
    height: number,
    scaleToWidth?: number,
): string
{
    const context2D = create2DCanvas(width, height);
    const imageData = context2D.createImageData(width, height);
    const data = imageData.data;
    const swapRB = format === 'bgra8unorm' || format === 'bgra8unorm-srgb';
    for (let i = 0; i < width * height; i++)
    {
        const offset = i * 4;
        data[offset] = swapRB ? pixels[offset + 2] : pixels[offset];
        data[offset + 1] = pixels[offset + 1];
        data[offset + 2] = swapRB ? pixels[offset] : pixels[offset + 2];
        data[offset + 3] = pixels[offset + 3];
    }
    context2D.putImageData(imageData, 0, 0);

    const sourceCanvas = context2D.canvas;
    if (scaleToWidth === undefined || scaleToWidth >= width) return sourceCanvas.toDataURL('image/png');

    const targetWidth = Math.max(1, Math.round(scaleToWidth));
    const targetHeight = Math.max(1, Math.round((height * targetWidth) / width));
    const scaledContext = create2DCanvas(targetWidth, targetHeight);
    scaledContext.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

    return scaledContext.canvas.toDataURL('image/png');
}

/**
 * 贴图像素 → 2D 画布（铺满正方形）→ PNG DataURL。
 *
 * @param pixels 贴图像素（`ImageData` 或可直接 `drawImage` 的图像源）
 * @param size 输出正方形边长（像素）
 * @returns PNG DataURL
 */
export function imageToDataURL(pixels: ImageData | CanvasImageSource, size: number): string
{
    const context2D = create2DCanvas(size, size);

    let source: CanvasImageSource;
    if (pixels instanceof ImageData)
    {
        const sourceContext = create2DCanvas(pixels.width, pixels.height);
        sourceContext.putImageData(pixels, 0, 0);
        source = sourceContext.canvas;
    }
    else
    {
        source = pixels;
    }

    context2D.drawImage(source, 0, 0, size, size);

    return context2D.canvas.toDataURL('image/png');
}

/**
 * 立方体六面像素拼成十字布局 → PNG DataURL（旧实现保留）。
 *
 * @param textureCube 立方体贴图旧数据
 * @param width 输出边长（像素）
 * @returns PNG DataURL
 */
export function textureCubeToDataURL(textureCube: LegacyTextureCubeData, width = 64): string
{
    const pixels = textureCube._pixels ?? [];
    const context2D = create2DCanvas(width, width);

    context2D.fillStyle = 'black';

    const w4 = Math.round(width / 4);
    const Yoffset = w4 / 2;
    // 六面在十字布局中的位置（面序与旧 `TextureCube` 一致）
    const faces: readonly [number, number, CanvasImageSource | undefined][] = [
        [w4 * 2, w4, pixels[0]],
        [w4, 0, pixels[1]],
        [w4, w4, pixels[2]],
        [0, w4, pixels[3]],
        [w4, w4 * 2, pixels[4]],
        [w4 * 3, w4, pixels[5]],
    ];
    for (const [x, y, image] of faces)
    {
        if (image) context2D.drawImage(image, x, y + Yoffset, w4, w4);
        else context2D.fillRect(x, y + Yoffset, w4, w4);
    }

    return context2D.canvas.toDataURL();
}
