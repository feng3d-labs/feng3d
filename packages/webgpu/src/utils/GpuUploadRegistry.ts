/**
 * GPU uniform 拉取上传注册表（框架设计文档 4.3 pull 模型）。
 *
 * WGPUBufferBinding 的 uniform 数据不再用 effect 在写入时推送
 * writeBuffers，而是注册拉取任务（每 binding 一项，内部为惰性
 * computed），runSubmit 编码前统一读取：无变化不重算不上传（版本号
 * 判定），有变化才 queue.writeBuffer——副作用收敛到提交时点。
 */
export interface GpuUploadTask
{
    /** 拉取上传：读惰性 computed，版本变化才写 GPUBuffer */
    pull(): void;
    /** 反注册（binding destroyCall 时调用） */
    dispose(): void;
}

/** device → 拉取任务（WeakRef：任务随 binding GC，注册表不延长生命周期） */
const _tasks = new WeakMap<GPUDevice, Set<WeakRef<GpuUploadTask>>>();

/**
 * 注册拉取任务（binding 创建时调用，**调用方必须强引用持有 task**——
 * 注册表只持 WeakRef，无强引用的任务会被 GC）。
 *
 * @returns 反注册函数（同时挂到 task.dispose 供 binding destroyCall 使用）
 */
export function registerUploadTask(device: GPUDevice, task: GpuUploadTask): () => void
{
    let set = _tasks.get(device);

    if (!set)
    {
        set = new Set();
        _tasks.set(device, set);
    }
    const ref = new WeakRef(task);

    set.add(ref);
    const unregister = () => set.delete(ref);

    task.dispose = unregister;

    return unregister;
}

/**
 * 拉取上传全部任务（runSubmit 编码前调用）。
 *
 * 顺带清理已死亡任务（binding 被 GC 后其任务随之死亡）。
 */
export function pullUploads(device: GPUDevice): void
{
    const set = _tasks.get(device);

    if (!set) return;

    for (const ref of set)
    {
        const task = ref.deref();

        if (task)
        {
            task.pull();
        }
        else
        {
            set.delete(ref);
        }
    }
}
