module me.feng3d {

    /**
     * 渲染器
     * @author feng 2016-05-01
     */
    export class Renderer {

        private context3D: WebGLRenderingContext;
        private shaderProgram: WebGLProgram;
        private scene: Scene3D;
        private camera: Object3D

        private programBuffer: ProgramBuffer;

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

        /**
         * 构建渲染器
         * @param context3D    webgl渲染上下文
         * @param scene 场景
         * @param camera 摄像机对象
         */
        constructor(context3D: WebGLRenderingContext, scene: Scene3D, camera: Object3D) {
            this.context3D = context3D;
            this.scene = scene;
            this.camera = camera;

            this.initGL();

            this.initShaders();
        }

        /**
         * 初始化GL
         */
        private initGL() {
            this.context3D.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
            this.context3D.clearDepth(1.0);                 // Clear everything
            this.context3D.enable(this.context3D.DEPTH_TEST);           // Enable depth testing
            this.context3D.depthFunc(this.context3D.LEQUAL);            // Near things obscure far things
        }

        /**
         * 初始化渲染程序
         */
        private initShaders() {

            var shaderProgramCode = new ShaderProgramCode(this.vertexShaderStr, this.fragmentShaderStr);
            this.programBuffer = shaderProgramCode.getProgramBuffer(this.context3D);

            this.shaderProgram = this.programBuffer.shaderProgram;
            this.context3D.useProgram(this.shaderProgram);
        }

        /**
		 * 渲染
		 */
        public render() {
            this.context3D.clear(this.context3D.COLOR_BUFFER_BIT | this.context3D.DEPTH_BUFFER_BIT);

            var renderables = this.scene.getRenderables();
            renderables.forEach(element => {
                this.drawObject3D(element);
            });
        }

        pUniform: WebGLUniformLocation
        private setMatrixUniforms() {

            var perspectiveMatrix = this.getPerspectiveMatrix();
            this.pUniform = this.pUniform || this.context3D.getUniformLocation(this.shaderProgram, "uPMatrix");
            this.context3D.uniformMatrix4fv(this.pUniform, false, new Float32Array(perspectiveMatrix.rawData));
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

            var object3DBuffer = object3DBufferManager.getBuffer(this.context3D, object3D);

            object3DBuffer.active(this.programBuffer);

            var mvMatrix = object3D.space3D.transform3D;
            this.mvUniform = this.mvUniform || this.context3D.getUniformLocation(this.shaderProgram, "uMVMatrix");
            this.context3D.uniformMatrix4fv(this.mvUniform, false, new Float32Array(mvMatrix.rawData));

            this.setMatrixUniforms();
            this.context3D.bindBuffer(this.context3D.ELEMENT_ARRAY_BUFFER, object3DBuffer.indexBuffer);
            this.context3D.drawElements(this.context3D.TRIANGLES, object3DBuffer.count, this.context3D.UNSIGNED_SHORT, 0);
        }
    }
}