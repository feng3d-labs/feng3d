module feng3d
{

    /**
     * 帧缓冲对象
     * @author feng 2017-02-18
     * 
     * @see playcanvas - device.js - testRenderable,updateBegin
     */
    export class FrameBufferObject
    {

        colorAttachments: { [name: string]: RenderBuffer } = {};

        activate(gl: GL, width: number, height: number)
        {

            var framebuffer = context3DPool.getFrameBuffer(gl, this);
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

            var buffers: number[] = [];
            for (var key in this.colorAttachments)
            {
                var renderbuffer = this.colorAttachments[key];
                renderbuffer.activate(gl, width, height);
                buffers.push(renderbuffer.attachment);
            }

            gl.drawBuffers(buffers);

            for (var key in this.colorAttachments)
            {
                this.colorAttachments[key].framebufferRenderbuffer(gl);
            }
        }

        readBuffer(gl: GL, name: string)
        {

            gl.readBuffer(this.colorAttachments[name].attachment);
        }

        deactivate(gl: GL)
        {

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
    }

    export class RenderBuffer
    {

        attachment: number;
        internalformat: number;
        width: number;
        height: number;

        constructor(index: number, internalformat = GL.RGBA8, width = 100, height = 100)
        {

            this.attachment = GL["COLOR_ATTACHMENT" + index];
            this.internalformat = internalformat;
            this.width = width;
            this.height = height;
        }

        activate(gl: GL, width: number, height: number)
        {

            var renderBuffer = context3DPool.getRenderBuffer(gl, this);
            gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA8, width, height);
        }

        framebufferRenderbuffer(gl: GL)
        {

            var renderBuffer = context3DPool.getRenderBuffer(gl, this);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, this.attachment, gl.RENDERBUFFER, renderBuffer);
        }

    }

    export class RenderTexture
    {

    }
}