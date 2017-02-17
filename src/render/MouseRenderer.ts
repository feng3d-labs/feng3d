module feng3d {

    /**
     * 鼠标拾取渲染器
     * @author feng 2017-02-06
     */
    export class MouseRenderer extends Renderer {

        private shaderName = "mouse";
        private shaderProgram: WebGLProgram;
        public selectedObject3D: Object3D;

        /**
		 * 渲染
		 */
        public draw(context3D: Context3D, scene3D: Scene3D, camera: Camera3D) {

            // var b = this.testRenderable(context3D)

            // 参考 playcanvas - device.js - testRenderable,updateBegin
            this.testRenderable0(context3D)

            //启动裁剪，只绘制一个像素
            context3D.enable(Context3D.SCISSOR_TEST);
            context3D.scissor(0, 0, 1, 1);
            super.draw(context3D, scene3D, camera);
            context3D.disable(Context3D.SCISSOR_TEST);

            //

            //读取鼠标拾取索引
            context3D.readBuffer(Context3D.COLOR_ATTACHMENT0);
            var data = new Uint8Array(4);
            context3D.readPixels(0, 0, 1, 1, Context3D.RGBA, Context3D.UNSIGNED_BYTE, data);
            var id = data[0] + data[1] * 255 + data[2] * 255 * 255 + data[3] * 255 * 255 * 255 - data[3];//最后（- data[3]）表示很奇怪，不过data[3]一般情况下为0
            console.log(`选中索引3D对象${id}`, data.toString());

            this.selectedObject3D = Object3D.getObject3D(id);

            this.testRenderable1(context3D)
        }

        /**
         * 激活渲染程序
         */
        protected activeShaderProgram(context3D: Context3D, vertexCode: string, fragmentCode: string) {

            vertexCode = ShaderLib.getShaderCode(this.shaderName + ".vertex");
            fragmentCode = ShaderLib.getShaderCode(this.shaderName + ".fragment");
            return super.activeShaderProgram(context3D, vertexCode, fragmentCode);
        }


        protected testRenderable(gl: Context3D) {
            var pixelFormat = gl.FLOAT;
            var __texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, __texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            var __width = 2;
            var __height = 2;
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, __width, __height, 0, gl.RGBA, pixelFormat, null);

            // Try to use this texture as a render target.
            var __fbo = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, __fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, __texture, 0);
            gl.bindTexture(gl.TEXTURE_2D, null);
            // It is legal for a WebGL implementation exposing the OES_texture_float extension to
            // support floating-point textures but not as attachments to framebuffer objects.
            if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) {
                gl.deleteTexture(__texture);
                return false;
            }
            gl.deleteTexture(__texture);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return true;
        }

        __fbo: WebGLFramebuffer

        renderBuffer: WebGLRenderbuffer


        protected testRenderable0(gl: Context3D) {
            var pixelFormat = gl.FLOAT;
            // var __texture = this.__texture = gl.createTexture();
            // gl.bindTexture(gl.TEXTURE_2D, __texture);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            var __width = gl.drawingBufferWidth;
            var __height = gl.drawingBufferHeight;
            // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, __width, __height, 0, gl.RGBA, pixelFormat, null);

            // Try to use this texture as a render target.
            if (!this.__fbo) {

                this.__fbo = gl.createFramebuffer();
            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.__fbo);

            // gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, __texture, 0);
            // gl.bindTexture(gl.TEXTURE_2D, null);

            //
            if (!this.renderBuffer) {
                this.renderBuffer = gl.createRenderbuffer();
            }
            gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA8, __width, __height);

            // gl.bindFramebuffer(gl.FRAMEBUFFER, this.__fbo);
            gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, this.renderBuffer);
        }

        protected testRenderable1(gl: Context3D) {

            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            return true;
        }
    }
}