module me.feng3d {

    /**
     * 3D对象缓冲
     */
    export class Object3DBuffer {

        private context3D: WebGLRenderingContext;
        private object3D: Object3D;

        /**
         * 渲染程序缓存
         */
        programBuffer: ProgramBuffer;

        constructor(context3D: WebGLRenderingContext, object3D: Object3D) {
            this.context3D = context3D;
            this.object3D = object3D;
        }

        /**
         * 激活缓冲
         */
        active() {
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

            var attributes: { [name: string]: { type: string, location?: number, buffer?: AttributeBuffer } } = this.programBuffer.getAttribLocations(this.context3D);

            this.prepareAttributeBuffers(attributes);

            for (var name in attributes) {
                if (attributes.hasOwnProperty(name)) {
                    var element = attributes[name];
                    element.buffer.active(this.context3D, element.location);
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

        private activeUniforms() {

            var uniforms: { [name: string]: { type: string, location?: WebGLUniformLocation } } = this.programBuffer.getUniforms(this.context3D);

            // this.prepareUniformBuffers(uniforms);

            for (var name in uniforms) {
                if (uniforms.hasOwnProperty(name)) {
                    var element = uniforms[name];
                    element
                }
            }

        }

        /**
         * 准备顶点缓冲列表
         */
        private prepareUniformBuffers(uniforms: { [name: string]: { attributeBuffer?: AttributeBuffer } }) {

            for (var name in uniforms) {
                //从Object3D中获取顶点缓冲
                var eventData: GetAttributeBufferEventData = { name: name, buffer: null };
                this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_ATTRIBUTEBUFFER, eventData), Number.MAX_VALUE);
                assert(eventData.buffer != null);

                uniforms[name].attributeBuffer = eventData.buffer;
            }
        }


        /**
         * 绘制
         */
        private draw() {

            //从Object3D中获取顶点缓冲
            var eventData: GetIndexBufferEventData = { buffer: null };
            this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_INDEXBUFFER, eventData), Number.MAX_VALUE);
            assert(eventData.buffer != null);
            var indexBuffer = eventData.buffer;
            indexBuffer.draw(this.context3D);
        }
    }
}