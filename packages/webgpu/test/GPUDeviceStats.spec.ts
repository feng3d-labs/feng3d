import { describe, expect, it } from 'vitest';

import { addMemory, getGPUDeviceStats } from '../src/utils/GPUDeviceStats';

/**
 * 显存读数累计（issue #90）。
 *
 * `totalMemory` 文档里写明是 `textureMemory + bufferMemory` 的派生值。
 * 原实现在 delta 已并入对应字段后，又在 totalMemory 上加了一份 delta，
 * 于是每调用一次 `addMemory()` 读数就虚高一个 delta——这里逐项钉住。
 *
 * 只需要一个对象身份做 WeakMap key，不需要真的 GPU 设备。
 */
describe('GPUDeviceStats 显存累计（issue #90）', () =>
{
    const mkDevice = () => ({}) as GPUDevice;

    it('初始读数全为 0', () =>
    {
        const stats = getGPUDeviceStats(mkDevice());

        expect(stats.textureMemory).toBe(0);
        expect(stats.bufferMemory).toBe(0);
        expect(stats.totalMemory).toBe(0);
    });

    it('单字段变化：totalMemory 只增加一份 delta（不是两份）', () =>
    {
        const device = mkDevice();

        addMemory(device, 'textureMemory', 100);

        const stats = getGPUDeviceStats(device);

        expect(stats.textureMemory).toBe(100);
        expect(stats.bufferMemory).toBe(0);
        expect(stats.totalMemory).toBe(100);
    });

    it('两字段同时变化：totalMemory 为两者之和', () =>
    {
        const device = mkDevice();

        addMemory(device, 'textureMemory', 100);
        addMemory(device, 'bufferMemory', 50);

        const stats = getGPUDeviceStats(device);

        expect(stats.textureMemory).toBe(100);
        expect(stats.bufferMemory).toBe(50);
        expect(stats.totalMemory).toBe(150);
    });

    it('负 delta（释放）同步减少，且 totalMemory 始终等于两字段之和', () =>
    {
        const device = mkDevice();

        addMemory(device, 'textureMemory', 1000);
        addMemory(device, 'bufferMemory', 200);
        addMemory(device, 'textureMemory', -400);

        const stats = getGPUDeviceStats(device);

        expect(stats.textureMemory).toBe(600);
        expect(stats.bufferMemory).toBe(200);
        expect(stats.totalMemory).toBe(800);
        expect(stats.totalMemory).toBe(stats.textureMemory + stats.bufferMemory);
    });

    it('多次小额累计不漂移（等价于一次性大额）', () =>
    {
        const deviceA = mkDevice();
        const deviceB = mkDevice();

        for (let i = 0; i < 100; i++)
        {
            addMemory(deviceA, 'textureMemory', 1024);
            addMemory(deviceA, 'bufferMemory', 512);
        }
        addMemory(deviceB, 'textureMemory', 1024 * 100);
        addMemory(deviceB, 'bufferMemory', 512 * 100);

        expect(getGPUDeviceStats(deviceA).totalMemory).toBe(getGPUDeviceStats(deviceB).totalMemory);
        expect(getGPUDeviceStats(deviceA).totalMemory).toBe((1024 + 512) * 100);
    });
});
