namespace feng3d
{
    /**
     * 纹理颜色格式
     * A GLint specifying the color components in the texture
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
     */
    export enum TextureFormat
    {
        /**
         * Discards the red, green and blue components and reads the alpha component.
         */
        ALPHA,
        /**
         *  Discards the alpha components and reads the red, green and blue components.
         */
        RGB,
        /**
         * Red, green, blue and alpha components are read from the color buffer.
         */
        RGBA,
        /**
         * Each color component is a luminance component, alpha is 1.0.
         */
        LUMINANCE,
        /**
         * Each component is a luminance/alpha component.
         */
        LUMINANCE_ALPHA,

        /**
         * When using the WEBGL_depth_texture extension:
         */
        DEPTH_COMPONENT,
        /**
         * When using the WEBGL_depth_texture extension:
         */
        DEPTH_STENCIL,
        /**
         * When using the EXT_sRGB extension:
         */
        SRGB_EXT,
        /**
         * When using the EXT_sRGB extension:
         */
        SRGB_ALPHA_EXT,
        /**
         * using a WebGL 2 context
         */
        R8,
        /**
         * using a WebGL 2 context
         */
        R16F,
        /**
         * using a WebGL 2 context
         */
        R32F,
        /**
         * using a WebGL 2 context
         */
        R8UI,
        /**
         * using a WebGL 2 context
         */
        RG8,
        /**
         * using a WebGL 2 context
         */
        RG16F,
        /**
         * using a WebGL 2 context
         */
        RG32F,
        /**
         * using a WebGL 2 context
         */
        RG8UI,
        /**
         * using a WebGL 2 context
         */
        RG16UI,
        /**
         * using a WebGL 2 context
         */
        RG32UI,
        /**
         * using a WebGL 2 context
         */
        RGB8,
        /**
         * using a WebGL 2 context
         */
        SRGB8,
        /**
         * using a WebGL 2 context
         */
        RGB565,
        /**
         * using a WebGL 2 context
         */
        R11F_G11F_B10F,
        /**
         * using a WebGL 2 context
         */
        RGB9_E5,
        /**
         * using a WebGL 2 context
         */
        RGB16F,
        /**
         * using a WebGL 2 context
         */
        RGB32F,
        /**
         * using a WebGL 2 context
         */
        RGB8UI,
        /**
         * using a WebGL 2 context
         */
        RGBA8,
        /**
         * using a WebGL 2 context
         */
        // SRGB8_APLHA8,
        /**
         * using a WebGL 2 context
         */
        RGB5_A1,
        /**
         * using a WebGL 2 context
         */
        RGB10_A2,
        /**
         * using a WebGL 2 context
         */
        RGBA4,
        /**
         * using a WebGL 2 context
         */
        RGBA16F,
        /**
         * using a WebGL 2 context
         */
        RGBA32F,
        /**
         * using a WebGL 2 context
         */
        RGBA8UI,
    }

    (enums = enums || {}).getTextureFormatValue = (gl: GL) =>
    {
        return (textureFormat: TextureFormat) =>
        {
            var gl2: WebGL2RenderingContext = <any>gl;
            var value = gl.RGB;
            switch (textureFormat)
            {
                case TextureFormat.ALPHA:
                    value = gl.ALPHA;
                    break;
                case TextureFormat.RGB:
                    value = gl.RGB;
                    break;
                case TextureFormat.RGBA:
                    value = gl.RGBA;
                    break;
                case TextureFormat.LUMINANCE:
                    value = gl.LUMINANCE;
                    break;
                case TextureFormat.LUMINANCE_ALPHA:
                    value = gl.LUMINANCE_ALPHA;
                    break;
                case TextureFormat.DEPTH_COMPONENT:
                    assert(!!gl.extensions.webGLDepthTexture, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl.DEPTH_COMPONENT;
                    break;
                case TextureFormat.DEPTH_STENCIL:
                    assert(!!gl.extensions.webGLDepthTexture, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl.DEPTH_STENCIL;
                    break;
                case TextureFormat.SRGB_EXT:
                    assert(!!gl.extensions.eXTsRGB, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl.extensions.eXTsRGB.SRGB_EXT;
                    break;
                case TextureFormat.SRGB_ALPHA_EXT:
                    assert(!!gl.extensions.eXTsRGB, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl.extensions.eXTsRGB.SRGB_ALPHA_EXT;
                    break;
                case TextureFormat.R8:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.R8;
                    break;
                case TextureFormat.R16F:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.R16F;
                    break;
                case TextureFormat.R32F:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.R32F;
                    break;
                case TextureFormat.R8UI:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.R8UI;
                    break;
                case TextureFormat.RG8:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RG8;
                    break;
                case TextureFormat.RG16F:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RG16F;
                    break;
                case TextureFormat.RG32F:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RG32F;
                    break;
                case TextureFormat.RG8UI:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RG8UI;
                    break;
                case TextureFormat.RG16UI:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RG16UI;
                    break;
                case TextureFormat.RG32UI:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RG32UI;
                    break;
                case TextureFormat.RGB8:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RGB8;
                    break;
                case TextureFormat.SRGB8:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.SRGB8;
                    break;
                case TextureFormat.RGB565:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RGB565;
                    break;
                case TextureFormat.R11F_G11F_B10F:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.R11F_G11F_B10F;
                    break;
                case TextureFormat.RGB9_E5:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RGB9_E5;
                    break;
                case TextureFormat.RGB16F:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RGB16F;
                    break;
                case TextureFormat.RGB32F:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RGB32F;
                    break;
                case TextureFormat.RGB8UI:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RGB8UI;
                    break;
                case TextureFormat.RGBA8:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RGBA8;
                    break;
                // case TextureFormat.SRGB8_APLHA8:
                //     assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                //     value = gl2.SRGB8_APLHA8;
                //     break;
                case TextureFormat.RGB5_A1:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RGB5_A1;
                    break;
                case TextureFormat.RGB10_A2:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RGB10_A2;
                    break;
                case TextureFormat.RGBA4:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RGBA4;
                    break;
                case TextureFormat.RGBA16F:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RGBA16F;
                    break;
                case TextureFormat.RGBA32F:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RGBA32F;
                    break;
                case TextureFormat.RGBA8UI:
                    assert(gl.webgl2, `不支持 ${TextureFormat} ${textureFormat} `);
                    value = gl2.RGBA8UI;
                    break;
                default:
                    error(`无法处理枚举 ${TextureFormat} ${textureFormat}`);
                    break;
            }
            return value;
        }
    }
}