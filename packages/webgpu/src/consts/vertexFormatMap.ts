import { VertexFormat } from '../data/VertexAttributes';

/**
 * 顶点属性格式信息映射。
 */
export const vertexFormatMap: Record<VertexFormat, VertexAttributeFormatInfo> = {
    uint8x2: { numComponents: 2, type: 'UNSIGNED_BYTE', normalized: false, dataType: 'unsigned int', byteSize: 2, wgslType: 'vec2<u32>', typedArrayConstructor: Uint8Array },
    uint8x4: { numComponents: 4, type: 'UNSIGNED_BYTE', normalized: false, dataType: 'unsigned int', byteSize: 4, wgslType: 'vec4<u32>', typedArrayConstructor: Uint8Array },
    sint8x2: { numComponents: 2, type: 'BYTE', normalized: false, dataType: 'signed int', byteSize: 2, wgslType: 'vec2<i32>', typedArrayConstructor: Int8Array },
    sint8x4: { numComponents: 4, type: 'BYTE', normalized: false, dataType: 'signed int', byteSize: 4, wgslType: 'vec4<i32>', typedArrayConstructor: Int8Array },
    unorm8x2: { numComponents: 2, type: 'UNSIGNED_BYTE', normalized: true, dataType: 'unsigned normalized', byteSize: 2, wgslType: 'vec2<f32>', typedArrayConstructor: Uint8Array },
    unorm8x4: { numComponents: 4, type: 'UNSIGNED_BYTE', normalized: true, dataType: 'unsigned normalized', byteSize: 4, wgslType: 'vec4<f32>', typedArrayConstructor: Uint8Array },
    snorm8x2: { numComponents: 2, type: 'BYTE', normalized: true, dataType: 'signed normalized', byteSize: 2, wgslType: 'vec2<f32>', typedArrayConstructor: Int8Array },
    snorm8x4: { numComponents: 4, type: 'BYTE', normalized: true, dataType: 'signed normalized', byteSize: 4, wgslType: 'vec4<f32>', typedArrayConstructor: Int8Array },
    uint16x2: { numComponents: 2, type: 'UNSIGNED_SHORT', normalized: false, dataType: 'unsigned int', byteSize: 4, wgslType: 'vec2<u32>', typedArrayConstructor: Uint16Array },
    uint16x4: { numComponents: 4, type: 'UNSIGNED_SHORT', normalized: false, dataType: 'unsigned int', byteSize: 8, wgslType: 'vec4<u32>', typedArrayConstructor: Uint16Array },
    sint16x2: { numComponents: 2, type: 'SHORT', normalized: false, dataType: 'signed int', byteSize: 4, wgslType: 'vec2<i32>', typedArrayConstructor: Int16Array },
    sint16x4: { numComponents: 4, type: 'SHORT', normalized: false, dataType: 'signed int', byteSize: 8, wgslType: 'vec4<i32>', typedArrayConstructor: Int16Array },
    unorm16x2: { numComponents: 2, type: 'UNSIGNED_SHORT', normalized: true, dataType: 'unsigned normalized', byteSize: 4, wgslType: 'vec2<f32>', typedArrayConstructor: Uint16Array },
    unorm16x4: { numComponents: 4, type: 'UNSIGNED_SHORT', normalized: true, dataType: 'unsigned normalized', byteSize: 8, wgslType: 'vec4<f32>', typedArrayConstructor: Uint16Array },
    snorm16x2: { numComponents: 2, type: 'SHORT', normalized: true, dataType: 'signed normalized', byteSize: 4, wgslType: 'vec2<f32>', typedArrayConstructor: Int16Array },
    snorm16x4: { numComponents: 4, type: 'SHORT', normalized: true, dataType: 'signed normalized', byteSize: 8, wgslType: 'vec4<f32>', typedArrayConstructor: Int16Array },
    float16x2: { numComponents: 2, type: 'HALF_FLOAT', normalized: false, dataType: 'float', byteSize: 4, wgslType: 'vec2<f16>', typedArrayConstructor: Int16Array },
    float16x4: { numComponents: 4, type: 'HALF_FLOAT', normalized: false, dataType: 'float', byteSize: 8, wgslType: 'vec4<f16>', typedArrayConstructor: Int16Array },
    float32: { numComponents: 1, type: 'FLOAT', normalized: false, dataType: 'float', byteSize: 4, wgslType: 'f32', typedArrayConstructor: Float32Array },
    float32x2: { numComponents: 2, type: 'FLOAT', normalized: false, dataType: 'float', byteSize: 8, wgslType: 'vec2<f32>', typedArrayConstructor: Float32Array },
    float32x3: { numComponents: 3, type: 'FLOAT', normalized: false, dataType: 'float', byteSize: 12, wgslType: 'vec3<f32>', typedArrayConstructor: Float32Array },
    float32x4: { numComponents: 4, type: 'FLOAT', normalized: false, dataType: 'float', byteSize: 16, wgslType: 'vec4<f32>', typedArrayConstructor: Float32Array },
    uint32: { numComponents: 1, type: 'UNSIGNED_INT', normalized: false, dataType: 'unsigned int', byteSize: 4, wgslType: 'u32', typedArrayConstructor: Uint32Array },
    uint32x2: { numComponents: 2, type: 'UNSIGNED_INT', normalized: false, dataType: 'unsigned int', byteSize: 8, wgslType: 'vec2<u32>', typedArrayConstructor: Uint32Array },
    uint32x3: { numComponents: 3, type: 'UNSIGNED_INT', normalized: false, dataType: 'unsigned int', byteSize: 12, wgslType: 'vec3<u32>', typedArrayConstructor: Uint32Array },
    uint32x4: { numComponents: 4, type: 'UNSIGNED_INT', normalized: false, dataType: 'unsigned int', byteSize: 16, wgslType: 'vec4<u32>', typedArrayConstructor: Uint32Array },
    sint32: { numComponents: 1, type: 'INT', normalized: false, dataType: 'signed int', byteSize: 4, wgslType: 'i32', typedArrayConstructor: Int32Array },
    sint32x2: { numComponents: 2, type: 'INT', normalized: false, dataType: 'signed int', byteSize: 8, wgslType: 'vec2<i32>', typedArrayConstructor: Int32Array },
    sint32x3: { numComponents: 3, type: 'INT', normalized: false, dataType: 'signed int', byteSize: 12, wgslType: 'vec3<i32>', typedArrayConstructor: Int32Array },
    sint32x4: { numComponents: 4, type: 'INT', normalized: false, dataType: 'signed int', byteSize: 16, wgslType: 'vec4<i32>', typedArrayConstructor: Int32Array },
    'unorm10-10-10-2': { numComponents: 4, type: 'UNSIGNED_INT_2_10_10_10_REV', normalized: true, dataType: 'unsigned normalized', byteSize: 4, wgslType: 'vec4<f32>', typedArrayConstructor: Int32Array },
};

/**
 * 有类型数组构造器。
 */
export type TypedArrayConstructor = Int8ArrayConstructor | Uint8ArrayConstructor | Int16ArrayConstructor | Uint16ArrayConstructor | Int32ArrayConstructor | Uint32ArrayConstructor | Float32ArrayConstructor;

/**
 * GPU顶点数据类型
 */
export type VertexDataType =
    | 'unsigned int'
    | 'signed int'
    | 'unsigned normalized'
    | 'signed normalized'
    | 'float'
    ;

/**
 * 顶点数据在WGSL中的类型。
 */
export type WGSLVertexType =
    | 'vec2<u32>'
    | 'vec4<u32>'
    | 'vec2<i32>'
    | 'vec4<i32>'
    | 'vec2<f32>'
    | 'vec4<f32>'
    | 'vec2<f16>'
    | 'vec4<f16>'
    | 'f32'
    | 'vec3<f32>'
    | 'u32'
    | 'vec3<u32>'
    | 'i32'
    | 'vec3<i32>'
    ;

/**
 * 顶点属性数据类型。
 */
export type GLVertexAttributeTypes = 'FLOAT' | 'BYTE' | 'SHORT' | 'UNSIGNED_BYTE' | 'UNSIGNED_SHORT'
    | 'HALF_FLOAT' | 'INT' | 'UNSIGNED_INT' | 'INT_2_10_10_10_REV' | 'UNSIGNED_INT_2_10_10_10_REV';

/**
 * 顶点属性格式信息
 */
export type VertexAttributeFormatInfo = {

    /**
     * 部件数量。
     */
    numComponents: 1 | 2 | 3 | 4,

    /**
     * 属性缓冲数据类型
     *
     * 默认从Buffer数据中获取，如果未取到则默认为 "FLOAT" 。
     */
    type: GLVertexAttributeTypes,

    /**
     * 数据类型。
     */
    dataType: VertexDataType,

    /**
     * 所占字节尺寸。
     */
    byteSize: 2 | 4 | 8 | 12 | 16,

    /**
     * 在着色器中对应类型。
     */
    wgslType: WGSLVertexType,

    /**
     * 对应类型数组构造器。
     */
    typedArrayConstructor: TypedArrayConstructor,

    /**
     * 是否标准化。
     */
    normalized: boolean;
};
