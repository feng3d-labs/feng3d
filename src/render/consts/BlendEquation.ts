module feng3d
{

    /**
     * 混合方法
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
        FUNC_REVERSE_SUBTRACT
    }

    /**
     * 根据枚举混合因子获取真实值
     * @param blendEquation 混合因子
     */
    export function getBlendEquationValue(blendEquation: BlendEquation)
    {
        if (!blendEquationMap)
        {
            blendEquationMap = {};
            blendEquationMap[BlendEquation.FUNC_ADD] = GL.FUNC_ADD;
            blendEquationMap[BlendEquation.FUNC_SUBTRACT] = GL.FUNC_SUBTRACT;
            blendEquationMap[BlendEquation.FUNC_REVERSE_SUBTRACT] = GL.FUNC_REVERSE_SUBTRACT;
        }
        return blendEquationMap[blendEquation];
    }
    var blendEquationMap: { [key: number]: number };
}