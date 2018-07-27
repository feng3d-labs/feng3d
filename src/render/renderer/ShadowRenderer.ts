namespace feng3d
{

    /**
     * 阴影图渲染器
     * @author  feng    2017-03-25
     */
    export var shadowRenderer: ShadowRenderer;

    export class ShadowRenderer
    {
        private renderAtomic: RenderAtomic;

        private shader: Shader;
        private skeleton_shader: Shader;

        private init()
        {
            if (!this.renderAtomic)
            {
                this.renderAtomic = new RenderAtomic();

                this.shader = new Shader("shadow");
                this.skeleton_shader = new Shader("shadow_skeleton");
            }
        }

        /**
         * 渲染
         */
        draw(gl: GL, scene3d: Scene3D, camera: Camera)
        {
            var pointLights = scene3d.collectComponents.pointLights.list.filter((i) => i.shadowType != ShadowType.No_Shadows);
            for (var i = 0; i < pointLights.length; i++)
            {
                pointLights[i].updateDebugShadowMap(scene3d, camera);
                this.drawForPointLight(gl, pointLights[i], scene3d, camera);
            }

            var directionalLights = scene3d.collectComponents.directionalLights.list.filter((i) => i.shadowType != ShadowType.No_Shadows);
            for (var i = 0; i < directionalLights.length; i++)
            {
                directionalLights[i].updateDebugShadowMap(scene3d, camera);
                this.drawForDirectionalLight(gl, directionalLights[i], scene3d, camera);
            }
        }

        private drawForPointLight(gl: GL, light: PointLight, scene3d: Scene3D, camera: Camera): any
        {
            this.init();

            light.frameBufferObject.active(gl);

            //
            gl.viewport(0, 0, light.frameBufferObject.OFFSCREEN_WIDTH, light.frameBufferObject.OFFSCREEN_HEIGHT);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            var vpWidth = light.shadowMapSize.x;
            var vpHeight = light.shadowMapSize.y;

            // These viewports map a cube-map onto a 2D texture with the
            // following orientation:
            //
            //  xzXZ
            //   y Y
            //
            // X - Positive x direction
            // x - Negative x direction
            // Y - Positive y direction
            // y - Negative y direction
            // Z - Positive z direction
            // z - Negative z direction

            // positive X
            cube2DViewPorts[0].init(vpWidth * 2, vpHeight, vpWidth, vpHeight);
            // negative X

            cube2DViewPorts[1].init(0, vpHeight, vpWidth, vpHeight);
            // positive Z
            cube2DViewPorts[2].init(vpWidth * 3, vpHeight, vpWidth, vpHeight);
            // negative Z
            cube2DViewPorts[3].init(vpWidth, vpHeight, vpWidth, vpHeight);
            // positive Y
            cube2DViewPorts[4].init(vpWidth * 3, 0, vpWidth, vpHeight);
            // negative Y
            cube2DViewPorts[5].init(vpWidth, 0, vpWidth, vpHeight);

            var shadowCamera = light.shadowCamera;
            shadowCamera.transform.position = light.transform.position;

            var renderAtomic = this.renderAtomic;

            for (var face = 0; face < 6; face++)
            {
                shadowCamera.transform.lookAt(light.position.addTo(cubeDirections[face]), cubeUps[face]);

                // 获取影响阴影图的渲染对象
                var meshRenderers = scene3d.getMeshRenderersByCamera(shadowCamera);
                // 筛选投射阴影的渲染对象
                var castShadowsMeshRenderers = meshRenderers.filter(i => i.castShadows);

                //
                renderAtomic.renderParams.useViewRect = true;
                renderAtomic.renderParams.viewRect = cube2DViewPorts[face];

                //
                renderAtomic.uniforms.u_projectionMatrix = () => shadowCamera.lens.matrix;
                renderAtomic.uniforms.u_viewProjection = () => shadowCamera.viewProjection;
                renderAtomic.uniforms.u_viewMatrix = () => shadowCamera.transform.worldToLocalMatrix;
                renderAtomic.uniforms.u_cameraMatrix = () => shadowCamera.transform.localToWorldMatrix;
                //
                renderAtomic.uniforms.u_lightType = light.lightType;
                renderAtomic.uniforms.u_lightPosition = light.position;
                renderAtomic.uniforms.u_shadowCameraNear = light.shadowCameraNear;
                renderAtomic.uniforms.u_shadowCameraFar = light.shadowCameraFar;

                castShadowsMeshRenderers.forEach(element =>
                {
                    this.drawGameObject(gl, element.gameObject);
                });
            }
            light.frameBufferObject.deactive(gl);
        }


        private drawForDirectionalLight(gl: GL, light: DirectionalLight, scene3d: Scene3D, camera: Camera): any
        {
            this.init();

            // 获取影响阴影图的渲染对象
            var meshRenderers = scene3d.getPickByDirectionalLight(light);
            // 筛选投射阴影的渲染对象
            var castShadowsMeshRenderers = meshRenderers.filter(i => i.castShadows);

            light.updateShadowByCamera(scene3d, camera, meshRenderers);

            light.frameBufferObject.active(gl);

            //
            gl.viewport(0, 0, light.frameBufferObject.OFFSCREEN_WIDTH, light.frameBufferObject.OFFSCREEN_HEIGHT);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            var shadowCamera = light.shadowCamera;

            var renderAtomic = this.renderAtomic;
            //
            renderAtomic.renderParams.useViewRect = true;
            renderAtomic.renderParams.viewRect = new Rectangle(0, 0, light.frameBufferObject.OFFSCREEN_WIDTH, light.frameBufferObject.OFFSCREEN_HEIGHT)
            //
            renderAtomic.uniforms.u_projectionMatrix = () => shadowCamera.lens.matrix;
            renderAtomic.uniforms.u_viewProjection = () => shadowCamera.viewProjection;
            renderAtomic.uniforms.u_viewMatrix = () => shadowCamera.transform.worldToLocalMatrix;
            renderAtomic.uniforms.u_cameraMatrix = () => shadowCamera.transform.localToWorldMatrix;

            castShadowsMeshRenderers.forEach(element =>
            {
                this.drawGameObject(gl, element.gameObject);
            });

            light.frameBufferObject.deactive(gl);
        }

        /**
         * 绘制3D对象
         */
        drawGameObject(gl: GL, gameObject: GameObject)
        {
            var renderAtomic = gameObject.renderAtomic;
            gameObject.preRender(renderAtomic);
            var meshRenderer = gameObject.getComponent(MeshRenderer);

            if (meshRenderer instanceof SkinnedMeshRenderer)
            {
                this.renderAtomic.shader = this.skeleton_shader;
            } else
            {
                this.renderAtomic.shader = this.shader;
            }

            this.renderAtomic.next = renderAtomic;

            gl.renderer.draw(this.renderAtomic);
        }
    }
    shadowRenderer = new ShadowRenderer();

    var cube2DViewPorts = [
        new Rectangle(), new Rectangle(), new Rectangle(),
        new Rectangle(), new Rectangle(), new Rectangle()
    ];
    var cubeUps = [
        new Vector3(0, 1, 0), new Vector3(0, 1, 0), new Vector3(0, 1, 0),
        new Vector3(0, 1, 0), new Vector3(0, 0, 1), new Vector3(0, 0, - 1)
    ];
    var cubeDirections = [
        new Vector3(1, 0, 0), new Vector3(- 1, 0, 0), new Vector3(0, 0, 1),
        new Vector3(0, 0, - 1), new Vector3(0, 1, 0), new Vector3(0, - 1, 0)
    ];
}