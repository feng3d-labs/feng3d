module me.feng3d {

    /**
     * 3D对象缓冲
     */
    export class Object3DBuffer {

        /**
         * 3D上下文
         */
        private context3D: WebGLRenderingContext;

        /**
         * 渲染对象
         */
        private object3D: Object3D;

        /**
         * 顶点索引缓冲
         */
        indexBuffer: IndexBuffer;

        /**
         * 渲染程序缓存
         */
        programBuffer: ProgramBuffer;

        /**
         * 属性数据列表
         */
        private attributes: { [name: string]: { type: string, location?: number, buffer?: AttributeBuffer } };

        /**
         * 常量数据列表
         */
        private uniforms: { [name: string]: { type: string, location?: WebGLUniformLocation, buffer?: UniformBuffer } };

        constructor(context3D: WebGLRenderingContext, object3D: Object3D) {
            this.context3D = context3D;
            this.object3D = object3D;
        }

        /**
         * 激活缓冲
         */
        active() {

            this.activeProgram();
            this.activeAttributes();
            this.activeUniforms();
            this.draw();
        }

        /**
         * 激活程序
         */
        public activeProgram() {

            //从Object3D中获取顶点缓冲
            var eventData: GetProgramBufferEventData = { buffer: null };
            this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_PROGRAMBUFFER, eventData), Number.MAX_VALUE);
            assert(eventData.buffer != null);
            this.programBuffer = eventData.buffer;
            this.programBuffer.active(this.context3D);
        }

        /**
         * 激活属性
         */
        private activeAttributes() {

            if (this.attributes == null) {
                this.attributes = this.programBuffer.getAttribLocations(this.context3D);
                this.prepareAttributeBuffers(this.attributes);
            }

            for (var name in this.attributes) {
                if (this.attributes.hasOwnProperty(name)) {
                    var element = this.attributes[name];
                    var squareVerticesBuffer = Context3DBufferCenter.getInstance(this.context3D)//
                        .getVABuffer(element.buffer.data);
                    this.context3D.bindBuffer(WebGLRenderingContext.ARRAY_BUFFER, squareVerticesBuffer);
                    this.context3D.vertexAttribPointer(element.location, 3, WebGLRenderingContext.FLOAT, false, 0, 0);
                }
            }
        }

        /**
         * 准备顶点缓冲列表
         */
        private prepareAttributeBuffers(attributes: { [name: string]: { buffer?: AttributeBuffer } }) {

            for (var name in attributes) {
                //从Object3D中获取顶点缓冲
                var eventData: GetAttributeBufferEventData = { name: name, buffer: null };
                this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_ATTRIBUTEBUFFER, eventData), Number.MAX_VALUE);
                assert(eventData.buffer != null);

                attributes[name].buffer = eventData.buffer;
            }
        }

        /**
         * 激活常量
         */
        activeUniforms() {

            if (this.uniforms == null) {

                this.uniforms = this.programBuffer.getUniforms(this.context3D);
                this.prepareUniformBuffers(this.uniforms);
            }

            //获取属性在gpu中地址
            var shaderProgram = this.programBuffer.getShaderProgram(this.context3D);

            for (var name in this.uniforms) {
                if (this.uniforms.hasOwnProperty(name)) {
                    var element = this.uniforms[name];
                    var location = this.context3D.getUniformLocation(shaderProgram, name);
                    this.context3D.uniformMatrix4fv(location, false, element.buffer.matrix.rawData);
                }
            }
        }

        /**
         * 准备顶点缓冲列表
         */
        private prepareUniformBuffers(uniforms: { [name: string]: { buffer?: UniformBuffer } }) {

            for (var name in uniforms) {
                //从Object3D中获取顶点缓冲
                var eventData: GetUniformBufferEventData = { name: name, buffer: null };
                this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_UNIFORMBUFFER, eventData), Number.MAX_VALUE);
                assert(eventData.buffer != null);

                uniforms[name].buffer = eventData.buffer;
            }
        }

        /**
         * 绘制
         */
        private draw() {

            if (this.indexBuffer == null) {

                //从Object3D中获取顶点缓冲
                var eventData: GetIndexBufferEventData = { buffer: null };
                this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_INDEXBUFFER, eventData), Number.MAX_VALUE);
                assert(eventData.buffer != null);
                this.indexBuffer = eventData.buffer;
            }

            var buffer = Context3DBufferCenter.getInstance(this.context3D)//
                .getIndexBuffer(this.indexBuffer.indices);

            var count = this.indexBuffer.indices.length;
            this.context3D.bindBuffer(WebGLRenderingContext.ELEMENT_ARRAY_BUFFER, buffer);
            this.context3D.drawElements(WebGLRenderingContext.TRIANGLES, count, WebGLRenderingContext.UNSIGNED_SHORT, 0);
        }
    }
}