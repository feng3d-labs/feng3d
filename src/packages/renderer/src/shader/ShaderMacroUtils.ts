const shaderMacroKeys = ['if', 'ifdef', 'defined'];

export class ShaderMacroUtils
{
    /**
     * 从着色器代码中获取宏变量列表
     * @param vertex
     * @param fragment
     */
    getMacroVariablesFromShaderCode(vertex: string, fragment: string)
    {
        const variables0 = this.getMacroVariablesFromCode(vertex);
        const variables1 = this.getMacroVariablesFromCode(fragment);
        for (let i = 0; i < variables1.length; i++)
        {
            const element = variables1[i];
            if (variables0.indexOf(element) === -1)
            {
                variables0.push(element);
            }
        }

        return variables0;
    }

    /**
     * 从着色器代码中获取宏变量列表
     * @param code
     */
    getMacroVariablesFromCode(code: string)
    {
        const variables: string[] = [];
        const lines = code.split('\n');
        for (let i = 0; i < lines.length; i++)
        {
            const line = lines[i];
            if (line.indexOf('#if') !== -1)
            {
                const reg = /(\w+)/g;
                let result: RegExpExecArray = reg.exec(line);
                while (result)
                {
                    const key = result[1];
                    if (key !== null && isNaN(Number(key)) && shaderMacroKeys.indexOf(key) === -1 && variables.indexOf(key) === -1)
                    {
                        variables.push(key);
                    }
                    result = reg.exec(line);
                }
            }
        }

        return variables;
    }
}

/**
 * 着色器代码宏工具
 */
export const shaderMacroUtils = new ShaderMacroUtils();
