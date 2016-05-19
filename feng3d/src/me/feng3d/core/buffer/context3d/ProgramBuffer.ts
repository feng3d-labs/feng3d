module me.feng3d {

    /**
     * 渲染程序缓存
     * @author feng 2016-05-09
     */
    export class ProgramBuffer extends Context3DBuffer {

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
         * 顶点渲染程序代码
         */
        public vertexCode: string;
        /**
         * 片段渲染程序代码
         */
        public fragmentCode: string;

        /**
         * @param vertexCode        顶点渲染程序代码
         * @param fragmentCode      片段渲染程序代码
         */
        constructor(vertexCode: string, fragmentCode: string) {
            super();

            this.vertexCode = vertexCode;
            this.fragmentCode = fragmentCode;
        }

        /**
         * 使用程序缓冲
         */
        public doBuffer(gl: WebGLRenderingContext) {

            if (this.shaderProgram != null) {

                this.vertexShaderProgram = ShaderProgram.getInstance(this.vertexCode, ShaderType.VERTEX);
                this.fragementShaderProgram = ShaderProgram.getInstance(this.fragmentCode, ShaderType.FRAGMENT);

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

        /**
         * 更新渲染程序
         */
        public update(vertexCode: string, fragmentCode: string) {
            this.vertexCode = vertexCode;
            this.fragmentCode = fragmentCode;
        }
    }
}