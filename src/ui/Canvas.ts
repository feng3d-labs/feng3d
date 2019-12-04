namespace feng3d
{
    /**
     * Element that can be used for screen rendering.
     * 
     * 能够被用于屏幕渲染的元素
     */
    export class Canvas extends Behaviour
    {
        /**
         * Is the Canvas in World or Overlay mode?
         * 
         * 画布是在世界或覆盖模式?
         */
        renderMode = UIRenderMode.ScreenSpaceOverlay;
    }
}