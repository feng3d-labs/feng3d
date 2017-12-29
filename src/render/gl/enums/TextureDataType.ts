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
        UNSIGNED_BYTE,
        /**
         * 5 red bits, 6 green bits, 5 blue bits.
         */
        UNSIGNED_SHORT_5_6_5,
        /**
         * 4 red bits, 4 green bits, 4 blue bits, 4 alpha bits.
         */
        UNSIGNED_SHORT_4_4_4_4,
        /**
         * 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit.
         */
        UNSIGNED_SHORT_5_5_5_1,
        /**
         * When using the WEBGL_depth_texture extension:
         */
        UNSIGNED_SHORT,
        /**
         * When using the WEBGL_depth_texture extension:
         */
        UNSIGNED_INT,
        /**
         * When using the WEBGL_depth_texture extension:
         *  (constant provided by the extension)
         */
        UNSIGNED_INT_24_8_WEBGL,
        //When using the OES_texture_half_float extension:
        /**
         * When using the OES_texture_float extension:
         */
        FLOAT,
        /**
         * When using the OES_texture_half_float extension:
         *  (constant provided by the extension)
         */
        HALF_FLOAT_OES,
        // When using a WebGL 2 context, the following values are available additionally:
        /**
         * using a WebGL 2 context
         */
        BYTE,
        // UNSIGNED_SHORT   // 与上面合并处理
        /**
         * using a WebGL 2 context
         */
        SHORT,
        // UNSIGNED_INT     // 与上面合并处理
        /**
         * using a WebGL 2 context
         */
        INT,
        /**
         * using a WebGL 2 context
         */
        HALF_FLOAT,
        // FLOAT               // 与上面合并处理
        /**
         * using a WebGL 2 context
         */
        UNSIGNED_INT_2_10_10_10_REV,
        /**
         * using a WebGL 2 context
         */
        UNSIGNED_INT_10F_11F_11F_REV,
        /**
         * using a WebGL 2 context
         */
        UNSIGNED_INT_5_9_9_9_REV,
        /**
         * using a WebGL 2 context
         */
        UNSIGNED_INT_24_8,
        /**
         * using a WebGL 2 context
         *  (pixels must be null)
         */
        FLOAT_32_UNSIGNED_INT_24_8_REV,
    }

    (enums = enums || {}).getTextureDataTypeValue = (gl: GL) =>
    {
        var gl2: WebGL2RenderingContext = <any>gl;
        return (textureDataType: TextureDataType) =>
        {
            var value = gl.UNSIGNED_BYTE;
            switch (textureDataType)
            {
                case TextureDataType.UNSIGNED_BYTE:
                    value = gl.UNSIGNED_BYTE;
                    break;
                case TextureDataType.UNSIGNED_SHORT_5_6_5:
                    value = gl.UNSIGNED_SHORT_5_6_5;
                    break;
                case TextureDataType.UNSIGNED_SHORT_4_4_4_4:
                    value = gl.UNSIGNED_SHORT_4_4_4_4;
                    break;
                case TextureDataType.UNSIGNED_SHORT_5_5_5_1:
                    value = gl.UNSIGNED_SHORT_5_5_5_1;
                    break;
                case TextureDataType.UNSIGNED_SHORT:
                    assert(!!gl.extensions.webGLDepthTexture || gl.webgl2, `无法处理枚举 ${TextureDataType} ${textureDataType}`)
                    value = gl.UNSIGNED_SHORT;
                    break;
                case TextureDataType.UNSIGNED_INT:
                    assert(!!gl.extensions.webGLDepthTexture || gl.webgl2, `无法处理枚举 ${TextureDataType} ${textureDataType}`)
                    value = gl.UNSIGNED_INT;
                    break;
                case TextureDataType.UNSIGNED_INT_24_8_WEBGL:
                    assert(!!gl.extensions.webGLDepthTexture, `无法处理枚举 ${TextureDataType} ${textureDataType}`)
                    value = gl.extensions.webGLDepthTexture.UNSIGNED_INT_24_8_WEBGL;
                    break;
                case TextureDataType.FLOAT:
                    assert(!!gl.extensions.oESTextureFloat || gl.webgl2, `无法处理枚举 ${TextureDataType} ${textureDataType}`)
                    value = gl.FLOAT;
                    break;
                case TextureDataType.HALF_FLOAT_OES:
                    assert(!!gl.extensions.oESTextureHalfFloat, `无法处理枚举 ${TextureDataType} ${textureDataType}`)
                    value = gl.extensions.oESTextureHalfFloat.HALF_FLOAT_OES;
                    break;
                case TextureDataType.BYTE:
                    assert(gl.webgl2, `无法处理枚举 ${TextureDataType} ${textureDataType}`)
                    value = gl.BYTE;
                    break;
                case TextureDataType.SHORT:
                    assert(gl.webgl2, `无法处理枚举 ${TextureDataType} ${textureDataType}`)
                    value = gl.SHORT;
                    break;
                case TextureDataType.INT:
                    assert(gl.webgl2, `无法处理枚举 ${TextureDataType} ${textureDataType}`)
                    value = gl.INT;
                    break;
                case TextureDataType.HALF_FLOAT:
                    assert(gl.webgl2, `无法处理枚举 ${TextureDataType} ${textureDataType}`)
                    value = gl2.HALF_FLOAT;
                    break;
                case TextureDataType.UNSIGNED_INT_2_10_10_10_REV:
                    assert(gl.webgl2, `无法处理枚举 ${TextureDataType} ${textureDataType}`)
                    value = gl2.UNSIGNED_INT_2_10_10_10_REV;
                    break;
                case TextureDataType.UNSIGNED_INT_10F_11F_11F_REV:
                    assert(gl.webgl2, `无法处理枚举 ${TextureDataType} ${textureDataType}`)
                    value = gl2.UNSIGNED_INT_10F_11F_11F_REV;
                    break;
                case TextureDataType.UNSIGNED_INT_5_9_9_9_REV:
                    assert(gl.webgl2, `无法处理枚举 ${TextureDataType} ${textureDataType}`)
                    value = gl2.UNSIGNED_INT_5_9_9_9_REV;
                    break;
                case TextureDataType.UNSIGNED_INT_24_8:
                    assert(gl.webgl2, `无法处理枚举 ${TextureDataType} ${textureDataType}`)
                    value = gl2.UNSIGNED_INT_24_8;
                    break;
                case TextureDataType.FLOAT_32_UNSIGNED_INT_24_8_REV:
                    assert(gl.webgl2, `无法处理枚举 ${TextureDataType} ${textureDataType}`)
                    value = gl2.FLOAT_32_UNSIGNED_INT_24_8_REV;
                    break;
                default:
                    error(`无法处理枚举 ${TextureDataType} ${textureDataType}`);
                    break;
            }
            return value;
        }
    }
}