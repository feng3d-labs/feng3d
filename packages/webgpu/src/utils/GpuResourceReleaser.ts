import type { ReactiveObject } from '../ReactiveObject';

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
const _index = new WeakMap<object, Set<WeakRef<ReactiveObject>>>();

/**
 * 按数据侧键登记 WGPU 实例（实例构造时调用）。
 *
 * @returns 反注册函数（实例 destroyCall 中调用，防止重复销毁与残留）
 */
export function trackGpuResource(key: object, instance: ReactiveObject): () => void
{
    let set = _index.get(key);

    if (!set)
    {
        set = new Set();
        _index.set(key, set);
    }
    const ref = new WeakRef(instance);

    set.add(ref);

    return () => set.delete(ref);
}

/**
 * 销毁数据侧键下的全部存活实例（数据 dispose 时调用，幂等）。
 */
export function destroyGpuResourcesOf(key: object): void
{
    const set = _index.get(key);

    if (!set) return;

    for (const ref of set)
    {
        const instance = ref.deref();

        if (instance)
        {
            instance.destroy();   // 执行 destroyCall 链：GPU 资源销毁、统计、缓存清理
        }
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
