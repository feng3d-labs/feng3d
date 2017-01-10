module feng3d {

    /**
     * 渲染模式
     * @author feng 2016-09-28
     */
    export enum RenderMode {
        DEFAULT = WebGL2RenderingContext.TRIANGLES,
        /**
         * 点渲染
         */
        POINTS = WebGL2RenderingContext.POINTS,
        LINE_LOOP = WebGL2RenderingContext.LINE_LOOP,
        LINE_STRIP = WebGL2RenderingContext.LINE_STRIP,
        LINES = WebGL2RenderingContext.LINES,
        TRIANGLES = WebGL2RenderingContext.TRIANGLES,
        TRIANGLE_STRIP = WebGL2RenderingContext.TRIANGLE_STRIP,
        TRIANGLE_FAN = WebGL2RenderingContext.TRIANGLE_FAN
    }
}