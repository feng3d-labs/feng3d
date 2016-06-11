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
            this.activeUniforms(programBuffer);
        }

        /**
         * 激活常量
         */
        activeUniforms(programBuffer: ProgramBuffer) {

            //             var mvMatrix = object3D.space3D.transform3D;
            // this.mvUniform = this.mvUniform || this.context3D.getUniformLocation(this.shaderProgram, "uMVMatrix");
            // this.context3D.uniformMatrix4fv(this.mvUniform, false, new Float32Array(mvMatrix.rawData));

            var uniformLocations: ProgramUniformLocation[] = programBuffer.getUniformLocations();

            var uniformBuffers = this.getUniformBuffers(uniformLocations);

        }

        /**
         * 获取常量缓冲列表
         */
        getUniformBuffers(uniformLocations: ProgramUniformLocation[]) {

            var uniformBuffers: { [key: string]: UniformBuffer } = {};
            for (var i = 0; i < uniformLocations.length; i++) {
                var uniformLocation = uniformLocations[i];

                //从Object3D中获取常量缓冲
                var eventData: GetUniformBufferEventData = { uniformLocation: uniformLocation, uniformBuffer: null };
                this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_ATTRIBUTEBUFFER, eventData), Number.MAX_VALUE);
                assert(eventData.uniformBuffer != null);
                uniformBuffers[uniformLocation.name] = eventData.uniformBuffer;
            }
            return uniformBuffers;
        }

        /**
         * 激活属性
         */
        activeAttributes(programBuffer: ProgramBuffer) {

            var attribLocations: ProgramAttributeLocation[] = programBuffer.getAttribLocations();

            var attributeBuffers = this.getAttributeBuffers(attribLocations);

            for (var i = 0; i < attribLocations.length; i++) {
                var attribLocation = attribLocations[i];
                var vaBuffer = attributeBuffers[attribLocation.name];
                vaBuffer.active(this.context3D, attribLocation.location);
            }
        }

        /**
         * 获取顶点缓冲列表
         */
        getAttributeBuffers(attribLocations: ProgramAttributeLocation[]) {

            var attributeBuffers: { [key: string]: AttributeBuffer } = {};
            for (var i = 0; i < attribLocations.length; i++) {
                var attribLocation = attribLocations[i];

                //从Object3D中获取顶点缓冲
                var eventData: GetAttributeBufferEventData = { attribLocation: attribLocation, attributeBuffer: null };
                this.object3D.dispatchChildrenEvent(new Context3DBufferEvent(Context3DBufferEvent.GET_ATTRIBUTEBUFFER, eventData), Number.MAX_VALUE);
                assert(eventData.attributeBuffer != null);
                attributeBuffers[attribLocation.name] = eventData.attributeBuffer;
            }
            return attributeBuffers;
        }
    }
}