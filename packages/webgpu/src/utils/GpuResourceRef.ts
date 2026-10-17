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

    if (!set) return;

    // **循环到队列空**：销毁本身会释放它持有的资源（entry → bufferBinding → buffer），
    // 那些 release 可能又归零、又入队。只处理一轮的话，级联销毁被拖到后面的提交点，
    // 表现为「统计的 freed 迟迟不涨、存活数迟迟不回落」——实测换装 churn 里就是这个症状。
    // 轮数上限防病态环（正常持有链深度是个位数）。
    for (let round = 0; round < 32 && set.size > 0; round++)
    {
        // 先摘队列再销毁：destroy() 内部触发的新 release 会入下一轮
        const pending = [...set];

        set.clear();
        for (let i = 0; i < pending.length; i++)
        {
            pending[i].destroy();
        }
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
     * 释放当前持有的全部资源（持有集本身保留可用）。
     *
     * 供「每轮重算都换一批持有」的场景使用（如渲染 pass：它只在**本轮编码**期间
     * 需要用到那些管线与绑定组，下一轮重新编码时换一批）。
     */
    protected releaseHeld(): void
    {
        const held = this._held;

        if (!held || held.length === 0) return;
        this._held = [];
        for (let i = 0; i < held.length; i++) held[i].release();
    }

    /**
     * 替换本实例持有的资源集：先释放上一轮，再持有这一轮。
     *
     * 与 {@link hold} 的区别：{@link hold} 是**累积**语义（每多一处使用就多持一份，
     * 销毁时按次数等量释放）；本方法是**替换**语义（持有集只保留最新一轮），
     * 用于「每轮重算整体换一批消费者」的地方，避免长期重算把引用计数越堆越高。
     *
     * @param resources 本轮持有的资源
     */
    protected replaceHeld(resources: readonly unknown[]): void
    {
        // **先持新的、再放旧的**：两轮之间重叠的资源（同一份管线 / 绑定组被复用）会先 +1 再 -1，
        // 计数不会中途经过 0。顺序反过来的话，重叠资源会被判成「归零」→ 摘缓存 + 排队销毁，
        // 而本轮编码 / 重录的命令仍在引用它：轻则下一帧重建同一份资源（性能塌陷），重则读到已销毁对象。
        const previous = this._held;

        this._held = [];
        this.hold(...resources);
        if (previous)
        {
            for (let i = 0; i < previous.length; i++) previous[i].release();
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

        this.releaseHeld();
        this._held = null;
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