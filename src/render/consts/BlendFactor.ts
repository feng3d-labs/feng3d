module feng3d
{

    /**
     * 混合因子（R分量系数，G分量系数，B分量系数）
     */
    export class BlendFactor
    {
        /**
         * 0.0  0.0 0.0
         */
        public static ZERO: number;
        /**
         * 1.0  1.0 1.0
         */
        public static ONE: number;
        /**
         * Rs   Gs  Bs
         */
        public static SRC_COLOR: number;
        /**
         * 1-Rs   1-Gs  1-Bs
         */
        public static ONE_MINUS_SRC_COLOR: number;
        /**
         * Rd   Gd  Bd
         */
        public static DST_COLOR: number;
        /**
         * 1-Rd   1-Gd  1-Bd
         */
        public static ONE_MINUS_DST_COLOR: number;
        /**
         * As   As  As
         */
        public static SRC_ALPHA: number;
        /**
         * 1-As   1-As  1-As
         */
        public static ONE_MINUS_SRC_ALPHA: number;
        /**
         * Ad   Ad  Ad
         */
        public static DST_ALPHA: number;
        /**
         * 1-Ad   1-Ad  1-Ad
         */
        public static ONE_MINUS_DST_ALPHA: number;
        /**
         * min(As-Ad)   min(As-Ad)  min(As-Ad)
         */
        public static SRC_ALPHA_SATURATE: number;
    }

    (initFunctions || (initFunctions = [])).push(() =>
    {
        BlendFactor.ZERO = GL.ZERO;
        BlendFactor.ONE = GL.ONE;
        BlendFactor.SRC_COLOR = GL.SRC_COLOR;
        BlendFactor.ONE_MINUS_SRC_COLOR = GL.ONE_MINUS_SRC_COLOR;
        BlendFactor.DST_COLOR = GL.DST_COLOR;
        BlendFactor.ONE_MINUS_DST_COLOR = GL.ONE_MINUS_DST_COLOR;
        BlendFactor.SRC_ALPHA = GL.SRC_ALPHA;
        BlendFactor.ONE_MINUS_SRC_ALPHA = GL.ONE_MINUS_SRC_ALPHA;
        BlendFactor.DST_ALPHA = GL.DST_ALPHA;
        BlendFactor.ONE_MINUS_DST_ALPHA = GL.ONE_MINUS_DST_ALPHA;
        BlendFactor.SRC_ALPHA_SATURATE = GL.SRC_ALPHA_SATURATE;
    });
}