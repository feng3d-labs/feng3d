module feng3d
{

    /**
     * 前向渲染器
     * @author feng 2017-02-20
     */
    export class ForwardRenderer extends Renderer
    {
        constructor()
        {
            super();
        }

        protected drawRenderables(context3D: Context3D, renderContext: RenderContext, meshRenderer: MeshRenderer)
        {
            if (meshRenderer.object3D.realVisible)
                super.drawRenderables(context3D, renderContext, meshRenderer);
        }
    }
}
