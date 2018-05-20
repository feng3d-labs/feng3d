namespace feng3d
{
    /**
     * 轮廓渲染器
     */
    export var outlineRenderer = {
        draw: draw,
    };

    var shader: Shader;
    var renderParams: RenderParams;
    function init()
    {
        if (!renderParams)
        {
            renderParams = new RenderParams();
            renderParams.renderMode = RenderMode.TRIANGLES;
            renderParams.enableBlend = false;
            renderParams.depthMask = true;
            renderParams.depthtest = true;
            renderParams.cullFace = CullFace.FRONT;
            renderParams.frontFace = FrontFace.CW;

            shader = shaderlib.getShader("outline");
        }
    }

    function draw(renderContext: RenderContext, unblenditems: {
        depth: number;
        item: MeshRenderer;
        enableBlend: boolean;
    }[])
    {
        var gl = renderContext.gl;

        for (var i = 0; i < unblenditems.length; i++)
        {
            var item = unblenditems[i].item;
            if (item.getComponent(OutLineComponent) || item.getComponent(CartoonComponent))
            {
                var renderAtomic = item.gameObject.renderAtomic;
                item.gameObject.preRender(renderAtomic);
                var meshRenderer = item.getComponent(MeshRenderer);
                drawGameObject(gl, renderAtomic);            //
            }
        }
    }

    /**
     * 绘制3D对象
     */
    function drawGameObject(gl: GL, renderAtomic: RenderAtomic)
    {
        init();

        var oldshader = renderAtomic.shader;
        renderAtomic.shader = shader;

        var oldRenderParams = renderAtomic.renderParams;
        renderAtomic.renderParams = renderParams;

        gl.renderer.draw(renderAtomic);

        //
        renderAtomic.shader = oldshader;
        renderAtomic.renderParams = oldRenderParams;
    }

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