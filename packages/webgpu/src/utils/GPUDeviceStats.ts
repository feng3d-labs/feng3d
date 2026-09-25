import { reactive } from '@feng3d/reactivity';

/**
 * 单类资源的累计统计（内部可写类型）。
 *
 * 对外暴露的是 {@link ResourceCounter}（所有字段 readonly），写入只通过
 * `trackCreate`/`trackFree` 等函数经响应式代理进行。
 *
 * - {@link created}：累计创建次数（只增不减）
 * - {@link freed}：累计释放次数（只增不减）
 * - {@link count}：当前存活数量 = created - freed（任意时刻可正可零）
 *
 * 三个字段都可被响应式追踪。
 */
interface MutableResourceCounter
{
    /** 累计创建次数 */
    created: number;
    /** 累计释放次数 */
    freed: number;
    /** 当前存活数量（= created - freed） */
    count: number;
}

/**
 * 单类资源的累计统计（只读，对外类型）。
 */
export interface ResourceCounter
{
    readonly created: number;
    readonly freed: number;
    readonly count: number;
}

/**
 * GPU 设备资源统计（内部可写类型）。
 *
 * 对外暴露的是 {@link GPUDeviceStats}（所有字段 readonly）。
 */
interface MutableGPUDeviceStats
{
    /** 纹理（数量统计 + 显存） */
    texture: MutableResourceCounter;
    /** 纹理占用显存（字节） */
    textureMemory: number;

    /** 缓冲区（数量统计 + 显存） */
    buffer: MutableResourceCounter;
    /** 缓冲区占用显存（字节） */
    bufferMemory: number;

    /** 纹理视图 */
    textureView: MutableResourceCounter;
    /** 采样器 */
    sampler: MutableResourceCounter;
    /** 渲染管线 */
    renderPipeline: MutableResourceCounter;
    /** 计算管线 */
    computePipeline: MutableResourceCounter;
    /** 着色器模块 */
    shaderModule: MutableResourceCounter;
    /** 绑定组 */
    bindGroup: MutableResourceCounter;
    /** 绑定组布局 */
    bindGroupLayout: MutableResourceCounter;
    /** 管线布局 */
    pipelineLayout: MutableResourceCounter;
    /** 查询集 */
    querySet: MutableResourceCounter;

    /** 总显存占用（字节）= textureMemory + bufferMemory，派生字段 */
    totalMemory: number;
}

/**
 * GPU 设备资源统计（响应式纯数据，所有字段只读）。
 *
 * 每个 `GPUDevice` 对应一份统计。通过 {@link getGPUDeviceStats} 获取，外部可用
 * `effect(() => { stats.texture.count })` 等响应式监听任意字段的变化，便于 UI 展示或分析。
 *
 * 字段分为两类：
 * 1. **显存占用**（字节数）：`textureMemory` / `bufferMemory` / `totalMemory`
 *    - `totalMemory` 为派生值（前两者之和），任意一项变化时自动同步
 * 2. **资源数量**：每类资源一组 `{ created, freed, count }`
 *    - `created`：累计创建总数
 *    - `freed`：累计释放总数
 *    - `count`：当前存活数（= created - freed）
 *
 * 所有字段都为 readonly：写入只通过 `trackCreate`/`trackFree`/`addMemory`
 * 等函数经响应式代理进行，外部不应直接赋值。
 */
export interface GPUDeviceStats
{
    readonly texture: ResourceCounter;
    readonly textureMemory: number;

    readonly buffer: ResourceCounter;
    readonly bufferMemory: number;

    readonly textureView: ResourceCounter;
    readonly sampler: ResourceCounter;
    readonly renderPipeline: ResourceCounter;
    readonly computePipeline: ResourceCounter;
    readonly shaderModule: ResourceCounter;
    readonly bindGroup: ResourceCounter;
    readonly bindGroupLayout: ResourceCounter;
    readonly pipelineLayout: ResourceCounter;
    readonly querySet: ResourceCounter;

    /** 总显存占用（字节）= textureMemory + bufferMemory，派生字段 */
    readonly totalMemory: number;
}

/**
 * 每个 device 的统计对象缓存（WeakMap，device 回收后统计对象自动释放）。
 *
 * 注意：缓存的是**原始对象**（raw），不是响应式代理。
 * 需要建立响应式依赖时，由调用方在闭包内用 `reactive()` 临时包装
 * （reactive 对同一 raw 返回同一代理，可安全重复包装）。
 */
const deviceStatsMap = new WeakMap<GPUDevice, MutableGPUDeviceStats>();

/** 创建一个资源计数器（初始全 0） */
function newCounter(): MutableResourceCounter
{
    return { created: 0, freed: 0, count: 0 };
}

/**
 * 获取指定 GPUDevice 的资源统计对象（**原始对象，非响应式**）。
 *
 * 首次调用时创建并缓存；后续调用返回同一份原始对象。
 *
 * 返回原始对象（而非响应式代理）：需要监听变化时，由调用方在闭包内
 * 用 `reactive()` 包装后读取字段以建立依赖：
 *
 * ```ts
 * const stats = getGPUDeviceStats(device);          // 原始对象
 * const r_stats = reactive(stats);                  // 响应式代理（r_ 前缀）
 * effect(() =>
 * {
 *     console.log('显存', r_stats.totalMemory,
 *         '纹理 存活/创建/释放', r_stats.texture.count, r_stats.texture.created, r_stats.texture.freed);
 * });
 * ```
 *
 * @param device GPU 设备
 * @returns 原始统计对象（非响应式）
 */
export function getGPUDeviceStats(device: GPUDevice): GPUDeviceStats
{
    return getMutableGPUDeviceStats(device);
}

/**
 * 内部使用：返回可写的原始统计对象（写入只在本文件内的统计函数中进行）。
 */
function getMutableGPUDeviceStats(device: GPUDevice): MutableGPUDeviceStats
{
    let stats: MutableGPUDeviceStats | undefined = deviceStatsMap.get(device);

    if (!stats)
    {
        stats = {
            texture: newCounter(),
            textureMemory: 0,
            buffer: newCounter(),
            bufferMemory: 0,
            textureView: newCounter(),
            sampler: newCounter(),
            renderPipeline: newCounter(),
            computePipeline: newCounter(),
            shaderModule: newCounter(),
            bindGroup: newCounter(),
            bindGroupLayout: newCounter(),
            pipelineLayout: newCounter(),
            querySet: newCounter(),
            totalMemory: 0,
        };
        deviceStatsMap.set(device, stats);
    }

    return stats;
}

/**
 * 资源数量统计字段名（每组都是 ResourceCounter）。
 */
export type CounterKey =
    | 'texture'
    | 'buffer'
    | 'textureView'
    | 'sampler'
    | 'renderPipeline'
    | 'computePipeline'
    | 'shaderModule'
    | 'bindGroup'
    | 'bindGroupLayout'
    | 'pipelineLayout'
    | 'querySet';

/**
 * 显存字段名（字节数，可增减）。
 */
export type MemoryKey = 'textureMemory' | 'bufferMemory';

/**
 * 记录一次资源创建：`created + 1`，`count + 1`。
 *
 * 复用现有 counter 对象（不每次新建），从原始对象读取当前值（不建依赖），
 * 通过响应式代理写字段以触发外部 effect。
 * 遵循规范：不返回响应式对象，仅在写入时用 `reactive()` 临时包装（r_ 前缀）。
 *
 * @param device GPU 设备
 * @param key 资源类型字段名
 */
export function trackCreate(device: GPUDevice, key: CounterKey): void
{
    const counter = getMutableGPUDeviceStats(device)[key];  // 原始子对象，读取不建依赖
    const r_counter = reactive(counter);                    // 响应式代理（r_ 前缀），仅用于写入

    r_counter.created = counter.created + 1;
    r_counter.count = counter.count + 1;
}

/**
 * 记录一次资源释放：`freed + 1`，`count - 1`。
 *
 * 写法同 {@link trackCreate}：复用 counter 对象、读原始值、写响应式代理。
 *
 * @param device GPU 设备
 * @param key 资源类型字段名
 */
export function trackFree(device: GPUDevice, key: CounterKey): void
{
    const counter = getMutableGPUDeviceStats(device)[key];
    const r_counter = reactive(counter);

    r_counter.freed = counter.freed + 1;
    r_counter.count = counter.count - 1;
}

/**
 * 显存字段增减（+delta 字节，delta 可为负）。
 *
 * 从原始对象读取当前值（不建依赖），算出新值后向响应式代理写入（触发外部 effect）。
 * 内部同步更新 {@link GPUDeviceStats.totalMemory}。
 *
 * @param device GPU 设备
 * @param key 显存字段名（textureMemory / bufferMemory）
 * @param delta 字节增量（分配 +n，释放 -n）
 */
export function addMemory(device: GPUDevice, key: MemoryKey, delta: number): void
{
    const stats = getMutableGPUDeviceStats(device);   // 原始对象，读取不建依赖
    const r_stats = reactive(stats);                  // 响应式代理（r_ 前缀），仅用于写入

    if (key === 'textureMemory')
    {
        r_stats.textureMemory = stats.textureMemory + delta;
    }
    else
    {
        r_stats.bufferMemory = stats.bufferMemory + delta;
    }
    r_stats.totalMemory = stats.textureMemory + stats.bufferMemory + delta;
}
