/**
 * GPU 资源池（issue #98；架构文档 §2.3「五项新增能力」的 Resource Pool）。
 *
 * ## 解决的问题
 * 高频换装（纹理 / 几何 / uniform 切换）会反复创建与销毁 GPU 对象：销毁是一次真正的
 * `GPUBuffer.destroy()`，下一次创建又要 `createBuffer()` 重新分配。churn 量级下这就是
 * 分配抖动的来源。池把「已不再被数据侧引用的 GPU 对象」按规格暂留，供下一个同规格请求复用。
 *
 * ## 与 issue #89（deferred release）的关系
 * 池化即**延迟释放**：归还进池的对象不销毁，因此不存在「GPU 仍在读、CPU 已销毁」的窗口；
 * 真正销毁只发生在「容量淘汰」与「显式 clear」两处。#89 解决的是必须销毁时的时机
 * （推迟到 `queue.submit()` 之后），两者互补：池化减少销毁需求，deferred release 约束剩下的销毁。
 *
 * ## 时机前提（调用方责任）
 * 复用时的新数据一律经 `queue.writeBuffer` / 复制命令写入。WebGPU 队列模型保证写入排在
 * **已提交**命令之后，不会篡改上一帧命令读到的数据。调用方必须保证「归还者已不再被待提交
 * 命令引用」——归还应发生在数据侧对象 dispose 时。
 */

/** 可入池的 GPU 资源：容量淘汰与 clear 时需要真正释放 */
export interface PoolableResource
{
    destroy(): void;
}

/** 池化读数（每个 device 一份的只读快照） */
export interface ResourcePoolStats
{
    /** 命中闲置资源并复用的次数 */
    readonly reused: number;
    /** 归还入池的次数 */
    readonly released: number;
    /** 真正销毁的次数（容量淘汰 + clear 清空） */
    readonly destroyed: number;
    /** 当前闲置（池中）资源数 */
    readonly idle: number;
}

/** 池配置 */
export interface ResourcePoolOptions<T extends PoolableResource>
{
    /** 单个规格键最多保留的闲置资源数（默认 4）；置 0 等价于关闭池化 */
    readonly maxIdlePerKey?: number;
    /** 单个 device 最多保留的闲置资源数（默认 32）；置 0 等价于关闭池化 */
    readonly maxIdleTotal?: number;
    /** 真正销毁资源时的回调（缺省调用 `resource.destroy()`）；用于同步显存统计等副作用 */
    readonly onDestroy?: (device: GPUDevice, resource: T) => void;
}

/** GPU 资源池 */
export interface ResourcePool<T extends PoolableResource>
{
    /** 取同规格闲置资源；池空返回 undefined（不负责创建，创建策略由调用方决定） */
    take(device: GPUDevice, key: string): T | undefined;
    /** 归还闲置资源；超出容量时按「最旧优先」真正销毁 */
    put(device: GPUDevice, key: string, resource: T): void;
    /** 销毁该 device 的全部闲置资源 */
    clear(device: GPUDevice): void;
    /** 读数快照（未使用过的 device 返回全 0） */
    getStats(device: GPUDevice): ResourcePoolStats;
}

/** 每个 device 的池状态 */
interface DevicePoolState<T extends PoolableResource>
{
    /** 规格键 → 闲置资源（数组尾部最新，头部最旧） */
    readonly buckets: Map<string, T[]>;
    reused: number;
    released: number;
    destroyed: number;
    idle: number;
}

/**
 * 创建 GPU 资源池。
 *
 * 每个 device 一份状态（WeakMap：device 回收后池状态随之释放，不延长 device 生命周期）。
 * 容量按「单键 + 单 device」两级控制，淘汰顺序为最旧优先（近似 LRU——只有入池时间，
 * 没有命中时间；命中即出池，所以闲置项的存在时长就是它的年龄）。
 *
 * @param options 池配置
 */
export function createResourcePool<T extends PoolableResource>(options?: ResourcePoolOptions<T>): ResourcePool<T>
{
    const maxIdlePerKey = Math.max(0, options?.maxIdlePerKey ?? 4);
    const maxIdleTotal = Math.max(0, options?.maxIdleTotal ?? 32);

    let states: WeakMap<GPUDevice, DevicePoolState<T>> | null = null;

    /** 取 states 缓存（首次使用时创建；R2 零模块级副作用，issue #88） */
    function getStates(): WeakMap<GPUDevice, DevicePoolState<T>>
    {
        if (!states) states = new WeakMap();

        return states;
    }

    function getState(device: GPUDevice): DevicePoolState<T>
    {
        let state = getStates().get(device);

        if (!state)
        {
            state = { buckets: new Map(), reused: 0, released: 0, destroyed: 0, idle: 0 };
            getStates().set(device, state);
        }

        return state;
    }

    function destroyResource(device: GPUDevice, resource: T): void
    {
        if (options?.onDestroy)
        {
            options.onDestroy(device, resource);
        }
        else
        {
            resource.destroy();
        }
    }

    /** 从最旧的桶头淘汰一个闲置资源；没有可淘汰项时返回 false */
    function evictOldest(device: GPUDevice, state: DevicePoolState<T>): boolean
    {
        for (const [key, items] of state.buckets)
        {
            if (items.length === 0) continue;

            const oldest = items.shift()!;

            destroyResource(device, oldest);
            state.idle--;
            state.destroyed++;
            if (items.length === 0) state.buckets.delete(key);

            return true;
        }

        return false;
    }

    return {
        take(device, key)
        {
            const state = getState(device);
            const items = state.buckets.get(key);

            if (!items || items.length === 0) return undefined;

            const resource = items.pop()!;

            if (items.length === 0) state.buckets.delete(key);
            state.idle--;
            state.reused++;

            return resource;
        },
        put(device, key, resource)
        {
            const state = getState(device);

            // 容量为 0 = 关闭池化：立即真正释放，行为等同于「不池化」
            if (maxIdlePerKey === 0 || maxIdleTotal === 0)
            {
                destroyResource(device, resource);
                state.destroyed++;

                return;
            }

            let items = state.buckets.get(key);

            if (!items)
            {
                items = [];
                state.buckets.set(key, items);
            }

            // 单键容量：先淘汰最旧，再入池
            while (items.length >= maxIdlePerKey)
            {
                const oldest = items.shift()!;

                destroyResource(device, oldest);
                state.idle--;
                state.destroyed++;
            }

            // 单 device 总容量：跨键淘汰最旧
            while (state.idle >= maxIdleTotal && evictOldest(device, state))
            {
                // 淘汰到有空位为止
            }

            items.push(resource);
            state.idle++;
            state.released++;
        },
        clear(device)
        {
            const state = getState(device);

            for (const [key, items] of state.buckets)
            {
                for (const resource of items)
                {
                    destroyResource(device, resource);
                    state.destroyed++;
                }
                state.buckets.delete(key);
            }
            state.idle = 0;
        },
        getStats(device)
        {
            const state = getStates().get(device);

            if (!state) return { reused: 0, released: 0, destroyed: 0, idle: 0 };

            return { reused: state.reused, released: state.released, destroyed: state.destroyed, idle: state.idle };
        },
    };
}
