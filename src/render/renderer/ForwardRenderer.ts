module feng3d
{

    /**
     * 前向渲染器
     * @author feng 2017-02-20
     */
    export class ForwardRenderer extends Renderer
    {
        public viewRect: Rectangle = new Rectangle(0, 0, 100, 100);

        constructor()
        {
            super();
        }

        /**
		 * 渲染
		 */
        public draw(gl: GL, scene3D: Scene3D, camera: Camera)
        {
            // 默认渲染
            gl.clearColor(scene3D.background.r, scene3D.background.g, scene3D.background.b, scene3D.background.a);
            gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
            gl.viewport(0, 0, this.viewRect.width, this.viewRect.height);
            // Enable alpha blending
            gl.enable(GL.BLEND);
            // Set blending function
            gl.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
            super.draw(gl, scene3D, camera);
            gl.disable(GL.BLEND);
        }

        protected drawRenderables(gl: GL, renderContext: RenderContext, meshRenderer: Model)
        {
            if (meshRenderer.parentComponent.realVisible)
                super.drawRenderables(gl, renderContext, meshRenderer);
        }
    }
}