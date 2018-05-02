namespace feng3d
{
    /**
     * shader
     */
    export class Shader
    {
        //
        private _resultVertexCode: string;
        private _resultFragmentCode: string;

        renderAtomic: RenderAtomic

        constructor(renderAtomic: RenderAtomic)
        {
            this.renderAtomic = renderAtomic;
        }

        /**
         * 激活渲染程序
         */
        activeShaderProgram(gl: GL)
        {
            if (this.renderAtomic.macroInvalid)
            {
                this.renderAtomic.macroInvalid = false;
                this.clear();

                var shader = shaderlib.getShader(this.renderAtomic.shadername);
                //应用宏
                var shaderMacroStr = this.getMacroCode(this.renderAtomic.shaderMacro);
                this._resultVertexCode = shader.vertex.replace(/#define\s+macros/, shaderMacroStr);
                this._resultFragmentCode = shader.fragment.replace(/#define\s+macros/, shaderMacroStr);
            }

            //渲染程序
            var shaderProgram = this._webGLProgramMap.get(gl);
            if (!shaderProgram)
            {
                shaderProgram = gl.createProgram(this._resultVertexCode, this._resultFragmentCode);
                if (!shaderProgram)
                    return null;
                this._webGLProgramMap.set(gl, shaderProgram);
                shaderProgram.vertexCode = this._resultVertexCode;
                shaderProgram.fragmentCode = this._resultFragmentCode;
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