module feng3d {

    /**
     * 帧缓冲对象
     * @author feng 2017-02-18
     * 
     * @see playcanvas - device.js - testRenderable,updateBegin
     */
    export class FrameBufferObject {

        colorAttachments: { [name: string]: Renderbuffer } = {};

        activate(context3D: Context3D, width: number, height: number) {

            var framebuffer = context3DPool.getFrameBuffer(context3D, this);
            context3D.bindFramebuffer(context3D.FRAMEBUFFER, framebuffer);

            var buffers: number[] = [];
            for (var key in this.colorAttachments) {
                var renderbuffer = this.colorAttachments[key];
                renderbuffer.activate(context3D, width, height);
                buffers.push(renderbuffer.attachment);
            }

            context3D.drawBuffers(buffers);

            for (var key in this.colorAttachments) {
                this.colorAttachments[key].framebufferRenderbuffer(context3D);
            }
        }

        readBuffer(context3D: Context3D, name: string) {

            context3D.readBuffer(this.colorAttachments[name].attachment);
        }

        deactivate(context3D: Context3D) {

            context3D.bindFramebuffer(context3D.FRAMEBUFFER, null);
        }
    }

    export class Renderbuffer {

        attachment: number;
        internalformat: number;
        width: number;
        height: number;

        constructor(index: number, internalformat = Context3D.RGBA8, width = 100, height = 100) {

            this.attachment = Context3D["COLOR_ATTACHMENT" + index];
            this.internalformat = internalformat;
            this.width = width;
            this.height = height;
        }

        activate(context3D: Context3D, width: number, height: number) {

            var renderBuffer = context3DPool.getRenderBuffer(context3D, this);
            context3D.bindRenderbuffer(context3D.RENDERBUFFER, renderBuffer);
            context3D.renderbufferStorage(context3D.RENDERBUFFER, context3D.RGBA8, width, height);
        }

        framebufferRenderbuffer(context3D: Context3D) {

            var renderBuffer = context3DPool.getRenderBuffer(context3D, this);
            context3D.framebufferRenderbuffer(context3D.FRAMEBUFFER, this.attachment, context3D.RENDERBUFFER, renderBuffer);
        }

    }
}