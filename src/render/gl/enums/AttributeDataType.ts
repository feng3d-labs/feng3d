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
        BYTE,
        /**
         *  signed 16-bit integer, with values in [-32768, 32767]
         */
        SHORT,
        /**
         * unsigned 8-bit integer, with values in [0, 255]
         */
        UNSIGNED_BYTE,
        /**
         * unsigned 16-bit integer, with values in [0, 65535]
         */
        UNSIGNED_SHORT,
        /**
         * 32-bit floating point number
         */
        FLOAT,
        /**
         * using a WebGL 2 context
         * 16-bit floating point number
         */
        HALF_FLOAT
    }

    (enums = enums || {}).getGLArrayTypeValue = (gl: GL) =>
    {
        var gl2: WebGL2RenderingContext = <any>gl;
        return (glArrayType: GLArrayType) =>
        {
            var value = gl.FUNC_ADD;
            switch (glArrayType)
            {
                case GLArrayType.BYTE:
                    value = gl.BYTE;
                    break;
                case GLArrayType.SHORT:
                    value = gl.SHORT;
                    break;
                case GLArrayType.UNSIGNED_BYTE:
                    value = gl.UNSIGNED_BYTE;
                    break;
                case GLArrayType.UNSIGNED_SHORT:
                    value = gl.UNSIGNED_SHORT;
                    break;
                case GLArrayType.FLOAT:
                    value = gl.FLOAT;
                    break;
                case GLArrayType.HALF_FLOAT:
                    assert(gl.webgl2, `无法处理枚举 ${GLArrayType} ${glArrayType}`);
                    value = gl2.HALF_FLOAT;
                    break;
                default:
                    error(`无法处理枚举 ${GLArrayType} ${glArrayType}`);
            }
            return value;
        }
    }
}