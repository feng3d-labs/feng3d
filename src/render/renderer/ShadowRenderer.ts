namespace feng3d
{

    /**
     * 阴影图渲染器
     * @author  feng    2017-03-25
     */
    export var shadowRenderer = {
        draw: draw
    };
    // private frameBufferObject: FrameBufferObject;

    /**
     * 渲染
     */
    function draw(renderContext: RenderContext)
    {
        var gl = renderContext.gl;

        var lights = renderContext.scene3d.collectComponents.pointLights.list;
        for (var i = 0; i < lights.length; i++)
        {
            var light = lights[i];

            // var frameBufferObject = new FrameBufferObject();
            // frameBufferObject.init(gl);
            // frameBufferObject.active(gl);
            // MeshRenderer.meshRenderers.forEach(element =>
            // {
            // this.drawRenderables(renderContext, element);
            // });
            // frameBufferObject.deactive(gl);
        }
    }
}