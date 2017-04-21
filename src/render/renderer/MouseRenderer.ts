module feng3d
{

    /**
     * 鼠标拾取渲染器
     * @author feng 2017-02-06
     */
    export class MouseRenderer extends Renderer
    {

        private _shaderName = "mouse";
        public selectedObject3D: GameObject;

        constructor()
        {
            super();
        }

        /**
		 * 渲染
		 */
        public draw(gl: GL, scene3D: Scene3D, camera: Camera)
        {
            // this.frameBufferObject.activate(gl,
            //     gl.drawingBufferWidth,
            //     gl.drawingBufferHeight);

            //启动裁剪，只绘制一个像素
            gl.enable(GL.SCISSOR_TEST);
            gl.scissor(0, 0, 1, 1);
            super.draw(gl, scene3D, camera);
            gl.disable(GL.SCISSOR_TEST);

            //读取鼠标拾取索引
            // this.frameBufferObject.readBuffer(gl, "objectID");

            var data = new Uint8Array(4);
            gl.readPixels(0, 0, 1, 1, GL.RGBA, GL.UNSIGNED_BYTE, data);
            var id = data[0] + data[1] * 255 + data[2] * 255 * 255 + data[3] * 255 * 255 * 255 - data[3];//最后（- data[3]）表示很奇怪，不过data[3]一般情况下为0
            // console.log(`选中索引3D对象${id}`, data.toString());

            this.selectedObject3D = GameObject.getObject3D(id);

            // this.frameBufferObject.deactivate(gl);
        }

        protected drawRenderables(gl: GL, renderContext: RenderContext, meshRenderer: Model)
        {
            if (meshRenderer.parentComponent.mouseEnabled)
                super.drawRenderables(gl, renderContext, meshRenderer);
        }

        /**
         * 激活渲染程序
         */
        protected activeShaderProgram(gl: GL, vertexCode: string, fragmentCode: string, shaderMacro: ShaderMacro)
        {
            var vertexCode = ShaderLib.getShaderCode(this._shaderName + ".vertex");
            var fragmentCode = ShaderLib.getShaderCode(this._shaderName + ".fragment");
            return super.activeShaderProgram(gl, vertexCode, fragmentCode, shaderMacro);
        }
    }
}