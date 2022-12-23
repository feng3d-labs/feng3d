/**
 * UIRenderMode for the Canvas.
 *
 * Canvas的渲染模式
 */
export enum UIRenderMode
{
    /**
     * Render at the end of the Scene using a 2D Canvas.
     *
     * 在场景的最后使用2D画布渲染。
     */
    ScreenSpaceOverlay,
    /**
     * Render using the Camera configured on the Canvas.
     *
     * 使用在画布上配置的摄像机进行渲染。
     */
    ScreenSpaceCamera,
    /**
     * Render using any Camera in the Scene that can render the layer.
     *
     * 使用场景中任何可以渲染图层的相机渲染。
     */
    WorldSpace,
}
