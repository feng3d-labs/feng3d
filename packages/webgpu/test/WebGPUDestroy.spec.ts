import { describe, expect, it } from 'vitest';

import { WebGPU } from '../src/WebGPU';
import { WGPUBuffer } from '../src/caches/WGPUBuffer';
import { destroyGpuResourcesOf, trackGpuResource } from '../src/utils/GpuResourceReleaser';
import { getPendingReleaseCount } from '../src/utils/GpuResourceRef';
import { getGPUDeviceStats } from '../src/utils/GPUDeviceStats';

/** 记录销毁次数的 mock GPUBuffer（与 GpuResourceRef.spec.ts 同一形态） */
function createMockDevice()
{
    const created: { destroyed: number, size: number }[] = [];
    const device = {
        createBuffer: (descriptor: GPUBufferDescriptor) =>
        {
            const buffer = {
                label: descriptor.label,
                size: descriptor.size,
                destroyed: 0,
                getMappedRange: () => new ArrayBuffer(descriptor.size),
                unmap: () =>
                { },
                destroy()
                {
                    buffer.destroyed++;
                },
            };

            created.push(buffer);

            return buffer as unknown as GPUBuffer;
        },
        queue: { writeBuffer: () =>
        { } },
    } as unknown as GPUDevice;

    return { device, created };
}

const SIZE = 16;

/**
 * 设备销毁时必须清空待销毁队列（issue #89 的收尾）。
 *
 * 归零的资源排队等下一次提交后销毁；若设备在这**之前**就被销毁，队列里那些
 * destroyCall 永远不会执行——GPU 对象随设备回收了，但统计的 `freed` 不涨，
 * `created == freed + 存活` 从此不成立。所以 `WebGPU.destroy()` 要在置空 device
 * 之前先 flush。
 */
describe('WebGPU.destroy 清空待销毁队列（issue #89）', () =>
{
    it('设备销毁前 flush：队列清空、GPU 对象销毁、统计记账', () =>
    {
        const { device, created } = createMockDevice();
        const webgpu = new WebGPU();

        webgpu.device = device;

        const buffer = WGPUBuffer.getInstance(device, { size: SIZE, data: new Float32Array([1, 2, 3, 4]).buffer });

        // 先触达一次：GPU 缓冲区是 computed 懒创建的，不读就不会真的 createBuffer
        expect(buffer.gpuBuffer).toBeTruthy();

        const key = {};

        trackGpuResource(key, buffer);
        destroyGpuResourcesOf(key);

        // 归零后只是排队，还没销毁
        expect(getPendingReleaseCount(device)).toBe(1);
        expect(created[0].destroyed).toBe(0);

        webgpu.destroy();

        // 销毁设备 → 队列被清空，且资源真的销毁（统计 freed 才能涨）
        expect(getPendingReleaseCount(device)).toBe(0);
        expect(created[0].destroyed).toBe(1);

        const stats = getGPUDeviceStats(device);

        expect(stats.buffer.created).toBe(stats.buffer.freed + stats.buffer.count);
        expect(stats.buffer.count).toBe(0);
    });

    it('未初始化（device 为空）时 destroy 不抛错', () =>
    {
        const webgpu = new WebGPU();

        // @ts-expect-error 刻意构造未初始化状态（device 声明为非空但运行期可能未赋值）
        webgpu.device = undefined;

        expect(() => webgpu.destroy()).not.toThrow();
    });
});
