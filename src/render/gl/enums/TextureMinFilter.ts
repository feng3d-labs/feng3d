namespace feng3d
{
    /**
     * 纹理缩小过滤器
     * Texture minification filter
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    export enum TextureMinFilter
    {
        LINEAR,
        NEAREST,
        NEAREST_MIPMAP_NEAREST,
        LINEAR_MIPMAP_NEAREST,
        /**
         *  (default value)
         */
        NEAREST_MIPMAP_LINEAR,
        LINEAR_MIPMAP_LINEAR,
    }

    (enums = enums || {}).getTextureMinFilterValue = (gl: GL) =>
    {
        return (textureMinFilter: TextureMinFilter) =>
        {
            var value = gl.NEAREST_MIPMAP_LINEAR;

            switch (textureMinFilter)
            {
                case TextureMinFilter.LINEAR:
                    value = gl.LINEAR;
                    break;
                case TextureMinFilter.NEAREST:
                    value = gl.NEAREST;
                    break;
                case TextureMinFilter.NEAREST_MIPMAP_NEAREST:
                    value = gl.NEAREST_MIPMAP_NEAREST;
                    break;
                case TextureMinFilter.LINEAR_MIPMAP_NEAREST:
                    value = gl.LINEAR_MIPMAP_NEAREST;
                    break;
                case TextureMinFilter.NEAREST_MIPMAP_LINEAR:
                    value = gl.NEAREST_MIPMAP_LINEAR;
                    break;
                case TextureMinFilter.LINEAR_MIPMAP_LINEAR:
                    value = gl.LINEAR_MIPMAP_LINEAR;
                    break;
                default:
                    error(`无法处理枚举 ${TextureMinFilter} ${textureMinFilter}`);
                    break;
            }
            return value;
        }
    }
}