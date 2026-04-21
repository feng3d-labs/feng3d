import { TypedArray } from '../types/TypedArray';

/**
 * 缓冲区绑定。
 *
 * @see GPUBufferBinding
 */
export interface BufferBinding<T extends BufferBindingItem = BufferBindingItem>
{
    /**
     * 用于声明数据结构及更新数据，引擎将自动处理数据与着色器中的映射关系。
     * 推荐使用 value 来更新数据，value 与 bufferView 可以共存。
     */
    readonly value?: T;

    /**
     * 用于创建 GPUBuffer，如果不存在将自动创建。
     * 一般不需要直接使用，仅在需要多个 BufferBinding 共享一个大的 buffer 时设置，
     * 通过 bufferView.buffer 来对应同一个 GPUBuffer。
     */
    readonly bufferView?: TypedArray;
}

export type UniformDataItem = number | readonly number[] | readonly number[][] | TypedArray | readonly TypedArray[]
    | { toArray(): number[] | TypedArray }
    | readonly { toArray(): number[] | TypedArray }[]
    ;
export type BufferBindingItem = UniformDataItem | { readonly [key: string]: BufferBindingItem };
