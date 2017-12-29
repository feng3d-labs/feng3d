namespace feng3d
{
    /**
     * 纹理放大滤波器
     * Texture magnification filter
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
     */
    export enum TextureMagFilter
    {
        /**
         *  (default value)
         */
        LINEAR,
        NEAREST,
    }

    (enums = enums || {}).getTextureMagFilterValue = (gl: GL) =>
    {
        return (textureMagFilter: TextureMagFilter) =>
        {
            var value = gl.LINEAR;

            switch (textureMagFilter)
            {
                case TextureMagFilter.LINEAR:
                    value = gl.LINEAR;
                    break;
                case TextureMagFilter.NEAREST:
                    value = gl.NEAREST;
                    break;
                default:
                    error(`无法处理枚举 ${TextureMagFilter} ${textureMagFilter}`);
                    break;
            }
            return value;
        }
    }
}