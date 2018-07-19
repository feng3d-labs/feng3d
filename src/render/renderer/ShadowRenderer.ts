namespace feng3d
{

    /**
     * 阴影图渲染器
     * @author  feng    2017-03-25
     */
    export var shadowRenderer: ShadowRenderer;

    export class ShadowRenderer
    {
        renderAtomic: RenderAtomic;

        private shader: Shader;
        private skeleton_shader: Shader;

        init()
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
            var lights = scene3d.collectComponents.directionalLights.list.filter((i) => i.castShadows);
            for (var i = 0; i < lights.length; i++)
            {
                this.drawForLight(gl, lights[i], scene3d, camera);
            }
        }

        drawForLight(gl: GL, light: DirectionalLight, scene3d: Scene3D, camera: Camera): any
        {
            this.init();

            var meshRenderers = scene3d.getPickByDirectionalLight(light);
            if (meshRenderers.length == 0)
                return;

            light.frameBufferObject.active(gl);

            light.updateShadowByCamera(scene3d, camera, meshRenderers);

            var shadowCamera = light.shadow.camera;

            //
            this.renderAtomic.renderParams.useViewRect = true;
            this.renderAtomic.renderParams.viewRect = new Rectangle(0, 0, light.frameBufferObject.OFFSCREEN_WIDTH, light.frameBufferObject.OFFSCREEN_HEIGHT)
            //
            this.renderAtomic.uniforms.u_projectionMatrix = () => shadowCamera.lens.matrix;
            this.renderAtomic.uniforms.u_viewProjection = () => shadowCamera.viewProjection;
            this.renderAtomic.uniforms.u_viewMatrix = () => shadowCamera.transform.worldToLocalMatrix;
            this.renderAtomic.uniforms.u_cameraMatrix = () => shadowCamera.transform.localToWorldMatrix;

            meshRenderers.forEach(element =>
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
}