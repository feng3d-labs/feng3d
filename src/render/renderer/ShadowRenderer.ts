module feng3d
{

    /**
     * 阴影图渲染器
     * @author  feng    2017-03-25
     */
    export class ShadowRenderer extends Renderer
    {
        private frameBufferObject: FrameBufferObject;

        constructor()
        {
            super();
        }

        /**
		 * 渲染
		 */
        public draw(gl: GL, scene3D: Scene3D, camera: Camera)
        {
            var renderContext = scene3D.renderContext;
            //初始化渲染环境
            renderContext.camera = camera;

            var lights = scene3D.lights;
            for (var i = 0; i < lights.length; i++)
            {
                var light = lights[i];

                var frameBufferObject = new FrameBufferObject();
                frameBufferObject.init(gl);
                frameBufferObject.active(gl);
                scene3D.renderers.forEach(element =>
                {
                    this.drawRenderables(gl, renderContext, element);
                });
                frameBufferObject.deactive(gl);
            }
        }
    }
}