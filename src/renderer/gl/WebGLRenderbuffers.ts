import { RenderBuffer } from '../RenderBuffer';
import { WebGLRenderer } from '../WebGLRenderer';

declare global
{
    interface WebGLRenderbuffer
    {
        version: number;
    }
}

export class WebGLRenderbuffers
{
    /**
     * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
     */
    private renderBuffers = new WeakMap<RenderBuffer, WebGLRenderbuffer>();

    private _webGLRenderer: WebGLRenderer;

    constructor(webGLRenderer: WebGLRenderer)
    {
        this._webGLRenderer = webGLRenderer;
    }

    /**
     * 激活
     */
    get(renderBuffer: RenderBuffer)
    {
        const { webGLContext } = this._webGLRenderer;
        const { renderBuffers } = this;

        let webGLRenderbuffer = renderBuffers.get(renderBuffer);
        if (webGLRenderbuffer)
        {
            if (webGLRenderbuffer.version !== renderBuffer.version)
            {
                this.clear(renderBuffer);
                webGLRenderbuffer = null;
            }
        }

        if (!webGLRenderbuffer)
        {
            // Create a renderbuffer object and Set its size and parameters
            webGLRenderbuffer = webGLContext.createRenderbuffer(); // Create a renderbuffer object
            if (!webGLRenderbuffer)
            {
                console.warn('Failed to create renderbuffer object');

                return;
            }
            webGLContext.bindRenderbuffer('RENDERBUFFER', webGLRenderbuffer);
            webGLContext.renderbufferStorage('RENDERBUFFER', renderBuffer.internalformat, renderBuffer.width, renderBuffer.height);

            webGLRenderbuffer.version = renderBuffer.version;

            renderBuffers.set(renderBuffer, webGLRenderbuffer);
        }

        return webGLRenderbuffer;
    }

    /**
     * 清理纹理
     */
    private clear(renderBuffer: RenderBuffer)
    {
        const { webGLContext } = this._webGLRenderer;
        const { renderBuffers } = this;

        const buffer = renderBuffers.get(renderBuffer);
        if (buffer)
        {
            webGLContext.deleteRenderbuffer(buffer);
            renderBuffers.delete(renderBuffer);
        }
    }
}
