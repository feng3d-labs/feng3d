namespace feng3d
{

    export class ShaderCode extends RenderElement
    {
        /**
         * 渲染程序代码
         */
        public get code()
        {
            return this._code;
        }
        public set code(value)
        {
            this._code = value;
            this.dispatchEvent(new Event(Event.CHANGE));
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
        constructor(public name: string, public value: number | (() => number))
        {
            super();
            this.type = MacroType.value;
        }
    }

    export class BoolMacro extends Macro
    {
        constructor(public name: string, public value: boolean | (() => boolean))
        {
            super();
            this.type = MacroType.bool;
        }
    }

    export class AddMacro extends Macro
    {
        constructor(public name: string, public value: number | (() => number))
        {
            super();
            this.type = MacroType.add;
        }
    }

    export class ShaderParam extends RenderElement
    {
        public value:any;
        constructor(public name:string)
        {
            super();
        }
    }

    export class ShaderRenderData
    {
        public uuid: string;
        public version: number;
        //
        private _invalid = true;
        private _resultVertexCode: string;
        private _resultFragmentCode: string;

        public setShaderCode(shaderCode: ShaderCode)
        {
            this.shaderCode = shaderCode;
        }
        private shaderCode: ShaderCode;

        /**
         * 渲染参数
         */
        public shaderParams: ShaderParams = <any>{};

        public addMacro(macro: Macro)
        {
            var index = this.macros.indexOf(macro);
            if (index == - 1)
            {
                this.macros.push(macro);
            }
        }

        public removeMacro(macro: Macro)
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
        public activeShaderProgram(gl: GL)
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

        public invalidate()
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