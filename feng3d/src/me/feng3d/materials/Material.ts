module me.feng3d {

    /**
     * 材质
     * @author feng 2016-05-02
     */
    export class Material extends Component {


        vertexShaderStr = //
        `
attribute vec3 vaPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void) {
    gl_Position = uPMatrix * uMVMatrix * vec4(vaPosition, 1.0);
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
            this.context3DBuffer.mapProgramBuffer(this.vertexShaderStr, this.fragmentShaderStr);
        }

        /**
         * Context3D数据缓冲
         */
        get context3DBuffer(): Context3DBuffer {
            return this.getOrCreateComponentByClass(Context3DBuffer);
        }

        // protected initBuffers(): void {
        //     mapContext3DBuffer(_.projection_vc_matrix, updateProjectionBuffer);
        //     mapContext3DBuffer(_.program, updateProgramBuffer);
        // }

        private initShaders(gl: WebGLRenderingContext) {
            var vertexShader = this.getShader(gl, this.vertexShaderStr, 1);
            var fragmentShader = this.getShader(gl, this.fragmentShaderStr, 2);

            // Create the shader program

            var shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertexShader);
            gl.attachShader(shaderProgram, fragmentShader);
            gl.linkProgram(shaderProgram);

            // If creating the shader program failed, alert

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                alert("Unable to initialize the shader program.");
            }

            gl.useProgram(shaderProgram);

            var vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(vertexPositionAttribute);
        }
        private getShader(gl: WebGLRenderingContext, theSource: string, type: number) {

            // Now figure out what type of shader script we have,
            // based on its MIME type.

            var shader: WebGLShader;

            if (type == 2) {
                shader = gl.createShader(gl.FRAGMENT_SHADER);
            } else if (type == 1) {
                shader = gl.createShader(gl.VERTEX_SHADER);
            } else {
                return null;  // Unknown shader type
            }

            // Send the source to the shader object

            gl.shaderSource(shader, theSource);

            // Compile the shader program

            gl.compileShader(shader);

            // See if it compiled successfully

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
                return null;
            }

            return shader;
        }


    }
}