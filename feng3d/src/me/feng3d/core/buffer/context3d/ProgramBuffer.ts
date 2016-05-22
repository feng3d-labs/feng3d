module me.feng3d {

    /**
     * 渲染程序缓存
     * @author feng 2016-05-09
     */
    export class ProgramBuffer {

        /**
         * 渲染程序代码
         */
        private code: ShaderProgramCode;

        /**
         * webgl渲染上下文
         */
        private context3D: WebGLRenderingContext;

        private _shaderProgram: WebGLProgram;

        /**
         * 顶点渲染程序
         */
        private vertexShaderProgram: ShaderProgram;

        /**
         * 片段渲染程序
         */
        private fragementShaderProgram: ShaderProgram;

        /**
         * 创建渲染程序缓存
         * @param code          渲染程序代码
         * @param context3D     webgl渲染上下文
         */
        constructor(code: ShaderProgramCode, context3D: WebGLRenderingContext) {

            this.code = code;
            this.context3D = context3D;
        }

        /**
         * 渲染程序
         */
        get shaderProgram(): WebGLProgram {

            if (this._shaderProgram == null) {
                this.init();
            }
            return this._shaderProgram;
        }

        /**
         * 初始化
         */
        private init() {

            this.vertexShaderProgram = ShaderProgram.getInstance(this.code.vertexCode, ShaderType.VERTEX);
            this.fragementShaderProgram = ShaderProgram.getInstance(this.code.fragmentCode, ShaderType.FRAGMENT);

            var vertexShader = this.vertexShaderProgram.getShader(this.context3D);
            var fragmentShader = this.fragementShaderProgram.getShader(this.context3D);

            // 创建渲染程序
            var shaderProgram = this._shaderProgram = this.context3D.createProgram();
            this.context3D.attachShader(shaderProgram, vertexShader);
            this.context3D.attachShader(shaderProgram, fragmentShader);
            this.context3D.linkProgram(shaderProgram);

            // 渲染程序创建失败时给出弹框
            if (!this.context3D.getProgramParameter(shaderProgram, this.context3D.LINK_STATUS)) {
                alert("Unable to initialize the shader program.");
            }
        }

        /**
         * 获取渲染程序缓存
         * @param code          渲染程序代码
         * @param gl            webgl渲染上下文
         */
        static getBuffer(code: ShaderProgramCode, gl: WebGLRenderingContext) {
            var programBuffer = new ProgramBuffer(code, gl);
            return programBuffer;
        }
    }
}