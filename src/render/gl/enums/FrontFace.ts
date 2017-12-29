namespace feng3d
{
    /**
     * 正面方向枚举
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/frontFace
     */
    export enum FrontFace
    {
        /**
         * Clock-wise winding.
         */
        CW,
        /**
         *  Counter-clock-wise winding.
         */
        CCW,
    }

    (enums = enums || {}).getFrontFaceValue = (gl: GL) =>
    {
        return (frontFace: FrontFace) =>
        {
            var value = gl.CCW;
            switch (frontFace)
            {
                case FrontFace.CW:
                    value = gl.CW;
                    break;
                case FrontFace.CCW:
                    value = gl.CCW;
                    break;
                default:
                    error(`无法处理枚举 ${FrontFace} ${frontFace}`);
                    break;
            }
            return value;
        }
    }
}