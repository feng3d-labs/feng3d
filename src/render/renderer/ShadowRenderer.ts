namespace feng3d
{

    /**
     * 阴影图渲染器
     * @author  feng    2017-03-25
     */
    export var shadowRenderer: ShadowRenderer;

    export class ShadowRenderer
    {
        private renderParams: RenderParams;
        private shader: Shader;
        private skeleton_shader: Shader;

        init()
        {
            if (!this.renderParams)
            {
                var renderParams = this.renderParams = new RenderParams();
                renderParams.renderMode = RenderMode.LINES;
                renderParams.enableBlend = false;
                renderParams.depthMask = false;
                renderParams.depthtest = true;
                renderParams.depthFunc = DepthFunc.LEQUAL;

                this.shader = shaderlib.getShader("shadow");
                this.skeleton_shader = shaderlib.getShader("shadow_skeleton");
            }
        }

        /**
         * 渲染
         */
        draw(gl: GL, scene3d: Scene3D, camera: Camera)
        {
            var lights = scene3d.collectComponents.directionalLights.list;
            for (var i = 0; i < lights.length; i++)
            {
                this.drawForLight(gl, lights[i], scene3d, camera);
            }
        }

        drawForLight(gl: GL, light: DirectionalLight, scene3d: Scene3D, camera: Camera): any
        {
            var frameBufferObject = new FrameBufferObject();
            frameBufferObject.init(gl);
            frameBufferObject.active(gl);

            light.updateShadowByCamera(scene3d, camera);

            var shadowCamera = light.shadow.camera;

            var unblenditems = scene3d.getPickCache(shadowCamera).unblenditems;
            unblenditems.forEach(element =>
            {
                this.drawGameObject(gl, element.gameObject);
            });

            frameBufferObject.deactive(gl);
        }

        /**
         * 绘制3D对象
         */
        drawGameObject(gl: GL, gameObject: GameObject)
        {
            var renderAtomic = gameObject.renderAtomic;
            gameObject.preRender(renderAtomic);
            var meshRenderer = gameObject.getComponent(MeshRenderer);

            this.init();

            var oldshader = renderAtomic.shader;
            if (meshRenderer instanceof SkinnedMeshRenderer)
            {
                renderAtomic.shader = this.skeleton_shader;
            } else
            {
                renderAtomic.shader = this.shader;
            }

            var oldrenderParams = renderAtomic.renderParams;
            renderAtomic.renderParams = this.renderParams;

            gl.renderer.draw(renderAtomic);

            //
            renderAtomic.shader = oldshader;
            renderAtomic.renderParams = oldrenderParams;
        }
    }
    shadowRenderer = new ShadowRenderer();
}