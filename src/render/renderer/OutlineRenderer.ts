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

        draw(gl: GL, scene: Scene, camera: Camera)
        {
            var unblenditems = scene.getPickCache(camera).unblenditems;

            this.init();

            for (var i = 0; i < unblenditems.length; i++)
            {
                var renderable = unblenditems[i];
                if (renderable.getComponent(OutLineComponent) || renderable.getComponent(CartoonComponent))
                {
                    var renderAtomic = renderable.renderAtomic;
                    renderable.beforeRender(renderAtomic, scene, camera);

                    this.renderAtomic.next = renderAtomic;

                    gl.render(this.renderAtomic);
                }
            }
        }
    }

    outlineRenderer = new OutlineRenderer();
}