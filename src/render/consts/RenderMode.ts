module feng3d
{

    /**
     * 渲染模式
     * @author feng 2016-09-28
     */
    export enum RenderMode
    {
        /**
         * 点渲染
         */
        POINTS,
        LINE_LOOP,
        LINE_STRIP,
        LINES,
        TRIANGLES,
        TRIANGLE_STRIP,
        TRIANGLE_FAN
    }

    /**
     * 根据枚举渲染模式获取真实值
     * @param renderMode 渲染模式
     */
    export function getRenderModeValue(renderMode: RenderMode)
    {
        if (!renderModeMap)
        {
            renderModeMap = {};
            renderModeMap[RenderMode.POINTS] = GL.POINTS;
            renderModeMap[RenderMode.LINE_LOOP] = GL.LINE_LOOP;
            renderModeMap[RenderMode.LINE_STRIP] = GL.LINE_STRIP;
            renderModeMap[RenderMode.LINES] = GL.LINES;
            renderModeMap[RenderMode.TRIANGLES] = GL.TRIANGLES;
            renderModeMap[RenderMode.TRIANGLE_STRIP] = GL.TRIANGLE_STRIP;
            renderModeMap[RenderMode.TRIANGLE_FAN] = GL.TRIANGLE_FAN;
        }
        return renderModeMap[renderMode];
    }
    var renderModeMap: { [key: number]: number };
}