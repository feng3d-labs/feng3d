namespace feng3d
{

    /**
     * 鼠标拾取渲染器
     * @author feng 2017-02-06
     */
    export class MouseRenderer extends EventDispatcher
    {

        private objects: GameObject[] = [];

        /**
		 * 渲染
		 */
        draw(renderContext: RenderContext, viewRect: Rectangle)
        {
            var gl = renderContext.gl;

            var mouseX = windowEventProxy.clientX;
            var mouseY = windowEventProxy.clientY;

            var offsetX = -(mouseX - viewRect.x);
            var offsetY = -(viewRect.height - (mouseY - viewRect.y));//y轴与window中坐标反向，所以需要 h = (maxHeight - h)

            gl.clearColor(0, 0, 0, 0);
            gl.clearDepth(1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.viewport(offsetX, offsetY, viewRect.width, viewRect.height);

            this.objects.length = 1;

            var gl = renderContext.gl;
            //启动裁剪，只绘制一个像素
            gl.enable(gl.SCISSOR_TEST);
            gl.scissor(0, 0, 1, 1);
            // super.draw(renderContext);
            gl.disable(gl.SCISSOR_TEST);

            //读取鼠标拾取索引
            // this.frameBufferObject.readBuffer(gl, "objectID");

            var data = new Uint8Array(4);
            gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
            var id = data[0] + data[1] * 255 + data[2] * 255 * 255 + data[3] * 255 * 255 * 255 - data[3];//最后（- data[3]）表示很奇怪，不过data[3]一般情况下为0
            // log(`选中索引3D对象${id}`, data.toString());

            return this.objects[id];
        }

        protected drawRenderables(renderContext: RenderContext, meshRenderer: MeshRenderer)
        {
            if (meshRenderer.gameObject.mouseEnabled)
            {
                var object = meshRenderer.gameObject;
                var u_objectID = this.objects.length;
                this.objects[u_objectID] = object;

                var renderAtomic = object.renderAtomic;

                renderAtomic.uniforms.u_objectID = u_objectID;
                // super.drawRenderables(renderContext, meshRenderer);
            }
        }

        /**
         * 绘制3D对象
         */
        protected drawGameObject(gl: GL, renderAtomic: RenderAtomic)
        {
            // var shader = new Shader();
            // shader.vertexCode = shaderlib.getShader("mouse").vertex;
            // shader.fragmentCode = shaderlib.getShader("mouse").fragment;
            // super.drawGameObject(gl, renderAtomic, shader);
        }
    }

    export var glMousePicker = new MouseRenderer();
}