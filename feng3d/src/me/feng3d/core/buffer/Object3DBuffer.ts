module me.feng3d {

    /**
     * 3D对象缓冲
     */
    export class Object3DBuffer {

        private context3D: WebGLRenderingContext;
        private object3D: Object3D;
        squareVerticesBuffer: WebGLBuffer;

        constructor(context3D: WebGLRenderingContext, object3D: Object3D) {
            this.context3D = context3D;
            this.object3D = object3D;
        }

        /**
         * 激活缓冲
         */
        active(programBuffer: ProgramBuffer) {

            this.activeAttributes(programBuffer);
        }

        /**
         * 激活属性
         */
        activeAttributes(programBuffer: ProgramBuffer) {

            var attribLocations: { [name: string]: { type: string, location: number, attributeBuffer?: AttributeBuffer } } = programBuffer.getAttribLocations();

            this.prepareAttributeBuffers(attribLocations);

            for (var name in attribLocations) {
                if (attribLocations.hasOwnProperty(name)) {
                    var element = attribLocations[name];
                    element.attributeBuffer.active(this.context3D, element.location);
                }
            }
        }

        /**
         * 准备顶点缓冲列表
         */
        prepareAttributeBuffers(attribLocations: { [name: string]: { attributeBuffer?: AttributeBuffer } }) {

            for (var name in attribLocations) {
                //从Object3D中获取顶点缓冲
                var eventData: GetAttributeBufferEventData = { name: name, buffer: null };
                this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_ATTRIBUTEBUFFER, eventData), Number.MAX_VALUE);
                assert(eventData.buffer != null);

                attribLocations[name].attributeBuffer = eventData.buffer;
            }
        }

        /**
         * 激活属性
         */
        activeAttribute(attribLocation: ProgramAttributeLocation) {

            var squareVerticesBuffer = this.squareVerticesBuffer;
            if (squareVerticesBuffer == null) {
                var geometry = this.object3D.getComponentByClass(Geometry);
                // Create a buffer for the square's vertices.
                var positionData = geometry.getVAData(attribLocation.name);
                squareVerticesBuffer = this.squareVerticesBuffer = this.context3D.createBuffer();
                this.context3D.bindBuffer(this.context3D.ARRAY_BUFFER, squareVerticesBuffer);
                this.context3D.bufferData(this.context3D.ARRAY_BUFFER, positionData, this.context3D.STATIC_DRAW);
            }

            this.context3D.bindBuffer(this.context3D.ARRAY_BUFFER, this.squareVerticesBuffer);
            this.context3D.vertexAttribPointer(attribLocation.location, 3, this.context3D.FLOAT, false, 0, 0);
        }

        /**
         * 绘制
         */
        draw() {

            //从Object3D中获取顶点缓冲
            var eventData: GetIndexBufferEventData = { buffer: null };
            this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_INDEXBUFFER, eventData), Number.MAX_VALUE);
            assert(eventData.buffer != null);
            var indexBuffer = eventData.buffer.draw(this.context3D)
        }
    }
}