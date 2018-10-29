namespace feng3d
{
    /**
     * 轮廓渲染器
     */
    export var outlineRenderer: OutlineRenderer;

    /**
     * 轮廓渲染器
     */
    export class OutlineRenderer
    {
        renderAtomic: RenderAtomic;

        init()
        {
            if (!this.renderAtomic)
            {
                this.renderAtomic = new RenderAtomic();
                var renderParams = this.renderAtomic.renderParams;
                renderParams.enableBlend = false;
                renderParams.cullFace = CullFace.FRONT;

                this.renderAtomic.shader = new Shader("outline");
            }
        }

        draw(gl: GL, scene3d: Scene3D, camera: Camera)
        {
            var unblenditems = scene3d.getPickCache(camera).unblenditems;

            this.init();

            for (var i = 0; i < unblenditems.length; i++)
            {
                var model = unblenditems[i];
                if (model.getComponent(OutLineComponent) || model.getComponent(CartoonComponent))
                {
                    var renderAtomic = model.gameObject.renderAtomic;
                    model.gameObject.beforeRender(gl, renderAtomic, scene3d, camera);

                    this.renderAtomic.next = renderAtomic;

                    gl.renderer.draw(this.renderAtomic);
                }
            }
        }
    }

    outlineRenderer = new OutlineRenderer();
}