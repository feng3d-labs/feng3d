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
            gl.enable(GL.DEPTH_TEST);
            // gl.cullFace()
            super.draw(gl, scene3D, camera);
        }

        protected drawRenderables(gl: GL, renderContext: RenderContext, meshRenderer: Model)
        {
            if (meshRenderer.parentComponent.isVisible)
                super.drawRenderables(gl, renderContext, meshRenderer);
        }
    }
}