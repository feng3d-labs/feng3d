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
        private shader: Shader;
        private renderParams: RenderParams;

        init()
        {
            if (!this.renderParams)
            {
                var renderParams = this.renderParams = new RenderParams();
                renderParams.renderMode = RenderMode.TRIANGLES;
                renderParams.enableBlend = false;
                renderParams.depthMask = true;
                renderParams.depthtest = true;
                renderParams.cullFace = CullFace.FRONT;
                renderParams.frontFace = FrontFace.CW;

                this.shader = shaderlib.getShader("outline");
            }
        }

        draw(gl: GL, unblenditems: {
            depth: number;
            item: MeshRenderer;
            enableBlend: boolean;
        }[])
        {
            for (var i = 0; i < unblenditems.length; i++)
            {
                var item = unblenditems[i].item;
                if (item.getComponent(OutLineComponent) || item.getComponent(CartoonComponent))
                {
                    var renderAtomic = item.gameObject.renderAtomic;
                    item.gameObject.preRender(renderAtomic);
                    var meshRenderer = item.getComponent(MeshRenderer);
                    this.drawGameObject(gl, renderAtomic);            //
                }
            }
        }

        /**
         * 绘制3D对象
         */
        drawGameObject(gl: GL, renderAtomic: RenderAtomic)
        {
            this.init();

            var oldshader = renderAtomic.shader;
            renderAtomic.shader = this.shader;

            var oldRenderParams = renderAtomic.renderParams;
            renderAtomic.renderParams = this.renderParams;

            gl.renderer.draw(renderAtomic);

            //
            renderAtomic.shader = oldshader;
            renderAtomic.renderParams = oldRenderParams;
        }
    }

    outlineRenderer = new OutlineRenderer();

    export class OutLineComponent extends Component
    {
        @oav()
        @serialize
        size = 1;

        @oav()
        @serialize
        color = new Color4(0.2, 0.2, 0.2, 1.0);

        @oav()
        @serialize
        outlineMorphFactor = 0.0;

        init(gameobject: GameObject)
        {
            super.init(gameobject);
        }

        preRender(renderAtomic: RenderAtomic)
        {
            renderAtomic.uniforms.u_outlineSize = () => this.size;
            renderAtomic.uniforms.u_outlineColor = () => this.color;
            renderAtomic.uniforms.u_outlineMorphFactor = () => this.outlineMorphFactor;
        }
    }

    export interface Uniforms
    {
        /**
         * 描边宽度
         */
        u_outlineSize: number;
        /**
         * 描边颜色
         */
        u_outlineColor: Color4;
        /**
         * 描边形态因子
         * (0.0，1.0):0.0表示延法线方向，1.0表示延顶点方向
         */
        u_outlineMorphFactor: number;

    }
}