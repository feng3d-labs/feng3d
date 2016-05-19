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

        private programBuffer: ProgramBuffer;

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

            this.programBuffer = new ProgramBuffer(this.vertexShaderStr, this.fragmentShaderStr);

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
        pUniform: WebGLUniformLocation
        private setMatrixUniforms() {

            var perspectiveMatrix = this.getPerspectiveMatrix();
            this.pUniform = this.pUniform || this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
            this.gl.uniformMatrix4fv(this.pUniform, false, new Float32Array(perspectiveMatrix.rawData));
        }

        private getPerspectiveMatrix(): Matrix3D {

            var camSpace3D = this.camera.space3D;
            var camera = this.camera.getComponentByClass(Camera);

            var perspectiveMatrix = camSpace3D.transform3D;
            perspectiveMatrix.invert();
            perspectiveMatrix.append(camera.projectionMatrix3D);

            return perspectiveMatrix;
        }
        mvUniform: WebGLUniformLocation
        private drawObject3D(object3D: Object3D) {

            var object3DBuffer = object3DBufferManager.getBuffer(this.gl, object3D);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, object3DBuffer.squareVerticesBuffer);
            this.gl.vertexAttribPointer(this.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);

            var mvMatrix = object3D.space3D.transform3D;
            this.mvUniform = this.mvUniform || this.gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
            this.gl.uniformMatrix4fv(this.mvUniform, false, new Float32Array(mvMatrix.rawData));

            this.setMatrixUniforms();
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, object3DBuffer.indexBuffer);
            this.gl.drawElements(this.gl.TRIANGLES, object3DBuffer.count, this.gl.UNSIGNED_SHORT, 0);
        }
    }

    class Object3DBuffer {

        squareVerticesBuffer: WebGLBuffer;
        indexBuffer: WebGLBuffer;
        count: number;
    }

    class Object3DBufferManager {

        map = new Map<WebGLRenderingContext, Map<Object3D, Object3DBuffer>>();

        getBuffer(gl: WebGLRenderingContext, object3D: Object3D) {

            var glMap = this.map.get(gl);
            if (glMap == null) {
                glMap = new Map<Object3D, Object3DBuffer>();
                this.map.push(gl, glMap);
            }

            var buffer = glMap.get(object3D);

            if (buffer == null) {
                buffer = new Object3DBuffer();
                glMap.push(object3D, buffer);

                var geometry = object3D.getComponentByClass(Geometry);
                var positionData = geometry.getVAData(GLAttribute.position);
                // Create a buffer for the square's vertices.
                var squareVerticesBuffer = buffer.squareVerticesBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);

                // var vaBuffer = new VABuffer(GLAttribute.position);

                var indices = geometry.indices;
                var indexBuffer = buffer.indexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

                buffer.count = indices.length;
            }

            return buffer;
        }
    }

    var object3DBufferManager = new Object3DBufferManager();
}