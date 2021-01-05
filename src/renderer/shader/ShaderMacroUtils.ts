namespace feng3d
{
    /**
     * 着色器代码宏工具
     */
    export var shaderMacroUtils: ShaderMacroUtils;

    var shaderMacroKeys = ["if", "ifdef", "defined"];

    export class ShaderMacroUtils
    {
        /**
         * 从着色器代码中获取宏变量列表
         * @param vertex 
         * @param fragment 
         */
        getMacroVariablesFromShaderCode(vertex: string, fragment: string)
        {
            var variables0 = this.getMacroVariablesFromCode(vertex);
            var variables1 = this.getMacroVariablesFromCode(fragment);
            for (let i = 0; i < variables1.length; i++)
            {
                const element = variables1[i];
                if (variables0.indexOf(element) == -1)
                    variables0.push(element);
            }
            return variables0;
        }

        /**
         * 从着色器代码中获取宏变量列表
         * @param code 
         */
        getMacroVariablesFromCode(code: string)
        {
            var variables: string[] = [];
            var lines = code.split("\n");
            for (let i = 0; i < lines.length; i++)
            {
                const line = lines[i];
                if (line.indexOf("#if") != -1)
                {
                    var reg = /(\w+)/g;
                    var result: RegExpExecArray;
                    while (result = reg.exec(line))
                    {
                        var key = result[1];
                        if (key != null && isNaN(Number(key)) && shaderMacroKeys.indexOf(key) == -1 && variables.indexOf(key) == -1)
                            variables.push(key);
                    }
                }
            }
            return variables;
        }
    }

    shaderMacroUtils = new ShaderMacroUtils();
}