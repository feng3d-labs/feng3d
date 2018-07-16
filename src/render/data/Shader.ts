namespace feng3d
{
    /**
     * shader
     */
    export class Shader
    {
        /**
         * 着色器名称
         */
        private shaderName: string;
        /**
         * 顶点着色器代码
         */
        private vertex: string;
        /**
         * 片段着色器代码
         */
        private fragment: string
        /**
         * 顶点着色器宏变量列表
         */
        private vertexMacroVariables: string[];
        /**
         * 片段着色器宏变量列表
         */
        private fragmentMacroVariables: string[];

        private macroValues = {};

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
                this.vertexMacroVariables = shaderMacroUtils.getMacroVariablesFromCode(this.vertex);
                this.fragmentMacroVariables = shaderMacroUtils.getMacroVariablesFromCode(this.fragment);
            }

            var vertexMacroInvalid = false;
            for (let i = 0; i < this.vertexMacroVariables.length; i++)
            {
                const macroVariable = this.vertexMacroVariables[i];
                var value = this.shaderMacro[macroVariable];
                if (this.macroValues[macroVariable] != value)
                {
                    this.macroValues[macroVariable] = value;
                    vertexMacroInvalid = true;
                }
            }
            var fragmentMacroInvalid = false;
            for (let i = 0; i < this.fragmentMacroVariables.length; i++)
            {
                const macroVariable = this.fragmentMacroVariables[i];
                var value = this.shaderMacro[macroVariable];
                if (this.macroValues[macroVariable] != value)
                {
                    this.macroValues[macroVariable] = value;
                    fragmentMacroInvalid = true;
                }
            }

            if (vertexMacroInvalid)
            {
                this.clear();
                this.resultVertexCode = this.vertex.replace(/#define\s+macros/, this.getMacroCode(this.vertexMacroVariables, this.macroValues));
            }

            if (fragmentMacroInvalid)
            {
                this.clear();
                this.resultFragmentCode = this.vertex.replace(/#define\s+macros/, this.getMacroCode(this.fragmentMacroVariables, this.macroValues));
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

        private getMacroCode(variables: string[], valueObj: Object)
        {
            var macroHeader = "";
            variables.forEach(macroName =>
            {
                var value = valueObj[macroName];
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