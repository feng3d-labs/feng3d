import { describe, expect, it } from 'vitest';
import { analyzePixels } from '../src/feng3d/pixelStats';

/** 造一张纯色 RGBA 图 */
function solid(rgba: readonly number[], width: number, height: number): Uint8Array
{
    const pixels = new Uint8Array(width * height * 4);
    for (let i = 0; i < width * height; i++) pixels.set(rgba, i * 4);

    return pixels;
}

/** 按"每列一个灰度"造图（x < 分界为黑，否则为白） */
function leftRightSplit(width: number, height: number): Uint8Array
{
    const pixels = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++)
    {
        for (let x = 0; x < width; x++)
        {
            const value = x < width / 2 ? 0 : 255;
            pixels.set([value, value, value, 255], (y * width + x) * 4);
        }
    }

    return pixels;
}

describe('analyzePixels', () =>
{
    it('纯黑画面：只有一种颜色、亮度恒为 0', () =>
    {
        const result = analyzePixels(solid([0, 0, 0, 255], 4, 4), 'rgba8unorm', 4, 4);

        expect(result.uniqueColors).toBe(1);
        expect(result.minLuminance).toBe(0);
        expect(result.maxLuminance).toBe(0);
        expect(result.meanLuminance).toBe(0);
        expect(result.dominantColors).toEqual([{ color: '#000000', ratio: 1 }]);
    });

    it('纯白画面：亮度为 1（"是否全黑"就靠这个判据）', () =>
    {
        const result = analyzePixels(solid([255, 255, 255, 255], 2, 2), 'rgba8unorm', 2, 2);

        expect(result.uniqueColors).toBe(1);
        expect(result.maxLuminance).toBe(1);
        expect(result.dominantColors[0].color).toBe('#ffffff');
    });

    it('左右两半黑白：缩略网格能指出内容在哪一侧', () =>
    {
        const result = analyzePixels(leftRightSplit(4, 2), 'rgba8unorm', 4, 2, { gridSize: 2 });

        expect(result.uniqueColors).toBe(2);
        // 行优先：第 0 行「左、右」，第 1 行「左、右」
        expect(result.grid).toEqual([0, 255, 0, 255]);
    });

    it('bgra8unorm 会交换 R/B 通道', () =>
    {
        // BGRA 字节序里 B=0、G=0、R=255，解析出来应当是红色
        const result = analyzePixels(solid([0, 0, 255, 255], 2, 2), 'bgra8unorm', 2, 2);

        expect(result.dominantColors[0].color).toBe('#ff0000');
    });

    it('同一量化区间的相邻颜色会被合并', () =>
    {
        // 0 与 7 同属每通道 5 位的第 0 段，所以量化后是"一种颜色"
        const pixels = new Uint8Array([0, 0, 0, 255, 7, 7, 7, 255]);
        const result = analyzePixels(pixels, 'rgba8unorm', 2, 1);

        expect(result.uniqueColors).toBe(1);
        expect(result.sampled).toBe(2);
    });

    it('主色按占比降序，占比之和不超过 1', () =>
    {
        const pixels = new Uint8Array([
            255, 0, 0, 255,
            255, 0, 0, 255,
            255, 0, 0, 255,
            0, 0, 255, 255,
        ]);
        const result = analyzePixels(pixels, 'rgba8unorm', 4, 1);

        expect(result.uniqueColors).toBe(2);
        expect(result.dominantColors[0]).toEqual({ color: '#ff0000', ratio: 0.75 });
        expect(result.dominantColors[1].color).toBe('#0000ff');
        expect(result.dominantColors.reduce((sum, item) => sum + item.ratio, 0)).toBeLessThanOrEqual(1);
    });

    it('topColors 限制主色数量', () =>
    {
        const pixels = new Uint8Array([
            255, 0, 0, 255,
            0, 255, 0, 255,
            0, 0, 255, 255,
            255, 255, 255, 255,
        ]);
        const result = analyzePixels(pixels, 'rgba8unorm', 4, 1, { topColors: 2 });

        expect(result.uniqueColors).toBe(4);
        expect(result.dominantColors).toHaveLength(2);
    });

    it('gridSize 为 0 时不返回网格', () =>
    {
        const result = analyzePixels(solid([0, 0, 0, 255], 2, 2), 'rgba8unorm', 2, 2, { gridSize: 0 });

        expect(result.grid).toBeUndefined();
    });

    it('大画布按步长抽样，采样点数明显少于总像素', () =>
    {
        const width = 1000;
        const height = 1000;
        const result = analyzePixels(solid([10, 20, 30, 255], width, height), 'rgba8unorm', width, height);

        expect(result.sampled).toBeGreaterThan(0);
        expect(result.sampled).toBeLessThan(width * height);
    });

    it('尺寸非法直接报错，而不是返回空统计', () =>
    {
        expect(() => analyzePixels(new Uint8Array(0), 'rgba8unorm', 0, 0)).toThrow(/画布尺寸无效/);
    });

    it('像素数据与尺寸不匹配时报错（只统计一小块会得出误导结论）', () =>
    {
        expect(() => analyzePixels(new Uint8Array(4), 'rgba8unorm', 4, 4)).toThrow(/像素数据不足/);
    });
});
