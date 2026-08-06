import { computed, Computed, reactive } from '@feng3d/reactivity';
import { assert, describe, it } from 'vitest';
import { ChainMap } from '../src/utils/ChainMap';
import { TypedArray } from '../src/types/TypedArray';

let computedCount = 0;
let writeBuffersCount = 0;

describe('getGPUBuffer', () =>
{
    it('constructor', () =>
    {
        const buffer: Buffer = { size: 100 };
        const r_buffer = reactive(buffer);

        computedCount = 0;
        writeBuffersCount = 0;

        // 第一次获取GPU缓冲区
        getGPUBuffer(buffer);

        assert.strictEqual(computedCount, 1);
        assert.strictEqual(writeBuffersCount, 0);

        // 设置写入数据
        computedCount = 0;
        writeBuffersCount = 0;

        r_buffer.writeBuffers = [
            {
                bufferOffset: 16,
                data: new Float32Array([1, 2, 3, 4]),
            },
        ];

        // 第二次获取GPU缓冲区，不触发创建GPU缓冲区，但触发写入数据
        getGPUBuffer(buffer);

        assert.strictEqual(computedCount, 0);
        assert.strictEqual(writeBuffersCount, 1);

        //
        computedCount = 0;
        writeBuffersCount = 0;

        r_buffer.size = 200;

        getGPUBuffer(buffer);

        assert.strictEqual(computedCount, 1);
        assert.strictEqual(writeBuffersCount, 0);

        assert.strictEqual(buffers.size, 1);
    });
});

/**
 * 获取或创建WGPUBuffer实例
 *
 * 使用设备+缓冲区的组合作为缓存键，避免重复创建。
 *
 * @param device GPU设备实例
 * @param buffer 缓冲区配置对象
 * @returns WGPUBuffer实例
 */
function getGPUBuffer(buffer: Buffer)
{
    let result = buffers.get([buffer]);

    if (result) return result.value;

    const r_buffer = reactive(buffer);

    let gpuBuffer: Float32Array;

    result = computed(() =>
    {
        computedCount++;

        // 销毁旧的GPU缓冲区
        gpuBuffer = null;

        // 触发响应式依赖
        r_buffer.size;
        r_buffer.data;

        const { size, data } = buffer;

        // 验证缓冲区尺寸必须为4的倍数（WebGPU要求）
        console.assert(size && (size % 4 === 0), `初始化缓冲区时必须设置缓冲区尺寸且必须为4的倍数！`);

        // 如果初始化时存在数据，则使用mappedAtCreation方式上传数据
        const mappedAtCreation = data !== undefined;

        // 创建GPU缓冲区
        gpuBuffer = new Float32Array(size / Float32Array.BYTES_PER_ELEMENT);

        // 如果初始化时存在数据，使用map方式上传数据
        if (mappedAtCreation)
        {
            gpuBuffer.set(new Float32Array(data));
            // 将数据写入映射的内存区域
        }

        onWriteBuffers(gpuBuffer, buffer);

        // 更新GPU缓冲区引用
        return gpuBuffer;
    });

    buffers.set([buffer], result);

    return result.value;
}

function onWriteBuffers(gpuBuffer: Float32Array, buffer: Buffer)
{
    const r_buffer = reactive(buffer);

    // 监听数据写入请求
    computed(() =>
    {
        // 触发响应式依赖，监听writeBuffers数组变化
        r_buffer.writeBuffers?.forEach(() =>
        { });

        // 如果GPU缓冲区不存在或没有写入数据，则跳过
        if (!buffer.writeBuffers) return;

        writeBuffersCount++;

        // 处理每个数据写入请求
        buffer.writeBuffers.forEach((writeBuffer) =>
        {
            const bufferOffset = writeBuffer.bufferOffset ?? 0;  // 缓冲区偏移量
            const data = writeBuffer.data;                       // 要写入的数据
            const dataOffset = writeBuffer.dataOffset ?? 0;      // 数据偏移量
            const size = writeBuffer.size;                       // 写入大小

            let arrayBuffer: ArrayBuffer | SharedArrayBuffer;
            let dataOffsetByte: number;
            let sizeByte: number;

            // 处理TypedArray类型的数据
            if (ArrayBuffer.isView(data))
            {
                const bytesPerElement = data.BYTES_PER_ELEMENT;

                arrayBuffer = data.buffer;
                dataOffsetByte = data.byteOffset + bytesPerElement * dataOffset;
                sizeByte = size ? (bytesPerElement * size) : data.byteLength;
            }
            // 处理ArrayBuffer类型的数据
            else
            {
                arrayBuffer = data;
                dataOffsetByte = dataOffset ?? 0;
                sizeByte = size ?? (data.byteLength - dataOffsetByte);
            }

            // 验证数据范围，防止越界
            console.assert(sizeByte <= arrayBuffer.byteLength - dataOffsetByte, `上传的尺寸超出数据范围！`);

            // 验证写入数据长度必须为4的倍数（WebGPU要求）
            console.assert(sizeByte % 4 === 0, `写入数据长度不是4的倍数！`);

            // 将数据写入GPU缓冲区
            gpuBuffer.set(new Float32Array(arrayBuffer).subarray(dataOffsetByte, dataOffsetByte + sizeByte), bufferOffset / Float32Array.BYTES_PER_ELEMENT);
        });

        // 清空写入数据，避免重复处理
        r_buffer.writeBuffers = null;
    }).value;
}

const buffers = new ChainMap<[Buffer], Computed<Float32Array>>();

interface Buffer
{
    /**
     * 缓冲区尺寸，单位为字节。
     *
     * 尺寸必须为4的倍数。
     *
     * 注：修改后将重新创建GPUBuffer。
     */
    readonly size: number;

    /**
     * 缓冲区数据。
     *
     * 注：修改后将重新创建GPUBuffer。
     */
    readonly data?: ArrayBufferLike;

    /**
     * 写缓冲区。
     *
     * {@link GPUQueue.writeBuffer}
     */
    readonly writeBuffers?: WriteBuffer[];
}

interface WriteBuffer
{
    /**
     * GPU缓冲区写入起始位置。
     */
    bufferOffset?: number;

    /**
     * 写入缓冲区数据。
     */
    data: ArrayBufferLike | Float32Array;

    /**
     * 读取数据的起始位置。
     *
     * 默认为 0 。
     *
     * 当写入的数据类型为 {@link ArrayBufferLike} 时单位为字节，当数据类型为 {@link TypedArray} 时单位为元素。
     */
    dataOffset?: number;

    /**
     * 写入数据尺寸。
     *
     * 当写入的数据类型为 {@link ArrayBufferLike} 时单位为字节，当数据类型为 {@link TypedArray} 时单位为元素。
     */
    size?: number;
}
