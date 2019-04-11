namespace feng3d
{
    /**
     * 混合方法
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/blendEquation
     */
    export enum BlendEquation
    {
        /**
         *  source + destination
         */
        FUNC_ADD = "FUNC_ADD",
        /**
         * source - destination
         */
        FUNC_SUBTRACT = "FUNC_SUBTRACT",
        /**
         * destination - source
         */
        FUNC_REVERSE_SUBTRACT = "FUNC_REVERSE_SUBTRACT",
        // /**
        //  * When using the EXT_blend_minmax extension:
        //  * Minimum of source and destination
        //  */
        // MIN_EXT = "MIN_EXT",
        // /**
        //  * When using the EXT_blend_minmax extension:
        //  * Maximum of source and destination.
        //  */
        // MAX_EXT = "MAX_EXT",
        // /**
        //  * using a WebGL 2 context
        //  * Minimum of source and destination
        //  */
        // MIN = "MIN",
        // /**
        //  * using a WebGL 2 context
        //  * Maximum of source and destination.
        //  */
        // MAX = "MAX",
    }
}