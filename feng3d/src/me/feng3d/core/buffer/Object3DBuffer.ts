module me.feng3d {

    /**
     * 3D对象缓冲
     */
    export class Object3DBuffer {

        private context3D: WebGLRenderingContext;
        squareVerticesBuffer: WebGLBuffer;
        indexBuffer: WebGLBuffer;
        count: number;

        constructor(context3D: WebGLRenderingContext) {
            this.context3D = context3D;
        }

        active(programBuffer: ProgramBuffer) {

            this.activeAttributes(programBuffer);
        }

        activeAttributes(programBuffer: ProgramBuffer) {

            var attribLocations: ProgramAttributeLocation[] = programBuffer.getAttribLocations();

            this.context3D.bindBuffer(this.context3D.ARRAY_BUFFER, this.squareVerticesBuffer);
            this.context3D.vertexAttribPointer(attribLocations[0].location, 3, this.context3D.FLOAT, false, 0, 0);
        }
    }
}