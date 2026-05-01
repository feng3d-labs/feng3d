/**
 * 混合方法
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
 */
export enum BlendEquation
{
    /**
     * 源 + 目标
     *
     *  source + destination
     */
    FUNC_ADD = 'FUNC_ADD',

    /**
     * 源 - 目标
     *
     * source - destination
     */
    FUNC_SUBTRACT = 'FUNC_SUBTRACT',

    /**
     * 目标 - 源
     *
     * destination - source
     */
    FUNC_REVERSE_SUBTRACT = 'FUNC_REVERSE_SUBTRACT',

    /**
     * 源与目标的最小值，当开启 EXT_blend_minmax 扩展时生效。
     *
     * When using the EXT_blend_minmax extension:
     * Minimum of source and destination
     */
    MIN_EXT = 'MIN_EXT',

    /**
     * 源与目标的最大值，当开启 EXT_blend_minmax 扩展时生效。
     *
     * When using the EXT_blend_minmax extension:
     * Maximum of source and destination.
     */
    MAX_EXT = 'MAX_EXT',

    /**
     * 源与目标的最小值，在 WebGL 2 中可使用。
     *
     * using a WebGL 2 context
     * Minimum of source and destination
     */
    MIN = 'MIN',

    /**
     * 源与目标的最大值，在 WebGL 2 中可使用。
     *
     * using a WebGL 2 context
     * Maximum of source and destination.
     */
    MAX = 'MAX',
}
