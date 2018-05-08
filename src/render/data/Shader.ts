namespace feng3d
{
    /**
     * shader
     */
    export class Shader
    {
        private vertex: string;
        private fragment: string

        constructor(vertex: string, fragment: string)
        {
            this.vertex = vertex;
            this.fragment = fragment;
        }

        /**
         * 激活渲染程序
         */
        activeShaderProgram(gl: GL)
        {
            //渲染程序
            var shaderProgram = this._webGLProgramMap.get(gl);
            if (!shaderProgram)
            {
                shaderProgram = gl.createProgram(this.vertex, this.fragment);
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