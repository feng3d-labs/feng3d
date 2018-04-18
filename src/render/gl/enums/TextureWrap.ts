namespace feng3d
{
    /**
     * 纹理坐标s包装函数枚举
     * Wrapping function for texture coordinate s
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    export enum TextureWrap
    {
        /**
         * (default value)
         */
        REPEAT,
        CLAMP_TO_EDGE,
        MIRRORED_REPEAT,
    }

    enums.getTextureWrapValue = (gl: GL) =>
    {
        return (textureWrap: TextureWrap) =>
        {
            var value = gl.REPEAT;

            switch (textureWrap)
            {
                case TextureWrap.REPEAT:
                    value = gl.REPEAT;
                    break;
                case TextureWrap.CLAMP_TO_EDGE:
                    value = gl.CLAMP_TO_EDGE;
                    break;
                case TextureWrap.MIRRORED_REPEAT:
                    value = gl.MIRRORED_REPEAT;
                    break;
                default:
                    error(`无法处理枚举 ${TextureWrap} ${textureWrap}`);
                    break;
            }
            return value;
        }
    }

}