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
        TEXTURE_2D = "TEXTURE_2D",
        /**
         * gl.TEXTURE_CUBE_MAP: A cube-mapped texture.
         */
        TEXTURE_CUBE_MAP = "TEXTURE_CUBE_MAP",
        // /**
        //  * using a WebGL 2 context
        //  * gl.TEXTURE_3D: A three-dimensional texture.
        //  */
        // TEXTURE_3D = "TEXTURE_3D",
        // /**
        //  * using a WebGL 2 context
        //  * gl.TEXTURE_2D_ARRAY: A two-dimensional array texture.
        //  */
        // TEXTURE_2D_ARRAY = "TEXTURE_2D_ARRAY",
    }
}