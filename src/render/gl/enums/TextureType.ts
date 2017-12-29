namespace feng3d
{

    /**
     * 纹理类型
     * A GLenum specifying the binding point (target). Possible values:
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindTexture
     */
    export enum TextureType
    {
        /**
         * gl.TEXTURE_2D: A two-dimensional texture.
         */
        TEXTURE_2D,
        /**
         * gl.TEXTURE_CUBE_MAP: A cube-mapped texture.
         */
        TEXTURE_CUBE_MAP,
        /**
         * using a WebGL 2 context
         * gl.TEXTURE_3D: A three-dimensional texture.
         */
        TEXTURE_3D,
        /**
         * using a WebGL 2 context
         * gl.TEXTURE_2D_ARRAY: A two-dimensional array texture.
         */
        TEXTURE_2D_ARRAY,
    }

    (enums = enums || {}).getTextureTypeValue = (gl: GL) =>
    {
        return (textureType: TextureType) =>
        {
            var gl2: WebGL2RenderingContext = <any>gl;
            var value = gl.TEXTURE_2D;
            switch (textureType)
            {
                case TextureType.TEXTURE_2D:
                    value = gl.TEXTURE_2D;
                    break;
                case TextureType.TEXTURE_CUBE_MAP:
                    value = gl.TEXTURE_CUBE_MAP;
                    break;
                case TextureType.TEXTURE_3D:
                    value = gl2.TEXTURE_3D;
                    break;
                case TextureType.TEXTURE_2D_ARRAY:
                    value = gl2.TEXTURE_2D_ARRAY;
                    break;
                default:
                    error(`无法处理枚举 ${TextureType} ${textureType}`);
            }
            return value;
        }
    }
}