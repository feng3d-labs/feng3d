module me.feng3d {

    /**
     * 3D对象缓冲
     */
    export class Object3DBuffer {

        private context3D: WebGLRenderingContext;
        private object3D: Object3D;
        squareVerticesBuffer: WebGLBuffer;
        indexBuffer: WebGLBuffer;
        count: number;

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

            var attribLocations: ProgramAttributeLocation[] = programBuffer.getAttribLocations();

            var vaBuffers = this.getVaBuffers(attribLocations);

            for (var i = 0; i < attribLocations.length; i++) {
                var attribLocation = attribLocations[i];
                var vaBuffer = vaBuffers[attribLocation.name];
                vaBuffer.active(this.context3D, attribLocation.location);
            }
        }

        /**
         * 获取顶点缓冲列表
         */
        getVaBuffers(attribLocations: ProgramAttributeLocation[]) {

            var vaBuffers: { [key: string]: AttributeBuffer } = {};
            for (var i = 0; i < attribLocations.length; i++) {
                var attribLocation = attribLocations[i];

                //从Object3D中获取顶点缓冲
                var eventData: GetAttributeBufferEventData = { attribLocation: attribLocation, attributeBuffer: null };
                this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_ATTRIBUTEBUFFER, eventData), Number.MAX_VALUE);
                assert(eventData.attributeBuffer != null);
                vaBuffers[attribLocation.name] = eventData.attributeBuffer;
            }
            return vaBuffers;
        }
    }
}