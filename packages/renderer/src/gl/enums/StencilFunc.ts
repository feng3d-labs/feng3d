/**
 * A GLenum specifying the test function. The default function is gl.ALWAYS.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilFunc
 */
export enum StencilFunc
{
    /**
     * 总是不通过。
     *
     * Never pass.
     */
    NEVER = 'NEVER',

    /**
     * 如果 (ref & mask) <  (stencil & mask) 则通过。
     *
     * Pass if (ref & mask) <  (stencil & mask).
     */
    LESS = 'LESS',

    /**
     * 如果 (ref & mask) = (stencil & mask) 则通过。
     *
     * Pass if (ref & mask) = (stencil & mask).
     */
    EQUAL = 'EQUAL',

    /**
     * 如果 (ref & mask) <= (stencil & mask) 则通过。
     *
     * Pass if (ref & mask) <= (stencil & mask).
     */
    LEQUAL = 'LEQUAL',

    /**
     * 如果 (ref & mask) > (stencil & mask) 则通过。
     *
     * Pass if (ref & mask) > (stencil & mask).
     */
    GREATER = 'GREATER',

    /**
     * 如果 (ref & mask) != (stencil & mask) 则通过。
     *
     * Pass if (ref & mask) != (stencil & mask).
     */
    NOTEQUAL = 'NOTEQUAL',

    /**
     * 如果 (ref & mask) >= (stencil & mask) 则通过。
     *
     * Pass if (ref & mask) >= (stencil & mask).
     */
    GEQUAL = 'GEQUAL',

    /**
     * 总是通过。
     *
     * Always pass.
     */
    ALWAYS = 'ALWAYS',
}
