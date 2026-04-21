import { TypedArray } from '../types/TypedArray';

export interface WriteBuffer
{
    /**
     * GPU缓冲区写入起始位置。
     */
    bufferOffset?: number;

    /**
     * 写入缓冲区数据。
     */
    data: TypedArray;

    /**
     * 写入数据数量。
     *
     * 默认为 {@link data.length} 。
     */
    size?: number;
}
