import { describe, expect, it } from 'vitest';

import { createResourcePool } from '../src/utils/ResourcePool';
import type { PoolableResource } from '../src/utils/ResourcePool';

/**
 * GPU 资源池语义（issue #98）。
 *
 * 只需要对象身份与销毁计数，不需要真 GPU 资源——池是纯逻辑，与 device 的实际实现无关。
 */
interface FakeResource extends PoolableResource
{
    readonly name: string;
    destroyed: number;
}

function makeResource(name: string): FakeResource
{
    return {
        name,
        destroyed: 0,
        destroy()
        {
            this.destroyed++;
        },
    };
}

describe('GPU 资源池（issue #98）', () =>
{
    const mkDevice = () => ({}) as GPUDevice;

    it('空池 take 返回 undefined', () =>
    {
        const pool = createResourcePool<PoolableResource>();

        expect(pool.take(mkDevice(), 'k')).toBeUndefined();
        expect(pool.getStats(mkDevice()).idle).toBe(0);
    });

    it('put 后 take 拿回同一对象，并计入 released / reused', () =>
    {
        const device = mkDevice();
        const pool = createResourcePool<PoolableResource>();
        const resource = makeResource('a');

        pool.put(device, 'k', resource);
        expect(pool.getStats(device)).toEqual({ reused: 0, released: 1, destroyed: 0, idle: 1 });

        expect(pool.take(device, 'k')).toBe(resource);
        expect(pool.getStats(device)).toEqual({ reused: 1, released: 1, destroyed: 0, idle: 0 });
        expect(resource.destroyed).toBe(0);
    });

    it('不同规格键互不串用', () =>
    {
        const device = mkDevice();
        const pool = createResourcePool<PoolableResource>();

        pool.put(device, '16', makeResource('a'));

        expect(pool.take(device, '32')).toBeUndefined();
        expect(pool.getStats(device).idle).toBe(1);
    });

    it('单键容量溢出：淘汰最旧（take 从最新开始出池）', () =>
    {
        const device = mkDevice();
        const pool = createResourcePool<PoolableResource>({ maxIdlePerKey: 2, maxIdleTotal: 8 });
        const r1 = makeResource('r1');
        const r2 = makeResource('r2');
        const r3 = makeResource('r3');

        pool.put(device, 'k', r1);
        pool.put(device, 'k', r2);
        pool.put(device, 'k', r3);

        expect(r1.destroyed).toBe(1);
        expect(pool.getStats(device).idle).toBe(2);
        expect(pool.take(device, 'k')).toBe(r3);
        expect(pool.take(device, 'k')).toBe(r2);
        expect(pool.take(device, 'k')).toBeUndefined();
    });

    it('单 device 总容量溢出：跨键淘汰最旧', () =>
    {
        const device = mkDevice();
        const pool = createResourcePool<PoolableResource>({ maxIdlePerKey: 4, maxIdleTotal: 3 });
        const a1 = makeResource('a1');
        const b1 = makeResource('b1');

        pool.put(device, 'a', a1);
        pool.put(device, 'b', b1);
        pool.put(device, 'a', makeResource('a2'));
        expect(pool.getStats(device).idle).toBe(3);

        // 第 4 个入池触发跨键淘汰：最旧的是键 a 的 a1
        pool.put(device, 'b', makeResource('b2'));

        expect(a1.destroyed).toBe(1);
        expect(b1.destroyed).toBe(0);
        expect(pool.getStats(device).idle).toBe(3);
        expect(pool.getStats(device).destroyed).toBe(1);
    });

    it('clear 销毁全部闲置资源并清空池', () =>
    {
        const device = mkDevice();
        const pool = createResourcePool<PoolableResource>();
        const r1 = makeResource('r1');
        const r2 = makeResource('r2');

        pool.put(device, 'a', r1);
        pool.put(device, 'b', r2);
        pool.clear(device);

        expect(r1.destroyed).toBe(1);
        expect(r2.destroyed).toBe(1);
        expect(pool.getStats(device).idle).toBe(0);
        expect(pool.take(device, 'a')).toBeUndefined();
    });

    it('容量为 0 等价于关闭池化：put 立即销毁', () =>
    {
        const device = mkDevice();
        const pool = createResourcePool<PoolableResource>({ maxIdleTotal: 0 });
        const resource = makeResource('a');

        pool.put(device, 'k', resource);

        expect(resource.destroyed).toBe(1);
        expect(pool.take(device, 'k')).toBeUndefined();
    });

    it('提供 onDestroy 时由回调负责释放（不调用 resource.destroy）', () =>
    {
        const device = mkDevice();
        const destroyed: string[] = [];
        const pool = createResourcePool<PoolableResource>({
            maxIdleTotal: 1,
            onDestroy: (_device, resource) =>
            {
                destroyed.push((resource as FakeResource).name);
            },
        });
        const r1 = makeResource('r1');
        const r2 = makeResource('r2');

        pool.put(device, 'k', r1);
        pool.put(device, 'k', r2);

        expect(destroyed).toEqual(['r1']);
        expect(r1.destroyed).toBe(0);
        expect(r2.destroyed).toBe(0);
    });

    it('未使用过的 device 读数为全 0，且不同 device 的池互不影响', () =>
    {
        const deviceA = mkDevice();
        const deviceB = mkDevice();
        const pool = createResourcePool<PoolableResource>();

        expect(pool.getStats(deviceA)).toEqual({ reused: 0, released: 0, destroyed: 0, idle: 0 });

        pool.put(deviceA, 'k', makeResource('a'));

        expect(pool.getStats(deviceB).idle).toBe(0);
        expect(pool.take(deviceB, 'k')).toBeUndefined();
        expect(pool.take(deviceA, 'k')).toBeDefined();
    });
});
