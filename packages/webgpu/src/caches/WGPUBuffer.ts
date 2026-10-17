import { Computed, computed, reactive } from '@feng3d/reactivity';
import { Buffer } from '../data/Buffer';
import { ChainMap } from '../utils/ChainMap';
import { ReactiveObject } from '../ReactiveObject';
import { trackCreate, trackFree, addMemory } from '../utils/GPUDeviceStats';
import { createResourcePool, ResourcePool, ResourcePoolStats } from '../utils/ResourcePool';

/**
 * WebGPU缓冲区管理器。
 * 负责管理GPU缓冲区的创建、数据写入和生命周期管理。
 * 使用响应式系统自动处理缓冲区更新和数据同步。
 */
export class WGPUBuffer extends ReactiveObject
{
    get gpuBuffer()
    {
        // destroy() 会把字段置 null（置空后访问与原来的 null.value 一样抛错，行为不变）
        return this._computed!.value;
    }

    private _computed: Computed<GPUBuffer> | null;

    /** 关联的 device（销毁时减统计用） */
    private _device: GPUDevice;

    /**
     * 构造函数
     * @param device GPU设备实例
     * @param buffer 缓冲区配置对象
     */
    constructor(device: GPUDevice, buffer: Buffer)
    {
        super();
        this._device = device;

        this._onCreate(device, buffer);

        //
        WGPUBuffer.map.set([device, buffer], this);
        trackCreate(device, 'buffer');
        this.destroyCall(() =>
        {
            WGPUBuffer.map.delete([device, buffer]);
            trackFree(device, 'buffer');
        });
    }

    /**
     * 创建GPU缓冲区
     * 使用响应式系统监听缓冲区配置变化，自动重新创建GPU缓冲区
     */
    private _onCreate(device: GPUDevice, buffer: Buffer)
    {
        const r_buffer = reactive(buffer);

        let gpuBuffer: GPUBuffer;
        /** 当前 GPU 缓冲区对应的池键（归还时按它入池；池化关闭或未入池时为 null） */
        let gpuBufferKey: string | null = null;

        // 监听缓冲区配置变化，自动重新创建GPU缓冲区
        this._computed = computed(() =>
        {
            // 触发响应式依赖
            r_buffer.size;

            const { label, size, data } = buffer;

            // 验证缓冲区尺寸必须为4的倍数（WebGPU要求）
            console.assert(!!size && size % 4 === 0, `初始化缓冲区时必须设置缓冲区尺寸且必须为4的倍数！`);

            const usage = WGPUBuffer.defaultGPUBufferUsage;
            const poolKey = `${size}|${usage}`;

            // 归还旧的GPU缓冲区：池化开启时入池复用，否则按原行为销毁并扣减显存
            if (gpuBuffer)
            {
                WGPUBuffer._disposeGpuBuffer(device, gpuBufferKey, gpuBuffer);
            }
            gpuBufferKey = null;

            // 池化复用前提：初始数据完整覆盖整个缓冲区（byteLength === size）。
            // size 是 byteLength 向上 4 字节对齐的结果，两者不等只差 1–3 字节，而 writeBuffer
            // 的 offset/size 都要求 4 字节对齐，无法单独清理这几个字节，故这类数据不复用。
            const pool = WGPUBuffer._pool;
            const reusable = pool && data !== undefined && data.byteLength === size
                ? pool.take(device, poolKey)
                : undefined;

            if (reusable)
            {
                gpuBuffer = reusable;
                gpuBufferKey = poolKey;
                if (label !== undefined) gpuBuffer.label = label;
                // 复用路径不能再 mappedAtCreation：改用队列写入（排在已提交命令之后）
                device.queue.writeBuffer(gpuBuffer, 0, data as unknown as GPUAllowSharedBufferSource);
            }
            else
            {
                // 如果初始化时存在数据，则使用mappedAtCreation方式上传数据
                const mappedAtCreation = data !== undefined;

                // 创建GPU缓冲区
                gpuBuffer = device.createBuffer({
                    label,
                    size,
                    usage,
                    mappedAtCreation,
                });
                gpuBufferKey = poolKey;

                // 统计显存：只有真正新建才计一次（复用不重复计，池中驻留的早已计入）
                addMemory(device, 'bufferMemory', size);

                // 如果初始化时存在数据，使用map方式上传数据
                if (mappedAtCreation)
                {
                    // 将数据写入映射的内存区域
                    new Int8Array(gpuBuffer.getMappedRange()).set(new Int8Array(data));

                    // 取消映射，使数据生效
                    gpuBuffer.unmap();
                }
            }

            WGPUBuffer._writeBuffers(device, gpuBuffer, buffer);

            // 更新GPU缓冲区引用
            return gpuBuffer;
        });

        this.effect(() =>
        {
            r_buffer.data;

            if (!gpuBuffer) return;

            const data = buffer.data;

            const writeBuffers = buffer.writeBuffers || [];

            writeBuffers.push({
                // Buffer.data 的静态类型是 ArrayBuffer | ArrayBufferView，而 Uint8Array 构造器的重载
                // 不含这个联合；运行时两种实参都合法（ArrayBuffer 建视图、TypedArray 拷贝元素），
                // 所以这里只做类型层断言，不改变传进去的值
                data: new Uint8Array(data as unknown as ArrayBufferLike),
            });

            r_buffer.writeBuffers = writeBuffers;
        });

        this.effect(() =>
        {
            // 触发响应式依赖，监听writeBuffers数组变化
            r_buffer.writeBuffers?.forEach(() =>
            { });

            if (!gpuBuffer) return;

            WGPUBuffer._writeBuffers(device, gpuBuffer, buffer);
        });

        // 注册销毁回调，确保在对象销毁时清理GPU缓冲区（池化开启时归还入池）
        this.destroyCall(() =>
        {
            if (gpuBuffer) WGPUBuffer._disposeGpuBuffer(device, gpuBufferKey, gpuBuffer);
            gpuBufferKey = null;
            this._computed = null;
        });
    }

    /**
     * 归还 GPU 缓冲区：池化开启且拿到池键时入池复用，否则立即销毁。
     *
     * 显存读数只在**真正销毁**时扣减（池中驻留仍占用显存），新建时已加过。
     */
    private static _disposeGpuBuffer(device: GPUDevice, key: string | null, gpuBuffer: GPUBuffer): void
    {
        if (WGPUBuffer._pool && key)
        {
            WGPUBuffer._pool.put(device, key, gpuBuffer);

            return;
        }

        gpuBuffer.destroy();
        addMemory(device, 'bufferMemory', -gpuBuffer.size);
    }

    private static _writeBuffers(device: GPUDevice, gpuBuffer: GPUBuffer, buffer: Buffer)
    {
        // 如果GPU缓冲区不存在或没有写入数据，则跳过
        if (!buffer.writeBuffers) return;

        // 处理每个数据写入请求
        buffer.writeBuffers.forEach((writeBuffer) =>
        {
            const bufferOffset = writeBuffer.bufferOffset ?? 0;  // 缓冲区偏移量
            const data = writeBuffer.data;                       // 要写入的数据
            const size = writeBuffer.size;                       // 写入大小

            const arrayBuffer = data.buffer;
            const dataOffsetByte = data.byteOffset;
            const sizeByte = size ? (data.BYTES_PER_ELEMENT * size) : data.byteLength;

            // 验证数据范围，防止越界
            console.assert(sizeByte <= arrayBuffer.byteLength - dataOffsetByte, `上传的尺寸超出数据范围！`);

            // 验证写入数据长度必须为4的倍数（WebGPU要求）
            console.assert(sizeByte % 4 === 0, `写入数据长度不是4的倍数！`);

            // 将数据写入GPU缓冲区
            device.queue.writeBuffer(
                gpuBuffer,
                bufferOffset,
                arrayBuffer,
                dataOffsetByte,
                sizeByte,
            );
        });
        // 写入完成后清空缓冲数据
        // 用 undefined 而不是 null 清空：纯数据接口里 writeBuffers 是可选字段（`WriteBuffer[] | undefined`），
        // 所有读取点都是真值判断或可选链，undefined 与原来的 null 行为完全一致
        reactive(buffer).writeBuffers = undefined;
    }

    /**
     * 默认GPU缓冲区使用标志
     * 包含除CPU与GPU数据交换外的所有常用缓冲区用途
     * 注意：不包含MAP_READ和MAP_WRITE，这些需要特殊处理
     *
     * 用 `static get`（而不是 static 字段）：`GPUBufferUsage` 是宿主（浏览器）注入的全局，
     * static 字段初始化器会在**模块 import 期**求值，Node / SSR 下没有该全局，`import` 即
     * `ReferenceError: GPUBufferUsage is not defined`（issue #624）。改成 getter 后只在
     * **首次访问**时求值——那时宿主已就绪。取值与改动前逐位相同（纯常量按位或），无行为变化。
     */
    static get defaultGPUBufferUsage(): number
    {
        return 0
            // | GPUBufferUsage.MAP_READ      // CPU读取GPU数据
            // | GPUBufferUsage.MAP_WRITE     // CPU写入GPU数据
            | GPUBufferUsage.COPY_SRC        // 作为复制源
            | GPUBufferUsage.COPY_DST        // 作为复制目标
            | GPUBufferUsage.INDEX           // 索引缓冲区
            | GPUBufferUsage.VERTEX          // 顶点缓冲区
            | GPUBufferUsage.UNIFORM         // 统一缓冲区
            | GPUBufferUsage.STORAGE         // 存储缓冲区
            | GPUBufferUsage.INDIRECT        // 间接绘制缓冲区
            | GPUBufferUsage.QUERY_RESOLVE   // 查询解析缓冲区
        ;
    }

    /**
     * 获取或创建WGPUBuffer实例
     * 使用设备+缓冲区的组合作为缓存键，避免重复创建
     * @param device GPU设备实例
     * @param buffer 缓冲区配置对象
     * @returns WGPUBuffer实例
     */
    static getInstance(device: GPUDevice, buffer: Buffer)
    {
        return this.map.get([device, buffer]) || new WGPUBuffer(device, buffer);
    }

    /**
     * 实例缓存的存储（R2，issue #614：缓存一律 lazy-init，不在 import 时分配）。
     */
    private static _map: ChainMap<[GPUDevice, Buffer], WGPUBuffer> | null = null;

    /** 实例缓存（首次访问时创建） */
    private static get map(): ChainMap<[GPUDevice, Buffer], WGPUBuffer>
    {
        if (!WGPUBuffer._map) WGPUBuffer._map = new ChainMap();

        return WGPUBuffer._map;
    }

    /**
     * GPU 缓冲区池（issue #98）。
     *
     * **默认关闭**（null）：关闭时每个归还点都直接 destroy，运行时行为与池化前一致。
     * 池化会改变「显存驻留」与「销毁时机」，未在有 GPU 的真机上验证画面前不应默认开启。
     */
    static _pool: ResourcePool<GPUBuffer> | null = null;
}

/**
 * 打开 / 关闭 GPU 缓冲区池化（issue #98）。
 *
 * 默认关闭。开启后 `WGPUBuffer` 的 GPU 缓冲区在归还点进入池，按 `size|usage`
 * 规格复用同规格闲置缓冲区，减少换装 churn 下的 `createBuffer()` 分配次数。
 *
 * @param enabled 是否开启
 * @param maxIdleTotal 每个 device 允许闲置的缓冲区条数上限（默认 32；置 0 等价于关闭）
 */
export function setGpuBufferPoolEnabled(enabled: boolean, maxIdleTotal = 32): void
{
    if (!enabled || maxIdleTotal <= 0)
    {
        WGPUBuffer._pool = null;

        return;
    }

    WGPUBuffer._pool = createResourcePool<GPUBuffer>({
        maxIdleTotal,
        onDestroy: (device, gpuBuffer) =>
        {
            gpuBuffer.destroy();
            // 池中驻留同样占显存：只有真正销毁才扣减
            addMemory(device, 'bufferMemory', -gpuBuffer.size);
        },
    });
}

/** 当前是否开启 GPU 缓冲区池化 */
export function isGpuBufferPoolEnabled(): boolean
{
    return WGPUBuffer._pool !== null;
}

/** 取 GPU 缓冲区池读数（未开启时返回全 0） */
export function getGpuBufferPoolStats(device: GPUDevice): ResourcePoolStats
{
    return WGPUBuffer._pool ? WGPUBuffer._pool.getStats(device) : { reused: 0, released: 0, destroyed: 0, idle: 0 };
}

/** 清空 GPU 缓冲区池（销毁全部闲置缓冲区；测试与设备丢失时用） */
export function clearGpuBufferPool(device: GPUDevice): void
{
    WGPUBuffer._pool?.clear(device);
}
