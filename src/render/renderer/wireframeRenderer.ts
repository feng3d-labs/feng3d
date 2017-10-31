module feng3d
{
    /**
     * 线框渲染器
     */
    export var wireframeRenderer = {
        draw: draw,
    };

    var shader: Shader;

    function init()
    {
        if (!shader)
        {
            var vertexCode = ShaderLib.getShaderCode("wireframe.vertex");
            var fragmentCode = ShaderLib.getShaderCode("wireframe.fragment");
            shader = new Shader();
            shader.vertexCode = vertexCode;
            shader.fragmentCode = fragmentCode;
            shader.shaderParams.renderMode = RenderMode.LINES;
        }
    }

    /**
     * 渲染
     */
    function draw(renderContext: RenderContext, viewRect: Rectangle, unblenditems: {
        depth: number;
        item: MeshRenderer;
        enableBlend: boolean;
    }[])
    {
        if (unblenditems.length == 0)
            return;

        var gl = renderContext.gl;
        gl.disable(GL.BLEND);
        gl.depthMask(false);
        gl.enable(GL.DEPTH_TEST);
        gl.depthFunc(GL.LEQUAL);

        var gl = renderContext.gl;

        for (var i = 0; i < unblenditems.length; i++)
        {
            var item = unblenditems[i].item;
            if (item.getComponent(WireframeComponent))
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
        if (lazy.getvalue(renderAtomic.shader.shaderParams.renderMode) == RenderMode.POINTS)
            return;

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
        //
        var oldIndexBuffer = renderAtomic.indexBuffer;
        if (!renderAtomic.wireframeindexBuffer)
        {
            var wireframeindices: number[] = [];
            var indices = lazy.getvalue(oldIndexBuffer.indices);
            for (var i = 0; i < indices.length; i += 3)
            {
                wireframeindices.push(
                    indices[i], indices[i + 1],
                    indices[i], indices[i + 2],
                    indices[i + 1], indices[i + 2],
                );
            }
            renderAtomic.wireframeindexBuffer = new Index();
            renderAtomic.wireframeindexBuffer.indices = wireframeindices;
        }
        renderAtomic.indexBuffer = renderAtomic.wireframeindexBuffer;
        renderer.dodraw(renderAtomic, gl);
        renderer.disableAttributes(gl, shaderProgram.attributes);
        renderAtomic.indexBuffer = oldIndexBuffer;
        //
        renderAtomic.shader = oldshader;
    }

    export interface RenderAtomic
    {
        /**
         * 顶点索引缓冲
         */
        wireframeindexBuffer: Index;
    }

    /**
     * 线框组件，将会对拥有该组件的对象绘制线框
     */
    export class WireframeComponent extends Component
    {
        @oav()
        color = new Color(125 / 255, 176 / 255, 250 / 255);

        init(gameobject: GameObject)
        {
            super.init(gameobject);
            this.createUniformData("u_wireframeColor", () => this.color);
        }
    }
}