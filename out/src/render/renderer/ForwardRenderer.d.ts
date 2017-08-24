declare namespace feng3d {
    /**
     * 前向渲染器
     * @author feng 2017-02-20
     */
    class ForwardRenderer {
        /**
         * 渲染
         */
        draw(renderContext: RenderContext, viewRect: Rectangle): void;
    }
}
