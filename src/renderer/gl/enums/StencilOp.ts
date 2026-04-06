/**
 * The WebGLRenderingContext.stencilOp() method of the WebGL API sets both the front and back-facing stencil test actions.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOp
 */
export enum StencilOp
{
    /**
     * 保持当前值。
     *
     * Keeps the current value.
     */
    KEEP = 'KEEP',

    /**
     * 设置模板缓冲值为0.
     *
     * Sets the stencil buffer value to 0.
     */
    ZERO = 'ZERO',

    /**
     * 将模板缓冲区的值设置为WebGLRenderingContext.stencilFunc()指定的参考值。
     *
     * Sets the stencil buffer value to the reference value as specified by WebGLRenderingContext.stencilFunc().
     */
    REPLACE = 'REPLACE',

    /**
     * 增加当前模板缓冲区的值。最大到可表示的无符号值的最大值。
     *
     * Increments the current stencil buffer value. Clamps to the maximum representable unsigned value.
     */
    INCR = 'INCR',

    /**
     * 增加当前模板缓冲区的值。当增加最大的可表示无符号值时，将模板缓冲区值包装为零。
     *
     * Increments the current stencil buffer value. Wraps stencil buffer value to zero when incrementing the maximum representable unsigned value.
     */
    INCR_WRAP = 'INCR_WRAP',

    /**
     * 递减当前模板缓冲区的值。最小为0。
     *
     * Decrements the current stencil buffer value. Clamps to 0.
     */
    DECR = 'DECR',

    /**
     * 递减当前模板缓冲区的值。当模板缓冲区值减为0时，将模板缓冲区值包装为可表示的最大无符号值。
     *
     * Decrements the current stencil buffer value. Wraps stencil buffer value to the maximum representable unsigned value when decrementing a stencil buffer value of 0.
     */
    DECR_WRAP = 'DECR_WRAP',

    /**
     * 按位反转当前模板缓冲区值。
     *
     * Inverts the current stencil buffer value bitwise.
     */
    INVERT = 'INVERT',
}
