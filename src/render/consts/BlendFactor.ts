module feng3d
{

    /**
     * 混合因子（R分量系数，G分量系数，B分量系数）
     */
    export enum BlendFactor
    {
        /**
         * 0.0  0.0 0.0
         */
        ZERO,
        /**
         * 1.0  1.0 1.0
         */
        ONE,
        /**
         * Rs   Gs  Bs
         */
        SRC_COLOR,
        /**
         * 1-Rs   1-Gs  1-Bs
         */
        ONE_MINUS_SRC_COLOR,
        /**
         * Rd   Gd  Bd
         */
        DST_COLOR,
        /**
         * 1-Rd   1-Gd  1-Bd
         */
        ONE_MINUS_DST_COLOR,
        /**
         * As   As  As
         */
        SRC_ALPHA,
        /**
         * 1-As   1-As  1-As
         */
        ONE_MINUS_SRC_ALPHA,
        /**
         * Ad   Ad  Ad
         */
        DST_ALPHA,
        /**
         * 1-Ad   1-Ad  1-Ad
         */
        ONE_MINUS_DST_ALPHA,
        /**
         * min(As-Ad)   min(As-Ad)  min(As-Ad)
         */
        SRC_ALPHA_SATURATE
    }

    /**
     * 根据枚举混合因子获取真实值
     * @param blendFactor 混合因子
     */
    export function getBlendFactorValue(blendFactor: BlendFactor)
    {
        if (!blendFactorMap)
        {
            blendFactorMap = {};
            blendFactorMap[BlendFactor.ZERO] = GL.ZERO;
            blendFactorMap[BlendFactor.ONE] = GL.ONE;
            blendFactorMap[BlendFactor.SRC_COLOR] = GL.SRC_COLOR;
            blendFactorMap[BlendFactor.ONE_MINUS_SRC_COLOR] = GL.ONE_MINUS_SRC_COLOR;
            blendFactorMap[BlendFactor.DST_COLOR] = GL.DST_COLOR;
            blendFactorMap[BlendFactor.ONE_MINUS_DST_COLOR] = GL.ONE_MINUS_DST_COLOR;
            blendFactorMap[BlendFactor.SRC_ALPHA] = GL.SRC_ALPHA;
            blendFactorMap[BlendFactor.ONE_MINUS_SRC_ALPHA] = GL.ONE_MINUS_SRC_ALPHA;
            blendFactorMap[BlendFactor.DST_ALPHA] = GL.DST_ALPHA;
            blendFactorMap[BlendFactor.ONE_MINUS_DST_ALPHA] = GL.ONE_MINUS_DST_ALPHA;
            blendFactorMap[BlendFactor.SRC_ALPHA_SATURATE] = GL.SRC_ALPHA_SATURATE;
        }
        return blendFactorMap[blendFactor];
    }
    var blendFactorMap: { [key: number]: number };
}