namespace feng3d
{
    /**
     * 裁剪面枚举
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/cullFace
     */
    export enum CullFace
    {
        /**
         * 关闭裁剪面
         */
        NONE,
        /**
         * 正面
         */
        FRONT,
        /**
         * 背面
         */
        BACK,
        /**
         * 正面与背面
         */
        FRONT_AND_BACK,
    }

    (enums = enums || {}).getCullFaceValue = (gl: GL) =>
    {
        return (cullFace: CullFace) =>
        {
            var value = gl.BACK;
            switch (cullFace)
            {
                case CullFace.NONE:
                    value = gl.NONE;
                    break;
                case CullFace.FRONT:
                    value = gl.FRONT;
                    break;
                case CullFace.BACK:
                    value = gl.BACK;
                    break;
                case CullFace.FRONT_AND_BACK:
                    value = gl.FRONT_AND_BACK;
                    break;
                default:
                    error(`无法处理枚举 ${CullFace} ${cullFace}`);
                    break;
            }
            return value;
        }
    }
}