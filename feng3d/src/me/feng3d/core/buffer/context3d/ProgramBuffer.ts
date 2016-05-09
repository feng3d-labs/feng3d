module me.feng3d {

    /**
     * 渲染程序缓存
     * @author feng 2016-05-09
     */
    export class ProgramBuffer extends Context3DBuffer{

        private shaderProgram: WebGLProgram;
        public vertexCode: string;
        public fragmentCode: string;

        public doBuffer(gl: WebGLRenderingContext){
            
            if(this.shaderProgram != null)
            {
                var vertexShader = this.getShader(gl,this.vertexCode, 1);
                var fragmentShader = this.getShader(gl,this.fragmentCode, 2);

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

            this.vertexPositionAttribute = gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
            gl.enableVertexAttribArray(this.vertexPositionAttribute);
        }

        getAttributes(){
            
            var attributeReg = /attribute\s+(\w+)\s+(\w+)/g;
            var result = attributeReg.exec(this.vertexCode);
            var attribute = {type:result[1],name:result[1]}
            
        }

        private getShader(gl: WebGLRenderingContext,theSource: string, type: number) {

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

        public update(vertexCode: string, fragmentCode: string) {
            this.vertexCode = vertexCode;
            this.fragmentCode = fragmentCode;
        }
    }
}