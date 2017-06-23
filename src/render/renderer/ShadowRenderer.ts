namespace feng3d
{

    /**
     * 阴影图渲染器
     * @author  feng    2017-03-25
     */
    export class ShadowRenderer
    {
        private frameBufferObject: FrameBufferObject;

        constructor()
        {
        }

        /**
		 * 渲染
		 */
        public draw(renderContext: RenderContext)
        {
            var gl = renderContext.gl;

            var lights = Light.lights;
            for (var i = 0; i < lights.length; i++)
            {
                var light = lights[i];

                var frameBufferObject = new FrameBufferObject();
                frameBufferObject.init(gl);
                frameBufferObject.active(gl);
                MeshRenderer.meshRenderers.forEach(element =>
                {
                    // this.drawRenderables(renderContext, element);
                });
                frameBufferObject.deactive(gl);
            }
        }
    }
}