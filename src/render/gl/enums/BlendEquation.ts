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
        FUNC_ADD,
        /**
         * source - destination
         */
        FUNC_SUBTRACT,
        /**
         * destination - source
         */
        FUNC_REVERSE_SUBTRACT,
        /**
         * When using the EXT_blend_minmax extension:
         * Minimum of source and destination
         */
        MIN_EXT,
        /**
         * When using the EXT_blend_minmax extension:
         * Maximum of source and destination.
         */
        MAX_EXT,
        /**
         * using a WebGL 2 context
         * Minimum of source and destination
         */
        MIN,
        /**
         * using a WebGL 2 context
         * Maximum of source and destination.
         */
        MAX,
    }

    (enums = enums || {}).getBlendEquationValue = (gl: GL) =>
    {
        return (blendEquation: BlendEquation) =>
        {
            var value = gl.FUNC_ADD;
            switch (blendEquation)
            {
                case BlendEquation.FUNC_ADD:
                    value = gl.FUNC_ADD;
                    break;
                case BlendEquation.FUNC_SUBTRACT:
                    value = gl.FUNC_SUBTRACT;
                    break;
                case BlendEquation.FUNC_REVERSE_SUBTRACT:
                    value = gl.FUNC_REVERSE_SUBTRACT;
                    break;
                default:
                    error(`无法处理枚举 ${BlendEquation} ${blendEquation}`);
            }
            return value;
        }
    }
}