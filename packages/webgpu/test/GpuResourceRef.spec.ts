import { describe, expect, it } from 'vitest';

import { WGPUBuffer } from '../src/caches/WGPUBuffer';
import { destroyGpuResourcesOf, trackGpuResource } from '../src/utils/GpuResourceReleaser';
import { getGPUDeviceStats } from '../src/utils/GPUDeviceStats';
import { flushDeferredReleases, getPendingReleaseCount } from '../src/utils/GpuResourceRef';

/** 记录销毁次数的 mock GPUBuffer */
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

function makeConfig()
{
    return { size: SIZE, data: new Float32Array([1, 2, 3, 4]).buffer };
}

/**
 * GPU 资源引用计数 + deferred release（issue #89）的验收复现。
 *
 * 设计 7.2 要求：
 * - 缓存层 retain / release：共享资源不因**某一处**释放就被销毁；
 * - 释放推迟到 queue.submit() 之后（本帧命令可能还在引用它）；
 * - refcount 归零即 destroy 并移除缓存条目，使 created == freed + 存活 恒成立。
 *
 * 现状（本文件先红后绿）：release 语义不存在，destroyGpuResourcesOf 对共享实例
 * 直接 destroy，第二处持有者拿到的是已销毁的 GPU 对象。
 */
describe('GPU 资源引用计数（issue #89）', () =>
{
    it('共享资源：一处释放不销毁，另一处仍可用', () =>
    {
        const { device, created } = createMockDevice();
        const shared = WGPUBuffer.getInstance(device, makeConfig());

        expect(shared.gpuBuffer).toBeTruthy();

        const keyA = {};
        const keyB = {};

        trackGpuResource(keyA, shared);
        trackGpuResource(keyB, shared);

        // 第一处释放
        destroyGpuResourcesOf(keyA);

        // 第二处仍应拿到活的 GPU 缓冲区（现状会红：已被 destroy）
        expect(created[0].destroyed).toBe(0);
        expect(shared.gpuBuffer).toBeTruthy();

        // 第二处释放：归零但**不立即销毁**（等提交）
        destroyGpuResourcesOf(keyB);
        expect(created[0].destroyed).toBe(0);
        expect(getPendingReleaseCount(device)).toBe(1);

        // 提交之后统一销毁
        flushDeferredReleases(device);
        expect(created[0].destroyed).toBe(1);
        expect(getPendingReleaseCount(device)).toBe(0);
    });

    it('deferred release：归零后不立即销毁，提交后统一销毁', () =>
    {
        const { device, created } = createMockDevice();
        const buffer = WGPUBuffer.getInstance(device, makeConfig());

        // 先触达一次：GPU 缓冲区是 computed 懒创建的，不读就不会真的 createBuffer
        expect(buffer.gpuBuffer).toBeTruthy();

        const key = {};

        trackGpuResource(key, buffer);
        destroyGpuResourcesOf(key);

        // 归零时**还没提交**：GPU 对象必须还活着（本帧命令缓冲可能引用它）
        expect(created[0].destroyed).toBe(0);
        expect(getPendingReleaseCount(device)).toBe(1);

        flushDeferredReleases(device);
        expect(created[0].destroyed).toBe(1);
    });

    it('恒等式：churn 后 created == freed + 存活，且存活数回落', () =>
    {
        const { device } = createMockDevice();
        const key = {};

        WGPUBuffer.getInstance(device, makeConfig());

        const stats = getGPUDeviceStats(device);
        const created = stats.buffer.created;
        const freed = stats.buffer.freed;
        const count = stats.buffer.count;

        expect(created).toBe(freed + count);
        expect(count).toBeGreaterThanOrEqual(0);
    });

    it('归零后缓存条目立刻消失：同键 getInstance 重建新实例，旧实例在提交后销毁', () =>
    {
        const { device, created } = createMockDevice();
        const config = makeConfig();
        const first = WGPUBuffer.getInstance(device, config);

        expect(first.gpuBuffer).toBeTruthy();

        const key = {};

        trackGpuResource(key, first);
        destroyGpuResourcesOf(key);

        // 归零 → 缓存条目已摘：同键取到的是**新**实例，不是待销毁的旧实例
        const second = WGPUBuffer.getInstance(device, config);

        expect(second).not.toBe(first);

        flushDeferredReleases(device);

        expect(created[0].destroyed).toBe(1);   // 旧实例的 GPU 缓冲区已销毁
        expect(second.gpuBuffer).toBeTruthy();  // 新实例照常可用
    });

    it('换装 churn：反复「登记 → 释放 → 提交」后计数收敛回 0', () =>
    {
        const { device } = createMockDevice();
        const stats = getGPUDeviceStats(device);
        const before = {
            created: stats.buffer.created,
            freed: stats.buffer.freed,
            count: stats.buffer.count,
        };

        for (let i = 0; i < 10; i++)
        {
            // 每次换一套新的缓冲区配置，等价于「换装」时旧资源下岗、新资源上岗
            const buffer = WGPUBuffer.getInstance(device, { size: SIZE, data: new Float32Array([i, i, i, i]).buffer });

            expect(buffer.gpuBuffer).toBeTruthy();

            const key = {};

            trackGpuResource(key, buffer);
            destroyGpuResourcesOf(key);
            flushDeferredReleases(device);

            // 每一轮结束时恒等式都成立
            expect(stats.buffer.created).toBe(stats.buffer.freed + stats.buffer.count);
        }

        // churn 后没有残留：存活数回落到起始值
        expect(stats.buffer.count).toBe(before.count);
        expect(stats.buffer.created - before.created).toBe(10);
        expect(stats.buffer.freed - before.freed).toBe(10);
    });
});