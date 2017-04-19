module feng3d
{

    /**
     * 渲染代码库
     * @author feng 2016-12-16
     */
    export class ShaderLib
    {
        public static getShaderContentByName(shaderName: string)
        {
            var shaderPath = "shaders/" + shaderName + ".glsl";
            return shaderFileMap[shaderPath];
        }

        /**
         * 获取shaderCode
         */
        public static getShaderCode(shaderName: string)
        {
            if (!_shaderMap[shaderName])
                _shaderMap[shaderName] = ShaderLoader.loadText(shaderName);
            return _shaderMap[shaderName];
        }

        /**
         * 获取ShaderMacro代码
         */
        public static getMacroCode(macro: ShaderMacro)
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

    /**
     * 渲染代码字典
     */
    var _shaderMap: { [shaderName: string]: string } = {};

    /**
     * 渲染代码加载器字典
     */
    var _shaderLoaderMap: { [shaderName: string]: ShaderLoader } = {};

    /**
     * 着色器加载器
     * @author feng 2016-12-15
     */
    class ShaderLoader
    {
        /**
         * 加载shader
         * @param url   路径
         */
        public static loadText(shaderName: string)
        {
            var shaderCode = ShaderLib.getShaderContentByName(shaderName);

            //#include 正则表达式
            var includeRegExp = /#include<(.+)>/g;
            //
            var match = includeRegExp.exec(shaderCode);
            while (match != null)
            {
                var subShaderName = match[1];
                var subShaderCode = ShaderLib.getShaderCode(subShaderName);
                if (subShaderCode)
                {
                    shaderCode = shaderCode.replace(match[0], subShaderCode);
                } else
                {
                    var subShaderCode = ShaderLoader.loadText(subShaderName);
                    shaderCode = shaderCode.replace(match[0], subShaderCode);
                }
                match = includeRegExp.exec(shaderCode);
            }
            return shaderCode;
        }
    }
}