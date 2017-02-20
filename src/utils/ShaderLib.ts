module feng3d
{

    /**
     * 渲染代码库
     * @author feng 2016-12-16
     */
    export class ShaderLib
    {

        /**
         * 获取shaderCode
         */
        public static getShaderCode(shaderName: string)
        {

            if (shaderMap[shaderName])
                return shaderMap[shaderName];
            getShaderLoader(shaderName);
            return null;
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
    var shaderMap: { [shaderName: string]: string } = {};

    /**
     * 渲染代码加载器字典
     */
    var shaderLoaderMap: { [shaderName: string]: ShaderLoader } = {};

    /**
     * 获取shader加载器
     */
    function getShaderLoader(shaderName: string)
    {

        var shaderLoader = shaderLoaderMap[shaderName];
        if (shaderLoader == null)
        {
            shaderLoader = new ShaderLoader();
            shaderLoader.addEventListener(LoaderEvent.COMPLETE, function (event: LoaderEvent)
            {
                shaderMap[shaderLoader.shaderName] = shaderLoader.shaderCode;
                delete shaderLoaderMap[shaderLoader.shaderName];
            }, null, Number.MAX_VALUE)
            shaderLoader.loadText(shaderName);
        }
        return shaderLoader;
    }

    /**
     * 着色器加载器
     * @author feng 2016-12-15
     */
    class ShaderLoader extends EventDispatcher
    {

        private subShaders: { [shaderName: string]: RegExpExecArray }
        /**
         * shader根路径
         */
        public static shadersRoot = "feng3d/shaders/";
        /**
         * shader名称
         */
        public shaderName: string;

        /**
         * 渲染代码
         */
        public shaderCode: string;

        /**
         * 加载shader
         * @param url   路径
         */
        public loadText(shaderName: string)
        {

            this.shaderName = shaderName;
            var url = ShaderLoader.shadersRoot + this.shaderName + ".glsl";
            var loader = new Loader();
            loader.addEventListener(LoaderEvent.COMPLETE, this.onComplete, this);
            loader.loadText(url);
        }

        /**
         * shader加载完成
         */
        private onComplete(event: LoaderEvent)
        {

            //#include 正则表达式
            var includeRegExp = /#include<(.+)>/g;
            //
            this.shaderCode = event.data.content;
            var match = includeRegExp.exec(this.shaderCode);
            this.subShaders = {};
            while (match != null)
            {
                var subShaderName = match[1];
                var subShaderCode = ShaderLib.getShaderCode(subShaderName);
                if (subShaderCode)
                {
                    this.shaderCode = this.shaderCode.replace(match[0], subShaderCode);
                } else
                {
                    var subShaderLoader = getShaderLoader(subShaderName);
                    subShaderLoader.addEventListener(LoaderEvent.COMPLETE, this.onSubComplete, this)
                }
                this.subShaders[subShaderName] = match;
                match = includeRegExp.exec(this.shaderCode);
            }
            this.check();
        }

        /**
         * subShader加载完成
         */
        private onSubComplete(event: LoaderEvent)
        {

            var shaderLoader: ShaderLoader = event.data;
            var match = this.subShaders[shaderLoader.shaderName];
            this.shaderCode = this.shaderCode.replace(match[0], shaderLoader.shaderCode);
            delete this.subShaders[shaderLoader.shaderName];
            //
            this.check();
        }

        /**
         * 检查是否加载完成
         */
        private check()
        {
            if (Object.keys(this.subShaders).length == 0)
            {
                this.dispatchEvent(new LoaderEvent(LoaderEvent.COMPLETE, this));
            }
        }
    }
}