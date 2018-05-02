namespace feng3d
{
    export var skyboxRenderer = {
        draw: draw
    };

    var renderAtomic: RenderAtomic;
    var renderParams: RenderParams;

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
            renderAtomic.shadername = "skybox";
            //
            renderParams = new RenderParams();
            renderParams.renderMode = RenderMode.TRIANGLES;
            renderParams.enableBlend = false;
            renderParams.depthMask = true;
            renderParams.depthtest = true;
            renderParams.cullFace = CullFace.NONE;
        }
    }

    /**
     * 渲染
     */
    function draw(gl: GL, scene3d: Scene3D, camera: Camera, renderObjectflag: GameObjectFlag)
    {
        init();

        var skyboxs = scene3d.collectComponents.skyboxs.list.filter((skybox) =>
        {
            return skybox.gameObject.visible && (renderObjectflag & skybox.gameObject.flag);
        });
        if (skyboxs.length == 0)
            return;
        var skybox = skyboxs[0];

        //
        renderAtomic.uniforms.u_viewProjection = camera.viewProjection;
        renderAtomic.uniforms.u_viewMatrix = camera.transform.worldToLocalMatrix
        renderAtomic.uniforms.u_cameraMatrix = camera.transform.localToWorldMatrix;
        renderAtomic.uniforms.u_skyBoxSize = camera.lens.far / Math.sqrt(3);

        //
        var renderAtomic = skybox.gameObject.renderAtomic;
        renderAtomic.renderParams = renderParams;
        skybox.gameObject.preRender(renderAtomic);

        renderAtomic.uniforms.s_skyboxTexture = renderAtomic.uniforms.s_skyboxTexture;

        gl.renderer.draw(renderAtomic);
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
        }

        init(gameObject: GameObject)
        {
            super.init(gameObject)
        }

        preRender(renderAtomic: RenderAtomic)
        {
            renderAtomic.uniforms.s_skyboxTexture = () => this.texture;
        }
    }
}