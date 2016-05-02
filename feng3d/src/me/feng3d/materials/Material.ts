module me.feng3d {

    /**
     * 材质
     * @author feng 2016-05-02
     */
    export class Material extends Context3DBufferOwner {


        vertexShaderStr = //
        `
attribute vec3 aVertexPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}`;
        fragmentShaderStr = //
        `
void main(void) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}`;


        pass: MaterialPass;

        /**
         * 构建材质
         */
        constructor() {
            super();
            this.pass = new MaterialPass();
        }

        // protected initBuffers(): void {
        //     mapContext3DBuffer(_.projection_vc_matrix, updateProjectionBuffer);
        //     mapContext3DBuffer(_.program, updateProgramBuffer);
        // }

    }
}