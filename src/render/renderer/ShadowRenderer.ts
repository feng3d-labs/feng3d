namespace feng3d
{

    /**
     * 阴影图渲染器
     * @author  feng    2017-03-25
     */
    export var shadowRenderer: ShadowRenderer;

    export class ShadowRenderer
    {
        /**
         * 渲染
         */
        draw(gl: GL, scene3d: Scene3D, camera: Camera)
        {
            var lights = scene3d.collectComponents.pointLights.list;
            for (var i = 0; i < lights.length; i++)
            {
                this.drawForLight(gl, lights[i], scene3d, camera);
            }
        }

        drawForLight(gl: GL, light: PointLight, scene3d: Scene3D, camera: Camera): any
        {
            var frameBufferObject = new FrameBufferObject();
            frameBufferObject.init(gl);
            frameBufferObject.active(gl);
            // MeshRenderer.meshRenderers.forEach(element =>
            // {
            //     this.drawRenderables(renderContext, element);
            // });
            frameBufferObject.deactive(gl);
        }
    }
    shadowRenderer = new ShadowRenderer();
}