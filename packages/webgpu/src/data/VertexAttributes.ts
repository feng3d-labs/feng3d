import { vertexFormatMap } from '../consts/vertexFormatMap';

/**
 * 顶点属性数据映射。
 */
export interface VertexAttributes
{
    [name: string]: VertexAttribute;
}

/**
 * 顶点属性数据。
 */
export interface VertexAttribute
{
    /**
     * 顶点数据。
     */
    data: VertexData;

    /**
     * 顶点数据格式。
     *
     * 由于提供的数据并不一定与着色器中格式一直，因此必须提供与着色器中兼容的数据格式。
     */
    readonly format: VertexFormat;

    /**
     * 所在顶点数据中的偏移字节数。
     */
    readonly offset?: number;

    /**
     * The stride, in bytes, between elements of this array.
     *
     * {@link GPUVertexBufferLayout.arrayStride}
     */
    readonly arrayStride?: number;

    /**
     * Whether each element of this array represents per-vertex data or per-instance data
     *
     * {@link GPUVertexBufferLayout.stepMode}
     *
     * 默认 `"vertex"` 。
     */
    readonly stepMode?: VertexStepMode;
}

export class VertexAttribute
{
    /**
     * 获取顶点属性数据的顶点数量。
     *
     * @param attribute 顶点属性数据。
     * @returns
     */
    static getVertexCount(attribute: VertexAttribute)
    {
        // 单个顶点属性数据尺寸。
        const attributeSize = VertexAttribute.getVertexByteSize(attribute);
        const offset = attribute.offset || 0;
        // 一个顶点数据尺寸，可能包括多个顶点属性（例如一个position 和 uv 共 3*4 + 2*4 = 20 字节）。
        const arrayStride = attribute.arrayStride || attributeSize;

        const attributeCount = (attribute.data.byteLength - offset) / arrayStride;

        return attributeCount;
    }

    /**
     * 获取顶点属性数据的字节尺寸。
     *
     * @param attribute 顶点属性数据。
     */
    static getVertexByteSize(attribute: VertexAttribute)
    {
        const attributeSize = vertexFormatMap[attribute.format].byteSize;

        return attributeSize;
    }
}

export type VertexStepMode = 'vertex' | 'instance';

export type VertexData = | Float32Array
    | Uint32Array
    | Int32Array
    | Uint16Array
    | Int16Array
    | Uint8ClampedArray
    | Uint8Array
    | Int8Array;

/**
 * 顶点数据格式。
 */
export type VertexFormat =
    | 'uint8x2'
    | 'uint8x4'
    | 'sint8x2'
    | 'sint8x4'
    | 'unorm8x2'
    | 'unorm8x4'
    | 'snorm8x2'
    | 'snorm8x4'
    | 'uint16x2'
    | 'uint16x4'
    | 'sint16x2'
    | 'sint16x4'
    | 'unorm16x2'
    | 'unorm16x4'
    | 'snorm16x2'
    | 'snorm16x4'
    | 'float16x2'
    | 'float16x4'
    | 'float32'
    | 'float32x2'
    | 'float32x3'
    | 'float32x4'
    | 'uint32'
    | 'uint32x2'
    | 'uint32x3'
    | 'uint32x4'
    | 'sint32'
    | 'sint32x2'
    | 'sint32x3'
    | 'sint32x4'
    | 'unorm10-10-10-2';
