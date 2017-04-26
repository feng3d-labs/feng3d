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
        public draw(renderContext: RenderContext)
        {
            var gl = renderContext.gl;
            var scene3D = renderContext.scene3d;

            var lights = scene3D.lights;
            for (var i = 0; i < lights.length; i++)
            {
                var light = lights[i];

                var frameBufferObject = new FrameBufferObject();
                frameBufferObject.init(gl);
                frameBufferObject.active(gl);
                scene3D.renderers.forEach(element =>
                {
                    this.drawRenderables(renderContext, element);
                });
                frameBufferObject.deactive(gl);
            }
        }
    }
}