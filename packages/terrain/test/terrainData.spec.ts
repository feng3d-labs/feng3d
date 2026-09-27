import { describe, expect, it } from 'vitest';
import { TerrainData } from '../src/TerrainData';

/**
 * terrain 原先只有一个 `assert.ok(!!terrain)` 的占位用例——只要模块能 import 就通过，
 * 恒定成立。这里换成 `TerrainData` 的纯数据派生部分（不需要 GPU 设备）。
 */
describe('TerrainData', () =>
{
    it('高度图宽高都等于分辨率', () =>
    {
        const data = new TerrainData();

        expect(data.heightmapResolution).toBe(513);
        expect(data.heightmapWidth).toBe(data.heightmapResolution);
        expect(data.heightmapHeight).toBe(data.heightmapResolution);
    });

    it('修改分辨率后宽高同步变化', () =>
    {
        const data = new TerrainData();

        data.heightmapResolution = 1025;

        expect(data.heightmapWidth).toBe(1025);
        expect(data.heightmapHeight).toBe(1025);
    });

    it('高度图采样尺寸 = 地形尺寸 / 分辨率', () =>
    {
        const data = new TerrainData();

        expect(data.size.x).toBe(500);
        expect(data.size.y).toBe(600);
        expect(data.size.z).toBe(500);

        const scale = data.heightmapScale;

        expect(scale.x).toBeCloseTo(500 / 513, 10);
        expect(scale.y).toBeCloseTo(600 / 513, 10);
        expect(scale.z).toBeCloseTo(500 / 513, 10);
    });

    it('heightmapScale 是派生值，改尺寸立刻反映', () =>
    {
        const data = new TerrainData();

        data.size.x = 1026;

        expect(data.heightmapScale.x).toBeCloseTo(2, 10);
    });
});
