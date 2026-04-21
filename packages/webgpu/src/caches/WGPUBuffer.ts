import { Computed, computed, reactive } from '@feng3d/reactivity';
import { Buffer } from '../data/Buffer';
import { ChainMap } from '../utils/ChainMap';
import { ReactiveObject } from '../ReactiveObject';

/**
 * WebGPU缓冲区管理器。
 * 负责管理GPU缓冲区的创建、数据写入和生命周期管理。
 * 使用响应式系统自动处理缓冲区更新和数据同步。
 */
export class WGPUBuffer extends ReactiveObject
{
    get gpuBuffer()
    {
        return this._computed.value;
    }

    private _computed: Computed<GPUBuffer>;

    /**
     * 构造函数
     * @param device GPU设备实例
     * @param buffer 缓冲区配置对象
     */
    constructor(device: GPUDevice, buffer: Buffer)
    {
        super();

        this._onCreate(device, buffer);

        //
        WGPUBuffer.map.set([device, buffer], this);
        this.destroyCall(() =>
        {
            WGPUBuffer.map.delete([device, buffer]);
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

        // 监听缓冲区配置变化，自动重新创建GPU缓冲区
        this._computed = computed(() =>
        {
            // 触发响应式依赖
            r_buffer.size;

            const { label, size, data } = buffer;

            // 验证缓冲区尺寸必须为4的倍数（WebGPU要求）
            console.assert(size && (size % 4 === 0), `初始化缓冲区时必须设置缓冲区尺寸且必须为4的倍数！`);

            // 如果初始化时存在数据，则使用mappedAtCreation方式上传数据
            const mappedAtCreation = data !== undefined;

            // 销毁旧的GPU缓冲区
            gpuBuffer?.destroy();

            // 创建GPU缓冲区
            gpuBuffer = device.createBuffer({
                label,
                size,
                usage: WGPUBuffer.defaultGPUBufferUsage,
                mappedAtCreation,
            });

            // 如果初始化时存在数据，使用map方式上传数据
            if (mappedAtCreation)
            {
                // 将数据写入映射的内存区域
                new Int8Array(gpuBuffer.getMappedRange()).set(new Int8Array(data));

                // 取消映射，使数据生效
                gpuBuffer.unmap();
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
                data: new Uint8Array(data),
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

        // 注册销毁回调，确保在对象销毁时清理GPU缓冲区
        this.destroyCall(() =>
        {
            gpuBuffer?.destroy();
            this._computed = null;
        });
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
        reactive(buffer).writeBuffers = null;
    }

    /**
     * 默认GPU缓冲区使用标志
     * 包含除CPU与GPU数据交换外的所有常用缓冲区用途
     * 注意：不包含MAP_READ和MAP_WRITE，这些需要特殊处理
     */
    static readonly defaultGPUBufferUsage = 0
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

    private static readonly map = new ChainMap<[GPUDevice, Buffer], WGPUBuffer>();
}
