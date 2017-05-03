module feng3d
{

    /**
     * 渲染模式
     * @author feng 2016-09-28
     */
    export class RenderMode
    {
        /**
         * 点渲染
         */
        public static POINTS: number;
        public static LINE_LOOP: number;
        public static LINE_STRIP: number;
        public static LINES: number;
        public static TRIANGLES: number;
        public static TRIANGLE_STRIP: number;
        public static TRIANGLE_FAN: number;
    }

    (initFunctions || (initFunctions = [])).push(() =>
    {
        RenderMode.POINTS = GL.POINTS;
        RenderMode.LINE_LOOP = GL.LINE_LOOP;
        RenderMode.LINE_STRIP = GL.LINE_STRIP;
        RenderMode.LINES = GL.LINES;
        RenderMode.TRIANGLES = GL.TRIANGLES;
        RenderMode.TRIANGLE_STRIP = GL.TRIANGLE_STRIP;
        RenderMode.TRIANGLE_FAN = GL.TRIANGLE_FAN;
    });
}