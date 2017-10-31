module feng3d
{
    /**
     * 轮廓渲染器
     */
    export var outlineRenderer = {
        draw: draw,
    };

    var shader: Shader;
    function init()
    {
        if (!shader)
        {
            var vertexCode = ShaderLib.getShaderCode("outline.vertex");
            var fragmentCode = ShaderLib.getShaderCode("outline.fragment");
            shader = new Shader();
            shader.vertexCode = vertexCode;
            shader.fragmentCode = fragmentCode;
            shader.shaderParams.renderMode = RenderMode.TRIANGLES;
        }
    }

    function draw(renderContext: RenderContext, viewRect: Rectangle, unblenditems: {
        depth: number;
        item: MeshRenderer;
        enableBlend: boolean;
    }[])
    {
        var gl = renderContext.gl;
        gl.disable(GL.BLEND);
        gl.depthMask(true);
        gl.enable(GL.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(GL.FRONT);
        gl.frontFace(GL.CW);

        for (var i = 0; i < unblenditems.length; i++)
        {
            var item = unblenditems[i].item;
            if (item.getComponent(OutLineComponent) || item.getComponent(CartoonComponent))
            {
                var renderAtomic = item.getComponent(RenderAtomicComponent);
                drawObject3D(gl, renderAtomic);            //
            }
        }
    }

    /**
     * 绘制3D对象
     */
    function drawObject3D(gl: GL, renderAtomic: RenderAtomic)
    {
        init();

        shader.macro = renderAtomic.shader.macro;
        var shaderProgram = shader.activeShaderProgram(gl);
        if (!shaderProgram)
            return;
        var oldshader = renderAtomic.shader;
        renderAtomic.shader = shader;

        //
        renderer.activeAttributes(renderAtomic, gl, shaderProgram.attributes);
        renderer.activeUniforms(renderAtomic, gl, shaderProgram.uniforms);
        renderer.dodraw(renderAtomic, gl);
        //
        renderAtomic.shader = oldshader;
    }

    export class OutLineComponent extends Component
    {
        @oav()
        @serialize()
        size = 1;

        @oav()
        @serialize()
        color = new Color(0.2, 0.2, 0.2, 1.0);

        @oav()
        @serialize()
        outlineMorphFactor = 0.0;

        init(gameobject: GameObject)
        {
            super.init(gameobject);

            //
            this.createUniformData("u_outlineSize", () => this.size);
            this.createUniformData("u_outlineColor", () => this.color);
            this.createUniformData("u_outlineMorphFactor", () => this.outlineMorphFactor);
        }
    }

    export interface Uniforms
    {
        /**
         * 描边宽度
         */
        u_outlineSize: Lazy<number>;
        /**
         * 描边颜色
         */
        u_outlineColor: Lazy<Color>;
        /**
         * 描边形态因子
         * (0.0，1.0):0.0表示延法线方向，1.0表示延顶点方向
         */
        u_outlineMorphFactor: Lazy<number>;

    }
}