module feng3d
{

    export class Shader
    {
        //
        private _invalid = true;
        private _resultVertexCode: string;
        private _resultFragmentCode: string;

        vertexCode: string | null;
        fragmentCode: string | null;

        /**
         * 渲染参数
         */
        shaderParams: ShaderParams = <any>{};

        get macro()
        {
            return this._macro;
        }
        set macro(value)
        {
            this._macro = value;
            this.invalidate();
        }
        private _macro = { boolMacros: <BoolMacros>{}, valueMacros: <ValueMacros>{}, addMacros: <IAddMacros>{} };

        /**
         * 激活渲染程序
         */
        activeShaderProgram(gl: GL)
        {
            if (!this.vertexCode || !this.fragmentCode)
                return null;

            if (this._invalid)
            {
                this._invalid = false;
                var gls = this._webGLProgramMap.getKeys();
                gls.forEach(element =>
                {
                    var shaderProgramTemp = this._webGLProgramMap.get(element);
                    if (shaderProgramTemp)
                    {
                        shaderProgramTemp.destroy();
                        this._webGLProgramMap.delete(element);
                    }
                });

                //应用宏
                var shaderMacroStr = this.getMacroCode(this.macro);

                this._resultVertexCode = this.vertexCode.replace(/#define\s+macros/, shaderMacroStr);
                this._resultFragmentCode = this.fragmentCode.replace(/#define\s+macros/, shaderMacroStr);
            }

            //渲染程序
            var shaderProgram = this._webGLProgramMap.get(gl);
            if (!shaderProgram)
            {
                shaderProgram = gl.createProgram(this._resultVertexCode, this._resultFragmentCode);
                this._webGLProgramMap.push(gl, shaderProgram);
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
        invalidate()
        {
            this._invalid = true;
        }

        private getMacroCode(macro: { boolMacros: BoolMacros, valueMacros: ValueMacros, addMacros: IAddMacros })
        {
            var macroHeader = "";
            var macroNames = Object.keys(macro.valueMacros);
            macroNames = macroNames.sort();
            macroNames.forEach(macroName =>
            {
                var value = macro.valueMacros[macroName];
                macroHeader += `#define ${macroName} ${value}\n`;
            });
            macroNames = Object.keys(macro.boolMacros);
            macroNames = macroNames.sort();
            macroNames.forEach(macroName =>
            {
                var value = macro.boolMacros[macroName];
                value && (macroHeader += `#define ${macroName}\n`);
            });

            macroNames = Object.keys(macro.addMacros);
            macroNames = macroNames.sort();
            macroNames.forEach(macroName =>
            {
                var value = macro.addMacros[macroName];
                macroHeader += `#define ${macroName} ${value}\n`;
            });
            return macroHeader;
        }
    }
}