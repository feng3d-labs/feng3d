import { Computed, computed, reactive } from '@feng3d/reactivity';
import { ChainMap } from '../utils/ChainMap';
import { TimestampQuery } from '../data/TimestampQuery';
import { ReactiveObject } from '../ReactiveObject';

/**
 * WebGPU时间戳查询缓存管理器
 *
 * 负责管理WebGPU时间戳查询的完整生命周期，包括：
 * - 时间戳查询集的创建和配置
 * - 响应式监听时间戳查询参数变化
 * - 自动重新创建时间戳查询当依赖变化时
 * - 查询结果缓冲区的管理
 * - 时间戳查询实例的缓存和复用
 * - 资源清理和内存管理
 *
 * 主要功能：
 * 1. **时间戳查询管理** - 自动创建和配置GPU时间戳查询集
 * 2. **特性支持检测** - 自动检测设备是否支持timestamp-query特性
 * 3. **响应式更新** - 监听时间戳查询参数变化，自动重新创建
 * 4. **实例缓存** - 使用WeakMap缓存时间戳查询实例，避免重复创建
 * 5. **资源管理** - 自动处理查询集和缓冲区的清理
 * 6. **异步结果处理** - 自动处理查询结果的异步读取和回调
 * 7. **生命周期管理** - 统一管理查询相关资源的创建和销毁
 *
 * 使用场景：
 * - 渲染性能测量和分析
 * - GPU命令执行时间统计
 * - 渲染管线性能优化
 * - 帧率分析和调试
 * - 渲染通道性能监控
 */
export class WGPUTimestampQuery extends ReactiveObject
{
    /**
     * WebGPU时间戳查询集对象
     *
     * 这是实际的GPU时间戳查询集实例，用于在渲染通道中记录时间戳。
     * 当时间戳查询配置发生变化时，此对象会自动重新创建。
     */
    get gpuPassTimestampWrites()
    {
        return this._computedGpuPassTimestampWrites.value;
    }

    private _computedGpuPassTimestampWrites: Computed<GPURenderPassTimestampWrites | GPUComputePassTimestampWrites>;

    /**
     * 构造函数
     *
     * 创建时间戳查询管理器实例，并设置响应式监听。
     *
     * @param device GPU设备实例，用于创建时间戳查询
     * @param timestampQuery 时间戳查询配置对象，包含查询参数和回调
     */
    constructor(device: GPUDevice, timestampQuery?: TimestampQuery)
    {
        super();

        // 设置时间戳查询创建和更新逻辑
        this._onCreate(device, timestampQuery);

        //
        WGPUTimestampQuery.map.set([device, timestampQuery], this);
        this.destroyCall(() =>
        {
            WGPUTimestampQuery.map.delete([device, timestampQuery]);
        });
    }

    /**
     * 设置时间戳查询创建和更新逻辑
     *
     * 使用响应式系统监听时间戳查询配置变化，自动重新创建时间戳查询。
     * 当时间戳查询参数发生变化时，会触发时间戳查询的重新创建。
     * 支持特性检测和异步结果处理。
     * 直接管理查询相关资源的生命周期，确保资源正确清理。
     *
     * @param device GPU设备实例
     * @param timestampQuery 时间戳查询配置对象
     */
    private _onCreate(device: GPUDevice, timestampQuery: TimestampQuery)
    {
        // 创建时间戳查询集
        const querySet = device.createQuerySet({ type: 'timestamp', count: 2 });

        // 创建用于存储GPU查询结果的缓冲区
        const timestampByteSize = 8; // 时间戳是uint64类型，8字节
        const resolveBuf: GPUBuffer = device.createBuffer({
            size: 2 * timestampByteSize,
            usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.QUERY_RESOLVE,
        });

        // 创建用于将结果映射回CPU的缓冲区
        const resultBuf: GPUBuffer = device.createBuffer({
            size: resolveBuf.size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        // 标记是否需要解析查询结果
        let needResolve = false;

        // 定义查询结果解析函数
        const resolve = (commandEncoder: GPUCommandEncoder) =>
        {
            // 在渲染通道结束后，将查询结果解析到专用缓冲区
            commandEncoder.resolveQuerySet(querySet, 0, querySet.count, resolveBuf, 0);

            // 如果结果缓冲区未映射，则复制数据并标记需要解析
            if (resultBuf.mapState === 'unmapped')
            {
                // 将值复制到可映射的缓冲区
                commandEncoder.copyBufferToBuffer(resolveBuf, 0, resultBuf, 0, resultBuf.size);
                needResolve = true;
            }
        };

        // 监听时间戳查询配置变化，自动重新创建时间戳查询
        this._computedGpuPassTimestampWrites = computed(() =>
        {
            // 创建时间戳查询写入配置
            const timestampWrites: GPURenderPassTimestampWrites | GPUComputePassTimestampWrites = {
                querySet,
                beginningOfPassWriteIndex: 0,
                endOfPassWriteIndex: 1,
                resolve,
            };

            // 更新时间戳查询引用
            return timestampWrites;
        });

        // 监听GPU队列提交事件，处理查询结果
        this.effect(() =>
        {
            // 触发响应式依赖，监听队列提交事件
            reactive(device.queue).afterSubmit;

            // 如果结果缓冲区已映射，跳过处理
            if (resultBuf.mapState !== 'unmapped') return;

            // 如果不需要解析，跳过处理
            if (!needResolve) return;

            // 重置解析标记
            needResolve = false;

            // 异步读取查询结果
            resultBuf.mapAsync(GPUMapMode.READ).then(() =>
            {
                // 读取时间戳数据
                const timestamps = new BigUint64Array(resultBuf.getMappedRange());

                // 计算开始时间到结束时间的差值
                // 转换为数字。Number的最大整数可以是9007199254740991
                // 相当于109天的纳秒数
                const elapsedNs = Number(timestamps[1] - timestamps[0]);

                // elapsedNs可能为负数，表示无效（参见规范 https://gpuweb.github.io/gpuweb/#timestamp）
                if (elapsedNs >= 0)
                {
                    // 将结果设置到时间戳查询对象中
                    reactive(timestampQuery).result = { elapsedNs };
                }

                // 取消映射缓冲区
                resultBuf.unmap();
            });
        });

        // 注册销毁回调，确保在对象销毁时清理查询相关资源
        this.destroyCall(() =>
        {
            querySet.destroy();
            resolveBuf.destroy();
            resultBuf.destroy();
        });
    }

    /**
     * 获取或创建时间戳查询实例
     *
     * 使用单例模式管理时间戳查询实例，避免重复创建相同的时间戳查询。
     * 如果缓存中已存在对应的实例，则直接返回；否则创建新实例并缓存。
     * 自动检测设备是否支持timestamp-query特性。
     *
     * @param device GPU设备实例
     * @param timestampQuery 时间戳查询配置对象
     * @returns 时间戳查询实例，如果不支持特性则返回null
     */
    public static getInstance(device: GPUDevice, timestampQuery: TimestampQuery)
    {
        // 如果时间戳查询配置为空，直接返回null
        if (!timestampQuery) return null;

        // 检查是否支持timestamp-query特性
        if (timestampQuery.isSupports === undefined)
        {
            reactive(timestampQuery).isSupports = device.features.has(`timestamp-query`);
        }

        // 如果不支持timestamp-query特性，输出警告并返回null
        if (!timestampQuery.isSupports)
        {
            console.warn(`WebGPU未开启或者不支持 timestamp-query 特性，请确认 WebGPU.init 初始化参数是否正确！`);

            return null;
        }

        // 尝试从缓存中获取现有实例，如果不存在则创建新实例
        return this.map.get([device, timestampQuery]) || new WGPUTimestampQuery(device, timestampQuery);
    }

    static readonly map = new ChainMap<[GPUDevice, TimestampQuery], WGPUTimestampQuery>();
}

/**
 * 全局类型声明
 *
 * 扩展WebGPU接口，添加自定义的resolve方法到时间戳写入对象中。
 * 这些方法用于在渲染通道结束后解析时间戳查询结果。
 */
declare global
{
    interface GPURenderPassTimestampWrites
    {
        resolve?: (commandEncoder: GPUCommandEncoder) => void;
    }
    interface GPUComputePassTimestampWrites
    {
        resolve?: (commandEncoder: GPUCommandEncoder) => void;
    }
}