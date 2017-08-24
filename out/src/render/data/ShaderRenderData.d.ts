declare namespace feng3d {
    class ShaderCode extends RenderElement {
        /**
         * 渲染程序代码
         */
        code: {
            vertexCode: string;
            fragmentCode: string;
        } | (() => {
            vertexCode: string;
            fragmentCode: string;
        });
        private _code;
        constructor(code: {
            vertexCode: string;
            fragmentCode: string;
        } | (() => {
            vertexCode: string;
            fragmentCode: string;
        }));
    }
    enum MacroType {
        value = 0,
        bool = 1,
        add = 2,
    }
    class Macro extends RenderElement {
        type: MacroType;
        name: string;
        value: number | boolean | (() => boolean) | (() => number);
    }
    class ValueMacro extends Macro {
        name: string;
        value: number | (() => number);
        constructor(name: string, value: number | (() => number));
    }
    class BoolMacro extends Macro {
        name: string;
        value: boolean | (() => boolean);
        constructor(name: string, value: boolean | (() => boolean));
    }
    class AddMacro extends Macro {
        name: string;
        value: number | (() => number);
        constructor(name: string, value: number | (() => number));
    }
    class ShaderParam extends RenderElement {
        value: any;
        name: string;
        constructor(name: string);
    }
    class ShaderRenderData {
        uuid: string;
        version: number;
        private _invalid;
        private _resultVertexCode;
        private _resultFragmentCode;
        setShaderCode(shaderCode: ShaderCode): void;
        private shaderCode;
        /**
         * 渲染参数
         */
        shaderParams: ShaderParams;
        addMacro(macro: Macro): void;
        removeMacro(macro: Macro): void;
        private macros;
        constructor();
        /**
         * 激活渲染程序
         */
        activeShaderProgram(gl: GL): WebGLProgram;
        invalidate(): void;
        private getMacroCode(macros);
    }
}
