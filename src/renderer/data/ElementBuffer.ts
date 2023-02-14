import { BufferUsage } from '../gl/WebGLEnums';

/**
 * 元素缓冲数据类型
 */
export type ElementBufferSourceTypes = number[] | Uint16Array | Uint32Array | Uint8Array;

/**
 * 元素缓冲数据类型。
 *
 * A GLenum specifying the type of the values in the element array buffer. Possible values are:
 *
 * * gl.UNSIGNED_BYTE
 * * gl.UNSIGNED_SHORT
 *
 * When using the OES_element_index_uint extension:
 *
 * * gl.UNSIGNED_INT
 *
 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/drawElements
 */
export type DrawElementType = 'UNSIGNED_BYTE' | 'UNSIGNED_SHORT' | 'UNSIGNED_INT';

/**
 * WebGL元素缓冲，顶点索引缓冲。
 *
 * 使用 gl.ELEMENT_ARRAY_BUFFER 进行绑定数据。
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindBuffer
 *
 */
export interface ElementBuffer
{
    /**
     * 数据
     */
    array: ElementBufferSourceTypes;

    /**
     * A GLenum specifying the intended usage pattern of the data store for optimization purposes.
     *
     * 为优化目的指定数据存储的预期使用模式的GLenum。
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData
     */
    usage?: BufferUsage;

    /**
     * 元素缓冲数据类型，默认为`UNSIGNED_SHORT`。
     *
     * @see https://developer.mozilla.org/zh-CN/docs/Web/API/WebGLRenderingContext/drawElements
     */
    type?: DrawElementType;

    /**
     * 版本号，用于标记是否变化。
     */
    version?: number;
}
