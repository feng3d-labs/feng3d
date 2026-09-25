import { WGSLVertexType } from '../consts/vertexFormatMap';

/**
 * WGSL着色器中顶点类型对应的GPU顶点数据格式。
 */
export type WGSLVertexTypeValue = {
    /**
     * 默认对应的GPU顶点数据格式。
     */
    format: GPUVertexFormat,

    /**
     * 可能对应的GPU顶点数据格式列表。
     */
    possibleFormats: GPUVertexFormat[],
};

/**
 * WGSL着色器中顶点类型对应的GPU顶点数据格式映射。
 */
export const wgslVertexTypeMap: Record<WGSLVertexType, WGSLVertexTypeValue> = {
    'vec2<u32>': { format: 'uint32x2', possibleFormats: ['uint8x2', 'uint16x2', 'uint32x2'] },
    'vec4<u32>': { format: 'uint32x4', possibleFormats: ['uint8x4', 'uint16x4', 'uint32x4'] },
    'vec2<i32>': { format: 'sint32x2', possibleFormats: ['sint8x2', 'sint16x2', 'sint32x2'] },
    'vec4<i32>': { format: 'sint32x4', possibleFormats: ['sint8x4', 'sint16x4', 'sint32x4'] },
    'vec2<f32>': { format: 'float32x2', possibleFormats: ['unorm8x2', 'snorm8x2', 'unorm16x2', 'snorm16x2', 'float32x2'] },
    'vec4<f32>': { format: 'float32x4', possibleFormats: ['unorm8x4', 'snorm8x4', 'unorm16x4', 'snorm16x4', 'float32x4'] },
    'vec2<f16>': { format: 'float16x2', possibleFormats: ['float16x2'] },
    'vec4<f16>': { format: 'float16x4', possibleFormats: ['float16x4'] },
    f32: { format: 'float32', possibleFormats: ['float32'] },
    'vec3<f32>': { format: 'float32x3', possibleFormats: ['float32x3'] },
    u32: { format: 'uint32', possibleFormats: ['uint32'] },
    'vec3<u32>': { format: 'uint32x3', possibleFormats: ['uint32x3'] },
    i32: { format: 'sint32', possibleFormats: ['sint32'] },
    'vec3<i32>': { format: 'sint32x3', possibleFormats: ['sint32x3'] },
};
