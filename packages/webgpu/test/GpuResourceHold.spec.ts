import { describe, expect, it } from 'vitest';

import { flushDeferredReleases, RefCountedReactiveObject } from '../src/utils/GpuResourceRef';

/** 暴露 protected 的持有 API 供测试调用（不挂在生产类上） */
class TestHolder extends RefCountedReactiveObject
{
    constructor(device?: GPUDevice)
    {
        super(device);
    }

    holdForTest(...resources: unknown[]): void
    {
        this.hold(...resources);
    }

    replaceForTest(resources: readonly unknown[]): void
    {
        this.replaceHeld(resources);
    }
}

/** 一个可以当「被持有资源」用的最小实例（不计 device，不会排队销毁） */
function createResource()
{
    return new RefCountedReactiveObject();
}

/**
 * 持有语义（issue #946 的前置）：`hold` 累积、`replaceHeld` 替换、`releaseHeld` 清空。
 *
 * 两种语义各有用处：
 * - 累积（`hold`）：entry / binding 每多一处使用就多持一份，销毁时按次数等量释放；
 * - 替换（`replaceHeld`）：渲染 pass 每轮重算整体换一批消费者，持有集只保留最新一轮，
 *   否则长期重算会把引用计数越堆越高、资源永远等不到归零。
 */
describe('RefCountedReactiveObject 持有语义（issue #946）', () =>
{
    it('hold 是累积语义：同一资源持两次要 release 两次', () =>
    {
        const holder = new TestHolder();
        const resource = createResource();

        holder.holdForTest(resource, resource);
        expect(resource.refCount).toBe(2);

        holder.destroy();
        expect(resource.refCount).toBe(0);
    });

    it('replaceHeld 是替换语义：上一轮不再持有的会被释放', () =>
    {
        const holder = new TestHolder();
        const a = createResource();
        const b = createResource();
        const c = createResource();

        holder.replaceForTest([a, b]);
        expect(a.refCount).toBe(1);
        expect(b.refCount).toBe(1);

        // 第二轮：b 留着、a 换掉、c 加入
        holder.replaceForTest([b, c]);
        expect(a.refCount).toBe(0);   // 上一轮持有的 a 被释放
        expect(b.refCount).toBe(1);   // 先释放旧的再 retain 新的，净额仍是 1
        expect(c.refCount).toBe(1);

        holder.destroy();
        expect(b.refCount).toBe(0);
        expect(c.refCount).toBe(0);
    });

    it('replaceHeld 反复调用不会让计数单调增长', () =>
    {
        const holder = new TestHolder();
        const resource = createResource();

        for (let i = 0; i < 10; i++) holder.replaceForTest([resource]);

        // 10 轮「重算」后仍是 1（不是 10）：这正是 pass 每帧重编码需要的行为
        expect(resource.refCount).toBe(1);

        holder.destroy();
        expect(resource.refCount).toBe(0);
    });

    it('非计数对象混进持有集时静默跳过（缓存层大量实例不计数）', () =>
    {
        const holder = new TestHolder();

        expect(() => holder.replaceForTest([undefined, null, {}, { retain: 1 }])).not.toThrow();
        expect(() => holder.destroy()).not.toThrow();
    });
});

/**
 * flush 的级联销毁（issue #89 的实现缺陷，被 #946 的换装 churn 暴露）。
 *
 * 归零的资源排队等提交后销毁；销毁它时会释放它持有的资源，那些 release 可能又归零、又入队。
 * 只处理一轮的话，级联销毁被拖到后面的提交点——实测表现是「churn 后 freed 迟迟不涨、存活数不回落」。
 */
describe('flushDeferredReleases 级联销毁', () =>
{
    it('A 持 B、B 持 C：释放 A 后，同一次 flush 内三层全部销毁', () =>
    {
        const device = {} as GPUDevice;
        const destroyed: string[] = [];

        class Chain extends TestHolder
        {
            constructor(public readonly tag: string)
            {
                super(device);
            }

            destroy(): void
            {
                destroyed.push(this.tag);
                super.destroy();
            }
        }

        const c = new Chain('C');
        const b = new Chain('B');
        const a = new Chain('A');

        b.holdForTest(c);
        a.holdForTest(b);

        // 模拟「被数据侧登记」后再释放：A 归零 → 入队
        a.retain();
        a.release();

        flushDeferredReleases(device);

        expect(destroyed).toEqual(['A', 'B', 'C']);
    });

    it('队列为空时 flush 是空操作（幂等）', () =>
    {
        const device = {} as GPUDevice;

        expect(() =>
        {
            flushDeferredReleases(device);
            flushDeferredReleases(device);
        }).not.toThrow();
    });
});