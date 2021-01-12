namespace feng3d
{
    /**
     * The WebGLRenderingContext.stencilOp() method of the WebGL API sets both the front and back-facing stencil test actions.
     * 
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/stencilOp
     */
    export enum StencilOp
    {
        /**
         * Keeps the current value.
         */
        KEEP = "KEEP",

        /**
         * Sets the stencil buffer value to 0.
         */
        ZERO = "ZERO",

        /**
         * Sets the stencil buffer value to the reference value as specified by WebGLRenderingContext.stencilFunc().
         */
        REPLACE = "REPLACE",

        /**
         * Increments the current stencil buffer value. Clamps to the maximum representable unsigned value.
         */
        INCR = "INCR",

        /**
         * Increments the current stencil buffer value. Wraps stencil buffer value to zero when incrementing the maximum representable unsigned value.
         */
        INCR_WRAP = "INCR_WRAP",

        /**
         * Decrements the current stencil buffer value. Clamps to 0.
         */
        DECR = "DECR",

        /**
         * Decrements the current stencil buffer value. Wraps stencil buffer value to the maximum representable unsigned value when decrementing a stencil buffer value of 0.
         */
        DECR_WRAP = "DECR_WRAP",

        /**
         * Inverts the current stencil buffer value bitwise.
         */
        INVERT = "INVERT",
    }
}