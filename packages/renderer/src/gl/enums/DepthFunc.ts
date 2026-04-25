/**
 * 指定深度比较函数的枚举，该函数设置绘制像素的条件，默认 LESS，如果传入值小于深度缓冲区值则通过。
 *
 * A GLenum specifying the depth comparison function, which sets the conditions under which the pixel will be drawn. The default value is gl.LESS.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc
 */
export enum DepthFunc
{
    /**
     * 总是不通过。
     *
     * never pass.
     */
    NEVER = 'NEVER',

    /**
     * 如果传入值小于深度缓冲区值则通过。
     *
     * pass if the incoming value is less than the depth buffer value.
     */
    LESS = 'LESS',

    /**
     * 如果传入值等于深度缓冲区值则通过。
     *
     * pass if the incoming value equals the the depth buffer value.
     */
    EQUAL = 'EQUAL',

    /**
     * 如果传入值小于或等于深度缓冲区值则通过。
     *
     * pass if the incoming value is less than or equal to the depth buffer value.
     */
    LEQUAL = 'LEQUAL',

    /**
     * 如果传入值大于深度缓冲区值则通过。。
     *
     * pass if the incoming value is greater than the depth buffer value.
     */
    GREATER = 'GREATER',

    /**
     * 如果传入值不等于深度缓冲区值则通过。
     *
     * pass if the incoming value is not equal to the depth buffer value.
     */
    NOTEQUAL = 'NOTEQUAL',

    /**
     * 如果传入值大于或等于深度缓冲区值则通过。
     *
     * pass if the incoming value is greater than or equal to the depth buffer value.
     */
    GEQUAL = 'GEQUAL',

    /**
     * 总是通过。
     *
     * always pass.
     */
    ALWAYS = 'ALWAYS',
}
