import { afterEach, describe, expect, it } from 'vitest';

import { WGPUBuffer, setGpuBufferPoolEnabled, getGpuBufferPoolStats, clearGpuBufferPool } from '../src/caches/WGPUBuffer';
import { getGPUDeviceStats } from '../src/utils/GPUDeviceStats';

/** 记录销毁与写入的 mock GPUBuffer */
interface MockGPUBuffer
{
    label?: string;
    readonly size: number;
    destroyed: number;
    getMappedRange(): ArrayBuffer;
    unmap(): void;
    destroy(): void;
}

/** 只需要 createBuffer / queue.writeBuffer 的 mock device（池化是 CPU 侧逻辑） */
function createMockDevice()
{
    const created: MockGPUBuffer[] = [];
    const written: MockGPUBuffer[] = [];
    const device = {
        createBuffer: (descriptor: GPUBufferDescriptor) =>
        {
            const buffer: MockGPUBuffer = {
                label: descriptor.label,
                size: descriptor.size,
                destroyed: 0,
                getMappedRange: () => new ArrayBuffer(descriptor.size),
                unmap: () =>
                { },
                destroy()
                {
                    this.destroyed++;
                },
            };

            created.push(buffer);

            return buffer as unknown as GPUBuffer;
        },
        queue: {
            writeBuffer: (buffer: GPUBuffer) =>
            {
                written.push(buffer as unknown as MockGPUBuffer);
            },
        },
    } as unknown as GPUDevice;

    return { device, created, written };
}

const SIZE = 16;

/** 构造一个「初始数据完整覆盖缓冲区」的 Buffer 配置（池化复用前提） */
function makeBufferConfig(seed: number)
{
    return { size: SIZE, data: new Float32Array([seed, seed + 1, seed + 2, seed + 3]).buffer };
}

describe('WGPUBuffer 池化（issue #98）', () =>
{
    afterEach(() =>
    {
        setGpuBufferPoolEnabled(false);
    });

    it('默认关闭：销毁即真销毁，recreate 仍是两条独立的 GPU 缓冲区', () =>
    {
        const { device, created } = createMockDevice();

        expect(getGpuBufferPoolStats(device).idle).toBe(0);

        const first = WGPUBuffer.getInstance(device, makeBufferConfig(1));

        expect(first.gpuBuffer).toBeTruthy();
        first.destroy();

        const second = WGPUBuffer.getInstance(device, makeBufferConfig(5));

        expect(second.gpuBuffer).toBeTruthy();
        expect(created.length).toBe(2);
        expect(created[0].destroyed).toBe(1);

        second.destroy();
    });

    it('开启池化：同规格复用，churn 下 createBuffer 只发生一次', () =>
    {
        const { device, created, written } = createMockDevice();

        setGpuBufferPoolEnabled(true);

        const first = WGPUBuffer.getInstance(device, makeBufferConfig(1));
        const firstGpuBuffer = first.gpuBuffer as unknown as MockGPUBuffer;

        expect(created.length).toBe(1);
        // 新建走 mappedAtCreation，不经过 queue.writeBuffer
        expect(written.length).toBe(0);

        first.destroy();
        // 归还入池：不销毁
        expect(firstGpuBuffer.destroyed).toBe(0);
        expect(getGpuBufferPoolStats(device).idle).toBe(1);

        const second = WGPUBuffer.getInstance(device, makeBufferConfig(5));

        // 复用同一条 GPUBuffer：没有新的分配，且改用队列写入
        expect(second.gpuBuffer).toBe(firstGpuBuffer as unknown as GPUBuffer);
        expect(created.length).toBe(1);
        expect(written.length).toBe(1);
        expect(getGpuBufferPoolStats(device).reused).toBe(1);

        second.destroy();
        expect(getGpuBufferPoolStats(device).idle).toBe(1);
    });

    it('开启池化：数据未完整覆盖缓冲区（byteLength !== size）时不复用', () =>
    {
        const { device, created } = createMockDevice();

        setGpuBufferPoolEnabled(true);

        // byteLength 10 < size 12：尾部 2 字节无法用 writeBuffer 单独清理，故不池化
        const first = WGPUBuffer.getInstance(device, { size: 12, data: new Int8Array(10).buffer });

        first.gpuBuffer;
        first.destroy();

        const second = WGPUBuffer.getInstance(device, { size: 12, data: new Int8Array(10).buffer });

        second.gpuBuffer;
        expect(created.length).toBe(2);
        expect(getGpuBufferPoolStats(device).reused).toBe(0);

        second.destroy();
    });

    it('开启池化：不同规格不复用', () =>
    {
        const { device, created } = createMockDevice();

        setGpuBufferPoolEnabled(true);

        const first = WGPUBuffer.getInstance(device, makeBufferConfig(1));

        first.gpuBuffer;
        first.destroy();

        const second = WGPUBuffer.getInstance(device, { size: 32, data: new Float32Array(8).buffer });

        second.gpuBuffer;
        expect(created.length).toBe(2);
        expect(getGpuBufferPoolStats(device).reused).toBe(0);
        expect(getGpuBufferPoolStats(device).idle).toBe(1);

        second.destroy();
    });

    it('显存读数：池中驻留仍计入，clear 后才归零（关闭池化时销毁即归零）', () =>
    {
        const { device } = createMockDevice();

        setGpuBufferPoolEnabled(true);

        const pooled = WGPUBuffer.getInstance(device, makeBufferConfig(1));

        pooled.gpuBuffer;
        expect(getGPUDeviceStats(device).bufferMemory).toBe(SIZE);

        pooled.destroy();
        // 池中驻留 = 仍占用显存
        expect(getGPUDeviceStats(device).bufferMemory).toBe(SIZE);

        clearGpuBufferPool(device);
        expect(getGPUDeviceStats(device).bufferMemory).toBe(0);

        setGpuBufferPoolEnabled(false);

        const released = WGPUBuffer.getInstance(device, makeBufferConfig(9));

        released.gpuBuffer;
        expect(getGPUDeviceStats(device).bufferMemory).toBe(SIZE);

        released.destroy();
        expect(getGPUDeviceStats(device).bufferMemory).toBe(0);
    });
});
