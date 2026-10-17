import { ReactiveObject } from '../ReactiveObject';

/**
 * 可引用计数的 GPU 资源（issue #89：设计 7.2 的两级回收）。
 *
 * 语义：
 * - `retain()`：消费者开始使用该资源（登记持有者）；
 * - `release()`：消费者不再使用；**归零后不立即销毁**，而是排队等下一次
 *   `queue.submit()` 之后统一销毁——本帧已编码的命令缓冲可能仍在引用它
 *   （参考 Babylon.js 的 `destroyDeferredBuffers`）；
 * - 归零的同时**立刻**从缓存表移除条目（`onZeroRef`），避免归零后被 `getInstance`
 *   再次取到「待销毁」的实例；真销毁（GPU 对象 destroy、统计 freed、显存扣减）推迟。
 */
export interface GpuResourceRef
{
    /** 增加一次引用 */
    retain(): void;
    /** 减少一次引用；归零后排队销毁（提交后执行） */
    release(): void;
    /** 当前引用计数（诊断 / 测试用） */
    readonly refCount: number;
    /** 是否已归零（已排队销毁，不再接受 retain） */
    readonly isReleased: boolean;
}

/** 待销毁队列：按 device 分桶（lazy-init，R2：不在 import 期分配） */
let _pending: WeakMap<GPUDevice, Set<{ destroy(): void }>> | null = null;

function getPending(): WeakMap<GPUDevice, Set<{ destroy(): void }>>
{
    if (!_pending) _pending = new WeakMap();

    return _pending;
}

/**
 * 把销毁推迟到本帧提交之后。
 *
 * 同一实例重复排队时去重（Set）。
 *
 * @param device GPU 设备（决定在哪个设备的提交点统一销毁）
 * @param resource 待销毁的资源（实现 destroy()）
 */
export function scheduleDeferredDestroy(device: GPUDevice, resource: { destroy(): void }): void
{
    let set = getPending().get(device);

    if (!set)
    {
        set = new Set();
        getPending().set(device, set);
    }
    set.add(resource);
}

/**
 * 执行该设备上所有待销毁资源（在 `queue.submit()` 之后调用，见 `runSubmit`）。
 *
 * 幂等：队列清空后再调用不做事。
 *
 * @param device GPU 设备
 */
export function flushDeferredReleases(device: GPUDevice): void
{
    const set = getPending().get(device);

    if (!set || set.size === 0) return;

    // 先摘队列再销毁：destroy() 内部可能触发新的 release（级联引用）
    const pending = [...set];

    set.clear();
    for (let i = 0; i < pending.length; i++)
    {
        pending[i].destroy();
    }
}

/** 当前待销毁资源数量（诊断 / 测试用） */
export function getPendingReleaseCount(device: GPUDevice): number
{
    return getPending().get(device)?.size ?? 0;
}

/**
 * 带引用计数的 WGPU 资源基类。
 *
 * 与 {@link ReactiveObject} 的唯一区别是生命周期入口：`destroy()` 仍是「立即销毁」，
 * 供显式释放 / 设备丢失等场景使用；正常路径走 `retain()` / `release()`，
 * 由引用计数决定何时销毁、且销毁时机推迟到提交之后。
 *
 * 初始引用计数是 **0**：构造出来的实例在被登记为某处持有者之前不属于任何人。
 * 这样「未登记 = 不会释放」与现状一致（不会因为引入计数而提前销毁在用的资源）。
 */
export class RefCountedReactiveObject extends ReactiveObject implements GpuResourceRef
{
    private _refCount = 0;
    private _released = false;
    private _zeroRef: (() => void) | null = null;

    /**
     * 本实例**持有**的其它可计数资源（消费关系，如 bufferBinding 持有 buffer）。
     *
     * destroy 时按 retain 次数等量 release：持有关系是「我还在用，别销毁它」，
     * 与自身的引用计数是两条独立的链。
     */
    private _held: GpuResourceRef[] | null = [];

    /** 关联的 device（决定排队到哪个提交点） */
    private _refDevice: GPUDevice | null;

    constructor(device?: GPUDevice)
    {
        super();
        this._refDevice = device ?? null;
    }

    get refCount(): number
    {
        return this._refCount;
    }

    get isReleased(): boolean
    {
        return this._released;
    }

    /**
     * 设置「归零时立即执行」的回调（从缓存表移除条目等）。
     *
     * 真销毁仍推迟到提交之后：缓存条目必须立刻消失，否则归零后在提交前又被
     * `getInstance` 取到「待销毁」的实例。
     *
     * @param callback 归零回调（只会被调用一次）
     */
    protected setZeroRefCall(callback: () => void): void
    {
        this._zeroRef = callback;
    }

    /**
     * 持有另一个可计数资源（retain 一次，destroy 时等量 release）。
     *
     * 只接受实现了 {@link GpuResourceRef} 的对象（retain / release 都是函数）；
     * 其它值静默跳过——缓存层里大量实例并不计数，调用方无需逐个判断。
     *
     * @param resources 被持有的资源（可多个）
     */
    protected hold(...resources: unknown[]): void
    {
        if (!this._held) return;
        for (let i = 0; i < resources.length; i++)
        {
            const resource = resources[i] as GpuResourceRef;

            if (!resource || typeof resource.retain !== 'function' || typeof resource.release !== 'function') continue;
            resource.retain();
            this._held.push(resource);
        }
    }

    /**
     * 销毁：先执行自身清理链（destroyCall），再释放自己持有的资源。
     *
     * 顺序不能反：先断开自身对外的引用，再让被持有的资源有机会归零。
     * 子类覆写时必须调用 super.destroy()（与 {@link ReactiveObject} 的约定一致）。
     */
    destroy(): void
    {
        super.destroy();

        const held = this._held;

        this._held = null;
        if (held)
        {
            for (let i = 0; i < held.length; i++) held[i].release();
        }
    }

    retain(): void
    {
        // 已归零的实例不再复活：它的缓存条目已摘除，下次 getInstance 会重建
        if (this._released) return;
        this._refCount++;
    }

    release(): void
    {
        if (this._released) return;
        this._refCount--;

        if (this._refCount > 0) return;

        this._released = true;
        this._zeroRef?.();
        if (this._refDevice) scheduleDeferredDestroy(this._refDevice, this);
    }
}