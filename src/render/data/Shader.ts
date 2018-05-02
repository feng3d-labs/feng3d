namespace feng3d
{
    /**
     * shader
     */
    export class Shader
    {
        shaderName: string;

        /**
         * 激活渲染程序
         */
        activeShaderProgram(gl: GL)
        {
            var shader = shaderlib.getShader(this.shaderName);

            if (!shader) return null;

            //渲染程序
            var shaderProgram = this._webGLProgramMap.get(gl);
            if (!shaderProgram)
            {
                shaderProgram = gl.createProgram(shader.vertex, shader.fragment);
                if (!shaderProgram)
                    return null;
                this._webGLProgramMap.set(gl, shaderProgram);
            }
            gl.useProgram(shaderProgram);
            return shaderProgram;
        }

        /**
         * 纹理缓冲
         */
        protected _webGLProgramMap = new Map<GL, WebGLProgram>();

        private clear()
        {
            this._webGLProgramMap.forEach((value, key) =>
            {
                value.destroy();
            });
            this._webGLProgramMap.clear();
        }
    }
}