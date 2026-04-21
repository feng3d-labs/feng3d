import { TypedArray } from '../types/TypedArray';

/**
 * 缓冲区绑定。
 *
 * @see GPUBufferBinding
 */
export interface BufferBinding<T extends UniformDataItem = UniformDataItem>
{
    /**
     * 用于声明数据结构及更新数据，引擎将自动处理数据与着色器中的映射关系。
     * 推荐使用 value 来更新数据，value 与 bufferView 可以共存。
     */
    readonly value?: T;

    /**
     * 用于指定缓冲区大小。
     * 对于 storage buffer，需要指定尺寸：
     * - 如果 value 是数组，引擎将根据数组长度自动确定尺寸
     * - 或者直接设置 bufferView 为指定大小的 TypedArray
     * 也可以在需要多个 BufferBinding 共享同一个大的 buffer 时设置，
     * 通过 bufferView.buffer 来对应同一个 GPUBuffer。
     */
    readonly bufferView?: TypedArray;
}

export type UniformDataItem = number | undefined | readonly number[] | readonly number[][] | TypedArray | readonly TypedArray[]
    | { toArray(): number[] | TypedArray }
    | readonly { toArray(): number[] | TypedArray }[]
    | readonly UniformDataItem[]  // 支持数组
    | { readonly [key: string]: UniformDataItem }  // 支持对象
    | unknown  // 支持任意类型
    ;
export type BufferBindingItem = UniformDataItem | { readonly [key: string]: BufferBindingItem };
