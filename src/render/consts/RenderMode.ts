module feng3d
{

    /**
     * 渲染模式
     * @author feng 2016-09-28
     */
    export enum RenderMode
    {
        DEFAULT = Context3D.TRIANGLES,
        /**
         * 点渲染
         */
        POINTS = Context3D.POINTS,
        LINE_LOOP = Context3D.LINE_LOOP,
        LINE_STRIP = Context3D.LINE_STRIP,
        LINES = Context3D.LINES,
        TRIANGLES = Context3D.TRIANGLES,
        TRIANGLE_STRIP = Context3D.TRIANGLE_STRIP,
        TRIANGLE_FAN = Context3D.TRIANGLE_FAN
    }
}