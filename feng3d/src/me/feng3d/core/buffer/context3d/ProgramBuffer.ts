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
         * 顶点渲染程序代码
         */
        public vertexCode: string;
        /**
         * 片段渲染程序代码
         */
        public fragmentCode: string;

        /**
         * 使用程序缓冲
         */
        public doBuffer(gl: WebGLRenderingContext) {

            if (this.shaderProgram != null) {
                var vertexShader = this.getShader(gl, this.vertexCode, 1);
                var fragmentShader = this.getShader(gl, this.fragmentCode, 2);

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
         * 获取程序属性列表
         */
        getAttributes() {

            var attributeReg = /attribute\s+(\w+)\s+(\w+)/g;
            var result = attributeReg.exec(this.vertexCode);

            var attributes: ProgramAttribute[] = [];
            while (result) {
                var attribute = new ProgramAttribute();
                attribute.type = result[1];
                attribute.name = result[2];
                result = attributeReg.exec(this.vertexCode);
            }

            return attributes;
        }

        /**
         * 获取程序常量列表
         */
        getUniforms() {

            var uniforms: ProgramUniform[] = [];

            var uniformReg = /uniform\s+(\w+)\s+(\w+)/g;
            var result = uniformReg.exec(this.vertexCode);

            while (result) {
                var attribute = new ProgramAttribute();
                attribute.type = result[1];
                attribute.name = result[2];
                result = uniformReg.exec(this.vertexCode);
            }

            return uniforms;
        }

        /**
         * 获取渲染程序
         */
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

        /**
         * 更新渲染程序
         */
        public update(vertexCode: string, fragmentCode: string) {
            this.vertexCode = vertexCode;
            this.fragmentCode = fragmentCode;
        }
    }
}