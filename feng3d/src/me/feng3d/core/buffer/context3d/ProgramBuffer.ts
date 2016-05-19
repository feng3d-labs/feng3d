module me.feng3d {

    /**
     * 渲染程序缓存
     * @author feng 2016-05-09
     */
    export class ProgramBuffer extends Context3DBuffer {

        /**
         * 渲染程序代码
         */
        private code: ShaderProgramCode;

        /**
         * 渲染程序
         */
        private shaderProgram: WebGLProgram;

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
         * @param code        渲染程序代码
         */
        constructor(code: ShaderProgramCode) {
            super();

            this.code = code;
        }

        /**
         * 使用程序缓冲
         */
        public doBuffer(gl: WebGLRenderingContext) {

            if (this.shaderProgram != null) {

                this.vertexShaderProgram = ShaderProgram.getInstance(this.code.vertexCode, ShaderType.VERTEX);
                this.fragementShaderProgram = ShaderProgram.getInstance(this.code.fragmentCode, ShaderType.FRAGMENT);

                var vertexShader = this.vertexShaderProgram.getShader(gl);
                var fragmentShader = this.fragementShaderProgram.getShader(gl);

                // Create the shader program
                this.shaderProgram = gl.createProgram();
                gl.attachShader(this.shaderProgram, vertexShader);
                gl.attachShader(this.shaderProgram, fragmentShader);
                gl.linkProgram(this.shaderProgram);

                // If creating the shader program failed, alert

                if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS)) {
                    alert("Unable to initialize the shader program.");
                }
            }

            gl.useProgram(this.shaderProgram);
        }
    }
}