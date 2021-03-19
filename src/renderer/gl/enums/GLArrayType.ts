namespace feng3d
{
    /**
     * GL 数组数据类型
     * 
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/vertexAttribPointer
     */
    export enum GLArrayType
    {
        /**
         * signed 8-bit integer, with values in [-128, 127]
         */
        BYTE = "BYTE",
        /**
         *  signed 16-bit integer, with values in [-32768, 32767]
         */
        SHORT = "SHORT",
        /**
         * unsigned 8-bit integer, with values in [0, 255]
         */
        UNSIGNED_BYTE = "UNSIGNED_BYTE",
        /**
         * unsigned 16-bit integer, with values in [0, 65535]
         */
        UNSIGNED_SHORT = "UNSIGNED_SHORT",
        /**
         * 32-bit floating point number
         */
        FLOAT = "FLOAT",
        UNSIGNED_INT = "UNSIGNED_INT",
        // /**
        //  * using a WebGL 2 context
        //  * 16-bit floating point number
        //  */
        // HALF_FLOAT = "HALF_FLOAT",
    }
}