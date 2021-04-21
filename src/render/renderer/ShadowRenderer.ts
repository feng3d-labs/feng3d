namespace feng3d
{

    /**
     * 阴影图渲染器
     */
    export var shadowRenderer: ShadowRenderer;

    export class ShadowRenderer
    {
        private renderAtomic = new RenderAtomic();

        /**
         * 渲染
         */
        draw(gl: GL, scene: Scene, camera: Camera)
        {
            var pointLights = scene.activePointLights.filter((i) => i.shadowType != ShadowType.No_Shadows);
            for (var i = 0; i < pointLights.length; i++)
            {
                pointLights[i].updateDebugShadowMap(scene, camera);
                this.drawForPointLight(gl, pointLights[i], scene, camera);
            }

            var spotLights = scene.activeSpotLights.filter((i) => i.shadowType != ShadowType.No_Shadows);
            for (var i = 0; i < spotLights.length; i++)
            {
                spotLights[i].updateDebugShadowMap(scene, camera);
                this.drawForSpotLight(gl, spotLights[i], scene, camera);
            }

            var directionalLights = scene.activeDirectionalLights.filter((i) => i.shadowType != ShadowType.No_Shadows);
            for (var i = 0; i < directionalLights.length; i++)
            {
                directionalLights[i].updateDebugShadowMap(scene, camera);
                this.drawForDirectionalLight(gl, directionalLights[i], scene, camera);
            }
        }

        private drawForSpotLight(gl: GL, light: SpotLight, scene: Scene, camera: Camera): any
        {
            FrameBufferObject.active(gl, light.frameBufferObject);

            //
            gl.viewport(0, 0, light.frameBufferObject.OFFSCREEN_WIDTH, light.frameBufferObject.OFFSCREEN_HEIGHT);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            var shadowCamera = light.shadowCamera;
            shadowCamera.node3d.localToWorldMatrix = light.node3d.localToWorldMatrix;

            var renderAtomic = this.renderAtomic;

            // 获取影响阴影图的渲染对象
            var models = scene.getModelsByCamera(shadowCamera);
            // 筛选投射阴影的渲染对象
            var castShadowsModels = models.filter(i => i.castShadows);

            //
            renderAtomic.renderParams.useViewPort = true;
            renderAtomic.renderParams.viewPort = new Rectangle(0, 0, light.frameBufferObject.OFFSCREEN_WIDTH, light.frameBufferObject.OFFSCREEN_HEIGHT);

            //
            renderAtomic.uniforms.u_projectionMatrix = shadowCamera.lens.matrix;
            renderAtomic.uniforms.u_viewProjection = shadowCamera.viewProjection;
            renderAtomic.uniforms.u_viewMatrix = shadowCamera.node3d.worldToLocalMatrix;
            renderAtomic.uniforms.u_cameraMatrix = shadowCamera.node3d.localToWorldMatrix;
            renderAtomic.uniforms.u_cameraPos = shadowCamera.node3d.worldPosition;
            //
            renderAtomic.uniforms.u_lightType = light.lightType;
            renderAtomic.uniforms.u_lightPosition = light.position;
            renderAtomic.uniforms.u_shadowCameraNear = light.shadowCameraNear;
            renderAtomic.uniforms.u_shadowCameraFar = light.shadowCameraFar;

            castShadowsModels.forEach(renderable =>
            {
                this.drawGameObject(gl, renderable, scene, camera);
            });

            light.frameBufferObject.deactive(gl);
        }

        private drawForPointLight(gl: GL, light: PointLight, scene: Scene, camera: Camera): any
        {
            FrameBufferObject.active(gl, light.frameBufferObject);

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
            shadowCamera.node3d.x = light.node3d.x;
            shadowCamera.node3d.y = light.node3d.y;
            shadowCamera.node3d.z = light.node3d.z;

            var renderAtomic = this.renderAtomic;

            for (var face = 0; face < 6; face++)
            {
                shadowCamera.node3d.lookAt(light.position.addTo(cubeDirections[face]), cubeUps[face]);

                // 获取影响阴影图的渲染对象
                var models = scene.getModelsByCamera(shadowCamera);
                // 筛选投射阴影的渲染对象
                var castShadowsModels = models.filter(i => i.castShadows);

                //
                renderAtomic.renderParams.useViewPort = true;
                renderAtomic.renderParams.viewPort = cube2DViewPorts[face];

                //
                renderAtomic.uniforms.u_projectionMatrix = shadowCamera.lens.matrix;
                renderAtomic.uniforms.u_viewProjection = shadowCamera.viewProjection;
                renderAtomic.uniforms.u_viewMatrix = shadowCamera.node3d.worldToLocalMatrix;
                renderAtomic.uniforms.u_cameraMatrix = shadowCamera.node3d.localToWorldMatrix;
                renderAtomic.uniforms.u_cameraPos = shadowCamera.node3d.worldPosition;
                //
                renderAtomic.uniforms.u_lightType = light.lightType;
                renderAtomic.uniforms.u_lightPosition = light.position;
                renderAtomic.uniforms.u_shadowCameraNear = light.shadowCameraNear;
                renderAtomic.uniforms.u_shadowCameraFar = light.shadowCameraFar;

                castShadowsModels.forEach(renderable =>
                {
                    this.drawGameObject(gl, renderable, scene, camera);
                });
            }
            light.frameBufferObject.deactive(gl);
        }


        private drawForDirectionalLight(gl: GL, light: DirectionalLight, scene: Scene, camera: Camera): any
        {
            // 获取影响阴影图的渲染对象
            var models = scene.getPickByDirectionalLight(light);
            // 筛选投射阴影的渲染对象
            var castShadowsModels = models.filter(i => i.castShadows);

            light.updateShadowByCamera(scene, camera, models);

            FrameBufferObject.active(gl, light.frameBufferObject);

            //
            gl.viewport(0, 0, light.frameBufferObject.OFFSCREEN_WIDTH, light.frameBufferObject.OFFSCREEN_HEIGHT);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            var shadowCamera = light.shadowCamera;

            var renderAtomic = this.renderAtomic;
            //
            renderAtomic.renderParams.useViewPort = true;
            renderAtomic.renderParams.viewPort = new Rectangle(0, 0, light.frameBufferObject.OFFSCREEN_WIDTH, light.frameBufferObject.OFFSCREEN_HEIGHT);
            //
            renderAtomic.uniforms.u_projectionMatrix = shadowCamera.lens.matrix;
            renderAtomic.uniforms.u_viewProjection = shadowCamera.viewProjection;
            renderAtomic.uniforms.u_viewMatrix = shadowCamera.node3d.worldToLocalMatrix;
            renderAtomic.uniforms.u_cameraMatrix = shadowCamera.node3d.localToWorldMatrix;
            renderAtomic.uniforms.u_cameraPos = shadowCamera.node3d.worldPosition;
            //
            renderAtomic.uniforms.u_lightType = light.lightType;
            renderAtomic.uniforms.u_lightPosition = shadowCamera.node3d.worldPosition;
            renderAtomic.uniforms.u_shadowCameraNear = light.shadowCameraNear;
            renderAtomic.uniforms.u_shadowCameraFar = light.shadowCameraFar;
            //
            castShadowsModels.forEach(renderable =>
            {
                this.drawGameObject(gl, renderable, scene, camera);
            });

            light.frameBufferObject.deactive(gl);
        }

        /**
         * 绘制3D对象
         */
        private drawGameObject(gl: GL, renderable: Renderable, scene: Scene, camera: Camera)
        {
            var renderAtomic = renderable.renderAtomic;
            renderable.beforeRender(renderAtomic, scene, camera);
            renderAtomic.shadowShader = renderAtomic.shadowShader || new Shader("shadow");

            //
            this.renderAtomic.next = renderAtomic;
            this.renderAtomic.renderParams.cullFace = renderAtomic.renderParams.cullFace;

            // 使用shadowShader
            this.renderAtomic.shader = renderAtomic.shadowShader;
            gl.render(this.renderAtomic);
            this.renderAtomic.shader = null;
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

    export interface RenderAtomic
    {
        shadowShader: Shader;
    }
}