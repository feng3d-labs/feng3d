import type { TextureFormat } from '@feng3d/webgpu';

/** 主色占比（颜色用 `#rrggbb`，比通道数组更省上下文） */
export interface DominantColor
{
    readonly color: string;
    readonly ratio: number;
}

/** 画布像素统计结果（不含图片数据） */
export interface PixelAnalysis
{
    /** 实际采样到的像素数（大画布会按步长抽样） */
    readonly sampled: number;
    /** 量化后的不同颜色数（每通道 5 位，上限 32768） */
    readonly uniqueColors: number;
    /** 出现最多的若干颜色，按占比降序 */
    readonly dominantColors: readonly DominantColor[];
    /** 亮度（0~1，Rec.709 加权）：三者接近说明画面是纯色 */
    readonly minLuminance: number;
    readonly meanLuminance: number;
    readonly maxLuminance: number;
    /** 灰度缩略网格（行优先，0~255）：不下载图片也能看出构图轮廓 */
    readonly grid?: readonly number[];
}

/** 颜色量化位数：5 位/通道，既压得住直方图规模，又足够区分背景与物体 */
const QUANTIZE_BITS = 5;
const QUANTIZE_SHIFT = 8 - QUANTIZE_BITS;

/** 采样上限：像素再多也只统计这么多点，保证大画布下耗时可控 */
const MAX_SAMPLES = 120000;

/** 默认返回的缩略网格边长 */
const DEFAULT_GRID_SIZE = 8;

/** 默认返回的主色数量 */
const DEFAULT_TOP_COLORS = 5;

/** 量化键 → `#rrggbb`（取每个量化区间的上限，避免整体偏暗） */
function quantizedToHex(key: number): string
{
    const channel = (quantized: number) => Math.round((quantized * 255) / ((1 << QUANTIZE_BITS) - 1)).toString(16).padStart(2, '0');

    return `#${channel((key >> (QUANTIZE_BITS * 2)) & 31)}${channel((key >> QUANTIZE_BITS) & 31)}${channel(key & 31)}`;
}

/** 保留 3 位小数（亮度/占比这类值不需要更多精度） */
function round3(value: number): number
{
    return Number(value.toFixed(3));
}

/**
 * 统计画布像素（不生成图片）。
 *
 * 用途：`view.screenshot` 的 base64 动辄数百 KB，会挤爆上下文；而 AI 多数时候只想确认
 * "改了之后画面上到底有没有变化"。本函数把一帧像素压成**几百字节**的判据：
 *
 * - `uniqueColors === 1` + `minLuminance === maxLuminance` → 纯色画面（空白/纯背景/画面冻结）
 * - `maxLuminance === 0` → 全黑（材质或渲染出错的典型症状）
 * - `dominantColors` → 背景色与物体主色各占多少
 * - `grid` → 灰度缩略图，能看出物体的大致位置与轮廓
 *
 * @param pixels 读回的像素字节（每像素 4 字节）
 * @param format 读回像素的纹理格式（`bgra8unorm*` 需交换 R/B 通道）
 * @param width 像素宽度
 * @param height 像素高度
 * @param options.gridSize 缩略网格边长（默认 8，0 表示不返回网格）
 * @param options.topColors 返回的主色数量（默认 5）
 * @param options.region 只统计画布上的一块区域（像素坐标，会被裁到画布内）；
 *   配合 `view.probe` 的 `project` 可精确回答"我关心的那一块渲染出来了吗"
 */
export function analyzePixels(
    pixels: Uint8Array,
    format: TextureFormat | undefined,
    width: number,
    height: number,
    options?: {
        readonly gridSize?: number,
        readonly topColors?: number,
        readonly region?: { readonly x: number, readonly y: number, readonly width: number, readonly height: number },
    },
): PixelAnalysis
{
    if (!(width > 0) || !(height > 0)) throw new Error(`画布尺寸无效：${width}x${height}`);

    // 数据与尺寸对不上时直接报错：只统计"能读到的那一小块"会给出貌似合理的结论
    // （比如"画面只有一种颜色"），而这正是最误导人的那种失败
    const expectedBytes = width * height * 4;
    if (pixels.length < expectedBytes)
    {
        throw new Error(`像素数据不足：${width}x${height} 需要 ${expectedBytes} 字节，实际 ${pixels.length}`);
    }

    // 只看画面的一块区域：与 `view.probe` 的 project 配合，能精确回答"我关心的那一块渲染出来了吗"
    const region = options?.region;
    const x0 = region ? Math.max(0, Math.floor(region.x)) : 0;
    const y0 = region ? Math.max(0, Math.floor(region.y)) : 0;
    const x1 = region ? Math.min(width, x0 + Math.floor(region.width)) : width;
    const y1 = region ? Math.min(height, y0 + Math.floor(region.height)) : height;
    if (x1 <= x0 || y1 <= y0)
    {
        throw new Error(`region 超出画布或为空：${JSON.stringify(region)}（画布 ${width}x${height}）`);
    }

    const swapRB = format === 'bgra8unorm' || format === 'bgra8unorm-srgb';
    // 抽样步长按**区域**大小算：用整幅画布的像素数会让小区域只采到零星几个点
    const stride = Math.max(1, Math.floor(Math.sqrt(((x1 - x0) * (y1 - y0)) / MAX_SAMPLES)));

    const gridSize = Math.max(0, Math.floor(options?.gridSize ?? DEFAULT_GRID_SIZE));
    const topColors = Math.max(1, Math.floor(options?.topColors ?? DEFAULT_TOP_COLORS));

    const histogram = new Map<number, number>();
    const gridSum = gridSize > 0 ? new Float64Array(gridSize * gridSize) : undefined;
    const gridCount = gridSize > 0 ? new Float64Array(gridSize * gridSize) : undefined;

    let sampled = 0;
    let luminanceSum = 0;
    let minLuminance = 1;
    let maxLuminance = 0;

    for (let y = y0; y < y1; y += stride)
    {
        for (let x = x0; x < x1; x += stride)
        {
            const offset = (y * width + x) * 4;
            if (offset + 3 >= pixels.length) continue;
            const r = swapRB ? pixels[offset + 2] : pixels[offset];
            const g = pixels[offset + 1];
            const b = swapRB ? pixels[offset] : pixels[offset + 2];

            const key = ((r >> QUANTIZE_SHIFT) << (QUANTIZE_BITS * 2))
                | ((g >> QUANTIZE_SHIFT) << QUANTIZE_BITS)
                | (b >> QUANTIZE_SHIFT);
            histogram.set(key, (histogram.get(key) ?? 0) + 1);

            const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
            luminanceSum += luminance;
            if (luminance < minLuminance) minLuminance = luminance;
            if (luminance > maxLuminance) maxLuminance = luminance;

            if (gridSum && gridCount)
            {
                // 网格铺在**统计范围**上，而不是整幅画布：只看一块区域时，网格就是那块区域的缩略图
                const gx = Math.min(gridSize - 1, Math.floor(((x - x0) * gridSize) / (x1 - x0)));
                const gy = Math.min(gridSize - 1, Math.floor(((y - y0) * gridSize) / (y1 - y0)));
                const cell = gy * gridSize + gx;
                gridSum[cell] += luminance * 255;
                gridCount[cell]++;
            }

            sampled++;
        }
    }

    if (sampled === 0) throw new Error('没有采样到任何像素（画布为空或尺寸与数据不匹配）');

    const dominantColors = [...histogram.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, topColors)
        .map(([key, count]) => ({ color: quantizedToHex(key), ratio: round3(count / sampled) }));

    const grid = gridSum && gridCount
        ? Array.from(gridSum, (sum, index) => (gridCount[index] > 0 ? Math.round(sum / gridCount[index]) : 0))
        : undefined;

    return {
        sampled,
        uniqueColors: histogram.size,
        dominantColors,
        minLuminance: round3(minLuminance),
        meanLuminance: round3(luminanceSum / sampled),
        maxLuminance: round3(maxLuminance),
        // 回显实际统计的范围（会被裁到画布内），免得调用方以为算的是整幅
        ...(region ? { region: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } } : {}),
        ...(grid ? { grid } : {}),
    };
}
