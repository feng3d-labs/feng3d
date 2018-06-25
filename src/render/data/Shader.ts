namespace feng3d
{
    /**
     * shader
     */
    export class Shader
    {
        private shaderName: string;
        private vertex: string;
        private fragment: string
        private isInit = false;

        constructor(shaderName: string)
        {
            this.shaderName = shaderName;
        }

        private init()
        {
            if (this.isInit) return;

            var shader = shaderlib.shaderConfig.shaders[this.shaderName];

            this.vertex = shaderlib.uninclude(shader.vertex);
            this.fragment = shaderlib.uninclude(shader.fragment);

            this.isInit = true;
        }

        /**
         * 激活渲染程序
         */
        activeShaderProgram(gl: GL)
        {
            this.init();

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