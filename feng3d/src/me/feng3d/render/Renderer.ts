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
		 * 渲染
		 */
        public render() {
            this.context3D.clear(this.context3D.COLOR_BUFFER_BIT | this.context3D.DEPTH_BUFFER_BIT);

            var renderables = this.scene.getRenderables();
            renderables.forEach(element => {
                this.drawObject3D(element);
            });
        }

        /**
         * 绘制3D对象
         */
        private drawObject3D(object3D: Object3D) {

            var context3DBuffer = object3D.getOrCreateComponentByClass(Context3DBuffer);

            //模型矩阵
            var mvMatrix = object3D.space3D.transform3D;
            context3DBuffer.mapUniformBuffer(Context3DBufferID.uMVMatrix, mvMatrix);

            //计算投影矩阵
            var perspectiveMatrix = this.camera.space3D.transform3D.clone();
            var camera = this.camera.getComponentByClass(Camera);
            perspectiveMatrix.invert();
            perspectiveMatrix.append(camera.projectionMatrix3D);
            context3DBuffer.mapUniformBuffer(Context3DBufferID.uPMatrix, perspectiveMatrix);

            //绘制对象
            var renderData = RenderData.getInstance(object3D);
            var object3DBuffer = renderData.getRenderBuffer(this.context3D);
            object3DBuffer.active();

        }
    }
}