namespace feng3d
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
        SRC_ALPHA_SATURATE,
    }

    enums.getBlendFactorValue = (gl: GL) =>
    {
        return (blendFactor: BlendFactor) =>
        {
            var value = gl.ZERO;

            switch (blendFactor)
            {
                case BlendFactor.ZERO:
                    value = gl.ZERO;
                    break;
                case BlendFactor.ONE:
                    value = gl.ONE;
                    break;
                case BlendFactor.SRC_COLOR:
                    value = gl.SRC_COLOR;
                    break;
                case BlendFactor.ONE_MINUS_SRC_COLOR:
                    value = gl.ONE_MINUS_SRC_COLOR;
                    break;
                case BlendFactor.DST_COLOR:
                    value = gl.DST_COLOR;
                    break;
                case BlendFactor.ONE_MINUS_DST_COLOR:
                    value = gl.ONE_MINUS_DST_COLOR;
                    break;
                case BlendFactor.SRC_ALPHA:
                    value = gl.SRC_ALPHA;
                    break;
                case BlendFactor.ONE_MINUS_SRC_ALPHA:
                    value = gl.ONE_MINUS_SRC_ALPHA;
                    break;
                case BlendFactor.DST_ALPHA:
                    value = gl.DST_ALPHA;
                    break;
                case BlendFactor.ONE_MINUS_DST_ALPHA:
                    value = gl.ONE_MINUS_DST_ALPHA;
                    break;
                case BlendFactor.SRC_ALPHA_SATURATE:
                    value = gl.SRC_ALPHA_SATURATE;
                    break;
                default:
                    error(`无法处理枚举 ${BlendFactor} ${blendFactor}`);
                    break;
            }

            return value;
        }
    }
}