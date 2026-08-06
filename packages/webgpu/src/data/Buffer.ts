import { WriteBuffer } from './WriteBuffer';

/**
 * 缓冲区
 *
 * {@link GPUBufferDescriptor}
 *
 * {@link GPUBuffer}
 */
export interface Buffer
{
    /**
     * 标签。
     *
     * 用于调试。
     */
    readonly label?: string;

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
     */
    readonly data?: ArrayBufferLike;

    /**
     * 写缓冲区。
     *
     * {@link GPUQueue.writeBuffer}
     */
    readonly writeBuffers?: WriteBuffer[];
}

export class Buffer
{
    /**
     * 从TypedArray创建或获取缓冲区配置
     * 自动处理缓冲区大小对齐（4字节对齐）
     * @param arrayBuffer 源数据数组
     * @returns 缓冲区配置对象
     */
    static getBuffer(arrayBuffer: ArrayBufferLike)
    {
        // 检查是否已存在对应的缓冲区配置
        let buffer = this.bufferMap.get(arrayBuffer);

        if (buffer) return buffer;

        // 创建新的缓冲区配置，确保大小为4的倍数
        buffer = {
            size: Math.ceil(arrayBuffer.byteLength / 4) * 4,
            data: arrayBuffer,
        };
        this.bufferMap.set(arrayBuffer, buffer);

        return buffer;
    }

    /** 缓冲区配置缓存映射表 */
    private static readonly bufferMap = new WeakMap<ArrayBufferLike, Buffer>();
}

declare global
{
    interface ArrayBuffer
    {
        // 并不会实际赋值， 只是用于 ArrayBuffer 与 TypedArray 在类型上做区分。
        __type__: 'ArrayBuffer';
    }
    interface SharedArrayBuffer
    {
        // 并不会实际赋值， 只是用于 SharedArrayBuffer 与 TypedArray 在类型上做区分。
        __type__: 'SharedArrayBuffer';
    }
}
