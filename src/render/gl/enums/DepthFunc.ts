namespace feng3d
{
    /**
     * 深度检测方法枚举
     * A GLenum specifying the depth comparison function, which sets the conditions under which the pixel will be drawn. The default value is gl.LESS. 
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/depthFunc
     */
    export enum DepthFunc
    {
        /**
         * (never pass)
         */
        NEVER,
        /**
         *  (pass if the incoming value is less than the depth buffer value)
         */
        LESS,
        /**
         *  (pass if the incoming value equals the the depth buffer value)
         */
        EQUAL,
        /**
         *  (pass if the incoming value is less than or equal to the depth buffer value)
         */
        LEQUAL,
        /**
         * (pass if the incoming value is greater than the depth buffer value)
         */
        GREATER,
        /**
         * (pass if the incoming value is not equal to the depth buffer value)
         */
        NOTEQUAL,
        /**
         * (pass if the incoming value is greater than or equal to the depth buffer value)
         */
        GEQUAL,
        /**
         *  (always pass)
         */
        ALWAYS,
    }

    enums.getdDepthFuncValue = (gl: GL) =>
    {
        return (depthFunc: DepthFunc) =>
        {
            var value = gl.LESS;
            switch (depthFunc)
            {
                case DepthFunc.NEVER:
                    value = gl.NEVER;
                    break;
                case DepthFunc.LESS:
                    value = gl.LESS;
                    break;
                case DepthFunc.EQUAL:
                    value = gl.EQUAL;
                    break;
                case DepthFunc.LEQUAL:
                    value = gl.LEQUAL;
                    break;
                case DepthFunc.GREATER:
                    value = gl.GREATER;
                    break;
                case DepthFunc.NOTEQUAL:
                    value = gl.NOTEQUAL;
                    break;
                case DepthFunc.GEQUAL:
                    value = gl.GEQUAL;
                    break;
                case DepthFunc.ALWAYS:
                    value = gl.ALWAYS;
                    break;
                default:
                    error(`无法处理枚举 ${DepthFunc} ${depthFunc}`);
                    break;
            }
            return value;
        }
    }
}