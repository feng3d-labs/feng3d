module feng3d
{

    /**
     * 混合方法
     */
    export class BlendEquation
    {
        /**
         *  source + destination
         */
        public static FUNC_ADD: number;
        /**
         * source - destination
         */
        public static FUNC_SUBTRACT: number;
        /**
         * destination - source
         */
        public static FUNC_REVERSE_SUBTRACT: number;
    }

    (initFunctions || (initFunctions = [])).push(() =>
    {
        BlendEquation.FUNC_ADD = GL.FUNC_ADD;
        BlendEquation.FUNC_SUBTRACT = GL.FUNC_SUBTRACT;
        BlendEquation.FUNC_REVERSE_SUBTRACT = GL.FUNC_REVERSE_SUBTRACT;
    });
}