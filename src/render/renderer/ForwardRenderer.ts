namespace feng3d
{

    /**
     * 前向渲染器
     * @author feng 2017-02-20
     */
    export var forwardRenderer: ForwardRenderer;

    /**
     * 前向渲染器
     * @author feng 2017-02-20
     */
    export class ForwardRenderer
    {
        private renderContext = new RenderContext();

        /**
         * 渲染
         */
        draw(gl: GL, scene3d: Scene3D, camera: Camera)
        {
            var blenditems = scene3d.getPickCache(camera).blenditems;
            var unblenditems = scene3d.getPickCache(camera).unblenditems;

            this.renderContext.camera = camera;
            this.renderContext.scene3d = scene3d;
            this.renderContext.update();

            unblenditems.concat(blenditems).forEach(item => this.drawRenderables(item, gl));
        }

        drawRenderables(meshRenderer: MeshRenderer, gl: GL)
        {
            //绘制
            var material = meshRenderer.material;
            var renderAtomic = meshRenderer.gameObject.renderAtomic;

            renderAtomic.renderParams = material.renderParams;
            renderAtomic.shader = material.shader;

            meshRenderer.gameObject.preRender(renderAtomic);

            renderAtomic.next = this.renderContext.renderAtomic;

            gl.renderer.draw(renderAtomic);
        }
    }

    forwardRenderer = new ForwardRenderer();
}