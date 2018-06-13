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
            var frustum = camera.frustum;

            var meshRenderers = scene3d.collectForwardRender(scene3d.gameObject, frustum);

            var camerapos = camera.transform.scenePosition;

            var maps = meshRenderers.map((item) =>
            {
                return {
                    depth: item.transform.scenePosition.subTo(camerapos).length,
                    item: item,
                    enableBlend: item.material.renderParams.enableBlend,
                }
            });

            var blenditems = maps.filter((item) => { return item.enableBlend; });
            var unblenditems = maps.filter((item) => { return !item.enableBlend; });

            blenditems = blenditems.sort((a, b) =>
            {
                return b.depth - a.depth;
            });
            unblenditems = unblenditems.sort((a, b) =>
            {
                return a.depth - b.depth;
            });

            this.renderContext.gl = gl;
            this.renderContext.camera = camera;
            this.renderContext.scene3d = scene3d;

            for (var i = 0; i < unblenditems.length; i++)
            {
                this.drawRenderables(unblenditems[i].item, gl)
            }

            for (var i = 0; i < blenditems.length; i++)
            {
                this.drawRenderables(blenditems[i].item, gl)
            }

            return { blenditems: blenditems, unblenditems: unblenditems };
        }

        drawRenderables(meshRenderer: MeshRenderer, gl: GL)
        {
            //更新数据
            // try
            // {
            //绘制
            var material = meshRenderer.material;
            var renderAtomic = meshRenderer.gameObject.renderAtomic;

            renderAtomic.renderParams = material.renderParams;
            renderAtomic.shader = material.shader;

            meshRenderer.gameObject.preRender(renderAtomic);
            this.renderContext.preRender(renderAtomic);

            gl.renderer.draw(renderAtomic);
            // renderdatacollector.clearRenderDataHolder(renderContext, renderAtomic);

            // } catch (error)
            // {
            //     log(error);
            // }
        }
    }

    forwardRenderer = new ForwardRenderer();
}