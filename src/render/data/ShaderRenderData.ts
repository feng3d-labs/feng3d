namespace feng3d
{

    export class ShaderCode extends RenderElement
    {
        /**
         * 渲染程序代码
         */
        get code()
        {
            return this._code;
        }
        set code(value)
        {
            this._code = value;
            this.dispatch("change");
        }

        private _code: { vertexCode: string, fragmentCode: string } | (() => { vertexCode: string, fragmentCode: string });

        constructor(code: { vertexCode: string, fragmentCode: string } | (() => { vertexCode: string, fragmentCode: string }))
        {
            super();
            this.code = code;
        }
    }

    export enum MacroType
    {
        value,
        bool,
        add
    }

    export class Macro extends RenderElement
    {
        type: MacroType;
        name: string;
        value: number | boolean | (() => boolean) | (() => number);
    }

    export class ValueMacro extends Macro
    {
        name: string;
        value: number | (() => number);
        constructor(name: string, value: number | (() => number))
        {
            super();
            this.type = MacroType.value;
            this.name = name;
            this.value = value;
        }
    }

    export class BoolMacro extends Macro
    {
        name: string;
        value: boolean | (() => boolean);
        constructor(name: string, value: boolean | (() => boolean))
        {
            super();
            this.type = MacroType.bool;
            this.name = name;
            this.value = value;
        }
    }

    export class AddMacro extends Macro
    {
        name: string;
        value: number | (() => number);
        constructor(name: string, value: number | (() => number))
        {
            super();
            this.type = MacroType.add;
            this.name = name;
            this.value = value;
        }
    }

    export class ShaderParam extends RenderElement
    {
        value: any;
        name: string;
        constructor(name: string)
        {
            super();
            this.name = name;
        }
    }

    export class ShaderRenderData
    {
        uuid: string;
        version: number;
        //
        private _invalid = true;
        private _resultVertexCode: string;
        private _resultFragmentCode: string;

        setShaderCode(shaderCode: ShaderCode)
        {
            this.shaderCode = shaderCode;
        }
        private shaderCode: ShaderCode;

        /**
         * 渲染参数
         */
        shaderParams: ShaderParams = <any>{};

        addMacro(macro: Macro)
        {
            var index = this.macros.indexOf(macro);
            if (index == - 1)
            {
                this.macros.push(macro);
            }
        }

        removeMacro(macro: Macro)
        {
            var index = this.macros.indexOf(macro);
            if (index != - 1)
            {
                this.macros.splice(index, 1);
            }
        }
        private macros: Macro[] = [];

        constructor()
        {
            Object.defineProperty(this, "uuid", { value: Math.generateUUID() });
            Object.defineProperty(this, "version", { value: 0, writable: true });
        }

        /**
         * 激活渲染程序
         */
        activeShaderProgram(gl: GL)
        {
            if (!this.shaderCode || !this.shaderCode.code)
                return null;

            // if (this._invalid)
            {
                //应用宏
                var shaderMacroStr = this.getMacroCode(this.macros);
                if (this.shaderCode.code instanceof Function)
                {
                    var code = this.shaderCode.code();
                    var vertexCode = code.vertexCode;
                    var fragmentCode = code.fragmentCode;
                } else
                {
                    var vertexCode = this.shaderCode.code.vertexCode;
                    var fragmentCode = this.shaderCode.code.fragmentCode;
                }

                this._resultVertexCode = vertexCode.replace(/#define\s+macros/, shaderMacroStr);
                this._resultFragmentCode = fragmentCode.replace(/#define\s+macros/, shaderMacroStr);
                this.version++;
            }

            //渲染程序
            var shaderProgram = gl.programs[this.uuid];
            if (shaderProgram)
            {
                if (shaderProgram.vertexCode != this._resultVertexCode || shaderProgram.fragmentCode != this._resultFragmentCode)
                // if (shaderProgram.version != this.version)
                {
                    shaderProgram.destroy();
                    shaderProgram = null;
                    delete gl.programs[this.uuid];
                }
            }
            if (!shaderProgram)
            {
                shaderProgram = gl.programs[this.uuid] = gl.createProgram(this._resultVertexCode, this._resultFragmentCode);
                shaderProgram.version = this.version;
                shaderProgram.vertexCode = this._resultVertexCode;
                shaderProgram.fragmentCode = this._resultFragmentCode;
            }
            gl.useProgram(shaderProgram);
            return shaderProgram;
        }

        invalidate()
        {
            this._invalid = true;
        }

        private getMacroCode(macros: Macro[])
        {
            var macro = { valueMacros: {}, boolMacros: {}, addMacros: {} };

            for (var i = 0; i < macros.length; i++)
            {
                var element = macros[i];
                var value = element.value;
                if (value instanceof Function)
                {
                    value = value();
                }
                switch (element.type)
                {
                    case MacroType.value:
                        macro.valueMacros[element.name] = value;
                        break;
                    case MacroType.bool:
                        macro.boolMacros[element.name] = macro.boolMacros[element.name] || value;
                        break;
                    case MacroType.add:
                        macro.boolMacros[element.name] = ~~macro.boolMacros[element.name] + <number>value;
                        break;
                }
            }

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