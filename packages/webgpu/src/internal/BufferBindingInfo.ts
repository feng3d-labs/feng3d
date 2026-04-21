/**
 * 缓冲区绑定信息。
 */
export interface BufferBindingInfo
{
    size: number;
    items: {
        paths: string[];
        offset: number;
        size: number;
        Cls: Float32ArrayConstructor | Int32ArrayConstructor | Uint32ArrayConstructor | Int16ArrayConstructor;
        /**
         * 类型名称（用于判断是否需要对齐转换，WebGPU 专用）
         */
        typeName?: string;
    }[]
}
