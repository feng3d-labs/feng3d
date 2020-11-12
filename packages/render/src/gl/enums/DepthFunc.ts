namespace feng3d
{
    /**
     * 深度检测方法枚举
     * A GLenum specifying the depth comparison function, which sets the conditions under which the pixel will be drawn. The default value is gl.LESS. 
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc
     */
    export enum DepthFunc
    {
        /**
         * (never pass)
         */
        NEVER = "NEVER",
        /**
         *  (pass if the incoming value is less than the depth buffer value)
         */
        LESS = "LESS",
        /**
         *  (pass if the incoming value equals the the depth buffer value)
         */
        EQUAL = "EQUAL",
        /**
         *  (pass if the incoming value is less than or equal to the depth buffer value)
         */
        LEQUAL = "LEQUAL",
        /**
         * (pass if the incoming value is greater than the depth buffer value)
         */
        GREATER = "GREATER",
        /**
         * (pass if the incoming value is not equal to the depth buffer value)
         */
        NOTEQUAL = "NOTEQUAL",
        /**
         * (pass if the incoming value is greater than or equal to the depth buffer value)
         */
        GEQUAL = "GEQUAL",
        /**
         *  (always pass)
         */
        ALWAYS = "ALWAYS",
    }
}