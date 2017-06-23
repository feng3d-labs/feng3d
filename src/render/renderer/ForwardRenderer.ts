namespace feng3d
{

    /**
     * 前向渲染器
     * @author feng 2017-02-20
     */
    export class ForwardRenderer
    {
        public viewRect: Rectangle = new Rectangle(0, 0, 100, 100);

        constructor()
        {
        }

        /**
		 * 渲染
		 */
        public draw(renderContext: RenderContext)
        {
            var gl = renderContext.gl;
            var scene3D = renderContext.scene3d;
            // 默认渲染
            gl.clearColor(scene3D.background.r, scene3D.background.g, scene3D.background.b, scene3D.background.a);
            gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
            gl.viewport(0, 0, this.viewRect.width, this.viewRect.height);
            gl.enable(GL.DEPTH_TEST);
            // gl.cullFace()
            var meshRenderers = MeshRenderer.meshRenderers;
            for (var i = 0; i < meshRenderers.length; i++)
            {
                meshRenderers[i].drawRenderables(renderContext);
            }
        }

    }
}