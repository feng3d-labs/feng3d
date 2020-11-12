namespace feng3d
{
    /**
     * 决定给WebGLRenderingContext.colorMask何种参数。
     */
    export enum ColorMask
    {
        NONE = 0,
        R = 1,
        G = 2,
        B = 4,
        A = 8,
        RGB = R | G | B,
        /**
         * 
         */
        RGBA = R | G | B | A,
    }
}