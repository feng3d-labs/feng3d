import type { ReactiveObject } from '../ReactiveObject';
import type { GpuResourceRef } from './GpuResourceRef';

/**
 * GPU 资源确定性释放索引（框架设计文档 7.2）。
 *
 * ChainMap 缓存按完整键（含 TypeInfo 等 webgpu 层对象）索引，数据侧无法反查，
 * 本索引补上这层：WGPU 实例构造时按**数据侧键**（如 renderObject 的
 * bindingResources、binding wrapper）登记 WeakRef，数据 dispose 时
 * destroyGpuResourcesOf(key) 批量销毁——执行 ReactiveObject.destroy 回调链
 * （GPU 资源 destroy、统计 freed、缓存条目移除）。
 *
 * 用 WeakRef 登记：未被显式释放的实例仍可被 GC 兜底回收（不阻止垃圾回收），
 * 显式释放时已死亡的实例自动跳过（幂等）。
 */
function createIndex()
{
    return new WeakMap<object, Set<WeakRef<ReactiveObject>>>();
}

let _index: ReturnType<typeof createIndex> | null = null;

/** 取 getIndex() 缓存（首次使用时创建；R2 零模块级副作用，issue #88） */
function getIndex(): ReturnType<typeof createIndex>
{
    if (!_index)
    {
        _index = createIndex();
    }

    return _index;
}

/**
 * 按数据侧键登记 WGPU 实例（实例构造时调用）。
 *
 * @returns 反注册函数（实例 destroyCall 中调用，防止重复销毁与残留）
 */
export function trackGpuResource(key: object, instance: ReactiveObject): () => void
{
    let set = getIndex().get(key);

    if (!set)
    {
        set = new Set();
        getIndex().set(key, set);
    }
    const ref = new WeakRef(instance);

    set.add(ref);

    // 登记即持有：引用计数 +1（issue #89）。同一实例被多处登记时各持一份，
    // 于是「一处释放」不会销毁别人还在用的资源；全部释放后归零 → 提交后销毁。
    // 未登记的实例计数保持 0，行为与引入计数前一致（不会被提前销毁）。
    if (isRefCounted(instance)) instance.retain();

    return () =>
    {
        set.delete(ref);
    };
}

/** 实例是否实现了引用计数（{@link GpuResourceRef}） */
function isRefCounted(instance: unknown): instance is ReactiveObject & GpuResourceRef
{
    return !!instance && typeof (instance as GpuResourceRef).retain === 'function'
        && typeof (instance as GpuResourceRef).release === 'function';
}

/**
 * 销毁数据侧键下的全部存活实例（数据 dispose 时调用，幂等）。
 */
export function destroyGpuResourcesOf(key: object): void
{
    const set = getIndex().get(key);

    if (!set) return;

    for (const ref of set)
    {
        const instance = ref.deref();

        if (!instance) continue;
        // 引用计数：release 一次（对应 trackGpuResource 时的一次 retain）。
        // 归零才排队销毁，且销毁推迟到 queue.submit() 之后（issue #89）。
        // 非计数实例保持原语义：立即销毁。
        if (isRefCounted(instance)) instance.release();
        else instance.destroy();   // 执行 destroyCall 链：GPU 资源销毁、统计、缓存清理
    }
    set.clear();
}

/**
 * 释放 renderObject.bindingResources 关联的 GPU 资源。
 *
 * 遍历各绑定包装对象并销毁其名下实例。当前仅 WGPUBindGroupEntry（键为
 * bindingResources 整体，per renderObject 独占）接入；bufferBinding/textureView
 * 存在跨对象共享（共享材质的纹理视图），显式销毁待引用计数（设计 7.2 完整版）。
 */
export function releaseBindingResources(bindingResources: Record<string, unknown>): void
{
    if (!bindingResources) return;

    destroyGpuResourcesOf(bindingResources);
    for (const key in bindingResources)
    {
        const value = bindingResources[key];

        if (value && typeof value === 'object')
        {
            destroyGpuResourcesOf(value);
        }
    }
}