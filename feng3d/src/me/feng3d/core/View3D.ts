module me.feng3d {

    /**
     * 3D视图
     * @author feng 2016-05-01
     */
    export class View3D {

        private gl: WebGLRenderingContext;
        private shaderProgram: WebGLProgram;
        private vertexPositionAttribute: number;
        private squareVerticesBuffer: WebGLBuffer;

        private _camera: Object3D;

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

        constructor(canvas, camera: Object3D = null) {

            assert(canvas instanceof HTMLCanvasElement, `canvas参数必须为 HTMLCanvasElement 类型！`);
            this._camera = camera || factory.createCamera();

            this.gl = canvas.getContext("experimental-webgl");
            this.gl || alert("Unable to initialize WebGL. Your browser may not support it.");

            this.initGL();

            this.initShaders();

            this.initBuffers();

            setInterval(this.drawScene.bind(this), 15);
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

        private initBuffers() {

            // Create a buffer for the square's vertices.
            this.squareVerticesBuffer = this.gl.createBuffer();

            // Select the squareVerticesBuffer as the one to apply vertex
            // operations to from here out.
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVerticesBuffer);

            var planeGeometry = me.feng3d.primitives.createPlane(1, 1);
            var positionData = planeGeometry.getVAData(me.feng3d.GLAttribute.position);

            // Now pass the list of vertices into WebGL to build the shape. We
            // do this by creating a Float32Array from the JavaScript array,
            // then use it to fill the current vertex buffer.
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positionData), this.gl.STATIC_DRAW);
        }

        private drawScene() {
            // Clear the canvas before we start drawing on it.

            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

            // Establish the perspective with which we want to view the
            // scene. Our field of view is 45 degrees, with a width/height
            // ratio of 640:480, and we only want to see objects between 0.1 units
            // and 100 units away from the camera.

            // Draw the square by binding the array buffer to the square's vertices
            // array, setting attributes, and pushing it to GL.

            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.squareVerticesBuffer);
            this.gl.vertexAttribPointer(this.vertexPositionAttribute, 3, this.gl.FLOAT, false, 0, 0);
            this.setMatrixUniforms();
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        }

        private setMatrixUniforms() {

            // var perspectiveMatrix = new me.feng3d.Matrix3D([1.8106601717798214, 0, 0, 0, 0, 2.4142135623730954, 0, 0, 0, 0, -1.002002002002002, -1, 0, 0, -0.20020020020020018, 0])
            var camSpace3D = this._camera.space3D;
            var camera = this._camera.getComponentByClass(Camera);

            var perspectiveMatrix = camSpace3D.transform3D.clone();
            perspectiveMatrix.invert();
            perspectiveMatrix.append(camera.projectionMatrix3D);

            var mvMatrix = this.objSpace3d.transform3D;

            var pUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
            this.gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.rawData));

            var mvUniform = this.gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
            this.gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.rawData));
        }

        /**
         * 物体空间
         */
        objSpace3d = new me.feng3d.Space3D(0, 0, 3, 90);
    }
}