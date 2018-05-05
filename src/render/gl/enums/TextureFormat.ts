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
        ALPHA = "ALPHA",
        /**
         *  Discards the alpha components and reads the red, green and blue components.
         */
        RGB = "RGB",
        /**
         * Red, green, blue and alpha components are read from the color buffer.
         */
        RGBA = "RGBA",
        /**
         * Each color component is a luminance component, alpha is 1.0.
         */
        LUMINANCE = "LUMINANCE",
        /**
         * Each component is a luminance/alpha component.
         */
        LUMINANCE_ALPHA = "LUMINANCE_ALPHA",

        // /**
        //  * When using the WEBGL_depth_texture extension:
        //  */
        // DEPTH_COMPONENT = "DEPTH_COMPONENT",
        // /**
        //  * When using the WEBGL_depth_texture extension:
        //  */
        // DEPTH_STENCIL = "DEPTH_STENCIL",
        // /**
        //  * When using the EXT_sRGB extension:
        //  */
        // SRGB_EXT = "SRGB_EXT",
        // /**
        //  * When using the EXT_sRGB extension:
        //  */
        // SRGB_ALPHA_EXT = "SRGB_ALPHA_EXT",
        // /**
        //  * using a WebGL 2 context
        //  */
        // R8 = "R8",
        // /**
        //  * using a WebGL 2 context
        //  */
        // R16F = "R16F",
        // /**
        //  * using a WebGL 2 context
        //  */
        // R32F = "R32F",
        // /**
        //  * using a WebGL 2 context
        //  */
        // R8UI = "R8UI",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RG8 = "RG8",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RG16F = "RG16F",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RG32F = "RG32F",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RG8UI = "RG8UI",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RG16UI = "RG16UI",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RG32UI = "RG32UI",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGB8 = "RGB8",
        // /**
        //  * using a WebGL 2 context
        //  */
        // SRGB8 = "SRGB8",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGB565 = "RGB565",
        // /**
        //  * using a WebGL 2 context
        //  */
        // R11F_G11F_B10F = "R11F_G11F_B10F",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGB9_E5 = "RGB9_E5",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGB16F = "RGB16F",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGB32F = "RGB32F",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGB8UI = "RGB8UI",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGBA8 = "RGBA8",
        // /**
        //  * using a WebGL 2 context
        //  */
        // // SRGB8_APLHA8,
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGB5_A1 = "RGB5_A1",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGB10_A2 = "RGB10_A2",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGBA4 = "RGBA4",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGBA16F = "RGBA16F",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGBA32F = "RGBA32F",
        // /**
        //  * using a WebGL 2 context
        //  */
        // RGBA8UI = "RGBA8UI",
    }
}