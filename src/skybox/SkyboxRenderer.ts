namespace feng3d
{
    /**
     * 天空盒渲染器
     */
    export var skyboxRenderer: SkyboxRenderer;

    /**
     * 天空盒渲染器
     */
    export class SkyboxRenderer
    {
        private renderAtomic: RenderAtomic;
        private renderParams: RenderParams;
        private shader: Shader;

        init()
        {
            if (!this.renderAtomic)
            {
                var renderAtomic = new RenderAtomic();
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
                this.renderAtomic = renderAtomic;
                //
                var renderParams = new RenderParams();
                renderParams.renderMode = RenderMode.TRIANGLES;
                renderParams.enableBlend = false;
                renderParams.depthMask = true;
                renderParams.depthtest = true;
                renderParams.cullFace = CullFace.NONE;
                this.renderParams = renderParams;
                //

                this.shader = shaderlib.getShader("skybox");
            }
        }

        /**
         * 渲染
         */
        draw(gl: GL, scene3d: Scene3D, camera: Camera, renderObjectflag: GameObjectFlag)
        {
            this.init();

            var skyboxs = scene3d.collectComponents.skyboxs.list.filter((skybox) =>
            {
                return skybox.gameObject.visible && (renderObjectflag & skybox.gameObject.flag);
            });
            if (skyboxs.length == 0)
                return;
            var skybox = skyboxs[0];

            //
            this.renderAtomic.renderParams = this.renderParams;
            this.renderAtomic.shader = this.shader;
            skybox.gameObject.preRender(this.renderAtomic);

            //
            this.renderAtomic.uniforms.u_viewProjection = camera.viewProjection;
            this.renderAtomic.uniforms.u_viewMatrix = camera.transform.worldToLocalMatrix
            this.renderAtomic.uniforms.u_cameraMatrix = camera.transform.localToWorldMatrix;
            this.renderAtomic.uniforms.u_skyBoxSize = camera.lens.far / Math.sqrt(3);

            gl.renderer.draw(this.renderAtomic);
        }
    }

    skyboxRenderer = new SkyboxRenderer();
}