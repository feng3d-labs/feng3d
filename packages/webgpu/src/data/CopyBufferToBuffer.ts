import { TypedArray } from '../types/TypedArray';

/**
 * GPU缓冲区之间拷贝。
 *
 * {@link GPUCommandEncoder.copyBufferToBuffer}
 */
export interface CopyBufferToBuffer
{
    /**
     * 数据类型。
     */
    readonly __type__: 'CopyBufferToBuffer';

    /**
     * 源数据。
     *
     * source.buffer 对应 GPUBuffer，source.byteOffset 对应 sourceOffset，source.byteLength 对应 size。
     */
    source: TypedArray;

    /**
     * 目标缓冲区。
     *
     * {@link destination.buffer} 对应 GPUBuffer，{@link destination.byteOffset} 对应 destinationOffset，{@link destination.byteLength} 对应 size。
     */
    destination: TypedArray;

    /**
     * 拷贝的尺寸。
     *
     * 默认为源数据与目标数据字节长度的最小值({@link Math.min} ({@link source.byteLength}, {@link destination.byteLength}))。
     */
    size?: number;
}
