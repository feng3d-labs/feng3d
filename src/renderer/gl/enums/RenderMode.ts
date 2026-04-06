/**
 * 渲染模式，描述绘制图元的类型。
 *
 * A GLenum specifying the type primitive to render.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/drawElements
 */
export enum RenderMode
{
    /**
     * 绘制单个点。
     *
     * gl.POINTS: Draws a single dot.
     */
    POINTS = 'POINTS',

    /**
     * 绘制循环连线。
     *
     * gl.LINE_LOOP: Draws a straight line to the next vertex, and connects the last vertex back to the first.
     */
    LINE_LOOP = 'LINE_LOOP',

    /**
     * 绘制连线
     *
     * gl.LINE_STRIP: Draws a straight line to the next vertex.
     */
    LINE_STRIP = 'LINE_STRIP',

    /**
     * 每两个顶点绘制一条线段。
     *
     * gl.LINES: Draws a line between a pair of vertices.
     */
    LINES = 'LINES',

    /**
     * 每三个顶点绘制一个三角形。
     *
     * gl.TRIANGLES: Draws a triangle for a group of three vertices.
     */
    TRIANGLES = 'TRIANGLES',

    /**
     * 绘制三角形条带。
     *
     * gl.TRIANGLE_STRIP
     * @see https://en.wikipedia.org/wiki/Triangle_strip
     */
    TRIANGLE_STRIP = 'TRIANGLE_STRIP',

    /**
     * 绘制三角扇形。
     *
     * gl.TRIANGLE_FAN
     * @see https://en.wikipedia.org/wiki/Triangle_fan
     */
    TRIANGLE_FAN = 'TRIANGLE_FAN',
}
