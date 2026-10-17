import { afterEach, describe, expect, it } from 'vitest';

import {
    WGPUTexture,
    setGpuTexturePoolEnabled,
    getGpuTexturePoolStats,
    clearGpuTexturePool,
} from '../src/caches/WGPUTexture';
import { getGPUDeviceStats } from '../src/utils/GPUDeviceStats';

/** 记录销毁与写入的 mock GPUTexture */
interface MockGPUTexture
{
    label?: string;
    readonly width: number;
    readonly height: number;
    readonly depthOrArrayLayers: number;
    readonly format: string;
    readonly mipLevelCount: number;
    readonly sampleCount: number;
    destroyed: number;
    destroy(): void;
}

/** 只需要 createTexture / queue.writeTexture 的 mock device（池化是 CPU 侧逻辑） */
function createMockDevice()
{
    const created: MockGPUTexture[] = [];
    const written: MockGPUTexture[] = [];
    const device = {
        createTexture: (descriptor: GPUTextureDescriptor) =>
        {
            const size = descriptor.size as number[];
            const texture: MockGPUTexture = {
                label: descriptor.label,
                width: size[0],
                height: size[1],
                depthOrArrayLayers: size[2] ?? 1,
                format: (descriptor.format ?? 'rgba8unorm') as string,
                mipLevelCount: descriptor.mipLevelCount ?? 1,
                sampleCount: descriptor.sampleCount ?? 1,
                destroyed: 0,
                destroy()
                {
                    this.destroyed++;
                },
            };

            created.push(texture);

            return texture as unknown as GPUTexture;
        },
        queue: {
            writeTexture: (destination: GPUTexelCopyTextureInfo) =>
            {
                written.push(destination.texture as unknown as MockGPUTexture);
            },
        },
        features: { has: () => true },
    } as unknown as GPUDevice;

    return { device, created, written };
}

const SIZE = 2;

/** 2×2 rgba8unorm：初始数据完整覆盖整张纹理（池化复用前提） */
function makeTextureConfig(seed: number)
{
    const bytes = new Uint8Array(SIZE * SIZE * 4);

    bytes.fill(seed);

    return {
        descriptor: { size: [SIZE, SIZE] as [number, number], format: 'rgba8unorm' as const },
        sources: [{ __type__: 'TextureDataSource' as const, data: bytes, size: [SIZE, SIZE] as [number, number] }],
    };
}

describe('WGPUTexture 池化（issue #98 阶段 2）', () =>
{
    afterEach(() =>
    {
        setGpuTexturePoolEnabled(false);
    });

    it('默认关闭：销毁即真销毁，churn 两次产生两条 GPU 纹理', () =>
    {
        const { device, created } = createMockDevice();

        expect(getGpuTexturePoolStats(device).idle).toBe(0);

        const first = WGPUTexture.getInstance(device, makeTextureConfig(1));

        first.gpuTexture;
        first.destroy();

        const second = WGPUTexture.getInstance(device, makeTextureConfig(5));

        second.gpuTexture;
        expect(created.length).toBe(2);
        expect(created[0].destroyed).toBe(1);

        second.destroy();
    });

    it('开启池化：sources 完整覆盖时复用，createTexture 只发生一次且内容被整体重写', () =>
    {
        const { device, created, written } = createMockDevice();

        setGpuTexturePoolEnabled(true);

        const first = WGPUTexture.getInstance(device, makeTextureConfig(1));
        const firstGpuTexture = first.gpuTexture as unknown as MockGPUTexture;

        expect(created.length).toBe(1);
        expect(written.length).toBe(1);

        first.destroy();
        expect(firstGpuTexture.destroyed).toBe(0);
        expect(getGpuTexturePoolStats(device).idle).toBe(1);

        const second = WGPUTexture.getInstance(device, makeTextureConfig(5));

        expect(second.gpuTexture).toBe(firstGpuTexture as unknown as GPUTexture);
        expect(created.length).toBe(1);
        // 复用时重新上传整张纹理（内容不留旧数据）
        expect(written.length).toBe(2);
        expect(getGpuTexturePoolStats(device).reused).toBe(1);

        second.destroy();
    });

    it('开启池化：无 sources（render target）不复用，避免残留', () =>
    {
        const { device, created } = createMockDevice();

        setGpuTexturePoolEnabled(true);

        const first = WGPUTexture.getInstance(device, { descriptor: { size: [SIZE, SIZE] as [number, number], format: 'rgba8unorm' as const } });

        first.gpuTexture;
        first.destroy();

        const second = WGPUTexture.getInstance(device, { descriptor: { size: [SIZE, SIZE] as [number, number], format: 'rgba8unorm' as const } });

        second.gpuTexture;
        expect(created.length).toBe(2);
        expect(getGpuTexturePoolStats(device).reused).toBe(0);

        second.destroy();
    });

    it('开启池化：mip 链不止一层时不复用', () =>
    {
        const { device, created } = createMockDevice();

        setGpuTexturePoolEnabled(true);

        const config = (seed: number) => ({
            descriptor: { size: [SIZE, SIZE] as [number, number], format: 'rgba8unorm' as const, mipLevelCount: 2 },
            sources: [{ __type__: 'TextureDataSource' as const, data: new Uint8Array(SIZE * SIZE * 4).fill(seed), size: [SIZE, SIZE] as [number, number] }],
        });

        const first = WGPUTexture.getInstance(device, config(1));

        first.gpuTexture;
        first.destroy();

        const second = WGPUTexture.getInstance(device, config(5));

        second.gpuTexture;
        expect(created.length).toBe(2);
        expect(getGpuTexturePoolStats(device).reused).toBe(0);

        second.destroy();
    });

    it('开启池化：source 只覆盖局部时不复用', () =>
    {
        const { device, created } = createMockDevice();

        setGpuTexturePoolEnabled(true);

        const config = (seed: number) => ({
            descriptor: { size: [SIZE, SIZE] as [number, number], format: 'rgba8unorm' as const },
            sources: [{ __type__: 'TextureDataSource' as const, data: new Uint8Array(SIZE * SIZE * 4).fill(seed), size: [1, 1] as [number, number] }],
        });

        const first = WGPUTexture.getInstance(device, config(1));

        first.gpuTexture;
        first.destroy();

        const second = WGPUTexture.getInstance(device, config(5));

        second.gpuTexture;
        expect(created.length).toBe(2);
        expect(getGpuTexturePoolStats(device).reused).toBe(0);

        second.destroy();
    });

    it('开启池化：不同规格不复用', () =>
    {
        const { device, created } = createMockDevice();

        setGpuTexturePoolEnabled(true);

        const first = WGPUTexture.getInstance(device, makeTextureConfig(1));

        first.gpuTexture;
        first.destroy();

        const second = WGPUTexture.getInstance(device, {
            descriptor: { size: [4, 4] as [number, number], format: 'rgba8unorm' as const },
            sources: [{ __type__: 'TextureDataSource' as const, data: new Uint8Array(4 * 4 * 4), size: [4, 4] as [number, number] }],
        });

        second.gpuTexture;
        expect(created.length).toBe(2);
        expect(getGpuTexturePoolStats(device).reused).toBe(0);

        second.destroy();
    });

    it('显存读数：池中驻留仍计入，clear 后才归零（关闭池化时销毁即归零）', () =>
    {
        const { device } = createMockDevice();

        setGpuTexturePoolEnabled(true);

        const pooled = WGPUTexture.getInstance(device, makeTextureConfig(1));
        const expected = SIZE * SIZE * 4;

        pooled.gpuTexture;
        expect(getGPUDeviceStats(device).textureMemory).toBe(expected);

        pooled.destroy();
        expect(getGPUDeviceStats(device).textureMemory).toBe(expected);

        clearGpuTexturePool(device);
        expect(getGPUDeviceStats(device).textureMemory).toBe(0);

        setGpuTexturePoolEnabled(false);

        const released = WGPUTexture.getInstance(device, makeTextureConfig(9));

        released.gpuTexture;
        expect(getGPUDeviceStats(device).textureMemory).toBe(expected);

        released.destroy();
        expect(getGPUDeviceStats(device).textureMemory).toBe(0);
    });
});
