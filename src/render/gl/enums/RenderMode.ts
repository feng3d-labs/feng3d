namespace feng3d
{
    /**
     * 渲染模式
     * A GLenum specifying the type primitive to render. Possible values are:
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
     * @author feng 2016-09-28
     */
    export enum RenderMode
    {
        /**
         * 点渲染
         * gl.POINTS: Draws a single dot.
         */
        POINTS,
        /**
         * gl.LINE_LOOP: Draws a straight line to the next vertex, and connects the last vertex back to the first.
         */
        LINE_LOOP,
        /**
         * gl.LINE_STRIP: Draws a straight line to the next vertex.
         */
        LINE_STRIP,
        /**
         * gl.LINES: Draws a line between a pair of vertices.
         */
        LINES,
        /**
         * gl.TRIANGLES: Draws a triangle for a group of three vertices.
         */
        TRIANGLES,
        /**
         * gl.TRIANGLE_STRIP
         * @see https://en.wikipedia.org/wiki/Triangle_strip
         */
        TRIANGLE_STRIP,
        /**
         * gl.TRIANGLE_FAN
         * @see https://en.wikipedia.org/wiki/Triangle_fan
         */
        TRIANGLE_FAN,
    }

    (enums = enums || {}).getRenderModeValue = (gl: GL) =>
    {
        return (renderMode: RenderMode) =>
        {
            var value = gl.TRIANGLES;
            switch (renderMode)
            {
                case RenderMode.POINTS:
                    value = gl.POINTS;
                    break;
                case RenderMode.LINE_LOOP:
                    value = gl.LINE_LOOP;
                    break;
                case RenderMode.LINE_STRIP:
                    value = gl.LINE_STRIP;
                    break;
                case RenderMode.LINES:
                    value = gl.LINES;
                    break;
                case RenderMode.TRIANGLES:
                    value = gl.TRIANGLES;
                    break;
                case RenderMode.TRIANGLE_STRIP:
                    value = gl.TRIANGLE_STRIP;
                    break;
                case RenderMode.TRIANGLE_FAN:
                    value = gl.TRIANGLE_FAN;
                    break;
                default:
                    throw `没法处理枚举值 ${RenderMode} ${renderMode}`;
            }
            return value;
        }
    }
}