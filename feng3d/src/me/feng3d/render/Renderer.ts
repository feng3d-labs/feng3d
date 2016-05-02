module me.feng3d {

    /**
     * 渲染器
     * @author feng 2016-05-01
     */
    export class Renderer {

        private gl: WebGLRenderingContext;
        private shaderProgram: WebGLProgram;
        private vertexPositionAttribute: number;
        private scene: Scene3D;
        private camera: Object3D

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

        /**
         * 构建渲染器
         * @param gl    webgl渲染上下文
         * @param scene 场景
         * @param camera 摄像机对象
         */
        constructor(gl: WebGLRenderingContext, scene: Scene3D, camera: Object3D) {
            this.gl = gl;
            this.scene = scene;
            this.camera = camera;


            this.initGL();

            this.initShaders();
        }

        private initGL() {
            this.gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
            this.gl.clearDepth(1.0);                 // Clear everything
            this.gl.enable(this.gl.DEPTH_TEST);           // Enable depth testing
            this.gl.depthFunc(this.gl.LEQUAL);            // Near things obscure far things
        }

        private initShaders() {
            var vertexShader = this.getShader(this.vertexShaderStr, 1);
            var fragmentShader = this.getShader(this.fragmentShaderStr, 2);

            // Create the shader program

            this.shaderProgram = this.gl.createProgram();
            this.gl.attachShader(this.shaderProgram, vertexShader);
            this.gl.attachShader(this.shaderProgram, fragmentShader);
            this.gl.linkProgram(this.shaderProgram);

            // If creating the shader program failed, alert

            if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
                alert("Unable to initialize the shader program.");
            }

            this.gl.useProgram(this.shaderProgram);

            this.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
            this.gl.enableVertexAttribArray(this.vertexPositionAttribute);
        }

        /**
		 * 渲染
		 */
        public render() {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

            var renderables = this.scene.getRenderables();
            renderables.forEach(element => {
                this.drawObject3D(element);
            });
        }

        private getShader(theSource: string, type: number) {

            // Now figure out what type of shader script we have,
            // based on its MIME type.

            var shader: WebGLShader;

            if (type == 2) {
                shader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
            } else if (type == 1) {
                shader = this.gl.createShader(this.gl.VERTEX_SHADER);
            } else {
                return null;  // Unknown shader type
            }

            // Send the source to the shader object

            this.gl.shaderSource(shader, theSource);

            // Compile the shader program

            this.gl.compileShader(shader);

            // See if it compiled successfully

            if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                alert("An error occurred compiling the shaders: " + this.gl.getShaderInfoLog(shader));
                return null;
            }

            return shader;
        }

        private setMatrixUniforms() {

            var perspectiveMatrix = this.getPerspectiveMatrix();
            var pUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
            this.gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.rawData));
        }

        private getPerspectiveMatrix(): Matrix3D {

            var camSpace3D = this.camera.space3D;
            var camera = this.camera.getComponentByClass(Camera);

            var perspectiveMatrix = camSpace3D.transform3D;
            perspectiveMatrix.invert();
            perspectiveMatrix.append(camera.projectionMatrix3D);

            return perspectiveMatrix;
        }

        private drawObject3D(object3D: Object3D) {

            var object3DBuffer = object3DBufferManager.getBuffer(this.gl, object3D);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object3DBuffer.squareVerticesBuffer);
            this.gl.vertexAttribPointer(this.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

            var mvMatrix = object3D.space3D.transform3D;
            var mvUniform = this.gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
            this.gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.rawData));

            this.setMatrixUniforms();
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        }
    }

    class Object3DBuffer {

        squareVerticesBuffer: WebGLBuffer;
    }

    class Object3DBufferManager {

        buffer: Object3DBuffer;

        getBuffer(gl: WebGLRenderingContext, object3D: Object3D) {

            if (this.buffer == null) {
                this.buffer = new Object3DBuffer();

                var geometry = object3D.getComponentByClass(Geometry);
                var positionData = geometry.getVAData(GLAttribute.position);

                // Create a buffer for the square's vertices.
                var squareVerticesBuffer = this.buffer.squareVerticesBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);
            }

            return this.buffer;
        }
    }

    var object3DBufferManager = new Object3DBufferManager();
}