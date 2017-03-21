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

        protected drawRenderables(gl: GL, renderContext: RenderContext, meshRenderer: Model)
        {
            if (meshRenderer.parentComponent.realVisible)
                super.drawRenderables(gl, renderContext, meshRenderer);
        }
    }
}
