module feng3d
{
    export var skyboxRenderer = {
        draw: draw
    };

    var renderAtomic: RenderAtomic;

    function init()
    {
        if (!renderAtomic)
        {
            renderAtomic = new RenderAtomic();
            //八个顶点，32个number
            var vertexPositionData = [ //
                -1, 1, -1,//
                1, 1, -1, //
                1, 1, 1, //
                -1, 1, 1, //
                -1, -1, -1,//
                1, -1, -1, //
                1, -1, 1,//
                -1, -1, 1 //
            ];
            renderAtomic.attributes.a_position = new Attribute("a_position", vertexPositionData, 3);
            //6个面，12个三角形，36个顶点索引
            var indices = [ //
                0, 1, 2, 2, 3, 0, //
                6, 5, 4, 4, 7, 6, //
                2, 6, 7, 7, 3, 2, //
                4, 5, 1, 1, 0, 4, //
                4, 0, 3, 3, 7, 4, //
                2, 1, 5, 5, 6, 2 //
            ];
            renderAtomic.indexBuffer = new Index();
            renderAtomic.indexBuffer.indices = indices;
            //
            renderAtomic.shader.vertexCode = ShaderLib.getShaderCode("skybox.vertex");
            renderAtomic.shader.fragmentCode = ShaderLib.getShaderCode("skybox.fragment")
            //
            renderAtomic.shader.shaderParams.renderMode = RenderMode.TRIANGLES;
        }
    }

    /**
     * 渲染
     */
    function draw(renderContext: RenderContext, viewRect: Rectangle)
    {
        init();

        var skyboxs = renderContext.scene3d.collectComponents.skyboxs.list.filter((skybox) =>
        {
            return skybox.gameObject.visible;
        });
        if (skyboxs.length == 0)
            return;
        var skybox = skyboxs[0];
        var gl = renderContext.gl;
        gl.disable(GL.BLEND);
        gl.depthMask(true);
        gl.enable(GL.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        //
        var camera = renderContext.camera;
        renderAtomic.uniforms.u_viewProjection = camera.viewProjection;
        renderAtomic.uniforms.u_viewMatrix = camera.transform.worldToLocalMatrix
        renderAtomic.uniforms.u_cameraMatrix = camera.transform.localToWorldMatrix;
        renderAtomic.uniforms.u_skyBoxSize = camera.lens.far / Math.sqrt(3);;

        //
        var skyboxRenderAtomic = skybox.getComponent(RenderAtomicComponent);
        skyboxRenderAtomic.update();

        renderAtomic.uniforms.s_skyboxTexture = skyboxRenderAtomic.uniforms.s_skyboxTexture;
        //
        var shaderProgram = renderAtomic.shader.activeShaderProgram(gl);
        if (!shaderProgram)
            return;
        //
        renderer.activeAttributes(renderAtomic, gl, shaderProgram.attributes);
        renderer.activeUniforms(renderAtomic, gl, shaderProgram.uniforms);
        renderer.dodraw(renderAtomic, gl);
    }

    export class SkyBox extends Component
    {
        @serialize()
        @oav()
        get texture()
        {
            return this._texture;
        }
        set texture(value)
        {
            if (this._texture == value)
                return;
            this._texture = value;
        }
        private _texture: TextureCube;

        constructor()
        {
            super();
            //
            this.createUniformData("s_skyboxTexture", () => this.texture);
        }

        init(gameObject: GameObject)
        {
            super.init(gameObject)
        }
    }
}