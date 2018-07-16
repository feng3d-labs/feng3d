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

        /**
         * shader 中的 宏
         */
        shaderMacro: ShaderMacro = <any>{};

        //
        resultVertexCode: string;
        resultFragmentCode: string;

        constructor(shaderName: string)
        {
            this.shaderName = shaderName;
        }

        /**
         * 激活渲染程序
         */
        activeShaderProgram(gl: GL)
        {
            // 获取着色器代码
            if (this.vertex == null || this.fragment == null)
            {
                var shader = shaderlib.shaderConfig.shaders[this.shaderName];
                this.vertex = shaderlib.uninclude(shader.vertex);
                this.fragment = shaderlib.uninclude(shader.fragment);
            }

            // 获取宏定义
            var shaderMacroStr = this.getMacroCode(this.shaderMacro);

            var resultVertexCode = this.vertex.replace(/#define\s+macros/, shaderMacroStr);
            var resultFragmentCode = this.fragment.replace(/#define\s+macros/, shaderMacroStr);

            if (this.resultVertexCode != resultVertexCode || resultFragmentCode != this.resultFragmentCode)
            {
                this.clear();
                this.resultVertexCode = resultVertexCode;
                this.resultFragmentCode = resultFragmentCode;
            }

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

        private getMacroCode(macro: ShaderMacro)
        {
            var macroHeader = "";
            var macroNames = Object.keys(macro);
            macroNames = macroNames.sort();
            macroNames.forEach(macroName =>
            {
                var value = macro[macroName];
                if (typeof value == "boolean")
                {
                    value && (macroHeader += `#define ${macroName}\n`);
                } else
                {
                    macroHeader += `#define ${macroName} ${value}\n`;
                }
            });
            return macroHeader;
        }

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