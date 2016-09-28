module feng3d {

    /**
     * 渲染模式
     * @author feng 2016-09-28
     */
    export enum RenderMode {
        /**
         * 点渲染
         */
        POINTS = WebGLRenderingContext.POINTS,
        LINE_LOOP = WebGLRenderingContext.LINE_LOOP,
        LINE_STRIP = WebGLRenderingContext.LINE_STRIP,
        LINES = WebGLRenderingContext.LINES,
        TRIANGLES = WebGLRenderingContext.TRIANGLES,
        TRIANGLE_STRIP = WebGLRenderingContext.TRIANGLE_STRIP,
        TRIANGLE_FAN = WebGLRenderingContext.TRIANGLE_FAN
    }
}