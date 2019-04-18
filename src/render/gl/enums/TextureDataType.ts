namespace feng3d
{
    /**
     * 纹理数据类型
     * A GLenum specifying the data type of the texel data
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
     */
    export enum TextureDataType
    {
        /**
         * 8 bits per channel for gl.RGBA
         */
        UNSIGNED_BYTE = "UNSIGNED_BYTE",
        /**
         * 5 red bits, 6 green bits, 5 blue bits.
         */
        UNSIGNED_SHORT_5_6_5 = "UNSIGNED_SHORT_5_6_5",
        /**
         * 4 red bits, 4 green bits, 4 blue bits, 4 alpha bits.
         */
        UNSIGNED_SHORT_4_4_4_4 = "UNSIGNED_SHORT_4_4_4_4",
        /**
         * 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit.
         */
        UNSIGNED_SHORT_5_5_5_1 = "UNSIGNED_SHORT_5_5_5_1",
        // /**
        //  * When using the WEBGL_depth_texture extension:
        //  */
        // UNSIGNED_SHORT = "UNSIGNED_SHORT",
        // /**
        //  * When using the WEBGL_depth_texture extension:
        //  */
        // UNSIGNED_INT = "UNSIGNED_INT",
        // /**
        //  * When using the WEBGL_depth_texture extension:
        //  *  (constant provided by the extension)
        //  */
        // UNSIGNED_INT_24_8_WEBGL = "UNSIGNED_INT_24_8_WEBGL",
        // //When using the OES_texture_half_float extension:
        // /**
        //  * When using the OES_texture_float extension:
        //  */
        // FLOAT = "FLOAT",
        // /**
        //  * When using the OES_texture_half_float extension:
        //  *  (constant provided by the extension)
        //  */
        // HALF_FLOAT_OES = "HALF_FLOAT_OES",
        // // When using a WebGL 2 context, the following values are available additionally:
        // /**
        //  * using a WebGL 2 context
        //  */
        // BYTE = "BYTE",
        // // UNSIGNED_SHORT   // 与上面合并处理
        // /**
        //  * using a WebGL 2 context
        //  */
        // SHORT = "SHORT",
        // // UNSIGNED_INT     // 与上面合并处理
        // /**
        //  * using a WebGL 2 context
        //  */
        // INT = "INT",
        // /**
        //  * using a WebGL 2 context
        //  */
        // HALF_FLOAT = "HALF_FLOAT",
        // // FLOAT               // 与上面合并处理
        // /**
        //  * using a WebGL 2 context
        //  */
        // UNSIGNED_INT_2_10_10_10_REV = "UNSIGNED_INT_2_10_10_10_REV",
        // /**
        //  * using a WebGL 2 context
        //  */
        // UNSIGNED_INT_10F_11F_11F_REV = "UNSIGNED_INT_10F_11F_11F_REV",
        // /**
        //  * using a WebGL 2 context
        //  */
        // UNSIGNED_INT_5_9_9_9_REV = "UNSIGNED_INT_5_9_9_9_REV",
        // /**
        //  * using a WebGL 2 context
        //  */
        // UNSIGNED_INT_24_8 = "UNSIGNED_INT_24_8",
        // /**
        //  * using a WebGL 2 context
        //  *  (pixels must be null)
        //  */
        // FLOAT_32_UNSIGNED_INT_24_8_REV = "FLOAT_32_UNSIGNED_INT_24_8_REV",
    }
}