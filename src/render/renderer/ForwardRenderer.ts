module feng3d
{

    /**
     * 前向渲染器
     * @author feng 2017-02-20
     */
    export class ForwardRenderer extends Renderer
    {

        private frameBufferObject: FrameBufferObject;

        constructor()
        {
            super();
            this.frameBufferObject.colorAttachments["forwardTexture"] = new RenderBuffer(0);
        }
    }
}
