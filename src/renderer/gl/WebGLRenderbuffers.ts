import { RenderBuffer } from '../RenderBuffer';
import { WebGLRenderer } from '../WebGLRenderer';

export class WebGLRenderbuffers
{
    /**
     * 此处用于缓存，需要获取有效数据请调用 Attribute.getBuffer
     */
    private renderBuffers = new WeakMap<RenderBuffer, { buffer: WebGLRenderbuffer, OFFSCREEN_WIDTH: number, OFFSCREEN_HEIGHT: number }>();

    private _webGLRenderer: WebGLRenderer;

    constructor(webGLRenderer: WebGLRenderer)
    {
        this._webGLRenderer = webGLRenderer;
    }

    /**
     * 激活
     */
    active(renderBuffer: RenderBuffer)
    {
        const { gl } = this._webGLRenderer;
        const { renderBuffers } = this;
        const { OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT } = renderBuffer;

        let cache = renderBuffers.get(renderBuffer);
        if (cache)
        {
            if (cache.OFFSCREEN_WIDTH !== OFFSCREEN_WIDTH || cache.OFFSCREEN_HEIGHT !== OFFSCREEN_HEIGHT)
            {
                this.clear(renderBuffer);
                cache = null;
            }
        }

        if (!cache)
        {
            // Create a renderbuffer object and Set its size and parameters
            const buffer = gl.createRenderbuffer(); // Create a renderbuffer object
            if (!buffer)
            {
                console.warn('Failed to create renderbuffer object');

                return;
            }
            gl.bindRenderbuffer(gl.RENDERBUFFER, buffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

            cache = { buffer, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT };
            renderBuffers.set(renderBuffer, cache);
        }

        return cache.buffer;
    }

    /**
     * 清理纹理
     */
    private clear(renderBuffer: RenderBuffer)
    {
        const { gl } = this._webGLRenderer;
        const { renderBuffers } = this;

        const buffer = renderBuffers.get(renderBuffer);
        if (buffer)
        {
            gl.deleteRenderbuffer(buffer);
            renderBuffers.delete(renderBuffer);
        }
    }
}
