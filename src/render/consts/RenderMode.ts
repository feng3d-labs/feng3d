module feng3d
{

    /**
     * 渲染模式
     * @author feng 2016-09-28
     */
    export enum RenderMode
    {
        DEFAULT = GL.TRIANGLES,
        /**
         * 点渲染
         */
        POINTS = GL.POINTS,
        LINE_LOOP = GL.LINE_LOOP,
        LINE_STRIP = GL.LINE_STRIP,
        LINES = GL.LINES,
        TRIANGLES = GL.TRIANGLES,
        TRIANGLE_STRIP = GL.TRIANGLE_STRIP,
        TRIANGLE_FAN = GL.TRIANGLE_FAN
    }
}